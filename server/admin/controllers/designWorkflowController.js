const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const db = require("../../database");
const { uploadDir } = require("../../config");

const pool = () => db.getPool();

function validFile(file) {
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

async function list(req, res) {
  const { rows } = await pool().query(
    `SELECT dr.id,o.order_no AS "orderNo",u.name AS customer,dr.status,dr.requirements,dr.admin_notes AS "adminNotes",dr.created_at AS "createdAt",COUNT(dc.id)::int AS "conceptCount" FROM design_requests dr JOIN customers c ON c.id=dr.customer_id JOIN users u ON u.id=c.user_id LEFT JOIN orders o ON o.id=dr.order_id LEFT JOIN design_concepts dc ON dc.request_id=dr.id GROUP BY dr.id,o.order_no,u.name ORDER BY dr.id DESC`,
  );
  res.json({ data: rows, total: rows.length });
}

async function detail(req, res) {
  const request = (
    await pool().query(
      `SELECT dr.id,dr.customer_id AS "customerId",o.order_no AS "orderNo",u.name AS customer,dr.status,dr.requirements,dr.admin_notes AS "adminNotes",dr.customer_notes AS "customerNotes",dr.metadata,dr.created_at AS "createdAt",dr.updated_at AS "updatedAt" FROM design_requests dr JOIN customers c ON c.id=dr.customer_id JOIN users u ON u.id=c.user_id LEFT JOIN orders o ON o.id=dr.order_id WHERE dr.id=$1`,
      [req.params.id],
    )
  ).rows[0];
  if (!request)
    throw Object.assign(new Error("Design request not found"), { status: 404 });
  const [files, concepts] = await Promise.all([
    pool().query(
      `SELECT id,original_name AS name,mime_type AS "mimeType",size_bytes AS size,'/api/admin/operations/design-files/'||id AS url,created_at AS "createdAt" FROM design_files WHERE request_id=$1 AND file_kind='request_attachment' ORDER BY id`,
      [req.params.id],
    ),
    pool().query(
      `SELECT dc.id,CASE WHEN df.id IS NULL THEN dc.image_url ELSE '/api/admin/operations/design-files/'||df.id END AS "imageUrl",dc.prompt,dc.status,dc.admin_notes AS "adminNotes",q.quotation_no AS "quotationNo",dc.created_at AS "createdAt" FROM design_concepts dc LEFT JOIN LATERAL (SELECT id FROM design_files WHERE concept_id=dc.id ORDER BY id DESC LIMIT 1) df ON TRUE LEFT JOIN quotations q ON q.id=dc.quotation_id WHERE dc.request_id=$1 ORDER BY dc.id DESC`,
      [req.params.id],
    ),
  ]);
  res.json({ ...request, files: files.rows, concepts: concepts.rows });
}

async function review(req, res) {
  const statuses = {
    review: "under_review",
    request_information: "information_requested",
    ready: "concept_ready",
    close: "closed",
  };
  const status = statuses[req.body.action];
  const { rows } = await pool().query(
    `UPDATE design_requests SET status=$2,admin_notes=COALESCE($3,admin_notes),metadata=metadata||$4::jsonb,updated_at=NOW() WHERE id=$1 RETURNING id,status,admin_notes AS "adminNotes"`,
    [
      req.params.id,
      status,
      req.body.notes,
      JSON.stringify({
        lastReviewedBy: req.user.id,
        lastReviewAction: req.body.action,
      }),
    ],
  );
  if (!rows[0])
    throw Object.assign(new Error("Design request not found"), { status: 404 });
  res.json(rows[0]);
}

async function addConcept(req, res) {
  const file = req.file;
  if (!file)
    throw Object.assign(new Error("A concept image is required"), {
      status: 422,
    });
  if (file.mimetype === "application/pdf" || !validFile(file))
    throw Object.assign(
      new Error("A valid JPEG, PNG, or WebP concept image is required"),
      { status: 415 },
    );
  const extension = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  }[file.mimetype];
  const storageKey = `concept-${req.params.id}-${crypto.randomUUID()}${extension}`;
  const client = await pool().connect();
  let written = false;
  try {
    await client.query("BEGIN");
    const request = (
      await client.query(
        "SELECT id,order_id FROM design_requests WHERE id=$1 FOR UPDATE",
        [req.params.id],
      )
    ).rows[0];
    if (!request)
      throw Object.assign(new Error("Design request not found"), {
        status: 404,
      });
    await fs.writeFile(path.join(uploadDir, storageKey), file.buffer, {
      flag: "wx",
    });
    written = true;
    const concept = (
      await client.query(
        `INSERT INTO design_concepts(request_id,order_id,image_url,prompt,status,admin_notes) VALUES($1,$2,NULL,$3,'concept_ready',$4) RETURNING id,status`,
        [
          request.id,
          request.order_id,
          req.body.prompt || null,
          req.body.notes || null,
        ],
      )
    ).rows[0];
    const stored = (
      await client.query(
        `INSERT INTO design_files(request_id,concept_id,file_kind,original_name,storage_key,mime_type,size_bytes,uploaded_by) VALUES($1,$2,'concept',$3,$4,$5,$6,$7) RETURNING id`,
        [
          request.id,
          concept.id,
          file.originalname,
          storageKey,
          file.mimetype,
          file.size,
          req.user.id,
        ],
      )
    ).rows[0];
    await client.query(
      `UPDATE design_requests SET status='concept_ready',updated_at=NOW() WHERE id=$1`,
      [request.id],
    );
    await client.query("COMMIT");
    res
      .status(201)
      .json({
        ...concept,
        imageUrl: `/api/admin/operations/design-files/${stored.id}`,
      });
  } catch (error) {
    await client.query("ROLLBACK");
    if (written)
      await fs.unlink(path.join(uploadDir, storageKey)).catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function conceptAction(req, res) {
  const statuses = {
    approve: "approved",
    reject: "rejected",
    request_modification: "modification_requested",
    attach_quotation: "approved_attached",
  };
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const concept = (
      await client.query(
        `SELECT dc.id,dc.request_id,dr.customer_id,dr.order_id FROM design_concepts dc JOIN design_requests dr ON dr.id=dc.request_id WHERE dc.id=$1 AND dc.request_id=$2 FOR UPDATE OF dc`,
        [req.params.conceptId, req.params.id],
      )
    ).rows[0];
    if (!concept)
      throw Object.assign(new Error("Design concept not found"), {
        status: 404,
      });
    let quotationId = null;
    if (req.body.action === "attach_quotation") {
      if (!req.body.quotationNo)
        throw Object.assign(new Error("Quotation number is required"), {
          status: 422,
        });
      const quotation = (
        await client.query(
          `SELECT q.id,o.customer_id,o.id AS order_id FROM quotations q JOIN orders o ON o.id=q.order_id WHERE q.quotation_no=$1`,
          [req.body.quotationNo],
        )
      ).rows[0];
      if (
        !quotation ||
        quotation.customer_id !== concept.customer_id ||
        (concept.order_id && quotation.order_id !== concept.order_id)
      )
        throw Object.assign(
          new Error(
            "Quotation must belong to the design request customer and order",
          ),
          { status: 422 },
        );
      quotationId = quotation.id;
    }
    const row = (
      await client.query(
        `UPDATE design_concepts SET status=$3,admin_notes=COALESCE($4,admin_notes),quotation_id=COALESCE($5,quotation_id) WHERE id=$1 AND request_id=$2 RETURNING id,status`,
        [
          req.params.conceptId,
          req.params.id,
          statuses[req.body.action],
          req.body.notes,
          quotationId,
        ],
      )
    ).rows[0];
    await client.query(
      `UPDATE design_requests SET status=$2,admin_notes=COALESCE($3,admin_notes),updated_at=NOW() WHERE id=$1`,
      [
        req.params.id,
        req.body.action === "attach_quotation"
          ? "quotation_attached"
          : statuses[req.body.action],
        req.body.notes,
      ],
    );
    await client.query("COMMIT");
    res.json(row);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function file(req, res, next) {
  const found = (
    await pool().query(
      'SELECT storage_key AS "storageKey",original_name AS "originalName",mime_type AS "mimeType" FROM design_files WHERE id=$1',
      [req.params.id],
    )
  ).rows[0];
  if (!found)
    throw Object.assign(new Error("Design file not found"), { status: 404 });
  res
    .type(found.mimeType)
    .set(
      "Content-Disposition",
      `inline; filename="${String(found.originalName).replace(/["\r\n]/g, "_")}"`,
    )
    .sendFile(path.join(uploadDir, found.storageKey), (error) => {
      if (error && !res.headersSent)
        next(Object.assign(error, { status: error.statusCode || 404 }));
    });
}

module.exports = { list, detail, review, addConcept, conceptAction, file };
