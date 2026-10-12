function updateIdentity(item) {
  return String(item?.id || item?.url || item?.officialSource?.url || '');
}
function updateHash(value) {
  let n = 2166136261;
  for (const c of String(value)) { n ^= c.charCodeAt(0); n = Math.imul(n, 16777619); }
  return (n >>> 0).toString(36);
}

export function updatePath(item) {
  const venue = item?.venue || item?.platform?.slug;
  const id = updateIdentity(item);
  const slug = id.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 70) || 'update';
  return `/activities/updates/${encodeURIComponent(venue)}/${slug}-${updateHash(id)}`;
}
