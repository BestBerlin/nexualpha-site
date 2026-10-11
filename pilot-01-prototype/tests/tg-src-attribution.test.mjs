// Visits from our own Telegram links (?src=tg-…) are attributed to that source, not "direct" (2026-10-11, scorecard G4).
import assert from "node:assert/strict";
import test from "node:test";
import { firstTouchSource } from "../src/data/cta-analytics.js";

test("?src= from our Telegram links becomes the first-touch source; utm_source still wins; junk is ignored", () => {
  const origin = "https://nexualpha.com";
  assert.equal(firstTouchSource({ search: "?src=tg-alert-channel-ru", origin }), "tg-alert-channel-ru");
  assert.equal(firstTouchSource({ search: "?src=tg-channel-zh", referrer: "", origin }), "tg-channel-zh");
  assert.equal(firstTouchSource({ search: "?utm_source=telegram&src=tg-channel-zh", origin }), "telegram");
  assert.equal(firstTouchSource({ search: "?src=%3Cscript%3E", origin }), "direct");
  assert.equal(firstTouchSource({ search: "", referrer: "https://www.google.com/", origin }), "www.google.com");
});
