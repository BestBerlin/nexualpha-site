// Venue fee ledger with the market median (inner-page pass 2026-10-23). Same markup and scale as VenueFeeLedger in
// v6/InnerLedger.jsx, plus a median tick on every track and the accent on a figure below that median (a lower
// verified figure is the only positive data the site highlights). It lives in the venue route chunk because
// InnerLedger.jsx is part of the home entry's static closure, which has no JS budget left.
import { EXCHANGE_FACTS, factsForVenue, feeFact, feePct } from "../../data/exchange-facts.js";
import { FEE_SCALE } from "../v6/InnerLedger.jsx";
import { labels as factLabels } from "./ExchangeFactsV5.jsx";
import { matrixCopy } from "./exchange-matrix-copy.js";
import { r9Text } from "../v6/inner-r9-copy.js";
import { inner9Copy } from "./inner9-copy.js";

const share = (v) => Math.max(0, Math.min(1, v / FEE_SCALE));
const median = (list) => {
  const v = [...list].sort((x, y) => x - y);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
// Median of every checked figure per product and side, over the venues the ledger itself can show (not AMM DEXs).
const FEE_MEDIANS = Object.fromEntries(["spot", "perp"].map((p) => {
  const checked = Object.values(EXCHANGE_FACTS).filter((f) => f.type !== "dex" && f.fields[p].state === "checked");
  const of = (side) => median(checked.map((f) => f.fields[p][side]).filter(Number.isFinite));
  return [p, { n: checked.length, maker: of("maker"), taker: of("taker") }];
}));

export function VenueFeeLedger({ slug, locale }) {
  const entry = factsForVenue(slug);
  if (!entry || entry.type === "dex") return null;
  const l = factLabels(locale);
  const t = r9Text(locale);
  const nc = matrixCopy(locale).unchecked;
  const groups = [["spot", l.spot, l.spotSub], ["perp", l.perp, l.perpSub]].map(([key, name, sub]) => ({ key, name, sub, f: feeFact(slug, key) }));
  const discounts = [];
  if (entry.discount.token && entry.discount.spot) discounts.push([l.spot, entry.discount.spot]);
  if (entry.discount.token && entry.discount.perp) discounts.push([l.perp, entry.discount.perp]);
  let n = 0;
  return (
    <figure className="r9-led" aria-label={l.fees}>
      <div className="r9-axis" aria-hidden="true">
        <span className="v6-num">0</span><span className="v6-num">{feePct(FEE_SCALE / 2, locale)}</span><span className="v6-num">{feePct(FEE_SCALE, locale)}</span>
      </div>
      {groups.map(({ key, name, sub, f }) => {
        const none = f.maker == null && f.taker == null;
        return (
          <div className={`r9-led__group${none ? " r9-led__group--nc" : ""}`} key={key} role="group" aria-label={name}>
            <p className="r9-led__prod"><b>{name}</b><small>{sub}</small></p>
            {none ? (
              <p className="r9-led__nc"><span>{f.state === "none" ? matrixCopy(locale).notOffered : nc}</span><span className="r9-track" aria-hidden="true" /></p>
            ) : (
              [[l.maker, f.maker, "maker"], [l.taker, f.taker, "taker"]].map(([side, v, sideKey]) => {
                const med = FEE_MEDIANS[key][sideKey];
                return (
                  <p className="r9-led__row" key={side} style={{ "--n": n++ }} data-below-median={v != null && med != null && v < med ? "" : undefined}>
                    <span className="r9-led__side">{side}</span>
                    {v == null
                      ? <span className="r9-led__fig r9-led__fig--nc">{nc}</span>
                      : <span className="r9-led__fig v6-num" translate="no">{feePct(v, locale)}</span>}
                    <span className="r9-track" aria-hidden="true">{v != null && <i style={{ "--w": share(v) }} />}{med != null && <b className="r9-track__median" style={{ "--m": share(med) }} />}</span>
                  </p>
                );
              })
            )}
          </div>
        );
      })}
      <figcaption className="r9-led__foot">
        <span>{t.scale.replace("{max}", feePct(FEE_SCALE, locale))}</span>
        {FEE_MEDIANS.spot.n > 2 && <span className="r9-led__median-key"><i aria-hidden="true" />{inner9Copy(locale).median.replace("{n}", String(FEE_MEDIANS.spot.n))}</span>}
        {discounts.length > 0 && (
          <span className="r9-led__disc">
            {l.discount}{" "}
            {discounts.map(([k, v]) => <span key={k}><b className="v6-num">−{v}%</b> {k} </span>)}
            <span translate="no">{l.pays} {entry.discount.token}</span>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
