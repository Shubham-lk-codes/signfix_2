const database = require('../database');
const { businessId } = require('../utils/ids');
async function list(req, res) { const data = await database.listOrders(req.user, req.query); res.json({ data, page: Number(req.query.page || 1), total: data.length }); }
async function create(req, res) { res.status(201).json(await database.createOrder(req.user,req.body,businessId('SB-ORD'))); }
async function detail(req,res){const order=await database.getOrder(req.params.id,req.user),pool=database.getPool();const[payments,services]=await Promise.all([pool.query(`SELECT p.id,p.amount,p.status,p.reference,p.provider,p.created_at AS "createdAt" FROM payments p JOIN quotations q ON q.id=p.quotation_id WHERE q.order_id=$1 ORDER BY p.id DESC`,[order.databaseId]),pool.query(`SELECT s.ticket_no AS "ticketNo",s.status,j.id AS "jobId",j.status AS "jobStatus",tu.name AS technician FROM service_tickets s LEFT JOIN technician_jobs j ON j.ticket_id=s.id LEFT JOIN technicians t ON t.id=j.technician_id LEFT JOIN users tu ON tu.id=t.user_id WHERE s.order_id=$1 ORDER BY s.id DESC`,[order.databaseId])]);res.json({...order,payments:payments.rows,services:services.rows});}
async function update(req,res){res.json(await database.updateOrder(req.params.id,req.body,req.user));}
async function updateStatus(req, res) { res.json(await database.updateOrderStatus(req.params.id, req.body.status, req.user)); }
async function reviewDesign(req,res){res.json(await database.reviewOrderDesign(req.params.id,req.params.designId,req.body,req.user));}
module.exports = { list, create, detail, update, updateStatus, reviewDesign };
