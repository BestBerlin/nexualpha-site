import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r284-resume-type/candidate/src/components/v3/venue-yellow-pages.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const here = dirname(fileURLToPath(import.meta.url));
const candidateRoot = join(here, '..');
const baseRoot = join(candidateRoot, '..', '..', 'r284-resume-type', 'candidate');
const css = readFileSync(join(candidateRoot, 'src/components/v3/venue-yellow-pages.css'), 'utf8');
const baseCss = readFileSync(join(baseRoot, 'src/components/v3/venue-yellow-pages.css'), 'utf8');
const jsx = readFileSync(join(candidateRoot, 'src/components/v3/VenueYellowPages.jsx'), 'utf8');
const registry = readFileSync(join(candidateRoot, 'src/data/partner-registry.js'));
const sha256 = (input) => createHash('sha256').update(input).digest('hex');

test('R286 directory copy row visibility keeps compact hidden while restoring expanded directory details', () => {
  assert.match(baseCss, /\.yellow-card--directory > div > \.yellow-card__perk-row \{\s*display:\s*none;\s*\}/, 'R284 baseline has the inherited broad hide selector');
  assert.doesNotMatch(css, /\.yellow-card--directory > div > \.yellow-card__perk-row \{\s*display:\s*none;\s*\}/, 'current CSS removes the broad hide selector');
  assert.match(css, /\.yellow-card--directory > div:not\(\.yellow-card__directory-details\) > \.yellow-card__perk-row \{\s*display:\s*none;\s*\}/, 'current CSS hides non-details directory perk rows only');
  assert.match(css, /\.yellow-pages__grid--compact \.yellow-card__fit,\s*\.yellow-pages__grid--compact \.yellow-card__meta-grid,\s*\.yellow-pages__grid--compact \.yellow-card__perk-row \{\s*display:\s*none;\s*\}/, 'homepage compact hiding remains intact');
  assert.match(jsx, /className="yellow-card__directory-details"[\s\S]*?<div className="yellow-card__perk-row yellow-card__perk-row--directory">/, 'directory copy row remains inside the expandable details container');
  assert.match(jsx, /onClick=\{\(e\) => handleCopyCode\(inviteCode, `\$\{venue\.slug\}-directory`, e\)\}/, 'directory copy entry still uses the guarded copy handler');
  assert.equal(sha256(registry), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
}
