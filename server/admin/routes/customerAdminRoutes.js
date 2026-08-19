const router = require('express').Router();
const { z } = require('zod');
const controller = require('../controllers/customerAdminController');
const validate = require('../../middleware/validate');
const { authenticate, permit } = require('../../middleware/auth');

const body = z.object({
  name: z.string().min(2).max(120), email: z.string().email(), mobile: z.string().min(8).max(20).optional(),
  companyName: z.string().max(160).optional(), password: z.string().min(8).max(100).optional(),
  status: z.enum(['active', 'disabled']).optional(), paymentsEnabled: z.boolean().optional()
});
const updateBody = body.partial().omit({ password: true });
router.use(authenticate);
router.get('/', permit('customer.view'), controller.list);
router.post('/', permit('customer.create'), validate(body), controller.create);
router.get('/:id', permit('customer.view'), controller.detail);
router.patch('/:id', permit('customer.update'), validate(updateBody), controller.update);
router.delete('/:id', permit('customer.delete'), controller.disable);
module.exports = router;
