const router = require("express").Router(),
  { z } = require("zod"),
  validate = require("../../middleware/validate"),
  { authenticate, authorize } = require("../../middleware/auth"),
  c = require("../controllers/operationsController"),
  design = require("../controllers/designWorkflowController"),
  designUpload = require("../../customer/middleware/designUpload");
router.use(
  authenticate,
  authorize("super_admin", "admin", "service_manager", "technician_manager"),
);
router.get("/tickets", c.tickets);
router.get("/tickets/:id", c.ticket);
router.patch(
  "/tickets/:id",
  validate(
    z.object({
      priority: z.enum(["normal", "high", "emergency"]).optional(),
      technicianId: z.coerce.number().int().positive().nullable().optional(),
      adminNotes: z.string().max(4000).optional(),
      status: z.string().max(40).optional(),
    }),
  ),
  c.updateTicket,
);
router.get("/technicians", c.technicians);
router.post(
  "/technicians",
  validate(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      mobile: z.string().min(8),
      password: z.string().min(8),
      serviceAreas: z.array(z.string()).default([]),
      skills: z.array(z.string()).default([]),
    }),
  ),
  c.createTechnician,
);
router.get("/technicians/:id", c.technician);
router.patch(
  "/technicians/:id",
  validate(
    z.object({
      name: z.string().min(2).optional(),
      mobile: z.string().min(8).optional(),
      status: z.enum(["active", "disabled"]).optional(),
      serviceAreas: z.array(z.string()).optional(),
      skills: z.array(z.string()).optional(),
    }),
  ),
  c.updateTechnician,
);
const assetStatus = z.enum(["active", "under_service", "inactive", "retired"]);
const assetFields = z.object({
  location: z.record(z.any()).optional(),
  signType: z.string().min(1).optional(),
  size: z.string().min(1).optional(),
  material: z.string().min(1).optional(),
  installationDate: z.coerce.date().optional(),
  warrantyStart: z.coerce.date().optional(),
  warrantyUntil: z.coerce.date().optional(),
  status: assetStatus.optional(),
  photos: z.array(z.string().url()).max(20).optional(),
});
router.get("/assets", c.assets);
router.post(
  "/assets",
  validate(
    assetFields.extend({
      customerId: z.coerce.number().int().positive(),
      orderNo: z.string().max(30).optional(),
      location: z.record(z.any()),
      signType: z.string().min(1),
      size: z.string().min(1),
      material: z.string().min(1),
      installationDate: z.coerce.date(),
      photos: z.array(z.string().url()).max(20).default([]),
    }),
  ),
  c.createAsset,
);
router.get("/assets/:id", c.asset);
router.patch(
  "/assets/:id",
  validate(
    assetFields.refine((x) => Object.keys(x).length > 0, {
      message: "At least one asset field is required",
    }),
  ),
  c.updateAsset,
);
router.post(
  "/assets/:id/qr",
  validate(z.object({ action: z.enum(["rotate", "enable", "disable"]) })),
  c.updateAssetQr,
);
router.post(
  "/assets/:id/history",
  validate(
    z.object({
      type: z.enum(["service", "repair", "replacement"]),
      notes: z.string().min(2),
      ticketId: z.coerce.number().int().positive().optional(),
    }),
  ),
  c.addAssetHistory,
);
module.exports = router;
router.get("/design-requests", design.list);
router.get("/design-requests/:id", design.detail);
router.patch(
  "/design-requests/:id",
  validate(
    z.object({
      action: z.enum(["review", "request_information", "ready", "close"]),
      notes: z.string().max(4000).optional(),
    }),
  ),
  design.review,
);
router.post(
  "/design-requests/:id/concepts",
  designUpload.single("file"),
  design.addConcept,
);
router.patch(
  "/design-requests/:id/concepts/:conceptId",
  validate(
    z.object({
      action: z.enum([
        "approve",
        "reject",
        "request_modification",
        "attach_quotation",
      ]),
      notes: z.string().max(4000).optional(),
      quotationNo: z.string().max(30).optional(),
    }),
  ),
  design.conceptAction,
);
router.get("/design-files/:id", design.file);
router.get("/reviews",c.reviews);
module.exports = router;
