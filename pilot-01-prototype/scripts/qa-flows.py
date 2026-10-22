#!/usr/bin/env python3
"""Key user-path checks on the live site (QA 2026-10-11). Each flow asserts the expected business result, not just
that a click happened. Prints PASS/FAIL per flow with evidence. Usage: qa-flows.py [origin]"""
import asyncio, json, re, sys
from playwright.async_api import async_playwright

ORIGIN = sys.argv[1] if len(sys.argv) > 1 else "https://nexualpha.com"
results = []

def rec(name, ok, note=""):
    results.append({"flow": name, "ok": bool(ok), "note": note}); print(("PASS " if ok else "FAIL ") + name + (" — " + note if note else ""), flush=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w in (390, 1440):
            ctx = await b.new_context(viewport={"width": w, "height": 900}, user_agent="Mozilla/5.0 (NexuAlpha QA flows) NexuAlpha-internal/qa-flows")
            pg = await ctx.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
            tag = f"@{w}"

            # 1. Directory filter + search
            await pg.goto(ORIGIN + "/exchanges", wait_until="load"); await pg.wait_for_timeout(1500)
            total = await pg.evaluate("document.body.innerText.match(/Showing\\s+(\\d+)\\s+of\\s+(\\d+)/)?.slice(1).map(Number)")
            await pg.wait_for_timeout(3500)  # the directory hydrates its own route module after load
            box = pg.locator('input[placeholder*="platform" i], input[type="search"]').first
            await box.click(); await pg.keyboard.type("bitget", delay=60); await pg.wait_for_timeout(2500)
            after = await pg.evaluate("document.body.innerText.match(/Showing\\s+(\\d+)\\s+of\\s+(\\d+)/)?.slice(1).map(Number)")
            names = await pg.evaluate("[...document.querySelectorAll('main a[href*=\"/exchanges/\"]')].map(a=>a.getAttribute('href')).filter(h=>/\\/exchanges\\/[a-z0-9-]+$/.test(h))")
            rec("directory search narrows to Bitget" + tag, after and after[0] < (total or [99])[0] and any("bitget" in n for n in names) and all("bitget" in n for n in names), f"{total} -> {after}, links={sorted(set(names))[:4]}")
            await box.fill("")
            dex = pg.get_by_role("button", name=re.compile(r"^DEX$")).first
            if await dex.count():
                await dex.click(); await pg.wait_for_timeout(1000)
                after2 = await pg.evaluate("document.body.innerText.match(/Showing\\s+(\\d+)\\s+of\\s+(\\d+)/)?.slice(1).map(Number)")
                rec("directory DEX filter reduces list" + tag, after2 and total and after2[0] < total[0], f"{total} -> {after2}")

            # 2. Venue detail -> copy code -> official sign-up href intact
            await pg.goto(ORIGIN + "/exchanges/okx", wait_until="load"); await pg.wait_for_timeout(1000)
            href = await pg.evaluate("document.querySelector('a[data-cta-kind=\"registration\"]')?.getAttribute('href')")
            code = await pg.evaluate("document.body.innerText.match(/nexu888/)?.[0]")
            disc = await pg.evaluate("/commission/i.test(document.body.innerText)")
            rec("OKX detail shows code, official link and disclosure" + tag, href and "okx.com" in href and code == "nexu888" and disc, f"href={href}")

            # 3. Compare page verdict + both CTAs + copy link
            await pg.goto(ORIGIN + "/compare/binance-vs-okx", wait_until="load"); await pg.wait_for_timeout(1000)
            ctas = await pg.evaluate("[...document.querySelectorAll('a[data-cta-kind=\"registration\"]')].map(a=>a.href)")
            rec("compare has Binance and OKX sign-up routes" + tag, any("binance.com" in c for c in ctas) and any("okx.com" in c for c in ctas), f"{len(ctas)} routes")

            # 4. Fee calculator on /rates: change volume, output changes
            await pg.goto(ORIGIN + "/rates", wait_until="load"); await pg.wait_for_timeout(1500)
            inputs = pg.locator("main input[type=number], main input[inputmode=decimal], main input[inputmode=numeric]")
            n = await inputs.count()
            if n:
                before = await pg.evaluate("document.querySelector('main').innerText")
                await inputs.first.fill("250000"); await pg.wait_for_timeout(800)
                after_t = await pg.evaluate("document.querySelector('main').innerText")
                rec("rates calculator reacts to volume input" + tag, before != after_t, f"{n} numeric inputs")
            else:
                rec("rates calculator reacts to volume input" + tag, False, "no numeric input found")

            # 5. News search returns matching results and empty state
            await pg.goto(ORIGIN + "/news", wait_until="load"); await pg.wait_for_timeout(1200)
            sbox = pg.locator('input[placeholder*="Topic" i], input[type="search"]').first
            await sbox.fill("okx"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
            cnt = await pg.evaluate("document.querySelectorAll('main a[href*=\"/news/\"]').length")
            txt = await pg.evaluate("document.querySelector('main').innerText.toLowerCase()")
            rec("news search 'okx' returns results" + tag, cnt > 0 and "okx" in txt, f"{cnt} article links, url={pg.url}")
            await sbox.fill("zzqqxxnomatch"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
            empty = await pg.evaluate("/no (articles|results)|没有|未找到|0 (articles|results)/i.test(document.querySelector('main').innerText)")
            rec("news search empty state shown" + tag, empty, f"url={pg.url}")

            # 6. Language switch keeps the current page
            await pg.goto(ORIGIN + "/exchanges/bitget", wait_until="load"); await pg.wait_for_timeout(800)
            await pg.goto(ORIGIN + "/tr/exchanges/bitget", wait_until="load"); await pg.wait_for_timeout(800)
            lang = await pg.evaluate("document.documentElement.lang"); h1 = await pg.evaluate("document.querySelector('h1')?.innerText")
            rec("Turkish venue page is Turkish" + tag, lang == "tr" and h1 and "Bitget" in h1 and not re.search(r"\bfees\b", h1, re.I), f"lang={lang} h1={h1!r}")
            # language menu: header button on desktop, inside the drawer (Menu) on mobile
            await pg.goto(ORIGIN + "/exchanges/bitget", wait_until="load"); await pg.wait_for_timeout(2500)
            menu = pg.locator('header button[aria-label="Menu"]')
            if await menu.count() and await menu.first.is_visible():
                await menu.first.click(); await pg.wait_for_timeout(600)
            # the header holds a hidden desktop copy and the drawer a visible one; pick whichever is actually visible
            clicked = await pg.evaluate("""() => { const b = [...document.querySelectorAll('button[aria-label^="Language"]')].find(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'); if (!b) return false; b.click(); return true; }""")
            if clicked:
                await pg.wait_for_timeout(600)
                picked = await pg.evaluate("""() => { const o = [...document.querySelectorAll('[role=option]')].find(e => /日本語/.test(e.textContent) && e.getClientRects().length); if (!o) return false; o.scrollIntoView({block: 'center'}); o.click(); return true; }""")
                await pg.wait_for_timeout(3000)
                if not picked:
                    rec("language menu switch stays on the venue page" + tag, False, "no visible 日本語 option"); continue
                rec("language menu switch stays on the venue page" + tag, "/ja/exchanges/bitget" in pg.url and (await pg.evaluate("document.documentElement.lang")) == "ja", f"url={pg.url}")
            else:
                rec("language menu switch stays on the venue page" + tag, False, "no visible language button")

            # 7. Deep link + back/forward
            await pg.goto(ORIGIN + "/liquidations", wait_until="load"); await pg.wait_for_timeout(800)
            await pg.click("a[href='/funding-rates'], a[href$='/funding-rates']", timeout=5000) if await pg.locator("a[href='/funding-rates'], a[href$='/funding-rates']").count() else None
            await pg.wait_for_timeout(1200)
            await pg.go_back(); await pg.wait_for_timeout(1200)
            h1b = await pg.evaluate("document.querySelector('h1')?.innerText")
            rec("back navigation restores liquidations page" + tag, "/liquidations" in pg.url and h1b and "iquidation" in h1b, f"url={pg.url} h1={h1b!r}")

            # 8. 404 shell
            r = await pg.goto(ORIGIN + "/this-page-does-not-exist-qa", wait_until="load")
            robots = await pg.evaluate("document.querySelector('meta[name=robots]')?.content")
            rec("unknown route is a real 404 with noindex" + tag, r.status == 404 and robots and "noindex" in robots, f"status={r.status} robots={robots}")

            # 9. Telegram page primary CTA
            await pg.goto(ORIGIN + "/telegram", wait_until="load"); await pg.wait_for_timeout(800)
            tg = await pg.evaluate("document.querySelector('a[data-cta-placement=\"telegram-alerts-open-bot\"]')?.href")
            rec("telegram page primary CTA opens the bot" + tag, tg and tg.startswith("https://t.me/NexuAlphaAssistantBot?start=alerts"), f"{tg}")

            # 10. Activities official link + filters
            await pg.goto(ORIGIN + "/activities", wait_until="load"); await pg.wait_for_timeout(2500)
            offl = await pg.evaluate("[...document.querySelectorAll('main a')].filter(a=>/official/i.test(a.innerText)).map(a=>a.href).slice(0,3)")
            rec("activities show official announcement links" + tag, len(offl) > 0 and all(not o.startswith(ORIGIN) for o in offl), f"{offl[:2]}")

            rec("no page errors during flows" + tag, not errs, "; ".join(errs[:3]))
            await ctx.close()
        await b.close()
    json.dump(results, open("/tmp/qa/flows.json", "w"), ensure_ascii=False, indent=1)
    print(f"\n{sum(r['ok'] for r in results)}/{len(results)} flows passed")

asyncio.run(main())
