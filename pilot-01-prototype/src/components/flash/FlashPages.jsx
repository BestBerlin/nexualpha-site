// NexuAlpha Flash (/flash, /flash/<key>-<slug>): the 7x24 stream and one page per item. The Worker renders both at
// request time with these components and the same payload the browser hydrates (state "flash"); headline and body
// arrive already localized, so no templates ship to the browser. The stream refreshes every 60 s and shows a
// "N new" pill instead of moving the list under the reader. Route chunk: route-flash.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandMark } from "../brand/BrandMark.jsx";
import { NewsVenueOffer } from "../v3/news/NewsVenueOffer.jsx";
import { localizedHref } from "../../data/locale-routing.js";
import { FLASH_FEED_URL, FLASH_PAGE_SIZE, FLASH_REFRESH_MS, FLASH_TYPES, flashGoHref, flashSignupVenues, flashUiCopy } from "../../data/flash.js";
import { CALENDAR_PATH, ETF_FLOWS_LIVE, ETF_FLOWS_PATH } from "../../data/intel-tools-routes.js";
import { intelToolLinks } from "../../data/intel-tools-links.js";
import "./flash.css";

const dirOf = (locale) => (/^(ar|ur)$/.test(locale) ? "rtl" : "ltr");
const clock = (iso) => String(iso || "").slice(11, 16);
const stamp = (iso) => `${String(iso || "").slice(0, 10)} ${clock(iso)} UTC`;
const hrefFor = (path, locale, market) => localizedHref(path, { locale, market });
const dayKey = (iso) => String(iso || "").slice(0, 10);
function dayLabel(iso, locale) {
  try { return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso)); } catch { return dayKey(iso); }
}
function relative(iso, now, locale) {
  if (!now) return "";
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  if (!Number.isFinite(seconds) || seconds < -86400) return "";
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
    if (seconds > -60) return rtf.format(0, "minute");
    if (seconds > -3600) return rtf.format(Math.round(seconds / 60), "minute");
    return rtf.format(Math.round(seconds / 3600), "hour");
  } catch { return ""; }
}
async function fetchFlash(params) {
  const response = await fetch(`${FLASH_FEED_URL}?${new URLSearchParams(params)}`, { headers: { accept: "application/json" } });
  return response.ok ? response.json() : null;
}

function LiveDot() {
  return <span className="nxf-dot" aria-hidden="true" />;
}

function Tag({ item }) {
  return <span className="nxf-tag" data-type={item.type}>{item.typeLabel}</span>;
}

function Venue({ item }) {
  if (!item.venue) return null;
  return <span className="nxf-venue"><BrandMark slug={item.venue} compact /><span>{item.venueName}</span></span>;
}

function Assets({ assets }) {
  if (!assets?.length) return null;
  return <ul className="nxf-assets" translate="no">{assets.slice(0, 6).map((asset) => <li key={asset}><bdi>{asset}</bdi></li>)}</ul>;
}

function StreamItem({ item, locale, market, now }) {
  const rel = relative(item.time, now, locale);
  return <li className="nxf-row" data-type={item.type}>
    <div className="nxf-row__time"><time dateTime={item.time}><bdi>{clock(item.time)}</bdi></time>{rel ? <span>{rel}</span> : null}</div>
    <article className="nxf-row__card">
      <div className="nxf-row__meta"><Tag item={item} /><Venue item={item} /></div>
      <h3 className="nxf-row__title" lang={item.lang !== locale ? item.lang : undefined} dir="auto"><a href={hrefFor(item.path, locale, market)}>{item.headline}</a></h3>
      {item.body ? <p className="nxf-row__body" lang={item.lang !== locale ? item.lang : undefined} dir="auto">{item.body}</p> : null}
      <Assets assets={item.assets} />
    </article>
  </li>;
}

export function FlashStreamPage({ locale = "en", market, initial }) {
  const t = flashUiCopy(locale);
  const [feed, setFeed] = useState(() => (initial?.kind === "stream" ? initial : null));
  const [type, setType] = useState(null);
  const [venue, setVenue] = useState(null);
  const [pending, setPending] = useState([]);
  const [now, setNow] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const known = useRef(new Set());
  const listRef = useRef(null);
  known.current = new Set([...(feed?.items || []), ...pending].map((item) => item.id));

  useEffect(() => {
    if (feed) return undefined;
    let off = false;
    fetchFlash({ locale, limit: FLASH_PAGE_SIZE }).then((data) => { if (!off && data?.items) setFeed(data); }).catch(() => {});
    return () => { off = true; };
  }, [feed, locale]);
  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    const refresh = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const data = await fetchFlash({ locale, limit: 30 }).catch(() => null);
      if (!data?.items) return;
      const fresh = data.items.filter((item) => !known.current.has(item.id));
      if (fresh.length) setPending((current) => [...fresh, ...current]);
    };
    const timer = setInterval(refresh, FLASH_REFRESH_MS);
    return () => clearInterval(timer);
  }, [locale]);

  const showPending = useCallback(() => {
    setFeed((current) => ({ ...current, items: [...pending, ...(current?.items || [])] }));
    setPending([]);
    listRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [pending]);
  const loadMore = async () => {
    const last = feed?.items?.[feed.items.length - 1];
    if (!last || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchFlash({ locale, limit: FLASH_PAGE_SIZE, before: last.time });
      if (data?.items) setFeed((current) => ({ ...current, hasMore: data.hasMore, items: [...current.items, ...data.items.filter((item) => !known.current.has(item.id))] }));
    } catch { /* keep the list */ }
    setLoadingMore(false);
  };

  const items = feed?.items || [];
  const visible = items.filter((item) => (!type || item.type === type) && (!venue || item.venue === venue));
  const types = useMemo(() => FLASH_TYPES.filter((key) => items.some((item) => item.type === key)), [items]);
  const groups = [];
  for (const item of visible) {
    const key = dayKey(item.time);
    if (groups[groups.length - 1]?.key !== key) groups.push({ key, items: [] });
    groups[groups.length - 1].items.push(item);
  }
  const freshVisible = pending.filter((item) => (!type || item.type === type) && (!venue || item.venue === venue)).length;

  return <main className="nxf nxf--stream" id="top" dir={dirOf(locale)}>
    <header className="nxf-hero">
      <div className="v2-shell">
        <p className="nxf-overline"><LiveDot /><span>{t.live}</span><span aria-hidden="true">·</span><span>NexuAlpha</span></p>
        <h1 className="nxf-title">{t.h1}</h1>
        <p className="nxf-lead">{t.lead}</p>
        <p className="nxf-tools" data-testid="flash-data-links">
          {ETF_FLOWS_LIVE ? <a href={hrefFor(ETF_FLOWS_PATH, locale, market)}>{intelToolLinks(locale).etf}<span aria-hidden="true"> →</span></a> : null}
          <a href={hrefFor(CALENDAR_PATH, locale, market)}>{intelToolLinks(locale).calendar}<span aria-hidden="true"> →</span></a>
        </p>
      </div>
    </header>
    <div className="nxf-toolbar">
      <div className="v2-shell">
        <div className="nxf-chips" role="group" aria-label={t.nav}>
          <button type="button" aria-pressed={!type} onClick={() => setType(null)}>{t.all}</button>
          {types.map((key) => <button type="button" key={key} data-type={key} aria-pressed={type === key} onClick={() => setType(type === key ? null : key)}>{t.types[key]}</button>)}
        </div>
        {feed?.venues?.length ? <div className="nxf-chips nxf-chips--venues" role="group" aria-label={t.allVenues}>
          <button type="button" aria-pressed={!venue} onClick={() => setVenue(null)}>{t.allVenues}</button>
          {feed.venues.map((row) => <button type="button" key={row.slug} aria-pressed={venue === row.slug} onClick={() => setVenue(venue === row.slug ? null : row.slug)}><BrandMark slug={row.slug} compact /><span>{row.name}</span></button>)}
        </div> : null}
      </div>
    </div>
    <section className="nxf-stream v2-shell" ref={listRef} aria-label={t.h1}>
      {freshVisible ? <button type="button" className="nxf-pill" onClick={showPending} aria-live="polite"><LiveDot />{freshVisible} {t.fresh} · {t.showNew}</button> : null}
      {groups.length ? groups.map((group) => <div className="nxf-day" key={group.key}>
        <h2 className="nxf-day__label"><time dateTime={group.key}>{dayLabel(`${group.key}T00:00:00Z`, locale)}</time></h2>
        <ol className="nxf-list">{group.items.map((item) => <StreamItem key={item.id} item={item} locale={locale} market={market} now={now} />)}</ol>
      </div>) : <p className="nxf-empty">{feed ? t.empty : "…"}</p>}
      {feed?.hasMore && !type && !venue ? <div className="nxf-more"><button type="button" className="nxf-btn" onClick={loadMore} disabled={loadingMore}>{t.loadMore}</button></div> : null}
    </section>
  </main>;
}

const LINK_LABEL = { update: "update", article: "article", liquidations: "liquidations", funding: "funding", profile: "profile" };

export function FlashItemPage({ locale = "en", market, itemKey, initial }) {
  const t = flashUiCopy(locale);
  const [data, setData] = useState(() => (initial?.kind === "item" && initial.item?.key === itemKey ? initial : null));
  useEffect(() => {
    if (data?.item?.key === itemKey) return undefined;
    let off = false;
    fetchFlash({ locale, key: itemKey }).then((payload) => { if (!off && payload?.item) setData({ kind: "item", ...payload }); }).catch(() => {});
    return () => { off = true; };
  }, [data, itemKey, locale]);
  if (!data) return <main className="nxf nxf--item" id="top" dir={dirOf(locale)}><div className="v2-shell nxf-article"><p className="nxf-empty">…</p></div></main>;
  const { item, related = [] } = data;
  const offerVenues = flashSignupVenues(item, { locale, market });
  const lang = item.lang !== locale ? item.lang : undefined;
  return <main className="nxf nxf--item" id="top" dir={dirOf(locale)}>
    <div className="v2-shell nxf-layout">
      <article className="nxf-article">
        <a className="nxf-back" href={hrefFor("/flash", locale, market)}><span aria-hidden="true" className="nxf-back__arrow">←</span>{t.back}</a>
        <div className="nxf-article__meta"><Tag item={item} /><Venue item={item} /><time dateTime={item.time}><bdi>{stamp(item.time)}</bdi></time></div>
        <h1 className="nxf-article__title" lang={lang} dir="auto">{item.headline}</h1>
        {item.body ? <p className="nxf-article__body" lang={lang} dir="auto">{item.body}</p> : null}
        <Assets assets={item.assets} />
        <div className="nxf-source">
          <span className="nxf-source__label">{t.source}</span>
          {item.source.kind === "official"
            ? <a href={item.source.url} target="_blank" rel="nofollow noopener noreferrer" lang="en" dir="ltr">{t.official}: {item.source.title} <span aria-hidden="true">↗</span></a>
            : item.source.kind === "news"
              ? <a href={hrefFor(item.source.url, locale, market)}>{t.article}</a>
              : <a href={hrefFor(item.source.url, locale, market)}>{t.data}</a>}
        </div>
        {offerVenues.length ? <section className="nxf-cta" aria-label={item.venueName || "NexuAlpha"}>
          <NewsVenueOffer venues={offerVenues} locale={locale} market={market} variant="inline" placementPrefix="flash" articleSlug={item.key}
            linkFor={(slug) => flashGoHref(slug, item)} />
        </section> : null}
        {item.links?.length ? <nav className="nxf-links" aria-label={t.related}>
          <h2>{t.related}</h2>
          <ul>{item.links.map((link) => <li key={link.href}><a href={hrefFor(link.href, locale, market)}>{link.kind === "profile" && item.venueName ? `${item.venueName} · ${t.profile}` : t[LINK_LABEL[link.kind]]}<span aria-hidden="true" className="nxf-links__arrow">→</span></a></li>)}</ul>
        </nav> : null}
      </article>
      {related.length ? <aside className="nxf-related" aria-labelledby="nxf-related-h">
        <h2 id="nxf-related-h"><LiveDot />{t.more}</h2>
        <ol>{related.map((row) => <li key={row.id}>
          <div className="nxf-related__meta"><Tag item={row} /><time dateTime={row.time}><bdi>{stamp(row.time)}</bdi></time></div>
          <a href={hrefFor(row.path, locale, market)} lang={row.lang !== locale ? row.lang : undefined} dir="auto">{row.headline}</a>
        </li>)}</ol>
        <a className="nxf-btn nxf-btn--ghost" href={hrefFor("/flash", locale, market)}>{t.back}</a>
      </aside> : null}
    </div>
  </main>;
}
