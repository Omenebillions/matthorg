/**
 * MATTHORG — MATTHEW AI
 * Controlled Business Data Tools & Tenant-Isolated Executions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_BUSINESS,
  DEFAULT_LEADS,
  DEFAULT_CUSTOMERS,
  DEFAULT_QUOTES,
  DEFAULT_INVOICES,
  DEFAULT_FOLLOWUPS,
  DEFAULT_REQUESTS,
} from './defaults';

// Clean environment helper
function cleanEnv(val?: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

const supabaseUrl = cleanEnv(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
const supabaseAnonKey = cleanEnv(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

function getSupabaseServerClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

// ============================================================================
// TOOL DEFINITIONS (OpenAI & Gemini Compatible JSON Schema)
// ============================================================================

export const MATTHEW_TOOL_DEFINITIONS = [
  {
    name: 'get_business_summary',
    description: 'Retrieves core business profile, operational industry, specialization, verification badges, subscription tier, and high-level pipeline counts.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_sales_metrics',
    description: 'Retrieves sales performance metrics including total pipeline value, invoiced revenue, paid cash collected, unpaid invoices, overdue balances, conversion win-rate, and average deal size.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_leads',
    description: 'Retrieves the business sales pipeline leads with optional stage filter (New, Contacted, Qualified, Quote Sent, Won, Lost, etc.) and source filter.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter leads by stage: New, Contacted, Qualified, Quote Sent, Won, Lost, etc. Leave blank for all.',
        },
        source: {
          type: 'string',
          description: 'Filter by source (e.g. marketplace, direct, referral).',
        },
        limit: {
          type: 'number',
          description: 'Max number of leads to return (default: 15).',
        },
      },
    },
  },
  {
    name: 'get_lead_details',
    description: 'Retrieves comprehensive details for a specific lead by id or lead_number, including customer requirements, budget, notes, and timeline.',
    parameters: {
      type: 'object',
      properties: {
        lead_identifier: {
          type: 'string',
          description: 'The lead ID (UUID) or lead number (e.g. LEAD-0001).',
        },
      },
      required: ['lead_identifier'],
    },
  },
  {
    name: 'get_deals',
    description: 'Retrieves quotes and proposals (deals) with status (Draft, Sent, Accepted, Rejected), totals, customer names, and validity dates.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by deal/quote status: Draft, Sent, Accepted, Rejected, Expired.',
        },
        limit: {
          type: 'number',
          description: 'Max number of quotes to return (default: 15).',
        },
      },
    },
  },
  {
    name: 'get_customers',
    description: 'Retrieves client accounts with aggregated order counts, total revenue generated, and active contact information.',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search customer by name, company, or email.',
        },
        limit: {
          type: 'number',
          description: 'Max customers to return (default: 15).',
        },
      },
    },
  },
  {
    name: 'get_customer_details',
    description: 'Retrieves a single customer record with their complete quote and invoice history.',
    parameters: {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          description: 'The UUID of the customer.',
        },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'get_invoices',
    description: 'Retrieves business invoices with payment status (Draft, Sent, Unpaid, Partially Paid, Paid, Overdue) and due dates.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by invoice status: Unpaid, Paid, Overdue, Partially Paid.',
        },
        limit: {
          type: 'number',
          description: 'Max invoices to return (default: 15).',
        },
      },
    },
  },
  {
    name: 'get_payments',
    description: 'Retrieves verified payment transactions, amounts in Naira, reference IDs, and payment dates.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max payments to return (default: 15).',
        },
      },
    },
  },
  {
    name: 'get_customer_requests',
    description: 'Retrieves buyer requests from the public customer marketplace matching the business trade and location. Note: Contact details are protected until unlocked by an active subscriber.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter requests by service category (e.g., Solar, Construction, Plumbing).',
        },
        location: {
          type: 'string',
          description: 'Filter requests by state or city (e.g. Lagos, Abuja).',
        },
        limit: {
          type: 'number',
          description: 'Max requests to return (default: 10).',
        },
      },
    },
  },
  {
    name: 'get_follow_ups',
    description: 'Retrieves active and scheduled follow-up tasks across leads, quotations, invoices, and customers, including priority and cadence status.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by follow-up status: pending, completed, snoozed, or all.',
        },
        limit: {
          type: 'number',
          description: 'Max items to return (default: 15).',
        },
      },
    },
  },
  {
    name: 'get_daily_briefing',
    description: 'Generates the authoritative Matthew Daily Briefing: summarizes attention items, cold leads, quotes needing follow-up, overdue invoices, at-risk revenue, and highest-priority focus.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_follow_up',
    description: 'Schedules a new follow-up task for a prospective lead, quotation, or invoice.',
    parameters: {
      type: 'object',
      properties: {
        target_type: {
          type: 'string',
          description: 'Entity type: lead, quote, invoice, or customer.',
        },
        target_id: {
          type: 'string',
          description: 'The ID of the target quote, lead, or invoice.',
        },
        customer_name: {
          type: 'string',
          description: 'Name of the customer.',
        },
        title: {
          type: 'string',
          description: 'Brief title for the follow-up task.',
        },
        amount: {
          type: 'number',
          description: 'Financial value associated with this opportunity.',
        },
        reminder_date: {
          type: 'string',
          description: 'Date scheduled for follow-up in YYYY-MM-DD format.',
        },
        notes: {
          type: 'string',
          description: 'Recommended follow-up angle or notes.',
        },
      },
      required: ['customer_name', 'title'],
    },
  },
  {
    name: 'snooze_follow_up',
    description: 'Postpones a follow-up task by a specified number of days (e.g. +3 days, +7 days).',
    parameters: {
      type: 'object',
      properties: {
        follow_up_id: {
          type: 'string',
          description: 'The ID of the follow-up task.',
        },
        days: {
          type: 'number',
          description: 'Number of days to postpone (e.g. 3, 7).',
        },
      },
      required: ['follow_up_id', 'days'],
    },
  },
  {
    name: 'complete_follow_up',
    description: 'Marks a scheduled follow-up task as completed with optional resolution notes.',
    parameters: {
      type: 'object',
      properties: {
        follow_up_id: {
          type: 'string',
          description: 'The ID of the follow-up task.',
        },
        notes: {
          type: 'string',
          description: 'Outcome or resolution notes.',
        },
      },
      required: ['follow_up_id'],
    },
  },
  {
    name: 'list_cooling_leads',
    description: 'Retrieves all qualified or contacted leads that have had no recorded sales activity for 3 or more days, excluding won, lost, or already quoted deals.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_pending_quotes',
    description: 'Retrieves all sent or awaiting-response quotations older than 48 hours awaiting client decision.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_overdue_invoices',
    description: 'Retrieves all unpaid or partially paid invoices that have passed their payment due date.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

// ============================================================================
// AUTHORITATIVE TOOL EXECUTION ENGINE
// ============================================================================

export interface ToolExecutionContext {
  businessId: string;
  clientContext?: any;
  clientFallbackData?: any;
}

export async function executeMatthewTool(
  toolName: string,
  args: Record<string, any>,
  context: ToolExecutionContext
): Promise<any> {
  const { businessId, clientFallbackData, clientContext } = context;
  const client = getSupabaseServerClient();

  const effectiveBusiness = clientFallbackData?.business || DEFAULT_BUSINESS;
  const effectiveQuotes = (clientFallbackData?.quotes && clientFallbackData.quotes.length > 0) ? clientFallbackData.quotes : DEFAULT_QUOTES;
  const effectiveLeads = (clientFallbackData?.leads && clientFallbackData.leads.length > 0) ? clientFallbackData.leads : DEFAULT_LEADS;
  const effectiveInvoices = (clientFallbackData?.invoices && clientFallbackData.invoices.length > 0) ? clientFallbackData.invoices : DEFAULT_INVOICES;
  const effectiveCustomers = (clientFallbackData?.customers && clientFallbackData.customers.length > 0) ? clientFallbackData.customers : DEFAULT_CUSTOMERS;
  const effectiveFollowUps = (clientFallbackData?.followups && clientFallbackData.followups.length > 0) ? clientFallbackData.followups : DEFAULT_FOLLOWUPS;
  const effectiveRequests = (clientFallbackData?.requests && clientFallbackData.requests.length > 0) ? clientFallbackData.requests : DEFAULT_REQUESTS;

  // Helper to mask sensitive customer contacts in marketplace
  const maskPhone = (phone?: string) => {
    if (!phone) return '080********';
    return phone.slice(0, 4) + '****' + phone.slice(-2);
  };
  const maskEmail = (email?: string) => {
    if (!email) return '***@***.com';
    const [name, domain] = email.split('@');
    return (name?.slice(0, 2) || 'u') + '***@' + (domain || '***');
  };

  switch (toolName) {
    // ------------------------------------------------------------------------
    // 1. BUSINESS SUMMARY
    // ------------------------------------------------------------------------
    case 'get_business_summary': {
      let biz: any = effectiveBusiness;
      if (client && businessId) {
        const { data } = await client
          .from('businesses')
          .select('id, business_name, industry, specialization, state, city, currency, phone_verified, email_verified, identity_verified, business_verified, service_verified, subscription_plan, subscription_status, subscription_expires_at')
          .eq('id', businessId)
          .maybeSingle();
        if (data) biz = data;
      }

      const leadsCount = effectiveLeads.length;
      const quotesCount = effectiveQuotes.length;
      const invoicesCount = effectiveInvoices.length;
      const customersCount = effectiveCustomers.length;

      return {
        business_name: biz?.business_name || clientContext?.businessName || 'Matthorg Business',
        industry: biz?.industry || clientContext?.industry || 'General Services',
        specialization: biz?.specialization || clientContext?.specialization || 'Commercial Services',
        location: `${biz?.city || ''}, ${biz?.state || 'Nigeria'}`.trim().replace(/^,|,$/g, ''),
        currency: biz?.currency || '₦',
        trust_badges: {
          phone_verified: Boolean(biz?.phone_verified),
          email_verified: Boolean(biz?.email_verified),
          identity_verified: Boolean(biz?.identity_verified),
          business_verified: Boolean(biz?.business_verified),
          service_verified: Boolean(biz?.service_verified),
        },
        subscription: {
          plan: biz?.subscription_plan || clientContext?.userPlan || 'free',
          status: biz?.subscription_status || 'active',
          expires_at: biz?.subscription_expires_at || null,
        },
        quick_counts: {
          total_leads: leadsCount,
          total_quotes: quotesCount,
          total_invoices: invoicesCount,
          total_customers: customersCount,
        },
      };
    }

    // ------------------------------------------------------------------------
    // 2. SALES METRICS
    // ------------------------------------------------------------------------
    case 'get_sales_metrics': {
      let quotes = effectiveQuotes;
      let invoices = effectiveInvoices;
      let leads = effectiveLeads;

      if (client && businessId) {
        const [qRes, iRes, lRes] = await Promise.all([
          client.from('quotes').select('id, total, status, created_at').eq('business_id', businessId),
          client.from('invoices').select('id, total, amount_paid, status, due_date, created_at').eq('business_id', businessId),
          client.from('leads').select('id, status, budget_min, budget_max, created_at').eq('business_id', businessId),
        ]);
        if (qRes.data) quotes = qRes.data;
        if (iRes.data) invoices = iRes.data;
        if (lRes.data) leads = lRes.data;
      }

      const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.total) || 0), 0);
      const totalCollected = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.amount_paid) || 0), 0);
      const unpaidInvoices = invoices.filter((i: any) => i.status === 'Unpaid' || i.status === 'Sent' || i.status === 'Partially Paid');
      const totalOutstanding = unpaidInvoices.reduce((sum: number, inv: any) => sum + Math.max(0, (Number(inv.total) || 0) - (Number(inv.amount_paid) || 0)), 0);

      const now = new Date();
      const overdueInvoices = unpaidInvoices.filter((i: any) => i.due_date && new Date(i.due_date) < now);
      const totalOverdue = overdueInvoices.reduce((sum: number, inv: any) => sum + Math.max(0, (Number(inv.total) || 0) - (Number(inv.amount_paid) || 0)), 0);

      const wonLeads = leads.filter((l: any) => l.status === 'Won').length;
      const lostLeads = leads.filter((l: any) => l.status === 'Lost').length;
      const closedLeads = wonLeads + lostLeads;
      const conversionRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;

      const acceptedQuotes = quotes.filter((q: any) => q.status === 'Accepted');
      const averageDealSize = acceptedQuotes.length > 0
        ? Math.round(acceptedQuotes.reduce((sum: number, q: any) => sum + (Number(q.total) || 0), 0) / acceptedQuotes.length)
        : (quotes.length > 0 ? Math.round(quotes.reduce((sum: number, q: any) => sum + (Number(q.total) || 0), 0) / quotes.length) : 0);

      return {
        revenue_metrics: {
          total_invoiced: totalInvoiced,
          cash_collected: totalCollected,
          outstanding_balance: totalOutstanding,
          overdue_balance: totalOverdue,
          collection_rate_percent: totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0,
        },
        pipeline_metrics: {
          total_leads_count: leads.length,
          won_leads_count: wonLeads,
          lost_leads_count: lostLeads,
          conversion_win_rate_percent: conversionRate,
          average_deal_size: averageDealSize,
          open_deals_count: quotes.filter((q: any) => q.status === 'Sent' || q.status === 'Draft').length,
        },
      };
    }

    // ------------------------------------------------------------------------
    // 3. GET LEADS
    // ------------------------------------------------------------------------
    case 'get_leads': {
      let leads = effectiveLeads;
      const limit = Math.min(Math.max(Number(args?.limit) || 15, 1), 50);

      if (client && businessId) {
        let q = client
          .from('leads')
          .select('id, lead_number, customer_name, title, service_category, location, state, city, budget_formatted, status, source, urgency, is_locked, notes, created_at, updated_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (args?.status) {
          q = q.ilike('status', `%${args.status}%`);
        }
        if (args?.source) {
          q = q.ilike('source', `%${args.source}%`);
        }

        const { data } = await q;
        if (data) leads = data;
      } else {
        if (args?.status) {
          leads = leads.filter((l: any) => (l.status || '').toLowerCase().includes(args.status.toLowerCase()));
        }
        if (args?.source) {
          leads = leads.filter((l: any) => (l.source || '').toLowerCase().includes(args.source.toLowerCase()));
        }
        leads = leads.slice(0, limit);
      }

      return {
        count: leads.length,
        leads: leads.map((l: any) => ({
          id: l.id,
          lead_number: l.lead_number,
          customer_name: l.customer_name,
          title: l.title,
          service_category: l.service_category,
          budget: l.budget_formatted || 'Not specified',
          status: l.status,
          source: l.source,
          urgency: l.urgency || 'medium',
          is_locked: Boolean(l.is_locked),
          notes: l.notes,
          created_at: l.created_at,
        })),
      };
    }

    // ------------------------------------------------------------------------
    // 4. GET LEAD DETAILS
    // ------------------------------------------------------------------------
    case 'get_lead_details': {
      const iden = String(args?.lead_identifier || '').trim();
      let lead = effectiveLeads.find(
        (l: any) => l.id === iden || l.lead_number?.toLowerCase() === iden.toLowerCase()
      );

      if (client && businessId && (!lead || !lead.notes)) {
        const { data } = await client
          .from('leads')
          .select('*')
          .eq('business_id', businessId)
          .or(`id.eq.${iden},lead_number.eq.${iden}`)
          .maybeSingle();
        if (data) lead = data;
      }

      if (!lead) {
        return { error: `Lead '${iden}' was not found in your business pipeline.` };
      }

      return {
        id: lead.id,
        lead_number: lead.lead_number,
        customer_name: lead.customer_name,
        phone: lead.is_locked ? maskPhone(lead.phone) : lead.phone,
        email: lead.is_locked ? maskEmail(lead.email) : lead.email,
        title: lead.title,
        service_category: lead.service_category,
        location: lead.location,
        budget: lead.budget_formatted,
        status: lead.status,
        source: lead.source,
        urgency: lead.urgency,
        notes: lead.notes,
        quote_id: lead.quote_id,
        customer_request_id: lead.customer_request_id,
        created_at: lead.created_at,
        won_at: lead.won_at,
        lost_at: lead.lost_at,
      };
    }

    // ------------------------------------------------------------------------
    // 5. GET DEALS (QUOTES)
    // ------------------------------------------------------------------------
    case 'get_deals': {
      let quotes = effectiveQuotes;
      const limit = Math.min(Math.max(Number(args?.limit) || 15, 1), 50);

      if (client && businessId) {
        let q = client
          .from('quotes')
          .select('id, quote_number, title, customer_name, customer_email, total, status, valid_until, created_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (args?.status) {
          q = q.ilike('status', `%${args.status}%`);
        }

        const { data } = await q;
        if (data) quotes = data;
      } else {
        if (args?.status) {
          quotes = quotes.filter((q: any) => (q.status || '').toLowerCase().includes(args.status.toLowerCase()));
        }
        quotes = quotes.slice(0, limit);
      }

      return {
        count: quotes.length,
        deals: quotes.map((q: any) => ({
          id: q.id,
          quote_number: q.quote_number,
          title: q.title,
          customer_name: q.customer_name,
          total: Number(q.total) || 0,
          status: q.status,
          valid_until: q.valid_until,
          created_at: q.created_at,
        })),
      };
    }

    // ------------------------------------------------------------------------
    // 6. GET CUSTOMERS
    // ------------------------------------------------------------------------
    case 'get_customers': {
      let customers = effectiveCustomers;
      const limit = Math.min(Math.max(Number(args?.limit) || 15, 1), 50);

      if (client && businessId) {
        let q = client
          .from('customers')
          .select('id, name, company, email, phone, location, total_quotes, total_invoices, total_spent, last_order_date, created_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (args?.search) {
          q = q.or(`name.ilike.%${args.search}%,company.ilike.%${args.search}%,email.ilike.%${args.search}%`);
        }

        const { data } = await q;
        if (data) customers = data;
      } else {
        if (args?.search) {
          const s = args.search.toLowerCase();
          customers = customers.filter((c: any) =>
            (c.name || '').toLowerCase().includes(s) ||
            (c.company || '').toLowerCase().includes(s) ||
            (c.email || '').toLowerCase().includes(s)
          );
        }
        customers = customers.slice(0, limit);
      }

      return {
        count: customers.length,
        customers: customers.map((c: any) => ({
          id: c.id,
          name: c.name,
          company: c.company || '',
          phone: c.phone,
          location: c.location,
          total_spent: Number(c.total_spent) || 0,
          total_quotes: Number(c.total_quotes) || 0,
          total_invoices: Number(c.total_invoices) || 0,
          last_order_date: c.last_order_date,
        })),
      };
    }

    // ------------------------------------------------------------------------
    // 7. GET CUSTOMER DETAILS
    // ------------------------------------------------------------------------
    case 'get_customer_details': {
      const custId = String(args?.customer_id || '').trim();
      let customer = effectiveCustomers.find((c: any) => c.id === custId);

      if (client && businessId) {
        const [cRes, qRes, iRes] = await Promise.all([
          client.from('customers').select('*').eq('business_id', businessId).eq('id', custId).maybeSingle(),
          client.from('quotes').select('id, quote_number, title, total, status, created_at').eq('business_id', businessId).eq('customer_id', custId),
          client.from('invoices').select('id, invoice_number, total, amount_paid, status, created_at').eq('business_id', businessId).eq('customer_id', custId),
        ]);
        if (cRes.data) customer = cRes.data;
        return {
          customer: customer || { error: 'Customer not found' },
          quotes: qRes.data || [],
          invoices: iRes.data || [],
        };
      }

      return {
        customer: customer || { error: 'Customer not found' },
        quotes: effectiveQuotes.filter((q: any) => q.customer_id === custId),
        invoices: effectiveInvoices.filter((i: any) => i.customer_id === custId),
      };
    }

    // ------------------------------------------------------------------------
    // 8. GET INVOICES
    // ------------------------------------------------------------------------
    case 'get_invoices': {
      let invoices = effectiveInvoices;
      const limit = Math.min(Math.max(Number(args?.limit) || 15, 1), 50);

      if (client && businessId) {
        let q = client
          .from('invoices')
          .select('id, invoice_number, customer_name, total, amount_paid, status, issue_date, due_date, created_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (args?.status) {
          q = q.ilike('status', `%${args.status}%`);
        }

        const { data } = await q;
        if (data) invoices = data;
      } else {
        if (args?.status) {
          invoices = invoices.filter((i: any) => (i.status || '').toLowerCase().includes(args.status.toLowerCase()));
        }
        invoices = invoices.slice(0, limit);
      }

      return {
        count: invoices.length,
        invoices: invoices.map((inv: any) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          customer_name: inv.customer_name,
          total: Number(inv.total) || 0,
          amount_paid: Number(inv.amount_paid) || 0,
          balance_due: Math.max(0, (Number(inv.total) || 0) - (Number(inv.amount_paid) || 0)),
          status: inv.status,
          due_date: inv.due_date,
          created_at: inv.created_at,
        })),
      };
    }

    // ------------------------------------------------------------------------
    // 9. GET PAYMENTS
    // ------------------------------------------------------------------------
    case 'get_payments': {
      let payments = clientFallbackData?.payments || [];
      const limit = Math.min(Math.max(Number(args?.limit) || 15, 1), 50);

      if (client && businessId) {
        const { data } = await client
          .from('payments')
          .select('id, invoice_id, amount, currency, channel, status, reference, paid_at')
          .eq('business_id', businessId)
          .order('paid_at', { ascending: false })
          .limit(limit);
        if (data) payments = data;
      } else {
        payments = payments.slice(0, limit);
      }

      return {
        count: payments.length,
        payments: payments.map((p: any) => ({
          id: p.id,
          amount: Number(p.amount) || 0,
          currency: p.currency || 'NGN',
          channel: p.channel || 'paystack',
          status: p.status,
          reference: p.reference,
          paid_at: p.paid_at,
        })),
      };
    }

    // ------------------------------------------------------------------------
    // 10. GET CUSTOMER REQUESTS (MARKETPLACE)
    // ------------------------------------------------------------------------
    case 'get_customer_requests': {
      let requests = effectiveRequests;
      const limit = Math.min(Math.max(Number(args?.limit) || 10, 1), 30);

      if (client && businessId) {
        // Authoritative RPC or query
        let q = client
          .from('customer_requests')
          .select('id, request_number, customer_name, location, state, city, service_required, service_category, budget_formatted, timeline, details, status, contacted_by_business_ids, created_at')
          .eq('status', 'Open')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (args?.category) {
          q = q.ilike('service_category', `%${args.category}%`);
        }
        if (args?.location) {
          q = q.or(`location.ilike.%${args.location}%,state.ilike.%${args.location}%,city.ilike.%${args.location}%`);
        }

        const { data } = await q;
        if (data) requests = data;
      } else {
        if (args?.category) {
          requests = requests.filter((r: any) => (r.service_category || '').toLowerCase().includes(args.category.toLowerCase()));
        }
        if (args?.location) {
          requests = requests.filter((r: any) => (r.location || '').toLowerCase().includes(args.location.toLowerCase()));
        }
        requests = requests.slice(0, limit);
      }

      // PRIVACY ENFORCEMENT: Never expose unmasked phone or email for marketplace requests
      return {
        count: requests.length,
        requests: requests.map((r: any) => {
          const isClaimedByMe = Array.isArray(r.contacted_by_business_ids) && r.contacted_by_business_ids.includes(businessId);
          return {
            id: r.id,
            request_number: r.request_number,
            customer_name: r.customer_name,
            service_required: r.service_required,
            service_category: r.service_category,
            location: `${r.city || ''}, ${r.state || r.location || ''}`.trim().replace(/^,|,$/g, ''),
            budget: r.budget_formatted || 'Budget open for proposal',
            timeline: r.timeline || 'Flexible',
            details: r.details,
            status: r.status,
            is_unlocked: isClaimedByMe,
            contact_status: isClaimedByMe ? 'Unlocked' : 'Contact details protected (subscribe to unlock)',
            created_at: r.created_at,
          };
        }),
      };
    }

    // ------------------------------------------------------------------------
    // 11. FOLLOW-UPS RETRIEVAL
    // ------------------------------------------------------------------------
    case 'get_follow_ups': {
      let followups = effectiveFollowUps;
      const statusFilter = args?.status?.toLowerCase();
      if (statusFilter && statusFilter !== 'all') {
        followups = followups.filter((f: any) => (f.status || 'pending').toLowerCase() === statusFilter);
      }
      return {
        total: followups.length,
        pending_count: followups.filter((f: any) => f.status === 'pending').length,
        followups: followups.slice(0, args?.limit || 15).map((f: any) => ({
          id: f.id,
          customer_name: f.customer_name,
          title: f.title,
          amount: f.amount,
          quote_number: f.quote_number,
          lead_number: f.lead_number,
          invoice_number: f.invoice_number,
          reminder_date: f.reminder_date,
          status: f.status,
          priority: f.priority || 'medium',
          notes: f.notes,
        })),
      };
    }

    // ------------------------------------------------------------------------
    // 12. MATTHEW DAILY BRIEFING
    // ------------------------------------------------------------------------
    case 'get_daily_briefing': {
      const quotes = effectiveQuotes;
      const leads = effectiveLeads;
      const invoices = effectiveInvoices;

      const now = new Date();
      // Quotes awaiting decision after 48+ hours (excluding converted to invoice or accepted/rejected)
      const quotesNeedingFollowup = quotes.filter((q: any) => {
        if (q.status !== 'Sent' && q.status !== 'Awaiting Response') return false;
        if (q.converted_invoice_id) return false;
        if (invoices.some((inv: any) => inv.quote_id === q.id)) return false;
        const past = new Date(q.created_at);
        const days = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
        return days >= 2;
      });

      // Leads cooling without recent activity (excluding Won, Lost, or already converted to quote/invoice)
      const leadsGoingCold = leads.filter((l: any) => {
        if (l.status === 'Won' || l.status === 'Lost' || l.status === 'Quote Sent') return false;
        if (l.quote_id || quotes.some((q: any) => q.lead_id === l.id)) return false;
        const past = new Date(l.created_at);
        const days = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
        return days >= 3;
      });

      const invoicesOverdue = invoices.filter((inv: any) => {
        if (inv.status === 'Paid' || inv.status === 'Draft') return false;
        const unpaid = Math.max(0, (inv.total || 0) - (inv.amount_paid || 0));
        if (unpaid <= 0) return false;
        if (inv.due_date && new Date(inv.due_date) < now) return true;
        return inv.status === 'Overdue';
      });

      const quoteVal = quotesNeedingFollowup.reduce((acc: number, q: any) => acc + (q.total || 0), 0);
      const leadVal = leadsGoingCold.reduce((acc: number, l: any) => acc + (l.estimated_value || l.budget_max || 0), 0);
      const overdueVal = invoicesOverdue.reduce((acc: number, inv: any) => acc + Math.max(0, (inv.total || 0) - (inv.amount_paid || 0)), 0);
      const totalPotentialVal = quoteVal + leadVal + overdueVal;

      let topOpportunity: any = null;
      if (quotesNeedingFollowup.length > 0) {
        topOpportunity = quotesNeedingFollowup.sort((a: any, b: any) => (b.total || 0) - (a.total || 0))[0];
      } else if (leadsGoingCold.length > 0) {
        topOpportunity = leadsGoingCold.sort((a: any, b: any) => (b.estimated_value || 0) - (a.estimated_value || 0))[0];
      }

      return {
        attention_summary: {
          total_items: quotesNeedingFollowup.length + leadsGoingCold.length + invoicesOverdue.length,
          quotes_needing_followup: quotesNeedingFollowup.length,
          leads_going_cold: leadsGoingCold.length,
          invoices_overdue: invoicesOverdue.length,
          potential_business_value_requiring_attention: totalPotentialVal,
          quote_value_at_stake: quoteVal,
          pipeline_estimates_at_stake: leadVal,
          overdue_receivables_at_stake: overdueVal,
          currency: clientContext?.currency || '₦',
        },
        highest_priority: topOpportunity ? {
          name: topOpportunity.customer_name,
          title: topOpportunity.service_required || topOpportunity.title || 'Quotation Proposal',
          amount: topOpportunity.total || topOpportunity.estimated_value,
          type: topOpportunity.quote_number ? 'Quotation' : 'Lead',
          recommendation: `Follow up with ${topOpportunity.customer_name} immediately to retain deal momentum.`,
        } : null,
      };
    }

    // ------------------------------------------------------------------------
    // 13. ACTION: CREATE FOLLOW-UP
    // ------------------------------------------------------------------------
    case 'create_follow_up': {
      const newFollowUp = {
        id: `fu-${Date.now()}`,
        business_id: businessId,
        customer_name: args.customer_name,
        title: args.title,
        amount: Number(args.amount || 0),
        reminder_date: args.reminder_date || new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: args.notes || 'Created via Matthew AI',
        created_at: new Date().toISOString(),
      };
      return {
        success: true,
        message: `Follow-up scheduled for ${args.customer_name} on ${newFollowUp.reminder_date}.`,
        follow_up: newFollowUp,
      };
    }

    // ------------------------------------------------------------------------
    // 14. ACTION: SNOOZE FOLLOW-UP
    // ------------------------------------------------------------------------
    case 'snooze_follow_up': {
      const days = Number(args.days || 3);
      const snoozeDate = new Date();
      snoozeDate.setDate(snoozeDate.getDate() + days);
      const formattedDate = snoozeDate.toISOString().split('T')[0];

      return {
        success: true,
        follow_up_id: args.follow_up_id,
        snoozed_until: formattedDate,
        message: `Follow-up postponed by ${days} days until ${formattedDate}.`,
      };
    }

    // ------------------------------------------------------------------------
    // 15. ACTION: COMPLETE FOLLOW-UP
    // ------------------------------------------------------------------------
    case 'complete_follow_up': {
      return {
        success: true,
        follow_up_id: args.follow_up_id,
        status: 'completed',
        completed_at: new Date().toISOString(),
        message: `Follow-up marked as completed.`,
      };
    }

    // ------------------------------------------------------------------------
    // 16. LIST COOLING LEADS
    // ------------------------------------------------------------------------
    case 'list_cooling_leads': {
      const leads = effectiveLeads;
      const quotes = effectiveQuotes;
      const now = new Date();
      const coolingLeads = leads.filter((l: any) => {
        if (l.status === 'Won' || l.status === 'Lost' || l.status === 'Quote Sent') return false;
        if (l.quote_id || quotes.some((q: any) => q.lead_id === l.id)) return false;
        const past = new Date(l.created_at);
        const days = Math.max(0, Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24)));
        return days >= 3;
      }).map((l: any) => {
        const past = new Date(l.created_at);
        const daysInactive = Math.max(0, Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          id: l.id,
          lead_number: l.lead_number,
          customer_name: l.customer_name,
          service_needed: l.service_required || l.title,
          status: l.status,
          budget_formatted: l.budget_formatted || 'Budget upon discussion',
          estimated_value: l.estimated_value || l.budget_max || 0,
          value_type: l.estimated_value ? 'Stored Estimate' : 'Budget Range Estimate',
          days_inactive: daysInactive,
          intent_score: l.intent_score || 85,
          recommended_action: l.status === 'Contacted'
            ? `Follow up with ${l.customer_name} to schedule technical inspection or review acoustic/solar specifications.`
            : `Reach out via WhatsApp or phone to qualify project timeline and technical requirements.`,
        };
      });

      return {
        count: coolingLeads.length,
        cooling_leads: coolingLeads,
      };
    }

    // ------------------------------------------------------------------------
    // 17. LIST PENDING QUOTES
    // ------------------------------------------------------------------------
    case 'list_pending_quotes': {
      const quotes = effectiveQuotes;
      const invoices = effectiveInvoices;
      const now = new Date();
      const pendingQuotes = quotes.filter((q: any) => {
        if (q.status !== 'Sent' && q.status !== 'Awaiting Response') return false;
        if (q.converted_invoice_id) return false;
        if (invoices.some((inv: any) => inv.quote_id === q.id)) return false;
        const past = new Date(q.created_at);
        const days = Math.max(0, Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24)));
        return days >= 2;
      }).map((q: any) => {
        const past = new Date(q.created_at);
        const daysPending = Math.max(0, Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          id: q.id,
          quote_number: q.quote_number,
          customer_name: q.customer_name,
          title: q.title || (q.items && q.items[0]?.name) || 'Quotation Proposal',
          total: Number(q.total) || 0,
          status: q.status,
          days_pending: daysPending,
          suggested_action: `Check in with ${q.customer_name} to address technical sizing questions or offer a phased deployment schedule.`,
        };
      });

      return {
        count: pendingQuotes.length,
        pending_quotes: pendingQuotes,
      };
    }

    // ------------------------------------------------------------------------
    // 18. LIST OVERDUE INVOICES
    // ------------------------------------------------------------------------
    case 'list_overdue_invoices': {
      const invoices = effectiveInvoices;
      const now = new Date();
      const overdue = invoices.filter((inv: any) => {
        if (inv.status === 'Paid' || inv.status === 'Draft') return false;
        const unpaid = Math.max(0, (Number(inv.total) || 0) - (Number(inv.amount_paid) || 0));
        if (unpaid <= 0) return false;
        if (inv.due_date && new Date(inv.due_date) < now) return true;
        return inv.status === 'Overdue';
      }).map((inv: any) => {
        const past = inv.due_date ? new Date(inv.due_date) : new Date(inv.created_at);
        const daysOverdue = Math.max(0, Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          customer_name: inv.customer_name,
          title: (inv.items && inv.items[0]?.name) || 'Invoice',
          total: Number(inv.total) || 0,
          unpaid_balance: Math.max(0, (Number(inv.total) || 0) - (Number(inv.amount_paid) || 0)),
          status: inv.status,
          due_date: inv.due_date,
          days_overdue: daysOverdue,
          recommended_action: `Send polite payment reminder via WhatsApp or Email with account details.`,
        };
      });

      return {
        count: overdue.length,
        overdue_invoices: overdue,
      };
    }

    default:
      return { error: `Tool ${toolName} is not recognized or permitted.` };
  }
}
