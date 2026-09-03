import React, { useEffect, useState } from "react";
import { ArrowLeft, Eye, MapPin, Save } from "lucide-react";
import { get, patch } from "../../api/client";
import StatusBadge from "../../components/ui/StatusBadge";
export default function ServicesPage() {
  const [rows, setRows] = useState([]),
    [ticket, setTicket] = useState(null),
    [search, setSearch] = useState("");
  async function load() {
    setRows(
      (
        await get(
          `/api/admin/operations/tickets?search=${encodeURIComponent(search)}`,
        )
      ).data || [],
    );
  }
  useEffect(() => {
    load();
  }, []);
  async function open(id) {
    setTicket(await get(`/api/admin/operations/tickets/${id}`));
  }
  async function save(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await patch(`/api/admin/operations/tickets/${ticket.id}`, {
      priority: f.get("priority"),
      technicianId: f.get("technicianId")
        ? Number(f.get("technicianId"))
        : null,
      adminNotes: f.get("adminNotes"),
      status: f.get("status"),
    });
    setTicket(await get(`/api/admin/operations/tickets/${ticket.id}`));
    await load();
  }
  if (ticket)
    return (
      <section className="content">
        <div className="headline">
          <div>
            <button className="text-button" onClick={() => setTicket(null)}>
              <ArrowLeft size={16} />
              Service tickets
            </button>
            <h1>{ticket.id}</h1>
            <small>
              {ticket.customer} · <StatusBadge>{ticket.status}</StatusBadge>
            </small>
          </div>
        </div>
        <div className="operation-detail">
          <form className="card order-editor" onSubmit={save}>
            <h2>Review request</h2>
            <p>{ticket.issue}</p>
            <div className="order-form-grid">
              <label>
                Priority
                <select name="priority" defaultValue={ticket.priority}>
                  <option>normal</option>
                  <option>high</option>
                  <option>emergency</option>
                </select>
              </label>
              <label>
                Technician
                <select
                  name="technicianId"
                  defaultValue={ticket.technicianId || ""}
                >
                  <option value="">Unassigned</option>
                  {ticket.technicians.map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name} · {t.mobile}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue={ticket.status}>
                  {[
                    "submitted",
                    "under_review",
                    "technician_assigned",
                    "in_progress",
                    "completed",
                    "closed",
                    "cancelled",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="wide">
                Admin notes
                <textarea
                  name="adminNotes"
                  rows="4"
                  defaultValue={ticket.adminNotes || ""}
                />
              </label>
            </div>
            <button className="primary">
              <Save size={16} />
              Update ticket
            </button>
          </form>
          <aside className="card ticket-context">
            <h2>
              <MapPin size={18} />
              Location
            </h2>
            <pre>{JSON.stringify(ticket.location, null, 2)}</pre>
            <h2>Linked asset</h2>
            <p>{ticket.assetNo || "No sign asset linked"}</p>
            <h2>Photos</h2>
            <div className="ticket-photos">
              {(ticket.photos || []).map((p, i) => (
                <a href={p} target="_blank" rel="noreferrer" key={p}>
                  <img src={p} alt={`Issue ${i + 1}`} />
                </a>
              ))}
            </div>
          </aside>
        </div>
        <article className="card profile-section">
          <h2>Status history</h2>
          {ticket.history.map((h, i) => (
            <div className="order-related" key={i}>
              <StatusBadge>{h.status}</StatusBadge>
              <span>{h.notes || "—"}</span>
              <small>{new Date(h.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </article>
        <article className="card profile-section">
          <h2>Technician evidence</h2>
          {ticket.evidence?.length ? <div className="profile-records">{ticket.evidence.map(photo => <a key={photo.id} href={`/api/uploads/${encodeURIComponent(photo.storageKey)}`} target="_blank" rel="noreferrer"><StatusBadge>{photo.photoType}</StatusBadge> {new Date(photo.createdAt).toLocaleString()}</a>)}</div> : <p className="empty-copy">No job evidence uploaded.</p>}
        </article>
      </section>
    );
  return (
    <section className="content">
      <div className="headline">
        <div>
          <p>SERVICE OPERATIONS</p>
          <h1>Service ticket management</h1>
          <small>
            Review, prioritize, assign and close customer service requests.
          </small>
        </div>
      </div>
      <div className="resource-toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ticket, customer or issue"
        />
        <button className="outline" onClick={load}>
          Search
        </button>
      </div>
      <article className="tablecard card">
        <table>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Customer</th>
              <th>Location</th>
              <th>Issue</th>
              <th>Priority</th>
              <th>Technician</th>
              <th>Status</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <b>{r.id}</b>
                </td>
                <td>{r.customer}</td>
                <td>{r.location?.address || "—"}</td>
                <td>{r.issue}</td>
                <td>
                  <StatusBadge>{r.priority}</StatusBadge>
                </td>
                <td>{r.technician || "Unassigned"}</td>
                <td>
                  <StatusBadge>{r.status}</StatusBadge>
                </td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="outline" onClick={() => open(r.id)}>
                    <Eye size={15} />
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
