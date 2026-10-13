import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Flame,
  Clock,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Building,
  DollarSign,
  FileText,
  UserCheck,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowRight,
  MoreVertical,
  Check,
  ShieldCheck,
  Briefcase,
  X,
  Layers,
  Kanban,
  List,
  Package,
  HelpCircle,
  Send,
  Copy,
  Brain,
  Zap,
  Target,
  TrendingUp,
  Tag,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  Lead,
  LeadStatus,
  LeadSource,
  BusinessProfile,
  AppState,
  PlanTier,
  MatthewMessage,
} from '../types';
import {
  buildWhatsAppLink,
  createLeadIntroWhatsAppText,
  formatTimeline,
  formatDate,
} from '../utils/formatters';
import { sendMatthewMessage } from '../lib/matthew';
import { MatthewMessageModalTarget } from './MatthewMessageModal';

interface LeadsViewProps {
  leads: Lead[];
  business: BusinessProfile;
  currentUserPlan: PlanTier;
  state?: AppState;
  onOpenNewLead: () => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  onUnlockLead: (leadId: Lead) => void;
  onConvertToQuote: (lead: Lead) => void;
  onConvertToCustomer?: (lead: Lead) => void;
  onScheduleFollowUp?: (lead: Lead) => void;
  onOpenServiceRequest: () => void;
  onOpenSubscription: () => void;
  onNavigateToMatthew?: (prompt: string) => void;
  onOpenMessageModal?: (target: MatthewMessageModalTarget) => void;
}

const PIPELINE_COLUMNS: { id: LeadStatus; label: string; color: string; badgeBg: string }[] = [
  { id: 'New', label: 'New Inquiries', color: 'border-blue-500 text-blue-700', badgeBg: 'bg-blue-100' },
  { id: 'Contacted', label: 'Contacted', color: 'border-amber-500 text-amber-700', badgeBg: 'bg-amber-100' },
  { id: 'Qualified', label: 'Qualified', color: 'border-purple-500 text-purple-700', badgeBg: 'bg-purple-100' },
  { id: 'Quote Sent', label: 'Quote Sent', color: 'border-indigo-500 text-indigo-700', badgeBg: 'bg-indigo-100' },
  { id: 'Negotiating', label: 'Negotiating', color: 'border-orange-500 text-orange-700', badgeBg: 'bg-orange-100' },
  { id: 'Won', label: 'Won / Converted', color: 'border-emerald-500 text-emerald-700', badgeBg: 'bg-emerald-100' },
  { id: 'Lost', label: 'Lost / Closed', color: 'border-slate-400 text-slate-600', badgeBg: 'bg-slate-100' },
];

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  business,
  currentUserPlan,
  state,
  onOpenNewLead,
  onEditLead,
  onDeleteLead,
  onUpdateLeadStatus,
  onUnlockLead,
  onConvertToQuote,
  onConvertToCustomer,
  onScheduleFollowUp,
  onOpenServiceRequest,
  onOpenSubscription,
  onNavigateToMatthew,
  onOpenMessageModal,
}) => {
  const [viewMode, setViewMode] = useState<'tabs' | 'pipeline' | 'list'>('tabs');
  const [selectedStageTab, setSelectedStageTab] = useState<LeadStatus | 'all'>('New');
  const [tabHighlightColor, setTabHighlightColor] = useState<'blue' | 'orange'>('blue');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'marketplace' | 'manual' | 'hot'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Explainer banner collapse state
  const [isExplainerExpanded, setIsExplainerExpanded] = useState(true);

  // Matthew AI Deal-Closing Engine State
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [aiCustomQuestion, setAiCustomQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedAiText, setCopiedAiText] = useState(false);

  // Filter logic
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.customer_name.toLowerCase().includes(q);
        const matchService = lead.service_required.toLowerCase().includes(q);
        const matchLocation = lead.location.toLowerCase().includes(q);
        const matchAddress = (lead.address || '').toLowerCase().includes(q);
        const matchNumber = lead.lead_number.toLowerCase().includes(q);
        const matchNotes = (lead.notes || '').toLowerCase().includes(q);
        const matchProducts = (lead.attached_products || []).some((p) =>
          p.name.toLowerCase().includes(q)
        );
        if (
          !matchName &&
          !matchService &&
          !matchLocation &&
          !matchAddress &&
          !matchNumber &&
          !matchNotes &&
          !matchProducts
        ) {
          return false;
        }
      }

      // Source Filter
      if (sourceFilter === 'marketplace' && lead.source !== 'marketplace') return false;
      if (sourceFilter === 'manual' && lead.source === 'marketplace') return false;
      if (sourceFilter === 'hot' && lead.intent_score < 80) return false;

      // Status Filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;

      // Category Filter
      if (selectedCategory !== 'all' && lead.service_category !== selectedCategory) return false;

      return true;
    });
  }, [leads, searchQuery, sourceFilter, statusFilter, selectedCategory]);

  // Pipeline metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'New').length;
  const hotLeads = leads.filter((l) => l.intent_score >= 80).length;
  const wonLeads = leads.filter((l) => l.status === 'Won').length;
  const marketplaceCount = leads.filter((l) => l.source === 'marketplace').length;
  const totalPipelineValue = useMemo(() => {
    return leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  }, [leads]);

  // Matthew AI Lead-Reading & Deal Closing Analysis
  const dealClosingOpportunities = useMemo(() => {
    const opportunities: Array<{
      lead: Lead;
      type: 'hot_closer' | 'urgent_quote' | 'stale_followup' | 'upsell';
      headline: string;
      actionText: string;
      closingTactic: string;
    }> = [];

    // 1. Hot intent leads awaiting quote
    const hotAwaitingQuote = leads.filter(
      (l) => l.intent_score >= 80 && (l.status === 'New' || l.status === 'Qualified')
    );
    hotAwaitingQuote.slice(0, 2).forEach((l) => {
      opportunities.push({
        lead: l,
        type: 'hot_closer',
        headline: `Fast-Track Closing: ${l.customer_name}`,
        actionText: 'Send Instant Quote + 48hr Price Guarantee',
        closingTactic: `Prospect has ${l.intent_score}% intent for ${l.service_required} in ${l.location}. Nigerian clients decide faster when presented with a definitive 48-hour delivery timeline and clear payment terms. Convert to a formal quote and send via WhatsApp now.`,
      });
    });

    // 2. Leads in Quote Sent awaiting follow-up
    const quoteSentLeads = leads.filter((l) => l.status === 'Quote Sent' || l.status === 'Negotiating');
    quoteSentLeads.slice(0, 2).forEach((l) => {
      opportunities.push({
        lead: l,
        type: 'stale_followup',
        headline: `Nudge & Close: ${l.customer_name}`,
        actionText: 'Send WhatsApp Inspection or Milestone Offer',
        closingTactic: `Quotation is in ${l.customer_name}'s hands (${l.budget_formatted}). To remove hesitation on price or trust, offer a free site measurement/inspection or flexible milestone structure (e.g. 70% mobilization / 30% signoff).`,
      });
    });

    // 3. High value lead needing catalogue attachment
    const unattachedLeads = leads.filter(
      (l) => (!l.attached_products || l.attached_products.length === 0) && (l.estimated_value || 0) > 300000
    );
    if (unattachedLeads.length > 0) {
      const target = unattachedLeads[0];
      opportunities.push({
        lead: target,
        type: 'upsell',
        headline: `Catalog Specification: ${target.customer_name}`,
        actionText: 'Attach Specific Equipment & Accessories',
        closingTactic: `Attaching brand-name catalogue items (e.g. tier-1 inverters, batteries, warranty packages) boosts perceived credibility and increases quote acceptance by 38% in Nigeria.`,
      });
    }

    return opportunities;
  }, [leads]);

  // Handler for Matthew AI Consultation
  const handleAskMatthewClosingAdvice = async (customPrompt?: string) => {
    const query = customPrompt || aiCustomQuestion;
    if (!query.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const appStateToUse: AppState = state || {
        business,
        user: { id: 'u1', name: 'User', email: 'user@example.com', plan: currentUserPlan, createdAt: new Date().toISOString() },
        leads,
        quotes: [],
        invoices: [],
        customers: [],
        products: [],
        templates: [],
        followups: [],
        aiUsage: { month: new Date().toISOString().slice(0, 7), count: 0 },
      };

      const contextualMessage = `[LEADS PAGE DEAL CLOSING AUDIT]
Here is the active leads pipeline on this page:
- Total Leads: ${leads.length}
- Hot Intent Leads (>=80): ${hotLeads}
- New Inquiries: ${newLeads}
- In Negotiating / Quote Sent: ${leads.filter((l) => l.status === 'Quote Sent' || l.status === 'Negotiating').length}
- Total Pipeline Value: ₦${totalPipelineValue.toLocaleString()}
Top Leads:
${leads.slice(0, 5).map((l) => `- ${l.customer_name} (${l.location}): ${l.service_required}, Budget: ${l.budget_formatted}, Status: ${l.status}, Timeline: ${l.timeline}, Score: ${l.intent_score}/100`).join('\n')}

User Question: ${query}

Provide specific, practical deal-closing tactics, negotiation moves, and a copyable WhatsApp closing message tailored to the Nigerian market. Keep it concise, high-converting, and actionable.`;

      const reply = await sendMatthewMessage({
        message: contextualMessage,
        history: [],
        state: appStateToUse,
      });

      setAiResponse(reply.content);
    } catch (err: any) {
      console.error('Failed to get Matthew closing advice:', err);
      setAiResponse(
        `### 🎯 Matthew Deal-Closing Strategy\n\n1. **Focus on High-Intent Inquiries**: Reach out to **${newLeads} new leads** on WhatsApp within 30 minutes. In Nigeria, the first professional responder closes over 60% of jobs.\n2. **Break Down Quotations**: For submitted quotes, propose a clear 70/30 milestone payment or 12-month workmanship warranty to eliminate hesitation.\n3. **Use Catalogue Transparency**: Attach exact product models and serial warranties to prove value against cheaper informal quotes.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyAiResponse = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse);
      setCopiedAiText(true);
      setTimeout(() => setCopiedAiText(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3D74D9] bg-[#3D74D9]/10 px-2.5 py-0.5 rounded-full">
              Sales Pipeline
            </span>
            <span className="text-xs text-[#5B6D85]">Commercial Deal Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B192C] mt-1">
            Leads & Pipeline Management
          </h1>
          <p className="text-xs font-medium text-[#5B6D85] mt-0.5">
            A place where you add prospects and follow up with them to close more deals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Consumer Service Request Button */}
          <button
            onClick={onOpenServiceRequest}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition active:scale-95"
            title="Simulate a customer request or submit an inquiry"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Request Service</span>
          </button>

          {/* Add Lead (Free) */}
          <button
            onClick={onOpenNewLead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add New Lead / Prospect</span>
          </button>
        </div>
      </div>

      {/* Explainer Banner: What this page is for */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B192C] to-[#1E3A8A] text-white p-4 sm:p-5 shadow-md border border-blue-900/40">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>What is this page for?</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              A place where you add prospects and follow up with them.
            </h2>
            <p className="text-xs text-blue-100/90 max-w-3xl leading-relaxed">
              Never lose a customer or forget a follow-up. Record every prospect from WhatsApp chats, phone calls, walk-in visits, and marketplace buyer inquiries. Attach product catalogue specifications, track deal progress, and leverage Matthew AI deal-closing tactics.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExplainerExpanded(!isExplainerExpanded)}
            className="text-xs text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition font-bold shrink-0 flex items-center gap-1"
          >
            <span>{isExplainerExpanded ? 'Minimize' : 'View Workflow'}</span>
            {isExplainerExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 4 Core Steps Workflow Guide */}
        {isExplainerExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 animate-in fade-in">
            <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] font-black flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-white">Add Prospects (Free)</span>
              </div>
              <p className="text-[11px] text-blue-100/80 leading-snug">
                Click "+ Add New Lead" to record client name, phone/WhatsApp, and project requirements.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] font-black flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-white">Simple Address & Catalog</span>
              </div>
              <p className="text-[11px] text-blue-100/80 leading-snug">
                Fill the simple address form and attach products from your catalogue or create new items inline.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] font-black flex items-center justify-center">
                  3
                </span>
                <span className="text-xs font-bold text-white">Follow Up Systematically</span>
              </div>
              <p className="text-[11px] text-blue-100/80 leading-snug">
                Advance deals across stages: New → Contacted → Qualified → Quote Sent → Negotiating → Won.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center">
                  4
                </span>
                <span className="text-xs font-bold text-white">Close Deals with Matthew AI</span>
              </div>
              <p className="text-[11px] text-blue-100/80 leading-snug">
                Matthew AI reads your active leads and provides instant closing pitches and WhatsApp scripts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Matthew AI Deal-Closing Engine Panel */}
      <div className="rounded-2xl bg-white border border-[#CBD5E1] shadow-sm overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-[#0B192C]">
                  Matthew AI Deal-Closing Advisor
                </h3>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                  Reading {leads.length} Leads in Real-Time
                </span>
              </div>
              <p className="text-xs text-[#5B6D85]">
                AI-powered revenue intelligence specifically aimed at converting your prospects into paid clients.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAskMatthewClosingAdvice('What are the top 3 highest priority actions I should take today to close deals?')}
              disabled={isAiLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Audit Pipeline for Closures</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title={isAiPanelOpen ? 'Collapse Matthew AI' : 'Expand Matthew AI'}
            >
              {isAiPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isAiPanelOpen && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Live Action Recommendations generated by reading this page */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#5B6D85] mb-2.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>Immediate Closing Opportunities ({dealClosingOpportunities.length})</span>
              </div>

              {dealClosingOpportunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {dealClosingOpportunities.map((opp, idx) => (
                    <div
                      key={opp.lead.id + '_' + idx}
                      className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-blue-300 transition space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            {opp.lead.lead_number}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {opp.lead.intent_score}% Intent
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-[#0B192C]">{opp.headline}</h4>
                        <p className="text-[11px] text-[#5B6D85] leading-snug">
                          {opp.closingTactic}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E5E9F0] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenMessageModal) {
                              onOpenMessageModal({
                                targetType: 'lead',
                                targetId: opp.lead.id,
                                customerName: opp.lead.customer_name,
                                customerPhone: opp.lead.phone,
                                customerWhatsapp: opp.lead.whatsapp,
                                serviceTitle: opp.lead.service_required,
                                amount: opp.lead.estimated_value,
                                referenceNumber: opp.lead.lead_number,
                                stageNotes: opp.closingTactic,
                              });
                            } else {
                              const text = createLeadIntroWhatsAppText(
                                opp.lead.customer_name,
                                business.business_name,
                                opp.lead.service_required,
                                opp.lead.location
                              );
                              window.open(buildWhatsAppLink(opp.lead.whatsapp || opp.lead.phone, text), '_blank');
                            }
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp Closer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onConvertToQuote(opp.lead)}
                          className="py-1.5 px-2.5 rounded-lg bg-[#0B192C] hover:bg-[#152744] text-white text-[11px] font-bold transition flex items-center gap-1"
                          title="Generate quotation"
                        >
                          <FileText className="w-3 h-3 text-emerald-400" />
                          <span>Quote</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#5B6D85] text-center">
                  Add more leads or move existing inquiries to see live deal-closing recommendations.
                </div>
              )}
            </div>

            {/* Quick Consultation Bar */}
            <div className="space-y-2 pt-2 border-t border-[#E5E9F0]">
              <div className="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Ask Matthew AI for Deal-Closing Tactics & Negotiation Plays</span>
              </div>

              {/* Pre-set prompt chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  '🎯 How do I close my highest-value prospect today?',
                  '💬 Draft high-converting WhatsApp message for new inquiries',
                  '🛡️ How to overcome "Your price is higher than others"',
                  '⚡ Best follow-up for prospects who have not replied to quotation',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleAskMatthewClosingAdvice(prompt)}
                    disabled={isAiLoading}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-blue-50 text-[#334155] hover:text-blue-700 border border-[#CBD5E1] transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Brain className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ask Matthew how to close a specific lead, negotiate pricing, or draft outreach..."
                    value={aiCustomQuestion}
                    onChange={(e) => setAiCustomQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAskMatthewClosingAdvice();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#0B192C] focus:bg-white focus:border-blue-600 focus:outline-none transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleAskMatthewClosingAdvice()}
                  disabled={isAiLoading || !aiCustomQuestion.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Ask Closer</span>
                </button>
              </div>

              {/* AI Strategy Response Box */}
              {aiResponse && (
                <div className="p-4 rounded-xl bg-[#0B192C] text-slate-100 border border-slate-700 text-xs space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="font-black text-white text-xs uppercase tracking-wider">
                        Matthew Deal-Closing Recommendation
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyAiResponse}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition"
                      >
                        {copiedAiText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAiText ? 'Copied' : 'Copy Strategy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiResponse(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-invert prose-xs max-w-none text-slate-200 leading-relaxed whitespace-pre-line">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* KPI Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E9F0] shadow-sm">
          <div className="text-[11px] font-bold text-[#5B6D85] uppercase tracking-wider">Total Pipeline</div>
          <div className="text-xl font-black text-[#0B192C] mt-0.5">{totalLeads} Prospects</div>
          <div className="text-[11px] text-[#5B6D85] mt-0.5">
            ₦{(totalPipelineValue / 1000000).toFixed(2)}M estimated value
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E9F0] shadow-sm">
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">New Inquiries</div>
          <div className="text-xl font-black text-blue-700 mt-0.5">{newLeads}</div>
          <div className="text-[11px] text-[#5B6D85] mt-0.5">Awaiting first follow-up</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E9F0] shadow-sm">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" /> Hot Intent
          </div>
          <div className="text-xl font-black text-amber-700 mt-0.5">{hotLeads}</div>
          <div className="text-[11px] text-[#5B6D85] mt-0.5">Intent score &ge; 80/100</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E9F0] shadow-sm">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Won Deals
          </div>
          <div className="text-xl font-black text-emerald-700 mt-0.5">{wonLeads}</div>
          <div className="text-[11px] text-[#5B6D85] mt-0.5">
            {totalLeads > 0 ? `${Math.round((wonLeads / totalLeads) * 100)}% conversion` : '0%'}
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Tabs, View Mode */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E9F0] shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5B6D85] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search leads by customer, address, service, products, or lead #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
          />
        </div>

        {/* Source Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              sourceFilter === 'all'
                ? 'bg-[#0B192C] text-white'
                : 'text-[#5B6D85] hover:bg-[#F1F5F9] hover:text-[#0B192C]'
            }`}
          >
            All Leads ({leads.length})
          </button>
          <button
            onClick={() => setSourceFilter('marketplace')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
              sourceFilter === 'marketplace'
                ? 'bg-[#3D74D9] text-white'
                : 'text-[#5B6D85] hover:bg-[#F1F5F9] hover:text-[#0B192C]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Marketplace ({marketplaceCount})</span>
          </button>
          <button
            onClick={() => setSourceFilter('manual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              sourceFilter === 'manual'
                ? 'bg-[#0B192C] text-white'
                : 'text-[#5B6D85] hover:bg-[#F1F5F9] hover:text-[#0B192C]'
            }`}
          >
            My Added Leads ({leads.filter((l) => l.source !== 'marketplace').length})
          </button>
          <button
            onClick={() => setSourceFilter('hot')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
              sourceFilter === 'hot'
                ? 'bg-amber-500 text-white'
                : 'text-[#5B6D85] hover:bg-[#F1F5F9] hover:text-[#0B192C]'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-500 group-hover:text-white" />
            <span>Hot Intent ({hotLeads})</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#F4F7FB] p-1 rounded-xl border border-[#E5E9F0]">
          <button
            onClick={() => setViewMode('tabs')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'tabs'
                ? 'bg-white text-[#0B192C] shadow-sm'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
            title="Stage Tabs View (Full Detail)"
          >
            <Layers className="w-4 h-4 text-[#3D74D9]" />
            <span className="hidden sm:inline">Stage Tabs</span>
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'pipeline'
                ? 'bg-white text-[#0B192C] shadow-sm'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
            title="Kanban Board View"
          >
            <Kanban className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white text-[#0B192C] shadow-sm'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
            title="List Table View"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Main Content: Stage Tabs (Default), Kanban Board, or List Table */}
      {viewMode === 'tabs' ? (
        /* Stage Tabs View */
        <div className="space-y-4">
          {/* Top Stage Tabs Navigation */}
          <div className="bg-white rounded-2xl border border-[#E5E9F0] p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[#E5E9F0]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#0B192C] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#3D74D9]" />
                  <span>Pipeline Stage Tabs</span>
                </span>
                <span className="text-[11px] text-[#5B6D85] hidden md:inline">
                  Select any stage to view fully expanded, uncompressed lead details
                </span>
              </div>

              {/* Blue or Orange Tab Highlight Selector */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[11px] text-[#5B6D85] font-bold">Tab Highlight:</span>
                <div className="flex items-center bg-[#F4F7FB] p-0.5 rounded-xl border border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setTabHighlightColor('blue')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                      tabHighlightColor === 'blue'
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'text-[#5B6D85] hover:text-[#0B192C]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                    <span>Blue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabHighlightColor('orange')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                      tabHighlightColor === 'orange'
                        ? 'bg-[#EA580C] text-white shadow-sm'
                        : 'text-[#5B6D85] hover:text-[#0B192C]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-300"></span>
                    <span>Orange</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Stage Tabs Bar */}
            <div className="flex items-stretch gap-2 overflow-x-auto pb-1 no-scrollbar">
              {/* All Stages Tab */}
              <button
                type="button"
                onClick={() => setSelectedStageTab('all')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-150 flex items-center gap-2 border ${
                  selectedStageTab === 'all'
                    ? tabHighlightColor === 'blue'
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-500/25 ring-2 ring-blue-400/30'
                      : 'bg-[#EA580C] text-white border-[#EA580C] shadow-md shadow-orange-500/25 ring-2 ring-orange-400/30'
                    : 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#0B192C]'
                }`}
              >
                <span>All Stages</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[11px] font-black ${
                    selectedStageTab === 'all'
                      ? 'bg-white/20 text-white'
                      : filteredLeads.length === 0
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {filteredLeads.length === 0 ? 'No leads' : filteredLeads.length}
                </span>
              </button>

              {/* 7 Status Stage Tabs */}
              {PIPELINE_COLUMNS.map((col) => {
                const isSelected = selectedStageTab === col.id;
                const stageCount = filteredLeads.filter((l) => l.status === col.id).length;
                const isEmpty = stageCount === 0;

                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedStageTab(col.id)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-150 flex items-center gap-2 border ${
                      isSelected
                        ? tabHighlightColor === 'blue'
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-500/25 ring-2 ring-blue-400/30'
                          : 'bg-[#EA580C] text-white border-[#EA580C] shadow-md shadow-orange-500/25 ring-2 ring-orange-400/30'
                        : 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#0B192C]'
                    }`}
                  >
                    <span>{col.label}</span>
                    {isEmpty ? (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 ${
                          isSelected
                            ? 'bg-white/20 text-rose-100 border border-white/30'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        <span>0</span>
                        <span className="uppercase text-[9px] tracking-wider text-rose-600 font-extrabold">No lead</span>
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : `${col.badgeBg} ${col.color.split(' ')[1]}`
                        }`}
                      >
                        {stageCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Stage Content Area */}
          {(() => {
            const currentStageLeads =
              selectedStageTab === 'all'
                ? filteredLeads
                : filteredLeads.filter((l) => l.status === selectedStageTab);

            const activeColumn = PIPELINE_COLUMNS.find((c) => c.id === selectedStageTab);
            const stageTitle = selectedStageTab === 'all' ? 'All Pipeline Stages' : activeColumn?.label || selectedStageTab;
            const stageValue = currentStageLeads.reduce((acc, curr) => acc + (curr.estimated_value || 0), 0);

            return (
              <div className="space-y-4">
                {/* Stage Header Info Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-4 py-3 rounded-2xl border border-[#E5E9F0] shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${
                      tabHighlightColor === 'blue' ? 'bg-blue-600' : 'bg-orange-500'
                    }`} />
                    <span className="text-sm font-black text-[#0B192C]">{stageTitle}</span>
                    <span className="text-xs font-bold text-[#5B6D85]">
                      ({currentStageLeads.length} {currentStageLeads.length === 1 ? 'prospect' : 'prospects'})
                    </span>
                    {stageValue > 0 && (
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        Total Value: ₦{(stageValue / 1000000).toFixed(2)}M
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#5B6D85]">
                      {selectedStageTab === 'New' && '🔥 Fast responses (< 15 mins) convert at 3x higher rates.'}
                      {selectedStageTab === 'Contacted' && '📅 Follow up within 24–48 hours to schedule site visits or discussions.'}
                      {selectedStageTab === 'Qualified' && '💡 Requirements confirmed. Ready for formal quote generation.'}
                      {selectedStageTab === 'Quote Sent' && '📄 Quotation active with client. Follow up with closing check-in.'}
                      {selectedStageTab === 'Negotiating' && '⚡ Closing in on terms. Review payment milestones & final pricing.'}
                      {selectedStageTab === 'Won' && '🎉 Deals closed & converted! Ready for invoice generation.'}
                      {selectedStageTab === 'Lost' && '📦 Archived inquiries for win-back analysis.'}
                      {selectedStageTab === 'all' && 'Viewing prospects across all active and historical pipeline stages.'}
                    </span>
                  </div>
                </div>

                {/* Cards or Empty State */}
                {currentStageLeads.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {currentStageLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        business={business}
                        currentUserPlan={currentUserPlan}
                        onEdit={onEditLead}
                        onDelete={onDeleteLead}
                        onUpdateStatus={onUpdateLeadStatus}
                        onUnlock={onUnlockLead}
                        onConvertToQuote={onConvertToQuote}
                        onConvertToCustomer={onConvertToCustomer}
                        onScheduleFollowUp={onScheduleFollowUp}
                        onOpenSubscription={onOpenSubscription}
                        onOpenMessageModal={onOpenMessageModal}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 sm:p-14 rounded-3xl bg-rose-50/50 border-2 border-dashed border-rose-300 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                      <AlertCircle className="w-7 h-7 text-rose-600" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-300">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                        <span>No leads</span>
                      </div>
                      <h3 className="text-lg font-black text-rose-950 mt-2.5">
                        No prospects in {stageTitle}
                      </h3>
                      <p className="text-xs text-rose-800/80 max-w-md mx-auto mt-1 leading-relaxed">
                        There are currently 0 prospects awaiting attention in this stage. When leads are created or moved to "{stageTitle}", they will be displayed here with simple address and catalogue details.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={onOpenNewLead}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Prospect (Free)</span>
                      </button>
                      <button
                        type="button"
                        onClick={onOpenServiceRequest}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-100/50 text-rose-700 border border-rose-200 text-xs font-bold transition active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                        <span>Marketplace Requests</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStageTab('all')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-[#0B192C] border border-[#E2E8F0] text-xs font-bold transition active:scale-95"
                      >
                        <span>View All Stages</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : viewMode === 'pipeline' ? (
        /* Pipeline / Kanban Columns */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-4">
          {PIPELINE_COLUMNS.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[#F8FAFC] rounded-2xl border border-[#E5E9F0] p-3 flex flex-col min-w-[260px] xl:min-w-0"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E9F0]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#0B192C]">{col.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${col.badgeBg} ${col.color}`}>
                      {colLeads.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#5B6D85]">
                    {colLeads.reduce((acc, curr) => acc + (curr.estimated_value || 0), 0) > 0 &&
                      `₦${(colLeads.reduce((acc, curr) => acc + (curr.estimated_value || 0), 0) / 1000000).toFixed(1)}M`}
                  </div>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh]">
                  {colLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      business={business}
                      currentUserPlan={currentUserPlan}
                      onEdit={onEditLead}
                      onDelete={onDeleteLead}
                      onUpdateStatus={onUpdateLeadStatus}
                      onUnlock={onUnlockLead}
                      onConvertToQuote={onConvertToQuote}
                      onConvertToCustomer={onConvertToCustomer}
                      onScheduleFollowUp={onScheduleFollowUp}
                      onOpenSubscription={onOpenSubscription}
                      onOpenMessageModal={onOpenMessageModal}
                    />
                  ))}
                  {colLeads.length === 0 && (
                    <div className="py-8 text-center text-xs text-[#8F9FB5] border border-dashed border-[#E2E8F0] rounded-xl">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-white rounded-2xl border border-[#E5E9F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E9F0] text-[#5B6D85] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Lead # & Client</th>
                  <th className="px-4 py-3">Service & Catalogue Items</th>
                  <th className="px-4 py-3">Address & Location</th>
                  <th className="px-4 py-3">Budget & Timeline</th>
                  <th className="px-4 py-3">Intent Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9F0]">
                {filteredLeads.map((lead) => (
                  <LeadTableRow
                    key={lead.id}
                    lead={lead}
                    business={business}
                    currentUserPlan={currentUserPlan}
                    onEdit={onEditLead}
                    onDelete={onDeleteLead}
                    onUpdateStatus={onUpdateLeadStatus}
                    onUnlock={onUnlockLead}
                    onConvertToQuote={onConvertToQuote}
                    onConvertToCustomer={onConvertToCustomer}
                    onScheduleFollowUp={onScheduleFollowUp}
                    onOpenSubscription={onOpenSubscription}
                    onOpenMessageModal={onOpenMessageModal}
                  />
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-xs text-[#5B6D85]">
                      No matching prospects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

interface LeadCardProps {
  lead: Lead;
  business: BusinessProfile;
  currentUserPlan: PlanTier;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onUnlock: (lead: Lead) => void;
  onConvertToQuote: (lead: Lead) => void;
  onConvertToCustomer?: (lead: Lead) => void;
  onScheduleFollowUp?: (lead: Lead) => void;
  onOpenSubscription: () => void;
  onOpenMessageModal?: (target: MatthewMessageModalTarget) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  business,
  currentUserPlan,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUnlock,
  onConvertToQuote,
  onConvertToCustomer,
  onScheduleFollowUp,
  onOpenSubscription,
  onOpenMessageModal,
}) => {
  const [showAiTip, setShowAiTip] = useState(false);
  const isMarketplace = lead.source === 'marketplace';
  const isLocked = isMarketplace && lead.is_locked;

  // Mask contact info if locked
  const displayPhone = isLocked ? '+234 802 ••• ••••' : lead.whatsapp || lead.phone;

  const whatsAppText = createLeadIntroWhatsAppText(
    lead.customer_name,
    business.business_name,
    lead.service_required,
    lead.location
  );
  const whatsAppLink = buildWhatsAppLink(lead.whatsapp || lead.phone, whatsAppText);

  // Address display
  const formattedAddress = lead.address
    ? `${lead.address}${lead.city ? ', ' + lead.city : ''}${lead.state ? ' (' + lead.state + ')' : ''}`
    : lead.location;

  // Attached products
  const attachedCount = lead.attached_products?.length || 0;

  // Tailored AI Close Advice for this specific lead
  const tailoredAiAdvice = useMemo(() => {
    if (lead.status === 'New') {
      return `Closing Angle: Reach out via WhatsApp within 15 minutes. Reference their exact request for "${lead.service_required}" and offer to send a formal proposal today.`;
    }
    if (lead.status === 'Contacted') {
      return `Closing Angle: Propose a quick 10-minute discovery call or free on-site survey at ${lead.location} to remove friction and finalize scope.`;
    }
    if (lead.status === 'Quote Sent' || lead.status === 'Negotiating') {
      return `Closing Angle: Send a courtesy check-in offering a 48-hour price lock guarantee or split payment milestone (70% start / 30% handover).`;
    }
    return `Closing Angle: Re-engage with customer satisfaction follow-up or offer related maintenance and warranty service.`;
  }, [lead]);

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
      <div>
        {/* Top badges: Lead #, Source, Intent */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <span className="text-xs font-mono font-bold text-[#5B6D85] bg-[#F4F7FB] px-2 py-0.5 rounded-md border border-[#E5E9F0]">
            {lead.lead_number}
          </span>
          <div className="flex items-center gap-1.5">
            {isMarketplace ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Marketplace
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {lead.source}
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                lead.intent_score >= 80
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : lead.intent_score >= 60
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {lead.intent_score >= 80 && <Flame className="w-3 h-3 text-amber-600" />}
              <span>{lead.intent_score}/100</span>
            </span>
          </div>
        </div>

        {/* Customer Name & Property */}
        <div className="mb-2">
          <h4 className="text-sm font-black text-[#0B192C] leading-snug group-hover:text-[#3D74D9] transition">
            {lead.customer_name}
          </h4>
          {lead.company && <div className="text-xs text-[#5B6D85] font-medium mt-0.5">{lead.company}</div>}
        </div>

        {/* Service & Location Block */}
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E5E9F0] mb-3 space-y-2">
          <div className="text-xs font-bold text-[#0B192C] line-clamp-2">{lead.service_required}</div>

          {/* Address Display */}
          <div className="flex items-start gap-1.5 text-xs text-[#5B6D85]">
            <MapPin className="w-3.5 h-3.5 text-[#3D74D9] shrink-0 mt-0.5" />
            <span className="line-clamp-2 font-medium">{formattedAddress}</span>
          </div>

          {/* Attached Catalogue Products Pill */}
          {attachedCount > 0 && (
            <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <Package className="w-3 h-3 text-blue-600" />
                <span>{attachedCount} Catalogue {attachedCount === 1 ? 'Item' : 'Items'} Attached:</span>
              </div>
              <div className="space-y-0.5 pl-4 text-[10px] text-blue-800">
                {lead.attached_products!.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="truncate">
                    • {item.name} ({item.quantity}x) — ₦{item.total.toLocaleString()}
                  </div>
                ))}
                {attachedCount > 2 && (
                  <div className="text-blue-600 font-bold">+{attachedCount - 2} more items</div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E9F0]">
            <span className="font-extrabold text-emerald-700">{lead.budget_formatted}</span>
            <span className="text-[#5B6D85] font-semibold">{formatTimeline(lead.timeline)}</span>
          </div>
        </div>

        {/* Freshness Badge */}
        <div className="text-xs text-emerald-700 font-semibold mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{lead.freshness_label}</span>
          </div>

          {/* Matthew Close Tip Toggle */}
          <button
            type="button"
            onClick={() => setShowAiTip(!showAiTip)}
            className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 transition"
          >
            <Brain className="w-2.5 h-2.5 text-blue-600" />
            <span>AI Close Tip</span>
          </button>
        </div>

        {/* AI Close Tip Expandable Box */}
        {showAiTip && (
          <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-blue-950 to-indigo-950 text-white text-[11px] space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between font-bold text-blue-200">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Matthew AI Deal Angle</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAiTip(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-slate-200 leading-snug">{tailoredAiAdvice}</p>
          </div>
        )}

        {/* Contact Section: Locked vs Unlocked */}
        {isLocked ? (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-center mb-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Contact Details Hidden</span>
            </div>
            <div className="text-xs text-amber-800/90 mb-2 font-mono">{displayPhone}</div>
            <button
              onClick={() => onUnlock(lead)}
              className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Lead</span>
            </button>
          </div>
        ) : (
          <div className="bg-[#F4F7FB] border border-[#E5E9F0] rounded-xl p-2.5 mb-3">
            <div className="flex items-center justify-between text-xs text-[#0B192C]">
              <span className="font-mono font-bold">{displayPhone}</span>
              <button
                type="button"
                onClick={() => {
                  if (onOpenMessageModal) {
                    onOpenMessageModal({
                      targetType: 'lead',
                      targetId: lead.id,
                      customerName: lead.customer_name,
                      customerPhone: lead.phone,
                      customerWhatsapp: lead.whatsapp,
                      customerEmail: lead.email,
                      serviceTitle: lead.service_required,
                      amount: lead.estimated_value,
                      referenceNumber: lead.lead_number,
                      stageNotes: lead.notes,
                    });
                  } else {
                    window.open(whatsAppLink, '_blank');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Open WhatsApp message generator"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fast Action Buttons & Status Mover */}
      <div className="space-y-2 pt-2 border-t border-[#E5E9F0]">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (isLocked) {
                onUnlock(lead);
                return;
              }
              onConvertToQuote(lead);
            }}
            className="py-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            title={isLocked ? "Unlock lead to generate quotation" : "Convert directly to Quotation"}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Quote</span>
          </button>

          <button
            onClick={() => {
              if (isLocked) {
                onUnlock(lead);
                return;
              }
              onEdit(lead);
            }}
            className="py-1.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            Edit / Address
          </button>
        </div>

        {/* Move Status Dropdown */}
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 py-1">
          <span className="text-[11px] font-bold text-[#5B6D85] whitespace-nowrap">Stage:</span>
          <select
            value={lead.status}
            onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
            className="w-full text-xs font-bold bg-transparent text-[#0B192C] focus:outline-none cursor-pointer"
          >
            <option value="New">Stage: New</option>
            <option value="Contacted">Stage: Contacted</option>
            <option value="Qualified">Stage: Qualified</option>
            <option value="Quote Sent">Stage: Quote Sent</option>
            <option value="Negotiating">Stage: Negotiating</option>
            <option value="Won">Stage: Won</option>
            <option value="Lost">Stage: Lost</option>
          </select>
        </div>
      </div>
    </div>
  );
};

interface LeadTableRowProps {
  lead: Lead;
  business: BusinessProfile;
  currentUserPlan: PlanTier;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onUnlock: (lead: Lead) => void;
  onConvertToQuote: (lead: Lead) => void;
  onConvertToCustomer?: (lead: Lead) => void;
  onScheduleFollowUp?: (lead: Lead) => void;
  onOpenSubscription: () => void;
  onOpenMessageModal?: (target: MatthewMessageModalTarget) => void;
}

const LeadTableRow: React.FC<LeadTableRowProps> = ({
  lead,
  business,
  currentUserPlan,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUnlock,
  onConvertToQuote,
  onConvertToCustomer,
  onScheduleFollowUp,
  onOpenSubscription,
  onOpenMessageModal,
}) => {
  const isMarketplace = lead.source === 'marketplace';
  const isLocked = isMarketplace && lead.is_locked;

  const whatsAppText = createLeadIntroWhatsAppText(
    lead.customer_name,
    business.business_name,
    lead.service_required,
    lead.location
  );
  const whatsAppLink = buildWhatsAppLink(lead.whatsapp || lead.phone, whatsAppText);

  const formattedAddress = lead.address
    ? `${lead.address}${lead.city ? ', ' + lead.city : ''}`
    : lead.location;

  const attachedCount = lead.attached_products?.length || 0;

  return (
    <tr className="hover:bg-[#F8FAFC] transition">
      {/* Lead # & Client */}
      <td className="px-4 py-3">
        <div className="font-bold text-[#0B192C]">{lead.customer_name}</div>
        <div className="flex items-center gap-1 text-[10px] text-[#5B6D85]">
          <span className="font-mono">{lead.lead_number}</span>
          <span>•</span>
          <span className="capitalize">{lead.source}</span>
        </div>
      </td>

      {/* Service & Catalogue Items */}
      <td className="px-4 py-3">
        <div className="font-semibold text-[#0B192C] max-w-[200px] truncate">{lead.service_required}</div>
        {attachedCount > 0 ? (
          <div className="text-[10px] text-blue-700 font-bold flex items-center gap-1 mt-0.5">
            <Package className="w-2.5 h-2.5" />
            <span>{attachedCount} catalogue items attached</span>
          </div>
        ) : (
          <div className="text-[10px] text-[#5B6D85]">{lead.service_category}</div>
        )}
      </td>

      {/* Address & Location */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-[#0B192C] font-semibold max-w-[200px] truncate">
          <MapPin className="w-3 h-3 text-[#3D74D9] shrink-0" />
          <span className="truncate">{formattedAddress}</span>
        </div>
        {lead.state && (
          <div className="text-[10px] text-[#5B6D85]">{lead.state} State</div>
        )}
      </td>

      {/* Budget & Timeline */}
      <td className="px-4 py-3">
        <div className="text-[11px] text-emerald-700 font-bold">{lead.budget_formatted}</div>
        <div className="text-[10px] text-[#5B6D85]">{formatTimeline(lead.timeline)}</div>
      </td>

      {/* Intent Score */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span
            className={`font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${
              lead.intent_score >= 80
                ? 'bg-amber-100 text-amber-800'
                : lead.intent_score >= 60
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {lead.intent_score >= 80 && <Flame className="w-3 h-3 text-amber-600" />}
            {lead.intent_score}/100
          </span>
        </div>
        <div className="text-[10px] text-[#5B6D85] mt-0.5">{lead.freshness_label}</div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <select
          value={lead.status}
          onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
          className="text-xs font-semibold py-1 px-2 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#0B192C] cursor-pointer"
        >
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Quote Sent">Quote Sent</option>
          <option value="Negotiating">Negotiating</option>
          <option value="Won">Won</option>
          <option value="Lost">Lost</option>
        </select>
      </td>

      {/* Contact info */}
      <td className="px-4 py-3">
        {isLocked ? (
          <button
            onClick={() => onUnlock(lead)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Unlock Lead</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-[#0B192C]">{lead.whatsapp || lead.phone}</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenMessageModal) {
                  onOpenMessageModal({
                    targetType: 'lead',
                    targetId: lead.id,
                    customerName: lead.customer_name,
                    customerPhone: lead.phone,
                    customerWhatsapp: lead.whatsapp,
                    customerEmail: lead.email,
                    serviceTitle: lead.service_required,
                    amount: lead.estimated_value,
                    referenceNumber: lead.lead_number,
                    stageNotes: lead.notes,
                  });
                } else {
                  window.open(whatsAppLink, '_blank');
                }
              }}
              className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition cursor-pointer"
              title="Open WhatsApp message generator"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
        <button
          onClick={() => {
            if (isLocked) {
              onUnlock(lead);
              return;
            }
            onConvertToQuote(lead);
          }}
          className="px-2.5 py-1 rounded-lg bg-[#0B192C] hover:bg-[#152744] text-white text-[11px] font-bold transition cursor-pointer"
        >
          + Quote
        </button>
        <button
          onClick={() => {
            if (isLocked) {
              onUnlock(lead);
              return;
            }
            onEdit(lead);
          }}
          className="px-2 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[11px] font-semibold transition cursor-pointer"
        >
          Edit / Address
        </button>
      </td>
    </tr>
  );
};
