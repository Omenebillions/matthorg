-- ============================================================================
-- Mathorg Step 3E: Quote Numbering & Atomicity Hardening Migration
-- ============================================================================

BEGIN;

-- 1. Create document_counters table for atomic, per-business document numbering
CREATE TABLE IF NOT EXISTS public.document_counters (
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    next_val INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (business_id, document_type)
);

-- 2. Enable Row Level Security and configure least-privilege grants
ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.document_counters FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_counters TO authenticated;

-- 3. Idempotent cleanup and definition of RLS policies for document_counters
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'document_counters'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.document_counters', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "authenticated_select_document_counters"
    ON public.document_counters
    FOR SELECT
    TO authenticated
    USING (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_insert_document_counters"
    ON public.document_counters
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_update_document_counters"
    ON public.document_counters
    FOR UPDATE
    TO authenticated
    USING (public.user_has_business_access(business_id))
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_delete_document_counters"
    ON public.document_counters
    FOR DELETE
    TO authenticated
    USING (public.user_has_business_access(business_id));

-- 4. Safely inspect and remove any global single-column UNIQUE constraint or index on quotes(quote_number)
DO $$
DECLARE
    c RECORD;
BEGIN
    -- Drop single-column unique constraint on quotes.quote_number if one exists
    FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.quotes'::regclass
          AND contype = 'u'
          AND array_to_string(conkey, ',') = (
              SELECT attnum::text
              FROM pg_attribute
              WHERE attrelid = 'public.quotes'::regclass
                AND attname = 'quote_number'
          )
    LOOP
        EXECUTE format('ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;

    -- Drop single-column unique index on quotes(quote_number) if one exists outside pg_constraint
    FOR c IN
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'quotes'
          AND indexdef ILIKE '%UNIQUE%quote_number%'
          AND indexdef NOT ILIKE '%business_id%'
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I', c.indexname);
    END LOOP;
END $$;

-- 5. Add composite unique constraint (business_id, quote_number) on public.quotes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.quotes'::regclass
          AND contype = 'u'
          AND conname = 'quotes_business_id_quote_number_key'
    ) THEN
        ALTER TABLE public.quotes
            ADD CONSTRAINT quotes_business_id_quote_number_key
            UNIQUE (business_id, quote_number);
    END IF;
END $$;

-- 6. Atomic RPC function to reserve next quote number per business
CREATE OR REPLACE FUNCTION public.get_next_quote_number(p_business_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_next_val INTEGER;
    v_formatted TEXT;
BEGIN
    -- 1. Enforce business access authorization
    v_has_access := public.user_has_business_access(p_business_id);
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: You do not have permission for business %', p_business_id
            USING ERRCODE = '42501';
    END IF;

    -- 2. Upsert initial counter row if it does not yet exist for this business.
    -- Baseline is initialized to the highest existing quote number + 1, or 1 if none.
    INSERT INTO public.document_counters (business_id, document_type, next_val, created_at, updated_at)
    VALUES (
        p_business_id,
        'quote',
        (
            SELECT COALESCE(
                MAX(
                    CASE
                        WHEN quote_number ~ '^MAT-Q-[0-9]+$'
                        THEN substring(quote_number from '[0-9]+$')::INTEGER
                        ELSE 0
                    END
                ),
                0
            ) + 1
            FROM public.quotes
            WHERE business_id = p_business_id
        ),
        now(),
        now()
    )
    ON CONFLICT (business_id, document_type) DO NOTHING;

    -- 3. Atomically increment and reserve the next number using UPDATE ... RETURNING.
    -- Row-level locking on document_counters ensures concurrent calls are serialized.
    UPDATE public.document_counters
    SET next_val = next_val + 1,
        updated_at = now()
    WHERE business_id = p_business_id
      AND document_type = 'quote'
    RETURNING (next_val - 1) INTO v_next_val;

    -- 4. Format into canonical MAT-Q-000001 structure (6-digit zero padded)
    v_formatted := 'MAT-Q-' || lpad(v_next_val::text, 6, '0');

    RETURN v_formatted;
END;
$$;

-- Secure execution grants for get_next_quote_number
REVOKE ALL ON FUNCTION public.get_next_quote_number(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_next_quote_number(UUID) TO authenticated;

-- 7. Fully atomic quote creation RPC function (Single DB Transaction)
CREATE OR REPLACE FUNCTION public.create_quote_atomic(
    p_business_id UUID,
    p_quote_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_quote_number TEXT;
    v_new_quote_id UUID;
    v_customer_id UUID := NULL;
    v_converted_invoice_id UUID := NULL;
    v_follow_up_id UUID := NULL;
    v_quote_row RECORD;
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

    -- 2. Atomically reserve the next quote number
    v_quote_number := public.get_next_quote_number(p_business_id);

    -- 3. Safely parse optional UUIDs
    IF (p_quote_data->>'customer_id') IS NOT NULL AND (p_quote_data->>'customer_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_customer_id := (p_quote_data->>'customer_id')::UUID;
    END IF;

    IF (p_quote_data->>'converted_invoice_id') IS NOT NULL AND (p_quote_data->>'converted_invoice_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_converted_invoice_id := (p_quote_data->>'converted_invoice_id')::UUID;
    END IF;

    IF (p_quote_data->>'follow_up_id') IS NOT NULL AND (p_quote_data->>'follow_up_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_follow_up_id := (p_quote_data->>'follow_up_id')::UUID;
    END IF;

    -- 4. Insert parent quote row
    INSERT INTO public.quotes (
        business_id,
        customer_id,
        quote_number,
        status,
        issue_date,
        expiry_date,
        subtotal,
        discount_type,
        discount_val,
        discount_amount,
        tax_rate,
        tax_amount,
        total,
        notes,
        terms,
        converted_invoice_id,
        follow_up_id,
        created_at,
        updated_at
    ) VALUES (
        p_business_id,
        v_customer_id,
        v_quote_number,
        COALESCE(p_quote_data->>'status', 'Draft'),
        COALESCE((p_quote_data->>'issue_date')::DATE, CURRENT_DATE),
        COALESCE((p_quote_data->>'expiry_date')::DATE, CURRENT_DATE + 14),
        COALESCE((p_quote_data->>'subtotal')::NUMERIC, 0),
        COALESCE(p_quote_data->>'discount_type', 'percent'),
        COALESCE((p_quote_data->>'discount_val')::NUMERIC, 0),
        COALESCE((p_quote_data->>'discount_amount')::NUMERIC, 0),
        COALESCE((p_quote_data->>'tax_rate')::NUMERIC, 0),
        COALESCE((p_quote_data->>'tax_amount')::NUMERIC, 0),
        COALESCE((p_quote_data->>'total')::NUMERIC, 0),
        p_quote_data->>'notes',
        p_quote_data->>'terms',
        v_converted_invoice_id,
        v_follow_up_id,
        now(),
        now()
    )
    RETURNING * INTO v_quote_row;

    v_new_quote_id := v_quote_row.id;

    -- 5. Insert child quote_items if present
    v_items_data := p_quote_data->'items';
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

                INSERT INTO public.quote_items (
                    quote_id,
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
                    v_new_quote_id,
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

    -- 6. Build combined response object
    v_result := to_jsonb(v_quote_row) || jsonb_build_object('quote_items', v_inserted_items);
    RETURN v_result;
END;
$$;

-- Secure execution grants for create_quote_atomic
REVOKE ALL ON FUNCTION public.create_quote_atomic(UUID, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_quote_atomic(UUID, JSONB) TO authenticated;

COMMIT;
