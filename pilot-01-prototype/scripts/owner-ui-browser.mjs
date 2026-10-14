import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer=require('puppeteer-core');
const phase=process.argv[2]||'after';
const root=`docs/evidence/ui-overhaul-owner/${phase}`;await mkdir(root,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const results=[];
try{for(const width of [390,1440]){const page=await browser.newPage();await page.setViewport({width,height:width===390?844:900});await page.goto('http://127.0.0.1:4173/zh-hans',{waitUntil:'networkidle2'});await page.screenshot({path:`${root}/home-${width}.png`});for(const [name,sel] of [['hero','.h7-hero'],['flash','#h7-flash'],['movers','#h7-movers'],['footer','footer']]){const el=await page.$(sel);if(el){await el.evaluate(e=>e.scrollIntoView({block:'center'}));await new Promise(r=>setTimeout(r,1200));await el.screenshot({path:`${root}/${name}-${width}.png`}).catch(()=>{});}}await page.goto('http://127.0.0.1:4173/zh-hans/exchanges/bitget',{waitUntil:'networkidle2'});await page.screenshot({path:`${root}/exchange-${width}.png`,fullPage:true});results.push({width});await page.close();}}finally{await browser.close();}await writeFile(`${root}/results.json`,JSON.stringify(results,null,2));
