import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer=require('puppeteer-core');
const inventory=JSON.parse(await readFile(process.env.ROUTE_INVENTORY||'../docs/evidence/nexualpha-whole-site-route-inventory-20260908.json','utf8'));
const base=process.env.AUDIT_URL||'http://127.0.0.1:4199';
const label=process.env.AUDIT_LABEL||'baseline';
const out=path.resolve('../artifacts/whole-site',label);await mkdir(out,{recursive:true});
const sizes=[{width:390,height:844},{width:768,height:1024},{width:1440,height:1000}];
const jobs=new Map();
function add(route,locale,size){jobs.set(`${route.path}|${locale}|${size.width}`,{...route,locale,size});}
for(const route of inventory.rows)for(const locale of ['en','zh-Hans'])for(const size of [sizes[0],sizes[2]])add(route,locale,size);
const templates=[...new Map(inventory.rows.filter(r=>r.template!=='alias').map(r=>[r.template,r])).values()];
for(const route of templates)for(const locale of inventory.locales)for(const size of sizes)add(route,locale,size);
// Additional boundary routes must not silently become the homepage.
const negative=['/exchanges/not-a-venue','/topics/missing','/factbook/missing','/compare/binance-vs-binance','/compare/binance-vs-missing','/activities/research/missing','/activities/missing','/news/missing','/missing'];
for(const pathname of negative)add({path:pathname,template:'notFound',level:3,expectedStatus:404},'zh-Hans',sizes[0]);
for(const pathname of ['/compare/binance-vs-okx-vs-bybit','/compare/bybit-vs-bitget-vs-okx','/?ref=crypto-zhang','/?utm_source=telegram'])add({path:pathname,template:'dynamic',level:3},'zh-Hans',sizes[0]);
const planned=[...jobs.values()];
const queue=process.env.AUDIT_MODE==='baseline' ? planned.filter(job=>job.locale==='zh-Hans'&&(job.size.width===1440||templates.some(t=>t.path===job.path)||job.expectedStatus===404)) : planned;
const total=queue.length,results=[];
function expectedDocumentLang(job){
 const normalize=locale=>({'zh-Hans':'zh-CN','zh-Hant':'zh-TW'}[locale]||locale);
 if((job.path==='/br'||job.path.startsWith('/br/'))&&job.locale==='en')return 'pt-BR';
 if(job.path==='/news'&&job.expectedStatus!==404){
  return normalize(job.locale);
 }
 if(job.path.startsWith('/news/')&&job.expectedStatus!==404){
  return String(job.locale||'').startsWith('zh')?'zh-Hans':'en';
 }
 return normalize(job.locale);
}
const build=await (await fetch(`${base}/version.json`)).json();
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-first-run']});
try{
 await Promise.all(Array.from({length:3},async()=>{
  let page=await browser.newPage();
  while(queue.length){
   const job=queue.shift();const errors=[];
   const handler=e=>errors.push(e.message);const logger=m=>{if(m.type()==='error'&&/hydration|hydrating|Minified React error|Uncaught/i.test(m.text()))errors.push(m.text());};
   page.on('pageerror',handler);page.on('console',logger);
   const url=new URL(job.path,base);url.searchParams.set('locale',job.locale);
   try{
    await page.setViewport(job.size);
    const response=await page.goto(url.href,{waitUntil:'networkidle2',timeout:30000});
    await page.evaluate(()=>document.fonts?.ready);
    const data=await page.evaluate(()=>{
     const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
     const visible=el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
     const headings=[...document.querySelectorAll('h1')].filter(visible);
     const ids=[...document.querySelectorAll('[id]')].map(el=>el.id),duplicates=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
     const sections=[...document.querySelectorAll('main > section,main > article,main > div')].filter(visible).map(el=>({selector:el.id||el.className,rect:rect(el),text:el.innerText.slice(0,80)}));
     const anchors=[...document.querySelectorAll('a[href]')].filter(visible).map(el=>({href:el.getAttribute('href'),text:el.innerText.slice(0,90)}));
     const brokenImages=[...document.images].filter(el=>visible(el)&&el.complete&&el.naturalWidth===0).map(el=>el.getAttribute('src'));
     return {lang:document.documentElement.lang,dir:document.documentElement.dir,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,h1:headings.map(el=>({text:el.innerText,...rect(el)})),textLength:document.getElementById('root')?.innerText.length||0,duplicates,sections,anchors,brokenImages,title:document.title,canonical:document.querySelector('link[rel=canonical]')?.href,robots:document.querySelector('meta[name=robots]')?.content};
    });
    const failures=[...errors];
    const expectedStatus=job.expectedStatus||200;
    if(response.status()!==expectedStatus)failures.push(`HTTP ${response.status()} expected ${expectedStatus}`);
    if(data.scrollWidth>data.width+2)failures.push(`horizontal overflow ${data.scrollWidth}`);
    const lang=expectedDocumentLang(job);
    if(data.lang!==lang)failures.push(`locale ${data.lang} expected ${lang}`);
    if(lang==='ar'&&data.dir!=='rtl')failures.push('RTL missing');
    if(data.textLength<100)failures.push('missing body');
    if(data.h1.length!==1)failures.push(`visible H1 count ${data.h1.length}`);
    if(data.h1.some(h=>h.x< -2||h.x+h.width>data.width+2))failures.push('H1 clipped outside viewport');
    if(data.h1.some(h=>h.width<170))failures.push('heading in narrow track');
    if(data.duplicates.length)failures.push(`duplicate IDs: ${data.duplicates.join(',')}`);
    if(data.brokenImages.length)failures.push(`broken images: ${data.brokenImages.join(',')}`);
    if(job.expectedStatus===404&&!data.robots?.includes('noindex'))failures.push('404 lacks noindex');
    const name=`${job.locale}-${job.size.width}-${job.path.replace(/[^a-z0-9_-]/gi,'_')||'home'}`;
    if(failures.length||(['zh-Hans','ar'].includes(job.locale)&&[390,1440].includes(job.size.width)&&templates.some(t=>t.path===job.path))){
     // Very long mobile pages exceed Chrome's single-bitmap capture limit.
     // Preserve every vertical segment instead of losing the whole screenshot.
     const capture=async(options)=>{
      try{return await page.screenshot(options);}
      catch(error){
       if(!/capture screenshot/i.test(error.message))throw error;
       await new Promise(resolve=>setTimeout(resolve,300));
       return page.screenshot(options);
      }
     };
     if(data.height>16000){
      for(let y=0;y<data.height;y+=8000)await capture({path:path.join(out,`${name}-part${y/8000+1}.png`),captureBeyondViewport:true,clip:{x:0,y,width:job.size.width,height:Math.min(8000,data.height-y)}});
     }else await capture({path:path.join(out,name+'.png'),fullPage:true});
    }
    results.push({...job,status:response.status(),url:page.url(),failures,data});
   }catch(error){
    results.push({...job,failures:[error.message]});
    // A closed target should fail the current job, then recover the worker so
    // one browser crash does not turn the rest of the acceptance queue into
    // misleading cascading failures.
    if (/TargetCloseError|Target closed|Session closed|Protocol error/i.test(error.message)) {
     try { await page.close(); } catch { /* target is already gone */ }
     page=await browser.newPage();
    }
   }
   const last=results.at(-1);
   if(last.failures.length)console.log(JSON.stringify({path:job.path,locale:job.locale,width:job.size.width,failures:last.failures}));
   page.off('pageerror',handler);page.off('console',logger);
   if(results.length%50===0)console.log(`Checked ${results.length}/${total}; failures=${results.filter(r=>r.failures.length).length}`);
  }
  await page.close();
 }));
 const finalBuild=await (await fetch(`${base}/version.json`)).json();
 if(finalBuild.buildId!==build.buildId)throw new Error('Build changed during acceptance');
 const failed=results.filter(r=>r.failures.length);
 await writeFile(path.join(out,'results.json'),JSON.stringify({base,build,createdAt:new Date().toISOString(),total,failed:failed.length,results},null,2));
 console.log(JSON.stringify({total,failed:failed.length,failures:failed.map(r=>({path:r.path,locale:r.locale,width:r.size.width,issues:r.failures})).slice(0,30)},null,2));
 if(failed.length)process.exitCode=1;
}finally{await browser.close();}
