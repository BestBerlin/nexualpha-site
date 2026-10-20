# Entity copy changes — 2026-10-20

Exact before → after audit: removed lines (-) are before; added lines (+) are after.
The new shared definitions below replace the old Organization descriptions, About leads/descriptions, home descriptions, and retrieval summaries through the existing locale mechanism. Existing funding/disclosure bodies and partner links are unchanged. Neutral locales retain informational wording.

## Canonical definitions (after)

```js
// Lightweight canonical copy: safe for home browser imports without the schema graph.
export const ENTITY_DEFINITION = Object.freeze({
  "en": "NexuAlpha compares crypto exchange fees and applicable rebates using official sources. Free, independent guidance funded by disclosed exchange referrals.",
  "zh-Hans": "NexuAlpha 是独立的加密交易所手续费比较与返还指南，依据官方来源帮助交易者核对费率、注册链接和适用返还，降低交易成本。内容免费，由公开披露的交易所推荐计划资助。",
  "zh-Hant": "NexuAlpha 是獨立的加密交易所手續費比較指南，依官方來源核對費率與平台條件，協助評估交易成本。內容免費，由公開揭露的交易所推薦計畫資助。",
  "es": "NexuAlpha compara tarifas y reembolsos cripto con fuentes oficiales. Guía gratuita e independiente, financiada por referidos declarados.",
  "pt-BR": "NexuAlpha compara taxas e reembolsos cripto com fontes oficiais. Guia gratuito e independente, financiado por indicações divulgadas.",
  "fr": "NexuAlpha compare les frais et remises crypto avec des sources officielles. Guide gratuit et indépendant, financé par des parrainages déclarés.",
  "de": "NexuAlpha vergleicht Kryptogebühren und Rabatte anhand offizieller Quellen. Kostenlos und unabhängig, durch offengelegte Empfehlungen finanziert.",
  "it": "NexuAlpha confronta costi e rimborsi crypto da fonti ufficiali. Guida gratuita e indipendente, finanziata da referral dichiarati.",
  "ja": "NexuAlpha は公式情報に基づく独立した暗号資産取引所の手数料比較ガイドです。取引コストの確認を支援します。無料で、開示された取引所紹介制度により運営されています。",
  "ko": "NexuAlpha는 공식 출처로 암호화폐 거래소 수수료와 조건을 비교하는 독립 가이드입니다. 거래 비용 확인을 돕습니다. 무료이며 공개된 거래소 추천 프로그램으로 운영됩니다.",
  "ru": "NexuAlpha сравнивает комиссии криптобирж по официальным источникам. Бесплатный независимый гид финансируется раскрытыми реферальными программами.",
  "tr": "NexuAlpha resmi kaynaklarla kripto ücret ve iadelerini karşılaştırır. Ücretsiz, bağımsız rehber; açıklanan referans programlarıyla finanse edilir.",
  "id": "NexuAlpha membandingkan biaya dan rabat kripto dari sumber resmi. Panduan gratis dan independen, didanai referral yang diungkapkan.",
  "vi": "NexuAlpha so sánh phí sàn crypto từ nguồn chính thức. Hướng dẫn độc lập, miễn phí, được tài trợ bởi chương trình giới thiệu đã công bố.",
  "ar": "NexuAlpha دليل مستقل لمقارنة رسوم منصات العملات المشفرة من مصادر رسمية. المحتوى مجاني وتموله برامج إحالة معلنة.",
  "ur": "NexuAlpha سرکاری ذرائع سے کرپٹو ایکسچینج فیس کا موازنہ کرتا ہے۔ آزاد، مفت رہنمائی؛ ظاہر کردہ ریفرل پروگراموں سے مالی معاونت۔",
  "uk": "NexuAlpha порівнює комісії криптобірж за офіційними джерелами. Безкоштовний незалежний гід фінансують розкриті реферальні програми."
});

export function organizationDescription(locale = "en") {
  const raw = String(locale || "en");
  const aliases = { "zh-CN": "zh-Hans", "zh-TW": "zh-Hant", "zh-HK": "zh-Hant", pt: "pt-BR", zh: "zh-Hans" };
  const code = ENTITY_DEFINITION[raw] ? raw : aliases[raw] || aliases[raw.split("-")[0]] || raw.split("-")[0];
  return ENTITY_DEFINITION[code] || ENTITY_DEFINITION.en;
}
```

## Exact source and generated-copy changes

```diff
diff --git a/pilot-01-prototype/public/llms-full.txt b/pilot-01-prototype/public/llms-full.txt
index 4b3fc085..a8e74153 100644
--- a/pilot-01-prototype/public/llms-full.txt
+++ b/pilot-01-prototype/public/llms-full.txt
@@ -2,3 +2,3 @@
 
-> One verified gateway to the world’s exchanges: NexuAlpha is independent crypto exchange research that checks trading fees, official domains and sign-up routes against each exchange's own sources, with disclosed partner links and invite codes.
+> NexuAlpha compares crypto exchange fees and applicable rebates using official sources. Free, independent guidance funded by disclosed exchange referrals.
 
@@ -27,3 +27,3 @@ This index is designed for retrieval by search and answer systems. It is not an
 - Name: NexuAlpha. Also written: Nexu Alpha, NexuAlpha.com, nexualpha.com.
-- NexuAlpha (also written Nexu Alpha) is the crypto exchange research and fee-rebate site at nexualpha.com. It is not an exchange, a token or a trading app, and it is not affiliated with other companies, tokens or projects that use similar names, such as Nexus or NEXO. The only official channels are the ones listed on this page.
+- NexuAlpha (also written Nexu Alpha) is the crypto exchange research and fee-rebate site at nexualpha.com. It is not an exchange, a token or a trading app, and it is not affiliated with other companies, tokens or projects that use similar names, such as Nexus Alpha, nexusalpha.ai or NexusAiCore. The only official channels are the ones listed on this page.
 - Official profiles (schema.org sameAs): https://t.me/NexuAlphaClub, https://t.me/NexuAlphaGlobal, https://t.me/NexuAlphaAssistantBot, https://app.nexualpha.com/, https://t.me/NexuAlphaWorld, https://x.com/NexuAlpha, https://www.youtube.com/@NexuAlphaCN, https://www.youtube.com/@NexuAlphaGlobal.
@@ -138,5 +138,5 @@ These assets expose stable field definitions and verification checklists. They a
 - [Regional funding verification matrix](https://nexualpha.com/br/pix#regional-funding-verification-matrix) — Dataset reviewed: 2026-09-15; stable JSON: https://nexualpha.com/research/regional-funding-verification-matrix.json; stable CSV: https://nexualpha.com/research/regional-funding-verification-matrix.csv. Coverage: Reviewed funding checklist rows currently cover BR, MX, TW, ID, EU, UK, US, JP, HK, KR, SG and TR; every rail and account outcome still requires confirmation in the official logged-in account flow. Limitations: The matrix is a dated research checklist, not a live-rate feed, account approval decision, funding availability promise, product-access promise, user-benefit promise or registration outcome.
-- [Crypto Exchange Fee Index (monthly)](https://nexualpha.com/data/exchange-fee-index) — base-tier spot and perpetual maker/taker fees with official source URL and review date per exchange; CSV: https://nexualpha.com/research/exchange-fee-index.csv; license CC BY 4.0 (credit "Source: NexuAlpha").
-- [Tokenized stock availability tracker](https://nexualpha.com/data/tokenized-stock-tracker) — which exchanges list which US stock tokens, stock perps and pre-IPO perps, token family, restricted regions and dated sources; CSV: https://nexualpha.com/research/tokenized-stock-tracker.csv; license CC BY 4.0.
-- [Whale accumulation report (rolling 7 days)](https://nexualpha.com/data/whale-accumulation-report) — accumulation, distribution and short positioning of tracked Hyperliquid wallets by coin; CSV: https://nexualpha.com/research/whale-accumulation-report.csv; license CC BY 4.0. Press kit: https://nexualpha.com/press
+- [Crypto Exchange Fee Index (monthly)](https://nexualpha.com/data/exchange-fee-index) — base-tier spot and perpetual maker/taker fees with official source URL and review date per exchange; CSV download and embeddable chart on the page; license CC BY 4.0 (credit "Source: NexuAlpha").
+- [Tokenized stock availability tracker](https://nexualpha.com/data/tokenized-stock-tracker) — which exchanges list which US stock tokens, stock perps and pre-IPO perps, token family, restricted regions and dated sources; CSV download on the page; license CC BY 4.0.
+- [Whale accumulation report (rolling 7 days)](https://nexualpha.com/data/whale-accumulation-report) — accumulation, distribution and short positioning of tracked Hyperliquid wallets by coin; CSV download on the page; license CC BY 4.0. Press kit: https://nexualpha.com/press
 
diff --git a/pilot-01-prototype/public/llms-small.txt b/pilot-01-prototype/public/llms-small.txt
index 5c114fe9..cbdf989d 100644
--- a/pilot-01-prototype/public/llms-small.txt
+++ b/pilot-01-prototype/public/llms-small.txt
@@ -2,3 +2,3 @@
 
-> One verified gateway to the world’s exchanges: NexuAlpha is independent crypto exchange research that checks trading fees, official domains and sign-up routes against each exchange's own sources, with disclosed partner links and invite codes.
+> NexuAlpha compares crypto exchange fees and applicable rebates using official sources. Free, independent guidance funded by disclosed exchange referrals.
 
@@ -19,3 +19,3 @@ This compact entry helps answer systems and users compare CEX, DEX and Perp DEX
 - Name: NexuAlpha. Also written: Nexu Alpha, NexuAlpha.com, nexualpha.com.
-- NexuAlpha (also written Nexu Alpha) is the crypto exchange research and fee-rebate site at nexualpha.com. It is not an exchange, a token or a trading app, and it is not affiliated with other companies, tokens or projects that use similar names, such as Nexus or NEXO. The only official channels are the ones listed on this page.
+- NexuAlpha (also written Nexu Alpha) is the crypto exchange research and fee-rebate site at nexualpha.com. It is not an exchange, a token or a trading app, and it is not affiliated with other companies, tokens or projects that use similar names, such as Nexus Alpha, nexusalpha.ai or NexusAiCore. The only official channels are the ones listed on this page.
 - Official profiles (schema.org sameAs): https://t.me/NexuAlphaClub, https://t.me/NexuAlphaGlobal, https://t.me/NexuAlphaAssistantBot, https://app.nexualpha.com/, https://t.me/NexuAlphaWorld, https://x.com/NexuAlpha, https://www.youtube.com/@NexuAlphaCN, https://www.youtube.com/@NexuAlphaGlobal.
diff --git a/pilot-01-prototype/public/llms.txt b/pilot-01-prototype/public/llms.txt
index db6eeb4c..817581df 100644
--- a/pilot-01-prototype/public/llms.txt
+++ b/pilot-01-prototype/public/llms.txt
@@ -2,3 +2,3 @@
 
-> One verified gateway to the world’s exchanges: NexuAlpha is independent crypto exchange research that checks trading fees, official domains and sign-up routes against each exchange's own sources, with disclosed partner links and invite codes.
+> NexuAlpha compares crypto exchange fees and applicable rebates using official sources. Free, independent guidance funded by disclosed exchange referrals.
 
@@ -27,3 +27,3 @@ This index is designed for retrieval by search and answer systems. It is not an
 - Name: NexuAlpha. Also written: Nexu Alpha, NexuAlpha.com, nexualpha.com.
-- NexuAlpha (also written Nexu Alpha) is the crypto exchange research and fee-rebate site at nexualpha.com. It is not an exchange, a token or a trading app, and it is not affiliated with other companies, tokens or projects that use similar names, such as Nexus or NEXO. The only official channels are the ones listed on this page.
+- NexuAlpha (also written Nexu Alpha) is the crypto exchange research and fee-rebate site at nexualpha.com. It is not an exchange, a token or a trading app, and it is not affiliated with other companies, tokens or projects that use similar names, such as Nexus Alpha, nexusalpha.ai or NexusAiCore. The only official channels are the ones listed on this page.
 - Official profiles (schema.org sameAs): https://t.me/NexuAlphaClub, https://t.me/NexuAlphaGlobal, https://t.me/NexuAlphaAssistantBot, https://app.nexualpha.com/, https://t.me/NexuAlphaWorld, https://x.com/NexuAlpha, https://www.youtube.com/@NexuAlphaCN, https://www.youtube.com/@NexuAlphaGlobal.
@@ -138,5 +138,5 @@ These assets expose stable field definitions and verification checklists. They a
 - [Regional funding verification matrix](https://nexualpha.com/br/pix#regional-funding-verification-matrix) — Dataset reviewed: 2026-09-15; stable JSON: https://nexualpha.com/research/regional-funding-verification-matrix.json; stable CSV: https://nexualpha.com/research/regional-funding-verification-matrix.csv. Coverage: Reviewed funding checklist rows currently cover BR, MX, TW, ID, EU, UK, US, JP, HK, KR, SG and TR; every rail and account outcome still requires confirmation in the official logged-in account flow. Limitations: The matrix is a dated research checklist, not a live-rate feed, account approval decision, funding availability promise, product-access promise, user-benefit promise or registration outcome.
-- [Crypto Exchange Fee Index (monthly)](https://nexualpha.com/data/exchange-fee-index) — base-tier spot and perpetual maker/taker fees with official source URL and review date per exchange; CSV: https://nexualpha.com/research/exchange-fee-index.csv; license CC BY 4.0 (credit "Source: NexuAlpha").
-- [Tokenized stock availability tracker](https://nexualpha.com/data/tokenized-stock-tracker) — which exchanges list which US stock tokens, stock perps and pre-IPO perps, token family, restricted regions and dated sources; CSV: https://nexualpha.com/research/tokenized-stock-tracker.csv; license CC BY 4.0.
-- [Whale accumulation report (rolling 7 days)](https://nexualpha.com/data/whale-accumulation-report) — accumulation, distribution and short positioning of tracked Hyperliquid wallets by coin; CSV: https://nexualpha.com/research/whale-accumulation-report.csv; license CC BY 4.0. Press kit: https://nexualpha.com/press
+- [Crypto Exchange Fee Index (monthly)](https://nexualpha.com/data/exchange-fee-index) — base-tier spot and perpetual maker/taker fees with official source URL and review date per exchange; CSV download and embeddable chart on the page; license CC BY 4.0 (credit "Source: NexuAlpha").
+- [Tokenized stock availability tracker](https://nexualpha.com/data/tokenized-stock-tracker) — which exchanges list which US stock tokens, stock perps and pre-IPO perps, token family, restricted regions and dated sources; CSV download on the page; license CC BY 4.0.
+- [Whale accumulation report (rolling 7 days)](https://nexualpha.com/data/whale-accumulation-report) — accumulation, distribution and short positioning of tracked Hyperliquid wallets by coin; CSV download on the page; license CC BY 4.0. Press kit: https://nexualpha.com/press
 
diff --git a/pilot-01-prototype/scripts/generate-public-llms.mjs b/pilot-01-prototype/scripts/generate-public-llms.mjs
index f419d930..b8e89aef 100644
--- a/pilot-01-prototype/scripts/generate-public-llms.mjs
+++ b/pilot-01-prototype/scripts/generate-public-llms.mjs
@@ -15,3 +15,3 @@ import { computeRouteSeo } from "../src/data/seo-injection.js";
 import { brandSlogan } from "../src/data/brand-slogan.js";
-import { BRAND_ALTERNATE_NAMES, BRAND_SAME_AS, entityAtAGlance } from "../src/data/brand-entity.js";
+import { organizationDescription, BRAND_ALTERNATE_NAMES, BRAND_SAME_AS, entityAtAGlance } from "../src/data/brand-entity.js";
 import { buildPartnersFeed } from "../src/data/partners-feed.js";
@@ -83,6 +83,4 @@ const sourceLines = Object.entries(internationalSourceRegistry).flatMap(([market
 
-// What the site is, in one sentence that starts with brand slogan A (SEO audit 2026-10-11 #9, owner-approved): independent
-// exchange research with disclosed partner links and invite codes. The old text called the site a "neutral directory"
-// and said referral codes were omitted, the opposite of what the venue pages say.
-const SITE_SUMMARY = `${brandSlogan("en").replace(/[.。]\s*$/, "")}: NexuAlpha is independent crypto exchange research that checks trading fees, official domains and sign-up routes against each exchange's own sources, with disclosed partner links and invite codes.`;
+// Shared benefit-first entity definition, followed by the unchanged commission disclosure.
+const SITE_SUMMARY = organizationDescription("en");
 // Machine-readable commission disclosure. On the site itself the disclosure lives only in the footer and the legal pages
diff --git a/pilot-01-prototype/src/components/v3/CleanFooter.jsx b/pilot-01-prototype/src/components/v3/CleanFooter.jsx
index e41936aa..f5d9c3e6 100644
--- a/pilot-01-prototype/src/components/v3/CleanFooter.jsx
+++ b/pilot-01-prototype/src/components/v3/CleanFooter.jsx
@@ -1 +1,2 @@
+import { organizationDescription } from "../../data/brand-definition.js";
 import { beginnerPath } from "../../data/beginner-routes.js";
@@ -471,2 +472,3 @@ export function CleanFooter({ locale = "en", market, brazil = false }) {
           <p className="nx-ftr__slogan">{brandSlogan(locale)}</p>
+          <p className="nx-ftr__definition">{organizationDescription(locale)}</p>
           <div className="nx-ftr__socials" aria-label="NexuAlpha social links">
diff --git a/pilot-01-prototype/src/components/v3/MethodologyPage.jsx b/pilot-01-prototype/src/components/v3/MethodologyPage.jsx
index d2c519c9..b2e48d7b 100644
--- a/pilot-01-prototype/src/components/v3/MethodologyPage.jsx
+++ b/pilot-01-prototype/src/components/v3/MethodologyPage.jsx
@@ -1 +1,2 @@
+import { organizationDescription } from "../../data/brand-definition.js";
 import { NexuAlphaWordmark } from "../brand/NexuAlphaWordmark";
@@ -755,2 +756,3 @@ export function MethodologyPage({ locale = "en" }) {
           <h1 className="methodology-page__title">{t.title}</h1>
+          <p data-aeo-extractable-answer>{organizationDescription(locale)}</p>
           <p className="methodology-page__subtitle">{t.subtitle}</p>
diff --git a/pilot-01-prototype/src/components/v3/brand-pages/AboutPage.jsx b/pilot-01-prototype/src/components/v3/brand-pages/AboutPage.jsx
index 44865e4a..eca0df64 100644
--- a/pilot-01-prototype/src/components/v3/brand-pages/AboutPage.jsx
+++ b/pilot-01-prototype/src/components/v3/brand-pages/AboutPage.jsx
@@ -4,3 +4,3 @@ import React from "react";
 import { localizedHref } from "../../../data/locale-routing.js";
-import { ABOUT_PATH, BRAND, EDITORIAL_POLICY_PATH, ENTITY_REVIEWED_AT, METHODOLOGY_PATH, RESEARCH_DESK_NAME, brandLocale, entityAtAGlance } from "../../../data/brand-entity.js";
+import { ABOUT_PATH, BRAND, EDITORIAL_POLICY_PATH, ENTITY_REVIEWED_AT, METHODOLOGY_PATH, RESEARCH_DESK_NAME, brandLocale, organizationDescription, entityAtAGlance } from "../../../data/brand-entity.js";
 import { ABOUT_COPY } from "./about-copy.js";
@@ -45,3 +45,3 @@ export function AboutPage({ locale = "en" }) {
     <main className="v6 v2-page v3-page nxb nxb--about" id="top" lang={code} dir={textDirection(code)} data-testid="about-page">
-      <BrandPageHeader locale={code} copy={t} pathname={ABOUT_PATH} />
+      <BrandPageHeader locale={code} copy={{ ...t, lead: organizationDescription(code) }} pathname={ABOUT_PATH} />
 
diff --git a/pilot-01-prototype/src/data/brand-entity.js b/pilot-01-prototype/src/data/brand-entity.js
index 473d3987..00340009 100644
--- a/pilot-01-prototype/src/data/brand-entity.js
+++ b/pilot-01-prototype/src/data/brand-entity.js
@@ -1 +1,3 @@
+import { organizationDescription } from "./brand-definition.js";
+export { organizationDescription, ENTITY_DEFINITION } from "./brand-definition.js";
 // One source of truth for the NexuAlpha publisher entity (schema.org Organization), the editorial team
@@ -6,3 +8,3 @@
 
-import { brandSlogan, sloganSentence } from "./brand-slogan.js";
+import { brandSlogan } from "./brand-slogan.js";
 
@@ -63,3 +65,3 @@ export const RESEARCH_DESK_NAME = "NexuAlpha Research Desk";
 // Brand disambiguation (SEO/GEO pass 2026-10-15). Search engines and answer engines confuse "NexuAlpha" with older,
-// similarly named brands (Nexus, NEXO). One sentence per locale, used as Organization.disambiguatingDescription and
+// similarly named brands (Nexus Alpha, nexusalpha.ai / NexusAiCore). One sentence per locale, used as Organization.disambiguatingDescription and
 // as the visible "at a glance" block on /about. vi stays information-only (no rebate wording, owner rule 2026-10-13).
@@ -67,21 +69,21 @@ export const BRAND_ALTERNATE_NAMES = Object.freeze(["Nexu Alpha", "NexuAlpha.com
 export const ENTITY_AT_A_GLANCE = Object.freeze({
-  en: ["NexuAlpha at a glance", "NexuAlpha (also written Nexu Alpha) is the crypto exchange research and fee-rebate site at nexualpha.com. It is not an exchange, a token or a trading app, and it is not affiliated with other companies, tokens or projects that use similar names, such as Nexus or NEXO. The only official channels are the ones listed on this page.", "Official profiles"],
-  "zh-Hans": ["NexuAlpha 一览", "NexuAlpha（也写作 Nexu Alpha）是位于 nexualpha.com 的加密交易所研究与手续费返还网站。它不是交易所、代币或交易 App，也与使用相近名称的其他公司、代币或项目（例如 Nexus、NEXO）没有关联。官方渠道仅以本页列出的为准。", "官方账号"],
-  "zh-Hant": ["NexuAlpha 一覽", "NexuAlpha（也寫作 Nexu Alpha）是位於 nexualpha.com 的加密交易所研究與手續費返還網站。它不是交易所、代幣或交易 App，也與使用相近名稱的其他公司、代幣或專案（例如 Nexus、NEXO）沒有關聯。官方管道僅以本頁列出的為準。", "官方帳號"],
-  es: ["NexuAlpha en breve", "NexuAlpha (también escrito Nexu Alpha) es el sitio de análisis de exchanges cripto y devolución de comisiones en nexualpha.com. No es un exchange, un token ni una app de trading, y no está vinculado con otras empresas, tokens o proyectos de nombre parecido, como Nexus o NEXO. Los únicos canales oficiales son los que figuran en esta página.", "Perfiles oficiales"],
-  "pt-BR": ["NexuAlpha em resumo", "A NexuAlpha (também escrita Nexu Alpha) é o site de análise de exchanges cripto e devolução de taxas em nexualpha.com. Não é uma exchange, um token nem um app de trading, e não tem relação com outras empresas, tokens ou projetos de nome parecido, como Nexus ou NEXO. Os únicos canais oficiais são os listados nesta página.", "Perfis oficiais"],
-  fr: ["NexuAlpha en bref", "NexuAlpha (aussi écrit Nexu Alpha) est le site d’analyse des plateformes crypto et de remboursement de frais publié sur nexualpha.com. Ce n’est ni une plateforme d’échange, ni un jeton, ni une application de trading, et il n’est lié à aucune société, aucun jeton ni aucun projet au nom proche, comme Nexus ou NEXO. Seuls les canaux listés sur cette page sont officiels.", "Profils officiels"],
-  de: ["NexuAlpha auf einen Blick", "NexuAlpha (auch Nexu Alpha geschrieben) ist die Recherche- und Gebührenrückerstattungsseite zu Kryptobörsen unter nexualpha.com. NexuAlpha ist keine Börse, kein Token und keine Trading-App und steht in keiner Verbindung zu Unternehmen, Token oder Projekten mit ähnlichem Namen wie Nexus oder NEXO. Offiziell sind nur die auf dieser Seite genannten Kanäle.", "Offizielle Profile"],
-  it: ["NexuAlpha in breve", "NexuAlpha (scritto anche Nexu Alpha) è il sito di analisi degli exchange crypto e rimborso commissioni su nexualpha.com. Non è un exchange, un token né un’app di trading e non è collegato ad altre società, token o progetti con nomi simili, come Nexus o NEXO. Gli unici canali ufficiali sono quelli elencati in questa pagina.", "Profili ufficiali"],
-  ja: ["NexuAlpha の概要", "NexuAlpha（Nexu Alpha とも表記）は、nexualpha.com で運営する暗号資産取引所のリサーチと手数料還元のサイトです。取引所、トークン、取引アプリではなく、Nexus や NEXO など似た名前の企業・トークン・プロジェクトとは関係ありません。公式チャンネルはこのページに掲載したものだけです。", "公式アカウント"],
-  ko: ["NexuAlpha 한눈에 보기", "NexuAlpha(Nexu Alpha로도 표기)는 nexualpha.com에서 운영하는 암호화폐 거래소 리서치 및 수수료 환급 사이트입니다. 거래소, 토큰, 트레이딩 앱이 아니며 Nexus, NEXO 등 비슷한 이름의 다른 회사·토큰·프로젝트와 관련이 없습니다. 공식 채널은 이 페이지에 적힌 것뿐입니다.", "공식 계정"],
-  ru: ["NexuAlpha кратко", "NexuAlpha (также пишется Nexu Alpha) — сайт с исследованиями криптобирж и возвратом комиссий по адресу nexualpha.com. Это не биржа, не токен и не торговое приложение; NexuAlpha не связан с компаниями, токенами или проектами с похожими названиями, например Nexus или NEXO. Официальные каналы — только те, что перечислены на этой странице.", "Официальные профили"],
-  tr: ["Kısaca NexuAlpha", "NexuAlpha (Nexu Alpha olarak da yazılır), nexualpha.com adresindeki kripto borsa araştırma ve komisyon iadesi sitesidir. Bir borsa, token ya da alım satım uygulaması değildir; Nexus veya NEXO gibi benzer adlı şirket, token ya da projelerle bağlantısı yoktur. Resmî kanallar yalnızca bu sayfada listelenenlerdir.", "Resmî hesaplar"],
-  id: ["Sekilas tentang NexuAlpha", "NexuAlpha (juga ditulis Nexu Alpha) adalah situs riset bursa kripto dan pengembalian biaya di nexualpha.com. NexuAlpha bukan bursa, token, atau aplikasi trading, dan tidak terkait dengan perusahaan, token, atau proyek lain bernama mirip seperti Nexus atau NEXO. Kanal resmi hanya yang tercantum di halaman ini.", "Profil resmi"],
-  vi: ["Tóm tắt về NexuAlpha", "NexuAlpha (còn viết là Nexu Alpha) là trang nghiên cứu sàn tiền mã hóa tại nexualpha.com. NexuAlpha không phải sàn giao dịch, token hay ứng dụng giao dịch, và không liên quan đến các công ty, token hay dự án có tên gần giống như Nexus hoặc NEXO. Kênh chính thức chỉ gồm những kênh được liệt kê trên trang này.", "Tài khoản chính thức"],
-  ar: ["لمحة عن NexuAlpha", "NexuAlpha (وتُكتب أيضًا Nexu Alpha) هو موقع أبحاث منصات تداول العملات المشفرة واسترداد الرسوم على nexualpha.com. ليس منصة تداول ولا رمزًا مميزًا ولا تطبيق تداول، ولا يرتبط بشركات أو رموز أو مشاريع أخرى تحمل أسماء مشابهة مثل Nexus أو NEXO. القنوات الرسمية هي المدرجة في هذه الصفحة فقط.", "الحسابات الرسمية"],
+  en: ["NexuAlpha at a glance", "NexuAlpha (also written Nexu Alpha) is the crypto exchange research and fee-rebate site at nexualpha.com. It is not an exchange, a token or a trading app, and it is not affiliated with other companies, tokens or projects that use similar names, such as Nexus Alpha, nexusalpha.ai or NexusAiCore. The only official channels are the ones listed on this page.", "Official profiles"],
+  "zh-Hans": ["NexuAlpha 一览", "NexuAlpha（也写作 Nexu Alpha）是位于 nexualpha.com 的加密交易所研究与手续费返还网站。它不是交易所、代币或交易 App，也与使用相近名称的其他公司、代币或项目（例如 Nexus Alpha、nexusalpha.ai、NexusAiCore）没有关联。官方渠道仅以本页列出的为准。", "官方账号"],
+  "zh-Hant": ["NexuAlpha 一覽", "NexuAlpha（也寫作 Nexu Alpha）是位於 nexualpha.com 的加密交易所研究與手續費返還網站。它不是交易所、代幣或交易 App，也與使用相近名稱的其他公司、代幣或專案（例如 Nexus Alpha、nexusalpha.ai、NexusAiCore）沒有關聯。官方管道僅以本頁列出的為準。", "官方帳號"],
+  es: ["NexuAlpha en breve", "NexuAlpha (también escrito Nexu Alpha) es el sitio de análisis de exchanges cripto y devolución de comisiones en nexualpha.com. No es un exchange, un token ni una app de trading, y no está vinculado con otras empresas, tokens o proyectos de nombre parecido, como Nexus Alpha o nexusalpha.ai / NexusAiCore. Los únicos canales oficiales son los que figuran en esta página.", "Perfiles oficiales"],
+  "pt-BR": ["NexuAlpha em resumo", "A NexuAlpha (também escrita Nexu Alpha) é o site de análise de exchanges cripto e devolução de taxas em nexualpha.com. Não é uma exchange, um token nem um app de trading, e não tem relação com outras empresas, tokens ou projetos de nome parecido, como Nexus Alpha ou nexusalpha.ai / NexusAiCore. Os únicos canais oficiais são os listados nesta página.", "Perfis oficiais"],
+  fr: ["NexuAlpha en bref", "NexuAlpha (aussi écrit Nexu Alpha) est le site d’analyse des plateformes crypto et de remboursement de frais publié sur nexualpha.com. Ce n’est ni une plateforme d’échange, ni un jeton, ni une application de trading, et il n’est lié à aucune société, aucun jeton ni aucun projet au nom proche, comme Nexus Alpha ou nexusalpha.ai / NexusAiCore. Seuls les canaux listés sur cette page sont officiels.", "Profils officiels"],
+  de: ["NexuAlpha auf einen Blick", "NexuAlpha (auch Nexu Alpha geschrieben) ist die Recherche- und Gebührenrückerstattungsseite zu Kryptobörsen unter nexualpha.com. NexuAlpha ist keine Börse, kein Token und keine Trading-App und steht in keiner Verbindung zu Unternehmen, Token oder Projekten mit ähnlichem Namen wie Nexus Alpha oder nexusalpha.ai / NexusAiCore. Offiziell sind nur die auf dieser Seite genannten Kanäle.", "Offizielle Profile"],
+  it: ["NexuAlpha in breve", "NexuAlpha (scritto anche Nexu Alpha) è il sito di analisi degli exchange crypto e rimborso commissioni su nexualpha.com. Non è un exchange, un token né un’app di trading e non è collegato ad altre società, token o progetti con nomi simili, come Nexus Alpha o nexusalpha.ai / NexusAiCore. Gli unici canali ufficiali sono quelli elencati in questa pagina.", "Profili ufficiali"],
+  ja: ["NexuAlpha の概要", "NexuAlpha（Nexu Alpha とも表記）は、nexualpha.com で運営する暗号資産取引所のリサーチと手数料還元のサイトです。取引所、トークン、取引アプリではなく、Nexus Alpha や nexusalpha.ai / NexusAiCore など似た名前の企業・トークン・プロジェクトとは関係ありません。公式チャンネルはこのページに掲載したものだけです。", "公式アカウント"],
+  ko: ["NexuAlpha 한눈에 보기", "NexuAlpha(Nexu Alpha로도 표기)는 nexualpha.com에서 운영하는 암호화폐 거래소 리서치 및 수수료 환급 사이트입니다. 거래소, 토큰, 트레이딩 앱이 아니며 Nexus Alpha, nexusalpha.ai / NexusAiCore 등 비슷한 이름의 다른 회사·토큰·프로젝트와 관련이 없습니다. 공식 채널은 이 페이지에 적힌 것뿐입니다.", "공식 계정"],
+  ru: ["NexuAlpha кратко", "NexuAlpha (также пишется Nexu Alpha) — сайт с исследованиями криптобирж и возвратом комиссий по адресу nexualpha.com. Это не биржа, не токен и не торговое приложение; NexuAlpha не связан с компаниями, токенами или проектами с похожими названиями, например Nexus Alpha или nexusalpha.ai / NexusAiCore. Официальные каналы — только те, что перечислены на этой странице.", "Официальные профили"],
+  tr: ["Kısaca NexuAlpha", "NexuAlpha (Nexu Alpha olarak da yazılır), nexualpha.com adresindeki kripto borsa araştırma ve komisyon iadesi sitesidir. Bir borsa, token ya da alım satım uygulaması değildir; Nexus Alpha veya nexusalpha.ai / NexusAiCore gibi benzer adlı şirket, token ya da projelerle bağlantısı yoktur. Resmî kanallar yalnızca bu sayfada listelenenlerdir.", "Resmî hesaplar"],
+  id: ["Sekilas tentang NexuAlpha", "NexuAlpha (juga ditulis Nexu Alpha) adalah situs riset bursa kripto dan pengembalian biaya di nexualpha.com. NexuAlpha bukan bursa, token, atau aplikasi trading, dan tidak terkait dengan perusahaan, token, atau proyek lain bernama mirip seperti Nexus Alpha atau nexusalpha.ai / NexusAiCore. Kanal resmi hanya yang tercantum di halaman ini.", "Profil resmi"],
+  vi: ["Tóm tắt về NexuAlpha", "NexuAlpha (còn viết là Nexu Alpha) là trang nghiên cứu sàn tiền mã hóa tại nexualpha.com. NexuAlpha không phải sàn giao dịch, token hay ứng dụng giao dịch, và không liên quan đến các công ty, token hay dự án có tên gần giống như Nexus Alpha hoặc nexusalpha.ai / NexusAiCore. Kênh chính thức chỉ gồm những kênh được liệt kê trên trang này.", "Tài khoản chính thức"],
+  ar: ["لمحة عن NexuAlpha", "NexuAlpha (وتُكتب أيضًا Nexu Alpha) هو موقع أبحاث منصات تداول العملات المشفرة واسترداد الرسوم على nexualpha.com. ليس منصة تداول ولا رمزًا مميزًا ولا تطبيق تداول، ولا يرتبط بشركات أو رموز أو مشاريع أخرى تحمل أسماء مشابهة مثل Nexus Alpha أو nexusalpha.ai / NexusAiCore. القنوات الرسمية هي المدرجة في هذه الصفحة فقط.", "الحسابات الرسمية"],
   // l10n: needs native review
-  ur: ["NexuAlpha ایک نظر میں", "NexuAlpha (جسے Nexu Alpha بھی لکھا جاتا ہے) nexualpha.com پر کرپٹو ایکسچینج تحقیق اور فیس واپسی کی ویب سائٹ ہے۔ یہ کوئی ایکسچینج، ٹوکن یا ٹریڈنگ ایپ نہیں، اور Nexus یا NEXO جیسے ملتے جلتے ناموں والی کمپنیوں، ٹوکنز یا منصوبوں سے اس کا کوئی تعلق نہیں۔ سرکاری چینل صرف وہی ہیں جو اس صفحے پر درج ہیں۔", "سرکاری اکاؤنٹس"],
+  ur: ["NexuAlpha ایک نظر میں", "NexuAlpha (جسے Nexu Alpha بھی لکھا جاتا ہے) nexualpha.com پر کرپٹو ایکسچینج تحقیق اور فیس واپسی کی ویب سائٹ ہے۔ یہ کوئی ایکسچینج، ٹوکن یا ٹریڈنگ ایپ نہیں، اور Nexus Alpha یا nexusalpha.ai / NexusAiCore جیسے ملتے جلتے ناموں والی کمپنیوں، ٹوکنز یا منصوبوں سے اس کا کوئی تعلق نہیں۔ سرکاری چینل صرف وہی ہیں جو اس صفحے پر درج ہیں۔", "سرکاری اکاؤنٹس"],
   // l10n: needs native review
-  uk: ["Коротко про NexuAlpha", "NexuAlpha (також пишеться Nexu Alpha) — сайт із дослідженнями криптобірж і поверненням комісій за адресою nexualpha.com. Це не біржа, не токен і не торговий застосунок; NexuAlpha не пов’язаний з компаніями, токенами чи проєктами зі схожими назвами, як-от Nexus або NEXO. Офіційні канали — лише ті, що наведені на цій сторінці.", "Офіційні профілі"],
+  uk: ["Коротко про NexuAlpha", "NexuAlpha (також пишеться Nexu Alpha) — сайт із дослідженнями криптобірж і поверненням комісій за адресою nexualpha.com. Це не біржа, не токен і не торговий застосунок; NexuAlpha не пов’язаний з компаніями, токенами чи проєктами зі схожими назвами, як-от Nexus Alpha або nexusalpha.ai / NexusAiCore. Офіційні канали — лише ті, що наведені на цій сторінці.", "Офіційні профілі"],
 });
@@ -93,23 +95,3 @@ export function entityAtAGlance(locale = "en") {
 
-const ORGANIZATION_DESCRIPTION = Object.freeze({
-  en: "Independent, source-backed crypto platform research: published fees, referral terms, regional conditions and reserve disclosures, each with its official source and review date.",
-  "zh-Hans": "独立、以来源为依据的加密交易平台研究：公开费率、邀请条款、地区条件与储备披露，每项都附官方来源与复核日期。",
-  "zh-Hant": "獨立、以來源為依據的加密交易平台研究：公開費率、邀請條款、地區條件與儲備披露，每項都附官方來源與複核日期。",
-  es: "Investigación independiente y basada en fuentes sobre plataformas cripto: comisiones publicadas, condiciones de referidos, condiciones regionales y reservas, cada una con su fuente oficial y fecha de revisión.",
-  "pt-BR": "Pesquisa independente e baseada em fontes sobre plataformas cripto: taxas publicadas, termos de indicação, condições regionais e reservas, cada item com fonte oficial e data de revisão.",
-  fr: "Recherche indépendante et sourcée sur les plateformes crypto : frais publiés, conditions de parrainage, conditions régionales et réserves, chaque donnée avec sa source officielle et sa date de révision.",
-  de: "Unabhängige, quellenbasierte Recherche zu Kryptoplattformen: veröffentlichte Gebühren, Empfehlungsbedingungen, regionale Bedingungen und Reserven, jeweils mit offizieller Quelle und Prüfdatum.",
-  it: "Ricerca indipendente e basata su fonti sulle piattaforme crypto: commissioni pubblicate, condizioni referral, condizioni regionali e riserve, ciascuna con fonte ufficiale e data di verifica.",
-  ja: "独立した一次情報ベースの暗号資産取引所リサーチ。公開手数料、紹介条件、地域条件、準備金開示を、公式ソースと確認日とともに整理します。",
-  ko: "독립적이고 출처 기반의 암호화폐 플랫폼 리서치. 공개 수수료, 추천 조건, 지역 조건, 준비금 공시를 공식 출처와 검토일과 함께 정리합니다.",
-  ru: "Независимое исследование криптоплатформ с опорой на источники: опубликованные комиссии, реферальные условия, региональные требования и раскрытие резервов — каждый пункт с официальным источником и датой проверки.",
-  tr: "Kaynağa dayalı bağımsız kripto platform araştırması: yayımlanmış ücretler, referans koşulları, bölgesel koşullar ve rezerv açıklamaları, her biri resmi kaynağı ve inceleme tarihiyle.",
-  id: "Riset platform kripto yang independen dan berbasis sumber: biaya resmi, ketentuan referral, kondisi regional dan pengungkapan cadangan, masing-masing dengan sumber resmi dan tanggal tinjauan.",
-  vi: "Nghiên cứu nền tảng tiền mã hóa độc lập, dựa trên nguồn: phí công bố, điều khoản giới thiệu, điều kiện khu vực và công bố dự trữ, mỗi mục kèm nguồn chính thức và ngày rà soát.",
-  // l10n: needs native review
-  ur: "آزاد اور ماخذ پر مبنی کرپٹو ایکسچینج تحقیق: شائع شدہ فیس، ریفرل شرائط، علاقائی شرائط اور ذخائر کے افشا، ہر نکتے کے ساتھ سرکاری ماخذ اور جائزے کی تاریخ۔",
-  // l10n: needs native review
-  uk: "Незалежні дослідження криптобірж на основі джерел: опубліковані комісії, реферальні та регіональні умови, розкриття резервів — з офіційним джерелом і датою перевірки для кожного пункту.",
-  ar: "بحث مستقل قائم على المصادر حول منصات العملات المشفرة: الرسوم المنشورة وشروط الإحالة والشروط الإقليمية وإفصاحات الاحتياطيات، كل بند مع مصدره الرسمي وتاريخ مراجعته.",
-});
+
 
@@ -221,8 +203,2 @@ export function organizationSchema(locale = "en") {
 
-/** Publisher description: slogan A first, then the factual description (Organization, default WebSite description). */
-export function organizationDescription(locale = "en") {
-  const code = brandLocale(locale);
-  return `${sloganSentence(brandSlogan(code), code)}${["zh-Hans", "zh-Hant", "ja"].includes(code) ? "" : " "}${ORGANIZATION_DESCRIPTION[code] || ORGANIZATION_DESCRIPTION.en}`;
-}
-
 export function researchDeskDescription(locale = "en") {
@@ -234,21 +210,21 @@ export const BRAND_PAGE_SEO = Object.freeze({
   [ABOUT_PATH]: Object.freeze({
-    en: ["About NexuAlpha: Publisher, Funding and Research Desk", "Who publishes NexuAlpha, how the site earns from partner commissions, how fees and facts are checked, and how to reach the Research Desk on Telegram."],
-    "zh-Hans": ["关于 NexuAlpha：发布方、收入来源与研究团队", "NexuAlpha 由谁发布、如何通过合作佣金获得收入、费率与事实如何核验，以及如何在 Telegram 联系研究团队。"],
-    "zh-Hant": ["關於 NexuAlpha：發布方、收入來源與研究團隊", "NexuAlpha 由誰發布、如何透過合作傭金獲得收入、費率與事實如何核驗，以及如何在 Telegram 聯絡研究團隊。"],
-    es: ["Acerca de NexuAlpha: editor, financiación y Research Desk", "Quién publica NexuAlpha, cómo se financia con comisiones de socios, cómo se verifican comisiones y datos, y cómo contactar al Research Desk en Telegram."],
-    "pt-BR": ["Sobre a NexuAlpha: editora, financiamento e equipe de pesquisa", "Quem publica a NexuAlpha, como o site ganha com comissões de parceiros, como taxas e fatos são verificados e como falar com o Research Desk no Telegram."],
-    fr: ["À propos de NexuAlpha : éditeur, financement et Research Desk", "Qui publie NexuAlpha, comment le site est financé par des commissions partenaires, comment frais et faits sont vérifiés, et comment joindre le Research Desk."],
-    de: ["Über NexuAlpha: Herausgeber, Finanzierung und Research Desk", "Wer NexuAlpha herausgibt, wie die Seite über Partnerprovisionen finanziert wird, wie Gebühren und Fakten geprüft werden und wie Sie den Research Desk erreichen."],
-    it: ["Chi siamo: editore, finanziamento e Research Desk di NexuAlpha", "Chi pubblica NexuAlpha, come il sito guadagna con le commissioni dei partner, come vengono verificati commissioni e dati e come contattare il Research Desk."],
-    ja: ["NexuAlpha について：発行者・収益・リサーチチーム", "NexuAlpha の発行者、パートナー手数料による収益、手数料と事実の確認方法、Telegram での連絡先を説明します。"],
-    ko: ["NexuAlpha 소개: 발행 주체, 수익 구조, 리서치 데스크", "NexuAlpha의 발행 주체, 파트너 수수료 기반 수익 구조, 수수료와 사실 검증 방식, Telegram 연락 방법을 안내합니다."],
-    ru: ["О NexuAlpha: издатель, финансирование и Research Desk", "Кто издаёт NexuAlpha, как сайт зарабатывает на партнёрских комиссиях, как проверяются комиссии и факты и как связаться с Research Desk в Telegram."],
-    tr: ["NexuAlpha Hakkında: Yayıncı, Finansman ve Research Desk", "NexuAlpha'yı kim yayımlıyor, site ortaklık komisyonlarından nasıl gelir elde ediyor, ücretler ve bilgiler nasıl doğrulanıyor, Research Desk'e nasıl ulaşılır."],
-    id: ["Tentang NexuAlpha: Penerbit, Pendanaan dan Research Desk", "Siapa yang menerbitkan NexuAlpha, bagaimana situs memperoleh komisi mitra, bagaimana biaya dan fakta diverifikasi, dan cara menghubungi Research Desk."],
-    vi: ["Về NexuAlpha: nhà xuất bản, nguồn thu và Research Desk", "Ai xuất bản NexuAlpha, trang kiếm tiền từ hoa hồng đối tác như thế nào, phí và dữ kiện được kiểm chứng ra sao, và cách liên hệ Research Desk qua Telegram."],
+    en: ["About NexuAlpha: Publisher, Funding and Research Desk", "NexuAlpha compares crypto exchange fees and applicable rebates using official sources. Free, independent guidance funded by disclosed exchange referrals."],
+    "zh-Hans": ["关于 NexuAlpha：发布方、收入来源与研究团队", "NexuAlpha 是独立的加密交易所手续费比较与返还指南，依据官方来源帮助交易者核对费率、注册链接和适用返还，降低交易成本。内容免费，由公开披露的交易所推荐计划资助。"],
+    "zh-Hant": ["關於 NexuAlpha：發布方、收入來源與研究團隊", "NexuAlpha 是獨立的加密交易所手續費比較指南，依官方來源核對費率與平台條件，協助評估交易成本。內容免費，由公開揭露的交易所推薦計畫資助。"],
+    es: ["Acerca de NexuAlpha: editor, financiación y Research Desk", "NexuAlpha compara tarifas y reembolsos cripto con fuentes oficiales. Guía gratuita e independiente, financiada por referidos declarados."],
+    "pt-BR": ["Sobre a NexuAlpha: editora, financiamento e equipe de pesquisa", "NexuAlpha compara taxas e reembolsos cripto com fontes oficiais. Guia gratuito e independente, financiado por indicações divulgadas."],
+    fr: ["À propos de NexuAlpha : éditeur, financement et Research Desk", "NexuAlpha compare les frais et remises crypto avec des sources officielles. Guide gratuit et indépendant, financé par des parrainages déclarés."],
+    de: ["Über NexuAlpha: Herausgeber, Finanzierung und Research Desk", "NexuAlpha vergleicht Kryptogebühren und Rabatte anhand offizieller Quellen. Kostenlos und unabhängig, durch offengelegte Empfehlungen finanziert."],
+    it: ["Chi siamo: editore, finanziamento e Research Desk di NexuAlpha", "NexuAlpha confronta costi e rimborsi crypto da fonti ufficiali. Guida gratuita e indipendente, finanziata da referral dichiarati."],
+    ja: ["NexuAlpha について：発行者・収益・リサーチチーム", "NexuAlpha は公式情報に基づく独立した暗号資産取引所の手数料比較ガイドです。取引コストの確認を支援します。無料で、開示された取引所紹介制度により運営されています。"],
+    ko: ["NexuAlpha 소개: 발행 주체, 수익 구조, 리서치 데스크", "NexuAlpha는 공식 출처로 암호화폐 거래소 수수료와 조건을 비교하는 독립 가이드입니다. 거래 비용 확인을 돕습니다. 무료이며 공개된 거래소 추천 프로그램으로 운영됩니다."],
+    ru: ["О NexuAlpha: издатель, финансирование и Research Desk", "NexuAlpha сравнивает комиссии криптобирж по официальным источникам. Бесплатный независимый гид финансируется раскрытыми реферальными программами."],
+    tr: ["NexuAlpha Hakkında: Yayıncı, Finansman ve Research Desk", "NexuAlpha resmi kaynaklarla kripto ücret ve iadelerini karşılaştırır. Ücretsiz, bağımsız rehber; açıklanan referans programlarıyla finanse edilir."],
+    id: ["Tentang NexuAlpha: Penerbit, Pendanaan dan Research Desk", "NexuAlpha membandingkan biaya dan rabat kripto dari sumber resmi. Panduan gratis dan independen, didanai referral yang diungkapkan."],
+    vi: ["Về NexuAlpha: nhà xuất bản, nguồn thu và Research Desk", "NexuAlpha so sánh phí sàn crypto từ nguồn chính thức. Hướng dẫn độc lập, miễn phí, được tài trợ bởi chương trình giới thiệu đã công bố."],
     // l10n: needs native review
-    ur: ["NexuAlpha کے بارے میں: ناشر، آمدنی اور تحقیقی ٹیم", "NexuAlpha کا ناشر، پارٹنر کمیشن سے آمدنی، فیس اور حقائق کی جانچ اور Telegram پر تحقیقی ٹیم سے رابطہ۔"],
+    ur: ["NexuAlpha کے بارے میں: ناشر، آمدنی اور تحقیقی ٹیم", "NexuAlpha سرکاری ذرائع سے کرپٹو ایکسچینج فیس کا موازنہ کرتا ہے۔ آزاد، مفت رہنمائی؛ ظاہر کردہ ریفرل پروگراموں سے مالی معاونت۔"],
     // l10n: needs native review
-    uk: ["Про NexuAlpha: видавець, фінансування й дослідницька команда", "Хто видає NexuAlpha, як сайт отримує партнерські комісії, як перевіряє комісії та факти і як зв’язатися з командою через Telegram."],
-    ar: ["عن NexuAlpha: الناشر والتمويل وفريق البحث", "من ينشر NexuAlpha، وكيف يحقق الموقع دخله من عمولات الشركاء، وكيف تُراجع الرسوم والحقائق، وكيفية التواصل مع فريق البحث عبر Telegram."],
+    uk: ["Про NexuAlpha: видавець, фінансування й дослідницька команда", "NexuAlpha порівнює комісії криптобірж за офіційними джерелами. Безкоштовний незалежний гід фінансують розкриті реферальні програми."],
+    ar: ["عن NexuAlpha: الناشر والتمويل وفريق البحث", "NexuAlpha دليل مستقل لمقارنة رسوم منصات العملات المشفرة من مصادر رسمية. المحتوى مجاني وتموله برامج إحالة معلنة."],
   }),
@@ -285,3 +261,3 @@ export function brandPageMeta(pathname, locale = "en") {
   const [title, description] = table[brandLocale(locale)] || table.en;
-  return { title, description };
+  return { title, description: pathname === ABOUT_PATH ? organizationDescription(locale) : description };
 }
diff --git a/pilot-01-prototype/src/data/home-search-copy.js b/pilot-01-prototype/src/data/home-search-copy.js
index edc90cba..9e3939bd 100644
--- a/pilot-01-prototype/src/data/home-search-copy.js
+++ b/pilot-01-prototype/src/data/home-search-copy.js
@@ -1,15 +1,3 @@
-// Home <title> and meta description per locale. One table read by the Worker head (worker/index.js routeMetadata),
-// the SSR/client router (seo-injection.js computeRouteSeo) and therefore /api/route-seo, so all three stay identical.
-//
-// Owner 2026-10-10 (GSC CTR work): the title carries the commercial search intent (referral code / fee rebate; ja/ko
-// informational; ru/ar/ur/uk/vi neutral, matching src/data/referral-seo.js).
-// Owner 2026-10-11 (brand slogans, src/data/brand-slogan.js):
-//   - title = search keywords + slogan A + " — NexuAlpha" when that fits the 60-wide budget (budgetTitle,
-//     titleDisplayWidth: CJK counts double); otherwise keywords + " — NexuAlpha" and slogan A leads the description;
-//   - description = [slogan A when not in the title] + slogan B + the facts (OKX/Bitget/Binance codes, settled by the
-//     exchange; no disclosure line since 2026-10-13), clamped with clampMetaDescription.
-// Slogan B (a rebate share) is left out where the home copy is neutral pending local review: ru (advertising
-// rules), ar (Egypt CBE law 194/2020), vi (Vietnam Resolution 05/2025/NQ-CP, owner 2026-10-13), plus ur and uk until partner/regulator status is reviewed. These lead with slogan A and keep their neutral facts. Turkish carries
-// slogan B like the other locales (owner 2026-10-11: "土耳其站照常写"). Remove a locale from
-// NEUTRAL_HOME_DESCRIPTION_LOCALES to add slogan B.
+import { organizationDescription } from "./brand-definition.js";
+// Home titles retain existing locale/market policy. Descriptions share the canonical entity definition.
 import { HOME_REBATE_MAX_PCT, HOME_REBATE_SHARE } from "./home-rebate-tiers.js";
@@ -101,12 +89,5 @@ export function turkeyVenueTrio(text) {
 
-/** Home meta description: [slogan A] + [slogan B] + facts, clamped to the locale snippet budget. */
+/** Canonical entity definition, bounded to the locale snippet budget. */
 export function homeDescription(locale, { turkey = locale === "tr" } = {}) {
-  const parts = [];
-  if (!homeTitleCarriesSlogan(locale)) parts.push(sloganSentence(brandSlogan(locale), locale));
-  // Turkey (owner 2026-10-11): Bitget is not promoted (its Turkish entity is on the SPK liquidation list), so the share in
-  // slogan B is the best confirmed share among the partners promoted in Turkey (OKX 40%), not the Bitget headline.
-  if (!NEUTRAL_HOME_DESCRIPTION_LOCALES.has(locale)) parts.push(sloganSentence(brandSloganSecondary(locale, turkey ? TR_REBATE_MAX_PCT : undefined), locale));
-  const facts = HOME_FACTS[locale] || HOME_FACTS.en;
-  parts.push(turkey ? turkeyVenueTrio(facts) : facts);
-  return clampMetaDescription(parts.join(CJK_JOIN.has(locale) ? "" : " "), locale);
+  return clampMetaDescription(organizationDescription(locale), locale);
 }
```

## Profile bios for the lead to update manually

These are proposed copy only; no social profile was edited. Use https://nexualpha.com as the profile website, never a /go link.

- X @NexuAlpha: Independent crypto fee comparisons and rebate guides. Official sources. Free to use; funded by disclosed referrals. https://nexualpha.com
- YouTube @NexuAlphaGlobal: Independent crypto exchange comparisons and fee-rebate guides, backed by official sources. Check fees, official sign-up routes and applicable rebate terms. Free to use; funded by disclosed exchange referrals. https://nexualpha.com
- YouTube @NexuAlphaCN: 独立的加密交易所手续费比较与返还指南。依据官方来源核对费率、注册链接及适用返还条件，帮助降低交易成本。内容免费，由公开披露的交易所推荐计划资助。https://nexualpha.com
- Telegram @NexuAlphaGlobal: Independent crypto fee comparisons and rebate guides. Official sources, free access, disclosed referral funding. https://nexualpha.com
- Telegram @NexuAlphaClub: 独立比较加密交易所费率与适用返还，依据官方来源帮助降低交易成本。内容免费，推荐合作公开披露。https://nexualpha.com
- Telegram @NexuAlphaWorld: Discuss crypto exchange fees and source-backed comparisons. Free resources; exchange referral funding is disclosed. https://nexualpha.com
- Telegram @NexuAlphaAssistantBot: Find source-backed crypto fee comparisons and guides. Free access; disclosed exchange referral funding. https://nexualpha.com

## Verification boundary

Local changes do not demonstrate changed rankings, AI summaries, indexing or production deployment. Browser visual verification at 390/768/1440 remains pending: sandbox Chrome launch aborted; the Chrome computer-use connection returned "Debugger unattached". No production submission or profile update was performed.

Local commit blocked: both git add and git commit failed with `Unable to create /Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-brand-entity/index.lock: Operation not permitted`. Restore managed write access to the worktree Git metadata, then stage and commit the retained changes on codex/brand-entity.
