import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  AlertCircle,
  Clock,
  DollarSign,
  Building,
  Check,
} from 'lucide-react';
import { createCustomerRequest, createDirectClientInquiryForBusiness } from '../../lib/db';
import { Lead, PublicProfessionalProfile } from '../../types';
import { calculateIntentScore } from '../../data/marketplaceData';

interface QuickRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledService?: string;
  prefilledCategory?: string;
  prefilledLocation?: string;
  targetProfessional?: PublicProfessionalProfile | null;
  onSuccessSubmit?: (lead: Lead) => void;
}

export const QuickRequestModal: React.FC<QuickRequestModalProps> = ({
  isOpen,
  onClose,
  prefilledService = '',
  prefilledCategory = 'General Service',
  prefilledLocation = '',
  targetProfessional,
  onSuccessSubmit,
}) => {
  const [serviceRequired, setServiceRequired] = useState(prefilledService || '');
  const [serviceCategory, setServiceCategory] = useState(prefilledCategory || 'General Service');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState(prefilledLocation || '');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [timeline, setTimeline] = useState<'immediate' | 'within_7_days' | 'within_30_days' | 'flexible'>('within_7_days');
  const [budget, setBudget] = useState('');

  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync props when modal is opened or props change
  useEffect(() => {
    if (isOpen) {
      if (prefilledService) setServiceRequired(prefilledService);
      if (prefilledLocation) setLocation(prefilledLocation);
      if (prefilledCategory) setServiceCategory(prefilledCategory);
      setErrorMessage(null);
    }
  }, [isOpen, prefilledService, prefilledLocation, prefilledCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceRequired.trim()) {
      setErrorMessage('Please state what service or repair you need.');
      return;
    }
    if (!location.trim()) {
      setErrorMessage('Please provide your town and state so local professionals can quote.');
      return;
    }
    if (!customerName.trim() || !phone.trim()) {
      setErrorMessage('Please provide your name and phone/WhatsApp number so professionals can respond.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formattedBudget = budget.trim() ? budget.trim() : 'Negotiable / Requesting quote';

    try {
      let newLead: Lead;
      let finalReqId = '';

      // If targeted to a specific registered professional/business on MatthOrg
      if (targetProfessional) {
        newLead = await createDirectClientInquiryForBusiness(
          targetProfessional.id,
          targetProfessional.business_name,
          {
            customer_name: customerName.trim(),
            phone: phone.trim(),
            whatsapp: phone.trim(),
            email: email.trim() || undefined,
            location: location.trim(),
            service_required: serviceRequired.trim(),
            service_category: serviceCategory.trim(),
            budget_formatted: formattedBudget,
            timeline,
            notes: details.trim() || `Quotation requested for ${targetProfessional.business_name}: ${serviceRequired.trim()}`,
          }
        );
        finalReqId = newLead.lead_number;
      } else {
        const persisted = await createCustomerRequest({
          customer_name: customerName.trim(),
          phone: phone.trim(),
          whatsapp: phone.trim(),
          email: email.trim() || undefined,
          location: location.trim(),
          service_required: serviceRequired.trim(),
          service_category: serviceCategory.trim(),
          budget_formatted: formattedBudget,
          timeline,
          details: details.trim() || `Customer request for ${serviceRequired.trim()}`,
          status: 'Open',
        });

        const reqNum = persisted?.request_number || `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
        finalReqId = reqNum;

        const { score, level } = calculateIntentScore({
          service_required: serviceRequired,
          phone,
          whatsapp: phone,
          location,
          budget_formatted: formattedBudget,
          timeline,
          is_verified: true,
          notes: details,
        });

        newLead = {
          id: `lead_req_${Date.now()}`,
          lead_number: reqNum,
          customer_name: customerName.trim(),
          phone: phone.trim(),
          whatsapp: phone.trim(),
          email: email.trim() || undefined,
          location: location.trim(),
          service_required: serviceRequired.trim(),
          service_category: serviceCategory.trim(),
          budget_formatted: formattedBudget,
          timeline,
          source: 'marketplace',
          source_name: 'MatthOrg Customer Portal',
          status: 'New',
          intent_score: score,
          intent_level: level,
          is_verified: true,
          verified_at: new Date().toISOString(),
          freshness: 'active',
          freshness_label: '🔥 Active — verified just now',
          is_locked: false,
          notes: details.trim(),
          customer_request_id: persisted?.id,
          created_at: new Date().toISOString(),
        };
      }

      if (onSuccessSubmit) {
        onSuccessSubmit(newLead);
      }

      setIsSubmitSuccess(true);
      setTimeout(() => {
        setSubmittedRequestId(finalReqId);
        setIsSubmitSuccess(false);
      }, 600);
    } catch (err: any) {
      console.error('Request submit error:', err);
      setIsSubmitSuccess(false);
      setErrorMessage(
        err?.message || 'Could not save your request to the database. Please check your network and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedRequestId(null);
    setDetails('');
    setBudget('');
    setCustomerName('');
    setPhone('');
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-[#E5E9F0] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0B192C] text-white px-6 sm:px-8 py-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast & Free • Get Quotes from Registered Businesses</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {targetProfessional ? `Request Quote from ${targetProfessional.business_name}` : 'Request a Service'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {targetProfessional
              ? `Your inquiry will route directly to ${targetProfessional.business_name}'s verified dashboard.`
              : 'Tell us what you need done and your location. Registered professionals will review and contact you.'}
          </p>
        </div>

        {/* Success Confirmation State */}
        {submittedRequestId ? (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Inquiry Logged: {submittedRequestId}
              </span>
              <h4 className="text-2xl font-bold text-[#0B192C]">
                {targetProfessional ? `Delivered to ${targetProfessional.business_name}!` : 'Your request is submitted!'}
              </h4>
              <p className="text-sm text-[#5B6D85] max-w-md mx-auto leading-relaxed">
                {targetProfessional
                  ? `Your quotation request was delivered directly to ${targetProfessional.business_name}'s dashboard. They will review your project details and reach out via phone or WhatsApp.`
                  : `We're matching your request for ${serviceRequired} with registered professionals serving ${location}.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-left text-xs space-y-2 max-w-md mx-auto">
              {targetProfessional && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Business:</span>
                  <span className="font-bold text-[#0B192C]">{targetProfessional.business_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#64748B]">Service:</span>
                <span className="font-semibold text-[#0B192C]">{serviceRequired}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Location:</span>
                <span className="font-semibold text-[#0B192C]">{location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Contact:</span>
                <span className="font-semibold text-[#0B192C]">{customerName} ({phone})</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Contact details protected via MatthOrg verified dispatch.</span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full max-w-xs mx-auto py-3 rounded-2xl bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold text-sm shadow transition cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {targetProfessional && (
              <div className="bg-[#F0FDF4] border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Direct Business Inquiry</div>
                  <div className="text-sm font-extrabold text-[#0B192C] truncate">{targetProfessional.business_name}</div>
                  <div className="text-[11px] text-emerald-700">Inquiry routes directly to their business dashboard.</div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Service Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                Service or Work Needed <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={serviceRequired}
                onChange={(e) => setServiceRequired(e.target.value)}
                placeholder="e.g. 10kVA Inverter installation, office rewiring, AC servicing"
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#0B192C] text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]"
                required
              />
            </div>

            {/* Location & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                  Your Town & State <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ikeja, Lagos"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#CBD5E1] text-[#0B192C] text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                  Estimated Budget (Optional)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. ₦350,000 or Negotiable"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#CBD5E1] text-[#0B192C] text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]"
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                When do you need this?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'immediate', label: 'Urgent / Today' },
                  { id: 'within_7_days', label: 'Within 7 Days' },
                  { id: 'within_30_days', label: 'This Month' },
                  { id: 'flexible', label: 'Flexible' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTimeline(item.id as any)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                      timeline === item.id
                        ? 'bg-[#0B192C] text-white border-[#0B192C]'
                        : 'bg-white text-[#5B6D85] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6D85] mb-1.5">
                Project Details / Specifics
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={2}
                placeholder="Describe what needs to be fixed, size of premises, equipment models, or preferred timing..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-[#0B192C] text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]"
              />
            </div>

            {/* Client Contact Info */}
            <div className="pt-2 border-t border-[#E5E9F0]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6D85] mb-3">
                Your Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Name or Company *"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-[#0B192C] text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone / WhatsApp Number *"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-[#0B192C] text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]"
                    required
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#8F9FB5] mt-2">
                Professionals will send official quotations and reach out directly.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isSubmitSuccess}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-85 ${
                isSubmitSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/25 scale-[1.01]'
                  : 'bg-[#0B192C] hover:bg-[#1E3E62] text-white active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending Request...</span>
                </>
              ) : isSubmitSuccess ? (
                <div className="flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-emerald-600 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span>Request Submitted!</span>
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{targetProfessional ? `Send Quote Request to ${targetProfessional.business_name}` : 'Post Request & Get Quotes'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
