import { partnerRegistry } from "./partner-registry.js";
import { publicCtaForVenue } from "./source-bound-cta.js";
import { isPartnerPromotableIn } from "./partner-geo-policy.js";
import { LOCALE_PREFIX_BY_CODE } from "./locale-routing.js";
import { APP_DOWNLOAD_SLUGS, appDownloadPath, parseAppDownloadPath } from "./app-download-path.js";
import { appDownloadCopy, fillAppCopy } from "./app-download-copy.js";

export const APP_DOWNLOAD_CHECKED = "2026-10-12";
export const APP_DOWNLOAD_YEAR = Number(APP_DOWNLOAD_CHECKED.slice(0, 4));
// Official store listings traced from these exchange download pages. APKs remain absent until the owner supplies
// channel builds that have passed signature, virus and hash review. Never host APKs on nexualpha.com.
export const APP_DOWNLOADS = {
  okx: {
    appStore: "https://apps.apple.com/app/id1327268470",
    googlePlay: "https://play.google.com/store/apps/details?id=com.okinc.okex.gp",
    iosDeveloper: "OKX Inc.", androidDeveloper: "OKX INC.",
    sources: ["https://www.okx.com/download"], lastChecked: APP_DOWNLOAD_CHECKED, apk: null,
  },
  bitget: {
    appStore: "https://apps.apple.com/app/id1442778704",
    googlePlay: "https://play.google.com/store/apps/details?id=com.bitget.exchange",
    iosDeveloper: "BG LIMITED", androidDeveloper: "BG LIMITED",
    sources: ["https://www.bitget.com/download"], lastChecked: APP_DOWNLOAD_CHECKED, apk: null,
  },
  binance: {
    appStore: "https://apps.apple.com/app/id1436799971",
    googlePlay: "https://play.google.com/store/apps/details?id=com.binance.dev",
    iosDeveloper: "Binance Switzerland AG", androidDeveloper: "Binance Inc.",
    sources: ["https://www.binance.com/en/download", "https://www.binance.com/en/learn/how-to-download-and-install-binance"], lastChecked: APP_DOWNLOAD_CHECKED, apk: null,
  },
  bybit: {
    appStore: "https://apps.apple.com/app/id1488296980",
    googlePlay: "https://play.google.com/store/apps/details?id=com.bybit.app",
    iosDeveloper: "Bybit Fintech Limited", androidDeveloper: "Bybit",
    sources: ["https://www.bybit.com/en/download/"], lastChecked: APP_DOWNLOAD_CHECKED, apk: null,
  },
};

const NEUTRAL_LOCALES = new Set(["ru", "ar", "zh-Hant", "ur", "uk"]);
const crumbs = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })) });

export function appDownloadSignupAllowed(slug, { locale = "en", market } = {}) {
  if (!APP_DOWNLOAD_SLUGS.includes(slug) || NEUTRAL_LOCALES.has(locale) || !isPartnerPromotableIn(slug, { locale, market })) return false;
  const cta = publicCtaForVenue(slug, locale, market);
  return Boolean(cta?.routeAvailable && cta.inviteCode);
}
// Fail closed on incomplete data, another host, credentials, a port, or a non-APK path.
export function verifiedAppApk(apk) {
  if (!apk || !/^[a-f0-9]{64}$/i.test(apk.sha256 || "") || !/^[a-f0-9]{64}$/i.test(apk.signerSha256 || "") || !String(apk.version || "").trim()) return null;
  try {
    const url = new URL(apk.url);
    return url.protocol === "https:" && url.hostname === "dl.nexualpha.com" && !url.port && !url.username && !url.password && /\.apk$/i.test(url.pathname) ? apk : null;
  } catch { return null; }
}
export function appDownloadContent(slug, locale) {
  const app = APP_DOWNLOADS[slug], partner = partnerRegistry[slug];
  if (!app || !partner) return null;
  const copy = appDownloadCopy(locale);
  const cta = publicCtaForVenue(slug, locale);
  const vars = { name: partner.name, year: APP_DOWNLOAD_YEAR, code: cta.inviteCode, domain: partner.officialDomain, iosDeveloper: app.iosDeveloper, androidDeveloper: app.androidDeveloper };
  const text = (key) => fillAppCopy(copy[key], vars);
  return { app, partner, cta, copy, text, apk: verifiedAppApk(app.apk) };
}
export function appDownloadRouteSeo(pathname, locale, { urlFor }) {
  const route = parseAppDownloadPath(pathname);
  if (!route) return null;
  if (!route.valid) return { status: 404 };
  const { app, partner, copy, text } = appDownloadContent(route.slug, locale);
  const canonical = urlFor(pathname);
  const officialDownloadUrls = [app.appStore, app.googlePlay];
  return {
    status: 200, title: text("shortTitle"), description: text("answer"),
    schemas: [
      { "@context": "https://schema.org", "@type": "SoftwareApplication", "@id": `${canonical}#app`, name: `${partner.name} App`, applicationCategory: "FinanceApplication", operatingSystem: "iOS, Android", url: canonical, inLanguage: locale, dateModified: app.lastChecked, downloadUrl: officialDownloadUrls, sameAs: [...app.sources], publisher: { "@type": "Organization", name: partner.name, url: `https://${partner.officialDomain}` } },
      { "@context": "https://schema.org", "@type": "FAQPage", "@id": `${canonical}#faq`, inLanguage: locale, mainEntity: copy.faqs.map(({ q: question, a: answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
      crumbs([["NexuAlpha", urlFor("/")], [partner.name, urlFor(`/exchanges/${route.slug}`)], [text("shortTitle"), canonical]]),
    ],
  };
}
export function appDownloadSitemapEntries({ urlFor }) {
  const locales = Object.keys(LOCALE_PREFIX_BY_CODE);
  return APP_DOWNLOAD_SLUGS.flatMap((slug) => locales.map((locale) => ({
    pathname: appDownloadPath(slug), locale, loc: urlFor(appDownloadPath(slug), locale), lastmod: APP_DOWNLOADS[slug].lastChecked,
    alternates: [...locales.map((hreflang) => ({ hreflang, href: urlFor(appDownloadPath(slug), hreflang) })), { hreflang: "x-default", href: urlFor(appDownloadPath(slug), "en") }],
  })));
}
