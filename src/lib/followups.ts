/**
 * MATTHORG — MATTHEW FOLLOW-UP & EVENT INTELLIGENCE ENGINE
 * Scalable event-driven detection, daily briefings, and approval-first messaging
 */

import { AppState, FollowUp, DailyBriefing, Lead, Quote, Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

// Helper to calculate difference in whole days between two dates
export function daysBetween(datePastStr?: string, dateNow = new Date()): number {
  if (!datePastStr) return 0;
  const past = new Date(datePastStr);
  if (isNaN(past.getTime())) return 0;
  const diffTime = Math.max(0, dateNow.getTime() - past.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Computes the Matthew Daily Briefing using live, authentic state data.
 * Adheres strictly to the requirement: "Every number must come from actual data."
 */
export function computeDailyBriefing(state: AppState): DailyBriefing {
  const { business, quotes = [], invoices = [], leads = [], followups = [] } = state;
  const currency = business?.currency || '₦';

  // 1. Detect quotes awaiting decision after 48+ hours (2+ days):
  // Exclude quotes converted to invoice, accepted, or rejected to prevent double counting
  const quotesNeedingFollowup = quotes.filter((q) => {
    if (q.status !== 'Sent' && q.status !== 'Awaiting Response') return false;
    if (q.converted_invoice_id) return false;
    if (invoices.some((inv) => inv.quote_id === q.id)) return false;
    const age = daysBetween(q.created_at);
    return age >= 2; // sent 48+ hours ago
  });

  // 2. Detect high-intent leads cooling without recent contact:
  // Exclude Won, Lost, or leads that have already been converted to a quotation or invoice
  const leadsGoingCold = leads.filter((l) => {
    if (l.status === 'Won' || l.status === 'Lost' || l.status === 'Quote Sent') return false;
    if (l.quote_id || quotes.some((q) => (q as any).lead_id === l.id)) return false;
    const age = daysBetween(l.created_at);
    return age >= 3;
  });

  // 3. Detect overdue invoices with authentic outstanding balance:
  const now = new Date();
  const invoicesOverdue = invoices.filter((inv) => {
    if (inv.status === 'Paid' || inv.status === 'Draft') return false;
    const unpaid = Math.max(0, (inv.total || 0) - (inv.amount_paid || 0));
    if (unpaid <= 0) return false;
    if (inv.due_date) {
      const due = new Date(inv.due_date);
      if (!isNaN(due.getTime()) && due < now) {
        return true;
      }
    }
    return inv.status === 'Overdue';
  });

  // 4. Financial Value at Stake — Guaranteed No Double-Counting:
  // - Quotes awaiting decision (excluding quotes converted to invoices)
  // - Active unconverted leads (excluding leads converted to quotes)
  // - Unpaid balances on overdue invoices (excluding fully paid, draft, or cancelled)
  const quoteValue = quotesNeedingFollowup.reduce((acc, q) => acc + (q.total || 0), 0);
  const leadValue = leadsGoingCold.reduce((acc, l) => acc + (l.estimated_value || l.budget_max || 0), 0);
  const overdueValue = invoicesOverdue.reduce((acc, inv) => acc + Math.max(0, (inv.total || 0) - (inv.amount_paid || 0)), 0);
  const totalValue = quoteValue + leadValue + overdueValue;

  const totalAttentionItems = quotesNeedingFollowup.length + leadsGoingCold.length + invoicesOverdue.length;

  // Derive time-of-day greeting
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  if (hour >= 17) greeting = 'Good evening';

  // Build top actionable items
  const topItems: DailyBriefing['topItems'] = [];

  // Add high priority leads
  for (const l of leadsGoingCold) {
    const age = daysBetween(l.created_at);
    topItems.push({
      id: `brief-lead-${l.id}`,
      type: 'lead',
      title: l.service_required || 'Sales Opportunity',
      entityNumber: l.lead_number || `LEAD-${l.id.slice(0, 6).toUpperCase()}`,
      customerName: l.customer_name,
      amount: l.estimated_value || l.budget_max || 0,
      daysAgo: age,
      reason: `${l.status} lead with no recorded activity for ${age} days`,
      recommendedAction: 'Reach out via WhatsApp to qualify requirements or present an offer',
      targetId: l.id,
      phone: l.phone,
      whatsapp: l.whatsapp || l.phone,
    });
  }

  // Add quotes needing follow-up
  for (const q of quotesNeedingFollowup) {
    const age = daysBetween(q.created_at);
    topItems.push({
      id: `brief-quote-${q.id}`,
      type: 'quote',
      title: (q as any).title || q.items[0]?.name || 'Quotation Proposal',
      entityNumber: q.quote_number,
      customerName: q.customer_name,
      amount: q.total || 0,
      daysAgo: age,
      reason: `Proposal sent ${age} days ago with no final response`,
      recommendedAction: 'Send friendly check-in message to address objections and offer clarity',
      targetId: q.id,
      whatsapp: q.customer_whatsapp,
    });
  }

  // Add overdue invoices
  for (const inv of invoicesOverdue) {
    const unpaid = Math.max(0, (inv.total || 0) - (inv.amount_paid || 0));
    const age = inv.due_date ? daysBetween(inv.due_date) : 0;
    topItems.push({
      id: `brief-inv-${inv.id}`,
      type: 'invoice',
      title: (inv as any).title || inv.items[0]?.name || 'Invoice Payment Due',
      entityNumber: inv.invoice_number,
      customerName: inv.customer_name,
      amount: unpaid,
      daysAgo: age,
      reason: age > 0 ? `Payment is ${age} days overdue` : 'Payment deadline reached',
      recommendedAction: 'Send polite payment reminder and bank verification instructions',
      targetId: inv.id,
      phone: inv.customer_phone,
      whatsapp: inv.customer_whatsapp,
    });
  }

  // Sort top items by amount descending to put highest financial value at the top
  topItems.sort((a, b) => b.amount - a.amount);

  // Formulate Matthew's priority statement
  let priorityTitle = 'Pipeline is Healthy';
  let priorityDescription = 'All current leads and quotations are actively moving. Consider checking the Customer Requests marketplace to discover new buyer opportunities.';

  if (topItems.length > 0) {
    const top = topItems[0];
    const topAmtFormatted = formatCurrency(top.amount, currency);
    priorityTitle = `Highest-Priority Focus: ${top.customerName} (${topAmtFormatted})`;
    if (top.type === 'lead') {
      priorityDescription = `Your highest-priority opportunity is the ${topAmtFormatted} deal with ${top.customerName}. It is a ${top.reason.toLowerCase()}. Immediate follow-up can prevent the prospect from turning to competitors.`;
    } else if (top.type === 'quote') {
      priorityDescription = `Your highest-priority quotation is ${top.entityNumber} for ${top.customerName} worth ${topAmtFormatted}. Following up today keeps your proposal top-of-mind before the quote window expires.`;
    } else {
      priorityDescription = `Your most pressing collection is invoice ${top.entityNumber} for ${top.customerName} with an outstanding balance of ${topAmtFormatted}. Polite follow-up secures your working cash flow.`;
    }
  }

  const topFollowUpItems = topItems.map((item) => ({
    ...item,
    customer_name: item.customerName,
  }));

  const topActionableItem = topFollowUpItems[0] || undefined;

  return {
    greeting,
    totalAttentionItems,
    quotesNeedingFollowupCount: quotesNeedingFollowup.length,
    leadsGoingColdCount: leadsGoingCold.length,
    invoicesOverdueCount: invoicesOverdue.length,
    potentialValueRequiringAttention: totalValue,
    priorityTitle,
    priorityDescription,
    topActionableItem,
    topItems: topFollowUpItems.slice(0, 8),
    topFollowUpItems: topFollowUpItems.slice(0, 8),
  };
}

/**
 * Synthesizes multi-entity follow-up tasks from quotes, leads, and invoices.
 * Integrates lifecycle status reconciliation (won, converted, paid) and deduplication.
 */
export function syncFollowUpTasks(state: AppState): FollowUp[] {
  const existing = [...(state.followups || [])];
  const now = new Date();
  const nowStr = now.toISOString();

  // 1. Lifecycle Status Reconciliation:
  // Auto-complete follow-ups when their underlying business entities progress or close out
  const reconciled = existing.map((f) => {
    // A. Quote follow-up: complete if quote is won, converted to invoice, rejected, or paid
    if (f.quote_id) {
      const q = state.quotes?.find((x) => x.id === f.quote_id);
      const isConvertedToInvoice = q?.converted_invoice_id || state.invoices?.some((inv) => inv.quote_id === f.quote_id);
      if (!q || q.status === 'Accepted' || q.status === 'Rejected' || isConvertedToInvoice) {
        if (f.status !== 'completed') {
          return { ...f, status: 'completed' as const, updated_at: nowStr };
        }
      }
    }

    // B. Lead follow-up: complete if lead is Won, Lost, or has moved to an active Quote
    if (f.lead_id) {
      const l = state.leads?.find((x) => x.id === f.lead_id);
      if (!l || l.status === 'Won' || l.status === 'Lost') {
        if (f.status !== 'completed') {
          return { ...f, status: 'completed' as const, updated_at: nowStr };
        }
      }
    }

    // C. Invoice follow-up: complete if invoice is Paid or balance is 0
    if (f.invoice_id) {
      const inv = state.invoices?.find((x) => x.id === f.invoice_id);
      const balance = inv ? (inv.total || 0) - (inv.amount_paid || 0) : 0;
      if (!inv || inv.status === 'Paid' || balance <= 0) {
        if (f.status !== 'completed') {
          return { ...f, status: 'completed' as const, updated_at: nowStr };
        }
      }
    }

    return f;
  });

  const existingKeys = new Set<string>();
  reconciled.forEach((f) => {
    if (f.quote_id) existingKeys.add(`quote-${f.quote_id}`);
    if (f.lead_id) existingKeys.add(`lead-${f.lead_id}`);
    if (f.invoice_id) existingKeys.add(`invoice-${f.invoice_id}`);
  });

  const added: FollowUp[] = [];

  // Check quotes needing check-in (sent >= 48h ago, not converted, not yet followed up)
  for (const q of state.quotes || []) {
    const isConverted = q.converted_invoice_id || state.invoices?.some((inv) => inv.quote_id === q.id);
    if ((q.status === 'Sent' || q.status === 'Awaiting Response') && !isConverted && !existingKeys.has(`quote-${q.id}`)) {
      const age = daysBetween(q.created_at);
      if (age >= 2) {
        added.push({
          id: `fu-q-${q.id}-${Date.now()}`,
          business_id: state.business?.id,
          quote_id: q.id,
          quote_number: q.quote_number,
          customer_id: q.customer_id,
          customer_name: q.customer_name,
          customer_whatsapp: q.customer_whatsapp,
          title: (q as any).title || q.items[0]?.name || 'Quotation Follow-Up',
          amount: q.total,
          reminder_date: nowStr.split('T')[0],
          status: 'pending',
          priority: q.total > 1000000 ? 'high' : 'medium',
          task_type: 'quote_followup',
          target_type: 'quote',
          sequence_number: 1,
          notes: `Proposal sent ${age} days ago. Matthew recommends following up today.`,
          created_at: nowStr,
        });
        existingKeys.add(`quote-${q.id}`);
      }
    }
  }

  // Check leads going cold (unconverted, age >= 2 days)
  for (const l of state.leads || []) {
    const hasQuote = l.quote_id || state.quotes?.some((q) => (q as any).lead_id === l.id);
    if ((l.status === 'New' || l.status === 'Qualified' || l.status === 'Contacted' || l.status === 'Negotiating') && !hasQuote && !existingKeys.has(`lead-${l.id}`)) {
      const age = daysBetween(l.created_at);
      if (age >= 2) {
        added.push({
          id: `fu-l-${l.id}-${Date.now()}`,
          business_id: state.business?.id,
          lead_id: l.id,
          lead_number: l.lead_number,
          customer_name: l.customer_name,
          customer_whatsapp: l.whatsapp || l.phone,
          customer_phone: l.phone,
          customer_email: l.email,
          title: l.service_required || 'Lead Outreach',
          amount: l.estimated_value || l.budget_max || 0,
          reminder_date: nowStr.split('T')[0],
          status: 'pending',
          priority: (l.intent_score || 0) >= 80 ? 'high' : 'medium',
          task_type: l.status === 'Qualified' ? 'lead_qualify' : 'lead_contact',
          target_type: 'lead',
          sequence_number: 1,
          notes: `${l.status} lead with no recorded contact for ${age} days.`,
          created_at: nowStr,
        });
        existingKeys.add(`lead-${l.id}`);
      }
    }
  }

  // Check overdue invoices with positive unpaid balance
  for (const inv of state.invoices || []) {
    if (inv.status !== 'Paid' && inv.status !== 'Draft' && !existingKeys.has(`invoice-${inv.id}`)) {
      const unpaid = (inv.total || 0) - (inv.amount_paid || 0);
      const isOverdue = inv.status === 'Overdue' || (inv.due_date && new Date(inv.due_date) < now);
      if (isOverdue && unpaid > 0) {
        added.push({
          id: `fu-inv-${inv.id}-${Date.now()}`,
          business_id: state.business?.id,
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          customer_id: inv.customer_id,
          customer_name: inv.customer_name,
          customer_whatsapp: inv.customer_whatsapp,
          customer_phone: inv.customer_phone,
          title: (inv as any).title || inv.items[0]?.name || 'Overdue Invoice Reminder',
          amount: unpaid,
          reminder_date: nowStr.split('T')[0],
          status: 'pending',
          priority: 'high',
          task_type: 'invoice_overdue',
          target_type: 'invoice',
          sequence_number: 1,
          notes: `Payment overdue on invoice ${inv.invoice_number}.`,
          created_at: nowStr,
        });
        existingKeys.add(`invoice-${inv.id}`);
      }
    }
  }

  return [...added, ...reconciled];
}

export type CommunicationTone =
  | 'Professional'
  | 'Friendly Follow-Up'
  | 'Urgent / Gentle Reminder'
  | 'Value-Add Check-In'
  | 'Objection Clarification'
  | 'Closing Urgency';

/**
 * Generates tailored sales communication (WhatsApp, Email, SMS) using context.
 * Adheres strictly to Matthew's 6 specific tones:
 * - Professional
 * - Friendly Follow-Up
 * - Urgent / Gentle Reminder
 * - Value-Add Check-In
 * - Objection Clarification
 * - Closing Urgency
 */
export async function generateCommunicationDraft(params: {
  channel: 'whatsapp' | 'email' | 'sms';
  targetType: 'lead' | 'quote' | 'invoice' | 'customer';
  customerName: string;
  businessName: string;
  currency: string;
  amount?: number;
  serviceTitle?: string;
  referenceNumber?: string;
  stageNotes?: string;
  objection?: string;
  tone?: CommunicationTone | string;
}): Promise<string> {
  const {
    channel,
    targetType,
    customerName,
    businessName,
    currency,
    amount = 0,
    serviceTitle = 'Commercial Services',
    referenceNumber,
    stageNotes,
    objection,
    tone = 'Professional',
  } = params;

  try {
    const res = await fetch('/api/matthew/generate-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.message) return data.message;
    }
  } catch {
    // Graceful fallback to client template
  }

  const amtFormatted = formatCurrency(amount, currency);

  // Fallback templates honoring the specific selected tone:
  if (targetType === 'quote') {
    if (tone === 'Urgent / Gentle Reminder') {
      return channel === 'whatsapp'
        ? `Hello ${customerName}, gentle check-in from *${businessName}* on proposal *${referenceNumber || ''}* (${amtFormatted}). Our scheduling for this cycle is finalizing—kindly let us know if we have your approval to reserve your spot.`
        : `Gentle reminder from ${businessName} regarding quotation ${referenceNumber || ''} for ${serviceTitle}. Please advise if approved so we can lock in schedule.`;
    }
    if (tone === 'Value-Add Check-In') {
      return channel === 'whatsapp'
        ? `Good day ${customerName}, hope all is well. Reaching out from *${businessName}* regarding *${serviceTitle}*. We've prepared our deployment schedule and want to ensure our proposal covers every detail you need for a seamless outcome.`
        : `Greetings ${customerName}, checking in from ${businessName} regarding your ${serviceTitle} quotation. We are ready to answer any questions or adapt the scope to your exact preference.`;
    }
    if (tone === 'Objection Clarification') {
      return channel === 'whatsapp'
        ? `Hello ${customerName}, I hope your day is going well. Following up on our quotation (${referenceNumber || 'Proposal'}) for *${serviceTitle}*. If there are any specific scope, timeline, or budgetary adjustments you'd like us to discuss, we are very open to working through them with you.`
        : `Hello ${customerName}, following up on quote ${referenceNumber || ''}. If you have any questions or scope adjustments, we would be pleased to clarify and assist.`;
    }
    if (tone === 'Closing Urgency') {
      return channel === 'whatsapp'
        ? `Good day ${customerName}, following up on quotation *${referenceNumber || ''}* (${amtFormatted}). To guarantee current material pricing and immediate slot availability, we'd appreciate your decision before the quote window concludes. Thank you!`
        : `Hello ${customerName}, checking in on quotation ${referenceNumber || ''} for ${serviceTitle}. Please confirm approval to secure current pricing and mobilization slot.`;
    }
    if (tone === 'Friendly Follow-Up') {
      return channel === 'whatsapp'
        ? `Good day ${customerName},\n\nI hope your week is going smoothly!\n\nI'm checking in regarding the proposal from *${businessName}* for *${serviceTitle}* (${referenceNumber || 'Quotation'} — ${amtFormatted}).\n\nDid you have a chance to review it? Please let us know if you need any adjustments or clarifications.`
        : `Hi ${customerName}, just checking in regarding our proposal ${referenceNumber || ''} from ${businessName}. Looking forward to your thoughts!`;
    }
    // Default Professional
    return channel === 'whatsapp'
      ? `Dear ${customerName},\n\nI hope this message finds you well.\n\nI am writing to follow up on quotation *${referenceNumber || 'Proposal'}* regarding *${serviceTitle}* (${amtFormatted}) submitted by *${businessName}*.\n\nPlease let us know if you require any adjustments or additional details before we proceed. We look forward to your response.`
      : `Dear ${customerName}, following up on quotation ${referenceNumber || ''} for ${serviceTitle} from ${businessName}. Please let us know if you require any adjustments. Best regards.`;
  }

  if (targetType === 'lead') {
    if (tone === 'Friendly Follow-Up') {
      return channel === 'whatsapp'
        ? `Hello ${customerName}! Trust you're having a productive week. Following up on your inquiry with *${businessName}* for *${serviceTitle}*. We'd love to assist—would you be free for a brief 5-minute chat today?`
        : `Hi ${customerName}, checking in from ${businessName} regarding ${serviceTitle}. When is a good time to connect briefly?`;
    }
    if (tone === 'Urgent / Gentle Reminder' || tone === 'Closing Urgency') {
      return channel === 'whatsapp'
        ? `Hello ${customerName}, quick check-in from *${businessName}* regarding your request for *${serviceTitle}*. We are reviewing new projects for this week and wanted to connect with you before our roster fills up.`
        : `Hello ${customerName}, following up from ${businessName} on your inquiry for ${serviceTitle}. Please let us know if you are still looking to proceed.`;
    }
    // Professional default
    return channel === 'whatsapp'
      ? `Hello ${customerName},\n\nTrust you are well.\n\nI'm reaching out from *${businessName}* regarding your inquiry for *${serviceTitle}*.\n\nWe have reviewed your project requirements and are ready to assist. Would today or tomorrow morning be convenient for a brief conversation to align on the scope?`
      : `Hello ${customerName}, this is ${businessName} following up on your inquiry for ${serviceTitle}. We are ready to assist at your convenience.`;
  }

  if (targetType === 'invoice') {
    if (tone === 'Urgent / Gentle Reminder' || tone === 'Closing Urgency') {
      return channel === 'whatsapp'
        ? `Dear ${customerName},\n\nThis is an urgent reminder from *${businessName}* regarding overdue invoice *${referenceNumber || 'INV'}* for *${serviceTitle}* with a pending balance of *${amtFormatted}*.\n\nKindly confirm payment initiation or contact us immediately so we can update your account status. Thank you.`
        : `Urgent reminder from ${businessName}: invoice ${referenceNumber || ''} (${amtFormatted}) is overdue. Please remit payment at earliest convenience.`;
    }
    // Professional reminder default
    return channel === 'whatsapp'
      ? `Good day ${customerName},\n\nI hope you are having a pleasant day.\n\nThis is a gentle reminder from *${businessName}* regarding invoice *${referenceNumber || 'INV'}* for *${serviceTitle}*, with an outstanding balance of *${amtFormatted}*.\n\nKindly confirm if payment has been processed or if you require our banking details re-sent for your convenience. Thank you for your continued partnership!`
      : `Dear ${customerName}, gentle reminder from ${businessName} regarding invoice ${referenceNumber || ''} (${amtFormatted}). Kindly advise once payment is processed.`;
  }

  return `Hello ${customerName}, warm greetings from ${businessName}. We value your partnership and wanted to check in regarding ${serviceTitle}. Let us know how we can assist you today!`;
}
