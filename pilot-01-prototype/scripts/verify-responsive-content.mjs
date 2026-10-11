import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const base=process.env.AUDIT_URL||'http://127.0.0.1:4202';
const out=path.resolve(process.env.CONTENT_AUDIT_OUT||'artifacts/responsive-content');await mkdir(out,{recursive:true});
const browser=await require('puppeteer-core').launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const locales=process.env.CONTENT_AUDIT_SMOKE?['zh-Hans']:['en','zh-Hans','zh-Hant','pt-BR','es','fr','de','ja','ko','ar','tr','ru','id','vi','it','ur','uk'];
const jobs=[];
for(const locale of locales)for(const width of process.env.CONTENT_AUDIT_SMOKE?[390]:[320,390,768,1440])for(const route of ['/compare/binance-vs-okx','/factbook/binance','/'])jobs.push({locale,width,route});
if(!process.env.CONTENT_AUDIT_SMOKE)for(const locale of ['en','zh-Hans','zh-Hant','pt-BR','ar'])for(const route of ['/compare/binance-vs-okx','/factbook/binance','/'])jobs.push({locale,width:390,route,large:true});
const results=[];const build=await(await fetch(base+'/version.json')).json();
try{
 await Promise.all(Array.from({length:3},async()=>{
  const page=await browser.newPage();await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  while(jobs.length){const job=jobs.shift(),failures=[];
   try{
    await page.setViewport({width:job.width,height:844});await page.goto(`${base}${job.route}?locale=${job.locale}`,{waitUntil:'networkidle2'});await page.evaluate(()=>document.fonts.ready);
    if(job.large)await page.addStyleTag({content:':root {font-size:32px !important;}'});
    const data=await page.evaluate(()=>{
     const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};};
     const targets=[...document.querySelectorAll('h1,.factbook-copy-btn,.factbook-audit-box,.factbook-preview-toggle-btn,.factbook-activation-cta,.v3-venue-hero>p,.v3-versus-card,.v3-versus-btn,.bleed-analyzer__container,.bleed-label,.bleed-venue-btn,.bleed-type-btn,.bleed-cta-btn,.fee-terminal__cta-btn')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>({class:e.className,tag:e.tagName,text:e.innerText.slice(0,70),...rect(e)}));
     const wrapper=document.querySelector('.fee-terminal__table-wrapper');
     return {width:innerWidth,targets,fee:wrapper?{overflowX:getComputedStyle(wrapper).overflowX,clientWidth:wrapper.clientWidth,scrollWidth:wrapper.scrollWidth}:null};
    });
    if(!data.targets.some(t=>t.tag==='H1'))failures.push('missing measured heading');
    for(const el of data.targets)if(el.left< -2||el.right>job.width+2)failures.push(`clipped ${el.tag}.${el.class}: ${el.left.toFixed(1)}..${el.right.toFixed(1)}`);
    if(job.route.startsWith('/compare')&&!data.targets.some(t=>t.class==='v3-versus-btn'))failures.push('missing compare CTA');
    if(job.route==='/'&&!data.fee)failures.push('missing fee table');
    if(data.fee&&data.fee.scrollWidth>data.fee.clientWidth+2&&!['auto','scroll'].includes(data.fee.overflowX))failures.push(`fee table not user-scrollable (${data.fee.overflowX})`);
    if(data.fee){
     const reached=await page.evaluate(()=>{const w=document.querySelector('.fee-terminal__table-wrapper'),a=w.querySelector('.fee-terminal__cta-btn');if(!a)return {visible:false,href:null};w.scrollLeft=document.dir==='rtl'?-w.scrollWidth:w.scrollWidth;const r=a.getBoundingClientRect(),b=w.getBoundingClientRect();return {visible:r.left>=Math.max(b.left,0)-2&&r.right<=Math.min(b.right,innerWidth)+2,href:a.getAttribute('href')};});
     if(!reached.href)failures.push('fee CTA href missing');
     if(!reached.visible)failures.push('fee CTA not reachable at horizontal scroll end');
    }
    const name=`${job.route==='/'?'home':job.route.startsWith('/factbook')?'factbook':'compare'}-${job.locale}-${job.width}${job.large?'-large':''}`;
    if(failures.length||(job.locale==='zh-Hans'&&[390,1440].includes(job.width))){
     await page.screenshot({path:path.join(out,name+'.png'),fullPage:false});
     if(job.route.startsWith('/compare')){await page.$eval('.v3-versus-card',e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:path.join(out,name+'-card.png'),fullPage:false});}
    }
    results.push({...job,failures,data});
   }catch(e){results.push({...job,failures:[e.message]});}
  }
  await page.close();
 }));
 const finalBuild=await(await fetch(base+'/version.json')).json();
 if(finalBuild.buildId!==build.buildId)throw new Error('Build changed during responsive audit');
 const report={base,build,total:results.length,failed:results.filter(r=>r.failures.length).length,results};
 await writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({total:report.total,failed:report.failed,examples:results.filter(r=>r.failures.length).slice(0,4).map(r=>({...r,data:undefined}))},null,2));if(report.failed)process.exitCode=1;
}finally{await browser.close();}
