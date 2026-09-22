-- ============================================================================
-- Mathorg Step 4B: Invoice Numbering & Atomic Invoice Creation Migration
-- ============================================================================

BEGIN;

-- 1. Create or replace public.get_next_invoice_number(p_business_id UUID)
-- Atomically reserves and returns the next invoice sequence value for the business.
-- Uses the existing public.document_counters table with document_type = 'invoice'.
-- Solves first-use concurrency without duplicate keys or race conditions.
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(p_business_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_next_val BIGINT;
    v_baseline BIGINT;
BEGIN
    -- 1. Authorization check: Caller must have validated access to target business
    v_has_access := public.user_has_business_access(p_business_id);
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: You do not have permission for business %', p_business_id
            USING ERRCODE = '42501';
    END IF;

    -- 2. Fast-path: Try atomic increment if counter row already exists.
    -- Row-level exclusive lock on document_counters serializes concurrent calls for this business.
    UPDATE public.document_counters
    SET next_val = next_val + 1,
        updated_at = now()
    WHERE business_id = p_business_id
      AND document_type = 'invoice'
    RETURNING (next_val - 1) INTO v_next_val;

    -- 3. If counter already existed, return the reserved sequence immediately.
    IF FOUND THEN
        RETURN v_next_val;
    END IF;

    -- 4. Counter does not exist yet (First-use initialization).
    -- Calculate baseline from maximum existing numeric suffix of historical invoices for this business.
    SELECT COALESCE(
        MAX(
            CASE
                WHEN invoice_number ~ '^MAT-INV-[0-9]+$'
                THEN substring(invoice_number from '[0-9]+$')::BIGINT
                ELSE 0
            END
        ),
        0
    ) + 1
    INTO v_baseline
    FROM public.invoices
    WHERE business_id = p_business_id;

    -- 5. Concurrency-safe initialization using ON CONFLICT DO UPDATE:
    -- If two transactions run this simultaneously:
    -- - Transaction 1 inserts row with next_val = (v_baseline + 1), RETURNING v_baseline
    -- - Transaction 2 encounters conflict on (business_id, document_type), executes DO UPDATE,
    --   atomically increments next_val = document_counters.next_val + 1, and returns that reserved number.
    INSERT INTO public.document_counters (business_id, document_type, next_val, created_at, updated_at)
    VALUES (
        p_business_id,
        'invoice',
        v_baseline + 1,
        now(),
        now()
    )
    ON CONFLICT (business_id, document_type)
    DO UPDATE
    SET next_val = public.document_counters.next_val + 1,
        updated_at = now()
    RETURNING (public.document_counters.next_val - 1) INTO v_next_val;

    RETURN v_next_val;
END;
$$;

-- Secure execution grants for get_next_invoice_number
REVOKE ALL ON FUNCTION public.get_next_invoice_number(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_next_invoice_number(UUID) TO authenticated;

-- 2. Create or replace public.create_invoice_atomic(p_business_id UUID, p_invoice_data JSONB)
-- Atomically generates canonical invoice number, enforces initial state ('Draft', amount_paid = 0),
-- inserts parent invoice, and inserts child items in a single ACID transaction.
CREATE OR REPLACE FUNCTION public.create_invoice_atomic(
    p_business_id UUID,
    p_invoice_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_seq_num BIGINT;
    v_invoice_number TEXT;
    v_new_invoice_id UUID;
    v_customer_id UUID := NULL;
    v_quote_id UUID := NULL;
    v_invoice_row RECORD;
    v_items_data JSONB;
    v_item JSONB;
    v_inserted_items JSONB := '[]'::JSONB;
    v_result JSONB;
BEGIN
    -- 1. Authorization check
    v_has_access := public.user_has_business_access(p_business_id);
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: User does not have access to business %', p_business_id
            USING ERRCODE = '42501';
    END IF;

    -- 2. Atomically reserve next invoice sequence number and format canonically
    v_seq_num := public.get_next_invoice_number(p_business_id);
    v_invoice_number := 'MAT-INV-' || lpad(v_seq_num::text, 6, '0');

    -- 3. Safely parse foreign key UUIDs (customer_id, quote_id)
    IF (p_invoice_data->>'customer_id') IS NOT NULL AND (p_invoice_data->>'customer_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_customer_id := (p_invoice_data->>'customer_id')::UUID;
    END IF;

    IF (p_invoice_data->>'quote_id') IS NOT NULL AND (p_invoice_data->>'quote_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_quote_id := (p_invoice_data->>'quote_id')::UUID;
    END IF;

    -- 4. Insert parent invoice row
    -- Strictly enforces status = 'Draft' and amount_paid = 0 for newly created invoices
    INSERT INTO public.invoices (
        business_id,
        customer_id,
        quote_id,
        invoice_number,
        status,
        issue_date,
        due_date,
        subtotal,
        discount_type,
        discount_val,
        discount_amount,
        tax_rate,
        tax_amount,
        total,
        amount_paid,
        notes,
        payment_details,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        created_at,
        updated_at
    ) VALUES (
        p_business_id,
        v_customer_id,
        v_quote_id,
        v_invoice_number,
        'Draft',
        COALESCE((p_invoice_data->>'issue_date')::DATE, CURRENT_DATE),
        COALESCE((p_invoice_data->>'due_date')::DATE, CURRENT_DATE + 14),
        COALESCE((p_invoice_data->>'subtotal')::NUMERIC, 0),
        COALESCE(p_invoice_data->>'discount_type', 'percent'),
        COALESCE((p_invoice_data->>'discount_val')::NUMERIC, 0),
        COALESCE((p_invoice_data->>'discount_amount')::NUMERIC, 0),
        COALESCE((p_invoice_data->>'tax_rate')::NUMERIC, 0),
        COALESCE((p_invoice_data->>'tax_amount')::NUMERIC, 0),
        COALESCE((p_invoice_data->>'total')::NUMERIC, 0),
        0,
        p_invoice_data->>'notes',
        p_invoice_data->>'payment_details',
        p_invoice_data->>'customer_name',
        p_invoice_data->>'customer_phone',
        p_invoice_data->>'customer_email',
        p_invoice_data->>'customer_address',
        now(),
        now()
    )
    RETURNING * INTO v_invoice_row;

    v_new_invoice_id := v_invoice_row.id;

    -- 5. Insert child invoice_items atomically
    v_items_data := p_invoice_data->'items';
    IF v_items_data IS NOT NULL AND jsonb_typeof(v_items_data) = 'array' AND jsonb_array_length(v_items_data) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_items_data)
        LOOP
            DECLARE
                v_prod_id UUID := NULL;
                v_inserted_item RECORD;
            BEGIN
                IF (v_item->>'product_id') IS NOT NULL AND (v_item->>'product_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                    v_prod_id := (v_item->>'product_id')::UUID;
                END IF;

                INSERT INTO public.invoice_items (
                    invoice_id,
                    product_id,
                    name,
                    description,
                    unit,
                    quantity,
                    unit_price,
                    total,
                    created_at,
                    updated_at
                ) VALUES (
                    v_new_invoice_id,
                    v_prod_id,
                    COALESCE(NULLIF(TRIM(v_item->>'name'), ''), 'Item'),
                    NULLIF(TRIM(v_item->>'description'), ''),
                    COALESCE(NULLIF(TRIM(v_item->>'unit'), ''), 'unit'),
                    COALESCE((v_item->>'quantity')::NUMERIC, 1),
                    COALESCE((v_item->>'unit_price')::NUMERIC, 0),
                    COALESCE((v_item->>'total')::NUMERIC, 0),
                    now(),
                    now()
                )
                RETURNING * INTO v_inserted_item;

                v_inserted_items := v_inserted_items || to_jsonb(v_inserted_item);
            END;
        END LOOP;
    END IF;

    -- 6. Return combined invoice record with items
    v_result := to_jsonb(v_invoice_row) || jsonb_build_object('invoice_items', v_inserted_items);
    RETURN v_result;
END;
$$;

-- Secure execution grants for create_invoice_atomic
REVOKE ALL ON FUNCTION public.create_invoice_atomic(UUID, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_invoice_atomic(UUID, JSONB) TO authenticated;

COMMIT;
