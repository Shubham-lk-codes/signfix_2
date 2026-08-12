const router = require('express').Router();
const controller = require('../controllers/catalogController');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);
router.get('/:resource', controller.list);
router.post('/:resource', authorize('super_admin', 'admin'), controller.create);
router.patch('/:resource/:id', authorize('super_admin', 'admin'), controller.update);
router.delete('/:resource/:id', authorize('super_admin'), controller.remove);
module.exports = router;
