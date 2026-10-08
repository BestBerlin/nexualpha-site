from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for n in ("home","compare","binance"):
        for w,tag in ((1440,"1440"),(390,"390")):
            pg=b.new_page(viewport={"width":w,"height":900})
            pg.goto(f"file:///home/claude/directions/C/{n}.html"); pg.wait_for_timeout(1200)
            ov=pg.evaluate("document.documentElement.scrollWidth")
            print(n,w,"scrollW",ov,"h",pg.evaluate("document.documentElement.scrollHeight"))
            pg.screenshot(path=f"/home/claude/directions/C/shots/{n}-{tag}.png",full_page=True); pg.close()
