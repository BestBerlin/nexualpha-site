import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer=require('puppeteer-core');
const base='http://127.0.0.1:4200';
const out='../artifacts/international-cta/frozen-extra';await mkdir(out,{recursive:true});
const server=createServer((req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(`<!doctype html><html lang="pt-BR"><title>Publisher test fixture</title><body style="margin:0"><iframe title="Custos em BRL" width="100%" height="900" src="${base}/embed/calculator?market=BR&product=spot&publisher=publisher_fixture&utm_source=embed_widget"></iframe></body></html>`);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const checks=[];
try{
const page=await browser.newPage();await page.setViewport({width:390,height:844});await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle2'});
const frame=await(await page.$('iframe')).contentFrame();await frame.waitForSelector('[data-testid="brazil-cost-embed"]');
const href=await frame.$eval('.br-cost-embed__link',e=>e.href);assert.ok(href.startsWith(base+'/br/custos'));assert.match(href,/publisher=publisher_fixture/);checks.push('Different-origin publisher iframe loads Brazil widget and links back to NexuAlpha with publisher context');
await page.goto(base+'/br?market=BR&product=spot&platform=okx',{waitUntil:'networkidle2'});
await page.screenshot({path:out+'/brazil-mobile-first-screen.png'});
const geo=await page.$eval('.br-decision-primary a',e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,height:e.getBoundingClientRect().height}));assert.ok(geo.height>=44);assert.ok(geo.bottom<=780,`Primary CTA obscured by mobile navigation: ${JSON.stringify(geo)}`);checks.push({check:'Mobile primary registration CTA geometry',...geo});
await page.setViewport({width:1440,height:900});await page.screenshot({path:out+'/brazil-desktop-first-screen.png'});
await page.setViewport({width:720,height:900});await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert.ok((await page.$eval('h1',e=>e.textContent)).length>10);checks.push('200 percent text at 720px reflows without horizontal overflow');
await page.goto(base+'/br?locale=ar&market=BR&product=spot',{waitUntil:'networkidle2'});assert.equal(await page.$eval('html',e=>e.dir),'rtl');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));checks.push('Arabic shell uses RTL and Portuguese original content stays readable');
await page.keyboard.press('Tab');const focused=await page.evaluate(()=>({tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineStyle}));assert.ok(['A','BUTTON','SELECT','INPUT','SUMMARY'].includes(focused.tag));checks.push({check:'Keyboard enters semantic interactive controls',...focused});
await writeFile(out+'/results.json',JSON.stringify({status:'pass',build:await(await fetch(base+'/version.json')).json(),checks},null,2));console.log(JSON.stringify(checks,null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
