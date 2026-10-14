import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { buildSync } from "esbuild";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);

const source = `
  import React from "react";
  import { renderToStaticMarkup } from "react-dom/server";
  import { ExchangeMatrix } from "./src/components/v3/ExchangeMatrix.jsx";
  import { matrixCopy } from "./src/components/v3/exchange-matrix-copy.js";
  import { venueDatabase } from "./src/data/venue-database.js";
  import { partnerRegistry, CUSTOM_INVITE_CODES } from "./src/data/partner-registry.js";
  import { PLACEHOLDER_INVITE_CODE } from "./src/data/source-bound-cta.js";

  const context = Object.freeze({ market: "unknown", product: "spot" });
  const noop = () => {};

  export function renderMatrix(width) {
    globalThis.innerWidth = width;
    const venues = Object.values(venueDatabase);
    return renderToStaticMarkup(React.createElement(ExchangeMatrix, {
      venues,
      totalCount: venues.length,
      locale: "en",
      ui: {
        searchLabel: "Search exchanges",
        searchPlaceholder: "Search",
        clearSearch: "Clear search",
        emptyTitle: "No exchanges",
        emptyBody: "No exchange matched.",
        resetFilters: "Reset",
        compareRemove: "Remove from comparison",
        compareSelect: "Add to comparison",
        returnToRegion: "Return",
      },
      mc: matrixCopy("en"),
      context,
      market: "unknown",
      product: "spot",
      contextSearch: "market=unknown&product=spot",
      accountStage: "unknown",
      funding: "unknown",
      selectedCategory: "all",
      onCategory: noop,
      searchQuery: "",
      onSearch: noop,
      onClearSearch: noop,
      searchInputRef: { current: null },
      compareSelection: [],
      onToggleCompare: noop,
      onClearCompare: noop,
      compareHref: "/compare",
      onCopyCode: noop,
      renderCopyFeedback: () => null,
      copiedToast: null,
      onReset: noop,
      regionalReturnHref: null,
    }));
  }

  export const registryCodes = Object.fromEntries(
    Object.keys(venueDatabase)
      .map((slug) => {
        const partner = partnerRegistry[slug];
        const registeredCode = partner?.hasReferral && partner?.inviteCode && !PLACEHOLDER_INVITE_CODE.test(partner.inviteCode)
          ? partner.inviteCode
          : null;
        // The reader-facing code is the registry spelling (CUSTOM_INVITE_CODES); a case-only variant in an older
        // record (Backpack luckybitcoin vs LuckyBitcoin) is displayed as the registry value, never a different code.
        const registryCased = registeredCode && typeof CUSTOM_INVITE_CODES[slug] === "string"
          && CUSTOM_INVITE_CODES[slug].toLowerCase() === registeredCode.toLowerCase() ? CUSTOM_INVITE_CODES[slug] : registeredCode;
        return [slug, registryCased];
      })
  );
`;

const code = buildSync({
  stdin: { contents: source, resolveDir: fileURLToPath(new URL("../", import.meta.url)), loader: "jsx" },
  bundle: true,
  write: false,
  format: "cjs",
  platform: "node",
  external: ["react", "react-dom/server", "react/jsx-runtime"],
  loader: { ".css": "empty" },
}).outputFiles[0].text;

const module = { exports: {} };
vm.runInNewContext(code, {
  module,
  exports: module.exports,
  require,
  console,
  URL,
  URLSearchParams,
  Date,
  Intl,
  setTimeout,
  clearTimeout,
  globalThis,
});

const { renderMatrix, registryCodes } = module.exports;

for (const width of [344, 768, 884, 1440]) {
  test(`exchange matrix row invite codes stay bound to registry slugs at ${width}px markup`, () => {
    const doc = new JSDOM(renderMatrix(width)).window.document;

    for (const [slug, expectedCode] of Object.entries(registryCodes)) {
      const row = doc.querySelector(`tr[data-slug="${slug}"]`);
      assert.ok(row, `missing row for ${slug}`);

      const codeCell = row.querySelector(".mx-td--code");
      const codeButton = codeCell?.querySelector(".mx-code");
      assert.ok(codeCell, `missing code cell for ${slug}`);
      assert.equal(codeCell.getAttribute("data-row-slug"), slug);
      assert.equal(codeCell.getAttribute("data-row-invite-code"), expectedCode || "");
      if (!expectedCode) {
        assert.equal(codeButton, null, `${slug} must not render an unregistered invite code`);
        continue;
      }
      assert.ok(codeButton, `missing code button for ${slug}`);
      assert.equal(codeButton.getAttribute("data-code-for"), slug);
      assert.equal(codeButton.getAttribute("data-invite-code"), expectedCode);
      assert.equal(codeButton.querySelector("strong")?.textContent, expectedCode);
    }
  });
}
