// Deposit-method badges for the exchange directory rows and the method filter (2026-10-15). Data: the generated
// per-exchange summary of sourced fiat routes (fiat-rails-summary.generated.js); labels: fiat-labels.js. CSS-free JS,
// pinned to its own small chunk (shared-fiat) so the directory and the venue page do not pull each other in.
import React from "react";
import { FIAT_SUMMARY } from "../../data/fiat-rails-summary.generated.js";
import { fiatLabels } from "../../data/fiat-labels.js";

export const FIAT_FILTER_KINDS = Object.freeze(["card", "bank", "p2p", "cryptoCard"]);
export const fiatKindsFor = (slug) => FIAT_SUMMARY[slug]?.k || [];
export const venueHasFiatKind = (slug, kind) => !kind || fiatKindsFor(slug).includes(kind);
export const fiatSummaryFor = (slug) => FIAT_SUMMARY[slug] || null;

export function FiatGlyph({ kind, size = 14 }) {
  const paths = {
    card: <><rect x="1.5" y="3.5" width="13" height="9" rx="1.6" /><path d="M1.5 6.5h13M4 10h3" /></>,
    bank: <><path d="M2 6.2 8 2.8l6 3.4" /><path d="M3.2 6.5v5M6.4 6.5v5M9.6 6.5v5M12.8 6.5v5M2 13h12" /></>,
    p2p: <><path d="M2.5 5.5h9l-2-2M13.5 10.5h-9l2 2" /></>,
    cryptoCard: <><rect x="1.5" y="3.5" width="13" height="9" rx="1.6" /><circle cx="10.6" cy="8" r="2" /><path d="M4 6.2h2.6" /></>,
  };
  return <svg className="nx-fiat-glyph" viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" focusable="false">{paths[kind]}</svg>;
}

/** Small icon badges (title + screen-reader label) for one exchange; nothing when no sourced route exists. */
export function FiatBadges({ slug, locale }) {
  const kinds = FIAT_FILTER_KINDS.filter((kind) => fiatKindsFor(slug).includes(kind));
  if (!kinds.length) return null;
  const l = fiatLabels(locale);
  return <span className="nx-fiat-badges" role="list" aria-label={l.filterLabel}>
    {kinds.map((kind) => <span key={kind} role="listitem" className={`nx-fiat-badge nx-fiat-badge--${kind}`} title={l.method[kind]}>
      <FiatGlyph kind={kind} /><span className="nx-fiat-badge__text">{l.method[kind]}</span>
    </span>)}
  </span>;
}
