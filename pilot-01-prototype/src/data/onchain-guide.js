// /onchain verification guide (audit NX-05, 2026-10-11). The page used to be titled "On-Chain Liquidity & Reserve
// Solvency Board" while it showed "live metrics unavailable" and a checklist. It is now positioned as what it is: a guide
// to verifying an exchange's on-chain reserves, with the official proof-of-reserves pages already recorded in
// src/data/venue-database.js. Search title, description and WebPage schema come from here for the Worker head, the
// /api/route-seo payload and computeRouteSeo, so the three cannot drift. No live metric, ratio or ranking is published.
import { venueDatabase } from "./venue-database.js";
import { localizedPath } from "./locale-routing.js";

export const ONCHAIN_GUIDE_PATH = "/onchain";
/** Date the official report links below were opened (HTTP check from NexuAlpha's network). */
export const ONCHAIN_GUIDE_LINKS_CHECKED_AT = "2026-10-11";

// Venues whose recorded porAuditUrl is an official proof-of-reserves page. HTX is left out: its recorded URL
// (https://www.htx.com/en-us/finance/proof-of-reserves/) answered 404 on 2026-10-11. Gate.io and MEXC answered 403 to
// the automated check (bot protection) and load in a browser.
const GUIDE_VENUE_SLUGS = Object.freeze(["binance", "okx", "bybit", "bitget", "kraken", "kucoin", "gate-io", "mexc"]);

/** Official proof-of-reserves pages, read from the venue records (never typed here). */
export function onchainGuideReserveSources(slugs = GUIDE_VENUE_SLUGS) {
  return slugs
    .map((slug) => ({ slug, venue: venueDatabase[slug] }))
    .filter(({ venue }) => venue?.proofOfReserves === true && /^https:\/\/[^/]+\/.*proof-of-reserves/.test(String(venue.porAuditUrl || "")))
    .map(({ slug, venue }) => ({ slug, name: venue.name, url: venue.porAuditUrl }));
}

const SEO = {
  en: ["Proof of Reserves: How to Verify a Crypto Exchange", (n) => `Step-by-step guide to reading an exchange's proof-of-reserves report, with official report links for ${n} exchanges. Reserve reports are not solvency guarantees.`],
  "zh-Hans": ["链上流动性与储备证明核验指南", (n) => `逐步解读交易所储备证明（PoR）报告，并附 ${n} 家交易所的官方报告链接。储备报告不等于偿付能力或资金安全保证。`],
  "zh-Hant": ["鏈上流動性與儲備證明核驗指南", (n) => `逐步解讀交易所儲備證明（PoR）報告，並附 ${n} 家交易所的官方報告連結。儲備報告不等於償付能力或資金安全保證。`],
  ja: ["準備金証明（PoR）の確認ガイド：取引所の検証方法", (n) => `取引所の準備金証明（PoR）レポートの読み方を手順で解説し、${n}取引所の公式ページを掲載。準備金報告は支払能力の保証ではありません。`],
  ko: ["준비금 증명(PoR) 확인 가이드: 거래소 검증 방법", (n) => `거래소 준비금 증명(PoR) 보고서 읽는 법과 ${n}개 거래소 공식 링크. 준비금 보고서는 지급 능력이나 안전을 보장하지 않습니다.`],
  es: ["Prueba de reservas: cómo verificar un exchange cripto", (n) => `Guía paso a paso para leer el informe de prueba de reservas de un exchange, con enlaces oficiales de ${n} plataformas. No es una garantía de solvencia.`],
  "pt-BR": ["Prova de reservas: como verificar uma exchange cripto", (n) => `Guia passo a passo para ler o relatório de prova de reservas de uma exchange, com links oficiais de ${n} plataformas. Não é garantia de solvência.`],
  fr: ["Preuve de réserves : vérifier une plateforme crypto", (n) => `Guide pas à pas pour lire le rapport de preuve de réserves d’une plateforme, avec les liens officiels de ${n} plateformes. Pas une garantie de solvabilité.`],
  de: ["Proof of Reserves: Krypto-Börsen richtig prüfen", (n) => `Schritt für Schritt einen Proof-of-Reserves-Bericht lesen, mit offiziellen Links zu ${n} Börsen. Reserveberichte sind keine Garantie für Solvenz.`],
  it: ["Proof of reserves: come verificare un exchange crypto", (n) => `Guida passo passo alla lettura del report proof of reserves di un exchange, con i link ufficiali di ${n} piattaforme. Non è una garanzia di solvibilità.`],
  ru: ["Proof of Reserves: как проверить криптобиржу", (n) => `Пошаговое руководство по чтению отчёта proof of reserves и официальные ссылки на ${n} бирж. Отчёт о резервах не гарантирует платёжеспособность.`],
  tr: ["Rezerv kanıtı: Bir kripto borsası nasıl doğrulanır", (n) => `Bir borsanın rezerv kanıtı (PoR) raporunu adım adım okuma rehberi ve ${n} borsanın resmî bağlantıları. Rezerv raporu ödeme gücü garantisi değildir.`],
  id: ["Proof of reserves: cara memverifikasi exchange kripto", (n) => `Panduan langkah demi langkah membaca laporan proof of reserves exchange, dengan tautan resmi ${n} platform. Laporan cadangan bukan jaminan solvabilitas.`],
  vi: ["Bằng chứng dự trữ: cách kiểm tra một sàn crypto", (n) => `Hướng dẫn từng bước đọc báo cáo bằng chứng dự trữ (PoR) của sàn, kèm liên kết chính thức của ${n} sàn. Báo cáo dự trữ không đảm bảo khả năng thanh toán.`],
  ar: ["إثبات الاحتياطيات: كيف تتحقق من منصة تداول", (n) => `دليل خطوة بخطوة لقراءة تقرير إثبات الاحتياطيات لدى المنصة، مع روابط رسمية لـ ${n} منصات. تقرير الاحتياطيات ليس ضمانًا للملاءة أو الأمان.`],
};

export const ONCHAIN_GUIDE_LOCALES = Object.freeze(Object.keys(SEO));

function guideLocale(locale) {
  const raw = String(locale || "en");
  if (SEO[raw]) return raw;
  if (raw === "zh-TW" || raw === "zh-HK") return "zh-Hant";
  if (raw.startsWith("zh")) return "zh-Hans";
  if (raw.startsWith("pt")) return "pt-BR";
  const language = raw.split("-")[0];
  return SEO[language] ? language : "en";
}

/** Search title (with the " — NexuAlpha" suffix) and description for one locale. */
export function onchainGuideSeo(locale = "en") {
  const code = guideLocale(locale);
  const [title, description] = SEO[code];
  return { locale: code, title: `${title} — NexuAlpha`, description: description(onchainGuideReserveSources().length) };
}

/** WebPage JSON-LD that matches the visible guide: no Dataset, no live metrics; cites the official report pages. */
export function onchainGuideSchema(locale = "en", { origin = "https://nexualpha.com", canonical } = {}) {
  const seo = onchainGuideSeo(locale);
  const url = canonical || `${origin}${localizedPath(ONCHAIN_GUIDE_PATH, locale)}`;
  const sources = onchainGuideReserveSources();
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo.title.replace(" — NexuAlpha", ""),
    description: seo.description,
    url,
    inLanguage: locale,
    about: { "@type": "Thing", name: "Proof of reserves" },
    isAccessibleForFree: true,
    citation: sources.map((source) => source.url),
    mentions: sources.map((source) => ({ "@type": "Organization", name: source.name, url: source.url })),
  };
}
