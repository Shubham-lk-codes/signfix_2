const database = require('../../database');

async function list(req, res) { res.json(await database.listAdminCustomers(req.query)); }
async function create(req, res) { res.status(201).json(await database.createAdminCustomer(req.body, req.user)); }
async function detail(req, res) { const customer=await database.getAdminCustomer(req.params.id),pool=database.getPool();const[assets,activity]=await Promise.all([pool.query('SELECT asset_no AS "assetNo",details,warranty_until AS "warrantyUntil",created_at AS "createdAt" FROM sign_board_assets WHERE customer_id=$1 ORDER BY id DESC',[req.params.id]),pool.query(`SELECT a.id,a.action,a.entity_type AS "entityType",a.entity_id AS "entityId",a.metadata,a.created_at AS "createdAt" FROM audit_logs a WHERE a.user_id=$1 OR a.metadata->>'customerId'=$2 ORDER BY a.id DESC LIMIT 100`,[customer.userId,String(req.params.id)])]);res.json({...customer,assets:assets.rows,activity:activity.rows}); }
async function update(req, res) { res.json(await database.updateAdminCustomer(req.params.id, req.body, req.user)); }
async function disable(req, res) { res.json(await database.disableAdminCustomer(req.params.id, req.user)); }

module.exports = { list, create, detail, update, disable };
