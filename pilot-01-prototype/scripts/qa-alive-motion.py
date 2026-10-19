import asyncio,json,pathlib
from playwright.async_api import async_playwright
OUT=pathlib.Path('docs/evidence/alive-motion'); OUT.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch()
  results=[]
  for locale in ['en','ar']:
   for width in [390,768,1440]:
    page=await browser.new_page(viewport={'width':width,'height':900})
    await page.add_init_script("window.cls=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.cls+=e.value})).observe({type:'layout-shift',buffered:true})")
    await page.goto('http://localhost:4188/'+('' if locale=='en' else locale),wait_until='networkidle')
    await page.wait_for_timeout(2500)
    item=page.locator('.nx-ticker__item').first
    x=await item.evaluate('(e)=>e.getBoundingClientRect().left')
    await page.evaluate('window.cls=0')
    await page.wait_for_timeout(6000)
    y=await item.evaluate('(e)=>e.getBoundingClientRect().left')
    cls=await page.evaluate('window.cls')
    # Deterministic response injection exercises real feed consumer without depending on market volatility.
    count=0
    async def feed(route):
     nonlocal count
     count+=1
     price=80000+count*100
     await route.fulfill(json={'generatedAt':'2026-10-19T00:00:00Z','source':'qa-injected','items':[{'sym':s,'price':f'${price:,}','change':'+1.00%','dir':'up'} for s in ['BTC','ETH','SOL','BNB','XRP']]})
    await page.route('**/api/ticker.json',feed)
    await page.wait_for_function("document.querySelector('[data-tk=\"BTC-p\"][data-flash]')",timeout=16000,polling=20)
    flash=await page.locator('[data-tk="BTC-p"]').first.get_attribute('data-flash')
    await page.locator('.nx-ticker').screenshot(path=str(OUT/f'{locale}-{width}-flash.png'))
    await page.wait_for_timeout(750)
    removed=await page.locator('[data-tk="BTC-p"]').first.get_attribute('data-flash') is None
    await page.emulate_media(reduced_motion='reduce')
    animation=await page.locator('.nx-ticker__track').evaluate('(e)=>getComputedStyle(e).animationName')
    result={'locale':locale,'width':width,'leftBefore':x,'leftAfter6s':y,'delta':y-x,'cls6s':cls,'flash':flash,'flashRemoved':removed,'reducedAnimation':animation}
    results.append(result)
    assert abs(y-x)>10,result
    assert cls==0,result
    assert removed and animation=='none',result
    await page.close()
  await browser.close()
  (OUT/'measurements.json').write_text(json.dumps(results,indent=2))
  print(json.dumps(results,indent=2))
asyncio.run(main())
