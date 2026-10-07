import assert from "node:assert/strict";
import test from "node:test";
import { renderUnavailableActivityModule } from "../scripts/fetch-exchange-campaigns-and-listings.mjs";
import { GENERATED_AT, GENERATION_STATUS, OFFICIAL_EXCHANGE_ACTIVITIES } from "../src/data/generated-official-activities.js";

test("build-time activity generation fails closed without an official feed adapter", () => {
  assert.equal(GENERATED_AT, null);
  assert.equal(GENERATION_STATUS, "UNAVAILABLE_NO_OFFICIAL_FEED");
  assert.deepEqual(OFFICIAL_EXCHANGE_ACTIVITIES, []);

  const generatedModule = renderUnavailableActivityModule();
  assert.match(generatedModule, /OFFICIAL_EXCHANGE_ACTIVITIES = \[\]/);
  assert.doesNotMatch(generatedModule, /APPROVED|mockAnnouncements|Date\.now|fixture:\s*false/);
});
