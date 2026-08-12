import React, { useEffect, useState } from 'react';
import { get, post } from '../../api/client';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
export default function ServiceRequestPage() {
    const [rows, setRows] = useState([]), [message, setMessage] = useState(''), [error, setError] = useState(''); function load() { get('/api/services').then(r => setRows(r.data)).catch(e => setError(e.message)) } useEffect(load, []);
    async function submit(event) {
        event.preventDefault();

        const data = Object.fromEntries(new FormData(event.currentTarget));
        try {
            const result = await post('/api/services', data);
            setMessage(`${result.id}: ${result.message}`);
            event.currentTarget.reset(); load()
        } catch (e) { setError(e.message) }
    } return <><h1>Request Sign Board Service</h1>
        <form className="form-card" onSubmit={submit}>
            <label>Problem category<select name="category">{['LED Problem', 'Electrical Issue', 'Physical Damage', 'Sign Board Repair', 'Replacement', 'Installation', 'Reinstallation', 'Cleaning', 'Maintenance', 'Inspection', 'Emergency', 'Other'].map(x => <option key={x}>{x}</option>)}</select>
            </label>
            <label>Address<input name="address" required /></label>
            <label>Remarks<textarea name="description" minLength="3" required />
            </label>
            <label>Priority<select name="priority"><option value="normal">Normal</option><option value="high">High</option>
                <option value="emergency">Emergency</option>
            </select>
            </label>{error && <div className="auth-error">{error}</div>}{message && <div className="success-state">{message}</div>}<button className="primary">Submit Service Request</button>
        </form>
        <h2>My service requests</h2>
        <DataTable rows={rows} columns={[{ key: 'id', label: 'Ticket' }, { key: 'category', label: 'Problem' }, { key: 'status', label: 'Status', render: v => <StatusBadge>{v}</StatusBadge> }]} /></>
}
