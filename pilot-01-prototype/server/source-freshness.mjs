// Cache refresh intervals are scheduling details; only the source clock describes data age.
export function radarSourceStale(payload, now = Date.now()) {
  const at = Date.parse(payload?.dataUpdatedAt ?? payload?.generatedAt ?? payload?.updatedAt);
  const ttl = Number(payload?.ttlSeconds ?? 60) * 1000;
  return payload?.stale === true || !Number.isFinite(at) || !Number.isFinite(ttl) || ttl <= 0 || at > now || now - at >= Math.min(ttl, 60_000);
}
