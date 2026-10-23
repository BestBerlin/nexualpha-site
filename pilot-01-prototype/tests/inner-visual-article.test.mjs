import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildSync } from 'esbuild';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compiled = buildSync({
  entryPoints: [fileURLToPath(new URL('../src/components/v3/news/NewsDetailPage.jsx', import.meta.url))],
  bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react'],
  loader: { '.css': 'empty' },
}).outputFiles[0].text;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports, require, URL, URLSearchParams, Intl, setTimeout, clearTimeout });
const { NewsDetailPage, articleNumericFacts } = module.exports;

const makeArticle = (locale, body) => ({
  slug: 'article-visual-fixture', title: { [locale]: 'Article visual fixture' }, content: { [locale]: body },
  summary: { [locale]: 'A source-bound research summary.' }, status: 'PUBLISHED', availableLocales: [locale],
  category: 'research', categoryName: { [locale]: 'Research' }, publishedAt: '2026-10-22T12:00:00Z',
  author: 'NexuAlpha Research Desk', relatedVenues: ['okx'], sources: [], seo: { noindex: false },
});
const render = (article, locale, related = []) => renderToStaticMarkup(React.createElement(NewsDetailPage, { slug: article.slug, locale, initialArticles: [article, ...related] }));

test('article figures preserve authored context and omit dates, tables, links and unsupported prose', () => {
  const input = '## 2026 update\n\nPublished 2026-10-22.\n\nA 24 hours restriction can apply after a security change; check your account.\n\n| Fee | Rate |\n| --- | --- |\n| Spot | 0.1% |\n\n[Offer 50%](https://example.com)\n\nNo stated amount.\n\nThe quoted 0.10% rate applies only to the maker tier.\n\n- Settlement takes 2 days if the account passes review.';
  const facts = articleNumericFacts(input);
  assert.equal(facts.length, 3);
  assert.equal(facts[0].figure, '24 hours');
  assert.equal(articleNumericFacts('A 24-hour restriction applies only in these cases.')[0].figure, '24-hour');
  assert.equal(facts[0].text, 'A 24 hours restriction can apply after a security change; check your account.');
  assert.equal(facts[1].figure, '0.10%');
  assert.equal(facts[1].kind, 'rate');
  assert.equal(facts[2].figure, '2 days');
  assert.equal(articleNumericFacts('A statement without a numeric amount.').length, 0);
  assert.equal(articleNumericFacts('The reported market value was $10 trillion, subject to the stated methodology.')[0].figure, '$10 trillion');
  assert.equal(articleNumericFacts('报告中的名义金额为 $10亿，并非已实现收入。')[0].figure, '$10亿');
  assert.equal(articleNumericFacts('The maker rate is 0.5%, subject to account terms.')[0].figure, '0.5%');
  assert.equal(articleNumericFacts('Reported value is $10bn under this methodology.')[0].figure, '$10bn');
  assert.equal(articleNumericFacts('The fee ranges from 0.10–0.20% depending on tier.').length, 0);
  assert.equal(articleNumericFacts('The quoted amount is $10 to $20.').length, 0);
  assert.equal(articleNumericFacts('A 2 days wait. '.repeat(30)).length, 0);
});

test('ordered and star lists preserve complete statements and the existing figure gates', () => {
  for (const marker of ['1.', '1)', '*', '-']) {
    const statement = 'Bybit says removing a passkey can result in a 24-hour withdrawal restriction for account and asset security.';
    const facts = articleNumericFacts(`${marker} ${statement}\n${marker} Account recovery timing remains unknown.`);
    assert.equal(facts.length, 1, marker);
    assert.equal(facts[0].figure, '24-hour', marker);
    assert.equal(facts[0].text, statement, 'list marker is not part of the authored fact');
    assert.equal(articleNumericFacts(`${marker} Fees range from 0.10–0.20%.\n${marker} No current tier is established.`).length, 0);
    assert.equal(articleNumericFacts(`${marker} ${statement}\n${marker} ${statement}`).length, 1);
  }
});

test('actual onboarding and passkey feed articles expose their ordered-list cooldown figures', () => {
  const feed = JSON.parse(readFileSync(new URL('../public/content/news-feed.json', import.meta.url), 'utf8'));
  const articles = Array.isArray(feed) ? feed : feed.articles || feed.items || [];
  for (const slug of ['how-to-onboard-gate-with-kyc-fund-password-whitelist-and-cooldown-checks', 'bybit-vs-bitget-passkey-withdrawal-control-boundary']) {
    const article = articles.find(item => item.slug === slug);
    assert.ok(article?.content?.en, `current integration feed contains ${slug}`);
    const facts = articleNumericFacts(article.content.en);
    assert.ok(facts.some(fact => /24[ -]hours?/.test(fact.figure)), `${slug} carries its authored withdrawal cooldown`);
    for (const fact of facts) {
      assert.ok(article.content.en.includes(fact.text), 'complete authored statement is retained');
      assert.ok(!/^\d+[.)]\s/.test(fact.text));
    }
  }
});

for (const locale of ['en', 'zh-Hans', 'ar']) {
  test(`${locale}: SSR includes stable category art, complete figure context, quote/table panels and related art`, () => {
    const statement = locale === 'zh-Hans' ? '安全变更后可能限制提现 24 小时；账户审核时间仍未知。' : 'The quoted 0.10% rate applies only to the maker tier; other costs remain unknown.';
    const body = `## The short answer\n\n${statement}\n\n## Evidence\n\n> Preserve the source boundary.\n\n| Role | Rate |\n| --- | --- |\n| Maker | 0.10% |`;
    const article = makeArticle(locale, body);
    const related = { ...makeArticle(locale, 'Related text.'), slug: 'related-research-fixture', title: { [locale]: 'Related title' } };
    const html = render(article, locale, [related]);
    assert.match(html, /news-detail__category-art/);
    assert.match(html, /news-detail__figures/);
    assert.match(html, /article-figures-title/);
    assert.ok(html.includes(statement), 'context is retained alongside the numeric figure');
    assert.match(html, /news-detail__figure-icon.*?<svg/);
    assert.match(html, /<blockquote><p>Preserve the source boundary\.<\/p><\/blockquote>/);
    assert.match(html, /news-detail__table-scroll[^>]*role="region"[^>]*tabindex="0"/);
    assert.match(html, /class="is-num">0.10%/);
    assert.match(html, /news-detail__related-card[\s\S]*?h7-lt-img/);
    assert.match(html, /data-cta-placement="news-detail-related-article"/);
  });
}

test('figure-free articles do not invent a facts panel', () => {
  const html = render(makeArticle('en', '## The short answer\n\nThere is no published numeric metric.'), 'en');
  assert.ok(!html.includes('class="news-detail__figures"'));
});

test('article art and panels remain route-owned with reserved sizes and logical layout', () => {
  const source = readFileSync(new URL('../src/components/v3/news/NewsDetailPage.jsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles/v9/news9.src.css', import.meta.url), 'utf8');
  assert.match(source, /import CardArt from "\.\.\/\.\.\/shared\/CardArt\.jsx"/);
  assert.ok(!source.includes('home7-below'));
  assert.match(css, /news-detail__category-art \.h7-lt-img\{block-size:160px/);
  assert.match(css, /news-detail__category-art \.h7-lt-img\{block-size:120px/);
  assert.match(css, /news-detail__related-card \.h7-lt-img\{inline-size:100%;aspect-ratio:2.4\/1/);
  assert.match(css, /news-detail__prose blockquote::before/);
  assert.match(css, /news-detail__table-block\{overflow:hidden;border:1px/);
});
