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
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  followups,
  quotes,
  business,
  onUpdateStatus,
  onReschedule,
  onDeleteFollowUp,
  onConvertToInvoice,
}) => {
  const [filter, setFilter] = useState<'pending' | 'completed' | 'cancelled' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = followups.filter((fu) => {
    const matchesFilter = filter === 'all' || fu.status === filter;
    const matchesSearch =
      fu.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fu.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fu.quote_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleWhatsApp = (fu: FollowUp) => {
    const text = createFollowUpWhatsAppText(
      fu.customer_name,
      business.business_name,
      fu.quote_number,
      fu.title,
      formatCurrency(fu.amount, business.currency)
    );
    const link = buildWhatsAppLink(fu.customer_whatsapp, text);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-[#E5E9F0]">
        <h1 className="text-xl font-bold text-[#0B192C]">Follow-Up Reminders ({followups.length})</h1>
        <p className="text-xs text-[#5B6D85] mt-0.5">
          Businesses that follow up within 48 hours close 3x more deals. Never let a quote go cold.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5B6D85] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or quote #..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E5E9F0] text-xs text-white placeholder-[#8C8178] focus:outline-none focus:border-[#0B192C]"
          />
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl text-xs font-medium border border-[#E5E9F0]">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'pending'
                ? 'bg-[#0B192C]/20 text-[#5B6D85] font-semibold'
                : 'text-[#5B6D85] hover:text-white'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                : 'text-[#5B6D85] hover:text-white'
            }`}
          >
            Won / Completed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'cancelled'
                ? 'bg-rose-500/20 text-rose-300 font-semibold'
                : 'text-[#5B6D85] hover:text-white'
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'all'
                ? 'bg-[#0B192C] text-white font-semibold'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#5B6D85] bg-white/50 rounded-2xl border border-dashed border-[#E5E9F0] space-y-2">
          <Clock className="w-8 h-8 mx-auto text-[#5B6D85]" />
          <div>No follow-up reminders in this category.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fu) => (
            <div
              key={fu.id}
              className="p-4 rounded-2xl bg-white border border-[#E5E9F0] hover:border-[#0B192C]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{fu.customer_name}</span>
                  <span className="font-mono text-xs font-bold text-[#5B6D85]">
                    {formatCurrency(fu.amount, business.currency)}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4F7FB] text-[#5B6D85] border border-[#E5E9F0]">
                    {fu.quote_number}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      fu.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : fu.status === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-[#0B192C]/20 text-[#5B6D85]'
                    }`}
                  >
                    {fu.status}
                  </span>
                </div>

                <p className="text-xs text-[#5B6D85]">
                  {fu.title} {fu.notes ? `• ${fu.notes}` : ''}
                </p>

                <div className="text-[11px] text-[#5B6D85] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#5B6D85]" />
                  <span>Reminder Date: {formatDate(fu.reminder_date)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {fu.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleWhatsApp(fu)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-semibold shadow transition active:scale-95"
                      title="Open WhatsApp with follow-up message"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => onReschedule(fu)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#5B6D85] text-xs font-medium border border-[#E5E9F0] transition"
                    >
                      Reschedule
                    </button>

                    <button
                      onClick={() => {
                        onUpdateStatus(fu.id, 'completed');
                        const targetQuote = quotes.find((q) => q.id === fu.quote_id);
                        if (targetQuote && confirm('Marked as WON! Convert to invoice now?')) {
                          onConvertToInvoice(targetQuote);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Won</span>
                    </button>

                    <button
                      onClick={() => onUpdateStatus(fu.id, 'cancelled')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Lost</span>
                    </button>
                  </>
                )}

                {fu.status !== 'pending' && (
                  <button
                    onClick={() => onUpdateStatus(fu.id, 'pending')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F4F7FB] text-[#5B6D85] hover:text-white text-xs border border-[#E5E9F0] transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (confirm('Delete this follow-up reminder?')) {
                      onDeleteFollowUp(fu.id);
                    }
                  }}
                  className="p-1.5 text-[#5B6D85] hover:text-rose-400 transition"
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
