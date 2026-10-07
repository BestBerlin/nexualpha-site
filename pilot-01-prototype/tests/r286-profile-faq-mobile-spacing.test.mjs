import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/components/v3/crossroads-compare.css', import.meta.url), 'utf8');
const beforeCss = readFileSync(new URL('../baseline/crossroads-compare.before-profile-faq-mobile-spacing.css', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));
const venueFaq = readFileSync(new URL('../src/components/v3/VenueFaqSection.jsx', import.meta.url), 'utf8');

const expectedRegistrySha = '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a';
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

test('profile FAQ mobile spacing patch reverses exactly and keeps registry untouched', () => {
  assert.equal(sha256(css.replace(profileFaqMobileBlock, '')), sha256(beforeCss), 'removing only the profile FAQ mobile spacing block must restore the backed-up CSS');
  assert.equal(sha256(registry), expectedRegistrySha, 'partner registry SHA must remain protected');
});
