import React, { useState, useEffect } from 'react';
import {
  Quote,
  QuoteItem,
  Customer,
  Product,
  QuoteTemplate,
  BusinessProfile,
  QuoteStatus,
  AppState,
} from '../types';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  FileDown,
  MessageCircle,
  Calendar,
  Layers,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Check,
  RotateCcw,
  Clock,
  Send,
  Building,
  Eye,
  Bookmark,
} from 'lucide-react';
import { formatCurrency, formatDate, buildWhatsAppLink, createQuoteWhatsAppText, generateDocNumber } from '../utils/formatters';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { WhiteDocumentSheet } from './WhiteDocumentSheet';

interface QuoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote?: Quote | null; // null if creating new
  state: AppState;
  onSaveQuote: (quote: Quote) => void;
  onConvertToInvoice: (quote: Quote) => void;
  onOpenFollowUpModal: (quote: Quote) => void;
  onSaveNewCustomer?: (customer: Customer) => void;
  onSaveProduct?: (product: Product) => void;
  onIncrementAICount?: () => void;
  initialAIPromptOpen?: boolean;
}

export const QuoteEditorModal: React.FC<QuoteEditorModalProps> = ({
  isOpen,
  onClose,
  quote,
  state,
  onSaveQuote,
  onConvertToInvoice,
  onOpenFollowUpModal,
  onSaveNewCustomer,
  onSaveProduct,
  onIncrementAICount,
  initialAIPromptOpen = false,
}) => {
  if (!isOpen) return null;

  const isEditing = !!quote;
  const business = state.business;

  // Form states
  const [quoteNumber, setQuoteNumber] = useState(
    quote?.quote_number || generateDocNumber('MAT-Q', state.quotes.length)
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState(quote?.customer_id || '');
  const [customerName, setCustomerName] = useState(quote?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(quote?.customer_phone || '');
  const [customerWhatsapp, setCustomerWhatsapp] = useState(quote?.customer_whatsapp || '');
  const [customerEmail, setCustomerEmail] = useState(quote?.customer_email || '');
  const [customerAddress, setCustomerAddress] = useState(quote?.customer_address || '');
  const [saveCustomerPrompt, setSaveCustomerPrompt] = useState(false);
  const [savedCatalogueMap, setSavedCatalogueMap] = useState<Record<string, boolean>>({});

  const [status, setStatus] = useState<QuoteStatus>(quote?.status || 'Draft');
  const [issueDate, setIssueDate] = useState(
    quote?.issue_date || new Date().toISOString().split('T')[0]
  );
  const [expiryDate, setExpiryDate] = useState(() => {
    if (quote?.expiry_date) return quote.expiry_date;
    const d = new Date();
    d.setDate(d.getDate() + 14); // default 14 days
    return d.toISOString().split('T')[0];
  });

  const [items, setItems] = useState<QuoteItem[]>(() => {
    if (quote?.items && quote.items.length > 0) return [...quote.items];
    // Default empty single item
    return [
      {
        id: 'item_' + Date.now(),
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        unit: 'unit',
        total: 0,
      },
    ];
  });

  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(quote?.discount_type || 'percent');
  const [discountVal, setDiscountVal] = useState<number>(quote?.discount_val || 0);
  const [taxRate, setTaxRate] = useState<number>(quote?.tax_rate ?? business.tax_rate);
  const [notes, setNotes] = useState(quote?.notes || '');
  const [terms, setTerms] = useState(quote?.terms || business.terms);

  // AI Assistant states
  const [showAIAssistant, setShowAIAssistant] = useState(initialAIPromptOpen);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAssumptions, setAiAssumptions] = useState<string[]>([]);

  // Feedback states
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<'editor' | 'whiteSheet'>('editor');

  // Handle customer selection change
  const handleSelectCustomer = (cId: string) => {
    setSelectedCustomerId(cId);
    if (!cId) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerWhatsapp('');
      setCustomerEmail('');
      setCustomerAddress('');
      setSaveCustomerPrompt(false);
      return;
    }
    const cust = state.customers.find((c) => c.id === cId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone);
      setCustomerWhatsapp(cust.whatsapp);
      setCustomerEmail(cust.email);
      setCustomerAddress(cust.address);
      setSaveCustomerPrompt(false);
    }
  };

  // Handle template selection
  const handleApplyTemplate = (tmplId: string) => {
    if (!tmplId) return;
    const tmpl = state.templates.find((t) => t.id === tmplId);
    if (!tmpl) return;

    const newItems: QuoteItem[] = tmpl.items.map((it, idx) => ({
      id: 'tmpl_item_' + Date.now() + '_' + idx,
      product_id: it.product_id,
      name: it.name,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      unit: it.unit || 'unit',
      total: it.quantity * it.unit_price,
      isCatalogueMatch: true,
    }));

    setItems(newItems);
    if (!notes && tmpl.description) {
      setNotes(`Package: ${tmpl.name} - ${tmpl.description}`);
    }
  };

  // Item row manipulations
  const handleAddItem = (product?: Product) => {
    const newItem: QuoteItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      product_id: product?.id,
      name: product?.name || '',
      description: product?.description || '',
      quantity: 1,
      unit_price: product ? product.default_price : 0,
      unit: product?.unit || 'unit',
      total: product ? product.default_price : 0,
      isCatalogueMatch: !!product,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          const q = field === 'quantity' ? Number(value) : it.quantity;
          const p = field === 'unit_price' ? Number(value) : it.unit_price;
          updated.total = (isNaN(q) ? 0 : q) * (isNaN(p) ? 0 : p);
        }
        return updated;
      })
    );
  };

  const handleSelectItemFromCatalogue = (id: string, productId: string) => {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return {
          ...it,
          product_id: prod.id,
          name: prod.name,
          description: prod.description,
          unit: prod.unit,
          unit_price: prod.default_price,
          total: it.quantity * prod.default_price,
          isCatalogueMatch: true,
        };
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      // Clear instead of removing last row
      setItems([
        {
          id: 'item_' + Date.now(),
          name: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          unit: 'unit',
          total: 0,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSaveItemToCatalogue = (item: QuoteItem) => {
    if (!item.name.trim()) return;
    const newProduct: Product = {
      id: item.product_id || 'prod_' + Date.now(),
      name: item.name.trim(),
      description: item.description || '',
      default_price: item.unit_price || 0,
      unit: item.unit || 'unit',
      category: 'General',
    };
    if (onSaveProduct) {
      onSaveProduct(newProduct);
    }
    setSavedCatalogueMap((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setSavedCatalogueMap((prev) => ({ ...prev, [item.id]: false }));
    }, 2500);
  };

  // Math calculations
  const subtotal = items.reduce((acc, it) => acc + (it.total || 0), 0);
  const discountAmount =
    discountType === 'percent'
      ? (subtotal * (discountVal || 0)) / 100
      : Math.min(discountVal || 0, subtotal);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (taxRate || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount;

  // AI Generator function
  const handleGenerateAIDraft = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Please describe the customer request first.');
      return;
    }

    setIsAILoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/draft-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          catalogue: state.products,
          currency: business.currency,
          plan: state.user.plan,
          usedCount: state.aiUsage.count,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate AI draft');
      }

      const { data } = json;

      if (data.items && Array.isArray(data.items)) {
        const generatedItems: QuoteItem[] = data.items.map((it: any, i: number) => {
          // Check if catalogue match
          const catalogueMatch = state.products.find(
            (p) => p.name.toLowerCase() === (it.name || '').toLowerCase()
          );

          const finalPrice = catalogueMatch ? catalogueMatch.default_price : (it.unit_price || 0);

          return {
            id: 'ai_item_' + Date.now() + '_' + i,
            product_id: catalogueMatch?.id,
            name: it.name || 'Recommended item',
            description: it.description || '',
            quantity: it.quantity || 1,
            unit_price: finalPrice,
            unit: catalogueMatch?.unit || 'unit',
            total: (it.quantity || 1) * finalPrice,
            isCatalogueMatch: !!catalogueMatch,
          };
        });

        setItems(generatedItems);
      }

      if (data.notes) {
        setNotes((prev) => (prev ? `${prev}\n\nAI Draft Notes: ${data.notes}` : data.notes));
      }

      if (data.assumptions && Array.isArray(data.assumptions)) {
        setAiAssumptions(data.assumptions);
      }

      if (onIncrementAICount) {
        onIncrementAICount();
      }

      // Close AI drawer and focus on review
      setShowAIAssistant(false);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Error communicating with AI service');
    } finally {
      setIsAILoading(false);
    }
  };

  // Compile full quote object
  const buildCurrentQuote = (): Quote => {
    return {
      id: quote?.id || 'quote_' + Date.now(),
      quote_number: quoteNumber,
      customer_id: selectedCustomerId || 'cust_temp_' + Date.now(),
      customer_name: customerName || 'Valued Customer',
      customer_phone: customerPhone,
      customer_whatsapp: customerWhatsapp || customerPhone,
      customer_email: customerEmail,
      customer_address: customerAddress,
      status,
      issue_date: issueDate,
      expiry_date: expiryDate,
      items,
      subtotal,
      discount_type: discountType,
      discount_val: discountVal,
      discount_amount: discountAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total: grandTotal,
      notes,
      terms,
      follow_up_id: quote?.follow_up_id,
      converted_invoice_id: quote?.converted_invoice_id,
      created_at: quote?.created_at || new Date().toISOString(),
    };
  };

  const handleSave = (newStatus?: QuoteStatus) => {
    if (saveCustomerPrompt && customerName && onSaveNewCustomer) {
      const newCust: Customer = {
        id: 'cust_' + Date.now(),
        name: customerName,
        phone: customerPhone,
        whatsapp: customerWhatsapp || customerPhone,
        email: customerEmail,
        address: customerAddress,
        notes: `Created from quote ${quoteNumber}`,
        created_at: new Date().toISOString(),
      };
      onSaveNewCustomer(newCust);
      setSelectedCustomerId(newCust.id);
      setSaveCustomerPrompt(false);
    }

    const compiled = buildCurrentQuote();
    if (newStatus) compiled.status = newStatus;
    onSaveQuote(compiled);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleWhatsAppShare = () => {
    const compiled = buildCurrentQuote();
    onSaveQuote(compiled);
    const msg = createQuoteWhatsAppText(
      compiled.customer_name,
      business.business_name,
      compiled.quote_number,
      formatCurrency(compiled.total, business.currency),
      compiled.notes ? compiled.notes.substring(0, 100) : undefined
    );
    const link = buildWhatsAppLink(compiled.customer_whatsapp || compiled.customer_phone, msg);
    window.open(link, '_blank');
  };

  const handleDownloadPDF = () => {
    const compiled = buildCurrentQuote();
    generateQuotePDF(compiled, business);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-2xl bg-white border border-[#E5E9F0] shadow-2xl text-[#0B192C] my-4 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E9F0] bg-white rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-[#0B192C]/20 text-[#5B6D85] border border-[#0B192C]/30">
              {quoteNumber}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5B6D85]">Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                className="bg-[#F4F7FB] border border-[#E5E9F0] rounded-lg text-xs font-semibold px-2.5 py-1 text-[#0B192C] focus:outline-none focus:border-[#0B192C]"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Awaiting Response">Awaiting Response</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Preview / Form Editor Toggle */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setModalViewMode('editor')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  modalViewMode === 'editor'
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0B192C]'
                }`}
              >
                ✏️ Form Editor
              </button>
              <button
                type="button"
                onClick={() => setModalViewMode('whiteSheet')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  modalViewMode === 'whiteSheet'
                    ? 'bg-white text-[#0B192C] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B192C]'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-cyan-600" />
                <span>Live Preview</span>
              </button>
            </div>

            <div className="hidden sm:block text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500">Grand Total</div>
              <div className="text-base font-extrabold text-[#0B192C]">
                {formatCurrency(grandTotal, business.currency)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B192C] hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {modalViewMode === 'whiteSheet' ? (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center items-start">
            <WhiteDocumentSheet
              documentType="quote"
              quote={buildCurrentQuote()}
              business={business}
              onSendWhatsApp={handleWhatsAppShare}
              onDownloadPDF={handleDownloadPDF}
              onUpdateQuantity={(itemId, qty) => handleUpdateItem(itemId, 'quantity', qty)}
            />
          </div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* Quick Helper / Template & AI Assist Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Use Saved Template:</span>
              <select
                onChange={(e) => handleApplyTemplate(e.target.value)}
                defaultValue=""
                className="bg-white border border-slate-300 rounded-lg text-xs text-[#0B192C] px-2.5 py-1.5 focus:border-[#0B192C] focus:outline-none"
              >
                <option value="" disabled>
                  Select a template...
                </option>
                {state.templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} ({tmpl.items.length} items)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 px-3 py-1.5 text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>{showAIAssistant ? 'Hide AI Assistant' : '✨ AI Quote Assistant'}</span>
            </button>
          </div>

          {/* AI Quote Assistant Banner / Drawer */}
          {showAIAssistant && (
            <div className="rounded-2xl border border-cyan-200 bg-gradient-to-b from-cyan-50/50 to-white p-4 sm:p-5 shadow-sm animate-in fade-in">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B192C]">✨ Describe what the customer needs</h3>
                    <p className="text-[11px] text-slate-600">
                      Mathorg AI matches your saved catalogue products and generates an editable draft.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                  AI generations: {state.aiUsage.count} / {state.user.plan === 'free' ? 3 : state.user.plan === 'pro' ? 50 : 200}
                </span>
              </div>

              <div className="space-y-3 mt-3">
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Example: Customer needs a solar system for a three-bedroom house. It should power a fridge, freezer, two TVs, five fans, lights, Wi-Fi router..."
                  className="w-full rounded-xl bg-white border border-slate-300 p-3 text-xs text-[#0B192C] placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
                />

                {aiError && (
                  <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{aiError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>AI-generated suggestions are drafts and must be reviewed before sending.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAIDraft}
                    disabled={isAILoading || !aiPrompt.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0B192C] px-4 py-2 text-xs font-bold text-white hover:bg-[#152744] disabled:opacity-50 transition active:scale-95 shadow-sm ml-auto"
                  >
                    {isAILoading ? (
                      <>
                        <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Building draft from catalogue...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Assumptions notification if present */}
          {aiAssumptions.length > 0 && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
              <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-600" /> AI Draft Assumptions:
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-600">
                {aiAssumptions.map((assump, idx) => (
                  <li key={idx}>{assump}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section: Customer & Quote Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Customer Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0B192C]">Customer Information *</label>
                {state.customers.length > 0 && (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg text-[11px] text-slate-700 px-2 py-1 focus:outline-none focus:border-[#0B192C]"
                  >
                    <option value="">-- Choose Existing Customer --</option>
                    {state.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.whatsapp || c.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (!selectedCustomerId && e.target.value.length > 2) {
                      setSaveCustomerPrompt(true);
                    }
                  }}
                  placeholder="Customer Full Name *"
                  className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-xs text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customerWhatsapp}
                  onChange={(e) => setCustomerWhatsapp(e.target.value)}
                  placeholder="WhatsApp Number *"
                  className="rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Customer Email"
                  className="rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Delivery / Installation Address"
                  className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              {saveCustomerPrompt && !selectedCustomerId && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-xs text-cyan-900">
                  <input
                    type="checkbox"
                    id="save_cust_check"
                    checked={saveCustomerPrompt}
                    onChange={(e) => setSaveCustomerPrompt(e.target.checked)}
                    className="rounded border-slate-300 text-[#0B192C] focus:ring-[#0B192C]"
                  />
                  <label htmlFor="save_cust_check" className="cursor-pointer text-[11px]">
                    Save <strong>{customerName}</strong> to your customer database for future quotes
                  </label>
                </div>
              )}
            </div>

            {/* Dates & Document Meta */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#0B192C]">Dates & Validity</label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-slate-600 mb-1 font-medium">Quote Date</span>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-600 mb-1 font-medium">Expiry Date (Valid Until)</span>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <span className="block text-[11px] text-slate-600 mb-1 font-medium">Quick Add from Catalogue</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                  {state.products.slice(0, 8).map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddItem(prod)}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 transition font-medium"
                    >
                      <Plus className="w-3 h-3 text-[#0B192C]" />
                      <span>{prod.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Products & Services Items ({items.length})
              </h4>
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B192C] hover:text-cyan-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Item Name */}
                    <div className="col-span-12 sm:col-span-5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-slate-500 w-4">{index + 1}.</span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          placeholder="Item name or service *"
                          className="flex-1 rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Quantity & Unit */}
                    <div className="col-span-5 sm:col-span-2 flex gap-1">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Qty"
                        className="w-14 rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-xs text-center text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={item.unit || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                        placeholder="unit"
                        className="w-16 rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-xs text-center text-slate-700 focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-5 sm:col-span-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">
                          {business.currency}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit_price}
                          onChange={(e) => handleUpdateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full rounded-lg bg-white border border-slate-300 pl-7 pr-2.5 py-1.5 text-xs text-right text-[#0B192C] focus:border-[#0B192C] focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Item Total & Delete */}
                    <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-2">
                      <span className="text-xs font-bold text-[#0B192C] font-mono">
                        {formatCurrency(item.total, business.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description / Spec & Save to Catalogue Action */}
                  <div className="pl-6 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      placeholder="Optional technical specification or warranty note"
                      className="flex-1 min-w-[200px] rounded-lg bg-white border border-slate-300 px-2.5 py-1 text-[11px] text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => handleSaveItemToCatalogue(item)}
                      disabled={!item.name.trim()}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                        savedCatalogueMap[item.id]
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-slate-700 hover:text-[#0B192C] border-slate-300 hover:bg-slate-100 disabled:opacity-40'
                      }`}
                      title="Save this item to product catalogue for future quotes and invoices"
                    >
                      {savedCatalogueMap[item.id] ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Saved to Catalogue</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Save to Catalogue</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Financial Summary / Math */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Notes & Terms */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Notes / Scope</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="System power rating, battery autonomy, delivery schedule..."
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-[#0B192C] focus:border-[#0B192C] focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Calculations Box */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono text-[#0B192C] font-semibold">
                  {formatCurrency(subtotal, business.currency)}
                </span>
              </div>

              {/* Discount control */}
              <div className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">Discount:</span>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                    className="bg-slate-50 border border-slate-300 rounded text-[11px] px-1.5 py-0.5 text-slate-700"
                  >
                    <option value="percent">% Off</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-right text-[#0B192C] font-mono"
                  />
                  <span className="font-mono text-rose-600 font-semibold w-24 text-right">
                    -{formatCurrency(discountAmount, business.currency)}
                  </span>
                </div>
              </div>

              {/* Tax / VAT control */}
              <div className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">{business.tax_name || 'VAT'} (%):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-14 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-right text-[#0B192C] font-mono"
                  />
                </div>
                <span className="font-mono text-slate-700 font-semibold">
                  +{formatCurrency(taxAmount, business.currency)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Grand Total</span>
                <span className="text-xl font-extrabold text-[#0B192C] font-mono">
                  {formatCurrency(grandTotal, business.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Modal Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 bg-white rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalViewMode(modalViewMode === 'whiteSheet' ? 'editor' : 'whiteSheet')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 hover:bg-cyan-100 transition"
              title="Toggle Live Document Preview"
            >
              <Eye className="w-4 h-4 text-cyan-700" />
              <span>{modalViewMode === 'whiteSheet' ? 'Edit Form' : 'Preview Quote'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
              title="Download clean PDF quotation"
            >
              <FileDown className="w-4 h-4 text-[#0B192C]" />
              <span>Generate PDF</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-2 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/20 transition"
              title="Send via WhatsApp deep link"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const compiled = buildCurrentQuote();
                onSaveQuote(compiled);
                onOpenFollowUpModal(compiled);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
              title="Schedule a follow-up reminder"
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Set Follow-Up</span>
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  const compiled = buildCurrentQuote();
                  compiled.status = 'Accepted';
                  onSaveQuote(compiled);
                  onConvertToInvoice(compiled);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                title="Convert this quote to an official invoice"
              >
                <ArrowRight className="w-4 h-4 text-emerald-700" />
                <span>Convert to Invoice</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-[#0B192C] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#0B192C]/20 transition active:scale-95"
            >
              {isSavedNotice ? <Check className="w-4 h-4" /> : null}
              <span>{isSavedNotice ? 'Saved!' : 'Save Quote'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
