const router = require('express').Router();
const { z } = require('zod');
const controller = require('../controllers/serviceController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);
router.get('/', controller.list);
router.post('/', authorize('customer', 'super_admin', 'admin'),
validate(z.object({
    category: z.enum(['LED Problem','Electrical Issue','Physical Damage','Sign Board Repair','Replacement','Installation','Reinstallation','Cleaning','Maintenance','Inspection','Emergency','Other']), description: z.string().min(3), address: z.string().min(3), latitude: z.coerce.number().min(-90).max(90).optional(), longitude: z.coerce.number().min(-180).max(180).optional(), photos: z.array(z.string()).min(1).max(10), priority: z.enum(['normal', 'high', 'emergency']).default('normal')
})), controller.create);

router.patch('/:id', authorize('super_admin', 'admin', 'service_manager'), controller.update);
module.exports = router;
