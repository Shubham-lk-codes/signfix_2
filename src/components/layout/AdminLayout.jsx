import React, { useState } from 'react';
import { ArrowUpRight, Bell, Bot, Boxes, Calculator, ChevronDown, ClipboardList, Headphones, LayoutDashboard, LogOut, MapPin, Menu, MessageCircle, Package, Search, Settings, ShieldCheck, TicketCheck, Users, Wrench, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import signFixLogo from '../../../branding/signfix-logo.svg';

const items = [
  ['Overview', '/', LayoutDashboard], ['Customers', '/customers', Users],
  ['Products', '/products', Package], ['Categories', '/categories', Boxes], ['Materials', '/materials', Boxes], ['Lighting', '/lighting', Boxes], ['Accessories','/accessories',Boxes], ['Installation options','/installation-options',Wrench],
  ['Pricing', '/pricing', Calculator],
  ['Orders', '/orders', Package], ['Quotations', '/quotations', ClipboardList],
  ['Service tickets', '/services', TicketCheck], ['Technicians', '/technicians', Wrench],
  ['Service areas', '/service-areas', MapPin], ['WhatsApp logs', '/whatsapp-notifications', MessageCircle],
  ['Sign assets', '/assets', ShieldCheck], ['AI leads', '/ai-leads', Bot], ['AI knowledge', '/ai-knowledge', Bot], ['AI conversations', '/ai-conversations', Bot], ['Design concepts', '/design-concepts', Bot],
  ['Notifications', '/notifications', Bell], ['Notification templates','/notification-templates',Bell], ['Reports', '/reports', ArrowUpRight],
  ['Roles', '/roles', Users], ['Permissions', '/permissions', ShieldCheck], ['Audit logs', '/audit-logs', ClipboardList], ['Settings', '/settings', Settings],
];

export default function AdminLayout({ path, navigate, children }) {
  const { user, logout } = useAuth();
  const [mobile, setMobile] = useState(false);
  const go = (url) => { navigate(url); setMobile(false); };
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'AD';
  return <div className="admin-shell">
    {mobile && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobile(false)} />}
    <aside className={`admin-sidebar ${mobile ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <img src={signFixLogo} alt="SignFix logo" />
        <div><b>SignFix</b><small>Operations Suite</small></div>
        <button className="sidebar-close" onClick={() => setMobile(false)}><X size={20} /></button>
      </div>
      <button className="workspace-switcher"><span><small>WORKSPACE</small><b>DL SSR INFOTECH</b></span><ChevronDown size={16} /></button>
      <div className="sidebar-scroll">
        <nav className="admin-nav">{items.map(([label, url, Icon]) =>
          <button key={url} className={path === url ? 'active' : ''} onClick={() => go(url)}>
            <Icon size={19} /><span>{label}</span>{label === 'Service tickets' && <i>12</i>}
          </button>)}</nav>
      </div>
      <div className="sidebar-footer">
        <div className="support-card"><Headphones size={25} /><b>Need help?</b><p>Talk to SignFix support.</p><button onClick={() => window.location.href = 'mailto:support@signfix.in'}>Contact support</button></div>
        <button className="sidebar-logout" onClick={logout}><LogOut size={18} />Sign out</button>
      </div>
    </aside>
    <main className="admin-main">
      <header className="admin-header">
        <button className="menu-button" onClick={() => setMobile(true)}><Menu size={22} /></button>
        <div className="admin-search"><Search size={19} /><input aria-label="Global search" placeholder="Search orders, customers, tickets…" /><kbd>⌘ K</kbd></div>
        <button className="notification-button" aria-label="Notifications" onClick={() => go('/notifications')}><Bell size={21} /><i /></button>
        <div className="admin-user"><div>{initials}</div><span><b>{user?.name || user?.email}</b><small>{user?.role?.replaceAll('_', ' ')}</small></span><ChevronDown size={15} /></div>
      </header>
      {children}
    </main>
  </div>;
}
