import { useEffect, useState } from 'react';
export function routeFromHash(hash: string) { return hash === '#fursona' ? 'about' : hash.startsWith('#/') ? hash.slice(2).replace(/\/$/, '') : ''; }
/** Hash URLs work on GitHub Pages without a server rewrite or a custom 404 redirect. */
export function useRoute() {
  const [route, setRoute] = useState(() => routeFromHash(location.hash));
  useEffect(() => { const update = () => setRoute(routeFromHash(location.hash)); addEventListener('hashchange', update); return () => removeEventListener('hashchange', update); }, []);
  useEffect(() => { if (location.hash.startsWith('#/') || location.hash === '#fursona') { scrollTo({ top: 0, behavior: 'instant' }); document.getElementById('main')?.focus({ preventScroll: true }); } }, [route]);
  return route;
}
