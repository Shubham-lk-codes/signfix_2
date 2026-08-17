import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import DashboardPage from '../../pages/admin/DashboardPage';
import ReportsPage from '../../pages/admin/ReportsPage';
import ResourcePage from '../../pages/admin/ResourcePage';

const resources = { customers:'customers', products:'products', categories:'categories', materials:'materials', lighting:'lighting', orders:'orders', quotations:'quotations', services:'services', technicians:'technicians', assets:'assets', 'ai-leads':'ai-leads', 'ai-knowledge':'ai-knowledge', 'ai-conversations':'ai-conversations', 'design-concepts':'design-concepts', notifications:'notifications', settings:'settings', roles:'roles', permissions:'permissions', 'audit-logs':'audit-logs' };

export default function AdminRouter({ path, navigate }) {
  const resource = resources[path.slice(1)];
  const page = path === '/' ? <DashboardPage navigate={navigate} />
    : path === '/reports' ? <ReportsPage />
      : resource ? <ResourcePage key={resource} resource={resource} />
        : <section className="content"><h1>Page not found</h1><button className="primary" onClick={() => navigate('/')}>Back to dashboard</button></section>;
  return <AdminLayout path={path} navigate={navigate}>{page}</AdminLayout>;
}
