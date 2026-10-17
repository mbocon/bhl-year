// Shell layout contract: the parts of index.html and styles.css that phone spacing depends on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const css = readFileSync(resolve(root, 'styles.css'), 'utf8');
const rule = sel => {
  const m = css.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}'));
  assert.ok(m, `rule ${sel} exists`);
  return m[1];
};

test('status bar is opaque: iOS 26 strands a dead band at the bottom of translucent home-screen apps', () => {
  assert.match(html, /name="apple-mobile-web-app-status-bar-style"\s+content="default"/);
});

test('main clears the top and side safe areas', () => {
  const r = rule('main');
  assert.match(r, /env\(safe-area-inset-top/);
  assert.match(r, /env\(safe-area-inset-left/);
});

test('tab labels are centered in a touch-height bar padded for the home indicator', () => {
  assert.match(rule('.tabs'), /env\(safe-area-inset-bottom/);
  const a = rule('.tabs a');
  assert.match(a, /align-items:\s*center/);
  assert.match(a, /justify-content:\s*center/);
  assert.match(a, /min-height:\s*4[4-8]px/);
});

test('collapsed block keeps its title and truncates the key figure instead', () => {
  assert.match(rule('.collapsed .name'), /flex:\s*0 1 auto/);
  assert.match(rule('.fig'), /flex:\s*1 1 0/);
  assert.match(rule('.fig'), /text-align:\s*right/);
});

test('Today header uses the progress bar as its only divider', () => {
  assert.match(css, /\.hdr:has\(\.bar\)\s*\{[^}]*border-bottom:\s*none/);
});
