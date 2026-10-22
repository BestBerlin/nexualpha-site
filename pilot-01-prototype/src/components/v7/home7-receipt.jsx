import { heroMoneyText, heroVolumeText } from "./home7-hero-volume.js";
import { formatPercent } from "../../data/format-percent.js";
import { BrandMark } from "../brand/BrandMark.jsx";

// Deliberately limited to the two reviewed source locales. Other locales keep their existing steps.
export const RECEIPT_COPY = {
  "zh-Hans": { volume: "成交", fee: "手续费", back: "返还", net: "实付", kept: "交易所留存", action: "通过邀请链接，在交易所自己的网站注册。" },
  en: { volume: "Traded", fee: "Fees", back: "Returned", net: "Paid", kept: "Exchange keeps", action: "Use the invite link to register on the exchange's own site." },
};
export function receiptAmounts(volume, fee, rebate) {
  if (fee?.state !== "checked" || !Number.isFinite(fee.taker) || !Number.isFinite(rebate)) return null;
  const gross = volume * fee.taker / 100;
  return [gross, rebate, gross - rebate];
}

// Step glyphs (24px, stroke = currentColor). The fee step shows the exchange's own tile instead.
const ICONS = [
  <svg key="trade" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18l5-6 4 3 6-8" /><path d="M15 7h4v4" /></svg>,
  null,
  <svg key="back" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4v4h-4" /><path d="M9.5 14.5c.4.9 1.3 1.5 2.5 1.5 1.5 0 2.5-.8 2.5-2s-1-1.7-2.5-2-2.5-.8-2.5-2 1-2 2.5-2c1.2 0 2.1.6 2.5 1.5M12 6.5v1M12 16v1" /></svg>,
  <svg key="net" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><path d="M16 14.5h2" /></svg>,
];

/**
 * "Where the fee goes" (owner 2026-10-23: the receipt was four bare figures). The same four reviewed entries, drawn as a
 * flow: traded volume -> fee paid to the exchange -> the share the exchange returns -> what the trader really paid. A
 * coin travels each rail in turn (transform-only CSS; paused off screen, static under reduced motion) and the split bar
 * under the flow shows the returned share of the fee. Numbers: hero volume x checked perpetual taker fee x disclosed share.
 */
export function FeeReceipt({ locale, venue, volume, fee, rebate, payout }) {
  const c = RECEIPT_COPY[locale];
  const amounts = receiptAmounts(volume, fee, rebate);
  if (!c || !amounts) return null;
  const entries = [[c.volume, heroVolumeText(volume, locale)], ...[c.fee, c.back, c.net].map((label, i) => [label, heroMoneyText(amounts[i], locale)])];
  const share = amounts[0] > 0 ? Math.max(0, Math.min(1, amounts[1] / amounts[0])) : 0;
  const sharePct = formatPercent(locale, Math.round(share * 100));
  const keptPct = formatPercent(locale, 100 - Math.round(share * 100));
  return <div className="h7-receipt" data-venue={venue.slug} style={{ "--share": share }}>
    <p className="h7-receipt-venue"><BrandMark slug={venue.slug} compact />{venue.name}</p>
    <ol className="h7-receipt-row">{entries.map(([label, value], i) => <li key={label}>
      <span className="h7-flow-ic" aria-hidden="true">{ICONS[i] || <BrandMark slug={venue.slug} compact />}</span>
      <span className="h7-flow-l">{label}</span>
      <bdi dir="ltr">{value}</bdi>
      {i < 3 ? <span className="h7-flow-rail" aria-hidden="true"><i />{i === 1 ? <b>{sharePct}</b> : null}</span> : null}
    </li>)}</ol>
    <div className="h7-flow-split" aria-hidden="true">
      <span className="h7-flow-bar"><i /></span>
      <span className="h7-flow-legend"><span data-k="back">{c.back} {sharePct}</span><span data-k="kept">{c.kept} {keptPct}</span></span>
    </div>
    <p className="h7-receipt-action">{c.action} {payout}</p>
  </div>;
}
