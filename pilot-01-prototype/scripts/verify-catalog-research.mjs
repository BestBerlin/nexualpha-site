#!/usr/bin/env node
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {officialCampaignResearchByVenue as records} from '../src/data/official-campaign-research.js';
import {exchangeResearch} from '../src/data/exchange-research.js';
import {officialResearchUrl} from '../src/data/official-campaign-model.js';
const req=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer=req('puppeteer-core');
const base=process.argv[2] ?? 'http://127.0.0.1:4174';
const out=resolve(process.argv[3] ?? '../artifacts/v3-research-20260907/catalog');
await mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-first-run','--no-default-browser-check']});
const results=[];
try {
 const page=await browser.newPage();
 for(const width of [390,768,1440]) {
  await page.setViewport({width,height:width===390?844:1000,deviceScaleFactor:1});
  for(const slug of Object.keys(records)) for(const kind of ['profile','research']) {
   const errors=[]; const listener=e=>errors.push(e.message);page.on('pageerror',listener);
   const path=kind==='profile'?`/exchanges/${slug}`:`/activities/research/${slug}`;
   await page.goto(`${base}${path}?locale=zh-Hant`,{waitUntil:'networkidle0',timeout:30000});
   const result=await page.evaluate(()=>({
    title:document.querySelector('h1')?.textContent,
    overflow:document.documentElement.scrollWidth>innerWidth+1,
    brokenImages:[...document.images].filter(i=>!i.complete || !i.naturalWidth).map(i=>i.src),
    links:[...document.querySelectorAll('main a[href]')].map(a=>({href:a.href,text:a.textContent})),
    decisions:document.querySelectorAll('.venue-decision').length,
    research:!!document.querySelector('.official-research-page__reward'),
    build:document.documentElement.dataset.build,
   }));
   page.off('pageerror',listener);
   const problems=[];
   if(!result.title || result.title==='404') problems.push('missing title');
   if(result.overflow) problems.push('horizontal overflow');
   if(result.brokenImages.length) problems.push('broken images');
   if(kind==='profile' && result.decisions!==3) problems.push('missing decision content');
   if(kind==='profile' && !result.links.some(l=>new URL(l.href).pathname===`/activities/research/${slug}`)) problems.push('missing research link');
   if(kind==='research' && (!result.research || !result.links.some(l=>new URL(l.href).pathname===`/exchanges/${slug}`))) problems.push('missing profile return/research');
   const officialLinks=result.links.filter(l=>new URL(l.href).origin!==new URL(base).origin);
   for(const link of officialLinks) if(!officialResearchUrl(link.href,slug) && !(exchangeResearch[slug]?.sources ?? []).some(s=>new URL(s.url).href===link.href)) problems.push(`unapproved source domain ${new URL(link.href).hostname}`);
   if(errors.length) problems.push(...errors);
   if(['binance','uniswap','hyperliquid'].includes(slug)) await page.screenshot({path:`${out}/${kind}-${slug}-zh-Hant-${width}.png`,fullPage:true});
   results.push({kind,slug,width,build:result.build,sourceLinks:officialLinks.length,problems});
  }
  console.log(`catalog progress ${results.length}/126`);
 }
} finally {await browser.close();}
const summary={cases:results.length,failures:results.filter(r=>r.problems.length),results};
await writeFile(`${out}/summary.json`,JSON.stringify(summary,null,2));
console.log(JSON.stringify({cases:summary.cases,failures:summary.failures.length,out}));
if(summary.failures.length) process.exitCode=1;
