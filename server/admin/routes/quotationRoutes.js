const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { authenticate, authorize, permit } = require('../../middleware/auth');
const controller = require('../controllers/quotationController');

const discountType = z.enum(['none', 'fixed', 'percentage']);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Use a valid calendar date');
const item = z.object({
  productId: z.coerce.number().int().positive().nullable().optional(),
  description: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().positive().max(100000),
  unit: z.string().trim().min(1).max(30).default('unit'),
  unitPrice: z.coerce.number().nonnegative().max(1000000000),
  discountType: discountType.default('none'),
  discountValue: z.coerce.number().nonnegative().max(1000000000).default(0),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
  metadata: z.record(z.any()).optional(),
});
const commercialFields = {
  installation: z.coerce.number().nonnegative().max(1000000000).default(0),
  transportation: z.coerce.number().nonnegative().max(1000000000).default(0),
  design: z.coerce.number().nonnegative().max(1000000000).default(0),
  accessories: z.coerce.number().nonnegative().max(1000000000).default(0),
  otherCharges: z.coerce.number().nonnegative().max(1000000000).default(0),
  discountType: discountType.default('none'),
  discountValue: z.coerce.number().nonnegative().max(1000000000).default(0),
  gstPercentage: z.coerce.number().min(0).max(100).optional(),
  terms: z.string().trim().max(10000).optional(),
  customerNotes: z.string().trim().max(4000).nullable().optional(),
  internalNotes: z.string().trim().max(4000).nullable().optional(),
  validUntil: dateOnly,
  items: z.array(item).min(1).max(50),
};
const createSchema = z.object({ orderNo: z.string().trim().min(3).max(40), ...commercialFields });
const updateSchema = z.object({
  ...Object.fromEntries(Object.entries(commercialFields).map(([key, value]) => [key, value.optional()])),
  expectedLockVersion: z.coerce.number().int().positive(),
}).refine((value) => Object.keys(value).some((key) => key !== 'expectedLockVersion'), { message: 'At least one quotation field is required' });
const guardedAction = z.object({ expectedLockVersion: z.coerce.number().int().positive(), internalNote: z.string().trim().max(2000).optional() });

router.use(authenticate, authorize('super_admin', 'admin', 'sales_manager', 'support_agent'));
router.get('/options', permit('quotation.create'), controller.options);
router.get('/', permit('quotation.view'), controller.list);
router.get('/:id/pdf', permit('quotation.download'), controller.pdf);
router.get('/:id', permit('quotation.view'), controller.detail);
router.post('/', permit('quotation.create'), validate(createSchema), controller.create);
router.patch('/:id', permit('quotation.edit'), validate(updateSchema), controller.update);
router.post('/:id/revisions', permit('quotation.manage_revisions'), validate(guardedAction), controller.createRevision);
router.post('/:id/send', permit('quotation.send'), validate(guardedAction), controller.send);
router.post('/:id/resend', permit('quotation.send'), validate(guardedAction), controller.resend);
router.post('/:id/cancel', permit('quotation.cancel'), validate(guardedAction.extend({ reason: z.string().trim().min(3).max(2000) })), controller.cancel);

module.exports = router;
