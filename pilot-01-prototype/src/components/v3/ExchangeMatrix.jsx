import { useEffect, useMemo, useRef, useState } from "react";
import { BrandMark } from "../brand/BrandMark";
import { partnerRegistry } from "../../data/partner-registry";
import { venueDatabase } from "../../data/venue-database.js";
import { venueDecisionContent } from "../../data/venue-decision-content";
import { getLocalizedVenueName } from "../../utils/venue-name-helper.js";
import { regionalCtaState, regionalDirectoryCandidateState, venueMarketStatus } from "../../data/directory-context.js";
import { localizedHref } from "../../data/locale-routing.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { EXCHANGE_FACTS, venueCheckedOn } from "../../data/exchange-facts.js";
import { localizeRegionNote } from "./exchange-matrix-copy.js";
import { hasCompareRoute, noCompareLabel } from "../v6/compare-routes.js";

const SEGMENTS = [
  { id: "all", key: "all" },
  { id: "CEX", key: "cex" },
  { id: "DEX", key: "dex" },
  { id: "Perp DEX", key: "perpdex" },
];

const fmtRate = (value) => {
  const s = Number(value).toFixed(3);
  return s.endsWith("0") ? s.slice(0, -1) : s;
};
const hasPair = (pair) => Array.isArray(pair) && pair[0] != null && pair[1] != null;

function SortIcon() {
  return (
    <svg className="mx-sort__icon" viewBox="0 0 10 14" width="8" height="12" aria-hidden="true" focusable="false">
      <path className="mx-sort__up" d="M5 1 1.5 5.2h7z" />
      <path className="mx-sort__down" d="M5 13 1.5 8.8h7z" />
    </svg>
  );
}

function CopyIcon({ done }) {
  return done ? (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><rect x="5.5" y="5.5" width="8" height="8" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M10.5 3.2v-.4a1.3 1.3 0 0 0-1.3-1.3H3.8A1.3 1.3 0 0 0 2.5 2.8v5.4a1.3 1.3 0 0 0 1.3 1.3h.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="mx-arrow" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false"><path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}

// Fee figure that fades/translates in when its column becomes the sort key. The digits are never tweened.
function CountNum({ value, run, delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!run || !el || !el.animate || typeof window === "undefined") return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    // The figure is always final; only opacity/translate animate.
    const anim = el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" });
    return () => anim.cancel();
  }, [run, value, delay]);
  return <b ref={ref}>{fmtRate(value)}</b>;
}

function DockSlot({ row, onRemove, mc }) {
  if (!row) {
    return <span className="mx-dock__slot mx-dock__slot--empty"><span className="mx-dock__ghost" aria-hidden="true" /><span className="mx-dock__slotname">{mc.pickMore}</span></span>;
  }
  return (
    <button type="button" className="mx-dock__slot mx-dock__slot--full" onClick={onRemove} aria-label={`${mc.remove}: ${row.name}`} title={`${mc.remove}: ${row.name}`}>
      <BrandMark slug={row.slug} compact />
      <span className="mx-dock__slotname" translate="no">{row.name}</span>
      <span className="mx-dock__x" aria-hidden="true">×</span>
    </button>
  );
}

export function ExchangeMatrix({
  venues,
  totalCount,
  locale,
  ui,
  mc,
  context,
  market,
  product,
  contextSearch,
  accountStage,
  funding,
  selectedCategory,
  onCategory,
  searchQuery,
  onSearch,
  onClearSearch,
  searchInputRef,
  compareSelection,
  onToggleCompare,
  onClearCompare,
  compareHref,
  onCopyCode,
  renderCopyFeedback,
  copiedToast,
  onReset,
  regionalReturnHref,
}) {
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [tick, setTick] = useState(0);
  const [verifiedFirst, setVerifiedFirst] = useState(false);
  const segRefs = useRef([]);

  const rows = useMemo(() => venues.map((venue) => {
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
    const marketStatus = venueMarketStatus(venue, market);
    const regionalCandidate = regionalDirectoryCandidateState(venue, { market, product, locale, accountStage, funding });
    const displayMarketStatus = regionalCandidate.status !== "unscoped" ? regionalCandidate.status : marketStatus;
    const ctaState = regionalCtaState({ market, status: displayMarketStatus });
    const registrationUrl = publicCta.registrationUrl;
    const canOpenRegistration = ctaState !== "blocked" && publicCta.hasReferral && /^https:\/\//i.test(registrationUrl);
    const spot = verified && hasPair(facts.spot) ? facts.spot : null;
    const perp = verified && hasPair(facts.perp) ? facts.perp : null;
    const productList = [];
    const isCex = venue.category === "CEX";
    if (venue.category !== "Perp DEX") productList.push(mc.pSpot);
    if (venue.category === "Perp DEX" || (isCex && (db.futuresFee || perp))) productList.push(mc.pPerp);
    if (isCex && Array.isArray(db.fiatChannels) && db.fiatChannels.length) productList.push(mc.pFiat);
    if (!isCex) productList.push(mc.pChain);
    return {
      venue,
      slug: venue.slug,
      name: getLocalizedVenueName(venue, locale),
      category: venue.category,
      spot,
      perp,
      verified,
      // "Checked" only when at least one fee field is published as checked (Uniswap: none -> no stamp).
      verifiedOn: venueCheckedOn(venue.slug),
      region: verified && facts.regions?.length ? facts.regions.map((note) => localizeRegionNote(note, locale)).join(" · ") : null,
      products: productList,
      hasDetailPage: Boolean(venueDecisionContent[venue.slug]),
      hasReferral: publicCta.hasReferral,
      inviteCode: publicCta.inviteCode,
      registrationUrl,
      canOpenRegistration,
    };
  }), [venues, locale, market, product, accountStage, funding, mc]);

  const sorted = useMemo(() => {
    // "Verified" = at least one fee field published as checked; a venue showing "Not yet checked" never sorts into it.
    const isChecked = (r) => Boolean(r.spot || r.perp);
    const base = verifiedFirst ? [...rows.filter(isChecked), ...rows.filter((r) => !isChecked(r))] : rows;
    if (!sort.key) return base;
    const val = (r) => {
      if (sort.key === "spot") return r.spot ? r.spot[1] : null;
      if (sort.key === "perp") return r.perp ? r.perp[1] : null;
      return r.name;
    };
    const dir = sort.dir === "asc" ? 1 : -1;
    // "Verified first" and a column sort compose: verified rows stay on top and each
    // group is ordered by the active column (Array#sort is stable).
    return [...base].sort((a, b) => {
      if (verifiedFirst && Boolean(a.spot || a.perp) !== Boolean(b.spot || b.perp)) return a.spot || a.perp ? -1 : 1;
      const va = val(a);
      const vb = val(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "string") return va.localeCompare(vb, locale) * dir;
      return (va - vb) * dir;
    });
  }, [rows, sort, locale, verifiedFirst]);

  const cycleSort = (key) => {
    setTick((n) => n + 1);
    setSort((cur) => {
      if (cur.key !== key) return { key, dir: "asc" };
      if (cur.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" };
    });
  };
  const ariaSort = (key) => (sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none");
  const nameOf = (slug) => rows.find((r) => r.slug === slug)?.name || venueDatabase[slug]?.name || slug;
  const compareFull = compareSelection.length >= 2;

  const onSegKey = (event, index) => {
    const dirKey = document?.dir === "rtl" || event.currentTarget.closest("[dir='rtl']") ? -1 : 1;
    let next = null;
    if (event.key === "ArrowRight") next = index + dirKey;
    else if (event.key === "ArrowLeft") next = index - dirKey;
    else if (event.key === "ArrowDown") next = index + 1;
    else if (event.key === "ArrowUp") next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = SEGMENTS.length - 1;
    if (next == null) return;
    event.preventDefault();
    const target = (next + SEGMENTS.length) % SEGMENTS.length;
    onCategory(SEGMENTS[target].id);
    segRefs.current[target]?.focus();
  };

  const sortHead = (key, label, sub, className = "") => (
    <th scope="col" role="columnheader" aria-sort={ariaSort(key)} className={`mx-th mx-th--sortable ${className}`.trim()} data-sorted={sort.key === key ? sort.dir : undefined}>
      <button type="button" className="mx-sort" onClick={() => cycleSort(key)} aria-label={`${mc.sortBy}: ${label}${sort.key === key ? `, ${sort.dir === "asc" ? mc.sortAsc : mc.sortDesc}` : ""}`}>
        <span className="mx-sort__text">
          <span>{label}</span>
          {sub ? <small>{sub}</small> : null}
        </span>
        <SortIcon />
      </button>
    </th>
  );

  const renderFee = (pair, col, index) => {
    const run = sort.key === col ? tick : 0;
    const delay = Math.min(index, 10) * 28;
    return (
      <span className="mx-fee num" dir="ltr" translate="no">
        <CountNum value={pair[0]} run={run} delay={delay} /><u>%</u><i aria-hidden="true">/</i><CountNum value={pair[1]} run={run} delay={delay} /><u>%</u>
      </span>
    );
  };
  const unchecked = (label) => (
    <>
      <span className="mx-unch" title={mc.check} aria-hidden="true">{mc.unchecked}</span>
      <span className="mx-sr">{label}{mc.unchecked}. {mc.check}</span>
    </>
  );

  return (
    <div className="mx" data-tray={compareSelection.length > 0 ? "open" : undefined}>
      <div className="mx-toolbar">
        <div className="mx-seg" role="radiogroup" aria-label={mc.type}>
          {SEGMENTS.map((seg, index) => {
            const active = selectedCategory === seg.id;
            return (
              <button
                key={seg.id}
                ref={(el) => { segRefs.current[index] = el; }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className="mx-seg__btn"
                data-active={active}
                onClick={() => onCategory(seg.id)}
                onKeyDown={(event) => onSegKey(event, index)}
              >
                <span translate={seg.id === "all" ? undefined : "no"}>{mc[seg.key]}</span>
              </button>
            );
          })}
        </div>
        <div className="mx-search" role="search">
          <label htmlFor="mx-search" className="mx-sr">{ui.searchLabel}</label>
          <input
            id="mx-search"
            ref={searchInputRef}
            className="mx-search__input"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={ui.searchPlaceholder}
            autoComplete="off"
            spellCheck="false"
          />
          {searchQuery ? <button type="button" className="mx-search__clear" onClick={onClearSearch} aria-label={ui.clearSearch}>×</button> : null}
        </div>
        <button type="button" className="mx-toggle" aria-pressed={verifiedFirst} onClick={() => setVerifiedFirst((v) => !v)} title={mc.recommended}>
          <span className="mx-toggle__box" aria-hidden="true"><svg viewBox="0 0 16 16" width="11" height="11" focusable="false"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span>{mc.verifiedFirst}</span>
        </button>
        <p className="mx-count num" role="status" aria-live="polite">
          <span>{mc.show}</span> <b>{venues.length}</b> <span>{mc.of}</span> <b>{totalCount}</b>
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="mx-empty" role="status">
          <h2>{ui.emptyTitle}</h2>
          <p>{ui.emptyBody}</p>
          <button type="button" className="mx-btn" onClick={onReset}>{ui.resetFilters}</button>
          {regionalReturnHref ? <a className="mx-btn mx-btn--ghost" href={regionalReturnHref} data-cta-placement="directory-empty-region-return">{ui.returnToRegion}</a> : null}
        </div>
      ) : (
        <div className="mx-scroll">
          <table className="mx-table" role="table" aria-label={mc.table} aria-rowcount={sorted.length + 1}>
            <colgroup>
              <col className="mx-col mx-col--pick" />
              <col className="mx-col mx-col--name" />
              <col className="mx-col mx-col--fee" />
              <col className="mx-col mx-col--fee" />
              <col className="mx-col mx-col--prod" />
              <col className="mx-col mx-col--region" />
              <col className="mx-col mx-col--code" />
              <col className="mx-col mx-col--cta" />
            </colgroup>
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader" className="mx-th mx-th--pick"><span className="mx-sr">{mc.compare}</span><span className="mx-th__sortlabel" aria-hidden="true">{mc.sortBy}</span></th>
                {sortHead("name", mc.platform)}
                {sortHead("spot", mc.spot, mc.maker, "mx-th--fee")}
                {sortHead("perp", mc.perp, mc.maker, "mx-th--fee")}
                <th scope="col" role="columnheader" className="mx-th mx-th--prod"><span className="mx-th__label">{mc.products}</span></th>
                <th scope="col" role="columnheader" className="mx-th mx-th--region"><span className="mx-th__label">{mc.region}</span></th>
                <th scope="col" role="columnheader" className="mx-th mx-th--code"><span className="mx-th__label">{mc.code}</span></th>
                <th scope="col" role="columnheader" className="mx-th mx-th--cta"><span className="mx-sr">{mc.signup}</span></th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {sorted.map((r, index) => {
                const selected = compareSelection.includes(r.slug);
                const noRoute = !hasCompareRoute(r.slug);
                const pickDisabled = !selected && (compareFull || noRoute);
                const noFees = !r.spot && !r.perp;
                return (
                  <tr
                    key={r.slug}
                    role="row"
                    className="mx-row"
                    data-slug={r.slug}
                    data-selected={selected || undefined}
                    style={{ "--i": Math.min(index, 14) }}
                  >
                    <td role="cell" className="mx-td mx-td--pick">
                      <label className="mx-pick" title={noRoute && !selected ? noCompareLabel(locale) : selected ? ui.compareRemove : ui.compareSelect} data-no-compare={noRoute || undefined}>
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={pickDisabled}
                          onChange={() => onToggleCompare(r.slug)}
                          aria-label={noRoute && !selected ? `${r.name}: ${noCompareLabel(locale)}` : `${selected ? ui.compareRemove : ui.compareSelect}: ${r.name}`}
                          data-cta-kind="research"
                          data-cta-platform={r.slug}
                          data-cta-placement="directory-compare-select"
                          data-growth-decision={r.slug}
                          data-growth-placement="directory-compare-select"
                          data-growth-market={context.market}
                          data-growth-product={context.product}
                        />
                        <span className="mx-pick__box" aria-hidden="true"><svg viewBox="0 0 16 16" width="12" height="12" focusable="false"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                      </label>
                    </td>
                    <th scope="row" role="rowheader" className="mx-td mx-td--name">
                      <div className="mx-id">
                        <BrandMark slug={r.slug} compact />
                        <div className="mx-id__text">
                          {r.hasDetailPage ? (
                            <a
                              className="mx-id__name"
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
                            <span className="mx-id__name" translate="no">{r.name}</span>
                          )}
                          <span className="mx-id__meta">
                            <span className="mx-type" translate="no" lang="en">{r.category}</span>
                            {r.verifiedOn ? <span className="mx-checked num">{mc.checked} <time dateTime={r.verifiedOn}>{r.verifiedOn}</time></span> : null}
                            {noRoute ? <span className="mx-nocompare" aria-hidden="true">{noCompareLabel(locale)}</span> : null}
                          </span>
                        </div>
                      </div>
                    </th>
                    {noFees ? (
                      <td role="cell" className="mx-td mx-td--fee mx-td--nofee" colSpan={2} data-label={`${mc.spot} / ${mc.perp}`}>
                        {unchecked(`${mc.spot}, ${mc.perp}: `)}
                      </td>
                    ) : (
                      <>
                        <td role="cell" className="mx-td mx-td--fee mx-td--spot" data-label={mc.spot}>
                          {r.spot ? renderFee(r.spot, "spot", index) : unchecked(`${mc.spot}: `)}
                        </td>
                        <td role="cell" className="mx-td mx-td--fee mx-td--perp" data-label={mc.perp}>
                          {r.perp ? renderFee(r.perp, "perp", index) : unchecked(`${mc.perp}: `)}
                        </td>
                      </>
                    )}
                    <td role="cell" className="mx-td mx-td--prod" data-label={mc.products}>
                      <span translate="no">{r.products.join(mc.sep)}</span>
                    </td>
                    <td role="cell" className={`mx-td mx-td--region${r.region ? " mx-td--has" : ""}`} data-label={mc.region}>
                      {r.region ? <span lang="en">{r.region}</span> : (<><span className="mx-dash" aria-hidden="true">&ndash;</span><span className="mx-sr">{mc.region}: {mc.unchecked}</span></>)}
                    </td>
                    <td role="cell" className="mx-td mx-td--code" data-label={mc.code}>
                      {r.hasReferral && r.inviteCode ? (
                        <>
                          <button
                            type="button"
                            className="mx-code"
                            data-done={copiedToast === r.inviteCode || undefined}
                            title={mc.copy}
                            aria-label={`${mc.copy}: ${r.inviteCode}`}
                            onClick={(e) => onCopyCode(r.inviteCode, `${r.slug}-compact`, e)}
                          >
                            <strong translate="no" lang="en">{r.inviteCode}</strong>
                            <span className="mx-code__icon"><CopyIcon done={copiedToast === r.inviteCode} /></span>
                            <span className="mx-code__state mx-sr" role="status">{copiedToast === r.inviteCode ? mc.copied : ""}</span>
                          </button>
                          {renderCopyFeedback(`${r.slug}-compact`)}
                        </>
                      ) : (
                        <span className="mx-dash" title={mc.noCode}>&ndash;<span className="mx-sr">{mc.noCode}</span></span>
                      )}
                    </td>
                    <td role="cell" className="mx-td mx-td--cta">
                      {r.canOpenRegistration ? (
                        <a
                          href={r.registrationUrl}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                          className="mx-cta"
                          data-cta-kind="registration"
                          data-cta-platform={r.slug}
                          data-cta-placement="directory-card"
                          data-growth-decision={r.slug}
                          data-growth-placement="directory-card"
                          data-growth-market={context.market}
                          data-growth-product={context.product}
                        >
                          <span>{mc.signup}</span><span className="mx-sr"> {r.name}</span><ArrowIcon />
                        </a>
                      ) : (
                        <a
                          href={localizedHref(`/exchanges/${r.slug}?${contextSearch}#registration-path`, { locale })}
                          className="mx-cta mx-cta--verify"
                          data-cta-placement="directory-card-eligibility"
                          data-growth-decision="regional_eligibility"
                          data-growth-placement="directory-card-eligibility"
                          data-growth-market={context.market}
                          data-growth-product={context.product}
                        >
                          <span>{mc.eligibility}</span><span className="mx-sr"> {r.name}</span>
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {compareSelection.length > 0 ? (
        <div className="mx-dock" role="region" aria-label={mc.tray} aria-live="polite">
          <div className="mx-dock__pair">
            <DockSlot key={`a-${compareSelection[0]}`} row={{ slug: compareSelection[0], name: nameOf(compareSelection[0]) }} onRemove={() => onToggleCompare(compareSelection[0])} mc={mc} />
            <span className="mx-dock__vs" aria-hidden="true">{mc.vs}</span>
            <DockSlot key={`b-${compareSelection[1] || "empty"}`} row={compareSelection[1] ? { slug: compareSelection[1], name: nameOf(compareSelection[1]) } : null} onRemove={() => onToggleCompare(compareSelection[1])} mc={mc} />
          </div>
          <div className="mx-dock__actions">
            {compareHref ? (
              <a
                href={compareHref}
                className="mx-btn mx-btn--primary"
                data-cta-kind="research"
                data-cta-placement="directory-compare-open"
                data-growth-decision="directory_compare_open"
                data-growth-placement="directory-compare-open"
                data-growth-market={context.market}
                data-growth-product={context.product}
              >{ui.compareOpen}<ArrowIcon /></a>
            ) : null}
            <button type="button" className="mx-btn mx-btn--ghost" onClick={onClearCompare}>{ui.compareClear}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ExchangeMatrix;
