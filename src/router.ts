import { useEffect, useSyncExternalStore } from 'react';
export function routeFromHash(hash: string) { return hash === '#fursona' ? 'about' : hash.startsWith('#/') ? hash.slice(2).replace(/\/$/, '') : ''; }
function subscribe(onChange: () => void) {
  addEventListener('hashchange', onChange);
  return () => removeEventListener('hashchange', onChange);
}
const snapshot = () => routeFromHash(location.hash);
/** Hash URLs work on GitHub Pages without a server rewrite or a custom 404 redirect. */
export function useRoute() {
  // Recheck the URL at subscription time: a hash can change after render but
  // before passive effects subscribe, particularly during mobile startup.
  const route = useSyncExternalStore(subscribe, snapshot);
  useEffect(() => { if (location.hash.startsWith('#/') || location.hash === '#fursona') { scrollTo({ top: 0, behavior: 'instant' }); document.getElementById('main')?.focus({ preventScroll: true }); } }, [route]);
  return route;
}
