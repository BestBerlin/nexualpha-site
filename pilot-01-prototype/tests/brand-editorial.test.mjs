import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("NexuAlpha logo reserves dimensions and never uses an artwork crop", async () => {
  const css = await readFile(new URL("../src/styles/release-visual-gates.css", import.meta.url), "utf8");
  const mark = await readFile(new URL("../src/components/brand/NexuAlphaWordmark.jsx", import.meta.url), "utf8");
  const rule = css.match(/\.nexualpha-wordmark__mark\s*\{([^}]+)\}/)?.[1];
  assert.match(rule, /object-fit:\s*contain/);
  assert.match(mark, /width="150" height="150"/);
});

const crossroadsCompare = await readFile(new URL("../src/components/v3/CrossroadsCompare.jsx", import.meta.url), "utf8");
const leanHero = await readFile(new URL("../src/components/v3/LeanHero.jsx", import.meta.url), "utf8");

test("homepage comparison choices retain real localized detail routes and brand marks", () => {
  assert.match(crossroadsCompare, /\/compare\/\$\{pair\.slug\}/);
  assert.match(crossroadsCompare, /<BrandMark slug=\{pair\.left\}/);
  assert.match(crossroadsCompare, /translate="no" lang="en"/);
});

test("editorial identity stays separate from the functional heading and controls", () => {
  // Class b: the directory hero redesign uses hx classes and puts identity in its trust line.
  assert.match(leanHero, /className="hx__trust-line"/);
  assert.match(leanHero, /<h1 className="hx__title enter"/);
  assert.match(leanHero, /<p className="hx__subtitle">/);
  assert.match(app, /<LeanHero/);
});

test("brand artwork is local, lightweight and separate from trusted exchange marks", async () => {
  const asset = new URL("../public/brand/nexualpha-ledger-study.webp", import.meta.url);
  assert.ok((await stat(asset)).size < 250_000, "supporting art remains under 250KB");
  assert.doesNotMatch(app, /src="\/brand\/nexualpha-ledger-study\.webp"/);
});

test("social and touch artwork use purpose-sized local assets", async () => {
  const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const worker = await readFile(new URL("../worker/index.js", import.meta.url), "utf8");
  const seo = await readFile(new URL("../src/data/seo-injection.js", import.meta.url), "utf8");
  const touch = new URL("../public/brand/nexualpha/nexualpha-apple-touch-v1.png", import.meta.url);
  const social = new URL("../public/brand/nexualpha/nexualpha-social-v1.jpg", import.meta.url);

  assert.match(index, /apple-touch-icon" sizes="180x180" href="\/brand\/nexualpha\/nexualpha-apple-touch-v1\.png"/);
  assert.match(worker, /DEFAULT_SOCIAL_IMAGE = `\$\{PUBLIC_ORIGIN\}\/brand\/nexualpha\/nexualpha-social-v1\.jpg`/);
  assert.match(seo, /DEFAULT_SOCIAL_IMAGE = `\$\{PUBLIC_ORIGIN\}\/brand\/nexualpha\/nexualpha-social-v1\.jpg`/);
  assert.ok((await stat(touch)).size < 80_000, "touch icon remains under 80KB");
  assert.ok((await stat(social)).size < 180_000, "social image remains under 180KB");
});

test("primary hover keeps normal white text above AA contrast", async () => {
  const css = await readFile(new URL("../src/styles/v2.css", import.meta.url), "utf8");
  const hex = css.match(/\.button-primary:hover\{background:(#[a-f0-9]{6})\}/)?.[1];
  assert.ok(hex);
  const channels = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  assert.ok(1.05 / (luminance + 0.05) >= 4.5);
});
