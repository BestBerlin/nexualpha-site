import test from "node:test";
import assert from "node:assert/strict";
import { TOPIC_SLUGS } from "../src/data/topic-guides-data.js";
import { topicSourcesFor } from "../src/data/topic-source-registry.js";

test("every topic platform has a visible source-review record", () => {
  for (const slug of TOPIC_SLUGS) {
    const records = topicSourcesFor(slug);
    assert.ok(records.length > 0, `${slug} must have platform source records`);
    for (const record of records) {
      assert.ok(record.slug);
      assert.ok(record.checkedAt || record.status === "pending-source-review");
      if (record.sources.length) assert.ok(record.sources.every((source) => /^https:\/\//.test(source.url)));
    }
  }
});
