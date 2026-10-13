-- ============================================================================
-- Mathorg Step 4C: Atomic Quote to Invoice Conversion Migration
-- ============================================================================

BEGIN;

-- 1. Create or replace public.convert_quote_to_invoice_atomic
-- Converts an accepted/approved quote into an invoice in a single atomic transaction.
-- Locks the quote FOR UPDATE to strictly prevent race conditions and duplicate conversions.
CREATE OR REPLACE FUNCTION public.convert_quote_to_invoice_atomic(
    p_business_id UUID,
    p_quote_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_quote RECORD;
    v_existing_invoice RECORD;
    v_cust RECORD;
    v_biz RECORD;
    v_seq_num BIGINT;
    v_invoice_number TEXT;
    v_invoice_row RECORD;
    v_new_invoice_id UUID;
    v_notes TEXT;
    v_payment_details TEXT;
    v_item RECORD;
    v_inserted_items JSONB := '[]'::JSONB;
    v_updated_quote RECORD;
BEGIN
    -- 1. Authorization Check: Caller must have verified access to the business
    v_has_access := public.user_has_business_access(p_business_id);
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: You do not have permission for business %', p_business_id
            USING ERRCODE = '42501';
    END IF;

    -- 2. Lock the quote row FOR UPDATE to serialize concurrent conversion attempts
    SELECT *
    INTO v_quote
    FROM public.quotes
    WHERE id = p_quote_id
      AND business_id = p_business_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quote % not found for business %', p_quote_id, p_business_id
            USING ERRCODE = 'P0002';
    END IF;

    -- 3. Prevent duplicate conversion: Check if quote has already been converted
    IF v_quote.converted_invoice_id IS NOT NULL THEN
        RAISE EXCEPTION 'Quote % has already been converted to invoice %', p_quote_id, v_quote.converted_invoice_id
            USING ERRCODE = '23505';
    END IF;

    -- Also check whether an existing invoice is already linked to this quote_id
    SELECT *
    INTO v_existing_invoice
    FROM public.invoices
    WHERE business_id = p_business_id
      AND quote_id = p_quote_id
    LIMIT 1;

    IF FOUND THEN
        -- Safely link the quote if it wasn't linked previously, and block duplicate conversion
        UPDATE public.quotes
        SET converted_invoice_id = v_existing_invoice.id,
            status = 'Accepted',
            updated_at = now()
        WHERE id = p_quote_id;

        RAISE EXCEPTION 'An invoice (%) is already linked to quote %', v_existing_invoice.invoice_number, p_quote_id
            USING ERRCODE = '23505';
    END IF;

    -- 4. Authoritative invoice numbering: Call get_next_invoice_number
    v_seq_num := public.get_next_invoice_number(p_business_id);
    v_invoice_number := 'MAT-INV-' || lpad(v_seq_num::text, 6, '0');

    -- 5. Fetch customer snapshots if customer_id exists
    IF v_quote.customer_id IS NOT NULL THEN
        SELECT name, phone, email, address
        INTO v_cust
        FROM public.customers
        WHERE id = v_quote.customer_id
          AND business_id = p_business_id;
    END IF;

    -- 6. Fetch business payment_details to populate invoice banking instructions
    SELECT payment_details
    INTO v_biz
    FROM public.businesses
    WHERE id = p_business_id;

    v_payment_details := v_biz.payment_details;

    -- 7. Format notes to reflect conversion provenance
    IF v_quote.notes IS NOT NULL AND TRIM(v_quote.notes) <> '' THEN
        v_notes := 'Converted from Quote #' || v_quote.quote_number || E'.\n' || v_quote.notes;
    ELSE
        v_notes := 'Converted from Quote #' || v_quote.quote_number;
    END IF;

    -- 8. Insert parent invoice row
    -- Newly converted invoices start with status = 'Unpaid' and amount_paid = 0
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
        v_quote.customer_id,
        p_quote_id,
        v_invoice_number,
        'Unpaid',
        CURRENT_DATE,
        COALESCE(v_quote.expiry_date, CURRENT_DATE + 14),
        COALESCE(v_quote.subtotal, 0),
        COALESCE(v_quote.discount_type, 'percent'),
        COALESCE(v_quote.discount_val, 0),
        COALESCE(v_quote.discount_amount, 0),
        COALESCE(v_quote.tax_rate, 0),
        COALESCE(v_quote.tax_amount, 0),
        COALESCE(v_quote.total, 0),
        0,
        v_notes,
        v_payment_details,
        v_cust.name,
        v_cust.phone,
        v_cust.email,
        v_cust.address,
        now(),
        now()
    )
    RETURNING * INTO v_invoice_row;

    v_new_invoice_id := v_invoice_row.id;

    -- 9. Copy all child quote_items into invoice_items
    FOR v_item IN
        SELECT
            product_id,
            name,
            description,
            unit,
            quantity,
            unit_price,
            total
        FROM public.quote_items
        WHERE quote_id = p_quote_id
        ORDER BY created_at ASC
    LOOP
        DECLARE
            v_inserted_item RECORD;
        BEGIN
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
                v_item.product_id,
                COALESCE(NULLIF(TRIM(v_item.name), ''), 'Item'),
                NULLIF(TRIM(v_item.description), ''),
                COALESCE(NULLIF(TRIM(v_item.unit), ''), 'unit'),
                COALESCE(v_item.quantity, 1),
                COALESCE(v_item.unit_price, 0),
                COALESCE(v_item.total, 0),
                now(),
                now()
            )
            RETURNING * INTO v_inserted_item;

            v_inserted_items := v_inserted_items || to_jsonb(v_inserted_item);
        END;
    END LOOP;

    -- 10. Update the quote atomically within the same transaction
    UPDATE public.quotes
    SET status = 'Accepted',
        converted_invoice_id = v_new_invoice_id,
        updated_at = now()
    WHERE id = p_quote_id
    RETURNING * INTO v_updated_quote;

    -- 11. Return the complete result object with actual database rows
    RETURN jsonb_build_object(
        'invoice', to_jsonb(v_invoice_row),
        'invoice_items', v_inserted_items,
        'quote', to_jsonb(v_updated_quote)
    );
END;
$$;

-- Secure execution grants for convert_quote_to_invoice_atomic
REVOKE ALL ON FUNCTION public.convert_quote_to_invoice_atomic(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.convert_quote_to_invoice_atomic(UUID, UUID) TO authenticated;

COMMIT;
