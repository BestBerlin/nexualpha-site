import {
  FIATS,
  converterCoin,
  converterCoins,
  converterFaq,
  converterIndexable,
  converterLocales,
  converterPath,
  converterTitle,
  converterCopy,
  converterVenues,
  formatFiatAmount,
  unitPrice,
} from "./converter.js";
import { parseConverterPath } from "./converter-routes.js";
import { COINS_GENERATED_AT, fill, formatChange } from "./coins.js";
import { titleBudgetForLocale } from "./meta-description.js";
import { hreflangAlternates } from "./news-feed-client.js";

const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": "https://nexualpha.com/#organization", name: "NexuAlpha", url: "https://nexualpha.com/" });
const EXAMPLE_AMOUNTS = Object.freeze([0.01, 0.1, 1, 5, 10]);

function fitTitle(candidates, locale) {
  const budget = titleBudgetForLocale(locale);
  return candidates.find((title) => title && title.length <= budget) || candidates[candidates.length - 1];
}

function clip(text, max = 160) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
}

function urlForPath(urlFor, path, locale) {
  return typeof urlFor === "function" ? urlFor(path, locale) : path;
}

function crumbs(items) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })) };
}

export function converterMeta(coin, fiat, locale, { fx } = {}) {
  const copy = converterCopy(locale);
  return {
    title: fitTitle([
      `${converterTitle(coin, fiat, locale)} — NexuAlpha`,
      converterTitle(coin, fiat, locale),
      `${coin.symbol} to ${fiat} converter`,
    ], locale),
    description: clip(fill(copy.seoDescription || copy.description, { symbol: coin.symbol, fiat, coin: coin.name })),
  };
}

export function converterSchemas(coin, fiat, locale, { urlFor, fx, market } = {}) {
  const url = urlForPath(urlFor, converterPath(coin, fiat), locale);
  const copy = converterCopy(locale);
  const meta = converterMeta(coin, fiat, locale, { fx });
  const faq = converterFaq(coin, fiat, locale);
  const price = unitPrice(coin.price, fiat, fx);
  const venues = converterVenues(coin, fiat, { locale, market });
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: meta.title.replace(/ — NexuAlpha$/, ""),
      description: meta.description,
      inLanguage: locale,
      dateModified: String(fx?.generatedAt || COINS_GENERATED_AT || "").slice(0, 10) || undefined,
      publisher: ORGANIZATION,
      about: { "@type": "Thing", name: coin.name, alternateName: coin.symbol },
      mainEntity: {
        "@type": "ExchangeRateSpecification",
        currency: coin.symbol,
        currentExchangeRate: price ? { "@type": "UnitPriceSpecification", price, priceCurrency: fiat } : undefined,
      },
      hasPart: {
        "@type": "ItemList",
        name: `${coin.symbol} to ${fiat} quick conversions`,
        itemListElement: EXAMPLE_AMOUNTS.map((amount, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${amount} ${coin.symbol}`,
          description: price ? `${amount} ${coin.symbol} = ${formatFiatAmount(amount * price, locale, fiat)} ${fiat}` : `${amount} ${coin.symbol}`,
        })),
      },
      ...(Number.isFinite(coin.change24h) ? { additionalProperty: { "@type": "PropertyValue", name: "24h change", value: formatChange(coin.change24h, locale) } } : {}),
    },
    ...(venues.length ? [{
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: copy.buyTitle.replace("{coin}", coin.name).replace("{symbol}", coin.symbol).replace("{fiat}", fiat),
      inLanguage: locale,
      step: [
        { "@type": "HowToStep", text: copy.step1.replace("{coin}", coin.name).replace("{symbol}", coin.symbol).replace("{fiat}", fiat) },
        { "@type": "HowToStep", text: copy.step2.replace("{coin}", coin.name).replace("{symbol}", coin.symbol).replace("{fiat}", fiat) },
        { "@type": "HowToStep", text: copy.step3.replace("{coin}", coin.name).replace("{symbol}", coin.symbol).replace("{fiat}", fiat) },
      ],
      supply: venues.map((venue) => ({ "@type": "HowToSupply", name: venue.name, url: venue.guide })),
    }] : []),
    ...(faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: locale, mainEntity: faq.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })) }] : []),
    crumbs([["NexuAlpha", urlForPath(urlFor, "/", locale)], [coin.name, urlForPath(urlFor, `/coins/${coin.slug}`, locale)], [`${coin.symbol} to ${fiat}`, url]]),
  ];
}

export function converterRouteSeo(pathname, locale, { urlFor, fx, market } = {}) {
  const route = parseConverterPath(pathname);
  if (!route) return null;
  if (route.kind === "missing") return { status: 404 };
  const coin = converterCoin(route.symbol);
  if (!coin || !FIATS.includes(route.fiat)) return { status: 404 };
  const indexable = converterIndexable(coin, route.fiat, locale);
  const meta = converterMeta(coin, route.fiat, locale, { fx });
  return {
    status: 200,
    ...meta,
    indexable,
    alternatesLocales: converterLocales(route.fiat).filter((candidate) => converterIndexable(coin, route.fiat, candidate)),
    schemas: converterSchemas(coin, route.fiat, locale, { urlFor, fx, market }),
  };
}

export function converterSitemapEntries({ urlFor }) {
  const lastmod = String(COINS_GENERATED_AT || "").slice(0, 10);
  const entry = (coin, fiat, locales) => locales.map((locale) => {
    const pathname = converterPath(coin, fiat);
    return {
      pathname,
      locale,
      loc: urlFor(pathname, locale),
      lastmod,
      alternates: hreflangAlternates(locales, (hreflang) => urlFor(pathname, hreflang)),
    };
  });
  return converterCoins().flatMap((coin) => FIATS.flatMap((fiat) => entry(coin, fiat, converterLocales(fiat).filter((locale) => converterIndexable(coin, fiat, locale)))));
}
