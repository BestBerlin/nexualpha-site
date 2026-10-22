import {committedFileHash} from './r100-test-contracts.mjs';
import {existsSync} from 'node:fs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const EXPECTED_HASH = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";
if(!existsSync(new URL('../docs/evidence/telegram-wave56-14-day-cadence-20260916.json',import.meta.url))) test('cadence review evidence available',{skip:'Requires archived telegram-wave56-14-day-cadence-20260916.json'},()=>{});
else{
const cadence = JSON.parse(await readFile(new URL("../docs/evidence/telegram-wave56-14-day-cadence-20260916.json", import.meta.url), "utf8"));
const feed = JSON.parse(await readFile(new URL("../src/data/generated-tg-broadcast-feed.json", import.meta.url), "utf8"));

test("Wave56 cadence uses 14 unique paced slots and existing drafts only", () => {
  assert.equal(cadence.schedule.length, 14);
  assert.deepEqual(cadence.schedule.map((slot) => slot.day), Array.from({ length: 14 }, (_, index) => index + 1));
  const publish = cadence.schedule.filter((slot) => slot.action === "publish");
  assert.equal(publish.length, 7);
  assert.equal(new Set(publish.map((slot) => slot.draftId)).size, publish.length);
  const known = new Set(feed.broadcasts.map((draft) => draft.id));
  assert.ok(publish.every((slot) => known.has(slot.draftId)));
  assert.equal(cadence.sourceInventoryCount, 92);
  assert.equal(cadence.newDrafts, 0);
});

test("Wave56 Telegram URLs remain NexuAlpha-first and carry controlled attribution", () => {
  for (const slot of cadence.schedule.filter((item) => item.action === "publish")) {
    const url = new URL(slot.landingUrl);
    assert.equal(url.origin, "https://nexualpha.com");
    assert.equal(url.searchParams.get("utm_source"), "tg_channel");
    assert.equal(url.searchParams.get("utm_medium"), "broadcast");
    assert.ok(url.searchParams.get("utm_campaign"));
    assert.ok(url.searchParams.get("tg_draft"));
    assert.ok(url.searchParams.get("tg_intent"));
  }
  const serialized = JSON.stringify(cadence);
  assert.doesNotMatch(serialized, /partner\.bitget|binance\.com\/join|topzhjdgxcb|backpack\.exchange\/join|referral(code)?=/i);
  assert.equal(cadence.telegramApiCalls, 0);
  assert.equal(cadence.messagesSent, 0);
});

test("Wave56 cadence preserves the partner registry constitution hash", async () => {
  const bytes = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), EXPECTED_HASH);
  assert.equal(cadence.protectedPartnerRegistrySha256, EXPECTED_HASH);
});

}

test('independent current registry protection',async()=>{const bytes=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),committedFileHash('src/data/partner-registry.js'));});
