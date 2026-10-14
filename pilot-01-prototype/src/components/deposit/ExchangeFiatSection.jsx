// "Deposits and withdrawals" block on exchange profiles (2026-10-15): the sourced local bank rails, card purchase
// networks, the countries with an official route (linking to their deposit pages) and the exchange's crypto cards.
// Shows nothing when the research holds no sourced route for the exchange. Türkiye pages skip unlisted venues.
import React from "react";
import { fiatLabels } from "../../data/fiat-labels.js";
import { FIAT_SUMMARY_CHECKED } from "../../data/fiat-rails-summary.generated.js";
import { DEPOSIT_COUNTRY_BY_CODE, CRYPTO_CARDS_PATH, depositPath } from "../../data/deposit-routes.js";
import { localizedHref } from "../../data/locale-routing.js";
import { licenseRegionName } from "../../data/license-region-names.js";
import { isTurkeyUnlistedVenue } from "../../data/partner-geo-policy.js";
import { FiatGlyph, fiatSummaryFor } from "./FiatBadges.jsx";
import "../../styles/v8/fiat-venue.css";

const TAIWAN = { en: "Taiwan", "zh-Hans": "台湾", "zh-Hant": "台灣", ja: "台湾", ko: "대만", tr: "Tayvan", ru: "Тайвань", ar: "تايوان", vi: "Đài Loan", ur: "تائیوان", uk: "Тайвань", es: "Taiwán", fr: "Taïwan" };
const countryLabel = (code, locale) => (code === "TW" ? TAIWAN[locale] || "Taiwan" : code === "EU" ? "EU (SEPA)" : licenseRegionName(code, locale, code));
const fill = (template, vars) => String(template).replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? "");

export function ExchangeFiatSection({ slug, locale = "en", market }) {
  const summary = fiatSummaryFor(slug);
  if (!summary || isTurkeyUnlistedVenue(slug, { locale, market })) return null;
  const l = fiatLabels(locale);
  const countries = summary.c.filter((code) => DEPOSIT_COUNTRY_BY_CODE[code]);
  const href = (path) => localizedHref(path, { locale });
  return <section className="v2-shell nx-fiat" id="deposits" aria-labelledby="nx-fiat-h">
    <div className="nx-fiat__head"><h2 id="nx-fiat-h">{l.venueTitle}</h2><time dateTime={FIAT_SUMMARY_CHECKED}>{FIAT_SUMMARY_CHECKED}</time></div>
    <dl className="nx-fiat__facts">
      {summary.r.length ? <div><dt><FiatGlyph kind="bank" />{l.venueRails}</dt><dd dir="ltr">{summary.r.join(" · ")}</dd></div> : null}
      {summary.n?.length ? <div><dt><FiatGlyph kind="card" />{l.venueCard}</dt><dd dir="ltr">{summary.n.join(" · ")}</dd></div> : null}
      {summary.cards?.length ? <div><dt><FiatGlyph kind="cryptoCard" />{l.venueCards}</dt><dd><a href={href(CRYPTO_CARDS_PATH)}>{summary.cards.join(" · ")}</a></dd></div> : null}
    </dl>
    {countries.length ? <>
      <p className="nx-fiat__count">{fill(l.venueCountries, { n: countries.length })}</p>
      <ul className="nx-fiat__countries">{countries.map((code) => <li key={code}><a href={href(depositPath("en", DEPOSIT_COUNTRY_BY_CODE[code]))}>{countryLabel(code, locale)}</a></li>)}</ul>
    </> : null}
    <a className="nx-fiat__all" href={href(depositPath("en"))}>{l.venueAll} <span aria-hidden="true">→</span></a>
  </section>;
}
