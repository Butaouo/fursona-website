import { useEffect, useSyncExternalStore } from 'react';
const legacyRelationships = '#/relationships';
export function routeFromHash(hash: string) {
  if (hash === '#fursona') return 'about';
  if (!hash.startsWith('#/')) return '';
  const route = hash.slice(2).replace(/\/$/, '');
  return route === 'relationships' ? 'world/relationships' : route;
}
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
  useEffect(() => {
    // Replace the alias in place so Back returns to the visitor's previous page.
    const canonicalize = () => {
      if (location.hash === legacyRelationships || location.hash === legacyRelationships + '/') {
        history.replaceState(history.state, '', '#/world/relationships');
      }
    };
    canonicalize();
    addEventListener('hashchange', canonicalize);
    return () => removeEventListener('hashchange', canonicalize);
  }, []);
  useEffect(() => { if (location.hash.startsWith('#/') || location.hash === '#fursona') { scrollTo({ top: 0, behavior: 'instant' }); document.getElementById('main')?.focus({ preventScroll: true }); } }, [route]);
  return route;
}
