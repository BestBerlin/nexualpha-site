"""Neutral hero acceptance. BASE=http://127.0.0.1:5178 python3 qa/neutral-hero.py."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE = os.environ.get('BASE', 'http://127.0.0.1:5178').rstrip('/')
OUT = Path(os.environ.get('OUT', Path(__file__).resolve().parents[1] / 'docs/evidence/neutral-hero'))
OUT.mkdir(parents=True, exist_ok=True)
results = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for locale in ['ru', 'vi', 'ar', 'zh-hant', 'ur', 'uk-ua']:
        for width in [390, 768, 1440]:
            page = browser.new_page(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(BASE + '/' + locale, wait_until='networkidle')
            page.locator('[data-testid="neutral-hero-board"]').wait_for()
            page.evaluate('document.fonts.ready')
            hero = page.locator('.h7-hero')
            assert hero.locator('[data-testid="neutral-hero-row"]').count() >= 6
            assert hero.locator('a[href*="/go/"]').count() == 0
            assert not any(code.lower() in hero.inner_text().lower() for code in ['nexu888', '11350287', 'BL686'])
            assert hero.locator('h1').is_visible()
            assert hero.locator('.nh-lead').is_visible()
            assert hero.locator('.nh-actions a').count() == 2
            assert hero.locator('.nh-chip').count() >= 3
            geometry = page.evaluate('''() => {
                const h=document.querySelector('.h7-hero');
                const selectors=['.h7-hc','.nh-board','.nh-chips'];
                const rects=selectors.map(s=>h.querySelector(s).getBoundingClientRect());
                const overlap=rects.some((a,i)=>rects.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
                return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overlap,
                    direction:getComputedStyle(h).direction,
                    actions:[...h.querySelectorAll('.nh-actions a')].map(a=>a.getBoundingClientRect().height)};
            }''')
            assert geometry['scrollWidth'] <= width + 1, geometry
            assert not geometry['overlap'], geometry
            assert min(geometry['actions']) >= 44, geometry
            assert not errors, errors
            if locale in ['ru', 'vi', 'ar', 'zh-hant']:
                page.screenshot(path=str(OUT / f'{locale}-{width}.png'), full_page=True)
            results.append({'locale': locale, 'width': width, **geometry, 'pageErrors': errors})
            print(locale, width, 'PASS', flush=True)
            page.close()
    browser.close()
(OUT / 'playwright-results.json').write_text(json.dumps(results, indent=2))
print(f'{len(results)} checks passed; evidence: {OUT}')
