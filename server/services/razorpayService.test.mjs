import { afterEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import crypto from "node:crypto";
const require = createRequire(import.meta.url);
const razorpay = require("./razorpayService");

describe("Razorpay verification", () => {
  afterEach(() => {
    for (const key of [
      "PAYMENT_GATEWAY_ENABLED",
      "PAYMENT_GATEWAY_PROVIDER",
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
      "RAZORPAY_WEBHOOK_SECRET",
    ])
      delete process.env[key];
  });
  it("binds checkout signatures to the stored provider order", () => {
    Object.assign(process.env, {
      PAYMENT_GATEWAY_ENABLED: "true",
      PAYMENT_GATEWAY_PROVIDER: "razorpay",
      RAZORPAY_KEY_ID: "rzp_test_example",
      RAZORPAY_KEY_SECRET: "test-secret",
    });
    const signature = crypto
      .createHmac("sha256", "test-secret")
      .update("order_123|pay_456")
      .digest("hex");
    expect(
      razorpay.verifyCheckoutSignature("order_123", "pay_456", signature),
    ).toBe(true);
    expect(
      razorpay.verifyCheckoutSignature("order_changed", "pay_456", signature),
    ).toBe(false);
  });
  it("verifies the exact raw webhook body", () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
    const body = Buffer.from('{"event":"payment.captured"}'),
      signature = crypto
        .createHmac("sha256", "webhook-secret")
        .update(body)
        .digest("hex");
    expect(razorpay.verifyWebhook(body, signature)).toBe(true);
    expect(razorpay.verifyWebhook(Buffer.from("{}"), signature)).toBe(false);
  });
});
