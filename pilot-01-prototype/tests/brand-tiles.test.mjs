// Exchange-logo system (de-AI pass 2026-10-18): every slug BrandMark renders as a tile has both normalised assets,
// each a real square WebP, and the tile treatment lives in one global rule.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const src = readFileSync(new URL("../src/components/brand/BrandMark.jsx", import.meta.url), "utf8");
const slugs = JSON.parse(src.match(/BRAND_TILE_SLUGS = Object\.freeze\(new Set\((\[[^\]]*\])\)\)/)[1]);

function webpSize(buffer) {
  // VP8 / VP8L / VP8X headers; enough to prove the tile is square.
  const kind = buffer.toString("ascii", 12, 16);
  if (kind === "VP8 ") return [buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff];
  if (kind === "VP8L") { const b = buffer.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1]; }
  if (kind === "VP8X") return [buffer.readUIntLE(24, 3) + 1, buffer.readUIntLE(27, 3) + 1];
  throw new Error(`unknown webp chunk ${kind}`);
}

test("every tile slug ships square 64 and 128 px assets", () => {
  assert.ok(slugs.length >= 40, "tile list covers the venue catalogue");
  for (const slug of ["bitget", "okx", "binance", "gate-io", "mexc", "htx", "bybit"]) assert.ok(slugs.includes(slug), slug);
  for (const slug of slugs) for (const px of [64, 128]) {
    const file = new URL(`../public/brands/tile/${slug}-${px}.webp`, import.meta.url);
    assert.ok(existsSync(file), `${slug}-${px}`);
    assert.deepEqual(webpSize(readFileSync(file)), [px, px], `${slug}-${px} is square`);
  }
});

test("one global tile treatment: same corner ratio and hairline for every mark", () => {
  const css = readFileSync(new URL("../src/styles/release-visual-gates.css", import.meta.url), "utf8");
  assert.match(css, /img\.v2-brand \{[^}]*border-radius: 22% !important;[^}]*outline: 1px solid/);
  assert.match(css, /img\.v2-brand--tile \{ object-fit: cover !important; \}/);
});
