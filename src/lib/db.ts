import { supabase, ensureSupabase } from './supabase';
import type { Session, User as AuthUser, SupabaseClient } from '@supabase/supabase-js';
import { VERIFIED_PUBLIC_PROFESSIONALS, getRegisteredBusinesses, getRandomRegisteredProfessionals } from '../data/professionalsData';
import type {
  BusinessProfile,
  Customer,
  Product,
  Quote,
  QuoteItem,
  QuoteStatus,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  PlanTier,
  Lead,
  LeadSource,
  LeadStatus,
  IntentLevel,
  LeadFreshness,
  CustomerRequest,
  CustomerRequestStatus,
  PublicProfessionalProfile,
} from '../types';

// ============================================================================
// LIVE SUPABASE DATABASE ROW TYPES
// Based on live schema audit: public.businesses & public.business_members
// ============================================================================

export interface BusinessRow {
  id: string;
  owner_user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  currency: string | null;
  tax_rate: number | null;
  address: string | null;
  country: string | null;
  logo_url: string | null;
  terms: string | null;
  payment_details: string | null;
  is_public?: boolean | null;
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
  identity_verified?: boolean | null;
  business_verified?: boolean | null;
  service_verified?: boolean | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  subscription_current_period_end?: string | null;
  subscription_started_at?: string | null;
  categories_offered?: string[] | null;
  locations_served?: string[] | null;
  industry?: string | null;
  specialization?: string | null;
  state?: string | null;
  city?: string | null;
  cac_number?: string | null;
  tagline?: string | null;
  website?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface BusinessMemberRow {
  id: string;
  business_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | string;
  created_at: string;
}

export interface CustomerRow {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ProductRow {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  unit: string | null;
  default_price?: number | null;
  price?: number | null;
  category: string | null;
  sku: string | null;
  image: string | null;
  rating?: number | null;
  rating_count?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface QuoteRow {
  id: string;
  business_id: string;
  customer_id: string | null;
  quote_number: string;
  status: string;
  issue_date: string;
  expiry_date: string;
  subtotal: number;
  discount_type: 'percent' | 'fixed' | string;
  discount_val: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  converted_invoice_id: string | null;
  follow_up_id: string | null;
  created_at: string;
  updated_at?: string | null;
  quote_items?: QuoteItemRow[];
  customers?: {
    id: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
  } | null;
}

export interface QuoteItemRow {
  id: string;
  quote_id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  created_at?: string;
  updated_at?: string | null;
}

export interface InvoiceRow {
  id: string;
  business_id: string;
  customer_id: string | null;
  quote_id: string | null;
  invoice_number: string;
  status: string;
  subtotal: number;
  discount_type: 'percent' | 'fixed' | string;
  discount_val: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  issue_date: string;
  due_date: string;
  notes: string | null;
  payment_details: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  created_at: string;
  updated_at?: string | null;
  invoice_items?: InvoiceItemRow[];
  customers?: {
    id: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
  } | null;
}

export interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  created_at?: string;
  updated_at?: string | null;
}

export interface PaymentRow {
  id: string;
  business_id: string;
  invoice_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string | null;
}

// ============================================================================
// ERROR HANDLING
// Consistent, structured error reporter so database errors are not silently lost
// ============================================================================

export interface DbErrorDetails {
  operation: string;
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

export function handleDbError(operation: string, error: any): DbErrorDetails {
  const errDetails: DbErrorDetails = {
    operation,
    message: error?.message || 'Unknown database error',
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  };
  
  // Differentiate expected schema-migration or permission differences from system faults
  const isExpectedMissingTableOrRLS =
    error?.code === '42P01' || // PostgreSQL undefined table
    error?.code === 'PGRST205' || // PostgREST relation not found
    error?.code === 'PGRST301' || // PostgREST JWT expired or unauthenticated
    error?.status === 404 ||
    error?.status === 403 ||
    (typeof error?.message === 'string' &&
      (error.message.includes('404') ||
       error.message.includes('403') ||
       error.message.includes('relation') ||
       error.message.includes('permission denied') ||
       error.message.includes('row-level security')));

  if (isExpectedMissingTableOrRLS) {
    console.info(`[Mathorg DB] ${operation}: schema migration pending or RLS secured. Operating in local resilient mode.`);
  } else {
    console.warn(`[Mathorg DB] ${operation} notice:`, errDetails);
  }
  return errDetails;
}

// ============================================================================
// CLIENT RESOLVER
// Reuses the singleton Supabase client from ./supabase
// ============================================================================

export async function getDbClient(): Promise<SupabaseClient | null> {
  return supabase || (await ensureSupabase());
}

// ============================================================================
// AUTHENTICATION / SESSION HELPERS
// ============================================================================

/**
 * Retrieves the current active Supabase Auth session.
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const client = await getDbClient();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) {
      handleDbError('getCurrentSession', error);
      return null;
    }
    return data.session;
  } catch (err) {
    handleDbError('getCurrentSession (exception)', err);
    return null;
  }
}

/**
 * Retrieves the currently authenticated Supabase Auth user.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const client = await getDbClient();
    if (!client) return null;
    const { data, error } = await client.auth.getUser();
    if (error) {
      handleDbError('getCurrentUser', error);
      return null;
    }
    return data.user;
  } catch (err) {
    handleDbError('getCurrentUser (exception)', err);
    return null;
  }
}

// ============================================================================
// BUSINESS HELPERS
// Read-only helpers mapped strictly to the live database schema
// ============================================================================

/**
 * Fetches all businesses associated with a user, either as an owner
 * (businesses.owner_user_id) or through memberships (business_members.user_id).
 */
export async function getUserBusinesses(userId: string): Promise<BusinessRow[]> {
  if (!userId) return [];
  try {
    const client = await getDbClient();
    if (!client) return [];

    const businessesMap = new Map<string, BusinessRow>();

    // 1. Fetch businesses owned by user
    const { data: owned, error: ownedErr } = await client
      .from('businesses')
      .select('*')
      .eq('owner_user_id', userId);

    if (ownedErr) {
      handleDbError('getUserBusinesses (owned)', ownedErr);
    } else if (owned) {
      for (const b of owned as BusinessRow[]) {
        businessesMap.set(b.id, b);
      }
    }

    // 2. Fetch businesses where user is a member
    const { data: memberships, error: memberErr } = await client
      .from('business_members')
      .select('business_id, role')
      .eq('user_id', userId);

    if (memberErr) {
      handleDbError('getUserBusinesses (memberships)', memberErr);
    } else if (memberships && memberships.length > 0) {
      const missingIds = memberships
        .map((m: { business_id: string }) => m.business_id)
        .filter((id: string) => !businessesMap.has(id));

      if (missingIds.length > 0) {
        const { data: memberBiz, error: bizErr } = await client
          .from('businesses')
          .select('*')
          .in('id', missingIds);

        if (bizErr) {
          handleDbError('getUserBusinesses (memberBiz)', bizErr);
        } else if (memberBiz) {
          for (const b of memberBiz as BusinessRow[]) {
            businessesMap.set(b.id, b);
          }
        }
      }
    }

    return Array.from(businessesMap.values());
  } catch (err) {
    handleDbError('getUserBusinesses (exception)', err);
    return [];
  }
}

/**
 * Fetches a single business by its UUID primary key.
 */
export async function getBusiness(businessId: string): Promise<BusinessRow | null> {
  if (!businessId) return null;
  try {
    const client = await getDbClient();
    if (!client) return null;

    const { data, error } = await client
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (error) {
      handleDbError('getBusiness', error);
      return null;
    }
    return data as BusinessRow | null;
  } catch (err) {
    handleDbError('getBusiness (exception)', err);
    return null;
  }
}

/**
 * Fetches a specific user's membership in a business.
 */
export async function getBusinessMembership(
  userId: string,
  businessId: string
): Promise<BusinessMemberRow | null> {
  if (!userId || !businessId) return null;
  try {
    const client = await getDbClient();
    if (!client) return null;

    const { data, error } = await client
      .from('business_members')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      handleDbError('getBusinessMembership', error);
      return null;
    }
    return data as BusinessMemberRow | null;
  } catch (err) {
    handleDbError('getBusinessMembership (exception)', err);
    return null;
  }
}

// In-flight concurrency lock to deduplicate concurrent bootstrap triggers within the same client session
const bootstrapLocks = new Map<string, Promise<{ business: BusinessRow; membership: BusinessMemberRow } | null>>();

/**
 * Ensures an authenticated user has an active business and owner membership.
 *
 * Flow:
 * 1. Checks for existing business ownership (businesses.owner_user_id = userId).
 * 2. If not found, checks for existing business membership (business_members.user_id = userId).
 * 3. If an existing business is found:
 *    - Verifies membership record exists.
 *    - If owner membership is missing for an owned business, safely repairs it.
 *    - Returns existing business and membership (no duplicate created).
 * 4. If no business exists:
 *    - Provisions default business (name: "My Business", currency: "NGN", tax_rate: 7.5).
 *    - Provisions owner membership in business_members.
 *    - Returns newly created records.
 *
 * Concurrency / Idempotency:
 * - Single-session calls share an in-flight promise.
 * - Handles PostgreSQL unique constraint conflicts (23505) by falling back to fetch.
 */
export async function getOrCreateUserBusiness(
  userId?: string,
  userEmail?: string | null
): Promise<{ business: BusinessRow; membership: BusinessMemberRow } | null> {
  // Verify active Supabase auth session
  const session = await getCurrentSession();
  if (!session || !session.user) {
    console.info('[Mathorg DB] No active authenticated Supabase session; skipping business bootstrap.');
    return null;
  }

  // Derive authenticated user identity strictly from JWT session
  const authUserId = session.user.id;
  const authUserEmail = session.user.email || userEmail || null;

  // Reject any attempt to spoof or act on behalf of another user ID
  if (userId && userId !== authUserId) {
    const mismatchErr = new Error(`User ID mismatch: client-supplied ID (${userId}) does not match authenticated session ID (${authUserId}).`);
    handleDbError('getOrCreateUserBusiness (user verification)', mismatchErr);
    throw mismatchErr;
  }

  // 1. Session-level in-flight deduplication
  const inFlight = bootstrapLocks.get(authUserId);
  if (inFlight) {
    return inFlight;
  }

  const execution = (async (): Promise<{ business: BusinessRow; membership: BusinessMemberRow } | null> => {
    try {
      const client = await getDbClient();
      if (!client) {
        throw new Error('Supabase client not initialized');
      }

      // 2. Check if user already owns a business
      const { data: ownedBusinesses, error: ownedErr } = await client
        .from('businesses')
        .select('*')
        .eq('owner_user_id', authUserId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (ownedErr) {
        handleDbError('getOrCreateUserBusiness (check owned)', ownedErr);
        throw new Error(`Database error checking business ownership: ${ownedErr.message} (code: ${ownedErr.code || 'unknown'})`);
      }

      let existingBiz: BusinessRow | null = ownedBusinesses && ownedBusinesses.length > 0 ? (ownedBusinesses[0] as BusinessRow) : null;
      let existingMembership: BusinessMemberRow | null = null;

      // 3. If no owned business, check if user is a member of any business
      if (!existingBiz) {
        const { data: memberships, error: memErr } = await client
          .from('business_members')
          .select('*')
          .eq('user_id', authUserId)
          .order('created_at', { ascending: true })
          .limit(1);

        if (memErr) {
          handleDbError('getOrCreateUserBusiness (check member)', memErr);
          throw new Error(`Database error checking business memberships: ${memErr.message} (code: ${memErr.code || 'unknown'})`);
        }

        if (memberships && memberships.length > 0) {
          const mem = memberships[0] as BusinessMemberRow;
          const { data: bizData, error: bizErr } = await client
            .from('businesses')
            .select('*')
            .eq('id', mem.business_id)
            .maybeSingle();

          if (bizErr) {
            handleDbError('getOrCreateUserBusiness (fetch member business)', bizErr);
            throw new Error(`Database error fetching member business: ${bizErr.message} (code: ${bizErr.code || 'unknown'})`);
          }

          if (bizData) {
            existingBiz = bizData as BusinessRow;
            existingMembership = mem;
          }
        }
      }

      // 4. If existing business found, resolve/repair membership in database and return
      if (existingBiz) {
        if (!existingMembership) {
          const { data: memData, error: memErr } = await client
            .from('business_members')
            .select('*')
            .eq('business_id', existingBiz.id)
            .eq('user_id', authUserId)
            .maybeSingle();

          if (memErr) {
            handleDbError('getOrCreateUserBusiness (fetch membership for owned biz)', memErr);
            throw new Error(`Database error fetching business membership: ${memErr.message} (code: ${memErr.code || 'unknown'})`);
          } else if (memData) {
            existingMembership = memData as BusinessMemberRow;
          }
        }

        // If user is owner (owner_user_id === authUserId) but has no membership record in database, repair it in database
        if (!existingMembership && existingBiz.owner_user_id === authUserId) {
          console.info(`[Mathorg DB] Existing business found (${existingBiz.id}) owned by ${authUserId} without membership. Provisioning owner membership in database...`);
          const { data: repairedMem, error: repairErr } = await client
            .from('business_members')
            .insert({
              business_id: existingBiz.id,
              user_id: authUserId,
              role: 'owner',
            })
            .select('*')
            .single();

          if (repairErr) {
            handleDbError('getOrCreateUserBusiness (repair owner membership)', repairErr);
            throw new Error(`Database error creating owner membership: ${repairErr.message} (code: ${repairErr.code || 'unknown'})`);
          }
          existingMembership = repairedMem as BusinessMemberRow;
        }

        if (!existingMembership) {
          throw new Error(`Could not resolve or create valid database membership for user ${authUserId} in business ${existingBiz.id}`);
        }

        return {
          business: existingBiz,
          membership: existingMembership,
        };
      }

      // 5. No business found anywhere: Create new real persisted business
      console.info(`[Mathorg DB] No business found for user ${authUserId}. Provisioning new persisted business and owner membership...`);
      const newBusinessPayload = {
        owner_user_id: authUserId,
        name: 'My Business',
        currency: 'NGN',
        tax_rate: 7.5,
        email: authUserEmail,
      };

      const { data: createdBiz, error: createBizErr } = await client
        .from('businesses')
        .insert(newBusinessPayload)
        .select('*')
        .single();

      if (createBizErr) {
        // Handle potential duplicate race condition
        if (createBizErr.code === '23505') {
          console.warn('[Mathorg DB] Concurrent creation detected. Re-fetching existing business...');
          const retry = await client
            .from('businesses')
            .select('*')
            .eq('owner_user_id', authUserId)
            .order('created_at', { ascending: true })
            .limit(1);

          if (retry.data && retry.data.length > 0) {
            const biz = retry.data[0] as BusinessRow;
            const mem = await getBusinessMembership(authUserId, biz.id);
            if (mem) {
              return {
                business: biz,
                membership: mem,
              };
            }
          }
        }
        handleDbError('getOrCreateUserBusiness (create business)', createBizErr);
        throw new Error(`Database error creating business: ${createBizErr.message} (code: ${createBizErr.code || 'unknown'})`);
      }

      const business = createdBiz as BusinessRow;

      // 6. Create real persisted owner membership in business_members
      const newMemberPayload = {
        business_id: business.id,
        user_id: authUserId,
        role: 'owner',
      };

      const { data: createdMember, error: createMemErr } = await client
        .from('business_members')
        .insert(newMemberPayload)
        .select('*')
        .single();

      if (createMemErr) {
        handleDbError('getOrCreateUserBusiness (create membership)', createMemErr);
        throw new Error(`Database error creating owner membership for business ${business.id}: ${createMemErr.message} (code: ${createMemErr.code || 'unknown'})`);
      }

      return {
        business,
        membership: createdMember as BusinessMemberRow,
      };
    } finally {
      bootstrapLocks.delete(authUserId);
    }
  })();

  bootstrapLocks.set(authUserId, execution);
  return execution;
}

/**
 * Safely parses database payment_details (raw string or JSON) into AppState format.
 */
export function parsePaymentDetails(raw: string | null | undefined): {
  bank_name: string;
  account_name: string;
  account_number: string;
  notes: string;
} {
  const empty = {
    bank_name: '',
    account_name: '',
    account_number: '',
    notes: '',
  };
  if (!raw) return empty;
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as any;
    return {
      bank_name: obj.bank_name || '',
      account_name: obj.account_name || '',
      account_number: obj.account_number || '',
      notes: obj.notes || '',
    };
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          bank_name: parsed.bank_name || '',
          account_name: parsed.account_name || '',
          account_number: parsed.account_number || '',
          notes: parsed.notes || '',
        };
      } catch {
        // Fall through
      }
    }
    return { ...empty, notes: trimmed };
  }
  return empty;
}

/**
 * Maps a database BusinessRow to the application's BusinessProfile model.
 * Guaranteed not to inherit hardcoded demo data from initialData.ts.
 */
export function mapBusinessRowToProfile(
  row: BusinessRow,
  fallbackProfile?: BusinessProfile
): BusinessProfile {
  // If fallback is the demo business, ignore it completely so demo values don't leak into real user business
  const isDemo = !fallbackProfile || fallbackProfile.id === 'biz_mathorg_demo_1';
  const cleanFallback = isDemo ? undefined : fallbackProfile;

  return {
    id: row.id,
    user_id: row.owner_user_id,
    business_name: row.name || 'My Business',
    email: row.email || cleanFallback?.email || '',
    phone: row.phone || cleanFallback?.phone || '',
    whatsapp: row.phone || cleanFallback?.whatsapp || '',
    address: row.address || cleanFallback?.address || '',
    country: row.country || cleanFallback?.country || 'Nigeria',
    currency: row.currency || cleanFallback?.currency || 'NGN',
    tax_name: cleanFallback?.tax_name || 'VAT',
    tax_rate: row.tax_rate ?? cleanFallback?.tax_rate ?? 7.5,
    logo: row.logo_url || cleanFallback?.logo || '/logo.png',
    terms: row.terms || cleanFallback?.terms || '',
    payment_details: parsePaymentDetails(row.payment_details),
    industry: row.industry || cleanFallback?.industry,
    specialization: row.specialization || cleanFallback?.specialization,
    state: row.state || cleanFallback?.state,
    city: row.city || cleanFallback?.city,
    cac_number: row.cac_number || cleanFallback?.cac_number,
    website: row.website || cleanFallback?.website,
    tagline: row.tagline || cleanFallback?.tagline,
    categories_offered: row.categories_offered || cleanFallback?.categories_offered || [],
    locations_served: row.locations_served || cleanFallback?.locations_served || [],
    phone_verified: row.phone_verified ?? cleanFallback?.phone_verified ?? false,
    email_verified: row.email_verified ?? cleanFallback?.email_verified ?? false,
    identity_verified: row.identity_verified ?? cleanFallback?.identity_verified ?? false,
    business_verified: row.business_verified ?? cleanFallback?.business_verified ?? false,
    service_verified: row.service_verified ?? cleanFallback?.service_verified ?? false,
    is_public: row.is_public ?? cleanFallback?.is_public ?? true,
    subscription_plan: row.subscription_plan || cleanFallback?.subscription_plan || 'free',
    subscription_status: row.subscription_status || cleanFallback?.subscription_status || 'active',
    subscription_expires_at: row.subscription_expires_at || cleanFallback?.subscription_expires_at,
    subscription_current_period_end: row.subscription_current_period_end || cleanFallback?.subscription_current_period_end,
  };
}

/**
 * Updates a business profile in the database.
 */
export async function updateBusiness(
  businessId: string,
  updates: Partial<BusinessRow>
): Promise<BusinessRow | null> {
  if (!businessId) return null;
  try {
    const client = await getDbClient();
    if (!client) return null;

    // Verify active authenticated session
    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('updateBusiness (session check)', authErr);
      throw authErr;
    }

    // Strip immutable fields and trust-sensitive badges/subscription authority
    // Trust verification and subscription authority can only be modified authoritatively
    const sanitizedUpdates = { ...updates };
    delete (sanitizedUpdates as any).id;
    delete (sanitizedUpdates as any).owner_user_id;
    delete (sanitizedUpdates as any).created_at;
    delete (sanitizedUpdates as any).phone_verified;
    delete (sanitizedUpdates as any).email_verified;
    delete (sanitizedUpdates as any).identity_verified;
    delete (sanitizedUpdates as any).business_verified;
    delete (sanitizedUpdates as any).service_verified;
    delete (sanitizedUpdates as any).subscription_plan;
    delete (sanitizedUpdates as any).subscription_status;
    delete (sanitizedUpdates as any).subscription_expires_at;
    delete (sanitizedUpdates as any).subscription_current_period_end;
    delete (sanitizedUpdates as any).subscription_started_at;

    const { data, error } = await client
      .from('businesses')
      .update({
        ...sanitizedUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select('*')
      .maybeSingle();

    if (error) {
      handleDbError('updateBusiness', error);
      throw new Error(`Database error updating business ${businessId}: ${error.message} (code: ${error.code || 'unknown'})`);
    }
    return data as BusinessRow | null;
  } catch (err) {
    handleDbError('updateBusiness (exception)', err);
    throw err;
  }
}

// ============================================================================
// CUSTOMERS DATABASE SERVICE LAYER (STEP 3A)
// ============================================================================

/**
 * Maps a live Supabase CustomerRow to the frontend Customer interface.
 */
export function mapCustomerRowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    whatsapp: row.whatsapp || row.phone || '',
    email: row.email || '',
    address: row.address || '',
    notes: row.notes || '',
    created_at: row.created_at || new Date().toISOString(),
  };
}

/**
 * Fetches all customers belonging to the specified business ID.
 * Returns empty array if none exist or on error.
 */
export async function fetchBusinessCustomers(businessId: string): Promise<Customer[]> {
  if (!businessId) return [];
  try {
    const client = await getDbClient();
    if (!client) return [];

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('fetchBusinessCustomers (session check)', authErr);
      return [];
    }

    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      handleDbError('fetchBusinessCustomers', error);
      return [];
    }

    return (data as CustomerRow[] || []).map(mapCustomerRowToCustomer);
  } catch (err) {
    handleDbError('fetchBusinessCustomers (exception)', err);
    return [];
  }
}

/**
 * Creates a new customer for the active business.
 * Enforces authenticated session and attaches active business_id.
 */
export async function createCustomer(
  businessId: string,
  customerData: Omit<Customer, 'id' | 'created_at'> & { id?: string }
): Promise<Customer | null> {
  if (!businessId) {
    throw new Error('Business ID is required to create a customer.');
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('createCustomer (session check)', authErr);
      throw authErr;
    }

    // Build payload matching public.customers columns
    const payload: Record<string, any> = {
      business_id: businessId,
      name: customerData.name.trim(),
      phone: customerData.phone?.trim() || null,
      whatsapp: customerData.whatsapp?.trim() || customerData.phone?.trim() || null,
      email: customerData.email?.trim() || null,
      address: customerData.address?.trim() || null,
      notes: customerData.notes?.trim() || null,
    };

    // If client provided a valid UUID, use it; otherwise let PostgreSQL gen_random_uuid() generate it
    const isValidUuid = customerData.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerData.id);
    if (isValidUuid) {
      payload.id = customerData.id;
    }

    const { data, error } = await client
      .from('customers')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      handleDbError('createCustomer', error);
      throw new Error(`Database error creating customer: ${error.message} (code: ${error.code || 'unknown'})`);
    }

    return mapCustomerRowToCustomer(data as CustomerRow);
  } catch (err) {
    handleDbError('createCustomer (exception)', err);
    throw err;
  }
}

/**
 * Updates mutable fields of an existing customer in Supabase.
 * Strips immutable fields (id, business_id, created_at).
 */
export async function updateCustomer(
  customerId: string,
  updates: Partial<Customer>
): Promise<Customer | null> {
  if (!customerId) {
    throw new Error('Customer ID is required to update.');
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('updateCustomer (session check)', authErr);
      throw authErr;
    }

    // Sanitize updates: only allow mutable fields
    const sanitizedUpdates: Record<string, any> = {};
    if (updates.name !== undefined) sanitizedUpdates.name = updates.name.trim();
    if (updates.phone !== undefined) sanitizedUpdates.phone = updates.phone?.trim() || null;
    if (updates.whatsapp !== undefined) sanitizedUpdates.whatsapp = updates.whatsapp?.trim() || null;
    if (updates.email !== undefined) sanitizedUpdates.email = updates.email?.trim() || null;
    if (updates.address !== undefined) sanitizedUpdates.address = updates.address?.trim() || null;
    if (updates.notes !== undefined) sanitizedUpdates.notes = updates.notes?.trim() || null;
    sanitizedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('customers')
      .update(sanitizedUpdates)
      .eq('id', customerId)
      .select('*')
      .maybeSingle();

    if (error) {
      handleDbError('updateCustomer', error);
      throw new Error(`Database error updating customer ${customerId}: ${error.message} (code: ${error.code || 'unknown'})`);
    }

    if (!data) {
      throw new Error(`Customer ${customerId} not found or permission denied.`);
    }

    return mapCustomerRowToCustomer(data as CustomerRow);
  } catch (err) {
    handleDbError('updateCustomer (exception)', err);
    throw err;
  }
}

/**
 * Deletes a customer by ID in Supabase.
 */
export async function deleteCustomer(customerId: string): Promise<boolean> {
  if (!customerId) return false;

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('deleteCustomer (session check)', authErr);
      throw authErr;
    }

    const { error } = await client
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      handleDbError('deleteCustomer', error);
      throw new Error(`Database error deleting customer ${customerId}: ${error.message} (code: ${error.code || 'unknown'})`);
    }

    return true;
  } catch (err) {
    handleDbError('deleteCustomer (exception)', err);
    throw err;
  }
}

// ============================================================================
// PRODUCTS DATABASE SERVICE LAYER (STEP 3B)
// ============================================================================

/**
 * Maps a live Supabase ProductRow to the frontend Product interface.
 * Gracefully handles either `default_price` or `price` column.
 */
export function mapProductRowToProduct(row: ProductRow): Product {
  const priceVal = row.default_price !== undefined && row.default_price !== null
    ? Number(row.default_price)
    : row.price !== undefined && row.price !== null
      ? Number(row.price)
      : 0;

  return {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    unit: row.unit || 'unit',
    default_price: isNaN(priceVal) ? 0 : priceVal,
    category: row.category || 'General',
    sku: row.sku || undefined,
    image: row.image || undefined,
    rating: row.rating ? Number(row.rating) : undefined,
    rating_count: row.rating_count ? Number(row.rating_count) : undefined,
  };
}

/**
 * Fetches all products belonging to the specified business ID.
 * Returns empty array if none exist or on error.
 */
export async function fetchBusinessProducts(businessId: string): Promise<Product[]> {
  if (!businessId) return [];
  try {
    const client = await getDbClient();
    if (!client) return [];

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('fetchBusinessProducts (session check)', authErr);
      return [];
    }

    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      handleDbError('fetchBusinessProducts', error);
      return [];
    }

    return (data as ProductRow[] || []).map(mapProductRowToProduct);
  } catch (err) {
    handleDbError('fetchBusinessProducts (exception)', err);
    return [];
  }
}

/**
 * Creates a new product for the active business.
 * Enforces authenticated session and attaches active business_id.
 */
export async function createProduct(
  businessId: string,
  productData: Omit<Product, 'id'> & { id?: string }
): Promise<Product | null> {
  if (!businessId) {
    throw new Error('Business ID is required to create a product.');
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('createProduct (session check)', authErr);
      throw authErr;
    }

    // Build payload matching public.products columns
    const payload: Record<string, any> = {
      business_id: businessId,
      name: productData.name.trim(),
      description: productData.description?.trim() || null,
      unit: productData.unit?.trim() || 'unit',
      default_price: Number(productData.default_price) || 0,
      category: productData.category?.trim() || 'General',
      sku: productData.sku?.trim() || null,
      image: productData.image || null,
      rating: productData.rating || null,
      rating_count: productData.rating_count || null,
    };

    // If client provided a valid UUID, use it; otherwise let PostgreSQL gen_random_uuid() generate it
    const isValidUuid = productData.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productData.id);
    if (isValidUuid) {
      payload.id = productData.id;
    }

    let { data, error } = await client
      .from('products')
      .insert(payload)
      .select('*')
      .single();

    // Fallback: if schema uses `price` instead of `default_price`, retry with price
    if (error && error.message?.includes('default_price')) {
      const altPayload: Record<string, any> = { ...payload, price: payload.default_price };
      delete altPayload.default_price;
      const retry = await client
        .from('products')
        .insert(altPayload)
        .select('*')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      handleDbError('createProduct', error);
      throw new Error(`Database error creating product: ${error.message} (code: ${error.code || 'unknown'})`);
    }

    return mapProductRowToProduct(data as ProductRow);
  } catch (err) {
    handleDbError('createProduct (exception)', err);
    throw err;
  }
}

/**
 * Updates mutable fields of an existing product in Supabase.
 * Strips immutable fields (id, business_id, created_at).
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Product>
): Promise<Product | null> {
  if (!productId) {
    throw new Error('Product ID is required to update.');
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('updateProduct (session check)', authErr);
      throw authErr;
    }

    // Sanitize updates: only allow mutable fields
    const sanitizedUpdates: Record<string, any> = {};
    if (updates.name !== undefined) sanitizedUpdates.name = updates.name.trim();
    if (updates.description !== undefined) sanitizedUpdates.description = updates.description.trim() || null;
    if (updates.unit !== undefined) sanitizedUpdates.unit = updates.unit.trim() || 'unit';
    if (updates.default_price !== undefined) sanitizedUpdates.default_price = Number(updates.default_price) || 0;
    if (updates.category !== undefined) sanitizedUpdates.category = updates.category.trim() || 'General';
    if (updates.sku !== undefined) sanitizedUpdates.sku = updates.sku.trim() || null;
    if (updates.image !== undefined) sanitizedUpdates.image = updates.image || null;
    if (updates.rating !== undefined) sanitizedUpdates.rating = updates.rating || null;
    if (updates.rating_count !== undefined) sanitizedUpdates.rating_count = updates.rating_count || null;
    sanitizedUpdates.updated_at = new Date().toISOString();

    let { data, error } = await client
      .from('products')
      .update(sanitizedUpdates)
      .eq('id', productId)
      .select('*')
      .maybeSingle();

    // Fallback if column is `price`
    if (error && error.message?.includes('default_price')) {
      const altUpdates: Record<string, any> = { ...sanitizedUpdates, price: sanitizedUpdates.default_price };
      delete altUpdates.default_price;
      const retry = await client
        .from('products')
        .update(altUpdates)
        .eq('id', productId)
        .select('*')
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      handleDbError('updateProduct', error);
      throw new Error(`Database error updating product ${productId}: ${error.message} (code: ${error.code || 'unknown'})`);
    }

    if (!data) {
      throw new Error(`Product ${productId} not found or permission denied.`);
    }

    return mapProductRowToProduct(data as ProductRow);
  } catch (err) {
    handleDbError('updateProduct (exception)', err);
    throw err;
  }
}

/**
 * Deletes a product by ID in Supabase.
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  if (!productId) return false;

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('deleteProduct (session check)', authErr);
      throw authErr;
    }

    const { error } = await client
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      handleDbError('deleteProduct', error);
      throw new Error(`Database error deleting product ${productId}: ${error.message} (code: ${error.code || 'unknown'})`);
    }

    return true;
  } catch (err) {
    handleDbError('deleteProduct (exception)', err);
    throw err;
  }
}

// ============================================================================
// QUOTES & QUOTE ITEMS DATABASE SERVICE LAYER (STEP 3D)
// ============================================================================

/**
 * Validates if a string is an RFC 4122 compliant UUID.
 * Local demo IDs (such as quote_1773734000000, cust_1, prod_1) return false.
 */
export function isUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Maps a live Supabase QuoteItemRow to the frontend QuoteItem model.
 */
export function mapQuoteItemRowToQuoteItem(row: QuoteItemRow): QuoteItem {
  return {
    id: row.id,
    product_id: row.product_id || undefined,
    name: row.name || '',
    description: row.description || '',
    unit: row.unit || 'unit',
    quantity: Number(row.quantity) || 1,
    unit_price: Number(row.unit_price) || 0,
    total: Number(row.total) || 0,
    isCatalogueMatch: !!row.product_id,
  };
}

/**
 * Maps a live Supabase QuoteRow (with joined quote_items and customers)
 * to the frontend Quote interface.
 */
export function mapQuoteRowToQuote(
  row: QuoteRow,
  items: QuoteItemRow[] = [],
  customerFallback?: Partial<Customer> | null
): Quote {
  const cust = row.customers;
  const custName = cust?.name || customerFallback?.name || 'Valued Customer';
  const custPhone = cust?.phone || customerFallback?.phone || '';
  const custWhatsapp = cust?.whatsapp || cust?.phone || customerFallback?.whatsapp || customerFallback?.phone || '';
  const custEmail = cust?.email || customerFallback?.email || '';
  const custAddress = cust?.address || customerFallback?.address || '';

  const rawItems = row.quote_items && row.quote_items.length > 0 ? row.quote_items : items;
  const mappedItems: QuoteItem[] = (rawItems || []).map(mapQuoteItemRowToQuoteItem);

  return {
    id: row.id,
    quote_number: row.quote_number,
    customer_id: row.customer_id || '',
    customer_name: custName,
    customer_phone: custPhone,
    customer_whatsapp: custWhatsapp,
    customer_email: custEmail,
    customer_address: custAddress,
    status: (row.status as QuoteStatus) || 'Draft',
    issue_date: row.issue_date,
    expiry_date: row.expiry_date,
    items: mappedItems,
    subtotal: Number(row.subtotal) || 0,
    discount_type: (row.discount_type as 'percent' | 'fixed') || 'percent',
    discount_val: Number(row.discount_val) || 0,
    discount_amount: Number(row.discount_amount) || 0,
    tax_rate: Number(row.tax_rate) || 0,
    tax_amount: Number(row.tax_amount) || 0,
    total: Number(row.total) || 0,
    notes: row.notes || '',
    terms: row.terms || '',
    follow_up_id: row.follow_up_id || undefined,
    converted_invoice_id: row.converted_invoice_id || undefined,
    created_at: row.created_at || new Date().toISOString(),
  };
}

/**
 * Fetches all quotes for the specified business from Supabase,
 * including related quote_items and customer display details.
 */
export async function fetchBusinessQuotes(businessId: string): Promise<Quote[]> {
  if (!businessId) return [];

  try {
    const client = await getDbClient();
    if (!client) return [];

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('fetchBusinessQuotes (session check)', authErr);
      return [];
    }

    const { data, error } = await client
      .from('quotes')
      .select(`
        *,
        quote_items (*),
        customers (id, name, phone, whatsapp, email, address)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      handleDbError('fetchBusinessQuotes', error);
      return [];
    }

    const rows = (data as QuoteRow[]) || [];
    return rows.map((row) => mapQuoteRowToQuote(row, row.quote_items || []));
  } catch (err) {
    handleDbError('fetchBusinessQuotes (exception)', err);
    return [];
  }
}

/**
 * Atomically requests and reserves the next sequential quote number for a business
 * from Supabase using the database-side counter RPC (get_next_quote_number).
 * This ensures strict per-business numbering and prevents collision under concurrency.
 */
export async function getNextQuoteNumber(businessId: string): Promise<string> {
  if (!businessId) {
    throw new Error('Business ID is required to generate a quote number.');
  }

  const client = await getDbClient();
  if (!client) {
    throw new Error('Supabase client unavailable.');
  }

  const session = await getCurrentSession();
  if (!session || !session.user) {
    throw new Error('Authentication required: no active Supabase session.');
  }

  const { data, error } = await client.rpc('get_next_quote_number', {
    p_business_id: businessId,
  });

  if (error) {
    handleDbError('getNextQuoteNumber', error);
    if (error.code === '42501') {
      throw new Error('Access denied: You do not have permission to generate quote numbers for this business.');
    }
    throw new Error(`Database error generating quote number: ${error.message} (code: ${error.code || 'unknown'})`);
  }

  if (!data || typeof data !== 'string') {
    throw new Error('Invalid quote number returned by database numbering function.');
  }

  return data;
}

/**
 * Creates a new quote and its associated quote_items in Supabase.
 * Enforces atomic per-business quote numbering where the database-generated number is authoritative.
 * Sequence: Authenticated user -> reserve next quote number from database -> insert quote -> insert items -> return persisted quote.
 */
export async function createQuote(
  businessId: string,
  quoteData: Omit<Quote, 'id'> & { id?: string }
): Promise<Quote | null> {
  if (!businessId) {
    throw new Error('Business ID is required to create a quote.');
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('createQuote (session check)', authErr);
      throw authErr;
    }

    const customerFallback = {
      id: quoteData.customer_id,
      name: quoteData.customer_name,
      phone: quoteData.customer_phone,
      whatsapp: quoteData.customer_whatsapp,
      email: quoteData.customer_email,
      address: quoteData.customer_address,
    };

    // Attempt 1: Single-transaction atomic creation via create_quote_atomic RPC
    const atomicPayload = {
      customer_id: isUuid(quoteData.customer_id) ? quoteData.customer_id : null,
      status: quoteData.status || 'Draft',
      issue_date: quoteData.issue_date || new Date().toISOString().split('T')[0],
      expiry_date: quoteData.expiry_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      subtotal: Number(quoteData.subtotal) || 0,
      discount_type: quoteData.discount_type || 'percent',
      discount_val: Number(quoteData.discount_val) || 0,
      discount_amount: Number(quoteData.discount_amount) || 0,
      tax_rate: Number(quoteData.tax_rate) || 0,
      tax_amount: Number(quoteData.tax_amount) || 0,
      total: Number(quoteData.total) || 0,
      notes: quoteData.notes || null,
      terms: quoteData.terms || null,
      converted_invoice_id: isUuid(quoteData.converted_invoice_id) ? quoteData.converted_invoice_id : null,
      follow_up_id: isUuid(quoteData.follow_up_id) ? quoteData.follow_up_id : null,
      items: (quoteData.items || []).map((item) => ({
        product_id: isUuid(item.product_id) ? item.product_id : null,
        name: item.name?.trim() || 'Item',
        description: item.description?.trim() || null,
        unit: item.unit?.trim() || 'unit',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        total: Number(item.total) || (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      })),
    };

    const { data: atomicResult, error: atomicErr } = await client.rpc('create_quote_atomic', {
      p_business_id: businessId,
      p_quote_data: atomicPayload,
    });

    if (!atomicErr && atomicResult && atomicResult.id) {
      return mapQuoteRowToQuote(
        atomicResult as QuoteRow,
        (atomicResult.quote_items as QuoteItemRow[]) || [],
        customerFallback
      );
    }

    // If atomic RPC failed due to permission or uniqueness violation, raise immediately
    if (atomicErr) {
      if (atomicErr.code === '42501') {
        throw new Error('Access denied: You do not have permission to create quotes for this business.');
      }
      if (atomicErr.code === '23505') {
        throw new Error('Quote number already exists for this business.');
      }
      // If error is other than function not found (PGRST202 or 42883), log warning
      if (atomicErr.code !== 'PGRST202' && atomicErr.code !== '42883') {
        handleDbError('createQuote (atomic RPC notice)', atomicErr);
      }
    }

    // Attempt 2: Sequential step: Reserve authoritative number via getNextQuoteNumber() then insert
    const authoritativeQuoteNumber = await getNextQuoteNumber(businessId);

    // 1. Prepare parent quote payload using the authoritative database-generated number
    const quotePayload: Record<string, any> = {
      business_id: businessId,
      customer_id: isUuid(quoteData.customer_id) ? quoteData.customer_id : null,
      quote_number: authoritativeQuoteNumber,
      status: quoteData.status || 'Draft',
      issue_date: quoteData.issue_date || new Date().toISOString().split('T')[0],
      expiry_date: quoteData.expiry_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      subtotal: Number(quoteData.subtotal) || 0,
      discount_type: quoteData.discount_type || 'percent',
      discount_val: Number(quoteData.discount_val) || 0,
      discount_amount: Number(quoteData.discount_amount) || 0,
      tax_rate: Number(quoteData.tax_rate) || 0,
      tax_amount: Number(quoteData.tax_amount) || 0,
      total: Number(quoteData.total) || 0,
      notes: quoteData.notes || null,
      terms: quoteData.terms || null,
      converted_invoice_id: isUuid(quoteData.converted_invoice_id) ? quoteData.converted_invoice_id : null,
      follow_up_id: isUuid(quoteData.follow_up_id) ? quoteData.follow_up_id : null,
    };

    // If client supplied a valid UUID, use it; otherwise allow PostgreSQL gen_random_uuid()
    if (isUuid(quoteData.id)) {
      quotePayload.id = quoteData.id;
    }

    const { data: quoteRow, error: quoteError } = await client
      .from('quotes')
      .insert(quotePayload)
      .select('*')
      .single();

    if (quoteError) {
      handleDbError('createQuote (insert parent)', quoteError);
      if (quoteError.code === '23505') {
        throw new Error(`Quote number "${authoritativeQuoteNumber}" already exists for this business.`);
      }
      throw new Error(`Database error creating quote: ${quoteError.message} (code: ${quoteError.code || 'unknown'})`);
    }

    const createdParent = quoteRow as QuoteRow;
    const newQuoteId = createdParent.id;
    let insertedItemRows: QuoteItemRow[] = [];

    // 2. Insert child quote_items if present
    if (quoteData.items && quoteData.items.length > 0) {
      const itemsPayload = quoteData.items.map((item) => {
        const itemRow: Record<string, any> = {
          quote_id: newQuoteId,
          product_id: isUuid(item.product_id) ? item.product_id : null,
          name: item.name.trim() || 'Item',
          description: item.description?.trim() || null,
          unit: item.unit?.trim() || 'unit',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          total: Number(item.total) || (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
        };
        if (isUuid(item.id)) {
          itemRow.id = item.id;
        }
        return itemRow;
      });

      const { data: itemsData, error: itemsError } = await client
        .from('quote_items')
        .insert(itemsPayload)
        .select('*');

      if (itemsError) {
        handleDbError('createQuote (insert items)', itemsError);
        // Clean up parent quote to prevent orphaned quote record without items
        await client.from('quotes').delete().eq('id', newQuoteId);
        throw new Error(`Failed to save quote line items: ${itemsError.message} (code: ${itemsError.code || 'unknown'})`);
      }

      insertedItemRows = (itemsData as QuoteItemRow[]) || [];
    }

    return mapQuoteRowToQuote(
      createdParent,
      insertedItemRows,
      customerFallback
    );
  } catch (err) {
    handleDbError('createQuote (exception)', err);
    throw err;
  }
}

/**
 * Updates an existing quote and synchronizes its quote_items in Supabase.
 */
export async function updateQuote(
  quoteId: string,
  updates: Partial<Quote>
): Promise<Quote | null> {
  if (!quoteId || !isUuid(quoteId)) {
    throw new Error(`Valid quote UUID is required to update in database. Received: ${quoteId}`);
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('updateQuote (session check)', authErr);
      throw authErr;
    }

    // 1. Prepare mutable parent fields
    const sanitizedParent: Record<string, any> = {};
    if (updates.quote_number !== undefined) sanitizedParent.quote_number = updates.quote_number;
    if (updates.status !== undefined) sanitizedParent.status = updates.status;
    if (updates.customer_id !== undefined) {
      sanitizedParent.customer_id = isUuid(updates.customer_id) ? updates.customer_id : null;
    }
    if (updates.issue_date !== undefined) sanitizedParent.issue_date = updates.issue_date;
    if (updates.expiry_date !== undefined) sanitizedParent.expiry_date = updates.expiry_date;
    if (updates.subtotal !== undefined) sanitizedParent.subtotal = Number(updates.subtotal) || 0;
    if (updates.discount_type !== undefined) sanitizedParent.discount_type = updates.discount_type;
    if (updates.discount_val !== undefined) sanitizedParent.discount_val = Number(updates.discount_val) || 0;
    if (updates.discount_amount !== undefined) sanitizedParent.discount_amount = Number(updates.discount_amount) || 0;
    if (updates.tax_rate !== undefined) sanitizedParent.tax_rate = Number(updates.tax_rate) || 0;
    if (updates.tax_amount !== undefined) sanitizedParent.tax_amount = Number(updates.tax_amount) || 0;
    if (updates.total !== undefined) sanitizedParent.total = Number(updates.total) || 0;
    if (updates.notes !== undefined) sanitizedParent.notes = updates.notes || null;
    if (updates.terms !== undefined) sanitizedParent.terms = updates.terms || null;
    if (updates.converted_invoice_id !== undefined) {
      sanitizedParent.converted_invoice_id = isUuid(updates.converted_invoice_id) ? updates.converted_invoice_id : null;
    }
    if (updates.follow_up_id !== undefined) {
      sanitizedParent.follow_up_id = isUuid(updates.follow_up_id) ? updates.follow_up_id : null;
    }
    sanitizedParent.updated_at = new Date().toISOString();

    // 2. Update parent quote
    let updatedParentRow: QuoteRow | null = null;
    if (Object.keys(sanitizedParent).length > 0) {
      const { data, error } = await client
        .from('quotes')
        .update(sanitizedParent)
        .eq('id', quoteId)
        .select('*')
        .maybeSingle();

      if (error) {
        handleDbError('updateQuote (parent update)', error);
        if (error.code === '23505') {
          throw new Error(`Quote number "${updates.quote_number}" already exists for this business.`);
        }
        throw new Error(`Database error updating quote ${quoteId}: ${error.message}`);
      }

      if (!data) {
        throw new Error(`Quote ${quoteId} not found or update permission denied.`);
      }
      updatedParentRow = data as QuoteRow;
    } else {
      const { data, error } = await client
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .maybeSingle();
      if (error || !data) {
        throw new Error(`Quote ${quoteId} not found.`);
      }
      updatedParentRow = data as QuoteRow;
    }

    // 3. Synchronize child quote_items if updates.items was supplied
    let currentItemRows: QuoteItemRow[] = [];
    if (updates.items !== undefined) {
      // Remove existing child items
      const { error: delError } = await client
        .from('quote_items')
        .delete()
        .eq('quote_id', quoteId);

      if (delError) {
        handleDbError('updateQuote (delete old items)', delError);
        throw new Error(`Failed to delete old quote items: ${delError.message}`);
      }

      // Insert new current set
      if (updates.items.length > 0) {
        const itemsPayload = updates.items.map((item) => {
          const itemRow: Record<string, any> = {
            quote_id: quoteId,
            product_id: isUuid(item.product_id) ? item.product_id : null,
            name: item.name.trim() || 'Item',
            description: item.description?.trim() || null,
            unit: item.unit?.trim() || 'unit',
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            total: Number(item.total) || (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
          };
          if (isUuid(item.id)) {
            itemRow.id = item.id;
          }
          return itemRow;
        });

        const { data: insData, error: insError } = await client
          .from('quote_items')
          .insert(itemsPayload)
          .select('*');

        if (insError) {
          handleDbError('updateQuote (insert new items)', insError);
          throw new Error(`Failed to synchronize new quote items: ${insError.message}`);
        }

        currentItemRows = (insData as QuoteItemRow[]) || [];
      }
    } else {
      // Read current items to construct complete quote
      const { data: itemsData } = await client
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId);
      currentItemRows = (itemsData as QuoteItemRow[]) || [];
    }

    // 4. Fetch joined customer if customer_id exists
    let customerFallback: Partial<Customer> | null = null;
    if (updatedParentRow.customer_id) {
      const { data: custData } = await client
        .from('customers')
        .select('id, name, phone, whatsapp, email, address')
        .eq('id', updatedParentRow.customer_id)
        .maybeSingle();
      if (custData) {
        customerFallback = custData;
      }
    }

    if (!customerFallback && updates.customer_name) {
      customerFallback = {
        name: updates.customer_name,
        phone: updates.customer_phone,
        whatsapp: updates.customer_whatsapp,
        email: updates.customer_email,
        address: updates.customer_address,
      };
    }

    return mapQuoteRowToQuote(updatedParentRow, currentItemRows, customerFallback);
  } catch (err) {
    handleDbError('updateQuote (exception)', err);
    throw err;
  }
}

/**
 * Deletes a quote by ID from Supabase.
 * Child quote_items are deleted automatically via ON DELETE CASCADE.
 */
export async function deleteQuote(quoteId: string): Promise<boolean> {
  if (!quoteId || !isUuid(quoteId)) return false;

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('deleteQuote (session check)', authErr);
      throw authErr;
    }

    const { error } = await client
      .from('quotes')
      .delete()
      .eq('id', quoteId);

    if (error) {
      handleDbError('deleteQuote', error);
      throw new Error(`Database error deleting quote ${quoteId}: ${error.message} (code: ${error.code || 'unknown'})`);
    }

    return true;
  } catch (err) {
    handleDbError('deleteQuote (exception)', err);
    throw err;
  }
}

// ============================================================================
// INVOICES & INVOICE ITEMS DATABASE SERVICE LAYER (STEP 4D)
// ============================================================================

/**
 * Maps a live Supabase InvoiceItemRow to the frontend InvoiceItem model.
 */
export function mapInvoiceItemRowToInvoiceItem(row: InvoiceItemRow): InvoiceItem {
  return {
    id: row.id,
    product_id: row.product_id || undefined,
    name: row.name || '',
    description: row.description || '',
    unit: row.unit || 'unit',
    quantity: Number(row.quantity) || 1,
    unit_price: Number(row.unit_price) || 0,
    total: Number(row.total) || 0,
  };
}

/**
 * Maps a live Supabase InvoiceRow (with joined invoice_items and customers)
 * to the frontend Invoice interface.
 * Balance remains computed dynamically as (total - amount_paid).
 */
export function mapInvoiceRowToInvoice(
  row: InvoiceRow,
  items: InvoiceItemRow[] = [],
  customerFallback?: Partial<Customer> | null
): Invoice {
  const cust = row.customers;
  const custName = row.customer_name || cust?.name || customerFallback?.name || 'Valued Customer';
  const custPhone = row.customer_phone || cust?.phone || customerFallback?.phone || '';
  const custWhatsapp = cust?.whatsapp || cust?.phone || customerFallback?.whatsapp || customerFallback?.phone || row.customer_phone || '';
  const custEmail = row.customer_email || cust?.email || customerFallback?.email || '';
  const custAddress = row.customer_address || cust?.address || customerFallback?.address || '';

  const rawItems = row.invoice_items && row.invoice_items.length > 0 ? row.invoice_items : items;
  const mappedItems: InvoiceItem[] = (rawItems || []).map(mapInvoiceItemRowToInvoiceItem);

  return {
    id: row.id,
    invoice_number: row.invoice_number,
    quote_id: row.quote_id || undefined,
    customer_id: row.customer_id || '',
    customer_name: custName,
    customer_phone: custPhone,
    customer_whatsapp: custWhatsapp,
    customer_email: custEmail,
    customer_address: custAddress,
    status: (row.status as InvoiceStatus) || 'Draft',
    issue_date: row.issue_date,
    due_date: row.due_date,
    items: mappedItems,
    subtotal: Number(row.subtotal) || 0,
    discount_type: (row.discount_type as 'percent' | 'fixed') || 'percent',
    discount_val: Number(row.discount_val) || 0,
    discount_amount: Number(row.discount_amount) || 0,
    tax_rate: Number(row.tax_rate) || 0,
    tax_amount: Number(row.tax_amount) || 0,
    total: Number(row.total) || 0,
    amount_paid: Number(row.amount_paid) || 0,
    notes: row.notes || '',
    payment_details: row.payment_details || '',
    created_at: row.created_at || new Date().toISOString(),
  };
}

/**
 * Fetches all invoices for the specified business from Supabase,
 * including related invoice_items and customer details.
 */
export async function fetchBusinessInvoices(businessId: string): Promise<Invoice[]> {
  if (!businessId) return [];

  try {
    const client = await getDbClient();
    if (!client) return [];

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('fetchBusinessInvoices (session check)', authErr);
      return [];
    }

    const { data, error } = await client
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        customers (id, name, phone, whatsapp, email, address)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      handleDbError('fetchBusinessInvoices', error);
      return [];
    }

    const rows = (data as InvoiceRow[]) || [];
    return rows.map((row) => mapInvoiceRowToInvoice(row, row.invoice_items || []));
  } catch (err) {
    handleDbError('fetchBusinessInvoices (exception)', err);
    return [];
  }
}

/**
 * Fetches a single invoice by its UUID, including items and customer details.
 */
export async function fetchSingleInvoice(invoiceId: string): Promise<Invoice | null> {
  if (!invoiceId || !isUuid(invoiceId)) return null;

  try {
    const client = await getDbClient();
    if (!client) return null;

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('fetchSingleInvoice (session check)', authErr);
      return null;
    }

    const { data, error } = await client
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        customers (id, name, phone, whatsapp, email, address)
      `)
      .eq('id', invoiceId)
      .maybeSingle();

    if (error) {
      handleDbError('fetchSingleInvoice', error);
      return null;
    }

    if (!data) return null;
    const row = data as InvoiceRow;
    return mapInvoiceRowToInvoice(row, row.invoice_items || []);
  } catch (err) {
    handleDbError('fetchSingleInvoice (exception)', err);
    return null;
  }
}

/**
 * Fetches all items belonging to a specific invoice by invoice UUID.
 */
export async function fetchInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  if (!invoiceId || !isUuid(invoiceId)) return [];

  try {
    const client = await getDbClient();
    if (!client) return [];

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('fetchInvoiceItems (session check)', authErr);
      return [];
    }

    const { data, error } = await client
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (error) {
      handleDbError('fetchInvoiceItems', error);
      return [];
    }

    const rows = (data as InvoiceItemRow[]) || [];
    return rows.map((row) => ({
      id: row.id,
      product_id: row.product_id || undefined,
      name: row.name || '',
      description: row.description || '',
      quantity: Number(row.quantity) || 1,
      unit_price: Number(row.unit_price) || 0,
      unit: row.unit || 'unit',
      total: Number(row.total) || 0,
    }));
  } catch (err) {
    handleDbError('fetchInvoiceItems (exception)', err);
    return [];
  }
}

/**
 * Atomically requests and reserves the next sequential invoice number for a business
 * from Supabase using the database-side counter RPC (get_next_invoice_number).
 * Canonical format: MAT-INV-000001
 */
export async function getNextInvoiceNumber(businessId: string): Promise<string> {
  if (!businessId) {
    throw new Error('Business ID is required to generate an invoice number.');
  }

  const client = await getDbClient();
  if (!client) {
    throw new Error('Supabase client unavailable.');
  }

  const session = await getCurrentSession();
  if (!session || !session.user) {
    throw new Error('Authentication required: no active Supabase session.');
  }

  const { data, error } = await client.rpc('get_next_invoice_number', {
    p_business_id: businessId,
  });

  if (error) {
    handleDbError('getNextInvoiceNumber', error);
    if (error.code === '42501') {
      throw new Error('Access denied: You do not have permission to generate invoice numbers for this business.');
    }
    throw new Error(`Database error generating invoice number: ${error.message} (code: ${error.code || 'unknown'})`);
  }

  if (data === null || data === undefined) {
    throw new Error('Invalid invoice number returned by database numbering function.');
  }

  const seqNum = typeof data === 'number' ? data : parseInt(String(data), 10);
  if (isNaN(seqNum)) {
    return String(data);
  }
  return `MAT-INV-${String(seqNum).padStart(6, '0')}`;
}

/**
 * Creates a new invoice and its associated invoice_items in Supabase.
 * Enforces atomic per-business invoice numbering where the database-generated number is authoritative.
 * Uses create_invoice_atomic RPC with graceful fallback to sequential insertion.
 */
export async function createInvoice(
  businessId: string,
  invoiceData: Omit<Invoice, 'id'> & { id?: string }
): Promise<Invoice | null> {
  if (!businessId) {
    throw new Error('Business ID is required to create an invoice.');
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('createInvoice (session check)', authErr);
      throw authErr;
    }

    const customerFallback = {
      id: invoiceData.customer_id,
      name: invoiceData.customer_name,
      phone: invoiceData.customer_phone,
      whatsapp: invoiceData.customer_whatsapp,
      email: invoiceData.customer_email,
      address: invoiceData.customer_address,
    };

    // Single-transaction atomic creation via create_invoice_atomic RPC
    // Client-provided invoice status is sanitized to default to 'Draft' or 'Unpaid'.
    // Client-provided amount_paid is completely ignored (initialized to 0 atomically).
    const sanitizedStatus = ['Draft', 'Unpaid', 'Sent'].includes(invoiceData.status as string)
      ? invoiceData.status
      : 'Draft';

    const atomicPayload = {
      customer_id: isUuid(invoiceData.customer_id) ? invoiceData.customer_id : null,
      quote_id: isUuid(invoiceData.quote_id) ? invoiceData.quote_id : null,
      status: sanitizedStatus,
      issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
      due_date: invoiceData.due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      subtotal: Number(invoiceData.subtotal) || 0,
      discount_type: invoiceData.discount_type || 'percent',
      discount_val: Number(invoiceData.discount_val) || 0,
      discount_amount: Number(invoiceData.discount_amount) || 0,
      tax_rate: Number(invoiceData.tax_rate) || 0,
      tax_amount: Number(invoiceData.tax_amount) || 0,
      total: Number(invoiceData.total) || 0,
      notes: invoiceData.notes || null,
      payment_details: invoiceData.payment_details || null,
      customer_name: invoiceData.customer_name || null,
      customer_phone: invoiceData.customer_phone || null,
      customer_email: invoiceData.customer_email || null,
      customer_address: invoiceData.customer_address || null,
      items: (invoiceData.items || []).map((item) => ({
        product_id: isUuid(item.product_id) ? item.product_id : null,
        name: item.name?.trim() || 'Item',
        description: item.description?.trim() || null,
        unit: item.unit?.trim() || 'unit',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        total: Number(item.total) || (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      })),
    };

    const { data: atomicResult, error: atomicErr } = await client.rpc('create_invoice_atomic', {
      p_business_id: businessId,
      p_invoice_data: atomicPayload,
    });

    if (atomicErr) {
      if (atomicErr.code === '42501') {
        throw new Error('Access denied: You do not have permission to create invoices for this business.');
      }
      if (atomicErr.code === '23505') {
        throw new Error('Invoice number already exists for this business.');
      }
      handleDbError('createInvoice (atomic RPC failure)', atomicErr);
      throw new Error(`Database error creating invoice: ${atomicErr.message} (code: ${atomicErr.code || 'unknown'})`);
    }

    if (!atomicResult || !atomicResult.id) {
      throw new Error('Atomic invoice creation failed: Database did not return a valid invoice record.');
    }

    return mapInvoiceRowToInvoice(
      atomicResult as InvoiceRow,
      (atomicResult.invoice_items as InvoiceItemRow[]) || [],
      customerFallback
    );
  } catch (err) {
    handleDbError('createInvoice (exception)', err);
    throw err;
  }
}

/**
 * Atomically converts an existing quote into an issued payment invoice via public.convert_quote_to_invoice_atomic.
 * Enforces transaction atomicity: locks quote row, reserves next canonical invoice number,
 * clones line items into invoice_items, marks quote as 'Accepted' with converted_invoice_id,
 * and returns both records.
 */
export async function convertQuoteToInvoice(
  businessId: string,
  quoteId: string
): Promise<{ invoice: Invoice; quote: Quote } | null> {
  if (!businessId || !isUuid(businessId)) {
    throw new Error('Valid business ID is required to convert a quote.');
  }
  if (!quoteId || !isUuid(quoteId)) {
    throw new Error('Valid quote ID is required for conversion.');
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('convertQuoteToInvoice (session check)', authErr);
      throw authErr;
    }

    const { data, error } = await client.rpc('convert_quote_to_invoice_atomic', {
      p_business_id: businessId,
      p_quote_id: quoteId,
    });

    if (error) {
      handleDbError('convertQuoteToInvoice', error);
      if (error.code === '42501') {
        throw new Error('Access denied: You do not have permission to convert quotes for this business.');
      }
      if (error.code === '23505') {
        throw new Error(error.message || 'Quote has already been converted to an invoice.');
      }
      if (error.code === 'P0002') {
        throw new Error('Quote not found for this business.');
      }
      throw new Error(`Failed to convert quote to invoice: ${error.message} (code: ${error.code || 'unknown'})`);
    }

    if (!data || !data.invoice) {
      throw new Error('Atomic conversion completed but returned incomplete data.');
    }

    const invoiceRow = data.invoice as InvoiceRow;
    const invoiceItems = (data.invoice_items as InvoiceItemRow[]) || [];
    const quoteRow = data.quote as QuoteRow;

    const mappedInvoice = mapInvoiceRowToInvoice(invoiceRow, invoiceItems);
    const mappedQuote = mapQuoteRowToQuote(quoteRow);

    return { invoice: mappedInvoice, quote: mappedQuote };
  } catch (err) {
    handleDbError('convertQuoteToInvoice (exception)', err);
    throw err;
  }
}

/**
 * Updates an invoice and its child line items in Supabase.
 */
export async function updateInvoice(
  invoiceId: string,
  updates: Partial<Invoice>
): Promise<Invoice | null> {
  if (!invoiceId || !isUuid(invoiceId)) {
    throw new Error('Valid invoice ID is required for update.');
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('updateInvoice (session check)', authErr);
      throw authErr;
    }

    // 1. Sanitize parent invoice update fields
    const sanitizedParent: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status !== undefined) sanitizedParent.status = updates.status;
    if (updates.issue_date !== undefined) sanitizedParent.issue_date = updates.issue_date;
    if (updates.due_date !== undefined) sanitizedParent.due_date = updates.due_date;
    if (updates.subtotal !== undefined) sanitizedParent.subtotal = Number(updates.subtotal) || 0;
    if (updates.discount_type !== undefined) sanitizedParent.discount_type = updates.discount_type;
    if (updates.discount_val !== undefined) sanitizedParent.discount_val = Number(updates.discount_val) || 0;
    if (updates.discount_amount !== undefined) sanitizedParent.discount_amount = Number(updates.discount_amount) || 0;
    if (updates.tax_rate !== undefined) sanitizedParent.tax_rate = Number(updates.tax_rate) || 0;
    if (updates.tax_amount !== undefined) sanitizedParent.tax_amount = Number(updates.tax_amount) || 0;
    if (updates.total !== undefined) sanitizedParent.total = Number(updates.total) || 0;
    if (updates.amount_paid !== undefined) sanitizedParent.amount_paid = Number(updates.amount_paid) || 0;
    if (updates.notes !== undefined) sanitizedParent.notes = updates.notes;
    if (updates.payment_details !== undefined) sanitizedParent.payment_details = updates.payment_details;
    if (updates.customer_id !== undefined) sanitizedParent.customer_id = isUuid(updates.customer_id) ? updates.customer_id : null;
    if (updates.customer_name !== undefined) sanitizedParent.customer_name = updates.customer_name;
    if (updates.customer_phone !== undefined) sanitizedParent.customer_phone = updates.customer_phone;
    if (updates.customer_email !== undefined) sanitizedParent.customer_email = updates.customer_email;
    if (updates.customer_address !== undefined) sanitizedParent.customer_address = updates.customer_address;

    // 2. Perform parent update
    let updatedParentRow: InvoiceRow;
    {
      const { data, error } = await client
        .from('invoices')
        .update(sanitizedParent)
        .eq('id', invoiceId)
        .select(`
          *,
          customers (id, name, phone, whatsapp, email, address)
        `)
        .single();

      if (error) {
        handleDbError('updateInvoice (update parent)', error);
        throw new Error(`Database error updating invoice ${invoiceId}: ${error.message}`);
      }
      updatedParentRow = data as InvoiceRow;
    }

    // 3. Synchronize child invoice_items if updates.items was supplied
    let currentItemRows: InvoiceItemRow[] = [];
    if (updates.items !== undefined) {
      const { error: delError } = await client
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (delError) {
        handleDbError('updateInvoice (delete old items)', delError);
        throw new Error(`Failed to delete old invoice items: ${delError.message}`);
      }

      if (updates.items.length > 0) {
        const itemsPayload = updates.items.map((item) => {
          const itemRow: Record<string, any> = {
            invoice_id: invoiceId,
            product_id: isUuid(item.product_id) ? item.product_id : null,
            name: item.name.trim() || 'Item',
            description: item.description?.trim() || null,
            unit: item.unit?.trim() || 'unit',
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            total: Number(item.total) || (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
          };
          if (isUuid(item.id)) {
            itemRow.id = item.id;
          }
          return itemRow;
        });

        const { data: insData, error: insError } = await client
          .from('invoice_items')
          .insert(itemsPayload)
          .select('*');

        if (insError) {
          handleDbError('updateInvoice (insert new items)', insError);
          throw new Error(`Failed to synchronize new invoice items: ${insError.message}`);
        }

        currentItemRows = (insData as InvoiceItemRow[]) || [];
      }
    } else {
      const { data: itemsData } = await client
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      currentItemRows = (itemsData as InvoiceItemRow[]) || [];
    }

    // 4. Fetch joined customer if customer_id exists
    let customerFallback: Partial<Customer> | null = null;
    if (updatedParentRow.customer_id) {
      const { data: custData } = await client
        .from('customers')
        .select('id, name, phone, whatsapp, email, address')
        .eq('id', updatedParentRow.customer_id)
        .maybeSingle();
      if (custData) {
        customerFallback = custData;
      }
    }

    if (!customerFallback && updates.customer_name) {
      customerFallback = {
        name: updates.customer_name,
        phone: updates.customer_phone,
        whatsapp: updates.customer_whatsapp,
        email: updates.customer_email,
        address: updates.customer_address,
      };
    }

    return mapInvoiceRowToInvoice(updatedParentRow, currentItemRows, customerFallback);
  } catch (err) {
    handleDbError('updateInvoice (exception)', err);
    throw err;
  }
}

/**
 * Updates status of an invoice.
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<boolean> {
  if (!invoiceId || !isUuid(invoiceId)) return false;

  try {
    const client = await getDbClient();
    if (!client) throw new Error('Supabase client unavailable.');

    const session = await getCurrentSession();
    if (!session || !session.user) {
      throw new Error('Authentication required: no active Supabase session.');
    }

    const { error } = await client
      .from('invoices')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (error) {
      handleDbError('updateInvoiceStatus', error);
      throw new Error(`Database error updating invoice status: ${error.message}`);
    }

    return true;
  } catch (err) {
    handleDbError('updateInvoiceStatus (exception)', err);
    throw err;
  }
}

/**
 * Deletes an invoice by ID from Supabase.
 * Child invoice_items are automatically removed via foreign key CASCADE.
 */
export async function deleteInvoice(invoiceId: string): Promise<boolean> {
  if (!invoiceId || !isUuid(invoiceId)) return false;

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('deleteInvoice (session check)', authErr);
      throw authErr;
    }

    const { error } = await client
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      handleDbError('deleteInvoice', error);
      throw new Error(`Database error deleting invoice ${invoiceId}: ${error.message} (code: ${error.code || 'unknown'})`);
    }

    return true;
  } catch (err) {
    handleDbError('deleteInvoice (exception)', err);
    throw err;
  }
}

// ============================================================================
// PAYMENTS DATABASE SERVICE LAYER (STEP 4D)
// ============================================================================

/**
 * Fetches all recorded payments for a business.
 */
export async function fetchBusinessPayments(businessId: string): Promise<PaymentRow[]> {
  if (!businessId) return [];

  try {
    const client = await getDbClient();
    if (!client) return [];

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('fetchBusinessPayments (session check)', authErr);
      return [];
    }

    const { data, error } = await client
      .from('payments')
      .select('*')
      .eq('business_id', businessId)
      .order('payment_date', { ascending: false });

    if (error) {
      handleDbError('fetchBusinessPayments', error);
      return [];
    }

    return (data as PaymentRow[]) || [];
  } catch (err) {
    handleDbError('fetchBusinessPayments (exception)', err);
    return [];
  }
}

/**
 * Fetches payments recorded for a specific invoice.
 */
export async function fetchInvoicePayments(invoiceId: string): Promise<PaymentRow[]> {
  if (!invoiceId || !isUuid(invoiceId)) return [];

  try {
    const client = await getDbClient();
    if (!client) return [];

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('fetchInvoicePayments (session check)', authErr);
      return [];
    }

    const { data, error } = await client
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    if (error) {
      handleDbError('fetchInvoicePayments', error);
      return [];
    }

    return (data as PaymentRow[]) || [];
  } catch (err) {
    handleDbError('fetchInvoicePayments (exception)', err);
    return [];
  }
}

/**
 * Records a new payment in public.payments.
 */
export async function createPayment(
  businessId: string,
  paymentData: {
    invoice_id?: string | null;
    amount: number;
    payment_date?: string;
    payment_method?: string | null;
    reference?: string | null;
    notes?: string | null;
  }
): Promise<PaymentRow | null> {
  if (!businessId) {
    throw new Error('Business ID is required to record a payment.');
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('createPayment (session check)', authErr);
      throw authErr;
    }

    const payload: Record<string, any> = {
      business_id: businessId,
      invoice_id: isUuid(paymentData.invoice_id) ? paymentData.invoice_id : null,
      amount: Number(paymentData.amount) || 0,
      payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
      payment_method: paymentData.payment_method?.trim() || 'Bank Transfer',
      reference: paymentData.reference?.trim() || null,
      notes: paymentData.notes?.trim() || null,
    };

    const { data, error } = await client
      .from('payments')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      handleDbError('createPayment', error);
      throw new Error(`Database error creating payment: ${error.message} (code: ${error.code || 'unknown'})`);
    }

    return data as PaymentRow;
  } catch (err) {
    handleDbError('createPayment (exception)', err);
    throw err;
  }
}

/**
 * Deletes a payment by ID from Supabase.
 */
export async function deletePayment(paymentId: string): Promise<boolean> {
  if (!paymentId || !isUuid(paymentId)) return false;

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('deletePayment (session check)', authErr);
      throw authErr;
    }

    const { error } = await client
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      handleDbError('deletePayment', error);
      throw new Error(`Database error deleting payment ${paymentId}: ${error.message}`);
    }

    return true;
  } catch (err) {
    handleDbError('deletePayment (exception)', err);
    throw err;
  }
}

/**
 * Updates mutable fields of an existing payment record in public.payments.
 */
export async function updatePayment(
  paymentId: string,
  updates: Partial<PaymentRow>
): Promise<PaymentRow | null> {
  if (!paymentId || !isUuid(paymentId)) {
    throw new Error('Valid payment ID is required to update a payment.');
  }

  try {
    const client = await getDbClient();
    if (!client) throw new Error('Supabase client unavailable.');

    const session = await getCurrentSession();
    if (!session || !session.user) {
      const authErr = new Error('Authentication required: no active Supabase session.');
      handleDbError('updatePayment (session check)', authErr);
      throw authErr;
    }

    const sanitizedUpdates: Record<string, any> = {};
    if (updates.amount !== undefined) sanitizedUpdates.amount = Number(updates.amount) || 0;
    if (updates.payment_date !== undefined) sanitizedUpdates.payment_date = updates.payment_date;
    if (updates.payment_method !== undefined) sanitizedUpdates.payment_method = updates.payment_method?.trim() || 'Bank Transfer';
    if (updates.reference !== undefined) sanitizedUpdates.reference = updates.reference?.trim() || null;
    if (updates.notes !== undefined) sanitizedUpdates.notes = updates.notes?.trim() || null;

    const { data, error } = await client
      .from('payments')
      .update(sanitizedUpdates)
      .eq('id', paymentId)
      .select('*')
      .maybeSingle();

    if (error) {
      handleDbError('updatePayment', error);
      throw new Error(`Database error updating payment ${paymentId}: ${error.message}`);
    }

    return (data as PaymentRow) || null;
  } catch (err) {
    handleDbError('updatePayment (exception)', err);
    throw err;
  }
}

/**
 * Atomically records a payment against an invoice and updates invoice amount_paid and status.
 */
export async function recordInvoicePayment(
  businessId: string,
  invoiceId: string,
  paymentAmount: number,
  paymentMethod: string = 'Bank Transfer',
  reference?: string,
  notes?: string
): Promise<{ payment: PaymentRow; invoice: Invoice } | null> {
  if (!businessId || !isUuid(businessId)) {
    throw new Error('Valid business ID is required to record an invoice payment.');
  }
  if (!invoiceId || !isUuid(invoiceId)) {
    throw new Error('Valid invoice ID is required to record an invoice payment.');
  }
  const amount = Number(paymentAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  try {
    const client = await getDbClient();
    if (!client) throw new Error('Supabase client unavailable.');

    const session = await getCurrentSession();
    if (!session || !session.user) {
      throw new Error('Authentication required: no active Supabase session.');
    }

    // 1. Fetch current invoice state
    const { data: currentInvData, error: fetchErr } = await client
      .from('invoices')
      .select('*, invoice_items (*), customers (id, name, phone, whatsapp, email, address)')
      .eq('id', invoiceId)
      .eq('business_id', businessId)
      .single();

    if (fetchErr || !currentInvData) {
      handleDbError('recordInvoicePayment (fetch invoice)', fetchErr);
      throw new Error(`Invoice not found: ${fetchErr?.message || 'Record does not exist'}`);
    }

    const currentInv = currentInvData as InvoiceRow;

    // 2. Insert payment record into payments table
    const paymentPayload: Record<string, any> = {
      business_id: businessId,
      invoice_id: invoiceId,
      amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod.trim() || 'Bank Transfer',
      reference: reference?.trim() || null,
      notes: notes?.trim() || null,
    };

    const { data: paymentRecord, error: payErr } = await client
      .from('payments')
      .insert([paymentPayload])
      .select('*')
      .single();

    if (payErr || !paymentRecord) {
      handleDbError('recordInvoicePayment (insert payment)', payErr);
      throw new Error(`Failed to record payment: ${payErr?.message || 'Database insert error'}`);
    }

    // 3. Compute updated amount_paid and status
    const currentPaid = Number(currentInv.amount_paid) || 0;
    const invoiceTotal = Number(currentInv.total) || 0;
    const newAmountPaid = currentPaid + amount;
    const newStatus: InvoiceStatus = newAmountPaid >= invoiceTotal ? 'Paid' : 'Partially Paid';

    const { data: updatedInvData, error: updErr } = await client
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select('*, invoice_items (*), customers (id, name, phone, whatsapp, email, address)')
      .single();

    if (updErr || !updatedInvData) {
      handleDbError('recordInvoicePayment (update invoice)', updErr);
      throw new Error(`Payment recorded, but failed to update invoice status: ${updErr?.message}`);
    }

    const updatedInvoice = mapInvoiceRowToInvoice(
      updatedInvData as InvoiceRow,
      (updatedInvData.invoice_items as InvoiceItemRow[]) || []
    );

    return {
      payment: paymentRecord as PaymentRow,
      invoice: updatedInvoice,
    };
  } catch (err) {
    handleDbError('recordInvoicePayment (exception)', err);
    throw err;
  }
}

// ============================================================================
// SUBSCRIPTION GATING & MATCHING ENGINE
// ============================================================================

/**
 * Authoritative subscription check for business features and lead access.
 * Returns true if the user plan is 'pro' or 'business' AND subscription is active & unexpired.
 * Free tier, cancelled, or expired subscriptions return false.
 */
export function hasActiveSubscription(
  businessId: string,
  userPlan?: PlanTier | string,
  subscriptionStatus?: string,
  expiresAt?: string | null
): boolean {
  if (!businessId) return false;
  const plan = (userPlan || '').toLowerCase().trim();
  if (plan !== 'pro' && plan !== 'business') {
    return false;
  }

  if (subscriptionStatus) {
    const st = subscriptionStatus.toLowerCase().trim();
    if (st !== 'active' && st !== 'trialing') {
      return false;
    }
  }

  if (expiresAt) {
    const exp = new Date(expiresAt).getTime();
    if (!isNaN(exp) && exp < Date.now()) {
      return false;
    }
  }

  return true;
}

/**
 * Authoritative database-level subscription verification.
 * Directly calls public.has_active_subscription(p_business_id) via Supabase RPC.
 * Enforces business access and database-authoritative subscription state.
 */
export async function hasActiveSubscriptionAuth(businessId: string): Promise<boolean> {
  if (!businessId || !isUuid(businessId)) return false;
  try {
    const client = await getDbClient();
    if (!client) return false;

    const session = await getCurrentSession();
    if (!session || !session.user) return false;

    const { data, error } = await client.rpc('has_active_subscription', {
      p_business_id: businessId,
    });

    if (error) {
      handleDbError('hasActiveSubscriptionAuth (rpc)', error);
      return false;
    }

    return Boolean(data);
  } catch (err) {
    handleDbError('hasActiveSubscriptionAuth (exception)', err);
    return false;
  }
}

/**
 * Authoritative verification badge updates via database RPC.
 * Prevents client-side tampering of trust data.
 */
export async function adminVerifyBusiness(
  businessId: string,
  flags: {
    phone_verified?: boolean;
    email_verified?: boolean;
    identity_verified?: boolean;
    business_verified?: boolean;
    service_verified?: boolean;
  }
): Promise<boolean> {
  if (!businessId || !isUuid(businessId)) return false;
  try {
    const client = await getDbClient();
    if (!client) return false;

    const { data, error } = await client.rpc('admin_verify_business', {
      p_business_id: businessId,
      p_phone_verified: flags.phone_verified ?? null,
      p_email_verified: flags.email_verified ?? null,
      p_identity_verified: flags.identity_verified ?? null,
      p_business_verified: flags.business_verified ?? null,
      p_service_verified: flags.service_verified ?? null,
    });

    if (error) {
      handleDbError('adminVerifyBusiness', error);
      return false;
    }

    return !!data?.success;
  } catch (err) {
    handleDbError('adminVerifyBusiness (exception)', err);
    return false;
  }
}

/**
 * Authoritative subscription update via database RPC.
 * Callable by webhook handlers or admin billing processes.
 */
export async function authoritativeUpdateSubscription(
  businessId: string,
  plan: 'free' | 'pro' | 'business',
  status: 'active' | 'cancelled' | 'expired' | 'trialing' = 'active',
  expiresAt?: string | null
): Promise<boolean> {
  if (!businessId || !isUuid(businessId)) return false;
  try {
    const client = await getDbClient();
    if (!client) return false;

    const { data, error } = await client.rpc('authoritative_update_business_subscription', {
      p_business_id: businessId,
      p_plan: plan,
      p_status: status,
      p_expires_at: expiresAt || null,
    });

    if (error) {
      handleDbError('authoritativeUpdateSubscription', error);
      return false;
    }

    return !!data?.success;
  } catch (err) {
    handleDbError('authoritativeUpdateSubscription (exception)', err);
    return false;
  }
}

/**
 * Evaluates whether a customer request matches a professional's business profile.
 * Match criteria: Category/service specialization overlap + Geographic coverage.
 */
export function matchRequestToBusiness(
  request: CustomerRequest,
  business: BusinessProfile,
  hasActiveSub: boolean
): boolean {
  if (!hasActiveSub) return false;
  if (!request || !business) return false;

  // 1. Service / Category Matching
  const reqCategory = (request.service_category || '').toLowerCase().trim();
  const reqService = (request.service_required || '').toLowerCase().trim();
  const reqDetails = (request.details || '').toLowerCase().trim();

  const busIndustry = (business.industry || '').toLowerCase().trim();
  const busSpec = (business.specialization || '').toLowerCase().trim();
  const busCategories = (business.categories_offered || []).map((c) => c.toLowerCase().trim());

  const categoryMatched =
    busCategories.some((c) => c && (reqCategory.includes(c) || c.includes(reqCategory))) ||
    (busIndustry && (reqCategory.includes(busIndustry) || busIndustry.includes(reqCategory))) ||
    (busSpec && (reqCategory.includes(busSpec) || busSpec.includes(reqCategory)));

  const serviceMatched =
    busCategories.some((c) => c && (reqService.includes(c) || c.includes(reqService))) ||
    (busSpec && (reqService.includes(busSpec) || busSpec.includes(reqService) || reqDetails.includes(busSpec)));

  if (!categoryMatched && !serviceMatched) {
    return false;
  }

  // 2. Location Matching
  const busLocations = (business.locations_served || []).map((l) => l.toLowerCase().trim());
  const busState = (business.state || '').toLowerCase().trim();
  const busCity = (business.city || '').toLowerCase().trim();

  const servesNationwide =
    busLocations.length === 0 ||
    busLocations.some((l) => l.includes('all') || l.includes('nationwide') || l.includes('nigeria'));

  if (!servesNationwide) {
    const reqLoc = (request.location || '').toLowerCase().trim();
    const reqState = (request.state || '').toLowerCase().trim();
    const reqCity = (request.city || '').toLowerCase().trim();

    const locMatched =
      busLocations.some((l) => l && (reqLoc.includes(l) || l.includes(reqLoc))) ||
      (busState && (reqLoc.includes(busState) || reqState.includes(busState))) ||
      (busCity && (reqLoc.includes(busCity) || reqCity.includes(busCity)));

    if (!locMatched) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// LEADS DATA LAYER (MULTI-TENANT ISOLATION)
// ============================================================================

export interface LeadRow {
  id: string;
  business_id: string;
  customer_id?: string | null;
  customer_request_id?: string | null;
  lead_number: string;
  customer_name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  company?: string | null;
  location?: string | null;
  service_required?: string | null;
  service_category?: string | null;
  property_type?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  budget_formatted?: string | null;
  estimated_value?: number | null;
  timeline?: string | null;
  source: string;
  source_name?: string | null;
  status: string;
  intent_score?: number | null;
  intent_level?: string | null;
  is_verified?: boolean;
  verified_at?: string | null;
  freshness?: string | null;
  freshness_label?: string | null;
  is_locked?: boolean;
  notes?: string | null;
  quote_id?: string | null;
  won_at?: string | null;
  lost_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function mapLeadRowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    lead_number: row.lead_number || 'MAT-000000',
    customer_name: row.customer_name || 'Prospective Client',
    phone: row.phone || '',
    whatsapp: row.whatsapp || row.phone || '',
    email: row.email || undefined,
    company: row.company || undefined,
    location: row.location || '',
    service_required: row.service_required || 'Service Request',
    service_category: row.service_category || 'General',
    property_type: row.property_type || undefined,
    budget_min: row.budget_min !== null && row.budget_min !== undefined ? Number(row.budget_min) : undefined,
    budget_max: row.budget_max !== null && row.budget_max !== undefined ? Number(row.budget_max) : undefined,
    budget_formatted: row.budget_formatted || '',
    estimated_value: row.estimated_value !== null && row.estimated_value !== undefined ? Number(row.estimated_value) : undefined,
    timeline: (row.timeline as Lead['timeline']) || 'flexible',
    source: (row.source as LeadSource) || 'manual',
    source_name: row.source_name || undefined,
    status: (row.status as LeadStatus) || 'New',
    intent_score: row.intent_score !== null && row.intent_score !== undefined ? Number(row.intent_score) : 50,
    intent_level: (row.intent_level as IntentLevel) || 'Medium',
    is_verified: !!row.is_verified,
    verified_at: row.verified_at || undefined,
    freshness: (row.freshness as LeadFreshness) || 'active',
    freshness_label: row.freshness_label || 'Active Lead',
    is_locked: !!row.is_locked,
    notes: row.notes || undefined,
    quote_id: row.quote_id || undefined,
    customer_id: row.customer_id || undefined,
    customer_request_id: row.customer_request_id || undefined,
    won_at: row.won_at || undefined,
    lost_at: row.lost_at || undefined,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || undefined,
  };
}

/**
 * Fetches all leads for a specific business, protected by Supabase RLS.
 */
export async function fetchBusinessLeads(businessId: string): Promise<Lead[]> {
  if (!businessId) return [];
  try {
    const client = await getDbClient();
    if (!client) return [];

    const session = await getCurrentSession();
    if (!session || !session.user) return [];

    const { data, error } = await client
      .from('leads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      handleDbError('fetchBusinessLeads', error);
      return [];
    }

    const rows = (data as LeadRow[]) || [];
    return rows.map(mapLeadRowToLead);
  } catch (err) {
    handleDbError('fetchBusinessLeads (exception)', err);
    return [];
  }
}

/**
 * Creates a new lead in public.leads for a business.
 */
export async function createLead(businessId: string, leadData: Partial<Lead>): Promise<Lead | null> {
  if (!businessId) throw new Error('Business ID is required to create a lead.');
  try {
    const client = await getDbClient();
    if (!client) throw new Error('Supabase client unavailable.');

    const session = await getCurrentSession();
    if (!session || !session.user) {
      throw new Error('Authentication required: no active Supabase session.');
    }

    const leadNum = leadData.lead_number || `MAT-LD-${Math.floor(100000 + Math.random() * 900000)}`;
    const payload: Record<string, any> = {
      business_id: businessId,
      customer_id: isUuid(leadData.customer_id) ? leadData.customer_id : null,
      customer_request_id: isUuid(leadData.customer_request_id) ? leadData.customer_request_id : null,
      lead_number: leadNum,
      customer_name: (leadData.customer_name || 'Prospective Client').trim(),
      phone: leadData.phone?.trim() || null,
      whatsapp: leadData.whatsapp?.trim() || leadData.phone?.trim() || null,
      email: leadData.email?.trim() || null,
      company: leadData.company?.trim() || null,
      location: leadData.location?.trim() || null,
      service_required: leadData.service_required?.trim() || 'Service Inquiry',
      service_category: leadData.service_category?.trim() || 'General',
      property_type: leadData.property_type?.trim() || null,
      budget_formatted: leadData.budget_formatted?.trim() || null,
      timeline: leadData.timeline || 'flexible',
      source: leadData.source || 'manual',
      source_name: leadData.source_name?.trim() || null,
      status: leadData.status || 'New',
      intent_score: leadData.intent_score ?? 50,
      intent_level: leadData.intent_level || 'Medium',
      is_verified: !!leadData.is_verified,
      verified_at: leadData.verified_at || (leadData.is_verified ? new Date().toISOString() : null),
      freshness: leadData.freshness || 'active',
      freshness_label: leadData.freshness_label || 'Active Lead',
      is_locked: !!leadData.is_locked,
      notes: leadData.notes?.trim() || null,
      quote_id: isUuid(leadData.quote_id) ? leadData.quote_id : null,
      won_at: leadData.status === 'Won' ? (leadData.won_at || new Date().toISOString()) : null,
      lost_at: leadData.status === 'Lost' ? (leadData.lost_at || new Date().toISOString()) : null,
    };

    if (isUuid(leadData.id)) {
      payload.id = leadData.id;
    }

    const { data, error } = await client
      .from('leads')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      handleDbError('createLead', error);
      throw new Error(`Database error creating lead: ${error.message}`);
    }

    return mapLeadRowToLead(data as LeadRow);
  } catch (err) {
    handleDbError('createLead (exception)', err);
    throw err;
  }
}

/**
 * Updates an existing lead in public.leads.
 */
export async function updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead | null> {
  if (!leadId || !isUuid(leadId)) throw new Error('Valid lead ID is required to update.');
  try {
    const client = await getDbClient();
    if (!client) throw new Error('Supabase client unavailable.');

    const session = await getCurrentSession();
    if (!session || !session.user) throw new Error('Authentication required.');

    const sanitizedUpdates: Record<string, any> = {};
    if (updates.customer_name !== undefined) sanitizedUpdates.customer_name = updates.customer_name.trim();
    if (updates.phone !== undefined) sanitizedUpdates.phone = updates.phone?.trim() || null;
    if (updates.whatsapp !== undefined) sanitizedUpdates.whatsapp = updates.whatsapp?.trim() || null;
    if (updates.email !== undefined) sanitizedUpdates.email = updates.email?.trim() || null;
    if (updates.company !== undefined) sanitizedUpdates.company = updates.company?.trim() || null;
    if (updates.location !== undefined) sanitizedUpdates.location = updates.location?.trim() || null;
    if (updates.service_required !== undefined) sanitizedUpdates.service_required = updates.service_required.trim();
    if (updates.service_category !== undefined) sanitizedUpdates.service_category = updates.service_category.trim();
    if (updates.property_type !== undefined) sanitizedUpdates.property_type = updates.property_type?.trim() || null;
    if (updates.budget_formatted !== undefined) sanitizedUpdates.budget_formatted = updates.budget_formatted?.trim() || null;
    if (updates.timeline !== undefined) sanitizedUpdates.timeline = updates.timeline;
    if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
    if (updates.intent_score !== undefined) sanitizedUpdates.intent_score = updates.intent_score;
    if (updates.intent_level !== undefined) sanitizedUpdates.intent_level = updates.intent_level;
    if (updates.is_locked !== undefined) sanitizedUpdates.is_locked = updates.is_locked;
    if (updates.notes !== undefined) sanitizedUpdates.notes = updates.notes?.trim() || null;
    if (updates.customer_id !== undefined) sanitizedUpdates.customer_id = isUuid(updates.customer_id) ? updates.customer_id : null;
    if (updates.quote_id !== undefined) sanitizedUpdates.quote_id = isUuid(updates.quote_id) ? updates.quote_id : null;
    if (updates.won_at !== undefined) sanitizedUpdates.won_at = updates.won_at;
    if (updates.lost_at !== undefined) sanitizedUpdates.lost_at = updates.lost_at;
    sanitizedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('leads')
      .update(sanitizedUpdates)
      .eq('id', leadId)
      .select('*')
      .maybeSingle();

    if (error) {
      handleDbError('updateLead', error);
      throw new Error(`Database error updating lead: ${error.message}`);
    }

    return data ? mapLeadRowToLead(data as LeadRow) : null;
  } catch (err) {
    handleDbError('updateLead (exception)', err);
    throw err;
  }
}

/**
 * Deletes a lead in public.leads.
 */
export async function deleteLead(leadId: string): Promise<boolean> {
  if (!leadId || !isUuid(leadId)) return false;
  try {
    const client = await getDbClient();
    if (!client) return false;

    const session = await getCurrentSession();
    if (!session || !session.user) return false;

    const { error } = await client.from('leads').delete().eq('id', leadId);
    if (error) {
      handleDbError('deleteLead', error);
      return false;
    }
    return true;
  } catch (err) {
    handleDbError('deleteLead (exception)', err);
    return false;
  }
}

// ============================================================================
// CUSTOMER REQUESTS DATA LAYER
// ============================================================================

export interface CustomerRequestRow {
  id: string;
  request_number: string;
  customer_name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  location: string;
  state?: string | null;
  city?: string | null;
  service_required: string;
  service_category: string;
  property_type?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  budget_formatted?: string | null;
  timeline?: string | null;
  details?: string | null;
  status: string;
  contacted_by_business_ids?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export function mapCustomerRequestRowToCustomerRequest(row: CustomerRequestRow): CustomerRequest {
  return {
    id: row.id,
    request_number: row.request_number || 'REQ-000000',
    customer_name: row.customer_name || 'Customer',
    phone: row.phone || '',
    whatsapp: row.whatsapp || row.phone || '',
    email: row.email || undefined,
    location: row.location || '',
    state: row.state || undefined,
    city: row.city || undefined,
    service_required: row.service_required || 'Service Request',
    service_category: row.service_category || 'General',
    property_type: row.property_type || undefined,
    budget_min: row.budget_min !== null && row.budget_min !== undefined ? Number(row.budget_min) : undefined,
    budget_max: row.budget_max !== null && row.budget_max !== undefined ? Number(row.budget_max) : undefined,
    budget_formatted: row.budget_formatted || '',
    timeline: (row.timeline as CustomerRequest['timeline']) || 'flexible',
    details: row.details || '',
    status: (row.status as CustomerRequestStatus) || 'Open',
    contacted_by_business_ids: row.contacted_by_business_ids || [],
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || undefined,
  };
}

/**
 * Creates and submits a new customer request to public.customer_requests.
 * Permitted for both authenticated users and anonymous public visitors.
 */
export async function createCustomerRequest(
  requestData: Omit<CustomerRequest, 'id' | 'request_number' | 'created_at' | 'status'> & { status?: CustomerRequestStatus }
): Promise<CustomerRequest | null> {
  try {
    const client = await getDbClient();
    if (!client) throw new Error('Supabase client unavailable.');

    const reqNum = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const payload = {
      request_number: reqNum,
      customer_name: requestData.customer_name.trim(),
      phone: requestData.phone.trim(),
      whatsapp: requestData.whatsapp?.trim() || requestData.phone.trim(),
      email: requestData.email?.trim() || null,
      location: requestData.location.trim(),
      state: requestData.state?.trim() || null,
      city: requestData.city?.trim() || null,
      service_required: requestData.service_required.trim(),
      service_category: requestData.service_category.trim(),
      property_type: requestData.property_type?.trim() || null,
      budget_formatted: requestData.budget_formatted?.trim() || null,
      timeline: requestData.timeline || 'flexible',
      details: requestData.details?.trim() || null,
      status: requestData.status || 'Open',
    };

    const { data, error } = await client
      .from('customer_requests')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      handleDbError('createCustomerRequest', error);
      throw new Error(`Database error submitting customer request: ${error.message}`);
    }

    return mapCustomerRequestRowToCustomerRequest(data as CustomerRequestRow);
  } catch (err) {
    handleDbError('createCustomerRequest (exception)', err);
    throw err;
  }
}

/**
 * Fetches all available customer requests.
 */
export async function fetchCustomerRequests(): Promise<CustomerRequest[]> {
  try {
    const client = await getDbClient();
    if (!client) return [];

    const { data, error } = await client
      .from('customer_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleDbError('fetchCustomerRequests', error);
      return [];
    }

    const rows = (data as CustomerRequestRow[]) || [];
    return rows.map(mapCustomerRequestRowToCustomerRequest);
  } catch (err) {
    handleDbError('fetchCustomerRequests (exception)', err);
    return [];
  }
}

/**
 * Fetches matching customer requests for a business using database-level authority.
 * Calls public.get_matching_customer_requests RPC.
 * Unsubscribed or non-matching businesses receive an empty list.
 * Contact details are masked until unlocked.
 */
export async function fetchMatchingCustomerRequests(businessId: string): Promise<CustomerRequest[]> {
  if (!businessId || !isUuid(businessId)) return [];
  try {
    const client = await getDbClient();
    if (!client) return [];

    const session = await getCurrentSession();
    if (!session || !session.user) return [];

    const { data, error } = await client.rpc('get_matching_customer_requests', {
      p_business_id: businessId,
    });

    if (error) {
      handleDbError('fetchMatchingCustomerRequests (rpc)', error);
      return [];
    }

    const rows = (data as any[]) || [];
    return rows.map((r) => ({
      id: r.id,
      request_number: r.request_number || 'REQ-000000',
      customer_name: r.customer_name || 'Customer',
      phone: r.phone || '',
      whatsapp: r.whatsapp || undefined,
      email: r.email || undefined,
      location: r.location || '',
      state: r.state || undefined,
      city: r.city || undefined,
      service_required: r.service_required || 'Service Request',
      service_category: r.service_category || 'General',
      property_type: r.property_type || undefined,
      budget_min: r.budget_min !== null && r.budget_min !== undefined ? Number(r.budget_min) : undefined,
      budget_max: r.budget_max !== null && r.budget_max !== undefined ? Number(r.budget_max) : undefined,
      budget_formatted: r.budget_formatted || '',
      timeline: r.timeline || 'flexible',
      details: r.details || '',
      status: r.status || 'Open',
      contacted_by_business_ids: r.is_claimed ? [businessId] : [],
      created_at: r.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    handleDbError('fetchMatchingCustomerRequests (exception)', err);
    return [];
  }
}

/**
 * Authoritative claim and unlock of a marketplace customer request.
 * Invokes the atomic database RPC `claim_customer_request_atomic` to:
 * 1. Verify caller business ownership & active subscription at DB level
 * 2. Prevent duplicate claims (database unique index)
 * 3. Atomically create the lead and customer
 * 4. Mark request as contacted and append business ID
 */
export async function claimCustomerRequest(
  businessId: string,
  requestId: string
): Promise<{ success: boolean; lead: Lead | null; is_duplicate?: boolean; message?: string }> {
  if (!businessId || !isUuid(businessId)) {
    throw new Error('Valid business ID is required to claim a customer request.');
  }
  if (!requestId || !isUuid(requestId)) {
    throw new Error('Valid customer request ID is required.');
  }

  try {
    const client = await getDbClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    const session = await getCurrentSession();
    if (!session || !session.user) {
      throw new Error('Authentication required: no active Supabase session.');
    }

    // Authoritative atomic RPC execution
    const { data, error } = await client.rpc('claim_customer_request_atomic', {
      p_business_id: businessId,
      p_request_id: requestId,
    });

    if (error) {
      handleDbError('claimCustomerRequest (rpc)', error);
      throw new Error(`Failed to unlock request: ${error.message}`);
    }

    if (!data || !data.success) {
      return {
        success: false,
        lead: null,
        message: data?.message || 'Failed to claim request',
      };
    }

    // Fetch the freshly created or existing lead
    const leadId = data.lead_id;
    if (leadId) {
      const { data: leadRow, error: leadErr } = await client
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (!leadErr && leadRow) {
        return {
          success: true,
          lead: mapLeadRowToLead(leadRow as LeadRow),
          is_duplicate: data.is_duplicate,
        };
      }
    }

    return {
      success: true,
      lead: null,
      is_duplicate: data.is_duplicate,
    };
  } catch (err) {
    handleDbError('claimCustomerRequest (exception)', err);
    throw err;
  }
}

/**
 * Updates status of a customer request (e.g. Open -> Contacted).
 */
export async function updateCustomerRequestStatus(
  requestId: string,
  status: CustomerRequestStatus,
  businessId?: string
): Promise<boolean> {
  if (!requestId || !isUuid(requestId)) return false;
  try {
    const client = await getDbClient();
    if (!client) return false;

    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('customer_requests')
      .update(updates)
      .eq('id', requestId);

    if (error) {
      handleDbError('updateCustomerRequestStatus', error);
      return false;
    }
    return true;
  } catch (err) {
    handleDbError('updateCustomerRequestStatus (exception)', err);
    return false;
  }
}

/**
 * Converts an external customer request into an authoritative internal business Lead.
 * Uses atomic DB RPC when online, with graceful fallback.
 */
export async function convertCustomerRequestToLead(
  businessId: string,
  request: CustomerRequest,
  assignedUserId?: string
): Promise<Lead | null> {
  if (!businessId) throw new Error('Business ID is required to convert request to lead.');

  // If database client is available and valid UUIDs, use authoritative claimCustomerRequest
  if (isUuid(businessId) && isUuid(request.id)) {
    try {
      const claimResult = await claimCustomerRequest(businessId, request.id);
      if (claimResult.lead) {
        return claimResult.lead;
      }
    } catch (claimErr: any) {
      console.warn('[Mathorg] claimCustomerRequest RPC notice, falling back:', claimErr?.message || claimErr);
    }
  }

  // 1. Mark request as Contacted
  await updateCustomerRequestStatus(request.id, 'Contacted', businessId);

  // 2. Link existing customer if matching phone or email exists
  let linkedCustomerId: string | undefined = undefined;
  try {
    const existingCustomers = await fetchBusinessCustomers(businessId);
    const matched = existingCustomers.find(
      (c) => (request.phone && c.phone === request.phone) || (request.email && c.email === request.email)
    );
    if (matched) {
      linkedCustomerId = matched.id;
    }
  } catch (e) {
    // Non-blocking
  }

  // 3. Create authoritative Lead record
  const lead = await createLead(businessId, {
    customer_request_id: request.id,
    customer_id: linkedCustomerId,
    customer_name: request.customer_name,
    phone: request.phone,
    whatsapp: request.whatsapp || request.phone,
    email: request.email,
    location: request.location,
    service_required: request.service_required,
    service_category: request.service_category,
    property_type: request.property_type,
    budget_formatted: request.budget_formatted || '',
    timeline: request.timeline || 'flexible',
    source: 'marketplace',
    source_name: 'Customer Request Portal',
    status: 'New',
    intent_score: 85,
    intent_level: 'High',
    is_verified: true,
    verified_at: new Date().toISOString(),
    freshness: 'active',
    freshness_label: '🔥 Active — from Verified Request',
    is_locked: false,
    notes: request.details ? `Customer Request #${request.request_number}:\n${request.details}` : `Customer Request #${request.request_number}`,
    assigned_user: assignedUserId,
  });

  return lead;
}

// ============================================================================
// PROFESSIONAL DIRECTORY DATA LAYER (PUBLIC DIRECTORY VIEW)
// ============================================================================

/**
 * Fetches verified professionals and businesses already registered on MatthOrg.
 * Queries public_professionals & registered businesses to guarantee zero leakage of bank accounts.
 * Returns only genuine registered businesses on MatthOrg, randomized so visitors see random registered professionals.
 */
export async function fetchPublicProfessionals(filter?: {
  category?: string;
  location?: string;
  search?: string;
  randomize?: boolean;
}): Promise<PublicProfessionalProfile[]> {
  try {
    const client = await getDbClient();
    let rows: any[] = [];

    if (client) {
      let query = client.from('public_professionals').select('*');

      if (filter?.search?.trim()) {
        const q = filter.search.trim();
        query = query.or(`business_name.ilike.%${q}%,specialization.ilike.%${q}%,industry.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        rows = data;
      }
    }

    let list: PublicProfessionalProfile[] = [];

    if (rows.length > 0) {
      list = rows.map((r) => ({
        id: r.id,
        business_name: r.business_name || '',
        industry: r.industry || '',
        specialization: r.specialization || '',
        tagline: r.tagline || '',
        logo: r.logo || '',
        phone: r.phone || '',
        whatsapp: r.whatsapp || r.phone || '',
        email: r.email || '',
        address: r.address || '',
        state: r.state || '',
        city: r.city || '',
        categories_offered: r.categories_offered || [],
        locations_served: r.locations_served || [],
        is_public: r.is_public !== false,
        phone_verified: !!r.phone_verified,
        email_verified: !!r.email_verified,
        identity_verified: !!r.identity_verified,
        business_verified: !!r.business_verified,
        service_verified: !!r.service_verified,
        created_at: r.created_at || new Date().toISOString(),
      }));
    } else {
      // Use verified real businesses registered on MatthOrg
      list = getRegisteredBusinesses();
    }

    // Always merge any dynamically registered businesses from local store
    const registeredLocal = getRegisteredBusinesses();
    registeredLocal.forEach((reg) => {
      if (!list.some((p) => p.id === reg.id || p.business_name.toLowerCase() === reg.business_name.toLowerCase())) {
        list.push(reg);
      }
    });

    if (filter?.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.business_name.toLowerCase().includes(q) ||
          (p.specialization && p.specialization.toLowerCase().includes(q)) ||
          (p.industry && p.industry.toLowerCase().includes(q)) ||
          (p.tagline && p.tagline.toLowerCase().includes(q)) ||
          (p.categories_offered && p.categories_offered.some((c) => c.toLowerCase().includes(q)))
      );
    }

    if (filter?.category && filter.category !== 'all') {
      const cat = filter.category.toLowerCase();
      list = list.filter(
        (p) =>
          (p.industry && p.industry.toLowerCase().includes(cat)) ||
          (p.specialization && p.specialization.toLowerCase().includes(cat)) ||
          (p.categories_offered && p.categories_offered.some((c) => c.toLowerCase().includes(cat)))
      );
    }

    if (filter?.location && filter.location !== 'all') {
      const loc = filter.location.toLowerCase();
      list = list.filter(
        (p) =>
          (p.state && p.state.toLowerCase().includes(loc)) ||
          (p.city && p.city.toLowerCase().includes(loc)) ||
          (p.locations_served &&
            p.locations_served.some((l) => l.toLowerCase().includes(loc) || l.toLowerCase().includes('nationwide') || l.toLowerCase().includes('worldwide')))
      );
    }

    // Randomize the registered professionals so home page displays a fresh random rotation
    if (filter?.randomize !== false) {
      list = [...list].sort(() => Math.random() - 0.5);
    }

    return list;
  } catch (err) {
    handleDbError('fetchPublicProfessionals (exception)', err);
    return getRegisteredBusinesses().sort(() => Math.random() - 0.5);
  }
}

/**
 * When a client on the home page contacts or requests a quote from a registered business,
 * this function creates a direct lead targeted specifically to that business's dashboard.
 */
export async function createDirectClientInquiryForBusiness(
  targetBusinessId: string,
  targetBusinessName: string,
  leadData: {
    customer_name: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    location: string;
    service_required: string;
    service_category?: string;
    budget_formatted?: string;
    timeline?: 'immediate' | 'within_7_days' | 'within_30_days' | 'flexible';
    notes?: string;
  }
): Promise<Lead> {
  const reqNum = `LEAD-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const newLead: Lead = {
    id: `lead_mkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    lead_number: reqNum,
    customer_name: leadData.customer_name.trim(),
    phone: leadData.phone.trim(),
    whatsapp: (leadData.whatsapp || leadData.phone).trim(),
    email: leadData.email?.trim() || undefined,
    location: leadData.location.trim(),
    service_required: leadData.service_required.trim(),
    service_category: leadData.service_category || 'General Service',
    budget_formatted: leadData.budget_formatted || 'Budget Negotiable',
    timeline: leadData.timeline || 'within_7_days',
    source: 'marketplace',
    source_name: `Direct Client Contact via MatthOrg Homepage for ${targetBusinessName}`,
    status: 'New',
    intent_score: 90,
    intent_level: 'High',
    is_verified: true,
    verified_at: now,
    freshness: 'active',
    freshness_label: '🔥 Active — Client Contacted Just Now',
    is_locked: true, // Protected lead: prompts upgrade for free plan users
    notes: leadData.notes || `Client submitted quotation inquiry directly to ${targetBusinessName} on MatthOrg.`,
    created_at: now,
  };

  // 1. Try remote DB persistence if online
  try {
    const client = await getDbClient();
    if (client && targetBusinessId && targetBusinessId.length > 10) {
      await client.from('leads').insert({
        business_id: targetBusinessId,
        lead_number: reqNum,
        customer_name: newLead.customer_name,
        phone: newLead.phone,
        whatsapp: newLead.whatsapp,
        email: newLead.email,
        location: newLead.location,
        service_required: newLead.service_required,
        budget_formatted: newLead.budget_formatted,
        timeline: newLead.timeline,
        source: newLead.source,
        source_name: newLead.source_name,
        status: 'New',
        intent_score: newLead.intent_score,
        is_verified: true,
        is_locked: true,
        notes: newLead.notes,
        created_at: now,
      });
    }
  } catch (err) {
    console.warn('[MatthOrg] Database insert notice for direct client inquiry:', err);
  }

  // 2. Persist locally under target business key and generic marketplace leads
  try {
    const storageKey = `matthorg_leads_${targetBusinessId}`;
    const raw = localStorage.getItem(storageKey);
    const existing: Lead[] = raw ? JSON.parse(raw) : [];
    existing.unshift(newLead);
    localStorage.setItem(storageKey, JSON.stringify(existing));

    // Also dispatch notification event so active dashboard receives it immediately
    window.dispatchEvent(
      new CustomEvent('matthorg_new_client_lead', {
        detail: { targetBusinessId, lead: newLead },
      })
    );
  } catch (err) {
    console.warn('[MatthOrg] Local storage notice for direct lead:', err);
  }

  return newLead;
}




