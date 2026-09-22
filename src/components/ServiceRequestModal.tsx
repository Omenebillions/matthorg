import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  MapPin,
  Calendar,
  MessageSquare,
  DollarSign,
  Send,
  Building,
  ShieldCheck,
  Flame,
  Search,
} from 'lucide-react';
import { Lead } from '../types';
import { createCustomerRequest } from '../lib/db';
import {
  SERVICE_CATEGORIES,
  POPULAR_LOCATIONS,
  calculateIntentScore,
  parseNaturalLanguageRequest,
} from '../data/marketplaceData';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest: (newLead: Lead) => void;
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmitRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'smart' | 'form'>('smart');

  // "Request Anything" NLP input
  const [naturalText, setNaturalText] = useState(
    'I just moved into a 3-bedroom house in Abuja and need solar, CCTV, and internet setup with lithium battery backup.'
  );
  const [isExtracted, setIsExtracted] = useState(false);

  // Form Fields
  const [serviceRequired, setServiceRequired] = useState('Solar Installation');
  const [serviceCategory, setServiceCategory] = useState('Power & Technology');
  const [location, setLocation] = useState('Abuja (FCT)');
  const [propertyType, setPropertyType] = useState('3-bedroom house');
  const [budgetFormatted, setBudgetFormatted] = useState('₦1,500,000 – ₦2,500,000');
  const [timeline, setTimeline] = useState<'immediate' | 'within_7_days' | 'within_30_days' | 'flexible'>('within_7_days');
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [detectedServicesList, setDetectedServicesList] = useState<string[]>([]);

  // Verification Simulation Modal State
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);
  const [showVerificationStep, setShowVerificationStep] = useState(false);

  if (!isOpen) return null;

  const handleRunSmartExtraction = () => {
    if (!naturalText.trim()) return;
    const parsed = parseNaturalLanguageRequest(naturalText);
    setDetectedServicesList(parsed.services);
    setServiceRequired(parsed.services.join(', '));
    setServiceCategory(parsed.category);
    setLocation(parsed.location);
    setPropertyType(parsed.property);
    setBudgetFormatted(parsed.budget);
    setTimeline(parsed.timeline);
    setNotes(naturalText);
    setIsExtracted(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { score, level } = calculateIntentScore({
      service_required: serviceRequired,
      phone: whatsapp,
      whatsapp,
      location,
      budget_formatted: budgetFormatted,
      timeline,
      is_verified: true,
      notes: notes || naturalText,
    });

    const leadNum = `MAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newLead: Lead = {
      id: `lead_market_${Date.now()}`,
      lead_number: leadNum,
      customer_name: customerName.trim() || 'Prospective Seeker',
      phone: whatsapp.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim() || undefined,
      location,
      service_required: serviceRequired,
      service_category: serviceCategory,
      property_type: propertyType,
      budget_formatted: budgetFormatted,
      timeline,
      source: 'marketplace',
      source_name: 'Mathorg Marketplace Portal',
      status: 'New',
      intent_score: score,
      intent_level: level,
      is_verified: true,
      verified_at: new Date().toISOString(),
      freshness: 'active',
      freshness_label: '🔥 Active — verified just now',
      is_locked: true, // Marketplace leads start locked for unsubscribed providers
      notes: notes.trim() || naturalText.trim(),
      requirements_list: detectedServicesList.length > 0 ? detectedServicesList : [serviceRequired],
      created_at: new Date().toISOString(),
    };

    setSubmittedLead(newLead);
    setShowVerificationStep(true);

    // Persist customer request to public.customer_requests in Supabase
    createCustomerRequest({
      customer_name: customerName.trim() || 'Prospective Seeker',
      phone: whatsapp.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim() || undefined,
      location,
      service_required: serviceRequired,
      service_category: serviceCategory,
      property_type: propertyType,
      budget_formatted: budgetFormatted,
      timeline,
      details: notes.trim() || naturalText.trim(),
      status: 'Open',
    }).then((persistedReq) => {
      if (persistedReq) {
        newLead.customer_request_id = persistedReq.id;
      }
    }).catch((err) => {
      console.warn('Customer request persistence notice:', err);
    });
  };

  const handleConfirmVerification = (stillLooking: boolean) => {
    if (!submittedLead) return;

    if (stillLooking) {
      const verifiedLead: Lead = {
        ...submittedLead,
        intent_score: Math.min(100, submittedLead.intent_score + 10),
        intent_level: 'Very High',
        is_verified: true,
        verified_at: new Date().toISOString(),
        freshness_label: '🔥 Active — verified 1 minute ago',
      };
      onSubmitRequest(verifiedLead);
    } else {
      const closedLead: Lead = {
        ...submittedLead,
        status: 'Lost',
        freshness: 'closed',
        freshness_label: 'Closed by Seeker',
      };
      onSubmitRequest(closedLead);
    }

    setShowVerificationStep(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E5E9F0] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E9F0] bg-gradient-to-r from-emerald-900 to-[#0B192C] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Free Consumer Portal
              </span>
              <span className="text-xs text-emerald-200/80">No subscription required</span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">Find Verified Service Providers</h2>
            <p className="text-xs text-emerald-100/70 mt-0.5">
              Submit your request to receive competitive quotes from rated businesses in your area.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Step Overlay Simulation */}
        {showVerificationStep && submittedLead ? (
          <div className="p-6 md:p-8 space-y-6 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <Flame className="w-3.5 h-3.5 text-emerald-600" /> Intent Verification (PRD Engine)
              </div>
              <h3 className="text-lg font-bold text-[#0B192C]">
                Simulated WhatsApp Verification Ping
              </h3>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-left text-xs space-y-2 text-[#334155] shadow-inner font-sans">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <MessageSquare className="w-4 h-4" /> WhatsApp Prompt to {submittedLead.customer_name}:
                </div>
                <p className="italic text-[#475569]">
                  "Hi {submittedLead.customer_name}, you recently requested a quote for *{submittedLead.service_required}* in *{submittedLead.location}* on Mathorg. Are you still looking for this service?"
                </p>
              </div>
              <p className="text-xs text-[#5B6D85]">
                Confirming customer freshness protects providers from stale inquiries and guarantees high intent score ({submittedLead.intent_score}/100).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmVerification(true)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, I'm still looking (Confirm Request)</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmVerification(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                No, I've sorted it
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Mode Switch Tabs */}
            <div className="flex border-b border-[#E5E9F0] bg-[#F8FAFC]">
              <button
                type="button"
                onClick={() => setActiveTab('smart')}
                className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'smart'
                    ? 'border-emerald-600 text-emerald-800 bg-white'
                    : 'border-transparent text-[#5B6D85] hover:text-[#0B192C]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>"Request Anything" (Smart AI Parser)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'form'
                    ? 'border-emerald-600 text-emerald-800 bg-white'
                    : 'border-transparent text-[#5B6D85] hover:text-[#0B192C]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#3D74D9]" />
                <span>Standard Request Form</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              {activeTab === 'smart' && (
                <div className="space-y-3 bg-[#F0FDF4] p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Describe what you need in plain words:
                    </label>
                    <span className="text-[10px] text-emerald-700">PRD Section 19 Feature</span>
                  </div>
                  <textarea
                    rows={3}
                    value={naturalText}
                    onChange={(e) => {
                      setNaturalText(e.target.value);
                      setIsExtracted(false);
                    }}
                    placeholder="e.g. I just moved into a 3-bedroom house in Abuja and need solar, CCTV, internet and curtains."
                    className="w-full rounded-xl bg-white border border-emerald-300 p-3 text-xs text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleRunSmartExtraction}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isExtracted ? 'Re-Analyze Request' : 'Auto-Extract Requirements'}</span>
                    </button>
                    {isExtracted && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Extracted successfully below
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Service & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0B192C] mb-1">
                    Service Category
                  </label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B192C] mb-1">
                    What Service Do You Need? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solar Hybrid Installation, CCTV Setup"
                    value={serviceRequired}
                    onChange={(e) => setServiceRequired(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Location & Property */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0B192C] mb-1">
                    Location (City / Area) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-[#5B6D85] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abuja - Maitama"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      list="seeker-locations"
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                    />
                    <datalist id="seeker-locations">
                      {POPULAR_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B192C] mb-1">
                    Property / Facility Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3-bedroom house, Duplex, Office"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Budget & Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0B192C] mb-1">
                    Estimated Budget Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₦1,000,000 – ₦1,500,000"
                    value={budgetFormatted}
                    onChange={(e) => setBudgetFormatted(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B192C] mb-1">
                    When Do You Need This Done?
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value as any)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  >
                    <option value="immediate">Immediately / Urgent</option>
                    <option value="within_7_days">Within 7 Days</option>
                    <option value="within_30_days">Within 30 Days</option>
                    <option value="flexible">Flexible / Exploring Options</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t border-[#E5E9F0] pt-4 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0B192C] flex items-center justify-between">
                  <span>Your Contact Details (Confidential)</span>
                  <span className="text-[11px] text-[#5B6D85] font-normal">
                    🔒 Kept private until matched with verified providers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B192C] mb-1">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Okafor"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B192C] mb-1">
                      WhatsApp / Phone <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-3.5 h-3.5 text-[#5B6D85] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="+234 802 123 4567"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B192C] mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E9F0]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B6D85] hover:text-[#0B192C] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs font-bold shadow-md transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Service Request</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
