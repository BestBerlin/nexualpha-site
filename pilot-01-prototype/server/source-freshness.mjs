// Cache refresh intervals are scheduling details; only the source clock describes data age.
export function radarSourceStale(payload, now = Date.now()) {
  const at = Date.parse(payload?.dataUpdatedAt ?? payload?.generatedAt ?? payload?.updatedAt);
  // The collector writes about every 45 s. The refresh TTL is a cache detail, so only data older than 5 minutes (or a failed source) counts as stale.
  const ttl = 5 * 60_000;
  return payload?.stale === true || !Number.isFinite(at) || !Number.isFinite(ttl) || ttl <= 0 || at > now || now - at >= ttl;
}
