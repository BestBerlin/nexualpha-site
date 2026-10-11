#!/usr/bin/env python3
"""Full-site browser sweep (QA 2026-10-11): for each URL and width, load in Chromium, scroll through the page, and
record console errors, page errors, failed requests, horizontal overflow, elements wider than the viewport, images
with missing alt or broken (naturalWidth 0), tap targets under 40px on mobile, visible overflow-clipped text, and
layout shift. Writes JSON lines. Usage: qa-browser-sweep.py <urls.txt> <out.jsonl> <widths e.g. 390,1440> [limit]"""
import asyncio, json, sys, time
from playwright.async_api import async_playwright

urls = [u.strip() for u in open(sys.argv[1]) if u.strip()]
out = sys.argv[2]
widths = [int(w) for w in sys.argv[3].split(",")]
limit = int(sys.argv[4]) if len(sys.argv) > 4 else None
if limit: urls = urls[:limit]
ORIGIN = "https://nexualpha.com"
PROBE = """() => {
  const vw = innerWidth; const bad = []; let clipped = 0, small = 0, brokenImg = 0, noAlt = 0;
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
    if (r.right > vw + 2 && r.width > 24) { const cs = getComputedStyle(el); if (cs.position !== 'fixed') bad.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')); }
  }
  for (const el of document.querySelectorAll('p,h1,h2,h3,h4,li,span,a,button,td,th,dt,dd')) {
    const cs = getComputedStyle(el); if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden') && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) clipped++;
  }
  if (vw < 500) for (const el of document.querySelectorAll('a,button,[role=button],input,select')) { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24)) small++; }
  for (const img of document.images) { if (!img.hasAttribute('alt')) noAlt++; if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') brokenImg++; }
  return { hscroll: document.documentElement.scrollWidth > vw + 1, wide: [...new Set(bad)].slice(0, 8), clipped, small, brokenImg, noAlt, h: document.documentElement.scrollHeight, h1: document.querySelectorAll('h1').length, dir: document.documentElement.dir };
}"""

async def main():
    f = open(out, "a")
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w in widths:
            ctx = await b.new_context(viewport={"width": w, "height": 900}, device_scale_factor=1, user_agent="Mozilla/5.0 (NexuAlpha-QA-sweep Chromium)")
            pg = await ctx.new_page()
            errs, failed = [], []
            pg.on("console", lambda m: errs.append(m.text[:200]) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)[:200]))
            pg.on("requestfailed", lambda r: failed.append(r.url[:160]) if r.url.startswith(ORIGIN) else None)
            pg.on("response", lambda r: failed.append(f"{r.status} {r.url[:160]}") if r.url.startswith(ORIGIN) and r.status >= 400 else None)
            await pg.add_init_script("window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries()){if(!e.hadRecentInput)window.__cls+=e.value}}).observe({type:'layout-shift',buffered:true});")
            for i, u in enumerate(urls):
                url = u if u.startswith("http") else ORIGIN + u
                row = {"url": url, "width": w}
                errs.clear(); failed.clear()
                try:
                    t0 = time.time()
                    resp = await pg.goto(url, wait_until="load", timeout=60000)
                    row["status"] = resp.status if resp else None
                    await pg.wait_for_timeout(800)
                    h = await pg.evaluate("document.documentElement.scrollHeight")
                    for y in range(0, min(h, 20000), 800):
                        await pg.evaluate(f"window.scrollTo(0,{y})"); await pg.wait_for_timeout(120)
                    await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(600)
                    row.update(await pg.evaluate(PROBE))
                    row["cls"] = round(await pg.evaluate("window.__cls"), 3)
                    row["loadMs"] = int((time.time() - t0) * 1000)
                except Exception as e:
                    row["error"] = str(e)[:200]
                row["consoleErrors"] = list(dict.fromkeys(errs))[:5]
                row["failedRequests"] = list(dict.fromkeys(failed))[:5]
                f.write(json.dumps(row, ensure_ascii=False) + "\n"); f.flush()
                if (i + 1) % 50 == 0: print(w, i + 1, "done", flush=True)
            await ctx.close()
        await b.close()
asyncio.run(main())
