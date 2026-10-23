import { SignupEvidence } from "../shared/SignupEvidence.jsx";
// Kraken 5M USDG Futures Challenge landing page (/activities/kraken-usdg-challenge, owner 2026-10-13). Every fact is from
// Kraken's official rules and challenge page (see src/data/kraken-usdg.js). Funnel: step 1 = Kraken account with our
// registry code through /go/kraken (primary CTA + copy button), step 2 = register on Kraken's challenge page through
// /go/kraken-usdg-challenge (secondary, new tab, always after step 1), step 3 = trade futures to 50,000 USD. Shown only
// where the challenge may be promoted (krakenUsdgSignup); neutral and restricted editions are informational.
// Owner rules: lead with the pool and what the reader gets; no fine print (footer/legal only); times in SGT.
// SSR renders every word with Kraken's figures baked into src/data/kraken-usdg.js; after mount the browser refreshes
// them from /intel/kraken-usdg.json and adds the countdown and the copy button, so the first client render matches.
import React, { useEffect, useState } from "react";
import {
  KRAKEN_USDG_CAMPAIGN, KRAKEN_USDG_LIVE_JSON, KRAKEN_USDG_RANKS, KRAKEN_USDG_SNAPSHOT, KRAKEN_USDG_TIERS,
  krakenUsdgExample, krakenUsdgSignup,
} from "../../data/kraken-usdg.js";
import { KRAKEN_USDG_COPY } from "../../data/kraken-usdg-copy.js";
import { localizedHref } from "../../data/locale-routing.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "./kraken-usdg.css";

const RTL = new Set(["ar", "ur"]);
const RELATED = ["/exchanges/kraken", "/glossary/perpetual-futures", "/funding-rates", "/academy/kyc-who-gets-your-id"];
const EXAMPLE = [[60000, 1], [60000, 2], [60000, 3]];

const fill = (template, vars) => String(template || "").replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? "");
export const krakenUsdgPageCopy = (locale) => KRAKEN_USDG_COPY[locale] || (String(locale || "").startsWith("zh") ? KRAKEN_USDG_COPY["zh-Hans"] || KRAKEN_USDG_COPY.en : KRAKEN_USDG_COPY.en);
const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  return market ? `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}` : href;
};
// One number format in every edition (same digits as the copy and Kraken's page).
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const usdg = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const fmtInt = (n) => int.format(n);
const fmtUsdg = (n) => usdg.format(n);
function fmtSgt(iso, locale) {
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Singapore" }).format(new Date(iso));
  } catch { return iso; }
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

// Kraken's figures: the baked snapshot first (SSR = first client render), then the server's live copy if it is valid.
function useLive() {
  const [live, setLive] = useState({ ...KRAKEN_USDG_SNAPSHOT, live: false });
  useEffect(() => {
    let cancelled = false;
    fetch(KRAKEN_USDG_LIVE_JSON, { headers: { accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data || !Number.isFinite(data.communityVolume) || !Number.isInteger(data.activeTier) || !KRAKEN_USDG_TIERS[data.activeTier]) return;
        if (typeof data.fetchedAt !== "string" || !Number.isFinite(Date.parse(data.fetchedAt))) return;
        const leaderboard = Array.isArray(data.leaderboard) ? data.leaderboard.filter((row) => Number.isInteger(row?.rank) && typeof row.name === "string" && Number.isFinite(row.volume)).slice(0, 5) : [];
        setLive({ communityVolume: data.communityVolume, activeTier: data.activeTier, fetchedAt: data.fetchedAt, leaderboard, live: true });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return live;
}

function CodeChip({ code, t }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the code stays visible */ }
  };
  return (
    <span className="nxku-code">
      <span className="nxku-code__label">{t.codeLabel}</span>
      <code translate="no">{code}</code>
      <button type="button" onClick={doCopy} aria-live="polite">{copied ? `${t.copied} ✓` : t.copy}</button>
    </span>
  );
}

function SignupButton({locale = "en", market,  signup, t, placement }) {
  return (
    <span data-signup-cta={"kraken"} className="signup-cta-block"><a className="nxku-btn nxku-btn--primary" href={signup.href} target="_blank" rel="sponsored noopener noreferrer"
      data-offer-link="go" data-campaign="kraken-usdg" data-cta-platform="kraken" data-cta-placement={`kraken-usdg-${placement}`}>
      <span className="nxku-btn__n" aria-hidden="true">1</span>{fill(t.step1Cta, { code: signup.code })}<span aria-hidden="true" className="nxku-arrow">→</span>
    </a><SignupEvidence slug={"kraken"} locale={locale} market={market} /></span>
  );
}

function RegisterButton({ signup, t, placement }) {
  return (
    <a className="nxku-btn nxku-btn--register" href={signup.registerHref} target="_blank" rel="noopener noreferrer"
      data-campaign-link="register" data-campaign="kraken-usdg" data-cta-platform="kraken" data-cta-placement={`kraken-usdg-${placement}-register`}>
      <span className="nxku-btn__n" aria-hidden="true">2</span>{t.step2Cta}<span aria-hidden="true" className="nxku-arrow">↗</span>
    </a>
  );
}

function Join({ locale, market, signup, t, placement, center = false, register = true }) {
  if (!signup) return null;
  return (
    <div className={`nxku-actions${center ? " nxku-actions--center" : ""}`}>
      <div className="nxku-actions__row">
        <SignupButton locale={locale} market={market} signup={signup} t={t} placement={placement} />
        <CodeChip code={signup.code} t={t} />
      </div>
      {register ? (
        <div className="nxku-actions__row nxku-actions__row--2">
          <RegisterButton signup={signup} t={t} placement={placement} />
          <span className="nxku-hint">{t.step2Hint}</span>
        </div>
      ) : null}
    </div>
  );
}

function Countdown({ t, now }) {
  const end = Date.parse(KRAKEN_USDG_CAMPAIGN.endAt);
  if (now && now.getTime() >= end) return <p className="nxku-count nxku-count--ended">{t.ended}</p>;
  const left = now ? Math.max(0, end - now.getTime()) : null;
  const parts = left == null ? [null, null, null, null] : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60];
  return (
    <div className="nxku-count" role="timer" aria-label={t.endsAt}>
      <span className="nxku-count__label">{t.endsIn}</span>
      <ol className="nxku-count__cells">
        {parts.map((value, index) => (
          <li key={t.units[index]}><b>{value == null ? "--" : String(value).padStart(2, "0")}</b><span>{t.units[index]}</span></li>
        ))}
      </ol>
      <time className="nxku-count__end" dateTime={KRAKEN_USDG_CAMPAIGN.endAt}>{t.endsAt}</time>
    </div>
  );
}

function Progress({ live, t }) {
  const current = KRAKEN_USDG_TIERS[live.activeTier];
  const next = KRAKEN_USDG_TIERS[live.activeTier + 1];
  if (!next) return <p className="nxku-progress__next">{t.progressMax}</p>;
  const span = next.threshold - current.threshold;
  const share = Math.max(0, Math.min(1, (live.communityVolume - current.threshold) / span));
  // Visible from the first dollar: a sliver at the start even when the share rounds to zero.
  const width = `${Math.max(1.5, share * 100).toFixed(2)}%`;
  return (
    <div className="nxku-progress">
      <div className="nxku-progress__head">
        <span>{t.progressLabel}</span>
        <b translate="no">{`${fmtInt(live.communityVolume)} USD`}</b>
      </div>
      <div className="nxku-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)} aria-label={t.progressLabel}>
        <i style={{ inlineSize: width }} />
      </div>
      <p className="nxku-progress__next">{fill(t.progressNext, { left: fmtInt(Math.max(0, next.threshold - live.communityVolume)), tier: live.activeTier + 2, pool: fmtInt(next.pool) })}</p>
    </div>
  );
}

function PoolCard({ live, t, locale, now }) {
  const tier = KRAKEN_USDG_TIERS[live.activeTier];
  return (
    <div className="nxku-pool" aria-live="polite">
      <div className="nxku-pool__head">
        <span className="nxku-pool__brand"><BrandMark slug="kraken" compact /><b>Kraken</b></span>
        {live.live ? <span className="nxku-pool__live" data-live="true"><i aria-hidden="true" />{t.poolLive}</span> : null}
      </div>
      <p className="nxku-pool__max" translate="no">5,000,000 <small>USDG</small></p>
      <p className="nxku-pool__label">{t.poolMax}</p>
      <dl className="nxku-pool__split">
        <div><dt>{t.poolLabel}</dt><dd translate="no">{`${fmtInt(tier.pool)} USDG`}</dd></div>
        <div><dt>{t.topPrizeLabel}</dt><dd translate="no">{`${fmtUsdg(tier.prizes[0])} USDG`}</dd></div>
        <div className="nxku-pool__wide"><dt>{t.tailLabel}</dt><dd translate="no">{`${fmtInt(tier.tail)} USDG`}</dd></div>
      </dl>
      <Progress live={live} t={t} />
      <p className="nxku-pool__asof" suppressHydrationWarning>{fill(t.poolAsOf, { time: fmtSgt(live.fetchedAt, locale) })}</p>
      <Countdown t={t} now={now} />
    </div>
  );
}

function TierTable({ live, t }) {
  return (
    <div className="nxku-table-wrap" tabIndex={0} role="region" aria-labelledby="nxku-tiers">
      <table className="nxku-table nxku-table--tiers">
        <thead><tr>{t.tierCols.map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>
          {KRAKEN_USDG_TIERS.map((tier, index) => (
            <tr key={tier.pool} data-active={index === live.activeTier ? "true" : undefined} data-done={index < live.activeTier ? "true" : undefined}>
              <th scope="row">{fill(t.tierName, { n: index + 1 })}</th>
              <td translate="no">{index === 0 ? t.tierBase : `${fmtInt(tier.threshold)} USD`}</td>
              <td translate="no" className="nxku-gold">{`${fmtInt(tier.pool)} USDG`}</td>
              <td translate="no">{`${fmtUsdg(tier.prizes[0])} USDG`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PrizeTable({ live, t }) {
  const [picked, setPicked] = useState(null);
  const index = picked ?? live.activeTier;
  const tier = KRAKEN_USDG_TIERS[index];
  return (
    <div className="nxku-prizes">
      <div className="nxku-tabs" role="group" aria-label={t.tierCols[0]}>
        {KRAKEN_USDG_TIERS.map((item, i) => (
          <button key={item.pool} type="button" aria-pressed={i === index} onClick={() => setPicked(i)}>{fill(t.tierName, { n: i + 1 })}</button>
        ))}
      </div>
      <div className="nxku-table-wrap" tabIndex={0} role="region" aria-labelledby="nxku-prizes">
        <table className="nxku-table">
          <thead><tr><th scope="col">{t.prizeCols[0]}</th><th scope="col">{t.prizeCols[1]}</th></tr></thead>
          <tbody>
            {KRAKEN_USDG_RANKS.map(({ from, to }, i) => (
              <tr key={from}>
                <th scope="row" translate="no">{from === to ? `#${from}` : `#${from}–${to}`}</th>
                <td translate="no" className="nxku-gold">{`${fmtUsdg(tier.prizes[i])} USDG`}</td>
              </tr>
            ))}
            <tr className="nxku-tail">
              <th scope="row">{t.tailRank}</th>
              <td className="nxku-gold">{fill(t.tailPrize, { x: fmtInt(tier.tail) })}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Leaderboard({ live, t, locale }) {
  if (!live.leaderboard.length) return null;
  return (
    <div className="nxku-leader">
      <h3>{t.leaderH}{live.live ? <span className="nxku-pool__live" data-live="true"><i aria-hidden="true" />{t.poolLive}</span> : null}</h3>
      <ol>
        {live.leaderboard.map((row) => (
          <li key={row.rank}>
            <span className="nxku-leader__rank" translate="no">{`#${row.rank}`}</span>
            <span className="nxku-leader__name" translate="no">{row.name}</span>
            <b translate="no">{`${fmtInt(row.volume)} USD`}</b>
          </li>
        ))}
      </ol>
      <p className="nxku-leader__note" suppressHydrationWarning>{`${t.leaderNote} · ${fill(t.poolAsOf, { time: fmtSgt(live.fetchedAt, locale) })}`}</p>
    </div>
  );
}

export function KrakenUsdgPage({ locale = "en", market }) {
  const t = krakenUsdgPageCopy(locale);
  const now = useClock();
  const live = useLive();
  const signupFor = (placement) => krakenUsdgSignup({ locale, market, placement });
  const hero = signupFor("hero");
  const dir = RTL.has(locale) ? "rtl" : "ltr";
  const lang = KRAKEN_USDG_COPY[locale] ? locale : "en";
  const code = hero?.code || "";
  const steps = t.steps.map((step, index) => (index === 0 && !hero ? t.stepOneNeutral : step));
  // Kraken's challenge page only through the tracked route, and only where the challenge may be promoted.
  const officialHref = hero ? signupFor("who").registerHref : null;
  const stepSignup = signupFor("steps");

  return (
    <main className="nxku nxku-page" id="top" dir={dir} lang={lang} data-signup={hero ? "on" : "off"}>
      <section className="nxku-hero">
        <div className="nxku-shell nxku-hero__inner">
          <div className="nxku-hero__copy">
            <nav className="nxku-crumbs" aria-label="Breadcrumb">
              <a href={hrefFor("/activities", locale, market)}>{t.breadcrumb}</a><span aria-hidden="true">/</span><span>{t.crumb}</span>
            </nav>
            <p className="nxku-kicker"><span className="nxku-hot" aria-hidden="true">✦</span>{t.kicker}</p>
            <h1 className="nxku-title">{t.h1}</h1>
            <p className="nxku-sub">{t.sub}</p>
            <ul className="nxku-deal">{t.dealChips.map((chip) => <li key={chip}><span aria-hidden="true">✓</span>{chip}</li>)}</ul>
            {hero ? <Join locale={locale} market={market} signup={hero} t={t} placement="hero" /> : (
              <div className="nxku-actions">
                <p className="nxku-neutral">{t.neutralLead}</p>
                <a className="nxku-btn nxku-btn--ghost" href="#how">{t.how}</a>
              </div>
            )}
          </div>
          <PoolCard live={live} t={t} locale={locale} now={now} />
        </div>
      </section>

      <section className="nxku-shell nxku-section" id="how" aria-labelledby="nxku-steps">
        <h2 id="nxku-steps">{t.stepsH}</h2>
        <ol className="nxku-steps">
          {steps.map(([title, body], index) => (
            <li key={index} className="nxku-step">
              <span className="nxku-step__n">{index + 1}</span>
              <div>
                <h3>{fill(title, { code })}</h3>
                <p>{fill(body, { code })}</p>
                {stepSignup && index === 0 ? <div className="nxku-step__act"><SignupButton locale={locale} market={market} signup={stepSignup} t={t} placement="steps" /><CodeChip code={stepSignup.code} t={t} /></div> : null}
                {stepSignup && index === 1 ? <div className="nxku-step__act"><RegisterButton signup={stepSignup} t={t} placement="steps" /></div> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="nxku-shell nxku-section" aria-labelledby="nxku-tiers">
        <h2 id="nxku-tiers">{t.tiersH}</h2>
        <p className="nxku-lead">{t.tiersLead}</p>
        <div className="nxku-split">
          <TierTable live={live} t={t} />
          <Leaderboard live={live} t={t} locale={locale} />
        </div>
      </section>

      <section className="nxku-shell nxku-section" aria-labelledby="nxku-prizes">
        <h2 id="nxku-prizes">{t.prizesH}</h2>
        <p className="nxku-lead">{t.prizesLead}</p>
        <PrizeTable live={live} t={t} />
      </section>

      <section className="nxku-boost" aria-labelledby="nxku-boost">
        <div className="nxku-shell nxku-section">
          <h2 id="nxku-boost"><span className="nxku-hot" aria-hidden="true">✦</span>{` ${t.boostH}`}</h2>
          <p className="nxku-lead">{t.boostLead}</p>
          <ul className="nxku-boosts">
            {t.boosts.map(([title, mult, body], index) => (
              <li key={title} className={`nxku-boosts__item nxku-boosts__item--${index}`}><b translate="no">{mult}</b><h3>{title}</h3><p>{body}</p></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="nxku-shell nxku-section" aria-labelledby="nxku-example">
        <h2 id="nxku-example">{t.exampleH}</h2>
        <p className="nxku-lead">{t.exampleLead}</p>
        <div className="nxku-table-wrap nxku-example" tabIndex={0} role="region" aria-labelledby="nxku-example">
          <table className="nxku-table">
            <thead><tr><th scope="col">{t.exampleCols[0]}</th><th scope="col">{t.exampleCols[1]}</th></tr></thead>
            <tbody>
              {t.exampleRows.map(([label], index) => {
                const [volume, multiplier] = EXAMPLE[index];
                const { weighted, qualifies } = krakenUsdgExample(volume, multiplier);
                return <tr key={label} data-qualifies={qualifies ? "true" : "false"}><th scope="row">{label}</th><td translate="no" className="nxku-gold">{`${fmtInt(weighted)} USD`}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <p className="nxku-total">{t.exampleNote}</p>
        <Join locale={locale} market={market} signup={signupFor("example")} t={t} placement="example" />
      </section>

      <section className="nxku-shell nxku-section nxku-facts" aria-labelledby="nxku-dates">
        <div>
          <h2 id="nxku-dates">{t.datesH}</h2>
          <dl className="nxku-dates">
            {t.dates.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </div>
        <div className="nxku-who">
          <h2>{t.whoH}</h2>
          <p>{t.who}</p>
          {officialHref ? <a href={officialHref} target="_blank" rel="noopener noreferrer" data-campaign-link="register">{t.officialLink} ↗</a> : null}
        </div>
      </section>

      <section className="nxku-shell nxku-section" aria-labelledby="nxku-faq">
        <h2 id="nxku-faq">{t.faqH}</h2>
        <div className="nxku-faq">
          {t.faq.map(([question, answer], index) => (
            <details key={question} open={index < 2}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="nxku-shell nxku-section" aria-labelledby="nxku-related">
        <h2 id="nxku-related">{t.relatedH}</h2>
        <ul className="nxku-related">
          {t.related.map(([title, body], index) => (
            <li key={RELATED[index]}><a href={hrefFor(RELATED[index], locale, market)}><b>{title}</b><span>{body}</span></a></li>
          ))}
        </ul>
      </section>

      <section className="nxku-shell nxku-final" aria-labelledby="nxku-final">
        {hero ? (
          <>
            <h2 id="nxku-final">{t.finalH}</h2>
            <p>{fill(t.finalBody, { code: hero.code })}</p>
            <Join locale={locale} market={market} signup={signupFor("final")} t={t} placement="final" center />
          </>
        ) : (
          <>
            <h2 id="nxku-final">{t.finalNeutralH}</h2>
            <p>{t.finalNeutralBody}</p>
            <div className="nxku-actions nxku-actions--center"><a className="nxku-btn nxku-btn--ghost" href={hrefFor("/exchanges/kraken", locale, market)}>{t.related[0][0]} →</a></div>
          </>
        )}
      </section>
    </main>
  );
}

export default KrakenUsdgPage;
