// R9 inner-page identity: the home "Crossroads" vocabulary (ledger, gap figure, route) carried onto venue and compare pages.
// Every figure comes from exchange-facts.js; a figure it does not publish reads "Not yet checked". No rankings, no verdicts:
// the accent marks only a lower verified figure (positive data) and the destination of the route.
import { BrandMark } from "../brand/BrandMark";
import { EXCHANGE_FACTS, factsForVenue, feeFact, feePct } from "../../data/exchange-facts.js";
import { labels as factLabels } from "../v3/ExchangeFactsV5.jsx";
import { matrixCopy } from "../v3/exchange-matrix-copy.js";
import { labText } from "../v3/LeanHeroCopyLab.js";
import { getVerifyCopy } from "../v3/LeanHeroCopyVerify.js";
import { r9Text } from "./inner-r9-copy.js";

// One scale for every bar on the site: the highest fee figure published as checked (percent). Never a per-page maximum,
// so a 0.05% bar is the same length on every profile and in every comparison.
export const FEE_SCALE = Math.max(0, ...Object.values(EXCHANGE_FACTS).flatMap((f) => ["spot", "perp"].flatMap((p) => (f.fields[p].state === "checked" ? [f.fields[p].maker, f.fields[p].taker] : [])).filter((v) => Number.isFinite(v)))) || 0.1;
const share = (v) => Math.max(0, Math.min(1, v / FEE_SCALE));

function Axis({ className = "r9-axis" }) {
  return (
    <div className={className} aria-hidden="true">
      <span className="v6-num">0</span><span className="v6-num">{feePct(FEE_SCALE / 2)}</span><span className="v6-num">{feePct(FEE_SCALE)}</span>
    </div>
  );
}

// Venue profile hero: the verified fee ledger. Product groups, maker/taker rows, figure + bar on the shared scale.
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
      <Axis />
      {groups.map(({ key, name, sub, f }) => {
        const none = f.maker == null && f.taker == null;
        return (
          <div className={`r9-led__group${none ? " r9-led__group--nc" : ""}`} key={key} role="group" aria-label={name}>
            <p className="r9-led__prod"><b>{name}</b><small>{sub}</small></p>
            {none ? (
              <p className="r9-led__nc"><span>{f.state === "none" ? matrixCopy(locale).notOffered : nc}</span><span className="r9-track" aria-hidden="true" /></p>
            ) : (
              [[l.maker, f.maker], [l.taker, f.taker]].map(([side, v]) => (
                <p className="r9-led__row" key={side} style={{ "--n": n++ }}>
                  <span className="r9-led__side">{side}</span>
                  {v == null
                    ? <span className="r9-led__fig r9-led__fig--nc">{nc}</span>
                    : <span className="r9-led__fig v6-num" translate="no">{feePct(v)}</span>}
                  <span className="r9-track" aria-hidden="true">{v != null && <i style={{ "--w": share(v) }} />}</span>
                </p>
              ))
            )}
          </div>
        );
      })}
      <figcaption className="r9-led__foot">
        <span>{t.scale.replace("{max}", feePct(FEE_SCALE))}</span>
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

// The route a visitor takes from this page: you → official domain → referral code → official sign-up.
// Static (the sign-up itself stays in the registration card); the traversed line is the active route.
export function VenueRoute({ domain, code, locale }) {
  const t = r9Text(locale);
  const v = getVerifyCopy(locale);
  return (
    <ol className="r9-route" aria-label={t.route}>
      <li className="r9-route__stop" data-stop="you"><i aria-hidden="true" /><span className="r9-route__k">{t.you}</span></li>
      <li className="r9-route__stop" data-stop="domain"><i aria-hidden="true" /><span className="r9-route__k">{v.s1t}</span><span className="r9-route__v v6-num" translate="no" dir="ltr">{domain}</span></li>
      <li className="r9-route__stop" data-stop="code"><i aria-hidden="true" /><span className="r9-route__k">{v.s2t}</span>{code ? <span className="r9-route__v v6-num" translate="no" dir="ltr">{code}</span> : <span className="r9-route__v">{v.none}</span>}</li>
      <li className="r9-route__stop" data-stop="signup"><i aria-hidden="true" /><span className="r9-route__k">{t.signup}</span></li>
    </ol>
  );
}

// /compare/{a}-vs-{b}: the two-column ledger from the home Compare Lab with the centre gap figure.
// Ties are said in words ("identical") and carry no accent, so no side reads as the winner.
export function CompareFeeLedger({ a, b, nameA, nameB, locale }) {
  const fa = EXCHANGE_FACTS[a], fb = EXCHANGE_FACTS[b];
  if (!fa && !fb) return null;
  const t = labText(locale);
  const r = r9Text(locale);
  const val = (f, g, i) => (f?.status === "verified" ? f[g]?.[i] ?? null : null);
  const full = (g) => [0, 1].every((i) => val(fa, g, i) != null && val(fb, g, i) != null);
  const rows = [["spot", 0], ["spot", 1], ["perp", 0], ["perp", 1]].map(([g, i], n) => ({ g, i, n, va: val(fa, g, i), vb: val(fb, g, i) })).filter((row) => full(row.g));
  const half = ["spot", "perp"].map((g, gi) => ({ g, gi, pa: [val(fa, g, 0), val(fa, g, 1)], pb: [val(fb, g, 0), val(fb, g, 1)] }))
    .filter((p) => !full(p.g) && [...p.pa, ...p.pb].some((x) => x != null));
  if (!rows.length && !half.length) return null;
  const pendingBits = ["spot", "perp"].filter((g) => [0, 1].every((i) => val(fa, g, i) == null && val(fb, g, i) == null)).map((g) => t.prod[g === "spot" ? 0 : 1]);
  const pairText = (p) => (p.every((x) => x == null) ? t.nc : p.map((x) => (x == null ? "–" : feePct(x))).join(" / "));
  const spot = [0, 1].map((i) => [val(fa, "spot", i), val(fb, "spot", i)]);
  let gap = null;
  if (spot.every(([x, y]) => x != null && y != null)) {
    const d = spot.map(([x, y]) => Math.abs(x - y));
    const k = d[0] >= d[1] ? 0 : 1;
    const [x, y] = spot[k];
    gap = { v: Math.round(d[k] * 1e4) / 1e4, low: x === y ? null : (x < y ? nameA : nameB), row: t.rows[k] };
  }
  const gapText = gap ? (gap.low ? t.lower.replace("{n}", gap.low).replace("{row}", gap.row) : t.same) : t.nc;
  const fig = (v) => <span className="r9-cmp__fig v6-num" translate="no">{feePct(v)}</span>;
  const bar = (v, other) => <span className="r9-track" aria-hidden="true"><i style={{ "--w": share(v) }} data-low={v < other ? "" : undefined} /></span>;
  return (
    <section className="r9-cmp" aria-label={`${nameA} / ${nameB}: ${t.gap}`}>
      <div className="r9-cmp__head">
        <p className="r9-cmp__id r9-cmp__id--a" translate="no"><BrandMark slug={a} compact /><b>{nameA}</b></p>
        <div className="r9-cmp__gap" data-tie={gap && !gap.low ? "" : undefined} data-none={gap ? undefined : ""}>
          <p className="r9-cmp__num v6-num" aria-hidden="true">{gap ? feePct(gap.v).replace("%", "") : "–"}{gap && <small>pp</small>}</p>
          <p className="r9-cmp__cap">{t.gap}</p>
          <p className="r9-cmp__low">{gapText}</p>
          <span className="cl-sr">{gap ? `${t.gap}: ${feePct(gap.v).replace("%", "")} pp. ${gapText}` : `${t.gap}: ${t.nc}`}</span>
        </div>
        <p className="r9-cmp__id r9-cmp__id--b" translate="no"><BrandMark slug={b} compact /><b>{nameB}</b></p>
      </div>
      <div className="r9-cmp__rows">
        {rows.map((row) => (
          <div className="r9-cmp__row" key={row.g + row.i} role="group" aria-label={t.rows[row.n]} style={{ "--n": row.n }}>
            <span className="r9-cmp__side r9-cmp__side--a"><span className="cl-sr">{nameA}: </span>{bar(row.va, row.vb)}{fig(row.va)}</span>
            <span className="r9-cmp__row-name">{t.rows[row.n]}</span>
            <span className="r9-cmp__side r9-cmp__side--b"><span className="cl-sr">{nameB}: </span>{fig(row.vb)}{bar(row.vb, row.va)}</span>
          </div>
        ))}
        {half.map((p) => (
          <div className="r9-cmp__row r9-cmp__row--text" key={p.g} role="group" aria-label={t.prod[p.gi]}>
            <span className="r9-cmp__side r9-cmp__side--a"><span className="cl-sr">{nameA}: </span><span className="r9-cmp__txt v6-num">{pairText(p.pa)}</span></span>
            <span className="r9-cmp__row-name">{t.prod[p.gi]}</span>
            <span className="r9-cmp__side r9-cmp__side--b"><span className="cl-sr">{nameB}: </span><span className="r9-cmp__txt v6-num">{pairText(p.pb)}</span></span>
          </div>
        ))}
        {pendingBits.length > 0 && <p className="r9-cmp__pending">{`${t.nc}: ${pendingBits.join(", ")}`}</p>}
      </div>
      <p className="r9-cmp__foot">{r.scale.replace("{max}", feePct(FEE_SCALE))}</p>
    </section>
  );
}
