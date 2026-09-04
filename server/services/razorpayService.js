const crypto = require("crypto");

function configured() {
  return (
    process.env.PAYMENT_GATEWAY_ENABLED === "true" &&
    (process.env.PAYMENT_GATEWAY_PROVIDER || "").toLowerCase() === "razorpay" &&
    Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  );
}

function assertConfigured() {
  if (!configured())
    throw Object.assign(new Error("Razorpay is not configured"), {
      status: 503,
    });
}

async function request(path, options = {}) {
  assertConfigured();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
      throw Object.assign(
        new Error(
          body?.error?.description || "Payment provider request failed",
        ),
        { status: 502, providerCode: body?.error?.code },
      );
    return body;
  } catch (error) {
    if (error.name === "AbortError")
      throw Object.assign(new Error("Payment provider timed out"), {
        status: 504,
        providerCode: "NETWORK_TIMEOUT",
      });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const createOrder = ({ amount, currency, receipt, notes }) =>
  request("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt,
      notes,
    }),
  });
const fetchPayment = (id) => request(`/payments/${encodeURIComponent(id)}`);

function safeEqual(given, expected) {
  const left = Buffer.from(given || "", "utf8"),
    right = Buffer.from(expected || "", "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyCheckoutSignature(
  providerOrderId,
  providerPaymentId,
  signature,
) {
  assertConfigured();
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${providerOrderId}|${providerPaymentId}`)
    .digest("hex");
  return safeEqual(signature, expected);
}

function verifyWebhook(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret)
    throw Object.assign(new Error("Razorpay webhook is not configured"), {
      status: 503,
    });
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return safeEqual(signature, expected);
}

module.exports = {
  configured,
  createOrder,
  fetchPayment,
  verifyCheckoutSignature,
  verifyWebhook,
};
