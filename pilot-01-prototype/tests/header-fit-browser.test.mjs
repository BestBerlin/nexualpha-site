// Phone header fit (lead 2026-10-15): at 344 / 360 / 390 px no visible header control may extend past the viewport.
// Before this, the campaigns chip pushed the Telegram icon and burger 9–20 px off-screen in en, pt-BR, ja and tr at 344 px.
// Real Chrome over the built SSR site (server/local-sites-preview.mjs on dist). Skips when there is no build.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const hasBuild = existsSync(join(projectRoot, "dist", "client", "prerender-manifest.json"));
const chromePath = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find((candidate) => existsSync(candidate));
const sharedPackage = "/Users/bestberlin/.codex/shared-tools/web-quality/package.json";
const skip = !hasBuild ? "no dist build" : !chromePath ? "no Chrome" : !existsSync(sharedPackage) ? "no puppeteer-core" : false;

const PAGES = { en: "/", "zh-Hans": "/zh-hans", ja: "/ja", ar: "/ar", tr: "/tr" };
const WIDTHS = [344, 360, 390];
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

let child, browser, base;
const freePort = () => new Promise((done, fail) => { const srv = createServer(); srv.once("error", fail); srv.listen(0, "127.0.0.1", () => { const { port } = srv.address(); srv.close(() => done(port)); }); });

before(async () => {
  if (skip) return;
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ["server/local-sites-preview.mjs"], { cwd: projectRoot, env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" }, stdio: "ignore" });
  for (let i = 0; i < 80; i += 1) {
    const ok = await fetch(`${base}/zh-hans`).then((r) => r.ok).catch(() => false);
    if (ok) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  const puppeteer = createRequire(sharedPackage)("puppeteer-core");
  browser = await puppeteer.launch({ executablePath: chromePath, headless: "new" });
});

after(async () => {
  await browser?.close();
  child?.kill();
});

test("phone header controls stay inside the viewport at 344/360/390 px (en, zh-Hans, ja, ar, tr)", { skip }, async () => {
  const page = await browser.newPage();
  await page.setUserAgent(IPHONE);
  const problems = [];
  for (const width of WIDTHS) {
    await page.setViewport({ width, height: 800, isMobile: true, hasTouch: true });
    for (const [locale, path] of Object.entries(PAGES)) {
      await page.goto(`${base}${path}`, { waitUntil: "load" });
      const result = await page.evaluate(() => {
        const header = document.querySelector(".nx-header") || document.querySelector("header");
        const visible = [...(header?.querySelectorAll("a, button") || [])].filter((el) => {
          if (el.closest(".nx-sheet, [hidden], .nx-nav ul")) return false;
          const style = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && box.width > 0;
        });
        const boxes = visible.map((el) => el.getBoundingClientRect());
        return {
          right: Math.max(...boxes.map((b) => b.right)),
          left: Math.min(...boxes.map((b) => b.left)),
          scroll: document.documentElement.scrollWidth,
          viewport: innerWidth,
          burger: Boolean(document.querySelector(".nx-burger")?.getBoundingClientRect().width),
        };
      });
      if (!result.burger) problems.push(`${locale} @${width}: burger not visible`);
      if (result.right > result.viewport + 0.5) problems.push(`${locale} @${width}: header control ends at ${Math.round(result.right)} > ${result.viewport}`);
      if (result.left < -0.5) problems.push(`${locale} @${width}: header control starts at ${Math.round(result.left)} < 0`);
      if (result.scroll > result.viewport) problems.push(`${locale} @${width}: page scrollWidth ${result.scroll} > ${result.viewport}`);
    }
  }
  await page.close();
  assert.deepEqual(problems, []);
});
