function escapePdf(value) { return String(value ?? '').replace(/([\\()])/g, '\\$1').replace(/[\r\n]+/g, ' '); }

function simplePdf(title, lines) {
  const text = [title, ...lines].slice(0, 45);
  const commands = ['BT', '/F1 16 Tf', '50 790 Td', `(${escapePdf(text[0])}) Tj`, '/F1 10 Tf'];
  text.slice(1).forEach((line) => commands.push('0 -18 Td', `(${escapePdf(line)}) Tj`));
  commands.push('ET');
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let output = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = Buffer.byteLength(output); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { output += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output);
}

function formatMoney(value) {
  return `INR ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function loadConfiguredLogo(logoUrl) {
  if (!logoUrl) return null;
  try {
    const url = new URL(logoUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null;
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;
    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > 2 * 1024 * 1024) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > 2 * 1024 * 1024) return null;
    const isPng = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    return isPng || isJpeg ? buffer : null;
  } catch (_) {
    return null;
  }
}

async function createQuotationPdf(quotation, company = {}) {
  const PDFDocument = require('pdfkit');
  const logo = await loadConfiguredLogo(company.logoUrl);
  const doc = new PDFDocument({ size: 'A4', margin: 42, compress: false, info: { Title: `Quotation ${quotation.quotationNo}`, Author: company.name || 'SignFix' } });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const completed = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  const navy = '#173d8f', muted = '#667085', light = '#eef2f8';
  const ensureSpace = (height = 70) => { if (doc.y + height > 790) doc.addPage(); };
  const pair = (label, value, x, y, width = 245) => {
    doc.fillColor(muted).fontSize(8).text(label.toUpperCase(), x, y, { width });
    doc.fillColor('#182230').fontSize(10).text(String(value ?? '-'), x, y + 13, { width });
  };

  doc.roundedRect(42, 38, 511, 82, 8).fill(navy);
  if (logo) doc.image(logo, 60, 50, { fit: [54, 54], align: 'center', valign: 'center' });
  const brandX = logo ? 126 : 60;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(24).text(company.name || 'SignFix', brandX, 56);
  doc.font('Helvetica').fontSize(9).text(company.address || 'Professional signage solutions', brandX, 88, { width: logo ? 230 : 300 });
  doc.font('Helvetica-Bold').fontSize(20).text('QUOTATION', 385, 56, { width: 145, align: 'right' });
  doc.font('Helvetica').fontSize(9).text(`${quotation.quotationNo}  |  Version ${quotation.version}`, 345, 88, { width: 185, align: 'right' });

  pair('Issue date', String(quotation.issueDate || '').slice(0, 10), 42, 140);
  pair('Valid until', String(quotation.validUntil || '').slice(0, 10), 298, 140);
  pair('Order number', quotation.orderNo, 42, 180);
  pair('Status', String(quotation.status || '').replaceAll('_', ' ').toUpperCase(), 298, 180);

  doc.y = 228;
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('BILL TO');
  doc.moveDown(0.5).fillColor('#182230').font('Helvetica-Bold').fontSize(11).text(quotation.customerName || quotation.customer?.name || '-');
  const customerCompany = quotation.company || quotation.customer?.company;
  if (customerCompany) doc.font('Helvetica').fontSize(9).text(customerCompany);
  const customerAddress = quotation.customerAddress || quotation.customer?.address;
  if (customerAddress) doc.fillColor(muted).text(typeof customerAddress === 'string' ? customerAddress : Object.values(customerAddress).filter(Boolean).join(', '), { width: 350 });
  const contact = [quotation.customerEmail || quotation.customer?.email, quotation.customerPhone || quotation.customer?.phone].filter(Boolean).join('  |  ');
  if (contact) doc.text(contact);

  doc.moveDown(1.2);
  const tableX = 42, widths = [190, 38, 40, 65, 55, 48, 75];
  const headers = ['Description', 'Qty', 'Unit', 'Unit price', 'Discount', 'Tax', 'Amount'];
  let y = doc.y;
  doc.rect(tableX, y, 511, 24).fill(light);
  let x = tableX;
  headers.forEach((header, index) => { doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text(header, x + 5, y + 8, { width: widths[index] - 10, align: index > 2 ? 'right' : 'left' }); x += widths[index]; });
  y += 24;
  for (const item of quotation.items || []) {
    ensureSpace(45);
    if (doc.y !== y && doc.y < y) y = doc.y;
    const height = Math.max(34, doc.heightOfString(item.description || '-', { width: widths[0] - 10 }) + 14);
    doc.rect(tableX, y, 511, height).strokeColor('#dfe4ec').stroke();
    x = tableX;
    const values = [item.description, Number(item.quantity), item.unit, formatMoney(item.unitPrice), formatMoney(item.discountAmount), `${Number(item.taxPercentage || 0)}%`, formatMoney(item.lineTotal ?? item.amount)];
    values.forEach((value, index) => { doc.fillColor('#344054').font(index === 0 ? 'Helvetica' : 'Helvetica').fontSize(8).text(String(value ?? '-'), x + 5, y + 9, { width: widths[index] - 10, align: index > 2 ? 'right' : 'left' }); x += widths[index]; });
    y += height;
    doc.y = y;
  }

  ensureSpace(190);
  y = doc.y + 16;
  const totals = [
    ['Subtotal', quotation.subtotal],
    ['Discount', -Number(quotation.discountAmount || 0)],
    ['Taxable amount', quotation.taxableAmount],
    [`GST (${Number(quotation.gstPercentage || 0)}%)`, quotation.gstAmount],
  ];
  totals.forEach(([label, value]) => {
    doc.fillColor(muted).font('Helvetica').fontSize(9).text(label, 330, y, { width: 105, align: 'right' });
    doc.fillColor('#182230').text(formatMoney(value), 443, y, { width: 110, align: 'right' });
    y += 19;
  });
  doc.roundedRect(325, y, 228, 34, 5).fill(navy);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('FINAL AMOUNT', 338, y + 11, { width: 90 });
  doc.fontSize(11).text(formatMoney(quotation.finalAmount), 430, y + 10, { width: 110, align: 'right' });
  doc.y = y + 52;

  if (quotation.terms) {
    ensureSpace(80);
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text('TERMS & CONDITIONS');
    doc.moveDown(0.4).fillColor('#475467').font('Helvetica').fontSize(8.5).text(quotation.terms, { lineGap: 2 });
  }
  if (quotation.customerNotes) {
    ensureSpace(60);
    doc.moveDown(0.8).fillColor(navy).font('Helvetica-Bold').fontSize(10).text('NOTES');
    doc.moveDown(0.4).fillColor('#475467').font('Helvetica').fontSize(8.5).text(quotation.customerNotes, { lineGap: 2 });
  }
  ensureSpace(55);
  doc.moveDown(1.2).strokeColor('#dfe4ec').moveTo(42, doc.y).lineTo(553, doc.y).stroke();
  doc.moveDown(0.7).fillColor(muted).font('Helvetica').fontSize(8).text([company.phone, company.email, company.website, company.gstNumber ? `GSTIN: ${company.gstNumber}` : ''].filter(Boolean).join('  |  '), { align: 'center' });
  doc.text('This PDF is generated from the authoritative SignFix quotation record.', { align: 'center' });
  doc.end();
  return completed;
}

module.exports = { simplePdf, createQuotationPdf, formatMoney };
