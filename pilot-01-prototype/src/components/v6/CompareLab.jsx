// V6 Act 2: Compare Lab. Paired ledger of verified fee figures that morphs between two chosen venues.
// Only values present in EXCHANGE_FACTS are shown; anything else reads "Not yet checked". No ranking, no verdicts.
import { useLayoutEffect, useEffect, useRef } from "react";
import { BrandMark } from "../brand/BrandMark";
import { getUi } from "../v3/CrossroadsCompare";
import { EXCHANGE_FACTS } from "../../data/exchange-facts.js";
import { directoryContext } from "../../data/directory-context.js";
import { localizedHref } from "../../data/locale-routing.js";
import { prefersReducedMotion } from "../../lib/v5/useInView.js";
import { labText } from "./compare-lab-copy.js";
import "../../styles/v6/compare-lab.css";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const CHIPS = ["binance", "okx", "bybit", "bitget", "coinbase", "kraken", "hyperliquid", "uniswap", "jupiter", "dydx"];
const NAMES = { binance: "Binance", okx: "OKX", bybit: "Bybit", bitget: "Bitget", coinbase: "Coinbase", kraken: "Kraken", hyperliquid: "Hyperliquid", uniswap: "Uniswap", jupiter: "Jupiter", dydx: "dYdX" };
const TYPES = { cex: "CEX", dex: "DEX", "perp-dex": "Perp DEX" };
// Rows: [fact key, index]. Bars share one scale per product, taken from the whole fact set (never invented).
const ROWS = [["spot", 0], ["spot", 1], ["perp", 0], ["perp", 1]];
const PRODUCTS = ["spot", "perp"];

const fmtCache = new Map();
function fmt(n, locale, suffix = "%") {
  let f = fmtCache.get(locale);
  if (!f) { try { f = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 3 }); } catch { f = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 3 }); } fmtCache.set(locale, f); }
  return f.format(n) + suffix;
}

// Figure that counts from its previous value to the new one. Server and first paint carry the final value.
function Fig({ v, locale, suffix = "%", className = "cl-fig v6-num" }) {
  const ref = useRef(null);
  const prev = useRef(v);
  useIso(() => {
    const el = ref.current, from = prev.current;
    prev.current = v;
    if (!el || from === v || prefersReducedMotion()) return undefined;
    let raf = 0; const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 520, 1);
      el.textContent = fmt(from + (v - from) * (p >= 1 ? 1 : 1 - 2 ** (-10 * p)), locale, suffix);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    el.textContent = fmt(from, locale, suffix);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.textContent = fmt(v, locale, suffix); };
  }, [v, locale, suffix]);
  return <span ref={ref} className={className}>{fmt(v, locale, suffix)}</span>;
}

// One side of a ledger row. Bars share one scale per product (the larger of the two venues), the lower figure carries the accent.
function Cell({ side, name, value, scale, other, locale, pending, text }) {
  const has = value != null;
  const low = has && (other == null || value <= other);
  return (
    <div className={`cl-cell cl-cell--${side}`}>
      <span className="cl-sr">{name}: </span>
      {text != null
        ? <span className="cl-text">{text}</span>
        : has ? <Fig v={value} locale={locale} /> : <><span className="cl-dash" aria-hidden="true">{"\u2013"}</span><span className="cl-sr">{pending}</span></>}
      {scale != null && (has
        ? <span className="cl-bar" aria-hidden="true" data-low={low ? "" : undefined}><i style={{ "--w": Math.min(value / scale, 1) }} /></span>
        : <span className="cl-bar cl-bar--nc" aria-hidden="true" />)}
    </div>
  );
}

const Arrow = () => <svg className="cl-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>;

function normalize(selected) {
  const out = [];
  for (const s of Array.isArray(selected) ? selected : []) if (typeof s === "string" && /^[a-z0-9-]+$/.test(s) && !out.includes(s)) out.push(s);
  for (const d of ["binance", "okx", "bybit"]) if (out.length < 2 && !out.includes(d)) out.push(d);
  return out.slice(0, 2);
}

export function CompareLab({ locale = "en", venues = [], selected, onSelectionChange, feeCheck }) {
  const t = labText(locale);
  const ui = getUi(locale);
  const ctx = directoryContext({ locale });
  const [a, b] = normalize(selected);
  const plate = useRef(null);
  const snapshot = useRef(null);
  const catalog = Object.fromEntries((Array.isArray(venues) ? venues : []).map((v) => [v.slug, v]));
  const nameOf = (s) => catalog[s]?.name || NAMES[s] || s;
  const typeOf = (s) => TYPES[EXCHANGE_FACTS[s]?.type] || catalog[s]?.category || "";
  const chips = [...CHIPS, ...[a, b].filter((s) => !CHIPS.includes(s))];
  const href = (slug) => localizedHref(`/compare/${slug}`, {
    locale, market: ctx.market, product: ctx.product,
    ...(ctx.scoped ? { utm_source: "regional_preview", utm_campaign: `${ctx.market.toLowerCase()}-research-preview` } : {}),
  });

  // FLIP: remember where each venue block sits, then glide it from there after the selection changes.
  const snap = () => {
    const m = {};
    plate.current?.querySelectorAll("[data-flip]").forEach((el) => { m[el.dataset.flip] = el.getBoundingClientRect(); });
    snapshot.current = m;
    if (plate.current) plate.current.dataset.live = "1";
  };
  useIso(() => {
    const m = snapshot.current;
    if (!m || !plate.current) return;
    snapshot.current = null;
    if (prefersReducedMotion()) return;
    plate.current.querySelectorAll("[data-flip]").forEach((el) => {
      const p = m[el.dataset.flip], r = el.getBoundingClientRect();
      if (p) {
        const dx = p.left - r.left, dy = p.top - r.top;
        if (Math.abs(dx) + Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 420, easing: EASE });
      } else el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: EASE });
    });
  }, [a, b]);

  const commit = (na, nb) => { snap(); onSelectionChange?.([na, nb]); };
  const pick = (slot, slug) => {
    if (slot === 0) commit(slug, slug === b ? a : b);
    else commit(slug === a ? b : a, slug);
  };

  const fa = EXCHANGE_FACTS[a], fb = EXCHANGE_FACTS[b];
  const date = (f) => {
    if (f?.status !== "verified" || !f.verifiedOn) return null;
    try { return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(f.verifiedOn)); } catch { return f.verifiedOn; }
  };
  const val = (f, g, i) => (f?.status === "verified" ? f[g]?.[i] ?? null : null);
  // Rows with no figure on either side disappear; whatever is missing is named once, in one quiet line.
  const rows = ROWS.map(([g, i], n) => ({ g, i, n, va: val(fa, g, i), vb: val(fb, g, i) })).filter((r) => r.va != null || r.vb != null);
  const scaleOf = (g) => Math.max(0, ...rows.filter((r) => r.g === g).flatMap((r) => [r.va, r.vb]).filter((x) => x != null)) || null;
  const pendingBits = [];
  for (const [slug, f] of [[a, fa], [b, fb]]) PRODUCTS.forEach((g, gi) => { if (val(f, g, 0) == null && val(f, g, 1) == null) pendingBits.push(`${nameOf(slug)} \u00b7 ${t.prod[gi]}`); });
  // The one bold type moment: the largest spot base-fee gap between the two venues, in percentage points.
  const spot = [0, 1].map((i) => [val(fa, "spot", i), val(fb, "spot", i)]);
  const haveGap = spot.every(([x, y]) => x != null && y != null);
  let gap = null;
  if (haveGap) {
    const d = spot.map(([x, y]) => Math.abs(x - y));
    const k = d[0] >= d[1] ? 0 : 1;
    const [x, y] = spot[k];
    gap = { v: Math.round(d[k] * 1e4) / 1e4, row: t.rows[k], low: x === y ? null : nameOf(x < y ? a : b) };
  }
  const metaHas = date(fa) || date(fb);
  const status = t.status.replace("{a}", nameOf(a)).replace("{b}", nameOf(b));
  const isCurrent = (pair) => (pair.left === a && pair.right === b) || (pair.left === b && pair.right === a);

  const popInner = (pair) => (
    <>
      <span className="cl-pop__marks"><BrandMark slug={pair.left} compact /><BrandMark slug={pair.right} compact /></span>
      <span className="cl-pop__text">
        <span className="cl-pop__names" translate="no" lang="en">{pair.leftName} <small>vs</small> {pair.rightName}</span>
        <span className="cl-pop__desc v6-small">{pair.desc}</span>
      </span>
      {isCurrent(pair) ? <span className="cl-pop__on" aria-hidden="true" /> : <Arrow />}
    </>
  );

  const Picker = ({ slot, cur, label }) => (
    <div className={`cl-pick cl-pick--${slot ? "b" : "a"}`} role="radiogroup" aria-label={label}>
      <span className="cl-pick__label v6-meta" aria-hidden="true">{label}</span>
      <div className="cl-chips">
        {chips.map((s) => (
          <label key={s} className="cl-chip">
            <input type="radio" name={`cl-slot-${slot}`} value={s} checked={cur === s} onChange={() => pick(slot, s)} />
            <span translate="no">{nameOf(s)}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const Identity = ({ slug, side }) => (
    <div className={`cl-id cl-id--${side}`} data-flip={slug}>
      <BrandMark slug={slug} />
      <div className="cl-id__text">
        <span className="cl-id__name" translate="no">{nameOf(slug)}</span>
        <span className="cl-id__type v6-meta">{typeOf(slug)}</span>
      </div>
    </div>
  );

  return (
    <section className="cl v6-section" id="compare" aria-labelledby="cl-title">
      <div className="v6-wrap">
        <header className="cl__head">
          <h2 className="v6-h2" id="cl-title">{ui.title}</h2>
          <p className="v6-lead">{ui.lead}</p>
        </header>

        <div className="cl__plate" ref={plate}>
          <div className="cl-grid cl-grid--pick">
            {Picker({ slot: 0, cur: a, label: t.first })}
            {Picker({ slot: 1, cur: b, label: t.second })}
          </div>

          <div className="cl-grid cl-grid--ids">
            {Identity({ slug: a, side: "a" })}
            <button type="button" className="cl-swap" onClick={() => commit(b, a)} aria-label={t.swap} title={t.swap}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h13M12 3l4 4-4 4M17 13H4M8 9l-4 4 4 4" /></svg>
            </button>
            {Identity({ slug: b, side: "b" })}
          </div>

          <p className="cl-sr" role="status" aria-live="polite">{status}</p>

          {gap && (
            <div className="cl-gap" role="group" aria-label={t.gap}>
              <p className="cl-gap__fig" aria-hidden="true">
                <Fig v={gap.v} locale={locale} suffix="" className="cl-gap__num v6-num" />
                <span className="cl-gap__unit v6-num">pp</span>
              </p>
              <p className="cl-gap__cap">
                <span className="cl-gap__label v6-small">{t.gap}</span>
                <span className="cl-gap__low v6-meta">{gap.low ? t.lower.replace("{n}", gap.low).replace("{row}", gap.row) : t.same}</span>
              </p>
              <span className="cl-sr">{`${t.gap}: ${fmt(gap.v, locale, " pp")}. ${gap.low ? t.lower.replace("{n}", gap.low).replace("{row}", gap.row) : t.same}`}</span>
            </div>
          )}

          <div className="cl-ledger">
            {rows.map((r) => (
              <div className="cl-row" key={r.g + r.i} role="group" aria-label={t.rows[r.n]}>
                <Cell side="a" name={nameOf(a)} value={r.va} other={r.vb} scale={scaleOf(r.g)} locale={locale} pending={t.pending} />
                <span className="cl-label v6-small">{t.rows[r.n]}</span>
                <Cell side="b" name={nameOf(b)} value={r.vb} other={r.va} scale={scaleOf(r.g)} locale={locale} pending={t.pending} />
              </div>
            ))}
            {metaHas && (
              <div className="cl-row cl-row--meta" role="group" aria-label={t.checked}>
                <Cell side="a" name={nameOf(a)} locale={locale} pending={t.pending} text={date(fa) ?? "\u2013"} />
                <span className="cl-label v6-small">{t.checked}</span>
                <Cell side="b" name={nameOf(b)} locale={locale} pending={t.pending} text={date(fb) ?? "\u2013"} />
              </div>
            )}
            {pendingBits.length > 0 && (
              <p className="cl-pending v6-small">
                <span className="cl-pending__dot" aria-hidden="true" />
                <span>{`${pendingBits.join("; ")} \u2014 ${t.pending}`}</span>
              </p>
            )}
          </div>

          <div className="cl-foot">
            <p className="cl-note v6-meta">{t.note}</p>
            <a
              className="btn btn-primary cl-cta"
              href={href(`${a}-vs-${b}`)}
              data-growth-decision={`${a}-vs-${b}`}
              data-growth-placement="compare-lab-cta"
              data-growth-product="spot"
            >
              <span>{t.cta}</span><Arrow />
              <span className="cl-sr"> ({nameOf(a)} / {nameOf(b)})</span>
            </a>
          </div>
        </div>

        <div className="cl-pop">
          <h3 className="v6-h3">{t.popular}</h3>
          <ul className="cl-pop__list">
            {ui.pairs.map((pair) => (
              <li key={pair.slug} className="cl-pop__item" data-active={isCurrent(pair) ? "1" : undefined}>
                {isCurrent(pair) ? (
                  <div className="cl-pop__link" aria-current="true">{popInner(pair)}</div>
                ) : (
                  <a
                    className="cl-pop__link"
                    href={href(pair.slug)}
                    data-decision-path={({ "binance-vs-okx": "cex", "bybit-vs-bitget": "derivatives", "uniswap-vs-jupiter": "onchain", "hyperliquid-vs-dydx": "perp" })[pair.slug]}
                    data-growth-decision={pair.slug}
                    data-growth-placement="crossroads-compare-card"
                    data-growth-product={pair.slug.includes("dydx") ? "perpetuals" : "spot"}
                  >{popInner(pair)}</a>
                )}
                <button type="button" className="cl-pop__load v6-small" aria-pressed={isCurrent(pair)} onClick={() => commit(pair.left, pair.right)}>{t.preview}</button>
              </li>
            ))}
          </ul>
        </div>

        {feeCheck && (
          <details className="cl-fees" id="bleed-analyzer">
            <summary className="cl-fees__sum">
              <span className="cl-fees__text">
                <strong className="v6-h3">{t.feeTitle}</strong>
                <span className="v6-small">{t.feeSub}</span>
              </span>
              <span className="cl-fees__icon" aria-hidden="true" />
            </summary>
            <div className="cl-fees__body">{feeCheck}</div>
          </details>
        )}
      </div>
    </section>
  );
}
