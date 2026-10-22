import { committedFileHash } from './r100-test-contracts.mjs';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const prior=p=>readFileSync(new URL('../../../r129-editorial-system/candidate/'+p,import.meta.url),'utf8');
const css=()=>read('src/styles/reader-material.css');
const blocks=()=>[...css().replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]+)\}/g)].map(m=>({selectors:m[1].split(',').map(x=>x.trim()),body:m[2]}));
function declaration(selector){const b=blocks().find(x=>x.selectors.includes(selector));assert.ok(b,selector);return b.body;}
test('limited decision/context/evidence roles have distinct surfaces without visual noise',()=>{
 const t=css();assert.match(t,/--reader-material-context:\s*#0c1219/);assert.match(t,/--reader-material-decision:\s*#101b28/);
 for(const s of ['.v3-page .v3-venue-decision-strip article','.v3-compare-page .v3-versus-card--supporting','.topic-guide-page .topic-stat-card','.news-detail-page .news-detail__local-brief'])assert.match(declaration(s),/background:\s*var\(--reader-material-context\)/);
 for(const s of ['.v3-page .registration-card','.news-detail-page .news-detail__decision-box'])assert.match(declaration(s),/background:\s*var\(--reader-material-decision\)/);
 assert.match(declaration('.v3-page .v3-source-board article'),/background:\s*transparent/);
 assert.match(declaration('.topic-guide-page .topic-stat-card::before'),/background:\s*none/);
 assert.ok(!/gradient|backdrop-filter:\s*blur|animation\s*:/.test(t));
});
test('stylesheet is shared on SSR/client and cannot recolor CTA/modal or change document geometry',()=>{
 const imports=[...read('src/main.jsx').matchAll(/import "([^"]+\.css)"/g)].map(m=>m[1]);assert.ok(imports.indexOf('./styles/reader-material.css')>imports.indexOf('./styles/reader-foundation.css'),'material layer follows reader foundation');
 assert.ok(read('worker/index.js').includes('SHARED_ROUTE_STYLE_PREFIXES = Object.freeze(["index-"'));
 assert.ok(!read('vite.config.mjs').includes('reader-material'));
 for(const b of blocks()){
  assert.ok(!/!important|--surface-|--blue\s*:|--positive\s*:/.test(b.body),b.body);
  const allowed=new Set(['background','border-color','border-left-color','box-shadow','backdrop-filter','-webkit-backdrop-filter','--reader-material-context','--reader-material-decision','--reader-material-rule','--reader-material-decision-rule']);
  for(const declaration of b.body.split(';').filter(x=>x.trim()))assert.ok(allowed.has(declaration.split(':')[0].trim()),declaration);
  for(const s of b.selectors)assert.ok(s.startsWith('.v3-page')||s.startsWith('.v3-compare-page')||s.startsWith('.topic-guide-page')||s.startsWith('.news-detail-page'),s);
 }
 assert.ok(!/button|modal|sheet|sticky|yellow-card|body|html|:root/.test(css()));
});
test('original route content/truth and CTA styles/data remain byte-identical to R129', { skip: !existsSync(new URL('../../../r129-editorial-system/candidate/', import.meta.url)) && 'Original historical source snapshot is absent from a fresh checkout' }, ()=>{
 for(const f of ['src/styles/tokens.css','src/styles/fintech-premium.css','src/components/v3/v3.css','src/components/v3/registration-card.css','src/components/v3/topic-guide.css','src/components/v3/news/news-detail-page.css','src/components/v3/V3Pages.jsx','src/components/v3/TopicGuidePage.jsx','src/components/v3/news/NewsDetailPage.jsx','src/data/partner-registry.js','src/data/topic-guides-data.js','src/data/public-cta.js'])assert.equal(createHash('sha256').update(read(f)).digest('hex'),createHash('sha256').update(prior(f)).digest('hex'),f);
 assert.equal(createHash('sha256').update(read('src/data/partner-registry.js')).digest('hex'),committedFileHash('src/data/partner-registry.js'));
});
