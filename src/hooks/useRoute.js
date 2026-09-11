import { useEffect, useState } from 'react';

export default function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const listener = () => setPath(window.location.pathname);
    window.addEventListener('popstate', listener);
    return () => window.removeEventListener('popstate', listener);
  }, []);

  const navigate = (next) => {
    if (typeof next !== 'string') return;
    if (next.startsWith('http://') || next.startsWith('https://')) {
      window.location.href = next;
      return;
    }

    const currentPath = window.location.pathname;
    let target = next;

    if (currentPath.startsWith('/admin') && !next.startsWith('/admin') && !next.startsWith('/asset/scan')) {
      target = `/admin${next === '/' ? '' : next}`;
    }

    window.history.pushState({}, '', target);
    setPath(window.location.pathname);
    window.scrollTo(0, 0);
  };

  return { path, navigate };
}
