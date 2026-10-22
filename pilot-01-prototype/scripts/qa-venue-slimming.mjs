import { localizedHref } from '../src/data/locale-routing.js';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { internalFetch } from "./lib/internal-http.mjs";
// UA "NexuAlpha-internal/qa-venue-slimming", paced to 2 req/s against remote hosts (scripts/lib/internal-http.mjs).
const fetch = internalFetch("qa-venue-slimming");
const require = createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer = require('puppeteer-core');
const root = new URL('../docs/venue-page-slimming/browser/', import.meta.url);
await mkdir(root, { recursive: true });
if (process.argv.includes('--styles-only')) {
 const base=process.env.QA_BASE_URL || 'http://127.0.0.1:4188';
 const response=await fetch(base + localizedHref('/exchanges/binance',{locale:'zh-Hans'}));
 const html=await response.text();
 const sheets=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0].match(/href="([^"]+)"/)?.[1]).filter(Boolean);
 let linkedReferral=false, linkedDisclosure=false;
 for(const href of sheets){const css=await(await fetch(new URL(href,base))).text();linkedReferral ||= css.includes('.referral-native-answers');linkedDisclosure ||= css.includes('.venue-section-disclosure');}
 const evidence={linkedReferral,linkedDisclosure,stylesheetCount:sheets.length,source:'Local built SSR stylesheet links; no browser measurement'};
 await writeFile(new URL('../stylesheet-evidence.json',root),JSON.stringify(evidence,null,2)+'\n');
 console.log(evidence);
 process.exit(response.ok && linkedReferral && linkedDisclosure ? 0 : 1);
}
const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-first-run','--no-default-browser-check']});
const results=[];
try {
 for (const width of [344,390,1440]) for (const locale of ['zh-Hans','ja','ko']) {
  const context=await browser.createBrowserContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error' && /hydrat|Minified React error/.test(m.text())) errors.push(m.text());});
  await page.setCacheEnabled(false);
  await page.setViewport({width,height:width<500?844:1000,isMobile:width<500,hasTouch:width<500,deviceScaleFactor:1});
  await page.setUserAgent(width<500?'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
  await page.evaluateOnNewDocument(()=>{
   window.__shifts=[];
   new PerformanceObserver(list=>{for(const e of list.getEntries()) if(!e.hadRecentInput) window.__shifts.push({value:e.value,time:e.startTime,sources:e.sources?.map(s=>s.node?.className)});}).observe({type:'layout-shift',buffered:true});
  });
  const response=await page.goto(`${process.env.QA_BASE_URL||'http://127.0.0.1:4188'}${localizedHref('/exchanges/binance',{locale})}`,{waitUntil:'networkidle0'});
  await page.evaluate(()=>document.fonts.ready);
  await new Promise(resolve=>setTimeout(resolve,1500));
  const sample=await page.evaluate(()=>{
   let max=0,sum=0,start=0,last=0;
   for(const e of window.__shifts){if(e.time-last>1000||e.time-start>5000){sum=0;start=e.time;}sum+=e.value;last=e.time;max=Math.max(max,sum);}
   return {lang:document.documentElement.lang,path:location.pathname,announcements:document.querySelectorAll('.venue-announcement-preview > li').length,cls:max,shifts:window.__shifts,height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,placeholder:/\bN\/A\b|尚未核验|尚未核驗/.test(document.querySelector('main').innerText)};
  });
  // Read the complete visible page before assessing below-fold targets.
  for(let y=0;y<sample.height;y+=700){await page.evaluate(y=>scrollTo(0,y),y);await new Promise(resolve=>setTimeout(resolve,40));}
  const expandedChecks=[];
  for (const details of await page.$$('.venue-section-disclosure')) {
   await details.evaluate(el=>{el.open=true;});
   expandedChecks.push(await details.evaluate(el=>({placeholder:/\bN\/A\b|尚未核验|尚未核驗/.test(el.innerText),englishLabels:[...el.querySelectorAll('th')].map(e=>e.innerText).filter(t=>/^(Key facts|Official source|Last checked|Country|Regulator|Status|License type)$/.test(t))})));
   await details.evaluate(el=>{el.open=false;});
  }
  const controls=await page.evaluate(()=>[...document.querySelectorAll('.venue-section-disclosure > summary, .v3-activity-panel a')].filter(el=>el.getClientRects().length).map(el=>({text:el.textContent.trim(),height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width})));
  const disclosure=await page.$('.venue-section-disclosure > summary');
  let opens=null;
  if(disclosure){await disclosure.click();opens=await disclosure.evaluate(el=>el.parentElement.open);await disclosure.click();opens=opens && await disclosure.evaluate(el=>!el.parentElement.open);}
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:new URL(`${locale}-${width}.png`,root).pathname,fullPage:true});
  results.push({locale,width,status:response.status(),...sample,expandedChecks,controls,disclosureOpens:opens,errors});
  await context.close();
 }
} finally {await browser.close();}
await writeFile(new URL('results.json',root),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results.map(({shifts,controls,...r})=>({...r,shortControls:controls.filter(c=>c.height<44||c.width<44)})),null,2));
if(results.some(r=>r.lang!==r.locale||r.expandedChecks.some(c=>c.placeholder||c.englishLabels.length)||r.announcements>5||r.disclosureOpens!==true||r.status!==200||r.cls>=0.05||r.overflow||r.placeholder||r.errors.length||r.controls.some(c=>c.height<44||c.width<44))) process.exitCode=1;
