import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileCheck, Lock, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';

export type LegalDocType = 'privacy' | 'terms' | 'refund' | 'security';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: LegalDocType;
}

export function LegalModal({ isOpen, onClose, type = 'privacy' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalDocType>(type);

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B192C]/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[85vh] rounded-[32px] bg-white border border-[#E5E9F0] shadow-2xl overflow-hidden flex flex-col relative">
        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-[#E5E9F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] flex items-center justify-center text-[#3D74D9]">
              {activeTab === 'privacy' && <ShieldCheck className="w-5 h-5" />}
              {activeTab === 'terms' && <FileCheck className="w-5 h-5" />}
              {activeTab === 'refund' && <RefreshCw className="w-5 h-5" />}
              {activeTab === 'security' && <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0B192C]">
                {activeTab === 'privacy' && 'Privacy Policy'}
                {activeTab === 'terms' && 'Terms of Service'}
                {activeTab === 'refund' && 'Refund & Cancellation Policy'}
                {activeTab === 'security' && 'Security & Data Protection'}
              </h2>
              <p className="text-xs text-[#5B6D85]">
                Matthorg Technologies • Last updated: March 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#8F9FB5] hover:text-[#0B192C] hover:bg-[#F4F7FB] transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 sm:px-8 pt-3 pb-1 border-b border-[#E5E9F0] bg-[#F8FAFC] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-white text-[#0B192C] shadow-xs border border-[#E5E9F0]'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-white text-[#0B192C] shadow-xs border border-[#E5E9F0]'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('refund')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'refund'
                ? 'bg-white text-[#0B192C] shadow-xs border border-[#E5E9F0]'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Refund Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-white text-[#0B192C] shadow-xs border border-[#E5E9F0]'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Security & Compliance
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-[#384A62] leading-relaxed">
          {activeTab === 'privacy' && (
            <>
              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">1. Overview and Commitment</h3>
                <p>
                  At Matthorg, we believe that your financial relationships with your clients should remain private, confidential, and secure. We do not sell, rent, or monetize your customer records, quotations, invoices, or business financials under any circumstances.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">2. Information We Collect</h3>
                <ul className="space-y-2 list-disc pl-5">
                  <li>
                    <strong className="text-[#0B192C]">Account Information:</strong> Your registered business name, work email address, and authentication credentials managed securely via Supabase.
                  </li>
                  <li>
                    <strong className="text-[#0B192C]">Workspace Data:</strong> Quotation drafts, issued invoices, client contact information (phone, email, billing address), line items, currencies, and follow-up schedules.
                  </li>
                  <li>
                    <strong className="text-[#0B192C]">Document Attachments:</strong> Company logos and signature files stored in dedicated Cloudflare R2 object storage with encrypted transport.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">3. Storage & Data Security</h3>
                <p>
                  Data is cached in your local browser storage for offline resilience and synchronized with your authenticated workspace on Supabase when connected. Storage buckets are authenticated and access-controlled through presigned URLs.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">4. AI Feature Privacy</h3>
                <p>
                  When you use the AI Draft assistant, prompt parameters are processed solely to generate structured line items and quotation scopes. Your data is not used for model training without explicit consent.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">5. Your Ownership & Rights</h3>
                <p>
                  You retain 100% ownership of your quotation and invoice data. You may export your workspace records as JSON or PDF at any time, or request complete account deletion.
                </p>
              </div>
            </>
          )}

          {activeTab === 'terms' && (
            <>
              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing or using the Matthorg web app, Progressive Web App (PWA), or Android Trusted Web Activity (TWA), you agree to comply with and be bound by these Terms of Service.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">2. Permitted Use</h3>
                <p>
                  Matthorg is provided to assist businesses, independent contractors, freelancers, and agencies in generating business quotations, issuing payment invoices, and organizing client follow-ups. You are solely responsible for ensuring the accuracy of all tax calculations, pricing, and invoice deliverables provided to your clients.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">3. User Responsibilities & Account Security</h3>
                <p>
                  You are responsible for safeguarding your login credentials and ensuring that authorized personnel only access your client lists and billing records. You agree not to use the service for fraudulent invoicing or unlawful spam follow-up activities.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">4. Intellectual Property & User Content</h3>
                <p>
                  Matthorg and its interface components are proprietary. However, you retain complete and unencumbered intellectual property rights over all customer invoices, logos, quotes, and business collateral you create using the platform.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">5. Service Availability & Modifications</h3>
                <p>
                  We strive for 99.9% uptime. The application provides offline-first PWA caching so you can draft and review quotes even without an active internet connection.
                </p>
              </div>
            </>
          )}

          {activeTab === 'refund' && (
            <>
              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">1. Subscription Plans</h3>
                <p>
                  Matthorg offers Free, Pro (₦2,500/month), and Business (₦7,500/month) subscription tiers. Subscriptions can be upgraded, downgraded, or cancelled at any time from your account settings.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">2. 14-Day Money-Back Guarantee</h3>
                <p>
                  If you are unsatisfied with your paid subscription for any reason within 14 days of your initial purchase or renewal, contact our support team at <span className="font-semibold text-[#0B192C]">support@matthorg.com</span> for a full, unconditional refund.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">3. Cancellation Policy</h3>
                <p>
                  Upon cancellation, you will retain access to your paid features until the conclusion of your current billing cycle. No further automatic charges will be made.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">4. Free Tier Guarantee</h3>
                <p>
                  The Free Starter tier will remain free indefinitely. You will never be billed without your explicit confirmation and plan upgrade.
                </p>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">1. Encryption at Rest and in Transit</h3>
                <p>
                  All network communication between your browser, PWA, and our servers is enforced with TLS 1.3 encryption. Document attachments and PDF exports are housed in private Cloudflare R2 vaults protected by AES-256 encryption.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">2. Supabase Auth Security</h3>
                <p>
                  Authentication is powered by Supabase with Row Level Security (RLS) policies ensuring each business can only read and modify their own quotes, invoices, and customer catalogs.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">3. Offline Security (PWA / TWA)</h3>
                <p>
                  When operating offline, cached application data remains strictly within your browser's sandboxed local storage. No unauthenticated third-party scripts have access to your database.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B192C] mb-2">4. Reporting Security Vulnerabilities</h3>
                <p>
                  If you identify any security issue or vulnerability, please contact our security team at <span className="font-semibold text-[#0B192C]">security@matthorg.com</span>. We review and address reports promptly.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-[#E5E9F0] bg-[#F4F7FB] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5B6D85]">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-end encrypted workspace</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white text-xs font-bold transition"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
