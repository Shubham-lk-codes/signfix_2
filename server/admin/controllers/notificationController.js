const database = require('../../database');
const firebase = require('../../services/firebaseService');
const delivery = require('../../services/notificationService');

async function register(req, res) {
  await database.registerDeviceToken(req.user.id, req.body.token, req.body.platform || 'web');
  res.status(201).json({ registered: true });
}

async function send(req, res) {
  const { title, body, audience = 'all', data = {} } = req.body;
  const recipients = await database.notificationRecipients(audience);
  const result = await firebase.sendToTokens(recipients.map(row => row.token), { title, body }, data);
  await database.createBulkNotifications(recipients, { title, body, channel: 'push' }, req.user);
  res.status(201).json({ audience, recipients: recipients.length, ...result });
}

async function status(req, res) { res.json({ configured: firebase.isConfigured(),providers:delivery.providerStatus() }); }
async function templates(req,res){res.json({data:(await database.getPool().query('SELECT id,name,event_key AS "eventKey",category,title,body,channels,status,updated_at AS "updatedAt" FROM notification_templates ORDER BY category,name')).rows});}
async function createTemplate(req,res){const b=req.body,{rows}=await database.getPool().query('INSERT INTO notification_templates(name,event_key,category,title,body,channels,status) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING id,name,event_key AS "eventKey",category,title,body,channels,status',[b.name,b.eventKey,b.category,b.title,b.body,JSON.stringify(b.channels),b.status]);res.status(201).json(rows[0]);}
async function updateTemplate(req,res){const b=req.body,{rows}=await database.getPool().query('UPDATE notification_templates SET name=COALESCE($2,name),event_key=COALESCE($3,event_key),category=COALESCE($4,category),title=COALESCE($5,title),body=COALESCE($6,body),channels=COALESCE($7::jsonb,channels),status=COALESCE($8,status),updated_at=NOW() WHERE id=$1 RETURNING id,name,event_key AS "eventKey",category,title,body,channels,status',[req.params.id,b.name,b.eventKey,b.category,b.title,b.body,b.channels?JSON.stringify(b.channels):null,b.status]);if(!rows[0])throw Object.assign(new Error('Template not found'),{status:404});res.json(rows[0]);}
async function deleteTemplate(req,res){await database.getPool().query('UPDATE notification_templates SET status=FALSE,updated_at=NOW() WHERE id=$1',[req.params.id]);res.status(204).end();}
async function dispatch(req,res){const template=(await database.getPool().query('SELECT id,title,body,channels,category FROM notification_templates WHERE id=$1 AND status=TRUE',[req.body.templateId])).rows[0];if(!template)throw Object.assign(new Error('Active template not found'),{status:404});const roles={customers:['customer'],technicians:['technician'],admins:['super_admin','admin','sales_manager','service_manager','technician_manager']},params=[],conditions=["u.status='active'"];if(roles[req.body.audience]){params.push(roles[req.body.audience]);conditions.push(`r.name=ANY($${params.length})`)}if(template.category==='payment'){conditions.push('EXISTS(SELECT 1 FROM customers c WHERE c.user_id=u.id AND c.payments_enabled=TRUE)')}const users=(await database.getPool().query(`SELECT u.id,u.name,u.email,u.mobile FROM users u JOIN roles r ON r.id=u.role_id WHERE ${conditions.join(' AND ')}`,params)).rows,channels=req.body.channels?.length?req.body.channels:template.channels;const result=await delivery.send({users,template,channels,variables:req.body.variables||{}});res.status(201).json(result);}
async function deliveries(req,res){res.json({data:(await database.getPool().query(`SELECT d.id,u.email,d.channel,d.title,d.status,d.error_message AS "errorMessage",d.created_at AS "createdAt" FROM notification_deliveries d LEFT JOIN users u ON u.id=d.user_id ORDER BY d.id DESC LIMIT 200`)).rows});}
module.exports = { register, send, status, templates, createTemplate, updateTemplate, deleteTemplate, dispatch, deliveries };
