import React, { useState } from 'react';
import { Invoice, BusinessProfile, InvoiceStatus } from '../types';
import {
  Plus,
  Search,
  FileDown,
  MessageCircle,
  CreditCard,
  Calendar,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  buildWhatsAppLink,
  createInvoiceWhatsAppText,
} from '../utils/formatters';
import { generateInvoicePDF } from '../utils/pdfGenerator';

interface InvoicesViewProps {
  invoices: Invoice[];
  business: BusinessProfile;
  onNewInvoice: () => void;
  onOpenInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onMarkPaid: (id: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  business,
  onNewInvoice,
  onOpenInvoice,
  onDeleteInvoice,
  onMarkPaid,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalCollected = invoices.reduce(
    (acc, inv) => acc + (inv.amount_paid || (inv.status === 'Paid' ? inv.total : 0)),
    0
  );
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.notes && inv.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Paid':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Unpaid':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Sent':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleWhatsApp = (inv: Invoice) => {
    const balance = Math.max(0, inv.total - (inv.amount_paid || 0));
    const msg = createInvoiceWhatsAppText(
      inv.customer_name,
      business.business_name,
      inv.invoice_number,
      formatCurrency(balance > 0 ? balance : inv.total, business.currency),
      formatDate(inv.due_date),
      inv.payment_details
    );
    const link = buildWhatsAppLink(inv.customer_whatsapp || inv.customer_phone, msg);
    window.open(link, '_blank');
  };

  const handleCopyPayment = (inv: Invoice) => {
    const balance = Math.max(0, inv.total - (inv.amount_paid || 0));
    const msg = createInvoiceWhatsAppText(
      inv.customer_name,
      business.business_name,
      inv.invoice_number,
      formatCurrency(balance > 0 ? balance : inv.total, business.currency),
      formatDate(inv.due_date),
      inv.payment_details
    );
    navigator.clipboard.writeText(msg);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#E5E9F0] shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Invoices ({invoices.length})</h1>
          <p className="text-xs sm:text-sm text-[#5B6D85] mt-1">
            Track customer billing, send payment reminders on WhatsApp, and collect payments faster.
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ New Invoice</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#E5E9F0] shadow-xs">
          <div className="text-xs font-semibold text-[#5B6D85]">Total Invoiced</div>
          <div className="text-2xl font-extrabold text-[#0B192C] font-mono mt-1">
            {formatCurrency(totalBilled, business.currency)}
          </div>
          <div className="text-[11px] text-[#8F9FB5] mt-1">Across all issued invoices</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E5E9F0] shadow-xs">
          <div className="text-xs font-semibold text-[#5B6D85]">Total Collected</div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
            {formatCurrency(totalCollected, business.currency)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Realized payments in bank</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E5E9F0] shadow-xs">
          <div className="text-xs font-semibold text-[#5B6D85]">Total Outstanding</div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono mt-1">
            {formatCurrency(totalOutstanding, business.currency)}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Awaiting client settlement</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5B6D85] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice # or client name..."
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
            {(['All', 'Unpaid', 'Partially Paid', 'Paid', 'Sent', 'Overdue', 'Draft'] as const).map(
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
      {filteredInvoices.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#5B6D85] bg-white rounded-3xl border border-dashed border-[#E5E9F0] space-y-3 p-8">
          <CreditCard className="w-10 h-10 mx-auto text-[#8F9FB5]" />
          <div className="text-sm font-bold text-[#0B192C]">No invoices found</div>
          <p className="text-xs text-[#5B6D85]">Create an invoice or adjust your search filters.</p>
          <button
            onClick={onNewInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> Create New Invoice
          </button>
        </div>
      ) : displayMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInvoices.map((inv) => {
            const balance = Math.max(0, inv.total - (inv.amount_paid || 0));
            return (
              <div
                key={inv.id}
                className="group rounded-3xl bg-white border border-[#E5E9F0] hover:border-blue-300 p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md"
              >
                {/* Upper Box */}
                <div
                  onClick={() => onOpenInvoice(inv)}
                  className="cursor-pointer relative w-full h-28 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-[#E5E9F0] flex items-center justify-center overflow-hidden mb-4 group-hover:border-blue-200 transition"
                >
                  <div className="text-center p-3">
                    <CreditCard className="w-8 h-8 mx-auto text-cyan-600 group-hover:scale-110 transition duration-300" />
                    <span className="text-[10px] font-mono font-medium text-[#5B6D85] mt-1 block">
                      Due: {formatDate(inv.due_date)}
                    </span>
                  </div>

                  {/* Status pill badge top-right */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        inv.status
                      )}`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  {/* Invoice number top-left */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-[#0B192C] border border-[#E5E9F0] shadow-xs">
                      {inv.invoice_number}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div
                  onClick={() => onOpenInvoice(inv)}
                  className="cursor-pointer space-y-1 flex-1"
                >
                  <h3 className="text-sm font-bold text-[#0B192C] group-hover:text-[#3D74D9] transition truncate">
                    {inv.customer_name}
                  </h3>
                  <p className="text-xs text-[#5B6D85] line-clamp-2 leading-relaxed">
                    {inv.notes || `Issued ${formatDate(inv.issue_date)} • ${inv.items.length} item(s)`}
                  </p>
                  {inv.amount_paid > 0 && inv.status !== 'Paid' && (
                    <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                      Paid: {formatCurrency(inv.amount_paid, business.currency)}
                    </div>
                  )}
                </div>

                {/* Bottom Row */}
                <div className="pt-3 mt-4 border-t border-[#E5E9F0] flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-bold uppercase text-[#8F9FB5]">Balance Due</div>
                    <div className="font-mono text-base font-extrabold text-[#0B192C]">
                      {formatCurrency(balance, business.currency)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleWhatsApp(inv)}
                      className="p-2 text-[#5B6D85] hover:text-[#25D366] rounded-xl hover:bg-emerald-50 transition"
                      title="Send via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => generateInvoicePDF(inv, business)}
                      className="p-2 text-[#5B6D85] hover:text-[#0B192C] rounded-xl hover:bg-slate-100 transition"
                      title="Download PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onOpenInvoice(inv)}
                      className="w-8 h-8 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white flex items-center justify-center font-bold shadow-xs transition active:scale-90"
                      title="Open / Edit Invoice"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-[#E5E9F0] shadow-xs overflow-hidden divide-y divide-[#E5E9F0]">
          {filteredInvoices.map((inv) => {
            const balance = Math.max(0, inv.total - (inv.amount_paid || 0));
            return (
              <div
                key={inv.id}
                className="p-4 hover:bg-[#F8FAFC] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div
                  onClick={() => onOpenInvoice(inv)}
                  className="cursor-pointer space-y-1 flex-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0B192C] px-2 py-0.5 rounded-lg bg-slate-100 border border-[#E5E9F0]">
                      {inv.invoice_number}
                    </span>
                    <span className="text-sm font-bold text-[#0B192C]">{inv.customer_name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                        inv.status
                      )}`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#5B6D85] flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                      Issued: {formatDate(inv.issue_date)}
                    </span>
                    <span className="text-[#5B6D85] font-medium">Due: {formatDate(inv.due_date)}</span>
                    <span>{inv.items.length} item(s)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5E9F0] shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-base font-extrabold text-[#0B192C]">
                      {formatCurrency(balance, business.currency)}
                    </div>
                    {inv.amount_paid > 0 && inv.status !== 'Paid' && (
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        Paid: {formatCurrency(inv.amount_paid, business.currency)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {inv.status !== 'Paid' && (
                      <button
                        onClick={() => onMarkPaid(inv.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition"
                        title="Record full payment"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mark Paid</span>
                      </button>
                    )}

                    <button
                      onClick={() => generateInvoicePDF(inv, business)}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-[#5B6D85] hover:text-[#0B192C] transition border border-[#E5E9F0]"
                      title="Download Invoice PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleWhatsApp(inv)}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-[#25D366] transition border border-[#E5E9F0]"
                      title="Send Invoice on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleCopyPayment(inv)}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-[#5B6D85] hover:text-[#0B192C] transition border border-[#E5E9F0]"
                      title="Copy Payment Details"
                    >
                      {copiedId === inv.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onOpenInvoice(inv)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-xs font-bold text-white shadow-xs transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete invoice ${inv.invoice_number}?`)) {
                          onDeleteInvoice(inv.id);
                        }
                      }}
                      className="p-2 text-[#5B6D85] hover:text-rose-600 transition"
                      title="Delete invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
