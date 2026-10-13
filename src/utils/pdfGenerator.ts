import { jsPDF } from 'jspdf';
import { BusinessProfile, Quote, Invoice, DocumentDesignTemplate } from '../types';
import { formatDate } from './formatters';

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  }
  return [11, 25, 44]; // default navy
}

export function safePdfCurrency(amount: number, currency = 'NGN'): string {
  const code = (currency || 'NGN').replace('₦', 'NGN').trim();
  const prefix = code ? `${code} ` : '';
  if (isNaN(amount)) return `${prefix}0.00`;
  return `${prefix}${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Universal PDF print runner:
 * Uses an invisible iframe to invoke the browser's native print dialog with the rendered PDF document.
 * Includes a fallback to open the PDF directly in a new tab if iframe printing is restricted.
 */
export function printPDFDocument(doc: jsPDF, filename = 'document.pdf'): void {
  try {
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.id = 'print_pdf_frame_' + Date.now();
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn('[PDF] Iframe direct print was blocked, opening print window:', err);
          const printWindow = window.open(blobUrl, '_blank');
          if (printWindow) {
            printWindow.focus();
          }
        }
        setTimeout(() => {
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            URL.revokeObjectURL(blobUrl);
          } catch (_) {}
        }, 120000);
      }, 300);
    };
  } catch (error) {
    console.error('[PDF] Print error, falling back to download:', error);
    doc.save(filename);
  }
}

/**
 * Builds the full jsPDF instance for a Quotation with the selected design template.
 */
export function buildQuotePDFDoc(quote: Quote, business: BusinessProfile): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  let y = margin;

  const design: DocumentDesignTemplate = quote.design_template || business.invoice_design || 'corporate';
  const customColorRgb = business.design_color ? hexToRgb(business.design_color) : [11, 25, 44];

  // Optional Logo rendering
  let headerTextOffset = margin;
  if (business.logo && business.show_logo_on_docs !== false) {
    try {
      doc.addImage(business.logo, 'JPEG', margin, 5, 18, 18);
      headerTextOffset = margin + 22;
    } catch (_) {
      // Fallback if image format requires base64 or has CORS restrictions
    }
  }

  // Header styles per design
  if (design === 'modern') {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(customColorRgb[0], customColorRgb[1], customColorRgb[2]);
    doc.rect(0, 27, pageWidth, 1.5, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(business.business_name || 'Business Name', headerTextOffset, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(business.tagline || 'PRICE ESTIMATION & QUOTATION', headerTextOffset, 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(customColorRgb[0], customColorRgb[1], customColorRgb[2]);
    doc.text('QUOTATION', pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(quote.quote_number, pageWidth - margin, 21, { align: 'right' });
  } else if (design === 'technical') {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(6, 182, 212); // cyan-500
    doc.rect(0, 26.5, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(15);
    doc.text(business.business_name || 'Business Name', headerTextOffset, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(103, 232, 249);
    doc.text('TECHNICAL BILL OF QUANTITIES & SPECIFICATION', headerTextOffset, 21);

    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(6, 182, 212);
    doc.text('ESTIMATE // ' + quote.quote_number, pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(226, 232, 240);
    doc.text('REF: MAT-SPEC-DOC', pageWidth - margin, 21, { align: 'right' });
  } else if (design === 'emerald') {
    doc.setFillColor(6, 78, 59); // emerald-900
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(52, 211, 153); // emerald-400
    doc.rect(0, 26.5, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(business.business_name || 'Business Name', headerTextOffset, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(167, 243, 208);
    doc.text('PREMIUM PRICE QUOTATION & SCOPE', headerTextOffset, 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(52, 211, 153);
    doc.text('QUOTATION', pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(209, 250, 229);
    doc.text(quote.quote_number, pageWidth - margin, 21, { align: 'right' });
  } else {
    // corporate default
    doc.setFillColor(11, 25, 44);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 26.5, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(business.business_name || 'Business Name', headerTextOffset, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(business.tagline || 'EXECUTIVE PROPOSAL & ESTIMATE', headerTextOffset, 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text('QUOTATION', pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(quote.quote_number, pageWidth - margin, 21, { align: 'right' });
  }

  y = 35;

  // Business Information (Left)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  if (business.show_address_on_docs !== false) {
    const addressLine = [business.address, business.city, business.state, business.country]
      .filter(Boolean)
      .join(', ');
    if (addressLine) {
      doc.text(addressLine, margin, y);
      y += 4.5;
    }
  }

  const contactLine = [
    business.phone ? `Phone: ${business.phone}` : '',
    business.email ? `Email: ${business.email}` : '',
    business.website ? `Web: ${business.website}` : '',
  ]
    .filter(Boolean)
    .join('  •  ');

  if (contactLine) {
    doc.text(contactLine, margin, y);
    y += 4.5;
  }

  if (business.cac_number) {
    doc.text(`CAC / RC: ${business.cac_number}`, margin, y);
    y += 4.5;
  }

  // Quote Metadata (Right aligned block)
  let metaY = 35;
  const metaX = pageWidth - margin;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Date Issued:`, metaX - 42, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(quote.issue_date), metaX, metaY, { align: 'right' });
  metaY += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text(`Valid Until:`, metaX - 42, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(quote.expiry_date), metaX, metaY, { align: 'right' });
  metaY += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text(`Status:`, metaX - 42, metaY);
  doc.setTextColor(16, 185, 129);
  doc.text((quote.status || 'Draft').toUpperCase(), metaX, metaY, { align: 'right' });

  // Bill To Box
  y = Math.max(y, metaY) + 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
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
  const custContact = [
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

  doc.setFillColor(design === 'technical' ? 240 : 241, design === 'technical' ? 249 : 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setFont(design === 'technical' ? 'courier' : 'helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(design === 'technical' ? 'SPEC / ITEM DESCRIPTION' : 'ITEM & DESCRIPTION', colX.desc, y + 5.5);
  doc.text('QTY', colX.qty, y + 5.5, { align: 'center' });
  doc.text('UNIT PRICE', colX.price, y + 5.5, { align: 'right' });
  doc.text('TOTAL', colX.total, y + 5.5, { align: 'right' });

  y += 8;

  // Table Rows with page overflow handling
  quote.items.forEach((item, index) => {
    if (y > pageHeight - 45) {
      doc.addPage();
      y = margin;
    }

    const isEven = index % 2 === 1;
    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.name || 'Custom Item', colX.desc, y + 4.5);

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

    doc.text(safePdfCurrency(item.unit_price, business.currency), colX.price, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(safePdfCurrency(item.total, business.currency), colX.total, y + 5.5, { align: 'right' });

    y += 10;
  });

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Totals Section on the right
  const summaryX = pageWidth - margin - 60;
  const valX = pageWidth - margin - 2;

  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(15, 23, 42);
  doc.text(safePdfCurrency(quote.subtotal, business.currency), valX, y, { align: 'right' });
  y += 5;

  if (quote.discount_amount && quote.discount_amount > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Discount (${quote.discount_type === 'percent' ? `${quote.discount_val}%` : 'Fixed'}):`,
      summaryX,
      y
    );
    doc.setTextColor(220, 38, 38);
    doc.text(`-${safePdfCurrency(quote.discount_amount, business.currency)}`, valX, y, { align: 'right' });
    y += 5;
  }

  if (business.show_tax_on_docs !== false && (quote.tax_amount || 0) > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text(`VAT / Tax (${quote.tax_rate}%):`, summaryX, y);
    doc.setTextColor(15, 23, 42);
    doc.text(`+${safePdfCurrency(quote.tax_amount, business.currency)}`, valX, y, { align: 'right' });
    y += 5;
  }

  // Grand Total Box
  doc.setFillColor(design === 'emerald' ? 236 : 241, design === 'emerald' ? 253 : 245, design === 'emerald' ? 245 : 249);
  doc.roundedRect(summaryX - 4, y, pageWidth - margin - (summaryX - 4), 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total:', summaryX, y + 6.5);
  doc.setFontSize(11);
  doc.setTextColor(design === 'emerald' ? 5 : 11, design === 'emerald' ? 150 : 25, design === 'emerald' ? 105 : 44);
  doc.text(safePdfCurrency(quote.total, business.currency), valX, y + 6.5, { align: 'right' });

  y += 18;

  // Notes & Terms
  if (quote.notes) {
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('SCOPE & NOTES:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const noteLines = doc.splitTextToSize(quote.notes, pageWidth - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 3.5 + 4;
  }

  if (business.show_terms_on_docs !== false && (quote.terms || business.terms)) {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = margin;
    }
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
    y += termLines.length * 3 + 4;
  }

  // Authorized Signature Block (Conditional)
  if (business.show_signature_on_docs !== false) {
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin;
    }
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y + 10, margin + 50, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('AUTHORIZED SIGNATURE & STAMP', margin, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(business.director_name || business.business_name, margin, y + 18);
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Powered by Mathorg.com — Create. Send. Follow Up. Get Paid.  |  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Builds the full jsPDF instance for an Invoice with the selected design template.
 */
export function buildInvoicePDFDoc(invoice: Invoice, business: BusinessProfile): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  let y = margin;

  const design: DocumentDesignTemplate = invoice.design_template || business.invoice_design || 'corporate';
  const customColorRgb = business.design_color ? hexToRgb(business.design_color) : [11, 25, 44];

  // Optional Logo rendering
  let headerTextOffset = margin;
  if (business.logo && business.show_logo_on_docs !== false) {
    try {
      doc.addImage(business.logo, 'JPEG', margin, 5, 18, 18);
      headerTextOffset = margin + 22;
    } catch (_) {
      // Fallback
    }
  }

  // Header styles per design
  if (design === 'modern') {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(customColorRgb[0], customColorRgb[1], customColorRgb[2]);
    doc.rect(0, 27, pageWidth, 1.5, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(business.business_name || 'Business Name', headerTextOffset, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TAX INVOICE & PAYMENT DEMAND', headerTextOffset, 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(customColorRgb[0], customColorRgb[1], customColorRgb[2]);
    doc.text('INVOICE', pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(invoice.invoice_number, pageWidth - margin, 21, { align: 'right' });
  } else if (design === 'technical') {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(6, 182, 212); // cyan-500
    doc.rect(0, 26.5, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(15);
    doc.text(business.business_name || 'Business Name', headerTextOffset, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(103, 232, 249);
    doc.text('TECHNICAL BILL OF INVOICE & DEMAND', headerTextOffset, 21);

    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(6, 182, 212);
    doc.text('INVOICE // ' + invoice.invoice_number, pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(226, 232, 240);
    doc.text('STATUS: ' + (invoice.status || 'UNPAID').toUpperCase(), pageWidth - margin, 21, { align: 'right' });
  } else if (design === 'emerald') {
    doc.setFillColor(6, 78, 59); // emerald-900
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(52, 211, 153); // emerald-400
    doc.rect(0, 26.5, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(business.business_name || 'Business Name', headerTextOffset, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(167, 243, 208);
    doc.text('OFFICIAL SETTLEMENT INVOICE', headerTextOffset, 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(52, 211, 153);
    doc.text('TAX INVOICE', pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(209, 250, 229);
    doc.text(invoice.invoice_number, pageWidth - margin, 21, { align: 'right' });
  } else {
    // corporate default
    doc.setFillColor(11, 25, 44);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 26.5, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(business.business_name || 'Business Name', headerTextOffset, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(business.tagline || 'EXECUTIVE TAX INVOICE', headerTextOffset, 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text('INVOICE', pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(invoice.invoice_number, pageWidth - margin, 21, { align: 'right' });
  }

  y = 35;

  // Business Information (Left)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  if (business.show_address_on_docs !== false) {
    const addressLine = [business.address, business.city, business.state, business.country]
      .filter(Boolean)
      .join(', ');
    if (addressLine) {
      doc.text(addressLine, margin, y);
      y += 4.5;
    }
  }

  const contactLine = [
    business.phone ? `Phone: ${business.phone}` : '',
    business.email ? `Email: ${business.email}` : '',
    business.website ? `Web: ${business.website}` : '',
  ]
    .filter(Boolean)
    .join('  •  ');

  if (contactLine) {
    doc.text(contactLine, margin, y);
    y += 4.5;
  }

  if (business.cac_number) {
    doc.text(`CAC / RC: ${business.cac_number}`, margin, y);
    y += 4.5;
  }

  // Invoice Metadata (Right aligned block)
  let metaY = 35;
  const metaX = pageWidth - margin;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Issue Date:`, metaX - 42, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.issue_date), metaX, metaY, { align: 'right' });
  metaY += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text(`Due Date:`, metaX - 42, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.due_date), metaX, metaY, { align: 'right' });
  metaY += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Status:`, metaX - 42, metaY);
  const statusColor =
    invoice.status === 'Paid' ? [16, 185, 129] : invoice.status === 'Overdue' ? [220, 38, 38] : [217, 119, 6];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text((invoice.status || 'UNPAID').toUpperCase(), metaX, metaY, { align: 'right' });

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

  doc.setFillColor(design === 'technical' ? 240 : 241, design === 'technical' ? 249 : 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setFont(design === 'technical' ? 'courier' : 'helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(design === 'technical' ? 'SPEC / ITEM DESCRIPTION' : 'DESCRIPTION', colX.desc, y + 5.5);
  doc.text('QTY', colX.qty, y + 5.5, { align: 'center' });
  doc.text('UNIT PRICE', colX.price, y + 5.5, { align: 'right' });
  doc.text('AMOUNT', colX.total, y + 5.5, { align: 'right' });

  y += 8;

  // Table Rows with page overflow handling
  invoice.items.forEach((item, index) => {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = margin;
    }

    const isEven = index % 2 === 1;
    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.name || 'Contract Item', colX.desc, y + 4.5);

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

    doc.text(safePdfCurrency(item.unit_price, business.currency), colX.price, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(safePdfCurrency(item.total, business.currency), colX.total, y + 5.5, { align: 'right' });

    y += 10;
  });

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Totals Section on the right
  const summaryX = pageWidth - margin - 60;
  const valX = pageWidth - margin - 2;

  if (y > pageHeight - 55) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(15, 23, 42);
  doc.text(safePdfCurrency(invoice.subtotal, business.currency), valX, y, { align: 'right' });
  y += 5;

  if (invoice.discount_amount && invoice.discount_amount > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Discount (${invoice.discount_type === 'percent' ? `${invoice.discount_val}%` : 'Fixed'}):`,
      summaryX,
      y
    );
    doc.setTextColor(220, 38, 38);
    doc.text(`-${safePdfCurrency(invoice.discount_amount, business.currency)}`, valX, y, { align: 'right' });
    y += 5;
  }

  if (business.show_tax_on_docs !== false && (invoice.tax_amount || 0) > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text(`VAT / Tax (${invoice.tax_rate}%):`, summaryX, y);
    doc.setTextColor(15, 23, 42);
    doc.text(`+${safePdfCurrency(invoice.tax_amount, business.currency)}`, valX, y, { align: 'right' });
    y += 5;
  }

  // Total Invoiced Box
  doc.setFillColor(design === 'emerald' ? 236 : 241, design === 'emerald' ? 253 : 245, design === 'emerald' ? 245 : 249);
  doc.roundedRect(summaryX - 4, y, pageWidth - margin - (summaryX - 4), 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Invoiced:', summaryX, y + 6.5);
  doc.setFontSize(11);
  doc.setTextColor(design === 'emerald' ? 5 : 11, design === 'emerald' ? 150 : 25, design === 'emerald' ? 105 : 44);
  doc.text(safePdfCurrency(invoice.total, business.currency), valX, y + 6.5, { align: 'right' });

  y += 14;

  // Payments & Balance
  const balance = Math.max(0, invoice.total - (invoice.amount_paid || 0));
  if (invoice.amount_paid > 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text(`Amount Paid to Date: ${safePdfCurrency(invoice.amount_paid, business.currency)}`, summaryX - 20, y);
    y += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(balance > 0 ? 220 : 16, balance > 0 ? 38 : 185, balance > 0 ? 38 : 129);
    doc.text(`Remaining Balance: ${safePdfCurrency(balance, business.currency)}`, summaryX - 20, y);
    y += 6;
  }

  // Payment Details (Bank details box)
  if (business.show_banking_on_docs !== false) {
    if (y > pageHeight - 45) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('DIRECT BANK SETTLEMENT DETAILS:', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const payText =
      invoice.payment_details ||
      `Bank: ${business.payment_details.bank_name} | Acct: ${business.payment_details.account_number} (${business.payment_details.account_name})`;
    const payLines = doc.splitTextToSize(payText, pageWidth - margin * 2 - 8);
    doc.text(payLines, margin + 4, y + 10);
    y += 21;
  }

  if (invoice.notes) {
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('NOTES:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 3.5 + 4;
  }

  // Authorized Signature Block (Conditional)
  if (business.show_signature_on_docs !== false) {
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin;
    }
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y + 10, margin + 50, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('AUTHORIZED FINANCE STAMP & SIGNATURE', margin, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(business.director_name || business.business_name, margin, y + 18);
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Powered by Mathorg.com — Create. Send. Follow Up. Get Paid.  |  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Downloads a Quotation as a PDF file.
 */
export function generateQuotePDF(quote: Quote, business: BusinessProfile): void {
  const doc = buildQuotePDFDoc(quote, business);
  const safeName = (quote.customer_name || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${quote.quote_number}_${safeName}.pdf`);
}

/**
 * Prints a Quotation directly via the browser's print dialog.
 */
export function printQuotePDF(quote: Quote, business: BusinessProfile): void {
  const doc = buildQuotePDFDoc(quote, business);
  const safeName = (quote.customer_name || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  printPDFDocument(doc, `${quote.quote_number}_${safeName}.pdf`);
}

/**
 * Downloads an Invoice as a PDF file.
 */
export function generateInvoicePDF(invoice: Invoice, business: BusinessProfile): void {
  const doc = buildInvoicePDFDoc(invoice, business);
  const safeName = (invoice.customer_name || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${invoice.invoice_number}_${safeName}.pdf`);
}

/**
 * Prints an Invoice directly via the browser's print dialog.
 */
export function printInvoicePDF(invoice: Invoice, business: BusinessProfile): void {
  const doc = buildInvoicePDFDoc(invoice, business);
  const safeName = (invoice.customer_name || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  printPDFDocument(doc, `${invoice.invoice_number}_${safeName}.pdf`);
}

/**
 * Returns a temporary blob URL for the generated PDF document.
 */
export function getDocumentPDFBlobUrl(
  type: 'quote' | 'invoice',
  item: Quote | Invoice,
  business: BusinessProfile
): string {
  const doc =
    type === 'quote'
      ? buildQuotePDFDoc(item as Quote, business)
      : buildInvoicePDFDoc(item as Invoice, business);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

/**
 * Universal dispatcher to download, print, or preview any quotation or invoice PDF.
 */
export function exportDocumentPDF(
  type: 'quote' | 'invoice',
  item: Quote | Invoice,
  business: BusinessProfile,
  action: 'download' | 'print' | 'preview' = 'download'
): string | void {
  if (type === 'quote') {
    if (action === 'print') {
      return printQuotePDF(item as Quote, business);
    }
    if (action === 'preview') {
      return getDocumentPDFBlobUrl('quote', item, business);
    }
    return generateQuotePDF(item as Quote, business);
  } else {
    if (action === 'print') {
      return printInvoicePDF(item as Invoice, business);
    }
    if (action === 'preview') {
      return getDocumentPDFBlobUrl('invoice', item, business);
    }
    return generateInvoicePDF(item as Invoice, business);
  }
}
