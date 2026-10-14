import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/components/v3/activity/ActivityPages.jsx", import.meta.url), "utf8");
const detailSource = await readFile(new URL("../src/components/v3/activity/ActivityDetailPage.jsx", import.meta.url), "utf8");

test("/activities keeps the heavy ActivityCenterV3 out of the client entry while preserving SSR", () => {
  assert.doesNotMatch(source, /import\s+\{\s*ActivityCenterV3\s*\}\s+from\s+["']\.\/ActivityCenterV3\.jsx["']/, "ActivityCenterV3 must not be a static client import of ActivityPages");
  assert.match(source, /import\.meta\.env\.SSR\s*\?\s*import\.meta\.glob\(\["\.\/ActivityCenterV3\.jsx"\],\s*\{\s*eager:\s*true\s*\}\)/, "SSR still eager-loads ActivityCenterV3 so crawler HTML keeps the full activity center");
  assert.match(source, /import\("\.\/ActivityCenterV3\.jsx"\)/, "the browser loads ActivityCenterV3 through a route-local dynamic chunk");
  assert.match(source, /hydrateRoot\(hostRef\.current, element\)/, "the client hydrates the server-rendered activity center when the island wakes");
  assert.match(source, /id="activity-center-v3-root"/, "the SSR/client host id anchors the preserved server HTML");
});

test("activity detail-only dependencies live behind the detail chunk", () => {
  for (const detailOnly of ["CampaignJoin", "campaignCopy", "normalizeActivityEligibility", "useActivityNow", "SourceLink"]) {
    assert.doesNotMatch(source, new RegExp(`import[\\s\\S]*${detailOnly}`), `${detailOnly} must not be imported by the activities index module`);
    assert.match(detailSource, new RegExp(detailOnly), `${detailOnly} stays in the detail module`);
  }
  assert.match(source, /import\.meta\.env\.SSR\s*\?\s*import\.meta\.glob\(\["\.\/ActivityDetailPage\.jsx"\],\s*\{\s*eager:\s*true\s*\}\)/, "SSR eagerly renders the detail page module");
  assert.match(source, /lazy\(\(\) => import\("\.\/ActivityDetailPage\.jsx"\)/, "the browser loads activity detail code through a lazy route chunk");
  assert.match(source, /export function ActivityDetailPage\(props\)/, "ActivityPages keeps the public ActivityDetailPage export for existing route callers");
});
