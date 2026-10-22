import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r193-desktop-hero-composition/candidate/src/components/v3/growth-conversion.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { acceptedIntegrationPeer: acceptedIntegrationPeer, withoutAcceptedR196Tail: withoutAcceptedR196Tail } = await import("./r198-peer-contract.mjs");
test('exact R196 inverse rejects any unapproved CSS change including seemingly harmless extra declaration',()=>{
 const css=readFileSync(new URL('../src/components/v3/topic-guide.css',import.meta.url),'utf8');
 assert.equal(withoutAcceptedR196Tail(css),readFileSync(new URL('../../../r192-reader-integration/candidate/src/components/v3/topic-guide.css',import.meta.url),'utf8'));
 for(const changed of [css+'\n',css.replace('repeat(2, minmax(0, 1fr))','repeat(1, minmax(0, 1fr))'),css.replace('640px','641px'),css.replace('font-size:','font-size:0;/* unauthorized */')])assert.throws(()=>withoutAcceptedR196Tail(changed));
});
test('every integration peer stays SHA pinned and unrelated source has no override',()=>{
 for(const file of ['src/components/v3/growth-conversion.css','src/components/v3/news/NewsDetailPage.jsx','src/components/v3/news/news-detail-page.css','src/components/v3/topic-guide.css'])assert.equal(acceptedIntegrationPeer(file).compare(readFileSync(new URL('../'+file,import.meta.url))),0,file);
 assert.equal(acceptedIntegrationPeer('src/data/partner-registry.js'),undefined);
 assert.equal(acceptedIntegrationPeer('src/components/v3/RegistrationCard.jsx'),undefined);
});
}
