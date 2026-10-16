// Backup export: share sheet → file download → clipboard, whichever the device supports first.
export const backupFilename = day => `bhl-backup-day${day}.json`;

export async function shareOrDownload(text, filename, nav = globalThis.navigator, env = {}) {
  const doc = env.document === undefined ? globalThis.document : env.document;
  const FileCtor = env.FileCtor || globalThis.File;
  if (nav && typeof nav.share === 'function' && FileCtor) {
    try {
      const file = new FileCtor([text], filename, { type: 'application/json' });
      if (!nav.canShare || nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: filename });
        return 'shared';
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
  }
  if (doc && typeof URL !== 'undefined' && URL.createObjectURL && typeof Blob !== 'undefined') {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = doc.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'downloaded';
  }
  if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
    await nav.clipboard.writeText(text);
    return 'copied';
  }
  throw new Error('No way to save a backup on this device');
}
