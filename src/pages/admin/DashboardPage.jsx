import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ClipboardList, MoreHorizontal, Package, Plus, Users, Wrench, Zap } from 'lucide-react';
import { get } from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';

const sampleOrders = [
  { id: 'SB-ORD-2026-001284', customer: 'Vistara Retail', product: 'LED Channel Letters', estimatedPrice: 48200, status: 'under_review', createdAt: '2026-08-12T10:42:00' },
  { id: 'SB-ORD-2026-001283', customer: 'Green Leaf Cafe', product: 'Neon Sign', estimatedPrice: 31500, status: 'quotation_sent', createdAt: '2026-08-12T09:18:00' },
  { id: 'SB-ORD-2026-001282', customer: 'Orbit Fitness', product: '3D Acrylic', estimatedPrice: 72800, status: 'production', createdAt: '2026-08-11T17:26:00' },
  { id: 'SB-ORD-2026-001281', customer: 'Maya Fashion', product: 'Glow Sign Board', estimatedPrice: 24600, status: 'ready', createdAt: '2026-08-11T14:05:00' },
];
const sampleServices = [
  { id: 'SB-SRV-2026-000461', customer: 'Nova Pharmacy', category: 'LED Problem', priority: 'emergency', technician: 'R. Kumar', status: 'on_the_way' },
  { id: 'SB-SRV-2026-000460', customer: 'Urban Bakery', category: 'Physical Damage', priority: 'high', technician: 'Unassigned', status: 'under_review' },
  { id: 'SB-SRV-2026-000459', customer: 'Apex Dental', category: 'Maintenance', priority: 'normal', technician: 'A. Singh', status: 'work_in_progress' },
];

export default function DashboardPage({ navigate }) {
  const [state, setState] = useState({ dashboard: null, orders: null, services: null, leads: null });
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = (key, path, select = (value) => value) => get(path)
      .then((value) => active && setState((current) => ({ ...current, [key]: select(value) })))
      .catch((requestError) => active && setError((current) => current || requestError.message));
    load('dashboard', '/api/admin/dashboard');
    load('orders', '/api/orders?limit=4', (value) => value.data);
    load('services', '/api/services?limit=3', (value) => value.data);
    load('leads', '/api/catalog/ai-leads?pageSize=5', (value) => value.data);
    return () => { active = false; };
  }, []);
  const data = state?.dashboard || {};
  const orders = state.orders?.length ? state.orders : sampleOrders;
  const services = state.services?.length ? state.services : sampleServices;
  const metrics = [
    ['Total Customers', data.customers, '+12.5%', Users, 'blue'], ['New Orders', data.newOrders, '+8.2%', Package, 'purple'],
    ['Pending Quotes', data.pendingQuotations, 'Needs action', ClipboardList, 'orange'], ['Active Services', data.activeServices, '+5 this week', Wrench, 'red'],
    ['Revenue', `₹${Number(data.revenue || 0).toLocaleString('en-IN')}`, '+18.4%', ArrowUpRight, 'green'], ['Technicians', data.technicians, 'Team capacity', Users, 'cyan'],
    ['Completed Jobs', data.completedJobs, 'All time', Zap, 'green'], ['Pending Jobs', data.pendingJobs, 'Needs attention', Wrench, 'orange'],
  ];
  return <section className="overview-page">
    <div className="overview-heading"><div><p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><h1>Good morning, Arun <span>👋</span></h1><small>Here’s what’s happening across your business today.</small></div><div className="overview-actions"><button className="secondary-action"><ArrowUpRight size={17} />Export report</button><button className="primary-action-button" onClick={() => navigate('/orders')}><Plus size={18} />Create order</button></div></div>
    {error && <div className="auth-error">{error}</div>}
    <div className="overview-metrics">{metrics.map(([label, value, note, Icon, color]) => <article key={label}><div className={`overview-metric-icon ${color}`}><Icon size={21} /></div><MoreHorizontal className="metric-menu" size={20} /><p>{label}</p><div><h2>{value ?? 0}</h2><small className={note.startsWith('+') ? 'positive' : ''}>{note}</small></div></article>)}</div>
    <div className="overview-chart-row">
      <article className="overview-card business-chart"><div className="overview-card-head"><div><h3>Business overview</h3><p>Orders and service requests</p></div><select><option>Last 6 months</option></select></div><div className="chart-legend"><span><i className="blue" />Orders</span><span><i className="orange" />Service requests</span></div><div className="overview-plot"><div className="plot-y"><span>120</span><span>90</span><span>60</span><span>30</span><span>0</span></div><svg viewBox="0 0 700 220" preserveAspectRatio="none"><defs><linearGradient id="overviewFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#356ae6" stopOpacity=".2"/><stop offset="1" stopColor="#356ae6" stopOpacity="0"/></linearGradient></defs><path className="chart-area" d="M0 175 C75 158 110 86 190 112 S310 44 390 78 S510 123 590 38 S670 76 700 28 L700 220 L0 220Z"/><path className="chart-line blue-line" d="M0 175 C75 158 110 86 190 112 S310 44 390 78 S510 123 590 38 S670 76 700 28"/><path className="chart-line orange-line" d="M0 193 C80 168 130 183 190 153 S300 132 390 148 S500 94 590 119 S660 94 700 108"/></svg><div className="plot-months"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div></div></article>
      <article className="overview-card service-status"><div className="overview-card-head"><div><h3>Service status</h3><p>{data.activeServices || 0} active requests</p></div><MoreHorizontal size={20}/></div><div className="status-donut"><div><b>{data.activeServices || 0}</b><span>Active</span></div></div><div className="status-legend"><span><i className="blue"/>Under review <b>12</b></span><span><i className="purple"/>Assigned <b>14</b></span><span><i className="orange"/>In progress <b>9</b></span><span><i className="green"/>Completed <b>7</b></span></div></article>
    </div>
    <article className="overview-card recent-orders"><div className="overview-card-head"><div><h3>Recent orders</h3><p>Latest customer orders requiring attention</p></div><button onClick={() => navigate('/orders')}>View all orders →</button></div><div className="overview-table-wrap"><table><thead><tr><th>ORDER ID</th><th>CUSTOMER</th><th>PRODUCT</th><th>ESTIMATED PRICE</th><th>STATUS</th><th>CREATED</th><th/></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><b>{order.id}</b></td><td>{order.customer || order.createdBy}</td><td>{order.product}</td><td>₹{Number(order.estimatedPrice || 0).toLocaleString('en-IN')}</td><td><StatusBadge>{order.status}</StatusBadge></td><td>{new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td><MoreHorizontal size={18}/></td></tr>)}</tbody></table></div></article>
    <div className="overview-bottom-row"><article className="overview-card priority-services"><div className="overview-card-head"><div><h3>Priority service requests</h3><p>Tickets requiring immediate attention</p></div><button onClick={() => navigate('/services')}>View all →</button></div>{services.map((service) => <div className="priority-row" key={service.id}><div className="service-tool"><Wrench size={18}/></div><div><b>{service.customer || service.createdBy}</b><small>{service.id} · {service.category}</small></div><StatusBadge>{service.priority}</StatusBadge><span>{service.technician || 'Unassigned'}</span><StatusBadge>{service.status}</StatusBadge></div>)}</article><article className="overview-card ai-leads"><div className="overview-card-head"><div><h3>AI sales leads</h3><p>Captured by SignFix AI Assistant</p></div><Zap/></div><h2>{state?.leads?.length || 18} <small>new leads this week</small></h2><div className="lead-bars"><i/><i/><i/><i/></div><div className="lead-counts"><span><b>8</b>New</span><span><b>5</b>Qualified</span><span><b>3</b>Quotation</span><span><b>2</b>Won</span></div><button onClick={() => navigate('/ai-management')}>Review AI leads <ArrowUpRight size={16}/></button></article></div>
  </section>;
}
