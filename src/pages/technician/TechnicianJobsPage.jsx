import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { api, get, patch, post } from "../../api/client";
import StatusBadge from "../../components/ui/StatusBadge";

const nextStatus = {
  assigned: "accepted",
  accepted: "on_the_way",
  on_the_way: "reached_location",
  reached_location: "inspection_started",
  inspection_started: "work_in_progress",
  work_in_progress: "completed",
};
const actionLabel = {
  accepted: "Accept job",
  on_the_way: "Start travel",
  reached_location: "Mark reached",
  inspection_started: "Start inspection",
  work_in_progress: "Start work",
  completed: "Complete work",
};

export default function TechnicianJobsPage({
  dashboard = false,
  jobId,
  navigate,
}) {
  const [jobs, setJobs] = useState([]),
    [stats, setStats] = useState(null),
    [job, setJob] = useState(null),
    [filter, setFilter] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setError("");
      if (jobId) setJob((await get(`/api/technician/jobs/${jobId}`)).data);
      else {
        const query = filter ? `?filter=${filter}` : "";
        const requests = [
          get(`/api/technician/jobs${query}`),
          ...(dashboard ? [get("/api/technician/dashboard")] : []),
        ];
        const result = await Promise.all(requests);
        setJobs(result[0].data.items || []);
        if (result[1]) setStats(result[1].data);
      }
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [jobId, filter]);
  async function advance() {
    const status = nextStatus[job.status];
    if (!status) return;
    try {
      setBusy(true);
      setError("");
      setJob(
        (await patch(`/api/technician/jobs/${job.id}/status`, { status })).data,
      );
      setNotice(`Job moved to ${status.replaceAll("_", " ")}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function evidence(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      setBusy(true);
      setError("");
      setJob(
        (
          await api(`/api/technician/jobs/${job.id}/evidence`, {
            method: "POST",
            body: form,
          })
        ).data,
      );
      setNotice("Evidence uploaded successfully.");
      e.currentTarget.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function requestOtp() {
    try {
      setBusy(true);
      const result = (
        await post(`/api/technician/jobs/${job.id}/completion-otp`, {})
      ).data;
      setNotice(
        result.developmentOtp
          ? `Customer OTP: ${result.developmentOtp}`
          : result.message,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function confirm(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      setBusy(true);
      setJob(
        (
          await post(`/api/technician/jobs/${job.id}/confirm`, {
            otp: f.get("otp"),
            accepted: true,
            customerName: f.get("customerName"),
            remarks: f.get("remarks") || undefined,
          })
        ).data,
      );
      setNotice("Customer completion confirmed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (jobId)
    return (
      <section className="content technician-page">
        <div className="headline">
          <div>
            <button className="text-button" onClick={() => navigate("/jobs")}>
              <ArrowLeft size={16} />
              My jobs
            </button>
            <h1>{job?.ticketNo || `Job #${jobId}`}</h1>
            {job && (
              <small>
                {job.customerName} · <StatusBadge>{job.status}</StatusBadge>
              </small>
            )}
          </div>
        </div>
        {error && <div className="auth-error">{error}</div>}
        {notice && <div className="form-message">{notice}</div>}
        {job && (
          <>
            <div className="technician-detail-grid">
              <article className="card profile-section">
                <h2>{job.jobType || job.serviceType || job.category}</h2>
                <p>{job.description}</p>
                <dl className="job-facts">
                  <div>
                    <dt>Customer</dt>
                    <dd>{job.customerName}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{job.customerPhone || "—"}</dd>
                  </div>
                  <div>
                    <dt>Priority</dt>
                    <dd>
                      <StatusBadge>{job.priority}</StatusBadge>
                    </dd>
                  </div>
                  <div>
                    <dt>Scheduled</dt>
                    <dd>
                      {job.scheduled_at
                        ? new Date(job.scheduled_at).toLocaleString()
                        : "Assigned now"}
                    </dd>
                  </div>
                  <div className="wide">
                    <dt>Address</dt>
                    <dd>{job.address || "No address supplied"}</dd>
                  </div>
                  <div className="wide">
                    <dt>Admin instructions</dt>
                    <dd>{job.adminInstructions || "—"}</dd>
                  </div>
                </dl>
                {job.assetNo && (
                  <div className="asset-job-context">
                    <h3>Asset {job.assetNo}</h3>
                    <p>
                      {[
                        job.assetDetails?.signType,
                        job.assetDetails?.size,
                        job.assetDetails?.material,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <h4>Previous service history</h4>
                    {(job.previousServiceHistory || []).map((item) => (
                      <p key={item.ticketNo}>
                        <b>{item.ticketNo}</b> — {item.category}:{" "}
                        {item.description}{" "}
                        <StatusBadge>{item.status || "submitted"}</StatusBadge>
                      </p>
                    ))}
                    {!job.previousServiceHistory?.length && (
                      <small>No previous service visits.</small>
                    )}
                  </div>
                )}
                {job.gpsLocation && (
                  <a
                    className="outline map-link"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${job.gpsLocation.latitude},${job.gpsLocation.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin size={16} />
                    Open navigation
                    <ExternalLink size={14} />
                  </a>
                )}
                {nextStatus[job.status] && (
                  <button
                    className="primary job-action"
                    disabled={busy}
                    onClick={advance}
                  >
                    <CheckCircle2 size={17} />
                    {busy ? "Saving…" : actionLabel[nextStatus[job.status]]}
                  </button>
                )}
              </article>
              <form
                className="card profile-section evidence-form"
                onSubmit={evidence}
              >
                <h2>
                  <Camera size={18} />
                  Job evidence
                </h2>
                <label>
                  Photo type
                  <select name="type" required>
                    <option value="before">Before work</option>
                    <option value="work">Work in progress</option>
                    <option value="after">After work</option>
                  </select>
                </label>
                <label>
                  Photos
                  <input
                    name="photos"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    multiple
                    required
                  />
                </label>
                <label>
                  Notes
                  <textarea
                    name="workDescription"
                    rows="3"
                    placeholder="Describe the evidence"
                  />
                </label>
                <button className="outline" disabled={busy}>
                  <Camera size={16} />
                  Upload evidence
                </button>
                <div className="evidence-list">
                  {(job.evidencePhotos || []).map((p) => (
                    <a href={p.url} target="_blank" rel="noreferrer" key={p.id}>
                      {p.type}: photo #{p.id}
                    </a>
                  ))}
                </div>
              </form>
            </div>
            {job.status === "completed" && !job.customer_confirmation && (
              <article className="card profile-section completion-card">
                <h2>Customer confirmation</h2>
                <button
                  className="outline"
                  disabled={busy}
                  onClick={requestOtp}
                >
                  Generate customer OTP
                </button>
                <form onSubmit={confirm}>
                  <label>
                    Customer name
                    <input name="customerName" required minLength="2" />
                  </label>
                  <label>
                    6-digit OTP
                    <input
                      name="otp"
                      required
                      pattern="[0-9]{6}"
                      inputMode="numeric"
                    />
                  </label>
                  <label>
                    Remarks
                    <input name="remarks" />
                  </label>
                  <button className="primary" disabled={busy}>
                    Confirm completion
                  </button>
                </form>
              </article>
            )}
          </>
        )}
      </section>
    );
  const metrics = stats
    ? [
        ["Assigned", stats.assigned],
        ["Pending", stats.pending],
        ["In progress", stats.inProgress],
        ["Completed", stats.completed],
        ["Emergency", stats.emergency],
      ]
    : [];
  return (
    <section className="content technician-page">
      <div className="headline">
        <div>
          <p>FIELD OPERATIONS</p>
          <h1>{dashboard ? "Technician dashboard" : "My assigned jobs"}</h1>
          <small>
            Jobs assigned to your technician account by administrators.
          </small>
        </div>
        <button className="outline" onClick={load}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {dashboard && (
        <div className="metric-grid tech-metrics">
          {metrics.map(([label, value]) => (
            <article className="card" key={label}>
              <small>{label}</small>
              <b>{value || 0}</b>
            </article>
          ))}
        </div>
      )}
      <div className="status-tabs">
        {[
          ["", "All"],
          ["pending", "Pending"],
          ["today", "Today"],
          ["upcoming", "Upcoming"],
          ["completed", "Completed"],
        ].map(([value, label]) => (
          <button
            key={label}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <article className="tablecard card">
        <div className="customer-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Schedule</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jobs.map((row) => (
                <tr key={row.id}>
                  <td>
                    <b>{row.ticketNo}</b>
                  </td>
                  <td>{row.customer}</td>
                  <td>{row.jobType || row.category}</td>
                  <td>
                    <StatusBadge>{row.priority}</StatusBadge>
                  </td>
                  <td>
                    <StatusBadge>{row.status}</StatusBadge>
                  </td>
                  <td>
                    {row.scheduledAt
                      ? new Date(row.scheduledAt).toLocaleString()
                      : "Unscheduled"}
                  </td>
                  <td>
                    <button
                      className="outline"
                      onClick={() => navigate(`/jobs/${row.id}`)}
                    >
                      View job
                    </button>
                  </td>
                </tr>
              ))}
              {!jobs.length && (
                <tr>
                  <td colSpan="7" className="empty-copy">
                    No assigned jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
