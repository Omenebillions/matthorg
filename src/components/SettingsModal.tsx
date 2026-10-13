import React, { useState, useEffect } from 'react';
import { BusinessProfile, User, PlanTier, DocumentDesignTemplate } from '../types';
import {
  Building2,
  CreditCard,
  FileText,
  Phone,
  Mail,
  MapPin,
  X,
  Check,
  Upload,
  Trash2,
  UserCheck,
  RefreshCw,
  Loader2,
  Shield,
  Key,
  Copy,
  ExternalLink,
  CheckCircle2,
  Lock,
  Briefcase,
  Globe,
  Sparkles,
  BookOpen,
  Palette,
  Eye,
  EyeOff,
  Sliders,
  CheckSquare,
  Square,
  ShieldCheck,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import { uploadFileToR2 } from '../lib/storage';
import { getPaystackConfigStatus, PaystackStatus } from '../lib/paystack';
import { BUSINESS_INDUSTRIES, NIGERIAN_STATES } from '../data/businessIndustries';
import { BlogAdminManager } from './seo/BlogAdminManager';
import { autoCreateServicesFromBusinessProfile } from '../data/serviceTaxonomy';
import { registerBusinessToDirectory } from '../data/professionalsData';
import { isProfessionalVerified } from '../lib/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessProfile;
  user: User;
  onSaveBusiness: (updated: BusinessProfile) => void;
  onUpdateUser: (updated: User) => void;
  onResetData: () => void;
  onOpenVerificationModal?: () => void;
  onViewPublicArticle?: (slug: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  business,
  user,
  onSaveBusiness,
  onUpdateUser,
  onResetData,
  onOpenVerificationModal,
  onViewPublicArticle,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'business' | 'designs' | 'payment' | 'terms' | 'paystack' | 'articles' | 'account'>('business');
  const [formData, setFormData] = useState<BusinessProfile>({
    ...business,
    invoice_design: business.invoice_design || 'corporate',
    design_color: business.design_color || '#0B192C',
    show_logo_on_docs: business.show_logo_on_docs ?? true,
    show_address_on_docs: business.show_address_on_docs ?? true,
    show_tax_on_docs: business.show_tax_on_docs ?? true,
    show_banking_on_docs: business.show_banking_on_docs ?? true,
    show_signature_on_docs: business.show_signature_on_docs ?? true,
  });
  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [paystackStatus, setPaystackStatus] = useState<PaystackStatus>({
    isConfigured: false,
    publicKey: null,
    mode: 'unconfigured',
  });

  useEffect(() => {
    if (isOpen) {
      getPaystackConfigStatus().then(setPaystackStatus);
    }
  }, [isOpen]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const publicUrl = await uploadFileToR2(file);
      setFormData((prev) => ({ ...prev, logo: publicUrl }));
    } catch (error) {
      // Local file reader fallback ensures instant offline/local image loading
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, logo: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const [newServiceInput, setNewServiceInput] = useState('');
  const [newlyCreatedServicesCount, setNewlyCreatedServicesCount] = useState<number | null>(null);

  const handleAddService = (serviceToAdd?: string) => {
    const s = (serviceToAdd || newServiceInput).trim();
    if (!s) return;
    const currentList = Array.isArray(formData.categories_offered) ? [...formData.categories_offered] : [];
    if (!currentList.some((item) => item.toLowerCase() === s.toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        categories_offered: [...currentList, s],
      }));
    }
    setNewServiceInput('');
  };

  const handleRemoveService = (serviceToRemove: string) => {
    const currentList = Array.isArray(formData.categories_offered) ? [...formData.categories_offered] : [];
    setFormData((prev) => ({
      ...prev,
      categories_offered: currentList.filter((s) => s.toLowerCase() !== serviceToRemove.toLowerCase()),
    }));
  };

  const handleSave = () => {
    // Ensure categories_offered includes current specialization and added services
    const currentServices = Array.isArray(formData.categories_offered) ? [...formData.categories_offered] : [];
    if (formData.specialization?.trim() && !currentServices.some((s) => s.toLowerCase() === formData.specialization?.trim().toLowerCase())) {
      currentServices.unshift(formData.specialization.trim());
    }

    const updatedFormData: BusinessProfile = {
      ...formData,
      categories_offered: currentServices,
    };

    // Auto-create any new services in the directory!
    const createdServices = autoCreateServicesFromBusinessProfile(updatedFormData);
    if (createdServices.length > 0) {
      setNewlyCreatedServicesCount(createdServices.length);
    }

    // Register updated business in the directory
    registerBusinessToDirectory(updatedFormData);

    onSaveBusiness(updatedFormData);
    onUpdateUser({ ...user, name: userName, email: userEmail });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setNewlyCreatedServicesCount(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E5E9F0] p-6 shadow-2xl text-[#0B192C] my-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E9F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B192C]/20 text-[#5B6D85] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B192C]">Business Settings</h2>
              <p className="text-xs text-[#5B6D85]">Configure once, automatically printed on all quotes & invoices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#5B6D85] hover:text-[#0B192C] hover:bg-[#F4F7FB] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-1 bg-[#F4F7FB] rounded-xl my-4 text-xs font-semibold border border-[#E5E9F0] overflow-x-auto">
          <button
            onClick={() => setActiveTab('business')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === 'business' ? 'bg-[#0B192C] text-white shadow' : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Profile & Address
          </button>
          <button
            onClick={() => setActiveTab('designs')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'designs' ? 'bg-[#0B192C] text-white shadow' : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-[#3D74D9]" />
            <span>Invoice Designs</span>
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === 'payment' ? 'bg-[#0B192C] text-white shadow' : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Payment Details
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === 'terms' ? 'bg-[#0B192C] text-white shadow' : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Terms & VAT
          </button>
          <button
            onClick={() => setActiveTab('paystack')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === 'paystack' ? 'bg-[#0B192C] text-white shadow' : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-cyan-600" />
            <span>Paystack</span>
            {paystackStatus.isConfigured && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === 'articles' ? 'bg-[#0B192C] text-white shadow' : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#3D74D9]" />
            <span>Guides / SEO</span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === 'account' ? 'bg-[#0B192C] text-white shadow' : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Account
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
          {activeTab === 'business' && (
            <div className="space-y-4">
              {/* Trust & Verification Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Trust & Verification</span>
                      {isProfessionalVerified(business) ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" />
                          Verified Business
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Unverified Listing
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {isProfessionalVerified(business)
                        ? 'Your CAC registration, director identity, and trade credentials are confirmed.'
                        : 'Submit your CAC number and Director NIN to unlock the official Verified Contractor badge.'}
                    </p>
                  </div>
                </div>

                {onOpenVerificationModal && (
                  <button
                    type="button"
                    onClick={onOpenVerificationModal}
                    className="px-3.5 py-2 rounded-xl bg-white text-[#0B192C] hover:bg-slate-100 text-xs font-bold transition shrink-0 cursor-pointer shadow-xs active:scale-95"
                  >
                    {isProfessionalVerified(business) ? 'View Credentials' : 'Verify Business'}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1.5">Business / Trading Name *</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3.5 py-2.5 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  placeholder="e.g. Apex Construction & Engineering Ltd"
                />
              </div>

              {/* Industry Selection covering all types of businesses */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#3D74D9]" /> Business Industry / Sector *
                    </label>
                    <span className="text-[10px] text-[#3D74D9] font-medium">Auto-aligns lead generation</span>
                  </div>
                  <select
                    value={formData.industry || ''}
                    onChange={(e) => {
                      const selectedInd = BUSINESS_INDUSTRIES.find((ind) => ind.name === e.target.value);
                      setFormData({
                        ...formData,
                        industry: e.target.value,
                        specialization: selectedInd ? selectedInd.defaultSpecializations[0] : formData.specialization,
                      });
                    }}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2.5 text-sm text-[#0B192C] font-semibold focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  >
                    <option value="">Select your business industry...</option>
                    {BUSINESS_INDUSTRIES.map((ind) => (
                      <option key={ind.id} value={ind.name}>
                        {ind.categoryGroup} — {ind.name}
                      </option>
                    ))}
                  </select>
                  {formData.industry && (
                    <p className="text-[11px] text-[#5B6D85] mt-1.5 leading-relaxed">
                      {BUSINESS_INDUSTRIES.find((ind) => ind.name === formData.industry)?.description}
                    </p>
                  )}
                </div>

                {/* Business Specialization / Core Services Offered */}
                <div>
                  <label className="block text-xs font-bold text-[#0B192C] mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" /> Specific Specialization / Core Services *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.specialization || ''}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                    placeholder="e.g. Duplex construction, POP ceilings, tile laying, roofing, plumbing and structural renovations..."
                  />
                  <p className="text-[10px] text-[#5B6D85] mt-1">
                    The Lead Generation engine reads this to continuously deliver client leads in your exact specialty.
                  </p>

                  {/* Suggested specialization chips from selected industry */}
                  {formData.industry && (
                    <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
                      <span className="text-[10px] font-bold text-[#5B6D85] uppercase tracking-wider block mb-1.5">
                        Quick Pick Suggestions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {BUSINESS_INDUSTRIES.find((ind) => ind.name === formData.industry)?.defaultSpecializations.map((spec) => (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => {
                              const current = formData.specialization || '';
                              if (!current) {
                                setFormData({ ...formData, specialization: spec });
                              } else if (!current.includes(spec)) {
                                setFormData({ ...formData, specialization: `${current}, ${spec}` });
                              }
                            }}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-[#3D74D9]/10 hover:border-[#3D74D9] border border-[#CBD5E1] text-[#0B192C] font-medium transition text-left"
                          >
                            + {spec}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dedicated Business Services / Offerings Auto-Creation Panel */}
                <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#3D74D9]" />
                      Services Offered & Public Directory Publishing
                    </label>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Auto-Creates Public Services
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5B6D85] leading-relaxed mb-2.5">
                    Each service you list below is automatically published to the <strong>MatthOrg Public Services Directory</strong>, increasing the total services count and routing incoming client quote requests directly to your dashboard.
                  </p>

                  {/* Current Services Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {Array.isArray(formData.categories_offered) && formData.categories_offered.length > 0 ? (
                      formData.categories_offered.map((serv, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white text-[#0B192C] border border-[#CBD5E1] shadow-2xs hover:border-[#3D74D9] transition"
                        >
                          <span>{serv}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(serv)}
                            className="text-gray-400 hover:text-red-500 font-bold text-sm ml-0.5"
                            title="Remove service"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No custom services listed yet. Add your services below.</span>
                    )}
                  </div>

                  {/* Add New Service Input & Action Button */}
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newServiceInput}
                      onChange={(e) => setNewServiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddService();
                        }
                      }}
                      placeholder="Type a new service to publish (e.g. Smart Water Pumps, 4K CCTV)"
                      className="flex-1 rounded-xl bg-white border border-[#CBD5E1] px-3.5 py-2 text-xs sm:text-sm text-[#0B192C] placeholder-[#8F9FB5] focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddService()}
                      className="px-4 py-2 bg-[#0B192C] hover:bg-[#152744] text-white text-xs font-bold rounded-xl transition shadow-xs active:scale-95 shrink-0 flex items-center gap-1"
                    >
                      <span>+ Add Service</span>
                    </button>
                  </div>

                  {/* Industry Quick Suggestions */}
                  {formData.industry && (
                    <div className="flex flex-wrap gap-1 items-center mt-2">
                      <span className="text-[10px] text-gray-500 mr-1">Add from {formData.industry.split(',')[0]}:</span>
                      {BUSINESS_INDUSTRIES.find((b) => b.name === formData.industry)?.defaultSpecializations.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddService(item)}
                          className="text-[10px] px-2 py-0.5 bg-white hover:bg-blue-50 text-[#3D74D9] border border-blue-200 rounded-md transition font-medium"
                        >
                          + {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* State & City Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#3D74D9]" /> Operating State / Region *
                  </label>
                  <select
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  >
                    <option value="">Select state...</option>
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">City / Area / Town</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                    placeholder="e.g. Ikeja, Lekki, Maitama, Wuse 2"
                  />
                </div>
              </div>

              {/* Business Verification Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0B192C]">
                      {isProfessionalVerified(business)
                        ? 'Business Verified on MatthOrg'
                        : business.verification_status === 'in_review'
                        ? 'Verification In Review'
                        : 'Business Verification Pending'}
                    </div>
                    <div className="text-[11px] text-[#5B6D85]">
                      {isProfessionalVerified(business)
                        ? 'CAC corporate entity & Director ID badges active'
                        : business.verification_status === 'in_review'
                        ? 'Submitted credentials undergoing compliance review'
                        : 'Add CAC number, Director NIN and trade certifications'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenVerificationModal) onOpenVerificationModal();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  {isProfessionalVerified(business) ? 'Review Credentials' : 'Get Verified'}
                </button>
              </div>

              {/* CAC & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" /> CAC / RC Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.cac_number || ''}
                    onChange={(e) => setFormData({ ...formData, cac_number: e.target.value })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none font-mono"
                    placeholder="e.g. RC 1849204 or BN 2938102"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[#3D74D9]" /> Website URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                    placeholder="https://mybusiness.ng"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Business Tagline / Motto</label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  placeholder="e.g. Engineering excellence & reliable contracting services"
                />
              </div>

              {/* Logo & Branding */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#3D74D9]" /> Business Logo
                  </label>
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      className="text-xs text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {formData.logo ? (
                    <div className="relative w-20 h-20 rounded-2xl border-2 border-[#CBD5E1] overflow-hidden bg-white flex items-center justify-center shadow-xs shrink-0 group">
                      <img src={formData.logo} alt="Logo" className="max-w-full max-h-full object-contain p-1.5" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="absolute inset-0 bg-red-600/80 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition font-bold text-[10px]"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-4 h-4 mb-0.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-24 h-20 rounded-2xl border-2 border-dashed border-[#CBD5E1] hover:border-[#3D74D9] bg-white cursor-pointer transition shrink-0 group">
                      <Upload className="w-5 h-5 text-[#5B6D85] group-hover:text-[#3D74D9] transition" />
                      <span className="text-[10px] font-bold text-[#5B6D85] group-hover:text-[#3D74D9] mt-1">Upload File</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <p className="text-xs text-[#5B6D85]">
                      Uploaded logo prints automatically on quotes, invoices, and PDF receipts.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="Or paste direct image URL (https://...)"
                        className="flex-1 rounded-xl bg-white border border-[#CBD5E1] px-3 py-1.5 text-xs text-[#0B192C] focus:border-[#3D74D9] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (logoUrlInput.trim()) {
                            setFormData({ ...formData, logo: logoUrlInput.trim() });
                            setLogoUrlInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0B192C] text-xs font-bold rounded-xl transition border border-[#CBD5E1]"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">WhatsApp Number *</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                    placeholder="+234 803 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                    placeholder="+234 803 123 4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Business Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                    placeholder="sales@mycompany.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Currency Symbol *</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  >
                    <option value="₦">₦ - Nigerian Naira (NGN)</option>
                    <option value="$">$ - US Dollar (USD)</option>
                    <option value="£">£ - British Pound (GBP)</option>
                    <option value="€">€ - Euro (EUR)</option>
                    <option value="GH₵">GH₵ - Ghanaian Cedi (GHS)</option>
                    <option value="KSh">KSh - Kenyan Shilling (KES)</option>
                    <option value="R">R - South African Rand (ZAR)</option>
                  </select>
                </div>
              </div>

              {/* Physical Address with Remove / Clear Button */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#3D74D9]" /> Physical / Operating Address
                  </label>
                  {formData.address && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, address: '', city: '' })}
                      className="text-xs text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Address</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  placeholder="Plot 14 Commercial Avenue, Victoria Island, Lagos"
                />
                <p className="text-[11px] text-[#5B6D85]">
                  Shows on invoice header. Click "Remove Address" if operating as a fully remote or mobile professional.
                </p>
              </div>
            </div>
          )}

          {/* INVOICE & QUOTATION DESIGNS TAB */}
          {activeTab === 'designs' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <h3 className="text-sm font-bold text-[#0B192C] flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-[#3D74D9]" /> Document Design Templates & Branding
                </h3>
                <p className="text-xs text-[#5B6D85] mt-1 leading-relaxed">
                  Select how your quotations, invoices, and payment receipts are presented to clients. You can customize the styling, choose an accent color, and remove information you don't wish to display.
                </p>
              </div>

              {/* 1. Template Design Grid */}
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-2 uppercase tracking-wider">
                  Select Document Design Layout
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'corporate' as DocumentDesignTemplate,
                      name: 'Corporate Executive',
                      desc: 'Deep navy header banner, formal client block, dual-column structure, authorized signature space.',
                      badge: 'Most Popular',
                      accent: 'bg-[#0B192C]',
                    },
                    {
                      id: 'modern' as DocumentDesignTemplate,
                      name: 'Modern Minimalist',
                      desc: 'Clean light borders, crisp typography, generous whitespace, contemporary layout.',
                      badge: 'Clean & Light',
                      accent: 'bg-slate-700',
                    },
                    {
                      id: 'technical' as DocumentDesignTemplate,
                      name: 'Engineering Blueprint',
                      desc: 'High-precision grid accent, monospace item references, technical terms, spec stamp.',
                      badge: 'For Contractors',
                      accent: 'bg-cyan-800',
                    },
                    {
                      id: 'emerald' as DocumentDesignTemplate,
                      name: 'Emerald Prestige',
                      desc: 'Luxury emerald header trim, refined gold/teal badges, high-conversion visual polish.',
                      badge: 'High Impact',
                      accent: 'bg-emerald-700',
                    },
                  ].map((tpl) => {
                    const isSelected = (formData.invoice_design || 'corporate') === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setFormData({ ...formData, invoice_design: tpl.id })}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition text-left relative ${
                          isSelected
                            ? 'border-[#3D74D9] bg-blue-50/40 shadow-sm'
                            : 'border-[#E5E9F0] hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full ${tpl.accent}`} />
                            <span className="text-sm font-bold text-[#0B192C]">{tpl.name}</span>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#3D74D9] text-white flex items-center justify-center text-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5B6D85] leading-relaxed mb-2">{tpl.desc}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#CBD5E1] text-[#0B192C]">
                          {tpl.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Brand Accent Color */}
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-2 uppercase tracking-wider">
                  Brand Accent Color
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {[
                    { label: 'MatthOrg Navy', color: '#0B192C' },
                    { label: 'Emerald Green', color: '#059669' },
                    { label: 'Royal Blue', color: '#2563EB' },
                    { label: 'Purple', color: '#7C3AED' },
                    { label: 'Amber', color: '#D97706' },
                    { label: 'Crimson', color: '#DC2626' },
                    { label: 'Slate', color: '#334155' },
                  ].map((c) => {
                    const isSelected = (formData.design_color || '#0B192C') === c.color;
                    return (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setFormData({ ...formData, design_color: c.color })}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                          isSelected
                            ? 'border-black bg-slate-100 shadow-xs'
                            : 'border-[#CBD5E1] bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full shadow-xs shrink-0" style={{ backgroundColor: c.color }} />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Information Visibility Toggles (Remove Information) */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#0B192C] uppercase tracking-wider">
                      Document Information Visibility
                    </h4>
                    <p className="text-[11px] text-[#5B6D85]">
                      Toggle off any details you wish to remove or hide from printed quotes & invoices.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    {
                      key: 'show_logo_on_docs',
                      label: 'Show Company Logo',
                      desc: 'Display your uploaded logo on the top header',
                    },
                    {
                      key: 'show_address_on_docs',
                      label: 'Show Physical Address',
                      desc: 'Display your street address on the document header',
                    },
                    {
                      key: 'show_tax_on_docs',
                      label: 'Show Tax / VAT Breakdown',
                      desc: 'Print VAT/tax calculation rows on totals summary',
                    },
                    {
                      key: 'show_banking_on_docs',
                      label: 'Show Bank Account Details',
                      desc: 'Print bank name and account number for payments',
                    },
                    {
                      key: 'show_signature_on_docs',
                      label: 'Show Authorized Signature Block',
                      desc: 'Render official signature sign-off box at the footer',
                    },
                  ].map((item) => {
                    const isChecked = (formData as any)[item.key] ?? true;
                    return (
                      <label
                        key={item.key}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#CBD5E1] cursor-pointer hover:border-[#3D74D9] transition"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="mt-0.5 rounded text-[#3D74D9] focus:ring-[#3D74D9]"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#0B192C] block">{item.label}</span>
                          <span className="text-[10px] text-[#5B6D85]">{item.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 4. Remove Information / Reset Quick Actions */}
              <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200/80 space-y-2">
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-red-600" /> Remove Information / Reset Tools
                </h4>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Quickly wipe specific information from your business profile and document templates:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo: '' })}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-700 text-xs font-bold border border-red-200 transition"
                  >
                    Remove Logo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, address: '', city: '' })}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-700 text-xs font-bold border border-red-200 transition"
                  >
                    Remove Address
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        payment_details: {
                          bank_name: '',
                          account_name: '',
                          account_number: '',
                          notes: '',
                        },
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-700 text-xs font-bold border border-red-200 transition"
                  >
                    Clear Bank Details
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        invoice_design: 'corporate',
                        design_color: '#0B192C',
                        show_logo_on_docs: true,
                        show_address_on_docs: true,
                        show_tax_on_docs: true,
                        show_banking_on_docs: true,
                        show_signature_on_docs: true,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition"
                  >
                    Reset Design Defaults
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#3D74D9]/10 border border-[#3D74D9]/20 text-xs text-[#0B192C]">
                These banking instructions will automatically appear on invoices and in the 1-click WhatsApp payment reminders.
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.payment_details.bank_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_details: { ...formData.payment_details, bank_name: e.target.value },
                    })
                  }
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  placeholder="e.g. Zenith Bank Plc / GTBank / Access"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Account Name</label>
                <input
                  type="text"
                  value={formData.payment_details.account_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_details: { ...formData.payment_details, account_name: e.target.value },
                    })
                  }
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  placeholder="e.g. Matthorg Digital Works"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Account Number / IBAN</label>
                <input
                  type="text"
                  value={formData.payment_details.account_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_details: { ...formData.payment_details, account_number: e.target.value },
                    })
                  }
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none font-mono"
                  placeholder="e.g. 1012345678"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Payment Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={formData.payment_details.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_details: { ...formData.payment_details, notes: e.target.value },
                    })
                  }
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  placeholder="e.g. Please use Invoice number as reference. Send receipt via WhatsApp."
                />
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Tax / VAT Name</label>
                  <input
                    type="text"
                    value={formData.tax_name}
                    onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                    placeholder="VAT / Sales Tax"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                    placeholder="7.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Default Terms & Conditions</label>
                <textarea
                  rows={4}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-xs text-[#0B192C] font-mono focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  placeholder="1. Quote valid for 14 days. 2. 70% mobilization deposit..."
                />
                <p className="text-[11px] text-[#5B6D85] mt-1">
                  Default clause copied into every new quote. You can also customize per quote.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'paystack' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E9F0] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${paystackStatus.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-sm font-bold text-[#0B192C]">
                      {paystackStatus.isConfigured ? 'Paystack Gateway Active' : 'Paystack Keys Awaiting Deployment'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                    paystackStatus.mode === 'live'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : paystackStatus.mode === 'test'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {paystackStatus.mode === 'live' ? 'Live Production' : paystackStatus.mode === 'test' ? 'Test Sandbox' : 'Unconfigured'}
                  </span>
                </div>

                <p className="text-xs text-[#5B6D85] leading-relaxed">
                  Mathorg connects directly to your official Paystack Merchant account for automated subscription upgrades and customer invoice payments (Card, Bank Transfer, USSD, Apple Pay).
                </p>
              </div>

              {/* Webhook Endpoint */}
              <div className="p-4 rounded-xl bg-white border border-[#E5E9F0] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Webhook URL (HMAC SHA-512 Signed)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/api/paystack/webhook`;
                      navigator.clipboard.writeText(url);
                      setCopiedWebhook(true);
                      setTimeout(() => setCopiedWebhook(false), 2000);
                    }}
                    className="text-xs font-semibold text-[#3D74D9] hover:underline flex items-center gap-1"
                  >
                    {copiedWebhook ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedWebhook ? 'Copied URL!' : 'Copy Webhook URL'}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] font-mono text-xs text-[#0B192C] break-all select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/paystack/webhook` : 'https://your-domain.com/api/paystack/webhook'}
                </div>
                <p className="text-[11px] text-[#5B6D85]">
                  Add this URL in your <strong className="text-[#0B192C]">Paystack Dashboard → Settings → Preferences → Webhooks</strong>. Paystack sends signed <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">charge.success</code> events here to activate subscriptions automatically.
                </p>
              </div>

              {/* Environment Variables Reference for Vercel */}
              <div className="p-4 rounded-xl bg-white border border-[#E5E9F0] space-y-3">
                <div className="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#3D74D9]" />
                  Required Environment Variables (Vercel / Hosting)
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E5E9F0] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#0B192C]">PAYSTACK_SECRET_KEY</span>
                      <div className="text-[10px] text-[#5B6D85] font-sans">Server secret key (sk_live_... or sk_test_...)</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-[#5B6D85]">Server Secret</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E5E9F0] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#0B192C]">PAYSTACK_PUBLIC_KEY</span>
                      <div className="text-[10px] text-[#5B6D85] font-sans">Public key (pk_live_... or pk_test_...)</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-[#5B6D85]">Public Key</span>
                  </div>
                </div>
              </div>

              {/* Paystack Test Cards Info */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                  Testing in Sandbox Mode:
                </div>
                <p className="text-[11px] leading-relaxed">
                  In Test mode, use Paystack standard test cards: <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">4084 0840 8408 4081</code>, any future expiry date, CVV <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">408</code>, PIN <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">1111</code>, and OTP <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">123456</code>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'articles' && (
            <div className="space-y-4">
              <BlogAdminManager
                onViewPublicArticle={(slug) => {
                  onClose();
                  if (onViewPublicArticle) {
                    onViewPublicArticle(slug);
                  } else {
                    window.location.href = `/blog/${slug}`;
                  }
                }}
              />
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#5B6D85]">Current Plan Tier</div>
                  <div className="text-sm font-bold text-[#0B192C] uppercase mt-0.5">{user.plan}</div>
                </div>
                <div className="text-xs px-2.5 py-1 rounded-md bg-[#3D74D9]/10 text-[#3D74D9] font-semibold">
                  Mathorg Member
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Owner / User Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Login Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E9F0]">
                <div className="text-xs font-semibold text-[#5B6D85] mb-2">Reset Demo Workspace</div>
                <p className="text-xs text-[#5B6D85] mb-3">
                  Reload preconfigured sample products, customers, and quotes for testing Mathorg flows.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset workspace to initial demo data? Your custom additions will be restored to demo defaults.')) {
                      onResetData();
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset to Starter Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-[#E5E9F0] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#5B6D85] hover:text-[#0B192C] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#0B192C]/20 transition active:scale-95"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : null}
            <span>
              {isSaved
                ? newlyCreatedServicesCount
                  ? `Saved & ${newlyCreatedServicesCount} New Services Published!`
                  : 'Settings Saved!'
                : 'Save Changes'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
