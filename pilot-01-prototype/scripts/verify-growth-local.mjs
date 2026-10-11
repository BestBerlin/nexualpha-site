import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const require=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer=require('puppeteer-core');
const base=process.env.GROWTH_URL || 'http://127.0.0.1:4199';
const output=path.resolve('../artifacts/growth-local');
await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-first-run']});
const locales=['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','ja','ko','ar','tr','ru','id','vi','it','ur','uk'];
const sizes=[{width:390,height:844},{width:768,height:1024},{width:1440,height:1000}];
const routes=['/','/exchanges/binance','/compare/binance-vs-okx','/rates','/topics/derivatives'];
const jobs=locales.flatMap(locale=>sizes.flatMap(size=>routes.map(route=>({locale,size,route}))));
const results=[];
try {
 await Promise.all(Array.from({length:3},async()=>{
  const page=await browser.newPage();
  while(jobs.length){
   const job=jobs.shift();const errors=[];
   const onError=err=>errors.push(err.message); const onConsole=message=>{if(message.type()==='error' && /hydration|hydrating|Minified React error/i.test(message.text()))errors.push(message.text());};
   page.on('pageerror',onError);page.on('console',onConsole);
   await page.setViewport(job.size);
   try {
    const response=await page.goto(`${base}${job.route}?locale=${job.locale}&analytics_test=1`,{waitUntil:'networkidle2',timeout:30000});
    const measurements=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,lang:document.documentElement.lang,dir:document.documentElement.dir,h1:document.querySelector('h1')?.textContent,h1Width:document.querySelector('h1')?.getBoundingClientRect().width,cta:document.querySelectorAll('a[href*="accounts.binance.com/register"]').length,text:document.getElementById('root')?.textContent.length}));
    const failures=[...errors];
    if(response.status()!==200)failures.push(`HTTP ${response.status()}`);
    if(measurements.scrollWidth>measurements.width+1)failures.push('horizontal overflow');
    if(job.size.width===390&&measurements.h1Width<200)failures.push('heading collapsed into narrow track');
    if(!measurements.text||measurements.text<100)failures.push('missing body');
    if(measurements.lang!==({'zh-Hans':'zh-CN','zh-Hant':'zh-TW'}[job.locale]||job.locale))failures.push(`locale mismatch ${measurements.lang}`);
    if(job.locale==='ar'&&measurements.dir!=='rtl')failures.push('missing RTL');
    if(['en','zh-Hans','ar'].includes(job.locale)&&[390,1440].includes(job.size.width)){
     await page.screenshot({path:path.join(output,`${job.locale}-${job.size.width}-${job.route.replaceAll('/','_')||'home'}.png`)});
    }
    results.push({...job,measurements,failures});
   }catch(error){results.push({...job,failures:[error.message]});}
   page.off('pageerror',onError);page.off('console',onConsole);
   if(results.length%30===0)process.stdout.write(`Checked ${results.length}/225\n`);
  }
  await page.close();
 }));
 await writeFile(path.join(output,'browser-matrix.json'),JSON.stringify({base,createdAt:new Date().toISOString(),results},null,2));
 const failed=results.filter(result=>result.failures.length);
 console.log(JSON.stringify({total:results.length,failed:failed.length,examples:failed.slice(0,12)},null,2));
 if(failed.length)process.exitCode=1;
}finally{await browser.close();}
