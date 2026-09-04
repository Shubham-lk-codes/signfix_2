import React, { useEffect, useState } from "react";
import { get, post } from "../../api/client";
import StatusBadge from "../../components/ui/StatusBadge";

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error("Payment checkout could not be loaded"));
    document.head.appendChild(script);
  });
}

export default function CustomerCommercialPage() {
  const [quotes, setQuotes] = useState([]),
    [selected, setSelected] = useState(null),
    [payments, setPayments] = useState([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const [q, p] = await Promise.all([
        get("/api/customer/quotations"),
        get("/api/customer/payments"),
      ]);
      setQuotes(q.data || []);
      setPayments(p.data || []);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function open(no) {
    try {
      setSelected(await get(`/api/customer/quotations/${no}`));
    } catch (e) {
      setError(e.message);
    }
  }
  async function decide(action) {
    try {
      setBusy(true);
      await post(`/api/customer/quotations/${selected.quotationNo}/action`, {
        action,
        notes: document.querySelector("#quote-notes")?.value || undefined,
      });
      await open(selected.quotationNo);
      await load();
      setNotice(
        `Quotation ${action === "approve" ? "approved" : "sent back for changes"}.`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function checkout(type) {
    try {
      setBusy(true);
      setError("");
      const payment = await post("/api/customer/payments/intents", {
        quotationNo: selected.quotationNo,
        type,
        idempotencyKey: crypto.randomUUID(),
      });
      await loadCheckout();
      await new Promise((resolve, reject) => {
        const widget = new window.Razorpay({
          ...payment.checkout,
          handler: async (response) => {
            try {
              const result = await post(
                `/api/customer/payments/${payment.id}/verify`,
                {
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                },
              );
              setNotice(
                result.status === "captured"
                  ? "Payment verified successfully."
                  : `Payment is ${result.status}; awaiting provider confirmation.`,
              );
              await load();
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => resolve() },
          theme: { color: "#173d8f" },
        });
        widget.on("payment.failed", (response) => {
          setError(
            response.error?.description ||
              "Payment failed. You can retry safely.",
          );
          load();
          resolve();
        });
        widget.open();
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function retry(id) {
    try {
      setBusy(true);
      const payment = await post(`/api/customer/payments/${id}/retry`, {});
      await loadCheckout();
      new window.Razorpay({
        ...payment.checkout,
        handler: async (response) => {
          await post(`/api/customer/payments/${payment.id}/verify`, {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
          await load();
        },
      }).open();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="customer-commercial">
      {error && <div className="auth-error">{error}</div>}
      {notice && <div className="form-message">{notice}</div>}
      {selected ? (
        <article className="card profile-section">
          <button className="text-button" onClick={() => setSelected(null)}>
            ← Quotations
          </button>
          <h2>{selected.quotationNo}</h2>
          <StatusBadge>{selected.status}</StatusBadge>
          <p>Order: {selected.orderNo}</p>
          <div className="profile-records">
            {selected.items.map((item) => (
              <div key={item.id}>
                <span>{item.description}</span>
                <span>
                  {item.quantity} × ₹
                  {Number(item.unitPrice).toLocaleString("en-IN")}
                </span>
                <b>₹{Number(item.amount).toLocaleString("en-IN")}</b>
              </div>
            ))}
          </div>
          <p>Subtotal: ₹{Number(selected.subtotal).toLocaleString("en-IN")}</p>
          <p>GST: ₹{Number(selected.gst).toLocaleString("en-IN")}</p>
          <h3>
            Official total: ₹
            {Number(selected.finalAmount).toLocaleString("en-IN")}
          </h3>
          <p>Valid until {String(selected.validUntil || "—").slice(0, 10)}</p>
          {selected.availableActions?.length > 0 && (
            <>
              <label>
                Comments
                <textarea id="quote-notes" rows="3" maxLength="1000" />
              </label>
              <div className="table-actions">
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => decide("approve")}
                >
                  Approve quotation
                </button>
                <button
                  className="outline"
                  disabled={busy}
                  onClick={() => decide("request_changes")}
                >
                  Request changes
                </button>
              </div>
            </>
          )}
          {selected.payments?.enabled &&
            selected.payments.options?.length > 0 && (
              <div className="table-actions">
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => checkout("full")}
                >
                  Pay full amount
                </button>
                <button
                  className="outline"
                  disabled={busy}
                  onClick={() => checkout("advance")}
                >
                  Pay 25% advance
                </button>
              </div>
            )}
        </article>
      ) : (
        <>
          <article className="tablecard card">
            <table>
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Order</th>
                  <th>Official amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.quotationNo}>
                    <td>{q.quotationNo}</td>
                    <td>{q.orderNo}</td>
                    <td>₹{Number(q.finalAmount).toLocaleString("en-IN")}</td>
                    <td>
                      <StatusBadge>{q.status}</StatusBadge>
                    </td>
                    <td>
                      <button
                        className="outline"
                        onClick={() => open(q.quotationNo)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
          <article className="card profile-section">
            <h2>Payment transactions</h2>
            {payments.map((p) => (
              <div className="order-related" key={p.id}>
                <b>{p.reference}</b>
                <span>₹{Number(p.amount).toLocaleString("en-IN")}</span>
                <StatusBadge>{p.status}</StatusBadge>
                {[
                  "created",
                  "failed",
                  "cancelled",
                  "initialization_failed",
                ].includes(p.status) && (
                  <button
                    className="outline"
                    disabled={busy}
                    onClick={() => retry(p.id)}
                  >
                    Retry
                  </button>
                )}
              </div>
            ))}
            {!payments.length && <p>No payment transactions yet.</p>}
          </article>
        </>
      )}
    </div>
  );
}
