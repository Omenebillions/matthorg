/**
 * MATTHORG — MATTHEW CLIENT SDK
 * Client-side interface to Matthew AI Sales & Business Intelligence
 */

import { AppState, MatthewMessage } from '../types';
import { getRegisteredBusinesses } from '../data/professionalsData';

export interface SendMatthewMessageParams {
  message: string;
  history: MatthewMessage[];
  state: AppState;
}

export interface MatthewApiResult {
  success: boolean;
  message: string;
  model: string;
  engine: 'openai' | 'gemini';
  tool_calls_executed: string[];
  citations: Array<{ type: 'lead' | 'deal' | 'invoice' | 'customer' | 'metric' | 'marketplace'; title: string; detail?: string }>;
  is_out_of_domain?: boolean;
}

export async function sendMatthewMessage({
  message,
  history,
  state,
}: SendMatthewMessageParams): Promise<MatthewMessage> {
  const business = state.business;
  const businessId = business.id || 'local-business';

  // Extract minimal client fallback state for tenant isolation
  const clientContext = {
    businessName: business.business_name,
    industry: business.industry,
    specialization: business.specialization,
    currency: business.currency,
    userPlan: state.user.plan,
    leadsCount: (state.leads || []).length,
    quotesCount: (state.quotes || []).length,
    invoicesCount: (state.invoices || []).length,
    customersCount: (state.customers || []).length,
  };

  const clientFallbackData = {
    business: {
      id: business.id,
      business_name: business.business_name,
      industry: business.industry,
      specialization: business.specialization,
      state: business.state,
      city: business.city,
      currency: business.currency,
      phone_verified: business.phone_verified,
      email_verified: business.email_verified,
      identity_verified: business.identity_verified,
      business_verified: business.business_verified,
      service_verified: business.service_verified,
      subscription_plan: business.subscription_plan || state.user.plan,
      subscription_status: business.subscription_status,
      subscription_expires_at: business.subscription_expires_at,
    },
    leads: (state.leads || []).slice(0, 50),
    quotes: (state.quotes || []).slice(0, 50),
    invoices: (state.invoices || []).slice(0, 50),
    customers: (state.customers || []).slice(0, 50),
    allRegisteredBusinesses: getRegisteredBusinesses(business),
  };

  const historyPayload = (history || []).slice(-8).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const payload = JSON.stringify({
    message: message.trim(),
    history: historyPayload,
    businessId,
    clientContext,
    clientFallbackData,
  });

  // Attempt fetch with 1 automatic retry on network failure
  let lastErr: any = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const res = await fetch('/api/matthew/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errMessage = 'Failed to reach Matthew AI service.';
        try {
          const errData = await res.json();
          if (errData?.error) errMessage = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const data: MatthewApiResult = await res.json();

      return {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString(),
        is_out_of_domain: Boolean(data.is_out_of_domain),
        tool_calls_executed: data.tool_calls_executed || [],
        citations: data.citations || [],
        model: data.model,
        engine: data.engine,
      };
    } catch (err: any) {
      lastErr = err;
      const isNetworkError = err?.name === 'TypeError' || err?.message?.includes('fetch') || err?.name === 'AbortError';
      if (isNetworkError && attempt === 1) {
        // Wait 1 second and retry once
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      break;
    }
  }

  // Resilient fallback: If server endpoint returned 404 or network was interrupted,
  // Matthew still responds constructively using real client pipeline data instead of throwing a blank error.
  console.info('[Matthew AI] Server chat endpoint unavailable or offline, activating client-side sales intelligence engine.');
  const fallbackReply = generateLocalMatthewFallback(message, state);
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    role: 'assistant',
    content: fallbackReply,
    created_at: new Date().toISOString(),
    is_out_of_domain: false,
    tool_calls_executed: ['local_pipeline_audit'],
    citations: [],
    model: 'Matthew Local Intelligence',
    engine: 'local',
  };
}

/**
 * Intelligent local sales briefing generator for offline/fallback scenarios
 */
function generateLocalMatthewFallback(query: string, state: AppState): string {
  const biz = state.business;
  const currency = biz.currency || '₦';
  const pendingQuotes = (state.quotes || []).filter((q) => q.status === 'Sent' || q.status === 'Draft' || q.status === 'Awaiting Response');
  const quotesTotal = pendingQuotes.reduce((acc, q) => acc + (q.total || 0), 0);
  const overdueInvoices = (state.invoices || []).filter((i) => i.status === 'Overdue' || (i.status === 'Sent' && new Date(i.due_date) < new Date()));
  const invoiceTotal = overdueInvoices.reduce((acc, i) => acc + (i.total || 0), 0);
  const leads = state.leads || [];

  const qLower = query.toLowerCase();

  if (qLower.includes('lead') || qLower.includes('prospect')) {
    if (leads.length === 0) {
      return `### 🎯 Lead Pipeline Status for ${biz.business_name}\n\nYou currently have no active incoming leads. When customers post service requests in your coverage area, they will appear directly in your workspace. You can also manually add prospective clients via the **Leads** tab.`;
    }
    const leadHighlights = leads.slice(0, 3).map((l) => `- **${l.customer_name}** (${l.location || 'Local'}): *${l.service_required}*`).join('\n');
    return `### 🎯 Lead Pipeline Review for ${biz.business_name}\n\nYou have **${leads.length} active leads** in your pipeline:\n\n${leadHighlights}\n\n**Recommendation:** Re-engage top prospects with customized proposals to accelerate deal velocity.`;
  }

  if (qLower.includes('quote') || qLower.includes('quotation')) {
    if (pendingQuotes.length === 0) {
      return `### 📋 Quotation Status for ${biz.business_name}\n\nAll current quotations are up to date. You can draft a new professional price quotation or proposal anytime using the **New Quotation** action.`;
    }
    const quoteList = pendingQuotes.slice(0, 3).map((q) => `- **${q.quote_number}** for **${q.customer_name}**: ${currency}${Number(q.total).toLocaleString()} (${q.status})`).join('\n');
    return `### 📋 Quotation Pipeline for ${biz.business_name}\n\nYou have **${pendingQuotes.length} pending quotations** representing **${currency}${Number(quotesTotal).toLocaleString()}** in potential revenue:\n\n${quoteList}\n\n**Next Steps:** Sending courteous WhatsApp check-ins 48 hours after proposal submission typically improves acceptance rates by over 40%.`;
  }

  if (qLower.includes('invoice') || qLower.includes('payment') || qLower.includes('cash') || qLower.includes('money')) {
    if (overdueInvoices.length === 0) {
      return `### 💳 Cash Collection & Invoicing for ${biz.business_name}\n\nGreat news! You have **0 overdue invoices**. All active invoices are either collected or within standard payment terms.`;
    }
    const invList = overdueInvoices.slice(0, 3).map((i) => `- **${i.invoice_number}** for **${i.customer_name}**: ${currency}${Number(i.total).toLocaleString()}`).join('\n');
    return `### 💳 Cash Collection Notice for ${biz.business_name}\n\nYou have **${overdueInvoices.length} invoices requiring follow-up** totaling **${currency}${Number(invoiceTotal).toLocaleString()}**:\n\n${invList}\n\n**Next Steps:** Send a gentle reminder with your bank account details attached.`;
  }

  // General Commercial Briefing
  return `### 📊 Commercial Activity & Opportunity Briefing for ${biz.business_name}\n\n**What I found**\n- **${pendingQuotes.length} Quotation(s) Awaiting Decision**: Valued at **${currency}${Number(quotesTotal).toLocaleString()}**.\n- **${leads.length} Active Leads**: Ready for qualification and proposal submission.\n- **${overdueInvoices.length} Invoices Requiring Follow-Up**: Valued at **${currency}${Number(invoiceTotal).toLocaleString()}**.\n\n**What it means**\nYour business has immediate revenue opportunities ready to convert. Prioritizing follow-ups on submitted proposals and overdue collections protects your operating cash flow.\n\n**Recommended Next Actions**\n1. Review your pending quotations and send a prompt status check.\n2. Reach out to new customer leads to understand project timelines.\n3. Send payment reminders on completed service deliverables.\n\nWould you like me to help draft an outreach message or inspect a specific deal?`;
}
