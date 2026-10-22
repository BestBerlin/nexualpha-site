import { brandsBySlug } from "../../content/brand-manifest";
import { useEffect, useState } from "react";

// Normalised tiles (de-AI pass 2026-10-18, scripts/build-brand-tiles.py): every mark is a full-bleed 64/128 px square
// built from its manifest-recorded official asset, so one CSS tile (same radius, hairline, size per context) shows
// every exchange at the same optical size. Venues without a tile keep the manifest asset below.
export const BRAND_TILE_SLUGS = Object.freeze(new Set(["aerodrome", "aster", "backpack", "balancer", "binance", "bingx", "bitfinex", "bitget", "bithumb", "bitstamp", "btse", "bullish", "bybit", "camelot", "coinbase", "coinex", "coinw", "crypto-com", "curve", "deepcoin", "deribit", "drift", "dydx", "gate-io", "gemini", "gmx", "hashkey", "htx", "hyperliquid", "jupiter", "kraken", "kucoin", "lbank", "mexc", "okx", "pancakeswap", "phemex", "raydium", "sushi", "uniswap", "upbit", "vertex", "weex", "whitebit"]));

// 64/128 px WebP squares (356-2,186 B) for the most-shown venues; the manifest asset stays the src fallback.
const optimizedBrandSquares = Object.freeze({
  binance: { srcSet: "/brands/binance/icon-64.webp 64w, /brands/binance/icon-128.webp 128w" },
  okx: { srcSet: "/brands/okx/icon-64.webp 64w, /brands/okx/icon-128.webp 128w" },
  bybit: { srcSet: "/brands/bybit/icon-64.webp 64w, /brands/bybit/icon-128.webp 128w" },
  mexc: { srcSet: "/brands/mexc/icon-64.webp 64w, /brands/mexc/icon-128.webp 128w" },
  hyperliquid: { srcSet: "/brands/hyperliquid/icon-64.webp 64w, /brands/hyperliquid/icon-128.webp 128w" },
});

export function BrandMark({ slug, compact = false, priority = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [slug]);
  const brand = brandsBySlug[slug];
  const name = brand?.name ?? slug;
  const preferred = brand?.preferredSquare;
  // Use only manifest-recorded assets. Deriving a sibling .webp path caused
  // predictable 404s for brands whose retained asset is PNG/JPEG only.
  const src = preferred;
  const optimized = optimizedBrandSquares[slug];
  const handleError = () => {
    setFailed(true);
  };
  if (BRAND_TILE_SLUGS.has(slug) && !failed) return <img className={`${compact ? "v2-brand v2-brand--compact" : "v2-brand"} v2-brand--tile v2-brand--${slug}`} src={`/brands/tile/${slug}-128.webp`} srcSet={`/brands/tile/${slug}-64.webp 64w, /brands/tile/${slug}-128.webp 128w`} sizes="48px" alt="" aria-hidden="true" width={compact ? 28 : 40} height={compact ? 28 : 40} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" data-brand-slug={slug} data-brand-source={brand?.status} onError={handleError} />;
  if (src && !failed) return <img className={compact ? `v2-brand v2-brand--compact v2-brand--${slug}` : `v2-brand v2-brand--${slug}`} src={src} srcSet={optimized?.srcSet} sizes={optimized ? (compact ? "28px" : "40px") : undefined} alt="" aria-hidden="true" width={compact ? 28 : 40} height={compact ? 28 : 40} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" data-brand-slug={slug} data-brand-source={brand?.status} onError={handleError} />;
  const initials = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
  return <span className={compact ? `v2-brand-fallback v2-brand-fallback--compact v2-brand-fallback--${slug}` : `v2-brand-fallback v2-brand-fallback--${slug}`} aria-hidden="true" data-brand-slug={slug} data-brand-fallback>{initials}</span>;
}
