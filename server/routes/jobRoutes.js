const router = require('express').Router();
const controller = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate, authorize('technician', 'super_admin', 'admin', 'service_manager', 'technician_manager'));
router.get('/', controller.list);
router.patch('/:id/status', controller.updateStatus);
module.exports = router;
