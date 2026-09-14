export function formatCurrency(amount: number, currency = '₦'): string {
  if (isNaN(amount)) return `${currency}0`;
  return `${currency}${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function generateDocNumber(prefix: 'MAT-Q' | 'MAT-INV', existingListLength: number): string {
  const base = 125 + existingListLength;
  const padded = String(base).padStart(6, '0');
  return `${prefix}-${padded}`;
}

export function cleanPhoneNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('0')) {
    // Convert e.g. 0803... to 234803... if in Nigeria, or keep standard international
    cleaned = '234' + cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  if (!cleanPhone) {
    // If no phone, just open WhatsApp web/app with pre-filled text
    return `https://wa.me/?text=${encodedMsg}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

export function createQuoteWhatsAppText(
  customerName: string,
  businessName: string,
  quoteNumber: string,
  totalFormatted: string,
  summaryNotes?: string,
  documentUrl?: string
): string {
  return `Hello ${customerName},

Please find your quotation from *${businessName}*.

📄 *Quote #${quoteNumber}*
💰 *Total: ${totalFormatted}*
${summaryNotes ? `\n_${summaryNotes}_\n` : ''}
Please let us know if you would like to proceed or require any adjustments.
${documentUrl ? `\n📎 *Download PDF:* ${documentUrl}` : ''}

Thank you for your business!`;
}

export function createInvoiceWhatsAppText(
  customerName: string,
  businessName: string,
  invoiceNumber: string,
  totalFormatted: string,
  dueDate: string,
  paymentDetails?: string,
  documentUrl?: string
): string {
  return `Hello ${customerName},

Please find your invoice from *${businessName}*.

📑 *Invoice #${invoiceNumber}*
💵 *Amount Due: ${totalFormatted}*
📅 *Due Date: ${dueDate}*
${paymentDetails ? `\n*Payment Details:*\n${paymentDetails}\n` : ''}
${documentUrl ? `\n📎 *Download PDF:* ${documentUrl}\n` : ''}
Thank you for your prompt payment!`;
}

export function createFollowUpWhatsAppText(
  customerName: string,
  businessName: string,
  quoteNumber: string,
  title: string,
  totalFormatted: string
): string {
  return `Hi ${customerName},

I'm following up on the quotation we sent from *${businessName}* for:
*${title}* (${quoteNumber} — ${totalFormatted}).

Have you had a chance to review it? Let me know if you have questions or would like to lock in your order!`;
}
