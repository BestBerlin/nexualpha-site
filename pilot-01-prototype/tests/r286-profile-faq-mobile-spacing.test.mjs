import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/components/v3/crossroads-compare.css', import.meta.url), 'utf8');
const beforeCss = readFileSync(new URL('../baseline/crossroads-compare.before-profile-faq-mobile-spacing.css', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));
const venueFaq = readFileSync(new URL('../src/components/v3/VenueFaqSection.jsx', import.meta.url), 'utf8');

const expectedRegistrySha = '3a69b03020089ccb700370fcac011230635fe21d00a5cdae39d342284b78ef83';
const profileFaqMobileBlock = `
/* R286 profile FAQ mobile spacing: keep Bitget/venue FAQ questions readable at 320px
   without changing compare FAQ, answers, colors, or desktop spacing. */
@media (max-width: 480px) {
  .v3-faq-section#faq .v3-faq-summary {
    padding-inline: 0.75rem;
    gap: 0.5rem;
  }

  .v3-faq-section#faq .v3-faq-summary-left {
    gap: 0.5rem;
  }
}
`;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

test('profile FAQ mobile spacing is scoped to the venue profile FAQ only', () => {
  assert.ok(css.includes(profileFaqMobileBlock), 'expected exact profile FAQ mobile spacing block');
  assert.match(css, /\.v3-faq-summary \{[\s\S]*padding:\s*1rem 1\.125rem;[\s\S]*font-size:\s*0\.9375rem;/, 'base desktop FAQ summary rule must remain unchanged');
  assert.match(css, /\.v3-faq-summary-left \{[\s\S]*gap:\s*0\.625rem;/, 'base inner gap must remain unchanged outside the mobile profile override');
  assert.doesNotMatch(profileFaqMobileBlock, /compare-faq/, 'profile mobile override must not target compare FAQ');
  assert.match(venueFaq, /<section className="v2-section v3-faq-section" id="faq">/, 'venue profile FAQ route keeps id=faq for scoped CSS');
});

test('profile FAQ keeps a unique scoped mobile rule and reviewed partner integrity', () => {
  assert.equal(css.split(profileFaqMobileBlock).length - 1, 1, 'profile mobile override is not duplicated');
  assert.doesNotMatch(profileFaqMobileBlock, /display:\s*none|overflow:\s*hidden|font-size|color:/);
  assert.equal(sha256(registry), expectedRegistrySha, 'current reviewed registry stays byte protected');
});
