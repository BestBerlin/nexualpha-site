import { localizedHref } from '../src/data/locale-routing.js';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const workspace = path.resolve(root, '../../..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const acceptedTopicHash = 'fb910b78378403bd23e4d1f911d51555d390d437d02c9aac18c0ce0fcf9310c8';
const ledgerHash = '1fdc49132aae3cf29a471153a07093a6a8be953e4e8314bf9724f1be20c70907';

export function acceptedTopicPresentation() {
  const raw = readFileSync(new URL('./fixtures/r189-topic-presentation-ledger.json', import.meta.url));
  assert.equal(hash(raw), ledgerHash, 'approved source-diff ledger is immutable');
  const ledger = JSON.parse(raw);
  let source = readFileSync(path.join(workspace, 'release-candidates/r128-home-mobile/candidate/src/components/v3/TopicGuidePage.jsx'), 'utf8');
  assert.equal(hash(source), ledger.legacySourceSHA256, 'keep original R128 snapshot');
  for (const transition of ledger.transitions) {
    assert.equal(hash(source), transition.beforeSHA256, transition.from);
    for (const record of transition.evidence) {
      assert.equal(hash(readFileSync(path.join(workspace, record.path))), record.sha256, record.path);
    }
    const lines = source.split(/(?<=\n)/);
    for (const hunk of [...transition.hunks].reverse()) {
      assert.equal(lines.slice(hunk.oldStart, hunk.oldEnd).join(''), hunk.before, transition.to + ' exact prior hunk');
      lines.splice(hunk.oldStart, hunk.oldEnd - hunk.oldStart, ...hunk.after.split(/(?<=\n)/).filter(Boolean));
    }
    source = lines.join('');
    assert.equal(hash(source), transition.afterSHA256, transition.to + ' complete authorized source');
  }
  assert.equal(hash(source), acceptedTopicHash);
  const peer = readFileSync(path.join(workspace, 'release-candidates/r176-editorial-mobile-integration/candidate/src/components/v3/TopicGuidePage.jsx'), 'utf8');
  assert.equal(peer, source, 'accepted peer equals complete approved chain');
  // R192: retain the complete R128->R176 chain, then apply only independently reviewed R183 hunks.
  const extensionRaw = readFileSync(new URL('./fixtures/r192-r183-presentation-ledger.json', import.meta.url));
  assert.equal(hash(extensionRaw), '4374bc269a2eb9a28f094373840e07d0bdc74a5392e78874be3e972f06fabb56', 'immutable R183 exact extension');
  const extension = JSON.parse(extensionRaw);
  assert.equal(hash(source), extension.beforeSHA256, 'R183 starts at exact accepted R176');
  for (const record of extension.evidence) assert.equal(hash(readFileSync(path.join(workspace, record.path))), record.sha256, record.path);
  const lines = source.split(/(?<=\n)/);
  for (const hunk of [...extension.hunks].reverse()) {
    assert.equal(lines.slice(hunk.oldStart, hunk.oldEnd).join(''), hunk.before, 'R183 exact prior hunk');
    lines.splice(hunk.oldStart, hunk.oldEnd - hunk.oldStart, ...hunk.after.split(/(?<=\n)/).filter(Boolean));
  }
  source = lines.join('');
  assert.equal(hash(source), extension.afterSHA256, 'complete approved R183 source');
  assert.equal(source, readFileSync(path.join(workspace, 'release-candidates/r183-derivatives-route-task/candidate/src/components/v3/TopicGuidePage.jsx'), 'utf8'), 'R183 independently reviewed frozen peer');
  return source;
}

export function assertApprovedResearchMove(current, original, locale) {
  const prefix = { en: '', 'zh-Hans': '/zh-hans', 'zh-Hant': '/zh-hant' }[locale];
  assert.notEqual(prefix, undefined, 'only the original three locale fixtures are approved');
  const group = [prefix + '/exchanges/hashkey', prefix + '/compare/hashkey-vs-kraken', prefix + '/telegram'];
  const locate = (array) => array.flatMap((_, i) => group.every((v, j) => array[i + j] === v) ? [i] : []);
  assert.deepEqual(locate(original), [7], 'exactly one original research group at approved original position');
  assert.deepEqual(locate(current), [19], 'exactly one group at approved post-sources position');
  assert.equal(original[6], 'https://www.kraken.com/features');
  assert.equal(current[18], 'https://www.okx.com/en-us/help/freeze-coverage-faq');
  assert.match(current[22], /tg_return=bot/, 'research group precedes original contextual return path');
  const restored = [...current];
  restored.splice(19, 3);
  restored.splice(7, 0, ...group);
  assert.deepEqual(restored, original, 'every other href value, duplicate count and ordered position is unchanged');
  assert.deepEqual([...current].sort(), [...original].sort(), 'all complete href multiplicities preserved');
}


export function withoutApprovedR183EvidenceLinks(body, key) {
  const [slug, locale] = key.split(':');
  const pattern = /<a\b[^>]*data-cta-placement="topic-derivatives-route-evidence"[^>]*>[\s\S]*?<\/a>/g;
  const anchors = [...body.matchAll(pattern)].map(m => m[0]);
  assert.equal(anchors.length, slug === 'derivatives' ? 4 : 0, key + ' exact four added research links only on derivatives');
  const expected = (localizedHref('/topics/derivatives', { locale }) + '#perp-cost-field-dictionary').replaceAll('&', '&amp;');
  for (const anchor of anchors) {
    assert.equal([...anchor.matchAll(/href="([^"]*)"/g)].length, 1);
    assert.equal(anchor.match(/href="([^"]*)"/)[1], expected, key + ' complete original localized dictionary route');
    for (const [name, value] of Object.entries({ 'data-cta-kind':'research', 'data-growth-decision':'perp_cost_dictionary', 'data-growth-placement':'topic-derivatives-route-evidence' })) assert.ok(anchor.includes(`${name}="${value}"`), key + name);
    assert.ok(anchor.replace(/<[^>]*>/g, '').trim().length > 1, key + ' visible native label');
  }
  return body.replace(pattern, '');
}
