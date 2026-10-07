import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const candidateRoot = join(here, '..');
const reportRoot = join(candidateRoot, '..');
const sourcePath = join(candidateRoot, 'src/components/v3/VenueFaqSection.jsx');
const beforePath = join(reportRoot, 'baseline/VenueFaqSection.before-zh-nonpriority-faq.jsx');
const currentSource = readFileSync(sourcePath, 'utf8');
const beforeSource = readFileSync(beforePath, 'utf8');
const registry = readFileSync(join(candidateRoot, 'src/data/partner-registry.js'));

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

function hrefTokens(source) {
  return [...source.matchAll(/href=\{?[^\n>]+/g)].map((m) => m[0]);
}

async function renderVenueFaqFixture() {
  const dir = await mkdtemp(join(candidateRoot, 'tests/.tmp-r286-faq-'));
  try {
    const entry = join(dir, 'entry.mjs');
    const bundle = join(dir, 'bundle.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { VenueFaqSection } from '../../src/components/v3/VenueFaqSection.jsx';
      import { venueDatabase } from '../../src/data/venue-database.js';
      import { venueProfile } from '../../src/data/v3-product.js';
      function render(slug, locale) {
        const venue = venueDatabase[slug];
        return renderToStaticMarkup(React.createElement(VenueFaqSection, {
          venue,
          profile: venueProfile(venue, locale),
          locale,
          db: venue,
          partner: venue,
        }));
      }
      console.log(JSON.stringify({
        bitgetHans: render('bitget', 'zh-Hans'),
        bitgetHant: render('bitget', 'zh-Hant'),
        binanceHans: render('binance', 'zh-Hans'),
      }));
    `);
    execFileSync(join(candidateRoot, 'node_modules/.bin/esbuild'), [
      entry,
      '--bundle',
      '--format=cjs',
      '--platform=node',
      `--outfile=${bundle}`,
      '--loader:.css=empty',
      '--log-level=warning',
    ], { cwd: candidateRoot, stdio: 'pipe' });
    return JSON.parse(execFileSync('node', [bundle], { cwd: candidateRoot, encoding: 'utf8' }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('R286 Bitget non-priority FAQ intro uses native simplified and traditional Chinese copy', async () => {
  const rendered = await renderVenueFaqFixture();
  assert.match(rendered.bitgetHans, /交易前常见问题/);
  assert.match(rendered.bitgetHans, /费用与使用条件问答/);
  assert.match(rendered.bitgetHans, /按具体问题查看答案及对应官方来源。/);
  assert.doesNotMatch(rendered.bitgetHans, /SEO FAQ|官方真实费率|默克尔树链上储备金/);

  assert.match(rendered.bitgetHant, /交易前常見問題/);
  assert.match(rendered.bitgetHant, /費用與使用條件問答/);
  assert.match(rendered.bitgetHant, /按具體問題查看答案及對應官方來源。/);
  assert.doesNotMatch(rendered.bitgetHant, /SEO FAQ|官方真實費率|默克爾樹鏈上儲備金/);
});

test('R286 priority FAQ path and body boundaries remain protected', async () => {
  const rendered = await renderVenueFaqFixture();
  assert.match(rendered.binanceHans, /交易前常见问题/);
  assert.match(rendered.binanceHans, /费用与使用条件问答/);
  assert.match(rendered.binanceHans, /官方来源/);
  assert.match(currentSource, /priorityAnswer \? priorityUi\.eyebrow : \(nonPriorityUi\.eyebrow/);
  assert.match(currentSource, /const faqs = priorityAnswer \? priorityAnswer\.faq\.map/);
  assert.match(currentSource, /getVenueFaqs\(venue, profile, locale, db, partner\)/);
});

test('R286 FAQ hunk is exactly reversible and does not change hrefs or registry', () => {
  const oldBlock = `          <span className="v3-faq-card__eyebrow">\n            ❓ {priorityAnswer ? priorityUi.eyebrow : isHant ? "高意圖搜尋問答與安全指南 · SEO FAQ" : isZh ? "高頻搜尋問答與安全指南 · SEO FAQ" : (faqUi.eyebrow || "HIGH-INTENT FAQ & SECURITY GUIDE")}\n          </span>\n          <h2 className="v3-faq-card__title">\n            {priorityAnswer ? priorityUi.title : isHant ? \`${'${locName}'} 費率計算、儲備金驗資與安全防騙常見問題\` : isZh ? \`${'${locName}'} 費率計算、儲備金驗資與安全防坑常見問題\` : (faqUi.title || \`${'${profile.name}'} Fees, Reserves Verification & FAQ\`)}\n          </h2>\n          <p className="v3-faq-card__lead">\n            {priorityAnswer ? priorityUi.lead : isHant\n              ? "依據官方費率政策、默克爾樹鏈上儲備金報告與防釣魚來源核對，解答開戶與交易前最重要的問題。"\n              : isZh\n                ? "基於官方真實費率政策、默克爾樹鏈上儲備金報告與反釣魚來源核對，解答開戶與交易前交易者最關心的核心問題。"\n              : (faqUi.lead || "Direct, source-backed answers to critical questions regarding trading fees, Proof of Reserves, KYC, and security.")}\n          </p>`;
  const newBlock = `          <span className="v3-faq-card__eyebrow">\n            ❓ {priorityAnswer ? priorityUi.eyebrow : (nonPriorityUi.eyebrow || "HIGH-INTENT FAQ & SECURITY GUIDE")}\n          </span>\n          <h2 className="v3-faq-card__title">\n            {priorityAnswer ? priorityUi.title : (nonPriorityUi.title || \`${'${profile.name}'} Fees, Reserves Verification & FAQ\`)}\n          </h2>\n          <p className="v3-faq-card__lead">\n            {priorityAnswer ? priorityUi.lead : (nonPriorityUi.lead || "Direct, source-backed answers to critical questions regarding trading fees, Proof of Reserves, KYC, and security.")}\n          </p>`;
  const restored = currentSource
    .replace('  const nonPriorityUi = isZh ? priorityUi : faqUi;\n', '')
    .replace(newBlock, oldBlock);
  assert.equal(sha256(restored), sha256(beforeSource), 'exact inverse patch must restore the VenueFaqSection backup');
  assert.deepEqual(hrefTokens(currentSource), hrefTokens(beforeSource), 'href expressions must remain unchanged');
  assert.equal(sha256(registry), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
