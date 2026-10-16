// Minimal fake DOM, enough for js/ui/*.js to render and be driven in Node. Test-only.
class FNode { constructor() { this.children = []; this.parent = null; } append(...c) { for (const x of c) { x.parent = this; this.children.push(x); } } appendChild(c) { this.append(c); return c; } removeChild(c) { this.children = this.children.filter(x => x !== c); return c; } get firstChild() { return this.children[0] || null; } remove() { this.parent?.removeChild(this); } }
class FText extends FNode { constructor(t) { super(); this.nodeType = 3; this.data = t; } }
class FEl extends FNode {
  constructor(tag) {
    super(); this.nodeType = 1; this.tagName = tag.toUpperCase(); this.attrs = {}; this.listeners = {}; this.style = {}; this.dataset = {}; this._cls = new Set(); this.value = ''; this.files = null;
    this.classList = { toggle: (c, on) => { on ? this._cls.add(c) : this._cls.delete(c); }, add: c => this._cls.add(c), contains: c => this._cls.has(c) };
  }
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } get className() { return [...this._cls].join(' '); }
  set textContent(v) { this.children = v === '' ? [] : [new FText(String(v))]; } get textContent() { return this.children.map(c => c.nodeType === 3 ? c.data : c.textContent).join(''); }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k.startsWith('data-')) this.dataset[k.slice(5)] = String(v); }
  addEventListener(t, f) { (this.listeners[t] ??= []).push(f); }
  click() { for (const f of this.listeners.click || []) f({ target: this, preventDefault() {}, stopPropagation() {} }); }
  input(v) { this.value = v; for (const f of this.listeners.input || []) f({ target: this, preventDefault() {}, stopPropagation() {} }); }
  change(v) { this.value = v; for (const f of this.listeners.change || []) f({ target: this, preventDefault() {}, stopPropagation() {} }); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  querySelectorAll(sel) {
    const out = []; const parts = sel.split('.'); const tag = parts[0].split(' ').pop(); const classes = parts.slice(1);
    const walk = n => { for (const c of n.children) { if (c.nodeType === 1) { const ok = (!tag || c.tagName === tag.toUpperCase()) && classes.every(k => c._cls.has(k)); if (ok) out.push(c); walk(c); } } };
    walk(this); return out;
  }
  scrollIntoView() {}
}

export function installFakeDom() {
  const view = new FEl('main'); view.attrs.id = 'view';
  const nav = new FEl('nav');
  for (const r of ['today', 'days', 'scorecard', 'settings']) { const a = new FEl('a'); a.dataset.route = r; nav.append(a); }
  const body = new FEl('body'); body.append(view, nav);
  const document = { createElement: t => new FEl(t), createTextNode: t => new FText(t), getElementById: id => (id === 'view' ? view : null), querySelectorAll: s => nav.querySelectorAll(s), body };
  globalThis.__BHL_TEST__ = true;
  globalThis.document = document;
  globalThis.addEventListener = () => {};
  globalThis.window = { scrollTo() {}, addEventListener() {} };
  globalThis.location = { hash: '#today' };
  globalThis.confirm = () => true;
  const mem = new Map();
  globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: k => mem.delete(k) };
  const findAll = sel => view.querySelectorAll(sel);
  const text = el => el ? el.textContent : '';
  return { document, view, findAll, text, mem };
}
