// Helpers shared by the home first screen (HomeV7.jsx) and its scroll-loaded lower half (home7-below.jsx).
import { useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { brandsBySlug } from "../../content/brand-manifest";

export const nameOf = (slug) => brandsBySlug[slug]?.name || slug;
export const CHIPS = [10000, 50000, 100000, 500000];
// Volume slider: log scale $10K..$5M, snapped to readable steps.
export const VMIN = 1e4, VMAX = 5e6;
export const toVol = (p) => { const v = VMIN * Math.pow(VMAX / VMIN, p / 1000); const step = v < 1e5 ? 1e3 : v < 1e6 ? 1e4 : 1e5; return Math.round(v / step) * step; };
export const toPos = (v) => Math.round(1000 * Math.log(Math.min(Math.max(v, VMIN), VMAX) / VMIN) / Math.log(VMAX / VMIN));
export const usd = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
export const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Ledger figures roll to their new value (eased); reduced motion and SSR render the final value.
export function Roll({ value, prefix = "", fmt = usd, nudge }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (value == null || from.current == null || reduced()) { from.current = value; setShown(value); return undefined; }
    const a = from.current, b = value, t0 = performance.now(); let raf = 0;
    const f = (n) => { const k = Math.min(1, (n - t0) / 700); const v = a + (b - a) * (1 - Math.pow(1 - k, 4)); setShown(v); if (k < 1) raf = requestAnimationFrame(f); else from.current = b; };
    raf = requestAnimationFrame(f);
    return () => { cancelAnimationFrame(raf); from.current = b; };
  }, [value]);
  // a spring nudge plays when `nudge` changes (e.g. another exchange picked), not on every slider step
  return <span className={nudge == null ? undefined : "h7-roll"} key={nudge ?? "v"}>{shown == null ? "–" : `${prefix}${fmt(shown)}`}</span>;
}

export function Cta({ v, locale, children, className, placement }) {
  if (v.open) {
    return <a className={className} href={v.url} target="_blank" rel="sponsored noopener noreferrer" data-cta-kind="registration" data-cta-platform={v.slug} data-cta-placement={placement} data-cta-code={v.code || undefined}>{children}</a>;
  }
  return <a className={className} href={localizedHref(`/exchanges/${v.slug}#registration-path`, { locale })} data-cta-placement={`${placement}-eligibility`}>{children}</a>;
}
