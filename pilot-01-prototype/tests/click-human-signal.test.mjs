import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { clickRequestMetadata } from '../server/click-metadata.mjs';
import { clickReport } from '../scripts/click-report.mjs';

const navigate = { 'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate' };
const cases = [
  ['browser navigation', 'GET', { ...navigate, 'user-agent': 'Mozilla/5.0 Chrome/130.0 Safari/537.36' }, 'human'],
  ['no hints', 'GET', {}, 'unknown'],
  ['beacon', 'POST', navigate, 'unknown'],
  ['HEAD', 'HEAD', navigate, 'bot'],
  ['purpose', 'GET', { ...navigate, purpose: 'prefetch' }, 'prefetch'],
  ['sec-purpose', 'GET', { ...navigate, 'sec-purpose': 'prefetch;prerender' }, 'prefetch'],
  ['moz', 'GET', { 'x-moz': 'prefetch' }, 'prefetch'],
  ['bot overrides prefetch', 'GET', { purpose: 'prefetch', 'user-agent': 'TelegramBot (like TwitterBot)' }, 'bot'],
];
for (const ua of ['Twitterbot/1.0', 'Slackbot-LinkExpanding 1.0', 'facebookexternalhit/1.1', 'WhatsApp/2.24', 'Discord/1.0', 'LinkedInBot/1.0', 'GPTBot/1.0', 'ClaudeBot/1.0', 'PerplexityBot/1.0', 'Googlebot/2.1', 'bingbot/2.0', 'Applebot/0.1', 'YandexBot/3.0', 'python-requests/2.32', 'curl/8.0', 'node-fetch/1.0', 'Mozilla/5.0 HeadlessChrome/130']) {
  cases.push([ua, 'GET', { ...navigate, 'user-agent': ua }, 'bot']);
}
for (const [name, method, headers, cls] of cases) {
  test(`click classification: ${name}`, () => {
    const result = clickRequestMetadata(new Request('https://nexualpha.com/go/okx', { method, headers }));
    assert.equal(result.cls, cls);
    assert.deepEqual(Object.keys(result), ['cls', 'inapp']);
  });
}
for (const [inapp, marker] of [['telegram', 'Telegram-iOS/11.0'], ['x', 'TwitterAndroid/10.0'], ['youtube', 'com.google.ios.youtube/19.0'], ['wechat', 'MicroMessenger/8.0'], ['instagram', 'Instagram 350.0'], ['tiktok', 'musical_ly_35.0']]) {
  test(`in-app browser: ${inapp}`, () => {
    const headers = { 'user-agent': `Mozilla/5.0 (iPhone) AppleWebKit/605.1 ${marker}` };
    assert.deepEqual(clickRequestMetadata(new Request('https://nexualpha.com', { headers })), { cls: 'human', inapp });
    assert.equal(clickRequestMetadata(new Request('https://nexualpha.com', { headers, method: 'POST' })).cls, 'unknown');
  });
}

test('report accepts legacy and additive JSONL rows, bounds dates and groups counts', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'click-report-'));
  try {
    const file = path.join(dir, 'clicks.jsonl');
    const legacy = { t: '2026-10-18T12:00:00Z', partner: 'okx', src: 'tg-digest-zh', ref: 'nexualpha.com' };
    await writeFile(file, [legacy, { ...legacy, cls: 'human', inapp: 'telegram' }, { ...legacy, cls: 'bot' }, { ...legacy, cls: 'prefetch' }, { ...legacy, t: '2026-10-01T00:00:00Z' }, { ...legacy, t: '2026-10-20T00:00:00Z' }].map(JSON.stringify).join('\n') + '\ninvalid\nnull\n');
    const report = await clickReport(file, new Date('2026-10-19T00:00:00Z'));
    assert.match(report, /Total: 4; human: 1 \(25.00%\); invalid rows skipped: 2/);
    for (const key of ['2026-10-18', 'okx', 'tg']) assert.ok(report.includes(`${key}\t4\t1\t1\t1\t1\t25.00%`));
    assert.match(report, /unknown\t1\t0\t0\t0\t1/);
    await writeFile(file, '');
    assert.match(await clickReport(file), /Total: 0; human: 0 \(0.00%\)/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
