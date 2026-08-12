const mysql = require('mysql2/promise');

let pool;

function isConfigured() {
  return Boolean(process.env.DB_HOST);
}

function getPool() {
  if (!isConfigured()) return null;
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'signfix',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'signfix',
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
      timezone: 'Z',
      decimalNumbers: true,
    });
  }
  return pool;
}

async function health() {
  if (!isConfigured()) return { mode: 'memory', connected: true };
  await getPool().query('SELECT 1');
  return { mode: 'mysql', connected: true };
}

async function findUserByEmail(email) {
  const [rows] = await getPool().execute(
    `SELECT u.id, u.name, u.email, u.password_hash AS passwordHash, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.email = ? AND u.status = 'active' LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

async function listOrders(user) {
  const params = [];
  let where = '';
  if (user.role === 'customer') {
    where = 'WHERE u.email = ?';
    params.push(user.email);
  }
  const [rows] = await getPool().execute(
    `SELECT o.order_no AS id, o.specifications, o.estimated_price AS estimatedPrice,
            o.status, o.created_at AS createdAt, u.email AS createdBy
       FROM orders o JOIN customers c ON c.id=o.customer_id JOIN users u ON u.id=c.user_id
       ${where} ORDER BY o.created_at DESC LIMIT 100`,
    params,
  );
  return rows.map((row) => ({ ...row, ...(typeof row.specifications === 'string' ? JSON.parse(row.specifications) : row.specifications) }));
}

async function createOrder(user, data, orderNo) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const [customers] = await connection.execute(
      'SELECT c.id FROM customers c JOIN users u ON u.id=c.user_id WHERE u.email=? LIMIT 1',
      [user.email],
    );
    if (!customers[0]) throw Object.assign(new Error('Customer profile not found'), { status: 422 });
    await connection.execute(
      'INSERT INTO orders(order_no,customer_id,specifications,estimated_price,status) VALUES(?,?,?,?,?)',
      [orderNo, customers[0].id, JSON.stringify(data), data.estimatedPrice || 0, 'under_review'],
    );
    await connection.commit();
    return { ...data, id: orderNo, createdBy: user.email, status: 'under_review', createdAt: new Date().toISOString() };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

async function listServices(user) {
  const params = [];
  let where = '';
  if (user.role === 'customer') { where = 'WHERE u.email=?'; params.push(user.email); }
  const [rows] = await getPool().execute(
    `SELECT s.ticket_no AS id,s.category,s.description,s.location,s.photos,s.priority,s.status,
            s.created_at AS createdAt,u.email AS createdBy
       FROM service_tickets s JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=c.user_id
       ${where} ORDER BY s.created_at DESC LIMIT 100`, params,
  );
  return rows;
}

async function createService(user, data, ticketNo) {
  const [customers] = await getPool().execute(
    'SELECT c.id FROM customers c JOIN users u ON u.id=c.user_id WHERE u.email=? LIMIT 1', [user.email],
  );
  if (!customers[0]) throw Object.assign(new Error('Customer profile not found'), { status: 422 });
  await getPool().execute(
    'INSERT INTO service_tickets(ticket_no,customer_id,category,description,location,photos,priority,status) VALUES(?,?,?,?,?,?,?,?)',
    [ticketNo, customers[0].id, data.category, data.description, JSON.stringify({ address: data.address, latitude: data.latitude, longitude: data.longitude }), JSON.stringify(data.photos || []), data.priority || 'normal', 'submitted'],
  );
  return { ...data, id: ticketNo, createdBy: user.email, status: 'submitted', createdAt: new Date().toISOString(), message: 'Your service request has been submitted.' };
}

async function dashboard() {
  const [rows] = await getPool().query(`
    SELECT
      (SELECT COUNT(*) FROM customers) AS customers,
      (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL 30 DAY) AS newOrders,
      (SELECT COUNT(*) FROM service_tickets WHERE status NOT IN ('closed','completed')) AS activeServices,
      (SELECT COUNT(*) FROM technicians) AS technicians,
      (SELECT COUNT(*) FROM technician_jobs WHERE status <> 'completed') AS pendingJobs
  `);
  const [recentOrders] = await getPool().query(
    'SELECT order_no AS id, estimated_price AS estimatedPrice, status, created_at AS createdAt FROM orders ORDER BY created_at DESC LIMIT 5',
  );
  const [recentServices] = await getPool().query(
    'SELECT ticket_no AS id, category, priority, status, created_at AS createdAt FROM service_tickets ORDER BY created_at DESC LIMIT 5',
  );
  return { ...rows[0], recentOrders, recentServices };
}

module.exports = {
  isConfigured,
  health,
  findUserByEmail,
  listOrders,
  createOrder,
  listServices,
  createService,
  dashboard,
};
