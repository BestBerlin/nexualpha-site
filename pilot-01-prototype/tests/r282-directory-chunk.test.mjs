import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../DIRECTORY-CHUNK-BASELINE.mjs", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8'),source=read('../vite.config.mjs'),base=read('../../DIRECTORY-CHUNK-BASELINE.mjs');
const old='          if (id.includes("/src/components/v3/VenueYellowPages")) return "route-v3-pages";';
const next='          if (id.endsWith("/src/components/v3/venue-yellow-pages.css")) return "route-v3-pages";\n          if (id.includes("/src/components/v3/VenueYellowPages")) return "route-v3-directory";';
function chunks(s){const start=s.indexOf('manualChunks(id) {'),end=s.indexOf('\n        },',start);assert.ok(start>0&&end>start);return vm.runInNewContext('(function '+s.slice(start,end)+'\n})');}
test('actual manualChunks separates directory JSX while keeping old stylesheet/main/shared classifications',()=>{const f=chunks(source),oldf=chunks(base);assert.equal(f('/x/src/components/v3/VenueYellowPages.jsx'),'route-v3-directory');assert.equal(f('/x/src/components/v3/venue-yellow-pages.css'),'route-v3-pages');for(const id of ['/x/src/components/v3/V3Pages.jsx','/x/src/components/v3/venue-yellow-pages-copy.js','/x/src/components/v3/venue-yellow-pages-state.js','/x/node_modules/react/index.js','/x/src/components/v3/TopicGuidePage.jsx','/x/unknown.js'])assert.equal(f(id),oldf(id));});
test('exact two-rule replacement restores whole original config; no additional config permission',()=>{assert.equal(source.split(next).length-1,1);assert.equal(base.split(old).length-1,1);assert.equal(source.replace(next,old),base);assert.equal(createHash('sha256').update(base).digest('hex'),'cb3d74f69e3274c1e1e49a5a857725f7f26339090f0d75c230bbecf84b014c3e');});
test('Worker stylesheet filter and strict320000 budget are unchanged alongside registry and prepare',()=>{const pins={"worker/index.js": "290acee11073aa9cab8de995a3a90a32885109874d36f9dab48f76808869220f", "scripts/prepare-sites-build.mjs": "1ac05e77bc0e591c6dfa31e3ad6d2aa624d45e392e6884cfa668118c09964765", "scripts/verify-build-budget.mjs": "3db5801e5fe54d56624a7217f430beb21698879674a2dc6e27e087fd7c79bda4", "src/data/partner-registry.js": "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a"};for(const [file,sha]of Object.entries(pins))assert.equal(createHash('sha256').update(read('../'+file)).digest('hex'),sha,file);assert.match(read('../scripts/verify-build-budget.mjs'),/maxBytes: 320_000/);assert.match(read('../worker/index.js'),/\[EXCHANGES_ROUTE_MARKER\]: \["route-v3-pages-"\]/);});
}
