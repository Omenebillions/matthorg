-- ============================================================================
-- Mathorg Step 4A: Invoices, Invoice Items & Payments RLS and Hardening Migration
-- ============================================================================

BEGIN;

-- 1. Ensure Row Level Security is enabled on public.invoices, public.invoice_items, and public.payments
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Configure Least-Privilege Grants: Revoke all from anon, grant to authenticated
REVOKE ALL ON public.invoices FROM anon;
REVOKE ALL ON public.invoice_items FROM anon;
REVOKE ALL ON public.payments FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;

-- 3. Safely drop any global single-column UNIQUE constraint or index on invoices.invoice_number
DO $$
DECLARE
    c RECORD;
BEGIN
    -- Drop single-column unique constraint on invoices.invoice_number if one exists
    FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.invoices'::regclass
          AND contype = 'u'
          AND array_to_string(conkey, ',') = (
              SELECT attnum::text
              FROM pg_attribute
              WHERE attrelid = 'public.invoices'::regclass
                AND attname = 'invoice_number'
          )
    LOOP
        EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;

    -- Drop single-column unique index on invoice_number if one exists
    FOR c IN
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'invoices'
          AND indexdef ILIKE '%UNIQUE%invoice_number%'
          AND indexdef NOT ILIKE '%business_id%'
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I', c.indexname);
    END LOOP;
END $$;

-- 4. Check for existing duplicates on (business_id, invoice_number) before adding composite unique constraint
DO $$
DECLARE
    dup_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO dup_count
    FROM (
        SELECT business_id, invoice_number
        FROM public.invoices
        GROUP BY business_id, invoice_number
        HAVING COUNT(*) > 1
    ) sub;

    IF dup_count > 0 THEN
        RAISE EXCEPTION 'Cannot add composite unique constraint: found % duplicate (business_id, invoice_number) groups in public.invoices.', dup_count
            USING ERRCODE = '23505';
    END IF;
END $$;

-- 5. Add composite unique constraint: invoices_business_id_invoice_number_key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.invoices'::regclass
          AND contype = 'u'
          AND conname = 'invoices_business_id_invoice_number_key'
    ) THEN
        ALTER TABLE public.invoices
            ADD CONSTRAINT invoices_business_id_invoice_number_key
            UNIQUE (business_id, invoice_number);
    END IF;
END $$;

-- 6. Clean up any existing policies on invoices, invoice_items, and payments (Idempotent)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('invoices', 'invoice_items', 'payments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 7. Tenant-isolated RLS policies for public.invoices (Direct business access)
CREATE POLICY "authenticated_select_invoices"
    ON public.invoices
    FOR SELECT
    TO authenticated
    USING (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_insert_invoices"
    ON public.invoices
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_update_invoices"
    ON public.invoices
    FOR UPDATE
    TO authenticated
    USING (public.user_has_business_access(business_id))
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_delete_invoices"
    ON public.invoices
    FOR DELETE
    TO authenticated
    USING (public.user_has_business_access(business_id));

-- 8. Tenant-isolated RLS policies for public.invoice_items (Derived via parent invoice)
CREATE POLICY "authenticated_select_invoice_items"
    ON public.invoice_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
              AND public.user_has_business_access(i.business_id)
        )
    );

CREATE POLICY "authenticated_insert_invoice_items"
    ON public.invoice_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
              AND public.user_has_business_access(i.business_id)
        )
    );

CREATE POLICY "authenticated_update_invoice_items"
    ON public.invoice_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
              AND public.user_has_business_access(i.business_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
              AND public.user_has_business_access(i.business_id)
        )
    );

CREATE POLICY "authenticated_delete_invoice_items"
    ON public.invoice_items
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
              AND public.user_has_business_access(i.business_id)
        )
    );

-- 9. Tenant-isolated RLS policies for public.payments (Direct business access)
CREATE POLICY "authenticated_select_payments"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_insert_payments"
    ON public.payments
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_update_payments"
    ON public.payments
    FOR UPDATE
    TO authenticated
    USING (public.user_has_business_access(business_id))
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_delete_payments"
    ON public.payments
    FOR DELETE
    TO authenticated
    USING (public.user_has_business_access(business_id));

COMMIT;
