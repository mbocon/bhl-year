import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backupFilename, shareOrDownload } from '../js/backup.js';

test('filename', () => assert.equal(backupFilename(47), 'bhl-backup-day47.json'));
test('shareOrDownload falls through to clipboard when share and download unavailable', async () => {
  const writes = [];
  const r = await shareOrDownload('x', 'f.json', { clipboard: { writeText: async t => writes.push(t) } }, { document: null });
  assert.equal(r, 'copied');
  assert.deepEqual(writes, ['x']);
});
test('shareOrDownload uses share when the navigator can share files', async () => {
  const shared = [];
  const nav = { canShare: () => true, share: async d => shared.push(d) };
  const r = await shareOrDownload('x', 'f.json', nav, { document: null, FileCtor: class { constructor(parts, name) { this.name = name; } } });
  assert.equal(r, 'shared');
  assert.equal(shared[0].files[0].name, 'f.json');
});
test('shareOrDownload throws when nothing is available', async () => {
  await assert.rejects(() => shareOrDownload('x', 'f.json', {}, { document: null }));
});
