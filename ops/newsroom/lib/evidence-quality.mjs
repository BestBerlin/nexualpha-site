export function isOwnMirrorSource(sourceId) {
  const value = String(sourceId ?? '').toLowerCase();
  return value.startsWith('nexualpha-official') || value === 'telegram-nexualphaclub-preview';
}

export function isDiscoveryHint(row) {
  if (isOwnMirrorSource(row?.source_id ?? row?.sourceId)) return true;
  try {
    const url = new URL(row?.url ?? '');
    return url.hostname.toLowerCase() === 't.me' && /^\/(?:s\/)?nexualphaclub(?:\/|$)/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function isMirrorItem(item) {
  return isDiscoveryHint(item);
}

export function isMirrorEvidence(row) {
  return isDiscoveryHint(row);
}

function evidenceIdentity(row) {
  return JSON.stringify([
    row.url ?? '',
    row.kind ?? '',
    row.origin_key ?? row.originKey ?? '',
    row.excerpt ?? '',
    row.author_account ?? row.authorAccount ?? '',
    row.published_at ?? row.publishedAt ?? null,
    row.source_id ?? row.sourceId ?? null,
  ]);
}

export function dedupeEvidenceRows(rows = []) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = evidenceIdentity(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function qualityEvidence(rows = []) {
  return dedupeEvidenceRows(rows).filter(row => !isDiscoveryHint(row));
}
