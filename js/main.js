// Wires the store, router, and views. Safe to import in Node (boots only when a document exists).
import { createStore } from './store.js';
import { onRoute, ROUTES } from './ui/router.js';
import { renderToday } from './ui/today.js';

function placeholder(root) { root.textContent = 'Coming soon.'; }

export function createApp(doc) {
  const store = createStore();
  const app = {
    store,
    now: () => Date.now(),
    ui: { peekDay: null, openKey: null },
    route: 'today',
    views: { today: renderToday },
    render() {
      const root = doc.getElementById('view');
      (app.views[app.route] || placeholder)(root, app);
      for (const a of doc.querySelectorAll('.tabs a')) a.classList.toggle('on', a.dataset.route === app.route);
    },
  };
  return app;
}

export function boot(doc = document) {
  const app = createApp(doc);
  onRoute(r => { app.route = ROUTES.includes(r) ? r : 'today'; app.render(); });
  return app;
}

if (typeof document !== 'undefined') boot(document);
