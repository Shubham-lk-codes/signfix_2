import React, { useEffect, useState } from "react";
import { ArrowLeft, Eye, Plus, QrCode } from "lucide-react";
import { get, post } from "../../api/client";
import StatusBadge from "../../components/ui/StatusBadge";
export default function AssetsPage() {
  const [rows, setRows] = useState([]),
    [customers, setCustomers] = useState([]),
    [form, setForm] = useState(null),
    [asset, setAsset] = useState(null);
  async function load() {
    setRows((await get("/api/admin/operations/assets")).data || []);
  }
  useEffect(() => {
    load();
    get("/api/admin/customers?pageSize=100").then((x) =>
      setCustomers(x.data || []),
    );
  }, []);
  async function open(id) {
    setAsset(await get(`/api/admin/operations/assets/${id}`));
  }
  async function save(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    await post("/api/admin/operations/assets", {
      customerId: Number(f.customerId),
      orderNo: f.orderNo || undefined,
      location: { address: f.location },
      signType: f.signType,
      size: f.size,
      material: f.material,
      installationDate: f.installationDate,
      warrantyStart: f.warrantyStart || f.installationDate,
      warrantyUntil: f.warrantyUntil || undefined,
      photos: f.photos
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    });
    setForm(null);
    await load();
  }
  async function history(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    await post(`/api/admin/operations/assets/${asset.assetNo}/history`, f);
    setAsset(await get(`/api/admin/operations/assets/${asset.assetNo}`));
    e.currentTarget.reset();
  }
  async function qr(action) {
    if(action === "rotate" && !confirm("Rotate this QR code? The previous code will stop working.")) return;
    await post(`/api/admin/operations/assets/${asset.assetNo}/qr`, { action });
    await open(asset.assetNo);
  }
  if (asset)
    return (
      <section className="content">
        <div className="headline">
          <div>
            <button className="text-button" onClick={() => setAsset(null)}>
              <ArrowLeft size={16} />
              Assets
            </button>
            <h1>{asset.assetNo}</h1>
            <small>{asset.customer}</small>
          </div>
          <div className="asset-qr">
            <img src={`/api/qr/${asset.qrToken}/image`} alt={`QR code for ${asset.assetNo}`} />
            <a className="outline" href={`/asset/scan/${asset.qrToken}`} target="_blank" rel="noreferrer"><QrCode size={16}/>Verify QR</a>
            <button className="outline" onClick={() => qr("rotate")}>Rotate QR</button>
            <button className="outline" onClick={() => qr(asset.qrActive ? "disable" : "enable")}>{asset.qrActive ? "Disable" : "Enable"} QR</button>
          </div>
        </div>
        <div className="customer-summary">
          <article className="card">
            <h2>Sign board</h2>
            {Object.entries(asset.details || {}).map(([k, v]) => (
              <p key={k}>
                <b>{k}</b>
                <span>{v}</span>
              </p>
            ))}
          </article>
          <article className="card">
            <h2>Installation</h2>
            <p>
              <b>Date</b>
              <span>{String(asset.installationDate).slice(0, 10)}</span>
            </p>
            <p>
              <b>Warranty</b>
              <span>{String(asset.warrantyUntil || "—").slice(0, 10)}</span>
            </p>
            <p><b>Order</b><span>{asset.orderNo || "—"}</span></p>
            <p><b>Asset status</b><span><StatusBadge>{asset.status}</StatusBadge></span></p>
            <p><b>Warranty start</b><span>{String(asset.warrantyStart || "—").slice(0, 10)}</span></p>
            <p>
              <b>Location</b>
              <span>{asset.location?.address}</span>
            </p>
            <p><b>Warranty status</b><span><StatusBadge>{asset.warrantyUntil && new Date(asset.warrantyUntil) >= new Date() ? "active" : "expired"}</StatusBadge></span></p>
          </article>
        </div>
        <article className="card profile-section">
          <h2>Photos</h2>
          <div className="ticket-photos">
            {(asset.photos || []).map((p) => (
              <img src={p} key={p} />
            ))}
          </div>
        </article>
        <article className="card profile-section">
          <h2>Service, repair and replacement history</h2>
          <form className="inline-form" onSubmit={history}>
            <label>
              Type
              <select name="type">
                <option>service</option>
                <option>repair</option>
                <option>replacement</option>
              </select>
            </label>
            <label>
              Notes
              <input name="notes" required />
            </label>
            <button className="primary">Add history</button>
          </form>
          {asset.history.map((h) => (
            <div className="order-related" key={h.id}>
              <b>{h.type}</b>
              <span>{h.notes}</span>
              <small>{new Date(h.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </article>
      </section>
    );
  return (
    <section className="content">
      <div className="headline">
        <div>
          <p>INSTALLED BASE</p>
          <h1>Sign board assets</h1>
          <small>One traceable record for every installed sign board.</small>
        </div>
        <button className="primary" onClick={() => setForm({})}>
          <Plus size={16} />
          Create asset
        </button>
      </div>
      {form && (
        <form className="inline-form card" onSubmit={save}>
          <label>
            Customer
            <select name="customerId" required>
              {customers.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name} · {c.company}
                </option>
              ))}
            </select>
          </label>
          {[
            ["location", "Location"],
            ["orderNo", "Order number"],
            ["signType", "Sign type"],
            ["size", "Size"],
            ["material", "Material"],
            ["installationDate", "Installation date", "date"],
            ["warrantyStart", "Warranty start", "date"],
            ["warrantyUntil", "Warranty until", "date"],
            ["photos", "Photo URLs (comma separated)"],
          ].map(([n, l, t = "text"]) => (
            <label key={n}>
              {l}
              <input
                name={n}
                type={t}
                required={!["orderNo", "warrantyStart", "warrantyUntil", "photos"].includes(n)}
              />
            </label>
          ))}
          <button className="primary">Create</button>
          <button
            type="button"
            className="outline"
            onClick={() => setForm(null)}
          >
            Cancel
          </button>
        </form>
      )}
      <article className="tablecard card">
        <table>
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Customer</th>
              <th>Location</th>
              <th>Sign type</th>
              <th>Size</th>
              <th>Installation</th>
              <th>Warranty</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.assetNo}>
                <td>
                  <b>{a.assetNo}</b>
                </td>
                <td>{a.customer}</td>
                <td>{a.location?.address || "—"}</td>
                <td>{a.signType}</td>
                <td>{a.size}</td>
                <td>{String(a.installationDate).slice(0, 10)}</td>
                <td>{String(a.warrantyUntil || "—").slice(0, 10)}</td>
                <td>
                  <button className="outline" onClick={() => open(a.assetNo)}>
                    <Eye size={14} />
                    View
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
