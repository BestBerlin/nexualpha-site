#!/usr/bin/env python3
"""V5 reduced-motion sweep: load every page template (scripts/qa_templates.py) with prefers-reduced-motion: reduce and
report what still moves.

Usage: python3 scripts/qa-reduced-motion.py [base_url] [out.json] [--locales en,ar] [--widths 390,1440] [--templates home] [--motion no-preference]

Per page (after load, a scroll through the page to trigger in-view effects, and a settle):
- running: document.getAnimations() that are still running with a duration > 10 ms or infinite iterations
  (CSS animations, CSS transitions, Web Animations; pseudo-elements included);
- cssLong: elements whose computed animation-duration (with an animation-name) or transition-duration (with a
  transition-property other than none) is longer than 0.01 s — what would run if triggered;
- rafPerSec: requestAnimationFrame callbacks per second during a 2 s idle window (canvas/particle loops, JS tweens);
- textMutations: text changes during the same window (count-up numbers, tickers, rotating words);
- smoothScroll: computed scroll-behavior of <html> is "smooth".
Exit 1 when any page has a running animation, a long CSS duration, rafPerSec > 2 or a text mutation.
"""
import argparse, asyncio, json, pathlib, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playwright.async_api import async_playwright  # noqa: E402
from qa_templates import page_urls, select  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("base", nargs="?", default="http://localhost:5174")
ap.add_argument("out", nargs="?")
ap.add_argument("--locales", default="en,ar")
ap.add_argument("--widths", default="390,1440")
ap.add_argument("--templates")
ap.add_argument("--jobs", type=int, default=4)
ap.add_argument("--motion", default="reduce", help="reduce (default) or no-preference, to check that the probes detect motion")
args = ap.parse_args()

INIT = """(() => {
  window.__qaRaf = 0; window.__qaText = 0; window.__qaTextSamples = [];
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => { window.__qaRaf++; cb(t); });
  new MutationObserver((list) => {
    for (const m of list) {
      const el = m.type === 'characterData' ? m.target.parentElement : m.target;
      if (!el || el.closest('script,style,head')) continue;
      window.__qaText++;
      if (window.__qaTextSamples.length < 6) window.__qaTextSamples.push((el.tagName || '').toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.split(' ')[0] : '') + ': ' + (el.textContent || '').trim().slice(0, 40));
    }
  }).observe(document, { subtree: true, characterData: true, childList: true });
})();"""

DESCRIBE = """(el) => { if (!el) return '?'; const t = el.tagName ? el.tagName.toLowerCase() : '?';
  const c = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
  return t + (el.id ? '#' + el.id : '') + c; }"""

MEASURE = """() => {
  const describe = """ + DESCRIBE + """;
  const secs = (v) => Math.max(0, ...v.split(',').map((s) => s.trim().endsWith('ms') ? parseFloat(s) / 1000 : parseFloat(s)));
  const running = [];
  for (const a of document.getAnimations()) {
    if (a.playState !== 'running') continue;
    const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {};
    const dur = typeof t.duration === 'number' ? t.duration : 0;
    if (dur > 10 || t.iterations === Infinity) {
      const target = a.effect && a.effect.target;
      const pseudo = a.effect && a.effect.pseudoElement ? a.effect.pseudoElement : '';
      running.push({ type: a.constructor.name, name: a.animationName || a.transitionProperty || a.id || '', target: describe(target) + pseudo, durationMs: Math.round(dur), iterations: String(t.iterations) });
    }
  }
  const cssLong = {};
  for (const el of document.querySelectorAll('*')) {
    for (const pseudo of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, pseudo);
      if (pseudo && (cs.content === 'none' || cs.content === 'normal')) continue;
      const kinds = [];
      if (cs.animationName !== 'none' && secs(cs.animationDuration) > 0.01) kinds.push('animation ' + cs.animationName + ' ' + cs.animationDuration);
      if (cs.transitionProperty !== 'none' && secs(cs.transitionDuration) > 0.01) kinds.push('transition ' + cs.transitionProperty.slice(0, 40) + ' ' + cs.transitionDuration);
      for (const k of kinds) { const key = describe(el) + (pseudo || '') + ' :: ' + k; cssLong[key] = (cssLong[key] || 0) + 1; }
    }
  }
  return { running, cssLong: Object.entries(cssLong).map(([k, n]) => ({ rule: k, count: n })), smoothScroll: getComputedStyle(document.documentElement).scrollBehavior === 'smooth',
    canvases: document.querySelectorAll('canvas').length };
}"""


async def run_one(browser, width, name, locale, url):
    ctx = await browser.new_context(viewport={"width": width, "height": 900 if width > 500 else 844}, reduced_motion=args.motion)
    await ctx.add_init_script(INIT)
    page = await ctx.new_page()
    row = {"page": name, "locale": locale, "width": width, "url": url}
    try:
        resp = await page.goto(url, wait_until="networkidle", timeout=90000)
        row["status"] = resp.status if resp else None
        h = await page.evaluate("document.documentElement.scrollHeight")
        for y in range(0, min(h, 16000), 700):
            await page.evaluate(f"window.scrollTo(0,{y})")
            await page.wait_for_timeout(80)
        await page.evaluate("window.scrollTo(0,0)")
        await page.wait_for_timeout(1500)
        await page.evaluate("window.__qaRaf = 0; window.__qaText = 0; window.__qaTextSamples = []")
        await page.wait_for_timeout(2000)
        idle = await page.evaluate("({ raf: window.__qaRaf, text: window.__qaText, samples: window.__qaTextSamples })")
        row["rafPerSec"] = idle["raf"] / 2
        row["textMutations"] = idle["text"]
        row["textSamples"] = idle["samples"]
        row.update(await page.evaluate(MEASURE))
    except Exception as e:  # noqa: BLE001
        row["error"] = str(e)[:300]
    await ctx.close()
    return row


def offending(r):
    return bool(r.get("running") or r.get("cssLong") or r.get("rafPerSec", 0) > 2 or r.get("textMutations") or r.get("smoothScroll") or "error" in r)


async def main():
    widths = [int(w) for w in args.widths.split(",")]
    jobs = [(w, *r) for w in widths for r in page_urls(args.base.rstrip("/"), args.locales.split(","), select(args.templates))]
    report, sem = [], asyncio.Semaphore(args.jobs)
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        async def worker(job):
            async with sem:
                r = await run_one(browser, *job)
                print(f"{r['page']:18} {r['locale']:7} {r['width']:5} running {len(r.get('running', [])):3}  cssLong {sum(x['count'] for x in r.get('cssLong', [])):4}"
                      f"  raf/s {r.get('rafPerSec', 0):5}  text {r.get('textMutations', 0):3}  smooth {int(bool(r.get('smoothScroll')))}"
                      f"{'  ERROR ' + r['error'] if 'error' in r else ''}", flush=True)
                report.append(r)

        await asyncio.gather(*(worker(j) for j in jobs))
        await browser.close()
    report.sort(key=lambda r: (r["page"], r["locale"], r["width"]))
    summary = {
        "base": args.base, "loads": len(report), "offendingLoads": sum(1 for r in report if offending(r)),
        "runningAnimations": sum(len(r.get("running", [])) for r in report),
        "cssLongElements": sum(x["count"] for r in report for x in r.get("cssLong", [])),
        "loadsWithRafLoop": sum(1 for r in report if r.get("rafPerSec", 0) > 2),
        "loadsWithTextMotion": sum(1 for r in report if r.get("textMutations")),
        "loadsWithSmoothScroll": sum(1 for r in report if r.get("smoothScroll")),
        "errors": sum(1 for r in report if "error" in r),
    }
    if args.out:
        pathlib.Path(args.out).write_text(json.dumps({"summary": summary, "pages": report}, indent=1, ensure_ascii=False))
    print(json.dumps(summary, indent=1))
    sys.exit(1 if summary["offendingLoads"] else 0)

asyncio.run(main())
