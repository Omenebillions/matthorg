-- ============================================================================
-- MatthOrg Step 4: Leads, Customer Requests, and Professional Directory Migration
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Extend public.businesses with Directory Visibility & Verification Flags
-- ----------------------------------------------------------------------------
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS business_verified BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS service_verified BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';

-- ----------------------------------------------------------------------------
-- 2. Create public.customer_requests Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    location TEXT NOT NULL,
    state TEXT,
    city TEXT,
    service_required TEXT NOT NULL,
    service_category TEXT NOT NULL,
    property_type TEXT,
    budget_min NUMERIC,
    budget_max NUMERIC,
    budget_formatted TEXT,
    timeline TEXT,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'Open',
    contacted_by_business_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for service matching and location filtering
CREATE INDEX IF NOT EXISTS idx_customer_requests_service_category ON public.customer_requests(service_category);
CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON public.customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_customer_requests_created_at ON public.customer_requests(created_at DESC);

-- Enable RLS on customer_requests
ALTER TABLE public.customer_requests ENABLE ROW LEVEL SECURITY;

-- Grants: Anyone (including unauthenticated visitors) can submit a request.
-- Only authenticated users (professionals) can read and update customer requests.
REVOKE ALL ON public.customer_requests FROM anon;
GRANT INSERT ON public.customer_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.customer_requests TO authenticated;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'customer_requests'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.customer_requests', pol.policyname);
    END LOOP;
END $$;

-- Policy: Public and authenticated visitors can post a customer request
CREATE POLICY "anyone_can_insert_customer_requests"
    ON public.customer_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy: Authenticated users can view customer requests
CREATE POLICY "authenticated_select_customer_requests"
    ON public.customer_requests
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Authenticated users can update customer requests (e.g. record contacted status)
CREATE POLICY "authenticated_update_customer_requests"
    ON public.customer_requests
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3. Create public.leads Table with Multi-Tenant Isolation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_request_id UUID REFERENCES public.customer_requests(id) ON DELETE SET NULL,
    lead_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    company TEXT,
    location TEXT,
    service_required TEXT,
    service_category TEXT,
    property_type TEXT,
    budget_min NUMERIC,
    budget_max NUMERIC,
    budget_formatted TEXT,
    estimated_value NUMERIC,
    timeline TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    source_name TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    intent_score INTEGER DEFAULT 50,
    intent_level TEXT DEFAULT 'Medium',
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    freshness TEXT DEFAULT 'active',
    freshness_label TEXT,
    is_locked BOOLEAN DEFAULT false,
    notes TEXT,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_business_lead_number UNIQUE (business_id, lead_number)
);

CREATE INDEX IF NOT EXISTS idx_leads_business_id ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON public.leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_request_id ON public.leads(customer_request_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Enable RLS on leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.leads FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'leads'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "authenticated_select_leads"
    ON public.leads
    FOR SELECT
    TO authenticated
    USING (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_insert_leads"
    ON public.leads
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_update_leads"
    ON public.leads
    FOR UPDATE
    TO authenticated
    USING (public.user_has_business_access(business_id))
    WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "authenticated_delete_leads"
    ON public.leads
    FOR DELETE
    TO authenticated
    USING (public.user_has_business_access(business_id));

-- ----------------------------------------------------------------------------
-- 4. Public Professional Directory View (Data Masking & Privacy Hardening)
-- ----------------------------------------------------------------------------
-- Exposes ONLY public contact, business identity, and verified credentials.
-- NEVER exposes owner_user_id, bank details (payment_details), internal financial records.
CREATE OR REPLACE VIEW public.public_professionals AS
SELECT
    b.id,
    b.business_name,
    b.industry,
    b.specialization,
    b.tagline,
    b.logo,
    b.phone,
    b.whatsapp,
    b.email,
    b.address,
    b.state,
    b.city,
    b.categories_offered,
    b.locations_served,
    b.is_public,
    b.phone_verified,
    b.email_verified,
    b.identity_verified,
    b.business_verified,
    b.service_verified,
    b.created_at
FROM public.businesses b
WHERE COALESCE(b.is_public, true) = true;

GRANT SELECT ON public.public_professionals TO anon, authenticated;

COMMIT;
