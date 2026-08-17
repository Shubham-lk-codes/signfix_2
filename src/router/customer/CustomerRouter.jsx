import React from 'react';
import MobileLayout from '../../components/layout/MobileLayout';
import AiSupportPage from '../../pages/customer/AiSupportPage';
import CustomerHomePage from '../../pages/customer/CustomerHomePage';
import CustomerOrdersPage from '../../pages/customer/CustomerOrdersPage';
import DesignDemoPage from '../../pages/customer/DesignDemoPage';
import OrderWizardPage from '../../pages/customer/OrderWizardPage';
import ServiceRequestPage from '../../pages/customer/ServiceRequestPage';
import ProfilePage from '../../pages/shared/ProfilePage';

export default function CustomerRouter({ path, navigate }) {
  const routes = {
    '/customer/order/new': <OrderWizardPage navigate={navigate} />,
    '/customer/orders': <CustomerOrdersPage />,
    '/customer/service': <ServiceRequestPage />,
    '/customer/ai': <AiSupportPage />,
    '/customer/design': <DesignDemoPage />,
    '/profile': <ProfilePage />,
  };
  return <MobileLayout path={path} navigate={navigate}>{routes[path] || <CustomerHomePage navigate={navigate} />}</MobileLayout>;
}
