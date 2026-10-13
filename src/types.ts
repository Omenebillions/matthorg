export type PlanTier = 'free' | 'pro' | 'business';

export type DocumentDesignTemplate = 'modern' | 'corporate' | 'technical' | 'emerald';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanTier;
  createdAt: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  industry?: string; // e.g., "Building, Construction & Civil Works", "Electrical & Power", "Digital & IT"
  specialization?: string; // What the business specifically specializes in
  state?: string; // e.g., "Lagos", "Abuja (FCT)", "Rivers", etc.
  city?: string; // e.g., "Ikeja", "Maitama", "Port Harcourt"
  cac_number?: string; // e.g., "RC 1234567"
  website?: string;
  tagline?: string;
  logo: string; // URL or base64
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  country: string;
  currency: string;
  tax_name: string; // e.g., "VAT", "Sales Tax"
  tax_rate: number; // percentage, e.g. 7.5
  categories_offered?: string[];
  locations_served?: string[];
  is_public?: boolean;
  phone_verified?: boolean;
  email_verified?: boolean;
  identity_verified?: boolean;
  business_verified?: boolean;
  service_verified?: boolean;
  director_name?: string;
  nin_number?: string;
  id_type?: 'nin' | 'drivers_license' | 'voters_card' | 'passport';
  cac_type?: 'business_name' | 'limited_company' | 'sole_trader' | 'incorporated_trustee';
  trade_certification?: string;
  trade_license_number?: string;
  proof_of_address_url?: string;
  cac_document_url?: string;
  id_document_url?: string;
  verification_status?: 'unverified' | 'in_review' | 'verified';
  verified_at?: string;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  subscription_current_period_end?: string;
  working_hours?: string;
  payment_details: {
    bank_name: string;
    account_name: string;
    account_number: string;
    notes: string;
  };
  terms: string;
  invoice_design?: DocumentDesignTemplate;
  design_color?: string;
  show_logo_on_docs?: boolean;
  show_address_on_docs?: boolean;
  show_tax_on_docs?: boolean;
  show_banking_on_docs?: boolean;
  show_signature_on_docs?: boolean;
  show_terms_on_docs?: boolean;
}

export type CustomerRequestStatus = 'Open' | 'Matched' | 'Contacted' | 'Converted' | 'Closed';

export interface MatchedProfessionalCandidate {
  professional: PublicProfessionalProfile;
  matchScore: number; // 0-100
  matchReasons: string[];
  isVerified: boolean;
  isPremium: boolean;
}

export interface CustomerRequest {
  id: string;
  request_number: string;
  customer_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  location: string;
  state?: string;
  city?: string;
  service_required: string;
  service_category: string;
  property_type?: string;
  budget_min?: number;
  budget_max?: number;
  budget_formatted?: string;
  timeline?: 'immediate' | 'within_7_days' | 'within_30_days' | 'flexible';
  details?: string;
  status: CustomerRequestStatus;
  contacted_by_business_ids?: string[];
  user_id?: string;
  consent_given?: boolean;
  matched_count?: number;
  matched_candidates?: MatchedProfessionalCandidate[];
  matched_business_names?: string[];
  quote_id?: string;
  notification_dispatched?: boolean;
  notification_status?: 'pending' | 'whatsapp_link_ready' | 'email_sent' | 'sms_sent' | 'manual_review';
  created_at: string;
  updated_at?: string;
}

export interface PublicProfessionalProfile {
  id: string;
  business_name: string;
  industry?: string;
  specialization?: string;
  tagline?: string;
  logo?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  state?: string;
  city?: string;
  categories_offered?: string[];
  locations_served?: string[];
  is_public: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  identity_verified: boolean;
  business_verified: boolean;
  service_verified: boolean;
  is_demo?: boolean;
  verification_status?: 'unverified' | 'in_review' | 'verified';
  created_at: string;
}

export type LeadSource =
  | 'marketplace'
  | 'manual'
  | 'referral'
  | 'website'
  | 'Google Ads'
  | 'Meta Ads'
  | 'WhatsApp'
  | 'partner'
  | 'import';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Quote Sent'
  | 'Quoted'
  | 'Negotiating'
  | 'Won'
  | 'Lost'
  | 'Unresponsive'
  | 'Not Qualified';

export type IntentLevel = 'Very High' | 'High' | 'Medium' | 'Low';

export type LeadFreshness = 'active' | 'recently_verified' | 'aging' | 'expired' | 'closed';

export interface Lead {
  id: string;
  lead_number: string; // e.g. MAT-000124
  customer_name: string;
  phone: string;
  whatsapp: string;
  email?: string;
  company?: string;
  location: string; // e.g. "Abuja", "Lekki, Lagos"
  service_required: string; // e.g. "Solar Installation"
  service_category: string; // e.g. "Power & Technology"
  property_type?: string; // e.g. "3-bedroom house"
  budget_min?: number;
  budget_max?: number;
  budget_formatted: string; // e.g. "₦1m–₦1.5m"
  estimated_value?: number;
  timeline: 'immediate' | 'within_7_days' | 'within_30_days' | 'flexible';
  source: LeadSource;
  source_name?: string; // e.g. "ABC Properties", "Google Search"
  status: LeadStatus;
  intent_score: number; // 0 - 100
  intent_level: IntentLevel;
  is_verified: boolean;
  verified_at?: string;
  freshness: LeadFreshness;
  freshness_label: string; // e.g. "🔥 Active — verified 15m ago"
  is_locked: boolean; // if marketplace lead & locked, contact details are hidden
  unlocked_at?: string;
  notes?: string;
  requirements_list?: string[];
  next_follow_up?: string;
  assigned_user?: string;
  quote_id?: string;
  customer_id?: string;
  customer_request_id?: string;
  address?: string; // Street / Site Address
  city?: string;
  state?: string;
  attached_products?: Array<{
    product_id: string;
    name: string;
    category?: string;
    unit?: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  created_at: string;
  updated_at?: string;
  won_at?: string;
  lost_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  unit: string; // e.g., "unit", "pcs", "hrs", "sqm", "service"
  default_price: number;
  category: string;
  sku?: string;
  image?: string;
  rating?: number;
  rating_count?: number;
}

export interface QuoteItem {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  unit?: string;
  total: number;
  isCatalogueMatch?: boolean;
  image?: string;
}

export interface InvoiceItem {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  unit?: string;
  total: number;
  image?: string;
}

export interface QuoteTemplateItem {
  id: string;
  product_id?: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit?: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  category?: string;
  items: QuoteTemplateItem[];
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Awaiting Response' | 'Accepted' | 'Rejected' | 'Expired';

export interface Quote {
  id: string;
  quote_number: string; // e.g. MAT-Q-000124
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp: string;
  customer_email: string;
  customer_address: string;
  status: QuoteStatus;
  issue_date: string;
  expiry_date: string;
  items: QuoteItem[];
  subtotal: number;
  discount_type: 'percent' | 'fixed';
  discount_val: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string;
  terms: string;
  follow_up_id?: string;
  converted_invoice_id?: string;
  design_template?: DocumentDesignTemplate;
  design_color?: string;
  hide_fields?: string[];
  created_at: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface Invoice {
  id: string;
  invoice_number: string; // e.g. MAT-INV-000082
  quote_id?: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp: string;
  customer_email: string;
  customer_address: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount_type: 'percent' | 'fixed';
  discount_val: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  notes: string;
  payment_details: string;
  design_template?: DocumentDesignTemplate;
  design_color?: string;
  hide_fields?: string[];
  created_at: string;
}

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled' | 'snoozed';

export interface FollowUp {
  id: string;
  business_id?: string;
  quote_id?: string;
  quote_number?: string;
  lead_id?: string;
  lead_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  customer_id?: string;
  customer_name: string;
  customer_whatsapp?: string;
  customer_phone?: string;
  customer_email?: string;
  title: string;
  amount: number;
  reminder_date: string;
  status: FollowUpStatus;
  priority?: 'high' | 'medium' | 'low';
  channel?: 'whatsapp' | 'call' | 'email' | 'sms';
  task_type?: 'quote_followup' | 'lead_contact' | 'lead_qualify' | 'invoice_overdue' | 'invoice_due' | 'customer_retention' | 'deal_stale';
  target_type?: 'quote' | 'lead' | 'invoice' | 'customer';
  sequence_number?: number;
  generated_message?: string;
  approved_message?: string;
  sent_at?: string;
  completed_at?: string;
  snoozed_until?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface DailyBriefingItem {
  id: string;
  type: 'quote' | 'lead' | 'invoice' | 'customer';
  title: string;
  entityNumber: string;
  customerName: string;
  customer_name?: string;
  amount: number;
  daysAgo?: number;
  reason: string;
  recommendedAction: string;
  targetId: string;
  phone?: string;
  whatsapp?: string;
}

export interface DailyBriefing {
  greeting: string;
  totalAttentionItems: number;
  quotesNeedingFollowupCount: number;
  leadsGoingColdCount: number;
  invoicesOverdueCount: number;
  potentialValueRequiringAttention: number;
  priorityTitle: string;
  priorityDescription: string;
  topActionableItem?: DailyBriefingItem;
  topItems: DailyBriefingItem[];
  topFollowUpItems: DailyBriefingItem[];
}

export interface AIUsageState {
  month: string; // YYYY-MM
  count: number;
}

export interface MatthewToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  result?: any;
}

export interface MatthewCitation {
  type: 'lead' | 'deal' | 'invoice' | 'customer' | 'metric' | 'marketplace';
  title: string;
  detail?: string;
  id?: string;
}

export interface MatthewMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  is_out_of_domain?: boolean;
  tool_calls_executed?: string[];
  citations?: MatthewCitation[];
  model?: string;
  engine?: 'openai' | 'gemini' | 'local';
}

export interface AppState {
  user: User;
  business: BusinessProfile;
  leads: Lead[];
  customers: Customer[];
  products: Product[];
  templates: QuoteTemplate[];
  quotes: Quote[];
  invoices: Invoice[];
  followups: FollowUp[];
  aiUsage: AIUsageState;
  matthewMessages?: MatthewMessage[];
}
