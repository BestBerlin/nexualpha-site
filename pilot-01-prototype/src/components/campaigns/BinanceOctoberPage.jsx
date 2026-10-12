// Binance October campaigns page (/activities/binance-october-gifts, owner 2026-10-12): the 8.8 USDT gifts campaign
// first, then Refer2Earn and the October Referral Tournament. Each section's buttons use only that campaign's tracked
// route (/go/binance-gifts, /go/binance-refer2earn, /go/binance-tournament) and are shown only where Binance may be
// promoted (binanceOctoberSignupGate + the source-bound CTA gate); neutral and restricted editions are informational.
// Owner rules: the reader's reward leads, NexuAlpha only passes the offer on; no fine print on this page.
// SSR renders every word; the countdown ticks after mount so the first client render matches the server HTML.
import React, { useEffect, useState } from "react";
import { BINANCE_OCTOBER_CAMPAIGNS, binanceCampaignActive, binanceCampaignHref } from "../../data/binance-october.js";
import { BINANCE_OCTOBER_COPY } from "../../data/binance-october-copy.js";
import { BINANCE_TOURNAMENT_COPY } from "../../data/binance-october-tournament-copy.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { localizedHref } from "../../data/locale-routing.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { sectionEyebrowAttrs } from "../../data/section-eyebrow.js";
import "./binance-october.css";

const RTL = new Set(["ar", "ur"]);
export const binanceOctoberPageCopy = (locale) => {
  const lang = BINANCE_OCTOBER_COPY[locale] ? locale : "en";
  return { ...BINANCE_OCTOBER_COPY[lang], ...(BINANCE_TOURNAMENT_COPY[lang] || BINANCE_TOURNAMENT_COPY.en), lang };
};
const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  return market ? `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}` : href;
};

function useClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Cta({ href, campaign, children, ghost = false }) {
  if (!href) return null;
  const placement = new URLSearchParams(href.split("?")[1] || "").get("src") || "page";
  return (
    <a className={`nxbg-btn ${ghost ? "nxbg-btn--ghost" : "nxbg-btn--primary"}`} href={href} target="_blank" rel="sponsored noopener noreferrer"
      data-offer-link="go" data-campaign={campaign} data-cta-platform="binance" data-cta-placement={placement}>
      {children}<span aria-hidden="true" className="nxbg-arrow">→</span>
    </a>
  );
}

function Countdown({ t, now, endAt, label }) {
  const end = Date.parse(endAt);
  const left = now ? Math.max(0, end - now.getTime()) : null;
  const parts = left == null ? [null, null, null, null] : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60];
  return (
    <div className="nxbg-count" role="timer" aria-label={label}>
      <span className="nxbg-count__label">{t.endsIn}</span>
      <ol className="nxbg-count__cells">
        {parts.map((value, index) => <li key={t.units[index]}><b>{value == null ? "--" : String(value).padStart(2, "0")}</b><span>{t.units[index]}</span></li>)}
      </ol>
      <time className="nxbg-count__end" dateTime={endAt}>{label}</time>
    </div>
  );
}

function GiftArt() {
  // Our own illustration (no exchange product photos): a voucher ticket and a gift box with a sparkle.
  return (
    <svg className="nxbg-art" viewBox="0 0 320 260" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="nxbg-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe27a" /><stop offset="1" stopColor="#e0a72b" /></linearGradient>
        <linearGradient id="nxbg-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5B82FF" /><stop offset="1" stopColor="#2a4fd6" /></linearGradient>
      </defs>
      <g transform="rotate(-8 160 90)">
        <path d="M60 40h200a10 10 0 0 1 10 10v22a16 16 0 0 0 0 32v22a10 10 0 0 1-10 10H60a10 10 0 0 1-10-10v-22a16 16 0 0 0 0-32V50a10 10 0 0 1 10-10z" fill="url(#nxbg-blue)" />
        <path d="M110 46v84" stroke="#fff" strokeOpacity=".35" strokeDasharray="5 6" strokeWidth="2" />
        <text x="190" y="98" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="800" fontFamily="system-ui, sans-serif">8.8</text>
        <text x="190" y="120" textAnchor="middle" fill="#fff" fillOpacity=".85" fontSize="13" fontWeight="700" letterSpacing="2" fontFamily="system-ui, sans-serif">USDT</text>
        <circle cx="80" cy="88" r="12" fill="#fff" fillOpacity=".9" /><path d="M74 88l4 4 8-8" stroke="#2a4fd6" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <g transform="translate(150 140)">
        <rect x="0" y="34" width="120" height="82" rx="10" fill="url(#nxbg-gold)" />
        <rect x="-8" y="16" width="136" height="28" rx="8" fill="#ffd34d" />
        <rect x="52" y="16" width="16" height="100" fill="#3D6BFF" />
        <path d="M60 16c-20-26-46-14-34-2 6 6 22 4 34 2zm0 0c20-26 46-14 34-2-6 6-22 4-34 2z" fill="none" stroke="#3D6BFF" strokeWidth="6" strokeLinejoin="round" />
      </g>
      <path className="nxbg-art__spark" d="M70 190l6 16 16 6-16 6-6 16-6-16-16-6 16-6z" fill="#ffe27a" />
      <path className="nxbg-art__spark nxbg-art__spark--2" d="M290 30l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#ffe27a" />
    </svg>
  );
}

export function BinanceOctoberPage({ locale = "en", market }) {
  const t = binanceOctoberPageCopy(locale);
  const now = useClock();
  const routeOk = Boolean(publicCtaForVenue("binance", locale, market)?.routeAvailable);
  const href = (key, placement) => (routeOk ? binanceCampaignHref(key, { locale, market, placement: `${key === "gifts" ? "gifts" : key === "refer2earn" ? "r2e" : "tour"}-${placement}` }) : null);
  const gifts = { hero: href("gifts", "hero"), steps: href("gifts", "steps"), final: href("gifts", "final") };
  const r2e = href("refer2earn", "section");
  const tour = href("tournament", "section");
  const offered = Boolean(gifts.hero || r2e || tour);
  const giftsEnded = now ? !binanceCampaignActive("gifts", now) : false;
  const dir = RTL.has(locale) ? "rtl" : "ltr";

  return (
    <main className="nxbg v6 v2-page" id="top" dir={dir} lang={t.lang} data-signup={offered ? "on" : "off"} {...sectionEyebrowAttrs(locale, "campaigns")}>
      <section className="nxbg-hero">
        <div className="nxbg-shell nxbg-hero__inner">
          <div className="nxbg-hero__copy">
            <nav className="nxbg-crumbs" aria-label="Breadcrumb">
              <a href={hrefFor("/activities", locale, market)}>{t.breadcrumb}</a><span aria-hidden="true">/</span><span>{t.crumb}</span>
            </nav>
            <p className="nxbg-tag"><span className="nxbg-hot" data-hot="true">✦</span><BrandMark slug="binance" compact />{t.kicker}</p>
            <h1 className="nxbg-title">{t.h1}</h1>
            <p className="nxbg-sub">{t.sub}</p>
            <ul className="nxbg-stats">
              {t.stats.map(([value, label]) => <li key={label}><b>{value}</b><span>{label}</span></li>)}
            </ul>
            {gifts.hero && !giftsEnded ? (
              <div className="nxbg-actions">
                <Cta href={gifts.hero} campaign="gifts">{t.cta}</Cta>
                <a className="nxbg-btn nxbg-btn--ghost" href="#steps">{t.how}</a>
                <p className="nxbg-auto">{t.auto}</p>
              </div>
            ) : (
              <div className="nxbg-actions">
                {giftsEnded ? <p className="nxbg-neutral">{t.ended}</p> : !offered ? <p className="nxbg-neutral">{t.neutralLead}</p> : null}
                <a className="nxbg-btn nxbg-btn--ghost" href="#steps">{t.how}</a>
              </div>
            )}
          </div>
          <div className="nxbg-hero__art"><GiftArt /></div>
        </div>
      </section>

      <section className="nxbg-shell nxbg-section" id="steps" aria-labelledby="nxbg-steps">
        <h2 id="nxbg-steps">{t.stepsH}</h2>
        <Countdown t={t} now={now} endAt={BINANCE_OCTOBER_CAMPAIGNS.gifts.endAt} label={t.endsAt} />
        <ol className="nxbg-steps">
          {t.steps.map(([title, body], index) => (
            <li key={title} className="nxbg-step">
              <span className="nxbg-step__n">{index + 1}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </li>
          ))}
        </ol>
        <p className="nxbg-check"><span aria-hidden="true">⏱</span>{t.checkNote}</p>
        {gifts.steps && !giftsEnded && <div className="nxbg-actions"><Cta href={gifts.steps} campaign="gifts">{t.cta}</Cta></div>}
      </section>

      <section className="nxbg-shell nxbg-section" aria-labelledby="nxbg-gifts">
        <p className="nxbg-tag"><span className="nxbg-hot" data-hot="true">✦</span>{t.kicker}</p>
        <h2 id="nxbg-gifts">{t.giftsH}</h2>
        <p className="nxbg-lead">{t.giftsLead}</p>
        <ol className="nxbg-tiers">
          {t.tiers.map(([who, what], index) => <li key={who} style={{ "--tier": index }}><b>{who}</b><span>{what}</span></li>)}
        </ol>
        <p className="nxbg-note">{t.giftsList}</p>
      </section>

      <section className="nxbg-band" aria-labelledby="nxbg-tour">
        <div className="nxbg-shell nxbg-section">
          <p className="nxbg-tag"><span className="nxbg-hot" data-hot="true">✦</span>{t.tKicker}</p>
          <h2 id="nxbg-tour">{t.tH}</h2>
          <p className="nxbg-lead">{t.tLead}</p>
          <Countdown t={t} now={now} endAt={BINANCE_OCTOBER_CAMPAIGNS.tournament.endAt} label={t.tEndsAt} />
          <ul className="nxbg-cards">
            {t.tRewards.map(([title, body]) => <li key={title}><h3>{title}</h3><p>{body}</p></li>)}
          </ul>
          <h3 className="nxbg-subh">{t.tPointsH}</h3>
          <ul className="nxbg-points">
            {t.tPoints.map(([task, points]) => <li key={task}><span>{task}</span><b>{points}</b></li>)}
          </ul>
          <ol className="nxbg-mini-steps">{t.tSteps.map((step) => <li key={step}>{step}</li>)}</ol>
          {tour && <div className="nxbg-actions"><Cta href={tour} campaign="tournament">{t.tCta}</Cta></div>}
        </div>
      </section>

      <section className="nxbg-shell nxbg-section" aria-labelledby="nxbg-r2e">
        <p className="nxbg-tag"><span className="nxbg-hot" data-hot="true">✦</span>{t.r2eKicker}</p>
        <h2 id="nxbg-r2e">{t.r2eH}</h2>
        <p className="nxbg-lead">{t.r2eLead}</p>
        <ul className="nxbg-cards">
          {t.r2eFacts.map(([title, body]) => <li key={title}><h3>{title}</h3><p>{body}</p></li>)}
        </ul>
        {r2e && <div className="nxbg-actions"><Cta href={r2e} campaign="refer2earn" ghost>{t.r2eCta}</Cta><p className="nxbg-auto">{t.r2eChoose}</p></div>}
      </section>

      <section className="nxbg-shell nxbg-section" aria-labelledby="nxbg-faq">
        <h2 id="nxbg-faq">{t.faqH}</h2>
        <div className="nxbg-faq">
          {[...t.faq, ...t.tFaq].map(([question, answer]) => (
            <details key={question}><summary>{question}</summary><p>{answer}</p></details>
          ))}
        </div>
      </section>

      {gifts.final && !giftsEnded && (
        <section className="nxbg-shell nxbg-section nxbg-final" aria-label={t.cta}>
          <p className="nxbg-final__title">{t.h1}</p>
          <div className="nxbg-actions nxbg-actions--center"><Cta href={gifts.final} campaign="gifts">{t.cta}</Cta></div>
          <p className="nxbg-auto">{t.auto}</p>
        </section>
      )}

      <nav className="nxbg-shell nxbg-section nxbg-related" aria-label={t.relatedH}>
        <h2>{t.relatedH}</h2>
        <ul>{t.related.map(([label, path]) => <li key={path}><a href={hrefFor(path, locale, market)}>{label} <span aria-hidden="true">→</span></a></li>)}</ul>
      </nav>
    </main>
  );
}

export default BinanceOctoberPage;
