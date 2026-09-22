import React, { useState } from 'react';
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
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource, BusinessProfile, AppState, PlanTier } from '../types';
import {
  buildWhatsAppLink,
  createLeadIntroWhatsAppText,
  formatTimeline,
  formatDate,
} from '../utils/formatters';

interface LeadsViewProps {
  leads: Lead[];
  business: BusinessProfile;
  currentUserPlan: PlanTier;
  onOpenNewLead: () => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  onUnlockLead: (lead: Lead) => void;
  onConvertToQuote: (lead: Lead) => void;
  onConvertToCustomer: (lead: Lead) => void;
  onScheduleFollowUp: (lead: Lead) => void;
  onOpenServiceRequest: () => void;
  onOpenSubscription: () => void;
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
}) => {
  const [viewMode, setViewMode] = useState<'tabs' | 'pipeline' | 'list'>('tabs');
  const [selectedStageTab, setSelectedStageTab] = useState<LeadStatus | 'all'>('New');
  const [tabHighlightColor, setTabHighlightColor] = useState<'blue' | 'orange'>('blue');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'marketplace' | 'manual' | 'hot'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter logic
  const filteredLeads = leads.filter((lead) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.customer_name.toLowerCase().includes(q);
      const matchService = lead.service_required.toLowerCase().includes(q);
      const matchLocation = lead.location.toLowerCase().includes(q);
      const matchNumber = lead.lead_number.toLowerCase().includes(q);
      const matchNotes = (lead.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchService && !matchLocation && !matchNumber && !matchNotes) {
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

  // Pipeline metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'New').length;
  const hotLeads = leads.filter((l) => l.intent_score >= 80).length;
  const wonLeads = leads.filter((l) => l.status === 'Won').length;
  const marketplaceCount = leads.filter((l) => l.source === 'marketplace').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3D74D9] bg-[#3D74D9]/10 px-2.5 py-0.5 rounded-full">
              Sales Pipeline
            </span>
            <span className="text-xs text-[#5B6D85]">PRD v1 Core Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B192C] mt-1">
            Lead Management & Intent Pipeline
          </h1>
          <p className="text-xs text-[#5B6D85] mt-0.5">
            Manage your own leads for free, or unlock verified marketplace buyer requests with Pro/Business.
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead (Free)</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E9F0] shadow-sm">
          <div className="text-[11px] font-bold text-[#5B6D85] uppercase tracking-wider">Total Pipeline</div>
          <div className="text-xl font-black text-[#0B192C] mt-0.5">{totalLeads} Leads</div>
          <div className="text-[11px] text-[#5B6D85] mt-0.5">{marketplaceCount} from Marketplace</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E9F0] shadow-sm">
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">New Inquiries</div>
          <div className="text-xl font-black text-blue-700 mt-0.5">{newLeads}</div>
          <div className="text-[11px] text-[#5B6D85] mt-0.5">Awaiting first contact</div>
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
            placeholder="Search leads by customer, service, city, or lead #..."
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
        /* Stage Tabs View (Big Screen Optimized, Full Uncompressed Cards) */
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

          {/* Active Stage Content Area: Uncompressed Full Grid or Red No Leads */}
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
                      ({currentStageLeads.length} {currentStageLeads.length === 1 ? 'lead' : 'leads'})
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
                      {selectedStageTab === 'Contacted' && '📅 Follow up within 24–48 hours to schedule discussions.'}
                      {selectedStageTab === 'Qualified' && '💡 Requirements confirmed. Ready for formal quote generation.'}
                      {selectedStageTab === 'Quote Sent' && '📄 Quotation active with client. Check view/read receipts.'}
                      {selectedStageTab === 'Negotiating' && '⚡ Closing in on terms. Review payment milestones & pricing.'}
                      {selectedStageTab === 'Won' && '🎉 Deals closed & converted! Ready for invoice generation.'}
                      {selectedStageTab === 'Lost' && '📦 Archived or declined inquiries for win-back analysis.'}
                      {selectedStageTab === 'all' && 'Viewing leads across all active and historical pipeline stages.'}
                    </span>
                  </div>
                </div>

                {/* Cards or Red Empty State */}
                {currentStageLeads.length > 0 ? (
                  /* Spacious, Uncompressed Responsive Grid */
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
                      />
                    ))}
                  </div>
                ) : (
                  /* Red "No Leads" State when there is no information */
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
                        No leads in {stageTitle}
                      </h3>
                      <p className="text-xs text-rose-800/80 max-w-md mx-auto mt-1 leading-relaxed">
                        There are currently 0 leads awaiting attention in this stage. When leads are created or moved to "{stageTitle}", they will be displayed here in full uncompressed cards.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={onOpenNewLead}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Lead (Free)</span>
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
        /* Pipeline / Kanban Columns (Classic 7 Column View) */
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
                  <th className="px-4 py-3">Service Required</th>
                  <th className="px-4 py-3">Location & Budget</th>
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
                  />
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-xs text-[#5B6D85]">
                      No matching leads found.
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
  onConvertToCustomer: (lead: Lead) => void;
  onScheduleFollowUp: (lead: Lead) => void;
  onOpenSubscription: () => void;
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
}) => {
  const isMarketplace = lead.source === 'marketplace';
  const isLocked = isMarketplace && lead.is_locked;

  // Mask contact info if locked
  const displayPhone = isLocked ? '+234 802 ••• ••••' : lead.whatsapp || lead.phone;
  const displayEmail = isLocked ? '••••••••@gmail.com' : lead.email;

  const whatsAppText = createLeadIntroWhatsAppText(
    lead.customer_name,
    business.business_name,
    lead.service_required,
    lead.location
  );
  const whatsAppLink = buildWhatsAppLink(lead.whatsapp || lead.phone, whatsAppText);

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
              <span>{lead.intent_score}</span>
            </span>
          </div>
        </div>

        {/* Customer Name & Property */}
        <div className="mb-2.5">
          <h4 className="text-sm font-black text-[#0B192C] leading-snug group-hover:text-[#3D74D9] transition">
            {lead.customer_name}
          </h4>
          {lead.company && <div className="text-xs text-[#5B6D85] font-medium mt-0.5">{lead.company}</div>}
        </div>

        {/* Service Required */}
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E5E9F0] mb-3 space-y-1.5">
          <div className="text-xs font-bold text-[#0B192C] line-clamp-2">{lead.service_required}</div>
          <div className="flex items-center gap-1.5 text-xs text-[#5B6D85]">
            <MapPin className="w-3.5 h-3.5 text-[#3D74D9] shrink-0" />
            <span className="truncate">{lead.location}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E9F0]">
            <span className="font-extrabold text-emerald-700">{lead.budget_formatted}</span>
            <span className="text-[#5B6D85] font-semibold">{formatTimeline(lead.timeline)}</span>
          </div>
        </div>

        {/* Freshness Badge */}
        <div className="text-xs text-emerald-700 font-semibold mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{lead.freshness_label}</span>
        </div>

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
              className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Lead</span>
            </button>
          </div>
        ) : (
          <div className="bg-[#F4F7FB] border border-[#E5E9F0] rounded-xl p-2.5 mb-3">
            <div className="flex items-center justify-between text-xs text-[#0B192C]">
              <span className="font-mono font-bold">{displayPhone}</span>
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold transition flex items-center gap-1"
                title="Open WhatsApp Chat with introductory quote template"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Fast Action Buttons & Status Mover */}
      <div className="space-y-2 pt-2 border-t border-[#E5E9F0]">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onConvertToQuote(lead)}
            className="py-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            title="Convert directly to Quotation"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>+ Quote</span>
          </button>

          <button
            onClick={() => onEdit(lead)}
            className="py-1.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-xs font-bold transition active:scale-95"
          >
            Details
          </button>
        </div>

        {/* Move Status Dropdown */}
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 py-1">
          <span className="text-[11px] font-bold text-[#5B6D85] whitespace-nowrap">Status:</span>
          <select
            value={lead.status}
            onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
            className="w-full text-xs font-bold bg-transparent text-[#0B192C] focus:outline-none cursor-pointer"
          >
            <option value="New">Status: New</option>
            <option value="Contacted">Status: Contacted</option>
            <option value="Qualified">Status: Qualified</option>
            <option value="Quote Sent">Status: Quote Sent</option>
            <option value="Negotiating">Status: Negotiating</option>
            <option value="Won">Status: Won</option>
            <option value="Lost">Status: Lost</option>
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
  onConvertToCustomer: (lead: Lead) => void;
  onScheduleFollowUp: (lead: Lead) => void;
  onOpenSubscription: () => void;
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

      {/* Service Required */}
      <td className="px-4 py-3">
        <div className="font-semibold text-[#0B192C] max-w-[200px] truncate">{lead.service_required}</div>
        <div className="text-[10px] text-[#5B6D85]">{lead.service_category}</div>
      </td>

      {/* Location & Budget */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-[#0B192C] font-semibold">
          <MapPin className="w-3 h-3 text-[#3D74D9]" />
          <span>{lead.location}</span>
        </div>
        <div className="text-[11px] text-emerald-700 font-bold">{lead.budget_formatted}</div>
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
          className="text-xs font-semibold py-1 px-2 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#0B192C]"
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
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition"
          >
            <Lock className="w-3 h-3" />
            <span>Unlock Lead</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-[#0B192C]">{lead.whatsapp || lead.phone}</span>
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
              title="Open WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
        <button
          onClick={() => onConvertToQuote(lead)}
          className="px-2.5 py-1 rounded-lg bg-[#0B192C] hover:bg-[#152744] text-white text-[11px] font-bold transition"
        >
          + Quote
        </button>
        <button
          onClick={() => onConvertToCustomer(lead)}
          className="px-2 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#5B6D85] hover:text-[#0B192C] text-[11px] font-semibold transition"
          title="Save as Customer"
        >
          + Customer
        </button>
        <button
          onClick={() => onEdit(lead)}
          className="px-2 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#5B6D85] hover:text-[#0B192C] text-[11px] font-semibold transition"
        >
          Edit
        </button>
      </td>
    </tr>
  );
};
