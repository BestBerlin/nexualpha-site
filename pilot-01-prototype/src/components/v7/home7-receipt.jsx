import { heroMoneyText, heroVolumeText } from "./home7-hero-volume.js";

// Deliberately limited to the two reviewed source locales. Other locales keep their existing steps.
export const RECEIPT_COPY = {
  "zh-Hans": { volume: "成交", fee: "手续费", back: "返还", net: "实付", action: "通过邀请链接，在交易所自己的网站注册。" },
  en: { volume: "Traded", fee: "Fees", back: "Returned", net: "Paid", action: "Use the invite link to register on the exchange's own site." },
};
export function receiptAmounts(volume, fee, rebate) {
  if (fee?.state !== "checked" || !Number.isFinite(fee.taker) || !Number.isFinite(rebate)) return null;
  const gross = volume * fee.taker / 100;
  return [gross, rebate, gross - rebate];
}
export function FeeReceipt({ locale, venue, volume, fee, rebate, payout }) {
  const c = RECEIPT_COPY[locale];
  const amounts = receiptAmounts(volume, fee, rebate);
  if (!c || !amounts) return null;
  const entries = [[c.volume, heroVolumeText(volume, locale)], ...[c.fee, c.back, c.net].map((label, i) => [label, heroMoneyText(amounts[i], locale)])];
  return <div className="h7-receipt" data-venue={venue.slug}>
    <p className="h7-receipt-venue">{venue.name}</p>
    <ol className="h7-receipt-row">{entries.map(([label, value]) => <li key={label}><span>{label}</span><bdi dir="ltr">{value}</bdi></li>)}</ol>
    <p className="h7-receipt-action">{c.action} {payout}</p>
  </div>;
}
