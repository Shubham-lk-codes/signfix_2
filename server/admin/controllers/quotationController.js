const quotationService = require('../../services/quotationService');
const { createQuotationPdf } = require('../../utils/pdf');

async function options(_req, res) { res.json(await quotationService.options()); }
async function list(req, res) { res.json(await quotationService.adminList(req.query)); }
async function detail(req, res) { res.json(await quotationService.adminDetail(req.params.id)); }
async function create(req, res) { res.status(201).json(await quotationService.create(req.body, req.user)); }
async function update(req, res) { res.json(await quotationService.update(req.params.id, req.body, req.user)); }
async function createRevision(req, res) { res.status(201).json(await quotationService.createRevision(req.params.id, req.body, req.user)); }
async function send(req, res) { res.json(await quotationService.send(req.params.id, req.body, req.user)); }
async function resend(req, res) { res.json(await quotationService.send(req.params.id, req.body, req.user, true)); }
async function cancel(req, res) { res.json(await quotationService.cancel(req.params.id, req.body, req.user)); }
async function pdf(req, res) {
  const quotation = await quotationService.adminDetail(req.params.id);
  const company = await quotationService.companySettings();
  const buffer = await createQuotationPdf(quotation, company);
  await quotationService.recordPdfDownload(req.user, req.params.id, 'admin').catch((error) => console.warn('Quotation PDF audit failed:', error.message));
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${quotation.quotationNo}-v${quotation.version}.pdf"`,
    'Content-Length': buffer.length,
    'Cache-Control': 'private, no-store',
  }).send(buffer);
}

module.exports = { options, list, detail, create, update, createRevision, send, resend, cancel, pdf };
