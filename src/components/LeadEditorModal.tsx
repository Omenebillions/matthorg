import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Flame,
  Phone,
  MessageSquare,
  Mail,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  User,
  Layers,
  Wrench,
  Clock,
} from 'lucide-react';
import { Lead, LeadSource, LeadStatus, AppState, BusinessProfile } from '../types';
import { SERVICE_CATEGORIES, POPULAR_LOCATIONS, calculateIntentScore } from '../data/marketplaceData';

interface LeadEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  state?: AppState;
  business?: BusinessProfile;
  onSaveLead: (lead: Lead) => void;
  onConvertToQuote?: (lead: Lead) => void;
}

export const LeadEditorModal: React.FC<LeadEditorModalProps> = ({
  isOpen,
  onClose,
  lead,
  state,
  business,
  onSaveLead,
  onConvertToQuote,
}) => {
  const isEditing = Boolean(lead);

  const [customerName, setCustomerName] = useState(lead?.customer_name || '');
  const [phone, setPhone] = useState(lead?.phone || '');
  const [whatsapp, setWhatsapp] = useState(lead?.whatsapp || '');
  const [email, setEmail] = useState(lead?.email || '');
  const [company, setCompany] = useState(lead?.company || '');
  const [location, setLocation] = useState(lead?.location || business?.city || 'Abuja (FCT)');
  const [serviceCategory, setServiceCategory] = useState(lead?.service_category || 'Power & Technology');
  const [serviceRequired, setServiceRequired] = useState(lead?.service_required || '');
  const [propertyType, setPropertyType] = useState(lead?.property_type || 'Residential (Duplex/House)');
  const [estimatedValue, setEstimatedValue] = useState<string>(
    lead?.estimated_value ? String(lead.estimated_value) : ''
  );
  const [budgetFormatted, setBudgetFormatted] = useState(lead?.budget_formatted || '₦1,000,000 – ₦2,500,000');
  const [timeline, setTimeline] = useState<'immediate' | 'within_7_days' | 'within_30_days' | 'flexible'>(
    lead?.timeline || 'within_7_days'
  );
  const [source, setSource] = useState<LeadSource>(lead?.source || 'manual');
  const [sourceName, setSourceName] = useState(lead?.source_name || '');
  const [status, setStatus] = useState<LeadStatus>(lead?.status || 'New');
  const [notes, setNotes] = useState(lead?.notes || '');
  const [nextFollowUp, setNextFollowUp] = useState(lead?.next_follow_up || '');
  const [isVerified, setIsVerified] = useState(lead?.is_verified ?? true);

  // Validation feedback
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync when lead prop changes
  useEffect(() => {
    if (lead) {
      setCustomerName(lead.customer_name || '');
      setPhone(lead.phone || '');
      setWhatsapp(lead.whatsapp || lead.phone || '');
      setEmail(lead.email || '');
      setCompany(lead.company || '');
      setLocation(lead.location || business?.city || 'Abuja (FCT)');
      setServiceCategory(lead.service_category || 'Power & Technology');
      setServiceRequired(lead.service_required || '');
      setPropertyType(lead.property_type || 'Residential (Duplex/House)');
      setEstimatedValue(lead.estimated_value ? String(lead.estimated_value) : '');
      setBudgetFormatted(lead.budget_formatted || '₦1,000,000 – ₦2,500,000');
      setTimeline(lead.timeline || 'within_7_days');
      setSource(lead.source || 'manual');
      setSourceName(lead.source_name || '');
      setStatus(lead.status || 'New');
      setNotes(lead.notes || '');
      setNextFollowUp(lead.next_follow_up || '');
      setIsVerified(lead.is_verified ?? true);
    } else {
      setCustomerName('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setCompany('');
      setLocation(business?.city || 'Abuja (FCT)');
      setServiceCategory('Power & Technology');
      setServiceRequired('');
      setPropertyType('Residential (Duplex/House)');
      setEstimatedValue('');
      setBudgetFormatted('₦1,000,000 – ₦2,500,000');
      setTimeline('within_7_days');
      setSource('manual');
      setSourceName('');
      setStatus('New');
      setNotes('');
      setNextFollowUp('');
      setIsVerified(true);
    }
    setValidationError(null);
  }, [lead, isOpen, business]);

  // Live calculation of intent score
  const { score: computedScore, level: computedLevel } = calculateIntentScore({
    service_required: serviceRequired,
    phone: phone || whatsapp,
    whatsapp: whatsapp || phone,
    location,
    budget_formatted: budgetFormatted,
    timeline,
    is_verified: isVerified,
    notes,
  });

  if (!isOpen) return null;

  const currentCategoryObj =
    SERVICE_CATEGORIES.find((c) => c.name === serviceCategory) || SERVICE_CATEGORIES[0];

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (!whatsapp || whatsapp === phone) {
      setWhatsapp(val);
    }
    if (validationError) setValidationError(null);
  };

  const handleWhatsappChange = (val: string) => {
    setWhatsapp(val);
    if (!phone) {
      setPhone(val);
    }
    if (validationError) setValidationError(null);
  };

  const handleEstimatedValueChange = (val: string) => {
    const cleanNum = val.replace(/[^0-9]/g, '');
    setEstimatedValue(cleanNum);
    if (cleanNum) {
      const num = parseInt(cleanNum, 10);
      setBudgetFormatted(`₦${num.toLocaleString()}`);
    }
  };

  const validateForm = (): boolean => {
    if (!customerName.trim()) {
      setValidationError('Please enter the customer or prospect name.');
      return false;
    }
    if (!phone.trim() && !whatsapp.trim() && !email.trim()) {
      setValidationError('Please provide at least one contact method (Phone or WhatsApp).');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const constructLeadObject = (): Lead => {
    const rawNum = estimatedValue ? parseInt(estimatedValue.replace(/[^0-9]/g, ''), 10) : 0;
    const finalPhone = phone.trim() || whatsapp.trim() || 'N/A';
    const finalWhatsapp = whatsapp.trim() || phone.trim() || finalPhone;
    const existingCount = state?.leads?.length ?? 12;

    return {
      id: lead?.id || `lead_${Date.now()}`,
      lead_number: lead?.lead_number || `MAT-${String(120 + existingCount).padStart(6, '0')}`,
      customer_name: customerName.trim() || 'Prospective Client',
      phone: finalPhone,
      whatsapp: finalWhatsapp,
      email: email.trim() || undefined,
      company: company.trim() || undefined,
      location: location.trim() || business?.city || 'Abuja (FCT)',
      service_required: serviceRequired.trim() || `${serviceCategory} Project Inquiry`,
      service_category: serviceCategory,
      property_type: propertyType.trim() || 'Residential',
      budget_formatted:
        budgetFormatted.trim() || (rawNum > 0 ? `₦${rawNum.toLocaleString()}` : 'Budget upon inspection'),
      estimated_value: rawNum > 0 ? rawNum : lead?.estimated_value || 0,
      budget_min: rawNum > 0 ? Math.round(rawNum * 0.85) : lead?.budget_min,
      budget_max: rawNum > 0 ? Math.round(rawNum * 1.15) : lead?.budget_max,
      timeline,
      source,
      source_name: sourceName.trim() || (source === 'manual' ? 'Direct Entry' : undefined),
      status,
      intent_score: computedScore,
      intent_level: computedLevel,
      is_verified: isVerified,
      verified_at: isVerified ? lead?.verified_at || new Date().toISOString() : undefined,
      freshness: 'active',
      freshness_label: '🔥 Active — verified today',
      is_locked: false, // User leads are ALWAYS 100% unlocked and free
      notes: notes.trim(),
      next_follow_up: nextFollowUp || undefined,
      quote_id: lead?.quote_id,
      customer_id: lead?.customer_id,
      created_at: lead?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const newLead = constructLeadObject();
      onSaveLead(newLead);
      onClose();
    } catch (err) {
      console.error('Failed to save lead:', err);
      setValidationError('Failed to save lead. Please verify the entered information.');
    }
  };

  const handleSaveAndQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const newLead = constructLeadObject();
      onSaveLead(newLead);
      onClose();
      if (onConvertToQuote) {
        setTimeout(() => {
          onConvertToQuote(newLead);
        }, 100);
      }
    } catch (err) {
      console.error('Failed to save lead and generate quote:', err);
      setValidationError('Failed to proceed. Please check the entered information.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E5E9F0] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E5E9F0] bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {isEditing ? 'Edit Lead' : 'Add New Lead (100% Free)'}
              </span>
              <span className="text-xs text-[#5B6D85] font-mono">
                {isEditing ? lead?.lead_number : 'Pipeline Entry'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#0B192C] mt-1">
              {isEditing ? `Update Lead: ${lead?.customer_name}` : 'Record New Customer Inquiry'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#5B6D85] hover:text-[#0B192C] hover:bg-[#E2E8F0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intent Score Banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#F0FDF4] border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-950">Calculated Intent:</span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              {computedScore}/100 — {computedLevel} Intent
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700">
            ✓ Your leads are never locked and free to contact
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Customer Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E5E9F0]">
              <User className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#0B192C]">
                Customer & Contact Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Customer / Prospect Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alhaji Mansur Bello or Chief Obi"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs font-semibold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Company / Organization (Optional)
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-[#5B6D85] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Bello Logistics Ltd"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-[#5B6D85] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="0803 000 0000"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="0803 000 0000"
                    value={whatsapp}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#5B6D85] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Service & Requirement */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E5E9F0]">
              <Wrench className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#0B192C]">
                Service & Scope
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Service Category
                </label>
                <select
                  value={serviceCategory}
                  onChange={(e) => {
                    setServiceCategory(e.target.value);
                  }}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition cursor-pointer"
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
                  Specific Service Required
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10kVA Solar Hybrid & Lithium Setup"
                  value={serviceRequired}
                  onChange={(e) => setServiceRequired(e.target.value)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs font-semibold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Category Sub-items Suggestions */}
            {currentCategoryObj && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-[#5B6D85] font-semibold">Quick select:</span>
                {currentCategoryObj.subcategories.slice(0, 5).map((sub) => (
                  <button
                    type="button"
                    key={sub}
                    onClick={() => setServiceRequired(sub)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#F1F5F9] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-[#334155] border border-[#CBD5E1] transition"
                  >
                    + {sub}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Location (State / City / Area)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Abuja - Maitama, or Lekki Phase 1"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    list="lead-locations"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                  <datalist id="lead-locations">
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
                  placeholder="e.g. 5-Bedroom Duplex, Office Complex, Warehouse"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Budget, Stage & Source */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E5E9F0]">
              <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#0B192C]">
                Financials & Pipeline Status
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Estimated Value (₦)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="1,500,000"
                    value={estimatedValue ? Number(estimatedValue).toLocaleString() : ''}
                    onChange={(e) => handleEstimatedValueChange(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-8 pr-3 py-2 text-xs font-black text-emerald-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Budget Display
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₦1,500,000 – ₦2,500,000"
                  value={budgetFormatted}
                  onChange={(e) => setBudgetFormatted(e.target.value)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Initial Stage Tab
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs font-black text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition cursor-pointer"
                >
                  <option value="New">Stage: New Inquiry</option>
                  <option value="Contacted">Stage: Contacted</option>
                  <option value="Qualified">Stage: Qualified</option>
                  <option value="Quote Sent">Stage: Quote Sent</option>
                  <option value="Negotiating">Stage: Negotiating</option>
                  <option value="Won">Stage: Won / Converted</option>
                  <option value="Lost">Stage: Lost / Closed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Execution Timeline
                </label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value as any)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition cursor-pointer"
                >
                  <option value="immediate">Immediate / Urgent</option>
                  <option value="within_7_days">Within 7 Days</option>
                  <option value="within_30_days">Within 30 Days</option>
                  <option value="flexible">Flexible / Exploring</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Lead Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition cursor-pointer"
                >
                  <option value="manual">Manual / Walk-in</option>
                  <option value="WhatsApp">Direct WhatsApp</option>
                  <option value="referral">Word-of-mouth Referral</option>
                  <option value="website">Company Website</option>
                  <option value="Google Ads">Google Search</option>
                  <option value="Meta Ads">Instagram / Facebook</option>
                  <option value="partner">Partner / Subcontractor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Next Follow-Up Date
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-[#5B6D85] absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B192C] mb-1">
                Project Notes & Specific Requirements
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Client needs inverter system to carry 2 ACs, water pumping machine and refrigerator. Prefers Tier-1 equipment and 5-year warranty."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E5E9F0]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-[#5B6D85] hover:text-[#0B192C] hover:bg-[#F1F5F9] transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onConvertToQuote && (
                <button
                  type="button"
                  onClick={handleSaveAndQuote}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0B192C] px-4 py-2.5 text-xs font-bold transition shadow-sm active:scale-95"
                  title="Save lead and immediately open quote generator"
                >
                  <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Save & Create Quote</span>
                </button>
              )}

              <button
                type="submit"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-5 py-2.5 text-xs font-bold shadow-md transition active:scale-95"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isEditing ? 'Update Lead' : 'Add to Pipeline'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

