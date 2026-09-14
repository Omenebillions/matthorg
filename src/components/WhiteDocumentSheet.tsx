import React, { useState } from 'react';
import { Quote, Invoice, BusinessProfile, QuoteItem, InvoiceItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  FileText,
  MapPin,
  Phone,
  MessageCircle,
  Tag,
  CreditCard,
  Building2,
  Download,
  Share2,
  CheckCircle2,
  Minus,
  Plus,
  ChevronRight,
  Sparkles,
  Printer,
  X,
  Package,
} from 'lucide-react';
import { ASSETS } from '../assets/images';

interface WhiteDocumentSheetProps {
  documentType: 'quote' | 'invoice';
  quote?: Quote | null;
  invoice?: Invoice | null;
  business: BusinessProfile;
  onClose?: () => void;
  onSendWhatsApp?: () => void;
  onDownloadPDF?: () => void;
  onUpdateQuantity?: (itemId: string, newQty: number) => void;
}

export function WhiteDocumentSheet({
  documentType,
  quote,
  invoice,
  business,
  onClose,
  onSendWhatsApp,
  onDownloadPDF,
  onUpdateQuantity,
}: WhiteDocumentSheetProps) {
  const [orderMode, setOrderMode] = useState<'deliver' | 'pickup'>('deliver');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank' | 'cash' | 'card'>('bank');

  // Unified accessor
  const docNumber = quote?.quote_number || invoice?.invoice_number || 'DOC-001';
  const customerName = quote?.customer_name || invoice?.customer_name || 'Valued Customer';
  const customerAddress =
    quote?.customer_address || invoice?.customer_address || '18 Admiralty Way, Lekki Phase 1, Lagos';
  const customerPhone = quote?.customer_whatsapp || quote?.customer_phone || invoice?.customer_phone || '';
  const issueDate = quote?.issue_date || invoice?.issue_date || new Date().toISOString();
  const rawItems = (quote?.items || invoice?.items || []) as (QuoteItem | InvoiceItem)[];

  const subtotal = quote?.subtotal ?? invoice?.subtotal ?? 0;
  const discountAmount = quote?.discount_amount ?? invoice?.discount_amount ?? 0;
  const taxAmount = quote?.tax_amount ?? invoice?.tax_amount ?? 0;
  const total = quote?.total ?? invoice?.total ?? 0;

  // Image resolver for line items
  const getItemImage = (item: QuoteItem | InvoiceItem, idx: number) => {
    if (item.image) return item.image;
    const fallbacks = [ASSETS.salesDev, ASSETS.salesPackage, ASSETS.salesConsulting];
    return fallbacks[idx % fallbacks.length];
  };

  return (
    <div
      id="white_document_sheet_container"
      className="w-full max-w-md mx-auto bg-white text-[#0B192C] rounded-[32px] shadow-2xl border border-[#E5E9F0] overflow-hidden flex flex-col font-sans"
    >
      {/* Top Navigation Bar */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#E5E9F0]">
        <div className="flex items-center gap-2.5">
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F4F7FB] text-[#5B6D85] flex items-center justify-center hover:bg-[#E5E9F0] transition"
              aria-label="Back"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-lg font-extrabold tracking-tight text-[#0B192C]">
            {documentType === 'quote' ? 'Quotation Order' : 'Tax Invoice'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#3D74D9]/10 text-[#3D74D9] border border-[#3D74D9]/20">
            {docNumber}
          </span>
          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              className="p-1.5 rounded-full text-[#5B6D85] hover:text-[#0B192C] hover:bg-[#F4F7FB] transition"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sheet Content Area */}
      <div className="p-6 overflow-y-auto space-y-5 flex-1 max-h-[75vh]">
        {/* Segmented Delivery / Pick Up or Quotation / Tax Invoice Toggle */}
        <div className="p-1 rounded-2xl bg-[#F4F7FB] flex items-center gap-1 border border-[#E5E9F0]">
          <button
            type="button"
            onClick={() => setOrderMode('deliver')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              orderMode === 'deliver'
                ? 'bg-[#0B192C] text-white shadow-sm'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            {documentType === 'quote' ? 'Standard Delivery' : 'Deliver'}
          </button>
          <button
            type="button"
            onClick={() => setOrderMode('pickup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              orderMode === 'pickup'
                ? 'bg-[#0B192C] text-white shadow-sm'
                : 'text-[#5B6D85] hover:text-[#0B192C]'
            }`}
          >
            {documentType === 'quote' ? 'Direct Installation' : 'Pick Up'}
          </button>
        </div>

        {/* Customer & Delivery Address Block */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-tight text-[#0B192C]">Delivery Address</span>
            <span className="text-[10px] text-[#5B6D85] font-mono">{formatDate(issueDate)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E5E9F0] space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#3D74D9]/10 flex items-center justify-center text-[#3D74D9] shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#0B192C] truncate">{customerName}</div>
                <div className="text-[11px] text-[#5B6D85] leading-snug">{customerAddress}</div>
                {customerPhone && (
                  <div className="text-[10px] text-[#3D74D9] font-mono mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {customerPhone}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-[#E5E9F0]">
              <span className="px-2 py-0.5 text-[10px] font-semibold text-[#3D74D9] bg-[#3D74D9]/10 rounded-lg border border-[#3D74D9]/20">
                Verified Client
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold text-[#5B6D85] bg-white rounded-lg border border-[#E5E9F0]">
                {business.business_name}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B192C]">Items in {documentType === 'quote' ? 'Quotation' : 'Order'}</span>
            <span className="text-[11px] font-semibold text-[#3D74D9]">{rawItems.length} item(s)</span>
          </div>

          {rawItems.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#E5E9F0] text-center text-xs text-[#5B6D85]">
              No line items added yet. Add products to populate order summary.
            </div>
          ) : (
            <div className="space-y-2">
              {rawItems.map((item, idx) => {
                const img = getItemImage(item, idx);
                return (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E5E9F0] flex items-center justify-between gap-3 hover:border-[#3D74D9]/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 border border-[#E5E9F0] relative shadow-xs">
                        <img
                          src={img}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#0B192C] truncate">{item.name}</h4>
                        <p className="text-[10px] text-[#5B6D85] truncate">
                          {item.description || item.unit || 'Standard unit'}
                        </p>
                        <div className="text-xs font-mono font-black text-[#0B192C] mt-0.5">
                          {formatCurrency(item.unit_price, business.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Stepper Control: - 1 + */}
                    <div className="flex items-center gap-2 shrink-0 bg-white border border-[#E5E9F0] px-2 py-1 rounded-xl shadow-xs">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={!onUpdateQuantity}
                        className="text-[#5B6D85] hover:text-[#0B192C] disabled:opacity-40 p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs font-bold text-[#0B192C] w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={!onUpdateQuantity}
                        className="text-[#5B6D85] hover:text-[#0B192C] disabled:opacity-40 p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 1 Discount is Applied Banner */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E9F0] flex items-center justify-between hover:border-[#0B192C] transition cursor-pointer shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#3D74D9]/10 text-[#3D74D9] flex items-center justify-center">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B192C]">
                {discountAmount > 0 ? '1 Discount is Applied' : 'Promotional & Volume Pricing'}
              </div>
              <div className="text-[10px] text-[#5B6D85]">
                {discountAmount > 0
                  ? `Saved ${formatCurrency(discountAmount, business.currency)} on this order`
                  : 'Early settlement terms & tiered volume discount available'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#5B6D85]" />
        </div>

        {/* Payment Summary */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E9F0] space-y-2.5">
          <div className="text-xs font-bold text-[#0B192C]">Payment Summary</div>

          <div className="flex justify-between text-xs text-[#5B6D85]">
            <span>Price Subtotal</span>
            <span className="font-mono font-medium text-[#0B192C]">
              {formatCurrency(subtotal, business.currency)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-700">
              <span>Applied Discount</span>
              <span className="font-mono font-bold">
                -{formatCurrency(discountAmount, business.currency)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-xs text-[#5B6D85]">
            <span>{business.tax_name || 'VAT'} ({quote?.tax_rate ?? invoice?.tax_rate ?? business.tax_rate}%)</span>
            <span className="font-mono font-medium text-[#0B192C]">
              +{formatCurrency(taxAmount, business.currency)}
            </span>
          </div>

          <div className="pt-2 border-t border-[#E5E9F0] flex justify-between items-baseline">
            <span className="text-xs font-extrabold uppercase tracking-wide text-[#0B192C]">Grand Total</span>
            <span className="text-base font-black font-mono text-[#0B192C]">
              {formatCurrency(total, business.currency)}
            </span>
          </div>
        </div>

        {/* Payment Method / Bank Details */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E9F0] space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#3D74D9]/10 text-[#3D74D9] flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0B192C]">
                  {business.payment_details?.bank_name || 'Bank Transfer / Cash'}
                </div>
                <div className="text-[10px] text-[#5B6D85] font-mono">
                  {business.payment_details?.account_number
                    ? `Acct: ${business.payment_details.account_number} • ${business.payment_details.account_name}`
                    : 'Direct payment instructions available'}
                </div>
              </div>
            </div>
            <span className="text-xs font-black font-mono text-[#0B192C]">
              {formatCurrency(total, business.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="p-5 pt-3 bg-white border-t border-[#E5E9F0]">
        <button
          type="button"
          onClick={onSendWhatsApp}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#0B192C] hover:bg-[#152744] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <span>{documentType === 'quote' ? 'Send Quotation on WhatsApp' : 'Send Invoice via WhatsApp'}</span>
        </button>
      </div>
    </div>
  );
}
