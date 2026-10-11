#!/usr/bin/env python3
"""V4 accessibility sweep: axe-core (WCAG 2.1 A/AA) on the whole document plus a keyboard focus-visibility walk, for
every page template (scripts/qa_templates.py) x locale x width.

Usage: python3 scripts/qa-axe-sweep.py [base_url] [out.json] [--locales en,zh-hans,ar,tr] [--widths 390,1440]
                                       [--templates home,news] [--stops 60] [--jobs 4]
Start a server first (`npm run build` then `PORT=8601 node server.mjs`, or `npx vite --port 5174`).
axe-core comes from node_modules/axe-core (devDependency) or AXE_PATH.

Focus walk: presses Tab up to --stops times; for every focused element it compares outline, box-shadow, border,
background, colour and text-decoration (of the element, its ::before/::after and its two nearest ancestors) with the
same element unfocused. A stop with no visible difference is reported as "no-focus-style".
Exit 1 when any serious/critical axe violation or any no-focus-style stop is found.
"""
import argparse, asyncio, json, os, pathlib, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playwright.async_api import async_playwright  # noqa: E402
from qa_templates import page_urls, select  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("base", nargs="?", default="http://localhost:5174")
ap.add_argument("out", nargs="?")
ap.add_argument("--locales", default="en,zh-hans,ar,tr")
ap.add_argument("--widths", default="390,1440")
ap.add_argument("--templates")
ap.add_argument("--stops", type=int, default=60)
ap.add_argument("--jobs", type=int, default=4)
ap.add_argument("--no-focus", action="store_true")
ap.add_argument("--approx", action="store_true", help="second contrast pass with background images removed (axe cannot resolve text over gradients; review its findings by hand)")
args = ap.parse_args()
AXE_FILE = pathlib.Path(os.environ.get("AXE_PATH") or ROOT / "node_modules/axe-core/axe.min.js")
AXE = AXE_FILE.read_text()

AXE_RUN = """async () => {
  const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations', 'incomplete'] });
  window.__qaIncomplete = r.incomplete.filter(v => v.id === 'color-contrast').reduce((n, v) => n + v.nodes.length, 0);
  return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length,
    nodes: v.nodes.slice(0, 6).map(n => ({ target: n.target.join(' '), html: n.html.slice(0, 160), summary: (n.failureSummary || '').slice(0, 300) })) }));
}"""

# axe leaves text over background gradients / pseudo content as "needs review". The approximate pass removes every
# background image (the page gradients are near-transparent rulings over the #07080A canvas) and re-runs the contrast
# rule, so text over decorative gradients is checked against the solid colour underneath.
APPROX = """async () => {
  const st = document.createElement('style'); st.id = 'qa-approx';
  st.textContent = '*, *::before, *::after { background-image: none !important; }';
  document.head.appendChild(st);
  const r = await axe.run(document, { runOnly: ['color-contrast'], resultTypes: ['violations'] });
  st.remove();
  return r.violations.flatMap(v => v.nodes.map(n => ({ target: n.target.join(' '), html: n.html.slice(0, 120), summary: (n.failureSummary || '').split('\\n').pop().slice(0, 200) })));
}"""

# Signature of everything that could draw a focus indicator.
SIG = """() => {
window.__qaSig = (el) => {
  const pick = (cs) => [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.outlineOffset, cs.boxShadow, cs.borderTopColor, cs.borderBottomColor,
    cs.borderBottomWidth, cs.backgroundColor, cs.color, cs.textDecorationLine, cs.textDecorationColor, cs.opacity].join('|');
  const parts = [];
  let node = el;
  for (let i = 0; i < 3 && node && node.nodeType === 1; i++, node = node.parentElement) {
    parts.push(pick(getComputedStyle(node)));
    if (i === 0) { parts.push(pick(getComputedStyle(node, '::before'))); parts.push(pick(getComputedStyle(node, '::after'))); }
  }
  return parts.join('#');
};
window.__qaOutline = (el) => { const cs = getComputedStyle(el); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && !/rgba\\(\\d+, \\d+, \\d+, 0\\)|transparent/.test(cs.outlineColor); };
}"""
SNAPSHOT = """() => {
  const sel = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable=true], iframe';
  window.__qaBase = new Map();
  for (const el of document.querySelectorAll(sel)) window.__qaBase.set(el, window.__qaSig(el));
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  return window.__qaBase.size;
}"""
PROBE = """() => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  const r = el.getBoundingClientRect();
  const name = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const text = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 50);
  const base = window.__qaBase.get(el);
  const now = window.__qaSig(el);
  const visible = r.width > 0 && r.height > 0;
  return { name, text, visible, focusVisible: el.matches(':focus-visible'), outline: window.__qaOutline(el), changed: base === undefined ? true : base !== now, key: name + '|' + text + '|' + Math.round(r.x) + ',' + Math.round(r.y + scrollY) };
}"""


async def focus_walk(page, stops):
    await page.evaluate(SIG)
    await page.evaluate(SNAPSHOT)
    seen, bad, count = set(), [], 0
    for _ in range(stops):
        await page.keyboard.press("Tab")
        await page.wait_for_timeout(30)  # let focus transitions (1 ms under reduced motion) reach their end value
        info = await page.evaluate(PROBE)
        if info is None:
            break
        if info["key"] in seen:
            break
        seen.add(info["key"])
        count += 1
        if info["visible"] and not (info["outline"] or info["changed"]):
            bad.append({"el": info["name"], "text": info["text"]})
    return count, bad


async def run_one(browser, width, name, locale, url, stops, do_focus):
    ctx = await browser.new_context(viewport={"width": width, "height": 900 if width > 500 else 844}, reduced_motion="reduce")
    page = await ctx.new_page()
    row = {"page": name, "locale": locale, "width": width, "url": url}
    try:
        resp = await page.goto(url, wait_until="networkidle", timeout=90000)
        row["status"] = resp.status if resp else None
        await page.wait_for_timeout(700)
        await page.add_script_tag(content=AXE)
        row["violations"] = await page.evaluate(AXE_RUN)
        row["contrastNeedsReview"] = await page.evaluate("window.__qaIncomplete")
        if args.approx:
            row["approxContrast"] = await page.evaluate(APPROX)
        if do_focus:
            await page.evaluate("window.scrollTo(0,0)")
            row["focusStops"], row["noFocusStyle"] = await focus_walk(page, stops)
    except Exception as e:  # noqa: BLE001
        row["error"] = str(e)[:300]
    await ctx.close()
    return row


async def main():
    widths = [int(w) for w in args.widths.split(",")]
    jobs = [(w, *r) for w in widths for r in page_urls(args.base.rstrip("/"), args.locales.split(","), select(args.templates))]
    report, sem = [], asyncio.Semaphore(args.jobs)
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        async def worker(job):
            async with sem:
                row = await run_one(browser, *job, args.stops, not args.no_focus)
                v = row.get("violations", [])
                ser = sum(x["count"] for x in v if x["impact"] in ("serious", "critical"))
                nf = len(row.get("noFocusStyle", []))
                print(f"{row['page']:18} {row['locale']:7} {row['width']:5} serious/critical {ser:3}  focus-missing {nf:3}/{row.get('focusStops', 0):3}"
                      f"  {','.join(sorted({x['id'] for x in v if x['impact'] in ('serious', 'critical')}))}{'  ERROR ' + row['error'] if 'error' in row else ''}", flush=True)
                report.append(row)

        await asyncio.gather(*(worker(j) for j in jobs))
        await browser.close()
    report.sort(key=lambda r: (r["page"], r["locale"], r["width"]))
    serious = sum(x["count"] for r in report for x in r.get("violations", []) if x["impact"] in ("serious", "critical"))
    nofocus = sum(len(r.get("noFocusStyle", [])) for r in report)
    stops = sum(r.get("focusStops", 0) for r in report)
    errors = sum(1 for r in report if "error" in r)
    by_rule = {}
    for r in report:
        for x in r.get("violations", []):
            if x["impact"] in ("serious", "critical"):
                by_rule[x["id"]] = by_rule.get(x["id"], 0) + x["count"]
    summary = {"base": args.base, "loads": len(report), "errors": errors, "seriousCriticalNodes": serious, "byRule": by_rule,
               "contrastNeedsReview": sum(r.get("contrastNeedsReview", 0) for r in report),
               "approxContrastNodes": sum(len(r.get("approxContrast", [])) for r in report),
               "focusStops": stops, "focusStopsWithoutVisibleStyle": nofocus}
    if args.out:
        pathlib.Path(args.out).write_text(json.dumps({"summary": summary, "pages": report}, indent=1, ensure_ascii=False))
    print(json.dumps(summary, indent=1))
    sys.exit(1 if serious or nofocus or errors else 0)

asyncio.run(main())
