-- ============================================================================
-- Mathorg Step 3D: Quotes and Quote Items RLS & Permissions Migration
-- ============================================================================

BEGIN;

-- 1. Ensure Row Level Security is active
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all privileges from anon, grant least-privilege to authenticated
REVOKE ALL ON public.quotes FROM anon;
REVOKE ALL ON public.quote_items FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;

-- 3. Safely drop existing policies on public.quotes and public.quote_items (Idempotent cleanup)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('quotes', 'quote_items')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 4. Tenant-isolated RLS policies for public.quotes
CREATE POLICY "authenticated_select_quotes"
    ON public.quotes
    FOR SELECT
    TO authenticated
    USING (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_insert_quotes"
    ON public.quotes
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_update_quotes"
    ON public.quotes
    FOR UPDATE
    TO authenticated
    USING (public.user_has_business_access(business_id))
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_delete_quotes"
    ON public.quotes
    FOR DELETE
    TO authenticated
    USING (public.user_has_business_access(business_id));

-- 5. Tenant-isolated RLS policies for public.quote_items (via parent quote)
CREATE POLICY "authenticated_select_quote_items"
    ON public.quote_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.quotes q
            WHERE q.id = quote_items.quote_id
              AND public.user_has_business_access(q.business_id)
        )
    );

CREATE POLICY "authenticated_insert_quote_items"
    ON public.quote_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.quotes q
            WHERE q.id = quote_items.quote_id
              AND public.user_has_business_access(q.business_id)
        )
    );

CREATE POLICY "authenticated_update_quote_items"
    ON public.quote_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.quotes q
            WHERE q.id = quote_items.quote_id
              AND public.user_has_business_access(q.business_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.quotes q
            WHERE q.id = quote_items.quote_id
              AND public.user_has_business_access(q.business_id)
        )
    );

CREATE POLICY "authenticated_delete_quote_items"
    ON public.quote_items
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.quotes q
            WHERE q.id = quote_items.quote_id
              AND public.user_has_business_access(q.business_id)
        )
    );

COMMIT;
