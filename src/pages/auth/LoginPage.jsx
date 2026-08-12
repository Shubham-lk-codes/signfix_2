import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import signFixLogo from '../../../branding/signfix-logo.svg';

const accounts = {
  admin: 'admin@signfix.in',
  customer: 'customer@signfix.in',
  technician: 'tech@signfix.in',
};

export default function LoginPage({ navigate }) {
  const { login } = useAuth();
  const [portal, setPortal] = useState('admin');
  const [email, setEmail] = useState(accounts.admin);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function selectPortal(value) {
    setPortal(value);
    setEmail(accounts[value]);
    setPassword('');
    setError('');
  }

  function useDemoCredentials() {
    setEmail(accounts[portal]);
    setPassword('SignFix@123');
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login({ email: email.trim(), password, portal });
      navigate(user.role === 'customer' ? '/customer' : user.role === 'technician' ? '/technician' : '/');
    } catch (requestError) {
      setError(requestError.status === 401
        ? 'Invalid email or password. Demo password is SignFix@123 (without a period).'
        : requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-page">
    <form className="auth-card" onSubmit={submit}>
      <img src={signFixLogo} alt="SignFix" />
      <h1>Welcome to SignFix</h1>
      <p>Sales, service and maintenance platform</p>
      <div className="portal-tabs">{Object.keys(accounts).map((value) =>
        <button type="button" className={portal === value ? 'active' : ''} onClick={() => selectPortal(value)} key={value}>{value}</button>)}</div>
      <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" required autoComplete="username" /></label>
      <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} name="password" type="password" required autoComplete="current-password" /></label>
      <button className="demo-login" type="button" onClick={useDemoCredentials}>Use {portal} demo credentials</button>
      {error && <div className="auth-error">{error}</div>}
      <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <small>Demo password: <code>SignFix@123</code></small>
    </form>
  </div>;
}
