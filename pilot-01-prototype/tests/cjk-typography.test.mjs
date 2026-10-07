import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

const cjkCss = await readFile(new URL("../src/styles/v3-layout-stability.css", import.meta.url), "utf8");
const legacyHeroCss = await Promise.all([
  "../src/styles/v2.css",
  "../src/styles/v2-refinement.css",
  "../src/styles/v2-interactive-refresh.css",
  "../src/styles/release-visual-gates.css",
].map(async (path) => [path, await readFile(new URL(path, import.meta.url), "utf8")]));
const design = await readFile(new URL("../DESIGN.md", import.meta.url), "utf8");
const previewOrigin = process.env.CJK_BASE_URL || "http://localhost:4173";
const runBrowserAssertions = process.env.CJK_BROWSER === "1";
const microcopySelectors = [
  ".lean-hero__badge span:not(.lean-hero__badge-dot)",
  ".lean-hero__subtitle",
  ".lean-hero__pill",
  ".lean-hero__proof-action",
  ".growth-decision-panel__header > span",
  ".growth-decision-panel__header p",
  ".growth-platform-search > span",
  ".growth-platform-option small",
  ".growth-selected-route dt",
  ".growth-selected-route dd",
  ".growth-compare-shortcuts > summary",
  ".yellow-pages__lead",
  ".yellow-card__fit",
  ".venue-card__facts span",
  ".venue-card__decision > span",
  ".venue-card__decision > small",
  ".v3-decision-brief > small",
  ".v3-compare-verdict__card dt",
  ".v3-deep-compare__head > span",
  ".v3-deep-compare__row > b",
  ".v3-similar-grid a small",
  ".registration-card__disclosure",
  ".v3-source-list__meta p",
  ".v3-source-list__meta span",
  ".activity-center-v3__source-grid dt",
  ".activity-center-v3__head > div > span",
  ".activity-center-v3__gate li",
  ".activity-center-v3__gate > span",
  ".activity-center-v3__snapshot article p",
  ".activity-center-v3__filters button span",
  ".activity-card-v3 > p",
  ".activity-card-v3__conditions li",
  ".activity-center-v3__source-actions a",
  ".clean-footer__statement",
  ".clean-footer__disclaimer p",
];
const ctaRangeSelectors = [
  ".yellow-card__btn-detail",
  ".yellow-card__btn-register",
];

const px = (value) => Number.parseFloat(String(value).replace("px", ""));
const ratio = (style) => px(style.lineHeight) / px(style.fontSize);

test("active V3 CSS defines distinct Simplified and Traditional Chinese system stacks", () => {
  assert.match(cjkCss, /--v3-cjk-sc-font:[^;]*"PingFang SC"[^;]*"Microsoft YaHei"[^;]*"Noto Sans CJK SC"[^;]*"Pilot Noto SC"/);
  assert.match(cjkCss, /--v3-cjk-tc-font:[^;]*"PingFang TC"[^;]*"Microsoft JhengHei"[^;]*"Noto Sans CJK TC"[^;]*"Pilot Noto TC"/);
  assert.match(cjkCss, /html:lang\(zh-CN\)[\s\S]*font-family: var\(--v3-cjk-sc-font\)/);
  assert.match(cjkCss, /html:lang\(zh-TW\)[\s\S]*font-family: var\(--v3-cjk-tc-font\)/);
  assert.match(cjkCss, /html:lang\(zh-Hans\)/);
  assert.match(cjkCss, /html:lang\(zh-Hant\)/);
});

test("Chinese typography reduces heavy display weight and restores readable CJK rhythm", () => {
  assert.match(cjkCss, /font-weight: 600;/);
  assert.doesNotMatch(cjkCss, /html:lang\(zh-[^)]+\)[\s\S]{0,240}font-weight:\s*7\d\d/);
  assert.doesNotMatch(cjkCss, /platform-matcher__(?:intent|results|intro|result)\b/);
  assert.match(cjkCss, /platform-matcher__intents button > small/);
  assert.match(cjkCss, /platform-matcher__decision dd/);
  assert.match(cjkCss, /research-heading h2/);
  assert.match(cjkCss, /research-facts dd/);
  assert.match(cjkCss, /research-table/);
  assert.match(cjkCss, /home-decision-panel__intro p/);
  assert.match(cjkCss, /--v3-cjk-body-size: clamp\(1rem,[^;]+1\.125rem\);/);
  assert.match(cjkCss, /--v3-cjk-body-line: 1\.72;/);
  assert.match(cjkCss, /--v3-cjk-aux-size: clamp\(\.8125rem,[^;]+\.875rem\);/);
  assert.match(cjkCss, /line-break: strict;/);
  assert.match(cjkCss, /hanging-punctuation: allow-end;/);
  assert.match(cjkCss, /\.hero-cta-row > a,[\s\S]*flex: 0 0 auto;[\s\S]*min-block-size: 48px;/);
  assert.match(cjkCss, /@media \(min-width: 1100px\)[\s\S]*html:lang\(zh-Hans\) \.hero-copy h1[\s\S]*max-inline-size: min\(100%, 720px\);/);
  assert.doesNotMatch(cjkCss, /html:lang\(zh-Hans\) \.hero-copy h1[\s\S]{0,180}white-space:\s*nowrap/);
});

test("homepage hero h1 declarations have a single active CSS owner", () => {
  assert.match(cjkCss, /Homepage hero H1 is owned here/);
  assert.match(cjkCss, /@media \(max-width: 780px\)[\s\S]*\.hero-copy h1[\s\S]*font-size: clamp\(40px, 11vw, 48px\);/);
  for (const [path, css] of legacyHeroCss) {
    assert.doesNotMatch(css, /\.hero-copy h1\b/, `${path} must not define homepage hero h1`);
  }
});

test("CJK contract is documented without changing the Latin brand typography contract", () => {
  assert.match(design, /CJK typography contract/);
  assert.match(design, /Simplified Chinese/);
  assert.match(design, /Traditional Chinese/);
  assert.match(design, /Title weight is 600/);
  assert.match(design, /1100px\+/);
  assert.match(design, /one line without global nowrap/);
  assert.match(design, /mobile hero copy may wrap naturally without overflow/);
  assert.match(design, /brand Latin font remains on NexuAlpha/);
});

test("live CJK DOM typography and mobile CTA height match the active CSS selectors", { skip: runBrowserAssertions ? false : "set CJK_BROWSER=1 against a built preview to run DOM assertions" }, async () => {
  const previewAvailable = await fetch(previewOrigin, { signal: AbortSignal.timeout(1200) })
    .then((response) => response.ok)
    .catch(() => false);
  assert.equal(previewAvailable, true, "the selected CJK preview is running");
  if (process.env.CJK_EXPECT_BUILD_ID) {
    const versionResponse = await fetch(`${previewOrigin}/version.json`, { signal: AbortSignal.timeout(3000) });
    assert.equal(versionResponse.ok, true, "CJK preview exposes its build identity");
    assert.equal((await versionResponse.json()).buildId, process.env.CJK_EXPECT_BUILD_ID, "CJK checks target the frozen candidate build");
  }

  const require = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-first-run", "--no-default-browser-check", "--disable-extensions"],
  });

  async function collect(locale, route, width = 390, readingFontSize = null) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: width === 390 ? 844 : 1000, deviceScaleFactor: width === 390 ? 2 : 1, isMobile: width === 390 });
    await page.goto(`${previewOrigin}${route}${route.includes("?") ? "&" : "?"}locale=${locale}&analytics_test=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("main", { timeout: 10000 });
    await page.waitForSelector(".clean-footer", { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    if (readingFontSize) {
      await page.evaluate((size) => { document.documentElement.style.fontSize = `${size}px`; }, readingFontSize);
      await page.evaluate(() => document.fonts.ready);
    }
    await page.evaluate(async () => {
      const animations = document.getAnimations({ subtree: true }).filter((animation) => {
        const effect = animation.effect;
        const timing = effect?.getTiming?.();
        return timing && timing.iterations !== Infinity && animation.playState !== "finished";
      });
      await Promise.allSettled(animations.map((animation) => animation.finished));
    });
    const result = await page.evaluate(({ microcopySelectors, ctaRangeSelectors }) => {
      const boxFor = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height, left: rect.left, right: rect.right };
      };
      const styleFor = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          selector,
          text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          letterSpacing: cs.letterSpacing,
          blockSize: `${rect.height}px`,
          inlineSize: `${rect.width}px`,
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
          lineCount: Math.max(1, Math.round(
            rect.height /
              (Number.parseFloat(cs.lineHeight) || Number.parseFloat(cs.fontSize) * 1.2),
          )),
          inlineOverflow: el.scrollWidth > el.clientWidth + 1,
          visible: rect.width > 0 && rect.height > 0,
        };
      };
      const textRangeFor = (el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          },
        });
        const range = document.createRange();
        let started = false;
        let node;
        while ((node = walker.nextNode())) {
          if (!started) {
            range.setStart(node, 0);
            started = true;
          }
          range.setEnd(node, node.nodeValue.length);
        }
        if (!started) return null;
        const rect = range.getBoundingClientRect();
        range.detach();
        return rect;
      };
      const ctaTextFor = (selector) => Array.from(document.querySelectorAll(selector)).map((el) => {
        const rect = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const textRect = textRangeFor(el);
        const borderLeft = Number.parseFloat(cs.borderLeftWidth) || 0;
        const borderRight = Number.parseFloat(cs.borderRightWidth) || 0;
        const borderTop = Number.parseFloat(cs.borderTopWidth) || 0;
        const borderBottom = Number.parseFloat(cs.borderBottomWidth) || 0;
        const paddingLeft = Number.parseFloat(cs.paddingLeft) || 0;
        const paddingRight = Number.parseFloat(cs.paddingRight) || 0;
        const paddingTop = Number.parseFloat(cs.paddingTop) || 0;
        const paddingBottom = Number.parseFloat(cs.paddingBottom) || 0;
        const content = {
          left: rect.left + borderLeft + paddingLeft,
          right: rect.right - borderRight - paddingRight,
          top: rect.top + borderTop + paddingTop,
          bottom: rect.bottom - borderBottom - paddingBottom,
        };
        const tolerance = 1.5;
        const visibleBlock = {
          top: rect.top + borderTop,
          bottom: rect.bottom - borderBottom,
        };
        return {
          selector,
          text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
          height: rect.height,
          width: rect.width,
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          visible: rect.width > 0 && rect.height > 0,
          textInlineClipped: textRect ? textRect.left < content.left - tolerance || textRect.right > content.right + tolerance : false,
          textBlockClipped: textRect ? textRect.top < visibleBlock.top - tolerance || textRect.bottom > visibleBlock.bottom + tolerance : false,
          whiteSpace: cs.whiteSpace,
          overflowWrap: cs.overflowWrap,
        };
      }).filter((item) => item.visible);
      const clickable = [...document.querySelectorAll(".lean-hero__actions a, .lean-hero__actions button, .lean-hero__tg-cta, .growth-route-actions a, .v3-rebate-cta-btn, .v3-matrix-cta-btn, .v3-compare-sticky-bar__btn")]
        .map((el) => {
          const rect = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return {
            selector: el.className || el.tagName,
            text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
            height: rect.height,
            width: rect.width,
            fontSize: cs.fontSize,
            lineHeight: cs.lineHeight,
            inlineOverflow: el.scrollWidth > el.clientWidth + 1,
          };
        })
        .filter((item) => item.width > 0 && item.height > 0);
      return {
        layout: {
          hero: boxFor(".lean-hero"),
          heroContainer: boxFor(".lean-hero__container"),
          heroContent: boxFor(".lean-hero__content"),
          heroSecondary: boxFor(".lean-hero__secondary"),
          decisionPanel: boxFor(".growth-decision-panel"),
          selectedRoute: boxFor(".growth-selected-route"),
          footer: boxFor(".clean-footer"),
          footerBrand: boxFor(".clean-footer .nexualpha-wordmark"),
        },
        microcopy: microcopySelectors.map(styleFor).filter(Boolean).filter((item) => item.visible),
        ctaRanges: ctaRangeSelectors.flatMap(ctaTextFor),
        documentOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        bodyOverflow: document.body.scrollWidth > window.innerWidth + 1,
        htmlLang: document.documentElement.lang,
        wordmark: styleFor(".nexualpha-wordmark__label"),
        nav: styleFor(".v2-nav a, .mobile-menu-trigger"),
        heroTitle: styleFor(".lean-hero__title, .v3-page-hero h1, .v3-venue-hero h1, .activity-center-v3__head h1"),
        heroSubtitle: styleFor(".lean-hero__subtitle"),
        decisionTitle: styleFor(".growth-decision-panel__header h2"),
        decisionCopy: styleFor(".growth-decision-panel__header p, .growth-selected-route__identity span"),
        decisionSmall: styleFor(".growth-platform-option small, .growth-selected-route dt"),
        sectionTitle: styleFor(".section-lead h1, .section-lead h2, .v3-page-hero h1, .v3-venue-hero h1"),
        researchHeading: styleFor(".research-heading h2"),
        researchFact: styleFor(".research-facts dd, .v3-detail-grid p, .v3-detail-list li"),
        researchTable: styleFor(".research-table td, .v3-deep-compare__row span"),
        aux: styleFor(".lean-hero__badge span:not(.lean-hero__badge-dot), .growth-decision-panel__header > span, .growth-platform-search > span, .section-lead > p, .research-heading small, .research-language-note, .research-facts dt, .research-table th, .v3-deep-compare__row > b"),
        primaryCta: styleFor(".growth-route-actions__primary, .lean-hero__btn-primary, .v3-rebate-cta-btn, .v3-matrix-cta-btn"),
        telegramCta: styleFor(".lean-hero__tg-cta"),
        footerStatement: styleFor(".clean-footer__statement"),
        clickable,
      };
    }, { microcopySelectors, ctaRangeSelectors });
    await page.close();
    return result;
  }

  try {
    const failures = [];
    const check = (label, fn) => {
      try { fn(); }
      catch (error) {
        failures.push(`${label}: ${error?.message || error}`);
      }
    };
    const checkAsync = async (label, fn) => {
      try { return await fn(); }
      catch (error) {
        failures.push(`${label}: ${error?.message || error}`);
        return null;
      }
    };
    const assertStyle = (value, label) => assert.ok(value, `${label} selector exists on current page`);
    function assertMicrocopy(page, label, minimum = 13) {
      assert.ok(page.microcopy.length >= 4, `${label} has visible reading roles to check`);
      for (const role of page.microcopy) {
        const denseMetaMinimum = /growth-selected-route dt/.test(role.selector) ? Math.min(minimum, 11) : null;
        const compactMinimum = denseMetaMinimum ?? (/lean-hero__(?:pill|proof-action)|growth-(?:platform-option small|platform-search > span|decision-panel__header > span|compare-shortcuts > span)|v3-(?:compare-verdict__card dt|deep-compare__head > span|deep-compare__row > b)|activity-center-v3__source-grid dt|clean-footer__disclaimer p/.test(role.selector)
          ? Math.min(minimum, 12)
          : minimum);
        assert.ok(px(role.fontSize) >= compactMinimum, `${label} ${role.selector} >= ${compactMinimum}px (actual ${role.fontSize})`);
        assert.doesNotMatch(role.fontFamily, /ui-monospace|Menlo|Consolas|SFMono/, `${label} ${role.selector} uses proportional Chinese text`);
        assert.equal(role.inlineOverflow, false, `${label} ${role.selector} does not clip inline text`);
      }
    }
    function assertClickableTargets(page, label, minimum = 44) {
      assert.ok(page.clickable.length > 0, `${label} exposes visible CTA/clickable controls`);
      for (const item of page.clickable) {
        assert.ok(item.height >= minimum, `${label} ${item.text || item.selector} hit area >= ${minimum}px (actual ${item.height}px)`);
        assert.ok(px(item.fontSize) >= 13, `${label} ${item.text || item.selector} text remains readable`);
        assert.equal(item.inlineOverflow, false, `${label} ${item.text || item.selector} CTA text does not overflow inline`);
      }
    }
    function assertYellowPagesCtas(page, label, minimum = 44, minimumFontSize = 13) {
      assert.ok(page.ctaRanges.some((item) => item.selector === ".yellow-card__btn-detail"), `${label} covers yellow-page detail CTA text`);
      assert.ok(page.ctaRanges.some((item) => item.selector === ".yellow-card__btn-register"), `${label} covers yellow-page registration CTA text`);
      for (const item of page.ctaRanges) {
        assert.ok(item.height >= minimum, `${label} ${item.text || item.selector} hit area >= ${minimum}px (actual ${item.height}px)`);
        assert.ok(px(item.fontSize) >= minimumFontSize, `${label} ${item.text || item.selector} text remains readable`);
        assert.equal(item.textInlineClipped, false, `${label} ${item.text || item.selector} visible text stays inside the CTA content box inline`);
        assert.equal(item.textBlockClipped, false, `${label} ${item.text || item.selector} visible text stays inside the CTA content box block`);
      }
    }
    function assertNoPageOverflow(page, label) {
      assert.equal(page.documentOverflow, false, `${label} document has no horizontal overflow`);
      assert.equal(page.bodyOverflow, false, `${label} body has no horizontal overflow`);
    }
    const collectPage = async (locale, route, width, readingFontSize = null) => checkAsync(`${locale} ${width}px ${route}${readingFontSize ? ` ${readingFontSize}px-root` : ""} collect`, () => collect(locale, route, width, readingFontSize));

    for (const locale of ["zh-Hans", "zh-Hant"]) {
      const expectedFont = locale === "zh-Hans" ? "PingFang SC" : "PingFang TC";
      const expectedLang = locale === "zh-Hans" ? /^(zh-Hans|zh-CN)$/ : /^(zh-Hant|zh-TW)$/;
      const home = await collectPage(locale, "/", 390);
      if (home) {
        check(`${locale} mobile home html lang`, () => assert.match(home.htmlLang, expectedLang, `${locale} html lang preserves the intended CJK script`));
        check(`${locale} mobile home wordmark selector`, () => assertStyle(home.wordmark, `${locale} wordmark`));
        check(`${locale} mobile home hero title selector`, () => assertStyle(home.heroTitle, `${locale} hero title`));
        check(`${locale} mobile home hero subtitle selector`, () => assertStyle(home.heroSubtitle, `${locale} hero subtitle`));
        check(`${locale} mobile home decision title selector`, () => assertStyle(home.decisionTitle, `${locale} growth decision title`));
        check(`${locale} mobile home primary CTA selector`, () => assertStyle(home.primaryCta, `${locale} primary CTA`));
        check(`${locale} mobile home Telegram CTA selector`, () => assertStyle(home.telegramCta, `${locale} Telegram CTA`));
        check(`${locale} mobile home footer selector`, () => assertStyle(home.footerStatement, `${locale} footer statement`));
        check(`${locale} mobile home microcopy`, () => assertMicrocopy(home, `${locale} mobile home`));
        check(`${locale} mobile home clickable targets`, () => assertClickableTargets(home, `${locale} mobile home`));
        check(`${locale} mobile home yellow-page CTA text`, () => assertYellowPagesCtas(home, `${locale} mobile home`));
        check(`${locale} mobile home overflow`, () => assertNoPageOverflow(home, `${locale} mobile home`));
        check(`${locale} mobile home wordmark font`, () => assert.match(home.wordmark.fontFamily, /Pilot Inter|Inter/, `${locale} wordmark keeps Latin brand font`));
        check(`${locale} mobile home hero font`, () => assert.match(home.heroTitle.fontFamily, new RegExp(expectedFont), `${locale} hero title uses CJK stack`));
        check(`${locale} mobile home hero weight`, () => assert.equal(home.heroTitle.fontWeight, "600", `${locale} hero h1 weight`));
        check(`${locale} mobile home hero letter spacing`, () => assert.equal(home.heroTitle.letterSpacing, "normal", `${locale} hero h1 letter spacing`));
        check(`${locale} mobile home hero line count`, () => assert.ok(home.heroTitle.lineCount >= 1 && home.heroTitle.lineCount <= 4, `${locale} mobile long hero title wraps within a readable line count`));
        check(`${locale} mobile home subtitle size`, () => assert.ok(px(home.heroSubtitle.fontSize) >= 16, `${locale} hero subtitle remains readable`));
        check(`${locale} mobile home subtitle line height`, () => assert.ok(ratio(home.heroSubtitle) >= 1.55, `${locale} hero subtitle line height`));
        check(`${locale} mobile home decision copy size`, () => assert.ok(px(home.decisionCopy.fontSize) >= 14, `${locale} decision copy >= 14px`));
        check(`${locale} mobile home dense metadata size`, () => assert.ok(px(home.decisionSmall.fontSize) >= 11, `${locale} dense route metadata remains legible`));
        check(`${locale} mobile home aux font`, () => assert.doesNotMatch(home.aux.fontFamily, /ui-monospace|Menlo|Consolas|SFMono/, `${locale} aux no longer mono`));
      }

      const enlarged = await collectPage(locale, "/", 390, 32);
      if (enlarged) {
        check(`${locale} enlarged home microcopy`, () => assertMicrocopy(enlarged, `${locale} enlarged home`, 23));
        check(`${locale} enlarged home clickable targets`, () => assertClickableTargets(enlarged, `${locale} enlarged home`, 44));
        check(`${locale} enlarged home yellow-page CTA text`, () => assertYellowPagesCtas(enlarged, `${locale} enlarged home`, 44, 23));
        check(`${locale} enlarged home overflow`, () => assertNoPageOverflow(enlarged, `${locale} enlarged home`));
        check(`${locale} enlarged home subtitle size`, () => assert.ok(px(enlarged.heroSubtitle.fontSize) >= 30, `${locale} Chinese prose respects 200% root text size`));
        check(`${locale} enlarged home footer size`, () => assert.ok(px(enlarged.footerStatement.fontSize) >= 23, `${locale} footer disclosure remains readable at 200%`));
        if (home) check(`${locale} enlarged home title line count`, () => assert.ok(enlarged.heroTitle.lineCount >= home.heroTitle.lineCount, `${locale} enlarged hero title wraps instead of shrinking`));
      }

      for (const width of [1024, 1100, 1440]) {
        const desktopHome = await collectPage(locale, "/", width);
        if (!desktopHome) continue;
        check(`${locale} ${width}px home hero content selector`, () => assertStyle(desktopHome.layout.heroContent, `${locale} ${width}px hero content`));
        check(`${locale} ${width}px home decision selector`, () => assertStyle(desktopHome.layout.decisionPanel, `${locale} ${width}px growth decision panel`));
        check(`${locale} ${width}px home overflow`, () => assertNoPageOverflow(desktopHome, `${locale} ${width}px desktop home`));
        check(`${locale} ${width}px home microcopy`, () => assertMicrocopy(desktopHome, `${locale} ${width}px desktop home`));
        check(`${locale} ${width}px home clickable targets`, () => assertClickableTargets(desktopHome, `${locale} ${width}px desktop home`));
        check(`${locale} ${width}px home yellow-page CTA text`, () => assertYellowPagesCtas(desktopHome, `${locale} ${width}px desktop home`));
        check(`${locale} ${width}px home hero overflow`, () => assert.equal(desktopHome.heroTitle.inlineOverflow, false, `${locale} ${width}px desktop hero h1 does not overflow inline`));
        check(`${locale} ${width}px home hero line count`, () => assert.ok(desktopHome.heroTitle.lineCount <= 3, `${locale} ${width}px desktop hero h1 wraps within three lines`));
        if (width > 1024) {
          check(`${locale} ${width}px home hero top alignment`, () => assert.ok(Math.abs(desktopHome.layout.heroContent.top - desktopHome.layout.decisionPanel.top) <= 4, `${locale} ${width}px hero and decision panel align at top`));
        }
      }

      for (const [route, label] of [["/compare/binance-vs-okx", "comparison"], ["/exchanges/binance", "detail"]]) {
        const page = await collectPage(locale, route, 1440);
        if (!page) continue;
        check(`${locale} ${label} title selector`, () => assertStyle(page.sectionTitle, `${locale} ${label} title`));
        check(`${locale} ${label} title weight`, () => assert.equal(page.sectionTitle.fontWeight, "600", `${locale} ${label} title weight`));
        check(`${locale} ${label} title letter spacing`, () => assert.equal(page.sectionTitle.letterSpacing, "normal", `${locale} ${label} title letter spacing`));
        check(`${locale} ${label} title overflow`, () => assert.equal(page.sectionTitle.inlineOverflow, false, `${locale} ${label} title does not overflow`));
        check(`${locale} ${label} overflow`, () => assertNoPageOverflow(page, `${locale} ${label}`));
        check(`${locale} ${label} microcopy`, () => assertMicrocopy(page, `${locale} ${label}`));
        check(`${locale} ${label} clickable targets`, () => assertClickableTargets(page, `${locale} ${label}`));
      }

      const detail = await collectPage(locale, "/exchanges/binance", 1440);
      if (detail) {
        check(`${locale} detail research selector`, () => assertStyle(detail.researchFact, `${locale} detail research/content`));
        check(`${locale} detail research size`, () => assert.ok(px(detail.researchFact.fontSize) >= 16, `${locale} detail research/content >= 16px`));
        check(`${locale} detail research line height`, () => assert.ok(ratio(detail.researchFact) >= 1.55, `${locale} detail research/content line height`));
        if (detail.researchHeading) {
          check(`${locale} detail research h2 weight`, () => assert.equal(detail.researchHeading.fontWeight, "600", `${locale} research h2 weight`));
        }
      }

      const compare = await collectPage(locale, "/compare/binance-vs-okx", 1440);
      if (compare) {
        check(`${locale} compare matrix/research selector`, () => assertStyle(compare.researchTable, `${locale} comparison matrix/research`));
        check(`${locale} compare matrix/research size`, () => assert.ok(px(compare.researchTable.fontSize) >= 15, `${locale} comparison matrix/research text >= 15px`));
        check(`${locale} compare matrix/research overflow`, () => assert.equal(compare.researchTable.inlineOverflow, false, `${locale} comparison matrix/research text does not overflow`));
      }

      for (const route of ["/exchanges", "/activities"]) {
        for (const width of [390, 1024, 1440]) {
          const page = await collectPage(locale, route, width);
          if (!page) continue;
          check(`${locale} ${width}px ${route} microcopy`, () => assertMicrocopy(page, `${locale} ${width}px ${route}`));
          if (route === "/exchanges") check(`${locale} ${width}px ${route} yellow-page CTA text`, () => assertYellowPagesCtas(page, `${locale} ${width}px ${route}`));
          check(`${locale} ${width}px ${route} overflow`, () => assertNoPageOverflow(page, `${locale} ${width}px ${route}`));
        }
      }
    }

    const english = await collectPage("en", "/", 390);
    if (english) {
      check("English mobile home wordmark font", () => assert.match(english.wordmark.fontFamily, /Pilot Inter|Inter/, "English wordmark keeps Pilot Inter"));
      check("English mobile home clickable targets", () => assertClickableTargets(english, "English mobile home"));
      check("English mobile home overflow", () => assertNoPageOverflow(english, "English mobile home"));
    }

    if (failures.length) {
      assert.fail(`CJK browser assertions failed (${failures.length}):\n- ${failures.join("\n- ")}`);
    }
  } finally {
    await browser.close();
  }
});
