// Run only via the isolated test-postgres.sh psql wrapper, never a live database.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { buildQuery, runPsql } from '../bin/newsroom.mjs';
if (!process.env.NEWSROOM_TEST_PROJECT?.startsWith('newsroom-test-')) throw new Error('Disposable test project required');
runPsql(`INSERT INTO newsroom_config(key,value) VALUES ('scoring_thresholds','{"publish":90}')
  ON CONFLICT(key) DO UPDATE SET value=excluded.value;
  INSERT INTO events(id,subject_entity,subjects,event_type,title_internal,verification_status,verified_at,last_update_at,source_published_at,discussion,story_asset,story_action,story_group_key)
  VALUES (80001,'bybit',ARRAY['bybit','STG'],'delisting','Bybit delists STG','verified-primary',now(),now(),now()-interval '1 hour','{}','STG','delisting','delisting:stg'),
         (80002,'binance',ARRAY['BTC'],'price_move','BTC drops 3.4 percent in one hour','corroborated',now(),now(),now()-interval '30 minutes','{"price_move_pct_1h":-3.4}','BTC','price_move','market:btc-1h'),
         (80003,'okx',ARRAY['okx','OLD'],'listing','Expired fixture listing','verified-primary',now(),now(),now()-interval '96 hours','{}','OLD','listing','listing:old'),
         (80004,'kucoin',ARRAY['kucoin','STG'],'delisting','KuCoin delists STG','verified-primary',now(),now(),now()-interval '50 minutes','{}','STG','delisting','delisting:stg'),
         (80005,'okx',ARRAY['ETH'],'price_move','ETH moves below threshold','corroborated',now(),now(),now()-interval '20 minutes','{"price_move_pct_1h":1.2}','ETH','price_move','market:eth-1h');
  INSERT INTO event_scores(event_id,weights,editorial_score,credibility)
  VALUES (80001,'{}',99,3),(80002,'{}',98,3),(80003,'{}',100,3),(80004,'{}',97,3),(80005,'{}',100,3);
  INSERT INTO event_evidence(event_id,url,kind,is_independent,origin_key,excerpt,published_at)
  VALUES (80001,'https://bybit.example/stg','official_notice',true,'bybit:stg','Bybit announced that STG spot trading will be delisted and gave holders a venue-specific cutoff to review before trading stops. This excerpt is intentionally long enough to prove the evidence body is substantive rather than a copied keyword.',now()-interval '1 hour'),
         (80004,'https://kucoin.example/stg','official_notice',true,'kucoin:stg','KuCoin announced that STG spot trading will be delisted and gave holders a separate venue-specific cutoff to review before trading stops. This excerpt is intentionally long enough to prove the evidence body is substantive rather than a copied keyword.',now()-interval '50 minutes'),
         (80002,'https://market.example/btc','market_data',true,'market:btc','BTC moved more than three percent in one measured one-hour window according to the market data feed. This excerpt is intentionally long enough to prove the evidence body is substantive rather than a copied keyword.',now()-interval '30 minutes');`);
const claim = writer => new Promise((resolve, reject) => {
  const child = spawn('psql', ['-X', '-qAt', '--set=ON_ERROR_STOP=1']);
  let stdout = '', stderr = '';
  child.stdout.on('data', data => { stdout += data; });
  child.stderr.on('data', data => { stderr += data; });
  child.on('error', reject);
  child.on('close', code => code ? reject(new Error(stderr)) : resolve(JSON.parse(stdout)));
  child.stdin.end(`SET standard_conforming_strings=on;\n${buildQuery(['claim','--limit','1','--writer',writer])}`);
});
const [a, b] = await Promise.all([claim('fixture-a'), claim('fixture-b')]);
assert.equal(a.length, 1); assert.equal(b.length, 1);
assert.notEqual(a[0].id, b[0].id);
assert.deepEqual(new Set([a[0].id,b[0].id]), new Set([80001,80002]));
assert.deepEqual(a.find(row => row.id === 80001).story_event_ids.sort(), [80001,80004]);
assert.equal(JSON.parse(runPsql(buildQuery(['release',String(a[0].id),'--writer','wrong']))).length,0);
const completed = JSON.parse(runPsql(buildQuery(['complete',String(a[0].id),'--writer','fixture-a','--article','fixture-writer-story','--url','https://example.test/story'])));
assert.equal(completed[0].event_id,a[0].id);
assert.equal(completed[0].published_url,'https://example.test/story');
assert.deepEqual(completed[0].states.story_event_ids.sort(), [80001,80004]);
assert.throws(() => runPsql(buildQuery(['complete',String(b[0].id),'--writer','fixture-b','--article','fixture-writer-story','--url','https://example.test/other'])));
assert.equal(JSON.parse(runPsql(`SELECT row_to_json(e) FROM events e WHERE id=${b[0].id}`)).state,'claimed');
assert.equal(JSON.parse(runPsql(buildQuery(['release',String(b[0].id),'--writer','fixture-b']))).length,1);
const short = JSON.parse(runPsql(buildQuery(['claim','--limit','3','--writer','fixture-shortfall'])));
assert.equal(short.length,1);
const receipt = JSON.parse(runPsql("SELECT row_to_json(s) FROM shortfall_log s WHERE note LIKE 'Writer fixture-shortfall:%'"));
assert.equal(receipt.wanted,3); assert.equal(receipt.eligible,1); assert.equal(receipt.published,0);
runPsql(`UPDATE events SET claimed_at=now()-interval '91 minutes' WHERE id=${short[0].id}`);
assert.equal(JSON.parse(runPsql(buildQuery(['complete',String(short[0].id),'--article','expired-fixture','--url','https://example.test/expired']))).length,0);
assert.equal((await claim('fixture-reclaimed'))[0].id,short[0].id);
console.log('Writer concurrent claims, lifecycle, shortfall and lease smoke passed.');
