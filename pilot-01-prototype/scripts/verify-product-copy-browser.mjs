#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(scriptPath), "..");
const workspaceRoot = resolve(projectRoot, "..");
const sharedRoot = process.env.CODEX_WEB_QUALITY_ROOT || "/Users/bestberlin/.codex/shared-tools/web-quality";
const sharedRequire = createRequire(join(sharedRoot, "package.json"));
const puppeteer = sharedRequire("puppeteer-core");

const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
const localePathPrefixes = [...locales.map((locale) => locale.toLowerCase()), "id-id"];
const viewports = [
  { id: "390", width: 390, height: 844 },
  { id: "768", width: 768, height: 1024 },
  { id: "1440", width: 1440, height: 1000 },
];
const routes = [
  { id: "compare", path: "/compare/binance-vs-okx", ready: ".v3-compare-verdict" },
  { id: "detail", path: "/exchanges/binance", ready: "#registration-path" },
];
const screenshotLocales = new Set(["zh-Hans", "zh-Hant", "it", "de", "ja", "ar"]);
const screenshotViewportIds = new Set(["390", "1440"]);
const sourceFactTargets = {
  en: {
    executionAxis: "Execution",
    accountAxis: "Account & access",
    kucoinExecutionFact: "KuCoin's spot guide explains limit",
    okxAccountFact: "identity-verification support path is a required source",
  },
  "zh-Hans": {
    executionAxis: "执行机制",
    accountAxis: "账户与访问",
    kucoinExecutionFact: "KuCoin 现货指南解释限价",
    okxAccountFact: "身份验证帮助入口核对",
  },
  "zh-Hant": {
    executionAxis: "執行機制",
    accountAxis: "帳戶與存取",
    kucoinExecutionFact: "KuCoin 現貨指南解釋限價",
    okxAccountFact: "身份驗證幫助入口核對",
  },
};

const englishFallbackPhrases = [
  "Decide which venue fits first",
  "Better for",
  "Before registration",
  "Consider instead",
  "Review pre-registration checklist",
  "Registration handoff pending",
  "Must verify before registration",
  "Open independent profile",
  "Open deep comparison",
];

const expected = {
  en: {
    compareVerdictTitle: ["Decide which venue fits first"],
    verdictBestFor: ["Better for"],
    verdictRegistrationFit: ["Before registration"],
    verdictAlternative: ["Consider instead"],
    registrationPrepCta: ["Review pre-registration checklist"],
    verifyBefore: ["Must verify before registration"],
    openDetail: ["Open independent profile"],
    viewCompare: ["Open deep comparison"],
    detailBestFit: ["Best fit"],
    detailWhyChoose: ["Why choose it"],
    detailNotFor: ["Not ideal for"],
    detailPreKycFunding: ["Before registration / KYC / funding"],
    sourceHost: ["Official source host"],
  },
  "zh-Hans": {
    compareVerdictTitle: ["先确定哪一家更适合你"],
    verdictBestFor: ["更适合"],
    verdictRegistrationFit: ["注册前重点"],
    verdictAlternative: ["改看另一家"],
    registrationPrepCta: ["查看注册前清单"],
    verifyBefore: ["注册前必须核对"],
    openDetail: ["看平台详情"],
    viewCompare: ["打开详细对比"],
    detailBestFit: ["适合谁"],
    detailWhyChoose: ["为什么选"],
    detailNotFor: ["不适合谁"],
    detailPreKycFunding: ["注册 / KYC / 入金前核对"],
    sourceHost: ["官方来源主机"],
  },
  "zh-Hant": {
    compareVerdictTitle: ["先確定哪一家更適合你"],
    verdictBestFor: ["更適合"],
    verdictRegistrationFit: ["註冊前重點"],
    verdictAlternative: ["改看另一家"],
    registrationPrepCta: ["查看註冊前清單"],
    verifyBefore: ["註冊前必須核對"],
    openDetail: ["看平台詳情"],
    viewCompare: ["開啟詳細比較"],
    detailBestFit: ["適合誰"],
    detailWhyChoose: ["為什麼選"],
    detailNotFor: ["不適合誰"],
    detailPreKycFunding: ["註冊 / KYC / 入金前核對"],
    sourceHost: ["官方來源主機"],
  },
  es: {
    compareVerdictTitle: ["Decide primero qué plataforma encaja"],
    verdictBestFor: ["Encaja mejor"],
    verdictRegistrationFit: ["Antes del registro"],
    verdictAlternative: ["Considerar otra"],
    registrationPrepCta: ["Revisar lista previa al registro"],
    verifyBefore: ["Verificar antes del registro"],
    openDetail: ["Abrir perfil independiente"],
    viewCompare: ["Abrir comparación"],
    detailBestFit: ["Para quién encaja"],
    detailWhyChoose: ["Por qué considerarla"],
    detailNotFor: ["No ideal para"],
    detailPreKycFunding: ["Antes de registro / KYC / fondeo"],
    sourceHost: ["Host de fuente oficial"],
  },
  "pt-BR": {
    compareVerdictTitle: ["Decida primeiro qual plataforma se encaixa"],
    verdictBestFor: ["Melhor encaixe"],
    verdictRegistrationFit: ["Antes do registro"],
    verdictAlternative: ["Considere outra"],
    registrationPrepCta: ["Revisar checklist antes do registro"],
    verifyBefore: ["Verificar antes do registro"],
    openDetail: ["Abrir perfil independente"],
    viewCompare: ["Abrir comparação"],
    detailBestFit: ["Para quem serve"],
    detailWhyChoose: ["Por que considerar"],
    detailNotFor: ["Não ideal para"],
    detailPreKycFunding: ["Antes de registro / KYC / depósito"],
    sourceHost: ["Host da fonte oficial"],
  },
  fr: {
    compareVerdictTitle: ["Décidez d’abord quelle plateforme convient"],
    verdictBestFor: ["Convient mieux"],
    verdictRegistrationFit: ["Avant inscription"],
    verdictAlternative: ["Voir une autre"],
    registrationPrepCta: ["Revoir la liste avant inscription"],
    verifyBefore: ["À vérifier avant inscription"],
    openDetail: ["Ouvrir le profil indépendant"],
    viewCompare: ["Ouvrir la comparaison"],
    detailBestFit: ["Pour qui"],
    detailWhyChoose: ["Pourquoi la considérer"],
    detailNotFor: ["Pas idéal pour"],
    detailPreKycFunding: ["Avant inscription / KYC / financement"],
    sourceHost: ["Hôte de source officielle"],
  },
  de: {
    compareVerdictTitle: ["Erst entscheiden, welche Plattform passt"],
    verdictBestFor: ["Passt besser"],
    verdictRegistrationFit: ["Vor Registrierung"],
    verdictAlternative: ["Andere prüfen"],
    registrationPrepCta: ["Checkliste vor Registrierung prüfen"],
    verifyBefore: ["Vor Registrierung prüfen"],
    openDetail: ["Unabhängiges Profil öffnen"],
    viewCompare: ["Vergleich öffnen"],
    detailBestFit: ["Für wen geeignet"],
    detailWhyChoose: ["Warum prüfen"],
    detailNotFor: ["Nicht ideal für"],
    detailPreKycFunding: ["Vor Registrierung / KYC / Einzahlung"],
    sourceHost: ["Offizieller Quellenhost"],
  },
  ja: {
    compareVerdictTitle: ["先に合うプラットフォームを決める"],
    verdictBestFor: ["より合う用途"],
    verdictRegistrationFit: ["登録前の確認"],
    verdictAlternative: ["別候補を見る"],
    registrationPrepCta: ["登録前チェックリストを見る"],
    verifyBefore: ["登録前に確認"],
    openDetail: ["独立プロファイルを開く"],
    viewCompare: ["比較を開く"],
    detailBestFit: ["向いている人"],
    detailWhyChoose: ["検討する理由"],
    detailNotFor: ["向かない場合"],
    detailPreKycFunding: ["登録 / KYC / 入金前"],
    sourceHost: ["公式ソースホスト"],
  },
  ko: {
    compareVerdictTitle: ["둘 중 어디에서 계정을 만들지 먼저 판단하세요"],
    verdictBestFor: ["더 맞는 경우"],
    verdictRegistrationFit: ["등록 전 확인"],
    verdictAlternative: ["다른 후보 보기"],
    registrationPrepCta: ["가입 전 조건 확인하기"],
    verifyBefore: ["등록 전 확인"],
    openDetail: ["독립 프로필 열기"],
    viewCompare: ["비교 열기"],
    detailBestFit: ["잘 맞는 대상"],
    detailWhyChoose: ["검토할 이유"],
    detailNotFor: ["맞지 않는 경우"],
    detailPreKycFunding: ["가입 / 본인확인 / 입금 전"],
    sourceHost: ["공식 출처 호스트"],
  },
  ar: {
    compareVerdictTitle: ["حدد أولا أي منصة تناسبك"],
    verdictBestFor: ["أنسب لـ"],
    verdictRegistrationFit: ["قبل التسجيل"],
    verdictAlternative: ["فكّر في بديل"],
    registrationPrepCta: ["مراجعة قائمة ما قبل التسجيل"],
    verifyBefore: ["تحقق قبل التسجيل"],
    openDetail: ["فتح الملف المستقل"],
    viewCompare: ["فتح المقارنة"],
    detailBestFit: ["لمن تناسب"],
    detailWhyChoose: ["لماذا تراجعها"],
    detailNotFor: ["ليست مثالية لـ"],
    detailPreKycFunding: ["قبل التسجيل / KYC / التمويل"],
    sourceHost: ["مضيف المصدر الرسمي"],
  },
  tr: {
    compareVerdictTitle: ["Hesabı hangi platformda açacağını önce netleştir"],
    verdictBestFor: ["Daha uygun"],
    verdictRegistrationFit: ["Kayıt öncesi"],
    verdictAlternative: ["Alternatifi düşün"],
    registrationPrepCta: ["Kayıt koşullarını kontrol et"],
    verifyBefore: ["Kayıt öncesi doğrula"],
    openDetail: ["Bağımsız profili aç"],
    viewCompare: ["Karşılaştırmayı aç"],
    detailBestFit: ["Kimler için uygun"],
    detailWhyChoose: ["Neden değerlendirilmeli"],
    detailNotFor: ["Şunlar için ideal değil"],
    detailPreKycFunding: ["Kayıt / kimlik doğrulama / para yatırma öncesi"],
    sourceHost: ["Resmi kaynak hostu"],
  },
  ru: {
    compareVerdictTitle: ["Сначала выберите подходящую платформу"],
    verdictBestFor: ["Лучше подходит"],
    verdictRegistrationFit: ["Перед регистрацией"],
    verdictAlternative: ["Рассмотреть другую"],
    registrationPrepCta: ["Проверить список перед регистрацией"],
    verifyBefore: ["Проверить до регистрации"],
    openDetail: ["Открыть независимый профиль"],
    viewCompare: ["Открыть сравнение"],
    detailBestFit: ["Кому подходит"],
    detailWhyChoose: ["Почему рассмотреть"],
    detailNotFor: ["Не идеально для"],
    detailPreKycFunding: ["Перед регистрацией / KYC / пополнением"],
    sourceHost: ["Хост официального источника"],
  },
  id: {
    compareVerdictTitle: ["Putuskan dulu platform yang cocok"],
    verdictBestFor: ["Lebih cocok"],
    verdictRegistrationFit: ["Sebelum registrasi"],
    verdictAlternative: ["Pertimbangkan lain"],
    registrationPrepCta: ["Tinjau checklist sebelum registrasi"],
    verifyBefore: ["Periksa sebelum registrasi"],
    openDetail: ["Buka profil independen"],
    viewCompare: ["Buka perbandingan"],
    detailBestFit: ["Cocok untuk"],
    detailWhyChoose: ["Mengapa dipertimbangkan"],
    detailNotFor: ["Kurang ideal untuk"],
    detailPreKycFunding: ["Sebelum registrasi / KYC / pendanaan"],
    sourceHost: ["Host sumber resmi"],
  },
  vi: {
    compareVerdictTitle: ["Chọn nền tảng phù hợp trước"],
    verdictBestFor: ["Phù hợp hơn"],
    verdictRegistrationFit: ["Trước đăng ký"],
    verdictAlternative: ["Xem lựa chọn khác"],
    registrationPrepCta: ["Xem danh sách trước đăng ký"],
    verifyBefore: ["Cần xác minh trước đăng ký"],
    openDetail: ["Mở hồ sơ độc lập"],
    viewCompare: ["Mở so sánh"],
    detailBestFit: ["Phù hợp với ai"],
    detailWhyChoose: ["Vì sao nên xem xét"],
    detailNotFor: ["Không lý tưởng cho"],
    detailPreKycFunding: ["Trước đăng ký / KYC / nạp tiền"],
    sourceHost: ["Máy chủ nguồn chính thức"],
  },
  it: {
    compareVerdictTitle: ["Decidi prima quale piattaforma si adatta"],
    verdictBestFor: ["Più adatta a"],
    verdictRegistrationFit: ["Prima della registrazione"],
    verdictAlternative: ["Considera invece"],
    registrationPrepCta: ["Rivedi checklist pre-registrazione"],
    verifyBefore: ["Verifica prima della registrazione"],
    openDetail: ["Apri profilo indipendente"],
    viewCompare: ["Apri il confronto"],
    detailBestFit: ["A chi si adatta"],
    detailWhyChoose: ["Perché considerarla"],
    detailNotFor: ["Non ideale per"],
    detailPreKycFunding: ["Prima di registrazione / KYC / funding"],
    sourceHost: ["Host fonte ufficiale"],
  },
};

function parseArgs(argv) {
  const parsed = {
    baseUrl: "http://localhost:4173",
    artifactRoot: join(workspaceRoot, "artifacts", "v3-repair"),
    mode: "product-copy-browser",
    expectedBuildId: "",
    timeoutMs: 30000,
    dryRun: false,
    locales: [],
    routes: [],
    viewports: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url" && argv[index + 1]) parsed.baseUrl = argv[++index];
    else if (arg === "--artifact-root" && argv[index + 1]) parsed.artifactRoot = resolve(argv[++index]);
    else if (arg === "--mode" && argv[index + 1]) parsed.mode = argv[++index];
    else if (arg === "--expected-build-id" && argv[index + 1]) parsed.expectedBuildId = argv[++index];
    else if (arg === "--timeout-ms" && argv[index + 1]) parsed.timeoutMs = Number(argv[++index]);
    else if (arg === "--locales" && argv[index + 1]) parsed.locales = argv[++index].split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--routes" && argv[index + 1]) parsed.routes = argv[++index].split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--viewports" && argv[index + 1]) parsed.viewports = argv[++index].split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--help" || arg === "-h") parsed.help = true;
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  return parsed;
}

function usage() {
  return [
    "node scripts/verify-product-copy-browser.mjs [options]",
    "",
    "Options:",
    "  --base-url URL             Preview URL. Default: http://localhost:4173",
    "  --artifact-root DIR        Evidence root. Default: ../artifacts/v3-repair",
    "  --mode NAME                Evidence label. Default: product-copy-browser",
    "  --expected-build-id ID     Require version/footer DOM build identity.",
    "  --timeout-ms MS            Navigation timeout. Default: 30000",
    "  --locales LIST             Comma-separated locale subset for targeted diagnostics.",
    "  --routes LIST              Comma-separated route subset: compare,detail.",
    "  --viewports LIST           Comma-separated viewport subset: 390,768,1440.",
    "  --dry-run                  Print plan without launching Chrome",
  ].join("\n");
}

function filteredSubset(allItems, requested, label, idFor = (item) => item) {
  if (!requested.length) return allItems;
  const known = new Map(allItems.map((item) => [idFor(item), item]));
  const unknown = requested.filter((item) => !known.has(item));
  assert.deepEqual(unknown, [], `unknown ${label}: ${unknown.join(", ")}`);
  return requested.map((item) => known.get(item));
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function withLocale(baseUrl, routePath, locale) {
  const url = new URL(routePath, baseUrl);
  url.searchParams.set("locale", locale);
  return url.href;
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function includesAny(haystack, needles) {
  const text = normalizeText(haystack);
  return needles.some((needle) => text.includes(needle));
}

async function readJsonIfAvailable(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(usage());
  process.exit(0);
}
const activeLocales = filteredSubset(locales, args.locales, "locales");
const activeRoutes = filteredSubset(routes, args.routes, "routes", (route) => route.id);
const activeViewports = filteredSubset(viewports, args.viewports, "viewports", (viewport) => viewport.id);
const activeSourceFactLocales = args.locales.length
  ? Object.keys(sourceFactTargets).filter((locale) => activeLocales.includes(locale))
  : Object.keys(sourceFactTargets);

const visualSettleTimeoutMs = 3000;

async function settlePageForVisualCheck(page, timeoutMs = visualSettleTimeoutMs) {
  return page.evaluate(async (maxWaitMs) => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await Promise.race([document.fonts?.ready ?? Promise.resolve(), delay(maxWaitMs)]);
    const candidates = Array.from(document.images).filter((image) => {
      if (image.complete) return true;
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) return false;
      const nearViewport = rect.bottom >= -innerHeight && rect.top <= innerHeight * 2;
      return image.loading !== "lazy" || nearViewport;
    });
    await Promise.race([
      Promise.all(candidates.map((image) => Promise.race([
        image.decode?.().catch(() => {}) ?? Promise.resolve(),
        delay(maxWaitMs),
      ]))),
      delay(maxWaitMs),
    ]);
    return {
      totalImages: document.images.length,
      waitedImages: candidates.length,
      pendingLazyImages: Array.from(document.images).filter((image) => !image.complete && image.loading === "lazy").length,
    };
  }, timeoutMs);
}

if (args.dryRun) {
  console.log(JSON.stringify({
    status: "READY",
    baseUrl: args.baseUrl,
    mode: args.mode,
    expectedBuildId: args.expectedBuildId || null,
    samples: activeLocales.length * activeRoutes.length * activeViewports.length,
    locales: activeLocales,
    routes: activeRoutes.map((route) => route.id),
    viewports: activeViewports.map((viewport) => viewport.id),
    screenshotLocales: [...screenshotLocales],
    screenshotViewportIds: [...screenshotViewportIds],
    checks: [
      "compare localized verdict h2 and dt labels",
      "detail decision/link section labels",
      "KuCoin vs OKX research table shows execution and account source facts",
      "no English UI fallback on non-English locales",
      "NexuAlpha brand preserved and bidi-isolated where marked",
      "language switch preserves route and updates copy",
      "no horizontal overflow at 390/768/1440",
    ],
    sourceFactLocales: activeSourceFactLocales,
  }, null, 2));
  process.exit(0);
}

const chromePath = findChromePath();
assert.ok(chromePath, "Chrome or Chromium executable must be available");
const runDir = join(resolve(args.artifactRoot), `${timestampSlug()}-${args.mode}-product-copy-browser`);
await mkdir(runDir, { recursive: true });
const userDataDir = await mkdtemp(join(tmpdir(), "nexualpha-product-copy-"));

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "new",
  protocolTimeout: Math.max(args.timeoutMs * 5, 180000),
  args: ["--no-first-run", "--no-default-browser-check"],
  userDataDir,
});

const page = await browser.newPage();
const consoleErrors = [];
const requestFailures = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("requestfailed", (request) => requestFailures.push({ url: request.url(), failure: request.failure()?.errorText }));

const report = {
  status: "PASS",
  mode: args.mode,
  baseUrl: args.baseUrl,
  expectedBuildId: args.expectedBuildId || null,
  runDir,
  version: null,
  samples: [],
  screenshots: [],
  languageSwitches: [],
  sourceFactChecks: [],
  consoleErrors,
  requestFailures,
  pageErrors,
};

try {
  const version = await readJsonIfAvailable(new URL("/version.json", args.baseUrl).href);
  report.version = version;
  if (args.expectedBuildId) assert.equal(version.buildId, args.expectedBuildId, "version.json buildId must match expected build");

  async function gotoRoute(route, locale, viewport) {
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    await page.goto(withLocale(args.baseUrl, route.path, locale), { waitUntil: "networkidle0", timeout: args.timeoutMs });
    await page.waitForSelector(route.ready, { timeout: args.timeoutMs });
    await settlePageForVisualCheck(page);
  }

  async function takeScreenshot(locale, route, viewport) {
    if (!screenshotLocales.has(locale) || !screenshotViewportIds.has(viewport.id)) return;
    const targetSelector = route.id === "compare" ? ".v3-compare-verdict" : "#registration-path";
    await page.evaluate((selector) => {
      document.querySelector(selector)?.scrollIntoView({ behavior: "instant", block: "start", inline: "nearest" });
      return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, targetSelector);
    await page.waitForSelector(targetSelector, { timeout: args.timeoutMs });
    const file = join(runDir, `${route.id}-${locale}-${viewport.id}.png`);
    await page.screenshot({ path: file, fullPage: false });
    report.screenshots.push(file);
  }

  async function sampleRoute(route, locale, viewport) {
    await gotoRoute(route, locale, viewport);
    await takeScreenshot(locale, route, viewport);
    if (args.expectedBuildId) {
      const deferredHydration = await page.$("script[data-nexualpha-deferred-hydration]");
      if (deferredHydration) {
        // Prerendered production pages intentionally defer the main module
        // until the first interaction. Trigger that contract so the build ID
        // check proves the shipped client bundle can actually hydrate.
        await page.mouse.wheel({ deltaY: 1 });
        await page.waitForFunction(
          (buildId) => document.documentElement.dataset.build === buildId || document.body.dataset.build === buildId,
          { timeout: args.timeoutMs },
          args.expectedBuildId,
        );
      }
    }
    const result = await page.evaluate(({ routeId, locale, expectedForLocale, englishFallbackPhrases, expectedBuildId }) => {
      const compact = (value, limit = 240) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
      const text = (selector) => compact(document.querySelector(selector)?.textContent);
      const texts = (selector, limit = 80) => Array.from(document.querySelectorAll(selector)).slice(0, limit).map((node) => compact(node.textContent));
      const contains = (values, candidates) => candidates.some((candidate) => values.some((value) => value.includes(candidate)));
      const visibleRoot = routeId === "compare" ? document.querySelector(".v3-compare-page") : document.querySelector(".v3-detail-page, main");
      const visibleText = visibleRoot?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const brandNodes = Array.from(document.body.querySelectorAll("[translate='no']")).filter((node) => {
        if (!node.textContent?.includes("NexuAlpha")) return false;
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      });
      const brandIsolation = brandNodes.map((node) => {
        const style = getComputedStyle(node);
        const unicodeBidi = style.unicodeBidi || "";
        const dir = node.getAttribute("dir") || style.direction || "";
        const translated = node.getAttribute("translate");
        return {
          text: compact(node.textContent, 120),
          translate: translated,
          dir,
          unicodeBidi,
          isolated: translated === "no" && (dir === "ltr" || unicodeBidi.includes("isolate") || unicodeBidi.includes("embed") || unicodeBidi.includes("plaintext")),
        };
      });
      const footerBuildText = document.querySelector("footer")?.textContent?.match(/3\.0-[0-9T]+/)?.[0] ?? "";
      const compareTexts = {
        title: text(".v3-compare-verdict .section-lead h2"),
        dts: texts(".v3-compare-verdict dt"),
        links: texts(".v3-compare-verdict a, .v3-similar-grid a"),
      };
      const sourceDisclosure = document.querySelector(".v3-activity-panel .research-references");
      if (routeId === "detail" && sourceDisclosure) sourceDisclosure.open = true;
      const registrationNotes = document.querySelector(".v3-registration-notes");
      if (routeId === "detail" && registrationNotes) registrationNotes.open = true;
      const visibleTextFor = (selector) => Array.from(document.querySelectorAll(selector)).filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      }).map((node) => compact(node.textContent));
      const detailTexts = {
        briefTitle: text(".v3-decision-brief h2"),
        decisionLabels: visibleTextFor(".v3-profile-decision .venue-decision h3, .v3-profile-decision .v3-registration-notes__body > article > span"),
        sourceLabels: visibleTextFor(".v3-activity-panel .v3-source-list__meta span"),
        sourceSummary: text(".v3-activity-panel .research-references summary"),
        links: texts("a"),
      };
      const checks = [];
      if (routeId === "compare") {
        checks.push({ name: "compareVerdictTitle", pass: expectedForLocale.compareVerdictTitle.includes(compareTexts.title), actual: compareTexts.title, expected: expectedForLocale.compareVerdictTitle });
        checks.push({ name: "verdictBestFor", pass: contains(compareTexts.dts, expectedForLocale.verdictBestFor), actual: compareTexts.dts, expected: expectedForLocale.verdictBestFor });
        checks.push({ name: "verdictRegistrationFit", pass: contains(compareTexts.dts, expectedForLocale.verdictRegistrationFit), actual: compareTexts.dts, expected: expectedForLocale.verdictRegistrationFit });
        checks.push({ name: "verdictAlternative", pass: contains(compareTexts.dts, expectedForLocale.verdictAlternative), actual: compareTexts.dts, expected: expectedForLocale.verdictAlternative });
        checks.push({ name: "compareOpenDetailLink", pass: contains(compareTexts.links, expectedForLocale.openDetail), actual: compareTexts.links, expected: expectedForLocale.openDetail });
      } else {
        checks.push({ name: "detailRegistrationPrepCta", pass: expectedForLocale.registrationPrepCta.some((candidate) => detailTexts.briefTitle.includes(candidate) || visibleText.includes(candidate)), actual: detailTexts.briefTitle, expected: expectedForLocale.registrationPrepCta });
        checks.push({ name: "detailViewCompareLink", pass: contains(detailTexts.links, expectedForLocale.viewCompare), actual: detailTexts.links, expected: expectedForLocale.viewCompare });
        checks.push({ name: "detailBestFitLabel", pass: contains(detailTexts.decisionLabels, expectedForLocale.detailBestFit), actual: detailTexts.decisionLabels, expected: expectedForLocale.detailBestFit });
        checks.push({ name: "detailWhyChooseLabel", pass: contains(detailTexts.decisionLabels, expectedForLocale.detailWhyChoose), actual: detailTexts.decisionLabels, expected: expectedForLocale.detailWhyChoose });
        checks.push({ name: "detailNotForLabel", pass: contains(detailTexts.decisionLabels, expectedForLocale.detailNotFor), actual: detailTexts.decisionLabels, expected: expectedForLocale.detailNotFor });
        checks.push({ name: "detailPreKycFundingLabel", pass: contains(detailTexts.decisionLabels, expectedForLocale.detailPreKycFunding), actual: detailTexts.decisionLabels, expected: expectedForLocale.detailPreKycFunding });
        checks.push({ name: "detailSourceHostLabelAfterExpand", pass: contains(detailTexts.sourceLabels, expectedForLocale.sourceHost), actual: { sourceSummary: detailTexts.sourceSummary, sourceLabels: detailTexts.sourceLabels }, expected: expectedForLocale.sourceHost });
      }
      if (locale !== "en") {
        const fallbackHits = englishFallbackPhrases.filter((phrase) => visibleText.includes(phrase));
        checks.push({ name: "noEnglishUiFallback", pass: fallbackHits.length === 0, actual: fallbackHits, expected: [] });
      }
      checks.push({ name: "brandPreserved", pass: visibleText.includes("NexuAlpha"), actual: visibleText.includes("NexuAlpha"), expected: true });
      checks.push({ name: "brandBidiIsolatedWhenMarked", pass: brandIsolation.length > 0 && brandIsolation.every((node) => node.isolated), actual: brandIsolation, expected: "all marked brand nodes use translate=no and ltr/isolate/embed/plaintext bidi isolation" });
      checks.push({ name: "noHorizontalOverflow", pass: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, actual: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }, expected: "scrollWidth <= clientWidth + 1" });
      if (expectedBuildId) {
        const domBuild = document.documentElement.dataset.build || document.body.dataset.build || "";
        checks.push({ name: "footerBuildMatches", pass: footerBuildText === expectedBuildId || domBuild === expectedBuildId, actual: { footerBuildText, domBuild }, expected: expectedBuildId });
      }
      return {
        locale,
        routeId,
        pathname: location.pathname,
        search: location.search,
        width: innerWidth,
        height: innerHeight,
        direction: document.documentElement.dir || document.body.dir || getComputedStyle(document.documentElement).direction,
        checks,
      };
    }, { routeId: route.id, locale, expectedForLocale: expected[locale], englishFallbackPhrases, expectedBuildId: args.expectedBuildId });
    report.samples.push(result);
    const failures = result.checks.filter((check) => !check.pass);
    assert.deepEqual(failures, [], `${route.id} ${locale} ${viewport.id} failed checks: ${JSON.stringify(failures, null, 2)}`);
  }

  for (const locale of activeLocales) {
    for (const route of activeRoutes) {
      for (const viewport of activeViewports) {
        await sampleRoute(route, locale, viewport);
      }
    }
  }

  async function languageSwitch(route, fromLocale, toLocale) {
    await gotoRoute(route, fromLocale, viewports[2]);
    const before = await page.evaluate((knownLocales) => {
      const stripLocalePrefix = (pathname) => {
        const parts = pathname.split("/").filter(Boolean);
        if (parts.length && knownLocales.includes(parts[0].toLowerCase())) return `/${parts.slice(1).join("/")}` || "/";
        return pathname;
      };
      return { pathname: location.pathname, routePath: stripLocalePrefix(location.pathname) };
    }, locales.map((locale) => locale.toLowerCase()));
    await page.select("select[aria-label]", toLocale);
    await page.waitForFunction((targetLocale, knownLocales) => {
      const target = targetLocale.toLowerCase();
      const pathLocale = location.pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
      return new URLSearchParams(location.search).get("locale") === targetLocale
        || document.documentElement.lang?.toLowerCase() === target
        || (knownLocales.includes(pathLocale) && pathLocale === target);
    }, { timeout: args.timeoutMs }, toLocale, localePathPrefixes);
    await page.waitForSelector(route.ready, { timeout: args.timeoutMs });
    const switched = await page.evaluate(({ routeId, expectedForLocale, knownLocales }) => {
      const stripLocalePrefix = (pathname) => {
        const parts = pathname.split("/").filter(Boolean);
        if (parts.length && knownLocales.includes(parts[0].toLowerCase())) return `/${parts.slice(1).join("/")}` || "/";
        return pathname;
      };
      const visibleText = document.querySelector(routeId === "compare" ? ".v3-compare-page" : ".v3-detail-page, main")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const pathLocale = location.pathname.split("/").filter(Boolean)[0] ?? "";
      return {
        pathname: location.pathname,
        routePath: stripLocalePrefix(location.pathname),
        searchLocale: new URLSearchParams(location.search).get("locale"),
        documentLang: document.documentElement.lang || "",
        pathLocale,
        hasExpectedText: routeId === "compare"
          ? visibleText.includes(expectedForLocale.compareVerdictTitle[0])
          : visibleText.includes(expectedForLocale.detailBestFit[0]) && visibleText.includes(expectedForLocale.detailPreKycFunding[0]),
      };
    }, { routeId: route.id, expectedForLocale: expected[toLocale], knownLocales: localePathPrefixes });
    report.languageSwitches.push({ route: route.id, fromLocale, toLocale, beforePath: before.pathname, beforeRoutePath: before.routePath, ...switched });
    assert.equal(switched.routePath, before.routePath, `${route.id} language switch must preserve route path`);
    assert.ok(switched.searchLocale === toLocale || switched.documentLang.toLowerCase() === toLocale.toLowerCase() || switched.pathLocale.toLowerCase() === toLocale.toLowerCase(), `${route.id} language switch must expose target locale`);
    assert.equal(switched.hasExpectedText, true, `${route.id} language switch must update visible localized text`);
  }

  for (const route of activeRoutes) {
    for (const toLocale of activeLocales.filter((locale) => locale !== "en")) {
      await languageSwitch(route, "en", toLocale);
    }
  }

  async function sourceFactCheck(locale) {
    const viewport = viewports[2];
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    await page.goto(withLocale(args.baseUrl, "/compare/kucoin-vs-okx", locale), { waitUntil: "networkidle0", timeout: args.timeoutMs });
    await page.waitForSelector(".research-comparison .research-table", { timeout: args.timeoutMs });
    await settlePageForVisualCheck(page);
    await page.evaluate(() => {
      const table = document.querySelector(".research-comparison");
      table?.scrollIntoView({ block: "center", inline: "nearest" });
    });
    const target = sourceFactTargets[locale];
    const check = await page.evaluate((target) => {
      const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
      const table = document.querySelector(".research-comparison .research-table");
      const text = normalize(table?.textContent ?? "");
      const rows = Array.from(document.querySelectorAll(".research-comparison .research-table tbody tr")).map((row) => ({
        label: normalize(row.querySelector("th")?.textContent),
        text: normalize(row.textContent),
      }));
      const executionRow = rows.find((row) => row.label.includes(target.executionAxis));
      const accountRow = rows.find((row) => row.label.includes(target.accountAxis));
      return {
        hasTable: Boolean(table),
        text,
        rows,
        checks: [
          { name: "kucoinOkxNamesVisible", pass: text.includes("KuCoin") && text.includes("OKX"), actual: text, expected: "KuCoin and OKX" },
          { name: "executionAxisVisible", pass: Boolean(executionRow), actual: rows.map((row) => row.label), expected: target.executionAxis },
          { name: "accountAxisVisible", pass: Boolean(accountRow), actual: rows.map((row) => row.label), expected: target.accountAxis },
          { name: "kucoinExecutionFactVisible", pass: Boolean(executionRow?.text.includes(target.kucoinExecutionFact)), actual: executionRow?.text ?? "", expected: target.kucoinExecutionFact },
          { name: "okxAccountFactVisible", pass: Boolean(accountRow?.text.includes(target.okxAccountFact)), actual: accountRow?.text ?? "", expected: target.okxAccountFact },
        ],
      };
    }, target);
    const file = join(runDir, `source-facts-kucoin-vs-okx-${locale}-${viewport.id}.png`);
    await page.screenshot({ path: file, fullPage: false });
    report.screenshots.push(file);
    report.sourceFactChecks.push({ locale, route: "/compare/kucoin-vs-okx", screenshot: file, ...check });
    const failures = check.checks.filter((item) => !item.pass);
    assert.deepEqual(failures, [], `kucoin-vs-okx ${locale} source fact checks failed: ${JSON.stringify(failures, null, 2)}`);
  }

  for (const locale of activeSourceFactLocales) {
    await sourceFactCheck(locale);
  }

  assert.deepEqual(consoleErrors, [], "browser console must have no errors");
  assert.deepEqual(pageErrors, [], "browser page must have no errors");
  assert.deepEqual(requestFailures.filter((item) => !item.url.includes("/favicon")), [], "browser network must have no request failures");
  await writeFile(join(runDir, "product-copy-browser-summary.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.status = "FAIL";
  report.error = error?.stack || String(error);
  await writeFile(join(runDir, "product-copy-browser-summary.json"), JSON.stringify(report, null, 2)).catch(() => {});
  throw error;
} finally {
  await browser.close().catch(() => {});
  await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}
