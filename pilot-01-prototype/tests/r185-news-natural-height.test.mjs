import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r182-reader-mobile-integration/candidate/src/components/v3/news/news-list-page.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { acceptedIntegrationPeer: acceptedIntegrationPeer } = await import("./r198-peer-contract.mjs");

const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r182-reader-mobile-integration/candidate/',import.meta.url)),file='src/components/v3/news/news-list-page.css',read=(r,f)=>readFileSync(path.join(r,f),'utf8'),css=read(root,file),before=read(base,file),ast=postcss.parse(css);function vals(selector,prop){const out=[];ast.walkRules(selector,r=>r.walkDecls(prop,d=>out.push(d.value)));return out;}
test('news cards have no fixed20rem floor while row stretching/footer alignment remain',()=>{assert.deepEqual(vals('.news-article-card','min-height'),['0']);assert.deepEqual(vals('.news-article-card','height'),['100%']);assert.ok(vals('.news-article-card','display').includes('flex'));assert.ok(vals('.news-article-card','flex-direction').includes('column'));assert.deepEqual(vals('.news-article-card__summary','flex'),['1']);assert.ok(vals('.news-article-card__footer','display').includes('flex'));});
test('sole authorized declaration reversed restores whole stylesheet exactly',()=>{const begin=css.indexOf('\n.news-article-card {'),end=css.indexOf('\n}',begin);assert.ok(begin>=0&&end>begin);const block=css.slice(begin,end);assert.equal((block.match(/min-height: 0;/g)||[]).length,1);assert.equal(css.slice(0,begin)+block.replace('min-height: 0;','min-height: 20rem;')+css.slice(end),before);});
test('3-column/default2×2 and mobile containment/typography/content clamp unchanged',()=>{assert.ok(vals('.news-grid','grid-template-columns').includes('repeat(3, 1fr)'));assert.ok(vals('.news-grid[data-visible-count="4"]','grid-template-columns').includes('repeat(2, minmax(0, 1fr))'));assert.ok(vals('.news-grid','grid-template-columns').includes('1fr'));assert.ok(vals('.news-article-card','contain-intrinsic-size').includes('0 240px'));assert.deepEqual(vals('.news-article-card__summary','-webkit-line-clamp'),['3']);assert.deepEqual(vals('.news-article-card__summary','font-size'),['0.875rem']);assert.match(css, /\.news-article-card__read-link:focus-visible/);});
test('all other source/data/config/public bytes and complete invitation registry unchanged',()=>{const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);const integratedBase=fileURLToPath(new URL('../../../r184-home-code-identity/candidate/',import.meta.url));for(const zone of ['src','config','public'])for(const p of walk(path.join(integratedBase,zone))){const rel=path.relative(integratedBase,p);if(rel===file)continue;const expected=acceptedIntegrationPeer(rel)||(['src/components/v3/TopicGuidePage.jsx','src/components/v3/topic-guide.css'].includes(rel)?readFileSync(new URL('../../../r183-derivatives-route-task/candidate/'+rel,import.meta.url)):rel==='src/components/v3/RebateTickerBar.jsx'?readFileSync(new URL('../../../r186-source-summary-density/candidate/'+rel,import.meta.url)):readFileSync(p));assert.equal(readFileSync(path.join(root,rel)).compare(expected),0,rel);}assert.equal(createHash('sha256').update(readFileSync(path.join(root,'src/data/partner-registry.js'))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
}
