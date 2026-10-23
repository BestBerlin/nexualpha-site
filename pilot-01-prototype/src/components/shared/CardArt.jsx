import React from "react";
import { BRAND_TILE_SLUGS, BrandMark } from "../brand/BrandMark.jsx";
import { brandsBySlug } from "../../content/brand-manifest";

// Shared with the deferred home cards; no dependency on the home module or entry.
const nameOf = (slug) => brandsBySlug[slug]?.name || slug;
const CAT_ART = {
  "exchange-update": { hue: 168, glyph: "bell" }, comparison: { hue: 205, glyph: "scale" }, guide: { hue: 140, glyph: "path" },
  research: { hue: 255, glyph: "chart" }, regulation: { hue: 38, glyph: "shield" }, rwa: { hue: 22, glyph: "stock" },
};
const EXCHANGE_LED = new Set(["exchange-update", "comparison", "guide"]);
const CAT_GLYPHS = {
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" />,
  scale: <path d="M12 4v16M5 20h14M4 9h16M7 9l-3 6a3 3 0 0 0 6 0zM17 9l-3 6a3 3 0 0 0 6 0z" />,
  path: <path d="M5 19c3-6 11-2 14-8M17 5h2v2M5 19h.01M9 14h.01M15 10h.01" />,
  chart: <path d="M4 20h16M6 16l4-5 3 3 5-7M15 7h3v3" />,
  shield: <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6zM9 12l2 2 4-4" />,
  stock: <path d="M4 18h16M6 15V9M10 15V6M14 15v-4M18 15V8" />,
};
const seedOf = (text) => [...String(text)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
// Venue names that are also everyday words ("bullish", "curve", "drift"...) only count from relatedVenues, not the slug.
const WORD_VENUES = new Set(["aster", "balancer", "bullish", "camelot", "curve", "drift", "jupiter", "raydium", "sushi", "vertex"]);
function cardVenues(item) {
  const words = `-${String(item.href || "").split("/").pop()}-`;
  const at = (v) => { const i = words.indexOf(`-${v}-`); return i >= 0 ? i : v === "gate-io" ? words.indexOf("-gate-") : -1; };
  const named = [...BRAND_TILE_SLUGS].filter((v) => !WORD_VENUES.has(v)).map((v) => [v, at(v)]).filter(([, i]) => i >= 0)
    .sort((a, b) => a[1] - b[1]).map(([v]) => v);
  if (named.length) return named.slice(0, 2);
  const related = (Array.isArray(item.venues) ? item.venues : []).filter((v) => BRAND_TILE_SLUGS.has(v));
  return EXCHANGE_LED.has(item.categoryKey) ? related.slice(0, 1) : [];
}
export default function CardArt({ item, priority = false }) {
  const art = CAT_ART[item.categoryKey] || CAT_ART.research;
  const seed = seedOf(item.href);
  const venues = cardVenues(item);
  return <span className="h7-lt-img" aria-hidden="true" data-cat={item.categoryKey || "research"}
    style={{ "--h": art.hue, "--gx": `${20 + (seed % 60)}%`, "--gy": `${10 + ((seed >> 4) % 50)}%`, "--ga": `${100 + (seed % 70)}deg` }}>
    <span className="h7-lt-art">
      {venues.length
        ? <span className="h7-lt-logos" data-n={venues.length}>{venues.map((v) => <BrandMark key={v} slug={v} priority={priority} />)}</span>
        : <svg className="h7-lt-glyph" viewBox="0 0 24 24">{CAT_GLYPHS[art.glyph]}</svg>}
    </span>
    {venues.length ? <span className="h7-lt-tag">{venues.map(nameOf).join(" × ")}</span> : null}
  </span>;
}
