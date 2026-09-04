const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const database = require("../../database");

const pool = () => database.getPool();
const activeOrder = "NOT IN ('completed','cancelled','closed')";
const activeService =
  "NOT IN ('completed','customer_confirmed','closed','cancelled')";

async function customerForUser(userId, client = pool()) {
  const { rows } = await client.query(
    "SELECT c.id,c.user_id FROM customers c WHERE c.user_id=$1",
    [userId],
  );
  if (!rows[0])
    throw Object.assign(new Error("Customer profile not found"), {
      status: 404,
    });
  return rows[0];
}

async function dashboard(userId) {
  const customer = await customerForUser(userId);
  const [summary, recent] = await Promise.all([
    pool().query(
      `SELECT
    (SELECT row_to_json(x) FROM (SELECT order_no AS id,status,estimated_price AS "estimatedPrice",created_at AS "createdAt" FROM orders WHERE customer_id=$1 AND status ${activeOrder} ORDER BY created_at DESC LIMIT 1) x) AS "activeOrder",
    (SELECT row_to_json(x) FROM (SELECT ticket_no AS id,status,category,created_at AS "createdAt" FROM service_tickets WHERE customer_id=$1 AND status ${activeService} ORDER BY created_at DESC LIMIT 1) x) AS "activeService",
    (SELECT row_to_json(x) FROM (SELECT q.quotation_no AS "quotationNo",o.order_no AS "orderNo",q.final_amount AS "finalAmount",q.status,q.valid_until AS "validUntil" FROM quotations q JOIN orders o ON o.id=q.order_id WHERE o.customer_id=$1 ORDER BY q.id DESC LIMIT 1) x) AS "recentQuotation",
    (SELECT COUNT(*)::int FROM orders WHERE customer_id=$1) AS "orderCount",
    (SELECT COUNT(*)::int FROM service_tickets WHERE customer_id=$1) AS "serviceCount",
    (SELECT COUNT(*)::int FROM notifications WHERE user_id=$2 AND read_at IS NULL) AS "unreadNotifications"`,
      [customer.id, userId],
    ),
    pool().query(
      `SELECT * FROM ((SELECT 'order' type,order_no id,status,created_at FROM orders WHERE customer_id=$1) UNION ALL (SELECT 'service',ticket_no,status,created_at FROM service_tickets WHERE customer_id=$1)) a ORDER BY created_at DESC LIMIT 10`,
      [customer.id],
    ),
  ]);
  return {
    heroActions: [
      {
        key: "ORDER_NEW_SIGN_BOARD",
        title: "Need a New Sign Board?",
        buttonLabel: "Order Now",
      },
      {
        key: "REQUEST_SIGN_BOARD_SERVICE",
        title: "Sign Board Problem?",
        buttonLabel: "Request Service",
      },
    ],
    sections: [
      "MY_ORDERS",
      "MY_SERVICES",
      "AI_SUPPORT",
      "DESIGN_DEMO",
      "NOTIFICATIONS",
      "RECENT_ACTIVITY",
    ],
    ...summary.rows[0],
    recentActivity: recent.rows,
  };
}

async function orderOptions() {
  const [products, materials, lighting, accessories, installation] =
    await Promise.all([
      pool().query(
        'SELECT id,name,description,image_url AS "imageUrl" FROM products WHERE status=TRUE ORDER BY id',
      ),
      pool().query(
        'SELECT id,name,description,image_url AS "imageUrl" FROM materials WHERE status=TRUE ORDER BY id',
      ),
      pool().query(
        'SELECT id,name,description,image_url AS "imageUrl" FROM lighting_options WHERE status=TRUE ORDER BY id',
      ),
      pool().query(
        'SELECT id,name,description,image_url AS "imageUrl" FROM accessories WHERE status=TRUE ORDER BY id',
      ),
      pool().query(
        'SELECT id,name,description,image_url AS "imageUrl" FROM installation_options WHERE status=TRUE ORDER BY id',
      ),
    ]);
  return {
    signBoardTypes: products.rows,
    materials: materials.rows,
    lighting: lighting.rows,
    units: ["ft", "in", "cm", "m"],
    additionalOptions: [
      "installation",
      "transportation",
      "design",
      "electricalWork",
      "mountingStructure",
      "accessories",
      "customization",
    ],
    uploads: {
      fieldName: "file",
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
      ],
      maxBytes: 8388608,
    },
    accessories: accessories.rows,
    installationOptions: installation.rows,
    priceLabel: "Estimated Price",
    priceNotice: "Final quotation may change after Admin review/measurement.",
  };
}

async function serviceOptions() {
  const categories = (
    await pool().query(
      "SELECT id,name FROM service_categories WHERE status=TRUE ORDER BY id",
    )
  ).rows;
  const customerCanSelectPriority =
    process.env.CUSTOMER_CAN_SELECT_SERVICE_PRIORITY === "true";
  return {
    steps: ["take_photo", "select_problem", "location", "remarks", "submit"],
    categories,
    photoUpload: {
      endpoint: "/api/uploads",
      fieldName: "file",
      sources: ["camera", "gallery"],
      multiple: true,
      maxFiles: 10,
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      maxBytesPerFile: 8388608,
    },
    location: {
      gps: true,
      address: true,
      latitudeRange: [-90, 90],
      longitudeRange: [-180, 180],
    },
    customerCanSelectPriority,
    priorities: customerCanSelectPriority
      ? ["normal", "high", "emergency"]
      : [],
    confirmationMessage: "Your service request has been submitted.",
  };
}

async function profile(userId) {
  const { rows } = await pool().query(
    `SELECT u.id,u.name,u.mobile,u.email,u.status,u.verified_at AS "verifiedAt",c.company_name AS "companyName",c.address FROM users u JOIN customers c ON c.user_id=u.id WHERE u.id=$1`,
    [userId],
  );
  if (!rows[0])
    throw Object.assign(new Error("Customer profile not found"), {
      status: 404,
    });
  const addresses = await pool().query(
    'SELECT id,label,address_line AS "addressLine",city,state,pincode,latitude,longitude,is_default AS "isDefault" FROM customer_addresses WHERE customer_id=(SELECT id FROM customers WHERE user_id=$1) ORDER BY is_default DESC,id DESC',
    [userId],
  );
  return { ...rows[0], savedAddresses: addresses.rows };
}

async function updateProfile(userId, data) {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE users SET name=COALESCE($2,name),mobile=COALESCE($3,mobile),email=COALESCE(LOWER($4),email),updated_at=NOW() WHERE id=$1",
      [userId, data.name, data.mobile, data.email],
    );
    const addressPatch = {};
    if (data.address !== undefined) addressPatch.addressLine = data.address;
    if (data.city !== undefined) addressPatch.city = data.city;
    if (data.state !== undefined) addressPatch.state = data.state;
    if (data.pincode !== undefined) addressPatch.pincode = data.pincode;
    await client.query(
      "UPDATE customers SET company_name=COALESCE($2,company_name),address=address||$3::jsonb WHERE user_id=$1",
      [userId, data.companyName, JSON.stringify(addressPatch)],
    );
    if (Object.keys(addressPatch).length)
      await client.query(
        `UPDATE customer_addresses SET address_line=COALESCE($2,address_line),city=COALESCE($3,city),state=COALESCE($4,state),pincode=COALESCE($5,pincode),updated_at=NOW() WHERE customer_id=(SELECT id FROM customers WHERE user_id=$1) AND is_default=TRUE`,
        [userId, data.address, data.city, data.state, data.pincode],
      );
    await client.query("COMMIT");
    return profile(userId);
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505")
      throw Object.assign(
        new Error("Email or mobile number is already registered"),
        { status: 409 },
      );
    throw e;
  } finally {
    client.release();
  }
}

function pagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}
async function orders(userId, query = {}) {
  const customer = await customerForUser(userId);
  const { page, pageSize, offset } = pagination(query);
  const params = [customer.id];
  let filter = "";
  if (query.status) {
    params.push(query.status);
    filter = ` AND o.status=$${params.length}`;
  }
  const dataParams = [...params, pageSize, offset];
  const [count, result] = await Promise.all([
      pool().query(
        `SELECT COUNT(*)::int AS total FROM orders o WHERE o.customer_id=$1${filter}`,
        params,
      ),
      pool().query(
        `SELECT o.order_no AS id,o.specifications,o.estimated_price AS "estimatedPrice",o.status,o.created_at AS "createdAt",CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object('id',t.id,'name',tu.name,'mobile',tu.mobile) END AS "installationTechnician" FROM orders o LEFT JOIN technicians t ON t.id=o.installation_technician_id LEFT JOIN users tu ON tu.id=t.user_id WHERE o.customer_id=$1${filter} ORDER BY o.created_at DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams,
      ),
    ]),
    total = count.rows[0].total,
    rows = result.rows.map((row) => ({
      ...row,
      ...(row.specifications || {}),
    }));
  return {
    data: rows,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
async function services(userId, query = {}) {
  const customer = await customerForUser(userId);
  const { page, pageSize, offset } = pagination(query);
  const params = [customer.id];
  let filter = "";
  if (query.status) {
    params.push(query.status);
    filter = ` AND status=$${params.length}`;
  }
  const dataParams = [...params, pageSize, offset];
  const [count, result] = await Promise.all([
      pool().query(
        `SELECT COUNT(*)::int AS total FROM service_tickets WHERE customer_id=$1${filter}`,
        params,
      ),
      pool().query(
        `SELECT ticket_no AS id,category,description,location,photos,priority,status,created_at AS "createdAt" FROM service_tickets WHERE customer_id=$1${filter} ORDER BY created_at DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams,
      ),
    ]),
    total = count.rows[0].total;
  return {
    data: result.rows,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

async function addAddress(userId, data) {
  const customer = await customerForUser(userId);
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    if (data.isDefault)
      await client.query(
        "UPDATE customer_addresses SET is_default=FALSE WHERE customer_id=$1",
        [customer.id],
      );
    const { rows } = await client.query(
      `INSERT INTO customer_addresses(customer_id,label,address_line,city,state,pincode,latitude,longitude,is_default) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,label,address_line AS "addressLine",city,state,pincode,latitude,longitude,is_default AS "isDefault"`,
      [
        customer.id,
        data.label,
        data.addressLine,
        data.city,
        data.state,
        data.pincode,
        data.latitude,
        data.longitude,
        data.isDefault,
      ],
    );
    await client.query("COMMIT");
    return rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function deleteAddress(userId, id) {
  const customer = await customerForUser(userId);
  const result = await pool().query(
    "DELETE FROM customer_addresses WHERE id=$1 AND customer_id=$2",
    [id, customer.id],
  );
  if (!result.rowCount)
    throw Object.assign(new Error("Address not found"), { status: 404 });
}
async function updateAddress(userId, id, data) {
  const customer = await customerForUser(userId);
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    if (data.isDefault)
      await client.query(
        "UPDATE customer_addresses SET is_default=FALSE WHERE customer_id=$1",
        [customer.id],
      );
    const { rows } = await client.query(
      `UPDATE customer_addresses SET label=COALESCE($3,label),address_line=COALESCE($4,address_line),city=COALESCE($5,city),state=COALESCE($6,state),pincode=COALESCE($7,pincode),latitude=COALESCE($8,latitude),longitude=COALESCE($9,longitude),is_default=COALESCE($10,is_default),updated_at=NOW() WHERE id=$1 AND customer_id=$2 RETURNING id,label,address_line AS "addressLine",city,state,pincode,latitude,longitude,is_default AS "isDefault"`,
      [
        id,
        customer.id,
        data.label,
        data.addressLine,
        data.city,
        data.state,
        data.pincode,
        data.latitude,
        data.longitude,
        data.isDefault,
      ],
    );
    if (!rows[0])
      throw Object.assign(new Error("Address not found"), { status: 404 });
    await client.query("COMMIT");
    return rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function order(userId, orderNo) {
  const { rows } = await pool().query(
    `SELECT o.order_no AS id,o.specifications,o.estimated_price AS "estimatedPrice",o.status,o.created_at AS "createdAt",CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object('id',t.id,'name',tu.name,'mobile',tu.mobile) END AS "installationTechnician" FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN technicians t ON t.id=o.installation_technician_id LEFT JOIN users tu ON tu.id=t.user_id WHERE c.user_id=$1 AND o.order_no=$2`,
    [userId, orderNo],
  );
  if (!rows[0])
    throw Object.assign(new Error("Order not found"), { status: 404 });
  return { ...rows[0], ...rows[0].specifications };
}
async function cancelOrder(userId, orderNo, reason) {
  const { rows } = await pool().query(
    `UPDATE orders o SET status='cancelled',updated_at=NOW(),specifications=o.specifications||jsonb_build_object('cancellationReason',$3::text,'cancelledAt',NOW()) FROM customers c WHERE o.customer_id=c.id AND c.user_id=$1 AND o.order_no=$2 AND o.status IN ('new','under_review','quotation') RETURNING o.order_no AS id,o.status`,
    [userId, orderNo, reason],
  );
  if (!rows[0])
    throw Object.assign(
      new Error("Order not found or can no longer be cancelled"),
      { status: 409 },
    );
  await pool().query(
    `UPDATE quotations SET status='cancelled',updated_at=NOW() WHERE order_id=(SELECT id FROM orders WHERE order_no=$1) AND status IN ('draft','sent','changes_requested')`,
    [orderNo],
  );
  await pool().query(
    `INSERT INTO audit_logs(user_id,action,entity_type,metadata) VALUES($1,'customer.order_cancel','order',$2::jsonb)`,
    [userId, JSON.stringify({ orderNo, reason })],
  );
  return { ...rows[0], reason };
}
async function cancelService(userId, ticketNo, reason) {
  const { rows } = await pool().query(
    `UPDATE service_tickets s SET status='cancelled',updated_at=NOW(),admin_notes=CONCAT_WS(E'\n',admin_notes,$3) FROM customers c WHERE s.customer_id=c.id AND c.user_id=$1 AND s.ticket_no=$2 AND s.status IN ('submitted','under_review','technician_assigned','assigned') RETURNING s.ticket_no AS id,s.status`,
    [userId, ticketNo, `Customer cancellation: ${reason}`],
  );
  if (!rows[0])
    throw Object.assign(
      new Error("Service request not found or can no longer be cancelled"),
      { status: 409 },
    );
  await pool().query(
    `UPDATE technician_jobs SET status='cancelled',updated_at=NOW() WHERE ticket_id=(SELECT id FROM service_tickets WHERE ticket_no=$1) AND status IN ('assigned')`,
    [ticketNo],
  );
  await pool().query(
    `INSERT INTO audit_logs(user_id,action,entity_type,metadata) VALUES($1,'customer.service_cancel','service_ticket',$2::jsonb)`,
    [userId, JSON.stringify({ ticketNo, reason })],
  );
  return { ...rows[0], reason };
}
async function confirmService(userId, ticketNo, data) {
  const customer = await customerForUser(userId),
    client = await pool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT j.id,j.status,j.customer_confirmation,s.id AS ticket_id,s.asset_id FROM technician_jobs j JOIN service_tickets s ON s.id=j.ticket_id WHERE s.customer_id=$1 AND s.ticket_no=$2 FOR UPDATE`,
      [customer.id, ticketNo],
    );
    const job = rows[0];
    if (!job)
      throw Object.assign(new Error("Service job not found"), { status: 404 });
    if (job.status !== "completed")
      throw Object.assign(
        new Error("Service work must be completed before confirmation"),
        { status: 409 },
      );
    if (job.customer_confirmation?.confirmedAt)
      throw Object.assign(
        new Error("Service completion has already been confirmed"),
        { status: 409 },
      );
    const otp = (
      await client.query(
        `SELECT id,otp_hash FROM job_completion_otps WHERE job_id=$1 AND consumed_at IS NULL AND expires_at>NOW() AND attempts<5 ORDER BY id DESC LIMIT 1`,
        [job.id],
      )
    ).rows[0];
    if (!otp || !(await bcrypt.compare(data.otp, otp.otp_hash))) {
      if (otp)
        await client.query(
          "UPDATE job_completion_otps SET attempts=attempts+1 WHERE id=$1",
          [otp.id],
        );
      throw Object.assign(new Error("Invalid or expired customer OTP"), {
        status: 422,
      });
    }
    await client.query(
      "UPDATE job_completion_otps SET consumed_at=NOW() WHERE id=$1",
      [otp.id],
    );
    const confirmation = {
      otpConfirmed: true,
      accepted: true,
      remarks: data.remarks || null,
      confirmedAt: new Date().toISOString(),
    };
    await client.query(
      `UPDATE technician_jobs SET status='customer_confirmed',customer_confirmation=$2::jsonb,updated_at=NOW() WHERE id=$1`,
      [job.id, JSON.stringify(confirmation)],
    );
    await client.query(
      `UPDATE service_tickets SET status='customer_confirmed',updated_at=NOW() WHERE ticket_no=$1`,
      [ticketNo],
    );
    await client.query(
      `INSERT INTO job_status_history(job_id,status,notes,created_by) VALUES($1,'customer_confirmed',$2,$3)`,
      [job.id, data.remarks, userId],
    );
    if (job.asset_id)
      await client.query(
        `INSERT INTO asset_service_history(asset_id,ticket_id,history_type,notes) SELECT $1,$2,'service',$3 WHERE NOT EXISTS(SELECT 1 FROM asset_service_history WHERE ticket_id=$2 AND history_type='service')`,
        [
          job.asset_id,
          job.ticket_id,
          data.remarks || "Service completed and confirmed by customer",
        ],
      );
    await client.query("COMMIT");
    return { ticketId: ticketNo, status: "customer_confirmed", confirmation };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
async function createReview(userId, ticketNo, data) {
  const customer = await customerForUser(userId);
  const { rows } = await pool().query(
    `INSERT INTO reviews(customer_id,job_id,rating,comment) SELECT $1,j.id,$3,$4 FROM technician_jobs j JOIN service_tickets s ON s.id=j.ticket_id WHERE s.customer_id=$1 AND s.ticket_no=$2 AND s.status IN ('customer_confirmed','closed','completed') ON CONFLICT(customer_id,job_id) DO NOTHING RETURNING id,rating,comment,created_at AS "createdAt"`,
    [customer.id, ticketNo, data.rating, data.comment],
  );
  if (!rows[0])
    throw Object.assign(
      new Error("Completed service not found or already reviewed"),
      { status: 409 },
    );
  return rows[0];
}
async function assets(userId, query = {}) {
  const customer = await customerForUser(userId),
    { page, pageSize, offset } = pagination(query),
    [count, result] = await Promise.all([
      pool().query(
        "SELECT COUNT(*)::int total FROM sign_board_assets WHERE customer_id=$1",
        [customer.id],
      ),
      pool().query(
        `SELECT a.asset_no AS "assetNo",o.order_no AS "orderNo",a.details,a.location,a.installation_date AS "installationDate",a.warranty_start AS "warrantyStart",a.warranty_until AS "warrantyUntil",a.status,a.photos,a.created_at AS "createdAt" FROM sign_board_assets a LEFT JOIN orders o ON o.id=a.order_id WHERE a.customer_id=$1 ORDER BY a.id DESC LIMIT $2 OFFSET $3`,
        [customer.id, pageSize, offset],
      ),
    ]),
    total = count.rows[0].total;
  return {
    data: result.rows.map((x) => ({
      ...x,
      warrantyActive: Boolean(
        x.warrantyUntil &&
        new Date(x.warrantyUntil) >= new Date() &&
        x.status !== "retired",
      ),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
async function asset(userId, assetNo) {
  const customer = await customerForUser(userId);
  const row = (
    await pool().query(
      `SELECT a.id,a.asset_no AS "assetNo",o.order_no AS "orderNo",a.details,a.location,a.installation_date AS "installationDate",a.warranty_start AS "warrantyStart",a.warranty_until AS "warrantyUntil",a.status,a.photos,a.created_at AS "createdAt",q.token AS "qrToken",q.active AS "qrActive" FROM sign_board_assets a LEFT JOIN orders o ON o.id=a.order_id LEFT JOIN qr_codes q ON q.asset_id=a.id WHERE a.customer_id=$1 AND a.asset_no=$2`,
      [customer.id, assetNo],
    )
  ).rows[0];
  if (!row) throw Object.assign(new Error("Asset not found"), { status: 404 });
  row.history = (
    await pool().query(
      `SELECT h.id,h.history_type AS type,h.notes,s.ticket_no AS "ticketId",h.created_at AS "createdAt" FROM asset_service_history h LEFT JOIN service_tickets s ON s.id=h.ticket_id WHERE h.asset_id=$1 ORDER BY h.id DESC`,
      [row.id],
    )
  ).rows;
  row.warrantyActive = Boolean(
    row.warrantyUntil &&
    new Date(row.warrantyUntil) >= new Date() &&
    row.status !== "retired",
  );
  delete row.id;
  return row;
}
async function deleteAccount(userId, password, user) {
  const { rows } = await pool().query(
    "SELECT password_hash FROM users WHERE id=$1",
    [userId],
  );
  if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash)))
    throw Object.assign(new Error("Password is incorrect"), { status: 422 });
  await pool().query(
    `UPDATE users SET status='deleted',email=CONCAT('deleted+',id,'+',EXTRACT(EPOCH FROM NOW())::bigint,'@signfix.invalid'),mobile=NULL,updated_at=NOW() WHERE id=$1`,
    [userId],
  );
  if (user.jti && user.exp)
    await pool().query(
      "INSERT INTO revoked_tokens(jti,user_id,expires_at) VALUES($1,$2,to_timestamp($3)) ON CONFLICT DO NOTHING",
      [user.jti, userId, user.exp],
    );
  return {
    deleted: true,
    message:
      "Account has been deactivated and personal login details have been removed.",
  };
}

async function ownedPayment(userId, id) {
  const row = (
    await pool().query(
      `SELECT p.id,p.amount,p.status,p.reference,p.payment_type AS "type",p.provider,p.provider_payment_id AS "providerPaymentId",p.currency,p.refunded_amount AS "refundedAmount",p.captured_at AS "capturedAt",p.verified_at AS "verifiedAt",p.created_at AS "createdAt",q.quotation_no AS "quotationNo" FROM payments p JOIN quotations q ON q.id=p.quotation_id JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id WHERE c.user_id=$1 AND p.id=$2`,
      [userId, id],
    )
  ).rows[0];
  if (!row)
    throw Object.assign(new Error("Payment not found"), { status: 404 });
  return row;
}
async function createPayment(userId, data) {
  const reference = `PAY-${crypto.randomUUID()}`;
  const { rows } = await pool().query(
    `INSERT INTO payments(quotation_id,amount,status,reference,payment_type,provider,currency,metadata) SELECT q.id,CASE WHEN $3='advance' THEN ROUND(q.final_amount*.25,2) ELSE q.final_amount END,'created',$4,$3,COALESCE(NULLIF($5,''),'manual'),'INR',jsonb_build_object('idempotencyKey',$6) FROM quotations q JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id WHERE c.user_id=$1 AND q.quotation_no=$2 AND q.status='approved' AND c.payments_enabled=TRUE AND NOT EXISTS(SELECT 1 FROM payments p WHERE p.metadata->>'idempotencyKey'=$6) RETURNING id`,
    [
      userId,
      data.quotationNo,
      data.type,
      reference,
      process.env.PAYMENT_GATEWAY_PROVIDER || "",
      data.idempotencyKey,
    ],
  );
  if (!rows[0]) {
    const existing = (
      await pool().query(
        `SELECT p.id FROM payments p JOIN quotations q ON q.id=p.quotation_id JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id WHERE c.user_id=$1 AND p.metadata->>'idempotencyKey'=$2`,
        [userId, data.idempotencyKey],
      )
    ).rows[0];
    if (existing) return ownedPayment(userId, existing.id);
    throw Object.assign(
      new Error(
        "Approved quotation with customer payments enabled was not found",
      ),
      { status: 409 },
    );
  }
  return ownedPayment(userId, rows[0].id);
}
async function payments(userId) {
  return {
    data: (
      await pool().query(
        `SELECT p.id,p.amount,p.status,p.reference,p.payment_type AS type,p.provider,p.currency,p.refunded_amount AS "refundedAmount",p.created_at AS "createdAt",q.quotation_no AS "quotationNo" FROM payments p JOIN quotations q ON q.id=p.quotation_id JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id WHERE c.user_id=$1 ORDER BY p.id DESC`,
        [userId],
      )
    ).rows,
  };
}
async function payment(userId, id) {
  return ownedPayment(userId, id);
}
function verifyGatewayProof(payment, data, status) {
  const secret = process.env.PAYMENT_GATEWAY_SECRET;
  if (!secret)
    throw Object.assign(
      new Error("Payment gateway verification is not configured"),
      { status: 503 },
    );
  const expected = crypto
      .createHmac("sha256", secret)
      .update(`${payment.reference}:${data.providerPaymentId}:${status}`)
      .digest("hex"),
    given = Buffer.from(data.proof),
    wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted))
    throw Object.assign(new Error("Invalid payment provider proof"), {
      status: 401,
    });
}
async function capturePayment(userId, id, data) {
  const current = await ownedPayment(userId, id);
  verifyGatewayProof(current, data, "captured");
  const { rows } = await pool().query(
    `UPDATE payments SET status='captured',provider_payment_id=$2,captured_at=NOW(),verified_at=NOW(),updated_at=NOW() WHERE id=$1 AND status IN ('created','authorized') RETURNING id`,
    [id, data.providerPaymentId],
  );
  if (!rows[0])
    throw Object.assign(
      new Error("Payment cannot be captured in its current state"),
      { status: 409 },
    );
  return ownedPayment(userId, id);
}
async function verifyPayment(userId, id, data) {
  const current = await ownedPayment(userId, id);
  verifyGatewayProof(current, data, data.status);
  await pool().query(
    `UPDATE payments SET status=$2,provider_payment_id=$3,verified_at=NOW(),captured_at=CASE WHEN $2='captured' THEN COALESCE(captured_at,NOW()) ELSE captured_at END,updated_at=NOW() WHERE id=$1`,
    [id, data.status, data.providerPaymentId],
  );
  return ownedPayment(userId, id);
}
async function refundPayment(userId, id, data) {
  await ownedPayment(userId, id);
  throw Object.assign(
    new Error(
      "Refund processing requires a configured payment-provider integration",
    ),
    { status: 501, errorCode: "PAYMENT_REFUND_PROVIDER_REQUIRED" },
  );
}

const visibleQuotationStatuses = [
  "admin_approved",
  "changes_requested",
  "approved",
  "rejected",
  "expired",
];
function paymentCapability(enabled, quotation) {
  const configured =
    process.env.PAYMENT_GATEWAY_ENABLED === "true" &&
    process.env.PAYMENT_GATEWAY_PROVIDER === "razorpay" &&
    Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  return {
    enabled: Boolean(enabled && configured),
    provider:
      enabled && configured ? process.env.PAYMENT_GATEWAY_PROVIDER : null,
    options:
      enabled && configured && quotation.status === "approved"
        ? ["advance", "full"]
        : [],
  };
}
async function quotations(userId) {
  const { rows } = await pool().query(
    `SELECT q.id,q.quotation_no AS "quotationNo",o.order_no AS "orderNo",o.specifications AS "productDetails",q.subtotal,q.installation,q.transportation,q.discount,q.gst_rate AS "gstRate",q.gst,q.final_amount AS "finalAmount",q.terms,q.valid_until AS "validUntil",q.status,c.payments_enabled AS "customerPaymentsEnabled" FROM quotations q JOIN orders o ON o.id=q.order_id JOIN customers c ON c.id=o.customer_id WHERE c.user_id=$1 AND q.status=ANY($2::varchar[]) ORDER BY q.id DESC`,
    [userId, visibleQuotationStatuses],
  );
  return rows.map((row) => {
    const payments = paymentCapability(row.customerPaymentsEnabled, row);
    delete row.customerPaymentsEnabled;
    return {
      ...row,
      quantity: Number(row.productDetails?.quantity || 0),
      payments,
      availableActions:
        row.status === "admin_approved" &&
        (!row.validUntil ||
          new Date(row.validUntil) >= new Date(new Date().toDateString()))
          ? ["approve", "request_changes"]
          : [],
    };
  });
}
async function quotation(userId, quotationNo) {
  const found = (await quotations(userId)).find(
    (x) => x.quotationNo === quotationNo,
  );
  if (!found)
    throw Object.assign(new Error("Quotation not found"), { status: 404 });
  const items = (
    await pool().query(
      'SELECT id,description,quantity,unit_price AS "unitPrice",amount FROM quotation_items WHERE quotation_id=$1 ORDER BY id',
      [found.id],
    )
  ).rows;
  return { ...found, items };
}
async function quotationAction(userId, quotationNo, action, notes) {
  const allowed = { approve: "approved", request_changes: "changes_requested" };
  const status = allowed[action];
  if (!status)
    throw Object.assign(new Error("Unsupported quotation action"), {
      status: 422,
    });
  const { rows } = await pool().query(
    `UPDATE quotations q SET status=$3,updated_at=NOW() FROM orders o,customers c WHERE q.order_id=o.id AND o.customer_id=c.id AND c.user_id=$1 AND q.quotation_no=$2 AND q.status='admin_approved' AND q.admin_approved_at IS NOT NULL AND (q.valid_until IS NULL OR q.valid_until>=CURRENT_DATE) RETURNING q.quotation_no AS "quotationNo",q.status,o.id AS "orderId"`,
    [userId, quotationNo, status],
  );
  if (!rows[0])
    throw Object.assign(
      new Error("Quotation not found, expired, or not approved by an admin"),
      { status: 409 },
    );
  if (action === "approve")
    await pool().query(
      "UPDATE orders SET status='approved',updated_at=NOW() WHERE id=$1",
      [rows[0].orderId],
    );
  await pool().query(
    "INSERT INTO audit_logs(user_id,action,entity_type,metadata) VALUES($1,$2,$3,$4::jsonb)",
    [
      userId,
      `quotation.${action}`,
      "quotation",
      JSON.stringify({ quotationNo, notes }),
    ],
  );
  delete rows[0].orderId;
  return rows[0];
}

const serviceTimeline = [
  ["submitted", "Submitted"],
  ["under_review", "Under Review"],
  ["technician_assigned", "Technician Assigned"],
  ["accepted", "Accepted"],
  ["on_the_way", "On The Way"],
  ["reached_location", "Reached Location"],
  ["inspection_started", "Inspection Started"],
  ["work_in_progress", "Work In Progress"],
  ["completed", "Completed"],
  ["customer_confirmed", "Customer Confirmed"],
  ["closed", "Closed"],
];
async function serviceTracking(userId, ticketNo) {
  const { rows } = await pool().query(
    `SELECT s.ticket_no AS id,s.category,s.description,s.location,s.photos,s.priority,s.status,s.created_at AS "createdAt",s.updated_at AS "updatedAt",j.id AS "jobId",j.status AS "jobStatus",j.scheduled_at AS "estimatedVisit",j.evidence,j.customer_confirmation AS "customerConfirmation",j.accepted_at AS "acceptedAt",j.travel_started_at AS "travelStartedAt",j.reached_at AS "reachedAt",j.inspection_started_at AS "inspectionStartedAt",j.work_started_at AS "workStartedAt",j.work_completed_at AS "workCompletedAt",j.closed_at AS "closedAt",tu.name AS "technicianName",tu.mobile AS "technicianContact" FROM service_tickets s JOIN customers c ON c.id=s.customer_id LEFT JOIN technician_jobs j ON j.ticket_id=s.id LEFT JOIN technicians t ON t.id=j.technician_id LEFT JOIN users tu ON tu.id=t.user_id WHERE c.user_id=$1 AND s.ticket_no=$2`,
    [userId, ticketNo],
  );
  if (!rows[0])
    throw Object.assign(new Error("Service request not found"), {
      status: 404,
    });
  const item = rows[0],
    history = item.jobId
      ? (
          await pool().query(
            'SELECT status,notes,created_at AS "createdAt" FROM job_status_history WHERE job_id=$1 ORDER BY created_at',
            [item.jobId],
          )
        ).rows
      : [],
    jobPhotos = item.jobId
      ? (
          await pool().query(
            'SELECT id,photo_type AS type,storage_key AS url,mime_type AS "mimeType",created_at AS "createdAt" FROM job_photos WHERE job_id=$1 ORDER BY created_at',
            [item.jobId],
          )
        ).rows
      : [];
  const aliases = { assigned: "technician_assigned" },
    current =
      aliases[item.status] ||
      aliases[item.jobStatus] ||
      item.status ||
      "submitted",
    currentIndex = Math.max(
      0,
      serviceTimeline.findIndex(([key]) => key === current),
    );
  const eventByStatus = new Map(
    history.map((event) => [aliases[event.status] || event.status, event]),
  );
  const timestamps = {
    submitted: item.createdAt,
    accepted: item.acceptedAt,
    on_the_way: item.travelStartedAt,
    reached_location: item.reachedAt,
    inspection_started: item.inspectionStartedAt,
    work_in_progress: item.workStartedAt,
    completed: item.workCompletedAt,
    customer_confirmed: item.customerConfirmation?.confirmedAt,
    closed: item.closedAt,
  };
  const confirmed = Boolean(item.customerConfirmation?.confirmedAt),
    closed = current === "closed";
  const timeline = serviceTimeline.map(([status, label], index) => {
    let state =
      index < currentIndex
        ? "completed"
        : index === currentIndex
          ? "current"
          : "upcoming";
    if (status === "customer_confirmed" && confirmed) state = "completed";
    if (status === "closed" && closed) state = "completed";
    const event = eventByStatus.get(status);
    return {
      status,
      label,
      state,
      completed: state === "completed",
      current: state === "current",
      occurredAt: event?.createdAt || timestamps[status] || null,
      notes: event?.notes || null,
    };
  });
  return {
    ...item,
    jobLocation: item.location,
    servicePhotos: Array.isArray(item.photos) ? item.photos : [],
    technicianPhotos: jobPhotos,
    notes: {
      customer: item.description,
      service: item.evidence?.serviceNotes || null,
      workDescription: item.evidence?.workDescription || null,
      additionalRemarks: item.evidence?.additionalRemarks || null,
    },
    timeline,
  };
}

async function notifications(userId) {
  return (
    await pool().query(
      'SELECT id,channel,event_key AS "eventKey",title,body,data,read_at AS "readAt",created_at AS "createdAt" FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',
      [userId],
    )
  ).rows;
}
async function registerNotificationDevice(userId, data) {
  await require("../../database").registerDeviceToken(
    userId,
    data.token,
    data.platform,
  );
  return { registered: true, platform: data.platform };
}
async function unregisterNotificationDevice(userId, token) {
  const result = await pool().query(
    "UPDATE device_tokens SET active=FALSE,last_seen_at=NOW() WHERE user_id=$1 AND token=$2",
    [userId, token],
  );
  return { unregistered: Boolean(result.rowCount) };
}
async function readNotification(userId, id) {
  const { rows } = await pool().query(
    'UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND user_id=$2 RETURNING id,read_at AS "readAt"',
    [id, userId],
  );
  if (!rows[0])
    throw Object.assign(new Error("Notification not found"), { status: 404 });
  return rows[0];
}
async function readAllNotifications(userId) {
  const result = await pool().query(
    "UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL",
    [userId],
  );
  return { updated: result.rowCount };
}

async function createDesign(userId, data) {
  const customer = await customerForUser(userId);
  let orderId = null;
  if (data.orderNo) {
    const result = await pool().query(
      "SELECT id FROM orders WHERE order_no=$1 AND customer_id=$2",
      [data.orderNo, customer.id],
    );
    orderId = result.rows[0]?.id;
    if (!orderId)
      throw Object.assign(new Error("Order not found"), { status: 404 });
  }
  const { rows } = await pool().query(
    `INSERT INTO design_requests(customer_id,order_id,requirements,status) VALUES($1,$2,$3::jsonb,'requested') RETURNING id,status,requirements,created_at AS "createdAt"`,
    [customer.id, orderId, JSON.stringify(data)],
  );
  return {
    ...rows[0],
    disclaimer: "Concept/mockup only; not final production artwork.",
  };
}
async function designs(userId) {
  return (
    await pool().query(
      `SELECT d.id,o.order_no AS "orderNo",d.status,d.requirements,d.created_at AS "createdAt",COUNT(dc.id)::int AS "conceptCount" FROM design_requests d JOIN customers c ON c.id=d.customer_id LEFT JOIN orders o ON o.id=d.order_id LEFT JOIN design_concepts dc ON dc.request_id=d.id WHERE c.user_id=$1 GROUP BY d.id,o.order_no ORDER BY d.id DESC`,
      [userId],
    )
  ).rows;
}
async function design(userId, id) {
  const { rows } = await pool().query(
    `SELECT d.id,d.status,d.requirements,d.customer_notes AS "customerNotes",d.created_at AS "createdAt",d.updated_at AS "updatedAt",o.order_no AS "orderNo" FROM design_requests d JOIN customers c ON c.id=d.customer_id LEFT JOIN orders o ON o.id=d.order_id WHERE c.user_id=$1 AND d.id=$2`,
    [userId, id],
  );
  if (!rows[0])
    throw Object.assign(new Error("Design request not found"), { status: 404 });
  const [concepts, jobs, files] = await Promise.all([
    pool().query(
      `SELECT dc.id,COALESCE(df.id::text,dc.image_url) AS "imageRef",CASE WHEN df.id IS NULL THEN dc.image_url ELSE '/api/customer/design-files/'||df.id END AS "imageUrl",dc.prompt,dc.status,dc.admin_notes AS "adminNotes",dc.customer_notes AS "customerNotes",dc.created_at AS "createdAt" FROM design_concepts dc LEFT JOIN LATERAL (SELECT id FROM design_files WHERE concept_id=dc.id ORDER BY id DESC LIMIT 1) df ON TRUE WHERE dc.request_id=$1 ORDER BY dc.id DESC`,
      [id],
    ),
    pool().query(
      `SELECT id,status,result,error,created_at AS "createdAt",updated_at AS "updatedAt" FROM ai_jobs WHERE kind='generate_design' AND payload->>'requestId'=$1 ORDER BY id DESC LIMIT 10`,
      [String(id)],
    ),
    pool().query(
      `SELECT id,original_name AS name,mime_type AS "mimeType",size_bytes AS size,'/api/customer/design-files/'||id AS url,created_at AS "createdAt" FROM design_files WHERE request_id=$1 AND file_kind='request_attachment' ORDER BY id`,
      [id],
    ),
  ]);
  return {
    ...rows[0],
    files: files.rows,
    concepts: concepts.rows,
    generationJobs: jobs.rows,
    disclaimer: "Concept/mockup only; not final production artwork.",
  };
}
function validDesignFile(file) {
  const b = file.buffer || Buffer.alloc(0);
  return (
    (file.mimetype === "image/jpeg" &&
      b[0] === 0xff &&
      b[1] === 0xd8 &&
      b[2] === 0xff) ||
    (file.mimetype === "image/png" &&
      b
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (file.mimetype === "image/webp" &&
      b.subarray(0, 4).toString() === "RIFF" &&
      b.subarray(8, 12).toString() === "WEBP") ||
    (file.mimetype === "application/pdf" &&
      b.subarray(0, 5).toString() === "%PDF-")
  );
}
async function attachDesignFiles(userId, id, files) {
  if (!files.length)
    throw Object.assign(new Error("At least one design file is required"), {
      status: 422,
    });
  if (files.some((file) => !validDesignFile(file)))
    throw Object.assign(
      new Error("A design file does not match its declared type"),
      { status: 415 },
    );
  await design(userId, id);
  const fs = require("fs/promises"),
    path = require("path"),
    { uploadDir } = require("../../config"),
    written = [];
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    for (const file of files) {
      const ext = {
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/webp": ".webp",
          "application/pdf": ".pdf",
        }[file.mimetype],
        name = `design-${id}-${crypto.randomUUID()}${ext}`;
      await fs.writeFile(path.join(uploadDir, name), file.buffer, {
        flag: "wx",
      });
      written.push(name);
      await client.query(
        `INSERT INTO design_files(request_id,file_kind,original_name,storage_key,mime_type,size_bytes,uploaded_by) VALUES($1,'request_attachment',$2,$3,$4,$5,$6)`,
        [id, file.originalname, name, file.mimetype, file.size, userId],
      );
    }
    await client.query(
      "UPDATE design_requests SET updated_at=NOW() WHERE id=$1",
      [id],
    );
    await client.query("COMMIT");
    return design(userId, id);
  } catch (e) {
    await client.query("ROLLBACK");
    await Promise.allSettled(
      written.map((name) => fs.unlink(path.join(uploadDir, name))),
    );
    throw e;
  } finally {
    client.release();
  }
}
async function designFile(userId, id) {
  const { rows } = await pool().query(
    `SELECT df.storage_key AS "storageKey",df.original_name AS "originalName",df.mime_type AS "mimeType" FROM design_files df JOIN design_requests dr ON dr.id=df.request_id JOIN customers c ON c.id=dr.customer_id WHERE df.id=$1 AND c.user_id=$2`,
    [id, userId],
  );
  if (!rows[0])
    throw Object.assign(new Error("Design file not found"), { status: 404 });
  return rows[0];
}
async function generateDesign(userId, id, customPrompt) {
  const request = await design(userId, id);
  const r = request.requirements || {};
  const prompt =
    customPrompt ||
    `Create a realistic storefront sign-board concept mockup. Sign type: ${r.signType}. Business text: ${r.businessText}. Style: ${r.style || "professional"}. Lighting: ${r.lighting || "appropriate"}. Background: ${r.background || "storefront"}. ${r.storefrontUrl ? `Use storefront reference: ${r.storefrontUrl}.` : ""} This is a visual concept only, not production artwork.`;
  const job = await require("../../services/aiQueue").enqueue(
    "generate_design",
    { requestId: Number(id), prompt },
  );
  await pool().query(
    "UPDATE design_requests SET status='generation_queued',updated_at=NOW() WHERE id=$1",
    [id],
  );
  return {
    requestId: Number(id),
    jobId: job.id,
    status: "queued",
    disclaimer: "Concept/mockup only; not final production artwork.",
  };
}
async function updateDesign(userId, id, action, notes, conceptId) {
  const statuses = {
      regenerate: "regeneration_requested",
      request_modification: "modification_requested",
      use: "selected",
      approve: "customer_approved",
      reject: "customer_rejected",
      send_to_admin: "sent_to_admin",
    },
    status = statuses[action];
  if (!status)
    throw Object.assign(new Error("Unsupported design action"), {
      status: 422,
    });
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const row = (
      await client.query(
        `UPDATE design_requests d SET status=$3,customer_notes=COALESCE($4,customer_notes),requirements=requirements||$5::jsonb,updated_at=NOW() FROM customers c WHERE d.customer_id=c.id AND c.user_id=$1 AND d.id=$2 RETURNING d.id,d.status,d.requirements`,
        [
          userId,
          id,
          status,
          notes || null,
          JSON.stringify({
            selectedConceptId: conceptId || null,
          }),
        ],
      )
    ).rows[0];
    if (!row)
      throw Object.assign(new Error("Design request not found"), {
        status: 404,
      });
    if (["approve", "reject", "use"].includes(action)) {
      if (!conceptId)
        throw Object.assign(
          new Error("A concept must be selected for this action"),
          { status: 422 },
        );
      const concept = await client.query(
        `UPDATE design_concepts SET status=$3,customer_notes=COALESCE($4,customer_notes) WHERE id=$1 AND request_id=$2 RETURNING id`,
        [
          conceptId,
          id,
          action === "reject" ? "customer_rejected" : "customer_approved",
          notes,
        ],
      );
      if (!concept.rows[0])
        throw Object.assign(new Error("Design concept not found"), {
          status: 404,
        });
      if (action !== "reject")
        await client.query(
          `UPDATE design_concepts SET status='not_selected' WHERE request_id=$1 AND id<>$2 AND status<>'approved_attached'`,
          [id, conceptId],
        );
    }
    await client.query("COMMIT");
    return {
      ...row,
      disclaimer: "Concept/mockup only; not final production artwork.",
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function saveConversation(
  userId,
  message,
  response,
  escalate,
  metadata = {},
) {
  const { rows } = await pool().query(
    `INSERT INTO ai_conversations(user_id,question,response,escalation_status,metadata) VALUES($1,$2,$3,$4,$5::jsonb) RETURNING id,created_at AS "createdAt"`,
    [
      userId,
      message,
      response,
      escalate ? "requested" : "none",
      JSON.stringify(metadata),
    ],
  );
  if (escalate)
    await pool().query(
      "INSERT INTO support_escalations(conversation_id,user_id,reason) VALUES($1,$2,$3)",
      [rows[0].id, userId, message],
    );
  return rows[0];
}
async function conversations(userId) {
  return (
    await pool().query(
      'SELECT id,question,response,metadata,escalation_status AS "escalationStatus",created_at AS "createdAt" FROM ai_conversations WHERE user_id=$1 ORDER BY id DESC LIMIT 100',
      [userId],
    )
  ).rows;
}
async function createLead(userId, data) {
  const customer = await customerForUser(userId);
  const { rows } = await pool().query(
    `INSERT INTO ai_leads(customer_id,requirement,product,estimated_budget,contact,metadata) VALUES($1,$2,$3,$4,$5,$6::jsonb) RETURNING id,status,metadata,created_at AS "createdAt"`,
    [
      customer.id,
      data.requirement,
      data.product,
      data.budget,
      data.contact,
      JSON.stringify(data.requirements || {}),
    ],
  );
  return rows[0];
}

module.exports = {
  dashboard,
  orderOptions,
  serviceOptions,
  profile,
  updateProfile,
  orders,
  services,
  addAddress,
  updateAddress,
  deleteAddress,
  order,
  cancelOrder,
  cancelService,
  confirmService,
  createReview,
  assets,
  asset,
  deleteAccount,
  createPayment,
  payments,
  payment,
  capturePayment,
  verifyPayment,
  refundPayment,
  quotations,
  quotation,
  quotationAction,
  serviceTracking,
  notifications,
  registerNotificationDevice,
  unregisterNotificationDevice,
  readNotification,
  readAllNotifications,
  createDesign,
  designs,
  design,
  attachDesignFiles,
  designFile,
  generateDesign,
  updateDesign,
  saveConversation,
  conversations,
  createLead,
};
