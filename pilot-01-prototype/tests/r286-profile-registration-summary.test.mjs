import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { registrationSummaryHunk, restoreRegistrationSummary } from './fixtures/r286-registration-summary-inverse.mjs';
const root = new URL('../', import.meta.url);
const hash = value => createHash('sha256').update(value).digest('hex');
test('profile registration mobile title plus and full hint get explicit rows without changing baseline bytes', async () => {
  const css=await readFile(new URL('src/styles/v3-layout-stability.css',root),'utf8');
  const backup=await readFile(new URL('../../profile-registration-summary-fix/v3-layout-stability.before.css',import.meta.url),'utf8');
  assert.ok(css.endsWith(registrationSummaryHunk));
  assert.equal(restoreRegistrationSummary(css),backup);
  for (const rogue of [css+'\n/* rogue */',css.replace('max-width: 780px) {\n  .v3-profile-page .v3-registration-notes','max-width: 900px) {\n  .v3-profile-page .v3-registration-notes'),css.replace('.v3-profile-page .v3-registration-notes > summary > span {','.v3-registration-notes > summary > span {'),css.replace('grid-row: 2;\n    min-width: 0;', 'grid-row: 1;\n    min-width: 0;')]) assert.throws(()=>restoreRegistrationSummary(rogue));
});
test('profile JSX text native details and commercial registry remain fully frozen', async()=>{
  assert.equal(hash(await readFile(new URL('src/components/v3/V3Pages.jsx',root))),'4c950ca43150078f2d0d82bba1b90872779e18f1f141c082333a20c9a9734057');
  assert.equal(hash(await readFile(new URL('src/data/partner-registry.js',root))),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
