import React, { useState } from 'react';
import { AppState, Quote, Invoice, FollowUp } from '../types';
import {
  FileText,
  CreditCard,
  Sparkles,
  Clock,
  MessageCircle,
  FileDown,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Plus,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  TrendingUp,
  DollarSign,
  Send,
  AlertCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  buildWhatsAppLink,
  createFollowUpWhatsAppText,
  createQuoteWhatsAppText,
  createInvoiceWhatsAppText,
} from '../utils/formatters';
import { generateQuotePDF, generateInvoicePDF } from '../utils/pdfGenerator';
import { shareInvoicePdfViaWhatsApp, shareQuotePdfViaWhatsApp } from '../utils/documentSharing';

interface DashboardViewProps {
  state: AppState;
  onOpenNewQuote: (withAI?: boolean) => void;
  onOpenNewInvoice: () => void;
  onOpenQuote: (quote: Quote) => void;
  onOpenInvoice: (invoice: Invoice) => void;
  onUpdateQuoteStatus: (quoteId: string, status: Quote['status']) => void;
  onUpdateFollowUpStatus: (followUpId: string, status: FollowUp['status']) => void;
  onRescheduleFollowUp: (followUp: FollowUp) => void;
  onConvertToInvoice: (quote: Quote) => void;
  onOpenSubscription: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onOpenNewQuote,
  onOpenNewInvoice,
  onOpenQuote,
  onOpenInvoice,
  onUpdateQuoteStatus,
  onUpdateFollowUpStatus,
  onRescheduleFollowUp,
  onConvertToInvoice,
  onOpenSubscription,
}) => {
  const { business, quotes, invoices, followups, user } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'quotes' | 'invoices' | 'followups'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Derive user first name
  const firstName = user?.name ? user.name.replace(/^(Engr\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').split(' ')[0] : 'there';

  // Metrics calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7);

  const totalInvoicesCount = invoices.length;
  const totalQuotesCount = quotes.length;

  const outstandingInvoicesAmount = invoices
    .filter((inv) => inv.status !== 'Paid' && inv.status !== 'Draft')
    .reduce((acc, inv) => acc + (inv.total - (inv.amount_paid || 0)), 0);

  const paidThisMonthAmount = invoices
    .filter((inv) => inv.status === 'Paid' || (inv.amount_paid && inv.amount_paid > 0))
    .reduce((acc, inv) => acc + (inv.amount_paid || (inv.status === 'Paid' ? inv.total : 0)), 0);

  const todayFollowUps = followups.filter((f) => f.status === 'pending');

  // Dynamically calculate monthly financial figures from actual quotes & invoices for the last 6 months
  const monthlyStats = React.useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const key = `${year}-${String(monthNum).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      months.push({ key, label, year });
    }

    return months.map(({ key, label }) => {
      const monthInvoices = invoices.filter((inv) => {
        const dateStr = inv.issue_date || inv.created_at || '';
        return dateStr.startsWith(key);
      });
      const monthQuotes = quotes.filter((q) => {
        const dateStr = q.issue_date || q.created_at || '';
        return dateStr.startsWith(key);
      });

      const invoicedTotal = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const paidTotal = monthInvoices.reduce(
        (sum, inv) => sum + (inv.amount_paid || (inv.status === 'Paid' ? inv.total : 0)),
        0
      );

      return {
        month: label,
        key,
        invoiced: invoicedTotal,
        paid: paidTotal,
        invoicesCount: monthInvoices.length,
        quotesCount: monthQuotes.length,
      };
    });
  }, [invoices, quotes]);

  const maxCashflow = Math.max(...monthlyStats.map((m) => m.paid), 1);
  const maxInvoiced = Math.max(...monthlyStats.map((m) => m.invoiced), 1);

  // Dynamic SVG path points for cashflow line chart
  const cashflowPoints = monthlyStats.map((m, idx) => {
    const x = 50 + idx * 86; // 50, 136, 222, 308, 394, 480
    const normalized = m.paid / maxCashflow;
    const y = 145 - normalized * 110;
    return { x, y, val: formatCurrency(m.paid, business.currency), raw: m.paid, month: m.month };
  });

  // Generate smooth cubic bezier SVG path string
  const linePathD = cashflowPoints.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaPathD = `${linePathD} L 480 155 L 50 155 Z`;

  // Combined documents list
  type CombinedDoc =
    | { type: 'quote'; data: Quote; sortDate: string }
    | { type: 'invoice'; data: Invoice; sortDate: string };

  const combinedDocs: CombinedDoc[] = [
    ...(activeCategoryFilter === 'all' || activeCategoryFilter === 'quotes'
      ? quotes.map((q) => ({ type: 'quote' as const, data: q, sortDate: q.created_at || q.issue_date }))
      : []),
    ...(activeCategoryFilter === 'all' || activeCategoryFilter === 'invoices'
      ? invoices.map((inv) => ({ type: 'invoice' as const, data: inv, sortDate: inv.created_at || inv.issue_date }))
      : []),
  ]
    .filter((doc) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      if (doc.type === 'quote') {
        return (
          doc.data.quote_number.toLowerCase().includes(q) ||
          doc.data.customer_name.toLowerCase().includes(q) ||
          (doc.data.notes && doc.data.notes.toLowerCase().includes(q))
        );
      } else {
        return (
          doc.data.invoice_number.toLowerCase().includes(q) ||
          doc.data.customer_name.toLowerCase().includes(q) ||
          (doc.data.notes && doc.data.notes.toLowerCase().includes(q))
        );
      }
    })
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

  // Status badge styling with zero brown colors (cyan, green, red, amber, slate)
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Sent':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Partially Paid':
      case 'Awaiting Response':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Overdue':
      case 'Rejected':
      case 'Expired':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleSendFollowUpWhatsApp = (fu: FollowUp) => {
    const text = createFollowUpWhatsAppText(
      fu.customer_name,
      business.business_name,
      fu.quote_number,
      fu.title || 'Quotation Items',
      formatCurrency(fu.amount, business.currency)
    );
    const link = buildWhatsAppLink(fu.customer_whatsapp, text);
    window.open(link, '_blank');
  };

  const handleSendQuoteWhatsApp = async (q: Quote) => {
    try {
      await shareQuotePdfViaWhatsApp(q, business);
    } catch (error) {
      console.error('Could not share quote PDF:', error);
      window.alert(error instanceof Error ? error.message : 'Could not prepare the quote PDF for WhatsApp.');
    }
  };

  const handleSendInvoiceWhatsApp = async (inv: Invoice) => {
    try {
      await shareInvoicePdfViaWhatsApp(inv, business);
    } catch (error) {
      console.error('Could not share invoice PDF:', error);
      window.alert(error instanceof Error ? error.message : 'Could not prepare the invoice PDF for WhatsApp.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-7xl mx-auto">
      {/* 1. Top Search Bar Matching Reference Design */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#5B6D85]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoices, quotes, or clients..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-[#E5E9F0] text-sm text-[#0B192C] placeholder-[#8F9FB5] focus:outline-none focus:border-[#3D74D9] transition shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-[#5B6D85] hover:text-[#0B192C] text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter / Sliders Button */}
        <button
          onClick={() => {
            setActiveCategoryFilter((prev) => (prev === 'all' ? 'quotes' : prev === 'quotes' ? 'invoices' : 'all'));
          }}
          className="bg-white hover:bg-slate-50 border border-[#E5E9F0] text-[#0B192C] p-3 rounded-2xl shadow-xs transition active:scale-95 shrink-0 flex items-center justify-center"
          title="Filter documents"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Welcome Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C]">
            Welcome {firstName}!
          </h1>
          <p className="text-sm text-[#5B6D85] mt-1">
            Here is your financial performance and active deal summary for today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenNewQuote(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100/80 text-cyan-700 border border-cyan-200 text-xs sm:text-sm font-semibold transition active:scale-95"
            title="Generate a quote with Gemini AI"
          >
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>AI Draft</span>
          </button>

          <button
            onClick={() => onOpenNewQuote(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#0B192C] hover:bg-[#152744] text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Quote</span>
          </button>

          <button
            onClick={onOpenNewInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* 3. Overview Section Matching Exact Image Structure */}
      <div>
        <h2 className="text-xl font-bold text-[#0B192C] mb-4">Overview</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Invoice */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E9F0] shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <TrendingUp className="w-3 h-3" />
                <span>+14%</span>
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#5B6D85]">Total Invoices & Quotes</div>
              <div className="text-3xl font-extrabold text-[#0B192C] tracking-tight mt-1">
                {totalInvoicesCount + totalQuotesCount}
              </div>
              <div className="text-[11px] text-[#8F9FB5] mt-1">
                {totalInvoicesCount} invoices • {totalQuotesCount} quotations
              </div>
            </div>
          </div>

          {/* Card 2: Outstanding Amounts */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E9F0] shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Due
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#5B6D85]">Outstanding Amounts</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight mt-1 font-mono">
                {formatCurrency(outstandingInvoicesAmount, business.currency)}
              </div>
              <div className="text-[11px] text-rose-600 font-medium mt-1">
                {invoices.filter((i) => i.status !== 'Paid' && i.status !== 'Draft').length} invoices awaiting payment
              </div>
            </div>
          </div>

          {/* Card 3: Paid this month */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E9F0] shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Realized
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#5B6D85]">Paid this month</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight mt-1 font-mono">
                {formatCurrency(paidThisMonthAmount, business.currency)}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Successfully collected revenue
              </div>
            </div>
          </div>

          {/* Card 4: Upcoming Payments / Follow-ups */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E9F0] shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                Action
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#5B6D85]">Pending Follow-Ups</div>
              <div className="text-3xl font-extrabold text-[#0B192C] tracking-tight mt-1">
                {todayFollowUps.length}
              </div>
              <div className="text-[11px] text-[#5B6D85] mt-1">
                Quotations needing client check-in
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Two Graphical Cards Matching the Reference Design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Cashflow summary (Last 6 Month) */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E5E9F0] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-[#0B192C]">Cashflow summary</h3>
              <p className="text-xs text-[#5B6D85] mt-0.5">Last 6 Month</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Healthy Trend</span>
            </div>
          </div>

          {/* Smooth Line & Area Chart in SVG */}
          <div className="relative w-full h-56 pt-2 pb-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background Grid Lines */}
              <line x1="40" y1="20" x2="490" y2="20" stroke="#F1F5F9" strokeDasharray="4 4" />
              <line x1="40" y1="60" x2="490" y2="60" stroke="#F1F5F9" strokeDasharray="4 4" />
              <line x1="40" y1="100" x2="490" y2="100" stroke="#F1F5F9" strokeDasharray="4 4" />
              <line x1="40" y1="140" x2="490" y2="140" stroke="#F1F5F9" strokeDasharray="4 4" />

              {/* Y Axis Labels */}
              <text x="5" y="24" fill="#94A3B8" fontSize="10" fontFamily="sans-serif">
                {formatCurrency(maxCashflow, business.currency)}
              </text>
              <text x="5" y="64" fill="#94A3B8" fontSize="10" fontFamily="sans-serif">
                {formatCurrency(Math.round(maxCashflow * 0.66), business.currency)}
              </text>
              <text x="5" y="104" fill="#94A3B8" fontSize="10" fontFamily="sans-serif">
                {formatCurrency(Math.round(maxCashflow * 0.33), business.currency)}
              </text>
              <text x="5" y="144" fill="#94A3B8" fontSize="10" fontFamily="sans-serif">
                {formatCurrency(0, business.currency)}
              </text>

              {/* Area Fill */}
              <path
                d={areaPathD}
                fill="url(#cashflowGradient)"
              />

              {/* Organic Smooth Cashflow Line */}
              <path
                d={linePathD}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {/* Interactive Node Circles */}
              {cashflowPoints.map((pt, i) => (
                <g key={i} className="cursor-pointer">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint === i ? 6 : 4}
                    fill="#FFFFFF"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {hoveredPoint === i && (
                    <text
                      x={pt.x}
                      y={pt.y - 12}
                      textAnchor="middle"
                      fill="#0B192C"
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {pt.val}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {/* X Axis Month Labels */}
            <div className="flex justify-between px-6 pt-2 text-xs font-semibold text-[#8F9FB5]">
              {monthlyStats.map((m) => (
                <span key={m.key}>{m.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Invoice by Amount (Last 6 Month) with Highlighted Tall Green Bar */}
        <div className="lg:col-span-5 rounded-3xl bg-white border border-[#E5E9F0] p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-extrabold text-[#0B192C]">Invoice by Amount</h3>
            <p className="text-xs text-[#5B6D85] mt-0.5">Last 6 Month</p>
          </div>

          <div className="flex items-end justify-between gap-3 h-56 pt-6 pb-2 px-2">
            {monthlyStats.map((item, idx) => {
              const isPeak = item.invoiced === maxInvoiced && item.invoiced > 0;
              const heightPercent =
                item.invoiced > 0 ? Math.max(14, Math.min(100, (item.invoiced / maxInvoiced) * 100)) : 8;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                  {/* Highlight pill on the peak bar */}
                  {isPeak ? (
                    <div className="mb-2 px-2 py-1 rounded-md bg-[#0B192C] text-white text-[10px] font-bold shadow-sm whitespace-nowrap">
                      {formatCurrency(item.invoiced, business.currency)}
                    </div>
                  ) : (
                    <div className="mb-2 text-[9px] font-semibold text-[#8F9FB5] opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {item.invoiced > 0 ? formatCurrency(item.invoiced, business.currency) : '0'}
                    </div>
                  )}

                  {/* Rounded Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[42px] rounded-2xl transition-all duration-300 ${
                      isPeak
                        ? 'bg-emerald-600 shadow-md shadow-emerald-500/20'
                        : item.invoiced > 0
                        ? 'bg-emerald-200 group-hover:bg-emerald-300'
                        : 'bg-slate-100'
                    }`}
                  />

                  {/* Month Label */}
                  <span className="text-xs font-semibold text-[#8F9FB5] mt-3">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Pending Follow-Ups Section */}
      {todayFollowUps.length > 0 && (
        <div className="rounded-3xl bg-white border border-[#E5E9F0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0B192C]">
                  Actionable Follow-Ups ({todayFollowUps.length})
                </h3>
                <p className="text-xs text-[#5B6D85]">Follow up with prospective clients in one tap</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {todayFollowUps.map((fu) => (
              <div
                key={fu.id}
                className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E9F0] hover:border-cyan-300 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0B192C]">{fu.customer_name}</span>
                    <span className="font-mono text-xs font-bold text-[#0B192C]">
                      {formatCurrency(fu.amount, business.currency)}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6D85] mt-1 line-clamp-1">
                    {fu.title} {fu.notes ? `• ${fu.notes}` : ''}
                  </p>
                  <div className="text-[11px] text-[#8F9FB5] flex items-center gap-1.5 mt-2">
                    <Calendar className="w-3 h-3 text-cyan-600" />
                    <span>Reminder: {formatDate(fu.reminder_date)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E9F0]">
                  <button
                    onClick={() => handleSendFollowUpWhatsApp(fu)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#15803D] text-xs font-bold transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => onRescheduleFollowUp(fu)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#5B6D85] text-xs font-semibold border border-[#E5E9F0] transition"
                  >
                    Reschedule
                  </button>

                  <button
                    onClick={() => {
                      onUpdateFollowUpStatus(fu.id, 'completed');
                      if (fu.quote_id) {
                        onUpdateQuoteStatus(fu.quote_id, 'Accepted');
                        const targetQuote = quotes.find((q) => q.id === fu.quote_id);
                        if (targetQuote && confirm('Marked as WON! Would you like to convert this quote to an Invoice now?')) {
                          onConvertToInvoice(targetQuote);
                        }
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Won</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Recent Documents Showcase with Category Filter Pills */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition shadow-xs ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#0B192C] text-white'
                  : 'bg-white text-[#5B6D85] hover:text-[#0B192C] border border-[#E5E9F0]'
              }`}
            >
              All Activity
            </button>

            <button
              onClick={() => setActiveCategoryFilter('quotes')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition shadow-xs ${
                activeCategoryFilter === 'quotes'
                  ? 'bg-[#0B192C] text-white'
                  : 'bg-white text-[#5B6D85] hover:text-[#0B192C] border border-[#E5E9F0]'
              }`}
            >
              Quotes ({quotes.length})
            </button>

            <button
              onClick={() => setActiveCategoryFilter('invoices')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition shadow-xs ${
                activeCategoryFilter === 'invoices'
                  ? 'bg-[#0B192C] text-white'
                  : 'bg-white text-[#5B6D85] hover:text-[#0B192C] border border-[#E5E9F0]'
              }`}
            >
              Invoices ({invoices.length})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-white border border-[#E5E9F0] p-1 rounded-2xl shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition ${viewMode === 'grid' ? 'bg-[#0B192C] text-white' : 'text-[#5B6D85] hover:text-[#0B192C]'}`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl transition ${viewMode === 'list' ? 'bg-[#0B192C] text-white' : 'text-[#5B6D85] hover:text-[#0B192C]'}`}
              title="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Empty state */}
        {combinedDocs.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-[#E5E9F0] p-8 shadow-xs">
            <Layers className="w-10 h-10 text-[#8F9FB5] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#0B192C]">No matching documents found</h4>
            <p className="text-xs text-[#5B6D85] mt-1 max-w-sm mx-auto">
              Create your first quotation or invoice to start tracking your business deals here.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => onOpenNewQuote(false)}
                className="px-4 py-2 rounded-xl bg-[#0B192C] text-white text-xs font-bold"
              >
                Create Quotation
              </button>
              <button
                onClick={onOpenNewInvoice}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Create Invoice
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {combinedDocs.map((doc) => {
              const isQuote = doc.type === 'quote';
              const docNum = isQuote ? (doc.data as Quote).quote_number : (doc.data as Invoice).invoice_number;
              const status = doc.data.status;
              const total = doc.data.total;
              const customerName = doc.data.customer_name;

              return (
                <div
                  key={`${doc.type}_${doc.data.id}`}
                  className="p-5 rounded-3xl bg-white border border-[#E5E9F0] hover:border-blue-300 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(status)}`}>
                        {status}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#5B6D85]">
                        {docNum}
                      </span>
                    </div>

                    <h4
                      onClick={() => (isQuote ? onOpenQuote(doc.data as Quote) : onOpenInvoice(doc.data as Invoice))}
                      className="text-base font-bold text-[#0B192C] group-hover:text-[#3D74D9] cursor-pointer transition truncate"
                    >
                      {customerName}
                    </h4>

                    <p className="text-xs text-[#5B6D85] mt-1">
                      {isQuote ? 'Quotation' : 'Invoice'} • Issued {formatDate(doc.data.issue_date)}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E5E9F0] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#8F9FB5]">Amount</span>
                      <div className="font-mono text-base font-extrabold text-[#0B192C]">
                        {formatCurrency(total, business.currency)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          isQuote
                            ? handleSendQuoteWhatsApp(doc.data as Quote)
                            : handleSendInvoiceWhatsApp(doc.data as Invoice)
                        }
                        className="p-2 text-[#5B6D85] hover:text-[#25D366] rounded-xl hover:bg-emerald-50 transition"
                        title="Send via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          isQuote
                            ? generateQuotePDF(doc.data as Quote, business)
                            : generateInvoicePDF(doc.data as Invoice, business)
                        }
                        className="p-2 text-[#5B6D85] hover:text-[#0B192C] rounded-xl hover:bg-slate-100 transition"
                        title="Download PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          isQuote ? onOpenQuote(doc.data as Quote) : onOpenInvoice(doc.data as Invoice)
                        }
                        className="p-2 text-[#5B6D85] hover:text-[#3D74D9] rounded-xl hover:bg-blue-50 transition"
                        title="View / Edit Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="rounded-3xl bg-white border border-[#E5E9F0] overflow-hidden shadow-xs divide-y divide-[#E5E9F0]">
            {combinedDocs.map((doc) => {
              const isQuote = doc.type === 'quote';
              const docNum = isQuote ? (doc.data as Quote).quote_number : (doc.data as Invoice).invoice_number;
              const status = doc.data.status;
              const total = doc.data.total;
              const customerName = doc.data.customer_name;

              return (
                <div
                  key={`${doc.type}_${doc.data.id}`}
                  className="p-4 hover:bg-[#F8FAFC] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div
                    onClick={() => (isQuote ? onOpenQuote(doc.data as Quote) : onOpenInvoice(doc.data as Invoice))}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isQuote ? 'bg-cyan-50 text-cyan-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {isQuote ? <FileText className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0B192C]">{customerName}</span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#5B6D85]">
                          {docNum}
                        </span>
                      </div>
                      <span className="text-xs text-[#5B6D85]">
                        Issued {formatDate(doc.data.issue_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(status)}`}>
                      {status}
                    </span>

                    <div className="font-mono text-sm font-extrabold text-[#0B192C]">
                      {formatCurrency(total, business.currency)}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          isQuote
                            ? handleSendQuoteWhatsApp(doc.data as Quote)
                            : handleSendInvoiceWhatsApp(doc.data as Invoice)
                        }
                        className="p-1.5 text-[#5B6D85] hover:text-[#25D366] rounded-lg hover:bg-emerald-50 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          isQuote
                            ? generateQuotePDF(doc.data as Quote, business)
                            : generateInvoicePDF(doc.data as Invoice, business)
                        }
                        className="p-1.5 text-[#5B6D85] hover:text-[#0B192C] rounded-lg hover:bg-slate-100 transition"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
