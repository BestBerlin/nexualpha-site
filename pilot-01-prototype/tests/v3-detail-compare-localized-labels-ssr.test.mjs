import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const nonEnglishLocales = locales.filter((locale) => locale !== "en");

const expectedCodeLabel = {
  ur: "کوڈ:",
  uk: "Код:",
  "zh-Hans": "专属码:",
  "zh-Hant": "專屬碼:",
  es: "Código:",
  "pt-BR": "Código:",
  fr: "Code:",
  de: "Code:",
  ja: "コード:",
  ko: "코드:",
  ar: "رمز:",
  tr: "Kod:",
  ru: "Код:",
  id: "Kode:",
  vi: "Mã:",
  it: "Codice:",
};

const expectedOfficialFlow = {
  ur: "سرکاری عمل میں تصدیق کریں", // native review 2026-10-12 (Gemini): "flow" → "عمل"
  uk: "Перевірити в офіційному процесі",
  "zh-Hans": "官方流程核验",
  "zh-Hant": "官方流程核驗",
  es: "Verificar en el flujo oficial",
  "pt-BR": "Verificar no fluxo oficial",
  fr: "Vérifier dans le parcours officiel",
  de: "Im offiziellen Ablauf prüfen",
  ja: "公式手続きで確認",
  ko: "공식 절차에서 확인",
  ar: "تحقق داخل المسار الرسمي",
  tr: "Resmî akışta doğrula",
  ru: "Проверить в официальном процессе",
  id: "Verifikasi di alur resmi",
  vi: "Xác minh trong luồng chính thức",
  it: "Verifica nel flusso ufficiale",
};

const expectedDecisionGuideNeedle = {
  ur: "پہلے Bybit کی علاقائی اہلیت",
  uk: "Спершу перевірте регіональну доступність",
  "zh-Hans": "先核对 Bybit 的地区资格、产品范围与官方费率",
  "zh-Hant": "先核對 Bybit 的地區資格、產品範圍與官方費率",
  es: "Verifica primero la elegibilidad regional",
  "pt-BR": "Verifique primeiro a elegibilidade regional",
  fr: "Vérifiez d’abord l’éligibilité régionale",
  de: "Prüfen Sie zuerst regionale Eignung",
  ja: "Bybit の地域資格、商品範囲、公式手数料表を先に確認",
  ko: "Bybit의 지역 자격, 상품 범위, 공식 수수료표를 먼저 확인",
  ar: "تحقق أولاً من أهلية المنطقة",
  tr: "Önce Bybit için bölgesel uygunluğu",
  ru: "Сначала проверьте региональную доступность",
  id: "Periksa dulu kelayakan wilayah",
  vi: "Trước tiên hãy kiểm tra điều kiện khu vực",
  it: "Verifica prima idoneità regionale",
};

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#x27;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

test("v3 detail and comparison labels are localized in server-rendered 17-locale pages", async () => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-v3-label-ssr-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { VenueDetailPage } from "../../src/components/v3/VenueDetailPageStatic.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";

      const pageCopy = {
        common: { dimension: "Dimension" },
        assetCapabilities: { none: "Pending source review" },
      };
      const venues = Object.values(venueDatabase);
      const pages = [];
      for (const locale of ${JSON.stringify(locales)}) {
        const detailHtml = renderToStaticMarkup(React.createElement(VenueDetailPage, {
          copy: pageCopy,
          locale,
          venue: venueDatabase.bitget,
          venues,
          updates: [],
          market: "unknown",
          product: "spot",
        }));
        const compareHtml = renderToStaticMarkup(React.createElement(CompareDeepPage, {
          copy: pageCopy,
          locale,
          selected: ["bybit", "bitget"],
          venues,
          updates: [],
          market: "unknown",
          product: "spot",
        }));
        pages.push({ locale, detailHtml, compareHtml });
      }
      console.log(JSON.stringify(pages));
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    const pages = JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
    assert.equal(pages.length, locales.length);

    for (const { locale, detailHtml, compareHtml } of pages) {
      assert.match(detailHtml, /v3-venue-rebate-card/, `${locale}: detail registration card rendered`);
      assert.match(compareHtml, /v3-metric-matrix-section/, `${locale}: compare matrix rendered`);
      if (locale === "en") continue;

      assert.doesNotMatch(detailHtml, /Referral Code|Open deeper verification material|Review fees, reserves, KYC and leverage|Verify in official flow|Pending source review/, `${locale}: detail labels should not fall back to English`);
      assert.doesNotMatch(compareHtml, /CODE:|Official Action|Anti-phishing official portal|Review fees, reserves and KYC|Open platform detail links|Jump to|Verify Bybit&#x27;s regional eligibility, product scope and official fee schedule first|Published fee reference:|Published fee sources still require review|Reserve, solvency and security claims|Leverage, margin, liquidation and product limits/, `${locale}: compare labels should not fall back to English`);
      assert.ok(detailHtml.includes(escapeHtml(expectedOfficialFlow[locale])), `${locale}: localized official-flow KYC label appears in detail metrics`);
      // SEO audit 2026-10-11 #6 (owner-approved): a metric tile without a checked value renders nothing instead of a
      // localized "pending" placeholder.
      if (locale === "es") assert.ok(!/v3-metric-tile__val[^>]*>Pendiente de verificación de la fuente/.test(detailHtml), `${locale}: no max-leverage pending tile`);
      if (locale === "pt-BR") assert.ok(!/v3-metric-tile__val[^>]*>Aguardando verificação da fonte/.test(detailHtml), `${locale}: no max-leverage pending tile`);
      if (NEUTRAL_CTA_LOCALE_LIST.includes(locale)) {
        for (const html of [detailHtml, compareHtml]) {
          assert.doesNotMatch(html, /data-cta-kind="registration"|data-cta-code=|href="\/go\//, `${locale}: neutral signup and codes absent`);
          assert.doesNotMatch(html, /nexu888|affiliate_id=48553/, `${locale}: venue invite code absent`);
        }
      } else {
        assert.ok(compareHtml.includes(escapeHtml(expectedCodeLabel[locale])), `${locale}: localized code label appears in compare CTA cells`);
      }
      assert.ok(compareHtml.includes(escapeHtml(expectedDecisionGuideNeedle[locale])), `${locale}: localized pre-signup decision guide copy appears`);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
