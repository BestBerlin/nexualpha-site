#!/usr/bin/env python3
"""axe-core sweep of the editorial templates (article, news index, topic and factbook hubs) in en and ar.

Usage: python3 scripts/editorial-axe.py [base_url] [out.json] [article-slug]
Runs axe-core (node_modules/axe-core/axe.min.js, WCAG 2.1 A/AA tags) at 390 and 1440 px with reduced motion and
fails (exit 1) when any serious or critical violation is found. Start a server first (npx vite --port 5174).
"""
import asyncio, json, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5174"
OUT = sys.argv[2] if len(sys.argv) > 2 else None
SLUG = sys.argv[3] if len(sys.argv) > 3 else None
AXE = (ROOT / "node_modules/axe-core/axe.min.js").read_text()

async def first_article(page):
    await page.goto(BASE + "/news", wait_until="networkidle")
    href = await page.eval_on_selector(".news-lead__title a, .news-row__title a", "a => new URL(a.href).pathname")
    return href.rsplit("/", 1)[-1]

async def main():
    report, serious = [], 0
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        slug = SLUG
        for width, height in [(390, 844), (1440, 900)]:
            ctx = await browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
            page = await ctx.new_page()
            if not slug:
                slug = await first_article(page)
            for locale in ["en", "ar"]:
                prefix = "" if locale == "en" else f"/{locale}"
                for name, path in [("article", f"/news/{slug}"), ("news", "/news"), ("topics", "/topics"), ("factbook", "/factbook")]:
                    await page.goto(BASE + prefix + path, wait_until="networkidle", timeout=60000)
                    await page.wait_for_timeout(800)
                    await page.add_script_tag(content=AXE)
                    result = await page.evaluate("""async () => {
                      const r = await axe.run(document.querySelector('main') || document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
                      return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target.join(' '), summary: n.failureSummary })), count: v.nodes.length }));
                    }""")
                    bad = [v for v in result if v["impact"] in ("serious", "critical")]
                    serious += sum(v["count"] for v in bad)
                    report.append({"page": name, "locale": locale, "width": width, "violations": result})
                    print(f"{name:9} {locale} {width:5}  serious/critical: {sum(v['count'] for v in bad):3}  other: {sum(v['count'] for v in result if v not in bad)}  {', '.join(sorted({v['id'] for v in result}))}")
            await ctx.close()
        await browser.close()
    if OUT:
        pathlib.Path(OUT).write_text(json.dumps({"base": BASE, "article": slug, "serious": serious, "pages": report}, indent=2))
    print("TOTAL serious/critical nodes:", serious)
    sys.exit(1 if serious else 0)

asyncio.run(main())
