import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('ui modules import without a DOM', async () => {
  for (const m of ['../js/ui/dom.js', '../js/ui/router.js', '../js/ui/today.js', '../js/main.js']) {
    const mod = await import(m);
    assert.ok(mod, m);
  }
});
test('index.html references only files that exist', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)].map(m => m[1]).filter(r => !/^(https?:)?\/\//.test(r));
  assert.ok(refs.includes('styles.css'));
  assert.ok(refs.includes('js/main.js'));
  for (const r of refs) assert.ok(existsSync(resolve(root, r)), `missing ${r}`);
});
