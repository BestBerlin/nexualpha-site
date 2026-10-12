// "Where to buy <coin>" (owner 2026-10-12): /coins hub and /coins/<slug> per locale. The answer comes first (which of the
// exchanges we cover list the coin and the main pair), then the venue table (pairs, perpetuals, fees, deposit networks,
// our code and a tracked /go/<venue> link), how-to steps linked to academy lessons, the visitor's country note, FAQ and
// related coins. Owner rules: no fine print or commission notes here (footer/legal only), no price predictions,
// geo-gated sign-up (Türkiye: OKX/Binance/Bybit; neutral locales: none). SSR renders every word; the browser only
// refreshes the price (CoinGecko public endpoint) and runs the hub search.
import React, { useEffect, useMemo, useState } from "react";
import {
  COINS, COIN_VENUE_SLUGS, COIN_YEAR, coinAnswer, coinBySlug, coinCopy, coinCountryNote, coinDataCheckedOn, coinFaq, coinLesson, coinPath,
  coinSignup, fill, formatChange, formatCompactUsd, formatUsd, isCoinListed, joinList, mainPair, perpVenues, primarySignup, relatedCoins,
  spotFeeText, spotVenues, utcStamp, COINS_GENERATED_AT, COIN_NEUTRAL_LOCALES, coinContentLocale,
} from "../../data/coins.js";
import { localizedHref } from "../../data/locale-routing.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "./coins.css";

const RTL = new Set(["ar", "ur"]);
const dirOf = (locale) => (RTL.has(locale) ? "rtl" : "ltr");
const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  if (!market) return href;
  return `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}`;
};
const LTR = ({ children }) => <bdi dir="ltr">{children}</bdi>;

// Our coin description. The server passes the locale's descriptions (content); the hydrating browser reuses the text the
// server rendered (same string, so no mismatch) and, after a client-side navigation, loads the locale module lazily.
const DESCRIPTION_MODULES = import.meta.env.SSR ? {} : import.meta.glob("../../data/coin-content-*.js");
function useDescription(coin, locale, content) {
  const id = coin?.id;
  const [text, setText] = useState(() => {
    if (!id) return null;
    if (content) return content[id] || null;
    if (typeof document === "undefined") return null;
    return document.querySelector(`[data-coin-desc="${id}"]`)?.textContent || null;
  });
  const [loadedFor, setLoadedFor] = useState(id);
  useEffect(() => {
    if (!id || content) return undefined;
    if (loadedFor === id && text) return undefined;
    let cancelled = false;
    const load = DESCRIPTION_MODULES[`../../data/coin-content-${coinContentLocale(locale).toLowerCase()}.js`];
    if (load) load().then((module) => { if (!cancelled) { setText(module.COIN_DESCRIPTIONS?.[id] || null); setLoadedFor(id); } }).catch(() => {});
    return () => { cancelled = true; };
  }, [id, locale]);
  return loadedFor === id || content ? text : null;
}

// Letter mark tinted from the symbol (no third-party logo hotlinking).
function CoinMark({ coin, size = 44 }) {
  let hash = 0;
  for (const ch of coin.symbol) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  const label = coin.symbol.replace(/[^A-Za-z0-9]/g, "").slice(0, 4) || coin.name.slice(0, 2);
  return <span className="nxc-mark" aria-hidden="true" style={{ "--h": hash, inlineSize: size, blockSize: size, fontSize: Math.round(size * (label.length > 3 ? 0.26 : 0.32)) }}>{label}</span>;
}

// ---------------------------------------------------------------- live price (after mount only)
// The server HTML shows the snapshot price with its UTC time. After mount, the page asks one exchange that lists the
// coin against USDT/USDC for its public ticker (CORS-enabled endpoints, no key) and shows that price with its source.
const TICKERS = {
  okx: { url: (s, q) => `https://www.okx.com/api/v5/market/ticker?instId=${s}-${q}`, read: (j) => { const r = j?.data?.[0]; const last = Number(r?.last), open = Number(r?.open24h); return { price: last, change24h: open > 0 ? (last / open - 1) * 100 : null }; } },
  bitget: { url: (s, q) => `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${s}${q}`, read: (j) => { const r = j?.data?.[0]; return { price: Number(r?.lastPr), change24h: Number.isFinite(Number(r?.change24h)) ? Number(r.change24h) * 100 : null }; } },
  binance: { url: (s, q) => `https://api.binance.com/api/v3/ticker/24hr?symbol=${s}${q}`, read: (j) => ({ price: Number(j?.lastPrice), change24h: Number(j?.priceChangePercent) }) },
  "gate-io": { url: (s, q) => `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${s}_${q}`, read: (j) => ({ price: Number(j?.[0]?.last), change24h: Number(j?.[0]?.change_percentage) }) },
};
function tickerSources(coin) {
  const sources = [];
  for (const venue of coin.venues) {
    if (!TICKERS[venue.slug]) continue;
    const quote = ["USDT", "USDC"].find((q) => venue.spot.includes(q));
    if (quote) sources.push({ venue: venue.slug, name: venue.name, quote });
  }
  return sources.slice(0, 2);
}
function useLivePrice(coin) {
  const [live, setLive] = useState(null);
  const slug = coin?.slug;
  useEffect(() => {
    if (!coin || typeof fetch !== "function") return undefined;
    let cancelled = false;
    (async () => {
      for (const source of tickerSources(coin)) {
        try {
          const response = await fetch(TICKERS[source.venue].url(coin.symbol, source.quote), { credentials: "omit" });
          if (!response.ok) continue;
          const { price, change24h } = TICKERS[source.venue].read(await response.json());
          if (!Number.isFinite(price) || price <= 0) continue;
          if (!cancelled) setLive({ at: new Date().toISOString(), price, change24h: Number.isFinite(change24h) ? change24h : null, source: `${source.name} ${coin.symbol}/${source.quote}` });
          return;
        } catch { /* try the next venue; the snapshot stays otherwise */ }
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);
  return live;
}
function priceOf(coin, live) {
  if (live && Number.isFinite(live.price)) return { price: live.price, change24h: live.change24h ?? coin.change24h, live: true };
  return { price: coin.price, change24h: coin.change24h, live: false };
}
const changeTone = (value) => (!Number.isFinite(value) || Math.abs(value) < 0.005 ? "flat" : value > 0 ? "up" : "down");

// ---------------------------------------------------------------- shared bits
function CopyCode({ code, t }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the code stays visible */ }
  };
  return <span className="nxc-code"><span className="nxc-code__label">{t.codeLabel}</span><code translate="no">{code}</code>
    <button type="button" onClick={copy} aria-live="polite">{copied ? t.copied : t.copy}</button></span>;
}

function Crumbs({ locale, market, t, coin }) {
  return <nav className="nxc-crumbs" aria-label="Breadcrumb">
    <a href={localizedHref("/", { locale })}>{t.home}</a><span aria-hidden="true">/</span>
    {coin ? <><a href={hrefFor("/coins", locale, market)}>{t.hubName}</a><span aria-hidden="true">/</span><span aria-current="page">{coin.name}</span></>
      : <span aria-current="page">{t.hubName}</span>}
  </nav>;
}

// ---------------------------------------------------------------- coin page
function PriceCard({ coin, locale, t, live }) {
  const { price, change24h, live: isLive } = priceOf(coin, live);
  return <div className="nxc-price" data-live={isLive ? "true" : undefined}>
    <p className="nxc-price__label">{fill(t.price, { symbol: coin.symbol })}</p>
    <p className="nxc-price__value"><LTR>{formatUsd(price, locale)}</LTR>
      <span className="nxc-change" data-tone={changeTone(change24h)}><LTR>{formatChange(change24h, locale)}</LTR> <small>{t.change24h}</small></span></p>
    <dl className="nxc-price__facts">
      <div><dt>{t.rank}</dt><dd><LTR>#{coin.rank}</LTR></dd></div>
      <div><dt>{t.marketCap}</dt><dd><LTR>{formatCompactUsd(coin.marketCap, locale)}</LTR></dd></div>
    </dl>
    <p className="nxc-price__time">{isLive ? <>{fill(t.live, { time: `${utcStamp(live.at)} UTC` })} · <span translate="no">{live.source}</span></> : fill(t.snapshot, { time: utcStamp(COINS_GENERATED_AT) })}</p>
  </div>;
}

function VenueTable({ coin, locale, market, t }) {
  const neutral = COIN_NEUTRAL_LOCALES.has(locale);
  return <div className="nxc-table-wrap">
    <table className="nxc-table">
      <thead><tr>
        <th scope="col">{t.colExchange}</th><th scope="col">{t.colPairs}</th><th scope="col">{t.colPerp}</th>
        <th scope="col">{t.colFees}</th><th scope="col">{t.colNetworks}</th><th scope="col">{neutral ? t.openProfile : t.colAction}</th>
      </tr></thead>
      <tbody>
        {coin.venues.map((venue) => {
          const signup = coinSignup(venue.slug, coin, { locale, market });
          const fee = spotFeeText(venue.slug, locale);
          return <tr key={venue.slug} data-venue={venue.slug}>
            <th scope="row" data-label={t.colExchange}>
              <a className="nxc-venue" href={hrefFor(`/exchanges/${venue.slug}`, locale, market)}><BrandMark slug={venue.slug} compact /><span translate="no">{venue.name}</span></a>
            </th>
            <td data-label={t.colPairs}>{venue.spot.length
              ? <ul className="nxc-pairs">{venue.spot.slice(0, 6).map((quote) => <li key={quote} translate="no"><LTR>{coin.symbol}/{quote}</LTR></li>)}{venue.spot.length > 6 ? <li className="nxc-pairs__more"><LTR>+{venue.spot.length - 6}</LTR></li> : null}</ul>
              : <span className="nxc-muted">{t.spotNone}</span>}</td>
            <td data-label={t.colPerp}>{venue.perp.length ? <span className="nxc-yes">{fill(t.perpYes, { quotes: venue.perp.join(" · ") })}</span> : <span className="nxc-muted">{t.perpNo}</span>}</td>
            <td data-label={t.colFees}>{fee ? <LTR>{fee}</LTR> : <span className="nxc-muted">{t.feesUnchecked}</span>}</td>
            <td data-label={t.colNetworks} data-empty={venue.networks?.length ? undefined : "true"}>{venue.networks?.length
              ? <span className="nxc-networks" translate="no">{venue.networks.slice(0, 5).join(" · ")}{venue.networks.length > 5 ? ` +${venue.networks.length - 5}` : ""}</span>
              : <span className="nxc-muted">{t.networksUnpublished}</span>}</td>
            <td data-label={neutral ? t.openProfile : t.colAction} className="nxc-action">
              {signup ? <div className="nxc-action__stack">
                {signup.code ? <CopyCode code={signup.code} t={t} /> : null}
                <a className="nxc-btn nxc-btn--small nxc-btn--ghost" href={signup.href} target="_blank" rel="sponsored noopener noreferrer" data-offer-link="go" data-cta-platform={venue.slug} data-cta-placement={`coin-table-${coin.slug}`}>{fill(t.go, { venue: signup.name })}</a>
              </div> : <a className="nxc-link" href={hrefFor(`/exchanges/${venue.slug}`, locale, market)}>{t.openProfile}</a>}
            </td>
          </tr>;
        })}
      </tbody>
    </table>
  </div>;
}

function HowTo({ coin, locale, market, t }) {
  const main = mainPair(coin);
  const first = spotVenues(coin)[0] || coin.venues[0];
  const vars = { coin: coin.name, symbol: coin.symbol, venue: first?.name || "", pair: main?.pair || `${coin.symbol}/USDT` };
  const lessons = [["E04"], ["E05"], ["E06", "E09"], ["E07"], ["E03"]];
  return <ol className="nxc-steps">
    {t.steps.map(([title, body], index) => <li key={index}>
      <span className="nxc-steps__n" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3>{fill(title, vars)}</h3>
        <p>{fill(body, vars)}</p>
        <p className="nxc-steps__links">{lessons[index].map((id) => {
          const lesson = coinLesson(id);
          return lesson ? <a key={id} href={hrefFor(lesson.path, locale, market)} data-coin-lesson={id}>{fill(t.lessonLink, { title: t.lessons[id] })}</a> : null;
        })}</p>
      </div>
    </li>)}
  </ol>;
}

function CountryNote({ coin, locale, market, t }) {
  const note = coinCountryNote(coin, { locale, market });
  if (!note) return null;
  const country = t.countries?.[note.country];
  if (!country) return null;
  const vars = { symbol: coin.symbol, country };
  return <section className="nxc-sec nxc-country" aria-labelledby="nxc-country-h" data-country={note.country}>
    <h2 id="nxc-country-h">{fill(t.countryTitle, vars)}</h2>
    {note.open.length ? <p>{fill(t.countryAvailable, { ...vars, venues: joinList(note.open.map((v) => v.name), locale) })}</p> : <p>{fill(t.countryNone, vars)}</p>}
    {note.restricted.length ? <p>{fill(t.countryRestricted, { ...vars, venues: joinList(note.restricted.map((v) => v.name), locale) })}</p> : null}
    {note.turkey && !COIN_NEUTRAL_LOCALES.has(locale) ? <p>{t.countryTurkey}</p> : null}
  </section>;
}

function CoinLink({ coin, locale, market }) {
  return <a className="nxc-related__link" href={hrefFor(coinPath(coin.slug), locale, market)}>
    <CoinMark coin={coin} size={36} /><span><b>{coin.name}</b><small translate="no">{coin.symbol}</small></span>
  </a>;
}

export function CoinPage({ locale = "en", content, slug, market }) {
  const t = coinCopy(locale);
  const coin = coinBySlug(slug);
  const live = useLivePrice(coin);
  const own = useDescription(coin, locale, content);
  if (!coin) return <main className="nxc nxc--missing" id="top" dir={dirOf(locale)}><div className="nxc-shell"><h1>404</h1><p><a href={hrefFor("/coins", locale, market)}>{t.allCoins}</a></p></div></main>;
  const description = own || null;
  const descriptionLang = own && coinContentLocale(locale) !== locale ? coinContentLocale(locale) : undefined;
  const vars = { coin: coin.name, symbol: coin.symbol, year: COIN_YEAR };
  const listed = isCoinListed(coin);
  const primary = listed ? primarySignup(coin, { locale, market }) : null;
  const faq = coinFaq(coin, locale, description && !descriptionLang ? description : null);
  const related = relatedCoins(coin, 6);
  const t2 = { ...t };
  return <main className="nxc nxc--coin" id="top" dir={dirOf(locale)} data-coin={coin.slug}>
    <div className="nxc-shell">
      <Crumbs locale={locale} market={market} t={t} coin={coin} />
      <header className="nxc-head">
        <div className="nxc-head__text">
          <p className="nxc-overline"><CoinMark coin={coin} size={28} /><span translate="no">{coin.symbol}</span><span aria-hidden="true">·</span><span>{t.categories[coin.category] || t.categories.other}</span></p>
          <h1 className="nxc-title">{fill(t.h1, vars)}</h1>
          <p className="nxc-answer" data-coin-answer>{coinAnswer(coin, locale)}</p>
          {listed ? <div className="nxc-listed">
            <span className="nxc-listed__label">{t.listedOn}</span>
            <ul>{coin.venues.map((venue) => <li key={venue.slug}><a href={`#venue-${venue.slug}`} title={venue.name}><BrandMark slug={venue.slug} compact /><span className="nxc-visually-hidden">{venue.name}</span></a></li>)}</ul>
          </div> : null}
          {primary ? <div className="nxc-primary" data-coin-primary={primary.venue}>
            <a className="nxc-btn" href={primary.href} target="_blank" rel="sponsored noopener noreferrer" data-offer-link="go" data-cta-platform={primary.venue} data-cta-placement={`coin-hero-${coin.slug}`}>{fill(t.buyOn, { symbol: coin.symbol, venue: primary.name })}</a>
            {primary.code ? <CopyCode code={primary.code} t={t2} /> : null}
          </div> : null}
        </div>
        <PriceCard coin={coin} locale={locale} t={t} live={live} />
      </header>

      {listed ? <section className="nxc-sec" aria-labelledby="nxc-table-h" id="venues">
        <h2 id="nxc-table-h">{fill(t.tableTitle, vars)}</h2>
        <p className="nxc-sec__lead">{fill(t.tableLead, { date: coinDataCheckedOn() })}</p>
        <VenueTable coin={coin} locale={locale} market={market} t={t} />
      </section> : null}

      <section className="nxc-sec nxc-about" aria-labelledby="nxc-about-h">
        <h2 id="nxc-about-h">{fill(t.aboutTitle, vars)}</h2>
        {description ? <p className="nxc-about__text" lang={descriptionLang} data-coin-desc={coin.id}>{description}</p> : null}
        <dl className="nxc-facts">
          <div><dt>{t.factCategory}</dt><dd>{t.categories[coin.category] || t.categories.other}</dd></div>
          <div><dt>{t.factRank}</dt><dd><LTR>#{coin.rank}</LTR></dd></div>
          <div><dt>{t.factNetworks}</dt><dd translate="no">{coin.networks?.length ? coin.networks.join(" · ") : t.factNative}</dd></div>
        </dl>
      </section>

      {listed ? <section className="nxc-sec" aria-labelledby="nxc-how-h">
        <h2 id="nxc-how-h">{fill(t.howTitle, vars)}</h2>
        <HowTo coin={coin} locale={locale} market={market} t={t} />
      </section> : null}

      <CountryNote coin={coin} locale={locale} market={market} t={t} />

      {faq.length ? <section className="nxc-sec nxc-faq" aria-labelledby="nxc-faq-h">
        <h2 id="nxc-faq-h">{fill(t.faqTitle, vars)}</h2>
        {faq.map((entry, index) => <details key={index} open={index === 0}>
          <summary>{entry.question}</summary>
          <p>{entry.answer}</p>
        </details>)}
      </section> : null}

      <section className="nxc-sec nxc-related" aria-labelledby="nxc-related-h">
        <h2 id="nxc-related-h">{t.relatedTitle}</h2>
        {!listed ? <p className="nxc-sec__lead">{t.relatedNoneLead}</p> : null}
        <ul>{related.map((other) => <li key={other.slug}><CoinLink coin={other} locale={locale} market={market} /></li>)}</ul>
        <p><a className="nxc-link" href={hrefFor("/coins", locale, market)}>{t.allCoins} →</a></p>
      </section>
    </div>
  </main>;
}

// ---------------------------------------------------------------- hub
export function CoinsHubPage({ locale = "en", market }) {
  const t = coinCopy(locale);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => {
    const counts = new Map();
    for (const coin of COINS) counts.set(coin.category, (counts.get(coin.category) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key);
  }, []);
  const q = query.trim().toLowerCase();
  const visible = COINS.filter((coin) => (category === "all" || coin.category === category)
    && (!q || coin.name.toLowerCase().includes(q) || coin.symbol.toLowerCase().includes(q) || coin.slug.includes(q)));
  return <main className="nxc nxc--hub" id="top" dir={dirOf(locale)}>
    <div className="nxc-shell">
      <Crumbs locale={locale} market={market} t={t} />
      <header className="nxc-hubhead">
        <h1 className="nxc-title">{fill(t.hubTitle, { count: COINS.length })}</h1>
        <p className="nxc-lead">{t.hubLead}</p>
        <p className="nxc-muted nxc-hubhead__meta">{fill(t.updated, { date: coinDataCheckedOn() })} · {fill(t.snapshot, { time: utcStamp(COINS_GENERATED_AT) })}</p>
      </header>
      <div className="nxc-tools" role="search">
        <label className="nxc-search">
          <span className="nxc-visually-hidden">{t.searchLabel}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} autoComplete="off" spellCheck={false} />
        </label>
        <div className="nxc-chips" role="group" aria-label={t.factCategory}>
          {["all", ...categories].map((key) => <button type="button" key={key} aria-pressed={category === key} onClick={() => setCategory(key)}>{key === "all" ? t.filterAll : (t.categories[key] || key)}</button>)}
        </div>
      </div>
      <p className="nxc-muted nxc-count" aria-live="polite">{fill(t.showing, { n: visible.length })}</p>
      {visible.length ? <ol className="nxc-list">
        {visible.map((coin) => {
          const { price, change24h } = priceOf(coin, null);
          return <li key={coin.slug} data-coin-row={coin.slug}>
            <a href={hrefFor(coinPath(coin.slug), locale, market)} className="nxc-row">
              <span className="nxc-row__rank"><LTR>{coin.rank}</LTR></span>
              <CoinMark coin={coin} size={36} />
              <span className="nxc-row__name"><b>{coin.name}</b><small translate="no">{coin.symbol} · {t.categories[coin.category] || t.categories.other}</small></span>
              <span className="nxc-row__price"><LTR>{formatUsd(price, locale)}</LTR><span className="nxc-change" data-tone={changeTone(change24h)}><LTR>{formatChange(change24h, locale)}</LTR></span></span>
              <span className="nxc-row__venues">{coin.venues.length
                ? <><span className="nxc-row__logos" aria-hidden="true">{coin.venues.slice(0, 4).map((venue) => <BrandMark key={venue.slug} slug={venue.slug} compact />)}</span><span>{coin.venues.length === 1 ? t.venuesCountOne : fill(t.venuesCount, { n: coin.venues.length })}</span></>
                : <span className="nxc-muted">{t.notListed}</span>}</span>
            </a>
          </li>;
        })}
      </ol> : <p className="nxc-empty">{fill(t.noResults, { q: query })}</p>}
    </div>
  </main>;
}

// Venue order is part of the data contract (the hub shows the first four logos in this order).
export const COIN_PAGE_VENUES = COIN_VENUE_SLUGS;
export default CoinPage;
