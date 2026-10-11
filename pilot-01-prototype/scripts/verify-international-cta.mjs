import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BRAZIL_PAGES, BRAZIL_VENUES } from '../src/data/brazil-market.js';
import { partnerRegistry } from '../src/data/partner-registry.js';
import { localizedHref } from '../src/data/locale-routing.js';

const require = createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer = require('puppeteer-core');

// The local Sites preview listens on 4173 by default; callers can override
// this for production or another isolated preview with AUDIT_URL.
const base = process.env.AUDIT_URL || 'http://127.0.0.1:4173';
const out = path.resolve(process.env.INTERNATIONAL_OUT || '../artifacts/international-cta/current');
const locales = ['en','zh-Hans','zh-Hant','pt-BR','es','fr','de','ja','ko','ar','tr','ru','id','vi','it','ur','uk'];

const readPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const NAVIGATION_TIMEOUT_MS = readPositiveInt(process.env.INTERNATIONAL_CTA_NAVIGATION_TIMEOUT_MS, 45_000);
const OPERATION_TIMEOUT_MS = readPositiveInt(process.env.INTERNATIONAL_CTA_OPERATION_TIMEOUT_MS, 15_000);
const VISUAL_JOB_TIMEOUT_MS = readPositiveInt(process.env.INTERNATIONAL_CTA_VISUAL_JOB_TIMEOUT_MS, 75_000);
const INTERACTION_STEP_TIMEOUT_MS = readPositiveInt(process.env.INTERNATIONAL_CTA_INTERACTION_STEP_TIMEOUT_MS, 45_000);

class AuditTimeoutError extends Error {
  constructor(label, timeoutMs) {
    super(`${label} timed out after ${timeoutMs}ms`);
    this.name = 'AuditTimeoutError';
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isAuditTimeout = (error) => error?.name === 'AuditTimeoutError' || /timed out after \d+ms/i.test(error?.message || '');

const withTimeout = async (promise, label, timeoutMs = OPERATION_TIMEOUT_MS) => {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new AuditTimeoutError(label, timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

const fetchJson = async (url, label) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPERATION_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`${label} status ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') throw new AuditTimeoutError(label, OPERATION_TIMEOUT_MS);
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const closePage = async (page, label = 'page close') => {
  if (!page || page.isClosed()) return;
  await withTimeout(page.close({ runBeforeUnload: false }), label, 5_000).catch(() => {});
};

const closeBrowser = async (browser, failures) => {
  if (!browser) return;
  try {
    await withTimeout(browser.close(), 'browser close', 10_000);
  } catch (error) {
    failures.push(error.stack || error.message);
    browser.process()?.kill('SIGKILL');
  }
};

const gotoWithRetry = async (page, url, label = `navigate ${url}`) => {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await withTimeout(
        page.goto(url, { waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT_MS }),
        `${label} attempt ${attempt + 1}`,
        NAVIGATION_TIMEOUT_MS + 1_000,
      );
    } catch (error) {
      lastError = error;
      if (attempt === 0) await sleep(350);
    }
  }
  throw lastError;
};

const runVisualJob = async (page, job, eventErrors, axe) => {
  await withTimeout(page.setViewport({ width: job.width, height: job.width < 600 ? 844 : 1000 }), `viewport ${job.path} ${job.width}`);

  // Navigate directly to the locale's canonical contract. Using the legacy
  // `?locale=` URL for migrated locales can follow the production absolute
  // redirect when this audit runs against a local preview.
  const url = new URL(localizedHref(job.path, { locale: job.locale }), base);
  const response = await gotoWithRetry(page, url.href, `visual ${job.path} ${job.locale} ${job.width}`);

  await withTimeout(page.evaluate(() => document.fonts?.ready ?? Promise.resolve()), `fonts ${url.href}`)
    .catch((error) => eventErrors.push(error.message));

  const geometry = await withTimeout(page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
    };
    return {
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      h1: [...document.querySelectorAll('h1')].filter(visible).map((element) => element.textContent),
      body: document.querySelector('#root')?.textContent.length,
      brokenImages: [...document.images].filter((element) => visible(element) && element.complete && !element.naturalWidth).map((element) => element.src),
      links: [...document.querySelectorAll('[data-cta-placement^="brazil-"]')].map((element) => ({ href: element.href, rel: element.rel, kind: element.dataset.ctaKind, status: element.dataset.ctaStatus })),
      lang: document.documentElement.lang,
      canonical: document.querySelector('link[rel=canonical]')?.href,
    };
  }), `geometry ${url.href}`);

  if (response.status() !== 200) eventErrors.push(`status ${response.status()}`);
  if (geometry.scrollWidth > job.width + 2) eventErrors.push(`overflow ${geometry.scrollWidth}`);
  if (geometry.h1.length !== 1) eventErrors.push(`h1 count ${geometry.h1.length}`);
  if (geometry.body < 100) eventErrors.push('empty body');
  if (geometry.brokenImages.length) eventErrors.push('broken image');

  if (job.br) for (const link of geometry.links) {
    if (link.rel.includes('sponsored')) {
      if (!BRAZIL_VENUES.some((venue) => partnerRegistry[venue.slug]?.registrationUrl === link.href)) eventErrors.push(`unexpected partner ${link.href}`);
    } else if (link.kind === 'research') {
      if ((!/\/exchanges\/[a-z0-9-]+\?/.test(link.href) && !/\/br\/custos\?/.test(link.href)) || !link.href.includes('market=') || !link.href.includes('product=')) eventErrors.push(`unscoped research handoff ${link.href}`);
    } else if (link.kind === 'internal') {
      if (new URL(link.href).origin !== new URL(base).origin) eventErrors.push(`external internal handoff ${link.href}`);
    } else if (link.kind === 'telegram') {
      if (new URL(link.href).hostname !== 't.me') eventErrors.push(`unexpected Telegram handoff ${link.href}`);
    } else eventErrors.push(`unclassified Brazil CTA ${link.href}`);
  }

  let accessibility;
  if (job.locale === 'pt-BR' && [375,390,1440].includes(job.width)) {
    await withTimeout(page.addScriptTag({ content: axe }), `axe inject ${url.href}`);
    accessibility = await withTimeout(page.evaluate(async () => {
      const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } });
      return result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      }));
    }), `axe run ${url.href}`, OPERATION_TIMEOUT_MS + 15_000);
    if (accessibility.length) eventErrors.push(...accessibility.map((violation) => `axe:${violation.id}`));
  }

  if (job.locale === 'pt-BR' && [375,390,1440].includes(job.width)) {
    const scrollHeight = await withTimeout(page.evaluate(() => document.documentElement.scrollHeight), `scrollHeight ${url.href}`);
    await withTimeout(page.screenshot({
      path: path.join(out, `${job.path.replace(/[^a-z0-9]/gi, '_')}-${job.width}.png`),
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: job.width, height: Math.min(10_000, scrollHeight) },
    }), `screenshot ${url.href}`, OPERATION_TIMEOUT_MS + 15_000);
  }

  return { geometry, accessibility };
};

const runInteractionStep = async (label, fn) => {
  console.log(label);
  await withTimeout(fn(), label, INTERACTION_STEP_TIMEOUT_MS);
};

await mkdir(out, { recursive: true });

let browser;
const results = [];
const interactions = [];
const failures = [];
let build;

try {
  build = await fetchJson(`${base}/version.json`, 'initial version.json');
  const axe = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
  browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });

  const jobs = [];
  for (const route of BRAZIL_PAGES) for (const width of [375,768,1440]) for (const locale of ['pt-BR','en','zh-Hans','zh-Hant','ar']) jobs.push({ path: route.path, width, locale, br: true });
  for (const locale of locales) for (const width of [390,1440]) jobs.push({ path: '/', width, locale });
  for (const width of [320,390,768,1440]) {
    jobs.push({ path: '/embed/calculator?market=BR&publisher=qa_embed', width, locale: 'pt-BR', embed: true });
    jobs.push({ path: '/partners', width, locale: 'pt-BR' });
  }
  if (process.env.INTERNATIONAL_INTERACTION_ONLY === '1') jobs.length = 0;

  await Promise.all(Array.from({ length: 3 }, async (_, workerIndex) => {
    let page = await browser.newPage();
    try {
      while (jobs.length) {
        const job = jobs.shift();
        const eventErrors = [];
        const onError = (error) => eventErrors.push(error.message);
        const onConsole = (message) => {
          if (message.type() === 'error' && /hydration|hydrating|Minified React|Uncaught/i.test(message.text())) eventErrors.push(message.text());
        };
        page.on('pageerror', onError);
        page.on('console', onConsole);

        let recyclePage = false;
        try {
          const label = `visual worker ${workerIndex + 1} ${job.path} ${job.locale} ${job.width}`;
          const visual = await withTimeout(runVisualJob(page, job, eventErrors, axe), label, VISUAL_JOB_TIMEOUT_MS);
          results.push({ ...job, ...visual, errors: eventErrors });
        } catch (error) {
          recyclePage = isAuditTimeout(error);
          results.push({ ...job, errors: [...eventErrors, error.message] });
        } finally {
          page.off('pageerror', onError);
          page.off('console', onConsole);
          if (recyclePage) {
            await closePage(page, `recycle timed-out visual page ${workerIndex + 1}`);
            page = await browser.newPage();
          }
        }

        if (results.length % 20 === 0) console.log(`Visual ${results.length}, failures ${results.filter((result) => result.errors.length).length}`);
      }
    } finally {
      await closePage(page, `worker page close ${workerIndex + 1}`);
    }
  }));

  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 390, height: 844 });
    const go = async (targetPath) => {
      await gotoWithRetry(page, new URL(targetPath, base).href, `interaction navigate ${targetPath}`);
    };

    await runInteractionStep('Interaction 1/8: Brazil selection', async () => {
      await go('/br?utm_source=creator&utm_campaign=br-pilot&publisher=creator_1&email=do-not-keep@example.com');
      assert.equal(await page.$$eval('[data-cta-placement^="brazil-"][data-cta-kind="registration"]', (elements) => elements.length), BRAZIL_VENUES.filter((venue) => venue.access === 'source-backed').length);
      await page.select('[data-testid="brazil-platform"]', 'okx');
      const selectedCta = await page.$eval('[data-cta-placement="brazil-br-home-primary"]', (element) => ({ href: element.href, kind: element.dataset.ctaKind, status: element.dataset.ctaStatus, rel: element.rel }));
      assert.equal(selectedCta.kind, 'registration');
      assert.equal(selectedCta.href, partnerRegistry.okx.registrationUrl);
      assert.ok(selectedCta.rel.includes('sponsored'));
      assert.ok(!page.url().includes('email='));
      assert.ok(page.url().includes('publisher=creator_1'));
      interactions.push('Prerender hydration keeps publisher/campaign; selected OKX uses the constitution-locked partner route while only safe public state remains in the page URL');
    });

    await runInteractionStep('Interaction 2/8: market and product fail-closed paths', async () => {
      for (const market of ['ID','TW','HK','OTHER']) {
        await page.select('[data-testid="brazil-region"]', market);
        const links = await page.$$eval('[data-cta-placement^="brazil-"][data-cta-kind="research"], [data-cta-placement^="brazil-"][data-cta-kind="registration"]', (elements) => elements.map((element) => ({ href: element.href, kind: element.dataset.ctaKind })));
        assert.ok(links.length > 0);
        assert.ok(links.every((link) => link.kind === 'research'));
        assert.ok(links.every((link) => link.href.includes(`market=${market}`)));
      }
      await page.select('[data-testid="brazil-region"]', 'BR');
      await page.select('[data-testid="brazil-product"]', 'perpetuals');
      assert.ok((await page.$$eval('[data-cta-placement^="brazil-"][data-cta-kind="research"], [data-cta-placement^="brazil-"][data-cta-kind="registration"]', (elements) => elements.map((element) => element.dataset.ctaKind))).every((kind) => kind === 'research'));
      interactions.push('Other markets and derivatives do not receive Brazil spot registration CTA');

      for (const query of ['market=US&product=spot','market=BR&product=malformed']) {
        await go(`/br?${query}`);
        const links = await page.$$eval('[data-cta-placement^="brazil-"][data-cta-kind="research"], [data-cta-placement^="brazil-"][data-cta-kind="registration"]', (elements) => elements.map((element) => ({ kind: element.dataset.ctaKind, rel: element.rel })));
        assert.ok(links.every((link) => link.kind === 'research' && !link.rel.includes('sponsored')));
      }
      interactions.push('Explicit unsupported market/product fails to a useful non-registration route');
    });

    await runInteractionStep('Interaction 3/8: calculator state round trip', async () => {
      await go('/br/custos?market=BR&product=spot&amount=2500&spot_fee_bps=20&deposit_fee_pct=1&deposit_fixed_brl=3&utm_source=embed_widget&publisher=editor_1');
      assert.ok((await page.$eval('[data-testid="brazil-cost-estimate"] b', (element) => element.textContent)).includes('33,00'));
      const shared = page.url();
      const fresh = await browser.createBrowserContext();
      try {
        const freshPage = await fresh.newPage();
        await gotoWithRetry(freshPage, shared, 'fresh context calculator restore');
        assert.equal(await freshPage.$eval('[data-testid="brazil-amount"]', (element) => element.value), '2500');
        await closePage(freshPage, 'fresh calculator page close');
      } finally {
        await withTimeout(fresh.close(), 'fresh browser context close', 5_000).catch(() => {});
      }
      interactions.push('Cost assumptions calculate BRL 33.00 and share state restores in an isolated browser session');
    });

    await runInteractionStep('Interaction 4/8: internal navigation history', async () => {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT_MS }),
        page.click('[data-growth-decision="br_verify_pix"]'),
      ]);
      assert.equal(await page.$eval('[data-testid="brazil-amount"]', (element) => element.value), '2500');
      await go('/br/conta?amount=3000&market=BR&product=spot');
      await withTimeout(page.goBack({ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT_MS }), 'history back to calculator', NAVIGATION_TIMEOUT_MS + 1_000);
      assert.equal(await page.$eval('[data-testid="brazil-amount"]', (element) => element.value), '2500');
      interactions.push('Internal navigation retains decision; explicit URL wins; browser back restores previous URL');
    });

    await runInteractionStep('Interaction 5/8: blocked storage', async () => {
      const blocked = await browser.newPage();
      try {
        await blocked.evaluateOnNewDocument(() => Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }));
        const blockedErrors = [];
        blocked.on('pageerror', (error) => blockedErrors.push(error.message));
        await gotoWithRetry(blocked, `${base}/br`, 'blocked storage Brazil page');
        assert.equal(blockedErrors.length, 0);
        assert.ok(await blocked.$('[data-testid="brazil-region"]'));
      } finally {
        await closePage(blocked, 'blocked storage page close');
      }
      interactions.push('Blocked storage does not crash the decision page');
    });

    await runInteractionStep('Interaction 6/8: embed calculator', async () => {
      await go('/embed/calculator?market=BR&product=spot&amount=2500&spot_fee_bps=20&deposit_fee_pct=1&deposit_fixed_brl=3&publisher=editor_1&utm_source=embed_widget');
      assert.ok((await page.$eval('[data-testid="brazil-embed-cost-result"]', (element) => element.textContent)).includes('33,00'));
      assert.match(await page.$eval('.br-cost-embed__link', (element) => element.href), /publisher=editor_1/);
      interactions.push('Publisher embed computes same cost and passes publisher context to the local guide');
      await go('/embed/calculator?market=BR&product=perpetuals');
      assert.equal(await page.$$eval('[data-testid="brazil-cost-embed"]', (elements) => elements.length), 0);
      interactions.push('Derivatives embed request is not silently converted to a Brazil spot request');
    });

    await runInteractionStep('Interaction 7/8: embed builder', async () => {
      await go('/partners?locale=pt-BR');
      await page.click('[data-testid="brazil-embed-select"]');
      const iframe = await page.waitForSelector('.preview-iframe--brazil', { timeout: OPERATION_TIMEOUT_MS });
      const embedFrame = await withTimeout(iframe.contentFrame(), 'Brazil preview iframe frame');
      assert.ok(embedFrame, 'Brazil preview iframe must expose a frame');
      await embedFrame.waitForSelector('[data-testid="brazil-cost-embed"]', { timeout: OPERATION_TIMEOUT_MS });
      interactions.push('Embed builder renders the actual Brazil widget in its iframe');
    });

    await runInteractionStep('Interaction 8/8: no-JavaScript answers', async () => {
      await page.setJavaScriptEnabled(false);
      for (const route of BRAZIL_PAGES) {
        await go(route.path);
        assert.equal(await page.$eval('h1', (element) => element.textContent), route.title);
        assert.ok((await page.$eval('#root', (element) => element.textContent)).includes(route.answer));
      }
      interactions.push('All five original Portuguese pages retain answers and partner links without JavaScript');
    });
  } finally {
    await closePage(page, 'interaction page close');
  }
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  await closeBrowser(browser, failures);
}

try {
  const finalBuild = await fetchJson(`${base}/version.json`, 'final version.json');
  if (build?.buildId && finalBuild.buildId !== build.buildId) failures.push('Build changed during audit');
} catch (error) {
  failures.push(error.stack || error.message);
}

const report = {
  createdAt: new Date().toISOString(),
  base,
  build,
  total: results.length,
  failed: results.filter((result) => result.errors.length).length,
  timedOut: results.filter((result) => result.errors.some((message) => /timed out after \d+ms/i.test(message))).length,
  results,
  interactions,
  failures,
};

await writeFile(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ total: report.total, failed: report.failed, timedOut: report.timedOut, interactions, failures }, null, 2));
process.exit(report.failed || failures.length ? 1 : 0);
