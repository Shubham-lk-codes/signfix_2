import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3, MapPin, Plus, Power, Search, Trash2, X } from 'lucide-react';
import { get, patch, post, remove } from '../../api/client';
import LoadingState from '../../components/ui/LoadingState';

const blank = { name:'', state:'', country:'India', latitude:'', longitude:'', radiusKm:25, active:true };

export default function ServiceAreasPage() {
  const [areas,setAreas]=useState([]), [loading,setLoading]=useState(true), [saving,setSaving]=useState(false);
  const [error,setError]=useState(''), [notice,setNotice]=useState(''), [search,setSearch]=useState('');
  const [form,setForm]=useState(null);

  async function load(){setLoading(true);try{const result=await get('/api/admin/service-areas');setAreas(result.data||[]);setError('')}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{load()},[]);
  const filtered=useMemo(()=>{const term=search.trim().toLowerCase();return !term?areas:areas.filter(area=>[area.name,area.state,area.country].some(value=>String(value||'').toLowerCase().includes(term)))},[areas,search]);
  const activeCount=areas.filter(area=>area.active).length;
  function open(area=blank){setError('');setNotice('');setForm({...area});}
  function change(event){const {name,value,type,checked}=event.target;setForm(current=>({...current,[name]:type==='checkbox'?checked:value}));}
  async function save(event){event.preventDefault();setSaving(true);setError('');try{const payload={...form,latitude:Number(form.latitude),longitude:Number(form.longitude),radiusKm:Number(form.radiusKm),active:Boolean(form.active)};form.id?await patch(`/api/admin/service-areas/${form.id}`,payload):await post('/api/admin/service-areas',payload);setForm(null);setNotice(form.id?'Service area updated successfully.':'Service area added successfully.');await load()}catch(e){setError(e.message)}finally{setSaving(false)}}
  async function toggle(area){setError('');try{await patch(`/api/admin/service-areas/${area.id}`,{active:!area.active});setNotice(`${area.name} is now ${area.active?'inactive':'active'}.`);await load()}catch(e){setError(e.message)}}
  async function destroy(area){if(!window.confirm(`Delete ${area.name} from service areas?`))return;setError('');try{await remove(`/api/admin/service-areas/${area.id}`);setNotice(`${area.name} was deleted.`);await load()}catch(e){setError(e.message)}}

  return <section className="content service-area-page">
    <div className="headline service-area-head"><div><p>OPERATIONS · COVERAGE</p><h1>Service areas</h1><small>Control where customers and technicians can access SignFix services.</small></div><button className="primary" onClick={()=>open()}><Plus size={17}/>Add service area</button></div>
    <div className="area-summary">
      <article><span className="area-summary-icon blue"><MapPin size={20}/></span><div><small>Configured cities</small><b>{areas.length}</b></div></article>
      <article><span className="area-summary-icon green"><CheckCircle2 size={20}/></span><div><small>Active coverage</small><b>{activeCount}</b></div></article>
      <article className="coverage-note"><div><small>How access is checked</small><b>GPS coordinates are validated against each city's configured service radius.</b></div></article>
    </div>
    {error&&<div className="area-alert error">{error}</div>}{notice&&<div className="area-alert success">{notice}</div>}
    <article className="area-panel">
      <div className="area-panel-head"><div><h2>Allowed cities</h2><p>Enable or pause service availability without deleting a city.</p></div><label className="area-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search city, state or country"/></label></div>
      {loading?<LoadingState label="Loading service areas…"/>:<div className="area-table-wrap"><table className="area-table"><thead><tr><th>Service area</th><th>Coordinates</th><th>Coverage radius</th><th>Status</th><th aria-label="Actions"/></tr></thead><tbody>{filtered.map(area=><tr key={area.id}><td><div className="city-cell"><span><MapPin size={17}/></span><div><b>{area.name}</b><small>{[area.state,area.country].filter(Boolean).join(', ')}</small></div></div></td><td><b className="coordinate">{Number(area.latitude).toFixed(5)}, {Number(area.longitude).toFixed(5)}</b></td><td><span className="radius-pill">{area.radiusKm} km</span></td><td><button className={`area-status ${area.active?'active':'inactive'}`} onClick={()=>toggle(area)}><i/>{area.active?'Active':'Inactive'}</button></td><td><div className="area-actions"><button title="Edit service area" onClick={()=>open(area)}><Edit3 size={16}/></button><button className="delete" title="Delete service area" onClick={()=>destroy(area)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{!filtered.length&&<div className="area-empty"><span><MapPin size={25}/></span><h3>{search?'No matching service areas':'No service areas configured'}</h3><p>{search?'Try a different city, state or country.':'Add your first city to enable location-based access.'}</p>{!search&&<button className="primary" onClick={()=>open()}><Plus size={16}/>Add service area</button>}</div>}</div>}
    </article>
    {form&&<div className="area-modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setForm(null)}><div className="area-modal" role="dialog" aria-modal="true" aria-labelledby="area-form-title"><div className="area-modal-head"><div><span><MapPin size={19}/></span><div><h2 id="area-form-title">{form.id?'Edit service area':'Add service area'}</h2><p>Set the city center and maximum coverage distance.</p></div></div><button onClick={()=>setForm(null)} aria-label="Close"><X size={20}/></button></div><form onSubmit={save}><div className="area-form-grid"><label className="wide">City name<input name="name" value={form.name} onChange={change} placeholder="e.g. New Delhi" required minLength="2"/></label><label>State<input name="state" value={form.state||''} onChange={change} placeholder="e.g. Delhi"/></label><label>Country<input name="country" value={form.country} onChange={change} required/></label><label>Center latitude<input name="latitude" type="number" step="any" min="-90" max="90" value={form.latitude} onChange={change} placeholder="28.6139" required/><small>Between −90 and 90</small></label><label>Center longitude<input name="longitude" type="number" step="any" min="-180" max="180" value={form.longitude} onChange={change} placeholder="77.2090" required/><small>Between −180 and 180</small></label><label className="wide">Service radius (kilometres)<div className="radius-input"><input name="radiusKm" type="number" step="0.1" min="0.1" max="500" value={form.radiusKm} onChange={change} required/><span>km</span></div><small>Customers and technicians inside this radius will be allowed access.</small></label><label className="area-switch wide"><input name="active" type="checkbox" checked={Boolean(form.active)} onChange={change}/><span/><div><b>Active service area</b><small>Allow mobile access within this city immediately.</small></div></label></div><div className="area-modal-actions"><button type="button" className="outline" onClick={()=>setForm(null)}>Cancel</button><button className="primary" disabled={saving}>{saving?'Saving…':form.id?'Save changes':'Add service area'}</button></div></form></div></div>}
  </section>;
}
