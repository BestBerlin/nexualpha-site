import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const sourcePath = new URL('../src/components/v3/V3Pages.jsx', import.meta.url);
const currentSource = fs.readFileSync(sourcePath, 'utf8');
const cf = JSON.parse(fs.readFileSync(new URL('./fixtures/r289-content-scope.json', import.meta.url)));
let source = currentSource;
for (const [a,b] of [[cf.dictionary,''],[cf.newCondition,cf.oldCondition],[cf.anchor+cf.addition,cf.anchor]]) { assert.equal(source.split(a).length,2); source=source.replace(a,b); }
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),cf.beforeHash);
const f = JSON.parse(fs.readFileSync(new URL('./fixtures/r289-research-flow.json', import.meta.url)));
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
function once(s, a, b) { assert.equal(s.split(a).length, 2, a); return s.replace(a, b); }
function inverse(s) {
 s = once(s, f.dictionary, '');
 s = once(s, f.newSummary, f.oldSummary);
 s = once(s, f.sourceAnchor + f.researchCall, f.sourceAnchor);
 s = once(s, f.movedBlock + f.similarAnchor, f.similarAnchor);
 const anchor = '        </details>\n\n        <p className="v3-relationship-note">{text.relationship}</p>\n      </div>\n    </section>\n\n    {!isPriorityTwoVenueDirectAnswer';
 s = once(s, anchor, anchor.replace('        <p className=', f.oldBlock + '        <p className='));
 assert.equal(sha(s), f.beforeHash);
 return s;
}
test('exact inverse preserves all original JSX facts, invitation calls, props and IDs', () => {
 inverse(source);
 assert.equal((source.match(/<ResearchComparison profiles=/g) || []).length, 1);
 assert.equal((source.match(/<CompareGoldMatrixNav currentSlugs=/g) || []).length, 1);
 assert.doesNotMatch(source, /className="v3-compare-research-paths"/);
 assert.equal(Object.keys(f.labels).length, 15);
 assert.equal(sha(fs.readFileSync(new URL('../src/data/partner-registry.js', import.meta.url))), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
test('negative inverse catches a removed Telegram prop, duplicate research, and foreign href edit', () => {
 assert.throws(() => inverse(source.replace('placement={`compare-onsite-bot-handoff-${compareSlugKey}`}', 'placement="wrong"')));
 assert.throws(() => inverse(source.replace(f.researchCall, f.researchCall + f.researchCall)));
 assert.throws(() => inverse(source.replace('href={pCta.ctaHref}', 'href="https://example.org"')));
});

test('content scope inverse is exact and catches arbitrary condition or FAQ copy mutation', () => {
 const restore = input => {
  for (const [a,b] of [[cf.dictionary,''],[cf.newCondition,cf.oldCondition],[cf.anchor+cf.addition,cf.anchor]]) input=once(input,a,b);
  assert.equal(sha(input),cf.beforeHash);
  return input;
 };
 restore(currentSource);
 assert.throws(() => restore(currentSource.replace('locale === "ar" ? cond.en', 'locale === "ar" ? cond["zh-Hans"]')));
 assert.throws(() => restore(currentSource.replace('profiles.length > 2 && <p className="v3-faq-card__lead"', 'profiles.length > 1 && <p className="v3-faq-card__lead"')));
 assert.equal((cf.dictionary.match(/^ +(?:(?:"[^"\n]+")|[A-Za-z]+):/gm)||[]).length,15);
});

test('45 actual React SSR cases retain invitation href multisets and research facts in new containers', async () => {
 const {build} = await import('esbuild');
 const path = await import('node:path');
 const {fileURLToPath} = await import('node:url');
 const {execFileSync} = await import('node:child_process');
 const root=fileURLToPath(new URL('../',import.meta.url));
 const temp=fs.mkdtempSync(path.join(root,'tests/.tmp-r289-flow-'));
 try {
  const component=fileURLToPath(sourcePath);
  const before=inverse(source);
  const entry=path.join(temp,'entry.mjs'),bundle=path.join(temp,'bundle.cjs');
  const locales=Object.keys(f.labels);
  fs.writeFileSync(entry,`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{CompareDeepPage}from${JSON.stringify(component)};import{CompareDeepPage as Before}from'r289-before';import{venueDatabase}from${JSON.stringify(path.join(root,'src/data/venue-database.js'))};const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...a){super(...(a.length?a:['2026-10-06T00:00:00Z']));}static now(){return 1791244800000;}};const venues=Object.values(venueDatabase);console.log(JSON.stringify(${JSON.stringify(locales)}.flatMap(locale=>[['binance','okx'],['uniswap','jupiter'],['binance','okx','bybit']].map(selected=>{const props={copy:{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending'}},locale,selected,venues,market:'unknown',product:'spot'};return{locale,selected,before:renderToStaticMarkup(React.createElement(Before,props)),after:renderToStaticMarkup(React.createElement(CompareDeepPage,props))}}))));`);
  await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:bundle,loader:{'.css':'empty'},logLevel:'error',plugins:[{name:'exact-before',setup(b){b.onResolve({filter:/^r289-before$/},()=>({path:'r289-before',namespace:'before'}));b.onLoad({filter:/.*/,namespace:'before'},()=>({contents:before,loader:'jsx',resolveDir:path.dirname(component)}));}}]});
  const cases=JSON.parse(execFileSync(process.execPath,[bundle],{cwd:root,encoding:'utf8',maxBuffer:96*1024*1024}));
  assert.equal(cases.length,45);
  const hrefs=html=>[...html.matchAll(/\bhref="([^"]*)"/g)].map(m=>m[1]).sort();
  for(const row of cases){
   const label=`${row.locale}/${row.selected.join('-')}`;
   assert.deepEqual(hrefs(row.after),hrefs(row.before),label+' every href count retained');
   assert.equal((row.after.match(/id="research-comparison"/g)||[]).length,1,label);
   assert.ok(row.after.indexOf('id="compare-sources"')<row.after.indexOf('id="research-comparison"'),label);
   assert.equal(row.after.includes('class="v3-compare-research-paths"'),false,label);
   assert.ok(row.after.includes(f.labels[row.locale]),label+' research heading');
   for(const id of ['compare-snapshot','hardcore-matrix','decision-guide','compare-faq','compare-sources','compare-versus-card']) assert.equal((row.after.match(new RegExp('id="'+id+'"','g'))||[]).length,1,label+id);
   assert.equal((row.after.match(/class="v3-faq-card__lead" lang=/g)||[]).length,row.selected.length>2?1:0,label+' explicit FAQ scope');
  }
 } finally { fs.rmSync(temp,{recursive:true,force:true}); }
});
