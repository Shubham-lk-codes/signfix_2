import React, { useEffect, useState } from "react";
import { Calculator, IndianRupee, Save } from "lucide-react";
import { get, patch, post } from "../../api/client";
import LoadingState from "../../components/ui/LoadingState";
const labels = {
  base: "Base price per sq.ft.",
  material: "Default material price per sq.ft.",
  lighting: "Default lighting price per sq.ft.",
  installation: "Installation",
  transportation: "Transportation",
  design: "Design",
  electricalWork: "Electrical work",
  mountingStructure: "Mounting structure",
  accessories: "Accessories",
  customization: "Customization",
  discount: "Default discount",
  gst: "GST",
  minimum: "Minimum order value",
};
export default function PricingPage() {
  const [rules, setRules] = useState({}),
    [ids, setIds] = useState({}),
    [options, setOptions] = useState({
      products: [],
      materials: [],
      lighting: [],
    }),
    [estimate, setEstimate] = useState(null),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    Promise.all([
      get("/api/catalog/pricing-rules?pageSize=100"),
      get("/api/catalog/products?pageSize=100&status=true"),
      get("/api/catalog/materials?pageSize=100&status=true"),
      get("/api/catalog/lighting?pageSize=100&status=true"),
    ])
      .then(([result, products, materials, lighting]) => {
        const next = {},
          found = {};
        for (const row of result.data || []) {
          if (row.productId == null && row.ruleType) {
            next[row.ruleType] = Number(row.amount);
            found[row.ruleType] = row.id;
          }
        }
        setRules(next);
        setIds(found);
        setOptions({
          products: products.data || [],
          materials: materials.data || [],
          lighting: lighting.data || [],
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function save() {
    setSaving(true);
    setNotice("");
    try {
      const known = { ...ids };
      for (const [ruleType, amount] of Object.entries(rules)) {
        const payload = {
          name: labels[ruleType] || ruleType,
          ruleType,
          pricingMethod: ["base", "material", "lighting"].includes(ruleType)
            ? "sqft"
            : ruleType === "gst"
              ? "percent"
              : "fixed",
          amount,
          taxRate: Number(rules.gst || 0),
          status: true,
        };
        if (known[ruleType])
          await patch(`/api/catalog/pricing-rules/${known[ruleType]}`, payload);
        else
          known[ruleType] = (
            await post("/api/catalog/pricing-rules", payload)
          ).id;
      }
      setIds(known);
      setNotice("Database pricing rules saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function calculate(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      setEstimate(
        await post("/api/calculator", {
          product: f.product,
          material: f.material || undefined,
          lighting: f.lighting || undefined,
          length: Number(f.length),
          width: Number(f.width),
          quantity: Number(f.quantity),
          unit: f.unit,
        }),
      );
      setError("");
    } catch (ex) {
      setError(ex.message);
    }
  }
  if (loading)
    return (
      <section className="content">
        <LoadingState label="Loading pricing rules…" />
      </section>
    );
  return (
    <section className="content">
      <div className="headline">
        <div>
          <p>COMMERCIAL</p>
          <h1>Pricing management</h1>
          <small>Database-backed rates used by the server calculator.</small>
        </div>
        <button
          className="primary"
          onClick={save}
          disabled={saving || !Object.keys(rules).length}
        >
          <Save size={17} />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="pricing-layout">
        <article className="card">
          <div className="section-title">
            <span className="feature-icon green">
              <IndianRupee size={19} />
            </span>
            <div>
              <h2>Global pricing rules</h2>
              <p>Only rules currently stored in the database are shown.</p>
            </div>
          </div>
          {Object.keys(rules).length ? (
            <div className="pricing-fields">
              {Object.entries(rules).map(([key, value]) => (
                <label key={key}>
                  {labels[key] || key}
                  <div className="money-input">
                    <span>{key === "gst" ? "%" : "₹"}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={value}
                      onChange={(e) =>
                        setRules({ ...rules, [key]: Number(e.target.value) })
                      }
                    />
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="empty">No global pricing rules configured.</div>
          )}
        </article>
        <form className="card calculator-preview" onSubmit={calculate}>
          <div className="section-title">
            <span className="feature-icon purple">
              <Calculator size={19} />
            </span>
            <div>
              <h2>Live estimate</h2>
              <p>Calculated by the backend from active database records.</p>
            </div>
          </div>
          <label>
            Product
            <select name="product" required>
              {options.products.map((x) => (
                <option key={x.id}>{x.name}</option>
              ))}
            </select>
          </label>
          <label>
            Material
            <select name="material">
              <option value="">None</option>
              {options.materials.map((x) => (
                <option key={x.id}>{x.name}</option>
              ))}
            </select>
          </label>
          <label>
            Lighting
            <select name="lighting">
              <option value="">None</option>
              {options.lighting.map((x) => (
                <option key={x.id}>{x.name}</option>
              ))}
            </select>
          </label>
          <div className="order-form-grid">
            <label>
              Length
              <input
                name="length"
                type="number"
                min="0.01"
                step="any"
                required
              />
            </label>
            <label>
              Width
              <input
                name="width"
                type="number"
                min="0.01"
                step="any"
                required
              />
            </label>
            <label>
              Quantity
              <input
                name="quantity"
                type="number"
                min="1"
                defaultValue="1"
                required
              />
            </label>
            <label>
              Unit
              <select name="unit">
                <option>ft</option>
                <option>in</option>
                <option>cm</option>
                <option>m</option>
              </select>
            </label>
          </div>
          <button className="outline" disabled={!options.products.length}>
            Run calculation
          </button>
          {estimate && (
            <div className="estimate-breakdown">
              {Object.entries(estimate)
                .filter(([, v]) => typeof v === "number")
                .map(([k, v]) => (
                  <span key={k}>
                    {k.replace(/([A-Z])/g, " $1")}{" "}
                    <b>
                      {k === "area"
                        ? `${v} sq.ft.`
                        : `₹${v.toLocaleString("en-IN")}`}
                    </b>
                  </span>
                ))}
              <small>{estimate.notice}</small>
            </div>
          )}
          {notice && <p className="form-message">{notice}</p>}
        </form>
      </div>
    </section>
  );
}
