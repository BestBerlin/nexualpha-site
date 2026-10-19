from playwright.sync_api import sync_playwright
import json, pathlib
out=pathlib.Path(__file__).parent
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch()
    for width in [390,768,1440]:
        page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
        for slug in ['kucoin','gate-io','mexc','coinbase']:
            for anchor in ['source-review','sources']:
                page.goto(f'http://127.0.0.1:5197/ja/exchanges/{slug}#{anchor}',wait_until='networkidle')
                page.wait_for_selector('#source-review')
                page.wait_for_timeout(500)
                # Reapply the hash after hydration so this covers both direct load and browser hash navigation.
                page.evaluate('(hash)=>{location.hash="top"; location.hash=hash}', anchor)
                page.wait_for_timeout(500)
                data=page.evaluate('''(hash)=>{const target=document.getElementById(hash);return {count:document.querySelectorAll('#'+hash).length,tag:target.tagName,top:target.getBoundingClientRect().top,margin:getComputedStyle(target).scrollMarginBlockStart,sourceHub:target.matches('.v3-profile-research-hub')||!!target.closest('.v3-profile-research-hub')}}''',anchor)
                assert data['count']==1 and data['sourceHub'],data
                assert 80 <= data['top'] <= 130,data
                page.screenshot(path=str(out/f'{slug}-{width}-{anchor}.png'))
                results.append({'slug':slug,'width':width,'hash':anchor,**data})
        page.close()
    browser.close()
(out/'results.json').write_text(json.dumps(results,indent=2))
print(f'PASS: {len(results)} hydrated browser hash checks; screenshots and results in {out}')
