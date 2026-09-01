import React, { Suspense, lazy } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import DashboardPage from '../../pages/admin/DashboardPage';
import LoadingState from '../../components/ui/LoadingState';

const ReportsPage = lazy(() => import('../../pages/admin/ReportsPage'));
const ResourcePage = lazy(() => import('../../pages/admin/ResourcePage'));
const NotificationsPage = lazy(() => import('../../pages/admin/NotificationsPage'));
const PricingPage = lazy(() => import('../../pages/admin/PricingPage'));
const ServiceAreasPage = lazy(() => import('../../pages/admin/ServiceAreasPage'));
const CustomersPage = lazy(() => import('../../pages/admin/CustomersPage'));
const OrdersPage = lazy(() => import('../../pages/admin/OrdersPage'));
const QuotationsPage = lazy(() => import('../../pages/admin/QuotationsPage'));
const ServicesPage = lazy(() => import('../../pages/admin/ServicesPage'));
const TechniciansPage = lazy(() => import('../../pages/admin/TechniciansPage'));
const AssetsPage = lazy(() => import('../../pages/admin/AssetsPage'));
const AIManagementPage = lazy(() => import('../../pages/admin/AIManagementPage'));
const SettingsPage = lazy(() => import('../../pages/admin/SettingsPage'));

const resources = { customers:'customers', products:'products', categories:'categories', materials:'materials', lighting:'lighting', accessories:'accessories', 'installation-options':'installation-options', orders:'orders', quotations:'quotations', services:'services', technicians:'technicians', assets:'assets', 'ai-leads':'ai-leads', 'ai-knowledge':'ai-knowledge', 'ai-conversations':'ai-conversations', 'design-concepts':'design-concepts', 'notification-templates':'notification-templates', settings:'settings', roles:'roles', permissions:'permissions', 'audit-logs':'audit-logs' };

export default function AdminRouter({ path, navigate }) {
  const resource = resources[path.slice(1)] || ({'service-areas':'service-areas','whatsapp-notifications':'whatsapp-notifications'})[path.slice(1)];
  const page = path === '/' ? <DashboardPage navigate={navigate} />
    : path === '/customers' ? <CustomersPage />
    : path === '/orders' ? <OrdersPage navigate={navigate} />
    : path === '/quotations' ? <QuotationsPage />
    : path === '/services' ? <ServicesPage />
    : path === '/technicians' ? <TechniciansPage />
    : path === '/assets' ? <AssetsPage />
    : path === '/ai-management' ? <AIManagementPage />
    : path === '/settings' ? <SettingsPage />
    : path === '/reports' ? <ReportsPage />
      : path === '/notifications' ? <NotificationsPage />
      : path === '/pricing' ? <PricingPage />
      : path === '/service-areas' ? <ServiceAreasPage />
      : resource ? <ResourcePage key={resource} resource={resource} />
        : <section className="content"><h1>Page not found</h1><button className="primary" onClick={() => navigate('/')}>Back to dashboard</button></section>;
  return <AdminLayout path={path} navigate={navigate}><Suspense fallback={<LoadingState />}>{page}</Suspense></AdminLayout>;
}
