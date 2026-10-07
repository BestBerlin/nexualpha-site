import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { officialCampaignResearchByVenue } from '../src/data/official-campaign-research.js';
import { researchView } from '../src/data/official-campaign-model.js';
import {
  OFFICIAL_CAMPAIGN_LOCALIZED_LOCALES,
  campaignResearchLocalizedText,
  hasCampaignResearchLocale,
  officialCampaignResearchLocalizations,
} from '../src/data/official-campaign-localizations.js';

const req = createRequire(import.meta.url);
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const root = fileURLToPath(new URL('../', import.meta.url));
const base = fileURLToPath(new URL('../../../r207-coherent-topic-navigation/candidate/', import.meta.url));
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const fixedNow = Date.parse('2026-09-07T00:00:00Z');
const beforeResearch = (await import(new URL('../../../r207-coherent-topic-navigation/candidate/src/data/official-campaign-research.js', import.meta.url))).officialCampaignResearchByVenue;
const englishGenericSnippets = [
  'Official source details are currently being verified',
  'Confirm conditions and benefits on the official page',
  'No account-specific amount',
  'Public task, points and voucher navigation',
  'personal terms were not',
  'official reward source supports an offer',
];
const sha = (file) => createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex');
const read = (r, p) => readFileSync(path.join(r, p), 'utf8');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function loadComponent(file, exportName) {
  const bundled = buildSync({
    entryPoints: [path.join(root, file)],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    loader: { '.css': 'empty' },
    external: ['react', 'react/jsx-runtime'],
  }).outputFiles[0].text;
  const m = { exports: {} };
  vm.runInNewContext(bundled, { module: m, exports: m.exports, require: (name) => name === 'react' ? React : name === 'react/jsx-runtime' ? req(name) : req(name), URL, URLSearchParams, Intl, Date, console });
  return m.exports[exportName] || m.exports.default;
}

function text(html) {
  return html.replace(/<[^>]*>/g, ' ');
}

function flattenOwnedPaths(record) {
  const reward = record.signupReward || {};
  const paths = [
    ['summary'],
    ['signupReward', 'summary'],
    ...(reward.conditions || []).map((_, index) => ['signupReward', 'conditions', String(index)]),
    ...(record.sources || []).map((source) => ['sources', source.id, 'summary']),
    ...(record.notices || []).map((_, index) => ['notices', String(index)]),
  ];
  for (const [key, value] of Object.entries(record.evidenceRequirements || {})) {
    if (Array.isArray(value)) paths.push(...value.map((_, index) => ['evidenceRequirements', key, String(index)]));
    else if (value !== null && value !== undefined) paths.push(['evidenceRequirements', key]);
  }
  return paths;
}

test('partner registry and official source metadata remain byte-identical to R207', () => {
  assert.equal(sha('src/data/partner-registry.js'), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
  assert.equal(read(root, 'src/data/official-campaign-research.js'), read(base, 'src/data/official-campaign-research.js'));
  for (const [slug, record] of Object.entries(officialCampaignResearchByVenue)) {
    const before = beforeResearch[slug];
    assert.deepEqual(record.sources.map((s) => [s.id, s.title, s.url, s.sourceType, s.checkedAt, s.publishedAt, s.startAt, s.endAt]), before.sources.map((s) => [s.id, s.title, s.url, s.sourceType, s.checkedAt, s.publishedAt, s.startAt, s.endAt]), slug);
  }
});

test('localized dictionary covers only existing owned fields for every venue and supported locale', () => {
  assert.deepEqual(OFFICIAL_CAMPAIGN_LOCALIZED_LOCALES, locales);
  for (const [slug, record] of Object.entries(officialCampaignResearchByVenue)) {
    assert.ok(officialCampaignResearchLocalizations[slug], slug);
    for (const locale of locales) assert.equal(hasCampaignResearchLocale(slug, locale), true, `${slug}:${locale}`);
    for (const pathParts of flattenOwnedPaths(record)) {
      for (const locale of locales) {
        const value = campaignResearchLocalizedText(slug, pathParts, locale);
        assert.equal(typeof value, 'string', `${slug}:${locale}:${pathParts.join('.')}`);
        assert.ok(value.trim().length > 0, `${slug}:${locale}:${pathParts.join('.')} empty`);
      }
    }
    const originalNoticeCount = record.notices?.length || 0;
    const localizedNotices = officialCampaignResearchLocalizations[slug]?.notices || [];
    assert.equal(localizedNotices.length, originalNoticeCount, `${slug} must not invent notices`);
  }
});

test('researchView preserves field cardinality and uses per-record localized text rather than one generic replacement', () => {
  const summarySet = new Set();
  const rewardSet = new Set();
  const sourceSet = new Set();
  for (const [slug, record] of Object.entries(officialCampaignResearchByVenue)) {
    for (const locale of locales) {
      const view = researchView(record, locale, fixedNow);
      assert.ok(view, slug + ':' + locale);
      assert.equal(view.contentLocale, locale, slug + ':' + locale + ' rendered display locale');
      assert.ok(['en','zh-Hans','zh-Hant'].includes(view.sourceContentLocale), slug + ':' + locale + ' original research body locale remains explicit');
      assert.equal(view.signupReward.conditions.length, record.signupReward?.conditions?.length || 0, `${slug}:${locale} condition cardinality`);
      assert.equal(view.notices.length, record.notices?.length || 0, `${slug}:${locale} notice cardinality`);
      assert.equal(view.sources.length, record.sources.filter((source) => source.url).length, `${slug}:${locale} source cardinality`);
      const combined = [view.summary, view.signupReward.summary, ...view.signupReward.conditions, ...view.sources.map((s) => s.summary), ...view.notices, ...(view.evidenceRequirements.gaps || [])].join(' ');
      if (!['en','zh-Hans','zh-Hant'].includes(locale)) {
        for (const snippet of englishGenericSnippets) assert.doesNotMatch(combined, new RegExp(escapeRegExp(snippet)), slug + ':' + locale + ' leaked generic/English snippet ' + snippet);
      }
      assert.ok(view.sources.every((source) => source.url.startsWith('https://')), slug + ':' + locale + ' safe source urls preserved');
      if (locale === 'ar') {
        summarySet.add(view.summary);
        rewardSet.add(view.signupReward.summary);
        view.sources.forEach((source) => sourceSet.add(source.summary));
      }
    }
  }
  assert.ok(summarySet.size > 18, `Arabic summaries collapsed to ${summarySet.size}`);
  assert.ok(rewardSet.size > 15, `Arabic rewards collapsed to ${rewardSet.size}`);
  assert.ok(sourceSet.size > 20, `Arabic source notes collapsed to ${sourceSet.size}`);
});

test('field-specific facts, numbers and ended status survive localization', () => {
  const bitgetPt = researchView(officialCampaignResearchByVenue.bitget, 'pt-BR', fixedNow);
  assert.match(bitgetPt.signupReward.summary, /6[.,]200\s*USDT/);
  assert.match([bitgetPt.summary, bitgetPt.signupReward.summary, ...bitgetPt.sources.map((s) => s.summary)].join(' '), /2025/);

  const kucoinDe = researchView(officialCampaignResearchByVenue.kucoin, 'de', fixedNow);
  assert.match(kucoinDe.signupReward.summary, /3[.,]200\s*USDT/);

  const gateAr = researchView(officialCampaignResearchByVenue['gate-io'], 'ar', Date.parse('2026-10-01T00:00:00Z'));
  const europeSource = gateAr.sources.find((source) => source.id === 'gate-europe-august-campaign');
  assert.ok(europeSource, 'gate Europe source exists');
  assert.equal(europeSource.period, 'ENDED');
  assert.match(europeSource.summary, /7|٧/);
  assert.match(europeSource.summary, /200|٢٠٠/);
});

test('DEX records are not injected with CEX/KYC notices or conditions absent from the original record', () => {
  const record = officialCampaignResearchByVenue.uniswap;
  const view = researchView(record, 'ar', fixedNow);
  assert.equal(view.signupReward.conditions.length, record.signupReward.conditions.length);
  assert.equal(view.notices.length, 0);
  const combined = [...view.signupReward.conditions, ...view.notices, view.summary, view.signupReward.summary].join(' ');
  assert.doesNotMatch(combined, /\bCEX\b|KYC|اعرف عميلك/);
  assert.doesNotMatch(combined, /حساب.*CEX|CEX.*حساب/);
});

test('Arabic activity reward card and research body render RTL native text while official titles stay source identity', () => {
  const ActivityCenterV3 = loadComponent('src/components/v3/activity/ActivityCenterV3.jsx', 'ActivityCenterV3');
  const OfficialResearchPage = loadComponent('src/components/v3/activity/OfficialResearch.jsx', 'OfficialResearchPage');
  const venues = Object.keys(officialCampaignResearchByVenue).map((slug) => ({ slug, name: slug === 'binance' ? 'Binance' : slug, category: 'CEX', sourceHubs: [] }));
  const activityHtml = renderToStaticMarkup(React.createElement(ActivityCenterV3, { locale: 'ar', venues, publicUpdates: [] }));
  const activityText = text(activityHtml);
  for (const snippet of englishGenericSnippets) assert.doesNotMatch(activityText, new RegExp(escapeRegExp(snippet)));
  assert.match(activityText, /تحقق|راجع|الشروط|الأهلية|المكافآت/);
  assert.match(activityHtml, /href="\/ar\/activities\/research\/binance"/);
  assert.match(activityHtml, /href="\/ar\/exchanges\/binance"/);

  const researchHtml = renderToStaticMarkup(React.createElement(OfficialResearchPage, { locale: 'ar', venue: venues.find((venue) => venue.slug === 'binance'), venues }));
  assert.match(researchHtml, /lang="ar" dir="rtl"/);
  assert.match(researchHtml, /Binance Rewards Hub/);
  assert.doesNotMatch(text(researchHtml), /No account-specific amount|Public task, points and voucher navigation/);
});
