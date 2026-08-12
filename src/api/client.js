const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export async function api(path, options = {}) {
  const token = sessionStorage.getItem('signfix_token');
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body?.error || 'Request failed'), { status: response.status, details: body?.details });
  return body;
}
export const get = (path) => api(path);
export const post = (path, data) => api(path, { method: 'POST', body: JSON.stringify(data) });
export const patch = (path, data) => api(path, { method: 'PATCH', body: JSON.stringify(data) });
export const remove = (path) => api(path, { method: 'DELETE' });
