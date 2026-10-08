// V6 act 3: "Verify before you leave" — a route of three stations (domain, code, disclosure).
import { useEffect, useMemo, useRef, useState } from "react";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { localizedHref } from "../../data/locale-routing.js";
import { getVerifyCopy } from "./verify-copy.js";

function useInViewOnce(ref) {
  const [on, setOn] = useState(false);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    setArmed(true);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return [armed, on];
}

const Glyph = ({ kind }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "domain" && <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.4 3.6 5.2 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.2-3.6-8.5s1-6.1 3.6-8.5z" /></>}
    {kind === "code" && <><rect x="3.5" y="7" width="17" height="10" rx="2" /><path d="M9 7v10" strokeDasharray="1.5 2.5" /><path d="M13 11h4M13 13.5h2.5" /></>}
    {kind === "disclosure" && <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" /></>}
  </svg>
);

export function VerifyBand({ locale = "en", venues = [], selected = [] }) {
  const t = getVerifyCopy(locale);
  const rows = useMemo(() => {
    const seen = new Set();
    const slugs = [...selected, ...venues.map((v) => v?.slug)].filter((s) => s && !seen.has(s) && seen.add(s));
    const out = [];
    for (const slug of slugs) {
      let cta; try { cta = publicCtaForVenue(slug, locale); } catch { continue; }
      if (!cta?.officialDomain) continue;
      const v = venues.find((x) => x?.slug === slug);
      out.push({ slug, name: v?.name || cta.name || slug, domain: String(cta.officialDomain).replace(/^https?:\/\//, "").replace(/\/.*$/, ""), code: cta.hasReferral && cta.inviteCode ? String(cta.inviteCode) : null });
      if (out.length >= 5) break;
    }
    return out;
  }, [venues, selected, locale]);

  const [pick, setPick] = useState(null);
  const row = rows.find((r) => r.slug === pick) || rows[0];
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  const route = useRef(null);
  const [armed, live] = useInViewOnce(route);
  useEffect(() => () => clearTimeout(timer.current), []);
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

  return (
    <section className="v6-section vb" id="verify" aria-labelledby="vb-title">
      <div className="v6-wrap">
        <header className="vb__head">
          <h2 className="v6-h1 vb__title" id="vb-title">{t.title}</h2>
          <div className="vb__aside">
            <p className="v6-body vb__lead">{t.lead}</p>
            <div className="vb__venues" role="group" aria-label={t.venue}>
              {rows.map((r) => (
                <button key={r.slug} type="button" className="vb__venue" aria-pressed={r.slug === row.slug} onClick={() => { setPick(r.slug); setCopied(false); }}>{r.name}</button>
              ))}
            </div>
          </div>
        </header>

        <ol className="vb__route" ref={route} data-armed={armed ? "" : undefined} data-live={live ? "" : undefined}>
          <li className="vb__line" aria-hidden="true"><i /></li>

          <li className="vb__st vb__st--1">
            <span className="vb__node" aria-hidden="true"><Glyph kind="domain" /></span>
            <div className="vb__body">
              <h3 className="v6-h3">{t.s1t}</h3>
              <div className="vb__proof vb__bar" key={row.slug} lang="en" translate="no" dir="ltr" style={{ "--n": chars.length }}>
                <span className="vb__sr">{row.domain}</span>
                <svg className="vb__lock" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path pathLength="1" d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
                  <rect pathLength="1" x="5.5" y="10.5" width="13" height="9.5" rx="2.5" />
                  <path pathLength="1" d="M12 14.5v2" />
                </svg>
                <span className="vb__typed" aria-hidden="true">{row.domain}</span>
                <span className="vb__stamp" aria-hidden="true" lang={locale} translate="yes" dir="auto">{t.official}</span>
              </div>
              <p className="v6-small vb__ok"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.8" /></svg>{t.s1ok}</p>
              <p className="v6-body vb__desc">{t.s1d}</p>
            </div>
          </li>

          <li className="vb__st vb__st--2">
            <span className="vb__node" aria-hidden="true"><Glyph kind="code" /></span>
            <div className="vb__body">
              <h3 className="v6-h3">{t.s2t}</h3>
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
              <p className="v6-body vb__desc">{t.s2d}</p>
            </div>
          </li>

          <li className="vb__st vb__st--3">
            <span className="vb__node" aria-hidden="true"><Glyph kind="disclosure" /></span>
            <div className="vb__body">
              <h3 className="v6-h3">{t.s3t}</h3>
              <p className="vb__proof vb__disc">{t.s3b}</p>
              <button type="button" className="vb__link v6-small" onClick={goDisclosure}>{t.s3link}<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h9M8.5 4l4 4-4 4" /></svg></button>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
