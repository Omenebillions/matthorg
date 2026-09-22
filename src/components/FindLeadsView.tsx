import React, { useState } from 'react';
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
} from 'lucide-react';
import { Lead, BusinessProfile, PlanTier } from '../types';
import { SERVICE_CATEGORIES, POPULAR_LOCATIONS } from '../data/marketplaceData';
import { formatTimeline, buildWhatsAppLink, createLeadIntroWhatsAppText } from '../utils/formatters';
import { hasActiveSubscription } from '../lib/db';

interface FindLeadsViewProps {
  leads: Lead[];
  business: BusinessProfile;
  currentUserPlan: PlanTier;
  onUnlockLead: (lead: Lead) => void;
  onConvertToQuote: (lead: Lead) => void;
  onOpenServiceRequest: () => void;
  onOpenSubscription: () => void;
}

export const FindLeadsView: React.FC<FindLeadsViewProps> = ({
  leads,
  business,
  currentUserPlan,
  onUnlockLead,
  onConvertToQuote,
  onOpenServiceRequest,
  onOpenSubscription,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [intentFilter, setIntentFilter] = useState<'all' | 'hot' | 'high'>('all');

  // Filter only marketplace leads
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
      {/* Marketplace Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#152744] to-[#1E3E62] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Background ambient pattern */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mathorg Verified Service Marketplace</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Find High-Intent Buyer Requests
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Real individuals and organizations in Nigeria actively requesting services. Every request includes verified phone/WhatsApp, budget range, and property specifications.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!isPaidPlan ? (
              <button
                onClick={onOpenSubscription}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>Upgrade to Pro to Unlock Marketplace Leads</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Active {currentUserPlan.toUpperCase()} Plan — Instant Lead Unlocking Enabled</span>
              </div>
            )}

            <button
              onClick={onOpenServiceRequest}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Submit New Customer Request (Free)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E9F0] shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search query */}
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

          {/* Category Dropdown */}
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

          {/* Location Dropdown */}
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
          const displayEmail = isLocked ? '••••••••@gmail.com' : lead.email;

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
                {/* Header Strip: Number, Category, Intent */}
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

                {/* Service Required Title */}
                <h3 className="text-base font-bold text-[#0B192C] mb-1 leading-snug">
                  {lead.service_required}
                </h3>

                {/* Location & Property */}
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

                {/* Budget & Timeline Bar */}
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

                {/* Requirements list */}
                {lead.requirements_list && lead.requirements_list.length > 0 && (
                  <div className="mb-3 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-[#8F9FB5]">Key Requirements:</div>
                    <ul className="space-y-1">
                      {lead.requirements_list.map((req, idx) => (
                        <li key={idx} className="text-xs text-[#334155] flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Freshness & Verification */}
                <div className="text-xs text-emerald-700 font-semibold mb-4 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{lead.freshness_label}</span>
                </div>
              </div>

              {/* Action Box: Locked vs Unlocked */}
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
                      onClick={() => onUnlockLead(lead)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 active:scale-95"
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
                      onClick={() => onConvertToQuote(lead)}
                      className="w-full py-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
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
              Try selecting "All Categories" or "All Locations", or submit a new customer request to test the matching engine.
            </p>
            <button
              onClick={onOpenServiceRequest}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
            >
              + Submit Test Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
