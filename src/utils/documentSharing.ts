import { Invoice, BusinessProfile, Quote } from '../types';
import { uploadPdfToR2 } from '../lib/storage';
import { buildWhatsAppLink, createInvoiceWhatsAppText, createQuoteWhatsAppText, formatCurrency, formatDate } from './formatters';
import { createInvoicePDF, createQuotePDF } from './pdfGenerator';

async function sharePdfFileOrLink(
  blob: Blob,
  fileName: string,
  recipient: string,
  message: string
): Promise<void> {
  const file = new File([blob], fileName, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text: message });
    return;
  }

  const publicUrl = await uploadPdfToR2(blob, fileName);
  window.open(buildWhatsAppLink(recipient, `${message}\n\n📎 *Download PDF:* ${publicUrl}`), '_blank');
}

export async function shareQuotePdfViaWhatsApp(quote: Quote, business: BusinessProfile): Promise<void> {
  const fileName = `${quote.quote_number}_${quote.customer_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const message = createQuoteWhatsAppText(
    quote.customer_name,
    business.business_name,
    quote.quote_number,
    formatCurrency(quote.total, business.currency),
    quote.notes ? quote.notes.substring(0, 100) : undefined
  );
  await sharePdfFileOrLink(createQuotePDF(quote, business), fileName, quote.customer_whatsapp || quote.customer_phone, message);
}

export async function shareInvoicePdfViaWhatsApp(invoice: Invoice, business: BusinessProfile): Promise<void> {
  const balance = Math.max(0, invoice.total - (invoice.amount_paid || 0));
  const fileName = `${invoice.invoice_number}_${invoice.customer_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const message = createInvoiceWhatsAppText(
    invoice.customer_name,
    business.business_name,
    invoice.invoice_number,
    formatCurrency(balance > 0 ? balance : invoice.total, business.currency),
    formatDate(invoice.due_date),
    invoice.payment_details
  );
  await sharePdfFileOrLink(createInvoicePDF(invoice, business), fileName, invoice.customer_whatsapp || invoice.customer_phone, message);
}