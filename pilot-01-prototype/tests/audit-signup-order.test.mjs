import test from 'node:test';
import assert from 'node:assert/strict';
import { REFERRAL_PARTNERS } from '../src/data/referral-partners.generated.js';
import { referralSeoFor } from '../src/data/referral-seo.js';
import { localizedPath } from '../src/data/locale-routing.js';
import worker, { routeMetadata } from '../worker/index.js';

const locales = ['en', 'zh-Hans', 'es', 'pt-BR', 'fr', 'de', 'it', 'ja', 'ko', 'tr', 'id'];
const shell = '<!doctype html><html><head><title>Shell</title></head><body></body></html>';
const env = { ASSETS: { fetch: async request => new URL(request.url).pathname === '/index.html'
  ? new Response(shell, { headers: { 'content-type': 'text/html' } })
  : new Response('missing', { status: 404 }) } };

test('every promoted exchange metadata enters the code before KYC in every locale', async () => {
  for (const partner of REFERRAL_PARTNERS) {
    for (const locale of locales) {
      const seo = referralSeoFor(partner.slug, locale);
      if (!seo || !seo.description.includes('KYC')) continue;
      assert.ok(seo.description.indexOf(partner.inviteCode) < seo.description.indexOf('KYC'), `${partner.slug}/${locale}: ${seo.description}`);
      const url = new URL(localizedPath(`/exchanges/${partner.slug}`, locale), 'https://nexualpha.com');
      const metadata = await routeMetadata(url, env);
      if (metadata.description.includes(partner.inviteCode) && metadata.description.includes("KYC")) {
        assert.ok(metadata.description.indexOf(partner.inviteCode) < metadata.description.indexOf("KYC"), `${partner.slug}/${locale}: served metadata`);
      }
    }
  }
});

test('OKX description, Open Graph and Twitter preserve the same signup order', async () => {
  for (const locale of locales) {
    const url = new URL(localizedPath('/exchanges/okx', locale), 'https://nexualpha.com');
    const response = await worker.fetch(new Request(url), env, {});
    const html = await response.text();
    for (const marker of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
      const tag = html.match(new RegExp(`<meta[^>]*${marker}[^>]*>`))?.[0];
      assert.ok(tag, `${locale}: ${marker}`);
      if (tag.includes('KYC')) assert.ok(tag.includes('nexu888') && tag.indexOf('nexu888') < tag.indexOf('KYC'), `${locale}: ${tag}`);
    }
  }
});
