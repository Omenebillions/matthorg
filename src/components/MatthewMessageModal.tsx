/**
 * MATTHORG — MATTHEW APPROVAL-FIRST COMMUNICATION MODAL
 * Context-aware message drafting with professional review, editing & approval
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MessageCircle,
  Mail,
  Smartphone,
  Copy,
  Check,
  X,
  Send,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Award,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { generateCommunicationDraft, CommunicationTone } from '../lib/followups';
import { formatCurrency, buildWhatsAppLink } from '../utils/formatters';

export interface MatthewMessageModalTarget {
  targetType: 'lead' | 'quote' | 'invoice' | 'customer';
  targetId: string;
  customerName: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  customerEmail?: string;
  serviceTitle: string;
  amount?: number;
  referenceNumber?: string;
  stageNotes?: string;
  followUpId?: string;
}

interface MatthewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: MatthewMessageModalTarget | null;
  business: BusinessProfile;
  onCompleteFollowUp?: (followUpId: string) => void;
  onSnoozeFollowUp?: (followUpId: string, days: number) => void;
  onMarkWonClosed?: (target: MatthewMessageModalTarget) => void;
  onLogActivity?: (note: string) => void;
}

const TONE_OPTIONS: Array<{ tone: CommunicationTone; label: string }> = [
  { tone: 'Professional', label: 'Professional' },
  { tone: 'Friendly Follow-Up', label: 'Friendly Follow-Up' },
  { tone: 'Urgent / Gentle Reminder', label: 'Urgent / Gentle Reminder' },
  { tone: 'Value-Add Check-In', label: 'Value-Add Check-In' },
  { tone: 'Objection Clarification', label: 'Objection Clarification' },
  { tone: 'Closing Urgency', label: 'Closing Urgency' },
];

export const MatthewMessageModal: React.FC<MatthewMessageModalProps> = ({
  isOpen,
  onClose,
  target,
  business,
  onCompleteFollowUp,
  onSnoozeFollowUp,
  onMarkWonClosed,
  onLogActivity,
}) => {
  if (!isOpen || !target) return null;

  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [selectedTone, setSelectedTone] = useState<CommunicationTone>('Professional');
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedObjection, setSelectedObjection] = useState<string>('');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const phone = target.customerWhatsapp || target.customerPhone || '';
  const email = target.customerEmail || '';

  const loadDraft = async (toneOverride?: CommunicationTone, objectionOverride?: string) => {
    setIsGenerating(true);
    const toneToUse = toneOverride || selectedTone;
    const objectionToUse = objectionOverride !== undefined ? objectionOverride : selectedObjection;

    try {
      const text = await generateCommunicationDraft({
        channel,
        targetType: target.targetType,
        customerName: target.customerName,
        businessName: business.business_name,
        currency: business.currency,
        amount: target.amount,
        serviceTitle: target.serviceTitle,
        referenceNumber: target.referenceNumber,
        stageNotes: target.stageNotes,
        objection: objectionToUse,
        tone: toneToUse,
      });
      setDraft(text);
    } catch {
      // Handled gracefully in lib
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && target) {
      loadDraft();
    }
  }, [isOpen, target?.targetId, channel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setIsCopied(true);
    if (onLogActivity) {
      onLogActivity(`Copied ${channel.toUpperCase()} message for ${target.customerName}`);
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleApproveAndOpen = () => {
    if (channel === 'whatsapp') {
      const link = buildWhatsAppLink(phone, draft);
      window.open(link, '_blank');
    } else if (channel === 'email') {
      const subject = encodeURIComponent(`${business.business_name}: Follow-up regarding ${target.serviceTitle} (${target.referenceNumber || ''})`);
      const body = encodeURIComponent(draft);
      window.open(`mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`, '_blank');
    } else if (channel === 'sms') {
      const body = encodeURIComponent(draft);
      window.open(`sms:${encodeURIComponent(phone)}?body=${body}`, '_self');
    }

    if (onLogActivity) {
      onLogActivity(`Approved & initiated ${channel.toUpperCase()} follow-up with ${target.customerName}`);
    }

    if (target.followUpId && onCompleteFollowUp) {
      onCompleteFollowUp(target.followUpId);
      setStatusFeedback(`Follow-up marked completed via ${channel.toUpperCase()}!`);
      setTimeout(() => onClose(), 1200);
    }
  };

  const handleSnooze = (days: number) => {
    if (target.followUpId && onSnoozeFollowUp) {
      onSnoozeFollowUp(target.followUpId, days);
      if (onLogActivity) {
        onLogActivity(`Snoozed follow-up with ${target.customerName} for +${days} days`);
      }
      setStatusFeedback(`Follow-up snoozed for +${days} days.`);
      setTimeout(() => onClose(), 1000);
    } else {
      onClose();
    }
  };

  const handleMarkWonClosed = () => {
    if (onMarkWonClosed) {
      onMarkWonClosed(target);
    }
    if (target.followUpId && onCompleteFollowUp) {
      onCompleteFollowUp(target.followUpId);
    }
    if (onLogActivity) {
      onLogActivity(`Marked ${target.targetType} with ${target.customerName} as Won / Closed`);
    }
    setStatusFeedback('Opportunity marked Won / Closed & follow-up resolved!');
    setTimeout(() => onClose(), 1200);
  };

  const handleComplete = () => {
    if (target.followUpId && onCompleteFollowUp) {
      onCompleteFollowUp(target.followUpId);
      if (onLogActivity) {
        onLogActivity(`Marked follow-up with ${target.customerName} as completed`);
      }
      setStatusFeedback('Task marked as completed.');
      setTimeout(() => onClose(), 1000);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-[#E5E9F0] p-6 shadow-2xl text-[#0B192C] flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5E9F0] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#0B192C]">Matthew Message Assistant</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Approval-First
                </span>
              </div>
              <p className="text-xs text-[#5B6D85]">
                Tailored for {target.customerName} • {target.serviceTitle}
                {target.amount ? ` (${formatCurrency(target.amount, business.currency)})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5B6D85] hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Selection */}
        <div className="flex items-center justify-between gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E5E9F0]">
          <button
            onClick={() => setChannel('whatsapp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
              channel === 'whatsapp'
                ? 'bg-[#25D366] text-white shadow-xs'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={() => setChannel('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
              channel === 'email'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={() => setChannel('sms')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
              channel === 'sms'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            SMS
          </button>
        </div>

        {/* 6 Requested Tones */}
        <div>
          <div className="text-[11px] font-semibold text-[#5B6D85] uppercase tracking-wider mb-2">
            Matthew Tone Strategy:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {TONE_OPTIONS.map(({ tone, label }) => (
              <button
                key={tone}
                onClick={() => {
                  setSelectedTone(tone);
                  loadDraft(tone);
                }}
                className={`text-xs px-2.5 py-2 rounded-xl border text-center font-medium transition ${
                  selectedTone === tone
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-xs'
                    : 'bg-white border-[#E5E9F0] text-[#5B6D85] hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Editable Message Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B192C]">Review & Edit Before Sending:</span>
            <button
              onClick={() => loadDraft()}
              disabled={isGenerating}
              className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>
          <div className="relative">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={channel === 'sms' ? 4 : 7}
              placeholder="Generating tailored message..."
              disabled={isGenerating}
              className="w-full rounded-2xl border border-[#E5E9F0] p-4 text-xs font-sans text-[#0B192C] leading-relaxed focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none resize-none transition"
            />
            {isGenerating && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-700">
                <Sparkles className="w-4 h-4 animate-spin" />
                Matthew is tailoring with business context...
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#5B6D85]">
            <span className="font-semibold text-slate-700">{draft.length} characters</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Approval-First: Never sent automatically
            </span>
          </div>
        </div>

        {/* Feedback message */}
        {statusFeedback && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {statusFeedback}
          </div>
        )}

        {/* Action Controls & Workflows */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E5E9F0]">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#E5E9F0] text-xs font-bold text-[#0B192C] hover:bg-slate-50 transition"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {isCopied ? 'Copied' : 'Copy'}
            </button>

            {/* Snooze Options: +3 days and +7 days */}
            {target.followUpId && (
              <>
                <button
                  onClick={() => handleSnooze(3)}
                  className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border border-[#E5E9F0] text-xs font-semibold text-[#5B6D85] hover:bg-slate-50 transition"
                  title="Snooze for 3 days"
                >
                  <Clock className="w-3.5 h-3.5" />
                  +3d
                </button>
                <button
                  onClick={() => handleSnooze(7)}
                  className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border border-[#E5E9F0] text-xs font-semibold text-[#5B6D85] hover:bg-slate-50 transition"
                  title="Snooze for 7 days"
                >
                  <Clock className="w-3.5 h-3.5" />
                  +7d
                </button>
              </>
            )}

            {/* Mark Won / Closed Action */}
            <button
              onClick={handleMarkWonClosed}
              className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
              title="Mark this opportunity Won or Closed and resolve follow-up"
            >
              <Award className="w-3.5 h-3.5" />
              Won / Closed
            </button>

            {target.followUpId && (
              <button
                onClick={handleComplete}
                className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border border-[#E5E9F0] text-xs font-semibold text-[#5B6D85] hover:bg-slate-50 transition"
                title="Mark done without sending"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Done
              </button>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={handleApproveAndOpen}
              disabled={!draft.trim()}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-white text-xs font-extrabold shadow-sm hover:shadow-md transition active:scale-98 disabled:opacity-50 ${
                channel === 'whatsapp'
                  ? 'bg-[#25D366] hover:bg-[#1EBE5D]'
                  : 'bg-[#0B192C] hover:bg-[#1B2A40]'
              }`}
            >
              {channel === 'whatsapp' && <MessageCircle className="w-4 h-4" />}
              {channel === 'email' && <Mail className="w-4 h-4" />}
              {channel === 'sms' && <Smartphone className="w-4 h-4" />}
              {channel === 'whatsapp'
                ? 'Approve & Open WhatsApp'
                : channel === 'email'
                ? 'Approve & Open Email'
                : 'Approve & Open SMS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

