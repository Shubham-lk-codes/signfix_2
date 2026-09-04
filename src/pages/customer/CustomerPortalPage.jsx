import React, { useEffect, useState } from "react";
import { api, get, post } from "../../api/client";
import StatusBadge from "../../components/ui/StatusBadge";
import ProtectedImage from "../../components/ui/ProtectedImage";
import ProtectedFileLink from "../../components/ui/ProtectedFileLink";
import CustomerCommercialPage from "./CustomerCommercialPage";

export default function CustomerPortalPage({ logout }) {
  const [tab, setTab] = useState("assets"),
    [rows, setRows] = useState([]),
    [selected, setSelected] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setError("");
      const result = await get(
        tab === "assets"
          ? "/api/customer/assets?pageSize=100"
          : "/api/customer/designs",
      );
      setRows(result.data || []);
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
            : `/api/customer/designs/${row.id}`,
        ),
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
          <h1>My signs and designs</h1>
          <small>
            Warranty, QR codes, service history, and design approvals.
          </small>
        </div>
        <button className="outline" onClick={logout}>
          Sign out
        </button>
      </div>
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
      </div>
      {error && <div className="auth-error">{error}</div>}
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
      {tab !== "commercial" &&
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
