-- ============================================================================
-- MatthOrg Step 4: Final Hardening Migration
-- Authoritative Subscription, Atomic Request Claim, Timestamps, Constraints & RLS
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Authoritative Subscription Columns on public.businesses
-- ----------------------------------------------------------------------------
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ NULL DEFAULT now();

-- ----------------------------------------------------------------------------
-- 2. Authoritative Subscription Check Database Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_plan TEXT;
    v_status TEXT;
    v_expires_at TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_has_access BOOLEAN;
BEGIN
    -- 1. Verify user access to the business
    v_has_access := public.user_has_business_access(p_business_id);
    IF NOT v_has_access THEN
        RETURN FALSE;
    END IF;

    -- 2. Read authoritative business subscription state
    SELECT 
        LOWER(COALESCE(subscription_plan, 'free')),
        LOWER(COALESCE(subscription_status, 'active')),
        subscription_expires_at,
        subscription_current_period_end
    INTO 
        v_plan,
        v_status,
        v_expires_at,
        v_period_end
    FROM public.businesses
    WHERE id = p_business_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 3. Paid plan verification (pro or business)
    IF v_plan NOT IN ('pro', 'business') THEN
        RETURN FALSE;
    END IF;

    -- 4. Status verification (active or trialing)
    IF v_status NOT IN ('active', 'trialing') THEN
        RETURN FALSE;
    END IF;

    -- 5. Expiry checks
    IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
        RETURN FALSE;
    END IF;

    IF v_period_end IS NOT NULL AND v_period_end < now() THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. Professional Verification & Subscription Trust Security
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_business_trust_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Allow internal/system bypass if explicit session flag is set
    IF current_setting('app.allow_trust_modification', true) = 'on' THEN
        RETURN NEW;
    END IF;

    -- Prevent self-modification of trust verification badges and subscription authority
    IF (NEW.phone_verified IS DISTINCT FROM OLD.phone_verified) OR
       (NEW.email_verified IS DISTINCT FROM OLD.email_verified) OR
       (NEW.identity_verified IS DISTINCT FROM OLD.identity_verified) OR
       (NEW.business_verified IS DISTINCT FROM OLD.business_verified) OR
       (NEW.service_verified IS DISTINCT FROM OLD.service_verified) OR
       (NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan) OR
       (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) OR
       (NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at) OR
       (NEW.subscription_current_period_end IS DISTINCT FROM OLD.subscription_current_period_end) THEN
        RAISE EXCEPTION 'Unauthorized: Verification badges and subscription authority cannot be modified directly by business users.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_business_trust_flags ON public.businesses;
CREATE TRIGGER trg_protect_business_trust_flags
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_business_trust_flags();

-- Authoritative verification function (admin/system authority only)
CREATE OR REPLACE FUNCTION public.admin_verify_business(
    p_business_id UUID,
    p_phone_verified BOOLEAN DEFAULT NULL,
    p_email_verified BOOLEAN DEFAULT NULL,
    p_identity_verified BOOLEAN DEFAULT NULL,
    p_business_verified BOOLEAN DEFAULT NULL,
    p_service_verified BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_updated public.businesses;
BEGIN
    PERFORM set_config('app.allow_trust_modification', 'on', true);

    UPDATE public.businesses
    SET
        phone_verified = COALESCE(p_phone_verified, phone_verified),
        email_verified = COALESCE(p_email_verified, email_verified),
        identity_verified = COALESCE(p_identity_verified, identity_verified),
        business_verified = COALESCE(p_business_verified, business_verified),
        service_verified = COALESCE(p_service_verified, service_verified),
        updated_at = now()
    WHERE id = p_business_id
    RETURNING * INTO v_updated;

    PERFORM set_config('app.allow_trust_modification', 'off', true);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business % not found', p_business_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'business_id', v_updated.id,
        'phone_verified', v_updated.phone_verified,
        'email_verified', v_updated.email_verified,
        'identity_verified', v_updated.identity_verified,
        'business_verified', v_updated.business_verified,
        'service_verified', v_updated.service_verified
    );
END;
$$;

-- Authoritative subscription update function
CREATE OR REPLACE FUNCTION public.authoritative_update_business_subscription(
    p_business_id UUID,
    p_plan TEXT,
    p_status TEXT DEFAULT 'active',
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_updated public.businesses;
BEGIN
    PERFORM set_config('app.allow_trust_modification', 'on', true);

    UPDATE public.businesses
    SET
        subscription_plan = LOWER(p_plan),
        subscription_status = LOWER(p_status),
        subscription_expires_at = p_expires_at,
        subscription_current_period_end = p_expires_at,
        updated_at = now()
    WHERE id = p_business_id
    RETURNING * INTO v_updated;

    PERFORM set_config('app.allow_trust_modification', 'off', true);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business % not found', p_business_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'business_id', v_updated.id,
        'subscription_plan', v_updated.subscription_plan,
        'subscription_status', v_updated.subscription_status,
        'subscription_expires_at', v_updated.subscription_expires_at
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Fix 5: Duplicate Prevention via Unique Index on (business_id, customer_request_id)
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_business_customer_request_unique
    ON public.leads (business_id, customer_request_id)
    WHERE customer_request_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. Fix 6: Lead Lifecycle Timestamps (won_at, lost_at)
-- ----------------------------------------------------------------------------
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS won_at TIMESTAMPTZ NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_at TIMESTAMPTZ NULL;

CREATE OR REPLACE FUNCTION public.maintain_lead_lifecycle_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();

    IF NEW.status = 'Won' THEN
        IF OLD IS NULL OR OLD.status IS DISTINCT FROM 'Won' THEN
            NEW.won_at := now();
        END IF;
        NEW.lost_at := NULL;
    ELSIF NEW.status = 'Lost' THEN
        IF OLD IS NULL OR OLD.status IS DISTINCT FROM 'Lost' THEN
            NEW.lost_at := now();
        END IF;
        NEW.won_at := NULL;
    ELSE
        -- Moving to active stages (New, Contacted, Qualified, Proposal Sent)
        IF OLD IS NOT NULL AND OLD.status = 'Won' THEN
            NEW.won_at := NULL;
        END IF;
        IF OLD IS NOT NULL AND OLD.status = 'Lost' THEN
            NEW.lost_at := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_lifecycle_timestamps ON public.leads;
CREATE TRIGGER trg_leads_lifecycle_timestamps
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.maintain_lead_lifecycle_timestamps();

-- ----------------------------------------------------------------------------
-- 6. Fix 7: Lead Status Database CHECK Constraint
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_invalid_count INTEGER;
BEGIN
    SELECT count(*) INTO v_invalid_count
    FROM public.leads
    WHERE status NOT IN ('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost');
    
    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Pre-check failed: Found % existing rows with invalid lead status in public.leads', v_invalid_count;
    END IF;
END $$;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS chk_leads_status;
ALTER TABLE public.leads ADD CONSTRAINT chk_leads_status
    CHECK (status IN ('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'));

-- ----------------------------------------------------------------------------
-- 7. Fix 2, Fix 3, Fix 10: Secure Matching Discovery Feed RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_matching_customer_requests(p_business_id UUID)
RETURNS TABLE (
    id UUID,
    request_number TEXT,
    service_required TEXT,
    service_category TEXT,
    location TEXT,
    state TEXT,
    city TEXT,
    property_type TEXT,
    budget_min NUMERIC,
    budget_max NUMERIC,
    budget_formatted TEXT,
    timeline TEXT,
    details TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    is_claimed BOOLEAN,
    customer_name TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_has_sub BOOLEAN;
    v_biz RECORD;
BEGIN
    -- 1. Security: Authenticated caller must belong to the business
    v_has_access := public.user_has_business_access(p_business_id);
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: caller does not belong to business %', p_business_id;
    END IF;

    -- 2. Security: Business must have active subscription
    v_has_sub := public.has_active_subscription(p_business_id);
    IF NOT v_has_sub THEN
        -- Non-subscribers receive an empty feed
        RETURN;
    END IF;

    -- 3. Fetch business matching profile
    SELECT 
        categories_offered,
        specialization,
        industry,
        state,
        city,
        locations_served
    INTO v_biz
    FROM public.businesses
    WHERE businesses.id = p_business_id;

    -- 4. Return matching requests
    RETURN QUERY
    SELECT
        cr.id,
        cr.request_number,
        cr.service_required,
        cr.service_category,
        cr.location,
        cr.state,
        cr.city,
        cr.property_type,
        cr.budget_min,
        cr.budget_max,
        cr.budget_formatted,
        cr.timeline,
        cr.details,
        cr.status,
        cr.created_at,
        (p_business_id = ANY(cr.contacted_by_business_ids)) AS is_claimed,
        -- Expose contact info ONLY if already claimed by this business; otherwise mask
        CASE 
            WHEN p_business_id = ANY(cr.contacted_by_business_ids) THEN cr.customer_name
            ELSE 'Verified Buyer'
        END AS customer_name,
        CASE 
            WHEN p_business_id = ANY(cr.contacted_by_business_ids) THEN cr.phone
            ELSE '+234 802 ••• ••••'
        END AS phone,
        CASE 
            WHEN p_business_id = ANY(cr.contacted_by_business_ids) THEN cr.whatsapp
            ELSE NULL
        END AS whatsapp,
        CASE 
            WHEN p_business_id = ANY(cr.contacted_by_business_ids) THEN cr.email
            ELSE '••••••••@gmail.com'
        END AS email
    FROM public.customer_requests cr
    WHERE cr.status = 'Open'
      -- Matching category check
      AND (
          v_biz.categories_offered IS NULL
          OR v_biz.categories_offered = '{}'
          OR cr.service_category = ANY(v_biz.categories_offered)
          OR (v_biz.specialization IS NOT NULL AND (cr.service_required ILIKE '%' || v_biz.specialization || '%' OR v_biz.specialization ILIKE '%' || cr.service_category || '%'))
          OR (v_biz.industry IS NOT NULL AND (cr.service_category ILIKE '%' || v_biz.industry || '%' OR v_biz.industry ILIKE '%' || cr.service_category || '%'))
      )
      -- Matching location check
      AND (
          v_biz.locations_served IS NULL
          OR v_biz.locations_served = '{}'
          OR 'all' = ANY(v_biz.locations_served)
          OR 'nationwide' = ANY(v_biz.locations_served)
          OR 'nigeria' = ANY(v_biz.locations_served)
          OR (v_biz.state IS NOT NULL AND (cr.location ILIKE '%' || v_biz.state || '%' OR cr.state ILIKE '%' || v_biz.state || '%'))
          OR (v_biz.city IS NOT NULL AND (cr.location ILIKE '%' || v_biz.city || '%' OR cr.city ILIKE '%' || v_biz.city || '%'))
          OR (cr.state IS NOT NULL AND cr.state = ANY(v_biz.locations_served))
      )
    ORDER BY cr.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_matching_customer_requests(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 8. Fix 4, Fix 5, Fix 11: Atomic Request Claim RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_customer_request_atomic(
    p_business_id UUID,
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_has_sub BOOLEAN;
    v_req RECORD;
    v_existing_lead RECORD;
    v_cust_id UUID;
    v_new_lead_id UUID;
    v_lead_number TEXT;
    v_seq_num INTEGER;
BEGIN
    -- 1. Verify caller access to business
    v_has_access := public.user_has_business_access(p_business_id);
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Unauthorized: User does not belong to business %', p_business_id;
    END IF;

    -- 2. Verify active subscription again at database level
    v_has_sub := public.has_active_subscription(p_business_id);
    IF NOT v_has_sub THEN
        RAISE EXCEPTION 'Active Pro or Business subscription required to unlock marketplace leads';
    END IF;

    -- 3. Check for existing lead for this request and business (idempotency / duplicate check)
    SELECT * INTO v_existing_lead
    FROM public.leads
    WHERE business_id = p_business_id
      AND customer_request_id = p_request_id
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'message', 'Request already claimed by this business',
            'lead_id', v_existing_lead.id,
            'lead_number', v_existing_lead.lead_number
        );
    END IF;

    -- 4. Pessimistic lock on customer_request
    SELECT * INTO v_req
    FROM public.customer_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Customer request % not found', p_request_id;
    END IF;

    IF v_req.status = 'Closed' THEN
        RAISE EXCEPTION 'Customer request % is closed and can no longer be unlocked', p_request_id;
    END IF;

    -- 5. Find or create customer record for this business
    SELECT id INTO v_cust_id
    FROM public.customers
    WHERE business_id = p_business_id
      AND (
          (v_req.phone IS NOT NULL AND (phone = v_req.phone OR whatsapp = v_req.phone))
          OR (v_req.email IS NOT NULL AND email = v_req.email)
      )
    LIMIT 1;

    IF v_cust_id IS NULL THEN
        INSERT INTO public.customers (
            business_id,
            name,
            phone,
            whatsapp,
            email,
            address,
            notes
        ) VALUES (
            p_business_id,
            v_req.customer_name,
            v_req.phone,
            COALESCE(v_req.whatsapp, v_req.phone),
            v_req.email,
            v_req.location,
            'Converted from Marketplace Customer Request: ' || v_req.request_number
        )
        RETURNING id INTO v_cust_id;
    END IF;

    -- 6. Generate next lead number atomically
    INSERT INTO public.document_counters (business_id, document_type, next_val)
    VALUES (p_business_id, 'lead', 2)
    ON CONFLICT (business_id, document_type)
    DO UPDATE SET
        next_val = public.document_counters.next_val + 1,
        updated_at = now()
    RETURNING (public.document_counters.next_val - 1) INTO v_seq_num;

    v_lead_number := 'MAT-LED-' || lpad(v_seq_num::text, 6, '0');

    -- 7. Insert the Lead into public.leads
    INSERT INTO public.leads (
        business_id,
        customer_id,
        customer_request_id,
        lead_number,
        customer_name,
        phone,
        whatsapp,
        email,
        location,
        service_required,
        service_category,
        property_type,
        budget_min,
        budget_max,
        budget_formatted,
        estimated_value,
        timeline,
        source,
        source_name,
        status,
        intent_score,
        intent_level,
        is_verified,
        freshness,
        freshness_label,
        is_locked,
        notes
    ) VALUES (
        p_business_id,
        v_cust_id,
        p_request_id,
        v_lead_number,
        v_req.customer_name,
        v_req.phone,
        COALESCE(v_req.whatsapp, v_req.phone),
        v_req.email,
        v_req.location,
        v_req.service_required,
        v_req.service_category,
        v_req.property_type,
        v_req.budget_min,
        v_req.budget_max,
        v_req.budget_formatted,
        COALESCE(v_req.budget_max, v_req.budget_min, 0),
        v_req.timeline,
        'marketplace',
        'Customer Request Portal',
        'New',
        95,
        'Very High',
        true,
        'active',
        'Verified Direct Request',
        false,
        v_req.details
    )
    RETURNING id INTO v_new_lead_id;

    -- 8. Update customer_requests: append business ID and update status to Contacted
    UPDATE public.customer_requests
    SET
        contacted_by_business_ids = array_append(
            array_remove(COALESCE(contacted_by_business_ids, '{}'), p_business_id),
            p_business_id
        ),
        status = 'Contacted',
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'lead_id', v_new_lead_id,
        'lead_number', v_lead_number,
        'customer_id', v_cust_id,
        'customer_name', v_req.customer_name,
        'phone', v_req.phone,
        'whatsapp', COALESCE(v_req.whatsapp, v_req.phone),
        'email', v_req.email
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_customer_request_atomic(UUID, UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 9. Fix 2 & Fix 10: Customer Requests Row Level Security Hardening
-- ----------------------------------------------------------------------------
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

-- Policy 1: Anyone (anon and authenticated) can submit a customer request
CREATE POLICY "anyone_can_insert_customer_requests"
    ON public.customer_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy 2: Authenticated professionals can only select requests they have claimed
CREATE POLICY "authenticated_select_claimed_customer_requests"
    ON public.customer_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE public.user_has_business_access(b.id)
              AND b.id = ANY(contacted_by_business_ids)
        )
    );

-- Policy 3: Disallow direct UPDATE on customer_requests for authenticated users (must use claim RPC)
REVOKE UPDATE ON public.customer_requests FROM authenticated;

-- ----------------------------------------------------------------------------
-- 10. Fix 9: Public Professional Directory Grant Verification
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.businesses FROM anon;
GRANT SELECT ON public.public_professionals TO anon, authenticated;

COMMIT;
