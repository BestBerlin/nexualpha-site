import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { importArticlePackage } from '../scripts/import-nexualpha-content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'content-source', 'remediation-20260922');
const feedPath = path.join(root, 'public', 'content', 'news-feed.json');
const targetSlugs = [
  'tokenized-treasuries-structure-access-risks',
  'hyperliquid-vs-dydx',
];
const requiredPasses = ['source_and_claim', 'editorial_quality', 'seo_aeo_geo', 'compliance_and_commercial'];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

const feedText = await readFile(feedPath, 'utf8');
const feed = JSON.parse(feedText);

for (const slug of targetSlugs) {
  test(`${slug} recovered source package preserves immutable publication history`, async () => {
    const packageDir = path.join(sourceRoot, slug);
    const article = JSON.parse(await readFile(path.join(packageDir, 'article.json'), 'utf8'));
    const published = feed.articles.find((candidate) => candidate.slug === slug);
    assert.ok(published, 'existing public route must remain');

    const snapshotText = await readFile(path.join(packageDir, 'sources', 'recovered-feed-object.json'), 'utf8');
    const snapshotHash = await readFile(path.join(packageDir, 'sources', 'recovered-feed-object.sha256'), 'utf8');
    const feedHash = await readFile(path.join(packageDir, 'sources', 'feed.sha256'), 'utf8');
    const original = JSON.parse(snapshotText);
    assert.equal(original.slug, slug);
    assert.ok(snapshotHash.startsWith(sha256(snapshotText)));
    assert.equal(article.recovery.snapshotSha256, sha256(snapshotText));
    assert.ok(feedHash.startsWith(article.recovery.feedSha256));

    assert.equal(article.recovery.recoveredFrom, 'public/content/news-feed.json');
    assert.equal(article.recovery.recoveryMethod.includes('not the original authoring package'), true);
    assert.equal(article.author, original.author);
    assert.equal(article.publishedAt, original.publishedAt);
    assert.equal(published.publishedAt, original.publishedAt);
    assert.equal(published.author, original.author);
    assert.equal(article.recovery.originalAuthor, original.author);
    assert.equal(article.recovery.originalPublishedAt, original.publishedAt);
    assert.equal(article.recovery.originalUpdatedAt, original.updatedAt ?? null);
  });

  test(`${slug} cannot publish when any required review is missing`, async () => {
    const packageDir = path.join(sourceRoot, slug);
    const article = JSON.parse(await readFile(path.join(packageDir, 'article.json'), 'utf8'));
    const temporaryDir = await mkdtemp(path.join(os.tmpdir(), 'nexualpha-recovery-gate-'));
    try {
      for (const file of Object.values(article.bodyFiles)) {
        await writeFile(path.join(temporaryDir, file), await readFile(path.join(packageDir, file)));
      }
      for (const missingPass of requiredPasses) {
        const incomplete = { ...article, review: { ...article.review, passes: requiredPasses.filter((pass) => pass !== missingPass) } };
        await writeFile(path.join(temporaryDir, 'article.json'), JSON.stringify(incomplete));
        const result = await importArticlePackage(temporaryDir, { publish: true });
        assert.equal(result.ok, false, missingPass);
        assert.equal(result.reason, 'missing required four-pass review');
      }
    } finally {
      await rm(temporaryDir, { recursive: true, force: true });
    }
  });
}

test('recovered articles use one decision table per language and omit internal editorial directions', async () => {
  for (const slug of targetSlugs) {
    const packageDir = path.join(sourceRoot, slug);
    const article = JSON.parse(await readFile(path.join(packageDir, 'article.json'), 'utf8'));
    for (const [locale, file] of Object.entries(article.bodyFiles)) {
      const body = await readFile(path.join(packageDir, file), 'utf8');
      const headings = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
      assert.equal(new Set(headings).size, headings.length, `${slug}/${locale}: repeated sections`);
      assert.equal((body.match(/^\|[\s:|-]+\|$/gm) ?? []).length, 1, `${slug}/${locale}: one comparison table`);
      assert.ok(!/This is the only comparison table this article needs|A clean article should|Editorial treatment for future updates|内容如何服务\s*CTA|站内链接应承担的角色/i.test(body), `${slug}/${locale}: internal editorial directions must be removed`);
    }
  }
});

test('recovered source packages do not add commercial URLs to article bodies', async () => {
  for (const slug of targetSlugs) {
    const packageDir = path.join(sourceRoot, slug);
    const article = JSON.parse(await readFile(path.join(packageDir, 'article.json'), 'utf8'));
    const body = `${await readFile(path.join(packageDir, article.bodyFiles.en), 'utf8')}\n${await readFile(path.join(packageDir, article.bodyFiles['zh-Hans']), 'utf8')}`;
    assert.doesNotMatch(body, /accounts\.binance\.com|binance\.com\/join|partner\.bitget|okx\.com\/join|topzhjdgxcb|backpack\.exchange\/join/i);
  }
});
