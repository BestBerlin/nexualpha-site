import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { H7_COPY } from '../src/components/v7/home7-copy.js';
import { createSsrHarness } from './helpers/ssr-hydration-harness.mjs';

// news-writing §7.1/7.2: literal phrases; contextual trading terms (leverage/token unlocks) stay legal.
const banned = /it's important to note|worth noting|notably,|in today's fast-paced|ever-evolving world|delve into|dive into|let’s dive in|let's dive in|a deep dive|in conclusion|in summary|to sum up|ultimately,|game.changer|revolutionize|paradigm shift|unlock the (?:power|potential)|seamless|\brobust\b|cutting-edge|state-of-the-art|comprehensive|navigate the landscape|a testament to|\bbeacon\b|\btapestry\b|\brealm\b|plays a (?:crucial|pivotal|vital) role|shed light on|underscores|highlights the importance|\bfoster\b|\bempower\b|\belevate\b|\bharness\b|\bstreamline\b|\bholistic\b|\bmultifaceted\b|\bnuanced\b|not just .+but|whether you're a beginner|seasoned trader|moreover,|furthermore,|additionally,|here's the thing|the bottom line|at the end of the day|key takeaways|stay tuned|stay informed|keep an eye on this space|only time will tell|remains to be seen|buckle up|wild ride|rollercoaster|skyrocket|plummet|to the moon|\bDYOR\b|\bNFA\b|not financial advice|crypto enthusiasts|the community is buzzing|unprecedented|groundbreaking|innovative|in the world of|within the ecosystem of|as we all know|as mentioned earlier|let's break it down|let's explore|without further ado|this article will (?:explain|cover)|so what does this mean|smart money|diamond hands|whales are buying|digital gold|the future of finance|source-mapped NexuAlpha decision brief|separates verified facts|this article only handles|the source map clarifies|this is not investment advice|NexuAlpha direct answer:|practical takeaway|click here|official source, click the title|data is a lower bound|best exchange|the safest|guaranteed|remember:|pro tip:|fun fact:|值得注意的是|综上所述|总而言之|在当今.{0,20}的时代|赋能|助力|打造|闭环|抓手|一文读懂|干货满满|让我们一起|不容错过|重磅！|颠覆|全方位|全维度|史诗级|最强|终端|对决|纳入候选|每项都附来源|快速定位|量化对比维度|数据对比评分卡|我们致力于|为您提供|一站式/i;
// Home-specific additions: slogan couplets, abstract journeys, and “all-in-one” pitches.
const slogans = /先.{1,10}[，,。].{0,3}再|\bcompare first[,.].{0,8}(?:trade|sign up|decide)|your trading journey|all-in-one/i;
const strings = (value) => typeof value === 'function' ? value('Exchange', '$100') : Array.isArray(value) ? value.flat(Infinity).join(' ') : typeof value === 'object' ? Object.values(value).map(strings).join(' ') : String(value);
for (const locale of ['zh-Hans', 'en']) test(`${locale} home copy rejects machine phrases and slogan pairs`, () => {
  for (const [key, value] of Object.entries(H7_COPY[locale])) {
    assert.doesNotMatch(strings(value), banned, key);
    assert.doesNotMatch(strings(value), slogans, key);
  }
  for (const name of ['home7-below.jsx', 'home7-telegram.jsx', 'home7-receipt.jsx', 'home7-hero-volume.js']) {
    const source = readFileSync(new URL(`../src/components/v7/${name}`, import.meta.url), 'utf8');
    const rows = source.split('\n').filter(line => line.trimStart().startsWith(`${locale === 'en' ? 'en' : '"zh-Hans"'}:`));
    assert.ok(rows.length, name);
    for (const row of rows) {
      assert.doesNotMatch(row, banned, name);
      assert.doesNotMatch(row, slogans, name);
    }
  }
});
test('phrase guard catches representative editorial regressions', () => {
  for (const phrase of ['seamless', '赋能', 'all-in-one', 'Compare first, trade later', '先比较，再交易']) assert.ok(banned.test(phrase) || slogans.test(phrase), phrase);
});
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
test('receipt SSR keeps the hero arithmetic and four mobile-ready entries', async () => {
  for (const path of ['/', '/zh-hans']) {
    const html = await harness.render(`https://nexualpha.com${path}`);
    const receipt = html.match(/<div class="h7-receipt"[\s\S]*?<\/div>/)?.[0];
    assert.ok(receipt);
    assert.match(receipt, /data-venue="bitget"/);
    for (const amount of ['$6,000', '$3,600', '$2,400']) assert.ok(receipt.includes(amount), amount);
    assert.equal((receipt.match(/<li>/g) || []).length, 4);
    assert.ok(!html.includes('class="h7-steps"'));
    assert.match(html, /class="h7-trust-line"/);
  }
  const html = await harness.render('https://nexualpha.com/ar');
  assert.ok(!html.includes('class="h7-receipt"'));
  assert.ok(!html.includes('class="h7-trust-line"'));
});

test('receipt follows the checked fee, rebate and volume; unavailable inputs stay empty', async () => {
  const { receiptAmounts } = await harness.vite.ssrLoadModule('/src/components/v7/home7-receipt.jsx');
  assert.deepEqual(receiptAmounts(1e7, { state: 'checked', taker: .06 }, 3600), [6000, 3600, 2400]);
  assert.deepEqual(receiptAmounts(2e7, { state: 'checked', taker: .05 }, 4000), [10000, 4000, 6000]);
  assert.equal(receiptAmounts(1e7, { state: 'unchecked', taker: .06 }, 3600), null);
  assert.equal(receiptAmounts(1e7, { state: 'checked', taker: .06 }, null), null);
});
