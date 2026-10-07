import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { contextualHref } from '../src/data/contextual-href.js';
import { regionalDirectoryHref, regionalToolHref } from '../src/data/regional-directory.js';
import { defaultDirectoryCategory, directoryContext, directoryContextSearch, filterDirectoryVenues, regionalCtaState, venueMarketStatus } from '../src/data/directory-context.js';
import { buildRegionalDecisionSet } from '../src/data/regional-decision.js';
import { marketEntryBrief } from '../src/data/market-entry-brief.js';
import { internationalSourcesFor, INTERNATIONAL_SOURCE_REVIEWED_AT } from '../src/data/international-source-registry.js';
import { aeoQuestionText } from '../src/data/aeo-question-registry.js';
import { regionalPageBoundary, regionalQuestionNextSteps } from '../src/data/regional-preview-copy.js';
import { REGIONAL_SHORTLIST_STATES, buildRegionalShortlist, regionalShortlistAccountStageOptions, regionalShortlistCopy, regionalShortlistMarketOptions, regionalShortlistProductOptions } from '../src/data/regional-shortlist.js';
import { readFileSync } from 'node:fs';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function renderRegionalMarketPreview(props) {
  const tempDir = await mkdtemp(path.join(projectRoot, 'tests/.tmp-regional-preview-'));
  try {
    const entryPath = path.join(tempDir, 'entry.mjs');
    const bundlePath = path.join(tempDir, 'bundle.cjs');
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";

      const html = renderToStaticMarkup(React.createElement(RegionalMarketPreview, ${JSON.stringify(props)}));
      console.log(html);
    `);

    const esbuildBin = path.join(projectRoot, 'node_modules/.bin/esbuild');
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      '--bundle',
      '--platform=node',
      '--format=cjs',
      `--outfile=${bundlePath}`,
      '--loader:.css=empty',
      '--log-level=warning',
    ], { cwd: projectRoot, stdio: 'pipe' });

    return execFileSync('node', [bundlePath], { cwd: projectRoot, encoding: 'utf8' });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test('regional research previews have usable metadata without becoming indexable offers', () => {
  for (const [market, locale, expected] of [
    ['VN', 'vi', 'Việt Nam'],
  ]) {
    const seo = computeRouteSeo({
      url: `https://nexualpha.com/${market.toLowerCase()}`,
      locale,
      route: { name: 'regionalPreview', market },
    });
    assert.equal(seo.status, 200);
    assert.equal(seo.robots, 'noindex,follow');
    assert.match(seo.title, new RegExp(expected));
    assert.match(seo.canonical, new RegExp(`/${market.toLowerCase()}$`));
  }
});

test('Indonesia preview graduates into a source-backed Indonesian owner page', () => {
  const seo = computeRouteSeo({
    url: 'https://nexualpha.com/id',
    locale: 'id',
    route: { name: 'regionalPreview', market: 'ID' },
  });
  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.canonical, 'https://nexualpha.com/id');
  assert.match(seo.title, /Indonesia|OJK|Bappebti|IDR/);
});

test('Taiwan preview graduates into a source-backed Traditional Chinese owner page', () => {
  const seo = computeRouteSeo({
    url: 'https://nexualpha.com/tw',
    locale: 'zh-Hant',
    route: { name: 'regionalPreview', market: 'TW' },
  });
  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.canonical, 'https://nexualpha.com/tw');
  assert.match(seo.title, /台灣/);
});

test('Vietnam remains a Vietnamese noindex research preview without direct CTA claims', () => {
  const seo = computeRouteSeo({
    url: 'https://nexualpha.com/vn',
    locale: 'vi',
    route: { name: 'regionalPreview', market: 'VN' },
  });
  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'noindex,follow');
  assert.equal(seo.locale, 'vi');
  assert.equal(seo.canonical, 'https://nexualpha.com/vn');
  assert.match(seo.title, /Việt Nam|Vietnam/i);
  assert.doesNotMatch(JSON.stringify(seo.schemas), /nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin|guaranteed|bonus|private commission/i);

  const registry = internationalSourcesFor('VN');
  assert.match(registry.authority, /pending/i);
  assert.equal(registry.sources.length, 0);

  const shortlistCopy = regionalShortlistCopy('vi');
  assert.equal(shortlistCopy.heading, 'Danh sách nghiên cứu theo khu vực');
  assert.equal(shortlistCopy.residence, 'Nơi cư trú');
  assert.doesNotMatch(JSON.stringify(shortlistCopy), /Regional shortlist|Tune the shortlist|Residence|Source pack pending/);
  assert.deepEqual(regionalShortlistProductOptions('vi').map((item) => item.label), ['Giao ngay', 'Hợp đồng vĩnh cửu', 'DEX']);
  assert.deepEqual(regionalShortlistAccountStageOptions('vi').map((item) => item.label), ['Tài khoản mới', 'Đang dùng nền tảng khác', 'Đã có tài khoản']);

  const gate = marketEntryBrief({ market: 'VN', product: 'spot', locale: 'vi' });
  const nextSteps = regionalQuestionNextSteps({ gate, registry, locale: 'vi', product: 'spot' });
  assert.ok(nextSteps.every((item) => /^Bước tiếp theo:/.test(item)));
  assert.doesNotMatch(nextSteps.join(' '), /Next:|official platform flow/);
  assert.match(regionalPageBoundary({ registry, locale: 'vi' }), /Gói nguồn đang chờ hoàn thiện/);
});

test('JP KR TR regional shortlist market options localize labels while preserving stable values', () => {
  for (const [locale, expected] of [
    ['ja-JP', ['日本 · JPY', '韓国 · KRW', 'トルコ · TRY']],
    ['ko-KR', ['일본 · JPY', '대한민국 · KRW', '튀르키예 · TRY']],
    ['tr-TR', ['Japonya · JPY', 'Güney Kore · KRW', 'Türkiye · TRY']],
  ]) {
    const options = regionalShortlistMarketOptions(locale);
    assert.deepEqual(options.map((option) => option.value), regionalShortlistMarketOptions('en').map((option) => option.value));
    const selected = options.filter((option) => ['JP', 'KR', 'TR'].includes(option.value)).map((option) => option.label);
    assert.deepEqual(selected, expected);
  }
});

test('Mexico preview graduates into a source-backed Spanish indexable AEO market page', () => {
  const seo = computeRouteSeo({
    url: 'https://nexualpha.com/mx',
    locale: 'es',
    route: { name: 'regionalPreview', market: 'MX' },
  });
  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.canonical, 'https://nexualpha.com/mx');
  assert.deepEqual(seo.alternates.map((item) => item.hreflang), ['es', 'x-default']);
  assert.match(seo.title, /México|Investigación cripto/);
  assert.match(JSON.stringify(seo.schemas), /Banxico|Banco de México|CNBV|SPEI|MXN/);
  assert.ok(seo.schemas.some((item) => item['@type'] === 'WebPage'));
  assert.ok(seo.schemas.some((item) => item['@type'] === 'FAQPage'));
});

test('Japan preview graduates into a source-backed indexable AEO market page', () => {
  const seo = computeRouteSeo({
    url: 'https://nexualpha.com/jp?locale=ja',
    locale: 'ja',
    route: { name: 'regionalPreview', market: 'JP' },
  });
  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.canonical, 'https://nexualpha.com/jp');
  assert.match(seo.title, /日本の暗号資産プラットフォーム調査/);
  assert.deepEqual(seo.alternates.map((item) => item.hreflang), ['ja', 'x-default']);
  assert.ok(seo.schemas.some((item) => item['@type'] === 'FAQPage'));

  const registry = internationalSourcesFor('JP');
  assert.match(registry.authority, /Japan Financial Services Agency/);
  assert.ok(registry.sources.length >= 3);
});

test('Singapore preview adds a source-backed indexable research path', () => {
  const seo = computeRouteSeo({
    url: 'https://nexualpha.com/sg',
    locale: 'en',
    route: { name: 'regionalPreview', market: 'SG' },
  });
  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.canonical, 'https://nexualpha.com/sg');
  assert.match(seo.title, /Singapore crypto account checks/);
  assert.deepEqual(seo.alternates.map((item) => item.hreflang), ['en', 'x-default']);
  assert.ok(seo.schemas.some((item) => item['@type'] === 'FAQPage'));
  const serializedSchemas = JSON.stringify(seo.schemas);
  assert.match(serializedSchemas, /MAS Digital Payment Token/);
  assert.match(serializedSchemas, /SGD, PayNow and FAST only as account-screen verification inputs/);
  assert.match(serializedSchemas, /SGD, PayNow and FAST are account-screen checks, not public promises/);
  assert.doesNotMatch(serializedSchemas, /Singapore signup bonus|guaranteed SGD route|private commission|invite code|referral link/i);

  const webPage = seo.schemas.find((item) => item['@type'] === 'WebPage');
  assert.deepEqual(webPage.relatedLink, [
    'https://nexualpha.com/exchanges?market=SG&product=spot',
    'https://nexualpha.com/rates?market=SG&product=spot',
    'https://nexualpha.com/compare/binance-vs-okx?market=SG&product=spot',
  ]);

  const registry = internationalSourcesFor('SG');
  assert.match(registry.authority, /Monetary Authority of Singapore/);
  assert.ok(registry.sources.length >= 4);
});

test('indexed regional FAQ schema and visible question slots use canonical tracked AEO question strings', () => {
  const carriers = [
    ['SG', 'en', '/sg', ['sg-mas-dpt-directory', 'sg-sgd-funding']],
    ['HK', 'zh-Hant', '/hk', ['hk-sfc-platform-status-zh-hant', 'hk-hkd-edda-bank-zh-hant', 'hk-proof-address-product-scope-zh-hant']],
    ['EU', 'en', '/eu', ['eu-mica-register', 'eu-member-state']],
    ['UK', 'en', '/uk', ['uk-fca-register', 'uk-product-scope']],
    ['JP', 'ja', '/jp', ['jp-fsa-register', 'jp-jpy-funding']],
    ['KR', 'ko', '/kr', ['kr-regulatory-context', 'kr-product-scope']],
    ['TR', 'tr', '/tr/markets/turkiye', ['tr-spk-register', 'tr-platform-status']],
  ];

  for (const [market, locale, path, ids] of carriers) {
    const seo = computeRouteSeo({
      url: `https://nexualpha.com${path}`,
      locale,
      route: { name: 'regionalPreview', market },
    });
    const faq = seo.schemas.find((item) => item['@type'] === 'FAQPage');
    assert.ok(faq, `${market} FAQ schema`);
    assert.deepEqual(faq.mainEntity.map((item) => item.name), ids.map(aeoQuestionText), market);
  }

  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  for (const id of [
    'sg-mas-dpt-directory', 'sg-sgd-funding', 'sg-product-scope',
    'eu-mica-register', 'eu-member-state', 'eu-sepa-funding',
    'uk-fca-register', 'uk-residence-route', 'uk-gbp-funding',
    'jp-fsa-register', 'jp-identity', 'jp-jpy-funding',
    'kr-regulatory-context', 'kr-identity', 'kr-krw-funding',
    'tr-spk-register', 'tr-account-verification', 'tr-try-funding',
  ]) {
    assert.match(source, new RegExp(`aeoQuestionText\\("${id}"\\)`), id);
  }
  for (const id of ['hk-residence-platform', 'hk-hkd-funding', 'hk-account-stage']) {
    assert.match(source, new RegExp(`localizedAeoQuestionText\\("${id}", "zh-Hant"\\)`), `${id} localized from canonical id`);
  }
  assert.match(source, /SFC 名單與官方帳戶中的服務主體是否一致/);
  assert.match(source, /目前帳戶是否顯示港幣銀行轉帳、FPS 或 eDDA/);
  assert.match(source, /完成身分與地址驗證後/);
  assert.match(source, /const marketOwnedQuestionLocale = \{ JP: "ja", KR: "ko", TR: "tr", ID: "id" \}\[policy\.targetMarket\]/);
  assert.match(source, /\|\| \(useMarketOwnedQuestionSet \? copy\.questions : null\)/);
  assert.match(source, /\|\| \(useMarketOwnedQuestionSet \? copy\.answers : null\)/);
});

test('Mexico regional component maps Banxico CNBV and MXN SPEI checks to compact onsite CTAs', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const mxStart = source.indexOf('  MX: {');
  const mxEnd = source.indexOf('  TW: {', mxStart);
  const mxBlock = source.slice(mxStart, mxEnd);

  assert.ok(mxStart >= 0, 'MX copy block should exist');
  assert.ok(mxEnd > mxStart, 'MX copy block should be bounded before TW');
  assert.match(mxBlock, /Qué revisar en México antes de elegir una plataforma cripto/);
  assert.match(mxBlock, /Banco de México/);
  assert.match(mxBlock, /CNBV/);
  assert.match(mxBlock, /SPEI y MXN/);
  assert.match(mxBlock, /Binance MXN\/SPEI\/Medá|Binance.*MXN\/SPEI\/Medá/s);
  assert.match(mxBlock, /OKX y otros candidatos.*cuenta oficial|OKX u otros candidatos/s);
  assert.match(mxBlock, /no prueba por sí sola un carril local MXN\/SPEI para México/i);
  assert.match(mxBlock, /Qué prueba y qué no prueba cada fuente/);
  assert.match(mxBlock, /No confirma que una plataforma acepte tu cuenta o depósito/);
  assert.match(mxBlock, /Rutas de investigación para México/);
  assert.match(mxBlock, /Estimar costos antes del depósito/);
  assert.match(mxBlock, /Comparar dos plataformas antes de registrarte/);
  assert.doesNotMatch(mxBlock, /bono de registro|bonificación garantizada|comisión privada|private commission|invite code|referral link|nexu888|11350287/i);

  const registry = internationalSourcesFor('MX');
  assert.match(registry.authority, /Banco de México, CNBV/);
  assert.ok(registry.sources.length >= 4);
  assert.ok(registry.sources.some((item) => /SPEI|Banxico|Banco de México/i.test(`${item.label} ${item.note}`)));
  assert.ok(registry.sources.some((item) => /CNBV|fintech|virtual-asset/i.test(`${item.label} ${item.note}`)));
});

test('Taiwan regional component maps FSC TWD bank checks to compact Traditional Chinese CTAs', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const twStart = source.indexOf('  TW: {');
  const twEnd = source.indexOf('  ID: {', twStart);
  const twBlock = source.slice(twStart, twEnd);

  assert.ok(twStart >= 0, 'TW copy block should exist');
  assert.ok(twEnd > twStart, 'TW copy block should be bounded before ID');
  assert.match(twBlock, /台灣用戶選擇加密貨幣平台前要先查什麼/);
  assert.match(twBlock, /金管會規則/);
  assert.match(twBlock, /新台幣入金與本人銀行帳戶/);
  assert.match(twBlock, /每個官方來源能證明什麼/);
  assert.match(twBlock, /不等於特定平台或帳戶一定可用/);
  assert.match(twBlock, /台灣相關研究路徑/);
  assert.match(twBlock, /入金前先估算交易成本/);
  assert.match(twBlock, /開戶前並排比較兩個平台/);
  assert.doesNotMatch(twBlock, /固定優惠|保證開戶|保證入金|私人佣金|private commission|invite code|referral link|nexu888|11350287/i);

  const registry = internationalSourcesFor('TW');
  assert.match(registry.authority, /Taiwan (?:FSC|Financial Supervisory Commission)/);
  assert.ok(registry.sources.length >= 4);
  assert.ok(registry.sources.some((item) => /FSC|registration rules/i.test(`${item.label} ${item.note}`)));
  assert.ok(registry.sources.some((item) => /bank-account|銀行|TWD|New Taiwan dollar/i.test(`${item.label} ${item.note}`)));
});

test('Singapore regional component shows official-source limits and related onsite paths without becoming an offer', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  assert.match(source, /data-regional-source-map/);
  assert.match(source, /What each official source proves/);
  assert.match(source, /MAS directory/);
  assert.match(source, /Does not approve your account, product or benefit/);
  assert.match(source, /data-regional-related/);
  assert.match(source, /Compare Singapore-capable platform profiles/);
  assert.match(source, /\["rates", "Estimate cost before opening the account"/);
  assert.match(source, /\["compare", "Compare two venues before signup"/);
  assert.match(source, /regional-related-\$\{type\}/);
  assert.doesNotMatch(source, /Singapore signup bonus|guaranteed SGD route|private commission|invite code|referral link/i);
});

test('Korea regional component exposes source boundaries and onsite next steps without becoming an offer', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const krStart = source.indexOf('  KR: {');
  const krEnd = source.indexOf('  SG: {', krStart);
  const krBlock = source.slice(krStart, krEnd);

  assert.ok(krStart >= 0, 'KR copy block should exist');
  assert.ok(krEnd > krStart, 'KR copy block should be bounded before SG');
  assert.match(krBlock, /공식 출처별로 확인할 범위/);
  assert.match(krBlock, /금융위원회 자료/);
  assert.match(krBlock, /금융정보분석원 안내/);
  assert.match(krBlock, /업비트 가입·고객확인 안내/);
  assert.match(krBlock, /업비트 원화 입출금 안내/);
  assert.match(krBlock, /한국 관련 리서치 경로/);
  assert.match(krBlock, /한국 조건으로 플랫폼 후보 보기/);
  assert.match(krBlock, /가입 전 비용 가정 확인/);
  assert.match(krBlock, /두 플랫폼을 나란히 비교/);
  assert.doesNotMatch(krBlock, /가입 보너스|고정 혜택|혜택 보장|개인 커미션|private commission|invite code|referral link|nexu888|11350287/i);
});

test('Turkey regional component exposes source boundaries and onsite next steps without becoming an offer', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const trStart = source.indexOf('  TR: {');
  const trEnd = source.indexOf('  OTHER: {', trStart);
  const trBlock = source.slice(trStart, trEnd);

  assert.ok(trStart >= 0, 'TR copy block should exist');
  assert.ok(trEnd > trStart, 'TR copy block should be bounded before OTHER');
  assert.match(trBlock, /Her resmi kaynağın kanıtladığı sınır/);
  assert.match(trBlock, /SPK geçici faaliyet listesi/);
  assert.match(trBlock, /SPK tasfiye listesi/);
  assert.match(trBlock, /Paribu hesap doğrulama rehberi/);
  assert.match(trBlock, /Paribu TRY yatırma rehberi/);
  assert.match(trBlock, /Türkiye için sonraki araştırma yolları/);
  assert.match(trBlock, /Türkiye koşullarıyla adayları görüntüle/);
  assert.match(trBlock, /Kayıttan önce ücret varsayımını kontrol et/);
  assert.match(trBlock, /İki platformu yan yana karşılaştır/);
  assert.doesNotMatch(trBlock, /kayıt bonusu|garanti avantaj|sabit fayda|özel komisyon|private commission|invite code|referral link|nexu888|11350287/i);
});

test('Singapore source map and related paths stay compact on mobile', () => {
  const css = readFileSync(new URL('../src/components/v3/international/regional-market-preview.css', import.meta.url), 'utf8');
  assert.match(css, /\.regional-market-preview__source-map-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.regional-market-preview__source-map-grid\s*\{\s*grid-template-columns:\s*1fr 1fr;\s*\}/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.regional-market-preview__related-grid\s*\{\s*grid-template-columns:\s*1fr;\s*\}/);
});

test('Indonesia regional component maps OJK Bappebti and IDR checks to compact onsite CTAs', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const idStart = source.indexOf('  ID: {');
  const idEnd = source.indexOf('  VN: {', idStart);
  const idBlock = source.slice(idStart, idEnd);

  assert.ok(idStart >= 0, 'ID copy block should exist');
  assert.ok(idEnd > idStart, 'ID copy block should be bounded before HK');
  assert.match(idBlock, /Yang perlu dicek pengguna Indonesia sebelum memilih platform kripto/);
  assert.match(idBlock, /4 cek sebelum membuka akun/);
  assert.match(idBlock, /Badan usaha dan domain/);
  assert.match(idBlock, /OJK dan Bappebti/);
  assert.match(idBlock, /VA bank, QRIS, wallet/);
  assert.match(idBlock, /bukan janji akun, IDR funding, produk, bonus, atau hasil referral/);
  assert.match(idBlock, /Apa yang dibuktikan tiap sumber resmi/);
  assert.match(idBlock, /Tidak menjamin akun, produk, atau manfaat pengguna/);
  assert.match(idBlock, /Rute riset Indonesia terkait/);
  assert.match(idBlock, /Hitung biaya sebelum deposit/);
  assert.match(idBlock, /Bandingkan dua platform sebelum daftar/);
  assert.doesNotMatch(idBlock, /bonus pendaftaran|manfaat tetap|komisi pribadi|private commission|invite code|referral link|nexu888|11350287/i);

  const registry = internationalSourcesFor('ID');
  assert.match(registry.authority, /OJK, Bappebti/);
  assert.ok(registry.sources.length >= 4);
  assert.ok(registry.sources.some((item) => /OJK.*Bappebti|transition/i.test(`${item.label} ${item.note}`)));
  assert.ok(registry.sources.some((item) => /Bappebti.*trader|pedagang/i.test(`${item.label} ${item.note}`)));
});

test('Vietnam regional component stays fail-closed as noindex research preview', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const vnStart = source.indexOf('  VN: {');
  const vnEnd = source.indexOf('  HK: {', vnStart);
  const vnBlock = source.slice(vnStart, vnEnd);

  assert.ok(vnStart >= 0, 'VN copy block should exist');
  assert.ok(vnEnd > vnStart, 'VN copy block should be bounded before HK');
  assert.match(vnBlock, /Việt Nam: giữ ở chế độ nghiên cứu/);
  assert.match(vnBlock, /Trang Việt Nam hiện là bản nghiên cứu noindex/);
  assert.match(vnBlock, /chưa có ma trận nguồn đã xuất bản/);
  assert.match(vnBlock, /không hứa mở tài khoản, nạp tiền, ưu đãi/);
  assert.match(vnBlock, /Không thay đổi hoặc tạo mới link đăng ký đối tác/);
  assert.doesNotMatch(vnBlock, /bonus pendaftaran|manfaat tetap|private commission|invite code|referral link|nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin/i);
});

test('Hong Kong regional component maps SFC HKD funding and account checks and graduates the Traditional Chinese route', () => {
  const seo = computeRouteSeo({
    url: 'https://nexualpha.com/hk',
    locale: 'zh-Hant',
    route: { name: 'regionalPreview', market: 'HK' },
  });
  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.canonical, 'https://nexualpha.com/hk');
  assert.deepEqual(seo.alternates.map((item) => item.hreflang), ['zh-Hant', 'x-default']);
  assert.ok(seo.schemas.some((item) => item['@type'] === 'WebPage'));
  assert.ok(seo.schemas.some((item) => item['@type'] === 'FAQPage'));
  assert.match(JSON.stringify(seo.schemas), /SFC|HKD|eDDA|地址證明|註冊歸因/);

  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const hkStart = source.indexOf('  HK: {');
  const hkEnd = source.indexOf('  EU: {', hkStart);
  const hkBlock = source.slice(hkStart, hkEnd);

  assert.ok(hkStart >= 0, 'HK copy block should exist');
  assert.ok(hkEnd > hkStart, 'HK copy block should be bounded before EU');
  assert.match(hkBlock, /香港用戶選擇加密資產平台前應先核對什麼/);
  assert.match(hkBlock, /SFC 持牌平台狀態/);
  assert.match(hkBlock, /港幣入金路徑：FPS、eDDA 或銀行轉帳/);
  assert.match(hkBlock, /每項香港官方來源可以證明什麼/);
  assert.match(hkBlock, /不保證平台表現、適合性或你的帳戶獲批/);
  assert.match(hkBlock, /香港相關研究路徑/);
  assert.match(hkBlock, /入金前先估算費用/);
  assert.match(hkBlock, /開戶前並排比較兩個平台/);
  assert.doesNotMatch(hkBlock, /guaranteed HKD route|signup bonus|fixed benefit|private commission|invite code|referral link|nexu888|11350287/i);

  const registry = internationalSourcesFor('HK');
  assert.match(registry.authority, /Hong Kong SFC/);
  assert.ok(registry.sources.length >= 6);
  assert.ok(registry.sources.some((item) => /licensed virtual asset trading platforms|SFC/i.test(`${item.label} ${item.note}`)));
  assert.ok(registry.sources.some((item) => /HKD|eDDA|bank/i.test(`${item.label} ${item.note}`)));
});

test('EU and UK regional pages graduate only their English source-backed canonicals', () => {
  for (const [market, path, expected] of [
    ['EU', '/eu', { title: /European Union Crypto Platform Eligibility Research/, schema: /ESMA MiCA register|EUR|SEPA/, copy: /What EU users should verify before choosing a crypto platform/, source: /ESMA MiCA register/, locale: 'en' }],
    ['UK', '/uk', { title: /United Kingdom Crypto Account Eligibility Research/, schema: /FCA cryptoasset registration|GBP funding/, copy: /What UK users should verify before choosing a crypto platform/, source: /FCA registration guidance/, locale: 'en' }],
  ]) {
    const seo = computeRouteSeo({
      url: `https://nexualpha.com${path}`,
      locale: expected.locale,
      route: { name: 'regionalPreview', market },
    });
    assert.equal(seo.status, 200);
    assert.equal(seo.robots, 'index,follow');
    assert.equal(seo.canonical, `https://nexualpha.com${path}`);
    assert.deepEqual(seo.alternates.map((item) => item.hreflang), ['en', 'x-default']);
    assert.match(seo.title, expected.title);
    assert.ok(seo.schemas.some((item) => item['@type'] === 'WebPage'));
    assert.ok(seo.schemas.some((item) => item['@type'] === 'FAQPage'));
    assert.match(JSON.stringify(seo.schemas), expected.schema);
    assert.doesNotMatch(JSON.stringify(seo.schemas), /signup bonus|fixed benefit|private commission|invite code|referral link|nexu888|11350287/i);

    const registry = internationalSourcesFor(market);
    assert.ok(registry.sources.length >= 4);
    assert.match(JSON.stringify(registry.sources), expected.schema);
  }

  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const euStart = source.indexOf('  EU: {');
  const euEnd = source.indexOf('  UK: {', euStart);
  const ukStart = source.indexOf('  UK: {');
  const ukEnd = source.indexOf('  JP: {', ukStart);
  const euBlock = source.slice(euStart, euEnd);
  const ukBlock = source.slice(ukStart, ukEnd);

  assert.match(euBlock, /What EU users should verify before choosing a crypto platform/);
  assert.match(euBlock, /4 checks before opening an EU account/);
  assert.match(euBlock, /Entity and member state/);
  assert.match(euBlock, /ESMA MiCA register/);
  assert.match(euBlock, /EUR or SEPA funding route/);
  assert.match(euBlock, /European Union research paths/);
  assert.match(euBlock, /Does not decide your account approval, product access or benefit outcome/);
  assert.match(ukBlock, /What UK users should verify before choosing a crypto platform/);
  assert.match(ukBlock, /4 checks before opening a UK account/);
  assert.match(ukBlock, /FCA and service entity/);
  assert.match(ukBlock, /FCA registration guidance/);
  assert.match(ukBlock, /GBP funding and bank-name matching/);
  assert.match(ukBlock, /United Kingdom research paths/);
  assert.match(ukBlock, /Does not approve a specific user account or product route/);
  assert.doesNotMatch(`${euBlock}\n${ukBlock}`, /signup bonus|fixed benefit|private commission|invite code|referral link|nexu888|11350287/i);
});

test('EU and UK localized variants stay out of the index until native copy is complete', () => {
  for (const [market, path, locale] of [
    ['EU', '/de/eu', 'de'],
    ['UK', '/de/uk', 'de'],
  ]) {
    const seo = computeRouteSeo({
      url: `https://nexualpha.com${path}`,
      locale,
      route: { name: 'regionalPreview', market },
    });
    assert.equal(seo.status, 200);
    assert.equal(seo.robots, 'noindex,follow');
    assert.deepEqual(seo.alternates, []);
  }
});

test('Türkiye preview graduates into a Turkish source-backed SPK research path', () => {
  const seo = computeRouteSeo({
    url: 'https://nexualpha.com/tr/markets/turkiye',
    locale: 'tr',
    route: { name: 'regionalPreview', market: 'TR' },
  });
  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.canonical, 'https://nexualpha.com/tr/markets/turkiye');
  assert.match(seo.title, /Türkiye kripto platformu araştırması/);
  assert.deepEqual(seo.alternates.map((item) => item.hreflang), ['tr', 'x-default']);
  assert.ok(seo.schemas.some((item) => item['@type'] === 'WebPage'));
  assert.ok(seo.schemas.some((item) => item['@type'] === 'FAQPage'));
  assert.ok(seo.schemas.some((item) => item['@type'] === 'BreadcrumbList'));
  assert.match(JSON.stringify(seo.schemas), /SPK/);
  assert.match(JSON.stringify(seo.schemas), /Bitget Teknoloji AŞ/);
  assert.doesNotMatch(JSON.stringify(seo.schemas), /kayıt bonusu|sabit komisyon|özel komisyon/i);

  const registry = internationalSourcesFor('TR');
  assert.match(registry.authority, /Turkey Capital Markets Board/);
  assert.ok(registry.sources.length >= 4);
  assert.ok(registry.sources.some((item) => /temporary|geçici|list/i.test(`${item.note} ${item.label}`)));
  assert.ok(registry.sources.some((item) => /Bitget Teknoloji AŞ.*liquidation|liquidation.*Bitget Teknoloji AŞ/i.test(`${item.note} ${item.label}`)));

  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const trStart = source.indexOf('  TR: {');
  const trEnd = source.indexOf('  OTHER: {', trStart);
  const trBlock = source.slice(trStart, trEnd);
  assert.match(trBlock, /Bitget Teknoloji AŞ/);
  assert.match(trBlock, /stop-and-review/);
  assert.doesNotMatch(trBlock, /kayıt bonusu|sabit komisyon|özel komisyon|private commission|invite code|referral link|nexu888|11350287/i);
});

test('Korea preview graduates into a Korean source-backed AEO market page', () => {
  const seo = computeRouteSeo({
    url: 'https://nexualpha.com/kr?locale=ko',
    locale: 'ko',
    route: { name: 'regionalPreview', market: 'KR' },
  });
  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.canonical, 'https://nexualpha.com/kr');
  assert.match(seo.title, /한국 암호화폐 플랫폼 조사/);
  assert.deepEqual(seo.alternates.map((item) => item.hreflang), ['ko', 'x-default']);
  assert.ok(seo.schemas.some((item) => item['@type'] === 'WebPage'));
  assert.ok(seo.schemas.some((item) => item['@type'] === 'FAQPage'));
  assert.match(JSON.stringify(seo.schemas), /금융위원회|금융정보분석원|실명확인 계좌/);
  assert.doesNotMatch(JSON.stringify(seo.schemas), /가입 보너스|고정 수수료|private commission|invite code|referral link|nexu888|11350287/i);

  const registry = internationalSourcesFor('KR');
  assert.match(registry.authority, /Korean Financial Services Commission/);
  assert.ok(registry.sources.length >= 4);
  assert.ok(registry.sources.some((item) => /KRW|원화|real-name|실명/i.test(`${item.note} ${item.label}`)));
});

test('Korea regional page adds a localized onchain and KRW decision module without English fallback', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/components/v3/international/regional-market-preview.css', import.meta.url), 'utf8');
  const krStart = source.indexOf('  KR: {');
  const krEnd = source.indexOf('  SG: {', krStart);
  const krBlock = source.slice(krStart, krEnd);

  assert.ok(krStart >= 0, 'KR copy block should exist');
  assert.ok(krEnd > krStart, 'KR copy block should be bounded before SG');
  assert.match(krBlock, /onchainDecision/);
  assert.match(krBlock, /온체인 경로를 볼 때 원화 계정 조건과 지갑 비용을 분리하세요/);
  assert.match(krBlock, /원화 입출금 가능성, 실명확인 계좌, 공식 앱 경로, 지갑 서명, 네트워크, 토큰 계약, 가스와 수수료/);
  assert.match(krBlock, /금융위원회·금융정보분석원 맥락과 공식 플랫폼 화면/);
  assert.match(krBlock, /한국 조건으로 플랫폼 후보 보기/);
  assert.match(krBlock, /Uniswap 공식 경로 확인/);
  assert.match(krBlock, /Jupiter 공식 경로 확인/);
  assert.doesNotMatch(krBlock, /Open the venue detail page|regional crypto funding verification checklist|private commission|invite code|referral link|nexu888|11350287|가입 보너스|고정 수수료/i);

  assert.match(source, /data-regional-onchain-decision=\{policy\.targetMarket\}/);
  assert.match(source, /localizedHref\(`\/exchanges\/\$\{type\}\?market=\$\{policy\.targetMarket\}&product=\$\{directoryProduct\}`/);
  assert.match(css, /\.regional-market-preview__onchain\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*1\.12fr\)/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.regional-market-preview__onchain\s*\{\s*grid-template-columns:\s*1fr;/);
});

test('Türkiye market page only indexes the Turkish localized route', () => {
  const seo = computeRouteSeo({
    url: 'https://nexualpha.com/markets/turkiye?locale=en',
    locale: 'en',
    route: { name: 'regionalPreview', market: 'TR' },
  });
  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'noindex,follow');
  assert.equal(seo.canonical, 'https://nexualpha.com/markets/turkiye');
  assert.deepEqual(seo.alternates, []);
});

test('international preview routes unlisted country traffic to sourced market paths without a US thin page', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  assert.match(source, /data-international-route-cards/);
  assert.match(source, /id: "kr"/);
  assert.match(source, /href: "\/kr"/);
  assert.match(source, /locale: "ko"/);
  assert.match(source, /data-international-route-card="unlisted"/);
  assert.match(source, /United States or unlisted country/);
  assert.match(source, /href: "\/sg"/);
  assert.match(source, /id: "hk"/);
  assert.match(source, /href: "\/hk"/);
  assert.match(source, /href: "\/jp\?locale=ja"/);
  assert.match(source, /href: "\/uk"/);
  assert.match(source, /href: "\/eu"/);
  assert.match(source, /href: "\/br"/);
  assert.match(source, /href: "\/markets\/turkiye"/);
  assert.match(source, /locale: "tr"/);
});

test('regional research cards keep question, answer, and next step in a readable vertical flow', () => {
  const css = readFileSync(new URL('../src/components/v3/international/regional-market-preview.css', import.meta.url), 'utf8');
  assert.match(css, /\.regional-market-preview__questions \.v3-card\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s);
  assert.match(css, /\.regional-market-preview__questions \.v3-card p\s*\{[^}]*line-height:\s*1\.55;/s);
});

test('Japan regional component exposes a direct answer for AI and search extraction', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  assert.match(source, /data-aeo-direct-answer/);
  assert.match(source, /日本で暗号資産プラットフォームを選ぶ前に確認すること/);
  assert.match(source, /金融庁の登録情報/);
});

test('Japan regional component maps official sources to compact onsite research CTAs', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const jpStart = source.indexOf('  JP: {');
  const jpEnd = source.indexOf('  KR: {', jpStart);
  const jpBlock = source.slice(jpStart, jpEnd);

  assert.ok(jpStart >= 0, 'JP copy block should exist');
  assert.ok(jpEnd > jpStart, 'JP copy block should be bounded before KR');
  assert.match(jpBlock, /公式ソースごとの確認範囲/);
  assert.match(jpBlock, /金融庁登録リスト/);
  assert.match(jpBlock, /口座開設、商品利用、特典を保証しません/);
  assert.match(jpBlock, /日本向けの関連研究ルート/);
  assert.match(jpBlock, /日本向け候補を一覧で確認/);
  assert.match(jpBlock, /口座開設前にコストを試算/);
  assert.match(jpBlock, /2つのプラットフォームを並べて確認/);
  assert.match(source, /aria-label=\{copy\.relatedLabel \|\| "Related regional research paths"\}/);
  assert.doesNotMatch(jpBlock, /登録ボーナス|固定特典|private commission|invite code|referral link|nexu888|11350287/i);
});



test('regional preview turns source registry and gate data into concrete next steps', () => {
  const gate = marketEntryBrief({ market: 'HK', product: 'spot', locale: 'en' });
  const registry = internationalSourcesFor('HK');
  const boundary = regionalPageBoundary({ registry, locale: 'en', reviewedAt: INTERNATIONAL_SOURCE_REVIEWED_AT });
  assert.match(boundary, /Hong Kong SFC/);
  assert.match(boundary, /funding, KYC, product access and benefit outcome/);
  const steps = regionalQuestionNextSteps({ gate, registry, locale: 'en', product: 'spot' });
  assert.equal(steps.length, 3);
  assert.match(steps[0], /KYC/);
  assert.match(steps[0], /Hong Kong SFC/);
  assert.match(steps[1], /Bank transfer · Crypto on-chain/);
  assert.match(steps[1], /HKD · USDT/);
  assert.match(steps[2], /spot/);
  assert.doesNotMatch(steps.join(' '), /Research prompt/);
});

test('Korean and Turkish regional next steps read like local signup checks, not English placeholders', () => {
  for (const [market, locale, expected] of [
    ['KR', 'ko', { boundary: /공식 가입 화면/, kyc: /본인확인 조건/, screen: /공식 화면/, product: /현물/, blocked: [/KYC \/ identity verification/, /spot로/] }],
    ['TR', 'tr', { boundary: /resmi hesap akışında/, kyc: /kimlik doğrulama koşulunu/, screen: /resmi ekranda/, product: /spot olarak/, blocked: [/KYC \/ identity verification/, /fonlama/] }],
  ]) {
    const gate = marketEntryBrief({ market, product: 'spot', locale });
    const registry = internationalSourcesFor(market);
    const boundary = regionalPageBoundary({ registry, locale, reviewedAt: INTERNATIONAL_SOURCE_REVIEWED_AT });
    const steps = regionalQuestionNextSteps({ gate, registry, locale, product: 'spot' }).join(' ');
    assert.match(boundary, expected.boundary);
    assert.match(steps, expected.kyc);
    assert.match(steps, expected.screen);
    assert.match(steps, expected.product);
    for (const pattern of expected.blocked) assert.doesNotMatch(steps, pattern);
  }
});

test('Japan Korea and Türkiye expose native four-step pre-signup checks with source boundaries', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  assert.match(source, /data-regional-pre-signup-check=\{policy\.targetMarket\}/);

  for (const [market, nextMarket, expected] of [
    ['JP', 'KR', {
      heading: /登録前の4ステップ確認/,
      payment: /日本円入金/,
      kyc: /本人確認/,
      product: /商品範囲/,
      sourceBoundary: /金融庁|公式案内/,
      blocked: /bonus|referral link|invite code|登録ボーナス|固定特典|nexu888|11350287/i,
    }],
    ['KR', 'SG', {
      heading: /가입 전 4단계 확인/,
      payment: /원화 입출금/,
      kyc: /본인확인/,
      product: /상품 범위/,
      sourceBoundary: /금융위원회|금융정보분석원|공식 안내/,
      blocked: /bonus|referral link|invite code|가입 보너스|고정 혜택|nexu888|11350287/i,
    }],
    ['TR', 'OTHER', {
      heading: /Kayıt öncesi 4 adımlı kontrol/,
      payment: /TRY yatırma/,
      kyc: /kimlik doğrulama/,
      product: /ürün kapsamı/,
      sourceBoundary: /SPK|resmi rehber/,
      blocked: /bonus|referral link|invite code|kayıt bonusu|sabit fayda|nexu888|11350287/i,
    }],
  ]) {
    const start = source.indexOf(`  ${market}: {`);
    const end = source.indexOf(`  ${nextMarket}: {`, start);
    const block = source.slice(start, end);
    assert.match(block, /preSignupChecks/);
    assert.match(block, expected.heading, `${market} heading`);
    assert.match(block, expected.payment, `${market} payment`);
    assert.match(block, expected.kyc, `${market} KYC`);
    assert.match(block, expected.product, `${market} product`);
    assert.match(block, expected.sourceBoundary, `${market} source boundary`);
    assert.doesNotMatch(block, expected.blocked, `${market} no commercial promise`);
  }
});

test('Mexico Hong Kong and Singapore expose source-bounded pre-signup checks without commercial promises', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');

  for (const [market, nextMarket, expected] of [
    ['MX', 'TW', {
      heading: /Verificación de 4 pasos antes del registro/,
      payment: /MXN\/SPEI|MXN, SPEI/,
      kyc: /Identidad y residencia/,
      product: /Producto disponible/,
      sourceBoundary: /Banco de México|CNBV|guías oficiales/,
      blocked: /bonus|referral link|invite code|bono|beneficio fijo|nexu888|11350287/i,
    }],
    ['HK', 'EU', {
      heading: /開戶前的 4 項核對/,
      payment: /港幣入金路徑/,
      kyc: /身分與地址/,
      product: /產品與費用範圍/,
      sourceBoundary: /SFC 狀態|官方教學/,
      blocked: /bonus|referral link|invite code|fixed rebate|guaranteed discount|nexu888|11350287/i,
    }],
    ['SG', 'TR', {
      heading: /4 checks before signup/,
      payment: /SGD funding route/,
      kyc: /Identity and residence/,
      product: /Product and benefits/,
      sourceBoundary: /MAS context|platform pages/,
      blocked: /bonus|referral link|invite code|fixed rebate|guaranteed discount|nexu888|11350287/i,
    }],
  ]) {
    const start = source.indexOf(`  ${market}: {`);
    const end = source.indexOf(`  ${nextMarket}: {`, start);
    const block = source.slice(start, end);
    assert.match(block, /preSignupChecks/, `${market} has pre-signup checks`);
    assert.match(block, expected.heading, `${market} heading`);
    assert.match(block, expected.payment, `${market} funding`);
    assert.match(block, expected.kyc, `${market} KYC`);
    assert.match(block, expected.product, `${market} product`);
    assert.match(block, expected.sourceBoundary, `${market} source boundary`);
    assert.doesNotMatch(block, expected.blocked, `${market} no commercial promise`);
  }
});

test('regional preview renders one page-level boundary instead of repeating generic prompts per card', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  assert.equal((source.match(/<p>\{pageBoundary\}<\/p>/g) || []).length, 1);
  assert.match(source, /questionNextSteps\[index\]/);
  assert.doesNotMatch(source, /<small>\{pageBoundary\}<\/small>/);
});

test('regional directory CTA preserves market, product, locale, and source context', () => {
  const href = regionalDirectoryHref({ market: 'MX', locale: 'es', funding: 'SPEI' });
  const parsed = new URL(`https://nexualpha.com${href}`);
  assert.equal(parsed.pathname, '/exchanges');
  assert.equal(parsed.searchParams.get('market'), 'MX');
  assert.equal(parsed.searchParams.get('product'), 'spot');
  assert.equal(parsed.searchParams.get('locale'), 'es');
  assert.equal(parsed.searchParams.get('utm_source'), 'regional_preview');
  assert.equal(parsed.searchParams.get('utm_campaign'), 'mx-research-preview');
  assert.equal(parsed.searchParams.get('funding'), 'SPEI');
});

test('traditional Chinese preview keeps its locale in the CTA handoff', () => {
  const parsed = new URL(`https://nexualpha.com${regionalDirectoryHref({ market: 'TW', locale: 'zh-Hant' })}`);
  assert.equal(parsed.searchParams.get('market'), 'TW');
  assert.equal(parsed.searchParams.get('locale'), 'zh-Hant');
});

test('regional account-stage CTAs preserve the selected decision lane', () => {
  for (const stage of ['new_account', 'another_platform', 'existing_account']) {
    const parsed = new URL(`https://nexualpha.com${regionalDirectoryHref({ market: 'MX', locale: 'es', stage })}`);
    assert.equal(parsed.searchParams.get('account_stage'), stage);
    assert.equal(parsed.searchParams.get('market'), 'MX');
    assert.equal(parsed.searchParams.get('product'), 'spot');
  }
});

test('regional research tools preserve market context into rates and comparison paths', () => {
  for (const path of ['/rates', '/compare/binance-vs-okx']) {
    const parsed = new URL(`https://nexualpha.com${regionalToolHref({ path, market: 'EU', locale: 'de', product: 'spot', funding: 'SEPA' })}`);
    assert.equal(parsed.pathname, path);
    assert.equal(parsed.searchParams.get('market'), 'EU');
    assert.equal(parsed.searchParams.get('product'), 'spot');
    assert.equal(parsed.searchParams.get('locale'), 'de');
    assert.equal(parsed.searchParams.get('utm_source'), 'regional_preview');
    assert.equal(parsed.searchParams.get('funding'), 'SEPA');
  }
});

test('regional shortlist uses reviewed matrix states and keeps stop-review platforms without direct CTA', () => {
  const tr = buildRegionalShortlist({
    market: 'TR',
    locale: 'tr',
    product: 'spot',
    funding: 'TRY bank transfer',
    accountStage: 'existing_account',
  });

  assert.equal(tr.market, 'TR');
  assert.equal(tr.product, 'spot');
  assert.equal(tr.accountStage, 'existing_account');
  assert.ok(tr.candidates.some((candidate) => candidate.status === REGIONAL_SHORTLIST_STATES.RESEARCHABLE), 'researchable candidate');
  assert.ok(tr.candidates.some((candidate) => candidate.status === REGIONAL_SHORTLIST_STATES.ACCOUNT_CONFIRM), 'account-confirm candidate');
  const bitget = tr.candidates.find((candidate) => candidate.name === 'Bitget');
  assert.equal(bitget.status, REGIONAL_SHORTLIST_STATES.PAUSED);
  assert.equal(bitget.directHref, '');
  assert.match(bitget.note, /Durdurup inceleme/);
});

test('Japan Korea Türkiye and Indonesia shortlists localize decision controls without changing handoff destinations', () => {
  for (const [market, locale, expected] of [
    ['JP', 'ja', {
      heading: /地域別ショートリスト/,
      product: /現物/,
      stage: /初めての口座/,
      researchable: /情報源に紐づく調査候補/,
      funding: /公式ログイン後の口座画面/,
      blocked: /Regional shortlist|Open research profile|Source-linked research candidate|official logged-in account flow|New account/,
    }],
    ['KR', 'ko', {
      heading: /지역별 후보 목록/,
      product: /현물/,
      stage: /처음 계정/,
      researchable: /출처가 연결된 리서치 후보/,
      funding: /공식 로그인 계정 화면/,
      blocked: /Regional shortlist|Open research profile|Source-linked research candidate|official logged-in account flow|New account/,
    }],
    ['TR', 'tr', {
      heading: /Bölgesel kısa liste/,
      product: /Spot/,
      stage: /İlk hesap/,
      researchable: /Kaynak bağlantılı araştırma adayı/,
      funding: /resmi giriş yapılmış hesap akışında/,
      blocked: /Regional shortlist|Open research profile|Source-linked research candidate|official logged-in account flow|New account/,
    }],
    ['ID', 'id', {
      heading: /Daftar riset regional/,
      product: /Spot/,
      stage: /Akun baru/,
      funding: /alur akun resmi yang sudah login/,
      blocked: /Regional shortlist|Tune the shortlist|Residence|Product|Funding route|Account stage|Open research profile|Source-linked research candidate|official logged-in account flow|New account/,
    }],
  ]) {
    const copy = regionalShortlistCopy(locale);
    const products = regionalShortlistProductOptions(locale).map((item) => item.label).join(' ');
    const stages = regionalShortlistAccountStageOptions(locale).map((item) => item.label).join(' ');
    const shortlist = buildRegionalShortlist({ market, locale, product: 'spot', accountStage: 'new_account' });
    const notes = shortlist.candidates.map((candidate) => `${candidate.name} ${candidate.note}`).join(' ');

    assert.match(copy.heading, expected.heading, `${locale} heading`);
    assert.match(products, expected.product, `${locale} products`);
    assert.match(stages, expected.stage, `${locale} account stages`);
    if (expected.researchable) assert.match(notes, expected.researchable, `${locale} researchable note`);
    assert.match(notes, expected.funding, `${locale} funding note`);
    assert.doesNotMatch([copy.heading, copy.openProfile, products, stages, notes].join(' '), expected.blocked, `${locale} no English fallback`);

    for (const candidate of shortlist.candidates.filter((item) => item.directHref)) {
      const href = new URL(`https://nexualpha.com${candidate.directHref}`);
      assert.equal(href.searchParams.get('locale'), locale);
      assert.equal(href.searchParams.get('market'), market);
      assert.equal(href.searchParams.get('account_stage'), 'new_account');
    }
  }
});

test('Indonesia regional visible question set avoids English fallback labels and Chinese punctuation', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const shortlistCopy = regionalShortlistCopy('id');
  const products = regionalShortlistProductOptions('id').map((item) => item.label).join(' ');
  const stages = regionalShortlistAccountStageOptions('id').map((item) => item.label).join(' ');
  const shortlist = buildRegionalShortlist({ market: 'ID', locale: 'id', product: 'spot', accountStage: 'new_account' });
  const visibleShortlistText = [
    shortlistCopy.heading,
    shortlistCopy.controls,
    shortlistCopy.residence,
    shortlistCopy.product,
    shortlistCopy.funding,
    shortlistCopy.accountStage,
    shortlistCopy.openProfile,
    products,
    stages,
    ...shortlist.candidates.map((candidate) => `${candidate.name} ${candidate.note}`),
  ].join(' ');

  assert.match(source, /const genericAnswerTerminator = \(key\) => key === "ja" \|\| key === "zh-Hans" \|\| key === "zh-Hant" \? "。" : "\."/);
  assert.match(source, /const marketOwnedQuestionLocale = \{ JP: "ja", KR: "ko", TR: "tr", ID: "id" \}\[policy\.targetMarket\]/);
  assert.doesNotMatch(visibleShortlistText, /Regional shortlist|Tune the shortlist|Residence|Product|Funding route|Account stage|Open research profile|Source-linked research candidate|official logged-in account flow|New account|。/);
});

test('Mexico Spanish and Hong Kong Traditional Chinese shortlists do not fall back to English controls', () => {
  for (const [market, locale, expected] of [
    ['MX', 'es', {
      heading: /Lista corta regional/,
      controls: /Ajustar la lista corta/,
      residence: /Residencia/,
      funding: /Ruta de financiación/,
      stage: /Cuenta nueva/,
      researchable: /Candidato de investigación con fuente/,
      fundingNote: /flujo oficial de la cuenta con sesión iniciada/,
      blocked: /Regional shortlist|Tune the shortlist|Residence|Funding route|Account stage|Can research|Confirm in account|Open research profile|Source-linked research candidate|official logged-in account flow|New account/,
    }],
    ['HK', 'zh-Hant', {
      heading: /地區短名單/,
      controls: /調整短名單條件/,
      residence: /居住地/,
      funding: /入金路徑/,
      stage: /第一次開戶/,
      researchable: /有來源連結的研究候選/,
      fundingNote: /官方登入帳戶流程中確認/,
      blocked: /Regional shortlist|Tune the shortlist|Residence|Funding route|Account stage|Can research|Confirm in account|Open research profile|Source-linked research candidate|official logged-in account flow|New account/,
    }],
  ]) {
    const copy = regionalShortlistCopy(locale);
    const products = regionalShortlistProductOptions(locale).map((item) => item.label).join(' ');
    const stages = regionalShortlistAccountStageOptions(locale).map((item) => item.label).join(' ');
    const shortlist = buildRegionalShortlist({ market, locale, product: 'spot', accountStage: 'new_account' });
    const notes = shortlist.candidates.map((candidate) => `${candidate.name} ${candidate.note}`).join(' ');

    assert.match(copy.heading, expected.heading, `${locale} heading`);
    assert.match(copy.controls, expected.controls, `${locale} controls`);
    assert.match(copy.residence, expected.residence, `${locale} residence`);
    assert.match(copy.funding, expected.funding, `${locale} funding label`);
    assert.match(stages, expected.stage, `${locale} account stage`);
    assert.match(notes, expected.researchable, `${locale} research note`);
    assert.match(notes, expected.fundingNote, `${locale} funding note`);
    assert.doesNotMatch([copy.heading, copy.controls, copy.residence, copy.product, copy.funding, copy.accountStage, copy.researchable, copy.account_confirm, copy.openProfile, products, stages, notes].join(' '), expected.blocked, `${locale} no shortlist fallback`);

    for (const candidate of shortlist.candidates.filter((item) => item.directHref)) {
      const href = new URL(`https://nexualpha.com${candidate.directHref}`);
      assert.equal(href.searchParams.get('locale'), locale);
      assert.equal(href.searchParams.get('market'), market);
      assert.equal(href.searchParams.get('account_stage'), 'new_account');
    }
  }
});

test('remaining supported regional shortlist locales avoid English fallback controls', () => {
  const blocked = /Regional shortlist|Tune the shortlist|Residence|Product|Funding route|Account stage|Open research profile|Source-linked research candidate|official logged-in account flow|New account/;
  for (const [locale, expected] of [
    ['pt-BR', { heading: /Lista regional/, stage: /Conta nova/, researchable: /Candidato de pesquisa com fonte/, funding: /fluxo oficial da conta logada/ }],
    ['fr', { heading: /Liste régionale/, stage: /Nouveau compte/, researchable: /Candidat de recherche lié à une source/, funding: /parcours officiel du compte connecté/ }],
    ['de', { heading: /Regionale Shortlist/, stage: /Neues Konto/, researchable: /Quellengebundener Recherchekandidat/, funding: /offiziellen eingeloggten Kontofluss/ }],
    ['ru', { heading: /Региональный список/, stage: /Новый аккаунт/, researchable: /Кандидат исследования с привязкой к источнику/, funding: /официальном аккаунте после входа/ }],
    ['ar', { heading: /قائمة إقليمية مختصرة/, stage: /حساب جديد/, researchable: /مرشح بحث مرتبط بمصدر/, funding: /مسار الحساب الرسمي بعد تسجيل الدخول/ }],
    ['it', { heading: /Lista regionale/, stage: /Nuovo account/, researchable: /Candidato di ricerca collegato a fonte/, funding: /flusso ufficiale dell'account dopo il login/ }],
  ]) {
    const copy = regionalShortlistCopy(locale);
    const products = regionalShortlistProductOptions(locale).map((item) => item.label).join(' ');
    const stages = regionalShortlistAccountStageOptions(locale).map((item) => item.label).join(' ');
    const shortlist = buildRegionalShortlist({ market: 'MX', locale, product: 'spot', accountStage: 'new_account' });
    const notes = shortlist.candidates.map((candidate) => `${candidate.name} ${candidate.note}`).join(' ');
    const visible = [copy.heading, copy.controls, copy.residence, copy.product, copy.funding, copy.accountStage, copy.openProfile, products, stages, notes].join(' ');

    assert.match(copy.heading, expected.heading, `${locale} heading`);
    assert.match(stages, expected.stage, `${locale} account stage`);
    assert.match(notes, expected.researchable, `${locale} researchable note`);
    assert.match(notes, expected.funding, `${locale} funding note`);
    assert.doesNotMatch(visible, blocked, `${locale} no English fallback`);
  }
});

test('regional preview localizes owner-market funding option labels without changing option values', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');

  assert.match(source, /FUNDING_OPTION_COPY/);
  assert.match(source, /"MXN bank transfer": "Transferencia bancaria MXN"/);
  assert.match(source, /"Medá account route": "Ruta de cuenta Medá"/);
  assert.match(source, /"HKD bank transfer": "港幣銀行轉帳"/);
  assert.match(source, /"eDDA where shown": "顯示 eDDA 時使用"/);
  assert.match(source, /"QRIS where shown": "QRIS jika ditampilkan"/);
  assert.match(source, /"wallet route where shown": "Jalur wallet jika ditampilkan"/);
  assert.match(source, /"on-chain crypto transfer where shown": "Transfer kripto on-chain jika ditampilkan"/);
  assert.match(source, /<option key=\{option\} value=\{option\}>\{localizedFundingOptionLabel\(selectedMarket, locale, option\)\}<\/option>/);
});

test('Indonesia funding and source display copy localizes visible English without changing raw values', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const matrix = readFileSync(new URL('../src/data/regional-funding-verification-matrix.js', import.meta.url), 'utf8');
  const registry = readFileSync(new URL('../src/data/international-source-registry.js', import.meta.url), 'utf8');

  assert.match(matrix, /paymentRails: \["IDR bank virtual account", "QRIS where shown", "wallet route where shown", "on-chain crypto transfer where shown"\]/);
  assert.match(matrix, /source\("OJK and Bappebti transition announcement for crypto assets"/);
  assert.match(registry, /authority: "OJK, Bappebti and official Indonesian platform references"/);

  assert.match(source, /ID: \{\s*id: \{[\s\S]*"OJK and Bappebti transition announcement for crypto assets": \[\s*"Pengumuman transisi OJK dan Bappebti untuk aset kripto"/);
  assert.match(source, /"Bappebti prospective physical crypto-asset trader list": \[\s*"Daftar calon pedagang fisik aset kripto Bappebti"/);
  assert.match(source, /"Tokocrypto IDR deposit guidance": \[\s*"Panduan deposit IDR Tokocrypto"/);
  assert.match(source, /"Tokocrypto referral-code guidance": \[\s*"Panduan kode referral Tokocrypto"/);
  assert.match(source, /ID: \{\s*id: "Referensi OJK, Bappebti, dan platform resmi Indonesia"/);
  assert.match(source, /Matriks verifikasi pendanaan/);
  assert.match(source, /aset riset publik untuk pemeriksaan fiat lokal dan jalur pembayaran/);
  assert.match(source, /Buka aset JSON/);
  assert.match(source, new RegExp('entry\\.paymentRails\\.map\\(\\(rail\\) => localizedFundingOptionLabel\\(entry\\.market, locale, rail\\)\\)\\.join\\(" / "\\)'));
  assert.match(source, /localizedRegionalSourceItem\(\{ label: item\.label, href: item\.url, note: "", role: item\.role \}, entry\.market, locale\)\.label/);
});

test('Indonesia regional shortlist funding card renders localized source label in visible HTML', async () => {
  const html = await renderRegionalMarketPreview({ market: 'ID', locale: 'id' });
  const shortlistStart = html.indexOf('data-regional-shortlist="ID"');
  const shortlistEnd = html.indexOf('class="regional-market-preview__cta-slot', shortlistStart);
  const shortlistHtml = html.slice(shortlistStart, shortlistEnd);

  assert.ok(shortlistStart >= 0, 'ID shortlist should render');
  assert.match(shortlistHtml, /<small>Pengumuman transisi OJK dan Bappebti untuk aset kripto<\/small>/);
  assert.doesNotMatch(shortlistHtml, /<small>OJK and Bappebti transition announcement for crypto assets<\/small>/);
});

test('Japan Korea and Türkiye deep regional source surfaces avoid English fallback labels', async () => {
  for (const [market, locale, expected] of [
    ['JP', 'ja', {
      source: /金融庁 登録暗号資産交換業者一覧/,
      authority: /日本の金融庁と公式プラットフォーム資料/,
      funding: /本人名義の登録銀行口座/,
      blocked: /Japan FSA registered crypto-asset exchange providers|registered bank account in user&#x27;s name|Use the current FSA list|official platform guidance/i,
    }],
    ['KR', 'ko', {
      source: /금융위원회 가상자산 이용자 보호법 개요/,
      authority: /한국 금융위원회, 금융정보분석원 및 공식 플랫폼 자료/,
      funding: /실명 은행계좌/,
      blocked: /FSC Korea Virtual Asset User Protection Act overview|Korea Financial Intelligence Unit virtual-asset business guidance|real-name bank account where shown|Use the FSC overview/i,
    }],
    ['TR', 'tr', {
      source: /SPK faaliyette bulunan kripto varlık hizmet sağlayıcıları/,
      authority: /Türkiye Sermaye Piyasası Kurulu \(SPK\) ve resmi platform kaynakları/,
      funding: /TRY banka transferi/,
      blocked: /SPK crypto-asset service providers in operation|SPK crypto-asset service providers in liquidation|matching bank account where shown|Use the current SPK temporary list/i,
    }],
  ]) {
    const html = await renderRegionalMarketPreview({ market, locale });
    const shortlistStart = html.indexOf(`data-regional-shortlist="${market}"`);
    const sourcesStart = html.indexOf('regional-market-preview__sources', shortlistStart);
    const deepHtml = html.slice(shortlistStart, sourcesStart > 0 ? html.length : undefined);
    const visibleText = deepHtml.replace(/<[^>]+>/g, ' ');

    assert.match(visibleText, expected.source, `${market}: source label`);
    assert.match(visibleText, expected.authority, `${market}: localized authority`);
    assert.match(visibleText, expected.funding, `${market}: localized funding option`);
    assert.doesNotMatch(visibleText, expected.blocked, `${market}: no deep English source fallback`);
  }
});

test('Hong Kong Traditional Chinese related research paths avoid English fallback while preserving handoff types', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');

  assert.match(source, /RELATED_RESEARCH_COPY/);
  assert.match(source, /查看香港平台候選/);
  assert.match(source, /入金前先估算費用/);
  assert.match(source, /開戶前並排比較兩個平台/);
  assert.match(source, /const relatedResearch = copy\.relatedResearch \? localizedRelatedResearch\(copy\.relatedResearch, policy\.targetMarket, locale\) : null/);
  assert.match(source, /relatedResearch\.map\(\(\[type, label, note\]\)/);
});

test('regional preview shell uses localized shortlist option helpers for ja ko tr', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  assert.match(source, /regionalShortlistProductOptions\(locale\)/);
  assert.match(source, /regionalShortlistAccountStageOptions\(locale\)/);
  assert.match(source, /shortlistProductOptions\.map/);
  assert.match(source, /shortlistAccountStageOptions\.map/);
  assert.doesNotMatch(source, /REGIONAL_SHORTLIST_PRODUCTS\.map/);
  assert.doesNotMatch(source, /REGIONAL_SHORTLIST_ACCOUNT_STAGES\.map/);
  assert.doesNotMatch(source, /locale === "es" \? "Ocultar otras situaciones"/);
  assert.doesNotMatch(source, /locale === "id" \? "Sembunyikan pertanyaan"/);
});

test('regional shortlist handoffs preserve the reviewed decision passport', () => {
  const br = buildRegionalShortlist({
    market: 'BR',
    locale: 'pt-BR',
    product: 'spot',
    funding: 'Pix',
    accountStage: 'new_account',
  });
  const compare = new URL(`https://nexualpha.com${br.compareHref}`);
  assert.equal(compare.pathname, '/compare/binance-vs-okx');
  assert.equal(compare.searchParams.get('market'), 'BR');
  assert.equal(compare.searchParams.get('product'), 'spot');
  assert.equal(compare.searchParams.get('account_stage'), 'new_account');
  assert.equal(compare.searchParams.get('funding'), 'Pix');
  assert.equal(compare.searchParams.get('locale'), 'pt-BR');
  assert.equal(br.funding, 'Pix');

  const hk = buildRegionalShortlist({
    market: 'HK',
    locale: 'zh-Hant',
    product: 'spot',
    funding: '帳戶顯示時才可使用的 eDDA',
    accountStage: 'existing_account',
  });
  const hkHandoff = new URL(hk.telegramHref);
  assert.equal(hkHandoff.searchParams.get('account_stage'), 'existing_account');
  assert.equal(hkHandoff.searchParams.get('funding'), '帳戶顯示時才可使用的 eDDA');
  assert.match(hkHandoff.searchParams.get('start'), /m_HK/);
  assert.match(hkHandoff.searchParams.get('start'), /t_spot/);
  assert.notEqual(hk.compareHref.split('?')[0], '/compare/binance-vs-okx');
  assert.equal(new URL(`https://nexualpha.com${hk.compareHref}`).searchParams.get('funding'), '帳戶顯示時才可使用的 eDDA');
  for (const candidate of hk.candidates.filter((item) => item.directHref)) {
    assert.equal(new URL(`https://nexualpha.com${candidate.directHref}`).searchParams.get('funding'), '帳戶顯示時才可使用的 eDDA');
  }
});

test('regional preview component derives compare and Telegram handoffs from selected shortlist state', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  assert.match(source, /buildRegionalShortlist/);
  assert.match(source, /value=\{selectedMarket\}/);
  assert.match(source, /value=\{selectedProduct\}/);
  assert.match(source, /value=\{shortlist\.funding\}/);
  assert.match(source, /value=\{selectedAccountStage\}/);
  assert.match(source, /const compareHref = shortlist\.compareHref/);
  assert.match(source, /const telegramHref = shortlist\.telegramHref/);
  assert.match(source, /data-regional-funding=\{shortlist\.funding\}/);
  assert.match(source, /candidate\.directHref[\s\S]*regional-shortlist-profile/);
  assert.doesNotMatch(source, /regionalToolHref\(\{\s*path:\s*["']\/compare\/binance-vs-okx["']/);
  assert.doesNotMatch(source, /getTelegramDeepLink\(\{\s*action:\s*["']compare["'],\s*pair:\s*["']binance-vs-okx["']/);
});

test('directory context keeps explicit market and product state without falling back to generic venues', () => {
  const context = directoryContext({ market: 'MX', product: 'spot', locale: 'es' });
  assert.deepEqual(
    { market: context.market, product: context.product, locale: context.locale, scoped: context.scoped },
    { market: 'MX', product: 'spot', locale: 'es', scoped: true },
  );
  const venues = [
    { slug: 'latam', supportedRegions: ['LATAM'], restrictedRegions: [] },
    { slug: 'us-only', supportedRegions: ['United States'], restrictedRegions: ['Mexico'] },
    { slug: 'global', supportedRegions: ['Global'], restrictedRegions: [] },
  ];
  assert.equal(venueMarketStatus(venues[0], 'MX'), 'matched');
  assert.equal(venueMarketStatus(venues[2], 'MX'), 'unverified');
  assert.deepEqual(filterDirectoryVenues(venues, 'MX').map((venue) => venue.slug), []);
  assert.deepEqual(
    filterDirectoryVenues(
      [{ slug: 'binance', category: 'CEX' }, { slug: 'okx', category: 'CEX' }, { slug: 'bybit', category: 'CEX' }],
      'MX',
      { product: 'spot', locale: 'es', accountStage: 'new_account', funding: 'SPEI' },
    ).map((venue) => venue.slug),
    ['binance'],
  );
  assert.deepEqual(
    filterDirectoryVenues(
      [{ slug: 'binance', category: 'CEX' }, { slug: 'okx', category: 'CEX' }],
      'JP',
      { product: 'spot', locale: 'ja', accountStage: 'new_account' },
    ).map((venue) => venue.slug),
    [],
  );
});

test('directory context survives detail and comparison handoffs', () => {
  const params = new URLSearchParams(directoryContextSearch({ market: 'TW', product: 'spot', locale: 'zh-Hant' }));
  assert.equal(params.get('market'), 'TW');
  assert.equal(params.get('product'), 'spot');
  assert.equal(params.get('locale'), 'zh-Hant');
  assert.equal(params.get('utm_source'), 'regional_preview');
  assert.equal(params.get('utm_campaign'), 'tw-research-preview');
});

test('default English directory handoffs do not create redundant locale variants', () => {
  const params = new URLSearchParams(directoryContextSearch({ market: 'unknown', product: 'unknown', locale: 'en' }));
  assert.equal(params.has('market'), false);
  assert.equal(params.has('product'), false);
  assert.equal(params.has('locale'), false);
});

test('contextual internal hrefs omit unknown sentinel context while preserving explicit context', () => {
  assert.equal(
    contextualHref('/compare/binance-vs-okx', { locale: 'en', market: 'unknown', product: 'unknown' }),
    '/compare/binance-vs-okx',
  );
  assert.equal(
    contextualHref('/compare/binance-vs-okx', { locale: 'en', market: 'BR', product: 'spot', account_stage: 'ready', utm_source: 'home' }),
    '/compare/binance-vs-okx?account_stage=ready&utm_source=home&market=BR&product=spot',
  );
});

test('regional decision set uses only the source-linked regional shortlist', () => {
  const result = buildRegionalDecisionSet({
    market: 'MX',
    product: 'spot',
    venues: [
      { slug: 'binance', name: 'Binance', category: 'CEX', supportedRegions: ['Global'], restrictedRegions: [] },
      { slug: 'okx', name: 'OKX', category: 'CEX', supportedRegions: ['Global'], restrictedRegions: [] },
      { slug: 'latam-route', name: 'LATAM route', category: 'CEX', supportedRegions: ['LATAM'], restrictedRegions: [] },
    ],
  });
  assert.equal(result.primary.venue.slug, 'binance');
  assert.deepEqual(result.alternatives, []);
  assert.equal(result.verification, null);

  const noShortlist = buildRegionalDecisionSet({
    market: 'JP',
    product: 'spot',
    venues: [{ slug: 'binance', name: 'Binance', category: 'CEX', supportedRegions: ['Global'], restrictedRegions: [] }],
  });
  assert.equal(noShortlist.primary, null);
  assert.deepEqual(noShortlist.alternatives, []);
  assert.equal(noShortlist.verification, null);
});

test('regional CTA state requires a recorded match before direct outbound registration', () => {
  assert.equal(regionalCtaState({ market: 'MX', status: 'matched' }), 'available');
  assert.equal(regionalCtaState({ market: 'MX', status: 'unverified' }), 'verify');
  assert.equal(regionalCtaState({ market: 'MX', status: 'restricted' }), 'blocked');
  assert.equal(regionalCtaState({ market: undefined, status: 'unscoped' }), 'available');
});

test('regional mobile flow moves primary CTA ahead of evidence packs', async () => {
  const mxHtml = await renderRegionalMarketPreview({
    market: 'MX',
    locale: 'en',
    decisionPassport: { market: 'MX', product: 'spot', accountStage: 'new_account', funding: 'SPEI' },
  });
  const primaryIndex = mxHtml.indexOf('data-cta-placement="regional-first-screen-directory"');
  const gateIndex = mxHtml.indexOf('class="regional-market-preview__gate"');
  const filtersIndex = mxHtml.indexOf('class="regional-market-preview__shortlist-controls"', gateIndex);
  const candidateIndex = mxHtml.indexOf('data-cta-placement="regional-shortlist-profile"', filtersIndex);
  const bridgeIndex = mxHtml.indexOf('regional-market-preview__cta-slot regional-market-preview__next-decision-bridge', candidateIndex);
  const researchDisclosureIndex = mxHtml.indexOf('class="regional-market-preview__mobile-research-disclosure"', bridgeIndex);
  const researchStackIndex = mxHtml.indexOf('class="regional-market-preview__research-stack"', researchDisclosureIndex);
  const directAnswerIndex = mxHtml.indexOf('class="regional-market-preview__direct-answer', researchStackIndex);
  const proofPackIndex = mxHtml.indexOf('class="regional-market-preview__proof-pack', directAnswerIndex);
  const aeoIndex = mxHtml.indexOf('class="regional-market-preview__aeo-compact', proofPackIndex);

  assert.ok(primaryIndex > 0, 'primary first-screen CTA should render near the top of the route');
  assert.ok(gateIndex > primaryIndex, 'entry gate should follow the first-screen primary CTA');
  assert.ok(filtersIndex > gateIndex, 'mounted shortlist filters should follow the gate');
  assert.ok(candidateIndex > filtersIndex, 'shortlist candidate CTA should follow the mounted filters');
  assert.ok(bridgeIndex > candidateIndex, 'primary next-decision bridge should follow the exposed candidate CTA');
  assert.ok(researchDisclosureIndex > bridgeIndex, 'research disclosure should sit after the primary CTA flow');
  assert.ok(researchStackIndex > researchDisclosureIndex, 'research stack should mount inside the disclosure');
  assert.ok(directAnswerIndex > researchStackIndex, 'long direct answer should stay inside the research stack');
  assert.ok(proofPackIndex > directAnswerIndex, 'source proof pack should sit after the direct answer');
  assert.ok(aeoIndex > proofPackIndex, 'AEO extractable evidence should remain in the page after proof pack');

  const jpHtml = await renderRegionalMarketPreview({ market: 'JP', locale: 'ja' });
  const jpGateIndex = jpHtml.indexOf('class="regional-market-preview__gate"');
  const jpFiltersIndex = jpHtml.indexOf('class="regional-market-preview__shortlist-controls"', jpGateIndex);
  const jpShortlistGridIndex = jpHtml.indexOf('class="regional-market-preview__shortlist-grid"', jpFiltersIndex);
  const jpShortlistArticleIndex = jpHtml.indexOf('class="v3-card"', jpShortlistGridIndex);
  const jpBridgeIndex = jpHtml.indexOf('regional-market-preview__cta-slot regional-market-preview__next-decision-bridge', jpShortlistArticleIndex);
  const jpDirectAnswerIndex = jpHtml.indexOf('class="regional-market-preview__direct-answer', jpBridgeIndex);

  assert.doesNotMatch(jpHtml, /regional-market-preview__mobile-research-disclosure/);
  assert.doesNotMatch(jpHtml, /regional-market-preview__shortlist-filter-disclosure/);
  assert.ok(jpFiltersIndex > jpGateIndex, 'non-MX filters keep the mounted order after the gate');
  assert.ok(jpShortlistGridIndex > jpFiltersIndex, 'non-MX shortlist grid follows mounted filters');
  assert.ok(jpShortlistArticleIndex > jpShortlistGridIndex, 'non-MX shortlist candidate card follows mounted filters');
  assert.ok(jpBridgeIndex > jpShortlistArticleIndex, 'non-MX primary bridge follows the exposed candidate card');
  assert.ok(jpDirectAnswerIndex > jpBridgeIndex, 'non-MX evidence remains after the primary CTA flow');
});

test('regional proof checks remain in DOM but collapse behind a keyboard accessible details summary', () => {
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/components/v3/international/regional-market-preview.css', import.meta.url), 'utf8');

  assert.match(source, /function RegionalProofPack/);
  assert.match(source, /className="regional-market-preview__proof-pack"/);
  assert.match(source, /<details>/);
  assert.match(source, /<summary>/);
  assert.match(source, /regional-market-preview__pre-signup/);
  assert.match(source, /regional-market-preview__source-map/);
  assert.match(css, /\.regional-market-preview__proof-pack summary:focus-visible/);
  assert.match(css, /\.regional-market-preview__proof-pack summary[\s\S]*touch-action: manipulation/);
  assert.match(css, /\.regional-market-preview__proof-body[\s\S]*padding: 0 \.85rem \.85rem/);
});

test('regional mobile compression keeps repeated modules collapsed or single-column without horizontal overflow', () => {
  const css = readFileSync(new URL('../src/components/v3/international/regional-market-preview.css', import.meta.url), 'utf8');
  const source = readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx', import.meta.url), 'utf8');

  assert.match(css, /\.regional-market-preview__cta\s*\{[\s\S]*width:\s*fit-content/);
  assert.match(css, /\.regional-market-preview__shortlist\s*\{[\s\S]*margin:\s*\.9rem 0 \.85rem/);
  assert.match(css, /\.regional-market-preview__shortlist-grid \.v3-card,\s*\n\.regional-market-preview__shortlist-more-grid \.v3-card\s*\{[\s\S]*padding:\s*\.82rem/);
  assert.match(source, /className="regional-market-preview__shortlist-more"/);
  assert.match(source, /className="regional-market-preview__direct-answer-disclosure"/);
  assert.match(source, /className="regional-market-preview__related-disclosure"/);
  assert.match(css, /\.regional-market-preview__direct-answer-disclosure > summary[\s\S]*min-height: 44px;/);
  assert.match(css, /\.regional-market-preview__shortlist-more > summary[\s\S]*touch-action: manipulation;/);
  assert.match(css, /\.regional-market-preview__related-grid strong\s*\{[\s\S]*overflow-wrap:\s*anywhere;/);
  assert.match(css, /\.regional-market-preview__related-grid span\s*\{[\s\S]*overflow-wrap:\s*anywhere;/);
  assert.match(css, /\.regional-market-preview__source-meta\s*\{[\s\S]*overflow-wrap:\s*anywhere;/);
  assert.match(css, /\.regional-market-preview__sources a strong,\s*\n\.regional-market-preview__sources a small\s*\{\s*overflow-wrap:\s*anywhere;\s*\}/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.regional-market-preview__shortlist-controls\s*\{\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.regional-market-preview__shortlist-grid,\s*\n\s*\.regional-market-preview__shortlist-more-grid\s*\{\s*grid-template-columns:\s*1fr;\s*\}/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.regional-market-preview__question-grid:not\(\.is-open\)\s*\{\s*display:\s*none;\s*\}/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.regional-market-preview__decision-grid \.regional-market-preview__decision-card--secondary\s*\{\s*display:\s*none;\s*\}/);
});

test('explicit regional product paths choose a focused default directory category', () => {
  assert.equal(defaultDirectoryCategory({ market: 'MX', product: 'spot' }), 'CEX');
  assert.equal(defaultDirectoryCategory({ market: 'TW', product: 'perpetuals' }), 'Perp DEX');
  assert.equal(defaultDirectoryCategory({ market: 'ID', product: 'unknown' }), 'all');
  assert.equal(defaultDirectoryCategory({ market: undefined, product: 'spot' }), 'all');
});


test('Japanese research question cards answer their own registry question without positional drift', async () => {
  const html = await renderRegionalMarketPreview({ market: 'JP', locale: 'ja' });
  const cards = [...html.matchAll(/<article[^>]*data-aeo-question="([^"]+)" data-aeo-answer="([^"]+)"[^>]*><strong>([^<]+)<\/strong><p>([^<]+)<\/p>/g)];
  assert.equal(cards.length, 3);
  const expectations = [
    ['jp-fsa-register', /金融庁.*登録情報/, /登録情報は出発点/],
    ['jp-identity', /本人確認.*居住地|居住地.*本人確認/, /公式.*(?:口座|フロー|案内)/],
    ['jp-jpy-funding', /日本円.*入金方法/, /本人名義口座.*手数料/],
  ];
  for (let i = 0; i < expectations.length; i++) {
    const [id, topic, boundary] = expectations[i];
    const [, question, extractedAnswer, visibleQuestion, visibleAnswer] = cards[i];
    assert.equal(question, aeoQuestionText(id));
    assert.equal(visibleQuestion, question);
    assert.equal(visibleAnswer, extractedAnswer, 'AEO attribute must match the visible answer');
    assert.match(visibleAnswer, topic, id);
    assert.match(visibleAnswer, boundary, id);
  }
  assert.doesNotMatch(cards[1][2], /日本円の入金方法/);
  assert.doesNotMatch(cards[2][2], /登録事業者であることだけ/);
});


test('registry-backed regional question answers retain regulation, identity and funding alignment', async () => {
  for (const [market, locale, expectations] of [
    ['KR', 'ko', [['kr-regulatory-context', /금융위원회/], ['kr-identity', /거주지.*본인확인|본인확인.*거주지/], ['kr-krw-funding', /원화 입금.*본인 명의 계좌/]]],
    ['UK', 'en', [['uk-fca-register', /FCA.*register/], ['uk-residence-route', /residence.*identity|identity.*residence/], ['uk-gbp-funding', /GBP funding.*limits/]]],
    ['EU', 'en', [['eu-mica-register', /ESMA.*MiCA register/], ['eu-member-state', /country|member state/], ['eu-sepa-funding', /EUR.*SEPA/]]],
      ]) {
    const html = await renderRegionalMarketPreview({ market, locale });
    const cards = [...html.matchAll(/<article[^>]*data-aeo-question="([^"]+)" data-aeo-answer="([^"]+)"[^>]*><strong>([^<]+)<\/strong><p>([^<]+)<\/p>/g)];
    assert.equal(cards.length, expectations.length, market);
    expectations.forEach(([id, topic], index) => {
      assert.equal(cards[index][1], aeoQuestionText(id), id);
      assert.equal(cards[index][2], cards[index][4], id);
      assert.match(cards[index][4], topic, id);
    });
  }
});


test('MX Spanish and shared BR Portuguese funding matrix text keeps research boundaries localized', async () => {
  for (const [market, locale, name, topic] of [['MX', 'es', 'México', /CURP/], ['OTHER', 'pt-BR', 'Brasil', /CPF ou CNPJ/]]) {
    const html = await renderRegionalMarketPreview({ market, locale });
    const target = market === 'MX' ? 'MX' : 'BR';
    const row = html.match(new RegExp(`<article[^>]*data-funding-market="${target}"[\\s\\S]*?<\\/article>`))?.[0] || '';
    assert.ok(row, target);
    assert.match(row, new RegExp(`<strong>${name}</strong>`));
    assert.match(row, topic);
    assert.doesNotMatch(row, /Confirm |Match |Check |Read |Does not prove|bank transfer|deposit guidance|information/);
    assert.match(html, locale === 'es' ? /Abrir recurso JSON/ : /Abrir recurso JSON/);
    assert.match(html, /2026-09-28/);
  }
});
