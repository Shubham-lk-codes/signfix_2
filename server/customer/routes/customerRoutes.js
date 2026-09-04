const router = require("express").Router();
const { z } = require("zod");
const controller = require("../controllers/customerController");
const validate = require("../../middleware/validate");
const { authenticate, authorize } = require("../../middleware/auth");
const designUpload = require("../middleware/designUpload");
router.use(authenticate, authorize("customer"));

const address = z.object({
  label: z.string().max(60).default("Other"),
  addressLine: z.string().min(3),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  pincode: z
    .string()
    .regex(/^\d{5,10}$/)
    .optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isDefault: z.boolean().default(false),
});
router.get("/dashboard", controller.dashboard);
router.get("/order-options", controller.orderOptions);
router.get("/service-options", controller.serviceOptions);
router.get("/profile", controller.profile);
router.patch(
  "/profile",
  validate(
    z
      .object({
        name: z.string().min(2).max(120).optional(),
        mobile: z.string().min(8).max(20).optional(),
        email: z.string().email().optional(),
        companyName: z.string().min(2).max(160).optional(),
        address: z.string().min(3).optional(),
        city: z.string().min(2).max(100).optional(),
        state: z.string().min(2).max(100).optional(),
        pincode: z
          .string()
          .regex(/^\d{5,10}$/)
          .optional(),
      })
      .refine((value) => Object.keys(value).length > 0, {
        message: "At least one profile field is required",
      }),
  ),
  controller.updateProfile,
);
router.get("/orders", controller.orders);
router.get("/services", controller.services);
router.post("/addresses", validate(address), controller.addAddress);
router.patch(
  "/addresses/:id",
  validate(
    address.partial().refine((value) => Object.keys(value).length > 0, {
      message: "At least one address field is required",
    }),
  ),
  controller.updateAddress,
);
router.delete("/addresses/:id", controller.deleteAddress);
router.get("/orders/:id", controller.order);
router.post(
  "/orders/:id/cancel",
  validate(z.object({ reason: z.string().min(3).max(1000) })),
  controller.cancelOrder,
);
router.get("/quotations", controller.quotations);
router.get("/quotations/:id", controller.quotation);
router.post(
  "/quotations/:id/action",
  validate(
    z.object({
      action: z.enum(["approve", "request_changes"]),
      notes: z.string().max(1000).optional(),
    }),
  ),
  controller.quotationAction,
);
router.get("/quotations/:id/pdf", controller.quotationPdf);
router.get("/services/:id/tracking", controller.serviceTracking);
router.post(
  "/services/:id/cancel",
  validate(z.object({ reason: z.string().min(3).max(1000) })),
  controller.cancelService,
);
router.post(
  "/services/:id/confirm-completion",
  validate(
    z.object({
      otp: z.string().regex(/^\d{6}$/),
      accepted: z.literal(true),
      remarks: z.string().max(1000).optional(),
    }),
  ),
  controller.confirmService,
);
router.post(
  "/services/:id/review",
  validate(
    z.object({
      rating: z.coerce.number().int().min(1).max(5),
      comment: z.string().max(2000).optional(),
    }),
  ),
  controller.createReview,
);
router.get("/assets", controller.assets);
router.get("/assets/:id", controller.asset);
router.get("/notifications", controller.notifications);
router.get("/notifications/config", controller.notificationConfig);
router.post(
  "/notifications/devices",
  validate(
    z.object({
      token: z.string().min(20),
      platform: z.enum(["android", "ios", "web"]),
    }),
  ),
  controller.registerNotificationDevice,
);
router.delete(
  "/notifications/devices",
  validate(z.object({ token: z.string().min(20) })),
  controller.unregisterNotificationDevice,
);
router.patch("/notifications/:id/read", controller.readNotification);
router.patch("/notifications/read-all", controller.readAllNotifications);
router.get("/payments", controller.payments);
router.get("/payments/:id", controller.payment);
router.post(
  "/payments/intents",
  validate(
    z.object({
      quotationNo: z.string().min(3),
      type: z.enum(["advance", "full"]),
      idempotencyKey: z.string().min(8).max(120),
    }),
  ),
  controller.createPayment,
);
router.post(
  "/payments/:id/verify",
  validate(
    z.object({
      razorpayPaymentId: z.string().min(3).max(160),
      razorpayOrderId: z.string().min(3).max(160),
      razorpaySignature: z.string().regex(/^[a-f0-9]{64}$/),
    }),
  ),
  controller.verifyPayment,
);
router.post("/payments/:id/retry", controller.retryPayment);
router.post("/payments/:id/cancel", controller.cancelPayment);
router.post(
  "/payments/:id/refunds",
  validate(
    z.object({
      amount: z.coerce.number().positive(),
      reason: z.string().min(3).max(1000),
    }),
  ),
  controller.refundPayment,
);
router.delete(
  "/account",
  validate(z.object({ password: z.string().min(6) })),
  controller.deleteAccount,
);

const design = z.object({
  orderNo: z.string().optional(),
  signType: z.string().min(1),
  businessText: z.string().min(1),
  style: z.string().optional(),
  lighting: z.string().optional(),
  background: z.string().optional(),
  storefrontUrl: z.string().optional(),
  notes: z.string().max(2000).optional(),
});
router.post("/designs", validate(design), controller.createDesign);
router.get("/designs", controller.designs);
router.get("/designs/:id", controller.design);
router.post(
  "/designs/:id/files",
  designUpload.array("files", 8),
  controller.attachDesignFiles,
);
router.get("/design-files/:id", controller.designFile);
router.post(
  "/designs/:id/generate",
  validate(z.object({ prompt: z.string().min(10).max(4000).optional() })),
  controller.generateDesign,
);
router.post(
  "/designs/:id/action",
  validate(
    z.object({
      action: z.enum([
        "regenerate",
        "request_modification",
        "use",
        "approve",
        "reject",
        "send_to_admin",
      ]),
      conceptId: z.coerce.number().int().positive().optional(),
      notes: z.string().max(2000).optional(),
    }),
  ),
  controller.designAction,
);
const aiRequirements = z
  .object({
    businessType: z.string().max(160).optional(),
    signType: z.string().max(160).optional(),
    length: z.coerce.number().positive().optional(),
    width: z.coerce.number().positive().optional(),
    unit: z.enum(["ft", "in", "cm", "m"]).optional(),
    location: z.string().max(500).optional(),
    material: z.string().max(160).optional(),
    lighting: z.string().max(160).optional(),
    budget: z.coerce.number().nonnegative().optional(),
    installation: z.boolean().optional(),
  })
  .partial();
router.get("/ai/config", controller.aiConfig);
router.post(
  "/ai/chat",
  validate(
    z.object({
      message: z.string().min(1).max(4000),
      requirements: aiRequirements.optional(),
    }),
  ),
  controller.aiChat,
);
router.get("/ai/conversations", controller.conversations);
router.post(
  "/ai/leads",
  validate(
    z.object({
      requirement: z.string().min(3),
      product: z.string().optional(),
      budget: z.coerce.number().nonnegative().optional(),
      contact: z.string().min(5),
      requirements: aiRequirements.optional(),
    }),
  ),
  controller.createLead,
);
module.exports = router;
