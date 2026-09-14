import React, { useState } from 'react';
import { Quote, BusinessProfile, QuoteStatus } from '../types';
import {
  Plus,
  Search,
  Sparkles,
  FileDown,
  MessageCircle,
  Clock,
  ArrowRight,
  Trash2,
  Calendar,
  FileText,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
} from '../utils/formatters';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { shareQuotePdfViaWhatsApp } from '../utils/documentSharing';

interface QuotesViewProps {
  quotes: Quote[];
  business: BusinessProfile;
  onNewQuote: (withAI?: boolean) => void;
  onOpenQuote: (quote: Quote) => void;
  onDeleteQuote: (id: string) => void;
  onConvertToInvoice: (quote: Quote) => void;
  onOpenFollowUpModal: (quote: Quote) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  quotes,
  business,
  onNewQuote,
  onOpenQuote,
  onDeleteQuote,
  onConvertToInvoice,
  onOpenFollowUpModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'All'>('All');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.notes && q.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'Accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Awaiting Response':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Sent':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Rejected':
      case 'Expired':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleWhatsApp = async (q: Quote) => {
    try {
      await shareQuotePdfViaWhatsApp(q, business);
    } catch (error) {
      console.error('Could not share quote PDF:', error);
      window.alert(error instanceof Error ? error.message : 'Could not prepare the quote PDF for WhatsApp.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-12">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#E5E9F0] shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Quotations ({quotes.length})</h1>
          <p className="text-xs sm:text-sm text-[#5B6D85] mt-1">
            Create professional branded quotes, send directly to WhatsApp, and convert deals to invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => onNewQuote(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100/80 text-cyan-700 border border-cyan-200 px-4 py-2.5 text-xs sm:text-sm font-semibold transition"
            title="Use AI to generate quotation items"
          >
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>AI Assist</span>
          </button>

          <button
            onClick={() => onNewQuote(false)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0B192C] hover:bg-[#152744] text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ New Quote</span>
          </button>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5B6D85] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by quote # or customer name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E5E9F0] text-xs sm:text-sm text-[#0B192C] placeholder-[#8F9FB5] focus:outline-none focus:border-[#3D74D9] transition shadow-xs"
          />
        </div>

        {/* View toggle & Status pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#E5E9F0] shadow-xs">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`p-1.5 rounded-xl transition ${
                displayMode === 'grid' ? 'bg-[#0B192C] text-white' : 'text-[#5B6D85] hover:text-[#0B192C]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              className={`p-1.5 rounded-xl transition ${
                displayMode === 'list' ? 'bg-[#0B192C] text-white' : 'text-[#5B6D85] hover:text-[#0B192C]'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            {(['All', 'Draft', 'Sent', 'Awaiting Response', 'Accepted', 'Rejected', 'Expired'] as const).map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 rounded-2xl whitespace-nowrap transition ${
                    statusFilter === st
                      ? 'bg-[#0B192C] text-white shadow-xs'
                      : 'bg-white text-[#5B6D85] hover:text-[#0B192C] border border-[#E5E9F0]'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* List / Grid Display */}
      {filteredQuotes.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#5B6D85] bg-white rounded-3xl border border-dashed border-[#E5E9F0] space-y-3 p-8">
          <FileText className="w-10 h-10 mx-auto text-[#8F9FB5]" />
          <div className="text-sm font-bold text-[#0B192C]">No quotations found</div>
          <p className="text-xs text-[#5B6D85]">Create a new quote or adjust your search filters.</p>
          <button
            onClick={() => onNewQuote(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Create New Quote
          </button>
        </div>
      ) : displayMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredQuotes.map((q) => (
            <div
              key={q.id}
              className="group rounded-3xl bg-white border border-[#E5E9F0] hover:border-blue-300 p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md"
            >
              {/* Upper Box */}
              <div 
                onClick={() => onOpenQuote(q)}
                className="cursor-pointer relative w-full h-28 rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50/40 border border-[#E5E9F0] flex items-center justify-center overflow-hidden mb-4 group-hover:border-cyan-200 transition"
              >
                <div className="text-center p-3">
                  <FileText className="w-8 h-8 mx-auto text-[#0B192C] group-hover:scale-110 transition duration-300" />
                  <span className="text-[10px] font-mono font-medium text-[#5B6D85] mt-1 block">
                    {q.items.length} item(s) • {formatDate(q.issue_date)}
                  </span>
                </div>

                {/* Floating Status pill badge top-right */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                      q.status
                    )}`}
                  >
                    {q.status}
                  </span>
                </div>

                {/* Quote Number top-left */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-[#0B192C] border border-[#E5E9F0] shadow-xs">
                    {q.quote_number}
                  </span>
                </div>
              </div>

              {/* Title & Customer */}
              <div 
                onClick={() => onOpenQuote(q)}
                className="cursor-pointer space-y-1 flex-1"
              >
                <h3 className="text-sm font-bold text-[#0B192C] group-hover:text-[#3D74D9] transition truncate">
                  {q.customer_name}
                </h3>
                <p className="text-xs text-[#5B6D85] line-clamp-2 leading-relaxed">
                  {q.notes || `Issued ${formatDate(q.issue_date)} • Expires ${formatDate(q.expiry_date)}`}
                </p>
                {q.converted_invoice_id && (
                  <span className="inline-block text-[11px] font-bold text-emerald-600 mt-1">
                    ✓ Converted to Invoice
                  </span>
                )}
              </div>

              {/* Bottom Row */}
              <div className="pt-3 mt-4 border-t border-[#E5E9F0] flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold uppercase text-[#8F9FB5]">Total Quote</div>
                  <div className="font-mono text-base font-extrabold text-[#0B192C]">
                    {formatCurrency(q.total, business.currency)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleWhatsApp(q)}
                    className="p-2 text-[#5B6D85] hover:text-[#25D366] rounded-xl hover:bg-emerald-50 transition"
                    title="Send via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => generateQuotePDF(q, business)}
                    className="p-2 text-[#5B6D85] hover:text-[#0B192C] rounded-xl hover:bg-slate-100 transition"
                    title="Download PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenQuote(q)}
                    className="w-8 h-8 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white flex items-center justify-center font-bold shadow-xs transition active:scale-90"
                    title="Open / Edit Quote"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-[#E5E9F0] shadow-xs overflow-hidden divide-y divide-[#E5E9F0]">
          {filteredQuotes.map((q) => (
            <div
              key={q.id}
              className="p-4 hover:bg-[#F8FAFC] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Info column */}
              <div
                onClick={() => onOpenQuote(q)}
                className="cursor-pointer space-y-1 flex-1"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0B192C] px-2 py-0.5 rounded-lg bg-slate-100 border border-[#E5E9F0]">
                    {q.quote_number}
                  </span>
                  <span className="text-sm font-bold text-[#0B192C]">{q.customer_name}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                      q.status
                    )}`}
                  >
                    {q.status}
                  </span>
                </div>

                <div className="text-xs text-[#5B6D85] flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                    Issued: {formatDate(q.issue_date)}
                  </span>
                  <span>Expires: {formatDate(q.expiry_date)}</span>
                  <span>{q.items.length} item(s)</span>
                  {q.converted_invoice_id && (
                    <span className="text-emerald-600 font-bold">✓ Invoiced</span>
                  )}
                </div>

                {q.notes && (
                  <p className="text-xs text-[#5B6D85] line-clamp-1 italic">
                    "{q.notes}"
                  </p>
                )}
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5E9F0] shrink-0">
                <div className="text-right">
                  <div className="font-mono text-base font-extrabold text-[#0B192C]">
                    {formatCurrency(q.total, business.currency)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => generateQuotePDF(q, business)}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 text-[#5B6D85] hover:text-[#0B192C] transition border border-[#E5E9F0]"
                    title="Download PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleWhatsApp(q)}
                    className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-[#25D366] transition border border-[#E5E9F0]"
                    title="Send via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenFollowUpModal(q)}
                    className="p-2 rounded-xl bg-white hover:bg-cyan-50 text-[#5B6D85] hover:text-cyan-700 transition border border-[#E5E9F0]"
                    title="Set Follow-Up Reminder"
                  >
                    <Clock className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onConvertToInvoice(q)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition"
                    title="Convert quote into Invoice"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Invoice</span>
                  </button>

                  <button
                    onClick={() => onOpenQuote(q)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-xs font-bold text-white shadow-xs transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete quote ${q.quote_number}?`)) {
                        onDeleteQuote(q.id);
                      }
                    }}
                    className="p-2 text-[#5B6D85] hover:text-rose-600 transition"
                    title="Delete quote"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
