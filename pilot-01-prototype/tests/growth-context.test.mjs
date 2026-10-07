import test from 'node:test';
import assert from 'node:assert/strict';
import { appendGrowthQuery, getGrowthContext, growthQuery, sanitizeAccountStage, sanitizeFunding, sanitizeMarket, sanitizeProduct, targetMarketFromPath, targetProductFromPath, whitelistGrowthParams } from '../src/data/growth-context.js';

test('growth context keeps only controlled market product and public channel slugs', () => {
  assert.deepEqual(getGrowthContext('?market=BR&product=spot&utm_campaign=br_pix&publisher=creator_a&gclid=secret'), {
    market: 'BR',
    product: 'spot',
    campaign: 'br_pix',
    publisher: 'creator_a',
  });
  assert.deepEqual(getGrowthContext('?market=Brazil&product=all&utm_campaign=https://evil.example'), {
    market: 'unknown',
    product: 'unknown',
  });
  assert.equal(sanitizeMarket('tw'), 'TW');
  assert.equal(sanitizeMarket('other'), 'OTHER');
  assert.equal(sanitizeProduct('perp-dex'), 'perp_dex');
  assert.equal(sanitizeProduct('cex'), 'cex');
  assert.equal(sanitizeAccountStage('new_account'), 'new_account');
  assert.equal(sanitizeAccountStage('email=bad'), null);
  assert.equal(targetMarketFromPath('/br/pix'), 'BR');
  assert.equal(targetProductFromPath('/br'), 'spot');
  assert.deepEqual(getGrowthContext('?locale=pt-BR', { pathname: '/br' }), { market: 'BR', product: 'spot' });
  assert.equal(getGrowthContext('?locale=pt-BR', { pathname: '/' }).market, 'unknown');
  assert.equal(getGrowthContext('?market=other', { pathname: '/br' }).market, 'OTHER');
  assert.equal(getGrowthContext('', { pathname: '/hk' }).market, 'HK');
  assert.equal(getGrowthContext('', { pathname: '/eu' }).market, 'EU');
  assert.equal(getGrowthContext('', { pathname: '/uk' }).market, 'UK');
  assert.equal(getGrowthContext('', { pathname: '/int' }).market, 'OTHER');
});

test('growth query propagation excludes personal and raw click identifiers', () => {
  assert.equal(growthQuery('?utm_source=telegram&utm_campaign=br_pix&publisher=creator_a&market=BR&product=spot&gclid=raw'), 'utm_source=telegram&utm_campaign=br_pix&publisher=creator_a&market=BR&product=spot');
  assert.equal(appendGrowthQuery('/markets/br#calculator', '?utm_source=telegram&publisher=creator_a&market=BR'), '/markets/br?utm_source=telegram&publisher=creator_a&market=BR#calculator');
  assert.equal(whitelistGrowthParams('?market=BR&product=spot&email=a@example.com&fbclid=secret').toString(), 'market=BR&product=spot');
});

test('growth context preserves only the controlled account-stage lane', () => {
  assert.deepEqual(getGrowthContext('?market=MX&product=spot&account_stage=existing_account'), {
    market: 'MX', product: 'spot', accountStage: 'existing_account',
  });
  assert.equal(growthQuery('?market=MX&product=spot&account_stage=another_platform'), 'market=MX&product=spot&account_stage=another_platform');
  assert.equal(whitelistGrowthParams('?market=MX&account_stage=token=bad').toString(), 'market=MX');
});

test('growth context preserves only a reviewed market-matched funding route', () => {
  assert.equal(sanitizeFunding('SPEI', 'MX'), 'SPEI');
  assert.equal(sanitizeFunding('Pix', 'MX'), null);
  assert.deepEqual(getGrowthContext('?market=MX&product=spot&account_stage=new_account&funding=SPEI'), {
    market: 'MX', product: 'spot', accountStage: 'new_account', funding: 'SPEI',
  });
  assert.equal(growthQuery('?market=MX&product=spot&account_stage=new_account&funding=SPEI'), 'market=MX&product=spot&account_stage=new_account&funding=SPEI');
  assert.equal(whitelistGrowthParams('?market=MX&funding=Pix').toString(), 'market=MX');
});


test('international intent products retain distinct labels', () => {
  for (const product of ['unknown','spot','futures','perpetuals','perp_dex','dex','cex','copy_trading','earn','wallet']) assert.equal(sanitizeProduct(product), product);
});
