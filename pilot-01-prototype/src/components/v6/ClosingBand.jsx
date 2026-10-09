// V6 act 5: closing band. A large-type statement + next-action CTAs (one line-draw route + a
// word-rise), then the legacy research drawer and CrawlPriorityLinks re-hosted unchanged as a typographic index
// (restyled in src/styles/v6/closing.css). The legacy slot keeps every link in the DOM in its original order.
import { Fragment, memo, useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { CLOSE_COPY, RAIL, pickLocale } from "../v3/LeanHeroCopyV6.js";
import { LeanHero } from "../v3/LeanHero";
import { RailDock, RailSeg } from "./RouteRail.jsx";
import { BrazilEntryLink } from "../v3/international/BrazilDecisionPage.jsx";
import { prefersReducedMotionNow, whenReached } from "../../lib/revealGuard.js";


// The two next-step CTAs are GET forms, not anchors: they work without JS and keep the page's crawlable <a href> set
// identical to production (those destinations already link from the header, footer and the index below).
function GoForm({ href, className, children }) {
  const u = new URL(href, "https://nexualpha.com");
  return <form className="v6-close__form" action={u.pathname} method="get">
    {[...u.searchParams].map(([k, v]) => <input type="hidden" name={k} value={v} key={k} />)}
    <button type="submit" className={className}>{children}</button>
  </form>;
}

// Shared noun for the directory CTA (the hero's tertiary link uses the same label).
export const directoryLabel = (locale) => (CLOSE_COPY[locale] || CLOSE_COPY.en).dir;

function ClosingBandImpl({ legacy, locale = "en" }) {
  const t = CLOSE_COPY[locale] || CLOSE_COPY.en;
  const r = pickLocale(RAIL, locale);
  const ref = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle (SSR: all visible) -> armed (hidden) -> in (revealed)
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || prefersReducedMotionNow()) return undefined;
    // Server HTML and no-JS stay fully visible. The band is armed (paper sheet covered) only when it is below the fold at
    // mount; the reveal plays when it is scrolled to. Fail-safe: whenReached() also opens it once it has been reached OR
    // jumped past (anchor link, End key, fast flick, focus, print), so it can never stay covered.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return undefined;
    let stop = () => {};
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) open(); }, { threshold: 0.2 });
    function open() { setPhase("in"); io.disconnect(); stop(); }
    io.observe(el);
    setPhase("armed");
    stop = whenReached(el, open, { ratio: 0.85 });
    return () => { io.disconnect(); stop(); };
  }, []);
  // Phones: the related-research index starts folded (one tappable row; every link stays in the DOM for crawlers and keyboards).
  const idx = useRef(null);
  useEffect(() => {
    const d = idx.current?.querySelector(".crawl-priority-links__details");
    if (d && window.matchMedia("(max-width: 37.5rem)").matches) d.open = false;
  }, []);
  // CJK has no spaces: rise per clause (never per glyph, so kinsoku line breaking stays intact).
  const cjk = /^(zh|ja)/.test(locale);
  // Two display lines: the first sentence, then the follow-up. Words (or CJK clauses) rise one by one.
  const lines = t.title.split(/(?<=[.。])\s*/).filter(Boolean);
  let n = 0;
  return <section className="v6-close" data-phase={phase} aria-labelledby="v6-close-title">
    <div className="v6-close__band">
    <div className="v6-close__stage" ref={ref}>
      <h2 id="v6-close-title" className="v6-close__title" data-len={t.title.length > 34 ? "long" : "short"} aria-label={t.title}>
        {lines.map((line, li) => <span className="v6-close__line" aria-hidden="true" key={li}>{(cjk ? line.split(/(?<=[、，])/) : line.split(" ")).map((w, i, arr) => <Fragment key={i}><span className="v6-close__w"><span style={{ "--i": n++ }}>{w}</span></span>{cjk || i === arr.length - 1 ? "" : " "}</Fragment>)}</span>)}
      </h2>
      <p className="v6-lead v6-close__lead">{t.lead}</p>
      <div className="v6-close__go">
        <svg className="v6-close__route" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path className="track" d="M0 34 H150 C190 34 190 20 230 20 H594" />
          <path className="draw" d="M0 34 H150 C190 34 190 20 230 20 H594" />
        </svg>
        <GoForm href={localizedHref("/exchanges", { locale })} className="btn btn-primary v6-close__cta">{t.dir}<i className="v6-arrow" aria-hidden="true" /></GoForm>
        <GoForm href={localizedHref("/compare/binance-vs-okx", { locale })} className="v6-close__alt"><span>{t.cmp}</span><i className="v6-arrow" aria-hidden="true" /></GoForm>
      </div>
      <p className="v6-small v6-close__note">{t.note}</p>
    </div>
    <RailSeg dest /><RailDock i={3} kind="dest" locale={locale} />
    </div>
    <div className="v6-close__index v6-wrap" ref={idx}>{legacy}
      {/* Moved here from the hero foot: the directory facets (same hrefs and labels the hero produced) and the Telegram / Brazil routes. */}
      {/* v8: the directory facets and more-entry links fold into one drawer (same links, still in the DOM for crawlers). */}
      <details className="crawl-priority-links__details v6-close__fold">
        <summary className="crawl-priority-links__intro"><strong>{r[4]}</strong><span>{r[2]}</span><b aria-hidden="true">＋</b></summary>
        <div className="crawl-priority-links__groups">
          <LeanHero locale={locale} render={(k) => <>
            <div className="crawl-priority-links__group v6-close__more"><span>{r[2]}</span>{k.pills.map((p) => <a key={p.text} href={p.href}>{p.text}</a>)}</div>
            <div className="crawl-priority-links__group v6-close__more"><span>{r[4]}</span><a href={k.telegram.href} target="_blank" rel="noopener noreferrer">{k.telegram.label}</a><BrazilEntryLink locale={locale} /></div>
          </>} />
        </div>
      </details>
    </div>
  </section>;
}

// The closing index is a large static link set; its slot depends on the locale only, so nothing else re-renders it.
export const ClosingBand = memo(ClosingBandImpl, (p, n) => p.locale === n.locale);
