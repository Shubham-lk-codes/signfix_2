const crypto = require("crypto");
const database = require("../database");
const razorpay = require("./razorpayService");
const { businessId } = require("../utils/ids");
const pool = () => database.getPool();

async function ownedPayment(userId, id, client = pool()) {
  const row = (
    await client.query(
      `SELECT p.*,q.quotation_no AS "quotationNo",q.final_amount AS "quotationAmount",o.id AS order_id,o.order_no AS "orderNo" FROM payments p JOIN quotations q ON q.id=p.quotation_id JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id WHERE p.id=$1 AND c.user_id=$2`,
      [id, userId],
    )
  ).rows[0];
  if (!row)
    throw Object.assign(new Error("Payment not found"), { status: 404 });
  return row;
}

function publicPayment(row) {
  return {
    id: row.id,
    quotationNo: row.quotationNo,
    orderNo: row.orderNo,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    reference: row.reference,
    type: row.payment_type,
    provider: row.provider,
    providerOrderId: row.provider_order_id,
    providerPaymentId: row.provider_payment_id,
    failureCode: row.failure_code,
    failureDescription: row.failure_description,
    attemptCount: row.attempt_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    checkout:
      row.provider_order_id &&
      ["pending", "created", "authorized"].includes(row.status)
        ? {
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: row.provider_order_id,
            amount: Math.round(Number(row.amount) * 100),
            currency: row.currency,
            name: process.env.COMPANY_NAME || "SignFix",
            description: `Quotation ${row.quotationNo}`,
          }
        : null,
  };
}

async function initializeProvider(payment, userId) {
  try {
    const providerOrder = await razorpay.createOrder({
      amount: payment.amount,
      currency: payment.currency,
      receipt:
        `${payment.reference}-${Number(payment.attempt_count) + 1}`.slice(
          0,
          40,
        ),
      notes: {
        payment_reference: payment.reference,
        quotation: payment.quotationNo,
      },
    });
    const row = (
      await pool().query(
        `UPDATE payments SET provider_order_id=$2,status='pending',attempt_count=attempt_count+1,failure_code=NULL,failure_description=NULL,updated_at=NOW() WHERE id=$1 AND status IN ('created','initialization_failed','failed','cancelled') RETURNING *`,
        [payment.id, providerOrder.id],
      )
    ).rows[0];
    return publicPayment({ ...payment, ...row });
  } catch (error) {
    await pool().query(
      `UPDATE payments SET status='initialization_failed',attempt_count=attempt_count+1,failure_code=$2,failure_description=$3,updated_at=NOW() WHERE id=$1`,
      [payment.id, error.providerCode || "PROVIDER_UNAVAILABLE", error.message],
    );
    throw error;
  }
}

async function create(userId, data) {
  if (!razorpay.configured())
    throw Object.assign(new Error("Online payments are unavailable"), {
      status: 503,
    });
  const client = await pool().connect();
  let payment;
  try {
    await client.query("BEGIN");
    const existing = (
      await client.query(
        `SELECT p.id FROM payments p JOIN quotations q ON q.id=p.quotation_id JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id WHERE p.idempotency_key=$1 AND c.user_id=$2`,
        [data.idempotencyKey, userId],
      )
    ).rows[0];
    if (existing) {
      payment = await ownedPayment(userId, existing.id, client);
      await client.query("COMMIT");
      return payment.provider_order_id
        ? publicPayment(payment)
        : initializeProvider(payment, userId);
    }
    const quote = (
      await client.query(
        `SELECT q.id,q.final_amount,q.valid_until,q.status,o.id AS order_id,o.order_no,c.payments_enabled FROM quotations q JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id WHERE q.quotation_no=$1 AND c.user_id=$2 FOR UPDATE OF q`,
        [data.quotationNo, userId],
      )
    ).rows[0];
    if (
      !quote ||
      quote.status !== "approved" ||
      !quote.payments_enabled ||
      (quote.valid_until &&
        new Date(quote.valid_until) < new Date(new Date().toDateString()))
    )
      throw Object.assign(
        new Error(
          "A current customer-approved quotation with payments enabled is required",
        ),
        { status: 409 },
      );
    const paid = Number(
        (
          await client.query(
            `SELECT COALESCE(SUM(amount-refunded_amount),0) total FROM payments WHERE quotation_id=$1 AND status IN ('captured','partially_refunded')`,
            [quote.id],
          )
        ).rows[0].total,
      ),
      remaining = Math.max(0, Number(quote.final_amount) - paid);
    if (remaining <= 0)
      throw Object.assign(new Error("Quotation is already fully paid"), {
        status: 409,
      });
    const active = (
      await client.query(
        `SELECT id FROM payments WHERE quotation_id=$1 AND payment_type=$2 AND status IN ('created','pending','authorized') ORDER BY id DESC LIMIT 1`,
        [quote.id, data.type],
      )
    ).rows[0];
    if (active) {
      payment = await ownedPayment(userId, active.id, client);
      await client.query("COMMIT");
      return payment.provider_order_id
        ? publicPayment(payment)
        : initializeProvider(payment, userId);
    }
    const requested =
        data.type === "advance"
          ? Math.round(Number(quote.final_amount) * 25) / 100
          : remaining,
      amount = Math.min(requested, remaining);
    payment = (
      await client.query(
        `INSERT INTO payments(quotation_id,amount,status,reference,payment_type,provider,currency,idempotency_key,metadata) VALUES($1,$2,'created',$3,$4,'razorpay','INR',$5,$6::jsonb) RETURNING *`,
        [
          quote.id,
          amount,
          businessId("PAY"),
          data.type,
          data.idempotencyKey,
          JSON.stringify({ officialQuotationAmount: quote.final_amount }),
        ],
      )
    ).rows[0];
    payment.quotationNo = data.quotationNo;
    payment.orderNo = quote.order_no;
    payment.order_id = quote.order_id;
    await client.query(
      `INSERT INTO audit_logs(user_id,action,entity_type,entity_id,metadata) VALUES($1,'payment.created','payment',$2,$3::jsonb)`,
      [
        userId,
        payment.id,
        JSON.stringify({
          reference: payment.reference,
          quotationNo: data.quotationNo,
          amount,
        }),
      ],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return initializeProvider(payment, userId);
}

async function retry(userId, id) {
  const payment = await ownedPayment(userId, id);
  if (
    !["created", "initialization_failed", "failed", "cancelled"].includes(
      payment.status,
    )
  )
    throw Object.assign(
      new Error(
        "Only uninitialized, failed, or cancelled payments can be retried",
      ),
      { status: 409 },
    );
  const result = await create(userId, {
    quotationNo: payment.quotationNo,
    type: payment.payment_type,
    idempotencyKey: crypto.randomUUID(),
  });
  await pool().query(
    `INSERT INTO audit_logs(user_id,action,entity_type,entity_id,metadata) VALUES($1,'payment.retried','payment',$2,$3::jsonb)`,
    [
      userId,
      id,
      JSON.stringify({
        reference: payment.reference,
        replacementPaymentId: result.id,
      }),
    ],
  );
  return result;
}
async function cancel(userId, id) {
  const row = (
    await pool().query(
      `UPDATE payments p SET status='cancelled',updated_at=NOW() FROM quotations q,orders o,customers c WHERE p.id=$1 AND p.quotation_id=q.id AND q.order_id=o.id AND o.customer_id=c.id AND c.user_id=$2 AND p.status IN ('created','pending','initialization_failed') RETURNING p.*`,
      [id, userId],
    )
  ).rows[0];
  if (!row)
    throw Object.assign(new Error("Payment cannot be cancelled"), {
      status: 409,
    });
  await pool().query(
    `INSERT INTO audit_logs(user_id,action,entity_type,entity_id,metadata) VALUES($1,'payment.cancelled','payment',$2,$3::jsonb)`,
    [userId, id, JSON.stringify({ reference: row.reference })],
  );
  return publicPayment({ ...(await ownedPayment(userId, id)), ...row });
}

async function applyVerifiedState(
  client,
  paymentId,
  state,
  providerPaymentId,
  failure = {},
) {
  const current = (
    await client.query(
      `SELECT p.id,p.quotation_id,p.status,p.amount,p.currency,q.final_amount,o.id AS order_id FROM payments p JOIN quotations q ON q.id=p.quotation_id JOIN orders o ON o.id=q.order_id WHERE p.id=$1 FOR UPDATE OF p`,
      [paymentId],
    )
  ).rows[0];
  if (!current) return null;
  const rank = {
    created: 0,
    pending: 1,
    failed: 1,
    cancelled: 1,
    authorized: 2,
    captured: 3,
    partially_refunded: 4,
    refunded: 5,
  };
  if (
    (rank[state] ?? 0) < (rank[current.status] ?? 0) &&
    current.status !== "failed"
  )
    return current;
  await client.query(
    `UPDATE payments SET status=$2,provider_payment_id=COALESCE($3,provider_payment_id),failure_code=$4,failure_description=$5,verified_at=NOW(),captured_at=CASE WHEN $2='captured' THEN COALESCE(captured_at,NOW()) ELSE captured_at END,updated_at=NOW() WHERE id=$1`,
    [
      paymentId,
      state,
      providerPaymentId,
      failure.code || null,
      failure.description || null,
    ],
  );
  if (state === "captured") {
    const total = Number(
      (
        await client.query(
          `SELECT COALESCE(SUM(amount-refunded_amount),0) total FROM payments WHERE quotation_id=$1 AND status IN ('captured','partially_refunded')`,
          [current.quotation_id],
        )
      ).rows[0].total,
    );
    if (total >= Number(current.final_amount))
      await client.query(
        `UPDATE orders SET status=CASE WHEN status='approved' THEN 'production' ELSE status END,updated_at=NOW() WHERE id=$1`,
        [current.order_id],
      );
  }
  return current;
}

async function confirm(userId, id, data) {
  const payment = await ownedPayment(userId, id);
  if (
    payment.provider_order_id !== data.razorpayOrderId ||
    !razorpay.verifyCheckoutSignature(
      payment.provider_order_id,
      data.razorpayPaymentId,
      data.razorpaySignature,
    )
  )
    throw Object.assign(new Error("Invalid payment signature"), {
      status: 401,
    });
  const remote = await razorpay.fetchPayment(data.razorpayPaymentId);
  if (
    remote.order_id !== payment.provider_order_id ||
    Number(remote.amount) !== Math.round(Number(payment.amount) * 100) ||
    remote.currency !== payment.currency
  )
    throw Object.assign(
      new Error("Payment provider details do not match this transaction"),
      { status: 409 },
    );
  const state =
    remote.status === "captured"
      ? "captured"
      : remote.status === "authorized"
        ? "authorized"
        : "pending";
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    await applyVerifiedState(client, id, state, remote.id);
    await client.query(
      `INSERT INTO audit_logs(user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'payment',$3,$4::jsonb)`,
      [
        userId,
        `payment.${state}`,
        id,
        JSON.stringify({
          reference: payment.reference,
          providerPaymentId: remote.id,
        }),
      ],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return publicPayment(await ownedPayment(userId, id));
}
async function get(userId, id) {
  return publicPayment(await ownedPayment(userId, id));
}
async function list(userId) {
  const rows = (
    await pool().query(
      `SELECT p.*,q.quotation_no AS "quotationNo",o.order_no AS "orderNo" FROM payments p JOIN quotations q ON q.id=p.quotation_id JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id WHERE c.user_id=$1 ORDER BY p.id DESC`,
      [userId],
    )
  ).rows;
  return { data: rows.map(publicPayment) };
}

async function webhook(rawBody, headers, body) {
  if (!razorpay.verifyWebhook(rawBody, headers["x-razorpay-signature"]))
    throw Object.assign(new Error("Invalid webhook signature"), {
      status: 401,
    });
  const eventId = headers["x-razorpay-event-id"];
  if (!eventId)
    throw Object.assign(new Error("Missing Razorpay event identifier"), {
      status: 422,
    });
  const entity = body?.payload?.payment?.entity,
    event = body.event;
  if (
    !entity ||
    !["payment.authorized", "payment.captured", "payment.failed"].includes(
      event,
    )
  )
    return { received: true, ignored: true };
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO payment_webhook_events(provider,event_id,payload) VALUES('razorpay',$1,$2::jsonb) ON CONFLICT(provider,event_id) DO NOTHING RETURNING id`,
      [eventId, JSON.stringify(body)],
    );
    if (!inserted.rowCount) {
      await client.query("ROLLBACK");
      return { received: true, duplicate: true };
    }
    const payment = (
      await client.query(
        `SELECT id,amount,currency FROM payments WHERE provider='razorpay' AND provider_order_id=$1`,
        [entity.order_id],
      )
    ).rows[0];
    if (
      !payment ||
      Number(entity.amount) !== Math.round(Number(payment.amount) * 100) ||
      entity.currency !== payment.currency
    )
      throw Object.assign(
        new Error("Webhook payment does not match a transaction"),
        { status: 409 },
      );
    const state =
      event === "payment.captured"
        ? "captured"
        : event === "payment.authorized"
          ? "authorized"
          : "failed";
    await applyVerifiedState(client, payment.id, state, entity.id, {
      code: entity.error_code,
      description: entity.error_description,
    });
    await client.query(
      `INSERT INTO audit_logs(action,entity_type,entity_id,metadata) VALUES($1,'payment',$2,$3::jsonb)`,
      [
        `payment.webhook_${state}`,
        payment.id,
        JSON.stringify({ eventId, providerPaymentId: entity.id }),
      ],
    );
    await client.query("COMMIT");
    return { received: true, paymentId: payment.id, status: state };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
module.exports = { create, retry, cancel, confirm, get, list, webhook };
