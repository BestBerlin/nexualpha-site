// Route-local visual vocabulary: no facts, navigation or home-entry dependencies.
import React from "react";
const PATHS = {
  identity: <><rect x="4" y="5" width="16" height="14" rx="3" /><circle cx="9" cy="11" r="2" /><path d="M6 16c0-3 6-3 6 0M15 10h3M15 14h3" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z" /></>,
  products: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  shield: <><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6Z" /><path d="m8 12 3 3 5-6" /></>,
  fees: <><path d="M4 20h16M6 16V9M12 16V4M18 16v-6" /></>,
  source: <><path d="M6 3h9l4 4v14H6ZM15 3v5h4M9 12h7M9 16h5" /></>,
  app: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 6h4M11 18h2" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 17h.01" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
};

export function VenueVisualIcon({ kind = "source", className = "" }) {
  return <span className={`vx-icon ${className}`.trim()} aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">{PATHS[kind] || PATHS.source}</svg></span>;
}

export function venueFactIcon(id) {
  if (id.startsWith("license-") || id === "proof-of-reserves") return "shield";
  if (id.includes("fees")) return "fees";
  if (id.includes("kyc")) return "identity";
  if (id.includes("product")) return "products";
  if (id === "apps") return "app";
  return "source";
}
