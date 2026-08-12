const { Pool } = require('pg');

let pool;

function isConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!isConfigured()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_SIZE || 10),
    });
  }
  return pool;
}

async function health() {
  if (!isConfigured()) return { mode: 'memory', connected: true };
  await getPool().query('SELECT 1');
  return { mode: 'neon-postgres', connected: true };
}

async function findUserByEmail(email) {
  const { rows } = await getPool().query(
    `SELECT u.id, u.name, u.email, u.password_hash AS "passwordHash", r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.email = $1 AND u.status = 'active' LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

async function listOrders(user) {
  const params = [];
  let where = '';
  if (user.role === 'customer') {
    where = 'WHERE u.email = $1';
    params.push(user.email);
  }
  const { rows } = await getPool().query(
    `SELECT o.order_no AS id, o.specifications, o.estimated_price AS "estimatedPrice",
            o.status, o.created_at AS "createdAt", u.email AS "createdBy"
       FROM orders o JOIN customers c ON c.id=o.customer_id JOIN users u ON u.id=c.user_id
       ${where} ORDER BY o.created_at DESC LIMIT 100`,
    params,
  );
  return rows.map((row) => ({ ...row, ...(row.specifications || {}) }));
}

async function createOrder(user, data, orderNo) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const { rows: customers } = await client.query(
      'SELECT c.id FROM customers c JOIN users u ON u.id=c.user_id WHERE u.email=$1 LIMIT 1',
      [user.email],
    );
    if (!customers[0]) throw Object.assign(new Error('Customer profile not found'), { status: 422 });
    await client.query(
      'INSERT INTO orders(order_no,customer_id,specifications,estimated_price,status) VALUES($1,$2,$3::jsonb,$4,$5)',
      [orderNo, customers[0].id, JSON.stringify(data), data.estimatedPrice || 0, 'under_review'],
    );
    await client.query('COMMIT');
    return { ...data, id: orderNo, createdBy: user.email, status: 'under_review', createdAt: new Date().toISOString() };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listServices(user) {
  const params = [];
  let where = '';
  if (user.role === 'customer') { where = 'WHERE u.email=$1'; params.push(user.email); }
  const { rows } = await getPool().query(
    `SELECT s.ticket_no AS id,s.category,s.description,s.location,s.photos,s.priority,s.status,
            s.created_at AS "createdAt",u.email AS "createdBy"
       FROM service_tickets s JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=c.user_id
       ${where} ORDER BY s.created_at DESC LIMIT 100`, params,
  );
  return rows;
}

async function createService(user, data, ticketNo) {
  const { rows: customers } = await getPool().query(
    'SELECT c.id FROM customers c JOIN users u ON u.id=c.user_id WHERE u.email=$1 LIMIT 1', [user.email],
  );
  if (!customers[0]) throw Object.assign(new Error('Customer profile not found'), { status: 422 });
  await getPool().query(
    'INSERT INTO service_tickets(ticket_no,customer_id,category,description,location,photos,priority,status) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8)',
    [ticketNo, customers[0].id, data.category, data.description, JSON.stringify({ address: data.address, latitude: data.latitude, longitude: data.longitude }), JSON.stringify(data.photos || []), data.priority || 'normal', 'submitted'],
  );
  return { ...data, id: ticketNo, createdBy: user.email, status: 'submitted', createdAt: new Date().toISOString(), message: 'Your service request has been submitted.' };
}

async function dashboard() {
  const { rows } = await getPool().query(`
    SELECT
      (SELECT COUNT(*)::int FROM customers) AS customers,
      (SELECT COUNT(*)::int FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS "newOrders",
      (SELECT COUNT(*)::int FROM service_tickets WHERE status NOT IN ('closed','completed')) AS "activeServices",
      (SELECT COUNT(*)::int FROM technicians) AS technicians,
      (SELECT COUNT(*)::int FROM technician_jobs WHERE status <> 'completed') AS "pendingJobs"
  `);
  const { rows: recentOrders } = await getPool().query(
    'SELECT order_no AS id, estimated_price AS "estimatedPrice", status, created_at AS "createdAt" FROM orders ORDER BY created_at DESC LIMIT 5',
  );
  const { rows: recentServices } = await getPool().query(
    'SELECT ticket_no AS id, category, priority, status, created_at AS "createdAt" FROM service_tickets ORDER BY created_at DESC LIMIT 5',
  );
  return { ...rows[0], recentOrders, recentServices };
}

module.exports = { isConfigured, health, findUserByEmail, listOrders, createOrder, listServices, createService, dashboard };
