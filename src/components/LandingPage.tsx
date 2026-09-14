import React, { useState } from 'react';
import { User, BusinessProfile } from '../types';
import {
  FileText,
  Sparkles,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Shield,
  Smartphone,
  Cloud,
  Clock,
  Send,
  Lock,
  ChevronRight,
  Zap,
  Check,
  HelpCircle,
  MessageSquare,
  FileCheck,
  Download
} from 'lucide-react';
import { LegalModal, LegalDocType } from './LegalModal';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingPageProps {
  business: BusinessProfile;
  currentUser: User;
  onOpenNewQuote: (withAI?: boolean) => void;
  onOpenNewInvoice: () => void;
  onEnterApp: () => void;
  onPromptLogin: () => void;
}

export function LandingPage({
  business,
  currentUser,
  onOpenNewQuote,
  onOpenNewInvoice,
  onEnterApp,
  onPromptLogin,
}: LandingPageProps) {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalDocType>('privacy');

  const openLegal = (type: LegalDocType) => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  return (
    <div id="mathorg_landing_page" className="min-h-screen bg-[#F4F7FB] text-[#0B192C] font-sans overflow-x-hidden flex flex-col selection:bg-[#3D74D9] selection:text-white">
      {/* Top Navigation */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto w-full bg-[#F4F7FB]/90 backdrop-blur-md sticky top-0 z-30 border-b border-[#E5E9F0]/80">
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0B192C] p-1 shadow-sm flex items-center justify-center overflow-hidden">
            <img 
              src="/logo.png" 
              alt="Matthorg Logo" 
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-[#0B192C]">Matthorg</h1>
            <p className="text-[11px] font-semibold text-[#5B6D85]">Quotations. Invoices. Follow Ups.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton compact />
          
          <button
            type="button"
            onClick={onPromptLogin}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#0B192C] bg-white border border-[#E5E9F0] rounded-xl hover:bg-slate-50 transition shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5 text-[#3D74D9]" />
            <span>Sign In</span>
          </button>
          
          <button
            type="button"
            onClick={onEnterApp}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#0B192C] hover:bg-[#152744] rounded-xl transition shadow-sm active:scale-95"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center flex flex-col justify-center items-center">
        {/* Top Pill Announcement */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E5E9F0] text-[#294263] text-xs sm:text-sm font-medium mb-6 shadow-xs">
          <Sparkles className="w-4 h-4 text-[#3D74D9]" />
          <span>Streamlined Commerce for Modern Contractors & SMEs</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#0B192C] leading-[1.08] mb-5">
          Make every deal<br />
          <span className="text-[#3D74D9]">feel Professional.</span>
        </h2>

        {/* Sub-message */}
        <p className="text-base sm:text-lg md:text-xl text-[#5B6D85] max-w-2xl mx-auto leading-relaxed mb-8">
          Create polished quotations, convert approvals into payment invoices, and keep customer follow-ups on track in one focused workspace.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md mx-auto mb-10">
          <button
            type="button"
            onClick={() => onOpenNewQuote(false)}
            className="w-full px-6 py-3.5 rounded-2xl bg-[#0B192C] hover:bg-[#152744] text-white font-bold text-sm sm:text-base shadow-md transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5"
          >
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Create a Quotation</span>
          </button>

          <button
            type="button"
            onClick={onEnterApp}
            className="w-full px-6 py-3.5 rounded-2xl bg-white border border-[#E5E9F0] hover:border-slate-300 text-[#0B192C] font-bold text-sm sm:text-base transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-4 h-4 text-[#5B6D85]" />
          </button>
        </div>

        {/* Quick Highlights Row */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[#5B6D85]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>1-Click WhatsApp Delivery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Multi-Currency (₦, $, €, £)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Offline Capability</span>
          </div>
        </div>
      </section>

      {/* Symmetrical & Well-Aligned Image Showcase */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#3D74D9]">
            The 3 Pillars of Matthorg
          </h3>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] mt-1">
            Quotations. Invoices. Follow Ups.
          </p>
        </div>

        {/* 3-Column Image Cards Grid with Optical Symmetry & Alignment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* Card 1: Quotations */}
          <div 
            onClick={() => onOpenNewQuote(false)}
            className="rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-[#E5E9F0] bg-white flex flex-col h-full cursor-pointer group"
          >
            {/* Image Header with Fixed Aspect Ratio */}
            <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-100 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80" 
                alt="Business quotations and proposals" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0B192C]/85 backdrop-blur-sm text-white text-xs font-bold">
                01 • Quotations
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 flex flex-col justify-between bg-white">
              <div>
                <h4 className="text-lg font-bold text-[#0B192C] mb-2 group-hover:text-[#3D74D9] transition-colors flex items-center justify-between">
                  <span>Fast, Polished Quotes</span>
                  <ChevronRight className="w-4 h-4 text-[#8F9FB5] group-hover:text-[#3D74D9] group-hover:translate-x-1 transition-all" />
                </h4>
                <p className="text-xs sm:text-sm text-[#5B6D85] leading-relaxed mb-4">
                  Bespoke line items, tax rules, and currency conversion ready to share in seconds via WhatsApp, email, or branded PDF.
                </p>
              </div>

              <div className="pt-4 border-t border-[#F4F7FB] flex items-center justify-between text-xs font-semibold text-[#0B192C]">
                <span className="text-cyan-700">AI Drafting Available</span>
                <span className="group-hover:underline">Start Quote &rarr;</span>
              </div>
            </div>
          </div>

          {/* Card 2: Invoices */}
          <div 
            onClick={onOpenNewInvoice}
            className="rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-[#E5E9F0] bg-white flex flex-col h-full cursor-pointer group"
          >
            {/* Image Header with Fixed Aspect Ratio */}
            <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-100 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80" 
                alt="Invoicing and payment accounting" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0B192C]/85 backdrop-blur-sm text-white text-xs font-bold">
                02 • Invoices
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 flex flex-col justify-between bg-white">
              <div>
                <h4 className="text-lg font-bold text-[#0B192C] mb-2 group-hover:text-[#3D74D9] transition-colors flex items-center justify-between">
                  <span>Instant Invoices</span>
                  <ChevronRight className="w-4 h-4 text-[#8F9FB5] group-hover:text-[#3D74D9] group-hover:translate-x-1 transition-all" />
                </h4>
                <p className="text-xs sm:text-sm text-[#5B6D85] leading-relaxed mb-4">
                  Turn approved quotes into payment invoices in one tap. Embed bank accounts, due dates, and settlement terms cleanly.
                </p>
              </div>

              <div className="pt-4 border-t border-[#F4F7FB] flex items-center justify-between text-xs font-semibold text-[#0B192C]">
                <span className="text-emerald-700">Bank Transfer Details</span>
                <span className="group-hover:underline">Issue Invoice &rarr;</span>
              </div>
            </div>
          </div>

          {/* Card 3: Follow Ups */}
          <div 
            onClick={onEnterApp}
            className="rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-[#E5E9F0] bg-white flex flex-col h-full cursor-pointer group"
          >
            {/* Image Header with Fixed Aspect Ratio */}
            <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-100 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80" 
                alt="Client relationships and follow-ups" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0B192C]/85 backdrop-blur-sm text-white text-xs font-bold">
                03 • Follow Ups
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 flex flex-col justify-between bg-white">
              <div>
                <h4 className="text-lg font-bold text-[#0B192C] mb-2 group-hover:text-[#3D74D9] transition-colors flex items-center justify-between">
                  <span>Smart Client Follow-Ups</span>
                  <ChevronRight className="w-4 h-4 text-[#8F9FB5] group-hover:text-[#3D74D9] group-hover:translate-x-1 transition-all" />
                </h4>
                <p className="text-xs sm:text-sm text-[#5B6D85] leading-relaxed mb-4">
                  Automated reminders for pending quotes and overdue invoices with polite, pre-formatted one-tap WhatsApp and email nudges.
                </p>
              </div>

              <div className="pt-4 border-t border-[#F4F7FB] flex items-center justify-between text-xs font-semibold text-[#0B192C]">
                <span className="text-blue-700">Pre-Written WhatsApp Nudges</span>
                <span className="group-hover:underline">Track Deals &rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Professional Footer */}
      <footer className="mt-auto bg-white border-t border-[#E5E9F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B192C] p-1 flex items-center justify-center">
                  <img 
                    src="/logo.png" 
                    alt="Matthorg Logo" 
                    className="w-full h-full object-contain rounded-xl" 
                    onError={(e) => (e.currentTarget.style.display = 'none')} 
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#0B192C]">Matthorg</h3>
                  <p className="text-[11px] font-semibold text-[#5B6D85]">Quotations. Invoices. Follow Ups.</p>
                </div>
              </div>
              <p className="text-xs text-[#5B6D85] leading-relaxed">
                Empowering businesses, contractors, and agencies to create quotes, issue payment invoices, and manage client follow-ups without friction.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F7FB] border border-[#E5E9F0] text-[11px] font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
              <div className="pt-1 text-[11px] text-[#5B6D85] space-y-1">
                <p>Support: <a href="mailto:support@matthorg.com" className="text-[#0B192C] font-semibold hover:underline">support@matthorg.com</a></p>
                <p>Hours: Mon – Sat • 8:00 AM – 8:00 PM</p>
              </div>
            </div>

            {/* Core Features */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-4">
                Core Features
              </h4>
              <ul className="space-y-2.5 text-xs text-[#5B6D85]">
                <li>
                  <button type="button" onClick={() => onOpenNewQuote(false)} className="hover:text-[#0B192C] transition text-left">
                    Quotation Builder
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenNewInvoice} className="hover:text-[#0B192C] transition text-left">
                    Instant Invoice Generator
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onEnterApp} className="hover:text-[#0B192C] transition text-left">
                    Follow-Up Tracker
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onOpenNewQuote(true)} className="hover:text-[#0B192C] transition flex items-center gap-1.5 text-left">
                    <span>AI Quotation Drafting</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold">New</span>
                  </button>
                </li>
                <li>
                  <span className="text-[#5B6D85]">Multi-Currency Engine (₦, $, €, £)</span>
                </li>
                <li>
                  <span className="text-[#5B6D85]">Direct WhatsApp Dispatch</span>
                </li>
                <li>
                  <span className="text-[#5B6D85]">Print & PDF Export</span>
                </li>
              </ul>
            </div>

            {/* Platform & Technology */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-4">
                
              </h4>
              <ul className="space-y-2.5 text-xs text-[#5B6D85]">
                <li className="flex items-center gap-2">
                  
                  <span></span>
                </li>
                <li className="flex items-center gap-2">
                  
                  <span></span>
                </li>
                <li className="flex items-center gap-2">
                  
                  <span></span>
                </li>
                <li className="flex items-center gap-2">
                  
                  <span></span>
                </li>
                <li className="flex items-center gap-2">
                  
                </li>
              </ul>
            </div>

            {/* Legal & Security */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] mb-4">
                Legal & Compliance
              </h4>
              <ul className="space-y-2.5 text-xs text-[#5B6D85]">
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('privacy')}
                    className="hover:text-[#0B192C] font-semibold text-[#0B192C] transition underline decoration-[#E5E9F0] hover:decoration-[#0B192C]"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('terms')}
                    className="hover:text-[#0B192C] font-semibold text-[#0B192C] transition underline decoration-[#E5E9F0] hover:decoration-[#0B192C]"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('refund')}
                    className="hover:text-[#0B192C] font-semibold text-[#0B192C] transition underline decoration-[#E5E9F0] hover:decoration-[#0B192C]"
                  >
                    Refund & Cancellation Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('security')}
                    className="hover:text-[#0B192C] font-semibold text-[#0B192C] transition underline decoration-[#E5E9F0] hover:decoration-[#0B192C]"
                  >
                    Security & Data Protection
                  </button>
                </li>
                <li>
                  <span className="text-[#8F9FB5]">100% Data Ownership Guarantee</span>
                </li>
                <li>
                  <span className="text-[#8F9FB5]">Zero Financial Data Selling</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#E5E9F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8F9FB5]">
            <p>
              © {new Date().getFullYear()} Matthorg Technologies. All rights reserved. 
            </p>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => openLegal('privacy')}
                className="hover:text-[#0B192C] transition"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => openLegal('terms')}
                className="hover:text-[#0B192C] transition"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => openLegal('refund')}
                className="hover:text-[#0B192C] transition"
              >
                Refunds
              </button>
              <button
                type="button"
                onClick={() => openLegal('security')}
                className="hover:text-[#0B192C] transition"
              >
                Security
              </button>
              <button
                type="button"
                onClick={onEnterApp}
                className="hover:text-[#0B192C] transition font-bold text-[#0B192C]"
              >
                Workspace &rarr;
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy, Terms of Service, Refund & Security Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        type={legalModalType}
      />
    </div>
  );
}
