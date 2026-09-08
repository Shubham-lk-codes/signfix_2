import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, FilePlus2, Plus, RefreshCw, Search, Send, Trash2, XCircle } from 'lucide-react';
import { get, patch, post } from '../../api/client';
import LoadingState from '../../components/ui/LoadingState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import './quotations.css';

const statuses = ['draft', 'sent', 'viewed', 'change_requested', 'approved', 'rejected', 'expired', 'cancelled'];
const blankItem = (gstPercentage = 0) => ({ description: '', quantity: 1, unit: 'unit', unitPrice: 0, discountType: 'none', discountValue: 0, taxPercentage: gstPercentage });
const emptyForm = (gstPercentage = 0) => ({ orderNo: '', validUntil: '', installation: 0, transportation: 0, design: 0, accessories: 0, otherCharges: 0, discountType: 'none', discountValue: 0, gstPercentage, terms: '', customerNotes: '', internalNotes: '', items: [blankItem(gstPercentage)] });
const formForOrder = (order, gstPercentage = 0) => {
  const form = emptyForm(gstPercentage), specifications = order?.specifications || {};
  if (!order) return form;
  return {
    ...form,
    orderNo: order.orderNo,
    items: [{ ...blankItem(gstPercentage), description: [specifications.product, specifications.material, specifications.lighting].filter(Boolean).join(' / ') || `Order ${order.orderNo}`, quantity: Number(specifications.quantity || 1), unit: specifications.unit || 'unit', metadata: { sourceOrder: order.orderNo } }],
  };
};
const currency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value) => value ? String(value).slice(0, 10) : '—';

function previewTotals(form) {
  const itemValues = (form.items || []).map((item) => {
    const gross = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    const itemDiscount = item.discountType === 'percentage' ? gross * Number(item.discountValue || 0) / 100 : item.discountType === 'fixed' ? Number(item.discountValue || 0) : 0;
    return { gross, discount: Math.min(gross, itemDiscount), rate: Number(item.taxPercentage ?? form.gstPercentage ?? 0) };
  });
  const charges = ['installation', 'transportation', 'design', 'accessories', 'otherCharges'].reduce((sum, key) => sum + Number(form[key] || 0), 0);
  const subtotal = itemValues.reduce((sum, item) => sum + item.gross, 0) + charges;
  const itemDiscount = itemValues.reduce((sum, item) => sum + item.discount, 0);
  const discountBase = Math.max(0, subtotal - itemDiscount);
  const quoteDiscount = form.discountType === 'percentage' ? discountBase * Number(form.discountValue || 0) / 100 : form.discountType === 'fixed' ? Number(form.discountValue || 0) : 0;
  const discountAmount = Math.min(subtotal, itemDiscount + quoteDiscount);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const globalDiscountFactor = discountBase > 0 ? taxableAmount / discountBase : 0;
  const itemTax = itemValues.reduce((sum, item) => sum + (item.gross - item.discount) * globalDiscountFactor * item.rate / 100, 0);
  const gstAmount = itemTax + charges * globalDiscountFactor * Number(form.gstPercentage || 0) / 100;
  return { subtotal, discountAmount, taxableAmount, gstAmount, finalAmount: taxableAmount + gstAmount };
}

function QuotationForm({ value, orders, policy = {}, onClose, onSaved }) {
  const [form, setForm] = useState(value), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const totals = useMemo(() => previewTotals(form), [form]);
  const maximumDiscountPercentage = Math.min(100, Number(policy.maximumDiscountPercentage ?? 100));
  const set = (key, next) => setForm((current) => ({ ...current, [key]: next }));
  const updateItem = (index, key, next) => setForm((current) => ({ ...current, items: current.items.map((item, position) => position === index ? { ...item, [key]: ['description', 'unit', 'discountType'].includes(key) ? next : Number(next) } : item) }));
  function selectOrder(orderNo) {
    const order = orders.find((candidate) => candidate.orderNo === orderNo), specifications = order?.specifications || {};
    setForm((current) => ({
      ...current,
      orderNo,
      items: current.quotationNo || !order ? current.items : [{ ...blankItem(current.gstPercentage), description: [specifications.product, specifications.material, specifications.lighting].filter(Boolean).join(' / ') || `Order ${orderNo}`, quantity: Number(specifications.quantity || 1), unit: specifications.unit || 'unit', unitPrice: 0, metadata: { sourceOrder: orderNo } }],
    }));
  }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, validUntil: form.validUntil, items: form.items.map(({ id, createdAt, updatedAt, lineSubtotal, lineTotal, taxAmount, discountAmount, ...item }) => item) };
      const saved = form.quotationNo
        ? await patch(`/api/quotations/${form.quotationNo}`, { ...payload, expectedLockVersion: form.lockVersion })
        : await post('/api/quotations', payload);
      onSaved(saved, form.quotationNo ? 'Quotation updated.' : 'Draft quotation created.');
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  }
  return <form className="card quotation-workspace" onSubmit={submit}>
    <div className="panel-heading"><div><button type="button" className="text-button" onClick={onClose}><ArrowLeft size={15}/> Quotations</button><h2>{form.quotationNo ? `${form.quotationNo} · Version ${form.version}` : 'Create quotation'}</h2><p>Final quotation amount is the official commercial amount. Server calculations are authoritative.</p></div>{form.status && <StatusBadge>{form.status}</StatusBadge>}</div>
    {error && <div className="auth-error">{error}</div>}
    <div className="quotation-section"><h3>Customer & order</h3><div className="order-form-grid">
      <label>Order<select value={form.orderNo || ''} disabled={Boolean(form.quotationNo)} onChange={(event) => selectOrder(event.target.value)} required><option value="">Select existing order</option>{orders.map((order) => <option value={order.orderNo} key={order.orderNo}>{order.orderNo} · {order.customer} {order.company ? `(${order.company})` : ''}</option>)}</select></label>
      <label>Issue date<input value={date(form.issueDate || new Date().toISOString())} disabled /></label>
      <label>Valid until<input type="date" value={date(form.validUntil) === '—' ? '' : date(form.validUntil)} min={new Date().toISOString().slice(0, 10)} onChange={(event) => set('validUntil', event.target.value)} required /></label>
    </div></div>
    <div className="quotation-section"><div className="section-title"><h3>Quotation items</h3><button type="button" className="outline" onClick={() => set('items', [...form.items, blankItem(form.gstPercentage)])}><Plus size={14}/> Add item</button></div>
      <div className="quote-item quote-item-head"><span>Description</span><span>Qty</span><span>Unit</span><span>Unit price</span><span>Discount</span><span>Tax %</span><span>Total</span><span/></div>
      {form.items.map((item, index) => <div className="quote-item" key={item.id || index}>
        <input aria-label="Description" value={item.description} onChange={(event) => updateItem(index, 'description', event.target.value)} placeholder="Product or service" required />
        <input aria-label="Quantity" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} required />
        <input aria-label="Unit" value={item.unit || 'unit'} onChange={(event) => updateItem(index, 'unit', event.target.value)} required />
        <input aria-label="Unit price" type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(index, 'unitPrice', event.target.value)} required />
        <div className="inline-fields"><select aria-label="Item discount type" disabled={policy.allowDiscounts === false} value={item.discountType || 'none'} onChange={(event) => updateItem(index, 'discountType', event.target.value)}><option value="none">None</option><option value="fixed">₹</option><option value="percentage">%</option></select><input aria-label="Item discount value" disabled={policy.allowDiscounts === false} type="number" min="0" max={item.discountType === 'percentage' ? maximumDiscountPercentage : undefined} step="0.01" value={item.discountValue || 0} onChange={(event) => updateItem(index, 'discountValue', event.target.value)} /></div>
        <input aria-label="Tax percentage" disabled={policy.gstEnabled === false} type="number" min="0" max="100" step="0.01" value={item.taxPercentage ?? form.gstPercentage} onChange={(event) => updateItem(index, 'taxPercentage', event.target.value)} />
        <b>{currency((Number(item.quantity || 0) * Number(item.unitPrice || 0) - Math.min(Number(item.quantity || 0) * Number(item.unitPrice || 0), item.discountType === 'percentage' ? Number(item.quantity || 0) * Number(item.unitPrice || 0) * Number(item.discountValue || 0) / 100 : item.discountType === 'fixed' ? Number(item.discountValue || 0) : 0)) * (1 + Number(item.taxPercentage ?? form.gstPercentage ?? 0) / 100))}</b>
        <button aria-label="Remove item" type="button" disabled={form.items.length === 1} onClick={() => set('items', form.items.filter((_, position) => position !== index))}><Trash2 size={15}/></button>
      </div>)}
    </div>
    <div className="quotation-grid">
      <div className="quotation-section"><h3>Additional charges</h3><div className="order-form-grid">{[['installation','Installation'],['transportation','Transportation'],['design','Design'],['accessories','Accessories'],['otherCharges','Other charges']].map(([key,label]) => <label key={key}>{label}<input type="number" min="0" step="0.01" value={form[key] || 0} onChange={(event) => set(key, Number(event.target.value))}/></label>)}</div></div>
      <div className="quotation-section"><h3>Commercial terms</h3><div className="order-form-grid"><label>Quotation discount<select disabled={policy.allowDiscounts === false} value={form.discountType || 'none'} onChange={(event) => set('discountType', event.target.value)}><option value="none">None</option><option value="fixed">Fixed</option><option value="percentage">Percentage</option></select></label><label>Discount value<input disabled={policy.allowDiscounts === false} type="number" min="0" max={form.discountType === 'percentage' ? maximumDiscountPercentage : undefined} step="0.01" value={form.discountValue || 0} onChange={(event) => set('discountValue', Number(event.target.value))}/></label><label>GST %<input disabled={policy.gstEnabled === false} type="number" min="0" max="100" step="0.01" value={form.gstPercentage || 0} onChange={(event) => set('gstPercentage', Number(event.target.value))}/></label></div></div>
    </div>
    <div className="quotation-section"><h3>Terms & notes</h3><div className="order-form-grid"><label className="wide">Terms & conditions<textarea rows="4" value={form.terms || ''} onChange={(event) => set('terms', event.target.value)} required /></label><label className="wide">Customer-visible notes<textarea rows="3" value={form.customerNotes || ''} onChange={(event) => set('customerNotes', event.target.value)} /></label><label className="wide">Internal notes — never shown to customer<textarea rows="3" value={form.internalNotes || ''} onChange={(event) => set('internalNotes', event.target.value)} /></label></div></div>
    <div className="quotation-summary"><p><span>Subtotal</span><b>{currency(totals.subtotal)}</b></p><p><span>Discount</span><b>- {currency(totals.discountAmount)}</b></p><p><span>Taxable amount</span><b>{currency(totals.taxableAmount)}</b></p><p><span>GST</span><b>{currency(totals.gstAmount)}</b></p><p className="grand-total"><span>Official final amount</span><b>{currency(totals.finalAmount)}</b></p></div>
    <div className="form-actions"><button type="button" className="outline" onClick={onClose}>Discard</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save quotation'}</button></div>
  </form>;
}

function Detail({ quotation, onBack, onEdit, onAction, onDownload, busy, can }) {
  const specs = quotation.orderSpecifications || {};
  return <section className="content quotation-detail">
    <div className="headline"><div><button className="text-button" onClick={onBack}><ArrowLeft size={16}/> Quotations</button><h1>{quotation.quotationNo} <span>v{quotation.version}</span></h1><small>Order {quotation.orderNo} · Updated {new Date(quotation.updatedAt).toLocaleString('en-IN')}</small></div><StatusBadge>{quotation.status}</StatusBadge></div>
    {quotation.changeRequestComment && <div className="quote-alert"><b>Customer requested changes</b><p>{quotation.changeRequestComment}</p></div>}
    <div className="quote-detail-actions">
      {can('quotation.edit') && quotation.availableActions.includes('edit') && <button className="primary" onClick={onEdit}>Edit draft</button>}
      {can('quotation.send') && quotation.availableActions.includes('send') && <button className="primary" disabled={busy} onClick={() => onAction('send')}><Send size={14}/> Send quotation</button>}
      {can('quotation.send') && quotation.availableActions.includes('resend') && <button className="outline" disabled={busy} onClick={() => onAction('resend')}><RefreshCw size={14}/> Resend</button>}
      {can('quotation.manage_revisions') && quotation.availableActions.includes('create_revision') && <button className="outline" disabled={busy} onClick={() => onAction('revision')}><FilePlus2 size={14}/> Create revision</button>}
      {can('quotation.cancel') && quotation.availableActions.includes('cancel') && <button className="outline reject-action" disabled={busy} onClick={() => onAction('cancel')}><XCircle size={14}/> Cancel</button>}
      {can('quotation.download') && <button className="outline" onClick={onDownload}><Download size={14}/> PDF</button>}
    </div>
    <div className="quotation-detail-grid">
      <article className="card"><h3>Customer information</h3><p><b>{quotation.customerName}</b></p><p>{quotation.company || 'Individual customer'}</p><p>{quotation.customerEmail}</p><p>{quotation.customerPhone || '—'}</p><p>{typeof quotation.customerAddress === 'object' ? Object.values(quotation.customerAddress || {}).filter(Boolean).join(', ') : quotation.customerAddress || '—'}</p></article>
      <article className="card"><h3>Order information</h3><p><b>{quotation.orderNo}</b> · <StatusBadge>{quotation.orderStatus}</StatusBadge></p>{Object.entries(specs).filter(([,value]) => ['string','number','boolean'].includes(typeof value)).slice(0,12).map(([key,value]) => <p className="detail-pair" key={key}><span>{key.replace(/([A-Z])/g,' $1')}</span><b>{String(value)}</b></p>)}</article>
      <article className="card"><h3>Audit information</h3><p className="detail-pair"><span>Created by</span><b>{quotation.createdBy || '—'}</b></p><p className="detail-pair"><span>Updated by</span><b>{quotation.updatedBy || '—'}</b></p><p className="detail-pair"><span>Issue date</span><b>{date(quotation.issueDate)}</b></p><p className="detail-pair"><span>Valid until</span><b>{date(quotation.validUntil)}</b></p></article>
    </div>
    <article className="card tablecard"><div className="cardhead"><h3>Quotation items</h3></div><div className="tablewrap"><table><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit price</th><th>Discount</th><th>Tax</th><th>Line total</th></tr></thead><tbody>{quotation.items.map((item) => <tr key={item.id}><td>{item.description}</td><td>{Number(item.quantity)}</td><td>{item.unit}</td><td>{currency(item.unitPrice)}</td><td>{currency(item.discountAmount)}</td><td>{Number(item.taxPercentage)}% · {currency(item.taxAmount)}</td><td><b>{currency(item.lineTotal)}</b></td></tr>)}</tbody></table></div></article>
    <div className="quotation-detail-grid"><article className="card"><h3>Pricing breakdown</h3>{[['Subtotal',quotation.subtotal],['Discount',quotation.discountAmount],['Taxable amount',quotation.taxableAmount],[`GST (${Number(quotation.gstPercentage)}%)`,quotation.gstAmount],['Final amount',quotation.finalAmount]].map(([label,value],index) => <p className={index===4?'detail-total':'detail-pair'} key={label}><span>{label}</span><b>{currency(value)}</b></p>)}</article><article className="card"><h3>Terms & customer notes</h3><p className="prewrap">{quotation.terms || '—'}</p><h4>Customer-visible notes</h4><p className="prewrap">{quotation.customerNotes || '—'}</p></article><article className="card internal-card"><h3>Internal notes</h3><p className="prewrap">{quotation.internalNotes || '—'}</p><small>Never exposed through customer APIs or PDFs.</small></article></div>
    <div className="quotation-detail-grid"><article className="card"><h3>Status history</h3>{quotation.statusHistory.length ? quotation.statusHistory.map((entry) => <div className="quote-timeline" key={entry.id}><StatusBadge>{entry.newStatus}</StatusBadge><div><b>{entry.oldStatus || 'created'} → {entry.newStatus}</b><small>{entry.actor || entry.actorType} · {new Date(entry.createdAt).toLocaleString('en-IN')}</small>{entry.customerComment && <p>{entry.customerComment}</p>}{entry.internalNote && <p className="muted">{entry.internalNote}</p>}</div></div>) : <p className="empty-copy">No status history.</p>}</article><article className="card"><h3>Revision history</h3>{quotation.revisions.map((revision) => <div className="order-related" key={revision.id}><b>Version {revision.version}</b><span>{currency(revision.finalAmount)}</span><small>{revision.createdBy || 'System'} · {new Date(revision.createdAt).toLocaleString('en-IN')}</small></div>)}</article><article className="card"><h3>Customer actions</h3><p className="detail-pair"><span>Viewed</span><b>{quotation.viewedAt ? new Date(quotation.viewedAt).toLocaleString('en-IN') : '—'}</b></p><p className="detail-pair"><span>Approved</span><b>{quotation.approvedAt ? new Date(quotation.approvedAt).toLocaleString('en-IN') : '—'}</b></p><p className="detail-pair"><span>Rejected</span><b>{quotation.rejectedAt ? new Date(quotation.rejectedAt).toLocaleString('en-IN') : '—'}</b></p><p className="detail-pair"><span>Change request</span><b>{quotation.changeRequestedAt ? new Date(quotation.changeRequestedAt).toLocaleString('en-IN') : '—'}</b></p></article></div>
  </section>;
}

export default function QuotationsPage() {
  const { can } = useAuth();
  const requestedStatus = new URLSearchParams(window.location.search).get('status') || '';
  const [rows, setRows] = useState([]), [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 }), [filter, setFilter] = useState([...statuses, 'pending'].includes(requestedStatus) ? requestedStatus : ''), [search, setSearch] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState(''), [selected, setSelected] = useState(null), [form, setForm] = useState(null), [options, setOptions] = useState({ orders: [], policy: { defaultGstPercentage: 18 } }), [busy, setBusy] = useState(false);
  async function load(page = meta.page) { setLoading(true); try { const params = new URLSearchParams({ page, pageSize: 20 }); if (filter) params.set('status', filter); if (search.trim()) params.set('search', search.trim()); const result = await get(`/api/quotations?${params}`); setRows(result.data || []); setMeta(result); setError(''); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); } }
  useEffect(() => { load(1); }, [filter]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search), quotationNo = params.get('quotationNo'), orderNo = params.get('orderNo');
    if (quotationNo) open(quotationNo);
    if (!can('quotation.create')) return;
    get('/api/quotations/options').then((result) => {
    setOptions(result);
    if (!quotationNo && orderNo) setForm(formForOrder((result.orders || []).find((order) => order.orderNo === orderNo), result.policy?.defaultGstPercentage || 0));
  }).catch((requestError) => setError(requestError.message)); }, []);
  async function open(quotationNo) { try { setSelected(await get(`/api/quotations/${quotationNo}`)); setForm(null); setError(''); } catch (requestError) { setError(requestError.message); } }
  async function action(kind) {
    if (!selected) return; setBusy(true); setError('');
    try {
      let result;
      if (kind === 'cancel') { const reason = window.prompt('Cancellation reason'); if (!reason) return; result = await post(`/api/quotations/${selected.quotationNo}/cancel`, { expectedLockVersion: selected.lockVersion, reason }); }
      else if (kind === 'revision') { if (!window.confirm('Create a new draft revision? The current version will remain in history.')) return; result = await post(`/api/quotations/${selected.quotationNo}/revisions`, { expectedLockVersion: selected.lockVersion }); }
      else result = await post(`/api/quotations/${selected.quotationNo}/${kind}`, { expectedLockVersion: selected.lockVersion });
      setSelected(result); setNotice(kind === 'revision' ? 'New draft revision created.' : kind === 'resend' ? 'Quotation resent.' : kind === 'send' ? 'Quotation sent.' : 'Quotation cancelled.'); await load();
      if (kind === 'revision') setForm({ ...result, validUntil: date(result.validUntil) });
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }
  async function download(quotation = selected) { const response = await fetch(`/api/quotations/${quotation.quotationNo}/pdf`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('signfix_token') || ''}` } }); if (!response.ok) return setError('PDF download failed'); const url = URL.createObjectURL(await response.blob()), anchor = document.createElement('a'); anchor.href = url; anchor.download = `${quotation.quotationNo}-v${quotation.version}.pdf`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
  function saved(result, message) { setForm(null); setSelected(result); setNotice(message); load(); }
  if (form) return <QuotationForm value={form} orders={options.orders || []} policy={options.policy || {}} onClose={() => setForm(null)} onSaved={saved}/>;
  if (selected) return <><Detail quotation={selected} onBack={() => setSelected(null)} onEdit={() => setForm({ ...selected, validUntil: date(selected.validUntil) })} onAction={action} onDownload={() => download()} busy={busy} can={can}/>{notice && <div className="toast">{notice}</div>}{error && <div className="auth-error">{error}</div>}</>;
  return <section className="content"><div className="headline"><div><p>COMMERCIAL</p><h1>Quotation management</h1><small>Official pricing, revisions, customer decisions and commercial audit history.</small></div>{can('quotation.create') && <button className="primary" onClick={() => setForm(emptyForm(options.policy?.defaultGstPercentage || 0))}><Plus size={16}/> Create quotation</button>}</div>
    <div className="status-tabs">{['', 'pending', ...statuses].map((status) => <button className={filter === status ? 'active' : ''} key={status || 'all'} onClick={() => setFilter(status)}>{status ? status.replaceAll('_',' ') : 'All'}</button>)}</div>
    <div className="customer-toolbar card"><div className="admin-search"><Search size={18}/><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && load(1)} placeholder="Quotation, order, customer, company, phone or email"/></div><button className="outline" onClick={() => load(1)}>Search</button></div>
    {notice && <div className="form-message">{notice}</div>}{error && <div className="auth-error">{error} <button className="text-button" onClick={() => load()}>Retry</button></div>}
    {loading ? <LoadingState label="Loading quotations…"/> : <article className="tablecard card"><div className="tablewrap"><table><thead><tr><th>Quotation</th><th>Order</th><th>Customer</th><th>Company</th><th>Amount</th><th>Status</th><th>Version</th><th>Issue / validity</th><th>Created by</th><th>Updated</th></tr></thead><tbody>{rows.map((quotation) => <tr className="clickable-row" key={quotation.quotationNo} onClick={() => open(quotation.quotationNo)}><td><b className="orderid">{quotation.quotationNo}</b></td><td>{quotation.orderNo}</td><td>{quotation.customer}<small className="cell-subtitle">{quotation.mobile || quotation.email}</small></td><td>{quotation.company || '—'}</td><td><b>{currency(quotation.finalAmount)}</b></td><td><StatusBadge>{quotation.status}</StatusBadge></td><td>v{quotation.version}</td><td>{date(quotation.issueDate)}<small className="cell-subtitle">Valid: {date(quotation.validUntil)}</small></td><td>{quotation.createdBy || '—'}</td><td>{new Date(quotation.updatedAt).toLocaleDateString('en-IN')}</td></tr>)}</tbody></table></div>{!rows.length && <div className="empty">No quotations match these filters.</div>}<div className="pagination"><button className="outline" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>Previous</button><span>Page {meta.page} of {meta.totalPages} · {meta.total} quotations</span><button className="outline" disabled={meta.page >= meta.totalPages} onClick={() => load(meta.page + 1)}>Next</button></div></article>}
  </section>;
}
