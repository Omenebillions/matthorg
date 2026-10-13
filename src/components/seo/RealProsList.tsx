import React from 'react';
import { ShieldCheck, MapPin, Phone, MessageSquare, ArrowRight } from 'lucide-react';
import { PublicProfessionalProfile } from '../../types';
import { isProfessionalVerified } from '../../lib/db';

interface RealProsListProps {
  professionals: PublicProfessionalProfile[];
  serviceTitle: string;
  locationName: string;
  isLoading?: boolean;
  onSelectProfessional: (pro: PublicProfessionalProfile) => void;
  onRequestQuotes: () => void;
  onJoinAsBusiness: () => void;
}

export const RealProsList: React.FC<RealProsListProps> = ({
  professionals,
  serviceTitle,
  locationName,
  isLoading = false,
  onSelectProfessional,
  onRequestQuotes,
  onJoinAsBusiness,
}) => {
  return (
    <section className="my-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold text-[#3D74D9] uppercase tracking-wider">Verified Directory</span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
            Find {serviceTitle} Professionals in {locationName}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Real registered service businesses and verified contractors serving {locationName}.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button
            onClick={onRequestQuotes}
            className="px-4 py-2 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Post a Request</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="w-24 h-5 bg-gray-200 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="w-3/4 h-5 bg-gray-200 rounded" />
                <div className="w-1/2 h-4 bg-gray-200 rounded" />
              </div>
              <div className="w-full h-8 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : professionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {professionals.map((pro) => (
            <div
              key={pro.id}
              onClick={() => onSelectProfessional(pro)}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-[#3D74D9]/40 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-gray-700 text-lg">
                    {pro.logo ? (
                      <img src={pro.logo} alt={pro.business_name} className="w-full h-full object-cover" />
                    ) : (
                      pro.business_name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 justify-end">
                    {isProfessionalVerified(pro) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Verified Business
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                        Unverified
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-base mt-3 group-hover:text-[#3D74D9] transition-colors line-clamp-1">
                  {pro.business_name}
                </h3>
                <p className="text-xs font-medium text-[#3D74D9] mt-0.5 line-clamp-1">
                  {pro.specialization || pro.industry}
                </p>

                <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                  {pro.tagline || `Professional ${pro.industry} services tailored for residential and commercial clients.`}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">
                    {[pro.city, pro.state].filter(Boolean).join(', ') || locationName}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 group-hover:text-[#3D74D9] transition-colors flex items-center gap-1">
                  View Profile & Quotes <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <div className="flex items-center gap-1.5 text-gray-400">
                  {pro.whatsapp && <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                  {pro.phone && <Phone className="w-3.5 h-3.5 text-[#3D74D9]" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State adhering to zero-invented-businesses policy: directory is in building phase */
        <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/50 border border-slate-200 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-blue-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#3D74D9]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full mb-3">
            Directory Building Phase
          </span>
          <h3 className="text-xl md:text-2xl font-black text-gray-900">
            No businesses registered yet for {serviceTitle} in {locationName}
          </h3>
          <p className="text-sm md:text-base text-gray-600 mt-2.5 leading-relaxed max-w-lg mx-auto">
            MatthOrg does not invent or display fake placeholder businesses. Since our directory is currently in active building mode, this section will populate as verified businesses register and complete verification.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onJoinAsBusiness}
              className="w-full sm:w-auto px-6 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Register Your Business (Join MatthOrg)</span>
            </button>
            <button
              onClick={onRequestQuotes}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Post a Request for {locationName}</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
