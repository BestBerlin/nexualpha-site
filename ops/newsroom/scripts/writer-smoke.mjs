// Run only via the isolated test-postgres.sh psql wrapper, never a live database.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { buildQuery, runPsql } from '../bin/newsroom.mjs';
if (!process.env.NEWSROOM_TEST_PROJECT?.startsWith('newsroom-test-')) throw new Error('Disposable test project required');
runPsql(`INSERT INTO newsroom_config(key,value) VALUES ('scoring_thresholds','{"publish":90}')
  ON CONFLICT(key) DO UPDATE SET value=excluded.value;
  INSERT INTO events(id,event_type,title_internal,verification_status,verified_at,last_update_at)
  VALUES (80001,'listing','Fixture listing','verified-primary',now(),now()),
         (80002,'price_move','Fixture move','corroborated',now(),now()),
         (80003,'listing','Unverified fixture','unverified',NULL,now());
  INSERT INTO event_scores(event_id,weights,editorial_score,credibility)
  VALUES (80001,'{}',99,3),(80002,'{}',98,2),(80003,'{}',100,0);`);
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
assert.equal(JSON.parse(runPsql(buildQuery(['release',String(a[0].id),'--writer','wrong']))).length,0);
const completed = JSON.parse(runPsql(buildQuery(['complete',String(a[0].id),'--writer','fixture-a','--article','fixture-writer-story','--url','https://example.test/story'])));
assert.equal(completed[0].event_id,a[0].id);
assert.equal(completed[0].published_url,'https://example.test/story');
assert.equal(completed[0].states,null);
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
