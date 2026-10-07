import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { publicCtaForVenue } from '../src/data/public-cta.js';
const require=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer=require('puppeteer-core');
const base=process.env.GROWTH_URL||'http://127.0.0.1:4199';
const out=path.resolve(process.env.GROWTH_OUT||'../artifacts/growth-local');await mkdir(out,{recursive:true});
const expectedCtas=Object.fromEntries(['binance','okx','bybit','bitget'].map(slug=>[slug,publicCtaForVenue(slug,'zh-Hans').registrationUrl]));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const checks=[];
try{
 const page=await browser.newPage(); await page.setViewport({width:1440,height:900});
 await page.goto(`${base}/?locale=zh-Hans&analytics_test=1`,{waitUntil:'networkidle2'});
 await page.waitForSelector('.growth-platform-option');
 const selected=await page.evaluate(()=>document.querySelector('.growth-route-actions__primary')?.href||document.querySelector('[data-cta-placement="home-decision-panel"]')?.href);
 assert.ok(selected===expectedCtas.binance || (selected?.includes('/exchanges/binance?') && selected.includes('#registration-path')),`Unexpected Binance CTA state: ${selected}`);
 const ctaGeometry=await page.$eval('[data-cta-placement="home-decision-panel"]',el=>({bottom:el.getBoundingClientRect().bottom,height:innerHeight}));
 assert.ok(ctaGeometry.bottom<=ctaGeometry.height,`Desktop CTA below fold ${JSON.stringify(ctaGeometry)}`);checks.push('Desktop CTA is visible above fold with verified or research-first Binance route');
 const contextGap=await page.evaluate(()=>document.querySelector('.lean-hero__secondary').getBoundingClientRect().top-document.querySelector('.lean-hero__content').getBoundingClientRect().bottom);
 assert.ok(contextGap>=0&&contextGap<=48,`Desktop heading-to-context gap is stretched: ${contextGap}px`);checks.push('Desktop heading flows into supporting context without a stretched grid gap');
 const initialIntent=await page.$$eval('.growth-intent-switch button',els=>els.map(el=>({text:el.textContent.trim(),decision:el.dataset.growthDecision,placement:el.dataset.growthPlacement,pressed:el.getAttribute('aria-pressed')})));
 assert.deepEqual(initialIntent.map(item=>item.decision),['known_platform','compare_first']);
 assert.equal(initialIntent[0].placement,'home-intent-switch');
 assert.equal(initialIntent[0].pressed,'true');
 await page.click('.growth-intent-switch button[data-growth-decision="compare_first"]');
 await page.waitForFunction(()=>document.querySelector('.growth-compare-shortcuts')?.open===true,{timeout:2000});
 const compareIntentOpen=await page.$eval('.growth-compare-shortcuts',el=>el instanceof HTMLDetailsElement && el.open);
 assert.ok(compareIntentOpen,'Compare intent switch did not expand the compare shortcuts');
 checks.push('Homepage intent switch exposes direct-vs-compare choices and expands compare shortcuts');
 for (const button of await page.$$('.growth-platform-option')) { if ((await button.evaluate(el=>el.textContent)).includes('OKX')) { await button.click(); break; } }
 const okx=await page.$eval('[data-cta-placement="home-decision-panel"]',el=>el.href);
 assert.ok(okx===expectedCtas.okx || (okx.includes('/exchanges/okx?') && okx.includes('#registration-path')),`Unexpected OKX CTA state: ${okx}`);checks.push('Selecting OKX preserves a verified route or research-first route');
 await page.goto(`${base}/rates?locale=zh-Hans&analytics_test=1`,{waitUntil:'networkidle2'});
 const initial=await page.$eval('.cost-decision__amount',el=>el.textContent);
 const ratesArePending=initial.includes('待来源核验');
 assert.ok(ratesArePending||initial.startsWith('50 ')||initial.startsWith('100 '),`Unexpected initial cost state: ${initial}`);
 await page.select('.cost-decision__inputs select','spotFee');
 const spotAmount=await page.$eval('.cost-decision__amount',el=>el.textContent);
 if(ratesArePending) assert.match(spotAmount,/待来源核验/);
 else assert.ok(spotAmount.startsWith('100 '));
 checks.push(ratesArePending?'Cost tool stays fail-closed while fee sources are pending':'100,000 USDT volume costs 50 futures / 100 spot at stored Binance base taker rates');
 const selectors=await page.$$('.cost-decision__inputs select');await selectors[1].select('makerRate');
 const allLinks=await page.$$eval('.cost-decision__cta',els=>els.map(el=>el.href));assert.equal(allLinks.length,4);assert.ok(Object.values(expectedCtas).every(url=>allLinks.includes(url)));checks.push('Cost tool preserves all four constitutional partner routes');
 await page.setViewport({width:390,height:844});
 await page.goto(`${base}/?locale=zh-Hans&analytics_test=1`,{waitUntil:'networkidle2'});
 await page.screenshot({path:path.join(out,'mobile-home-final.png')});
 const mobileDensity=await page.evaluate(()=>{
  const visible=(el)=>{if(!el)return false;const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0;};
  const tickerToggle=document.querySelector('.rebate-ticker__mobile-toggle');
  const tickerPanel=document.querySelector('.rebate-ticker__viewport');
  const tickerRect=tickerToggle?.getBoundingClientRect();
  const visibleCards=[...document.querySelectorAll('.yellow-pages .yellow-card')].filter(visible).length;
  const mobileExpandVisible=visible(document.querySelector('.yellow-pages__expand-count--mobile'));
  const compareDrawer=document.querySelector('.growth-compare-shortcuts');
  return {
   scrollHeight:document.documentElement.scrollHeight,
   tickerToggleVisible:visible(tickerToggle),
   tickerToggleHeight:Math.round(tickerRect?.height||0),
   tickerPanelHidden:!visible(tickerPanel),
   visibleCards,
   mobileExpandVisible,
   compareDrawerClosed:compareDrawer instanceof HTMLDetailsElement && !compareDrawer.open,
   compareShortcutLinks:document.querySelectorAll('.growth-compare-shortcuts__links a').length,
  };
 });
 assert.ok(mobileDensity.tickerToggleVisible,`Mobile source notes toggle is not visible ${JSON.stringify(mobileDensity)}`);
 assert.ok(mobileDensity.tickerToggleHeight<=48,`Mobile source notes toggle is too tall ${JSON.stringify(mobileDensity)}`);
 assert.ok(mobileDensity.tickerPanelHidden,`Mobile source notes panel should be collapsed by default ${JSON.stringify(mobileDensity)}`);
 assert.ok(mobileDensity.visibleCards<=3,`Mobile homepage directory exposes too many cards before expansion ${JSON.stringify(mobileDensity)}`);
 assert.ok(mobileDensity.mobileExpandVisible,`Mobile directory expansion control is not visible ${JSON.stringify(mobileDensity)}`);
 assert.ok(mobileDensity.compareDrawerClosed,`Mobile compare shortcuts should stay collapsed by default ${JSON.stringify(mobileDensity)}`);
 assert.ok(mobileDensity.compareShortcutLinks>=3,`Mobile compare shortcuts lost decision links ${JSON.stringify(mobileDensity)}`);
 assert.ok(mobileDensity.scrollHeight<=16000,`Mobile homepage exceeds scroll budget ${JSON.stringify(mobileDensity)}`);
 checks.push('Mobile homepage keeps source notes, compare shortcuts, directory and research tools collapsed while preserving decision links');
 const mobileHome=await page.$eval('[data-cta-placement="home-decision-panel"]',el=>({bottom:el.getBoundingClientRect().bottom,height:innerHeight}));
 assert.ok(mobileHome.bottom<=mobileHome.height-64,`Mobile homepage CTA below navigation ${JSON.stringify(mobileHome)}`);checks.push('Mobile homepage CTA is visible above the bottom navigation');
 await page.goto(`${base}/exchanges/binance?locale=zh-Hans&analytics_test=1`,{waitUntil:'networkidle2'});
 await page.evaluate(()=>scrollTo(0,1500));await new Promise(resolve=>setTimeout(resolve,250));
 const fixed=await page.$$eval('a[href]',(els,expectedUrl)=>els.filter(el=>{const r=el.getBoundingClientRect();return (el.href===expectedUrl||(el.href.includes('/exchanges/binance?')&&el.href.includes('#registration-path')))&&r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight}).length,expectedCtas.binance);
 assert.ok(fixed>0,'No visible mobile registration link after scrolling');checks.push('Mobile detail retains a visible referral CTA after scrolling');
 const stickyGeometry=await page.$eval('.v3-mobile-sticky-bar',el=>{const r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),height:Math.round(r.height),innerHeight};});
 assert.ok(stickyGeometry.bottom<=stickyGeometry.innerHeight-64,`Mobile detail sticky CTA overlaps bottom navigation ${JSON.stringify(stickyGeometry)}`);
 checks.push('Mobile detail sticky CTA stays above the shared bottom navigation');
 await page.setJavaScriptEnabled(false);
 for(const route of ['/','/exchanges/binance','/compare/binance-vs-okx','/rates','/topics/derivatives']){
  await page.goto(`${base}${route}?locale=zh-Hans`,{waitUntil:'domcontentloaded'});
  assert.ok((await page.$eval('#root',el=>el.textContent.length))>100);assert.ok(await page.$('a[href]'));
 }
 checks.push('Five page types retain readable body and real links with JavaScript disabled');
 console.log(checks.join('\n'));await writeFile(path.join(out,'interactions.json'),JSON.stringify({base,checks,status:'pass'},null,2));
}finally{await browser.close();}
