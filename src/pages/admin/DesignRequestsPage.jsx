import React, { useEffect, useState } from "react";
import { ArrowLeft, Eye, Upload } from "lucide-react";
import { api, get, patch } from "../../api/client";
import StatusBadge from "../../components/ui/StatusBadge";
import ProtectedImage from "../../components/ui/ProtectedImage";
import ProtectedFileLink from "../../components/ui/ProtectedFileLink";

export default function DesignRequestsPage() {
  const [rows, setRows] = useState([]),
    [request, setRequest] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setRows((await get("/api/admin/operations/design-requests")).data || []);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function open(id) {
    try {
      setRequest(await get(`/api/admin/operations/design-requests/${id}`));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  async function review(action) {
    const notes =
      document.querySelector("#design-admin-notes")?.value || undefined;
    try {
      setBusy(true);
      await patch(`/api/admin/operations/design-requests/${request.id}`, {
        action,
        notes,
      });
      await open(request.id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    e.preventDefault();
    try {
      setBusy(true);
      await api(
        `/api/admin/operations/design-requests/${request.id}/concepts`,
        { method: "POST", body: new FormData(e.currentTarget) },
      );
      e.currentTarget.reset();
      await open(request.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function conceptAction(id, action) {
    const quotationNo =
      action === "attach_quotation"
        ? window.prompt("Quotation number to attach")
        : undefined;
    if (action === "attach_quotation" && !quotationNo) return;
    const notes = window.prompt("Review notes (optional)") || undefined;
    try {
      setBusy(true);
      await patch(
        `/api/admin/operations/design-requests/${request.id}/concepts/${id}`,
        { action, notes, quotationNo },
      );
      await open(request.id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (request)
    return (
      <section className="content">
        <div className="headline">
          <div>
            <button className="text-button" onClick={() => setRequest(null)}>
              <ArrowLeft size={16} />
              Design requests
            </button>
            <h1>Request #{request.id}</h1>
            <small>
              {request.customer} · Order {request.orderNo || "not linked"}
            </small>
          </div>
          <StatusBadge>{request.status}</StatusBadge>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <div className="customer-summary">
          <article className="card profile-section">
            <h2>Customer brief</h2>
            {Object.entries(request.requirements || {})
              .filter(([key]) => key !== "files")
              .map(([key, value]) => (
                <p key={key}>
                  <b>{key.replace(/([A-Z])/g, " $1")}</b>
                  <span>{String(value || "—")}</span>
                </p>
              ))}
            <h3>Reference files</h3>
            {request.files.length ? (
              <div className="design-file-list">
                {request.files.map((file) => (
                  <ProtectedFileLink href={file.url} key={file.id}>
                    {file.name}
                  </ProtectedFileLink>
                ))}
              </div>
            ) : (
              <p>No files attached.</p>
            )}
          </article>
          <article className="card profile-section">
            <h2>Admin review</h2>
            <label>
              Notes
              <textarea
                id="design-admin-notes"
                rows="5"
                defaultValue={request.adminNotes || ""}
              />
            </label>
            <div className="table-actions">
              <button
                disabled={busy}
                className="outline"
                onClick={() => review("review")}
              >
                Start review
              </button>
              <button
                disabled={busy}
                className="outline"
                onClick={() => review("request_information")}
              >
                Request information
              </button>
              <button
                disabled={busy}
                className="primary"
                onClick={() => review("ready")}
              >
                Mark ready
              </button>
            </div>
          </article>
        </div>
        <form className="inline-form card" onSubmit={upload}>
          <label>
            Concept image
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <label>
            Concept notes
            <input name="notes" maxLength="4000" />
          </label>
          <label>
            Prompt / metadata
            <input name="prompt" maxLength="4000" />
          </label>
          <button className="primary" disabled={busy}>
            <Upload size={16} />
            Upload concept
          </button>
        </form>
        <div className="design-admin-grid">
          {request.concepts.map((concept) => (
            <article className="card" key={concept.id}>
              <ProtectedImage src={concept.imageUrl} alt={`Concept ${concept.id}`} />
              <h3>Concept #{concept.id}</h3>
              <StatusBadge>{concept.status}</StatusBadge>
              <p>{concept.adminNotes}</p>
              {concept.quotationNo && (
                <small>Quotation: {concept.quotationNo}</small>
              )}
              <footer>
                <button
                  className="outline"
                  disabled={busy}
                  onClick={() => conceptAction(concept.id, "approve")}
                >
                  Approve
                </button>
                <button
                  className="outline"
                  disabled={busy}
                  onClick={() =>
                    conceptAction(concept.id, "request_modification")
                  }
                >
                  Request changes
                </button>
                <button
                  className="outline"
                  disabled={busy}
                  onClick={() => conceptAction(concept.id, "reject")}
                >
                  Reject
                </button>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => conceptAction(concept.id, "attach_quotation")}
                >
                  Attach quotation
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>
    );
  return (
    <section className="content">
      <div className="headline">
        <div>
          <p>DESIGN WORKFLOW</p>
          <h1>Design requests</h1>
          <small>
            Review customer briefs, publish concepts, and connect approved work
            to quotations.
          </small>
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <article className="tablecard card">
        <table>
          <thead>
            <tr>
              <th>Request</th>
              <th>Customer</th>
              <th>Order</th>
              <th>Status</th>
              <th>Concepts</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>#{row.id}</td>
                <td>{row.customer}</td>
                <td>{row.orderNo || "—"}</td>
                <td>
                  <StatusBadge>{row.status}</StatusBadge>
                </td>
                <td>{row.conceptCount}</td>
                <td>
                  <button className="outline" onClick={() => open(row.id)}>
                    <Eye size={14} />
                    Review
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan="6">No design requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </article>
    </section>
  );
}
