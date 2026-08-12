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
module.exports = { simplePdf };
