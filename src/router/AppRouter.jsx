import React from 'react';
import { useAuth } from '../context/AuthContext';
import useRoute from '../hooks/useRoute';
import LoadingState from '../components/ui/LoadingState';
import LoginPage from '../pages/auth/LoginPage';
import AdminRouter from './admin/AdminRouter';
import QrAssetPage from '../pages/public/QrAssetPage';

export default function AppRouter() {
  const { user, loading, logout } = useAuth();
  const { path, navigate } = useRoute();
  const qrMatch=path.match(/^\/asset\/scan\/([a-f0-9]{64})$/);
  if(qrMatch)return <QrAssetPage token={qrMatch[1]}/>;
  if (loading) return <LoadingState label="Checking session…" />;
  if (!user) return <LoginPage navigate={navigate} />;
  const adminRoles = ['super_admin','admin','sales_manager','service_manager','technician_manager','support_agent'];
  if (!adminRoles.includes(user.role)) return <div className="auth-page"><section className="auth-card"><h1>Admin access required</h1><p>This web application is available only to authorized SignFix administrators.</p><button className="primary" onClick={logout}>Return to admin login</button></section></div>;
  return <AdminRouter path={path} navigate={navigate} />;
}
