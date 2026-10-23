import { SignupEvidence } from "../shared/SignupEvidence.jsx";
// Bitget Alliance campaign landing page (/activities/bitget-alliance, owner 2026-10-13). Every fact is from Bitget's own
// announcement and campaign page (see src/data/bitget-alliance.js). The CTA uses the campaign code through the tracked
// /go/bitget-alliance route and is shown only where Bitget may be promoted (bitgetAllianceSignup); neutral and restricted
// editions are informational. Owner rules: lead with the pool and what the reader gets; no fine print (footer/legal only).
// SSR renders every word with Bitget's figures baked into src/data/bitget-alliance.js; after mount the browser refreshes
// them from /intel/bitget-alliance.json and adds the countdown and the copy button, so the first client render matches.
import React, { useEffect, useMemo, useState } from "react";
import {
  BITGET_ALLIANCE_CAMPAIGN, BITGET_ALLIANCE_POOL_JSON, BITGET_ALLIANCE_SNAPSHOT, BITGET_ALLIANCE_UPDATE_PATH,
  bitgetAllianceDailyReward, bitgetAllianceSignup,
} from "../../data/bitget-alliance.js";
import { BITGET_ALLIANCE_COPY } from "../../data/bitget-alliance-copy.js";
import { localizedHref } from "../../data/locale-routing.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "./bitget-alliance.css";

const RTL = new Set(["ar", "ur"]);
const RELATED = ["/exchanges/bitget", BITGET_ALLIANCE_UPDATE_PATH, "/academy/first-spot-trade", "/academy/kyc-who-gets-your-id"];
const EXAMPLE_TRADES = [10000, 100000, 1000000, 3000000];
const EXAMPLE_HOLDS = [10000, 100000];
const POOL_KEYS = ["statDay", "totalPool", "tradePool", "assetPool", "dailyTradePool", "dailyAssetPool", "tradeVolume", "assetValue"];

const fill = (template, vars) => String(template || "").replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? "");
export const bitgetAlliancePageCopy = (locale) => BITGET_ALLIANCE_COPY[locale] || (String(locale || "").startsWith("zh") ? BITGET_ALLIANCE_COPY["zh-Hans"] || BITGET_ALLIANCE_COPY.en : BITGET_ALLIANCE_COPY.en);
const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  return market ? `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}` : href;
};
// One number format in every edition (same digits as the copy and Bitget's page).
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const usdt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => int.format(n);
const fmtUsdt = (n) => usdt.format(n);
function fmtDay(day, locale) {
  try { return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`)); } catch { return day; }
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

// Bitget's figures: the baked snapshot first (SSR = first client render), then the server's live copy if it is valid.
function usePool() {
  const [pool, setPool] = useState({ ...BITGET_ALLIANCE_SNAPSHOT, live: false });
  useEffect(() => {
    let cancelled = false;
    fetch(BITGET_ALLIANCE_POOL_JSON, { headers: { accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data || !POOL_KEYS.every((key) => key === "statDay" ? typeof data.statDay === "string" : Number.isFinite(data[key]))) return;
        if (data.totalPool < BITGET_ALLIANCE_SNAPSHOT.totalPool * 0.5) return;
        setPool((prev) => ({ ...prev, ...Object.fromEntries(POOL_KEYS.map((key) => [key, data[key]])), live: true }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return pool;
}

function CodeChip({ code, t }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the code stays visible */ }
  };
  return (
    <span className="nxba-code">
      <span className="nxba-code__label">{t.codeLabel}</span>
      <code translate="no">{code}</code>
      <button type="button" onClick={doCopy} aria-live="polite">{copied ? `${t.copied} ✓` : t.copy}</button>
    </span>
  );
}

function JoinButton({locale = "en", market,  signup, t, placement }) {
  return (
    <span data-signup-cta={"bitget"} className="signup-cta-block"><a className="nxba-btn nxba-btn--primary" href={signup.href} target="_blank" rel="sponsored noopener noreferrer"
      data-offer-link="go" data-campaign="bitget-alliance" data-cta-platform="bitget" data-cta-placement={`alliance-${placement}`}>
      {fill(t.cta, { code: signup.code })}<span aria-hidden="true" className="nxba-arrow">→</span>
    </a><SignupEvidence slug={"bitget"} locale={locale} market={market} /></span>
  );
}

function Join({ locale, market, signup, t, placement, center = false }) {
  if (!signup) return null;
  return (
    <div className={`nxba-actions${center ? " nxba-actions--center" : ""}`}>
      <JoinButton locale={locale} market={market} signup={signup} t={t} placement={placement} />
      <CodeChip code={signup.code} t={t} />
    </div>
  );
}

function Countdown({ t, now }) {
  const end = Date.parse(BITGET_ALLIANCE_CAMPAIGN.endAt);
  if (now && now.getTime() >= end) return <p className="nxba-count nxba-count--ended">{t.ended}</p>;
  const left = now ? Math.max(0, end - now.getTime()) : null;
  const parts = left == null ? [null, null, null, null] : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60];
  return (
    <div className="nxba-count" role="timer" aria-label={t.endsAt}>
      <span className="nxba-count__label">{t.endsIn}</span>
      <ol className="nxba-count__cells">
        {parts.map((value, index) => (
          <li key={t.units[index]}><b>{value == null ? "--" : String(value).padStart(2, "0")}</b><span>{t.units[index]}</span></li>
        ))}
      </ol>
      <time className="nxba-count__end" dateTime={BITGET_ALLIANCE_CAMPAIGN.endAt}>{t.endsAt}</time>
    </div>
  );
}

function PoolCard({ pool, t, locale, now }) {
  return (
    <div className="nxba-pool" aria-live="polite">
      <div className="nxba-pool__head">
        <span className="nxba-pool__brand"><BrandMark slug="bitget" compact /><b>Bitget.com</b></span>
        {pool.live ? <span className="nxba-pool__live" data-live="true"><i aria-hidden="true" />{t.poolLive}</span> : null}
      </div>
      <p className="nxba-pool__label">{t.poolLabel}</p>
      <p className="nxba-pool__total" translate="no">{fmtUsdt(pool.totalPool)}</p>
      <dl className="nxba-pool__split">
        <div><dt>{t.tradePoolLabel}</dt><dd translate="no">{fmtUsdt(pool.tradePool)}</dd></div>
        <div><dt>{t.assetPoolLabel}</dt><dd translate="no">{fmtUsdt(pool.assetPool)}</dd></div>
      </dl>
      <p className="nxba-pool__asof" suppressHydrationWarning>{fill(t.poolAsOf, { date: fmtDay(pool.statDay, locale) })}</p>
      <p className="nxba-pool__users">{fill(t.rewardedLabel, { n: `${fmtInt(BITGET_ALLIANCE_SNAPSHOT.rewardedUsers)}+` })}</p>
      <Countdown t={t} now={now} />
    </div>
  );
}

function Estimator({ pool, t, locale }) {
  const [volume, setVolume] = useState(100000);
  const [assets, setAssets] = useState(10000);
  const reward = bitgetAllianceDailyReward({ volume, assets }, pool);
  const clean = (value) => Math.max(0, Math.min(Number(String(value).replace(/[^\d.]/g, "")) || 0, 1e10));
  return (
    <form className="nxba-calc" onSubmit={(event) => event.preventDefault()} aria-labelledby="nxba-calc-h">
      <h3 id="nxba-calc-h">{t.calcH}</h3>
      <label><span>{t.calcVolume}</span><input inputMode="decimal" value={fmtInt(volume)} onChange={(event) => setVolume(clean(event.target.value))} /></label>
      <label><span>{t.calcAssets}</span><input inputMode="decimal" value={fmtInt(assets)} onChange={(event) => setAssets(clean(event.target.value))} /></label>
      <output className="nxba-calc__out" translate="no">{fill(t.calcResult, { x: fmtUsdt(reward.total) })}</output>
      <p className="nxba-calc__note" suppressHydrationWarning>{fill(t.calcNote, { date: fmtDay(pool.statDay, locale) })}</p>
    </form>
  );
}

export function BitgetAlliancePage({ locale = "en", market }) {
  const t = bitgetAlliancePageCopy(locale);
  const now = useClock();
  const pool = usePool();
  const signupFor = (placement) => bitgetAllianceSignup({ locale, market, placement });
  const hero = signupFor("hero");
  const dir = RTL.has(locale) ? "rtl" : "ltr";
  const lang = BITGET_ALLIANCE_COPY[locale] ? locale : "en";
  const steps = t.steps.map((step, index) => (index === 0 && !hero ? t.stepOneNeutral : step));
  const day = fmtDay(pool.statDay, locale);
  const exampleTotal = useMemo(() => bitgetAllianceDailyReward({ volume: 100000, assets: 10000 }, pool).total, [pool]);

  return (
    <main className="nxba nxba-page" id="top" dir={dir} lang={lang} data-signup={hero ? "on" : "off"}>
      <section className="nxba-hero">
        <div className="nxba-shell nxba-hero__inner">
          <div className="nxba-hero__copy">
            <nav className="nxba-crumbs" aria-label="Breadcrumb">
              <a href={hrefFor("/activities", locale, market)}>{t.breadcrumb}</a><span aria-hidden="true">/</span><span>Bitget Alliance</span>
            </nav>
            <p className="nxba-kicker"><span className="nxba-hot" aria-hidden="true">✦</span>{t.kicker}</p>
            <h1 className="nxba-title">{t.h1}</h1>
            <p className="nxba-sub">{t.sub}</p>
            <ul className="nxba-deal">{t.dealChips.map((chip) => <li key={chip}><span aria-hidden="true">✓</span>{chip}</li>)}</ul>
            {hero ? <Join locale={locale} market={market} signup={hero} t={t} placement="hero" /> : (
              <div className="nxba-actions">
                <p className="nxba-neutral">{t.neutralLead}</p>
                <a className="nxba-btn nxba-btn--ghost" href="#how">{t.how}</a>
              </div>
            )}
          </div>
          <PoolCard pool={pool} t={t} locale={locale} now={now} />
        </div>
      </section>

      <section className="nxba-shell nxba-section" id="how" aria-labelledby="nxba-steps">
        <h2 id="nxba-steps">{t.stepsH}</h2>
        <ol className="nxba-steps">
          {steps.map(([title, body], index) => (
            <li key={index} className="nxba-step">
              <span className="nxba-step__n">{index + 1}</span>
              <div><h3>{fill(title, { code: hero?.code || "" })}</h3><p>{fill(body, { code: hero?.code || "" })}</p></div>
            </li>
          ))}
        </ol>
        <Join locale={locale} market={market} signup={signupFor("steps")} t={t} placement="steps" />
      </section>

      <section className="nxba-shell nxba-section" aria-labelledby="nxba-mech">
        <h2 id="nxba-mech">{t.mechanicsH}</h2>
        <p className="nxba-lead">{t.mechanicsLead}</p>
        <ul className="nxba-mech">
          {t.mechanics.map(([title, body], index) => (
            <li key={title} className={`nxba-mech__item nxba-mech__item--${index}`}><h3>{title}</h3><p>{body}</p></li>
          ))}
        </ul>
      </section>

      <section className="nxba-shell nxba-section" aria-labelledby="nxba-example">
        <h2 id="nxba-example">{t.exampleH}</h2>
        <p className="nxba-lead" suppressHydrationWarning>{fill(t.exampleLead, { date: day, dtp: fmtUsdt(pool.dailyTradePool), tv: fmtInt(pool.tradeVolume), dap: fmtUsdt(pool.dailyAssetPool), av: fmtInt(pool.assetValue) })}</p>
        <div className="nxba-example">
          <div className="nxba-table-wrap" tabIndex={0} role="region" aria-labelledby="nxba-example">
            <table className="nxba-table">
              <thead><tr><th scope="col">{t.exampleCols[0]}</th><th scope="col">{t.exampleCols[1]}</th></tr></thead>
              <tbody>
                {EXAMPLE_TRADES.map((v) => (
                  <tr key={`t${v}`}><th scope="row">{fill(t.exampleTrade, { v: fmtInt(v) })}</th><td translate="no">{`≈ ${fmtUsdt(bitgetAllianceDailyReward({ volume: v }, pool).trade)} USDT`}</td></tr>
                ))}
                {EXAMPLE_HOLDS.map((v) => (
                  <tr key={`h${v}`}><th scope="row">{fill(t.exampleHold, { v: fmtInt(v) })}</th><td translate="no">{`≈ ${fmtUsdt(bitgetAllianceDailyReward({ assets: v }, pool).asset)} USDT`}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <Estimator pool={pool} t={t} locale={locale} />
        </div>
        <p className="nxba-total">{fill(t.exampleTotal, { t: fmtUsdt(exampleTotal) })}</p>
        <Join locale={locale} market={market} signup={signupFor("example")} t={t} placement="example" />
      </section>

      <section className="nxba-box" aria-labelledby="nxba-box">
        <div className="nxba-shell nxba-section">
          <h2 id="nxba-box"><span className="nxba-hot" aria-hidden="true">✦</span>{` ${t.boxH}`}</h2>
          <p className="nxba-lead">{t.boxBody}</p>
          <ul className="nxba-prizes">
            {t.boxPrizes.map(([title, body]) => <li key={title}><h3>{title}</h3><p>{body}</p></li>)}
          </ul>
        </div>
      </section>

      <section className="nxba-shell nxba-section nxba-facts" aria-labelledby="nxba-dates">
        <div>
          <h2 id="nxba-dates">{t.datesH}</h2>
          <dl className="nxba-dates">
            {t.dates.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </div>
        <div className="nxba-who">
          <h2>{t.whoH}</h2>
          <p>{t.who}</p>
          <a href={hrefFor(BITGET_ALLIANCE_UPDATE_PATH, locale, market)}>{t.officialLink} →</a>
        </div>
      </section>

      <section className="nxba-shell nxba-section" aria-labelledby="nxba-faq">
        <h2 id="nxba-faq">{t.faqH}</h2>
        <div className="nxba-faq">
          {t.faq.map(([question, answer], index) => (
            <details key={question} open={index < 2}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="nxba-shell nxba-section" aria-labelledby="nxba-related">
        <h2 id="nxba-related">{t.relatedH}</h2>
        <ul className="nxba-related">
          {t.related.map(([title, body], index) => (
            <li key={RELATED[index]}><a href={hrefFor(RELATED[index], locale, market)}><b>{title}</b><span>{body}</span></a></li>
          ))}
        </ul>
      </section>

      <section className="nxba-shell nxba-final" aria-labelledby="nxba-final">
        {hero ? (
          <>
            <h2 id="nxba-final">{t.finalH}</h2>
            <p>{fill(t.finalBody, { code: hero.code })}</p>
            <Join locale={locale} market={market} signup={signupFor("final")} t={t} placement="final" center />
          </>
        ) : (
          <>
            <h2 id="nxba-final">{t.finalNeutralH}</h2>
            <p>{t.finalNeutralBody}</p>
            <div className="nxba-actions nxba-actions--center"><a className="nxba-btn nxba-btn--ghost" href={hrefFor("/exchanges/bitget", locale, market)}>{t.related[0][0]} →</a></div>
          </>
        )}
      </section>
    </main>
  );
}

export default BitgetAlliancePage;
