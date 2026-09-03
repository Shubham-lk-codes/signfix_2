import React, { useEffect, useState } from "react";
import { ArrowLeft, Eye, Plus } from "lucide-react";
import { get, patch, post } from "../../api/client";
import StatusBadge from "../../components/ui/StatusBadge";

const technicianFields = [
  ["name", "Name"],
  ["email", "Email", "email"],
  ["mobile", "Mobile"],
];

export default function TechniciansPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  async function load() {
    setRows((await get("/api/admin/operations/technicians")).data || []);
  }
  useEffect(() => {
    load();
  }, []);
  async function open(id) {
    setDetail(await get(`/api/admin/operations/technicians/${id}`));
  }
  async function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = {
      ...values,
      serviceAreas: values.serviceAreas
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      skills: values.skills
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };
    form.id
      ? await patch(`/api/admin/operations/technicians/${form.id}`, payload)
      : await post("/api/admin/operations/technicians", payload);
    setForm(null);
    await load();
  }
  if (detail)
    return (
      <section className="content">
        <div className="headline">
          <div>
            <button className="text-button" onClick={() => setDetail(null)}>
              <ArrowLeft size={16} />
              Technicians
            </button>
            <h1>{detail.name}</h1>
            <small>
              {detail.email} · <StatusBadge>{detail.status}</StatusBadge>
            </small>
          </div>
        </div>
        <article className="card profile-section">
          <h2>Jobs</h2>
          {detail.jobs.map((job) => (
            <div className="order-related" key={job.id}>
              <b>{job.ticketId}</b>
              <span>{job.category}</span>
              <StatusBadge>{job.priority}</StatusBadge>
              <StatusBadge>{job.status}</StatusBadge>
              <small>
                {job.scheduledAt
                  ? new Date(job.scheduledAt).toLocaleString()
                  : "Unscheduled"}
              </small>
              {job.review && <span>Review: {job.review.rating}/5 {job.review.comment || ""}</span>}
              {job.history?.length > 0 && <details><summary>{job.history.length} status changes</summary>{job.history.map((entry,index)=><p key={index}><StatusBadge>{entry.status}</StatusBadge> {entry.notes || "—"} · {new Date(entry.createdAt).toLocaleString()}</p>)}</details>}
            </div>
          ))}
        </article>
      </section>
    );
  const fields = [
    ...technicianFields,
    ...(!form?.id ? [["password", "Temporary password", "password"]] : []),
    ["serviceAreas", "Service areas"],
    ["skills", "Skills"],
  ];
  return (
    <section className="content">
      <div className="headline">
        <div>
          <p>FIELD TEAM</p>
          <h1>Technician management</h1>
          <small>
            Manage team availability, service areas, jobs and measured
            performance.
          </small>
        </div>
        <button className="primary" onClick={() => setForm({})}>
          <Plus size={16} />
          Add technician
        </button>
      </div>
      {form && (
        <form className="technician-editor card" onSubmit={save}>
          <div className="technician-editor-grid">
            {fields.map(([name, label, type = "text"]) => (
              <label
                className={`technician-field technician-field-${name}`}
                key={name}
              >
                {label}
                <input
                  name={name}
                  type={type}
                  placeholder={
                    name === "serviceAreas"
                      ? "e.g. Bengaluru, Mysuru"
                      : name === "skills"
                        ? "e.g. LED repair, installation"
                        : undefined
                  }
                  defaultValue={
                    Array.isArray(form[name])
                      ? form[name].join(", ")
                      : form[name] || ""
                  }
                  required={["name", "email", "mobile", "password"].includes(
                    name,
                  )}
                />
                {["serviceAreas", "skills"].includes(name) && (
                  <small>Separate multiple entries with commas</small>
                )}
              </label>
            ))}
            {form.id && (
              <label className="technician-field technician-field-status">
                Status
                <select name="status" defaultValue={form.status}>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
            )}
          </div>
          <div className="technician-editor-actions">
            <button
              type="button"
              className="outline"
              onClick={() => setForm(null)}
            >
              Cancel
            </button>
            <button className="primary">
              {form.id ? "Save changes" : "Add technician"}
            </button>
          </div>
        </form>
      )}
      <div className="metric-grid tech-metrics">
        {[
          ["Assigned", "assigned"],
          ["Accepted", "accepted"],
          ["Completed", "completed"],
        ].map(([label, key]) => (
          <article className="card" key={key}>
            <small>{label}</small>
            <b>{rows.reduce((sum, row) => sum + Number(row[key] || 0), 0)}</b>
          </article>
        ))}
      </div>
      <article className="tablecard card">
        <table>
          <thead>
            <tr>
              <th>Technician</th>
              <th>Areas</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Accepted</th>
              <th>Completed</th>
              <th>Avg. completion</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <b>{row.name}</b>
                  <small>{row.email}</small>
                </td>
                <td>{(row.serviceAreas || []).join(", ") || "—"}</td>
                <td>
                  <StatusBadge>{row.status}</StatusBadge>
                </td>
                <td>{row.assigned}</td>
                <td>{row.accepted}</td>
                <td>{row.completed}</td>
                <td>
                  {row.averageCompletionHours
                    ? `${row.averageCompletionHours} hrs`
                    : "—"}
                </td>
                <td>{row.rating || "—"}</td>
                <td>
                  <span className="table-actions">
                    <button className="outline" onClick={() => open(row.id)}>
                      <Eye size={14} />
                      Jobs
                    </button>
                    <button
                      className="outline"
                      onClick={() => setForm({ ...row })}
                    >
                      Edit
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
