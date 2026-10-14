import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tsx = readFileSync(new URL("./whale-board.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./whale-board.css", import.meta.url), "utf8");
const componentTest = readFileSync(new URL("./whale-board.test.tsx", import.meta.url), "utf8");

test("Mini App whale-board artifact targets the whale feed and not the old movers feed", () => {
  assert.match(tsx, /巨鲸动向/);
  assert.match(tsx, /\/api\/site\/whales/);
  assert.match(tsx, /https:\/\/nexualpha\.com\/api\/whales\.json/);
  assert.doesNotMatch(tsx, /movers|今日异动|涨幅|跌幅/i);
  assert.match(tsx, /schemaVersion/);
  assert.match(tsx, /updatedAt/);
  assert.match(tsx, /rows/);
  assert.match(tsx, /signals.*positions.*transfers/s);
  assert.match(tsx, /SAFE_EXPLORER_HOSTS/);
});

test("Mini App whale-board artifact keeps mobile tap targets and no placeholder rows", () => {
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /min-height:\s*56px/);
  assert.doesNotMatch(tsx, /—|skeleton|placeholder|--pad|__pad/i);
  assert.doesNotMatch(css, /skeleton|placeholder|--pad|__pad/i);
});

test("Mini App whale-board artifact includes local vitest coverage for the external repo", () => {
  assert.match(componentTest, /orders accumulation signals before positions and transfers/);
  assert.match(componentTest, /not\.toContain\("今日异动"\)/);
  assert.match(componentTest, /allows only known explorer hosts/);
});

test("Mini App integration patch wires the home import and site proxy", () => {
  const patch = readFileSync(new URL("./miniapp-home-integration.patch", import.meta.url), "utf8");
  assert.match(patch, /import \{ WhaleBoard \} from "\.\/whale-board"/);
  assert.match(patch, /<WhaleBoard locale=\{locale\} \/>/);
  assert.match(patch, /whales: "https:\/\/nexualpha\.com\/api\/whales\.json"/);
});
