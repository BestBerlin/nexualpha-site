// Bybit Stocks campaign landing page (/activities/bybit-stocks, owner 2026-10-12). Every fact is from Bybit's Help Center,
// its announcement feed or its own launch press releases (see src/data/bybit-stocks.js). The sign-up uses the registry
// invite code through /go/bybit and is shown only where Bybit Stocks may be promoted (bybitStocksSignup); neutral and
// restricted editions are informational. Owner rule: no fine print on this page (footer/legal only).
// SSR renders every word; the browser adds the countdown, local session times and the copy button after mount, so the
// first client render matches the server HTML.
import React, { useEffect, useState } from "react";
import { BYBIT_STOCKS_CAMPAIGN, BYBIT_STOCKS_UPDATE_PATH } from "../../data/bybit-stocks.js";
import { bybitStocksSignup } from "../../data/bybit-stocks-signup.js";
import { BYBIT_STOCKS_COPY } from "../../data/bybit-stocks-copy.js";
import { localizedHref } from "../../data/locale-routing.js";
import { formatSgt } from "../../data/local-time.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "./bybit-stocks.css";

const RTL = new Set(["ar", "ur"]);
const TICKERS = ["AAPL", "NVDA", "TSLA", "MU", "QQQ"];
// Session bands in New York time, in the order of the day starting from the overnight open (8 PM ET).
const SESSIONS = [[20, 4], [4, 9.5], [9.5, 16], [16, 20]];
const SESSION_KEYS = ["overnight", "pre", "regular", "post"];
const NEWS_PATH = "/news/bybit-us-stocks-etfs-usdc-alpaca-what-you-own";
const RELATED = ["/exchanges/bybit", NEWS_PATH, "/academy/first-spot-trade", "/academy/kyc-who-gets-your-id"];

const fill = (template, vars) => String(template || "").replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? "");
export const bybitStocksPageCopy = (locale) => BYBIT_STOCKS_COPY[locale] || (String(locale || "").startsWith("zh") ? BYBIT_STOCKS_COPY["zh-Hans"] || BYBIT_STOCKS_COPY.en : BYBIT_STOCKS_COPY.en);
const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  return market ? `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}` : href;
};

// Minutes New York is ahead of UTC at `date` (negative: -240 in summer, -300 in winter).
function newYorkOffset(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(date).map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute));
  return Math.round((asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
}
function sgtTime(etHour, locale, now) {
  const offset = newYorkOffset(now);
  const base = new Date(now);
  base.setUTCHours(0, 0, 0, 0);
  const instant = new Date(base.getTime() + (etHour * 60 - offset) * 60000);
  return formatSgt(instant.toISOString(), locale, "clock");
}

function useClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function CodeChip({ code, t }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the code stays visible */ }
  };
  return (
    <span className="nxbs-code">
      <span className="nxbs-code__label">{t.codeLabel}</span>
      <code translate="no">{code}</code>
      <button type="button" onClick={doCopy} aria-live="polite">{copied ? `${t.copied} ✓` : t.copy}</button>
    </span>
  );
}

function SignupButton({ signup, t, className = "" }) {
  return (
    <a className={`nxbs-btn nxbs-btn--primary ${className}`} href={signup.href} target="_blank" rel="sponsored noopener noreferrer"
      data-offer-link="go" data-cta-platform="bybit" data-cta-placement={signup.href.split("src=")[1]}>
      {fill(t.cta, { code: signup.code })}<span aria-hidden="true" className="nxbs-arrow">→</span>
    </a>
  );
}

function Countdown({ t, now, locale = "en" }) {
  const end = Date.parse(BYBIT_STOCKS_CAMPAIGN.endAt);
  if (now && now.getTime() >= end) return <p className="nxbs-count nxbs-count--ended">{t.ended}</p>;
  const left = now ? Math.max(0, end - now.getTime()) : null;
  const parts = left == null ? [null, null, null, null] : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60];
  const endLabel = formatSgt(BYBIT_STOCKS_CAMPAIGN.endAt, locale, "end") || t.endsAt;
  return (
    <div className="nxbs-count" role="timer" aria-label={endLabel}>
      <span className="nxbs-count__label">{t.endsIn}</span>
      <ol className="nxbs-count__cells">
        {parts.map((value, index) => (
          <li key={t.units[index]}><b>{value == null ? "--" : String(value).padStart(2, "0")}</b><span>{t.units[index]}</span></li>
        ))}
      </ol>
      <time className="nxbs-count__end" dateTime={BYBIT_STOCKS_CAMPAIGN.endAt}>{endLabel}</time>
    </div>
  );
}

export function BybitStocksPage({ locale = "en", market }) {
  const t = bybitStocksPageCopy(locale);
  const now = useClock();
  const signupFor = (placement) => bybitStocksSignup({ locale, market, placement });
  const hero = signupFor("hero");
  const final = signupFor("final");
  const stepsSignup = signupFor("steps");
  const campaignSignup = signupFor("campaign");
  const dir = RTL.has(locale) ? "rtl" : "ltr";
  const steps = t.steps.map((step, index) => (index === 0 && !stepsSignup ? t.stepOneNeutral : step));
  const lang = BYBIT_STOCKS_COPY[locale] ? locale : "en";
  const campaignLead = String(t.campaignLead || "").replace("00:00 UTC", "08:00 SGT");

  return (
    <main className="nxbs nxbs-page" id="top" dir={dir} lang={lang} data-signup={hero ? "on" : "off"}>
      <section className="nxbs-hero">
        <div className="nxbs-shell nxbs-hero__inner">
          <div className="nxbs-hero__copy">
            <nav className="nxbs-crumbs" aria-label="Breadcrumb">
              <a href={hrefFor("/activities", locale, market)}>{t.breadcrumb}</a><span aria-hidden="true">/</span><span>Bybit Stocks</span>
            </nav>
            <h1 className="nxbs-title">{t.h1}</h1>
            <p className="nxbs-sub">{t.sub}</p>
            <ul className="nxbs-deal">{t.dealChips.map((chip) => <li key={chip}><span aria-hidden="true">✓</span>{chip}</li>)}</ul>
            <ul className="nxbs-tickers" aria-label={t.tickersLabel}>
              {TICKERS.map((ticker) => <li key={ticker} translate="no">{ticker}</li>)}
            </ul>
            {hero ? (
              <div className="nxbs-actions">
                <SignupButton signup={hero} t={t} />
                <a className="nxbs-btn nxbs-btn--ghost" href="#how">{t.how}</a>
                <CodeChip code={hero.code} t={t} />
              </div>
            ) : (
              <div className="nxbs-actions">
                <p className="nxbs-neutral">{t.neutralLead}</p>
                <a className="nxbs-btn nxbs-btn--ghost" href="#how">{t.how}</a>
              </div>
            )}
          </div>
          <div className="nxbs-hero__card" aria-hidden="true">
            <div className="nxbs-ticket">
              <div className="nxbs-ticket__head"><BrandMark slug="bybit" compact /><span>Bybit Stocks</span></div>
              {TICKERS.slice(0, 3).map((ticker) => (
                <div key={ticker} className="nxbs-ticket__row"><b translate="no">{ticker}</b><span>USDC</span></div>
              ))}
              <div className="nxbs-ticket__min"><span>≥</span><b>5 USDC</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="nxbs-shell nxbs-section" aria-labelledby="nxbs-facts">
        <h2 id="nxbs-facts">{t.factsH}</h2>
        <ul className="nxbs-facts">
          {t.facts.map(([title, body], index) => (
            <li key={title} className="nxbs-fact"><span className="nxbs-fact__n">{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{body}</p></li>
          ))}
        </ul>
      </section>

      <section className="nxbs-shell nxbs-section" id="how" aria-labelledby="nxbs-steps">
        <h2 id="nxbs-steps">{t.stepsH}</h2>
        <ol className="nxbs-steps">
          {steps.map(([title, body], index) => (
            <li key={index} className="nxbs-step">
              <span className="nxbs-step__n">{index + 1}</span>
              <div><h3>{title}</h3><p>{fill(body, { code: stepsSignup?.code || "" })}</p></div>
            </li>
          ))}
        </ol>
        {stepsSignup && <div className="nxbs-actions nxbs-inline-cta"><SignupButton signup={stepsSignup} t={t} /><CodeChip code={stepsSignup.code} t={t} /></div>}
      </section>

      <section className="nxbs-shell nxbs-section" aria-labelledby="nxbs-sessions">
        <h2 id="nxbs-sessions">{t.sessionsH}</h2>
        <p className="nxbs-lead">{t.sessionsLead}</p>
        <div className="nxbs-timeline" role="list">
          {t.sessions.map(([name, hours, note], index) => {
            const [from, to] = SESSIONS[index];
            const span = (to - from + 24) % 24;
            return (
              <div key={SESSION_KEYS[index]} role="listitem" className={`nxbs-session nxbs-session--${SESSION_KEYS[index]}`} style={{ "--span": span }}>
                <span className="nxbs-session__bar" aria-hidden="true" />
                <b>{name}</b>
                <span className="nxbs-session__et" translate="no" suppressHydrationWarning>{now ? `${sgtTime(from, locale, now)} – ${sgtTime(to, locale, now)}` : "SGT"}</span>
                <span className="nxbs-session__note">{note}</span>
                <span className="nxbs-session__local" aria-hidden="true"> </span>
              </div>
            );
          })}
        </div>
        <p className="nxbs-note">{t.sessionsWeekend}</p>
      </section>

      <section className="nxbs-campaign" aria-labelledby="nxbs-campaign">
        <div className="nxbs-shell nxbs-section">
          <h2 id="nxbs-campaign"><span className="nxbs-hot" aria-hidden="true">✦</span> {t.campaignH}</h2>
          <p className="nxbs-lead">{campaignLead}</p>
          <Countdown t={t} now={now} locale={locale} />
          <ul className="nxbs-rewards">
            {t.rewards.map(([title, body]) => <li key={title}><h3>{title}</h3><p>{body}</p></li>)}
          </ul>
          <div className="nxbs-multipliers">
            <h3>{t.multipliersH}</h3>
            <div className="nxbs-multipliers__grid">
              {[[t.multiplierEarly, t.multiplierEarlyRows], [t.multiplierHold, t.multiplierHoldRows]].map(([caption, rows]) => (
                <table key={caption}>
                  <caption>{caption}</caption>
                  <tbody>{rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody>
                </table>
              ))}
            </div>
          </div>
          <div className="nxbs-who">
            <h3>{t.whoH}</h3>
            <p>{t.who}</p>
            <a href={hrefFor(BYBIT_STOCKS_UPDATE_PATH, locale, market)}>{t.officialLink} →</a>
          </div>
          {campaignSignup && <div className="nxbs-actions"><SignupButton signup={campaignSignup} t={t} /><CodeChip code={campaignSignup.code} t={t} /></div>}
        </div>
      </section>

      <section className="nxbs-shell nxbs-section" aria-labelledby="nxbs-compare">
        <h2 id="nxbs-compare">{t.compareH}</h2>
        <div className="nxbs-table-wrap" tabIndex={0} role="region" aria-labelledby="nxbs-compare">
          <table className="nxbs-compare">
            <thead><tr><td /><th scope="col" className="is-us">{t.compareCols[0]}</th><th scope="col">{t.compareCols[1]}</th><th scope="col">{t.compareCols[2]}</th></tr></thead>
            <tbody>
              {t.compareRows.map(([label, ...cells]) => (
                <tr key={label}><th scope="row">{label}</th>{cells.map((cell, index) => <td key={index} className={index === 0 ? "is-us" : undefined}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="nxbs-shell nxbs-section" aria-labelledby="nxbs-faq">
        <h2 id="nxbs-faq">{t.faqH}</h2>
        <div className="nxbs-faq">
          {t.faq.map(([question, answer], index) => (
            <details key={question} open={index < 2}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="nxbs-shell nxbs-section" aria-labelledby="nxbs-related">
        <h2 id="nxbs-related">{t.relatedH}</h2>
        <ul className="nxbs-related">
          {t.related.map(([title, body], index) => (
            <li key={RELATED[index]}><a href={hrefFor(RELATED[index], locale, market)}><b>{title}</b><span>{body}</span></a></li>
          ))}
        </ul>
      </section>

      <section className="nxbs-shell nxbs-final" aria-labelledby="nxbs-final">
        {final ? (
          <>
            <h2 id="nxbs-final">{t.finalH}</h2>
            <p>{fill(t.finalBody, { code: final.code })}</p>
            <div className="nxbs-actions nxbs-actions--center"><SignupButton signup={final} t={t} /><CodeChip code={final.code} t={t} /></div>
          </>
        ) : (
          <>
            <h2 id="nxbs-final">{t.finalNeutralH}</h2>
            <p>{t.finalNeutralBody}</p>
            <div className="nxbs-actions nxbs-actions--center"><a className="nxbs-btn nxbs-btn--ghost" href={hrefFor(NEWS_PATH, locale, market)}>{t.related[1][0]} →</a></div>
          </>
        )}
      </section>
    </main>
  );
}

export default BybitStocksPage;
