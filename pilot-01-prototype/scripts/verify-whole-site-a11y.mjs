import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';
const require=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');const puppeteer=require('puppeteer-core'),axe=require('axe-core');
const base=process.env.AUDIT_URL||'http://127.0.0.1:4199',label=process.env.AUDIT_LABEL||'baseline';const out=path.resolve('../artifacts/whole-site',label);await mkdir(out,{recursive:true});
const routes=['/','/exchanges','/exchanges/binance','/compare/binance-vs-okx','/activities','/activities/research/binance','/news','/news/verify-official-crypto-exchange-website','/topics/derivatives','/factbook/binance','/rates','/onchain','/methodology','/embed/calculator','/partners','/ref/crypto-zhang'];
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const results=[];
const jobs=routes.flatMap(route=>(process.env.AUDIT_MODE==='baseline'?['zh-Hans']:['en','zh-Hans']).flatMap(locale=>(process.env.AUDIT_MODE==='baseline'?[390]:[390,1440]).map(width=>({route,locale,width}))));
const build=await(await fetch(`${base}/version.json`)).json();
try{
 await Promise.all(Array.from({length:2},async()=>{
  const page=await browser.newPage();
  while(jobs.length){
   const job=jobs.shift();await page.setViewport({width:job.width,height:900});
   await page.goto(`${base}${job.route}?locale=${job.locale}`,{waitUntil:'networkidle2'});await page.addScriptTag({content:axe.source});
   const result=await page.evaluate(async()=>{
    const report=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});
    return {violations:report.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html}))})),passes:report.passes.length,incomplete:report.incomplete.length};
   });
   results.push({...job,...result});console.log(job.route,job.locale,job.width,JSON.stringify(result.violations.map(v=>[v.id,v.nodes.length])));
  }await page.close();
 }));
 const finalBuild=await(await fetch(`${base}/version.json`)).json();
 if(build.buildId!==finalBuild.buildId)throw new Error('Build changed during accessibility acceptance');
 const failed=results.filter(r=>r.violations.length).length;
 await writeFile(path.join(out,'accessibility.json'),JSON.stringify({base,build,createdAt:new Date().toISOString(),total:results.length,failed,results},null,2));
 if(failed)process.exitCode=1;
}finally{await browser.close();}
