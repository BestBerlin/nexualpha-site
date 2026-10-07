import assert from 'node:assert/strict';
import test from 'node:test';
import { buildNextDecisionBridge } from '../src/data/next-decision-bridge.js';
import { buildRegionalShortlist } from '../src/data/regional-shortlist.js';

test('regional shortcut preserves the selected shortlist profile passport', () => {
  for (const accountStage of ['new_account', 'another_platform', 'existing_account']) {
    const shortlist = buildRegionalShortlist({ market: 'MX', product: 'spot', locale: 'es', accountStage, funding: 'SPEI' });
    const candidate = shortlist.candidates.find(c => c.slug && c.directHref);
    assert.ok(candidate);
    const bridge = buildNextDecisionBridge({ locale: 'es', market: 'MX', product: 'spot', profileSlug: candidate.slug, profileHref: candidate.directHref });
    const url = new URL(bridge.actions.find(a => a.id === 'profile').href, 'https://nexualpha.com');
    assert.equal(url.pathname, `/es/exchanges/${candidate.slug}`);
    assert.equal(url.searchParams.get('account_stage'), accountStage);
    assert.equal(url.searchParams.get('funding'), 'SPEI');
    assert.equal(url.searchParams.get('market'), 'MX');
    assert.equal(url.searchParams.get('product'), 'spot');
  }
});

test('profile shortcut cannot accept an external or different platform route', () => {
  for (const profileHref of ['https://example.com/exchanges/binance', '//example.com/exchanges/binance', '/exchanges/okx?market=MX']) {
    const bridge = buildNextDecisionBridge({ locale: 'es', market: 'MX', product: 'spot', profileSlug: 'binance', profileHref });
    assert.equal(new URL(bridge.actions.find(a => a.id === 'profile').href, 'https://nexualpha.com').pathname, '/es/exchanges/binance');
  }
});
