import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sourcePath = new URL('../src/components/v3/V3Pages.jsx', import.meta.url);
const source = fs.readFileSync(sourcePath, 'utf8');
const f = JSON.parse(fs.readFileSync(new URL('./fixtures/r289-research-flow.json', import.meta.url)));

function verifyResearchBoundaries(text) {
  assert.equal((text.match(/<ResearchComparison profiles=/g) || []).length, 1);
  assert.equal((text.match(/<CompareGoldMatrixNav currentSlugs=/g) || []).length, 1);
  assert.ok(text.includes('placement={`compare-onsite-bot-handoff-${compareSlugKey}`}'));
  assert.match(text, /profiles\.length > 2 && <p className="v3-faq-card__lead"/);
  assert.doesNotMatch(text, /className="v3-compare-research-paths"/);
}
test('comparison research stays unique and preserves scenario-aware Telegram and FAQ scope', () => verifyResearchBoundaries(source));
test('research contract catches duplicate research, missing handoff placement and broadened FAQ scope', () => {
  assert.throws(() => verifyResearchBoundaries(source.replace('<ResearchComparison profiles=', '<ResearchComparison profiles={profiles} /><ResearchComparison profiles=')));
  assert.throws(() => verifyResearchBoundaries(source.replace('placement={`compare-onsite-bot-handoff-${compareSlugKey}`}', 'placement="wrong"')));
  assert.throws(() => verifyResearchBoundaries(source.replace('profiles.length > 2 && <p className="v3-faq-card__lead"', 'profiles.length > 1 && <p className="v3-faq-card__lead"')));
});
test('45 actual React SSR cases keep unique research regions and source-linked registration routes', async () => {
 const {build} = await import('esbuild');
 const path = await import('node:path');
 const {fileURLToPath} = await import('node:url');
 const {execFileSync} = await import('node:child_process');
 const root=fileURLToPath(new URL('../',import.meta.url));
 const temp=fs.mkdtempSync(path.join(root,'tests/.tmp-r289-flow-'));
 try {
  const component=fileURLToPath(sourcePath);
  const entry=path.join(temp,'entry.mjs'),bundle=path.join(temp,'bundle.cjs');
  const locales=Object.keys(f.labels);
  fs.writeFileSync(entry,`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{CompareDeepPage}from${JSON.stringify(component)};import{venueDatabase}from${JSON.stringify(path.join(root,'src/data/venue-database.js'))};const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...a){super(...(a.length?a:['2026-10-06T00:00:00Z']));}static now(){return 1791244800000;}};const venues=Object.values(venueDatabase);console.log(JSON.stringify(${JSON.stringify(locales)}.flatMap(locale=>[['binance','okx'],['uniswap','jupiter'],['binance','okx','bybit']].map(selected=>{const props={copy:{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending'}},locale,selected,venues,market:'unknown',product:'spot'};return{locale,selected,after:renderToStaticMarkup(React.createElement(CompareDeepPage,props))}}))));`);
  await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:bundle,loader:{'.css':'empty'},logLevel:'error'});
  const cases=JSON.parse(execFileSync(process.execPath,[bundle],{cwd:root,encoding:'utf8',maxBuffer:96*1024*1024}));
  assert.equal(cases.length,45);
  const hrefs=html=>[...html.matchAll(/\bhref="([^"]*)"/g)].map(m=>m[1]).sort();
  for(const row of cases){
   const label=`${row.locale}/${row.selected.join('-')}`;
   assert.ok(hrefs(row.after).length > 0, label + ' research and official routes render');
   assert.doesNotMatch(row.after, /(?:undefined|\[object Object\])/);
   assert.equal((row.after.match(/id="research-comparison"/g)||[]).length,1,label);
   assert.ok(row.after.indexOf('id="compare-sources"')<row.after.indexOf('id="research-comparison"'),label);
   assert.equal(row.after.includes('class="v3-compare-research-paths"'),false,label);
   assert.match(row.after, /data-cta-placement="compare-sticky-registration"/, label + ' next-step routing remains explicit');
   for(const id of ['compare-snapshot','hardcore-matrix','decision-guide','compare-faq','compare-sources','compare-versus-card']) assert.equal((row.after.match(new RegExp('id="'+id+'"','g'))||[]).length,1,label+id);
   assert.equal((row.after.match(/class="v3-faq-card__lead" lang=/g)||[]).length,row.selected.length>2?1:0,label+' explicit FAQ scope');
  }
 } finally { fs.rmSync(temp,{recursive:true,force:true}); }
});
