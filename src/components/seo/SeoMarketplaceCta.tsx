import React from 'react';
import { ArrowRight, FileText, CheckCircle, ShieldCheck } from 'lucide-react';

interface SeoMarketplaceCtaProps {
  serviceName?: string;
  locationName?: string;
  onFindPros: () => void;
  onPostRequest: () => void;
  onJoinAsBusiness: () => void;
}

export const SeoMarketplaceCta: React.FC<SeoMarketplaceCtaProps> = ({
  serviceName = 'Professional Service',
  locationName = 'Nigeria',
  onFindPros,
  onPostRequest,
  onJoinAsBusiness,
}) => {
  return (
    <div className="my-12 bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white rounded-2xl p-8 md:p-10 shadow-xl overflow-hidden relative">
      <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-[#3D74D9]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 backdrop-blur-sm border border-white/10 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Verified Service Marketplace
        </div>

        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
          Need a {serviceName} Professional in {locationName}?
        </h3>

        <p className="text-sm md:text-base text-gray-300 mt-2 leading-relaxed">
          Find verified professionals in {locationName} or tell us what you need and let qualified businesses respond with itemized quotations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Verified business documents</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Direct WhatsApp & phone contact</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Zero hidden intermediary fees</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={onFindPros}
            className="px-6 py-3 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <span>Find {serviceName} Professionals</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onPostRequest}
            className="px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-[#3D74D9]" />
            <span>Post a Request</span>
          </button>

          <button
            onClick={onJoinAsBusiness}
            className="text-xs text-gray-300 hover:text-white underline underline-offset-4 transition-colors ml-auto sm:ml-0"
          >
            Are you a service business in {locationName}? Join MatthOrg
          </button>
        </div>
      </div>
    </div>
  );
};
