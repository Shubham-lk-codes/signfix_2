import React from 'react';
import { useAuth } from '../context/AuthContext';
import useRoute from '../hooks/useRoute';
import LoadingState from '../components/ui/LoadingState';
import LoginPage from '../pages/auth/LoginPage';
import AdminRouter from './admin/AdminRouter';
import CustomerRouter from './customer/CustomerRouter';
import TechnicianRouter from './technician/TechnicianRouter';

export default function AppRouter() {
  const { user, loading } = useAuth();
  const { path, navigate } = useRoute();
  if (loading) return <LoadingState label="Checking session…" />;
  if (!user) return <LoginPage navigate={navigate} />;
  if (user.role === 'customer') return <CustomerRouter path={path} navigate={navigate} />;
  if (user.role === 'technician') return <TechnicianRouter path={path} navigate={navigate} />;
  return <AdminRouter path={path} navigate={navigate} />;
}
