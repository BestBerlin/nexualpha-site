// Entry-safe route parsing; the register data stays in the lazy page chunk.
export function parseLicensesPath(pathname) {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  if (path === '/licenses') return { kind: 'hub' };
  const match = path.match(/^\/licenses\/([a-z][a-z-]{1,40})$/);
  if (match) return { kind: 'country', country: match[1] };
  return path.startsWith('/licenses/') ? { kind: 'missing' } : null;
}
