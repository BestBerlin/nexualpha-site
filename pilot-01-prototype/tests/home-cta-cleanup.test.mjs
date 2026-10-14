import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (file) => readFile(path.join(root, file), "utf8");

async function renderCta() {
  const tempDir = await mkdtemp(path.join(root, "tests/.tmp-home-cta-cleanup-"));
  try {
    const entry = path.join(tempDir, "entry.mjs");
    const out = path.join(tempDir, "out.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { Cta } from "../../src/components/v7/home7-shared.jsx";
      const venue = { slug: "okx", open: true, code: "nexu888", url: "https://www.okx.com/join/nexu888" };
      console.log(renderToStaticMarkup(React.createElement(Cta, { v: venue, locale: "en", className: "h7-btn", placement: "home-v7-hero" }, React.createElement("span", null, "Sign up on OKX"))));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [
      entry,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${out}`,
      "--loader:.jsx=jsx",
      "--log-level=error",
    ], { cwd: root, stdio: "pipe" });
    return execFileSync(process.execPath, [out], { cwd: root, encoding: "utf8" }).trim();
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function renderRegistrationCard() {
  const tempDir = await mkdtemp(path.join(root, "tests/.tmp-registration-cta-cleanup-"));
  try {
    const entry = path.join(tempDir, "entry.mjs");
    const out = path.join(tempDir, "out.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegistrationCard } from "../../src/components/v3/RegistrationCard.jsx";
      console.log(renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: "okx", locale: "en", market: "unknown", product: "spot" })));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [
      entry,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${out}`,
      "--loader:.jsx=jsx",
      "--loader:.css=empty",
      "--log-level=error",
    ], { cwd: root, stdio: "pipe" });
    return execFileSync(process.execPath, [out], { cwd: root, encoding: "utf8" }).trim();
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("home CTA uses /go attribution and keeps the code as data, never direct registration hrefs", async () => {
  const html = await renderCta();
  assert.match(html, /href="\/go\/okx\?src=home-v7-hero&amp;locale=en"/);
  assert.match(html, /data-cta-code="nexu888"/);
  assert.doesNotMatch(html, /okx\.com\/join/);
});

test("home hero CTA has no explanatory subline source or styles", async () => {
  const home = await read("src/components/v7/HomeV7.jsx");
  const shared = await read("src/components/v7/home7-shared.jsx");
  const copy = `${await read("src/components/v7/home7-copy.js")}\n${await read("src/components/v7/home7-copy-i18n.js")}`;
  const css = await read("src/styles/v7/home7.src.css");
  assert.doesNotMatch(home, /h7-go-disclosure|lgBuilt|lgLink/);
  assert.doesNotMatch(shared, /href=\{v\.url\}/);
  assert.doesNotMatch(copy, /\blgBuilt\b|\blgLink\b|built in|自带邀请码|內含邀請碼|nothing to type|nichts einzugeben|não precisa digitar|no tienes que escribir|niente da digitare/i);
  assert.doesNotMatch(css, /h7-go-disclosure/);
});

test("registration card primary signup uses /go attribution and keeps hidden code data", async () => {
  const html = await renderRegistrationCard();
  const primary = html.match(/<a[^>]*data-cta-placement="registration-card-primary"[^>]*>[\s\S]*?<\/a>/)?.[0] || "";
  assert.match(primary, /href="\/go\/okx\?src=registration-card-primary&amp;locale=en&amp;product=spot"/);
  assert.match(primary, /data-cta-code="nexu888"/);
  assert.doesNotMatch(primary, /https?:\/\/[^"\s]+okx\.com\/join/i);
});
