// Hash router for the four tabs.
export const ROUTES = ['today', 'days', 'scorecard', 'settings'];
export function currentRoute() {
  const r = (globalThis.location?.hash || '#today').slice(1).split('?')[0];
  return ROUTES.includes(r) ? r : 'today';
}
export function onRoute(cb) {
  globalThis.addEventListener('hashchange', () => cb(currentRoute()));
  cb(currentRoute());
}
export function go(route) { globalThis.location.hash = '#' + route; }
