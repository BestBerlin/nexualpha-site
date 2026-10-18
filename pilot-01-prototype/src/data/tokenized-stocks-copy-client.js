// Tokenized-stocks page copy in the browser (2026-10-19): one edition per page instead of all 17.
// - SSR pages ship their edition in the prerender state ("tsPage": { copy, now }) and hydrate from it.
// - After a client-side navigation the edition loads as its own lazy chunk (src/data/tokenized-stocks-copy/<locale>.js).
// - The server render registers every edition up front (entry-server.jsx imports tokenized-stocks-copy.js), so SSR
//   always finds its copy synchronously. This module never imports the 17-locale table itself.
import { useEffect, useState } from "react";

const loaders = import.meta.glob("./tokenized-stocks-copy/*.js");
const AVAILABLE = new Map(Object.keys(loaders).map((key) => [key.replace(/^.*\/|\.js$/g, ""), key]));
const cache = new Map();

/** The edition a locale reads (exact, else zh-* -> zh-Hans, else en), lower-cased file key. */
export function tsCopyKey(locale) {
  const raw = String(locale || "en").toLowerCase();
  if (AVAILABLE.has(raw)) return raw;
  if (raw.startsWith("zh")) return "zh-hans";
  return "en";
}

/** Remember editions (server: all of them; browser: the one in the prerender state). */
export function rememberTsCopy(...copies) {
  for (const copy of copies.flat()) if (copy && copy.locale) cache.set(String(copy.locale).toLowerCase(), copy);
}
export const cachedTsCopy = (locale) => cache.get(tsCopyKey(locale)) || null;

export async function loadTsCopy(locale) {
  const key = tsCopyKey(locale);
  if (cache.has(key)) return cache.get(key);
  const load = loaders[AVAILABLE.get(key) || AVAILABLE.get("en")];
  if (!load) return null;
  const mod = await load();
  rememberTsCopy(mod.TS_COPY_LOCALE);
  return mod.TS_COPY_LOCALE;
}

/** The page's copy: the prerender-state edition, the cache, or (client navigation) the lazy chunk; null while loading. */
export function useTsCopy(locale, initial) {
  const key = tsCopyKey(locale);
  const matches = initial?.locale && String(initial.locale).toLowerCase() === key;
  // Only the browser caches the state edition: on the server the cache holds every full edition, shared by all requests
  // (a Türkiye page's trimmed edition must never replace it).
  if (matches && typeof document !== "undefined") rememberTsCopy(initial);
  const [, setLoaded] = useState(0);
  const copy = matches ? initial : cachedTsCopy(locale);
  useEffect(() => {
    if (copy) return undefined;
    let live = true;
    loadTsCopy(locale).then(() => { if (live) setLoaded((n) => n + 1); }).catch(() => {});
    return () => { live = false; };
  }, [key, copy]);
  return copy;
}
