import React, { useEffect, useState } from "react";
import { useCoinData, useLivePrice } from "../coins/CoinPages.jsx";
import { COINS_GENERATED_AT, coinLesson, fill, formatChange, utcStamp } from "../../data/coins.js";
import { converterCoin, converterCoins, converterCopy, converterIndexable, converterLocales, converterTitle, converterFaq, converterPath, converterVenues, fiatSpotVenues, coinPath, FIATS, QUICK_AMOUNTS, unitPrice, convertedAmount, formatAmount, formatFiatAmount } from "../../data/converter.js";
import { localizedHref } from "../../data/locale-routing.js";
import "./converter.css";

function useFx(initial) {
  const [fx, setFx] = useState(initial || null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/intel/fx.json", { signal: controller.signal, headers: { accept: "application/json" } })
      .then((response) => response.ok ? response.json() : null)
      .then((next) => { if (next?.base === "USD" && Number.isFinite(Date.parse(next.generatedAt)) && next.rates?.USD === 1 && (!initial || Date.parse(next.generatedAt) >= Date.parse(initial.generatedAt))) setFx(next); })
      .catch(() => {});
    return () => controller.abort();
  }, [initial]);
  return fx;
}
export function ConverterPage({ locale = "en", symbol, fiat, market, overlay, fx: initialFx }) {
  useCoinData(overlay);
  const coin = converterCoin(symbol);
  const live = useLivePrice(coin);
  const fx = useFx(initialFx);
  const [input, setInput] = useState("1");
  const [reverse, setReverse] = useState(false);
  const t = converterCopy(locale);
  if (!coin || !FIATS.includes(fiat)) return <main className="nxconvert"><h1>404</h1><a href={localizedHref("/coins", { locale })}>{t.detail.replace("{coin}", "")}</a></main>;
  const vars = { coin: coin.name, symbol: coin.symbol, fiat };
  const text = (key) => fill(t[key], vars);
  const price = unitPrice(live?.price ?? coin.price, fiat, fx);
  const output = convertedAmount(input, price, reverse);
  const href = (path) => {
    const link = localizedHref(path, { locale });
    return market ? `${link}${link.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}` : link;
  };
  const converterHref = (path, targetLocale = locale) => localizedHref(path, { locale: targetLocale });
  const venues = converterVenues(coin, fiat, { locale, market });
  const direct = fiatSpotVenues(coin, fiat);
  const faq = converterFaq(coin, fiat, locale);
  const changed = live?.change24h ?? coin.change24h;
  const edit = (value, fromFiat) => { setInput(value); setReverse(fromFiat); };
  const inputValue = (fromFiat) => reverse === fromFiat ? input : output === null ? "" : String(Number(output.toPrecision(12)));
  const relatedFiats = FIATS
    .filter((code) => code !== fiat)
    .map((code) => ({ code, locale: converterLocales(code).find((candidate) => converterIndexable(coin, code, candidate)) }))
    .filter((item) => item.locale)
    .slice(0, 4);
  const fiatPeers = (() => {
    const index = Math.max(0, converterCoins().findIndex((row) => row?.slug === coin.slug));
    return [1, -1, 2, -2]
      .map((offset) => converterCoins()[(index + offset + converterCoins().length) % converterCoins().length])
      .filter((row) => row && row.slug !== coin.slug && converterIndexable(row, fiat, locale));
  })();
  return <main className="nxconvert" id="top" dir={locale === "ar" || locale === "ur" ? "rtl" : "ltr"} lang={t === converterCopy("en") && locale !== "en" ? "en" : locale} data-converter={`${symbol}-${fiat.toLowerCase()}`}>
    <div className="nxconvert-shell">
      <header><p className="nxconvert-pair" translate="no">{coin.symbol} / {fiat}</p><h1>{converterTitle(coin, fiat, locale)}</h1><p>{text("description")}</p></header>
      <section className="nxconvert-panel" aria-label={converterTitle(coin, fiat, locale)}>
        <div className="nxconvert-inputs">
          <label>{text("coinAmount")}<input type="number" inputMode="decimal" min="0" step="any" value={inputValue(false)} onChange={(event) => edit(event.target.value, false)} /></label>
          <span aria-hidden="true">↔</span>
          <label>{text("fiatAmount")}<input type="number" inputMode="decimal" min="0" step="any" value={inputValue(true)} onChange={(event) => edit(event.target.value, true)} /></label>
        </div>
        <p className="nxconvert-rate" aria-live="polite">{price === null ? t.unavailable : <bdi dir="ltr">1 {coin.symbol} = {formatFiatAmount(price, locale, fiat)} {fiat}</bdi>}</p>
        <dl className="nxconvert-facts">
          <div><dt>{t.change}</dt><dd><bdi dir="ltr">{formatChange(changed, locale)}</bdi></dd></div>
          <div><dt>{t.source}</dt><dd>{live ? `${t.live} · ${live.source}` : `${t.snapshot} · CoinGecko USD`}<br /><time dateTime={live?.at || COINS_GENERATED_AT}>{utcStamp(live?.at || COINS_GENERATED_AT, locale)}</time></dd></div>
          {fiat !== "USD" && <div><dt>{t.fx}</dt><dd>{fx ? <><a href="https://www.exchangerate-api.com" translate="no">ExchangeRate-API</a><br /><time dateTime={fx.generatedAt}>{utcStamp(fx.generatedAt, locale)}</time></> : t.unavailable}</dd></div>}
        </dl>
      </section>
      <section><h2>{text("tableTitle")}</h2><table><thead><tr><th scope="col" translate="no">{coin.symbol}</th><th scope="col" translate="no">{fiat}</th></tr></thead><tbody>{QUICK_AMOUNTS.map((amount) => <tr key={amount}><th scope="row"><bdi>{formatAmount(amount, locale)}</bdi></th><td><bdi>{price === null ? "–" : formatFiatAmount(convertedAmount(amount, price), locale, fiat)}</bdi></td></tr>)}</tbody></table></section>
      <section><h2>{text("buyTitle")}</h2>{t.methods[fiat] ? <p>{t.methods[fiat]}</p> : null}
        <ol className="nxconvert-steps">
          <li><p>{text("step1")}</p><a href={href(coinPath(coin.slug))}>{text("detail")}</a>
            {venues.length > 0 && <ul className="nxconvert-venues">{venues.map((venue) => <li key={venue.slug}><a className="nxconvert-cta" href={venue.signup.href} rel="nofollow sponsored" data-offer-link="go" data-cta-platform={venue.slug} data-cta-placement={`convert-${symbol}-${fiat.toLowerCase()}`}>{fill(t.signup, { venue: venue.signup.name })}</a> <a href={venue.guide}>{venue.name} · {fiat}</a></li>)}</ul>}
          </li>
          <li><p>{text("step2")}</p></li><li><p>{text("step3")}</p><a href={href(coinLesson("E07")?.path || "/academy")}>{t.academy}</a></li>
        </ol>
        {direct.length > 0 && <p>{text("direct")} {direct.map((venue) => venue.name).join(", ")}.</p>}
      </section>
      <section><h2>{text("faqTitle")}</h2>{faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
      <nav aria-label={t.related}><h2>{t.related}</h2><ul className="nxconvert-currencies">{relatedFiats.map(({ code, locale: targetLocale }) => <li key={code}><a href={converterHref(converterPath(coin, code), targetLocale)} translate="no">{coin.symbol} / {code}</a></li>)}{fiatPeers.map((peer) => <li key={peer.slug}><a href={converterHref(converterPath(peer, fiat))}>{peer.name} / <span translate="no">{fiat}</span></a></li>)}</ul></nav>
    </div>
  </main>;
}
