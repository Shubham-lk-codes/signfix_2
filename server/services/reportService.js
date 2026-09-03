const database = require("../database");
const supported = [
  "sales",
  "orders",
  "quotations",
  "services",
  "technicians",
  "customers",
  "products",
  "locations",
  "revenue",
  "pending-jobs",
  "completed-jobs",
  "ai-leads",
  "conversion-rate",
  "payments",
  "reviews",
];
function dateFilter(query, column) {
  const values = [],
    where = [];
  if (query.from) {
    values.push(query.from);
    where.push(`${column}>=$${values.length}::date`);
  }
  if (query.to) {
    values.push(query.to);
    where.push(`${column}<($${values.length}::date+INTERVAL '1 day')`);
  }
  return { values, sql: where.length ? `WHERE ${where.join(" AND ")}` : "" };
}
const money = (v) => Number(v || 0);
async function generate(type, query = {}) {
  if (!supported.includes(type))
    throw Object.assign(new Error("Unsupported report"), { status: 404 });
  const pool = database.getPool();
  let rows = [],
    summary = {},
    f;
  if (type === "sales" || type === "revenue") {
    f = dateFilter(query, "q.updated_at");
    rows = (
      await pool.query(
        `SELECT q.quotation_no AS "quotationNo",o.order_no AS "orderNo",u.name AS customer,q.subtotal,q.discount,q.gst,q.final_amount AS revenue,q.status,q.updated_at AS date FROM quotations q JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id JOIN users u ON u.id=c.user_id ${f.sql}${f.sql ? " AND" : " WHERE"} q.status='approved' ORDER BY q.updated_at DESC`,
        f.values,
      )
    ).rows;
    summary = {
      transactions: rows.length,
      grossRevenue: rows.reduce((s, r) => s + money(r.revenue), 0),
      discounts: rows.reduce((s, r) => s + money(r.discount), 0),
      gst: rows.reduce((s, r) => s + money(r.gst), 0),
    };
  } else if (type === "orders") {
    f = dateFilter(query, "o.created_at");
    rows = (
      await pool.query(
        `SELECT o.order_no AS "orderId",u.name AS customer,o.specifications->>'product' AS product,o.estimated_price AS amount,o.status,o.created_at AS date FROM orders o JOIN customers c ON c.id=o.customer_id JOIN users u ON u.id=c.user_id ${f.sql} ORDER BY o.created_at DESC`,
        f.values,
      )
    ).rows;
    summary = {
      total: rows.length,
      totalValue: rows.reduce((s, r) => s + money(r.amount), 0),
      completed: rows.filter((r) => r.status === "completed").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
    };
  } else if (type === "quotations") {
    f = dateFilter(query, "q.updated_at");
    rows = (
      await pool.query(
        `SELECT q.quotation_no AS "quotationNo",o.order_no AS "orderNo",u.name AS customer,q.final_amount AS amount,q.status,q.valid_until AS "validUntil",q.updated_at AS date FROM quotations q JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id JOIN users u ON u.id=c.user_id ${f.sql} ORDER BY q.updated_at DESC`,
        f.values,
      )
    ).rows;
    summary = {
      total: rows.length,
      totalValue: rows.reduce((s, r) => s + money(r.amount), 0),
      approved: rows.filter((r) => r.status === "approved").length,
      conversionRate: rows.length
        ? rows.filter((r) => r.status === "approved").length / rows.length
        : 0,
    };
  } else if (type === "services") {
    f = dateFilter(query, "s.created_at");
    rows = (
      await pool.query(
        `SELECT s.ticket_no AS "ticketId",u.name AS customer,s.category,s.priority,tu.name AS technician,s.status,s.created_at AS date FROM service_tickets s JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=c.user_id LEFT JOIN technician_jobs j ON j.ticket_id=s.id LEFT JOIN technicians t ON t.id=j.technician_id LEFT JOIN users tu ON tu.id=t.user_id ${f.sql} ORDER BY s.created_at DESC`,
        f.values,
      )
    ).rows;
    summary = {
      total: rows.length,
      open: rows.filter(
        (r) => !["completed", "closed", "cancelled"].includes(r.status),
      ).length,
      completed: rows.filter((r) => ["completed", "closed"].includes(r.status))
        .length,
      emergency: rows.filter((r) => r.priority === "emergency").length,
    };
  } else if (type === "technicians") {
    f = dateFilter(query, "j.scheduled_at");
    rows = (
      await pool.query(
        `SELECT u.name AS technician,COUNT(j.id)::int assigned,COUNT(j.id) FILTER(WHERE j.status='accepted')::int accepted,COUNT(j.id) FILTER(WHERE j.status IN ('completed','closed'))::int completed,ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(j.closed_at,j.work_completed_at)-j.accepted_at))/3600) FILTER(WHERE j.accepted_at IS NOT NULL AND (j.closed_at IS NOT NULL OR j.work_completed_at IS NOT NULL)),1) AS "averageHours",ROUND(AVG(r.rating),1) rating FROM technicians t JOIN users u ON u.id=t.user_id LEFT JOIN technician_jobs j ON j.technician_id=t.id ${f.sql ? f.sql.replace("WHERE", "AND") : ""} LEFT JOIN reviews r ON r.job_id=j.id GROUP BY t.id,u.id ORDER BY completed DESC`,
        f.values,
      )
    ).rows;
    summary = {
      technicians: rows.length,
      assigned: rows.reduce((s, r) => s + r.assigned, 0),
      completed: rows.reduce((s, r) => s + r.completed, 0),
    };
  } else if (type === "customers") {
    f = dateFilter(query, "u.created_at");
    rows = (
      await pool.query(
        `SELECT c.id,u.name,u.email,u.mobile,c.company_name AS company,u.status,u.created_at AS date,(SELECT COUNT(*)::int FROM orders o WHERE o.customer_id=c.id) orders FROM customers c JOIN users u ON u.id=c.user_id ${f.sql} ORDER BY u.created_at DESC`,
        f.values,
      )
    ).rows;
    summary = {
      total: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      newCustomers: rows.length,
      totalOrders: rows.reduce((s, r) => s + r.orders, 0),
    };
  } else if (type === "products") {
    f = dateFilter(query, "o.created_at");
    rows = (
      await pool.query(
        `SELECT p.name AS product,p.category,p.pricing_method AS "pricingMethod",p.base_price AS "configuredPrice",COUNT(o.id)::int orders,COALESCE(SUM(o.estimated_price),0) AS "orderValue" FROM products p LEFT JOIN orders o ON o.specifications->>'product'=p.name ${f.sql ? f.sql.replace("WHERE", "AND") : ""} GROUP BY p.id ORDER BY orders DESC,p.name`,
        f.values,
      )
    ).rows;
    summary = {
      products: rows.length,
      totalOrders: rows.reduce((s, r) => s + r.orders, 0),
      orderValue: rows.reduce((s, r) => s + money(r.orderValue), 0),
    };
  } else if (type === "locations") {
    f = dateFilter(query, "s.created_at");
    rows = (
      await pool.query(
        `SELECT COALESCE(s.location->>'city',s.location->>'address','Unknown') location,COUNT(*)::int requests,COUNT(*) FILTER(WHERE s.status IN ('completed','closed'))::int completed FROM service_tickets s ${f.sql} GROUP BY 1 ORDER BY requests DESC`,
        f.values,
      )
    ).rows;
    summary = {
      locations: rows.length,
      requests: rows.reduce((s, r) => s + r.requests, 0),
      completed: rows.reduce((s, r) => s + r.completed, 0),
    };
  } else if (type === "pending-jobs" || type === "completed-jobs") {
    f = dateFilter(query, "j.scheduled_at");
    const state =
      type === "completed-jobs"
        ? "j.status IN ('completed','closed')"
        : "j.status NOT IN ('completed','closed','cancelled')";
    rows = (
      await pool.query(
        `SELECT j.id,s.ticket_no AS "ticketId",cu.name AS customer,tu.name AS technician,s.priority,j.status,j.scheduled_at AS date FROM technician_jobs j JOIN service_tickets s ON s.id=j.ticket_id JOIN customers c ON c.id=s.customer_id JOIN users cu ON cu.id=c.user_id LEFT JOIN technicians t ON t.id=j.technician_id LEFT JOIN users tu ON tu.id=t.user_id ${f.sql}${f.sql ? " AND" : " WHERE"} ${state} ORDER BY j.scheduled_at DESC NULLS LAST`,
        f.values,
      )
    ).rows;
    summary = {
      jobs: rows.length,
      emergency: rows.filter((r) => r.priority === "emergency").length,
    };
  } else if (type === "ai-leads") {
    f = dateFilter(query, "l.created_at");
    rows = (
      await pool.query(
        `SELECT l.id,u.name AS customer,l.requirement,l.product,l.estimated_budget AS "estimatedBudget",l.contact,l.status,l.created_at AS date FROM ai_leads l LEFT JOIN customers c ON c.id=l.customer_id LEFT JOIN users u ON u.id=c.user_id ${f.sql} ORDER BY l.created_at DESC`,
        f.values,
      )
    ).rows;
    summary = {
      total: rows.length,
      qualified: rows.filter((r) => r.status === "qualified").length,
      won: rows.filter((r) => r.status === "won").length,
      estimatedBudget: rows.reduce((s, r) => s + money(r.estimatedBudget), 0),
    };
  } else if (type === "conversion-rate") {
    f = dateFilter(query, "l.created_at");
    rows = (
      await pool.query(
        `SELECT l.status,COUNT(*)::int leads,COALESCE(SUM(l.estimated_budget),0) AS "estimatedBudget" FROM ai_leads l ${f.sql} GROUP BY l.status ORDER BY leads DESC`,
        f.values,
      )
    ).rows;
    const total = rows.reduce((s, r) => s + r.leads, 0),
      won = rows.find((r) => r.status === "won")?.leads || 0,
      qualified = rows
        .filter((r) => ["qualified", "quotation", "won"].includes(r.status))
        .reduce((s, r) => s + r.leads, 0);
    summary = {
      totalLeads: total,
      qualifiedLeads: qualified,
      wonLeads: won,
      qualificationRate: total ? qualified / total : 0,
      conversionRate: total ? won / total : 0,
    };
  } else if (type === "payments") {
    f = dateFilter(query, "p.created_at");
    rows = (
      await pool.query(
        `SELECT p.id,p.reference,q.quotation_no AS "quotationNo",u.name AS customer,p.amount,p.refunded_amount AS "refundedAmount",p.currency,p.provider,p.status,p.created_at AS date FROM payments p JOIN quotations q ON q.id=p.quotation_id JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id JOIN users u ON u.id=c.user_id ${f.sql} ORDER BY p.id DESC`,
        f.values,
      )
    ).rows;
    summary = {
      payments: rows.length,
      captured: rows.filter((r) =>
        ["captured", "partially_refunded"].includes(r.status),
      ).length,
      capturedValue: rows
        .filter((r) => ["captured", "partially_refunded"].includes(r.status))
        .reduce((s, r) => s + money(r.amount) - money(r.refundedAmount), 0),
      refunded: rows.reduce((s, r) => s + money(r.refundedAmount), 0),
    };
  } else if (type === "reviews") {
    f = dateFilter(query, "r.created_at");
    rows = (
      await pool.query(
        `SELECT r.id,u.name AS customer,s.ticket_no AS "ticketId",tu.name AS technician,r.rating,r.comment,r.created_at AS date FROM reviews r JOIN customers c ON c.id=r.customer_id JOIN users u ON u.id=c.user_id JOIN technician_jobs j ON j.id=r.job_id JOIN service_tickets s ON s.id=j.ticket_id LEFT JOIN technicians t ON t.id=j.technician_id LEFT JOIN users tu ON tu.id=t.user_id ${f.sql} ORDER BY r.id DESC`,
        f.values,
      )
    ).rows;
    summary = {
      reviews: rows.length,
      averageRating: rows.length
        ? rows.reduce((s, r) => s + Number(r.rating), 0) / rows.length
        : 0,
      fiveStar: rows.filter((r) => Number(r.rating) === 5).length,
    };
  }
  return {
    type,
    filters: { from: query.from || null, to: query.to || null },
    generatedAt: new Date().toISOString(),
    summary,
    columns: rows[0] ? Object.keys(rows[0]) : [],
    rows,
  };
}
module.exports = { generate, supported };
