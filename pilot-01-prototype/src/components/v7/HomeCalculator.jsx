import React from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { formatPercent } from "../../data/format-percent.js";
import { formatFee } from "../../data/format-fee.js";
import { appendCostScenarioQuery, buildDecisionReturnHref } from "../../data/decision-return.js";
import { homeSignupLabel } from "../../data/home-cta-label.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { Cta } from "./home7-shared.jsx";
import { CALC_CHIPS, CALC_SCALE, CALC_VMAX, CALC_VMIN, calcSay, calcToPos, calcToVol, fillCalc, heroMoneyText, heroVolumeShort, heroVolumeText } from "./home7-hero-volume.js";

// One controlled calculator for home and embeds: identical volume, fee and rebate framing.
export function HomeCalculator({ t, locale, vol, setVol, mode, setMode, product, setProduct, calc, headingLevel = 2 }) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const [draft, setDraft] = React.useState(null);
  // Fixed id: useId differs between the server render and the lazily hydrated island (hydration mismatch on id/aria-describedby).
  const feedbackId = "h7-calc-feedback";
  const currentDraft = draft?.volume === vol ? draft : null;
  const invalid = currentDraft?.invalid || false;
  // Keep the editing text separate from the numeric amount (e.g. "100." and "100.50").
  React.useEffect(() => {
    setDraft((current) => current && current.volume !== vol ? null : current);
  }, [vol]);
  const onVol = (e) => {
    const text = e.target.value;
    const value = text.trim();
    // Match the cost-scenario contract: US-style grouping and at most two decimal places.
    const validFormat = value === "" || /^(?:(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)(?:\.[0-9]{0,2})?|\.[0-9]{1,2})$/.test(value);
    const next = Number(value.replaceAll(",", ""));
    const valid = validFormat && Number.isFinite(next) && next >= 0 && next <= CALC_VMAX;
    setDraft({ text, volume: valid ? next : vol, invalid: !valid });
    if (valid) setVol(next);
  };
  const chooseVolume = (next) => { setDraft(null); setVol(next); };
  const c = calcSay(locale);
  const neutral = !calc.rows.some((r) => r.share);
  const money = (v) => heroMoneyText(v, locale);
  return (
      <section className="h7-in h7-calc" id="h7-calc">
        <div>
          <Heading className="h7-calc-title">{neutral ? c.nh : c.h}</Heading>
          <label className="h7-vin" dir="ltr"><span>$</span><input value={currentDraft ? currentDraft.text : vol ? vol.toLocaleString("en-US", { maximumFractionDigits: 20 }) : ""} onChange={onVol} inputMode="decimal" aria-label={c.label} aria-invalid={invalid || undefined} aria-describedby={feedbackId} />{vol > 0 ? <small>{heroVolumeText(vol, locale)}</small> : null}</label>
          <input className="h7-range" dir="ltr" type="range" min="0" max="1000" step="1" value={calcToPos(vol)} style={{ "--p": `${calcToPos(vol) / 10}%` }} onChange={(e) => chooseVolume(calcToVol(Number(e.target.value)))} aria-label={c.label} aria-valuetext={heroVolumeText(vol || CALC_VMIN, locale)} />
          <div className="h7-range-scale" dir="ltr" aria-hidden="true">{CALC_SCALE.map((v) => <span key={v} style={{ "--x": `${calcToPos(v) / 10}%` }}>{heroVolumeShort(v, locale)}</span>)}</div>
          <div className="h7-ctl">
            {CALC_CHIPS.map((chip) => <button key={chip} type="button" aria-pressed={vol === chip} onClick={() => chooseVolume(chip)}>{heroVolumeShort(chip, locale)}</button>)}
            <div className="h7-seg" role="group" aria-label={`${t.perpL} / ${t.spotL}`}><button type="button" aria-pressed={product === "perp"} onClick={() => setProduct("perp")}>{t.perpL}</button><button type="button" aria-pressed={product === "spot"} onClick={() => setProduct("spot")}>{t.spotL}</button></div>
            <div className="h7-seg" role="group" aria-label="maker / taker"><button type="button" aria-pressed={mode === "maker"} onClick={() => setMode("maker")}>{t.maker}</button><button type="button" aria-pressed={mode === "taker"} onClick={() => setMode("taker")}>{t.taker}</button></div>
          </div>
          <p className="h7-vd" id={feedbackId} aria-live="polite">{invalid ? c.invalid.replace("{max}", CALC_VMAX.toLocaleString("en-US")) : !vol ? c.empty : neutral ? (calc.best ? fillCalc(c.low, calc.best.name, money(calc.best.gross)) : null) : (calc.most && calc.most.save > 0 ? fillCalc(c.most, calc.most.name, money(calc.most.save)) : null)}</p>
          <a className="h7-ln h7-all" href={localizedHref("/exchanges", { locale })}>{t.all}</a>
          {vol > 0 && <a className="h7-ln h7-all h7-rates" href={buildDecisionReturnHref({ kind: "cost", locale, instrument: product === "spot" ? "spot" : "futures", order: mode, volume: vol, basis: "rebate" }) || localizedHref("/rates", { locale })}>{c.rates}</a>}
        </div>
        <div className="h7-rows">
          {calc.rows.filter((r) => r.net != null || !vol).map((r) => (
            <div key={r.slug} className={`h7-xr${(neutral ? calc.best : calc.most)?.slug === r.slug ? " best" : ""}${r.share ? "" : " nr"}`}>
              <p className="h7-xn"><BrandMark slug={r.slug} compact /><b>{r.name}</b>{r.share ? <span className="h7-bd">{t.upTo} {formatPercent(locale, Math.round(r.share * 100))}</span> : null}</p>
              {/* Real text, no count-up: rebate venues show what comes back for this volume; others show the fee it costs. */}
              <div className="h7-am">{r.net == null ? null : r.share
                ? <><span className="h7-back">{money(r.save)}</span><small className="h7-basis" data-basis="rebate">{c.back}</small><small className="h7-fee">{c.fee} {money(r.gross)}</small></>
                : <><span>{money(r.gross)}</span><small className="h7-basis" data-basis="base">{c.fee}</small></>}</div>
              <p className="h7-meta">{r.maker != null ? <span>{t.rate} {formatFee(r.maker, locale)} / {formatFee(r.taker, locale)}</span> : null}{r.code && <span>{t.code} <code>{r.code}</code></span>}</p>
              <Cta v={r} locale={locale} className="h7-btn h7-sm" placement="home-v7-row"><span>{homeSignupLabel(t, r)}</span><span className="h7-sr"> {r.name}</span></Cta>
              <a className="h7-dt" href={vol > 0 ? appendCostScenarioQuery(localizedHref(`/exchanges/${r.slug}`, { locale, product: product === "spot" ? "spot" : "perpetuals" }), { instrument: product === "spot" ? "spot" : "futures", order: mode, volume: vol, basis: r.share ? "rebate" : "base" }) : localizedHref(`/exchanges/${r.slug}`, { locale })}>{t.detail}<span className="h7-sr"> {r.name}</span></a>
            </div>
          ))}
        </div>
      </section>
  );
}
