import React from "react";
import { STOCK_LOGOS, STOCK_LOGO_NAMES } from "./stock-logo-manifest.js";

/** Local, fixed-size identities; unverified marks retain a labelled monogram. */
export function StockLogo({ ticker, size = 32, loading = "lazy" }) {
  const symbol = String(ticker || "").toUpperCase();
  const logo = STOCK_LOGOS[symbol];
  const style = { width: size, height: size, flexShrink: 0, display: "inline-block", verticalAlign: "middle", borderRadius: "22%", objectFit: "contain" };
  return logo
    ? <img className="stock-logo" src={logo.src} alt={logo.name} width={size} height={size} loading={loading} decoding="async" style={style} />
    : <span className="stock-logo stock-logo--fallback" role="img" aria-label={STOCK_LOGO_NAMES[symbol] || symbol} style={{ ...style, textAlign: "center", lineHeight: `${size}px`, background: "#384152", color: "#fff", fontSize: size / 2 }}>{symbol.slice(0, 1)}</span>;
}
