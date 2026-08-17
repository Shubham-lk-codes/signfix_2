import React from 'react';
import MobileLayout from '../../components/layout/MobileLayout';
import JobDetailsPage from '../../pages/technician/JobDetailsPage';
import TechnicianDashboardPage from '../../pages/technician/TechnicianDashboardPage';
import ProfilePage from '../../pages/shared/ProfilePage';

export default function TechnicianRouter({ path, navigate }) {
  const jobMatch = path.match(/^\/technician\/jobs\/(\d+)$/);
  const page = path === '/profile' ? <ProfilePage /> : jobMatch
    ? <JobDetailsPage id={jobMatch[1]} navigate={navigate} />
    : <TechnicianDashboardPage navigate={navigate} />;
  return <MobileLayout path={path} navigate={navigate} technician>{page}</MobileLayout>;
}
