"""clicklat.py BASE [path] [runs] [trace]
Click latency on home: PerformanceObserver 'event' (processing + duration) and 'longtask' per action.
With trace=1 also sums CDP trace events (style recalc / layout / script) per action."""
import asyncio,sys,json
from playwright.async_api import async_playwright
BASE=sys.argv[1]; PATH=sys.argv[2] if len(sys.argv)>2 else '/'; RUNS=int(sys.argv[3]) if len(sys.argv)>3 else 3
TRACE=len(sys.argv)>4 and sys.argv[4]=='1'
OBS='''()=>{window.__ev=[];window.__lt=[];
new PerformanceObserver(l=>{for(const e of l.getEntries())if(['click','pointerdown','pointerup','keydown'].includes(e.name))__ev.push({n:e.name,d:e.duration,p:e.processingEnd-e.processingStart,i:e.processingStart-e.startTime})}).observe({type:'event',durationThreshold:16,buffered:false});
new PerformanceObserver(l=>{for(const e of l.getEntries())__lt.push(Math.round(e.duration))}).observe({type:'longtask'});}'''
import os
ONLY=os.environ.get('ONLY','')
ACTIONS=[
 ('node', '#top .rf-node[data-on="true"]:not([data-active="true"])', '.rf'),
 ('intent', '.rf-intent[aria-checked="false"]', '.rf'),
 ('swap', '.cl-swap', '#compare'),
 ('chip', '.cl-chip:not(:has(input:checked)):not([data-other])', '#compare'),
 ('slotA', '.cl-id--a', '#compare'),
]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(channel='chromium',args=['--disable-gpu'])
    pg=await b.new_page(viewport={'width':1440,'height':900})
    import os,re as _re
    RW=os.environ.get('CSSRW','')
    if RW:
      async def h(route):
        r=await route.fetch(); css=await r.text()
        if RW.startswith('REPL:'):
          for pair in RW[5:].split('|||'):
            a,b2=pair.split('=>'); css=css.replace(a,b2)
        else: css=_re.sub(r'(?<=[{}])([^{}@]*(?:'+RW+')[^{}]*)\{[^{}]*\}','',css)
        await route.fulfill(response=r,body=css)
      await pg.route('**/*.css',h)
    await pg.goto(BASE+PATH,wait_until='networkidle',timeout=90000); await pg.wait_for_timeout(2500)
    await pg.evaluate(OBS)
    if os.environ.get('THROTTLE'):
      c2=await pg.context.new_cdp_session(pg); await c2.send('Emulation.setCPUThrottlingRate',{'rate':float(os.environ['THROTTLE'])})
    cdp=await pg.context.new_cdp_session(pg) if TRACE else None
    res={}
    for name,sel,sec in ACTIONS:
      if ONLY and name not in ONLY.split(','): continue
      res[name]=[]
      for r in range(RUNS):
        await pg.evaluate(f'document.querySelector({json.dumps(sec)}).scrollIntoView({{block:"start"}})'); await pg.wait_for_timeout(500)
        await pg.evaluate('__ev.length=0;__lt.length=0')
        loc=pg.locator(sel).nth(r % max(1, await pg.locator(sel).count()))
        if TRACE:
          ev=[]; cdp.on('Tracing.dataCollected',lambda m: ev.extend(m['value']))
          done=asyncio.get_event_loop().create_future(); cdp.once('Tracing.tracingComplete',lambda m: done.set_result(1))
          await cdp.send('Tracing.start',{'categories':'devtools.timeline,blink','transferMode':'ReportEvents'})
        await loc.click(); await pg.wait_for_timeout(1200)
        tr={}
        if TRACE:
          await cdp.send('Tracing.end'); await done
          for e in ev:
            if e.get('ph')=='X' and e.get('name') in ('UpdateLayoutTree','Layout','FunctionCall','EventDispatch','Paint','PrePaint','RunMicrotasks','TimerFire','FireAnimationFrame','ParseAuthorStyleSheet','RecalculateStyles'):
              tr[e['name']]=tr.get(e['name'],0)+e.get('dur',0)/1000
          tr={k:round(v) for k,v in tr.items() if v>=5}
        d=await pg.evaluate('({ev:__ev.slice(),lt:__lt.slice()})')
        clicks=[e for e in d['ev'] if e['n']=='click']
        res[name].append({'click_proc':[round(e['p']) for e in clicks],'click_dur':[round(e['d']) for e in clicks],'other':[(e['n'],round(e['p']),round(e['d'])) for e in d['ev'] if e['n']!='click'],'longtasks':d['lt'],**({'trace':tr} if TRACE else {})})
      print(name, json.dumps(res[name]))
    await b.close()
asyncio.run(main())
