import { restoreEvidenceJs as inverseJs, restoreEvidenceCss as inverseCss } from './fixtures/r286-profile-evidence-summary-inverse.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const hash = value => createHash('sha256').update(value).digest('hex');
test('only redundant Chinese evidence span is removed; all remaining JSX bytes preserved', async () => {
  const source = await readFile(new URL('src/components/v3/V3Pages.jsx', root), 'utf8');
  const before = await readFile(new URL('../../profile-evidence-summary-fix/V3Pages.before.jsx', import.meta.url), 'utf8');
  assert.equal(inverseJs(source), before);
  assert.ok(source.includes('zhText(locale, "展开深度核验资料", "展開深度核驗資料") : (detailLabels.deeper || "Open deeper verification material")'));
  for (const rogue of [source + '\n/* rogue */', source.replace('Open deeper verification material', 'Removed verification material'), source.replace('#registration-path', '#rogue')]) assert.throws(() => inverseJs(rogue));
});
test('only evidence drawer columns change; min heights, body and other summaries remain byte-identical', async () => {
  const source = await readFile(new URL('src/components/v3/v3.css', root), 'utf8');
  const before = await readFile(new URL('../../profile-evidence-summary-fix/v3.before.css', import.meta.url), 'utf8');
  assert.equal(inverseCss(source), before);
  for (const rogue of [source + '\n/* rogue */', source.replace('.v3-profile-page .v3-profile-evidence-drawer > summary', '.v3-profile-page summary'), source.replace('grid-template-columns: 1fr auto;\n}', 'grid-template-columns: auto 1fr;\n}')]) assert.throws(() => inverseCss(rogue));
  assert.ok(source.includes('.v3-compare-snapshot-disclosure > summary > b {\n  display: none;\n}'));
  assert.throws(() => inverseCss(source.replace('> summary > b {\n  display: none;', '> summary b {\n  display: none;')));
  const registry = await readFile(new URL('src/data/partner-registry.js', root));
  assert.equal(hash(registry), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
