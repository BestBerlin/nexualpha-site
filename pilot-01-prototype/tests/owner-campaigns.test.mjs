// 2026-10-10: owner-curated campaigns show only while active and only with an official https page.
import test from "node:test";
import assert from "node:assert/strict";
import { activeOwnerCampaigns, OWNER_CAMPAIGNS } from "../src/data/owner-campaigns.js";

test("owner campaign list is well-formed and filters by dates", () => {
  assert.ok(Array.isArray(OWNER_CAMPAIGNS));
  for (const c of activeOwnerCampaigns()) {
    assert.match(c.url, /^https:\/\//);
    assert.ok(c.venue && c.id);
  }
});
