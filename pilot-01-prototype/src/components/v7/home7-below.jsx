// Home v7, below the first viewport: the savings calculator, the live funding board, the announcement stream and the
// Telegram block. HomeV7.jsx renders this module synchronously on the server (full HTML for crawlers and no-JS
// readers) and loads it in the browser only when the calculator scrolls near the viewport (DeferUntilVisible), so the
// first-screen bundle stays small. Markup and copy are unchanged from the previous inline version.
import { useEffect, useRef, useState } from "react";
import { TelegramBlock } from "./home7-telegram.jsx";
import { FundingBoard } from "./home7-funding.jsx";
import { feeFact } from "../../data/exchange-facts.js";
import { localizedHref } from "../../data/locale-routing.js";
import { formatPercent } from "../../data/format-percent.js";
import { formatFee } from "../../data/format-fee.js";
import { appendCostScenarioQuery, buildDecisionReturnHref } from "../../data/decision-return.js";
import { updateHref } from "../../data/activity-update.js";
import { readIntelFeed } from "../../data/announcement-intel.js";
import { formatSgt } from "../../data/local-time.js";
import { applyCampaignBriefs } from "../../data/campaign-briefs.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { CampaignBriefFacts } from "../shared/CampaignBriefFacts.jsx";
import { useCampaignBriefs } from "../shared/useCampaignBriefs.js";
import { CHIPS, Cta, Roll, VMIN, nameOf, toPos, toVol, usd } from "./home7-shared.jsx";
import { LocalMarketBrief } from "./home7-local-market.jsx";
import { MoversBoard } from "./home7-movers.jsx";
import { CALENDAR_PATH, ETF_FLOWS_LIVE, ETF_FLOWS_PATH } from "../../data/intel-tools-routes.js";
import { intelToolLinks } from "../../data/intel-tools-links.js";
import { FUNDING_RATES_PATH, LIQUIDATIONS_PATH, dataPageCopy } from "../../data/market-data-pages-nav.js";

// Daily market data (2026-10-13): links to the data pages people come back to every day (pill list, h7-coins styles);
// below the fold, so the entry stays inside its budget.
const DATA_RAIL_COPY = {
  en: { title: "Daily market data", lead: "This week's macro dates and exchange deadlines, plus liquidations and funding — each with its source." },
  "zh-Hans": { title: "每日市场数据", lead: "本周宏观日程与交易所截止日期，以及爆仓与资金费率，每项都附来源。" },
  es: { title: "Datos de mercado diarios", lead: "Fechas macro y plazos de exchanges de la semana, más liquidaciones y funding, cada uno con su fuente." },
  "pt-BR": { title: "Dados de mercado diários", lead: "Datas macro e prazos de corretoras da semana, além de liquidações e funding, cada um com a fonte." },
  tr: { title: "Günlük piyasa verileri", lead: "Haftanın makro tarihleri ve borsa son tarihleri, ayrıca tasfiyeler ve fonlama; hepsi kaynağıyla." },
  vi: { title: "Dữ liệu thị trường hằng ngày", lead: "Lịch vĩ mô và hạn chót của sàn trong tuần, cùng thanh lý và funding, kèm nguồn." },
  id: { title: "Data pasar harian", lead: "Jadwal makro dan tenggat bursa minggu ini, plus likuidasi dan funding, masing-masing dengan sumbernya." },
  ja: { title: "毎日のマーケットデータ", lead: "今週の経済指標と取引所の締切日に加え、清算と資金調達率。すべて出典付き。" },
  ko: { title: "매일 보는 시장 데이터", lead: "이번 주 경제지표, 거래소 마감일과 청산·펀딩비. 모두 출처 포함." },
};
function DataRail({ locale }) {
  const c = DATA_RAIL_COPY[locale] || (String(locale || "").startsWith("zh") ? DATA_RAIL_COPY["zh-Hans"] : DATA_RAIL_COPY.en);
  const links = intelToolLinks(locale), nav = dataPageCopy(locale).nav;
  const items = [...(ETF_FLOWS_LIVE ? [[ETF_FLOWS_PATH, links.etf]] : []), [CALENDAR_PATH, links.calendar], [LIQUIDATIONS_PATH, nav.liquidations], [FUNDING_RATES_PATH, nav.funding]];
  return <section className="h7-in h7-coins h7-data" aria-labelledby="h7-data-h" data-testid="home-data-rail">
    <div className="h7-coins-head"><h2 id="h7-data-h">{c.title}</h2></div>
    <p className="h7-coins-lead">{c.lead}</p>
    <ul className="h7-coins-list">{items.map(([path, label]) => <li key={path}><a href={localizedHref(path, { locale })}><b>{label}</b></a></li>)}</ul>
  </section>;
}
import { FlashRail } from "../flash/FlashRail.jsx";
import { BINANCE_OCTOBER_PATH, binanceOctoberPromotable, binanceOctoberTeaser } from "../../data/binance-october.js";
import { BYBIT_STOCKS_PATH, bybitStocksCampaignActive, bybitStocksTeaser } from "../../data/bybit-stocks.js";
import { BITGET_ALLIANCE_PATH, bitgetAlliancePromotable, bitgetAllianceTeaser } from "../../data/bitget-alliance.js";
import { KRAKEN_USDG_PATH, krakenUsdgPromotable, krakenUsdgTeaser } from "../../data/kraken-usdg.js";

const INTEL_URL = "/intel/official-announcements.json";
const INTEL_SHOW = ["listing", "event", "delisting", "news", "product", "security"];
function useIntel(venues) {
  const [feed, setFeed] = useState(null);
  const slugs = venues.map((v) => v.slug).join(",");
  useEffect(() => {
    let alive = true;
    const load = (first) => fetch(INTEL_URL, { headers: { accept: "application/json" }, cache: first ? "default" : "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        const items = j ? readIntelFeed(j).filter((i) => INTEL_SHOW.includes(i.category)) : [];
        // null = still loading, false = unavailable (fail closed: no invented notices). A failed refresh keeps what is shown.
        if (items.length) setFeed({ items: items.slice(0, 40), generatedAt: j.generatedAt });
        else if (first) setFeed(false);
      })
      .catch(() => { if (alive && first) setFeed(false); });
    load(true);
    // Live stream (owner 2026-10-10): refresh every 5 minutes while the page is visible.
    const timer = setInterval(() => { if (document.visibilityState === "visible") load(false); }, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(timer); };
  }, [slugs]);
  return feed;
}

const PERP_RE = /(futures|perp|contract|永续|合约)/i;
// Base fees for the market an announcement concerns, with the disclosed rebate applied. Unchecked fees stay null.
function compareRows(venues, perp) {
  return venues.map((v) => {
    const f = feeFact(v.slug, perp ? "perp" : "spot");
    const ok = f.state === "checked" && Number.isFinite(f.maker) && Number.isFinite(f.taker);
    const k = 1 - (v.share || 0);
    return { ...v, maker: ok ? f.maker : null, taker: ok ? f.taker : null, mk: ok ? f.maker * k : null, tk: ok ? f.taker * k : null };
  });
}

function IntelSheet({ item, venues, t, locale, market, onClose }) {
  const ref = useRef(null);
  const perp = PERP_RE.test(item.rawTitle || item.title);
  useEffect(() => {
    const d = ref.current;
    const opener = document.activeElement;
    if (d && !d.open) d.showModal();
    const root = document.documentElement; const prev = root.style.overflow; root.style.overflow = "hidden";
    return () => { root.style.overflow = prev; if (opener && opener.isConnected && typeof opener.focus === "function") opener.focus(); };
  }, []);
  const rows = compareRows(venues, perp);
  return (
    <dialog ref={ref} className="h7-sheet" aria-labelledby="h7-sh-t" onClose={onClose} onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
      <div className="h7-sh-in">
        <button type="button" className="h7-sh-x" onClick={() => ref.current.close()} aria-label={t.shClose}>×</button>
        <h3 id="h7-sh-t" className="h7-sh-h">{t.shH}</h3>
        <p className="h7-sh-ev"><span className={`h7-ic h7-ic-${item.category}`}>{t.inCat[item.category]}</span> {item.title}</p>
        <CampaignBriefFacts brief={item.brief} locale={locale} />
        <p className="h7-sh-sub">{perp ? t.shPerp : t.shSpot}</p>
        <ul className="h7-sh-l">
          {rows.map((r) => (
            <li key={r.slug}>
              <div className="h7-sh-n"><BrandMark slug={r.slug} compact /><b>{r.name}</b>{r.share ? <span className="h7-bd">{t.upTo} {formatPercent(locale, Math.round(r.share * 100))}</span> : <span className="h7-bd" data-nr>{t.pending}</span>}</div>
              <div className="h7-sh-f">{r.maker != null ? <>{t.maker} {formatFee(r.maker, locale)} / {t.taker} {formatFee(r.taker, locale)}{r.share ? <small>{t.shAfter} {formatFee(r.mk, locale)} / {formatFee(r.tk, locale)}</small> : null}</> : t.unchecked}</div>
              <Cta v={r} locale={locale} className="h7-btn h7-sm h7-sh-b" placement="home-v7-intel"><span>{t.open}</span><span className="h7-sr"> {r.name}</span></Cta>
            </li>
          ))}
        </ul>
        <a className="h7-ln" href={updateHref(item, locale, { market })}>{t.shSrc}</a>
        <p className="h7-sh-note">{t.shNote}</p>
      </div>
    </dialog>
  );
}

const fmtAsOf = (iso, locale) => formatSgt(iso, locale);

// Minute-precise "time ago" in the reader's language (Intl), ticking once a minute.
function useNow(stepMs = 60 * 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), stepMs); return () => clearInterval(id); }, [stepMs]);
  return now;
}
function timeAgo(ms, locale) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 60) return rtf.format(-min, "minute");
  const h = Math.round(min / 60);
  return h < 24 ? rtf.format(-h, "hour") : rtf.format(-Math.round(h / 24), "day");
}
// l10n: needs native review
const LIVE = {
// l10n: needs native review
ur: "لائیو",
// l10n: needs native review
uk: "Наживо", "zh-Hans": "实时", "zh-Hant": "即時", ja: "ライブ", ko: "실시간", ar: "مباشر", ru: "Онлайн", tr: "Canlı", es: "En vivo", "pt-BR": "Ao vivo", fr: "En direct", de: "Live", it: "Live", id: "Langsung", vi: "Trực tiếp" };

// Newest first, but at most `perVenue` rows per exchange until the list is full (one venue's batch of listings
// should not hide every other exchange).
function spread(items, limit, perVenue) {
  const count = {}, picked = [], rest = [];
  for (const i of items) {
    if ((count[i.venue] || 0) < perVenue && picked.length < limit) { picked.push(i); count[i.venue] = (count[i.venue] || 0) + 1; } else rest.push(i);
  }
  return [...picked, ...rest].slice(0, limit).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

// Featured campaigns (owner 2026-10-12): our own campaign pages are pinned above the exchange notices while they run
// (Bybit Stocks; Binance October gifts where Binance may be promoted). They link our pages, not the exchanges.
// Bitget Alliance (owner 2026-10-13, big push) takes the top spot where Bitget may be promoted.
function featuredCampaigns(locale, market) {
  const rows = [];
  // Kraken 5M USDG Challenge (owner 2026-10-13, strong push) first, Bitget Alliance right after it: both stay featured.
  if (krakenUsdgPromotable({ locale, market })) rows.push({ id: "kraken-usdg", venue: "kraken", name: "Kraken", path: KRAKEN_USDG_PATH, teaser: krakenUsdgTeaser(locale) });
  if (bitgetAlliancePromotable({ locale, market })) rows.push({ id: "bitget-alliance", venue: "bitget", name: "Bitget.com", path: BITGET_ALLIANCE_PATH, teaser: bitgetAllianceTeaser(locale) });
  if (bybitStocksCampaignActive()) rows.push({ id: "bybit-stocks", venue: "bybit", name: "Bybit", path: BYBIT_STOCKS_PATH, teaser: bybitStocksTeaser(locale) });
  if (binanceOctoberPromotable({ locale, market })) rows.push({ id: "binance-october", venue: "binance", name: "Binance", path: BINANCE_OCTOBER_PATH, teaser: binanceOctoberTeaser(locale) });
  return rows;
}
function FeaturedCampaignRows({ locale, market }) {
  return featuredCampaigns(locale, market).map(({ id, venue, name, path, teaser }) => {
    const href = localizedHref(path, { locale, market });
    return (
      <li key={id} className="h7-feat" data-featured-campaign={id}>
        <span className="h7-ic h7-ic-event" data-hot="true">{teaser.tag}</span>
        <span className="h7-iv"><BrandMark slug={venue} compact />{name}</span>
        <a className="h7-it" href={href} data-cta-kind="research" data-cta-platform={venue} data-cta-placement="home-featured-campaign">
          {teaser.title}
          <small className="campaign-brief-summary" dir="auto">{teaser.body}</small>
        </a>
        <a className="h7-iw" href={href} tabIndex={-1} aria-hidden="true">{teaser.go}</a>
      </li>
    );
  });
}

function IntelBlock({ intel, t, locale, market, venues }) {
  const [open, setOpen] = useState(null);
  const now = useNow();
  if (!intel) {
    // Feed still loading or unavailable: the featured campaign still shows (fail closed for exchange notices only).
    if (!featuredCampaigns(locale, market).length) return null;
    return (
      <section className="h7-in h7-intel" id="h7-intel" aria-label={t.inH}>
        <div className="h7-ih"><div><span className="h7-live"><i aria-hidden="true" />{LIVE[locale] || "Live"}</span><h2>{t.inH}</h2></div>{t.inSub ? <p>{t.inSub}</p> : null}</div>
        <ul className="h7-il"><FeaturedCampaignRows locale={locale} market={market} /></ul>
      </section>
    );
  }
  const asOf = fmtAsOf(intel.generatedAt, locale);
  return (
    <section className="h7-in h7-intel" id="h7-intel" aria-label={t.inH}>
      <div className="h7-ih"><div><span className="h7-live"><i aria-hidden="true" />{LIVE[locale] || "Live"}</span><h2>{t.inH}</h2></div>{t.inSub ? <p>{t.inSub}</p> : null}</div>
      <ul className="h7-il">
        <FeaturedCampaignRows locale={locale} market={market} />
        {spread(intel.items, 10, 2).map((raw) => {
          const i = applyCampaignBriefs(raw, intel, locale);
          return (
          <li key={i.id}>
            <span className={`h7-ic h7-ic-${i.category}`} data-hot={i.category === "event" ? "true" : undefined}>{t.inCat[i.category]}</span>
            <span className="h7-iv"><BrandMark slug={i.venue} compact />{nameOf(i.venue)}</span>
            <a className="h7-it" href={updateHref(i, locale, { market })}>
              {i.title}
              {i.brief && i.summary ? <small className="campaign-brief-summary" dir="auto">{i.summary}</small> : null}
              
              <CampaignBriefFacts brief={i.brief} locale={locale} />
              <span className="h7-sr"> ({t.inOpen})</span>
            </a>
            <time dateTime={i.publishedAt}>{timeAgo(now - Date.parse(i.publishedAt), locale)}</time>
            <button type="button" className="h7-iw" aria-haspopup="dialog" onClick={() => setOpen(i)}>{t.inBtn}</button>
          </li>
          );
        })}
      </ul>
      <p className="h7-ia">{t.inAsOf(asOf)}</p>
      {open && <IntelSheet item={open} venues={venues} t={t} locale={locale} market={market} onClose={() => setOpen(null)} />}
    </section>
  );
}

function IntelSection({ t, locale, market, venues }) {
  const intel = useIntel(venues);
  const briefFeed = useCampaignBriefs(intel && typeof intel === "object" ? intel : { items: [] });
  return <IntelBlock intel={intel && typeof intel === "object" ? briefFeed : intel} t={t} locale={locale} market={market} venues={venues} />;
}

// Everything under the trust row. State for the calculator lives in HomeV7 (the hero ledger reads the same volume,
// product and maker/taker choice), so the controls arrive as props.
export function HomeBelowFold({ t, locale, market, movers, vol, setVol, mode, setMode, product, setProduct, calc, priced }) {
  const rowsRef = useRef(null), rowEls = useRef([]);
  const onVol = (e) => { const d = e.target.value.replace(/[^0-9]/g, ""); setVol(Math.min(Number(d) || 0, 1e8)); };
  return (
    <>
      {/* Flash rail (2026-10-12): the latest 5 items of the 7x24 stream, first block of the deferred home section (its
          id is the hydration target, so the chunk loads as the rail approaches). */}
      <FlashRail locale={locale} />
      <DataRail locale={locale} />
      <MoversBoard locale={locale} initial={movers} />
      <section className="h7-in h7-calc" id="h7-calc">
        <div>
          <h2>{t.calcH}</h2>
          <label className="h7-vin"><span>$</span><input value={vol ? vol.toLocaleString("en-US") : ""} onChange={onVol} inputMode="numeric" aria-label={t.volLabel} /><small>{t.perMonth}</small></label>
          <input className="h7-range" type="range" min="0" max="1000" step="1" value={toPos(vol || VMIN)} style={{ "--p": `${toPos(vol || VMIN) / 10}%` }} onChange={(e) => setVol(toVol(Number(e.target.value)))} aria-label={t.volLabel} aria-valuetext={`${usd(vol)} ${t.perMonth}`} />
          <div className="h7-range-scale" aria-hidden="true">{[[1e4, "$10K"], [1e5, "$100K"], [1e6, "$1M"], [5e6, "$5M"]].map(([v, l]) => <span key={l} style={{ "--x": `${toPos(v) / 10}%` }}>{l}</span>)}</div>
          <div className="h7-ctl">
            {CHIPS.map((c) => <button key={c} type="button" aria-pressed={vol === c} onClick={() => setVol(c)}>${c / 1000}K</button>)}
            <div className="h7-seg" role="group" aria-label={`${t.perpL} / ${t.spotL}`}><button type="button" aria-pressed={product === "perp"} onClick={() => setProduct("perp")}>{t.perpL}</button><button type="button" aria-pressed={product === "spot"} onClick={() => setProduct("spot")}>{t.spotL}</button></div>
            <div className="h7-seg" role="group" aria-label="maker / taker"><button type="button" aria-pressed={mode === "maker"} onClick={() => setMode("maker")}>{t.maker}</button><button type="button" aria-pressed={mode === "taker"} onClick={() => setMode("taker")}>{t.taker}</button></div>
          </div>
          <p className="h7-vd" aria-live="polite">{!vol ? t.calcEmpty : <>{calc.best && <>{t.lowest(calc.best.name, usd(calc.best.net))}<br /></>}{calc.most && calc.most.save > 0 && t.most(calc.most.name, usd(calc.most.save))}</>}</p>
          <a className="h7-ln h7-all" href={localizedHref("/exchanges", { locale })}>{t.all}</a>
          {vol > 0 && <a className="h7-ln h7-all h7-rates" href={buildDecisionReturnHref({ kind: "cost", locale, instrument: product === "spot" ? "spot" : "futures", order: mode, volume: vol, basis: "rebate" }) || localizedHref("/rates", { locale })}>{t.ratesGo}</a>}
        </div>
        <div className="h7-rows" ref={rowsRef}>
          {calc.rows.map((r, i) => (
            <div key={r.slug} ref={(e) => { rowEls.current[i] = e; }} className={`h7-xr${calc.best?.slug === r.slug ? " best" : ""}${r.share ? "" : " nr"}`}>
              <p className="h7-xn"><BrandMark slug={r.slug} compact /><b>{r.name}</b><span className="h7-bd">{r.share ? `${t.upTo} ${formatPercent(locale, Math.round(r.share * 100))}` : t.pending}</span></p>
              <div className="h7-am">{r.net == null ? "–" : <>{r.share ? <s>{usd(r.gross)}</s> : null}<Roll value={r.net} /><small className="h7-basis" data-basis={r.share ? "rebate" : "base"}>{r.share ? t.basisNet : t.basisBase}</small></>}</div>
              <p className="h7-meta"><span>{t.rate} {r.maker != null ? `${formatFee(r.maker, locale)} / ${formatFee(r.taker, locale)}` : t.unchecked}</span>{r.code && <span>{t.code} <code>{r.code}</code></span>}</p>
              <Cta v={r} locale={locale} className="h7-btn h7-sm" placement="home-v7-row"><span>{t.open}</span><span className="h7-sr"> {r.name}</span></Cta>
              <a className="h7-dt" href={vol > 0 ? appendCostScenarioQuery(localizedHref(`/exchanges/${r.slug}`, { locale, product: product === "spot" ? "spot" : "perpetuals" }), { instrument: product === "spot" ? "spot" : "futures", order: mode, volume: vol, basis: r.share ? "rebate" : "base" }) : localizedHref(`/exchanges/${r.slug}`, { locale })}>{t.detail}<span className="h7-sr"> {r.name}</span></a>
            </div>
          ))}
        </div>
      </section>
      <FundingBoard locale={locale} />
      <IntelSection t={t} locale={locale} market={market} venues={priced} />
      <TelegramBlock locale={locale} />
      <LocalMarketBrief locale={locale} />
    </>
  );
}
