const router = require("express").Router();
const rateLimit = require("../middleware/rateLimit");
const workflow = require("../services/paymentWorkflowService");
router.post(
  "/webhook",
  rateLimit({ windowMs: 60 * 1000, max: 120 }),
  async (req, res) => {
    res.json(
      await workflow.webhook(
        req.rawBody || Buffer.from(""),
        req.headers,
        req.body,
      ),
    );
  },
);
module.exports = router;
