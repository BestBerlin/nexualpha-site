// V6 Act 4: the Directory. A fixed-grid, identical-rhythm list of every venue.
// Registration / detail / verify hrefs, rel, data-* and referral codes are produced by the same helpers the legacy
// compact rows used (publicCtaForVenue, regionalCtaState, localizedHref), in the same DOM order, so the link graph is unchanged.
// Reveal is decoration only: every row, fee and code is visible in the server HTML and stays visible if JS or IO never runs.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useSharedSelection } from "./home-selection.js";
import { RailDock, RailSeg } from "./RouteRail.jsx";
import { BrandMark } from "../brand/BrandMark";
import { PlatformMatcher } from "../v3/PlatformMatcher";
import { getCopyFeedbackCopy, getFilters, getUi } from "../v3/VenueYellowPages";
import { matrixCopy } from "../v3/exchange-matrix-copy.js";
import { appendAccountStageToSearch } from "../v3/venue-yellow-pages-state.js";
import { partnerRegistry } from "../../data/partner-registry";
import { venueDatabase } from "../../data/venue-database.js";
import { venueDecisionContent } from "../../data/venue-decision-content";
import { comparePathFor, hasCompareRoute, noCompareLabel } from "./compare-routes.js";
import { EXCHANGE_FACTS } from "../../data/exchange-facts.js";
import { getLocalizedVenueName } from "../../utils/venue-name-helper.js";
import { directoryContext, directoryContextSearch, filterDirectoryVenues, regionalCtaState, regionalDirectoryCandidateState, venueMarketStatus } from "../../data/directory-context.js";
import { localizedHref } from "../../data/locale-routing.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { useScrollEdges } from "./useScrollEdges.js";
import { trackCodeCopy } from "../../data/cta-ui-copy.js";

const SEGMENTS = [
  { id: "all", key: "all" },
  { id: "CEX", key: "cex" },
  { id: "DEX", key: "dex" },
  { id: "Perp DEX", key: "perpdex" },
];
const FILTER_KEYS = ["noKyc", "por", "fiat", "highLev"];
const EMPTY_FILTERS = { noKyc: false, por: false, fiat: false, highLev: false };

const fmtRate = (value) => {
  const s = Number(value).toFixed(3);
  return s.endsWith("0") ? s.slice(0, -1) : s;
};
const hasPair = (pair) => Array.isArray(pair) && pair[0] != null && pair[1] != null;

function Icon({ name }) {
  const p = {
    copy: <><rect x="5.5" y="5.5" width="8" height="8" rx="1.8" /><path d="M10.5 5.5v-1.2a1.8 1.8 0 0 0-1.8-1.8H4.3a1.8 1.8 0 0 0-1.8 1.8v4.4a1.8 1.8 0 0 0 1.8 1.8h1.2" /></>,
    check: <path className="dir6-draw" d="m3.5 8.5 3 3 6-7" pathLength="1" />,
    plus: <path d="M8 3.5v9M3.5 8h9" />,
    arrow: <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />,
    close: <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />,
    stamp: <><circle className="dir6-stamp__perf" cx="8" cy="8" r="7.2" /><path className="dir6-draw" d="m5 8.2 2.1 2.1 3.9-4.4" pathLength="1" /></>,
  }[name];
  return <svg className={`dir6-ico dir6-ico--${name}`} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}

function DirectoryV6Impl({ locale = "en", venues = [], selected = [], onSelectionChange, decisionPassport = {}, store }) {
  const shared = useSharedSelection(store, selected);
  const pickPair = (next) => { if (store) store.set(next); else onSelectionChange?.(next); };
  const [category, setCategory] = useState("all");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [verifiedFirst, setVerifiedFirst] = useState(false);
  const [touched, setTouched] = useState(false);
  const [filtering, setFiltering] = useState(0);
  const [copied, setCopied] = useState({ slug: "", code: "" });
  const [copyFail, setCopyFail] = useState({ slug: "", code: "" });
  const listRef = useRef(null);
  const secRef = useRef(null);
  const [inView, setInView] = useState(false);
  const segRefs = useRef([]);
  const chipsRef = useRef(null);
  useScrollEdges(chipsRef);
  const copyTimer = useRef(null);
  const seenRef = useRef(new Set());

  const ui = getUi(locale);
  const fl = getFilters(locale);
  const mc = matrixCopy(locale);
  const copyUi = getCopyFeedbackCopy(locale);
  const context = directoryContext({ locale });
  const contextSearch = appendAccountStageToSearch(directoryContextSearch({ locale }), undefined);
  const sharedSelection = Array.isArray(shared) ? shared : [];
  // The shared compare picks start from a default pair (Binance vs OKX). Ticking those rows on load reads as a
  // recommendation, so a row shows as picked only after the visitor has picked something (here or in the compare lab).
  const selectionKey = sharedSelection.join(",");
  const [initialSelectionKey] = useState(selectionKey);
  const [synced, setSynced] = useState(false);
  useEffect(() => { if (selectionKey !== initialSelectionKey) setSynced(true); }, [selectionKey, initialSelectionKey]);
  const userPicked = touched || synced;
  const compareSelection = userPicked ? sharedSelection : [];

  const contextual = useMemo(() => filterDirectoryVenues(venues, undefined, { locale }), [venues, locale]);

  const rows = useMemo(() => contextual.map((venue) => {
    const db = venueDatabase[venue.slug] || {};
    const facts = EXCHANGE_FACTS[venue.slug] || null;
    const verified = facts?.status === "verified";
    const partner = partnerRegistry[venue.slug] || {
      slug: venue.slug,
      officialDomain: db.officialDomain || venue.officialDomain || `${venue.slug}.com`,
      hasReferral: db.hasReferral || false,
      inviteCode: db.inviteCode || null,
      registrationUrl: db.registrationUrl || `https://${db.officialDomain || venue.officialDomain || `${venue.slug}.com`}`,
    };
    const publicCta = publicCtaForVenue(venue.slug, locale);
    const marketStatus = venueMarketStatus(venue, undefined);
    const regionalCandidate = regionalDirectoryCandidateState(venue, { market: undefined, product: undefined, locale, accountStage: undefined, funding: undefined });
    const displayMarketStatus = regionalCandidate.status !== "unscoped" ? regionalCandidate.status : marketStatus;
    const ctaState = regionalCtaState({ market: undefined, status: displayMarketStatus });
    const registrationUrl = publicCta.registrationUrl;
    return {
      slug: venue.slug,
      name: getLocalizedVenueName(venue, locale),
      category: venue.category,
      domain: partner.officialDomain ?? db.officialDomain,
      spot: verified && hasPair(facts.spot) ? facts.spot : null,
      verified,
      verifiedOn: verified ? facts.verifiedOn : null,
      hasDetailPage: Boolean(venueDecisionContent[venue.slug]),
      hasReferral: publicCta.hasReferral,
      inviteCode: publicCta.inviteCode,
      registrationUrl,
      canOpenRegistration: ctaState !== "blocked" && publicCta.hasReferral && /^https:\/\//i.test(registrationUrl),
      pass: {
        noKyc: db.kycLevel === "optional" || db.kycLevel === "none",
        por: Boolean(db.proofOfReserves && db.porAuditCheckedAt && db.porAuditUrl),
        fiat: Boolean(db.fiatChannels && db.fiatChannels.length),
        highLev: parseInt(db.maxLeverage || "0") >= 50,
      },
    };
  }), [contextual, locale]);

  const counts = useMemo(() => ({
    all: rows.length,
    CEX: rows.filter((r) => r.category === "CEX").length,
    DEX: rows.filter((r) => r.category === "DEX").length,
    "Perp DEX": rows.filter((r) => r.category === "Perp DEX").length,
  }), [rows]);

  const visible = useMemo(() => {
    let list = rows.filter((r) => (category === "all" || r.category === category) && FILTER_KEYS.every((k) => !filters[k] || r.pass[k]));
    if (verifiedFirst) list = [...list.filter((r) => r.verified), ...list.filter((r) => !r.verified)];
    return list;
  }, [rows, category, filters, verifiedFirst]);

  const bump = () => setFiltering((n) => n + 1);
  const chooseCategory = (id) => { if (id !== category) { setCategory(id); bump(); } };
  const toggleFilter = (key) => { setFilters((cur) => ({ ...cur, [key]: !cur[key] })); bump(); };
  const resetAll = () => { setFilters(EMPTY_FILTERS); setCategory("all"); bump(); };

  const toggleCompare = (slug) => {
    setTouched(true);
    const cur = compareSelection;
    let next;
    if (!hasCompareRoute(slug) && !cur.includes(slug)) return;
    if (cur.includes(slug)) next = cur.filter((s) => s !== slug);
    else next = cur.length >= 2 ? [cur[cur.length - 1], slug] : [...cur, slug];
    pickPair(next);
  };
  const clearCompare = () => { setTouched(true); pickPair([]); };
  const nameOf = (slug) => rows.find((r) => r.slug === slug)?.name || venueDatabase[slug]?.name || slug;

  const onSegKey = (event, index) => {
    const rtl = event.currentTarget.closest("[dir='rtl']") ? -1 : 1;
    let next = null;
    if (event.key === "ArrowRight") next = index + rtl;
    else if (event.key === "ArrowLeft") next = index - rtl;
    else if (event.key === "ArrowDown") next = index + 1;
    else if (event.key === "ArrowUp") next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = SEGMENTS.length - 1;
    if (next == null) return;
    event.preventDefault();
    const target = (next + SEGMENTS.length) % SEGMENTS.length;
    chooseCategory(SEGMENTS[target].id);
    segRefs.current[target]?.focus();
  };

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const handleCopy = async (row) => {
    const code = row.inviteCode;
    if (!code) return;
    if (copyTimer.current) clearTimeout(copyTimer.current);
    const reset = () => { copyTimer.current = setTimeout(() => { setCopied({ slug: "", code: "" }); setCopyFail({ slug: "", code: "" }); }, 2200); };
    setCopyFail({ slug: "", code: "" });
    try {
      if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") throw new Error("no clipboard");
      await navigator.clipboard.writeText(code);
      setCopied({ slug: row.slug, code });
      trackCodeCopy(row.slug, "directory-card-code");
    } catch {
      setCopyFail({ slug: row.slug, code });
    }
    reset();
  };

  // Progressive, decorative reveal. Rows are visible by default; rows below the fold get a one-shot hairline sweep and
  // their (already final, verified) fee numerals slide up through a mask. No number is ever animated through other values. A timeout disarms everything if IO never fires.
  useEffect(() => {
    const el = secRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const rowsKey = visible.map((r) => r.slug).join(",");
  useEffect(() => {
    const root = listRef.current;
    if (!root || typeof window === "undefined" || typeof IntersectionObserver === "undefined") return undefined;
    const nodes = [...root.querySelectorAll(".dir6-row")];
    const reveal = (row) => {
      seenRef.current.add(row.getAttribute("data-slug"));
      row.removeAttribute("data-armed");
      row.setAttribute("data-seen", "1");
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        reveal(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 });
    const vh = window.innerHeight || 800;
    nodes.forEach((row) => {
      const slug = row.getAttribute("data-slug");
      const top = row.getBoundingClientRect().top;
      if (seenRef.current.has(slug) || top < vh * 0.94) { row.setAttribute("data-seen", "1"); seenRef.current.add(slug); return; }
      row.setAttribute("data-armed", "1");
      io.observe(row);
    });
    const timer = setTimeout(() => {
      nodes.forEach((row) => { if (row.hasAttribute("data-armed")) { row.removeAttribute("data-armed"); row.setAttribute("data-seen", "1"); } });
      io.disconnect();
    }, 7000);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, [rowsKey]);

  // Runs of 3+ consecutive unchecked venues with no code and no sign-up route collapse into one grouped line.
  // Each venue keeps its detail link (visible) and its eligibility link (hidden carrier) in the original DOM order.
  const groupable = (r) => r.category !== "CEX" && !r.verified && !r.spot && !(r.hasReferral && r.inviteCode) && !r.canOpenRegistration && !compareSelection.includes(r.slug);
  const items = [];
  for (let i = 0; i < visible.length;) {
    let j = i;
    while (j < visible.length && groupable(visible[j])) j += 1;
    if (j - i >= 3) { items.push({ group: visible.slice(i, j), key: `g-${visible[i].slug}` }); i = j; }
    else { const end = Math.max(j, i + 1); for (let k = i; k < end; k += 1) items.push({ row: visible[k], key: visible[k].slug }); i = end; }
  }
  const selAt = items.map((it, i) => (it.row && compareSelection.includes(it.row.slug) ? i : -1)).filter((i) => i >= 0);
  const routeLo = selAt.length > 1 ? Math.min(...selAt) : -1;
  const routeHi = selAt.length > 1 ? Math.max(...selAt) : -1;
  const segIndex = Math.max(0, SEGMENTS.findIndex((s) => s.id === category));
  const compareHref = compareSelection.length === 2 ? localizedHref(`${comparePathFor(compareSelection).path}?${contextSearch}`, { locale }) : null;
  const dockOpen = touched && inView && compareSelection.length > 0;
  const activeFilterCount = FILTER_KEYS.filter((k) => filters[k]).length;
  const dockSlot = (slug, key) => slug ? (
    <button type="button" key={`${key}-${slug}`} className="dir6-dock__slot" onClick={() => toggleCompare(slug)} aria-label={`${mc.remove}: ${nameOf(slug)}`}>
      <BrandMark slug={slug} compact />
      <span className="dir6-dock__nm" translate="no">{nameOf(slug)}</span>
      <Icon name="close" />
    </button>
  ) : (
    <span key={`${key}-empty`} className="dir6-dock__slot dir6-dock__slot--empty"><span className="dir6-dock__ghost" aria-hidden="true" /><span className="dir6-dock__nm">{mc.pickMore}</span></span>
  );

  return (
    <section className="dir6 v6-section" id="exchanges" data-dock={dockOpen || undefined} ref={secRef} aria-labelledby="dir6-title">
      <RailSeg /><RailDock i={2} locale={locale} />
      <div className="v6-wrap">
        <header className="dir6-head">
          <h2 className="v6-h1" id="dir6-title">{locale === "en" ? "Crypto platform directory" : ui.sectionTitle}</h2>
          <p className="v6-lead dir6-lead">{ui.sectionLead}</p>
        </header>

        <div className="dir6-match">
          <PlatformMatcher locale={locale} venues={venues} selected={compareSelection} decisionPassport={decisionPassport} defaultOpen={false} onSelectionChange={pickPair} />
        </div>

        <div className="dir6-bar">
          <div className="dir6-seg" role="radiogroup" aria-label={mc.type} style={{ "--idx": segIndex }}>
            {SEGMENTS.map((seg, index) => {
              const active = category === seg.id;
              return (
                <button
                  key={seg.id}
                  ref={(el) => { segRefs.current[index] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  className="dir6-seg__btn"
                  data-active={active}
                  onClick={() => chooseCategory(seg.id)}
                  onKeyDown={(event) => onSegKey(event, index)}
                >
                  <span translate={seg.id === "all" ? undefined : "no"}>{mc[seg.key]}</span>
                  <i className="dir6-seg__n" aria-hidden="true">{counts[seg.id]}</i>
                </button>
              );
            })}
          </div>
          <div className="dir6-chips" role="group" aria-label="filters" ref={chipsRef}>
            {[["noKyc", fl.noKyc], ["por", fl.por], ["fiat", fl.fiat], ["highLev", fl.highLev]].map(([key, label]) => (
              <button key={key} type="button" className="dir6-chip" aria-pressed={filters[key]} onClick={() => toggleFilter(key)}>
                <span className="dir6-chip__box" aria-hidden="true"><Icon name="check" /></span>
                <span>{label}</span>
              </button>
            ))}
            <button type="button" className="dir6-chip dir6-chip--sort" aria-pressed={verifiedFirst} onClick={() => { setVerifiedFirst((v) => !v); bump(); }} title={mc.recommended}>
              <span className="dir6-chip__box" aria-hidden="true"><Icon name="check" /></span>
              <span>{mc.verifiedFirst}</span>
            </button>
          </div>
          <p className="dir6-count" role="status" aria-live="polite">
            {mc.show} <b className="v6-num">{visible.length}</b> {mc.of} <b className="v6-num">{counts.all}</b>
            {activeFilterCount > 0 ? <button type="button" className="dir6-reset" onClick={resetAll}>{ui.resetFilters}</button> : null}
          </p>
        </div>

        {visible.length === 0 ? (
          <div className="dir6-empty" role="status">
            <h3 className="v6-h3">{ui.emptyTitle}</h3>
            <p className="v6-small">{ui.emptyBody}</p>
            <button type="button" className="dir6-btn" onClick={resetAll}>{ui.resetFilters}</button>
          </div>
        ) : (
          <>
            <div className="dir6-cols" aria-hidden="true">
              <span />
              <span>{mc.platform}</span>
              <span>{mc.spot} <em>{mc.maker}</em></span>
              <span>{mc.code}</span>
            </div>
            <ul className="dir6-list" ref={listRef} data-filtering={filtering ? filtering % 2 : undefined} aria-label={mc.table}>
              {items.map((item, index) => {
                if (item.group) {
                  const run = item.group;
                  return (
                    <li key={item.key} className="dir6-row dir6-group" style={{ "--i": Math.min(index, 12) }}>
                      <i className="dir6-rail" aria-hidden="true" />
                      <span className="dir6-group__n v6-num" aria-hidden="true">{run.length}</span>
                      <div className="dir6-group__body">
                        <span className="dir6-group__lab">{mc.unchecked}<span className="dir6-sr">: {run.length}</span></span>
                        <ul className="dir6-group__list">
                          {run.map((r) => (
                            <li key={r.slug} className="dir6-group__item" data-slug={r.slug}>
                              <BrandMark slug={r.slug} compact />
                              {r.hasDetailPage ? (
                                <a
                                  className="dir6-group__name"
                                  translate="no"
                                  href={localizedHref(`/exchanges/${r.slug}?${contextSearch}`, { locale })}
                                  data-cta-kind="research"
                                  data-cta-platform={r.slug}
                                  data-cta-placement="directory-card-detail"
                                  data-growth-decision={r.slug}
                                  data-growth-placement="directory-card-detail"
                                  data-growth-market={context.market}
                                  data-growth-product={context.product}
                                >{r.name}</a>
                              ) : (
                                <span className="dir6-group__name" translate="no">{r.name}</span>
                              )}
                              <span hidden>
                                <a
                                  href={localizedHref(`/exchanges/${r.slug}?${contextSearch}#registration-path`, { locale })}
                                  tabIndex={-1}
                                  data-cta-placement="directory-card-eligibility"
                                  data-growth-decision="regional_eligibility"
                                  data-growth-placement="directory-card-eligibility"
                                  data-growth-market={context.market}
                                  data-growth-product={context.product}
                                >{mc.eligibility} {r.name}</a>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                }
                const r = item.row;
                const isSel = compareSelection.includes(r.slug);
                const noRoute = !isSel && !hasCompareRoute(r.slug);
                const failed = copyFail.slug === r.slug;
                const done = copied.slug === r.slug;
                return (
                  <li key={r.slug} className="dir6-row" data-slug={r.slug} data-selected={isSel || undefined} data-route={routeLo < 0 ? undefined : index === routeLo ? "start" : index === routeHi ? "end" : index > routeLo && index < routeHi ? "mid" : undefined} style={{ "--i": Math.min(index, 12) }}>
                    <i className="dir6-rail" aria-hidden="true" />
                    <button
                      type="button"
                      className="dir6-pick"
                      aria-pressed={isSel}
                      disabled={noRoute || undefined}
                      aria-label={noRoute ? `${r.name}: ${noCompareLabel(locale)}` : `${isSel ? ui.compareRemove : ui.compareSelect}: ${r.name}`}
                      data-tip={noRoute ? noCompareLabel(locale) : isSel ? ui.compareRemove : ui.compareSelect}
                      onClick={() => toggleCompare(r.slug)}
                      data-cta-kind="research"
                      data-cta-platform={r.slug}
                      data-cta-placement="directory-compare-select"
                      data-growth-decision={r.slug}
                      data-growth-placement="directory-compare-select"
                      data-growth-market={context.market}
                      data-growth-product={context.product}
                    >
                      <Icon name={isSel ? "check" : "plus"} />
                    </button>

                    <div className="dir6-id">
                      <BrandMark slug={r.slug} compact />
                      <div className="dir6-id__text">
                        <span className="dir6-namerow">
                        {r.hasDetailPage ? (
                          <a
                            className="dir6-name"
                            translate="no"
                            href={localizedHref(`/exchanges/${r.slug}?${contextSearch}`, { locale })}
                            data-cta-kind="research"
                            data-cta-platform={r.slug}
                            data-cta-placement="directory-card-detail"
                            data-growth-decision={r.slug}
                            data-growth-placement="directory-card-detail"
                            data-growth-market={context.market}
                            data-growth-product={context.product}
                          >{r.name}</a>
                        ) : (
                          <span className="dir6-name" translate="no">{r.name}</span>
                        )}
                        {r.verified ? <span className="dir6-stamp" role="img" aria-label={`${mc.checked} ${r.verifiedOn}`} title={`${mc.checked} ${r.verifiedOn}`}><Icon name="stamp" /></span> : null}
                        </span>
                        <span className="dir6-meta"><span className="dir6-meta__type" data-cat={r.category} lang="en" translate="no">{r.category}</span><span className="dir6-domain" dir="ltr" lang="en" translate="no">{r.domain}</span></span>
                      </div>
                    </div>

                    <div className="dir6-data">
                    <div className="dir6-fee">
                      <span className="dir6-fee__lab" aria-hidden="true">{mc.spot}</span>
                      {r.spot ? (
                        <>
                          <span className="dir6-fee__v v6-num" dir="ltr" translate="no"><b>{fmtRate(r.spot[0])}</b><i aria-hidden="true">/</i><b>{fmtRate(r.spot[1])}</b><u>%</u></span>
                          <span className="dir6-fee__m" dir="auto">{mc.checked} <time dateTime={r.verifiedOn}>{r.verifiedOn}</time></span>
                        </>
                      ) : (
                        <>
                          <span className="dir6-fee__none" aria-hidden="true">{mc.unchecked}</span>
                          <span className="dir6-sr">{mc.spot}: {mc.unchecked}. {mc.check}</span>
                        </>
                      )}
                    </div>

                    <div className="dir6-act">
                    <div className="dir6-code">
                      {r.hasReferral && r.inviteCode ? (
                        <>
                          <button
                            type="button"
                            className="dir6-chipcode"
                            data-done={done || undefined}
                            title={mc.copy}
                            aria-label={`${mc.copy}: ${r.inviteCode}`}
                            onClick={() => handleCopy(r)}
                          >
                            <strong className="v6-num" translate="no" lang="en">{r.inviteCode}</strong>
                            <span className="dir6-chipcode__ico"><Icon name={done ? "check" : "copy"} /></span>
                          </button>
                          <span className="dir6-pop" aria-hidden="true" data-show={done || undefined}>{mc.copied}</span>
                          <span className="dir6-sr" role="status" aria-live="polite">{done ? mc.copied : ""}</span>
                        </>
                      ) : (
                        <span className="dir6-dash" title={mc.noCode}>&ndash;<span className="dir6-sr">{mc.noCode}</span></span>
                      )}
                    </div>

                    {r.canOpenRegistration ? (
                      <a
                        href={r.registrationUrl}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        className="dir6-cta"
                        data-cta-kind="registration"
                        data-cta-platform={r.slug}
                        data-cta-placement="directory-card"
                        data-cta-code={r.hasReferral && r.inviteCode ? r.inviteCode : undefined}
                        data-growth-decision={r.slug}
                        data-growth-placement="directory-card"
                        data-growth-market={context.market}
                        data-growth-product={context.product}
                      >
                        <span>{mc.signup}</span><span className="dir6-sr"> {r.name}</span><Icon name="arrow" />
                      </a>
                    ) : (
                      <a
                        href={localizedHref(`/exchanges/${r.slug}?${contextSearch}#registration-path`, { locale })}
                        className="dir6-cta dir6-cta--verify"
                        data-cta-placement="directory-card-eligibility"
                        data-growth-decision="regional_eligibility"
                        data-growth-placement="directory-card-eligibility"
                        data-growth-market={context.market}
                        data-growth-product={context.product}
                      >
                        <span>{mc.eligibility}</span><span className="dir6-sr"> {r.name}</span>
                      </a>
                    )}
                    </div>

                    </div>

                    {failed ? (
                      <div className="dir6-manual" role="status" aria-live="polite">
                        <span>{copyUi.failed}</span>
                        <input className="dir6-manual__input v6-num" type="text" readOnly dir="ltr" translate="no" aria-label={copyUi.manualLabel} value={copyFail.code} onFocus={(e) => e.currentTarget.select()} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {dockOpen ? (
          <div className="dir6-dock" role="region" aria-label={mc.tray} aria-live="polite">
            <div className="dir6-dock__pair">
              {dockSlot(compareSelection[0], "a")}
              <span className="dir6-dock__vs" aria-hidden="true">{mc.vs}</span>
              {dockSlot(compareSelection[1], "b")}
            </div>
            <div className="dir6-dock__actions">
              {compareHref ? (
                <a
                  href={compareHref}
                  className="dir6-btn dir6-btn--primary"
                  data-cta-kind="research"
                  data-cta-placement="directory-compare-open"
                  data-growth-decision="directory_compare_open"
                  data-growth-placement="directory-compare-open"
                  data-growth-market={context.market}
                  data-growth-product={context.product}
                >{ui.compareOpen}<Icon name="arrow" /></a>
              ) : null}
              <button type="button" className="dir6-dock__clear" aria-label={ui.compareClear} title={ui.compareClear} onClick={clearCompare}><Icon name="close" /></button>
            </div>
          </div>
        ) : null}

        <div className="dir6-foot">
          {visible.length > 6 ? (
            <div className="dir6-foot__row">
              <span className="v6-small dir6-foot__sum">{typeof ui.resultSummary === "function" ? ui.resultSummary(visible.length) : `${mc.show} ${visible.length} ${mc.of} ${counts.all}`}</span>
              <a className="dir6-all" href={localizedHref(`/exchanges?${contextSearch}`, { locale })}>{ui.viewAll} <Icon name="arrow" /></a>
            </div>
          ) : null}
        </div>
      </div>

    </section>
  );
}

// The directory never re-renders for state it does not read: the page shell's legacy slot is ignored, and the
// decision passport is compared by value (the shell rebuilds it on every render).
const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
export const DirectoryV6 = memo(DirectoryV6Impl, (p, n) => p.locale === n.locale && p.venues === n.venues && p.store === n.store
  && p.onSelectionChange === n.onSelectionChange && same(p.selected, n.selected) && same(p.decisionPassport, n.decisionPassport));

export default DirectoryV6;
