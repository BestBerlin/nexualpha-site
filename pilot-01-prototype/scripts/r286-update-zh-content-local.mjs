import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { importArticlePackage } from './import-nexualpha-content.mjs';

export const candidateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseRoot = path.resolve(candidateRoot, '..');
export const expectedFeedSha = '961e10b507cb6a5c59507593ac3e6026b5dd62eb4be0f96a7446cfb9ba19125e';
export const expectedRegistrySha = '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a';
export const sourceRoot = '/Users/bestberlin/Documents/AEO Crypto Factory/deployment/nexualpha-content-engine/staging/2026-10-05/20261005T0435';
export const targets = Object.freeze([
  ['cftc-sec-tokenized-collateral-vs-tokenized-securities-boundary-map', '9b5f77c610ae59d2824e5877ed99b5c46f20a442066e934df8d4c4e80478ac26'],
  ['chainlink-ccip-cross-chain-token-standard-transfer-risk-map', 'dc397d1e94585c219bb4628ecd61f3ad1601b1f9f6ff2a2d2e8394895730fbcb'],
  ['coinbase-advanced-trade-create-order-auth-reconciliation-checklist', 'dc69f84a0336dcf5e7f96895df3035bdf69b11dcd0241ec41fc53291e185de80'],
  ['exchange-api-key-scope-ip-whitelist-expiry-disclosure-radar', '0ef90e766c79bd20c2f881cc97d4bc629a9b12af37e46848ff94f01ea5913e7b'],
]);
export const sha256 = value => createHash('sha256').update(value).digest('hex');

export function verifyPatch(before, after) {
  assert.equal(before.articles.length, 416);
  assert.equal(before.articleCount, 416);
  assert.equal(after.articles.length, before.articles.length);
  assert.equal(after.articleCount, before.articleCount);
  const restored = structuredClone(after);
  const summaries = [];
  for (const [slug] of targets) {
    const oldMatches = before.articles.filter(article => article.slug === slug);
    const newMatches = after.articles.filter(article => article.slug === slug);
    assert.equal(oldMatches.length, 1, `${slug} must be unique before`);
    assert.equal(newMatches.length, 1, `${slug} must be unique after`);
    const old = oldMatches[0], next = newMatches[0];
    assert.notEqual(next.summary['zh-Hans'], old.summary['zh-Hans'], `${slug} summary must change`);
    assert.notEqual(next.content['zh-Hans'], old.content['zh-Hans'], `${slug} body must change`);
    assert.equal(typeof next.summary['zh-Hans'], 'string');
    assert.equal(typeof next.content['zh-Hans'], 'string');
    assert.ok(next.summary['zh-Hans'].trim() && next.content['zh-Hans'].trim());
    summaries.push(next.summary['zh-Hans']);
    const undo = restored.articles.find(article => article.slug === slug);
    undo.summary['zh-Hans'] = old.summary['zh-Hans'];
    undo.content['zh-Hans'] = old.content['zh-Hans'];
  }
  assert.equal(new Set(summaries).size, 4, 'four independent summaries');
  assert.deepEqual(restored, before, 'only eight approved Chinese leaves may change, including top metadata and ordering');
}

export async function preparePatch(before) {
  const after = structuredClone(before);
  const manifest = [];
  for (const [slug, expectedSourceSha] of targets) {
    const packageDir = path.join(sourceRoot, slug);
    const rawZh = await readFile(path.join(packageDir, 'article.zh-Hans.md'));
    assert.equal(sha256(rawZh), expectedSourceSha, `${slug} reviewed source hash`);
    // Validation option only: this function never writes or calls a publisher.
    const result = await importArticlePackage(packageDir, { publish: true });
    assert.equal(result.ok, true, `${slug}: ${result.reason || 'import must validate'}`);
    assert.equal(result.article.slug, slug);
    const matches = after.articles.filter(article => article.slug === slug);
    assert.equal(matches.length, 1, `${slug} must already exist exactly once`);
    const article = matches[0];
    // Reviewed claim mapping remains identical; no incoming metadata is copied.
    assert.deepEqual(result.article.claims, article.claims, `${slug} source claim mapping`);
    const oldSummary = article.summary['zh-Hans'], oldBody = article.content['zh-Hans'];
    article.summary['zh-Hans'] = result.article.summary['zh-Hans'];
    article.content['zh-Hans'] = result.article.content['zh-Hans'];
    manifest.push({ slug, sourceZhSha: expectedSourceSha, oldSummarySha: sha256(oldSummary), newSummarySha: sha256(article.summary['zh-Hans']), oldContentSha: sha256(oldBody), newContentSha: sha256(article.content['zh-Hans']) });
  }
  verifyPatch(before, after);
  return { after, manifest };
}

async function main() {
  assert.equal(path.basename(candidateRoot), 'candidate');
  assert.equal(path.basename(releaseRoot), 'r286-incremental-card-wrap', 'local release scope only');
  const feedPath = path.join(candidateRoot, 'public/content/news-feed.json');
  const backupPath = path.join(releaseRoot, 'content-integration/baseline/news-feed.before.json');
  const raw = await readFile(feedPath);
  assert.equal(sha256(raw), expectedFeedSha, 'refuse stale or already applied feed');
  assert.deepEqual(await readFile(backupPath), raw, 'exact pre-existing backup required');
  assert.equal(sha256(await readFile(path.join(candidateRoot, 'src/data/partner-registry.js'))), expectedRegistrySha);
  const { after, manifest } = await preparePatch(JSON.parse(raw));
  const output = JSON.stringify(after, null, 2) + '\n';
  const evidence = { status: 'LOCAL_CANDIDATE_ONLY', baselineSha: expectedFeedSha, resultSha: sha256(output), articleCount: after.articles.length, changedLeafCount: 8, manifest };
  await writeFile(path.join(releaseRoot, 'content-integration/proposed-news-feed.json'), output);
  await writeFile(path.join(releaseRoot, 'content-integration/patch-manifest.json'), JSON.stringify(evidence, null, 2) + '\n');
  const temporary = feedPath + '.r286-local-tmp';
  await writeFile(temporary, output, { flag: 'wx' });
  try {
    assert.equal(sha256(await readFile(feedPath)), expectedFeedSha, 'feed changed during preparation');
    await rename(temporary, feedPath);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
  assert.equal(sha256(await readFile(feedPath)), evidence.resultSha);
  assert.equal(sha256(await readFile(path.join(candidateRoot, 'src/data/partner-registry.js'))), expectedRegistrySha);
  console.log(JSON.stringify(evidence, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
