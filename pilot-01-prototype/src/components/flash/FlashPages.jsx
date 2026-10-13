import { radarCopy } from "../../data/radar.js";
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
import { TelegramTriggerCta } from "../shared/TelegramTriggerCta.jsx";
import { chime, notifyImportant, notificationPermission, readFlashPref, requestNotifications, writeFlashPref } from "./flash-alerts.js";
import { BITGET_ALLIANCE_PATH, bitgetAlliancePromotable, bitgetAllianceTeaser } from "../../data/bitget-alliance.js";
import { KRAKEN_USDG_PATH, krakenUsdgPromotable, krakenUsdgTeaser } from "../../data/kraken-usdg.js";
import "./flash.css";
import { ReaderTime } from "../shared/ReaderTime.jsx";
import { readerDayKey } from "../../data/local-time.js";

const dirOf = (locale) => (/^(ar|ur)$/.test(locale) ? "rtl" : "ltr");
const hrefFor = (path, locale, market) => localizedHref(path, { locale, market });
function dayLabel(key, locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`));
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

// Red "Important" marker (rule-based, src/data/flash-feed.js flashImportance); text, not colour alone, carries it.
function ImportantMark({ item, t }) {
  if (!item.important) return null;
  return <span className="nxf-imp" data-importance={item.importance}><span className="nxf-imp__dot" aria-hidden="true" />{t.important}</span>;
}

function Venue({ item }) {
  if (!item.venue) return null;
  return <span className="nxf-venue"><BrandMark slug={item.venue} compact /><span>{item.venueName}</span></span>;
}

function Assets({ assets }) {
  if (!assets?.length) return null;
  return <ul className="nxf-assets" translate="no">{assets.slice(0, 6).map((asset) => <li key={asset}><bdi>{asset}</bdi></li>)}</ul>;
}

function StreamItem({ item, locale, market, t }) {
  return <li className="nxf-row" data-type={item.type} data-important={item.important ? "true" : undefined}>
    <div className="nxf-row__time"><ReaderTime iso={item.time} locale={locale} relative /></div>
    <article className="nxf-row__card">
      <div className="nxf-row__meta"><ImportantMark item={item} t={t} /><Tag item={item} /><Venue item={item} /></div>
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
  // "Important only" filter; browser notifications and a soft chime for new important items (both opt-in, only while
  // this page is open — no service worker). Preferences live in localStorage; the buttons render on the server with
  // fixed labels so nothing moves when the client reads them.
  const [importantOnly, setImportantOnly] = useState(false);
  const [notify, setNotify] = useState(false);
  const [permission, setPermission] = useState("default");
  const [sound, setSound] = useState(false);
  const known = useRef(new Set());
  const listRef = useRef(null);
  const alertsRef = useRef({ notify: false, sound: false });
  known.current = new Set([...(feed?.items || []), ...pending].map((item) => item.id));
  alertsRef.current = { notify: notify && permission === "granted", sound };

  useEffect(() => {
    const perm = notificationPermission();
    setPermission(perm);
    setNotify(perm === "granted" && readFlashPref("notify"));
    setSound(readFlashPref("sound"));
  }, []);

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
      // A hidden tab keeps polling only when the reader asked for notifications (that is their point).
      if (typeof document !== "undefined" && document.visibilityState === "hidden" && !alertsRef.current.notify) return;
      const data = await fetchFlash({ locale, limit: 30 }).catch(() => null);
      if (!data?.items) return;
      const fresh = data.items.filter((item) => !known.current.has(item.id));
      if (!fresh.length) return;
      setPending((current) => [...fresh, ...current]);
      const important = fresh.filter((item) => item.important);
      if (!important.length) return;
      if (alertsRef.current.notify) notifyImportant(important, { label: t.important, hrefFor: (item) => hrefFor(item.path, locale, market) });
      if (alertsRef.current.sound) chime();
    };
    const timer = setInterval(refresh, FLASH_REFRESH_MS);
    return () => clearInterval(timer);
  }, [locale, market, t.important]);

  const toggleNotify = async () => {
    if (notify) { setNotify(false); writeFlashPref("notify", false); return; }
    const perm = await requestNotifications();
    setPermission(perm);
    const on = perm === "granted";
    setNotify(on);
    writeFlashPref("notify", on);
  };
  const toggleSound = () => {
    const on = !sound;
    setSound(on);
    writeFlashPref("sound", on);
    if (on) chime();
  };
  const toggleImportant = async () => {
    const on = !importantOnly;
    setImportantOnly(on);
    if (!on) return;
    // Older important items may sit beyond the loaded page: fetch them once and merge (newest first, no duplicates).
    const data = await fetchFlash({ locale, limit: FLASH_PAGE_SIZE, important: 1 }).catch(() => null);
    if (!data?.items?.length) return;
    setFeed((current) => {
      const rows = [...(current?.items || [])];
      const ids = new Set(rows.map((item) => item.id));
      for (const item of data.items) if (!ids.has(item.id)) rows.push(item);
      rows.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
      return { ...current, items: rows };
    });
  };

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
  const matches = (item) => (!type || item.type === type) && (!venue || item.venue === venue) && (!importantOnly || item.important);
  const visible = items.filter(matches);
  const types = useMemo(() => FLASH_TYPES.filter((key) => items.some((item) => item.type === key)), [items]);
  const groups = [];
  for (const item of visible) {
    const key = readerDayKey(item.time);
    if (groups[groups.length - 1]?.key !== key) groups.push({ key, items: [] });
    groups[groups.length - 1].items.push(item);
  }
  const freshVisible = pending.filter(matches).length;
  const blocked = permission === "denied" || permission === "unsupported";

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
        <TelegramTriggerCta locale={locale} placement="flash-telegram-alerts" />
        <nav aria-label={radarCopy(locale).longShortTitle}><a href={localizedHref("/long-short", { locale })}>{radarCopy(locale).longShortTitle}</a>{" · "}<a href={localizedHref("/whales", { locale })}>{radarCopy(locale).whalesTitle}</a></nav>
        <div className="nxf-alerts" role="group" aria-label={t.notifyHint}>
          <button type="button" className="nxf-toggle" aria-pressed={notify} aria-describedby="nxf-alerts-hint" disabled={blocked} title={blocked ? t.notifyBlocked : t.notifyHint} onClick={toggleNotify}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            <span>{t.notify}</span>
          </button>
          <button type="button" className="nxf-toggle" role="switch" aria-checked={sound} onClick={toggleSound}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>
            <span>{t.sound}</span>
          </button>
          <span className="nxf-alerts__hint" id="nxf-alerts-hint">{blocked ? t.notifyBlocked : notify ? t.notifyOn : t.notifyHint}</span>
        </div>
      </div>
    </header>
    <div className="nxf-toolbar">
      <div className="v2-shell">
        <div className="nxf-chips" role="group" aria-label={t.nav}>
          <button type="button" className="nxf-chip-imp" aria-pressed={importantOnly} onClick={toggleImportant}><span className="nxf-imp__dot" aria-hidden="true" />{t.importantOnly}</button>
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
      <FeaturedCampaign locale={locale} market={market} />
      {freshVisible ? <button type="button" className="nxf-pill" onClick={showPending} aria-live="polite"><LiveDot />{freshVisible} {t.fresh} · {t.showNew}</button> : null}
      {groups.length ? groups.map((group) => <div className="nxf-day" key={group.key}>
        <h2 className="nxf-day__label"><time dateTime={group.key}>{dayLabel(group.key, locale)}</time></h2>
        <ol className="nxf-list">{group.items.map((item) => <StreamItem key={item.id} item={item} locale={locale} market={market} t={t} />)}</ol>
      </div>) : <p className="nxf-empty">{feed ? t.empty : "…"}</p>}
      {feed?.hasMore && !type && !venue && !importantOnly ? <div className="nxf-more"><button type="button" className="nxf-btn" onClick={loadMore} disabled={loadingMore}>{t.loadMore}</button></div> : null}
    </section>
  </main>;
}

// Pinned campaign items (owner 2026-10-13: Kraken 5M USDG Challenge and Bitget Alliance, big pushes): first entries of the
// stream while each campaign runs, where it may be promoted. They link our campaign pages, not the exchanges.
function FeaturedCampaign({ locale, market }) {
  const rows = [
    krakenUsdgPromotable({ locale, market }) && { id: "kraken-usdg", venue: "kraken", name: "Kraken", path: KRAKEN_USDG_PATH, teaser: krakenUsdgTeaser(locale) },
    bitgetAlliancePromotable({ locale, market }) && { id: "bitget-alliance", venue: "bitget", name: "Bitget.com", path: BITGET_ALLIANCE_PATH, teaser: bitgetAllianceTeaser(locale) },
  ].filter(Boolean);
  return rows.map(({ id, venue, name, path, teaser }) => <a key={id} className="nxf-feat" href={hrefFor(path, locale, market)} data-featured-campaign={id}
    data-cta-kind="research" data-cta-platform={venue} data-cta-placement="flash-featured-campaign">
    <span className="nxf-feat__tag" data-hot="true">✦ {teaser.tag}</span>
    <span className="nxf-feat__brand"><BrandMark slug={venue} compact /><b>{name}</b></span>
    <span className="nxf-feat__title">{teaser.title}</span>
    <span className="nxf-feat__body">{teaser.body}</span>
    <span className="nxf-feat__go">{teaser.go} <span aria-hidden="true">→</span></span>
  </a>);
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
        <div className="nxf-article__meta"><ImportantMark item={item} t={t} /><Tag item={item} /><Venue item={item} /><ReaderTime iso={item.time} locale={locale} style="stamp" /></div>
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
        <TelegramTriggerCta locale={locale} placement="flash-telegram-alerts" />
        {item.links?.length ? <nav className="nxf-links" aria-label={t.related}>
          <h2>{t.related}</h2>
          <ul>{item.links.map((link) => <li key={link.href}><a href={hrefFor(link.href, locale, market)}>{link.kind === "profile" && item.venueName ? `${item.venueName} · ${t.profile}` : t[LINK_LABEL[link.kind]]}<span aria-hidden="true" className="nxf-links__arrow">→</span></a></li>)}</ul>
        </nav> : null}
      </article>
      {related.length ? <aside className="nxf-related" aria-labelledby="nxf-related-h">
        <h2 id="nxf-related-h"><LiveDot />{t.more}</h2>
        <ol>{related.map((row) => <li key={row.id}>
          <div className="nxf-related__meta"><ImportantMark item={row} t={t} /><Tag item={row} /><ReaderTime iso={row.time} locale={locale} style="stamp" /></div>
          <a href={hrefFor(row.path, locale, market)} lang={row.lang !== locale ? row.lang : undefined} dir="auto">{row.headline}</a>
        </li>)}</ol>
        <a className="nxf-btn nxf-btn--ghost" href={hrefFor("/flash", locale, market)}>{t.back}</a>
      </aside> : null}
    </div>
  </main>;
}
