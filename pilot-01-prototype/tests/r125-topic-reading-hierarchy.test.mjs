import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/components/v3/TopicGuidePage.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/components/v3/topic-guide.css', import.meta.url), 'utf8');

const topDecisionIndex = page.indexOf('<TopDecisionBox');
const bridgeIndex = page.indexOf('<NextDecisionBridge');
const quickStatsIndex = page.indexOf('className="topic-quick-stats"');
const faqDisclosureIndex = page.indexOf('topicUiResolved?.faqOpen');
const onsiteTelegramIndex = page.indexOf('<OnsiteTelegramBotHandoff');

test('R125 topic bridge waits until after the main reading body', () => {
  assert.ok(topDecisionIndex > 0, 'topic top decision box exists');
  assert.ok(bridgeIndex > 0, 'topic next decision bridge exists');
  assert.ok(quickStatsIndex > 0, 'topic quick stats opening section exists');
  assert.ok(faqDisclosureIndex > 0, 'FAQ body disclosure exists');
  assert.ok(onsiteTelegramIndex > 0, 'Telegram handoff exists');
  assert.ok(bridgeIndex > faqDisclosureIndex, 'bridge is moved after the core body and FAQ section');
  assert.ok(bridgeIndex < onsiteTelegramIndex, 'bridge sits near the Telegram/related tail instead of before reading');
});

test('R125 topic bridge keeps context props and tracking identity intact', () => {
  const bridgeBlock = page.slice(bridgeIndex, page.indexOf('/>', bridgeIndex) + 2);
  for (const expected of [
    'className="topic-next-decision-bridge"',
    'locale={locale}',
    'market={market}',
    'product={product}',
    'profileSlug={publicPlatforms[0]?.slug}',
    'profileLabel={topicPlatformDisplayName(publicPlatforms[0], isHant, isZh)}',
    'compareSlugs={topicBridgeCompareSlugs}',
    'placement="topic-next-decision-bridge"',
    'decision={topic.slug}',
  ]) {
    assert.ok(bridgeBlock.includes(expected), `bridge keeps ${expected}`);
  }
  assert.match(page, /if \(isZh\) return platform\?\.name;/, 'Chinese display preserves the original platform label');
  assert.match(page, /neutralVenueCatalog\.find\(\(venue\) => venue\.slug === platform\?\.slug\)\?\.name \|\| platform\?\.name;/, 'international display uses known native brand name without changing platform identity');
});

test('R125 topic mobile hero is tightened without hiding H1 or source sections', () => {
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.topic-header \{[\s\S]*margin-bottom:\s*1rem;/, 'mobile header spacing is tightened');
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.topic-header__title \{[\s\S]*font-size:\s*clamp\(1\.45rem,\s*8vw,\s*2\.05rem\);[\s\S]*line-height:\s*var\(--lh-head,\s*1\.15\);/, 'mobile H1 scale is bounded');
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.topic-header__subtitle \{[\s\S]*margin-bottom:\s*0\.7rem;/, 'mobile subtitle spacing is compact');
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*body \.v2-page\.topic-guide-page \.topic-header__subtitle \{[\s\S]*font-size:\s*16px !important;/, 'mobile subtitle size uses high-specificity topic-page rule over global V3 prose rules');
  assert.doesNotMatch(css, /\.topic-header__title\s*\{[^}]*display:\s*none/, 'H1 remains visible');
  assert.match(page, /<TopicDisclosure title=\{topicUiResolved\?\.sourceOpen/, 'source register disclosure remains in the page');
  assert.match(page, /<details className="topic-header__context">[\s\S]*topicUiResolved\?\.sourceOpen[\s\S]*topic-header__category[\s\S]*topic-header__pills/, 'auxiliary topic category and pills move into a localized native context disclosure');
  assert.doesNotMatch(page, /topic-header__badge-row" aria-label=\{isZh/, 'badge row does not add a new zh-en-only aria label');
  const beforeContext = page.slice(page.indexOf('<div className="topic-header">'), page.indexOf('<details className="topic-header__context">'));
  const contextBlock = page.slice(page.indexOf('<details className="topic-header__context">'), page.indexOf('</details>', page.indexOf('<details className="topic-header__context">')));
  assert.doesNotMatch(beforeContext, /topic-header__pills|topic-header__category/, 'category and pills no longer sit as visible hero chrome before the disclosure');
  assert.match(contextBlock, /<details className="topic-header__context">[\s\S]*<div className="topic-header__pills">/, 'pills live inside the default-closed context disclosure');
  assert.match(css, /\.topic-header__context > summary[\s\S]*min-height:\s*44px;/, 'context disclosure keeps a touch-safe summary');
  assert.match(css, /\.topic-nav-strip::-webkit-scrollbar-track[\s\S]*rgba\(2, 6, 23, 0\.55\)/, 'topic nav scrollbar track stays dark instead of white');
});
