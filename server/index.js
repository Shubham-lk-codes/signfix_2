const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const database = require('./database');

const app = express();
const SECRET = process.env.JWT_SECRET || 'development-only-change-me';
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadDir));
const upload = multer({ dest: uploadDir, limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_, file, cb) => cb(null, /image|pdf/.test(file.mimetype)) });

const passwordHash = bcrypt.hashSync('SignFix@123', 10);
const products = [
  { id: 1, name: 'LED Sign Board', rate: 850 }, { id: 2, name: 'Acrylic Sign Board', rate: 650 },
  { id: 3, name: 'Flex Sign Board', rate: 280 }, { id: 4, name: 'Neon Sign', rate: 1100 },
];
const orders = [];
const services = [];
const jobs = [
  { id: 'SB-JOB-2026-000461', ticketId: 'SB-SRV-2026-000461', customer: 'Nova Pharmacy', category: 'LED Problem', priority: 'emergency', status: 'assigned', address: '12 MG Road, Bengaluru', latitude: 12.975, longitude: 77.606, phone: '+919876543210' },
  { id: 'SB-JOB-2026-000459', ticketId: 'SB-SRV-2026-000459', customer: 'Apex Dental', category: 'Maintenance', priority: 'normal', status: 'work_in_progress', address: 'Indiranagar, Bengaluru', latitude: 12.978, longitude: 77.640, phone: '+919812345678' },
];
let sequence = 1285;
const id = (prefix) => `${prefix}-${new Date().getFullYear()}-${String(sequence++).padStart(6, '0')}`;
const auth = (roles = []) => (req, res, next) => {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permission' });
    next();
  } catch { return res.status(401).json({ error: 'Authentication required' }); }
};

app.get('/api/health', async (_, res, next) => {
  try { res.json({ status: 'ok', service: 'signfix-api', database: await database.health() }); }
  catch (error) { next(Object.assign(error, { status: 503 })); }
});
app.post('/api/auth/login', async (req, res) => {
  const { email = '', password = '', portal } = req.body;
  const demoRole = portal === 'technician' || email === 'tech@signfix.in' ? 'technician' : email === 'customer@signfix.in' ? 'customer' : email === 'admin@signfix.in' ? 'super_admin' : null;
  const user = database.isConfigured() ? await database.findUserByEmail(email) : demoRole ? { id: demoRole === 'technician' ? 7 : 1, email, role: demoRole, passwordHash } : null;
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
  if (portal === 'technician' && user.role !== 'technician') return res.status(403).json({ error: 'Technician access required' });
  res.json({ token: jwt.sign({ id: user.id, role: user.role, email: user.email }, SECRET, { expiresIn: '8h' }), user: { email: user.email, role: user.role } });
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'signfix-api' }));
app.post('/api/auth/login', async (req, res) => {
  const { email = '', password = '', portal } = req.body;
  if (!email || !(await bcrypt.compare(password, passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
  const role = portal === 'technician' || email.startsWith('tech') ? 'technician' : email.startsWith('customer') ? 'customer' : 'super_admin';
  res.json({ token: jwt.sign({ id: role === 'technician' ? 7 : 1, role, email }, SECRET, { expiresIn: '8h' }), user: { email, role } });
});
app.get('/api/products', auth(), (_, res) => res.json({ data: products }));
app.post('/api/calculator', auth(), (req, res) => {
  const { product, length, width, quantity = 1, material, lighting, installation, transportation } = req.body;
  if (!(length > 0 && width > 0 && quantity > 0)) return res.status(422).json({ error: 'Valid dimensions and quantity are required' });
  const rate = products.find((p) => p.name === product)?.rate || 600;
  const productCost = length * width * quantity * rate;
  const materialCost = material === 'Stainless Steel' ? productCost * .25 : productCost * .12;
  const lightingCost = lighting === 'No Lighting' ? 0 : length * width * 120;
  const installationCost = installation ? 2500 : 0;
  const transportationCost = transportation ? 1200 : 0;
  const subtotal = productCost + materialCost + lightingCost + installationCost + transportationCost;
  const gst = Math.round(subtotal * .18);
  res.json({ productCost, materialCost, lightingCost, installation: installationCost, transportation: transportationCost, gst, estimatedPrice: Math.round(subtotal + gst), label: 'Estimated Price', notice: 'Final quotation may change after Admin review/measurement.' });
});
app.get('/api/orders', auth(), async (req, res, next) => { try { const data = database.isConfigured() ? await database.listOrders(req.user) : orders.filter((o) => req.user.role !== 'customer' || o.createdBy === req.user.email); res.json({ data, page: 1, total: data.length }); } catch (error) { next(error); } });
app.post('/api/orders', auth(['customer', 'super_admin']), async (req, res, next) => { try { if (!(req.body.length > 0 && req.body.width > 0 && req.body.quantity > 0)) return res.status(422).json({ error: 'Valid order dimensions and quantity are required' }); const orderNo = id('SB-ORD'); const order = database.isConfigured() ? await database.createOrder(req.user, req.body, orderNo) : { ...req.body, id: orderNo, createdBy: req.user.email, status: 'under_review', createdAt: new Date().toISOString() }; if (!database.isConfigured()) orders.unshift(order); res.status(201).json(order); } catch (error) { next(error); } });
app.get('/api/services', auth(), async (req, res, next) => { try { const data = database.isConfigured() ? await database.listServices(req.user) : services.filter((s) => req.user.role !== 'customer' || s.createdBy === req.user.email); res.json({ data, page: 1, total: data.length }); } catch (error) { next(error); } });
app.post('/api/services', auth(['customer', 'super_admin']), async (req, res, next) => { try { if (!req.body.category || !req.body.description) return res.status(422).json({ error: 'Category and description are required' }); const ticketNo = id('SB-SRV'); const ticket = database.isConfigured() ? await database.createService(req.user, req.body, ticketNo) : { ...req.body, id: ticketNo, createdBy: req.user.email, status: 'submitted', createdAt: new Date().toISOString(), message: 'Your service request has been submitted.' }; if (!database.isConfigured()) services.unshift(ticket); res.status(201).json(ticket); } catch (error) { next(error); } });
app.get('/api/orders', auth(), (req, res) => res.json({ data: orders.filter((o) => req.user.role !== 'customer' || o.createdBy === req.user.email), page: 1, total: orders.length }));
app.post('/api/orders', auth(), (req, res) => { const order = { ...req.body, id: id('SB-ORD'), createdBy: req.user.email, status: 'under_review', createdAt: new Date().toISOString() }; orders.unshift(order); res.status(201).json(order); });
app.get('/api/services', auth(), (req, res) => res.json({ data: services.filter((s) => req.user.role !== 'customer' || s.createdBy === req.user.email), page: 1, total: services.length }));
app.post('/api/services', auth(), (req, res) => { const ticket = { ...req.body, id: id('SB-SRV'), createdBy: req.user.email, status: 'submitted', createdAt: new Date().toISOString(), message: 'Your service request has been submitted.' }; services.unshift(ticket); res.status(201).json(ticket); });
app.get('/api/jobs', auth(['technician', 'super_admin']), (_, res) => res.json({ data: jobs }));
const allowedTransitions = { assigned: 'accepted', accepted: 'on_the_way', on_the_way: 'reached_location', reached_location: 'inspection_started', inspection_started: 'work_in_progress', work_in_progress: 'completed' };
app.patch('/api/jobs/:id/status', auth(['technician', 'super_admin']), (req, res) => { const job = jobs.find((j) => j.id === req.params.id); if (!job) return res.status(404).json({ error: 'Job not found' }); if (allowedTransitions[job.status] !== req.body.status) return res.status(409).json({ error: `Job must move from ${job.status} to ${allowedTransitions[job.status]}` }); if (req.body.status === 'completed' && !/^\d{4,6}$/.test(req.body.customerOtp || '')) return res.status(422).json({ error: 'Valid customer OTP required' }); Object.assign(job, req.body, { updatedAt: new Date().toISOString() }); res.json(job); });
app.post('/api/uploads', auth(), upload.single('file'), (req, res) => { if (!req.file) return res.status(422).json({ error: 'A valid image or PDF is required' }); res.status(201).json({ url: `/uploads/${req.file.filename}`, kind: req.body.kind }); });
app.post('/api/ai/chat', auth(), (req, res) => { const text = String(req.body.message || ''); const reply = /shop|front|sign/i.test(text) ? 'I can help with that. What are the approximate width and height, preferred lighting, and installation location?' : 'Please share your business type, sign size, location, preferred material, lighting and whether installation is required. I can calculate an estimate, but an Admin must approve the final quotation.'; res.json({ reply, actions: ['Calculate Price', 'Request Design', 'Talk to Support'], disclaimer: 'Concept and guidance only; feasibility and delivery require Admin review.' }); });
app.get('/api/admin/dashboard', auth(['super_admin']), async (_, res, next) => {
  try {
    const data = database.isConfigured()
      ? await database.dashboard()
      : { customers: 1, newOrders: orders.length, activeServices: services.length, technicians: 1, pendingJobs: jobs.filter((job) => job.status !== 'completed').length, recentOrders: orders.slice(0, 5), recentServices: services.slice(0, 5) };
    res.json(data);
  } catch (error) { next(error); }
});
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _, res, __) => res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : (err.status || 500)).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds 8 MB' : (process.env.NODE_ENV === 'production' ? 'Unexpected server error' : err.message) }));
app.get('/api/admin/dashboard', auth(['super_admin']), (_, res) => res.json({ customers: 1248, newOrders: orders.length, activeServices: services.length, technicians: 18, pendingJobs: jobs.filter((j) => j.status !== 'completed').length, recentOrders: orders.slice(0, 5), recentServices: services.slice(0, 5) }));
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _, res, __) => res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 500).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds 8 MB' : (process.env.NODE_ENV === 'production' ? 'Unexpected server error' : err.message) }));
if (require.main === module) app.listen(process.env.PORT || 4000, () => console.log('SignFix API listening on port 4000'));
module.exports = app;
