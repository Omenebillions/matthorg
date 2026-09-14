import React from 'react';
import { Check, Zap, Sparkles, Shield, X, AlertCircle } from 'lucide-react';
import { PlanTier, AppState } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onSelectPlan: (plan: PlanTier) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  state,
  onSelectPlan,
}) => {
  if (!isOpen) return null;

  const currentPlan = state.user.plan;
  const quotesCount = state.quotes.length;
  const invoicesCount = state.invoices.length;
  const productsCount = state.products.length;
  const customersCount = state.customers.length;
  const aiCount = state.aiUsage.count;

  const getAILimit = (plan: PlanTier) => {
    if (plan === 'free') return 3;
    if (plan === 'pro') return 50;
    return 200;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white border border-[#E5E9F0] p-6 md:p-8 shadow-2xl text-[#0B192C] my-8">
        <div className="flex items-center justify-between pb-6 border-b border-[#E5E9F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0B192C]/15 px-2.5 py-0.5 text-xs font-semibold text-[#5B6D85] border border-[#0B192C]/30">
                <Sparkles className="w-3 h-3" /> Mathorg Plans
              </span>
              <span className="text-xs text-[#5B6D85]">Current Plan: <strong className="text-white uppercase">{currentPlan}</strong></span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
              Built for speed, scale & revenue
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#5B6D85] hover:text-white hover:bg-[#F4F7FB] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Usage Card */}
        <div className="my-6 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5B6D85] mb-3">
            Your Monthly Usage ({state.aiUsage.month})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-white border border-[#E5E9F0] shadow-xs">
              <div className="text-xs text-[#5B6D85]">Quotes</div>
              <div className="text-base font-bold text-[#0B192C] mt-0.5">
                {quotesCount} <span className="text-xs font-normal text-[#5B6D85]">/ {currentPlan === 'free' ? '20' : '∞'}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E5E9F0] shadow-xs">
              <div className="text-xs text-[#5B6D85]">Invoices</div>
              <div className="text-base font-bold text-[#0B192C] mt-0.5">
                {invoicesCount} <span className="text-xs font-normal text-[#5B6D85]">/ {currentPlan === 'free' ? '10' : '∞'}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E5E9F0] shadow-xs">
              <div className="text-xs text-[#5B6D85]">Products</div>
              <div className="text-base font-bold text-[#0B192C] mt-0.5">
                {productsCount} <span className="text-xs font-normal text-[#5B6D85]">/ {currentPlan === 'free' ? '20' : '∞'}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E5E9F0] shadow-xs">
              <div className="text-xs text-[#5B6D85]">Customers</div>
              <div className="text-base font-bold text-[#0B192C] mt-0.5">
                {customersCount} <span className="text-xs font-normal text-[#5B6D85]">/ {currentPlan === 'free' ? '50' : '∞'}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E5E9F0] shadow-xs col-span-2 sm:col-span-1">
              <div className="text-xs text-[#5B6D85] font-medium">AI Drafts</div>
              <div className="text-base font-bold text-[#0B192C] mt-0.5">
                {aiCount} <span className="text-xs font-normal text-[#5B6D85]">/ {getAILimit(currentPlan)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Free Tier */}
          <div
            className={`rounded-2xl p-5 flex flex-col justify-between border transition ${
              currentPlan === 'free'
                ? 'border-[#0B192C]/60 bg-[#F4F7FB] ring-1 ring-[#0B192C]/40'
                : 'border-[#E5E9F0] bg-white hover:border-[#CBD5E1]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-[#0B192C]">Free Starter</h3>
                {currentPlan === 'free' && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#0B192C]/20 text-[#5B6D85]">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5B6D85] mb-4">
                Generous baseline to run your small business.
              </p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-[#0B192C]">₦0</span>
                <span className="text-xs text-[#5B6D85]"> / forever</span>
              </div>
              <ul className="space-y-2 text-xs text-[#5B6D85] mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#5B6D85] shrink-0" />
                  <span>20 quotes/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#5B6D85] shrink-0" />
                  <span>10 invoices/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#5B6D85] shrink-0" />
                  <span>20 saved catalogue items</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#5B6D85] shrink-0" />
                  <span>50 customer records</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#5B6D85] shrink-0" />
                  <span>3 AI Quote Drafts/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#5B6D85] shrink-0" />
                  <span>PDF & WhatsApp sharing</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan('free')}
              disabled={currentPlan === 'free'}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition ${
                currentPlan === 'free'
                  ? 'bg-slate-100 text-[#8F9FB5] cursor-default'
                  : 'bg-slate-100 hover:bg-slate-200 text-[#0B192C]'
              }`}
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Select Free'}
            </button>
          </div>

          {/* Pro Tier */}
          <div
            className={`rounded-2xl p-5 flex flex-col justify-between border relative transition ${
              currentPlan === 'pro'
                ? 'border-[#3D74D9] bg-blue-50/20 ring-2 ring-[#3D74D9] shadow-md'
                : 'border-[#3D74D9]/40 bg-white hover:border-[#3D74D9]'
            }`}
          >
            <div className="absolute -top-2.5 right-5 bg-[#3D74D9] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm">
              Most Popular
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-[#0B192C] flex items-center gap-1.5">
                  Pro <Zap className="w-3.5 h-3.5 text-cyan-600 fill-cyan-500" />
                </h3>
                {currentPlan === 'pro' && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5B6D85] mb-4">
                Fast growth for active trades & contractors.
              </p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-[#0B192C]">₦2,500</span>
                <span className="text-xs text-[#5B6D85]"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-[#5B6D85] mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-[#0B192C]">Unlimited quotes & invoices</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-[#0B192C]">Unlimited products & customers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-cyan-700 font-semibold">50 AI Drafts/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Custom branding & business logo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Advanced quote templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Payment status & follow-up tracking</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan('pro')}
              disabled={currentPlan === 'pro'}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                currentPlan === 'pro'
                  ? 'bg-slate-100 text-[#8F9FB5] cursor-default'
                  : 'bg-[#0B192C] hover:bg-[#152744] text-white shadow-xs'
              }`}
            >
              {currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Business Tier */}
          <div
            className={`rounded-2xl p-5 flex flex-col justify-between border transition ${
              currentPlan === 'business'
                ? 'border-[#0B192C] bg-[#F4F7FB] ring-1 ring-[#0B192C]'
                : 'border-[#E5E9F0] bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-[#0B192C] flex items-center gap-1.5">
                  Business <Shield className="w-3.5 h-3.5 text-cyan-600" />
                </h3>
                {currentPlan === 'business' && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5B6D85] mb-4">
                Full power for established SMEs & teams.
              </p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-[#0B192C]">₦7,500</span>
                <span className="text-xs text-[#5B6D85]"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-[#5B6D85] mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Everything in Pro tier</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-cyan-700 font-semibold">200 AI Drafts/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Business catalogue intelligence</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Team member access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Contract & proposal extraction</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan('business')}
              disabled={currentPlan === 'business'}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition ${
                currentPlan === 'business'
                  ? 'bg-slate-100 text-[#8F9FB5] cursor-default'
                  : 'bg-slate-100 hover:bg-slate-200 text-[#0B192C]'
              }`}
            >
              {currentPlan === 'business' ? 'Current Plan' : 'Upgrade to Business'}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E5E9F0] flex items-center justify-between text-xs text-[#5B6D85]">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#5B6D85]" />
            <span>Instant activation. Cancel anytime without penalty.</span>
          </div>
          <button onClick={onClose} className="hover:text-white underline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
