// One shared 30-second snapshot per locale. Dedicated data endpoints stay intact.
export function createLiveFeed({ readers, now = Date.now, ttlMs = 30_000 } = {}) {
  const snapshots = new Map();
  return async (locale = 'en') => {
    const current = snapshots.get(locale);
    if (current && now() - current.at < ttlMs) return current.pending;
    const pending = Promise.all(Object.entries(readers).map(async ([name, read]) => {
      try { return [name, await read(locale)]; } catch { return [name, null]; }
    })).then((entries) => ({ generatedAt: new Date(now()).toISOString(), ...Object.fromEntries(entries) }));
    snapshots.set(locale, { at: now(), pending });
    // Locale is validated at the HTTP boundary; cap defensively for direct callers.
    while (snapshots.size > 20) snapshots.delete(snapshots.keys().next().value);
    return pending;
  };
}
