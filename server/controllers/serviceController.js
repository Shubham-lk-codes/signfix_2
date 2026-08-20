const database = require('../database');
const { businessId } = require('../utils/ids');
async function list(req, res) { const data = await database.listServices(req.user, req.query); res.json({ data, page: Number(req.query.page || 1), total: data.length }); }
async function create(req, res) { const canSelectPriority=process.env.CUSTOMER_CAN_SELECT_SERVICE_PRIORITY==='true';const priority=req.user.role==='customer'&&!canSelectPriority?(req.body.category==='Emergency'?'emergency':'normal'):req.body.priority;res.status(201).json(await database.createService(req.user,{...req.body,priority},businessId('SB-SRV'))); }
async function update(req, res) { res.json(await database.updateService(req.params.id, req.body, req.user)); }
module.exports = { list, create, update };
