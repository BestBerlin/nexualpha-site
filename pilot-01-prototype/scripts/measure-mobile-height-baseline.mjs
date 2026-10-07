import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
const puppeteer = require("puppeteer-core");
const stableBrowserArgs = ["--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-networking"];

export const mobileHeightViewport = {
  name: "mobile-390",
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
};

export const mobileHeightRoutes = [
  { id: "jp-home", path: "/jp" },
  { id: "kr-home", path: "/kr" },
  { id: "tr-turkiye", path: "/tr/markets/turkiye" },
  { id: "mx-home", path: "/mx" },
  { id: "id-home", path: "/id" },
];

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const defaultArtifactDir = path.resolve(projectRoot, "../docs/evidence/four-week-growth-20260927/mobile-height-baseline-20260929");

function normalizeRouteUrl(baseUrl, routePath) {
  return new URL(routePath, baseUrl).href;
}

function markdownTable(rows) {
  const header = "| Route | Document height | Viewports | First CTA bottom | First CTA text | Repeated module candidates |";
  const divider = "| --- | ---: | ---: | ---: | --- | --- |";
  const body = rows.map((row) => {
    const firstCtaBottom = row.firstCta ? Math.round(row.firstCta.bottom) : null;
    const repeated = row.repeatedModuleGroups
      .slice(0, 3)
      .map((group) => `${group.key} x${group.count} (${group.totalHeight}px)`)
      .join("<br>") || "none";
    return `| ${row.route.id} | ${row.documentHeight}px | ${row.viewportHeights.toFixed(2)} | ${firstCtaBottom ?? "missing"} | ${(row.firstCta?.text || "").replaceAll("|", "/")} | ${repeated.replaceAll("|", "/")} |`;
  });
  return [header, divider, ...body].join("\n");
}

async function latestExecutableUnder(root, suffix) {
  const matches = [];
  async function visit(directory) {
    let entries = [];
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (target.endsWith(suffix)) matches.push(target);
    }
  }
  await visit(root);
  return matches.sort().at(-1) ?? null;
}

async function browserCandidates(chromePath) {
  const candidates = [
    chromePath && { label: "explicit", executablePath: chromePath, args: stableBrowserArgs },
    process.env.CHROME_PATH && { label: "CHROME_PATH", executablePath: process.env.CHROME_PATH, args: stableBrowserArgs },
    { label: "system-chrome", executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: stableBrowserArgs },
    { label: "system-chromium", executablePath: "/Applications/Chromium.app/Contents/MacOS/Chromium", args: stableBrowserArgs },
  ].filter(Boolean);

  const playwrightChrome = await latestExecutableUnder(
    path.join(os.homedir(), "Library/Caches/ms-playwright"),
    "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  );
  if (playwrightChrome) candidates.push({ label: "playwright-chrome-for-testing", executablePath: playwrightChrome, args: stableBrowserArgs });

  const cachedHeadlessShell = await latestExecutableUnder(
    path.join(os.homedir(), ".cache/puppeteer/chrome-headless-shell"),
    "chrome-headless-shell",
  );
  if (cachedHeadlessShell) candidates.push({ label: "puppeteer-headless-shell", executablePath: cachedHeadlessShell, args: [...stableBrowserArgs, "--single-process"] });

  return candidates.filter((candidate, index, all) => (
    candidate.executablePath
    && existsSync(candidate.executablePath)
    && all.findIndex((other) => other.executablePath === candidate.executablePath && other.args.join(" ") === candidate.args.join(" ")) === index
  ));
}

async function launchBrowser(chromePath) {
  const attempts = [];
  for (const candidate of await browserCandidates(chromePath)) {
    const userDataDir = await mkdtemp(path.join(os.tmpdir(), "nexualpha-mobile-height-"));
    try {
      const browser = await puppeteer.launch({
        executablePath: candidate.executablePath,
        headless: "new",
        userDataDir,
        args: candidate.args,
      });
      return { browser, userDataDir, launch: { label: candidate.label, executablePath: candidate.executablePath, attempts } };
    } catch (error) {
      await rm(userDataDir, { recursive: true, force: true });
      attempts.push({ label: candidate.label, executablePath: candidate.executablePath, message: error.message });
    }
  }
  throw new Error(`Unable to launch Chrome for mobile height baseline: ${JSON.stringify(attempts, null, 2)}`);
}

export async function collectMobileHeightBaseline({ baseUrl, outDir = defaultArtifactDir, chromePath, timeoutMs = 45000 } = {}) {
  assert.ok(baseUrl, "baseUrl is required");
  await mkdir(outDir, { recursive: true });
  const { browser, userDataDir, launch } = await launchBrowser(chromePath);

  const results = [];
  try {
    const page = await browser.newPage();
    await page.setViewport(mobileHeightViewport);
    for (const route of mobileHeightRoutes) {
      const url = normalizeRouteUrl(baseUrl, route.path);
      const response = await page.goto(url, { waitUntil: "networkidle2", timeout: timeoutMs });
      await page.evaluate(() => document.fonts?.ready).catch(() => {});
      const metrics = await page.evaluate(() => {
        const round = (value) => Math.round(Number(value) || 0);
        const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();
        const visible = (element) => {
          if (!element) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0;
        };
        const doc = document.documentElement;
        const body = document.body;
        const documentHeight = Math.max(doc.scrollHeight, body?.scrollHeight || 0);
        const ctaSelector = [
          "a[data-cta-placement]",
          "button[data-cta-placement]",
          "a[data-growth-decision]",
          "button[data-growth-decision]",
          "a[href*='/compare/']",
          "a[href*='/exchanges/']",
          "a[href*='/ref/']",
          "a[href*='t.me/']",
        ].join(",");
        const ctas = Array.from(document.querySelectorAll(ctaSelector))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              text: cleanText(element.textContent).slice(0, 120),
              href: element.href || element.getAttribute("href") || "",
              placement: element.dataset.ctaPlacement || element.dataset.growthPlacement || "",
              decision: element.dataset.growthDecision || "",
              top: round(rect.top),
              bottom: round(rect.bottom),
              height: round(rect.height),
            };
          })
          .sort((a, b) => a.top - b.top);

        const moduleSelector = [
          "main > section",
          "main > article",
          "main > div",
          ".v3-section",
          ".regional-preview",
          ".yellow-pages",
          ".fee-terminal-section",
          ".tg-hub-section",
          ".decision-path-rail",
          ".topic-guide-section",
        ].join(",");
        const modules = Array.from(document.querySelectorAll(moduleSelector))
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            const heading = cleanText(element.querySelector("h1,h2,h3,summary")?.textContent).slice(0, 96);
            const classKey = cleanText(element.className).split(" ").filter(Boolean).slice(0, 3).join(".");
            const key = heading || classKey || element.id || element.tagName.toLowerCase();
            return {
              index,
              tag: element.tagName.toLowerCase(),
              id: element.id || "",
              classKey,
              heading,
              key,
              top: round(rect.top + scrollY),
              bottom: round(rect.bottom + scrollY),
              height: round(rect.height),
              textLength: cleanText(element.textContent).length,
            };
          })
          .filter((item) => item.height >= 80)
          .sort((a, b) => a.top - b.top);

        const repeatedMap = new Map();
        for (const item of modules) {
          const repeatKey = item.heading || item.classKey;
          if (!repeatKey) continue;
          const group = repeatedMap.get(repeatKey) || { key: repeatKey, count: 0, totalHeight: 0, modules: [] };
          group.count += 1;
          group.totalHeight += item.height;
          group.modules.push({ index: item.index, height: item.height, top: item.top, heading: item.heading, classKey: item.classKey });
          repeatedMap.set(repeatKey, group);
        }
        const repeatedModuleGroups = Array.from(repeatedMap.values())
          .filter((group) => group.count >= 2)
          .sort((a, b) => b.totalHeight - a.totalHeight)
          .map((group) => ({ ...group, totalHeight: round(group.totalHeight) }));

        return {
          title: document.title,
          h1: cleanText(document.querySelector("h1")?.textContent),
          documentHeight: round(documentHeight),
          scrollWidth: round(doc.scrollWidth),
          clientWidth: round(doc.clientWidth),
          horizontalOverflow: Math.max(0, round(doc.scrollWidth - innerWidth)),
          viewportHeights: documentHeight / innerHeight,
          rootTextLength: cleanText(document.querySelector("#root")?.textContent).length,
          firstCta: ctas.find((cta) => cta.bottom <= innerHeight) || ctas[0] || null,
          ctas: ctas.slice(0, 12),
          modules: modules.slice(0, 24),
          repeatedModuleGroups: repeatedModuleGroups.slice(0, 12),
        };
      });
      results.push({
        route,
        url,
        finalUrl: page.url(),
        status: response?.status() || null,
        viewport: mobileHeightViewport,
        ...metrics,
      });
    }
  } finally {
    await browser.close();
    await rm(userDataDir, { recursive: true, force: true });
  }

  const summary = {
    checkedAt: new Date().toISOString(),
    baseUrl,
    launch,
    viewport: mobileHeightViewport,
    routes: mobileHeightRoutes,
    results,
    targets: {
      heightReductionGoal: "next iteration should reduce each route documentHeight by at least 20% or justify SSR-preserving exceptions",
      firstCtaGoal: "first actionable CTA bottom should stay within the first viewport where route intent allows it",
      ssrGoal: "rootTextLength should remain non-zero and route content should stay indexable after compression",
    },
  };
  await writeFile(path.join(outDir, "mobile-height-baseline.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(outDir, "mobile-height-baseline.md"), [
    "# Mobile Height Baseline",
    "",
    `Base URL: ${baseUrl}`,
    `Viewport: ${mobileHeightViewport.width}x${mobileHeightViewport.height}`,
    "",
    markdownTable(results),
    "",
    "Use this as the before snapshot for the P1 mobile-height reduction lane. The pass target is at least 20% lower documentHeight per route while keeping SSR text and first-screen decision access.",
    "",
  ].join("\n"));
  return summary;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) {
  const baseUrl = process.env.MOBILE_HEIGHT_BASE_URL || process.argv[2] || "http://127.0.0.1:4202";
  const outDir = path.resolve(process.env.MOBILE_HEIGHT_OUT || process.argv[3] || defaultArtifactDir);
  collectMobileHeightBaseline({ baseUrl, outDir })
    .then((summary) => {
      const compact = summary.results.map((row) => ({
        route: row.route.id,
        status: row.status,
        documentHeight: row.documentHeight,
        viewportHeights: Number(row.viewportHeights.toFixed(2)),
        firstCtaBottom: row.firstCta?.bottom ?? null,
        repeatedGroups: row.repeatedModuleGroups.length,
        horizontalOverflow: row.horizontalOverflow,
        rootTextLength: row.rootTextLength,
      }));
      console.log(JSON.stringify({ outDir, checked: summary.results.length, compact }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
