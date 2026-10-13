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

// Extend feed aliases here when a publisher adds another transport.
export const OUTLET_IDENTITIES = {
  wublockchain: {
    sourceIds: ['rsshub-telegram-wublockchainenglish', 'wublockchain-preview'],
    hosts: ['wublockchain.com'],
    telegramAccounts: ['wublockchainenglish'],
  },
};

export function publisherIdentity(row, identities = OUTLET_IDENTITIES) {
  const sourceId = String(row.source_id ?? row.sourceId ?? '').toLowerCase();
  let url;
  try { url = new URL(row.url); } catch { /* Registry identity still applies. */ }
  const host = url?.hostname.toLowerCase().replace(/^www\./, '');
  const account = host === 't.me' ? url.pathname.replace(/^\/s\//, '/').split('/')[1]?.toLowerCase() : null;
  for (const [outlet, aliases] of Object.entries(identities)) {
    if (aliases.sourceIds?.includes(sourceId) || aliases.hosts?.includes(host)
      || (account && aliases.telegramAccounts?.includes(account))) return `outlet:${outlet}`;
  }
  // Distinct Telegram publishers must not collapse to the shared t.me host.
  if (account) return `telegram:${account}`;
  return host ?? (sourceId || row.author_account || row.authorAccount || row.source_name || row.sourceName || null);
}

export function independentEvidenceRows(rows = []) {
  const origins = new Set(), publishers = new Set();
  return rows.filter(row => {
    if (row.is_independent === false || isMirrorEvidence(row)) return false;
    const origin = row.origin_key ?? row.originKey;
    const publisher = publisherIdentity(row);
    if ((!origin && !publisher) || (origin && origins.has(origin)) || (publisher && publishers.has(publisher))) return false;
    if (origin) origins.add(origin);
    if (publisher) publishers.add(publisher);
    return true;
  });
}
