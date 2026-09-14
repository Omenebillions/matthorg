import { jsPDF } from 'jspdf';
import { BusinessProfile, Quote, Invoice } from '../types';
import { formatCurrency, formatDate } from './formatters';

export function createQuotePDF(quote: Quote, business: BusinessProfile): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  let y = margin;

  // Header Background bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Business Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(business.business_name || 'Business Name', margin, 14);

  // Subtitle / Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('OFFICIAL PRICE QUOTATION', margin, 21);

  // Document Badge on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text('QUOTATION', pageWidth - margin, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(quote.quote_number, pageWidth - margin, 21, { align: 'right' });

  y = 36;

  // Two columns: Business Info (Left) & Document Meta (Right)
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(8.5);

  // Left: From
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('FROM:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(business.business_name, margin, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  if (business.address) {
    const addrLines = doc.splitTextToSize(business.address, 80);
    doc.text(addrLines, margin, y);
    y += addrLines.length * 4;
  }
  if (business.phone) {
    doc.text(`Phone: ${business.phone}`, margin, y);
    y += 4;
  }
  if (business.email) {
    doc.text(`Email: ${business.email}`, margin, y);
    y += 4;
  }
  if (business.whatsapp) {
    doc.text(`WhatsApp: ${business.whatsapp}`, margin, y);
    y += 4;
  }

  // Right column: Quote Meta details
  let metaY = 36;
  const metaX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DETAILS:', metaX - 50, metaY);
  metaY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Date of Issue:', metaX - 50, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(quote.issue_date), metaX, metaY, { align: 'right' });
  metaY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Valid Until:', metaX - 50, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(quote.expiry_date), metaX, metaY, { align: 'right' });
  metaY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Status:', metaX - 50, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(quote.status.toUpperCase(), metaX, metaY, { align: 'right' });

  // Bill To Box
  y = Math.max(y, metaY) + 5;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PREPARED FOR (CUSTOMER):', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(quote.customer_name || 'Valued Customer', margin + 4, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  let custContact = [
    quote.customer_phone ? `Phone: ${quote.customer_phone}` : '',
    quote.customer_email ? `Email: ${quote.customer_email}` : '',
    quote.customer_address || '',
  ]
    .filter(Boolean)
    .join('  •  ');
  doc.text(custContact, margin + 4, y + 18);

  y += 30;

  // Table Headers
  const colX = {
    desc: margin + 2,
    qty: pageWidth - margin - 72,
    price: pageWidth - margin - 44,
    total: pageWidth - margin - 2,
  };

  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('ITEM & DESCRIPTION', colX.desc, y + 5.5);
  doc.text('QTY', colX.qty, y + 5.5, { align: 'center' });
  doc.text('UNIT PRICE', colX.price, y + 5.5, { align: 'right' });
  doc.text('TOTAL', colX.total, y + 5.5, { align: 'right' });

  y += 8;

  // Table Rows
  quote.items.forEach((item, index) => {
    const isEven = index % 2 === 1;
    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.name, colX.desc, y + 4.5);

    if (item.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const descSnippet = doc.splitTextToSize(item.description, 95)[0];
      doc.text(descSnippet, colX.desc, y + 8);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${item.quantity} ${item.unit || ''}`.trim(), colX.qty, y + 5.5, { align: 'center' });

    doc.text(formatCurrency(item.unit_price, business.currency), colX.price, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.total, business.currency), colX.total, y + 5.5, { align: 'right' });

    y += 10;
  });

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Totals Section on the right
  const summaryX = pageWidth - margin - 60;
  const valX = pageWidth - margin - 2;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(quote.subtotal, business.currency), valX, y, { align: 'right' });
  y += 5;

  if (quote.discount_amount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Discount (${quote.discount_val}%):`, summaryX, y);
    doc.setTextColor(220, 38, 38); // red
    doc.setFont('helvetica', 'bold');
    doc.text(`-${formatCurrency(quote.discount_amount, business.currency)}`, valX, y, { align: 'right' });
    y += 5;
  }

  if (quote.tax_amount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${business.tax_name || 'Tax'} (${quote.tax_rate}%):`, summaryX, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`+${formatCurrency(quote.tax_amount, business.currency)}`, valX, y, { align: 'right' });
    y += 5;
  }

  // Grand Total Pill Box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(summaryX - 4, y, pageWidth - margin - summaryX + 4, 10, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('GRAND TOTAL:', summaryX, y + 6.5);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(formatCurrency(quote.total, business.currency), valX, y + 6.5, { align: 'right' });

  y += 18;

  // Notes & Payment / Terms
  if (quote.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('NOTES:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const noteLines = doc.splitTextToSize(quote.notes, pageWidth - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 3.5 + 4;
  }

  if (business.payment_details?.bank_name) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('PAYMENT INFORMATION:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const payText = `Bank: ${business.payment_details.bank_name}  |  Account Name: ${business.payment_details.account_name}  |  Account No: ${business.payment_details.account_number}`;
    doc.text(payText, margin, y);
    y += 4;
    if (business.payment_details.notes) {
      doc.text(business.payment_details.notes, margin, y);
      y += 5;
    }
  }

  if (quote.terms || business.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TERMS & CONDITIONS:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const termLines = doc.splitTextToSize(quote.terms || business.terms, pageWidth - margin * 2);
    doc.text(termLines, margin, y);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Powered by Mathorg.com — Create. Send. Follow Up. Get Paid.', pageWidth / 2, pageHeight - 8, {
    align: 'center',
  });

  return doc.output('blob');
}

export function generateQuotePDF(quote: Quote, business: BusinessProfile): void {
  const blob = createQuotePDF(quote, business);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${quote.quote_number}_${quote.customer_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function createInvoicePDF(invoice: Invoice, business: BusinessProfile): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  let y = margin;

  // Header Background bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Business Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(business.business_name || 'Business Name', margin, 14);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('TAX INVOICE & PAYMENT DEMAND', margin, 21);

  // Document Badge on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text('INVOICE', pageWidth - margin, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(invoice.invoice_number, pageWidth - margin, 21, { align: 'right' });

  y = 36;

  // From Info
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED FROM:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(business.business_name, margin, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  if (business.address) {
    const addr = doc.splitTextToSize(business.address, 80);
    doc.text(addr, margin, y);
    y += addr.length * 4;
  }
  if (business.phone) {
    doc.text(`Phone: ${business.phone}`, margin, y);
    y += 4;
  }
  if (business.email) {
    doc.text(`Email: ${business.email}`, margin, y);
    y += 4;
  }

  // Right column: Invoice Meta
  let metaY = 36;
  const metaX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE DETAILS:', metaX - 50, metaY);
  metaY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Invoice Date:', metaX - 50, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(invoice.issue_date), metaX, metaY, { align: 'right' });
  metaY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Payment Due Date:', metaX - 50, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(formatDate(invoice.due_date), metaX, metaY, { align: 'right' });
  metaY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Payment Status:', metaX - 50, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(invoice.status === 'Paid' ? 16 : 220, invoice.status === 'Paid' ? 185 : 38, 38);
  doc.text(invoice.status.toUpperCase(), metaX, metaY, { align: 'right' });

  // Bill To Box
  y = Math.max(y, metaY) + 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO (CLIENT):', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.customer_name || 'Valued Client', margin + 4, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const custContact = [
    invoice.customer_phone ? `Phone: ${invoice.customer_phone}` : '',
    invoice.customer_email ? `Email: ${invoice.customer_email}` : '',
    invoice.customer_address || '',
  ]
    .filter(Boolean)
    .join('  •  ');
  doc.text(custContact, margin + 4, y + 18);

  y += 30;

  // Table Headers
  const colX = {
    desc: margin + 2,
    qty: pageWidth - margin - 72,
    price: pageWidth - margin - 44,
    total: pageWidth - margin - 2,
  };

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('ITEM & DESCRIPTION', colX.desc, y + 5.5);
  doc.text('QTY', colX.qty, y + 5.5, { align: 'center' });
  doc.text('UNIT PRICE', colX.price, y + 5.5, { align: 'right' });
  doc.text('TOTAL', colX.total, y + 5.5, { align: 'right' });

  y += 8;

  // Table Rows
  invoice.items.forEach((item, index) => {
    const isEven = index % 2 === 1;
    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.name, colX.desc, y + 4.5);

    if (item.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const descSnippet = doc.splitTextToSize(item.description, 95)[0];
      doc.text(descSnippet, colX.desc, y + 8);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${item.quantity} ${item.unit || ''}`.trim(), colX.qty, y + 5.5, { align: 'center' });
    doc.text(formatCurrency(item.unit_price, business.currency), colX.price, y + 5.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.total, business.currency), colX.total, y + 5.5, { align: 'right' });

    y += 10;
  });

  // Line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Summary
  const summaryX = pageWidth - margin - 60;
  const valX = pageWidth - margin - 2;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(invoice.subtotal, business.currency), valX, y, { align: 'right' });
  y += 5;

  if (invoice.discount_amount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Discount (${invoice.discount_val}%):`, summaryX, y);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text(`-${formatCurrency(invoice.discount_amount, business.currency)}`, valX, y, { align: 'right' });
    y += 5;
  }

  if (invoice.tax_amount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${business.tax_name || 'Tax'} (${invoice.tax_rate}%):`, summaryX, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`+${formatCurrency(invoice.tax_amount, business.currency)}`, valX, y, { align: 'right' });
    y += 5;
  }

  // Invoice Grand Total
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(summaryX - 4, y, pageWidth - margin - summaryX + 4, 10, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('AMOUNT DUE:', summaryX, y + 6.5);
  doc.setTextColor(56, 189, 248);
  doc.text(formatCurrency(invoice.total, business.currency), valX, y + 6.5, { align: 'right' });

  y += 18;

  // Payment Details Highlight Box
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text('PAYMENT INSTRUCTIONS:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  const payInfo = invoice.payment_details || `Bank: ${business.payment_details.bank_name} | Acc: ${business.payment_details.account_number} | ${business.payment_details.account_name}`;
  doc.text(payInfo, margin + 4, y + 12);
  doc.text('Please quote invoice number on payment and send confirmation receipt via WhatsApp.', margin + 4, y + 17);

  y += 28;

  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('NOTES:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(invoice.notes, pageWidth - margin * 2), margin, y);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Powered by Mathorg.com — Create. Send. Follow Up. Get Paid.', pageWidth / 2, pageHeight - 8, {
    align: 'center',
  });

  return doc.output('blob');
}

export function generateInvoicePDF(invoice: Invoice, business: BusinessProfile): void {
  const blob = createInvoicePDF(invoice, business);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.invoice_number}_${invoice.customer_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
