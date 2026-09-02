const router = require('express').Router();
const database = require('../database');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { z } = require('zod');
const { uploadDir } = require('../config');
const authRoutes = require('./authRoutes');
const catalogRoutes = require('../admin/routes/catalogRoutes');
const orderRoutes = require('./orderRoutes');
const serviceRoutes = require('./serviceRoutes');
const jobRoutes = require('./jobRoutes');
const customerRoutes = require('../customer/routes/customerRoutes');
const quotationRoutes = require('../admin/routes/quotationRoutes');
const technicianRoutes = require('../technician/routes/technicianRoutes');
const customerLocationRoutes = require('../customer/routes/locationRoutes');
const technicianLocationRoutes = require('../technician/routes/locationRoutes');
const serviceAreaRoutes = require('../admin/routes/serviceAreaRoutes');
const customerAdminRoutes = require('../admin/routes/customerAdminRoutes');
const operationsRoutes = require('../admin/routes/operationsRoutes');
const qrRoutes = require('./qrRoutes');
const aiManagementRoutes = require('../admin/routes/aiManagementRoutes');
const settingsRoutes = require('../admin/routes/settingsRoutes');
const paymentRoutes = require('./paymentRoutes');
const serviceAreaController = require('../admin/controllers/serviceAreaController');
const calculator = require('../controllers/calculatorController');
const dashboard = require('../admin/controllers/dashboardController');
const misc = require('../controllers/miscController');
const notifications = require('../admin/controllers/notificationController');
const validate = require('../middleware/validate');
const { authenticate, authorize, permit } = require('../middleware/auth');
const allowedUploads = new Map([['image/jpeg','.jpg'],['image/png','.png'],['image/webp','.webp'],['image/gif','.gif'],['application/pdf','.pdf']]);
const uploadTypesByExtension = new Map([['.jpg','image/jpeg'],['.jpeg','image/jpeg'],['.png','image/png'],['.webp','image/webp'],['.gif','image/gif'],['.pdf','application/pdf']]);
function normalizeUploadType(file) {
  if (allowedUploads.has(file.mimetype)) return file.mimetype;
  // Some browser clients label byte-based multipart files as octet-stream.
  if (file.mimetype === 'application/octet-stream') return uploadTypesByExtension.get(path.extname(file.originalname).toLowerCase());
  return undefined;
}
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_, file, cb) => cb(null, `${crypto.randomUUID()}${allowedUploads.get(file.mimetype)}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_, file, cb) => {
    const mimetype = normalizeUploadType(file);
    if (!mimetype) return cb(Object.assign(new Error('Only JPEG, PNG, WebP, GIF, or PDF files are allowed'), { status: 415 }));
    file.mimetype = mimetype;
    cb(null, true);
  },
});
const secureImageUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},fileFilter:(_,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))});
function validImageSignature(file){const b=file.buffer;return file.mimetype==='image/jpeg'&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff||file.mimetype==='image/png'&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||file.mimetype==='image/webp'&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP';}

router.get('/health', misc.health);
router.use('/auth', authRoutes);
router.use('/payments',paymentRoutes);
router.use('/catalog', catalogRoutes);
router.use('/orders', orderRoutes);
router.use('/services', serviceRoutes);
router.use('/jobs', jobRoutes);
router.use('/customer/location',customerLocationRoutes);
router.use('/customer', customerRoutes);
router.use('/quotations',quotationRoutes);
router.use('/technician/location',technicianLocationRoutes);
router.use('/technician',technicianRoutes);
router.use('/admin/service-areas',serviceAreaRoutes);
router.use('/admin/customers', customerAdminRoutes);
router.use('/admin/operations', operationsRoutes);
router.use('/qr', qrRoutes);
router.use('/admin/ai', aiManagementRoutes);
router.use('/admin/settings',settingsRoutes);
router.get('/admin/whatsapp-notifications',authenticate,authorize('super_admin','admin','service_manager'),serviceAreaController.notificationLogs);
router.get('/products', authenticate, permit('product.view'), (req, res, next) => { req.params.resource = 'products'; require('../admin/controllers/catalogController').list(req, res, next); });
router.post('/calculator', authenticate, validate(z.object({ product: z.string(), length: z.coerce.number().positive(), width: z.coerce.number().positive(), unit:z.enum(['ft','in','cm','m']).default('ft'), quantity: z.coerce.number().int().positive().default(1), material: z.string().optional(), lighting: z.string().optional(), installation: z.union([z.boolean(),z.string()]).optional(), transportation: z.boolean().optional(), design: z.boolean().optional(), electricalWork:z.boolean().optional(),mountingStructure:z.boolean().optional(), accessories:z.union([z.boolean(),z.string()]).optional(),customization:z.boolean().optional(),discount:z.coerce.number().min(0).optional() })), calculator.calculate);
router.get('/admin/dashboard', authenticate, authorize('super_admin', 'admin', 'sales_manager', 'service_manager', 'technician_manager'), dashboard.dashboard);
router.post('/uploads', authenticate, upload.single('file'), (req, res) => req.file ? res.status(201).json({ url: `/api/uploads/${req.file.filename}`, kind: req.body.kind }) : res.status(422).json({ error: 'A valid image or PDF is required' }));
router.post('/admin/settings/logo',authenticate,authorize('super_admin','admin'),secureImageUpload.single('file'),async(req,res)=>{if(!req.file||!validImageSignature(req.file))return res.status(415).json({error:'A valid JPEG, PNG, or WebP image is required'});if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)return res.status(503).json({error:'Secure Cloudinary image storage is not configured'});const cloudinary=require('cloudinary').v2;cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET});const result=await new Promise((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:'signfix/company',public_id:'company-logo',overwrite:true,resource_type:'image',transformation:[{width:1000,height:1000,crop:'limit'},{quality:'auto',fetch_format:'auto'}]},(error,value)=>error?reject(error):resolve(value));stream.end(req.file.buffer)});await database.getPool().query('INSERT INTO audit_logs(user_id,action,entity_type,metadata) VALUES($1,$2,$3,$4::jsonb)',[req.user.id,'settings.logo.upload','settings',JSON.stringify({publicId:result.public_id,bytes:result.bytes})]);res.status(201).json({url:result.secure_url,width:result.width,height:result.height});});
router.get('/uploads/:filename', authenticate, (req,res,next)=>{const filename=path.basename(req.params.filename);if(filename!==req.params.filename)return res.status(400).json({error:'Invalid filename'});res.sendFile(path.join(uploadDir,filename),error=>{if(error&&!res.headersSent)next(Object.assign(error,{status:error.statusCode||404}))});});
router.post('/ai/chat', authenticate, misc.aiChat);
router.get('/reports/:type/export', authenticate, permit('reports.export'), misc.exportReport);
router.get('/reports/:type', authenticate, permit('reports.view'), misc.report);
router.get('/notifications/status', authenticate, authorize('super_admin', 'admin'), notifications.status);
router.get('/notifications/templates',authenticate,authorize('super_admin','admin'),notifications.templates);
router.post('/notifications/templates',authenticate,authorize('super_admin','admin'),notifications.createTemplate);
router.patch('/notifications/templates/:id',authenticate,authorize('super_admin','admin'),notifications.updateTemplate);
router.delete('/notifications/templates/:id',authenticate,authorize('super_admin','admin'),notifications.deleteTemplate);
router.post('/notifications/dispatch',authenticate,authorize('super_admin','admin'),notifications.dispatch);
router.get('/notifications/deliveries',authenticate,authorize('super_admin','admin'),notifications.deliveries);
router.post('/notifications/register', authenticate, validate(z.object({ token:z.string().min(20), platform:z.enum(['web','android','ios']).optional() })), notifications.register);
router.post('/notifications/send', authenticate, authorize('super_admin', 'admin'), validate(z.object({ title:z.string().min(2).max(160), body:z.string().min(2).max(1000), audience:z.enum(['all','customers','technicians','admins']).default('all'), data:z.record(z.any()).optional() })), notifications.send);
module.exports = router;
