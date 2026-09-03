const database = require('../database');
const { businessId } = require('../utils/ids');
async function list(req, res) { const data = await database.listOrders(req.user, req.query); res.json({ data, page: Number(req.query.page || 1), total: data.length }); }
async function create(req, res) { res.status(201).json(await database.createOrder(req.user,req.body,businessId('SB-ORD'))); }
async function detail(req,res){res.json(await database.getOrder(req.params.id,req.user));}
async function update(req,res){res.json(await database.updateOrder(req.params.id,req.body,req.user));}
async function updateStatus(req, res) { res.json(await database.updateOrderStatus(req.params.id, req.body.status, req.user)); }
async function reviewDesign(req,res){res.json(await database.reviewOrderDesign(req.params.id,req.params.designId,req.body,req.user));}
module.exports = { list, create, detail, update, updateStatus, reviewDesign };
