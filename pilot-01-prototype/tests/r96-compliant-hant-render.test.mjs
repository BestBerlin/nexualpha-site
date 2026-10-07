import {assertApprovedResearchMove} from './r189-presentation-contract.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {TOPIC_GUIDES} from '../src/data/topic-guides-data.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const dir=await mkdtemp(path.join(root,'tests/.tmp-r96-render-'));
let rendered;
try {
 const entry=path.join(dir,'entry.mjs'),bundle=path.join(dir,'bundle.cjs');
 await writeFile(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {TopicGuidePage} from '../../src/components/v3/TopicGuidePage.jsx';const r={};for(const locale of ['en','zh-Hans','zh-Hant'])r[locale]=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug:'compliant-exchanges',locale}));console.log(JSON.stringify(r));`);
 await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',outfile:bundle,loader:{'.css':'empty'},logLevel:'silent'});
 rendered=JSON.parse(execFileSync(process.execPath,[bundle],{encoding:'utf8',maxBuffer:4*1024*1024}));
}finally{await rm(dir,{recursive:true,force:true});}
const hrefs=body=>[...body.matchAll(/href="([^"]*)"/g)].map(m=>m[1].replace(/([?&]|&amp;)tg_expires=\d+/g,'$1tg_expires=DYNAMIC'));
const baselinePath=path.join(root,'docs/evidence/four-week-growth-20260927/r96-before/topic-render-hrefs.json');
if(process.env.R96_CAPTURE_HREF_BASELINE==='1')await writeFile(baselinePath,JSON.stringify(Object.fromEntries(Object.entries(rendered).map(([k,v])=>[k,hrefs(v)])),null,2),{flag:'wx'});
test('explicit Hant nested decision copy is consumed by actual SSR',()=>{
 const body=rendered['zh-Hant'].replaceAll('&amp;','&').replaceAll('&#x27;',"'").replaceAll('&quot;','"');
 const t=TOPIC_GUIDES['compliant-exchanges'];
 for(const [section,fields] of Object.entries({quickStats:['labelZhHant','descZhHant'],painPoints:['titleZhHant','descZhHant'],evaluationPillars:['titleZhHant','descZhHant'],pitfalls:['titleZhHant','descZhHant'],platforms:['categoryZhHant'],telegramCommands:['descZhHant']}))
 for(const item of t[section])for(const field of fields)assert.ok(body.includes(item[field]),`not rendered: ${section}.${field}: ${item[field]}`);
 assert.ok(body.includes(t.titleZhHant));
});
test('compliant research copy does not claim live quantitative audits or guaranteed protection',()=>{
 for(const body of Object.values(rendered))assert.doesNotMatch(body,/统一量化引擎|統一量化引擎|实盘挂单深度|實盤掛單深度|Audited side-by-side|万无一失|萬無一失|全面消除/);
});
test('all existing commercial, research and source hrefs survive unchanged',async()=>{
 const baseline=JSON.parse(await readFile(baselinePath,'utf8'));
 for(const [locale,body]of Object.entries(rendered))assertApprovedResearchMove(hrefs(body),baseline[locale].map(href=>href.replace(/([?&]|&amp;)tg_expires=\d+/g,'$1tg_expires=DYNAMIC')),locale);
});
