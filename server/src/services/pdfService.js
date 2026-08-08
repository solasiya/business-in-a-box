const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const store = require('../db/store');

/**
 * Generate a clean, print-ready, professional business PDF with Web Pros Africa Logo
 * @param {Object} order The order object with line items and contact info
 * @returns {Promise<Uint8Array>} PDF binary buffer
 */
async function generateOrderPdf(order) {
  const settings = store.getSettings();
  const company = settings.company || {};
  const vocab = settings.vocabulary || {};

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (points)
  const { width, height } = page.getSize();

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Embed Logo Image
  let embeddedLogo = null;
  const logoPath = path.join(__dirname, '../assets/logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      embeddedLogo = await pdfDoc.embedPng(logoBytes);
    } catch (e) {
      console.warn('Could not embed logo image:', e.message);
    }
  }

  // Color Palette
  const primaryColor = rgb(0.09, 0.18, 0.36); // #172e5c Deep Navy
  const secondaryColor = rgb(0.12, 0.45, 0.68); // #1f73ad Web Pros Blue
  const accentGreen = rgb(0.10, 0.60, 0.40); // Web Pros Circuit Green
  const darkTextColor = rgb(0.12, 0.14, 0.18); // #1f242e Dark
  const mutedTextColor = rgb(0.45, 0.50, 0.58); // #738094 Muted Gray
  const lightBgColor = rgb(0.96, 0.97, 0.98); // #f5f7fa Table header
  const borderColor = rgb(0.88, 0.90, 0.93); // #e1e6ed

  // Dynamic Document Title based on Vocabulary
  let docTitle = 'INVOICE';
  if (order.orderType === 'quote') {
    docTitle = (vocab.quote_s || 'Quote').toUpperCase();
  } else if (order.orderType === 'purchase') {
    docTitle = (vocab.purchase_s || 'Purchase Order').toUpperCase();
  } else {
    docTitle = (vocab.invoice_s || 'Invoice').toUpperCase();
  }

  // Top Accent Banner (Gradient effect with dual lines)
  page.drawRectangle({
    x: 0,
    y: height - 6,
    width: width,
    height: 6,
    color: secondaryColor,
  });

  let currentY = height - 40;

  // Draw Logo if available
  let textStartX = 40;
  if (embeddedLogo) {
    const logoDims = embeddedLogo.scale(0.38);
    page.drawImage(embeddedLogo, {
      x: 40,
      y: currentY - 32,
      width: 75,
      height: 46,
    });
    textStartX = 125;
  }

  // --- HEADER SECTION (Company Letterhead & Document Title) ---
  // Company Name
  page.drawText(company.name || 'Web Pros Africa', {
    x: textStartX,
    y: currentY,
    size: 16,
    font: fontHelveticaBold,
    color: primaryColor,
  });

  // Document Title (Right Aligned)
  const docTitleWidth = fontHelveticaBold.widthOfTextAtSize(docTitle, 22);
  page.drawText(docTitle, {
    x: width - 40 - docTitleWidth,
    y: currentY - 2,
    size: 22,
    font: fontHelveticaBold,
    color: secondaryColor,
  });

  currentY -= 15;

  // Tagline & Order Number
  if (company.tagline) {
    page.drawText(company.tagline, {
      x: textStartX,
      y: currentY,
      size: 8.5,
      font: fontHelveticaOblique,
      color: accentGreen,
    });
  }

  const orderNumText = `# ${order.orderNumber}`;
  const orderNumWidth = fontHelveticaBold.widthOfTextAtSize(orderNumText, 11);
  page.drawText(orderNumText, {
    x: width - 40 - orderNumWidth,
    y: currentY,
    size: 11,
    font: fontHelveticaBold,
    color: primaryColor,
  });

  currentY -= 13;

  // Company Address Lines
  const addressLines = [
    company.address1,
    company.address2,
    `${company.email || ''} ${company.phone ? ' | ' + company.phone : ''}`,
    company.taxNumber ? `Tax Reg: ${company.taxNumber}` : ''
  ].filter(Boolean);

  let addressY = currentY;
  addressLines.forEach(line => {
    page.drawText(line, {
      x: textStartX,
      y: addressY,
      size: 8.5,
      font: fontHelvetica,
      color: mutedTextColor,
    });
    addressY -= 11;
  });

  // Date & Due Date Info (Right side)
  let metaY = currentY;
  const drawMetaRow = (label, val) => {
    const text = `${label}: ${val}`;
    const w = fontHelvetica.widthOfTextAtSize(text, 9);
    page.drawText(text, {
      x: width - 40 - w,
      y: metaY,
      size: 9,
      font: fontHelvetica,
      color: darkTextColor,
    });
    metaY -= 12;
  };

  drawMetaRow('Date Issued', order.date || 'N/A');
  drawMetaRow('Payment Due', order.dueDate || 'N/A');
  drawMetaRow('Status', (order.status || 'Draft').toUpperCase());

  currentY = Math.min(addressY, metaY) - 16;

  // Divider Line
  page.drawLine({
    start: { x: 40, y: currentY },
    end: { x: width - 40, y: currentY },
    thickness: 1,
    color: borderColor,
  });

  currentY -= 18;

  // --- BILL TO / VENDOR INFORMATION ---
  const recipientLabel = order.orderType === 'purchase'
    ? `VENDOR / SUPPLIER (${(vocab.vendor_s || 'Vendor').toUpperCase()}):`
    : `BILLED TO (${(vocab.customer_s || 'Customer').toUpperCase()}):`;

  page.drawText(recipientLabel, {
    x: 40,
    y: currentY,
    size: 8,
    font: fontHelveticaBold,
    color: mutedTextColor,
  });

  currentY -= 13;

  const contact = order.contact || (order.nameId ? store.getNameById(order.nameId) : null);
  if (contact) {
    if (contact.companyName) {
      page.drawText(contact.companyName, {
        x: 40,
        y: currentY,
        size: 11,
        font: fontHelveticaBold,
        color: darkTextColor,
      });
      currentY -= 13;
    }

    if (contact.name) {
      page.drawText(`Attn: ${contact.name}`, {
        x: 40,
        y: currentY,
        size: 9.5,
        font: fontHelvetica,
        color: darkTextColor,
      });
      currentY -= 12;
    }

    if (contact.address) {
      page.drawText(contact.address, {
        x: 40,
        y: currentY,
        size: 8.5,
        font: fontHelvetica,
        color: mutedTextColor,
      });
      currentY -= 12;
    }

    if (contact.email || contact.phone) {
      page.drawText(`${contact.email || ''} ${contact.phone ? ' • ' + contact.phone : ''}`, {
        x: 40,
        y: currentY,
        size: 8.5,
        font: fontHelvetica,
        color: mutedTextColor,
      });
      currentY -= 12;
    }
  } else {
    page.drawText(order.contactName || 'Valued Partner', {
      x: 40,
      y: currentY,
      size: 11,
      font: fontHelveticaBold,
      color: darkTextColor,
    });
    currentY -= 13;
  }

  currentY -= 15;

  // --- ITEMIZED LINE ITEMS TABLE ---
  const tableX = 40;
  const tableWidth = width - 80;
  const colDescWidth = 265;
  const colQtyWidth = 55;
  const colPriceWidth = 95;

  // Table Header Background
  page.drawRectangle({
    x: tableX,
    y: currentY - 6,
    width: tableWidth,
    height: 22,
    color: primaryColor,
  });

  page.drawText('DESCRIPTION / ITEM', {
    x: tableX + 10,
    y: currentY,
    size: 8.5,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('QTY', {
    x: tableX + colDescWidth + 15,
    y: currentY,
    size: 8.5,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('UNIT PRICE', {
    x: tableX + colDescWidth + colQtyWidth + 15,
    y: currentY,
    size: 8.5,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('TOTAL', {
    x: tableX + colDescWidth + colQtyWidth + colPriceWidth + 30,
    y: currentY,
    size: 8.5,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  currentY -= 22;

  const lineItems = order.lineItems || [];
  lineItems.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 1) {
      page.drawRectangle({
        x: tableX,
        y: currentY - 5,
        width: tableWidth,
        height: 20,
        color: lightBgColor,
      });
    }

    const desc = item.description || 'Custom Item';
    const truncatedDesc = desc.length > 52 ? desc.substring(0, 49) + '...' : desc;

    page.drawText(truncatedDesc, {
      x: tableX + 10,
      y: currentY,
      size: 8.5,
      font: fontHelvetica,
      color: darkTextColor,
    });

    page.drawText(String(item.quantity || 1), {
      x: tableX + colDescWidth + 20,
      y: currentY,
      size: 8.5,
      font: fontHelvetica,
      color: darkTextColor,
    });

    const priceText = `R ${(parseFloat(item.unitPrice) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    page.drawText(priceText, {
      x: tableX + colDescWidth + colQtyWidth + 15,
      y: currentY,
      size: 8.5,
      font: fontHelvetica,
      color: darkTextColor,
    });

    const amtText = `R ${(parseFloat(item.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const amtWidth = fontHelveticaBold.widthOfTextAtSize(amtText, 8.5);
    page.drawText(amtText, {
      x: tableX + tableWidth - 15 - amtWidth,
      y: currentY,
      size: 8.5,
      font: fontHelveticaBold,
      color: darkTextColor,
    });

    currentY -= 20;
  });

  // Table bottom border
  page.drawLine({
    start: { x: tableX, y: currentY },
    end: { x: tableX + tableWidth, y: currentY },
    thickness: 1,
    color: borderColor,
  });

  currentY -= 20;

  // --- SUMMARY CALCULATIONS (Subtotal, Tax, Total, Paid, Balance) ---
  const summaryBoxWidth = 220;
  const summaryX = width - 40 - summaryBoxWidth;

  const drawSummaryRow = (label, val, isBold = false, isHighlight = false) => {
    if (isHighlight) {
      page.drawRectangle({
        x: summaryX - 5,
        y: currentY - 4,
        width: summaryBoxWidth + 5,
        height: 18,
        color: lightBgColor,
      });
    }

    page.drawText(label, {
      x: summaryX,
      y: currentY,
      size: isBold ? 9.5 : 8.5,
      font: isBold ? fontHelveticaBold : fontHelvetica,
      color: isBold ? primaryColor : mutedTextColor,
    });

    const valStr = typeof val === 'number' ? `R ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : val;
    const valWidth = (isBold ? fontHelveticaBold : fontHelvetica).widthOfTextAtSize(valStr, isBold ? 9.5 : 8.5);

    page.drawText(valStr, {
      x: width - 40 - valWidth,
      y: currentY,
      size: isBold ? 9.5 : 8.5,
      font: isBold ? fontHelveticaBold : fontHelvetica,
      color: isBold ? primaryColor : darkTextColor,
    });

    currentY -= 16;
  };

  drawSummaryRow('Subtotal', order.subtotal || 0);

  if (order.useSalesTax && order.taxAmount > 0) {
    const taxLabel = `${order.taxName || 'Sales Tax'} (${order.taxPercentage || 0}%)`;
    drawSummaryRow(taxLabel, order.taxAmount || 0);
  }

  // Total Row
  drawSummaryRow('Total Amount', order.total || 0, true, true);

  if (order.amountPaid > 0) {
    drawSummaryRow('Amount Paid', order.amountPaid || 0);
    drawSummaryRow('Balance Due', order.balanceDue || 0, true);
  }

  currentY -= 15;

  // --- CUSTOM FOOTER MESSAGE / TERMS ---
  const customMessage = order.customMessage || settings.orderMessages[order.orderType] || '';
  if (customMessage) {
    page.drawRectangle({
      x: 40,
      y: 80,
      width: width - 80,
      height: 65,
      color: rgb(0.98, 0.98, 0.99),
      borderColor: borderColor,
      borderWidth: 1,
    });

    page.drawText('TERMS & CONDITIONS / NOTES:', {
      x: 52,
      y: 130,
      size: 8,
      font: fontHelveticaBold,
      color: secondaryColor,
    });

    // Text wrapper
    const words = customMessage.split(' ');
    let line = '';
    let textY = 117;
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      if (fontHelvetica.widthOfTextAtSize(testLine, 8) > width - 110) {
        page.drawText(line, { x: 52, y: textY, size: 8, font: fontHelvetica, color: mutedTextColor });
        line = word;
        textY -= 11;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x: 52, y: textY, size: 8, font: fontHelvetica, color: mutedTextColor });
    }
  }

  // Page Bottom Footer with Web Pros Africa branding
  page.drawText(`Generated by Web Pros Africa • ${company.website || 'https://webpros.africa'} • Page 1 of 1`, {
    x: 40,
    y: 35,
    size: 7.5,
    font: fontHelvetica,
    color: mutedTextColor,
  });

  return await pdfDoc.save();
}

module.exports = { generateOrderPdf };
