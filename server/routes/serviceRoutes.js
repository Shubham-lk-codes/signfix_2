const router = require('express').Router();
const { z } = require('zod');
const controller = require('../controllers/serviceController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);
router.get('/', controller.list);
router.post('/', authorize('customer', 'super_admin', 'admin'),
validate(z.object({
    customerId:z.coerce.number().int().positive().optional(),category: z.enum(['LED Problem','Electrical Issue','Physical Damage','Sign Board Repair','Replacement','Installation','Reinstallation','Cleaning','Maintenance','Inspection','Emergency','Other']), description: z.string().min(3).max(4000).optional(),remarks:z.string().min(3).max(4000).optional(), address: z.union([z.string().min(3),z.object({addressLine:z.string().min(3),city:z.string().optional(),state:z.string().optional(),pincode:z.string().optional()}).passthrough()]), latitude: z.coerce.number().min(-90).max(90).optional(), longitude: z.coerce.number().min(-180).max(180).optional(), photos: z.array(z.string().min(1)).min(1).max(10), priority: z.enum(['normal', 'high', 'emergency']).default('normal')
}).refine(data=>Boolean(data.description||data.remarks),{message:'Description or remarks is required'}).transform(data=>({...data,description:data.description||data.remarks}))), controller.create);

router.patch('/:id', authorize('super_admin', 'admin', 'service_manager'), controller.update);
module.exports = router;
