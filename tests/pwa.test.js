import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(root, p), 'utf8');

test('manifest is valid and points at existing icons', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.equal(m.name, 'BHL Year');
  assert.equal(m.short_name, 'BHL');
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, './#today');
  assert.ok(m.icons.some(i => i.purpose === 'maskable'));
  for (const i of m.icons) assert.ok(existsSync(resolve(root, i.src)), i.src);
});
test('index.html links manifest and apple touch icon, and registers the service worker', () => {
  const html = read('index.html');
  assert.match(html, /rel="manifest" href="manifest.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon" href="icons\/icon-192.png"/);
  assert.match(read('js/main.js'), /serviceWorker/);
});
test('service worker pre-caches every app file that exists', () => {
  const sw = read('sw.js');
  assert.match(sw, /const VERSION = '/);
  const assets = [...sw.matchAll(/'(\.\/[^']+)'/g)].map(m => m[1]).filter(a => a !== './');
  assert.ok(assets.length >= 15);
  for (const a of assets) assert.ok(existsSync(resolve(root, a)), `sw caches missing file ${a}`);
  const walk = d => readdirSync(resolve(root, d)).flatMap(f => { const p = join(d, f); return statSync(resolve(root, p)).isDirectory() ? walk(p) : [p]; });
  for (const f of walk('js')) assert.ok(assets.includes('./' + f), `sw does not cache ${f}`);
  for (const f of ['index.html', 'styles.css', 'manifest.webmanifest']) assert.ok(assets.includes('./' + f), f);
});
test('total app size stays under 500 KB', () => {
  const files = ['index.html', 'styles.css', 'sw.js', 'manifest.webmanifest'];
  const walk = d => readdirSync(resolve(root, d)).flatMap(f => { const p = join(d, f); return statSync(resolve(root, p)).isDirectory() ? walk(p) : [p]; });
  const total = [...files, ...walk('js'), ...walk('icons')].reduce((a, f) => a + statSync(resolve(root, f)).size, 0);
  assert.ok(total < 500 * 1024, `total ${total}`);
});
