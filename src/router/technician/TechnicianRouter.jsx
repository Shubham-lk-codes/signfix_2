import React from 'react';
import TechnicianLayout from '../../components/layout/TechnicianLayout';
import TechnicianJobsPage from '../../pages/technician/TechnicianJobsPage';

export default function TechnicianRouter({path,navigate}){
  const match=path.match(/^\/jobs\/(\d+)$/);
  const page=path==='/'?<TechnicianJobsPage dashboard navigate={navigate}/>
    :path==='/jobs'?<TechnicianJobsPage navigate={navigate}/>
      :match?<TechnicianJobsPage jobId={match[1]} navigate={navigate}/>
        :<section className="content"><h1>Page not found</h1><button className="primary" onClick={()=>navigate('/')}>Back to dashboard</button></section>;
  return <TechnicianLayout path={path} navigate={navigate}>{page}</TechnicianLayout>;
}
