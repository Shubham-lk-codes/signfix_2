import { useEffect, useState } from 'react';

const adminBase = '/admin';
function appPath() {
  const pathname = window.location.pathname;
  if (pathname === adminBase || pathname === `${adminBase}/`) return '/';
  return pathname.startsWith(`${adminBase}/`) ? pathname.slice(adminBase.length) : pathname;
}

export default function useRoute() {
  const [path, setPath] = useState(appPath);
  useEffect(() => {
    const listener = () => setPath(appPath());
    addEventListener('popstate', listener);
    return () => removeEventListener('popstate', listener);
  }, []);
  const navigate = (next) => {
    const target = window.location.pathname.startsWith(adminBase) ? `${adminBase}${next === '/' ? '' : next}` : next;
    history.pushState({}, '', target);
    setPath(next);
  };
  return { path, navigate };
}
