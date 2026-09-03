import React, { useState } from 'react';
import { BriefcaseBusiness, LayoutDashboard, LogOut, Menu, Wrench, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import signFixLogo from '../../../branding/signfix-logo.svg';

const items=[['Dashboard','/',LayoutDashboard],['My jobs','/jobs',BriefcaseBusiness]];

export default function TechnicianLayout({path,navigate,children}){
  const {user,logout}=useAuth(),[mobile,setMobile]=useState(false);
  const go=url=>{navigate(url);setMobile(false)};
  const initials=user?.name?.split(' ').map(x=>x[0]).join('').slice(0,2)||'TE';
  return <div className="admin-shell technician-shell">
    {mobile&&<button className="sidebar-backdrop" aria-label="Close navigation" onClick={()=>setMobile(false)}/>}
    <aside className={`admin-sidebar ${mobile?'open':''}`}>
      <div className="sidebar-brand"><img src={signFixLogo} alt="SignFix logo"/><div><b>SignFix</b><small>Technician Portal</small></div><button className="sidebar-close" onClick={()=>setMobile(false)}><X size={20}/></button></div>
      <div className="workspace-switcher"><span><small>FIELD OPERATIONS</small><b>{user?.name||'Technician'}</b></span><Wrench size={17}/></div>
      <div className="sidebar-scroll"><nav className="admin-nav">{items.map(([label,url,Icon])=><button key={url} className={(url==='/'?path===url:path.startsWith(url))?'active':''} onClick={()=>go(url)}><Icon size={19}/><span>{label}</span></button>)}</nav></div>
      <div className="sidebar-footer"><button className="sidebar-logout" onClick={logout}><LogOut size={18}/>Sign out</button></div>
    </aside>
    <main className="admin-main"><header className="admin-header"><button className="menu-button" onClick={()=>setMobile(true)}><Menu size={22}/></button><div className="admin-user technician-user"><div>{initials}</div><span><b>{user?.name||user?.email}</b><small>technician</small></span></div></header>{children}</main>
  </div>;
}
