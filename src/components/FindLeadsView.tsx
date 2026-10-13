import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  Flame,
  Lock,
  Unlock,
  Building,
  CheckCircle2,
  Filter,
  ArrowRight,
  MessageSquare,
  FileText,
  Clock,
  Briefcase,
  Zap,
  RefreshCw,
  Layers,
  ExternalLink,
  UserCheck,
  RotateCcw,
  Check,
  AlertCircle,
  Sliders,
  Send,
  Phone,
} from 'lucide-react';
import {
  Lead,
  BusinessProfile,
  PlanTier,
  CustomerRequest,
  CustomerRequestStatus,
  PublicProfessionalProfile,
  MatchedProfessionalCandidate,
} from '../types';
import { SERVICE_CATEGORIES, POPULAR_LOCATIONS } from '../data/marketplaceData';
import {
  formatTimeline,
  buildWhatsAppLink,
  createLeadIntroWhatsAppText,
  formatDate,
} from '../utils/formatters';
import {
  hasActiveSubscription,
  fetchCustomerRequests,
  updateCustomerRequestStatus,
  convertCustomerRequestToLead,
  fetchPublicProfessionals,
  matchProfessionalsForRequest,
} from '../lib/db';
import { seedVerifiedProfessionals } from '../data/professionalsData';

interface FindLeadsViewProps {
  leads: Lead[];
  business: BusinessProfile;
  currentUserPlan: PlanTier;
  onUnlockLead: (lead: Lead) => void;
  onConvertToQuote: (lead: Lead) => void;
  onOpenServiceRequest: () => void;
  onOpenSubscription: () => void;
  onNewLeadCreated?: (lead: Lead) => void;
}

export const FindLeadsView: React.FC<FindLeadsViewProps> = ({
  leads,
  business,
  currentUserPlan,
  onUnlockLead,
  onConvertToQuote,
  onOpenServiceRequest,
  onOpenSubscription,
  onNewLeadCreated,
}) => {
  // Command Centre View Mode
  const [activeMode, setActiveMode] = useState<'requests' | 'leads'>('requests');

  // Customer Requests State
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerRequestStatus>('all');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  // Directory Professionals for live matching preview
  const [directoryPros, setDirectoryPros] = useState<PublicProfessionalProfile[]>([]);
  const [seedingFeedback, setSeedingFeedback] = useState<string | null>(null);

  // Lead Feed State (Traditional marketplace leads)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [intentFilter, setIntentFilter] = useState<'all' | 'hot' | 'high'>('all');

  // Load customer requests from Supabase & local cache
  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await fetchCustomerRequests();
      setCustomerRequests(data);
    } catch (err) {
      console.warn('[Mathorg] Load requests notice:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Load directory professionals for rules-based matching
  const loadDirectoryPros = async () => {
    try {
      const list = await fetchPublicProfessionals({ randomize: false });
      setDirectoryPros(list || []);
    } catch (err) {
      console.warn('[Mathorg] Load pros notice:', err);
    }
  };

  useEffect(() => {
    loadRequests();
    loadDirectoryPros();
  }, []);

  // Handle Seeding of Demo Directory Benchmark Professionals
  const handleSeedProfessionals = () => {
    const seeded = seedVerifiedProfessionals();
    setDirectoryPros(seeded);
    setSeedingFeedback(`Successfully synchronized ${seeded.length} demo directory contractors (clearly labeled unverified demo records).`);
    setTimeout(() => setSeedingFeedback(null), 5000);
  };

  // Handle status update for a request
  const handleUpdateStatus = async (requestId: string, newStatus: CustomerRequestStatus) => {
    setUpdatingRequestId(requestId);
    try {
      await updateCustomerRequestStatus(requestId, newStatus, business.id);
      setCustomerRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: newStatus,
                contacted_by_business_ids: r.contacted_by_business_ids?.includes(business.id)
                  ? r.contacted_by_business_ids
                  : [...(r.contacted_by_business_ids || []), business.id],
                updated_at: new Date().toISOString(),
              }
            : r
        )
      );
    } catch (err) {
      console.error('Failed to update request status:', err);
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // Handle converting request into business lead
  const handleClaimRequestAsLead = async (req: CustomerRequest) => {
    setUpdatingRequestId(req.id);
    try {
      const createdLead = await convertCustomerRequestToLead(business.id, req);
      if (createdLead && onNewLeadCreated) {
        onNewLeadCreated(createdLead);
      }
      await handleUpdateStatus(req.id, 'Contacted');
      setSeedingFeedback(`Request #${req.request_number} claimed and converted to lead in your pipeline.`);
      setTimeout(() => setSeedingFeedback(null), 4000);
    } catch (err: any) {
      alert(`Could not convert request: ${err?.message || 'Unknown error'}`);
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // Filtered Customer Requests
  const filteredCustomerRequests = useMemo(() => {
    return customerRequests.filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }
      if (requestSearchQuery.trim()) {
        const q = requestSearchQuery.toLowerCase();
        const matchNum = req.request_number.toLowerCase().includes(q);
        const matchService = req.service_required.toLowerCase().includes(q);
        const matchLoc = req.location.toLowerCase().includes(q);
        const matchCustomer = req.customer_name.toLowerCase().includes(q);
        const matchPhone = (req.phone || '').includes(q);
        if (!matchNum && !matchService && !matchLoc && !matchCustomer && !matchPhone) {
          return false;
        }
      }
      return true;
    });
  }, [customerRequests, statusFilter, requestSearchQuery]);

  // Filtered marketplace leads for provider feed
  const marketplaceLeads = leads.filter((l) => l.source === 'marketplace');

  const filteredMarketplaceLeads = marketplaceLeads.filter((lead) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.customer_name.toLowerCase().includes(q);
      const matchService = lead.service_required.toLowerCase().includes(q);
      const matchLoc = lead.location.toLowerCase().includes(q);
      const matchNotes = (lead.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchService && !matchLoc && !matchNotes) return false;
    }

    if (selectedCategory !== 'all' && lead.service_category !== selectedCategory) {
      return false;
    }

    if (selectedLocation !== 'all' && !lead.location.includes(selectedLocation)) {
      return false;
    }

    if (intentFilter === 'hot' && lead.intent_score < 80) return false;
    if (intentFilter === 'high' && lead.intent_score < 60) return false;

    return true;
  });

  const isPaidPlan = hasActiveSubscription(
    business.id,
    currentUserPlan,
    business.subscription_status,
    business.subscription_expires_at
  );

  return (
    <div className="space-y-6">
      {/* Marketplace & Command Centre Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#152744] to-[#1E3E62] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>MatthOrg Marketplace & Matching Command Centre</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Customer Requests & Professional Distribution
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Monitor incoming customer service requests, execute rules-based professional matching across Nigerian cities, track lifecycle status transitions, and dispatch notifications.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/15">
              <button
                type="button"
                onClick={() => setActiveMode('requests')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeMode === 'requests'
                    ? 'bg-white text-[#0B192C] shadow-sm'
                    : 'text-white hover:text-emerald-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Request Command Board ({customerRequests.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('leads')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeMode === 'leads'
                    ? 'bg-white text-[#0B192C] shadow-sm'
                    : 'text-white hover:text-emerald-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Buyer Lead Feed ({marketplaceLeads.length})</span>
              </button>
            </div>

            {/* Quick Seeding Tool */}
            <button
              type="button"
              onClick={handleSeedProfessionals}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition cursor-pointer"
              title="Seed 8 demo directory trade companies (unverified benchmark records) for matching test"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Seed Demo Directory Contractors</span>
            </button>

            <button
              type="button"
              onClick={onOpenServiceRequest}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
            >
              <span>+ Post Customer Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {seedingFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{seedingFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSeedingFeedback(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MODE 1: REQUEST COMMAND BOARD */}
      {activeMode === 'requests' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E9F0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5B6D85] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by Request #, service, location, or customer..."
                  value={requestSearchQuery}
                  onChange={(e) => setRequestSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
                />
              </div>

              <button
                type="button"
                onClick={loadRequests}
                disabled={isLoadingRequests}
                className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-[#5B6D85] hover:text-[#0B192C] transition cursor-pointer"
                title="Refresh requests from database"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingRequests ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 md:pt-0">
              <span className="text-xs font-bold text-[#64748B] mr-1">Status:</span>
              {(['all', 'Open', 'Matched', 'Contacted', 'Converted', 'Closed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#0B192C] text-white shadow-xs'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {st === 'all' ? 'All Requests' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Board Grid */}
          <div className="space-y-4">
            {filteredCustomerRequests.map((req) => {
              // Run matching engine for this request
              const matches = matchProfessionalsForRequest(
                {
                  service: req.service_required,
                  location: req.location,
                  category: req.service_category,
                },
                directoryPros
              );

              const isClaimedByMe = req.contacted_by_business_ids?.includes(business.id);
              const topMatch = matches[0];

              // Direct WhatsApp notification link
              const whatsAppCustomerText = `Hello ${req.customer_name}, this is regarding your MatthOrg request #${req.request_number} for ${req.service_required} in ${req.location}.`;
              const customerWhatsAppLink = buildWhatsAppLink(req.whatsapp || req.phone, whatsAppCustomerText);

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#E5E9F0] p-5 shadow-sm hover:border-[#CBD5E1] transition space-y-4"
                >
                  {/* Top Bar: Request Number, Status Pill, Created Date */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-black text-[#0B192C] px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        {req.request_number}
                      </span>
                      <span className="text-xs font-bold text-[#64748B]">
                        {req.service_category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Lifecycle Status Pill */}
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                          req.status === 'Open'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : req.status === 'Matched'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : req.status === 'Contacted'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : req.status === 'Converted'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {req.status}
                      </span>

                      <span className="text-[11px] text-[#64748B]">
                        {formatDate(req.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Main Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="md:col-span-2 space-y-2">
                      <h3 className="text-lg font-bold text-[#0B192C]">
                        {req.service_required}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#475569]">
                        <span className="flex items-center gap-1 font-semibold text-[#0B192C]">
                          <MapPin className="w-3.5 h-3.5 text-[#3D74D9]" />
                          <span>{req.location}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{req.customer_name}</span>
                        </span>
                        {req.whatsapp && (
                          <span className="flex items-center gap-1 text-emerald-700 font-mono">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{req.whatsapp}</span>
                          </span>
                        )}
                        {req.timeline && (
                          <span className="flex items-center gap-1 text-[#64748B]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimeline(req.timeline)}</span>
                          </span>
                        )}
                      </div>

                      {req.details && (
                        <p className="text-xs text-[#64748B] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] leading-relaxed">
                          "{req.details}"
                        </p>
                      )}
                    </div>

                    {/* Matching Engine Insights */}
                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0B192C] flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Matching Engine</span>
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {matches.length} Eligible Providers
                        </span>
                      </div>

                      {topMatch ? (
                        <div className="space-y-1.5 pt-1 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-[#0B192C] truncate max-w-[140px]">
                                {topMatch.professional.business_name}
                              </span>
                              {topMatch.professional.is_demo ? (
                                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                  Demo (Unverified)
                                </span>
                              ) : topMatch.isVerified ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                  Unverified
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-emerald-700">
                              {topMatch.matchScore}% Match
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] truncate">
                            {topMatch.professional.city ? `${topMatch.professional.city}, ` : ''}{topMatch.professional.state}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {topMatch.matchReasons.slice(0, 2).map((r, i) => (
                              <span key={i} className="text-[10px] bg-white border border-[#CBD5E1] px-1.5 py-0.5 rounded text-slate-600">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          No matching local contractors registered yet.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Operational Action Strip */}
                  <div className="pt-3 border-t border-[#E5E9F0] flex flex-wrap items-center justify-between gap-3 text-xs">
                    {/* Status lifecycle transition selector */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#64748B]">Transition Status:</span>
                      <select
                        value={req.status}
                        disabled={updatingRequestId === req.id}
                        onChange={(e) => handleUpdateStatus(req.id, e.target.value as CustomerRequestStatus)}
                        className="py-1 px-2.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-[#0B192C] focus:bg-white cursor-pointer"
                      >
                        <option value="Open">1. Open / Submitted</option>
                        <option value="Matched">2. Matched with Pros</option>
                        <option value="Contacted">3. Contacted Buyer</option>
                        <option value="Converted">4. Converted to Deal</option>
                        <option value="Closed">5. Closed / Completed</option>
                      </select>
                    </div>

                    {/* Notification & Claim Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Direct WhatsApp Contact Link */}
                      <a
                        href={customerWhatsAppLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat Customer</span>
                      </a>

                      {/* Convert to Lead for Business */}
                      <button
                        type="button"
                        disabled={updatingRequestId === req.id || isClaimedByMe}
                        onClick={() => handleClaimRequestAsLead(req)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                          isClaimedByMe
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-xs'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isClaimedByMe ? 'Already In Leads' : 'Claim as Lead'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Notification Honest Status Indicator */}
                  <div className="text-[11px] text-[#64748B] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <span>
                      Delivery Channel: <strong>WhatsApp Direct Ready</strong> • Server Email/SMS: <em>Manual / Client-directed</em>
                    </span>
                    <span className="font-mono text-slate-500">ID: {req.id}</span>
                  </div>
                </div>
              );
            })}

            {filteredCustomerRequests.length === 0 && (
              <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-[#CBD5E1]">
                <Layers className="w-8 h-8 text-[#8F9FB5] mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[#0B192C]">No Customer Requests Found</h3>
                <p className="text-xs text-[#5B6D85] mt-1 max-w-sm mx-auto">
                  Submit a new request from the homepage or use the button below to test the database workflow.
                </p>
                <button
                  type="button"
                  onClick={onOpenServiceRequest}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-xs font-bold transition cursor-pointer"
                >
                  + Post Customer Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: HIGH-INTENT BUYER LEAD FEED */}
      {activeMode === 'leads' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E9F0] shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-[#5B6D85] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by service (e.g. Solar, CCTV, Cleaning), area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
                />
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
                >
                  <option value="all">All Service Categories</option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0B192C] focus:bg-white focus:border-[#3D74D9] focus:outline-none transition"
                >
                  <option value="all">All Locations (Nigeria)</option>
                  <option value="Abuja">Abuja (FCT)</option>
                  <option value="Lagos">Lagos State</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                  <option value="Ibadan">Ibadan</option>
                  <option value="Kano">Kano</option>
                </select>
              </div>
            </div>

            {/* Intent Score Filters */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-[#5B6D85] font-semibold">Intent Level:</span>
              <button
                type="button"
                onClick={() => setIntentFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  intentFilter === 'all'
                    ? 'bg-[#0B192C] text-white'
                    : 'text-[#5B6D85] bg-[#F1F5F9] hover:text-[#0B192C]'
                }`}
              >
                All Intent
              </button>
              <button
                type="button"
                onClick={() => setIntentFilter('hot')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  intentFilter === 'hot'
                    ? 'bg-amber-500 text-white'
                    : 'text-[#5B6D85] bg-[#F1F5F9] hover:text-[#0B192C]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 group-hover:text-white" />
                <span>🔥 Very High (&ge; 80)</span>
              </button>
              <button
                type="button"
                onClick={() => setIntentFilter('high')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  intentFilter === 'high'
                    ? 'bg-emerald-600 text-white'
                    : 'text-[#5B6D85] bg-[#F1F5F9] hover:text-[#0B192C]'
                }`}
              >
                High & Above (&ge; 60)
              </button>
            </div>
          </div>

          {/* Leads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMarketplaceLeads.map((lead) => {
              const isLocked = lead.is_locked;
              const displayPhone = isLocked ? '+234 802 ••• ••••' : lead.whatsapp || lead.phone;

              const whatsAppText = createLeadIntroWhatsAppText(
                lead.customer_name,
                business.business_name,
                lead.service_required,
                lead.location
              );
              const whatsAppLink = buildWhatsAppLink(lead.whatsapp || lead.phone, whatsAppText);

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-2xl border border-[#E5E9F0] p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#5B6D85]">{lead.lead_number}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {lead.service_category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-600" />
                          <span>{lead.intent_score}/100 {lead.intent_level}</span>
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#0B192C] mb-1 leading-snug">
                      {lead.service_required}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5B6D85] mb-3">
                      <span className="flex items-center gap-1 text-[#0B192C] font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#3D74D9]" />
                        <span>{lead.location}</span>
                      </span>
                      {lead.property_type && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-[#8F9FB5]" />
                          <span>{lead.property_type}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E9F0] mb-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#8F9FB5]">Budget Range</div>
                        <div className="text-xs font-black text-emerald-700 mt-0.5">{lead.budget_formatted}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#8F9FB5]">Timeline</div>
                        <div className="text-xs font-bold text-[#0B192C] mt-0.5">
                          {formatTimeline(lead.timeline)}
                        </div>
                      </div>
                    </div>

                    {lead.notes && (
                      <p className="text-xs text-[#64748B] mb-3 line-clamp-2">
                        {lead.notes}
                      </p>
                    )}

                    <div className="text-xs text-emerald-700 font-semibold mb-4 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{lead.freshness_label || '🔥 Verified Marketplace Buyer'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5E9F0]">
                    {isLocked ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#5B6D85]">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-amber-600" /> Contact Hidden:
                          </span>
                          <span className="font-mono">{displayPhone}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onUnlockLead(lead)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>Unlock Verified Buyer Contact</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                          <div>
                            <div className="text-xs font-bold text-emerald-950">{lead.customer_name}</div>
                            <div className="text-[11px] font-mono text-emerald-800">{lead.whatsapp || lead.phone}</div>
                          </div>

                          <a
                            href={whatsAppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat WhatsApp</span>
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => onConvertToQuote(lead)}
                          className="w-full py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Prepare Quotation for Client</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredMarketplaceLeads.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-[#CBD5E1]">
                <Sparkles className="w-8 h-8 text-[#8F9FB5] mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[#0B192C]">No marketplace leads match your filter</h3>
                <p className="text-xs text-[#5B6D85] mt-1 max-w-sm mx-auto">
                  Try selecting "All Categories" or "All Locations", or switch to the Request Command Board above.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
