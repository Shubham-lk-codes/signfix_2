import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Send, Smartphone } from 'lucide-react';
import { get, post } from '../../api/client';
import { enablePush, firebaseConfigured } from '../../services/firebase';

const templates = [
  ['Order update','Your order status has been updated.'],['Quotation ready','Your quotation is ready for review.'],
  ['Technician assigned','A technician has been assigned to your service request.'],['Job completed','Your service job is complete.'],
  ['Promotion','A new SignFix offer is available for you.'],
];

export default function NotificationsPage(){
  const [history,setHistory]=useState([]),[status,setStatus]=useState(null),[message,setMessage]=useState(''),[sending,setSending]=useState(false);
  useEffect(()=>{Promise.allSettled([get('/api/catalog/notifications?pageSize=10'),get('/api/notifications/status')]).then(([items,server])=>{if(items.status==='fulfilled')setHistory(items.value.data||[]);if(server.status==='fulfilled')setStatus(server.value.configured)})},[]);
  async function activate(){try{await enablePush(payload=>setMessage(payload.notification?.title||'Notification received'));setMessage('Push notifications enabled on this device.')}catch(error){setMessage(error.message)}}
  async function submit(event){event.preventDefault();setSending(true);setMessage('');try{const values=Object.fromEntries(new FormData(event.currentTarget));const result=await post('/api/notifications/send',values);setMessage(`Sent to ${result.recipients} registered device${result.recipients===1?'':'s'}.`);event.currentTarget.reset()}catch(error){setMessage(error.message)}finally{setSending(false)}}
  return <section className="content"><div className="headline"><div><p>COMMUNICATIONS</p><h1>Notifications</h1><small>Send Firebase push notifications and manage customer communication.</small></div><button className="outline" onClick={activate}><Smartphone size={17}/> Enable on this device</button></div>
    <div className="notification-grid"><form className="card admin-form" onSubmit={submit}><div className="section-title"><span className="feature-icon blue"><Send size={19}/></span><div><h2>Compose notification</h2><p>Delivered through Firebase Cloud Messaging and recorded in history.</p></div></div><label>Audience<select name="audience"><option value="all">Everyone</option><option value="customers">Customers</option><option value="technicians">Technicians</option><option value="admins">Admin team</option></select></label><label>Template<select onChange={event=>{const template=templates[event.target.value];if(template){event.currentTarget.form.title.value=template[0];event.currentTarget.form.body.value=template[1]}}}><option value="">Custom message</option>{templates.map((item,index)=><option value={index} key={item[0]}>{item[0]}</option>)}</select></label><label>Title<input name="title" required maxLength="160"/></label><label>Message<textarea name="body" required rows="5" maxLength="1000"/></label><button className="primary" disabled={sending}><Bell size={17}/>{sending?'Sending…':'Send push notification'}</button>{message&&<p className="form-message">{message}</p>}</form>
    <aside className="card delivery-panel"><h2>Delivery status</h2><div className={`config-state ${status&&firebaseConfigured?'ready':'warning'}`}><CheckCircle2 size={22}/><div><b>{status&&firebaseConfigured?'Firebase is ready':'Configuration required'}</b><small>Client: {firebaseConfigured?'configured':'missing values'} · Server: {status?'configured':'missing service account'}</small></div></div><h3>Recent notifications</h3>{history.length?history.map(item=><div className="history-item" key={item.id}><Bell size={16}/><div><b>{item.title}</b><small>{item.email} · {new Date(item.createdAt).toLocaleString('en-IN')}</small></div></div>):<p className="empty-copy">No notifications have been sent yet.</p>}</aside></div>
  </section>
}
