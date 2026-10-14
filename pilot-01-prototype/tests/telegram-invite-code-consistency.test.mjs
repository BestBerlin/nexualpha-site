import test from 'node:test';
import assert from 'node:assert/strict';
import { scanTelegramRepository, scanTelegramSource } from '../scripts/scan-telegram-invite-codes.mjs';

test('Telegram scanner rejects wrong fallback values, year ambiguity and placeholders', () => {
  assert.equal(scanTelegramSource('{ slug: "hyperliquid", inviteCode: "NEXU888" }').length, 0);
  for (const fixture of ['{ slug: "hyperliquid", inviteCode: "nexu888" }', 'Hyperliquid 邀请码 2026', 'NEXU_KUCOIN']) assert.ok(scanTelegramSource(fixture).length, fixture);
  assert.ok(scanTelegramSource('const p = { slug: "hyperliquid", cta: { enabled: true }, inviteCode: "nexu888" };', 'fixture.ts').some(i => i.kind === 'wrong-code'));
});

// Optional external checkout is never modified or made a prerequisite for CI.
test('authorized external Telegram checkout is consistent', { skip: !process.env.TELEGRAM_REPO }, () => {
  const report = scanTelegramRepository(process.env.TELEGRAM_REPO);
  assert.deepEqual(report.missing, [], JSON.stringify(report));
  assert.ok(report.files > 0);
  assert.deepEqual(report.issues, [], JSON.stringify(report));
  console.log(`Telegram invite-code guard scanned ${report.files} static source files`);
});
