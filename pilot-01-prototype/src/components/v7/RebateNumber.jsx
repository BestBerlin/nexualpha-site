import { formatPercent } from "../../data/format-percent.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "../../styles/v7/rebate-owner.css";

export function RebateNumber({ locale, venue }) {
  const target = Math.max(0, Math.round((venue?.share || 0) * 100));
  const percentBefore = formatPercent(locale, 1).startsWith("%");
  // Static final value (owner 2026-10-14: the rAF count-up stalled mid-way on Android, e.g. "56").
  const rounded = String(target);
  return (
    <p className="h7-num h7-rebate-figure" data-brand={venue?.slug} data-final-value={target}>
      <span className="h7-sr">{venue?.name ? `${venue.name} ${formatPercent(locale, target)}` : formatPercent(locale, target)}</span>
      <span className="h7-rebate-logo" aria-hidden="true"><BrandMark slug={venue?.slug} compact priority /></span>
      <span className="h7-rebate-value" aria-hidden="true">
        {percentBefore && <span className="h7-rebate-percent">%</span>}
        <span className="h7-rebate-digits">{rounded}</span>
        {!percentBefore && <span className="h7-rebate-percent">%</span>}
      </span>
    </p>
  );
}
