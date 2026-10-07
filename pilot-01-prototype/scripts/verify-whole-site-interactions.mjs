import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer=require('puppeteer-core');
const base=process.env.AUDIT_URL||'http://127.0.0.1:4199';
const out=path.resolve('../artifacts/whole-site',process.env.AUDIT_LABEL||'final');
await mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const checks=[];
const page=await browser.newPage();
const go=async(route,locale='zh-Hans')=>{
 const url=new URL(route,base);url.searchParams.set('locale',locale);url.searchParams.set('analytics_test','1');
 await page.goto(url.href,{waitUntil:'networkidle2'});
 // SSR content is present before hydration; wait for the route's interactive
 // shell before querying selectors so a slow client bundle cannot create a
 // false zero-card/zero-article failure.
 await page.waitForFunction(() => document.readyState === 'complete');
 if (new URL(url).pathname === '/news' || new URL(url).pathname.startsWith('/news/')) {
  await page.waitForFunction(() => document.querySelectorAll('.news-grid > article').length > 0 || !document.querySelector('[aria-busy="true"]'), { timeout: 10000 }).catch(() => {});
 }
 await new Promise((resolve) => setTimeout(resolve, 150));
};
async function check(name,fn){
 try{await fn();checks.push({name,status:'pass'});console.log('PASS',name);}
 catch(error){checks.push({name,status:'fail',error:error.message,url:page.url()});console.log('FAIL',name,error.message);await page.screenshot({path:path.join(out,`interaction-failure-${checks.length}.png`)});}
}
try{
 for(const width of [390,1440]){
  await page.setViewport({width,height:900});
  await check(`${width}: directory category and fee sorting`,async()=>{
   await go('/exchanges');
   assert.equal((await page.$$('.yellow-card')).length,21);
   await (await page.$$('.yellow-pages__tab'))[2].click();
   assert.ok((await page.$$('.yellow-card')).length>0);
   assert.ok((await page.$$eval('.yellow-card__category',els=>els.map(e=>e.textContent))).every(t=>t==='DEX'));
   await page.select('#yp-sort','fee');assert.ok((await page.$$('.yellow-card')).length>0);
  });
  await check(`${width}: directory filter toggles restore the result set`,async()=>{
   await go('/exchanges');await (await page.$$('.yellow-pages__tab'))[2].click();
   const total=(await page.$$('.yellow-card')).length;
   await (await page.$$('.yellow-pages__chip'))[3].click();
   const filtered=(await page.$$('.yellow-card')).length;assert.ok(filtered<total);
   if(filtered===0){
    const empty=await page.$('.yellow-pages__empty');assert.ok(empty,'No explicit empty result state');
    await (await empty.$('button')).click();assert.ok((await page.$$('.yellow-card')).length>0);
   }else{
    await (await page.$$('.yellow-pages__chip'))[3].click();assert.equal((await page.$$('.yellow-card')).length,total);
   }
  });
  await check(`${width}: search opens, reports no match, closes by Escape`,async()=>{
   await go('/exchanges');await page.keyboard.down('Control');await page.keyboard.press('k');await page.keyboard.up('Control');
   await page.waitForSelector('[role="dialog"] input');
   assert.equal(await page.$eval('[role="dialog"] input',el=>document.activeElement===el),true);
   await page.type('[role="dialog"] input','no-such-platform-xyz');
   await page.waitForSelector('[role="dialog"] [role="status"]');
   await page.keyboard.press('Escape');assert.equal(await page.$('[role="dialog"]'),null);
  });
  await check(`${width}: search result navigates to a valid detail page`,async()=>{
   await go('/exchanges');await page.keyboard.down('Control');await page.keyboard.press('k');await page.keyboard.up('Control');
   await page.waitForSelector('[role="dialog"] input');await page.type('[role="dialog"] input','Binance');
   await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.keyboard.press('Enter')]);
   assert.ok(new URL(page.url()).pathname.startsWith('/exchanges/binance'));
   assert.ok((await page.$eval('h1',el=>el.textContent)).includes('Binance'));
  });
  await check(`${width}: news filters recover and article opens`,async()=>{
   await go('/news');const all=(await page.$$('.news-grid > article')).length;assert.ok(all>=6);
   await (await page.$$('.news-tabs button'))[2].click();
   if((await page.$$('.news-grid > article')).length===0){
    assert.ok(await page.$('.news-grid-section > .news-article-card button'));
    await page.click('.news-grid-section > .news-article-card button');
   }else await (await page.$$('.news-tabs button'))[0].click();
   assert.equal((await page.$$('.news-grid > article')).length,all);
   await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.click('.news-article-card__read-link')]);
   assert.ok(await page.$('.news-detail__title'));assert.ok((await page.$eval('.news-detail-container',el=>el.textContent)).length>1000);
  });
  await check(`${width}: article language switch updates body and canonical together`,async()=>{
   await go('/news/cex-vs-dex-vs-perp-dex');
   const title=await page.title();await page.select('header select','en');
   await page.waitForFunction(()=>document.documentElement.lang==='en');
   await page.waitForFunction(old=>document.title!==old,{},title);
   await page.waitForSelector('.news-detail__title, h1', { visible: true });
   await page.waitForFunction(() => {
     const heading = (document.querySelector('.news-detail__title') || document.querySelector('h1'))?.textContent?.trim();
     return Boolean(heading && document.title.includes(heading));
   });
   const seo=await page.evaluate(()=>({title:document.title,h1:(document.querySelector('.news-detail__title')||document.querySelector('h1'))?.textContent?.trim()||'',canonical:document.querySelector('link[rel="canonical"]').href,schema:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent))}));
   assert.ok(seo.h1.length > 0, 'localized news detail must retain a visible title');
   assert.ok(seo.title.includes(seo.h1));assert.equal(new URL(seo.canonical).search,'');
   assert.ok(seo.schema.some(s=>s['@type']==='NewsArticle'&&s.headline===seo.h1));
  });
  await check(`${width}: article metadata survives client hydration`,async()=>{
   await go('/news/tokenized-treasuries-structure-access-risks','en');
   await page.waitForSelector('.news-detail__title');
   await page.waitForFunction(()=>document.readyState==='complete');
   const seo=await page.evaluate(()=>({title:document.title,h1:document.querySelector('.news-detail__title')?.textContent?.trim()||'',robots:document.querySelector('meta[name="robots"]')?.content||''}));
   assert.ok(seo.title.includes(seo.h1),`hydrated title must retain article title, got: ${seo.title}`);
   assert.equal(seo.robots,'index,follow');
  });
  await check(`${width}: three-platform comparison and research disclosure`,async()=>{
   await go('/compare/binance-vs-okx-vs-bybit');
   assert.equal((await page.$$('.v3-versus-side')).length,3);
   const panels=await page.$$('.v3-versus-side');assert.ok((await panels[2].evaluate(el=>el.textContent)).includes('Bybit'));
   const details=await page.$('details.research-references');assert.ok(details);
   await (await details.$('summary')).click();assert.equal(await details.evaluate(el=>el.open),true);
   assert.ok((await details.evaluate(el=>el.innerText)).length>100);
   assert.ok(await page.$('meta[name="robots"][content*="noindex"]'));
  });
  await check(`${width}: deep research FAQs expand`,async()=>{
   await go('/activities/research/binance');const details=await page.$('.official-research__faq details');assert.ok(details);
   await (await details.$('summary')).click();assert.equal(await details.evaluate(el=>el.open),true);
   assert.ok((await details.$eval('p',el=>el.innerText)).length>20);
  });
  await check(`${width}: factbook platform navigation`,async()=>{
   await go('/factbook/binance');const link=await page.$('.factbook-nav a:not([aria-current="page"])');assert.ok(link);
   const href=await link.evaluate(el=>el.href);assert.ok(new URL(href).pathname.startsWith('/factbook/'));
   await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),link.click()]);
   assert.equal(new URL(page.url()).pathname,new URL(href).pathname);
   assert.equal(await page.$eval('link[rel="canonical"]',el=>new URL(el.href).pathname),new URL(href).pathname);
   await page.goBack({waitUntil:'networkidle2'});assert.equal(new URL(page.url()).pathname,'/factbook/binance');
   assert.ok((await page.$eval('h1',el=>el.textContent)).includes('Binance'));
  });
  await check(`${width}: embedded calculator changes with keyboard`,async()=>{
   await go('/embed/calculator');const before=await page.$eval('.bleed-vol-value',el=>el.textContent);
   await page.focus('.bleed-slider');await page.keyboard.press('ArrowRight');
   const after=await page.$eval('.bleed-vol-value',el=>el.textContent);assert.notEqual(after,before);
   assert.equal((await page.$$('h1')).length,1);
  });
  await check(`${width}: both partner embeds load the calculator and can reach its action`,async()=>{
   await go('/partners');
   // The first option is the Brazil widget, whose route is intentionally a
   // regional decision page rather than the generic fee calculator. Exercise
   // the two calculator variants here; Brazil has its own dedicated embed
   // contract covered by the international CTA checks.
   for(const index of [1,2]){
    await (await page.$$('.guide-type-btn'))[index].click();
    const iframe=await page.$('.guide-preview-canvas iframe');const frame=await iframe.contentFrame();
    await frame.waitForSelector('.bleed-slider');assert.equal(new URL(frame.url()).pathname,'/embed/calculator');
    await frame.$eval('.bleed-cta-btn',el=>el.scrollIntoView({block:'center'}));
    const geometry=await frame.$eval('.bleed-cta-btn',el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:innerHeight}});
    assert.ok(geometry.top>=0&&geometry.bottom<=geometry.height);
    const code=await page.$eval('.guide-code-pre',el=>el.innerText);
    assert.ok(code.includes('/embed/calculator?locale='));assert.ok(!code.includes('scrolling="no"'));assert.ok(!code.includes('#analyzer'));
   }
  });
 }
 await check('news feed failure renders an explicit state',async()=>{
  await page.setRequestInterception(true);
  const intercept=request=>request.url().includes('/content/news-feed.json')?request.respond({status:503,contentType:'application/json',body:'{}'}):request.continue();
  page.on('request',intercept);
  try{await go('/news','de');assert.equal((await page.$$('.news-grid > article')).length,0);assert.ok((await page.$eval('.news-grid-section',el=>el.innerText)).includes('temporarily unavailable'));}
  finally{page.off('request',intercept);await page.setRequestInterception(false);}
 });
 const build=await (await fetch(`${base}/version.json`)).json();
 const result={base,build,createdAt:new Date().toISOString(),passed:checks.filter(c=>c.status==='pass').length,failed:checks.filter(c=>c.status==='fail').length,checks};
 await writeFile(path.join(out,'interactions.json'),JSON.stringify(result,null,2));
 if(result.failed)process.exitCode=1;
}finally{await browser.close();}
