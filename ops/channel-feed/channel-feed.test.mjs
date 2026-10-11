import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('./channel-feed.mjs', import.meta.url));
const article = slug => ({ slug, publishedAt: new Date().toISOString(), title: {en: slug, 'zh-Hans': '标题'}, summary: {en: 'A summary.', 'zh-Hans': '摘要。'}, availableLocales: ['en', 'zh-Hans'] });
test('CLI integrates articles with existing announcements, persists per channel, and guards overlaps', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'channel-rhythm-test-'));
  try {
    const bootstrap = `import {readFileSync,appendFileSync} from 'node:fs'; globalThis.fetch=async(url)=>{
      let data;
      if(url.includes('news-feed-summary')) data=JSON.parse(readFileSync(process.env.TEST_FEED,'utf8'));
      else if(url.includes('api.telegram.org')) {appendFileSync(process.env.TEST_SENDS,'sent\\n'); data={ok:true,result:{message_id:1}};}
      else if(url.includes('partners.json')) data={partners:[]};
      else data={items:[]};
      return {ok:true,status:200,json:async()=>data};
    };`;
    const feed = path.join(dir,'feed.json'), sends = path.join(dir,'sends.txt');
    writeFileSync(sends,'');
    const run = (...args) => {
      const result = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(bootstrap)}`, script, ...args], {
        encoding:'utf8', env:{...process.env, CHANNEL_FEED_STATE_DIR:dir, CHANNEL_FEED_TARGETS:'en:@en,zh:@zh', COMMUNITY_BOT_TOKEN:'test-only', TEST_FEED:feed, TEST_SENDS:sends},
      });
      assert.equal(result.status,0,result.stderr); return result.stdout;
    };
    writeFileSync(feed,JSON.stringify({articles:[article('baseline')]}));
    run(); assert.equal(readFileSync(sends,'utf8'),'');
    writeFileSync(feed,JSON.stringify({articles:[article('new'),article('baseline')]}));
    run(); assert.equal(readFileSync(sends,'utf8'),'sent\nsent\n');
    run(); assert.equal(readFileSync(sends,'utf8'),'sent\nsent\n');
    const file = path.join(dir,'articles.json');
    const before = readFileSync(file,'utf8');
    run('--dry-run'); assert.equal(readFileSync(file,'utf8'),before);
    mkdirSync(path.join(dir,'channel-feed.lock'));
    assert.match(run(),/already running/);
    assert.equal(readFileSync(sends,'utf8'),'sent\nsent\n');
  } finally {rmSync(dir,{recursive:true,force:true});}
});
