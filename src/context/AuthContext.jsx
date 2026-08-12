import React, { createContext, useContext, useEffect, useState } from 'react';
import { get, post } from '../api/client';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!sessionStorage.getItem('signfix_token')) { setLoading(false); return; }
    get('/api/auth/me').then(({ user }) => setUser(user)).catch(() => sessionStorage.removeItem('signfix_token')).finally(() => setLoading(false));
  }, []);
  async function login(credentials) { const result = await post('/api/auth/login', credentials); sessionStorage.setItem('signfix_token', result.token); setUser(result.user); return result.user; }
  function logout() { sessionStorage.removeItem('signfix_token'); setUser(null); }
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
