const database = require('../database');
const notificationService = require('./notificationService');

const pool = () => database.getPool();
const STATUSES = ['draft', 'sent', 'viewed', 'change_requested', 'approved', 'rejected', 'expired', 'cancelled'];
const CUSTOMER_VISIBLE_STATUSES = ['sent', 'viewed', 'change_requested', 'approved', 'rejected', 'expired', 'cancelled'];
const CUSTOMER_ACTION_STATUSES = ['sent', 'viewed'];
const MAX_MONEY = 9999999999.99;

function httpError(message, status = 422, errorCode = 'QUOTATION_ERROR') {
  return Object.assign(new Error(message), { status, errorCode });
}

function decimal(value, name = 'amount') {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) throw httpError(`${name} must be a valid number`);
  return number;
}

function money(value) {
  const number = decimal(value);
  if (Math.abs(number) > MAX_MONEY) throw httpError(`Amount cannot exceed ${MAX_MONEY}`);
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

function isPastDate(value, now = new Date()) {
  if (!value) return false;
  const date = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date < now.toISOString().slice(0, 10);
}

function discountFor(type, value, base, maximumPercentage = 100) {
  const normalizedType = type || 'none';
  const amount = decimal(value, 'discount value');
  if (amount < 0) throw httpError('Discount cannot be negative');
  if (normalizedType === 'none') return 0;
  if (normalizedType === 'percentage') {
    if (amount > maximumPercentage || amount > 100) throw httpError(`Percentage discount cannot exceed ${Math.min(maximumPercentage, 100)}%`);
    return money(base * amount / 100);
  }
  if (normalizedType === 'fixed') {
    if (amount > base) throw httpError('Fixed discount cannot exceed the applicable amount');
    return money(amount);
  }
  throw httpError('Unsupported discount type');
}

function calculateQuotation(input, policy = {}) {
  const maximumDiscountPercentage = Math.min(100, Math.max(0, decimal(policy.maximumDiscountPercentage ?? 100)));
  const allowDiscounts = policy.allowDiscounts !== false;
  const gstEnabled = policy.gstEnabled !== false;
  const gstPercentage = gstEnabled ? decimal(input.gstPercentage ?? policy.defaultGstPercentage ?? 0, 'GST percentage') : 0;
  if (gstPercentage < 0 || gstPercentage > 100) throw httpError('GST percentage must be between 0 and 100');
  const sourceItems = input.items || [];
  if (!sourceItems.length) throw httpError('At least one quotation item is required');

  const items = sourceItems.map((item, index) => {
    const quantity = decimal(item.quantity, `Item ${index + 1} quantity`);
    const unitPrice = money(item.unitPrice);
    if (quantity <= 0) throw httpError(`Item ${index + 1} quantity must be greater than zero`);
    if (unitPrice < 0) throw httpError(`Item ${index + 1} unit price cannot be negative`);
    const lineSubtotal = money(quantity * unitPrice);
    const itemDiscountType = item.discountType || 'none';
    const itemDiscountValue = decimal(item.discountValue ?? 0);
    const discountAmount = allowDiscounts
      ? discountFor(itemDiscountType, itemDiscountValue, lineSubtotal, maximumDiscountPercentage)
      : 0;
    if (!allowDiscounts && itemDiscountValue > 0) throw httpError('Discounts are disabled in pricing settings');
    const taxPercentage = gstEnabled ? decimal(item.taxPercentage ?? gstPercentage, `Item ${index + 1} tax percentage`) : 0;
    if (taxPercentage < 0 || taxPercentage > 100) throw httpError(`Item ${index + 1} tax percentage must be between 0 and 100`);
    return {
      productId: item.productId || null,
      description: String(item.description || '').trim(),
      quantity,
      unit: String(item.unit || 'unit').trim(),
      unitPrice,
      discountType: itemDiscountType,
      discountValue: money(itemDiscountValue),
      discountAmount,
      taxPercentage,
      lineSubtotal,
      metadata: item.metadata || {},
    };
  });
  if (items.some((item) => !item.description)) throw httpError('Every quotation item requires a description');

  const charges = {
    installation: money(input.installation),
    transportation: money(input.transportation),
    design: money(input.design),
    accessories: money(input.accessories),
    otherCharges: money(input.otherCharges),
  };
  if (Object.values(charges).some((value) => value < 0)) throw httpError('Additional charges cannot be negative');
  const lineSubtotal = money(items.reduce((sum, item) => sum + item.lineSubtotal, 0));
  const itemDiscountAmount = money(items.reduce((sum, item) => sum + item.discountAmount, 0));
  const additionalCharges = money(Object.values(charges).reduce((sum, value) => sum + value, 0));
  const subtotal = money(lineSubtotal + additionalCharges);
  const afterItemDiscounts = money(subtotal - itemDiscountAmount);
  const discountType = input.discountType || 'none';
  const discountValue = money(input.discountValue);
  if (!allowDiscounts && discountValue > 0) throw httpError('Discounts are disabled in pricing settings');
  const quoteDiscountAmount = allowDiscounts
    ? discountFor(discountType, discountValue, afterItemDiscounts, maximumDiscountPercentage)
    : 0;
  const discountAmount = money(itemDiscountAmount + quoteDiscountAmount);
  const taxableAmount = money(subtotal - discountAmount);
  const globalDiscountFactor = afterItemDiscounts > 0 ? taxableAmount / afterItemDiscounts : 0;
  const calculatedItems = items.map((item) => {
    const netBeforeQuoteDiscount = money(item.lineSubtotal - item.discountAmount);
    const allocatedTaxable = money(netBeforeQuoteDiscount * globalDiscountFactor);
    const taxAmount = money(allocatedTaxable * item.taxPercentage / 100);
    return { ...item, taxAmount, lineTotal: money(netBeforeQuoteDiscount + taxAmount) };
  });
  const itemTaxAmount = money(calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0));
  const chargeTaxable = money(additionalCharges * globalDiscountFactor);
  const gstAmount = money(itemTaxAmount + chargeTaxable * gstPercentage / 100);
  const finalAmount = money(taxableAmount + gstAmount);
  return {
    items: calculatedItems,
    lineSubtotal,
    ...charges,
    additionalCharges,
    subtotal,
    discountType,
    discountValue,
    quoteDiscountAmount,
    itemDiscountAmount,
    discountAmount,
    taxableAmount,
    gstPercentage,
    gstAmount,
    finalAmount,
  };
}

async function pricingPolicy(client) {
  const row = (await client.query("SELECT value FROM settings WHERE setting_key='operations'")).rows[0];
  const operations = row?.value || {};
  return {
    gstEnabled: operations.taxSettings?.gstEnabled !== false,
    defaultGstPercentage: Number(operations.taxSettings?.defaultRate ?? 18),
    allowDiscounts: operations.pricingSettings?.allowDiscounts !== false,
    maximumDiscountPercentage: Number(operations.pricingSettings?.maximumDiscountPercentage ?? 100),
    currency: operations.currency || { code: 'INR', symbol: '₹', locale: 'en-IN' },
  };
}

async function nextQuotationNumber(client) {
  const year = new Date().getUTCFullYear();
  const sequence = (await client.query(
    `INSERT INTO business_sequences(sequence_key,current_value) VALUES($1,1)
     ON CONFLICT(sequence_key) DO UPDATE SET current_value=business_sequences.current_value+1,updated_at=NOW()
     RETURNING current_value`,
    [`quotation:${year}`],
  )).rows[0].current_value;
  return `SB-QUO-${year}-${String(sequence).padStart(6, '0')}`;
}

async function insertItems(client, quotationId, items) {
  await client.query('DELETE FROM quotation_items WHERE quotation_id=$1', [quotationId]);
  for (const item of items) {
    await client.query(
      `INSERT INTO quotation_items(quotation_id,product_id,description,quantity,unit,unit_price,discount_type,discount_value,discount_amount,tax_percentage,tax_amount,line_subtotal,line_total,amount,metadata)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13,$14::jsonb)`,
      [quotationId, item.productId, item.description, item.quantity, item.unit, item.unitPrice, item.discountType, item.discountValue, item.discountAmount, item.taxPercentage, item.taxAmount, item.lineSubtotal, item.lineTotal, JSON.stringify(item.metadata || {})],
    );
  }
}

async function history(client, quotationId, oldStatus, newStatus, userId, actorType, customerComment = null, internalNote = null) {
  await client.query(
    'INSERT INTO quotation_status_history(quotation_id,old_status,new_status,changed_by,actor_type,customer_comment,internal_note) VALUES($1,$2,$3,$4,$5,$6,$7)',
    [quotationId, oldStatus, newStatus, userId || null, actorType, customerComment, internalNote],
  );
}

async function audit(client, userId, action, quotationId, metadata) {
  await client.query(
    "INSERT INTO audit_logs(user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'quotation',$3,$4::jsonb)",
    [userId || null, action, quotationId, JSON.stringify(metadata || {})],
  );
}

const quotationSelect = `SELECT q.id,q.quotation_no AS "quotationNo",q.order_id AS "orderId",q.customer_id AS "customerId",q.version,q.lock_version AS "lockVersion",q.status,q.issue_date AS "issueDate",q.valid_until AS "validUntil",q.subtotal,q.installation,q.transportation,q.design,q.accessories,q.other_charges AS "otherCharges",q.discount_type AS "discountType",q.discount_value AS "discountValue",q.discount_amount AS "discountAmount",q.item_discount_amount AS "itemDiscountAmount",q.taxable_amount AS "taxableAmount",q.gst_rate AS "gstPercentage",q.gst AS "gstAmount",q.final_amount AS "finalAmount",q.terms,q.customer_notes AS "customerNotes",q.internal_notes AS "internalNotes",q.change_request_comment AS "changeRequestComment",q.rejection_reason AS "rejectionReason",q.sent_at AS "sentAt",q.viewed_at AS "viewedAt",q.approved_at AS "approvedAt",q.rejected_at AS "rejectedAt",q.change_requested_at AS "changeRequestedAt",q.expired_at AS "expiredAt",q.cancelled_at AS "cancelledAt",q.created_at AS "createdAt",q.updated_at AS "updatedAt",o.order_no AS "orderNo",o.specifications AS "orderSpecifications",o.status AS "orderStatus",u.name AS "customerName",u.email AS "customerEmail",u.mobile AS "customerPhone",c.company_name AS "company",c.address AS "customerAddress",c.payments_enabled AS "customerPaymentsEnabled",creator.name AS "createdBy",updater.name AS "updatedBy"
  FROM quotations q JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=q.customer_id JOIN users u ON u.id=c.user_id LEFT JOIN users creator ON creator.id=q.created_by LEFT JOIN users updater ON updater.id=q.updated_by`;

async function core(client, quotationNo, { ownerUserId, forUpdate = false } = {}) {
  const values = [quotationNo];
  const ownership = ownerUserId ? (values.push(ownerUserId), ` AND c.user_id=$${values.length}`) : '';
  const row = (await client.query(`${quotationSelect} WHERE q.quotation_no=$1${ownership}${forUpdate ? ' FOR UPDATE OF q' : ''}`, values)).rows[0];
  if (!row) throw httpError('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
  return row;
}

async function itemsFor(client, quotationId) {
  return (await client.query(
    `SELECT id,product_id AS "productId",description,quantity,unit,unit_price AS "unitPrice",discount_type AS "discountType",discount_value AS "discountValue",discount_amount AS "discountAmount",tax_percentage AS "taxPercentage",tax_amount AS "taxAmount",line_subtotal AS "lineSubtotal",line_total AS "lineTotal",metadata,created_at AS "createdAt",updated_at AS "updatedAt" FROM quotation_items WHERE quotation_id=$1 ORDER BY id`,
    [quotationId],
  )).rows;
}

function revisionSnapshot(row, items) {
  const { lockVersion, payments, history: statusHistory, revisions, auditTrail, ...quotation } = row;
  return { ...quotation, items };
}

async function saveRevisionSnapshot(client, row, items, userId) {
  await client.query(
    `INSERT INTO quotation_revisions(quotation_id,version,snapshot,created_by) VALUES($1,$2,$3::jsonb,$4)
     ON CONFLICT(quotation_id,version) DO UPDATE SET snapshot=EXCLUDED.snapshot,created_by=EXCLUDED.created_by,created_at=NOW()`,
    [row.id, row.version, JSON.stringify(revisionSnapshot(row, items)), userId || null],
  );
}

async function fullAdminDetail(client, quotationNo) {
  const row = await core(client, quotationNo);
  const [items, statusHistory, revisions, payments, auditTrail] = await Promise.all([
    itemsFor(client, row.id),
    client.query(`SELECT h.id,h.old_status AS "oldStatus",h.new_status AS "newStatus",h.actor_type AS "actorType",h.customer_comment AS "customerComment",h.internal_note AS "internalNote",u.name AS actor,h.created_at AS "createdAt" FROM quotation_status_history h LEFT JOIN users u ON u.id=h.changed_by WHERE h.quotation_id=$1 ORDER BY h.id DESC`, [row.id]),
    client.query(`SELECT r.id,r.version,r.snapshot->>'finalAmount' AS "finalAmount",u.name AS "createdBy",r.created_at AS "createdAt" FROM quotation_revisions r LEFT JOIN users u ON u.id=r.created_by WHERE r.quotation_id=$1 ORDER BY r.version DESC`, [row.id]),
    client.query(`SELECT id,amount,status,reference,payment_type AS type,provider,created_at AS "createdAt",updated_at AS "updatedAt" FROM payments WHERE quotation_id=$1 ORDER BY id DESC`, [row.id]),
    client.query(`SELECT a.id,a.action,a.metadata,u.name AS actor,a.created_at AS "createdAt" FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id WHERE a.entity_type='quotation' AND a.entity_id=$1 ORDER BY a.id DESC`, [row.id]),
  ]);
  return { ...row, items, statusHistory: statusHistory.rows, revisions: revisions.rows, payments: payments.rows, auditTrail: auditTrail.rows, availableActions: adminActions(row.status) };
}

function adminActions(status) {
  const actions = { draft: ['edit', 'send', 'download', 'cancel'], sent: ['view', 'create_revision', 'resend', 'download', 'cancel'], viewed: ['view', 'create_revision', 'download', 'cancel'], change_requested: ['view_request', 'create_revision', 'download', 'cancel'], approved: ['view', 'download'], rejected: ['view', 'download'], expired: ['view', 'download'], cancelled: ['view', 'download'] };
  return actions[status] || [];
}

function customerActions(status, validUntil) {
  if (!CUSTOMER_ACTION_STATUSES.includes(status)) return [];
  if (isPastDate(validUntil)) return [];
  return ['approve', 'request_changes', 'reject', 'download'];
}

function paymentCapability(enabled, status) {
  const configured = process.env.PAYMENT_GATEWAY_ENABLED === 'true'
    && process.env.PAYMENT_GATEWAY_PROVIDER === 'razorpay'
    && Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  return {
    enabled: Boolean(enabled && configured),
    provider: enabled && configured ? 'razorpay' : null,
    options: enabled && configured && status === 'approved' ? ['advance', 'full'] : [],
  };
}

async function notifyExpired(rows) {
  await Promise.allSettled(rows.map((row) => notificationService.sendEvent(row.userId, 'quotation.expired', 'Quotation expired', `Quotation ${row.quotationNo} has expired.`, { quotationNo: row.quotationNo, status: 'expired' })));
}

async function notifyExpiring() {
  const rows = (await pool().query(
    `SELECT q.quotation_no AS "quotationNo",q.version,c.user_id AS "userId"
     FROM quotations q JOIN customers c ON c.id=q.customer_id
     WHERE q.status IN ('sent','viewed') AND q.valid_until=CURRENT_DATE+1
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id=c.user_id AND n.event_key='quotation.expiring'
           AND n.data->>'quotationNo'=q.quotation_no AND n.data->>'version'=q.version::text
       )`,
  )).rows;
  await Promise.allSettled(rows.map((row) => notificationService.sendEvent(
    row.userId,
    'quotation.expiring',
    'Quotation expiring soon',
    `Quotation ${row.quotationNo} expires tomorrow.`,
    { quotationNo: row.quotationNo, version: row.version },
  )));
}

async function expireDue() {
  const client = await pool().connect();
  let changed = [];
  try {
    await client.query('BEGIN');
    changed = (await client.query(
      `SELECT q.id,q.quotation_no AS "quotationNo",q.status AS "oldStatus",c.user_id AS "userId" FROM quotations q JOIN customers c ON c.id=q.customer_id WHERE q.status IN ('sent','viewed') AND q.valid_until<CURRENT_DATE FOR UPDATE OF q`,
    )).rows;
    for (const row of changed) {
      await client.query(`UPDATE quotations SET status='expired',expired_at=NOW(),lock_version=lock_version+1,updated_at=NOW() WHERE id=$1`, [row.id]);
      await history(client, row.id, row.oldStatus, 'expired', null, 'system');
      await audit(client, null, 'quotation.expired', row.id, { quotationNo: row.quotationNo });
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  await notifyExpired(changed);
  await notifyExpiring().catch((error) => console.warn('Quotation expiry reminder failed:', error.message));
  return changed;
}

async function options() {
  const client = await pool().connect();
  try {
    const [orders, policy] = await Promise.all([
      client.query(`SELECT o.order_no AS "orderNo",o.status,o.specifications,o.estimated_price AS "estimatedPrice",c.id AS "customerId",u.name AS customer,u.email,u.mobile,c.company_name AS company,c.address FROM orders o JOIN customers c ON c.id=o.customer_id JOIN users u ON u.id=c.user_id WHERE o.status NOT IN ('completed','cancelled') ORDER BY o.created_at DESC LIMIT 100`),
      pricingPolicy(client),
    ]);
    return { orders: orders.rows, policy, statuses: STATUSES };
  } finally {
    client.release();
  }
}

async function adminList(query = {}) {
  await expireDue();
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(5, Number(query.pageSize) || 20));
  const values = [], clauses = [];
  if (query.status) {
    if (query.status === 'pending') clauses.push("q.status IN ('draft','sent','viewed','change_requested')");
    else {
      if (!STATUSES.includes(query.status)) throw httpError('Unsupported quotation status');
      values.push(query.status); clauses.push(`q.status=$${values.length}`);
    }
  }
  if (String(query.search || '').trim()) {
    values.push(`%${String(query.search).trim()}%`);
    clauses.push(`(q.quotation_no ILIKE $${values.length} OR o.order_no ILIKE $${values.length} OR u.name ILIKE $${values.length} OR COALESCE(u.mobile,'') ILIKE $${values.length} OR u.email ILIKE $${values.length} OR COALESCE(c.company_name,'') ILIKE $${values.length})`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const dataValues = [...values, pageSize, (page - 1) * pageSize];
  const [count, data] = await Promise.all([
    pool().query(`SELECT COUNT(*)::int AS total FROM quotations q JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=q.customer_id JOIN users u ON u.id=c.user_id ${where}`, values),
    pool().query(`SELECT q.quotation_no AS "quotationNo",o.order_no AS "orderNo",u.name AS customer,u.email,u.mobile,c.company_name AS company,q.final_amount AS "finalAmount",q.status,q.version,q.issue_date AS "issueDate",q.valid_until AS "validUntil",creator.name AS "createdBy",q.updated_at AS "updatedAt" FROM quotations q JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=q.customer_id JOIN users u ON u.id=c.user_id LEFT JOIN users creator ON creator.id=q.created_by ${where} ORDER BY q.updated_at DESC,q.id DESC LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`, dataValues),
  ]);
  const total = count.rows[0].total;
  return { data: data.rows, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

async function adminDetail(quotationNo) {
  await expireDue();
  return fullAdminDetail(pool(), quotationNo);
}

function persistedValues(calculated) {
  return [calculated.subtotal, calculated.installation, calculated.transportation, calculated.design, calculated.accessories, calculated.otherCharges, calculated.discountType, calculated.discountValue, calculated.discountAmount, calculated.itemDiscountAmount, calculated.taxableAmount, calculated.gstPercentage, calculated.gstAmount, calculated.finalAmount];
}

async function create(input, user) {
  const client = await pool().connect();
  let quotationNo;
  try {
    await client.query('BEGIN');
    const order = (await client.query(`SELECT o.id,o.customer_id,c.user_id,o.status FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.order_no=$1 FOR UPDATE OF o`, [input.orderNo])).rows[0];
    if (!order) throw httpError('Order not found', 404, 'ORDER_NOT_FOUND');
    if (['completed', 'cancelled'].includes(order.status)) throw httpError('A quotation cannot be created for this order', 409, 'ORDER_STATE_CONFLICT');
    const policy = await pricingPolicy(client);
    const calculated = calculateQuotation(input, policy);
    quotationNo = await nextQuotationNumber(client);
    const values = persistedValues(calculated);
    const row = (await client.query(
      `INSERT INTO quotations(quotation_no,order_id,customer_id,version,lock_version,status,issue_date,valid_until,subtotal,installation,transportation,design,accessories,other_charges,discount_type,discount_value,discount_amount,item_discount_amount,taxable_amount,gst_rate,gst,final_amount,terms,customer_notes,internal_notes,created_by,updated_by)
       VALUES($1,$2,$3,1,1,'draft',CURRENT_DATE,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING id,version`,
      [quotationNo, order.id, order.customer_id, input.validUntil, ...values, input.terms || '', input.customerNotes || null, input.internalNotes || null, user.id, user.id],
    )).rows[0];
    await insertItems(client, row.id, calculated.items);
    const snapshotRow = await core(client, quotationNo);
    await saveRevisionSnapshot(client, snapshotRow, calculated.items, user.id);
    await history(client, row.id, null, 'draft', user.id, 'admin', null, input.internalNotes || null);
    await audit(client, user.id, 'quotation.created', row.id, { quotationNo, orderNo: input.orderNo, version: 1, finalAmount: calculated.finalAmount });
    await client.query("UPDATE orders SET status='quotation',updated_at=NOW() WHERE id=$1 AND status NOT IN ('approved','production','ready','installation','completed','cancelled')", [order.id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return adminDetail(quotationNo);
}

async function update(quotationNo, input, user) {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const current = await core(client, quotationNo, { forUpdate: true });
    if (current.status !== 'draft') throw httpError('Only a draft can be edited. Create a new revision first.', 409, 'QUOTATION_STATE_CONFLICT');
    if (input.expectedLockVersion !== undefined && Number(input.expectedLockVersion) !== Number(current.lockVersion)) throw httpError('Quotation was changed by another user. Refresh and retry.', 409, 'STALE_QUOTATION');
    const storedItems = await itemsFor(client, current.id);
    const merged = {
      items: input.items || storedItems,
      installation: input.installation ?? current.installation,
      transportation: input.transportation ?? current.transportation,
      design: input.design ?? current.design,
      accessories: input.accessories ?? current.accessories,
      otherCharges: input.otherCharges ?? current.otherCharges,
      discountType: input.discountType ?? current.discountType,
      discountValue: input.discountValue ?? current.discountValue,
      gstPercentage: input.gstPercentage ?? current.gstPercentage,
    };
    const calculated = calculateQuotation(merged, await pricingPolicy(client));
    const values = persistedValues(calculated);
    await client.query(
      `UPDATE quotations SET subtotal=$2,installation=$3,transportation=$4,design=$5,accessories=$6,other_charges=$7,discount_type=$8,discount_value=$9,discount=$10,discount_amount=$10,item_discount_amount=$11,taxable_amount=$12,gst_rate=$13,gst=$14,final_amount=$15,terms=COALESCE($16,terms),customer_notes=COALESCE($17,customer_notes),internal_notes=COALESCE($18,internal_notes),valid_until=COALESCE($19,valid_until),updated_by=$20,lock_version=lock_version+1,updated_at=NOW() WHERE id=$1`,
      [current.id, ...values, input.terms, input.customerNotes, input.internalNotes, input.validUntil, user.id],
    );
    if (input.items) await insertItems(client, current.id, calculated.items);
    const updated = await core(client, quotationNo);
    await saveRevisionSnapshot(client, updated, calculated.items, user.id);
    await audit(client, user.id, 'quotation.edited', current.id, { quotationNo, version: current.version, finalAmount: calculated.finalAmount });
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return adminDetail(quotationNo);
}

async function createRevision(quotationNo, input, user) {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const current = await core(client, quotationNo, { forUpdate: true });
    if (!['sent', 'viewed', 'change_requested'].includes(current.status)) throw httpError('A revision can only be created for a sent, viewed, or change-requested quotation', 409, 'QUOTATION_STATE_CONFLICT');
    if (input.expectedLockVersion !== undefined && Number(input.expectedLockVersion) !== Number(current.lockVersion)) throw httpError('Quotation was changed by another user. Refresh and retry.', 409, 'STALE_QUOTATION');
    const nextVersion = Number(current.version) + 1;
    await client.query(`UPDATE quotations SET version=$2,status='draft',issue_date=CURRENT_DATE,sent_at=NULL,viewed_at=NULL,approved_at=NULL,rejected_at=NULL,expired_at=NULL,cancelled_at=NULL,updated_by=$3,lock_version=lock_version+1,updated_at=NOW() WHERE id=$1`, [current.id, nextVersion, user.id]);
    const items = await itemsFor(client, current.id);
    const updated = await core(client, quotationNo);
    await saveRevisionSnapshot(client, updated, items, user.id);
    await history(client, current.id, current.status, 'draft', user.id, 'admin', current.changeRequestComment, input.internalNote || null);
    await audit(client, user.id, 'quotation.revision_created', current.id, { quotationNo, fromVersion: current.version, version: nextVersion });
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return adminDetail(quotationNo);
}

async function send(quotationNo, input, user, forceResend = false) {
  const client = await pool().connect();
  let target, action;
  try {
    await client.query('BEGIN');
    const current = await core(client, quotationNo, { forUpdate: true });
    const resend = forceResend;
    if ((!resend && current.status !== 'draft') || (resend && current.status !== 'sent')) throw httpError('Quotation cannot be sent in its current state', 409, 'QUOTATION_STATE_CONFLICT');
    if (input.expectedLockVersion !== undefined && Number(input.expectedLockVersion) !== Number(current.lockVersion)) throw httpError('Quotation was changed by another user. Refresh and retry.', 409, 'STALE_QUOTATION');
    if (!current.validUntil || isPastDate(current.validUntil)) throw httpError('Quotation validity must be today or a future date', 422, 'QUOTATION_EXPIRED');
    if (!String(current.terms || '').trim()) throw httpError('Terms and conditions are required before sending');
    const storedItems = await itemsFor(client, current.id);
    if (!storedItems.length) throw httpError('At least one quotation item is required before sending');
    await client.query(`UPDATE quotations SET status='sent',sent_at=NOW(),viewed_at=NULL,updated_by=$2,lock_version=lock_version+1,updated_at=NOW() WHERE id=$1`, [current.id, user.id]);
    const updated = await core(client, quotationNo);
    await saveRevisionSnapshot(client, updated, storedItems, user.id);
    await history(client, current.id, current.status, 'sent', user.id, 'admin', null, input.internalNote || null);
    action = resend ? 'quotation.resent' : Number(current.version) > 1 ? 'quotation.updated' : 'quotation.sent';
    await audit(client, user.id, action, current.id, { quotationNo, version: current.version });
    target = { userId: (await client.query('SELECT user_id FROM customers WHERE id=$1', [current.customerId])).rows[0].user_id, orderId: current.orderId, version: current.version };
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const notificationTitle = action === 'quotation.resent' ? 'Quotation resent' : action === 'quotation.updated' ? 'Quotation updated' : 'Quotation ready';
  await notificationService.sendEvent(target.userId, action, notificationTitle, `Quotation ${quotationNo} version ${target.version} is ready for review.`, { quotationNo, orderId: target.orderId, version: target.version })
    .catch((error) => console.warn('Quotation notification failed:', error.message));
  return adminDetail(quotationNo);
}

async function cancel(quotationNo, input, user) {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const current = await core(client, quotationNo, { forUpdate: true });
    if (!['draft', 'sent', 'viewed', 'change_requested'].includes(current.status)) throw httpError('Quotation cannot be cancelled in its current state', 409, 'QUOTATION_STATE_CONFLICT');
    if (input.expectedLockVersion !== undefined && Number(input.expectedLockVersion) !== Number(current.lockVersion)) throw httpError('Quotation was changed by another user. Refresh and retry.', 409, 'STALE_QUOTATION');
    await client.query(`UPDATE quotations SET status='cancelled',cancelled_at=NOW(),updated_by=$2,lock_version=lock_version+1,updated_at=NOW() WHERE id=$1`, [current.id, user.id]);
    await history(client, current.id, current.status, 'cancelled', user.id, 'admin', null, input.reason);
    await audit(client, user.id, 'quotation.cancelled', current.id, { quotationNo, reason: input.reason });
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return adminDetail(quotationNo);
}

function customerDto(row, items = undefined, statusHistory = undefined) {
  const productDetails = row.orderSpecifications || {};
  const result = {
    quotationNo: row.quotationNo,
    orderNo: row.orderNo,
    version: Number(row.version),
    status: row.status,
    issueDate: row.issueDate,
    validUntil: row.validUntil,
    customer: { name: row.customerName, company: row.company, email: row.customerEmail, phone: row.customerPhone, address: row.customerAddress },
    order: { orderNo: row.orderNo, status: row.orderStatus, specifications: row.orderSpecifications },
    subtotal: row.subtotal,
    installation: row.installation,
    transportation: row.transportation,
    design: row.design,
    accessories: row.accessories,
    otherCharges: row.otherCharges,
    discountType: row.discountType,
    discountValue: row.discountValue,
    discountAmount: row.discountAmount,
    taxableAmount: row.taxableAmount,
    gstPercentage: row.gstPercentage,
    gstAmount: row.gstAmount,
    gstRate: row.gstPercentage,
    gst: row.gstAmount,
    finalAmount: row.finalAmount,
    terms: row.terms,
    customerNotes: row.customerNotes,
    changeRequestComment: row.changeRequestComment,
    rejectionReason: row.rejectionReason,
    sentAt: row.sentAt,
    viewedAt: row.viewedAt,
    approvedAt: row.approvedAt,
    rejectedAt: row.rejectedAt,
    changeRequestedAt: row.changeRequestedAt,
    expiredAt: row.expiredAt,
    cancelledAt: row.cancelledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    availableActions: customerActions(row.status, row.validUntil),
    pdfAvailable: true,
    productDetails,
    quantity: Number(productDetails.quantity || 0),
    payments: paymentCapability(row.customerPaymentsEnabled, row.status),
  };
  if (items) result.items = items.map(({ metadata, ...item }) => ({ ...item, amount: item.lineTotal }));
  if (statusHistory) result.statusHistory = statusHistory;
  return result;
}

async function customerList(userId, query = {}) {
  await expireDue();
  const page = Math.max(1, Number(query.page) || 1), pageSize = Math.min(50, Math.max(5, Number(query.pageSize) || 20));
  const values = [userId, CUSTOMER_VISIBLE_STATUSES];
  let statusFilter = '';
  if (query.status) {
    if (!CUSTOMER_VISIBLE_STATUSES.includes(query.status)) throw httpError('Unsupported quotation status');
    values.push(query.status); statusFilter = ` AND q.status=$${values.length}`;
  }
  const dataValues = [...values, pageSize, (page - 1) * pageSize];
  const baseWhere = `c.user_id=$1 AND q.status=ANY($2::varchar[])${statusFilter}`;
  const [count, data] = await Promise.all([
    pool().query(`SELECT COUNT(*)::int total FROM quotations q JOIN customers c ON c.id=q.customer_id WHERE ${baseWhere}`, values),
    pool().query(`SELECT q.quotation_no AS "quotationNo",o.order_no AS "orderNo",q.status,q.version,q.issue_date AS "issueDate",q.valid_until AS "validUntil",q.final_amount AS "finalAmount",q.created_at AS "createdAt",q.updated_at AS "updatedAt" FROM quotations q JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=q.customer_id WHERE ${baseWhere} ORDER BY q.updated_at DESC,q.id DESC LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`, dataValues),
  ]);
  const total = count.rows[0].total;
  return { data: data.rows.map((row) => ({ ...row, version: Number(row.version), availableActions: customerActions(row.status, row.validUntil), pdfAvailable: true })), page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

async function customerDetail(userId, quotationNo, markViewed = true) {
  await expireDue();
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    let row = await core(client, quotationNo, { ownerUserId: userId, forUpdate: markViewed });
    if (!CUSTOMER_VISIBLE_STATUSES.includes(row.status)) throw httpError('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
    if (markViewed && row.status === 'sent') {
      await client.query(`UPDATE quotations SET status='viewed',viewed_at=COALESCE(viewed_at,NOW()),lock_version=lock_version+1,updated_at=NOW() WHERE id=$1`, [row.id]);
      await history(client, row.id, 'sent', 'viewed', userId, 'customer');
      await audit(client, userId, 'quotation.viewed', row.id, { quotationNo, version: row.version });
      row = await core(client, quotationNo, { ownerUserId: userId });
    }
    const [items, safeHistory] = await Promise.all([
      itemsFor(client, row.id),
      client.query(`SELECT old_status AS "oldStatus",new_status AS "newStatus",actor_type AS "actorType",customer_comment AS comment,created_at AS "createdAt" FROM quotation_status_history WHERE quotation_id=$1 ORDER BY id`, [row.id]),
    ]);
    await client.query('COMMIT');
    return customerDto(row, items, safeHistory.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function customerAction(userId, quotationNo, action, comment) {
  const targetStatus = { approve: 'approved', request_changes: 'change_requested', reject: 'rejected' }[action];
  if (!targetStatus) throw httpError('Unsupported quotation action');
  await expireDue();
  const client = await pool().connect();
  let result;
  try {
    await client.query('BEGIN');
    const current = await core(client, quotationNo, { ownerUserId: userId, forUpdate: true });
    if (!CUSTOMER_VISIBLE_STATUSES.includes(current.status)) throw httpError('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
    if (current.status === 'expired') throw httpError('Quotation has expired', 409, 'QUOTATION_EXPIRED');
    if (action === 'approve' && current.status === 'approved') {
      await client.query('COMMIT');
      return { quotationNo, status: 'approved', version: Number(current.version), idempotent: true };
    }
    if (action === 'reject' && current.status === 'rejected') {
      await client.query('COMMIT');
      return { quotationNo, status: 'rejected', version: Number(current.version), idempotent: true };
    }
    if (CUSTOMER_ACTION_STATUSES.includes(current.status) && isPastDate(current.validUntil)) {
      await client.query(`UPDATE quotations SET status='expired',expired_at=NOW(),lock_version=lock_version+1,updated_at=NOW() WHERE id=$1`, [current.id]);
      await history(client, current.id, current.status, 'expired', null, 'system');
      await audit(client, null, 'quotation.expired', current.id, { quotationNo });
      await client.query('COMMIT');
      const expiredError = httpError('Quotation has expired', 409, 'QUOTATION_EXPIRED');
      expiredError.transactionCommitted = true;
      throw expiredError;
    }
    if (!CUSTOMER_ACTION_STATUSES.includes(current.status)) throw httpError(`Quotation cannot be ${action.replace('_', ' ')} in its current state`, 409, 'QUOTATION_STATE_CONFLICT');
    if (action === 'request_changes' && !String(comment || '').trim()) throw httpError('A change request comment is required');
    await client.query(
      `UPDATE quotations SET status=$2,approved_at=CASE WHEN $2='approved' THEN NOW() ELSE approved_at END,rejected_at=CASE WHEN $2='rejected' THEN NOW() ELSE rejected_at END,change_requested_at=CASE WHEN $2='change_requested' THEN NOW() ELSE change_requested_at END,change_request_comment=CASE WHEN $2='change_requested' THEN $3 ELSE change_request_comment END,rejection_reason=CASE WHEN $2='rejected' THEN $3 ELSE rejection_reason END,lock_version=lock_version+1,updated_at=NOW() WHERE id=$1`,
      [current.id, targetStatus, comment || null],
    );
    if (action === 'approve') await client.query("UPDATE orders SET status='approved',updated_at=NOW() WHERE id=$1 AND status='quotation'", [current.orderId]);
    await history(client, current.id, current.status, targetStatus, userId, 'customer', comment || null);
    await audit(client, userId, `quotation.${action}`, current.id, { quotationNo, version: current.version, comment: comment || null });
    await client.query('COMMIT');
    result = { quotationNo, status: targetStatus, version: Number(current.version), idempotent: false };
  } catch (error) {
    if (!error?.transactionCommitted) await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
  const labels = { approve: 'approved', request_changes: 'change requested', reject: 'rejected' };
  const eventKeys = { approve: 'quotation.approved', request_changes: 'quotation.change_requested', reject: 'quotation.rejected' };
  await notificationService.sendToRoles(['super_admin', 'admin', 'sales_manager'], eventKeys[action], `Quotation ${labels[action]}`, `Customer ${labels[action]} quotation ${quotationNo}.`, { quotationNo, status: targetStatus, version: result.version, comment: comment || '' })
    .catch((error) => console.warn('Quotation admin notification failed:', error.message));
  return result;
}

async function recordPdfDownload(user, quotationNo, actorType) {
  const values = [quotationNo];
  let ownership = '';
  if (actorType === 'customer') {
    values.push(user.id);
    ownership = ` AND c.user_id=$${values.length}`;
  }
  const row = (await pool().query(
    `SELECT q.id FROM quotations q JOIN customers c ON c.id=q.customer_id WHERE q.quotation_no=$1${ownership}`,
    values,
  )).rows[0];
  if (!row) throw httpError('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
  await audit(pool(), user.id, 'quotation.pdf_downloaded', row.id, { quotationNo, actorType });
}

async function companySettings() {
  const row = (await pool().query("SELECT value FROM settings WHERE setting_key='company'")).rows[0];
  return { name: 'SignFix', address: '', phone: '', email: 'admin@signfix.in', gstNumber: '', ...(row?.value || {}) };
}

module.exports = {
  STATUSES,
  CUSTOMER_VISIBLE_STATUSES,
  calculateQuotation,
  adminActions,
  customerActions,
  serializeCustomerQuotation: customerDto,
  options,
  adminList,
  adminDetail,
  create,
  update,
  createRevision,
  send,
  cancel,
  customerList,
  customerDetail,
  customerAction,
  recordPdfDownload,
  companySettings,
};
