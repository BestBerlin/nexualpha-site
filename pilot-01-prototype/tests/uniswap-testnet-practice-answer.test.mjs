import test from 'node:test';
import assert from 'node:assert/strict';
import { priorityVenueAnswerFor } from '../src/data/priority-venue-answers.js';
import { mergePriorityVenueSeo } from '../src/data/priority-venue-seo.js';

const testnetSource = 'https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap';
const walletSource = 'https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap';
const apiSource = 'https://developers.uniswap.org/docs/trading/swapping-api/supported-chains';

for (const locale of ['en', 'zh-Hans', 'zh-Hant']) {
  test(`Uniswap ${locale} separates test-coin practice, Wallet/Extension steps and documented web/API scope`, () => {
    const answer = priorityVenueAnswerFor('uniswap', locale);
    assert.equal(answer.reviewedAt, '2026-09-22', 'only the testnet clause was freshly checked');
    assert.match(answer.body, /2026-10-01/);
    assert.match(answer.body, locale === 'en' ? /no real-world value/ : locale === 'zh-Hans' ? /没有现实价值/ : /沒有現實價值/);
    assert.match(answer.faq[0][1], /Wallet\/Extension/);
    assert.match(answer.faq[0][1], /official Uniswap app and docs first|官方 Uniswap App 和文[档檔]/);
    assert.match(answer.faq[0][1], /API table|API 表/);
    assert.match(answer.faq[0][1], /public web app|普通 Web App/);
    assert.match(answer.faq[0][1], /final mainnet transaction preview|最终主网交易预览|最終主網交易預覽/);
    assert.match(answer.faq[0][1], /do not connect a wallet or send value|不要从未经核验|不要從未經核驗/);
    assert.match(answer.faq[0][1], /Advanced.*Testnet mode/);
    assert.match(answer.faq[0][1], locale === 'en' ? /not instructions for the ordinary web interface/ : locale === 'zh-Hans' ? /不是普通网页的操作步骤/ : /不是普通網頁的操作步驟/);
    assert.ok(answer.faq[0][2].includes(walletSource));
    assert.ok(answer.faq[0][2].includes(testnetSource));
    for (const source of ['https://app.uniswap.org/', 'https://developers.uniswap.org/docs/get-started/quickstart', apiSource]) assert.ok(answer.faq[0][2].includes(source));
    assert.match(answer.faq[2][1], /2026-10-01/);
    for (const network of ['Ethereum Sepolia', 'Unichain Sepolia', 'Base Sepolia']) assert.ok(answer.faq[2][1].includes(network));
    assert.match(answer.faq[2][1], locale === 'en' ? /documents only Ethereum Sepolia and Unichain Sepolia as testnet options for web availability/ : locale === 'zh-Hans' ? /Web 测试网仅支持 Ethereum Sepolia 与 Unichain Sepolia/ : /Web 測試網僅支援 Ethereum Sepolia 與 Unichain Sepolia/);
    assert.doesNotMatch(answer.faq[2][1], /public web interface exposed|公开 Web 界面只展示|公開 Web 介面只展示/);
    assert.ok(answer.faq[2][2].includes(apiSource));
    assert.ok(answer.faq[2][2].includes(testnetSource));
    for (const source of [testnetSource, walletSource]) assert.ok(answer.sources.some(([, url]) => url === source));
    assert.equal(answer.faq.length, 6, 'retain five testnet questions plus one source-reviewed affiliate FAQ');
    assert.equal(answer.checks.length, locale === 'en' ? 4 : 3);
    const seo = mergePriorityVenueSeo('uniswap', locale, { title: 'Uniswap', description: '' });
    assert.deepEqual(seo.directAnswer, { question: answer.faq[0][0], answer: answer.faq[0][1], citations: answer.faq[0][2] });
    assert.deepEqual(seo.faq, answer.faq.slice(1));
  });
}
