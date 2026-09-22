import React from 'react';
import {
  X,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Globe,
  ExternalLink,
  Calendar,
  Building,
  Sparkles,
} from 'lucide-react';
import { PublicProfessionalProfile } from '../../types';

interface ProfessionalProfileModalProps {
  professional: PublicProfessionalProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: (professional: PublicProfessionalProfile) => void;
}

export const ProfessionalProfileModal: React.FC<ProfessionalProfileModalProps> = ({
  professional,
  isOpen,
  onClose,
  onRequestQuote,
}) => {
  if (!isOpen || !professional) return null;

  const handleWhatsAppContact = () => {
    const rawNumber = professional.whatsapp || professional.phone;
    const cleanNumber = rawNumber.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello ${professional.business_name}, I saw your verified profile on MatthOrg. I am interested in inquiring about your services.`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  const handleEmailContact = () => {
    const subject = encodeURIComponent(`Service Inquiry via MatthOrg — ${professional.specialization || 'Professional Service'}`);
    const body = encodeURIComponent(
      `Hello ${professional.business_name},\n\nI found your business on MatthOrg and would like to request information or a quotation regarding your services.\n\nThank you.`
    );
    window.location.href = `mailto:${professional.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-[#E5E9F0] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header with Business Banner */}
        <div className="relative bg-gradient-to-r from-[#0B192C] to-[#1E3E62] px-6 sm:px-8 pt-8 pb-6 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-1 shrink-0 overflow-hidden shadow-md flex items-center justify-center">
              {professional.logo ? (
                <img
                  src={professional.logo}
                  alt={professional.business_name}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Building className="w-8 h-8 text-[#0B192C]" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/15 text-white">
                  {professional.industry || 'Professional Services'}
                </span>
                {professional.business_verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Verified Business</span>
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {professional.business_name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  {professional.city ? `${professional.city}, ` : ''}
                  {professional.state || 'Global'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Tagline / Overview */}
          {professional.tagline && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6D85] mb-2">
                About the Business
              </h4>
              <p className="text-sm text-[#0B192C] leading-relaxed bg-[#F4F7FB] p-4 rounded-2xl border border-[#E5E9F0]">
                {professional.tagline}
              </p>
            </div>
          )}

          {/* Verification Badges Section (Truth-in-advertising) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6D85] mb-3">
              Trust & Verification Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E5E9F0] bg-white text-xs">
                <CheckCircle2 className={`w-4 h-4 ${professional.business_verified ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={professional.business_verified ? 'text-[#0B192C] font-semibold' : 'text-slate-400'}>
                  {professional.business_verified ? 'Business Registered' : 'Registration Pending'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E5E9F0] bg-white text-xs">
                <CheckCircle2 className={`w-4 h-4 ${professional.phone_verified ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={professional.phone_verified ? 'text-[#0B192C] font-semibold' : 'text-slate-400'}>
                  {professional.phone_verified ? 'Phone Confirmed' : 'Phone Unconfirmed'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E5E9F0] bg-white text-xs">
                <CheckCircle2 className={`w-4 h-4 ${professional.identity_verified ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={professional.identity_verified ? 'text-[#0B192C] font-semibold' : 'text-slate-400'}>
                  {professional.identity_verified ? 'Identity Verified' : 'Identity In Review'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#8F9FB5] mt-1.5">
              Factual verification checks conducted by MatthOrg. No sponsored or fabricated ratings.
            </p>
          </div>

          {/* Services Offered */}
          {professional.categories_offered && professional.categories_offered.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6D85] mb-3">
                Services Offered
              </h4>
              <div className="flex flex-wrap gap-2">
                {professional.categories_offered.map((srv, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] text-xs font-semibold text-[#0B192C]"
                  >
                    <Briefcase className="w-3 h-3 text-[#3D74D9]" />
                    <span>{srv}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Locations Served */}
          {professional.locations_served && professional.locations_served.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6D85] mb-3">
                Service Coverage & Locations
              </h4>
              <div className="flex flex-wrap gap-2">
                {professional.locations_served.map((loc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-xs text-[#5B6D85]"
                  >
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{loc}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information & Action Bar */}
          <div className="pt-4 border-t border-[#E5E9F0] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6D85]">
              Contact This Professional
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {professional.whatsapp && (
                <button
                  type="button"
                  onClick={handleWhatsAppContact}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Inquiry</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onRequestQuote(professional);
                  onClose();
                }}
                className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0B192C] hover:bg-[#152744] text-white font-bold text-sm shadow-sm transition active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Request Quotation</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-[#5B6D85] pt-2">
              {professional.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#3D74D9]" />
                  <span>{professional.phone}</span>
                </span>
              )}
              {professional.email && (
                <button
                  type="button"
                  onClick={handleEmailContact}
                  className="flex items-center gap-1.5 hover:text-[#0B192C] underline decoration-[#E5E9F0]"
                >
                  <Mail className="w-3.5 h-3.5 text-[#3D74D9]" />
                  <span>{professional.email}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
