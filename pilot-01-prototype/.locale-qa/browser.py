# coding: utf-8
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(__file__).parent
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for width in [390,768,1440]:
  page=browser.new_page(viewport={'width':width,'height':900})
  for prefix,locale,dir in [('ur','ur','rtl'),('uk-ua','uk','ltr')]:
   for suffix in ['', '/exchanges','/exchanges/okx','/news','/about']:
    errors=[]
    def onerror(e): errors.append(str(e))
    def console(m):
     if m.type=='error' and ('hydration' in m.text.lower() or 'minified react' in m.text.lower()): errors.append(m.text)
    page.on('pageerror',onerror);page.on('console',console)
    response=page.goto('http://127.0.0.1:4189/'+prefix+suffix,wait_until='networkidle')
    page.locator('main').wait_for()
    page.wait_for_timeout(1000)
    state=page.evaluate('''() => ({lang:document.documentElement.lang,dir:document.documentElement.dir,h1:document.querySelector('h1')?.textContent,robots:document.querySelector('meta[name="robots"]')?.content,overflow:document.documentElement.scrollWidth>innerWidth+2})''')
    assert response.status==200,(prefix,suffix,response.status)
    assert state['lang']==locale and state['dir']==dir,state
    assert state['h1'],state
    assert state['robots']=='noindex,follow',state
    assert not errors,(prefix,suffix,width,errors)
    assert not state['overflow'],(prefix,suffix,width,state)
    page.screenshot(path=str(out/(prefix+'-'+(suffix.replace('/','-') or 'home')+'-'+str(width)+'.png')))
    results.append(dict(path='/'+prefix+suffix,width=width,**state,errors=errors))
    page.remove_listener('pageerror',onerror);page.remove_listener('console',console)
  page.close()
 browser.close()
(out/'browser-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(f'PASS: {len(results)} built SSR/hydration pages, 390/768/1440, no page/hydration errors or horizontal overflow')
