import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer = require('puppeteer-core');
const OUT = process.argv[2];
const URL = process.env.QA_URL || 'http://127.0.0.1:4320/zh-hans';
await mkdir(OUT, { recursive: true });

const early = () => {
  window.__qa = { ls: [], errs: [], flashLog: [], removed: [] };
  addEventListener('error', (e) => window.__qa.errs.push('error: ' + (e.message || e.error)));
  addEventListener('unhandledrejection', (e) => window.__qa.errs.push('rejection: ' + e.reason));
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__qa.ls.push({ v: +e.value.toFixed(5), t: Math.round(e.startTime), hir: e.hadRecentInput, src: (e.sources || []).map((s) => s.node ? (s.node.tagName + '.' + String(s.node.className?.baseVal ?? s.node.className).slice(0, 60) + ' ' + JSON.stringify(s.previousRect) + '->' + JSON.stringify(s.currentRect)) : '?') }); }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  const mo = new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.removedNodes) if (n.nodeType === 1 && (n.id === 'h7-flash' || n.id === 'h7-movers' || n.querySelector?.('#h7-flash'))) window.__qa.removed.push({ t: Math.round(performance.now()), id: n.id || n.className, stack: new Error().stack.split('\n').slice(1, 6).join(' | ') });
  });
  document.addEventListener('DOMContentLoaded', () => mo.observe(document.body, { childList: true, subtree: true }));
};

async function run(label, viewport, ua) {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
  const res = { label, console: [], pageerrors: [], requests: [] };
  try {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    if (ua) await page.setUserAgent(ua);
    await page.setViewport(viewport);
    await page.setCacheEnabled(false);
    page.on('console', (m) => res.console.push(`${m.type()}: ${m.text()}`.slice(0, 400)));
    page.on('pageerror', (e) => res.pageerrors.push(String(e).slice(0, 400)));
    const t0 = Date.now();
    page.on('requestfinished', (r) => { const u = r.url(); if (/flash\.json|movers\.json|ticker\.json|home-below|route-activity|CampaignRadar|route-factbook|route-methodology/.test(u)) res.requests.push(`${Date.now() - t0}ms ${r.response()?.status()} ${u.replace('https://nexualpha.com', '')}`); });
    page.on('requestfailed', (r) => res.requests.push(`${Date.now() - t0}ms FAILED ${r.failure()?.errorText} ${r.url().replace('https://nexualpha.com', '')}`));
    await page.evaluateOnNewDocument(early);
    await page.goto(URL + '?qa=' + label + Date.now(), { waitUntil: 'load', timeout: 60000 });
    const snap = async (tag) => page.evaluate((tag) => ({ tag, t: Math.round(performance.now()), flashInDom: !!document.querySelector('#h7-flash'), flashSkel: document.querySelectorAll('.h7-flash-skel').length, flashItems: document.querySelectorAll('.h7-flash-list li:not(.h7-flash-skel)').length, moversInDom: !!document.querySelector('#h7-movers'), losers: document.querySelectorAll('.h7-mv-dn li:not(.h7-mv-pad)').length, gainers: document.querySelectorAll('.h7-mv-up li:not(.h7-mv-pad)').length, scrollH: document.documentElement.scrollHeight }), tag);
    res.snaps = [await snap('load')];
    await new Promise((r) => setTimeout(r, 3000));
    res.snaps.push(await snap('load+3s'));
    await page.screenshot({ path: `${OUT}/${label}-01-top.png` });
    // 10 s hero observation at top
    res.hero = await page.evaluate(async () => {
      const hero = document.querySelector('.h7-hero');
      const els = [hero, ...hero.querySelectorAll('*')];
      const key = (e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round).join(','); };
      const prev = new Map(els.map((e) => [e, key(e)]));
      const changes = {}; let frames = 0, long = 0, last = performance.now(); const t0 = performance.now(); const before = window.__qa.ls.length;
      await new Promise((res) => { const f = (now) => { frames++; if (now - last > 50) long++; last = now; for (const e of els) { const k = key(e); if (k !== prev.get(e)) { const id = e.tagName + '.' + String(e.className?.baseVal ?? e.className).slice(0, 40); changes[id] = (changes[id] || 0) + 1; prev.set(e, k); } } performance.now() - t0 < 10000 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
      const cv = document.querySelector('canvas.h7-fl'); const cs = cv && getComputedStyle(cv);
      return { frames, longFrames: long, sizeChanges: changes, newShifts: window.__qa.ls.slice(before), canvas: cv && { display: cs.display, backing: cv.width + 'x' + cv.height, css: cv.offsetWidth + 'x' + cv.offsetHeight, z: cs.zIndex }, runningAnimations: document.getAnimations().filter((a) => a.playState === 'running').map((a) => { const t = a.effect?.target; return (a.animationName || 'anim') + '@' + (t ? t.tagName + '.' + String(t.className?.baseVal ?? t.className).split(' ')[0] : ''); }) };
    });
    // scroll through page like a reader
    let y = 0, i = 2;
    while (true) {
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      if (y >= H) break;
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await new Promise((r) => setTimeout(r, 900));
      await page.screenshot({ path: `${OUT}/${label}-${String(i).padStart(2, '0')}-y${y}.png` });
      i++; y += viewport.height - 80;
      if (i > 40) break;
    }
    await new Promise((r) => setTimeout(r, 4000));
    res.snaps.push(await snap('after-scroll+4s'));
    // targeted element screenshots
    for (const [n, sel] of [['hero', '.h7-hero'], ['tabs', '.h7-lg-tabs'], ['cta', '.h7-lg-go'], ['flash', '#h7-flash'], ['movers', '#h7-movers'], ['footer', 'footer.nx-ftr']]) {
      const el = await page.$(sel);
      if (!el) { res[`missing_${n}`] = true; continue; }
      await el.evaluate((e) => e.scrollIntoView({ block: 'start' }));
      await new Promise((r) => setTimeout(r, 800));
      await el.screenshot({ path: `${OUT}/${label}-el-${n}.png` }).catch((e) => { res[`shotfail_${n}`] = String(e).slice(0, 120); });
    }
    res.tabs = await page.evaluate(() => { const t = document.querySelector('.h7-lg-tabs'); return t && { h: t.offsetHeight, sw: t.scrollWidth, cw: t.clientWidth, n: t.children.length, rows: new Set([...t.children].map((b) => Math.round(b.getBoundingClientRect().top))).size, labels: [...t.children].map((b) => b.innerText.replace(/\s+/g, ' ')) }; });
    res.cta = await page.evaluate(() => [...document.querySelectorAll('.h7-go-disclosure, .h7-lg-go small')].map((e) => e.textContent));
    res.footer = await page.evaluate(() => { const f = document.querySelector('footer.nx-ftr'); return f && { h: f.offsetHeight, links: f.querySelectorAll('a').length, langLinks: f.querySelectorAll('[hreflang], [lang]').length, text: f.innerText.length, details: [...f.querySelectorAll('details summary')].map((s) => s.innerText.replace(/\s+/g, ' ').slice(0, 60)) }; });
    res.heroNum = await page.evaluate(() => { const n = document.querySelector('.h7-num'); const h = document.querySelector('.h7-h1n'); const s = n && getComputedStyle(n); return { ledgerNum: n && { fontSize: s.fontSize, weight: s.fontWeight, rect: JSON.stringify(n.getBoundingClientRect().toJSON()) }, h1Num: h && getComputedStyle(h).fontSize }; });
    await page.screenshot({ path: `${OUT}/${label}-fullpage.png`, fullPage: true });
    res.qa = await page.evaluate(() => ({ ...window.__qa, cls: window.__qa.ls.filter((x) => !x.hir).reduce((a, b) => a + b.v, 0) }));
  } finally { await browser.close(); }
  return res;
}

const mobileUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const out = [];
out.push(await run('m375', { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, mobileUA));
out.push(await run('d1440', { width: 1440, height: 900, deviceScaleFactor: 1 }, null));
await writeFile(`${OUT}/results.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.map((r) => ({ label: r.label, snaps: r.snaps, pageerrors: r.pageerrors, consoleErr: r.console.filter((c) => /error|warn/i.test(c)).slice(0, 8), requests: r.requests, removed: r.qa?.removed, cls: r.qa?.cls, shifts: r.qa?.ls?.slice(0, 6), hero: r.hero, tabs: r.tabs, cta: r.cta, footer: r.footer, heroNum: r.heroNum })), null, 1));
