import React, { useEffect, useState } from "react";
import { api, get, post } from "../../api/client";
import StatusBadge from "../../components/ui/StatusBadge";
import ProtectedImage from "../../components/ui/ProtectedImage";
import ProtectedFileLink from "../../components/ui/ProtectedFileLink";
import CustomerCommercialPage from "./CustomerCommercialPage";

function DiscountedProductsSlider({ products }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!products || products.length === 0) return null;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % products.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  const item = products[currentIndex];

  return (
    <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', padding: 20, borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔥</span> Exclusive Discounted Products
        </h3>
        <span style={{ background: '#22c55e', color: '#0f172a', fontWeight: 'bold', fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>
          ₹200 CASHBACK PER ELIGIBLE PRODUCT
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 140, height: 120, borderRadius: 8, overflow: 'hidden', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#94a3b8', fontSize: 13 }}>No Image</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <span style={{ background: '#38bdf8', color: '#0f172a', fontSize: 11, fontWeight: 'bold', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
            {item.category || 'Special Offer'}
          </span>
          <h2 style={{ margin: '6px 0 4px', fontSize: 20, color: '#ffffff' }}>{item.name}</h2>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: 13 }}>{item.description || 'Order this discounted sign board and get instant ₹250 cashback in your wallet!'}</p>
          <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: 16 }}>₹250 Cashback on Order</span>
          </div>
        </div>
      </div>

      {products.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTop: '1px solid #334155', paddingTop: 10 }}>
          <button className="outline" onClick={prevSlide} style={{ color: '#fff', borderColor: '#475569', padding: '4px 12px', fontSize: 12 }}>
            ← Previous
          </button>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            Product {currentIndex + 1} of {products.length}
          </span>
          <button className="outline" onClick={nextSlide} style={{ color: '#fff', borderColor: '#475569', padding: '4px 12px', fontSize: 12 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function CustomerPortalPage({ logout }) {
  const [tab, setTab] = useState("assets"),
    [rows, setRows] = useState([]),
    [selected, setSelected] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [discountedProducts, setDiscountedProducts] = useState([]),
    [walletData, setWalletData] = useState(null);

  useEffect(() => {
    get("/api/customer/discounted-products")
      .then((data) => setDiscountedProducts(data || []))
      .catch(() => {});
  }, []);

  async function load() {
    try {
      setError("");
      if (tab === "wallet") {
        const wallet = await get("/api/customer/wallet");
        setWalletData(wallet);
      } else if (tab === "assets" || tab === "designs") {
        const result = await get(
          tab === "assets"
            ? "/api/customer/assets?pageSize=100"
            : "/api/customer/designs"
        );
        setRows(result.data || []);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    setSelected(null);
    load();
  }, [tab]);

  async function open(row) {
    try {
      setSelected(
        await get(
          tab === "assets"
            ? `/api/customer/assets/${row.assetNo}`
            : `/api/customer/designs/${row.id}`
        )
      );
    } catch (e) {
      setError(e.message);
    }
  }

  async function create(event) {
    event.preventDefault();
    const form = event.currentTarget,
      data = Object.fromEntries(new FormData(form));
    delete data.files;
    try {
      setBusy(true);
      const request = await post("/api/customer/designs", data),
        files = form.elements.files.files;
      if (files.length) {
        const body = new FormData();
        for (const file of files) body.append("files", file);
        await api(`/api/customer/designs/${request.id}/files`, {
          method: "POST",
          body,
        });
      }
      form.reset();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function action(value, conceptId) {
    const notes =
      document.querySelector("#customer-design-notes")?.value || undefined;
    try {
      setBusy(true);
      await post(`/api/customer/designs/${selected.id}/action`, {
        action: value,
        conceptId,
        notes,
      });
      setSelected(await get(`/api/customer/designs/${selected.id}`));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="content">
      <div className="headline">
        <div>
          <p>CUSTOMER PORTAL</p>
          <h1>My signs, wallet and designs</h1>
          <small>
            Warranty, QR codes, wallet cashback, service history, and design approvals.
          </small>
        </div>
        <button className="outline" onClick={logout}>
          Sign out
        </button>
      </div>

      <DiscountedProductsSlider products={discountedProducts} />

      <div className="status-tabs">
        <button
          className={tab === "assets" ? "active" : ""}
          onClick={() => setTab("assets")}
        >
          Sign assets
        </button>
        <button
          className={tab === "designs" ? "active" : ""}
          onClick={() => setTab("designs")}
        >
          Design requests
        </button>
        <button
          className={tab === "commercial" ? "active" : ""}
          onClick={() => setTab("commercial")}
        >
          Quotations & payments
        </button>
        <button
          className={tab === "wallet" ? "active" : ""}
          onClick={() => setTab("wallet")}
        >
          💰 My Wallet & Cashback
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {tab === "wallet" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', padding: 20, borderRadius: 12 }}>
              <span style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.9, fontWeight: 'bold' }}>Available Wallet Balance</span>
              <h1 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: '800' }}>₹{(walletData?.balance || 0).toFixed(2)}</h1>
              <small style={{ opacity: 0.8 }}>Use on your next order during checkout</small>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', padding: 20, borderRadius: 12 }}>
              <span style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.9, fontWeight: 'bold' }}>Total Cashback Earned</span>
              <h1 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: '800' }}>₹{(walletData?.totalCashbackEarned || 0).toFixed(2)}</h1>
              <small style={{ opacity: 0.8 }}>Earned from ordering discounted products</small>
            </div>
          </div>

          <article className="tablecard card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0 }}>Wallet Transactions History</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date & Time</th>
                  <th>Transaction Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {walletData?.transactions?.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>
                      <StatusBadge>{t.type === 'cashback_credit' ? 'Cashback Received' : t.type === 'wallet_debit' ? 'Wallet Used' : t.type}</StatusBadge>
                    </td>
                    <td style={{ fontWeight: 'bold', color: t.type === 'cashback_credit' ? '#16a34a' : '#dc2626' }}>
                      {t.type === 'cashback_credit' ? '+' : '-'}₹{t.amount.toFixed(2)}
                    </td>
                    <td>₹{t.balanceAfter.toFixed(2)}</td>
                    <td>{t.description}</td>
                  </tr>
                ))}
                {(!walletData?.transactions || walletData.transactions.length === 0) && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>
                      No wallet transactions yet. Place an order for a discounted product to earn ₹250 cashback!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </article>
        </div>
      )}

      {tab === "commercial" && <CustomerCommercialPage />}

      {tab === "designs" && !selected && (
        <form className="card inline-form" onSubmit={create}>
          <label>
            Order number
            <input name="orderNo" />
          </label>
          <label>
            Sign type
            <input name="signType" required />
          </label>
          <label>
            Business text
            <input name="businessText" required />
          </label>
          <label>
            Style
            <input name="style" />
          </label>
          <label>
            Reference files
            <input
              name="files"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
            />
          </label>
          <button className="primary" disabled={busy}>
            Create design request
          </button>
        </form>
      )}

      {tab !== "commercial" && tab !== "wallet" &&
        (selected ? (
          <article className="card profile-section">
            <button className="text-button" onClick={() => setSelected(null)}>
              ← Back
            </button>
            <h2>{selected.assetNo || `Design request #${selected.id}`}</h2>
            <StatusBadge>
              {selected.status ||
                (selected.warrantyActive
                  ? "warranty active"
                  : "warranty expired")}
            </StatusBadge>
            {selected.assetNo ? (
              <>
                <p>Order: {selected.orderNo || "—"}</p>
                <p>
                  Installed:{" "}
                  {String(selected.installationDate || "—").slice(0, 10)}
                </p>
                <p>
                  Warranty: {String(selected.warrantyStart || "—").slice(0, 10)}{" "}
                  to {String(selected.warrantyUntil || "—").slice(0, 10)}
                </p>
                {selected.qrActive && (
                  <img
                    width="180"
                    src={`/api/qr/${selected.qrToken}/image`}
                    alt="Asset QR code"
                  />
                )}
                <h3>Service history</h3>
                {selected.history?.map((h) => (
                  <p key={h.id}>
                    <b>{h.type}</b> — {h.notes}
                  </p>
                ))}
              </>
            ) : (
              <>
                <p>
                  Concept/mockup only; an approved concept is not an official
                  quotation.
                </p>
                {!!selected.files?.length && (
                  <div className="design-file-list">
                    <h3>Your reference files</h3>
                    {selected.files.map((file) => (
                      <ProtectedFileLink href={file.url} key={file.id}>
                        {file.name}
                      </ProtectedFileLink>
                    ))}
                  </div>
                )}
                <div className="ticket-photos">
                  {selected.concepts?.map((c) => (
                    <figure key={c.id}>
                      <ProtectedImage src={c.imageUrl} alt="Design concept" />
                      <figcaption>
                        <StatusBadge>{c.status}</StatusBadge>
                        <button
                          className="primary"
                          disabled={busy}
                          onClick={() => action("approve", c.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="outline"
                          disabled={busy}
                          onClick={() => action("reject", c.id)}
                        >
                          Reject
                        </button>
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <label>
                  Review comments
                  <textarea
                    id="customer-design-notes"
                    rows="3"
                    maxLength="2000"
                    placeholder="Tell the design team what to change or why you approve."
                  />
                </label>
                <button
                  className="outline"
                  disabled={busy}
                  onClick={() => action("request_modification")}
                >
                  Request changes
                </button>
              </>
            )}
          </article>
        ) : (
          <article className="tablecard card">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Warranty / concepts</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.assetNo || row.id}>
                    <td>{row.assetNo || `#${row.id}`}</td>
                    <td>{row.orderNo || "—"}</td>
                    <td>
                      <StatusBadge>{row.status}</StatusBadge>
                    </td>
                    <td>
                      {tab === "assets"
                        ? row.warrantyActive
                          ? "Active"
                          : "Expired"
                        : `${row.conceptCount} concepts`}
                    </td>
                    <td>
                      <button className="outline" onClick={() => open(row)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan="5">No records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </article>
        ))}
    </section>
  );
}
