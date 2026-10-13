import React, { useState } from 'react';
import { FollowUp, BusinessProfile, Quote } from '../types';
import {
  Clock,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  buildWhatsAppLink,
  createFollowUpWhatsAppText,
} from '../utils/formatters';

interface FollowUpsViewProps {
  followups: FollowUp[];
  quotes: Quote[];
  business: BusinessProfile;
  onUpdateStatus: (id: string, status: FollowUp['status']) => void;
  onReschedule: (fu: FollowUp) => void;
  onDeleteFollowUp: (id: string) => void;
  onConvertToInvoice: (quote: Quote) => void;
  onOpenMessageModal?: (target: any) => void;
  onOpenNewFollowUp?: () => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  followups,
  quotes,
  business,
  onUpdateStatus,
  onReschedule,
  onDeleteFollowUp,
  onConvertToInvoice,
  onOpenMessageModal,
  onOpenNewFollowUp,
}) => {
  const [filter, setFilter] = useState<'pending' | 'completed' | 'snoozed' | 'cancelled' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = followups.filter((fu) => {
    const matchesFilter = filter === 'all' || fu.status === filter;
    const matchesSearch =
      fu.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fu.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fu.quote_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleWhatsApp = (fu: FollowUp) => {
    const text = createFollowUpWhatsAppText(
      fu.customer_name,
      business.business_name,
      fu.quote_number || 'Quotation',
      fu.title,
      formatCurrency(fu.amount, business.currency)
    );
    const link = buildWhatsAppLink(fu.customer_whatsapp, text);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-12">
      {/* Header with Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#E5E9F0] shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">
            Follow-Up Engine ({followups.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6D85] mt-1">
            Businesses that follow up within 48 hours close 3x more deals. Never let a quote or lead go cold.
          </p>
        </div>

        {onOpenNewFollowUp && (
          <button
            onClick={onOpenNewFollowUp}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0B192C] hover:bg-[#152744] text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Schedule Follow-Up</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5B6D85] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, purpose, or quote #..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E5E9F0] text-xs sm:text-sm text-[#0B192C] placeholder-[#8F9FB5] focus:outline-none focus:border-[#3D74D9] transition shadow-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl text-xs font-semibold border border-[#E5E9F0] shadow-xs overflow-x-auto">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Pending ({followups.filter((f) => f.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('snoozed')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filter === 'snoozed'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Snoozed
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Won / Closed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filter === 'cancelled'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filter === 'all'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#5B6D85] bg-white rounded-3xl border border-dashed border-[#CBD5E1] space-y-3 p-6">
          <Clock className="w-10 h-10 mx-auto text-slate-400" />
          <div className="font-bold text-sm text-[#0B192C]">No follow-up reminders found</div>
          <p className="max-w-sm mx-auto text-xs text-[#5B6D85]">
            Create a follow-up from any quote, lead, or client to ensure high deal conversion rates.
          </p>
          {onOpenNewFollowUp && (
            <button
              onClick={onOpenNewFollowUp}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B192C] text-white text-xs font-bold transition hover:bg-[#152744]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule First Follow-Up</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fu) => (
            <div
              key={fu.id}
              className="p-5 rounded-3xl bg-white border border-[#E5E9F0] hover:border-[#3D74D9]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-[#0B192C] group-hover:text-[#3D74D9] transition">
                    {fu.customer_name}
                  </span>
                  {fu.amount > 0 && (
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {formatCurrency(fu.amount, business.currency)}
                    </span>
                  )}
                  {fu.quote_number && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F4F7FB] text-[#0B192C] font-bold border border-[#E5E9F0]">
                      {fu.quote_number}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      fu.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : fu.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : fu.status === 'snoozed'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-blue-50 text-blue-800 border-blue-300'
                    }`}
                  >
                    {fu.status}
                  </span>
                </div>

                <p className="text-xs text-[#5B6D85] leading-relaxed">
                  <strong className="text-[#0B192C]">{fu.title}</strong>
                  {fu.notes ? ` — ${fu.notes}` : ''}
                </p>

                <div className="text-[11px] text-[#5B6D85] flex flex-wrap items-center gap-3 pt-1">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-[#3D74D9]" />
                    <span>Due: {formatDate(fu.reminder_date)}</span>
                  </span>
                  {fu.customer_whatsapp && (
                    <span className="flex items-center gap-1 text-emerald-700 font-mono text-[10px]">
                      <MessageCircle className="w-3 h-3" /> {fu.customer_whatsapp}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons with Remove Action */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E9F0]">
                {(fu.status === 'pending' || fu.status === 'snoozed') && (
                  <>
                    {onOpenMessageModal && (
                      <button
                        onClick={() =>
                          onOpenMessageModal({
                            targetType: fu.quote_id ? 'quote' : fu.lead_id ? 'lead' : fu.invoice_id ? 'invoice' : 'customer',
                            targetId: fu.quote_id || fu.lead_id || fu.invoice_id || fu.id,
                            customerName: fu.customer_name,
                            customerWhatsapp: fu.customer_whatsapp,
                            serviceTitle: fu.title,
                            amount: fu.amount,
                            referenceNumber: fu.quote_number || fu.lead_number || fu.invoice_number,
                            stageNotes: fu.notes,
                            followUpId: fu.id,
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition active:scale-95"
                        title="AI Message Draft"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                        <span>AI Draft</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleWhatsApp(fu)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition active:scale-95"
                      title="Open WhatsApp with follow-up message"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => onReschedule(fu)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#0B192C] text-xs font-semibold border border-[#CBD5E1] transition"
                    >
                      Reschedule
                    </button>

                    <button
                      onClick={() => {
                        onUpdateStatus(fu.id, 'completed');
                        const targetQuote = quotes.find((q) => q.id === fu.quote_id);
                        if (targetQuote && confirm('Deal marked as WON! Would you like to generate an invoice now?')) {
                          onConvertToInvoice(targetQuote);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
                      title="Mark as Won"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Won</span>
                    </button>

                    <button
                      onClick={() => onUpdateStatus(fu.id, 'cancelled')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
                      title="Mark as Lost"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Lost</span>
                    </button>
                  </>
                )}

                {fu.status !== 'pending' && (
                  <button
                    onClick={() => onUpdateStatus(fu.id, 'pending')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-[#0B192C] hover:bg-slate-200 text-xs font-bold border border-slate-300 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen</span>
                  </button>
                )}

                {/* Remove / Delete Button */}
                <button
                  onClick={() => {
                    if (confirm(`Remove follow-up reminder for "${fu.customer_name}"?`)) {
                      onDeleteFollowUp(fu.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Remove this follow-up"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
