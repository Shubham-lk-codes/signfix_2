import React, { useEffect, useState } from "react";
import { Check, Plus, Search, Send, Trash2, X } from "lucide-react";
import { get, patch, post } from "../../api/client";
import LoadingState from "../../components/ui/LoadingState";
import StatusBadge from "../../components/ui/StatusBadge";
const blank = {
    orderNo: "",
    installation: 0,
    transportation: 0,
    discount: 0,
    gstRate: 18,
    terms: "",
    validUntil: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
  },
  statuses = [
    "draft",
    "sent",
    "admin_approved",
    "changes_requested",
    "approved",
    "rejected",
    "expired",
    "cancelled",
  ];
export default function QuotationsPage() {
  const [rows, setRows] = useState([]),
    [form, setForm] = useState(null),
    [filter, setFilter] = useState(""),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filter) p.set("status", filter);
      if (search.trim()) p.set("search", search.trim());
      setRows((await get(`/api/quotations?${p}`)).data || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [filter]);
  async function edit(id) {
    try {
      setForm(await get(`/api/quotations/${id}`));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  function changeItem(i, k, v) {
    setForm({
      ...form,
      items: form.items.map((x, n) =>
        n === i
          ? {
              ...x,
              [k]: k === "description" ? v : Number(v),
              ...(k === "quantity" || k === "unitPrice"
                ? {
                    amount:
                      Number(k === "quantity" ? v : x.quantity) *
                      Number(k === "unitPrice" ? v : x.unitPrice),
                  }
                : {}),
            }
          : x,
      ),
    });
  }
  const totals = () => {
    const itemTotal = form.items.reduce(
        (s, i) => s + Number(i.quantity) * Number(i.unitPrice),
        0,
      ),
      subtotal = Math.max(
        0,
        itemTotal +
          Number(form.installation || 0) +
          Number(form.transportation || 0) -
          Number(form.discount || 0),
      ),
      gst = Math.round(subtotal * Number(form.gstRate || 0)) / 100;
    return { subtotal, gst, finalAmount: subtotal + gst };
  };
  async function save(e) {
    e.preventDefault();
    try {
      const payload = { ...form, ...totals() };
      form.quotationNo
        ? await patch(`/api/quotations/${form.quotationNo}`, payload)
        : await post("/api/quotations", payload);
      setForm(null);
      setNotice("Quotation saved. Server-calculated totals are authoritative.");
      await load();
    } catch (ex) {
      setError(ex.message);
    }
  }
  async function send(id) {
    try {
      await post(`/api/quotations/${id}/send`, {});
      setNotice("Quotation sent for review.");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  async function decide(id, decision) {
    const notes =
      window.prompt(
        `${decision === "approve" ? "Approval" : "Rejection"} notes (optional)`,
      ) || undefined;
    if (
      !window.confirm(
        `${decision === "approve" ? "Approve" : "Reject"} quotation ${id}?`,
      )
    )
      return;
    try {
      await post(`/api/quotations/${id}/decision`, { decision, notes });
      setNotice(
        `Quotation ${decision === "approve" ? "approved by admin" : "rejected"}.`,
      );
      if (form?.quotationNo === id) setForm(await get(`/api/quotations/${id}`));
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section className="content">
      <div className="headline">
        <div>
          <p>COMMERCIAL</p>
          <h1>Quotation management</h1>
          <small>
            Calculator estimates are provisional. Only an admin-approved
            quotation is an official price.
          </small>
        </div>
        <button
          className="primary"
          onClick={() =>
            setForm({ ...blank, items: blank.items.map((x) => ({ ...x })) })
          }
        >
          <Plus size={16} />
          Create quotation
        </button>
      </div>
      <div className="customer-toolbar card">
        <div className="admin-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Quotation, order or customer"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className="outline" onClick={load}>
          Search
        </button>
      </div>
      {notice && <div className="form-message">{notice}</div>}
      {error && <div className="auth-error">{error}</div>}
      {form && (
        <form className="card quotation-editor" onSubmit={save}>
          <div className="panel-heading">
            <div>
              <h2>{form.quotationNo || "New quotation"}</h2>
              <p>Amounts are recalculated and validated by the server.</p>
            </div>
            {form.status && <StatusBadge>{form.status}</StatusBadge>}
          </div>
          <div className="order-form-grid">
            <label>
              Order ID
              <input
                value={form.orderNo}
                disabled={Boolean(form.quotationNo)}
                onChange={(e) => setForm({ ...form, orderNo: e.target.value })}
                required
              />
            </label>
            <label>
              Valid until
              <input
                type="date"
                value={String(form.validUntil || "").slice(0, 10)}
                onChange={(e) =>
                  setForm({ ...form, validUntil: e.target.value })
                }
                required
              />
            </label>
          </div>
          <h3>Products and services</h3>
          {form.items.map((item, index) => (
            <div className="quote-item" key={item.id || index}>
              <input
                placeholder="Product or service"
                value={item.description}
                onChange={(e) =>
                  changeItem(index, "description", e.target.value)
                }
                required
              />
              <input
                type="number"
                min="0.01"
                step="any"
                value={item.quantity}
                onChange={(e) => changeItem(index, "quantity", e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="any"
                value={item.unitPrice}
                onChange={(e) => changeItem(index, "unitPrice", e.target.value)}
              />
              <b>
                ₹
                {(
                  Number(item.quantity) * Number(item.unitPrice)
                ).toLocaleString("en-IN")}
              </b>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    items: form.items.filter((_, x) => x !== index),
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="outline"
            onClick={() =>
              setForm({
                ...form,
                items: [
                  ...form.items,
                  { description: "", quantity: 1, unitPrice: 0, amount: 0 },
                ],
              })
            }
          >
            + Add item
          </button>
          <div className="order-form-grid quote-charges">
            {[
              ["installation", "Installation"],
              ["transportation", "Transportation"],
              ["discount", "Discount"],
              ["gstRate", "GST %"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form[key] || 0}
                  onChange={(e) =>
                    setForm({ ...form, [key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
            <label className="wide">
              Terms
              <textarea
                rows="4"
                value={form.terms || ""}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
              />
            </label>
          </div>
          <div className="quote-total">
            <span>Subtotal ₹{totals().subtotal.toLocaleString("en-IN")}</span>
            <span>GST ₹{totals().gst.toLocaleString("en-IN")}</span>
            <b>
              Official total ₹{totals().finalAmount.toLocaleString("en-IN")}
            </b>
          </div>
          <div className="table-actions">
            <button className="primary">Save quotation</button>
            <button
              type="button"
              className="outline"
              onClick={() => setForm(null)}
            >
              Close
            </button>
            {form.quotationNo && (
              <>
                <button
                  type="button"
                  className="outline approve-action"
                  onClick={() => decide(form.quotationNo, "approve")}
                >
                  <Check size={15} />
                  Admin approve
                </button>
                <button
                  type="button"
                  className="outline reject-action"
                  onClick={() => decide(form.quotationNo, "reject")}
                >
                  <X size={15} />
                  Reject
                </button>
              </>
            )}
          </div>
          {form.payments?.length > 0 && (
            <article className="profile-section">
              <h3>Payments</h3>
              {form.payments.map((p) => (
                <div className="order-related" key={p.id}>
                  <b>{p.reference}</b>
                  <span>₹{Number(p.amount).toLocaleString("en-IN")}</span>
                  <StatusBadge>{p.status}</StatusBadge>
                </div>
              ))}
            </article>
          )}
          {form.history?.length > 0 && (
            <article className="profile-section">
              <h3>History</h3>
              {form.history.map((h) => (
                <div className="order-related" key={h.id}>
                  <b>{h.action}</b>
                  <small>{new Date(h.createdAt).toLocaleString("en-IN")}</small>
                </div>
              ))}
            </article>
          )}
        </form>
      )}
      {loading ? (
        <LoadingState label="Loading quotations…" />
      ) : (
        <article className="tablecard card">
          <table>
            <thead>
              <tr>
                <th>Quotation</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Official amount</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.quotationNo}>
                  <td>
                    <b>{q.quotationNo}</b>
                  </td>
                  <td>{q.orderNo}</td>
                  <td>{q.customer}</td>
                  <td>₹{Number(q.finalAmount).toLocaleString("en-IN")}</td>
                  <td>{String(q.validUntil || "—").slice(0, 10)}</td>
                  <td>
                    <StatusBadge>{q.status}</StatusBadge>
                  </td>
                  <td>
                    <span className="table-actions">
                      <button
                        className="outline"
                        onClick={() => edit(q.quotationNo)}
                      >
                        View / edit
                      </button>
                      <button
                        className="primary"
                        disabled={[
                          "approved",
                          "admin_approved",
                          "rejected",
                          "cancelled",
                        ].includes(q.status)}
                        onClick={() => send(q.quotationNo)}
                      >
                        <Send size={14} />
                        Send
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="empty">No quotations match these filters.</div>
          )}
        </article>
      )}
    </section>
  );
}
