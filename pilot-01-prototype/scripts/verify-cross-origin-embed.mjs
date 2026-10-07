import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const require=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer=require('puppeteer-core');
const base=process.env.AUDIT_URL||'http://127.0.0.1:4199';
const out=path.resolve('../artifacts/whole-site',process.env.AUDIT_LABEL||'cross-origin-embed');
await mkdir(out,{recursive:true});
const report={base,build:await(await fetch(`${base}/version.json`)).json(),checks:[],console:[]};
const parent=createServer((_request,response)=>{
 response.writeHead(200,{'content-type':'text/html; charset=utf-8'});
 response.end(`<!doctype html><html lang="en"><title>Independent publisher embed test</title><h1>Independent publisher</h1><iframe title="NexuAlpha calculator" width="460" height="780" src="${base}/embed/calculator?locale=zh-Hans&analytics_test=1"></iframe></html>`);
});
await new Promise(resolve=>parent.listen(0,'127.0.0.1',resolve));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 report.parentOrigin=`http://127.0.0.1:${parent.address().port}`;
 assert.notEqual(new URL(base).origin,report.parentOrigin);
 for(const route of ['/','/partners','/exchanges/binance','/missing','/embed/calculator']){
  const r=await fetch(`${base}${route}`);
  const headers={csp:r.headers.get('content-security-policy'),xfo:r.headers.get('x-frame-options')};
  report.checks.push({route,status:r.status,...headers});
  if(route!=='/embed/calculator'){
   assert.match(headers.csp,/frame-ancestors 'self'/);
   assert.equal(headers.xfo,'SAMEORIGIN');
  }
 }
 const page=await browser.newPage();await page.setViewport({width:1100,height:1000});
 page.on('console',message=>{if(message.type()==='error')report.console.push(message.text());});
 await page.goto(report.parentOrigin,{waitUntil:'networkidle2'});
 const element=await page.$('iframe');const frame=await element.contentFrame();
 await frame.waitForSelector('.bleed-analyzer-section',{timeout:10000});
 const headings=await frame.$$eval('h1',els=>els.map(e=>e.textContent));
 assert.equal(headings.length,1);
 const slider=await frame.$('input[type="range"]');assert.ok(slider,'Calculator input is available to the publisher');
 const before=await slider.evaluate(el=>el.value);await slider.focus();await page.keyboard.press('ArrowRight');
 assert.notEqual(await slider.evaluate(el=>el.value),before,'Embedded calculator responds to keyboard input');
 const widget=report.checks.find(r=>r.route==='/embed/calculator');
 assert.equal(widget.xfo,null);assert.match(widget.csp,/frame-ancestors http: https:/);
 await page.screenshot({path:path.join(out,'publisher-embed.png')});
 report.widgetHeading=headings[0];report.status='pass';
}catch(error){report.status='fail';report.error=error.message;process.exitCode=1;}
finally{
 await writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,error:report.error,parentOrigin:report.parentOrigin},null,2));
 await browser.close();await new Promise(resolve=>parent.close(resolve));
}
