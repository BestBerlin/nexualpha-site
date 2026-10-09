// V6 act 3: "Verify before you leave" — a route of three stations (domain, code, disclosure).
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { RailDock, RailSeg } from "./RouteRail.jsx";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { localizedHref } from "../../data/locale-routing.js";
import { getVerifyCopy } from "../v3/LeanHeroCopyVerify.js";
import { keepInStrip } from "./CompareLab.jsx";

function useInViewOnce(ref) {
  const [on, setOn] = useState(false);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    // Fail-safe (R11): armed only while still below the fold at mount; it goes live when seen, when a scroll finds it on
    // screen or already passed (fast scroll, anchor jump), on focus inside it, before print, and if the observer never reports.
    if (el.getBoundingClientRect().top < window.innerHeight) { setOn(true); return undefined; } /* plays in place, never hidden */
    let alive = false;
    const off = () => {
      io.disconnect(); window.clearTimeout(t);
      window.removeEventListener("scroll", check); window.removeEventListener("resize", check);
      window.removeEventListener("hashchange", check); window.removeEventListener("beforeprint", go);
      el.removeEventListener("focusin", go);
    };
    const go = () => { setOn(true); off(); };
    const check = () => { if (el.getBoundingClientRect().top < window.innerHeight * 0.92) go(); };
    const io = new IntersectionObserver(([e]) => { alive = true; if (e.isIntersecting) go(); }, { threshold: 0.05, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    setArmed(true);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    window.addEventListener("hashchange", check);
    window.addEventListener("beforeprint", go);
    el.addEventListener("focusin", go);
    const t = window.setTimeout(() => { if (!alive) go(); else check(); }, 1500);
    return off;
  }, [ref]);
  return [armed, on];
}

// A lookalike of the venue's OWN official domain, built from the catalog value (never hardcoded): the classic single-character tricks.
// Returns [{ c, bad }] segments so the differing characters can be marked, plus `.note`: a language-neutral caption of the
// change ("+k", "ó ≠ o", "rn ≠ m"). Deterministic per slug (SSR-safe).
const ACCENT = { a: "\u00e1", e: "\u00e9", i: "\u00ed", o: "\u00f3", u: "\u00fa" };
const hashOf = (str) => Array.from(String(str)).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
export function lookalikeOf(domain, seed) {
  const labels = String(domain).split(".");
  let li = labels.findIndex((l, i) => i < labels.length - 1 && !/^(www|app|pro|m)$/i.test(l));
  if (li < 0) li = 0;
  const label = labels[li];
  const make = ([chars, note]) => {
    const out = [];
    out.note = note;
    labels.forEach((l, i) => {
      if (i) out.push({ c: ".", bad: false });
      if (i === li) out.push(...chars); else Array.from(l).forEach((c) => out.push({ c, bad: false }));
    });
    return out;
  };
  const cs = Array.from(label);
  const tries = [
    () => { const k = cs.findIndex((c, i) => i > 0 && ACCENT[c.toLowerCase()]); return k < 0 ? null : [cs.map((c, i) => (i === k ? { c: ACCENT[c.toLowerCase()], bad: true } : { c, bad: false })), `${ACCENT[cs[k].toLowerCase()]} ≠ ${cs[k]}`]; },
    () => { const k = cs.findIndex((c) => c === "m"); return k < 0 ? null : [cs.flatMap((c, i) => (i === k ? [{ c: "r", bad: true }, { c: "n", bad: true }] : [{ c, bad: false }])), "rn ≠ m"]; },
    () => { const k = cs.findIndex((c, i) => i > 0 && i < cs.length - 1 && /[a-z]/i.test(c) && cs[i + 1] !== c && cs[i - 1] !== c); return k < 0 ? null : [cs.flatMap((c, i) => (i === k ? [{ c, bad: false }, { c, bad: true }] : [{ c, bad: false }])), `+${cs[k]}`]; },
    () => { const k = cs.findIndex((c, i) => i > 0 && i < cs.length - 1 && c !== cs[i + 1] && /[a-z]/i.test(c + cs[i + 1])); return k < 0 ? null : [cs.map((c, i) => (i === k ? { c: cs[k + 1], bad: true } : i === k + 1 ? { c: cs[k], bad: true } : { c, bad: false })), `${cs[k + 1]}${cs[k]} ≠ ${cs[k]}${cs[k + 1]}`]; },
  ];
  const start = hashOf(seed || domain) % tries.length;
  for (let j = 0; j < tries.length; j += 1) {
    const r = tries[(start + j) % tries.length]();
    if (r) return make(r);
  }
  const last = cs[cs.length - 1];
  const swap = last === "x" ? "z" : "x";
  return make([[...cs.slice(0, -1).map((c) => ({ c, bad: false })), { c: swap, bad: true }], `${swap} ≠ ${last}`]);
}

const Glyph = ({ kind }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "domain" && <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.4 3.6 5.2 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.2-3.6-8.5s1-6.1 3.6-8.5z" /></>}
    {kind === "code" && <><rect x="3.5" y="7" width="17" height="10" rx="2" /><path d="M9 7v10" strokeDasharray="1.5 2.5" /><path d="M13 11h4M13 13.5h2.5" /></>}
    {kind === "disclosure" && <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" /></>}
  </svg>
);

// Verify owns its venue: it takes the page's first pick once (on mount) and never follows the lab afterwards, so the
// chip order is fixed for the life of the page and a lab change never re-renders this act.
function VerifyBandImpl({ locale = "en", venues = [], selected = [] }) {
  const t = getVerifyCopy(locale);
  const [first] = useState(() => (Array.isArray(selected) ? selected[0] : null));
  const rows = useMemo(() => {
    const seen = new Set();
    const slugs = [first, ...venues.map((v) => v?.slug)].filter((s) => s && !seen.has(s) && seen.add(s));
    const out = [];
    for (const slug of slugs) {
      let cta; try { cta = publicCtaForVenue(slug, locale); } catch { continue; }
      if (!cta?.officialDomain) continue;
      const v = venues.find((x) => x?.slug === slug);
      out.push({ slug, name: v?.name || cta.name || slug, domain: String(cta.officialDomain).replace(/^https?:\/\//, "").replace(/\/.*$/, ""), code: cta.hasReferral && cta.inviteCode ? String(cta.inviteCode) : null });
      if (out.length >= 5) break;
    }
    return out;
  }, [venues, first, locale]);

  const [pick, setPick] = useState(null);
  const row = rows.find((r) => r.slug === pick) || rows[0];
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  const route = useRef(null);
  const [armed, live] = useInViewOnce(route);
  // the domain check plays once (about 900ms); afterwards a venue switch only crossfades the domains, the verdict stays
  const [done, setDone] = useState(false);
  useEffect(() => { if (!live) return undefined; const id = setTimeout(() => setDone(true), 950); return () => clearTimeout(id); }, [live]);
  const strip = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  // a venue pick keeps its chip inside the scrolling row (horizontal only)
  useEffect(() => { keepInStrip(strip.current, strip.current?.querySelector('[aria-pressed="true"]')); }, [row?.slug]);
  if (!row) return null;

  const copy = async () => {
    try { await navigator.clipboard.writeText(row.code); }
    catch {
      try { const ta = document.createElement("textarea"); ta.value = row.code; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); } catch { return; }
    }
    setCopied(true); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 1800);
  };
  // The deploy gate forbids a duplicate anchor on "/": reuse the footer's disclosure link instead of adding a second href.
  const goDisclosure = () => {
    const a = document.querySelector('a[href*="methodology#disclosure"]');
    if (a) a.click(); else window.location.assign(localizedHref("/methodology#disclosure", { locale }));
  };
  const chars = Array.from(row.domain);
  const fake = lookalikeOf(row.domain, row.slug);
  const fakeText = fake.map((x) => x.c).join("");

  return (
    <section className="v6-section vb" id="verify" aria-labelledby="vb-title">
      <RailSeg /><RailDock i={1} locale={locale} />
      <div className="v6-wrap">
        <header className="vb__head">
          <h2 className="v6-h1 vb__title" id="vb-title">{t.title}</h2>
          <div className="vb__aside">
            <p className="v6-body vb__lead">{t.lead}</p>
            <div className="vb__venues" role="group" aria-label={t.venue} ref={strip}>
              {rows.map((r) => (
                <button key={r.slug} type="button" className="vb__venue" aria-pressed={r.slug === row.slug} onClick={() => { setPick(r.slug); setCopied(false); }}>{r.name}</button>
              ))}
            </div>
          </div>
        </header>

        <ol className="vb__route" ref={route} data-armed={armed ? "" : undefined} data-live={live ? "" : undefined} data-done={done ? "" : undefined}>
          <li className="vb__line" aria-hidden="true"><i /></li>

          <li className="vb__st vb__st--1">
            <span className="vb__node" aria-hidden="true"><Glyph kind="domain" /></span>
            <div className="vb__body">
              <div className="vb__main">
              <h3 className="v6-h3">{t.s1t}</h3>
              <p className="v6-body vb__desc vb__desc--lead">{t.s1d}</p>
              <div className="vb__bars" style={{ "--n": chars.length, "--m": fake.length }}>
                <div className="vb__proof vb__bar vb__bar--official" key={row.slug} lang="en" translate="no" dir="ltr">
                  <span className="vb__sr">{row.domain}</span>
                  <svg className="vb__lock" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path pathLength="1" d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
                    <rect pathLength="1" x="5.5" y="10.5" width="13" height="9.5" rx="2.5" />
                    <path pathLength="1" d="M12 14.5v2" />
                  </svg>
                  <span className="vb__typed" aria-hidden="true">{row.domain}</span>
                  <span className="vb__stamp" aria-hidden="true" lang={locale} translate="yes" dir="auto" title={t.s1ok}>{t.official}</span>
                  <span className="vb__sr">{t.s1ok}</span>
                </div>
              </div>
              </div>
              <div className="vb__foot">
                <div className="vb__bar vb__bar--fake" key={row.slug} aria-hidden="true" lang="en" translate="no" dir="ltr">
                  <svg className="vb__lock vb__lock--open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 10.5V8a4 4 0 0 1 7.6-1.7" /><rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" />
                  </svg>
                  <span className="vb__typed vb__typed--fake">{fake.map((x, i) => <span key={i} className={x.bad ? "vb__x" : undefined}>{x.c}</span>)}</span>
                  <span className="vb__tag" lang={locale} translate="yes" dir="auto">{t.fake}</span>
                </div>
                <span className="vb__sr">{`${t.fake}: ${fakeText}`}</span>
              <p className="v6-small vb__note">{fake.note && <span className="vb__diff" dir="ltr" lang="en" translate="no">{fake.note}</span>}{t.fakeNote}</p>
              </div>
            </div>
          </li>

          <li className="vb__st vb__st--2">
            <span className="vb__node" aria-hidden="true"><Glyph kind="code" /></span>
            <div className="vb__body">
              <div className="vb__main">
              <h3 className="v6-h3">{t.s2t}</h3>
              {/* the prefill helper exists only when there is a code to enter */}
              {row.code ? <p className="v6-body vb__desc vb__desc--lead">{t.s2d}</p> : null}
              {row.code ? (
                <button type="button" className="vb__proof vb__code" data-copied={copied ? "" : undefined} onClick={copy} aria-label={`${t.copy}: ${row.code}`}>
                  <span className="vb__codeval" lang="en" translate="no">{row.code}</span>
                  <span className="vb__copy v6-small">
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect className="vb__ic-copy" x="5.5" y="5.5" width="8" height="8" rx="1.8" /><path className="vb__ic-copy" d="M10.5 3.5h-6a1.5 1.5 0 0 0-1.5 1.5v6" />
                      <path className="vb__ic-ok" pathLength="1" d="M3 8.5l3.2 3L13 4.8" />
                    </svg>
                    <span>{copied ? t.copied : t.copy}</span>
                  </span>
                </button>
              ) : (
                <div className="vb__proof vb__code vb__code--none"><span className="vb__none">{t.none}</span></div>
              )}
              <span className="vb__sr" role="status" aria-live="polite">{copied ? t.copied : ""}</span>
              </div>
            </div>
          </li>

          <li className="vb__st vb__st--3">
            <span className="vb__node" aria-hidden="true"><Glyph kind="disclosure" /></span>
            <div className="vb__body">
              <div className="vb__main">
              <h3 className="v6-h3">{t.s3t}</h3>
              <p className="vb__proof vb__disc">{t.s3b}</p>
              </div>
              <div className="vb__foot">
              <button type="button" className="vb__link v6-small" onClick={goDisclosure}>{t.s3link}<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h9M8.5 4l4 4-4 4" /></svg></button>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}

export const VerifyBand = memo(VerifyBandImpl, (p, n) => p.locale === n.locale && p.venues === n.venues);
