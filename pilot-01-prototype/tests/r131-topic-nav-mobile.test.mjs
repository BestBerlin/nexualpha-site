import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';


import { existsSync } from 'node:fs';

if (existsSync(new URL('../../../r130-material-hierarchy/candidate/src/components/v3/TopicGuidePage.jsx', import.meta.url))) {
const root = fileURLToPath(new URL('..', import.meta.url));
const page = readFileSync(new URL('../src/components/v3/TopicGuidePage.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/components/v3/topic-guide.css', import.meta.url), 'utf8');
const r130Root = path.resolve(root, '../../r130-material-hierarchy/candidate');
const component = path.join(root, 'src/components/v3/TopicGuidePage.jsx');
const data = path.join(root, 'src/data/topic-guides-data.js');
const locales = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'tr', 'es', 'pt-BR', 'fr', 'de', 'ru', 'ar', 'id', 'vi', 'it'];
const slugs = ['meme-coins', 'derivatives', 'compliant-exchanges', 'no-kyc'];
const expectedShortLabels = {
  en: ['Meme coins', 'Derivatives', 'Fiat access', 'No KYC'],
  'zh-Hans': ['Meme 币', '合约', '法币通道', '免 KYC'],
  'zh-Hant': ['Meme 幣', '合約', '法幣通道', '免 KYC'],
  ja: ['ミーム', 'デリバ', '法定通貨', 'KYCなし'],
  ko: ['밈 코인', '파생상품', '법정화폐', 'KYC 없음'],
  tr: ['Meme', 'Türev', 'Fiat', 'KYC yok'],
  es: ['Meme', 'Deriv.', 'Fiat', 'Sin KYC'],
  'pt-BR': ['Meme', 'Deriv.', 'Fiat', 'Sem KYC'],
  fr: ['Meme', 'Dériv.', 'Fiat', 'Sans KYC'],
  de: ['Meme', 'Deriv.', 'Fiat', 'Ohne KYC'],
  ru: ['Мемы', 'Дерив.', 'Фиат', 'Без KYC'],
  ar: ['ميم', 'مشتقات', 'فيات', 'بلا KYC'],
  id: ['Meme', 'Deriv.', 'Fiat', 'Tanpa KYC'],
  vi: ['Meme', 'Phái sinh', 'Fiat', 'Không KYC'],
  it: ['Meme', 'Deriv.', 'Fiat', 'No KYC'],
};

const expectedFullLabels = {
  en: ['Meme coins and on-chain trade checks', 'Derivatives and perpetual contracts', 'Fiat access and regulatory checks', 'No-KYC and private trading'],
  'zh-Hans': ['Meme 币与链上交易检查', '衍生品与永续合约', '法币通道与合规检查', '免 KYC 与隐私交易'],
  'zh-Hant': ['Meme 幣與鏈上交易檢查', '衍生品與永續合約', '法幣通道與合規檢查', '免 KYC 與隱私交易'],
  ja: ['ミームコインとオンチェーン取引確認', 'デリバティブと無期限先物', '法定通貨アクセスと規制確認', 'KYCなしアクセスとプライベート取引'],
  ko: ['밈 코인과 온체인 거래 확인', '파생상품과 무기한 계약', '법정화폐 접근과 규제 확인', 'KYC 없는 접근과 프라이빗 거래'],
  tr: ['Meme coin ve zincir üstü işlem kontrolleri', 'Türev ürünler ve sürekli sözleşmeler', 'Fiat erişimi ve düzenleyici kontroller', 'KYC yok ve özel işlem'],
  es: ['Meme coins y controles de trading on-chain', 'Derivados y contratos perpetuos', 'Acceso fiat y controles regulatorios', 'Sin KYC y trading privado'],
  'pt-BR': ['Meme coins e checagens de trading on-chain', 'Derivativos e contratos perpétuos', 'Acesso fiat e verificações regulatórias', 'Sem KYC e trading privado'],
  fr: ['Meme coins et contrôles de trading on-chain', 'Dérivés et contrats perpétuels', 'Accès fiat et contrôles réglementaires', 'Sans KYC et trading privé'],
  de: ['Meme-Coins und On-chain-Handelsprüfungen', 'Derivate und Perpetual-Kontrakte', 'Fiat-Zugang und regulatorische Prüfungen', 'Ohne KYC und privater Handel'],
  ru: ['Мемкоины и проверки ончейн-торговли', 'Деривативы и бессрочные контракты', 'Фиатный доступ и регуляторные проверки', 'Без KYC и приватная торговля'],
  ar: ['عملات الميم وفحوصات التداول على السلسلة', 'المشتقات والعقود الدائمة', 'الوصول إلى العملات الورقية والفحوص التنظيمية', 'بلا KYC وتداول خاص'],
  id: ['Meme coin dan pemeriksaan trading on-chain', 'Derivatif dan kontrak perpetual', 'Akses fiat dan pemeriksaan regulasi', 'Tanpa KYC dan trading privat'],
  vi: ['Meme coin và kiểm tra giao dịch on-chain', 'Phái sinh và hợp đồng perpetual', 'Truy cập fiat và kiểm tra quy định', 'Không KYC và giao dịch riêng tư'],
  it: ['Meme coin e controlli di trading on-chain', 'Derivati e contratti perpetual', 'Accesso fiat e controlli regolamentari', 'No KYC e trading privato'],
};

const englishFallbackPhrases = ['Derivatives & Perpetual Contracts', 'Fiat Access & Regulatory Checks', 'No-KYC & Private Trading'];

function decode(text) {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&nbsp;', ' ');
}

function navBlocks(html) {
  return [...html.matchAll(/<nav class="topic-nav-strip(?: topic-nav-strip--tracks)?[^"]*"[\s\S]*?<\/nav>/g)].map((match) => match[0]);
}

function navHrefs(nav) {
  return [...nav.matchAll(/href="([^"]*)"/g)].map((match) => decode(match[1]));
}

function topTopicLinks(html) {
  const nav = navBlocks(html)[0] || '';
  return [...nav.matchAll(/<a\s+([^>]*)>([\s\S]*?)<\/a>/g)].map((match) => {
    const attrs = match[1];
    const inner = match[2];
    const spans = [...inner.matchAll(/<span(?:\s+aria-hidden="true")?>([\s\S]*?)<\/span>/g)].map((span) => decode(span[1].replace(/<[^>]*>/g, '')));
    const fullMatch = inner.match(/<span class="topic-nav-label topic-nav-label--full">([\s\S]*?)<\/span>/);
    const shortMatch = inner.match(/<span class="topic-nav-label topic-nav-label--short">([\s\S]*?)<\/span>/);
    return {
      href: decode(attrs.match(/href="([^"]*)"/)?.[1] || ''),
      ariaLabel: decode(attrs.match(/aria-label="([^"]*)"/)?.[1] || ''),
      label: spans.at(-1) || '',
      fullLabel: fullMatch ? decode(fullMatch[1].replace(/<[^>]*>/g, '')) : '',
      shortLabel: shortMatch ? decode(shortMatch[1].replace(/<[^>]*>/g, '')) : '',
    };
  });
}

async function render(mode) {
  const dir = await mkdtemp(path.join(root, 'tests/.tmp-r131-topic-nav-'));
  try {
    const entry = path.join(dir, 'entry.mjs');
    const bundle = path.join(dir, 'bundle.cjs');
    await writeFile(entry, `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {TopicGuidePage} from '../../src/components/v3/TopicGuidePage.jsx';const locales=${JSON.stringify(locales)};const slugs=${JSON.stringify(slugs)};const out={};for(const slug of slugs)for(const locale of locales)out[slug+':'+locale]=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug,locale}));console.log(JSON.stringify(out));`);
    await build({
      entryPoints: [entry],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: bundle,
      loader: { '.css': 'empty' },
      logLevel: 'silent',
      plugins: [{ name: 'r130-prior', setup(b) { b.onLoad({ filter: /TopicGuidePage\.jsx$|topic-guides-data\.js$/ }, async (args) => {
        if (mode !== 'r130') return;
        if (args.path === component || args.path === data) return { contents: await readFile(path.join(r130Root, path.relative(root, args.path)), 'utf8'), loader: args.path === component ? 'jsx' : 'js', resolveDir: path.dirname(args.path) };
      }); } }],
    });
    return JSON.parse(execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const current = await render('current');
const prior = await render('r130');

test('R131 top topic navigation keeps four real route anchors in SSR order', () => {
  const navStart = page.indexOf('<nav className="topic-nav-strip topic-nav-strip--tracks"');
  const navEnd = page.indexOf('</nav>', navStart);
  const navBlock = page.slice(navStart, navEnd);
  assert.ok(navStart > 0, 'top topic nav exists');
  assert.match(navBlock, /TOPIC_SLUGS\.map/, 'top nav still maps real topic slugs');
  assert.match(navBlock, /href=\{formatHref\(trackSlug\)\}/, 'top nav still uses localized route hrefs');
  assert.match(navBlock, /key=\{trackSlug\}/, 'top nav keeps stable per-topic anchors');
  assert.match(navBlock, /aria-label=\{`\$\{trackShortLabel\}: \$\{trackFullLabel\}`\}/, 'aria-label includes short visible label and full prior label');
  assert.match(navBlock, /topicNavShortLabel\(trackSlug, locale\)/, 'visual label uses short locale-specific topic chooser copy');
  assert.match(navBlock, /topic-nav-label topic-nav-label--full/, 'full label span is present for desktop rendering');
  assert.match(navBlock, /topic-nav-label topic-nav-label--short/, 'short label span is present for mobile rendering');
  assert.doesNotMatch(navBlock, /<select|onChange=|window\.location/, 'top nav is not converted to JS-only select navigation');
});



for (const locale of locales) {
  test(`R131 ${locale} renders short visible labels, full aria labels and unchanged raw hrefs`, () => {
    const currentLinks = topTopicLinks(current[`meme-coins:${locale}`]);
    const priorLinks = topTopicLinks(prior[`meme-coins:${locale}`]);
    assert.equal(currentLinks.length, 4, `${locale} has four current topic links`);
    assert.equal(priorLinks.length, 4, `${locale} has four prior topic links`);
    assert.deepEqual(currentLinks.map((link) => link.href), priorLinks.map((link) => link.href), `${locale} raw hrefs are unchanged from R130`);
    if (locale !== 'en') {
      const fullText = currentLinks.map((link) => link.fullLabel).join(' | ');
      for (const phrase of englishFallbackPhrases) assert.ok(!fullText.includes(phrase), `${locale} full labels must not fall back to English phrase: ${phrase}`);
    }
    assert.deepEqual(currentLinks.map((link) => link.shortLabel), expectedShortLabels[locale], `${locale} short spans use topic chooser copy`);
    assert.deepEqual(currentLinks.map((link) => link.fullLabel), expectedFullLabels[locale], `${locale} full spans use native complete nav labels`);
    for (const [index, link] of currentLinks.entries()) {
      assert.ok(link.ariaLabel.includes(link.shortLabel), `${locale} aria-label includes visible short label for link ${index}`);
      assert.ok(link.ariaLabel.includes(link.fullLabel), `${locale} aria-label includes full desktop label for link ${index}`);
      assert.equal(link.ariaLabel, `${link.shortLabel}: ${link.fullLabel}`, `${locale} aria-label keeps short then native full label for link ${index}`);
    }
  });
}

test('R131 only the first top-level topic nav receives the tracks modifier and other nav markup stays unchanged', () => {
  for (const slug of slugs) for (const locale of locales) {
    const key = `${slug}:${locale}`;
    const currentNavs = navBlocks(current[key]);
    const priorNavs = navBlocks(prior[key]);
    assert.ok(currentNavs.length >= 1, `${key} has at least the top topic nav`);
    assert.equal(currentNavs.length, priorNavs.length, `${key} keeps the same number of nav blocks`);
    assert.match(currentNavs[0], /class="topic-nav-strip topic-nav-strip--tracks"/, `${key} first nav has tracks modifier`);
    for (const nav of currentNavs.slice(1)) assert.doesNotMatch(nav, /topic-nav-strip--tracks/, `${key} non-top nav does not get tracks modifier`);
    assert.deepEqual(currentNavs.slice(1).map(navHrefs), priorNavs.slice(1).map(navHrefs), `${key} non-top nav hrefs stay unchanged from R130`);
    const currentNonTopWithoutModifier = currentNavs.slice(1).join('');
    const priorNonTop = priorNavs.slice(1).join('');
    assert.equal(currentNonTopWithoutModifier, priorNonTop, `${key} non-top nav markup stays unchanged from R130`);
  }
});

} else {
  test('historical regression requires original archived checkout', { skip: 'Original historical source snapshot is absent from a fresh checkout; current-source tests run separately.' }, () => {});
}

// Current-source checks run even when the original peer checkout is absent.
{
const css=readFileSync(new URL('../src/components/v3/topic-guide.css',import.meta.url),'utf8');
test('R131 mobile top topic navigation exposes all options as compact 2x2 tiles', () => {
  assert.match(css, /@media \(max-width: 640px\)/, 'mobile media block exists');
  assert.match(css, /\.topic-nav-label--short\s*\{[^}]*display:\s*none;/, 'desktop/default CSS hides mobile short labels');
  assert.match(css, /\.topic-nav-strip--tracks\s*\{[^}]*display:\s*grid;/, 'top topic nav becomes a grid on mobile');
  assert.match(css, /\.topic-nav-strip--tracks\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/, 'mobile grid exposes two visible columns');
  assert.match(css, /\.topic-nav-strip--tracks\s*\{[^}]*gap:\s*0\.35rem;/, 'tile gap is compact enough for mobile height');
  assert.match(css, /\.topic-nav-strip--tracks\s*\{[^}]*overflow:\s*visible;/, 'top nav no longer depends on hidden horizontal scrolling');
  assert.match(css, /\.topic-nav-strip--tracks\s*>\s*\.topic-nav-btn\s*\{[^}]*min-height:\s*44px;/, 'topic tile keeps touch-safe height');
  assert.match(css, /\.topic-nav-strip--tracks\s*>\s*\.topic-nav-btn\s*\{[^}]*font-size:\s*0\.875rem;/, 'short labels use compact readable type');
  assert.match(css, /\.topic-nav-strip--tracks\s*>\s*\.topic-nav-btn\s*\{[^}]*overflow-wrap:\s*normal;/, 'short labels do not force arbitrary word breaks');
  assert.match(css, /\.topic-nav-strip--tracks\s*>\s*\.topic-nav-btn\s*\{[^}]*word-break:\s*normal;/, 'short labels do not split words like sözleşmeler');
  assert.match(css, /\.topic-nav-strip--tracks\s*>\s*\.topic-nav-btn\s*>\s*\.topic-nav-label--full\s*\{[^}]*display:\s*none;/, 'mobile CSS hides full labels');
  assert.match(css, /\.topic-nav-strip--tracks\s*>\s*\.topic-nav-btn\s*>\s*\.topic-nav-label--short\s*\{[^}]*display:\s*inline;/, 'mobile CSS shows short labels');
  assert.doesNotMatch(css, /(^|\n)\s*\.topic-nav-strip\s*\{[^}]*display:\s*grid;/m, 'mobile grid is not applied to the base nav class');
  assert.doesNotMatch(css, /not\(\.topic-nav-strip--intent\)/, 'top nav scope does not rely on the broad non-intent selector');
});
}
