import CardArt from "../shared/CardArt.jsx";
import { HomeCalculator } from "./HomeCalculator.jsx";
// Home v7, below the first viewport: the savings calculator, the live funding board, the announcement stream and the
// Telegram block. HomeV7.jsx renders this module synchronously on the server (full HTML for crawlers and no-JS
// readers) and loads it in the browser only when the calculator scrolls near the viewport (DeferUntilVisible), so the
// first-screen bundle stays small. Markup and copy are unchanged from the previous inline version.
import { useEffect, useRef, useState } from "react";
import { TelegramBlock } from "./home7-telegram.jsx";
import { FollowBand } from "./home7-follow.jsx";
import { FundingBoard } from "./home7-funding.jsx";
import { startJsonPolling } from "../shared/json-polling.js";
import { feeFact } from "../../data/exchange-facts.js";
import { localizedHref } from "../../data/locale-routing.js";
import { formatPercent } from "../../data/format-percent.js";
import { formatFee } from "../../data/format-fee.js";
import { updateHref } from "../../data/activity-update.js";
import { eventSourceStateLabel, sharedOfficialEventItems, visibleEventSourceItems } from "../../data/event-source.js";
import { homeSignupLabel } from "../../data/home-cta-label.js";
import { formatSgt } from "../../data/local-time.js";
import { applyCampaignBriefs } from "../../data/campaign-briefs.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { CampaignBriefFacts } from "../shared/CampaignBriefFacts.jsx";
import { useCampaignBriefs } from "../shared/useCampaignBriefs.js";
import { Cta, nameOf } from "./home7-shared.jsx";
import { LocalMarketBrief } from "./home7-local-market.jsx";
import { LiveBadge } from "./home7-board-motion.jsx";
import { CALENDAR_PATH, ETF_FLOWS_LIVE, ETF_FLOWS_PATH } from "../../data/intel-tools-routes.js";
import { intelToolLinks } from "../../data/intel-tools-links.js";
import { FUNDING_RATES_PATH, LIQUIDATIONS_PATH, dataPageCopy } from "../../data/market-data-pages-nav.js";
import { fiatLabels } from "../../data/fiat-labels.js";
import { FiatGlyph } from "../deposit/FiatBadges.jsx";
import { CRYPTO_CARDS_PATH, depositPath } from "../../data/deposit-routes.js";

// Daily market data (2026-10-13): links to the data pages people come back to every day (pill list, h7-coins styles);
// below the fold, so the entry stays inside its budget.
const DATA_RAIL_COPY = {
  en: { title: "Daily market data", lead: "" },
  "zh-Hans": { title: "每日市场数据", lead: "" },
  es: { title: "Datos de mercado diarios", lead: "Fechas macro y plazos de exchanges de esta semana, liquidaciones y funding." },
  "pt-BR": { title: "Dados de mercado diários", lead: "Datas macro e prazos de corretoras desta semana, liquidações e funding." },
  tr: { title: "Günlük piyasa verileri", lead: "Haftanın makro tarihleri, borsa son tarihleri, tasfiyeler ve fonlama." },
  vi: { title: "Dữ liệu thị trường hằng ngày", lead: "Lịch vĩ mô, hạn chót của sàn trong tuần, thanh lý và funding." },
  id: { title: "Data pasar harian", lead: "Jadwal makro dan tenggat bursa minggu ini, likuidasi, dan funding." },
  ja: { title: "毎日のマーケットデータ", lead: "今週の経済指標、取引所の締切日、清算、資金調達率。" },
  ko: { title: "매일 보는 시장 데이터", lead: "이번 주 경제지표, 거래소 마감일, 청산, 펀딩비." },
  "zh-Hant": { title: "每日市場數據", lead: "這週的總經日程、交易所截止日、爆倉和資金費率。" },
  de: { title: "Tägliche Marktdaten", lead: "Makrotermine und Börsenfristen dieser Woche, Liquidationen und Funding." },
  fr: { title: "Données de marché quotidiennes", lead: "Dates macro et échéances des plateformes cette semaine, liquidations et funding." },
  it: { title: "Dati di mercato giornalieri", lead: "Date macro e scadenze degli exchange di questa settimana, liquidazioni e funding." },
  ru: { title: "Рыночные данные каждый день", lead: "Макрособытия и сроки бирж на этой неделе, ликвидации и фандинг." },
  ar: { title: "بيانات السوق اليومية", lead: "مواعيد الاقتصاد الكلي وآجال المنصات هذا الأسبوع، والتصفيات ومعدلات التمويل." },
  ur: { title: "روزانہ مارکیٹ ڈیٹا", lead: "اس ہفتے کی میکرو تاریخیں، ایکسچینج کی آخری تاریخیں، لیکویڈیشنز اور فنڈنگ۔" },
};
// Compact USD for the rail: $1.13B / $776M / $48K (lower bound figures; the data page carries the methodology).
const railUsd = (n) => !Number.isFinite(n) ? null : n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${Math.round(n / 1e6)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`;
const railRate = (n) => !Number.isFinite(n) ? null : `${n >= 0 ? "+" : "−"}${Math.abs(n * 100).toFixed(4)}%`;
// Short tile words per locale: the long / short side of a liquidation.
const RAIL_LABELS = {
  en: { long: "Long", short: "Short" }, "zh-Hans": { long: "多", short: "空" },
  "zh-Hant": { long: "多", short: "空" }, es: { long: "Largos", short: "Cortos" },
  "pt-BR": { long: "Longs", short: "Shorts" }, fr: { long: "Longs", short: "Shorts" },
  de: { long: "Long", short: "Short" }, it: { long: "Long", short: "Short" },
  ja: { long: "ロング", short: "ショート" }, ko: { long: "롱", short: "숏" },
  ru: { long: "Лонги", short: "Шорты" }, uk: { long: "Лонги", short: "Шорти" },
  tr: { long: "Long", short: "Short" }, id: { long: "Long", short: "Short" },
  vi: { long: "Long", short: "Short" }, ar: { long: "شراء", short: "بيع" },
  ur: { long: "لانگ", short: "شارٹ" },
};
// Macro event kinds read as their market acronyms in every language; exchange rows stay on the calendar page.
const MACRO_KINDS = { fomc: "FOMC", cpi: "CPI", nfp: "NFP", pce: "PCE", gdp: "GDP" };
const FUNDING_SPAN = 0.0003; // the gauge reads ±0.03% per 8 h; larger rates pin to the end
const CAL_DAYS = 14;
const DAY_MS = 86_400_000;
// 2026-10-22 owner: the block showed only three bare links ("no data"). 2026-10-23 owner ("lifeless text"): three stat
// tiles, each a link to its data page, with the live figure and a mini chart drawn from data the home already reads:
// /api/market-events/summary (24 h liquidations + hourly history, BTC funding; polled every minute) and the calendar
// snapshot /intel/calendar.json (read once). Before the first read, or when a read fails, a tile keeps its label, an
// empty figure line and an empty chart frame of the same size (no CLS, nothing invented).
// The small summary endpoint (~66 KB), not the 1.7 MB market-events file: the home must stay light.
function useRailFeed() {
  const [feed, setFeed] = useState(null);
  useEffect(() => startJsonPolling({
    request: "/api/market-events/summary", intervalMs: 60000, immediate: true, cache: "no-cache",
    isData: (next) => Boolean(next && typeof next === "object" && next.generatedAt), onData: setFeed, onError: () => {},
  }), []);
  return feed;
}
function useCalendar() {
  const [events, setEvents] = useState(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/intel/calendar.json", { signal: ctrl.signal, headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (Array.isArray(j?.events)) setEvents(j.events.filter((e) => Number.isFinite(Date.parse(e?.start)))); })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);
  return events;
}
function useInViewAttr(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => { el.toggleAttribute("data-inview", entry.isIntersecting); }, { rootMargin: "80px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
const relIn = (ms, locale) => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const h = ms / 3_600_000;
  return h < 1 ? rtf.format(Math.max(1, Math.round(ms / 60000)), "minute") : h < 48 ? rtf.format(Math.round(h), "hour") : rtf.format(Math.round(h / 24), "day");
};
const utcDay = (ms, locale) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }).format(ms);

const RAIL_ICONS = {
  calendar: <svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /><circle cx="15.5" cy="15" r="1.6" /></svg>,
  liq: <svg viewBox="0 0 24 24"><path d="M12 3c.5 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2.4 1.2-3.9 2.5-5 .2 1.7 1 2.8 2 3.2C11 9.2 11 6 12 3z" /></svg>,
  funding: <svg viewBox="0 0 24 24"><path d="M4 16a8 8 0 0 1 16 0" /><path d="M12 16l4-5" /><circle cx="12" cy="16" r="1.4" /><path d="M4 20h16" /></svg>,
};

function RailTile({ href, kind, label, figure, sub, children, tone }) {
  return <li data-k={kind} data-live={figure ? "" : undefined} data-tone={tone}>
    <a href={href}>
      <span className="h7-mk-top"><span className="h7-mk-ic" aria-hidden="true">{RAIL_ICONS[kind]}</span><b>{label}</b><i className="h7-mk-dot" aria-hidden="true" /></span>
      <span className="h7-mk-fig">{figure ? <span key={figure} dir="ltr" data-rail-figure="">{figure}</span> : <span className="h7-mk-none">—</span>}</span>
      <span className="h7-mk-sub">{sub || " "}</span>
      <span className="h7-mk-viz" aria-hidden="true">{children}</span>
    </a>
  </li>;
}

function DataRail({ locale }) {
  const c = DATA_RAIL_COPY[locale] || (String(locale || "").startsWith("zh") ? DATA_RAIL_COPY["zh-Hans"] : DATA_RAIL_COPY.en);
  const links = intelToolLinks(locale), nav = dataPageCopy(locale).nav;
  const ref = useRef(null);
  useInViewAttr(ref);
  const feed = useRailFeed();
  const events = useCalendar();
  const l = RAIL_LABELS[locale] || (String(locale || "").startsWith("zh") ? RAIL_LABELS["zh-Hans"] : RAIL_LABELS.en);
  // Clock for countdowns: the feed's own read time (minute steps), so the tiles never tick on their own.
  const now = feed ? Date.parse(feed.generatedAt) || null : null;

  // Liquidations: 24 h total, long/short split, hourly stacked bars from the summary history.
  const h24 = feed?.liquidations?.h24;
  const total = railUsd(h24?.totalUsd);
  const longPct = total && h24.totalUsd > 0 ? Math.round((h24.longUsd / h24.totalUsd) * 100) : null;
  const hourly = Array.isArray(feed?.history?.hourly) ? feed.history.hourly.filter((r) => Number.isFinite(r?.totalUsd)).slice(-24) : [];
  const peak = Math.max(1, ...hourly.map((r) => r.totalUsd));

  // Funding: Binance BTC rate on a ±0.03% gauge; OKX as the second reading.
  const btc = feed?.funding?.rows?.find((r) => r.symbol === "BTC");
  const btcRate = railRate(btc?.binanceRate);
  const okxRate = railRate(btc?.okxRate);
  const gauge = Number.isFinite(btc?.binanceRate) ? Math.max(-1, Math.min(1, btc.binanceRate / FUNDING_SPAN)) : null;

  // Calendar: the next macro release, and a 14-day strip of how many dated events each day holds.
  const clock = now ?? (events ? Date.now() : null);
  const upcoming = events && clock ? events.filter((e) => Date.parse(e.start) > clock).sort((a, b) => Date.parse(a.start) - Date.parse(b.start)) : [];
  const nextMacro = upcoming.find((e) => MACRO_KINDS[e.kind]);
  const dayStart = clock ? Math.floor(clock / DAY_MS) * DAY_MS : 0;
  const days = clock ? Array.from({ length: CAL_DAYS }, (_, i) => {
    const from = dayStart + i * DAY_MS;
    const list = upcoming.filter((e) => { const t = Date.parse(e.start); return t >= from && t < from + DAY_MS; });
    return { n: list.length, macro: list.some((e) => MACRO_KINDS[e.kind]), next: nextMacro ? Date.parse(nextMacro.start) >= from && Date.parse(nextMacro.start) < from + DAY_MS : false };
  }) : [];
  const dayPeak = Math.max(1, ...days.map((d) => d.n));
  const nextAt = nextMacro ? Date.parse(nextMacro.start) : null;

  return <section className="h7-in h7-coins h7-data" aria-labelledby="h7-data-h" data-testid="home-data-rail" ref={ref}>
    <div className="h7-coins-head"><h2 id="h7-data-h">{c.title}</h2></div>
    {c.lead && <p className="h7-coins-lead">{c.lead}</p>}
    <ul className="h7-mk">
      {ETF_FLOWS_LIVE ? <RailTile href={localizedHref(ETF_FLOWS_PATH, { locale })} kind="calendar" label={links.etf} /> : null}
      <RailTile href={localizedHref(CALENDAR_PATH, { locale })} kind="calendar" label={links.calendar}
        figure={nextMacro ? MACRO_KINDS[nextMacro.kind] : null}
        sub={nextAt ? `${relIn(nextAt - clock, locale)} · ${utcDay(nextAt, locale)} UTC` : null}>
        <span className="h7-mk-cal">{(days.length ? days : Array.from({ length: CAL_DAYS }, () => ({ n: 0 }))).map((d, i) => <i key={i} data-macro={d.macro ? "" : undefined} data-next={d.next ? "" : undefined} style={{ transform: `scaleY(${d.n ? 0.25 + 0.75 * (d.n / dayPeak) : 0.12})` }} />)}</span>
      </RailTile>
      <RailTile href={localizedHref(LIQUIDATIONS_PATH, { locale })} kind="liq" label={nav.liquidations} figure={total}
        sub={longPct != null ? <><span data-side="long">{l.long} {longPct}%</span><span data-side="short">{l.short} {100 - longPct}%</span></> : null}>
        <span className="h7-mk-bars">{(hourly.length ? hourly : Array.from({ length: 24 }, () => null)).map((r, i) => r
          ? <i key={i} style={{ transform: `scaleY(${Math.max(0.04, r.totalUsd / peak)})`, "--lp": `${r.totalUsd > 0 ? Math.round((r.longUsd / r.totalUsd) * 100) : 0}%` }} />
          : <i key={i} data-empty="" />)}</span>
        <span className="h7-mk-split"><i style={{ transform: `scaleX(${longPct != null ? longPct / 100 : 0})` }} /></span>
      </RailTile>
      <RailTile href={localizedHref(FUNDING_RATES_PATH, { locale })} kind="funding" label={`${nav.funding} · BTC`} figure={btcRate}
        tone={gauge == null ? undefined : gauge >= 0 ? "pos" : "neg"}
        sub={okxRate ? `OKX ${okxRate}` : null}>
        <span className="h7-mk-gauge" dir="ltr" data-side={gauge == null ? undefined : gauge >= 0 ? "pos" : "neg"}>
          <span className="h7-mk-track"><i style={{ transform: `scaleX(${gauge == null ? 0 : Math.abs(gauge)})` }} /><b style={{ left: `${50 + (gauge ?? 0) * 50}%` }} /></span>
          <span className="h7-mk-scale"><span>−0.03%</span><span>0</span><span>+0.03%</span></span>
        </span>
      </RailTile>
    </ul>
  </section>;
}
// Deposit & withdraw (出入金, 2026-10-15): one compact row into the hub and the card comparison; static copy, no data
// fetch, no motion. Sits after the market modules (whale watch, tokenized stocks) and before the calculator.
function FiatRail({ locale }) {
  const l = fiatLabels(locale);
  const hub = localizedHref(depositPath("en"), { locale });
  const items = [[hub, l.homeItems.card, "card"], [hub, l.homeItems.bank, "bank"], [localizedHref(CRYPTO_CARDS_PATH, { locale }), l.homeItems.cryptoCard, "cryptoCard"]];
  return <section className="h7-in h7-coins h7-fiat" aria-labelledby="h7-fiat-h" data-testid="home-fiat-rail">
    <div className="h7-coins-head"><h2 id="h7-fiat-h"><a href={hub}>{l.homeTitle}</a></h2></div>
    <p className="h7-coins-lead">{l.homeLead}</p>
    <ul className="h7-coins-list">{items.map(([href, label, key]) => <li key={key}><a href={href} data-fiat-item={key}><FiatGlyph kind={key} size={16} /><b>{label}</b></a></li>)}</ul>
  </section>;
}
import { BINANCE_OCTOBER_PATH, binanceOctoberPromotable, binanceOctoberTeaser } from "../../data/binance-october.js";
import { BYBIT_STOCKS_PATH, bybitStocksCampaignActive, bybitStocksTeaser } from "../../data/bybit-stocks.js";
import { BITGET_ALLIANCE_PATH, bitgetAlliancePromotable, bitgetAllianceTeaser } from "../../data/bitget-alliance.js";
import { KRAKEN_USDG_PATH, krakenUsdgPromotable, krakenUsdgTeaser } from "../../data/kraken-usdg.js";

import { withoutTurkeyUnlisted } from "../../data/partner-geo-policy.js";

import { announcementSnapshot, announcementStatusLabel } from "../shared/announcement-snapshot.js";
import { scheduleVisible } from "../shared/visibility-scheduler.js";

const INTEL_URL = "/intel/official-announcements.json";
function intelView(feed, locale, now = Date.parse(feed?.renderedAt || feed?.generatedAt) || 0) {
  feed = announcementSnapshot(feed, now);
  const sourceItems = sharedOfficialEventItems(feed);
  const view = visibleEventSourceItems(sourceItems, { locale, now });
  // Türkiye pages show no notice from an SPK-listed venue (tr-bitget-sweep).
  const items = withoutTurkeyUnlisted(view.items, { locale }, (item) => [item.venue, item.rawTitle || item.title, item.url]);
  return { ...feed, ...view, items: items.slice(0, 40), generatedAt: feed.generatedAt, renderedAt: feed.renderedAt };
}

function useIntel(venues, locale, initialOfficialAnnouncements, renderedAt) {
  const [feed, setFeed] = useState(() => intelView(initialOfficialAnnouncements, locale, Date.parse(initialOfficialAnnouncements?.renderedAt || renderedAt || initialOfficialAnnouncements?.generatedAt) || 0));
  const slugs = venues.map((v) => v.slug).join(",");
  useEffect(() => {
    return startJsonPolling({
      request: INTEL_URL, intervalMs: 5 * 60 * 1000, cache: "no-cache",
      onData: next => setFeed(intelView(next, locale, Date.now())),
      onError: () => setFeed(current => intelView({ ...current, status: "UNAVAILABLE" }, locale, Date.now())),
    });
  }, [slugs, locale]);
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
              <Cta v={r} locale={locale} className="h7-btn h7-sm h7-sh-b" placement="home-v7-intel"><span>{homeSignupLabel(t, r)}</span><span className="h7-sr"> {r.name}</span></Cta>
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
function useNow(snapshot, stepMs = 60 * 1000) {
  // Deferred hydration may happen minutes after SSR. Reuse the serialized feed clock first.
  const [now, setNow] = useState(() => Number.isFinite(Date.parse(snapshot)) ? Date.parse(snapshot) : null);
  useEffect(() => { setNow(Date.now()); return scheduleVisible(setNow, stepMs); }, [stepMs]);
  return now;
}
function timeAgo(ms, locale) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 60) return rtf.format(-min, "minute");
  const h = Math.round(min / 60);
  return h < 24 ? rtf.format(-h, "hour") : rtf.format(-Math.round(h / 24), "day");
}
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
function featuredCampaigns(locale, market, now) {
  // Without a serialized clock, wait for mount before making deadline-dependent claims.
  if (now === null) return [];
  const rows = [];
  // Kraken 5M USDG Challenge (owner 2026-10-13, strong push) first, Bitget Alliance right after it: both stay featured.
  if (krakenUsdgPromotable({ locale, market, now })) rows.push({ id: "kraken-usdg", venue: "kraken", name: "Kraken", path: KRAKEN_USDG_PATH, teaser: krakenUsdgTeaser(locale) });
  if (bitgetAlliancePromotable({ locale, market, now })) rows.push({ id: "bitget-alliance", venue: "bitget", name: "Bitget.com", path: BITGET_ALLIANCE_PATH, teaser: bitgetAllianceTeaser(locale) });
  if (bybitStocksCampaignActive(now)) rows.push({ id: "bybit-stocks", venue: "bybit", name: "Bybit", path: BYBIT_STOCKS_PATH, teaser: bybitStocksTeaser(locale) });
  if (binanceOctoberPromotable({ locale, market, now })) rows.push({ id: "binance-october", venue: "binance", name: "Binance", path: BINANCE_OCTOBER_PATH, teaser: binanceOctoberTeaser(locale) });
  return rows;
}
function FeaturedCampaignRows({ locale, market, now }) {
  return featuredCampaigns(locale, market, now).map(({ id, venue, name, path, teaser }) => {
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

function IntelBlock({ intel, t, locale, market, venues, renderedAt }) {
  const [open, setOpen] = useState(null);
  const now = useNow(intel?.renderedAt || renderedAt || intel?.generatedAt);
  if (!intel) {
    // Feed still loading or unavailable: the featured campaign still shows (fail closed for exchange notices only).
    if (!featuredCampaigns(locale, market, now).length) return null;
    return (
      <section className="h7-in h7-intel" id="h7-intel" aria-label={t.inH}>
        <div className="h7-ih"><div><span className="h7-live"><i aria-hidden="true" />{announcementStatusLabel("unavailable", locale)}</span><h2>{t.inH}<LiveBadge locale={locale} /></h2></div>{t.inSub ? <p>{t.inSub}</p> : null}</div>
        <ul className="h7-il"><FeaturedCampaignRows locale={locale} market={market} now={now} /></ul>
      </section>
    );
  }
  const asOf = fmtAsOf(intel.generatedAt, locale);
  const freshness = announcementSnapshot(intel, now ?? (Date.parse(intel.renderedAt) || 0)).freshness;
  return (
    <section className="h7-in h7-intel" id="h7-intel" aria-label={t.inH}>
      <div className="h7-ih"><div><span className="h7-live"><i aria-hidden="true" />{announcementStatusLabel(freshness, locale)}</span><h2>{t.inH}<LiveBadge locale={locale} /></h2></div>{t.inSub ? <p>{t.inSub}</p> : null}</div>
      <ul className="h7-il">
        <FeaturedCampaignRows locale={locale} market={market} now={now} />
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
            <time dateTime={i.publishedAt}>{now === null ? formatSgt(i.publishedAt, locale) : timeAgo(now - Date.parse(i.publishedAt), locale)}</time>
            <button type="button" className="h7-iw" aria-haspopup="dialog" onClick={() => setOpen(i)}>{t.inBtn}</button>
          </li>
          );
        })}
      </ul>
      {!intel.items.length ? <p className="h7-ia" role="status">{eventSourceStateLabel(intel.state, locale)}</p> : null}
      <p className="h7-ia">{t.inAsOf(asOf)}</p>
      {open && <IntelSheet item={open} venues={venues} t={t} locale={locale} market={market} onClose={() => setOpen(null)} />}
    </section>
  );
}

function IntelSection({ t, locale, market, venues, initialOfficialAnnouncements, renderedAt }) {
  const intel = useIntel(venues, locale, initialOfficialAnnouncements, renderedAt);
  const briefFeed = useCampaignBriefs(intel && typeof intel === "object" ? intel : { items: [] });
  return <IntelBlock renderedAt={renderedAt} intel={intel && typeof intel === "object" ? briefFeed : intel} t={t} locale={locale} market={market} venues={venues} />;
}

// Latest analysis (owner 2026-10-23: "a text list"; lead review: OG cards repeated the title and all looked alike).
// Article cards whose thumbnail is drawn here, with no text from the title: a per-category palette and glyph, a faint
// grid, a seeded glow so neighbouring cards differ, and the article's main exchange as a large official tile (an
// exchange named in the slug first, else the first related venue for exchange-led categories). No extra image
// requests beyond the brand tiles the page already uses. One link per article (crawl tests count them); the frame
// has a fixed 1200:630 ratio (no CLS). Desktop: one lead card + four, then three compact rows; phones scroll the five
// cards sideways.
const LATEST_CARDS = 5;

function LatestCard({ item, lead = false }) {
  return <li data-lead={lead ? "" : undefined}>
    <a href={item.href}>
      <CardArt item={item} />
      <span className="h7-lt-meta">{item.category ? <span className="h7-lt-cat">{item.category}</span> : null}<time dateTime={item.publishedAt}>{item.relativeDate}</time></span>
      <span className="h7-lt-t">{item.title}</span>
    </a>
  </li>;
}
// Hub links under the list, in the reader's language.
const LATEST_LINKS = {
  en: ["All analysis", "Compare exchanges", "Exchange fee index"], "zh-Hans": ["全部分析", "交易所对比", "交易所费率指数"],
  "zh-Hant": ["全部分析", "交易所比較", "交易所費率指數"], es: ["Todos los análisis", "Comparar exchanges", "Índice de comisiones"],
  "pt-BR": ["Todas as análises", "Comparar corretoras", "Índice de taxas"], fr: ["Toutes les analyses", "Comparer les plateformes", "Indice des frais"],
  de: ["Alle Analysen", "Börsen vergleichen", "Gebührenindex"], it: ["Tutte le analisi", "Confronta exchange", "Indice delle commissioni"],
  ja: ["すべての分析", "取引所を比較", "取引所手数料インデックス"], ko: ["전체 분석", "거래소 비교", "거래소 수수료 지수"],
  ru: ["Вся аналитика", "Сравнить биржи", "Индекс комиссий бирж"], uk: ["Уся аналітика", "Порівняти біржі", "Індекс комісій бірж"],
  tr: ["Tüm analizler", "Borsaları karşılaştır", "Borsa ücret endeksi"], id: ["Semua analisis", "Bandingkan bursa", "Indeks biaya bursa"],
  vi: ["Tất cả phân tích", "So sánh sàn", "Chỉ số phí sàn"], ar: ["كل التحليلات", "قارن المنصات", "مؤشر رسوم المنصات"],
  ur: ["تمام تجزیے", "ایکسچینجز کا موازنہ", "ایکسچینج فیس انڈیکس"],
};

// Everything under the trust row. State for the calculator lives in HomeV7 (the hero ledger reads the same volume,
// product and maker/taker choice), so the controls arrive as props.
export function HomeBelowFold({ renderedAt, t, locale, market, whales, fundingFeed, vol, setVol, mode, setMode, product, setProduct, calc, priced, initialOfficialAnnouncements, homeLatest = [] }) {
  const latestLinks = LATEST_LINKS[locale] || (String(locale || "").startsWith("zh") ? LATEST_LINKS["zh-Hans"] : LATEST_LINKS.en);
  return (
    <>
      {/* Owner 2026-10-14: no flash rail on home (the /flash page and its footer link stay). */}
      <DataRail locale={locale} />
      {/* Flow (2026-10-23): the live data run together (daily data, funding, analysis), then the actions (deposit,
          calculator), then the notices reference list and Telegram. */}
      <FundingBoard locale={locale} initialFeed={fundingFeed} />
      <section className="h7-in h7-latest" aria-labelledby="h7-latest-h" data-home-latest="">
        <h2 id="h7-latest-h">{t.latestAnalysis || "Latest analysis"}</h2>
        <ul className="h7-lt">{homeLatest.slice(0, LATEST_CARDS).map((item, i) => <LatestCard key={item.href} item={item} lead={i === 0} />)}</ul>
        {homeLatest.length > LATEST_CARDS ? <ul className="h7-lt h7-lt-more">{homeLatest.slice(LATEST_CARDS).map((item) => <LatestCard key={item.href} item={item} />)}</ul> : null}
        <nav aria-label={t.latestAnalysis || "Latest analysis"}>
          <a href={localizedHref("/news", { locale })}>{latestLinks[0]}</a>
          <a href={localizedHref("/compare", { locale })}>{latestLinks[1]}</a>
          <a href={localizedHref("/data/exchange-fee-index", { locale })}>{latestLinks[2]}</a>
        </nav>
      </section>
      <FiatRail locale={locale} />
      <HomeCalculator t={t} locale={locale} vol={vol} setVol={setVol} mode={mode} setMode={setMode} product={product} setProduct={setProduct} calc={calc} />
      <IntelSection renderedAt={renderedAt} t={t} locale={locale} market={market} venues={priced} initialOfficialAnnouncements={initialOfficialAnnouncements} />
      <TelegramBlock locale={locale} />
      <FollowBand locale={locale} />
      <LocalMarketBrief locale={locale} />
    </>
  );
}

// Mounted by HomeV7 above the tokenized-stocks strip (owner 2026-10-22); lives in this lazy chunk for the home budget.
export { MoversBoard } from "./home7-movers.jsx";
