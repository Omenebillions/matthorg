import React, { useState, useEffect } from 'react';
import { Check, Zap, Sparkles, Shield, X, AlertCircle, Loader2, CreditCard, Lock } from 'lucide-react';
import { PlanTier, AppState } from '../types';
import { initializePaystackPayment, getPaystackConfigStatus, PaystackStatus } from '../lib/paystack';

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
  const [paystackStatus, setPaystackStatus] = useState<PaystackStatus>({
    isConfigured: false,
    publicKey: null,
    mode: 'unconfigured',
  });
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getPaystackConfigStatus().then((status) => {
        setPaystackStatus(status);
      });
      setErrorMessage(null);
      setInfoNotice(null);
    }
  }, [isOpen]);

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

  const handleUpgradeClick = async (targetPlan: PlanTier, priceNaira: number) => {
    if (targetPlan === 'free') {
      onSelectPlan('free');
      return;
    }

    setLoadingPlan(targetPlan);
    setErrorMessage(null);
    setInfoNotice(null);

    const userEmail = state.user.email && state.user.email.includes('@') 
      ? state.user.email 
      : (state.business.email || 'customer@mathorg.app');

    try {
      const res = await initializePaystackPayment({
        email: userEmail,
        amount: priceNaira,
        type: 'subscription',
        plan: targetPlan,
        userId: state.user.id,
        callbackUrl: window.location.origin + window.location.pathname,
      });

      if (res.success && res.authorization_url) {
        setInfoNotice('Connecting to Paystack secure checkout...');
        // Open Paystack checkout
        window.location.href = res.authorization_url;
      } else {
        // If Paystack key is missing on the server, inform user and allow dev activation
        const errMsg = res.error || 'Could not connect to Paystack payment gateway.';
        setErrorMessage(errMsg);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white border border-[#E5E9F0] p-6 md:p-8 shadow-2xl text-[#0B192C] my-8">
        <div className="flex items-center justify-between pb-6 border-b border-[#E5E9F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0B192C]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0B192C] border border-[#0B192C]/20">
                <Sparkles className="w-3 h-3 text-[#3D74D9]" /> Mathorg Subscription
              </span>
              <span className="text-xs text-[#5B6D85]">
                Current Tier: <strong className="text-[#0B192C] uppercase font-bold">{currentPlan}</strong>
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#0B192C] mt-1 tracking-tight">
              Built for speed, scale & revenue
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#5B6D85] hover:text-[#0B192C] hover:bg-[#F4F7FB] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Paystack Gateway Status Banner */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${paystackStatus.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-[#0B192C]">
              {paystackStatus.isConfigured
                ? `Paystack Connected (${paystackStatus.mode === 'live' ? 'Production Live' : 'Test Sandbox'})`
                : 'Paystack Gateway: Awaiting PAYSTACK_SECRET_KEY in Environment'}
            </span>
          </div>
          <span className="text-[11px] text-[#5B6D85] flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" /> 256-bit SSL Checkout
          </span>
        </div>

        {/* Feedback banners */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold block">Paystack Connection Notice:</strong>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
              <span className="text-[11px] text-amber-800">
                To test your workspace right now without waiting for key deployment:
              </span>
              <button
                type="button"
                onClick={() => {
                  if (loadingPlan) onSelectPlan(loadingPlan);
                  setErrorMessage(null);
                }}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
              >
                Instant Plan Upgrade (Dev Override)
              </button>
            </div>
          </div>
        )}

        {infoNotice && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            <span>{infoNotice}</span>
          </div>
        )}

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
                ? 'border-[#0B192C] bg-[#F4F7FB] ring-1 ring-[#0B192C]'
                : 'border-[#E5E9F0] bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-[#0B192C]">Free Starter</h3>
                {currentPlan === 'free' && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5B6D85] mb-4">
                Essential quotation tools for newly registered solo artisans.
              </p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-[#0B192C]">₦0</span>
                <span className="text-xs text-[#5B6D85]"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-[#5B6D85] mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>20 quotes & 10 invoices / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>3 AI Quote Generations / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1-Click WhatsApp sharing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>PDF download & receipt printing</span>
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Marketplace buyer contact details locked</span>
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
                Fast growth for active trades, contractors & service firms.
              </p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-[#0B192C]">₦2,500</span>
                <span className="text-xs text-[#5B6D85]"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-[#5B6D85] mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-700">Unlock Marketplace Buyer Leads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-[#0B192C]">Verified WhatsApp & phone numbers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-[#0B192C]">Unlimited quotes & invoices</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-cyan-700 font-semibold">50 AI Quote Drafts/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Custom branding & business logo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Paystack checkout & online payment links</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgradeClick('pro', 2500)}
              disabled={currentPlan === 'pro' || loadingPlan === 'pro'}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                currentPlan === 'pro'
                  ? 'bg-slate-100 text-[#8F9FB5] cursor-default'
                  : 'bg-[#0B192C] hover:bg-[#152744] text-white shadow-xs'
              }`}
            >
              {loadingPlan === 'pro' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to Paystack...</span>
                </>
              ) : currentPlan === 'pro' ? (
                'Current Plan'
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay with Paystack (₦2,500)</span>
                </>
              )}
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
                Full marketplace priority for established SMEs & teams.
              </p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-[#0B192C]">₦7,500</span>
                <span className="text-xs text-[#5B6D85]"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-[#5B6D85] mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-700">Priority Marketplace Lead Matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-[#0B192C]">Mathorg Verified Business Badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>200 AI Quote Drafts/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Priority WhatsApp notification routing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Paystack multi-channel checkout</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Dedicated priority technical support</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgradeClick('business', 7500)}
              disabled={currentPlan === 'business' || loadingPlan === 'business'}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                currentPlan === 'business'
                  ? 'bg-slate-100 text-[#8F9FB5] cursor-default'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
              }`}
            >
              {loadingPlan === 'business' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to Paystack...</span>
                </>
              ) : currentPlan === 'business' ? (
                'Current Plan'
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay with Paystack (₦7,500)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security & Payment Methods Footer */}
        <div className="mt-6 pt-4 border-t border-[#E5E9F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5B6D85]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Paystack Secured: Mastercard, Visa, Verve, Bank Transfer, USSD, Apple Pay.</span>
          </div>
          <button onClick={onClose} className="hover:text-[#0B192C] underline font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
