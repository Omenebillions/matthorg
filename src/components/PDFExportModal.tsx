import React, { useState, useEffect } from 'react';
import { Quote, Invoice, BusinessProfile, DocumentDesignTemplate } from '../types';
import {
  X,
  FileDown,
  Printer,
  ExternalLink,
  Palette,
  Check,
  FileText,
  CreditCard,
  Eye,
  Loader2,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  generateQuotePDF,
  generateInvoicePDF,
  printQuotePDF,
  printInvoicePDF,
  getDocumentPDFBlobUrl,
} from '../utils/pdfGenerator';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'quote' | 'invoice';
  item: Quote | Invoice;
  business: BusinessProfile;
  onUpdateDesign?: (template: DocumentDesignTemplate) => void;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  documentType,
  item,
  business,
  onUpdateDesign,
}) => {
  if (!isOpen) return null;

  const isQuote = documentType === 'quote';
  const quote = isQuote ? (item as Quote) : null;
  const invoice = !isQuote ? (item as Invoice) : null;

  const docNumber = isQuote ? quote!.quote_number : invoice!.invoice_number;
  const customerName = item.customer_name || 'Client';
  const total = item.total || 0;
  const issueDate = item.issue_date;

  const [currentDesign, setCurrentDesign] = useState<DocumentDesignTemplate>(
    item.design_template || business.invoice_design || 'corporate'
  );
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Generate preview blob URL when design changes
  useEffect(() => {
    let url: string | null = null;
    try {
      setIsGenerating(true);
      const modifiedItem = { ...item, design_template: currentDesign };
      url = getDocumentPDFBlobUrl(documentType, modifiedItem, business);
      setBlobUrl(url);
    } catch (err) {
      console.error('[PDFExportModal] Error generating preview blob:', err);
    } finally {
      setIsGenerating(false);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [currentDesign, item, business, documentType]);

  const handleDesignChange = (tmpl: DocumentDesignTemplate) => {
    setCurrentDesign(tmpl);
    if (onUpdateDesign) {
      onUpdateDesign(tmpl);
    }
  };

  const handleDownload = () => {
    const modifiedItem = { ...item, design_template: currentDesign };
    if (isQuote) {
      generateQuotePDF(modifiedItem as Quote, business);
    } else {
      generateInvoicePDF(modifiedItem as Invoice, business);
    }
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handlePrint = () => {
    const modifiedItem = { ...item, design_template: currentDesign };
    if (isQuote) {
      printQuotePDF(modifiedItem as Quote, business);
    } else {
      printInvoicePDF(modifiedItem as Invoice, business);
    }
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 2500);
  };

  const handleOpenNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  const designs: { id: DocumentDesignTemplate; label: string; desc: string; color: string }[] = [
    {
      id: 'corporate',
      label: 'Corporate Executive',
      desc: 'Deep navy header banner with executive seal',
      color: 'bg-[#0B192C] text-white',
    },
    {
      id: 'modern',
      label: 'Modern Minimalist',
      desc: 'Crisp white layout with subtle accent rule',
      color: 'bg-white text-slate-800 border-slate-300',
    },
    {
      id: 'technical',
      label: 'Engineering Blueprint',
      desc: 'Technical cyan & slate grid with specification lines',
      color: 'bg-cyan-950 text-cyan-300',
    },
    {
      id: 'emerald',
      label: 'Emerald Prestige',
      desc: 'Rich forest green & gold accents for luxury service',
      color: 'bg-emerald-900 text-emerald-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E5E9F0] text-[#0B192C] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E9F0] bg-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                isQuote ? 'bg-cyan-50 text-cyan-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {isQuote ? <FileText className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#0B192C]">
                  {isQuote ? 'Export & Print Quotation' : 'Export & Print Invoice'}
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-[#5B6D85] border border-[#E5E9F0]">
                  {docNumber}
                </span>
              </div>
              <p className="text-xs text-[#5B6D85]">
                Generate high-resolution A4 PDF document for download or immediate printing.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-[#0B192C] hover:bg-slate-100 transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* Document Summary Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E9F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#8F9FB5]">Billed Client</span>
                <div className="text-sm font-bold text-[#0B192C] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customerName}</span>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block" />

              <div>
                <span className="text-[10px] font-bold uppercase text-[#8F9FB5]">Issue Date</span>
                <div className="text-sm font-bold text-[#0B192C] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(issueDate)}</span>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block" />

              <div>
                <span className="text-[10px] font-bold uppercase text-[#8F9FB5]">Items</span>
                <div className="text-sm font-bold text-[#0B192C]">{item.items?.length || 0} line item(s)</div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-[#8F9FB5]">Total Amount</span>
              <div className="text-xl font-extrabold font-mono text-emerald-600">
                {formatCurrency(total, business.currency)}
              </div>
            </div>
          </div>

          {/* Design Template Picker */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-cyan-600" />
                <span>Select PDF Design Template:</span>
              </label>
              <span className="text-[11px] text-[#5B6D85]">Live updates on print and download</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {designs.map((d) => {
                const isSelected = currentDesign === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDesignChange(d.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0B192C] bg-white ring-2 ring-[#0B192C]/10 shadow-sm'
                        : 'border-[#E5E9F0] bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#0B192C]">{d.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-[#5B6D85] leading-relaxed">{d.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded-full ${d.color.split(' ')[0]}`} />
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">{d.id}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Embed */}
          <div className="bg-white rounded-2xl border border-[#E5E9F0] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-600" />
                <span>Document PDF Preview</span>
              </span>
              <button
                onClick={handleOpenNewTab}
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                title="Open PDF in new tab"
              >
                <span>Fullscreen Preview</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-full h-80 sm:h-96 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                  <span>Rendering PDF document...</span>
                </div>
              ) : blobUrl ? (
                <iframe
                  src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  title="PDF Preview"
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="text-xs text-slate-400">PDF preview unavailable</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E5E9F0] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5B6D85] hover:text-[#0B192C] border border-[#CBD5E1] hover:bg-slate-50 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Browser</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#5B6D85] hover:text-[#0B192C] transition"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95"
            >
              {printSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Printer className="w-4 h-4 text-slate-600" />}
              <span>{printSuccess ? 'Opening Print Dialog...' : 'Print Document'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0B192C] hover:bg-[#152744] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#0B192C]/20 transition active:scale-95"
            >
              {downloadSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <FileDown className="w-4 h-4" />}
              <span>{downloadSuccess ? 'Downloaded!' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
