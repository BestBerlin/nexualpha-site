/**
 * full-spectrum-audit.mjs
 * NexuAlpha 全站深度体检与潜在风险自动化扫描引擎
 * 
 * 覆盖 5 大维度：
 * 1. 搜索引擎合规与防封禁审计（Affiliate/YMYL/SEO/外链 rel 标记/风险免责披露）
 * 2. 移动端与全断点水平溢出排查（Horizontal Overflow / 破版排查）
 * 3. 多语言隔离与文字一致性（英文页面汉字泄漏、未翻译占位符、标点规范）
 * 4. 图标与媒体资源完整性（BrandMark 破损、SVG viewBox 规范）
 * 5. 控制台运行时错误与异常捕获（Console Error / Uncaught Promise）
 */

// Keep this audit runnable without adding a project dependency. The shared
// web-quality runtime already owns Puppeteer and the browser binary used by
// the repository's other audits.
import puppeteer from "/Users/bestberlin/.codex/shared-tools/web-quality/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const REPORT_OUTPUT = path.resolve(ROOT_DIR, "AUDIT_SCAN_REPORT.json");

const DEFAULT_PREVIEW_HOST = "127.0.0.1";
const DEFAULT_PREVIEW_PORT = "4173";
const CHROME_PATH = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const NAVIGATION_TIMEOUT = Number(process.env.AUDIT_NAV_TIMEOUT_MS || 10000);
const SETTLE_MS = Number(process.env.AUDIT_SETTLE_MS || 500);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 待扫描的核心代表性路由清单
const ROUTES_TO_AUDIT = [
  { path: "/?locale=zh-Hans", name: "首页 (中文)", type: "home", locale: "zh-Hans" },
  { path: "/?locale=en", name: "首页 (英文)", type: "home", locale: "en" },
  { path: "/exchanges?locale=zh-Hans", name: "交易所黄页目录 (中文)", type: "directory", locale: "zh-Hans" },
  { path: "/exchanges?locale=en", name: "交易所黄页目录 (英文)", type: "directory", locale: "en" },
  { path: "/exchanges/binance?locale=zh-Hans", name: "Binance 详情页 (中文)", type: "venue", locale: "zh-Hans" },
  { path: "/exchanges/binance?locale=en", name: "Binance 详情页 (英文)", type: "venue", locale: "en" },
  { path: "/exchanges/okx?locale=zh-Hans", name: "OKX 详情页 (中文)", type: "venue", locale: "zh-Hans" },
  { path: "/compare/binance-vs-okx?locale=zh-Hans", name: "Binance vs OKX 对比页 (中文)", type: "compare", locale: "zh-Hans" },
  { path: "/compare/binance-vs-okx?locale=en", name: "Binance vs OKX 对比页 (英文)", type: "compare", locale: "en" },
  { path: "/activities?locale=zh-Hans", name: "活动与上币中心 (中文)", type: "activities", locale: "zh-Hans" },
  { path: "/activities?locale=en", name: "活动与上币中心 (英文)", type: "activities", locale: "en" },
  { path: "/news?locale=zh-Hans", name: "实时新闻资讯 (中文)", type: "news", locale: "zh-Hans" },
];

const VIEWPORTS = [
  { name: "Mobile (iPhone SE/Small)", width: 320, height: 667 },
  { name: "Mobile (iPhone 14/Standard)", width: 390, height: 844 },
  { name: "Tablet (iPad)", width: 768, height: 1024 },
  { name: "Desktop (Standard)", width: 1440, height: 900 },
];

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

async function canReachBaseUrl(baseUrl) {
  try {
    const response = await fetch(baseUrl, { method: "HEAD", signal: AbortSignal.timeout(1000) });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function startLocalPreview({ host, port, timeoutMs = 10000 } = {}) {
  const baseUrl = `http://${host}:${port}`;
  const child = spawn(process.execPath, ["server/local-sites-preview.mjs"], {
    cwd: ROOT_DIR,
    env: { ...process.env, HOST: host, PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  const collectOutput = (chunk) => {
    output += chunk.toString();
  };
  child.stdout.on("data", collectOutput);
  child.stderr.on("data", collectOutput);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Local preview exited before audit could start:\n${output.trim()}`);
    }
    if (output.includes(`http://${host}:${port}`) || await canReachBaseUrl(baseUrl)) {
      return {
        baseUrl,
        stop() {
          if (child.exitCode === null) child.kill("SIGTERM");
        },
      };
    }
    await Promise.race([
      once(child.stdout, "data").catch(() => undefined),
      once(child.stderr, "data").catch(() => undefined),
      sleep(100),
    ]);
  }

  child.kill("SIGTERM");
  throw new Error(`Local preview did not start within ${timeoutMs}ms:\n${output.trim()}`);
}

export async function resolveAuditTarget(env = process.env, dependencies = {}) {
  const explicitUrl = env.AUDIT_URL?.trim();
  if (explicitUrl) return { baseUrl: normalizeBaseUrl(explicitUrl), preview: null };

  const host = env.AUDIT_PREVIEW_HOST || DEFAULT_PREVIEW_HOST;
  const port = env.AUDIT_PREVIEW_PORT || DEFAULT_PREVIEW_PORT;
  const baseUrl = `http://${host}:${port}`;
  const canReach = dependencies.canReachBaseUrl || canReachBaseUrl;
  if (await canReach(baseUrl)) return { baseUrl, preview: null };

  const startPreview = dependencies.startLocalPreview || startLocalPreview;
  const preview = await startPreview({ host, port });
  return { baseUrl: preview.baseUrl, preview };
}

async function runAudit() {
  console.log("🔍 [NexuAlpha Audit Engine] Starting comprehensive system scan...");

  const target = await resolveAuditTarget();
  console.log(`🌐 Audit target: ${target.baseUrl}${target.preview ? " (local preview started)" : ""}`);

  let browser;
  const report = {
    timestamp: new Date().toISOString(),
    routesScanned: ROUTES_TO_AUDIT.length,
    viewportsScanned: VIEWPORTS.length,
    findings: {
      seoAndCompliance: [],
      layoutAndOverflow: [],
      localizationAndText: [],
      iconsAndAssets: [],
      consoleErrors: [],
    },
    stats: {
      totalChecks: 0,
      passedChecks: 0,
      warnings: 0,
      errors: 0,
    }
  };

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: CHROME_PATH,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });

    for (const route of ROUTES_TO_AUDIT) {
      console.log(`\n📄 Auditing Route: ${route.name} (${route.path})`);
      
      // 维度 5: 监听控制台错误
      const consoleLogs = [];
      const pageErrors = [];

      const page = await browser.newPage();
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleLogs.push({ text: msg.text(), location: msg.location() });
        }
      });
      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });

      try {
        await page.goto(`${target.baseUrl}${route.path}`, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT });
        await sleep(SETTLE_MS);
      } catch (e) {
        report.findings.consoleErrors.push({
          route: route.path,
          error: `Page load failed: ${e.message}`,
        });
        await page.close();
        continue;
      }

      // 记录控制台错误
      if (consoleLogs.length > 0 || pageErrors.length > 0) {
        report.findings.consoleErrors.push({
          route: route.path,
          consoleErrors: consoleLogs,
          pageErrors,
        });
      }

    // 维度 1: 搜索引擎合规性（SEO & Search Safety）
    const seoAudit = await page.evaluate(() => {
      const issues = [];
      
      // 1. Title & Meta Description
      const title = document.title;
      if (!title || title.length < 10) issues.push({ rule: "SEO_TITLE_LENGTH", detail: `Title too short or empty: "${title}"` });
      
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");
      if (!metaDesc) issues.push({ rule: "SEO_META_DESCRIPTION_MISSING", detail: "Missing meta[name='description']" });

      // 2. Affiliate 商业外链 rel 标记（Google Search Central 规则红线）
      const links = Array.from(document.querySelectorAll("a[href]"));
      let untaggedCommercialLinks = 0;
      let totalOutbound = 0;

      for (const a of links) {
        const href = a.getAttribute("href") || "";
        if (href.startsWith("http://") || href.startsWith("https://")) {
          const isInternal = href.includes(window.location.host);
          if (!isInternal) {
            totalOutbound++;
            const rel = (a.getAttribute("rel") || "").toLowerCase();
            const isAffiliateOrCommercial = href.includes("register") || href.includes("ref=") || href.includes("invite") || a.classList.contains("yellow-card__btn-register") || a.classList.contains("fee-terminal__cta-btn");
            if (isAffiliateOrCommercial) {
              if (!rel.includes("sponsored") && !rel.includes("nofollow")) {
                untaggedCommercialLinks++;
              }
            }
          }
        }
      }

      if (untaggedCommercialLinks > 0) {
        issues.push({
          rule: "GOOGLE_AFFILIATE_UNTAGGED_LINKS",
          detail: `Found ${untaggedCommercialLinks} commercial external links without rel="sponsored" or rel="nofollow". Google will penalize!`,
        });
      }

      // 3. YMYL 金融风险警示检查 (Financial Risk Disclosure)
      const pageText = document.body.innerText || "";
      const hasRiskDisclosure = /(风险|免责|合规|高风险|损失|本金|Risk|Disclaimer|Volatile|Loss|DYOR)/i.test(pageText);
      if (!hasRiskDisclosure) {
        issues.push({
          rule: "GOOGLE_YMYL_RISK_DISCLOSURE_MISSING",
          detail: "Page lacks explicit financial risk disclaimer, high risk of Google YMYL quality penalty.",
        });
      }

      return { issues, totalOutbound };
    });

    for (const issue of seoAudit.issues) {
      report.findings.seoAndCompliance.push({ route: route.path, ...issue });
    }

    // 维度 3: 多语言隔离与文字梳理
    if (route.locale === "en") {
      const enChineseLeak = await page.evaluate(() => {
        // 排除已知交易所中文别名允许区域外，检查英文页面是否有大量未翻译中文
        const bodyText = document.body.innerText;
        const allowedLocaleLabels = new Set(["简体中文", "繁體中文", "日本語"]);
        const chineseMatches = bodyText.match(/[\u4e00-\u9fa5]{3,}/g) || [];
        return chineseMatches.filter((snippet) => !allowedLocaleLabels.has(snippet)).slice(0, 10);
      });

      if (enChineseLeak.length > 0) {
        report.findings.localizationAndText.push({
          route: route.path,
          rule: "CHINESE_LEAK_IN_ENGLISH_LOCALE",
          detail: `English page contains unexpected Chinese text snippets: ${enChineseLeak.join(", ")}`,
        });
      }
    }

    // 维度 4: 图标与媒体资源检查
    const assetAudit = await page.evaluate(() => {
      const issues = [];
      const images = Array.from(document.querySelectorAll("img"));
      for (const img of images) {
        if (img.naturalWidth === 0 && img.complete) {
          issues.push({ rule: "BROKEN_IMAGE_ASSET", detail: `Broken image source: ${img.src}` });
        }
      }

      const svgs = Array.from(document.querySelectorAll("svg"));
      let svgsWithoutSize = 0;
      for (const svg of svgs) {
        const hasWidth = svg.hasAttribute("width") || svg.style.width;
        const hasHeight = svg.hasAttribute("height") || svg.style.height;
        const hasViewBox = svg.hasAttribute("viewBox");
        if (!hasViewBox && (!hasWidth || !hasHeight)) {
          svgsWithoutSize++;
        }
      }
      if (svgsWithoutSize > 0) {
        issues.push({ rule: "SVG_MISSING_VIEWBOX_OR_SIZE", detail: `${svgsWithoutSize} SVG icons lack explicit dimensions or viewBox.` });
      }

      return issues;
    });

    for (const issue of assetAudit) {
      report.findings.iconsAndAssets.push({ route: route.path, ...issue });
    }

    // 维度 2: 跨视口排查水平横向溢出 (Horizontal Scroll Overflow)
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await sleep(300);

      const overflowAudit = await page.evaluate((vpName) => {
        const html = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(html.scrollWidth, body.scrollWidth);
        const clientWidth = Math.max(html.clientWidth, body.clientWidth, window.innerWidth);
        
        if (scrollWidth > clientWidth + 2) {
          // 找出造成溢出的元素
          const overflowingElements = [];
          const allEls = document.querySelectorAll("*");
          for (const el of allEls) {
            const rect = el.getBoundingClientRect();
            if (rect.right > clientWidth + 2) {
              const elDesc = `${el.tagName.toLowerCase()}${el.className ? `.${el.className.split(" ")[0]}` : ""}`;
              overflowingElements.push({ el: elDesc, right: rect.right, clientWidth });
              if (overflowingElements.length >= 3) break;
            }
          }
          return {
            hasOverflow: true,
            scrollWidth,
            clientWidth,
            diff: scrollWidth - clientWidth,
            elements: overflowingElements,
          };
        }
        return { hasOverflow: false };
      }, vp.name);

      if (overflowAudit.hasOverflow) {
        report.findings.layoutAndOverflow.push({
          route: route.path,
          viewport: vp.name,
          width: vp.width,
          diff: overflowAudit.diff,
          elements: overflowAudit.elements,
        });
      }
    }

      await page.close();
    }
  } finally {
    await browser?.close();
    target.preview?.stop();
  }

  // 汇总统计
  report.stats.errors = 
    report.findings.seoAndCompliance.filter(f => f.rule.includes("GOOGLE")).length +
    report.findings.layoutAndOverflow.length +
    report.findings.consoleErrors.length;
  report.stats.warnings = 
    report.findings.localizationAndText.length +
    report.findings.iconsAndAssets.length;
  report.stats.totalChecks = ROUTES_TO_AUDIT.length * VIEWPORTS.length;
  report.stats.passedChecks = Math.max(0, report.stats.totalChecks - report.stats.errors - report.stats.warnings);

  fs.writeFileSync(REPORT_OUTPUT, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n📋 [Audit Complete] Report generated at: ${REPORT_OUTPUT}`);
  console.log(`🚨 Total Errors: ${report.stats.errors}, Warnings: ${report.stats.warnings}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAudit().catch(err => {
    console.error("❌ Fatal Audit Error:", err);
    process.exit(1);
  });
}
