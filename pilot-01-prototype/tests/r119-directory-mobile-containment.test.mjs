import { committedFileHash } from './r100-test-contracts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const css = readFileSync(new URL('../src/components/v3/venue-yellow-pages.css', import.meta.url), 'utf8');
const jsx = readFileSync(new URL('../src/components/v3/VenueYellowPages.jsx', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));

test('R119 directory mobile containment overrides later desktop card rules instead of clipping overflow', () => {
  assert.match(css, /\.yellow-pages \{[\s\S]*overflow-x: visible;/, 'directory shell must not hide a wider card as a fake fix');
  const desktopDirectoryRule = css.indexOf('.yellow-card--directory {\n  display: grid;');
  const mobileContainmentRule = css.indexOf('R119 mobile directory containment');
  assert.ok(desktopDirectoryRule > -1, 'test must locate the desktop directory rule');
  assert.ok(mobileContainmentRule > desktopDirectoryRule, 'mobile containment must come after the desktop directory card rule in cascade order');
  assert.doesNotMatch(css, /grid-template-columns:\s*minmax\(0, 1\.15fr\) minmax\(23rem, 0\.85fr\)/, 'desktop directory card must not reserve a fixed 23rem second column');
  assert.match(css, /\.yellow-card--directory \{[\s\S]*grid-template-columns:\s*minmax\(0, 1\.15fr\) minmax\(0, 0\.85fr\);/, 'desktop directory card must use naturally shrinkable columns');
  assert.match(css, /\.yellow-card--directory \.yellow-card__actions \{[\s\S]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);/, 'desktop actions must not reserve fixed button widths');
  assert.match(css, /R119 desktop directory shrink safety[\s\S]*\.yellow-card--directory > div,[\s\S]*min-width:\s*0;[\s\S]*max-width:\s*100%;/, 'direct directory card cells must be shrinkable grid items');
  assert.match(css, /\.yellow-card--directory \.yellow-card__actions > \* \{[\s\S]*width:\s*100%;[\s\S]*white-space:\s*normal;[\s\S]*overflow-wrap:\s*anywhere;/, 'desktop action children must wrap inside their grid tracks');
  assert.match(css.slice(mobileContainmentRule), /@media \(max-width: 1180px\)[\s\S]*\.yellow-card--directory \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(css.slice(mobileContainmentRule), /\.yellow-card__directory-details \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(css.slice(mobileContainmentRule), /\.yellow-card--directory \.yellow-card__actions \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);/);
});

test('R119 directory mobile controls remain reachable and wrap long locale text', () => {
  const mobileBlock = css.slice(css.indexOf('R119 mobile directory containment'));
  for (const selector of ['yellow-card__btn-toggle', 'yellow-card__btn-detail', 'yellow-card__btn-register', 'yellow-card__btn-compare']) {
    assert.match(mobileBlock, new RegExp(`\\.${selector}[\\s\\S]*width: 100%;[\\s\\S]*white-space: normal;[\\s\\S]*overflow-wrap: anywhere;`), `${selector} must fit the card and wrap`);
  }
  assert.match(mobileBlock, /\.yellow-pages__tabs,[\s\S]*\.yellow-pages__filter-chips \{[\s\S]*width: 100%;[\s\S]*max-width: 100%;/);
  assert.match(mobileBlock, /\.yellow-pages__tab,[\s\S]*\.yellow-pages__chip \{[\s\S]*max-width: min\(78vw, 18rem\);[\s\S]*overflow-wrap: anywhere;/);
  assert.match(css, /\.yellow-pages__tabs[\s\S]*overflow-x: auto;/, 'tabs may scroll locally instead of forcing document overflow');
  assert.match(css, /\.yellow-pages__filter-chips[\s\S]*overflow-x: auto;/, 'filter chips may scroll locally instead of forcing document overflow');
});

test('R119 directory CTA href ownership is unchanged', () => {
  assert.match(jsx, /href=\{localizedHref\(`\/exchanges\/\$\{venue\.slug\}\?\$\{contextSearch\}`, \{ locale \}\)\}/, 'detail links must still navigate to exchange detail pages');
  assert.match(jsx, /href=\{registrationUrl\}[\s\S]*className="yellow-card__btn-register"/, 'registration CTA must still use the resolved partner URL');
  const sha = createHash('sha256').update(registry).digest('hex');
  assert.equal(sha, committedFileHash('src/data/partner-registry.js'));
});
