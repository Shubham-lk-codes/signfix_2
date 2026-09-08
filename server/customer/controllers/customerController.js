const repo = require("../repositories/customerRepository");
const quotationService = require("../../services/quotationService");
const { createQuotationPdf } = require("../../utils/pdf");
async function dashboard(req, res) {
  res.json(await repo.dashboard(req.user.id));
}
async function orderOptions(req, res) {
  res.json(await repo.orderOptions());
}
async function serviceOptions(req, res) {
  res.json(await repo.serviceOptions());
}
async function profile(req, res) {
  res.json(await repo.profile(req.user.id));
}
async function updateProfile(req, res) {
  res.json(await repo.updateProfile(req.user.id, req.body));
}
async function orders(req, res) {
  res.json(await repo.orders(req.user.id, req.query));
}
async function services(req, res) {
  res.json(await repo.services(req.user.id, req.query));
}
async function addAddress(req, res) {
  res.status(201).json(await repo.addAddress(req.user.id, req.body));
}
async function deleteAddress(req, res) {
  await repo.deleteAddress(req.user.id, req.params.id);
  res.status(204).end();
}
async function order(req, res) {
  res.json(await repo.order(req.user.id, req.params.id));
}
async function quotations(req, res) {
  res.json(await quotationService.customerList(req.user.id, req.query));
}
async function quotation(req, res) {
  res.json(await quotationService.customerDetail(req.user.id, req.params.id));
}
async function quotationAction(req, res) {
  res.json(await quotationService.customerAction(req.user.id, req.params.id, req.body.action, req.body.comment || req.body.notes));
}
async function approveQuotation(req, res) {
  res.json(await quotationService.customerAction(req.user.id, req.params.id, "approve", req.body.comment));
}
async function requestQuotationChanges(req, res) {
  res.json(await quotationService.customerAction(req.user.id, req.params.id, "request_changes", req.body.comment));
}
async function rejectQuotation(req, res) {
  res.json(await quotationService.customerAction(req.user.id, req.params.id, "reject", req.body.reason));
}
async function quotationPdf(req, res) {
  const q = await quotationService.customerDetail(req.user.id, req.params.id);
  const buffer = await createQuotationPdf(q, await quotationService.companySettings());
  await quotationService.recordPdfDownload(req.user, req.params.id, "customer").catch((error) => console.warn("Quotation PDF audit failed:", error.message));
  res
    .set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${q.quotationNo}-v${q.version}.pdf"`,
      "Content-Length": buffer.length,
      "Cache-Control": "private, no-store",
    })
    .send(buffer);
}
async function serviceTracking(req, res) {
  res.json(await repo.serviceTracking(req.user.id, req.params.id));
}
async function notifications(req, res) {
  res.json({ data: await repo.notifications(req.user.id) });
}
function notificationConfig(req, res) {
  res.json({
    pushConfigured: require("../../services/firebaseService").isConfigured(),
    events: [
      "order.submitted",
      "quotation.generated",
      "quotation.sent",
      "quotation.updated",
      "quotation.resent",
      "quotation.expiring",
      "quotation.expired",
      "order.approved",
      "order.production_started",
      "order.ready",
      "service.technician_assigned",
      "service.technician_on_the_way",
      "service.technician_reached",
      "service.work_started",
      "service.work_completed",
      "service.completed",
    ],
  });
}
async function registerNotificationDevice(req, res) {
  res
    .status(201)
    .json(await repo.registerNotificationDevice(req.user.id, req.body));
}
async function unregisterNotificationDevice(req, res) {
  res.json(
    await repo.unregisterNotificationDevice(req.user.id, req.body.token),
  );
}
async function readNotification(req, res) {
  res.json(await repo.readNotification(req.user.id, req.params.id));
}
async function readAllNotifications(req, res) {
  res.json(await repo.readAllNotifications(req.user.id));
}
async function updateAddress(req, res) {
  res.json(await repo.updateAddress(req.user.id, req.params.id, req.body));
}
async function cancelOrder(req, res) {
  res.json(await repo.cancelOrder(req.user.id, req.params.id, req.body.reason));
}
async function cancelService(req, res) {
  res.json(
    await repo.cancelService(req.user.id, req.params.id, req.body.reason),
  );
}
async function confirmService(req, res) {
  res.json(await repo.confirmService(req.user.id, req.params.id, req.body));
}
async function createReview(req, res) {
  const rating = Number(req.body?.rating);
  if (!rating || rating < 1 || rating > 5) {
    throw Object.assign(new Error("Rating must be an integer between 1 and 5"), { status: 400 });
  }
  res
    .status(201)
    .json(await require("../../services/reviewService").service(req.user.id, req.params.id, req.body));
}
async function reviews(req,res){res.json(await require("../../services/reviewService").customer(req.user.id));}
async function createOrderReview(req,res){
  const rating = Number(req.body?.rating);
  if (!rating || rating < 1 || rating > 5) {
    throw Object.assign(new Error("Rating must be an integer between 1 and 5"), { status: 400 });
  }
  res.status(201).json(await require("../../services/reviewService").order(req.user.id,req.params.id,req.body));
}
async function assets(req, res) {
  res.json(await repo.assets(req.user.id, req.query));
}
async function asset(req, res) {
  res.json(await repo.asset(req.user.id, req.params.id));
}
async function deleteAccount(req, res) {
  res.json(await repo.deleteAccount(req.user.id, req.body.password, req.user));
}
async function createPayment(req, res) {
  res
    .status(201)
    .json(
      await require("../../services/paymentWorkflowService").create(
        req.user.id,
        req.body,
      ),
    );
}
async function payments(req, res) {
  res.json(
    await require("../../services/paymentWorkflowService").list(req.user.id),
  );
}
async function payment(req, res) {
  res.json(
    await require("../../services/paymentWorkflowService").get(
      req.user.id,
      req.params.id,
    ),
  );
}
async function capturePayment(req, res) {
  res
    .status(410)
    .json({ error: "Direct capture is disabled; use provider verification" });
}
async function verifyPayment(req, res) {
  res.json(
    await require("../../services/paymentWorkflowService").confirm(
      req.user.id,
      req.params.id,
      req.body,
    ),
  );
}
async function retryPayment(req, res) {
  res.json(
    await require("../../services/paymentWorkflowService").retry(
      req.user.id,
      req.params.id,
    ),
  );
}
async function cancelPayment(req, res) {
  res.json(
    await require("../../services/paymentWorkflowService").cancel(
      req.user.id,
      req.params.id,
    ),
  );
}
async function refundPayment(req, res) {
  res
    .status(201)
    .json(await repo.refundPayment(req.user.id, req.params.id, req.body));
}
async function createDesign(req, res) {
  res.status(201).json(await repo.createDesign(req.user.id, req.body));
}
async function designs(req, res) {
  res.json({ data: await repo.designs(req.user.id) });
}
async function design(req, res) {
  res.json(await repo.design(req.user.id, req.params.id));
}
async function attachDesignFiles(req, res) {
  res
    .status(201)
    .json(
      await repo.attachDesignFiles(req.user.id, req.params.id, req.files || []),
    );
}
async function designFile(req, res, next) {
  const path = require("path"),
    { uploadDir } = require("../../config");
  try {
    const file = await repo.designFile(req.user.id, req.params.id);
    res
      .type(file.mimeType)
      .set(
        "Content-Disposition",
        `inline; filename="${String(file.originalName).replace(/["\r\n]/g, "_")}"`,
      )
      .sendFile(path.join(uploadDir, file.storageKey), (error) => {
        if (error && !res.headersSent)
          next(Object.assign(error, { status: error.statusCode || 404 }));
      });
  } catch (error) {
    next(error);
  }
}
async function generateDesign(req, res) {
  res
    .status(202)
    .json(
      await repo.generateDesign(req.user.id, req.params.id, req.body.prompt),
    );
}
async function designAction(req, res) {
  res.json(
    await repo.updateDesign(
      req.user.id,
      req.params.id,
      req.body.action,
      req.body.notes,
      req.body.conceptId,
    ),
  );
}
const requirementFields = [
  "businessType",
  "length",
  "width",
  "location",
  "material",
  "lighting",
  "installation",
];
function aiConfig(req, res) {
  res.json({
    name: "SignFix AI Assistant",
    capabilities: [
      "product_questions",
      "sign_board_types",
      "materials",
      "ordering_guidance",
      "pricing_calculator",
      "service_requests",
      "order_status",
      "quotations",
      "sales_leads",
      "product_recommendations",
      "requirements_collection",
      "human_escalation",
    ],
    requirementFields: [...requirementFields, "signType", "unit", "budget"],
    optionalFields: ["budget"],
    actions: [
      { key: "CALCULATE_PRICE", label: "Calculate Price" },
      { key: "REQUEST_DESIGN", label: "Request Design" },
      { key: "TALK_TO_SUPPORT", label: "Talk to Support" },
    ],
    guardrails: [
      "Estimated prices are not final commercial quotations.",
      "The assistant cannot approve quotations.",
      "Production feasibility and delivery dates require Admin confirmation.",
    ],
  });
}
function nextRequirement(missing) {
  const questions = {
    businessType: "What type of business is the sign for?",
    length: "What is the approximate width or length of the sign?",
    width: "What is the approximate height of the sign?",
    location: "Where will the sign be installed?",
    material: "Do you have a preferred material?",
    lighting:
      "Would you like no lighting, LED, backlit, neon, front lit, or custom lighting?",
    installation: "Do you need SignFix installation?",
  };
  return missing.length
    ? questions[missing[0]]
    : "Would you like to create an estimated quotation?";
}
async function aiChat(req, res) {
  const result = await require("../../services/assistantService").chat(
    req.user.id,
    req.body.message,
    req.body.conversationId,
  );
  return res.json({
    ...result,
    name: "SignFix AI Assistant",
    disclaimer:
      "AI guidance is informational. Official prices, payments, and operational decisions remain controlled by SignFix workflows.",
  });
  /* Legacy response composition retained below for migration reference. */
  if (!process.env.OPENAI_API_KEY)
    throw Object.assign(new Error("AI provider is not configured"), {
      status: 503,
      errorCode: "AI_PROVIDER_UNAVAILABLE",
    });
  const requirements = req.body.requirements || {},
    missingRequirements = requirementFields.filter(
      (field) =>
        requirements[field] === undefined || requirements[field] === "",
    ),
    readyForEstimate = missingRequirements.length === 0,
    escalate = /human|support|agent|escalat|emergency|unsafe/i.test(
      req.body.message,
    );
  let answer;
  try {
    const settings =
        (
          await require("../../database")
            .getPool()
            .query("SELECT value FROM ai_settings WHERE key='assistant_config'")
        ).rows[0]?.value || {},
      context = `Customer requirements: ${JSON.stringify(requirements)}. Missing required details: ${missingRequirements.join(", ") || "none"}. ${req.body.message}`;
    answer = await require("../../services/aiPlatform").answer(
      context,
      settings,
    );
  } catch (error) {
    const unavailable = Object.assign(
      new Error("AI provider is temporarily unavailable"),
      { status: 503, errorCode: "AI_PROVIDER_UNAVAILABLE" },
    );
    unavailable.cause = error;
    throw unavailable;
  }
  const metadata = {
    requirements,
    missingRequirements,
    readyForEstimate,
    escalated: escalate,
    sources: answer.sources,
  };
  const saved = await repo.saveConversation(
    req.user.id,
    req.body.message,
    answer.reply,
    escalate,
    metadata,
  );
  await require("../../services/realtimeService").publish(
    "conversation.created",
    { id: saved.id, escalate },
  );
  res.json({
    ...saved,
    name: "SignFix AI Assistant",
    reply: answer.reply,
    sources: answer.sources,
    collectedRequirements: requirements,
    missingRequirements,
    readyForEstimate,
    nextQuestion: escalate ? null : nextRequirement(missingRequirements),
    actions: [
      {
        key: "CALCULATE_PRICE",
        label: "Calculate Price",
        enabled: readyForEstimate,
      },
      {
        key: "REQUEST_DESIGN",
        label: "Request Design",
        enabled: Boolean(requirements.businessType || requirements.signType),
      },
      { key: "TALK_TO_SUPPORT", label: "Talk to Support", enabled: true },
    ],
    disclaimer:
      "AI guidance is informational. The assistant cannot approve final commercial quotations or promise production feasibility or delivery dates; Admin confirmation is required.",
  });
}
async function conversations(req, res) {
  res.json(await require("../../services/assistantService").conversations(req.user.id));
}
async function createLead(req, res) {
  res.status(201).json(await repo.createLead(req.user.id, req.body));
}
async function wallet(req, res) {
  const db = require("../../database");
  res.json(await db.getCustomerWallet(req.user.id));
}
async function discountedProducts(req, res) {
  const db = require("../../database");
  res.json(await db.getDiscountedProducts());
}
async function discountedSliderImages(req, res) {
  const db = require("../../database");
  res.json(await db.getDiscountedSliderImages());
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
  reviews,
  createOrderReview,
  assets,
  asset,
  deleteAccount,
  createPayment,
  payments,
  payment,
  capturePayment,
  verifyPayment,
  retryPayment,
  cancelPayment,
  refundPayment,
  quotations,
  quotation,
  quotationAction,
  approveQuotation,
  requestQuotationChanges,
  rejectQuotation,
  quotationPdf,
  serviceTracking,
  notifications,
  notificationConfig,
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
  designAction,
  aiConfig,
  aiChat,
  conversations,
  createLead,
  wallet,
  discountedProducts,
  discountedSliderImages,
};
