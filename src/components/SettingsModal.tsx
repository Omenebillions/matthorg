import React, { useState, useEffect } from 'react';
import { BusinessProfile, User, PlanTier } from '../types';
import { Building2, CreditCard, FileText, Phone, Mail, MapPin, X, Check, Upload, Trash2, UserCheck, RefreshCw, Loader2, Shield, Key, Copy, ExternalLink, CheckCircle2, Lock, Briefcase, Globe, Sparkles } from 'lucide-react';
import { uploadFileToR2 } from '../lib/storage';
import { getPaystackConfigStatus, PaystackStatus } from '../lib/paystack';
import { BUSINESS_INDUSTRIES, NIGERIAN_STATES } from '../data/businessIndustries';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessProfile;
  user: User;
  onSaveBusiness: (updated: BusinessProfile) => void;
  onUpdateUser: (updated: User) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  business,
  user,
  onSaveBusiness,
  onUpdateUser,
  onResetData,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'business' | 'payment' | 'terms' | 'paystack' | 'account'>('business');
  const [formData, setFormData] = useState<BusinessProfile>({ ...business });
  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
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
      alert('Failed to upload logo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    onSaveBusiness(formData);
    onUpdateUser({ ...user, name: userName, email: userEmail });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
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
        <div className="flex gap-1.5 p-1 bg-[#F4F7FB] rounded-xl my-4 text-xs font-semibold border border-[#E5E9F0]">
          <button
            onClick={() => setActiveTab('business')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'business' ? 'bg-[#0B192C] text-white shadow' : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Profile & Contact
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'payment' ? 'bg-[#0B192C] text-white shadow' : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Payment Details
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'terms' ? 'bg-[#0B192C] text-white shadow' : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Terms & VAT
          </button>
          <button
            onClick={() => setActiveTab('paystack')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1 ${
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
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2 rounded-lg transition ${
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

              {/* Logo */}
              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1.5">Business Logo (Optional)</label>
                <div className="flex items-center gap-4">
                  {formData.logo ? (
                    <div className="relative w-16 h-16 rounded-xl border border-[#E5E9F0] overflow-hidden bg-white flex items-center justify-center shadow-xs">
                      <img src={formData.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="absolute top-1 right-1 bg-red-600/80 p-0.5 rounded-full text-white hover:bg-red-600"
                        title="Remove Logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-28 h-16 rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#3D74D9] bg-white cursor-pointer transition">
                      <Upload className="w-4 h-4 text-[#5B6D85]" />
                      <span className="text-[10px] text-[#5B6D85] mt-1">Upload PNG/JPG</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                  <p className="text-xs text-[#5B6D85]">Appears on top of all generated PDF quotes and tax invoices.</p>
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

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Physical / Postal Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-sm text-[#0B192C] font-medium focus:border-[#3D74D9] focus:ring-2 focus:ring-[#3D74D9]/10 focus:outline-none"
                  placeholder="Plot 14 Commercial Avenue, Victoria Island, Lagos"
                />
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
            <span>{isSaved ? 'Settings Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
