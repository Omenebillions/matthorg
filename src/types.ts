export type PlanTier = 'free' | 'pro' | 'business';
export type BillingInterval = 'monthly' | 'yearly';

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
  logo: string; // URL or base64
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  country: string;
  currency: string;
  tax_name: string; // e.g., "VAT", "Sales Tax"
  tax_rate: number; // percentage, e.g. 7.5
  payment_details: {
    bank_name: string;
    account_name: string;
    account_number: string;
    notes: string;
  };
  terms: string;
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
  created_at: string;
}

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

export interface FollowUp {
  id: string;
  quote_id: string;
  quote_number: string;
  customer_id: string;
  customer_name: string;
  customer_whatsapp: string;
  title: string;
  amount: number;
  reminder_date: string;
  status: FollowUpStatus;
  notes?: string;
  created_at: string;
}

export interface AIUsageState {
  month: string; // YYYY-MM
  count: number;
}

export interface AppState {
  user: User;
  business: BusinessProfile;
  customers: Customer[];
  products: Product[];
  templates: QuoteTemplate[];
  quotes: Quote[];
  invoices: Invoice[];
  followups: FollowUp[];
  aiUsage: AIUsageState;
}
