const database = require('../database');
const { businessId } = require('../utils/ids');
async function list(req, res) { const data = await database.listOrders(req.user, req.query); res.json({ data, page: Number(req.query.page || 1), total: data.length }); }
async function create(req, res) { res.status(201).json(await database.createOrder(req.user, req.body, businessId('SB-ORD'))); }
async function updateStatus(req, res) { res.json(await database.updateOrderStatus(req.params.id, req.body.status, req.user)); }
module.exports = { list, create, updateStatus };
