import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../baseline/V3Pages.before-summary-span.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { restoreEvidenceJs: restoreEvidenceJs, restoreEvidenceCss: restoreEvidenceCss } = await import("./fixtures/r286-profile-evidence-summary-inverse.mjs");







const here = dirname(fileURLToPath(import.meta.url));
const candidateRoot = join(here, '..');
const reportRoot = join(candidateRoot, '..');
const current = restoreEvidenceJs(readFileSync(join(candidateRoot, 'src/components/v3/V3Pages.jsx'), 'utf8'));
const before = readFileSync(join(reportRoot, 'baseline/V3Pages.before-summary-span.jsx'), 'utf8');
const registry = readFileSync(join(candidateRoot, 'src/data/partner-registry.js'));
const css = restoreEvidenceCss(readFileSync(join(candidateRoot, 'src/components/v3/v3.css'), 'utf8'));
const beforeCss = readFileSync(join(reportRoot, 'baseline/v3.before-compare-summary-touch.css'), 'utf8');
const noteFixtureRaw = readFileSync(join(candidateRoot, 'tests/fixtures/r286-invitation-note-copy.json'));
assert.equal(createHash('sha256').update(noteFixtureRaw).digest('hex'), '9e71f7b50f196eb5eb1877914a5349e792a6a788aefd605efbd4dee7c9d58b53');
const noteFixture = JSON.parse(noteFixtureRaw);
assert.equal(noteFixture.baselineSHA, 'f063243966287ccaff5080c2bfaef3acf3c91ae9c69d3fac77cbd4951a0d90ab');

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

function restoreReviewedNoteSlice(source) {
  assert.deepEqual(Object.keys(noteFixture.new).sort(), ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'tr', 'es', 'pt-BR', 'fr', 'de', 'ru', 'ar', 'id', 'vi', 'it'].sort());
  assert.deepEqual(Object.keys(noteFixture.old).sort(), Object.keys(noteFixture.new).sort());
  let restored = source;
  for (const locale of Object.keys(noteFixture.new)) {
    const value = 'note: ' + JSON.stringify(noteFixture.new[locale]);
    assert.equal(restored.split(value).length, 2, `${locale} exact authorized note must occur once`);
    restored = restored.replace(value, 'note: ' + JSON.stringify(noteFixture.old[locale]));
  }
  const bodyMarker = '                  <strong>{venueCta.direct ? (isZhLocale ? zhText(locale, "使用上方官方入口继续", "使用上方官方入口繼續") : runtimeUi.stickyDirectRoute) : (isZhLocale ? zhText(locale, "先核对地区资格", "先核對地區資格") : runtimeUi.globalVerification)}</strong>\n';
  const bodyNote = '                  <small>{invitationSummary.note}</small>\n';
  assert.equal(restored.includes(bodyNote), false);
  assert.equal(restored.split(bodyMarker).length, 2);
  restored = restored.replace(bodyMarker, bodyMarker + bodyNote);
  assert.equal(sha256(restoreProfileRegistrationReviewLink(restored)), 'f063243966287ccaff5080c2bfaef3acf3c91ae9c69d3fac77cbd4951a0d90ab', 'only literal reviewed note slice plus the separately authorized profile CTA class hunk reverses to original comparison snapshot source');
  return restored;
}

function restoreProfileRegistrationReviewLink(source) {
  const authorized = '<LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`} className="button-quiet v3-profile-registration-review-link">{text.registrationPrepCta}</LocalLink>';
  const original = '<LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`} className="button-primary">{text.registrationPrepCta}</LocalLink>';
  assert.equal(source.split(authorized).length, 2, 'authorized profile registration review class hunk should occur once');
  assert.equal(source.includes(original), false, 'old primary class should not remain on the secondary profile review link');
  return source.replace(authorized, original);
}

function restoreProfileRegistrationReviewCss(source) {
  const rule = '  .v3-profile-page .v3-hero-actions .v3-profile-registration-review-link {\n    grid-column: 1 / -1;\n    min-height: 44px;\n  }\n';
  assert.equal(source.split(rule).length, 2, 'authorized profile review link mobile CSS should occur once');
  return source.replace(rule, '');
}

function snapshotSummaryBlock(source) {
  const start = source.indexOf('<details id="compare-snapshot"');
  assert.ok(start > -1, 'compare snapshot details must exist');
  const end = source.indexOf('<SnapshotStrip items={snapshotItems} />', start);
  assert.ok(end > start, 'snapshot strip should follow the summary');
  return source.slice(start, end);
}

function hrefTokens(source) {
  return [...source.matchAll(/href=\{?[^\n>]+/g)].map((m) => m[0]);
}

test('R286 compare snapshot summary drops only the duplicate intro line', () => {
  const block = snapshotSummaryBlock(current);
  assert.match(block, /<strong>\{compareLabels\.metrics \|\| text\.compareVerdictEyebrow\}<\/strong>/);
  assert.doesNotMatch(block, /<span>\{text\.compareIntro\}<\/span>/, 'snapshot summary should not repeat the compare intro');
  assert.match(block, /<b aria-hidden="true">＋<\/b>/);
  assert.match(current, /hint:\s*text\.compareIntro/, 'snapshot items still retain their existing intro hint');
  assert.match(current, /<p>\{text\.compareIntro\}<\/p>/, 'main compare lead remains unchanged elsewhere');
});

test('R286 inverse insertion restores the backed-up V3Pages snapshot exactly', () => {
  const marker = '        <strong>{compareLabels.metrics || text.compareVerdictEyebrow}</strong>\n        <b aria-hidden="true">＋</b>';
  assert.ok(current.includes(marker), 'summary marker must be unique enough for the inverse patch');
  const noteRestored = restoreProfileRegistrationReviewLink(restoreReviewedNoteSlice(current));
  const restored = noteRestored.replace(marker, '        <strong>{compareLabels.metrics || text.compareVerdictEyebrow}</strong>\n        <span>{text.compareIntro}</span>\n        <b aria-hidden="true">＋</b>');
  assert.equal(sha256(before), '248ea30de902f957131837d638aa473f6546ab7593b9b7881a8912e762ce3094');
  assert.equal(sha256(restored), sha256(before), 'reinserting the removed line must restore the V3Pages backup byte hash');
});



test('R286 compare snapshot summary keeps a 44px native touch target with a reversible CSS hunk', () => {
  const rule = '.v3-compare-snapshot-disclosure > summary {\n  min-height: 44px;\n  box-sizing: border-box;\n}\n';
  assert.equal(css.split(rule).length, 2, 'exact scoped compare snapshot summary rule should appear once');
  const cssWithoutProfileReview = restoreProfileRegistrationReviewCss(stripApprovedOpenSnapshot(css));
  assert.throws(() => stripApprovedOpenSnapshot(css + "\n/* rogue */\n"));
  assert.throws(() => stripApprovedOpenSnapshot(css.replace("overflow: visible;\n  -webkit-line-clamp: unset;", "overflow: hidden;\n  -webkit-line-clamp: 2;")));
  assert.equal(sha256(cssWithoutProfileReview.replace('\n' + rule, '')), sha256(beforeCss), 'removing only the scoped touch rule and authorized profile CTA rule must restore the CSS backup');
  assert.doesNotMatch(rule, /display\s*:/, 'rule should preserve existing native summary display/cascade');
});

test('R286 compare cleanup does not change href ownership or partner registry', () => {
  assert.deepEqual(hrefTokens(restoreProfileRegistrationReviewLink(current)), hrefTokens(before), 'all V3Pages href expressions must remain ordered and identical after reversing the authorized profile CTA class hunk');
  assert.equal(sha256(registry), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

test('R286 compound inverse rejects foreign edits and damaged note values', () => {
  assert.throws(() => restoreReviewedNoteSlice(current + '\n// foreign unauthorized content\n'));
  assert.throws(() => restoreReviewedNoteSlice(current.replace('<span>{invitationSummary.note}</span>', '<span>{invitationSummary.note}</span><span>Foreign body text</span>')));
  assert.throws(() => restoreReviewedNoteSlice(current.replace(noteFixture.new.en, 'An unapproved invitation claim.')));
});


test('R286 profile registration review link remains quiet without changing href ownership', () => {
  const authorized = '<LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`} className="button-quiet v3-profile-registration-review-link">{text.registrationPrepCta}</LocalLink>';
  assert.equal(current.split(authorized).length, 2);
  assert.doesNotMatch(current, /href=\{`\/exchanges\/\$\{profile\.slug\}\?\$\{contextSearch\}#registration-path`\} className="button-primary">\{text\.registrationPrepCta\}/);
  const restored = restoreProfileRegistrationReviewLink(current);
  assert.match(restored, /href=\{`\/exchanges\/\$\{profile\.slug\}\?\$\{contextSearch\}#registration-path`\} className="button-primary">\{text\.registrationPrepCta\}/);
});

const approvedOpenSnapshotHunk = "\n.v3-compare-snapshot-disclosure[open] .v3-snapshot-strip b,\n.v3-compare-snapshot-disclosure[open] .v3-snapshot-strip p {\n  display: block;\n  max-height: none;\n  overflow: visible;\n  -webkit-line-clamp: unset;\n  -webkit-box-orient: initial;\n  white-space: normal;\n  overflow-wrap: anywhere;\n}\n";
function stripApprovedOpenSnapshot(source) {
  assert.equal(source.split(approvedOpenSnapshotHunk).length, 2, "exact separately authorized open snapshot rule once");
  const restored = source.replace(approvedOpenSnapshotHunk, "");
  assert.equal(sha256(restored), "9aee0ffeb8a33d4a94770c063d71a27162b8485ff4f92dc92004488715acd5a6", "all other CSS bytes remain frozen");
  return restored;
}
}
