const router = require('express').Router();
const { z } = require('zod');
const controller = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
router.post('/login', validate(z.object({ email: z.string().email(), password: z.string().min(6), portal: z.enum(['admin', 'customer', 'technician']).optional() })), controller.login);
router.get('/me', authenticate, controller.me);
module.exports = router;
