import React from "react";

// The footer research library and venue comparison links use the same paired-logo card.
// Keep this dependency-free so reusing it cannot pull a route graph into another page.
export function ResearchComparisonCard({ href, pair, label }) {
  return <a className="research-library__card research-library__card--compare" href={href}>
    <span className="research-library__pair" aria-hidden="true" dir="ltr">
      <img src={`/brands/tile/${pair[0]}-64.webp`} width="40" height="40" loading="lazy" alt="" />
      <b>vs</b>
      <img src={`/brands/tile/${pair[1]}-64.webp`} width="40" height="40" loading="lazy" alt="" />
    </span>
    <span className="research-library__card-label">{label}</span>
    <span className="research-library__arrow" aria-hidden="true">↗</span>
  </a>;
}
