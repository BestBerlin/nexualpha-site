// Evaluate the actual browser chunks in an isolated DOM, without a server or
// network. Separate processes keep module-level locale state independent.
import { JSDOM } from "jsdom";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const [source, locale, pathname, exportName] = process.argv.slice(2);
const dom = new JSDOM(`<!doctype html><html><head></head><body><script id="nexualpha-prerender-state" type="application/json">${JSON.stringify({ locale, pathname })}</script></body></html>`, {
  url: `https://nexualpha.com${pathname}`, pretendToBeVisual: true,
});
const { window } = dom;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const observer = class { observe() {} disconnect() {} unobserve() {} };
window.IntersectionObserver = observer;
window.ResizeObserver = observer;
for (const key of ["window", "document", "navigator", "location", "history", "localStorage", "HTMLElement", "Element", "Node", "CustomEvent", "MutationObserver", "matchMedia", "IntersectionObserver", "ResizeObserver"]) {
  Object.defineProperty(globalThis, key, { value: key === "window" ? window : window[key], configurable: true, writable: true });
}
globalThis.fetch = async () => { throw new Error("Built route evaluation must not use the network"); };
// Vite's CSS preload promises can settle without downloading styles: this test
// checks JavaScript initialization. CSS content/cascade is checked separately.
const append = window.document.head.appendChild.bind(window.document.head);
window.document.head.appendChild = (node) => {
  const result = append(node);
  if (node.tagName === "LINK") queueMicrotask(() => node.dispatchEvent(new window.Event("load")));
  return result;
};
try {
  const copyManifest = JSON.parse(await readFile("dist/client/locale-copy-manifest.json", "utf8"));
  const manifest = JSON.parse(await readFile("dist/client/.vite/manifest.json", "utf8"));
  const entryFile = path.resolve("dist/client", manifest["index.html"].file);
  const entry = await readFile(entryFile, "utf8");
  let loader, bootstrap;
  (traverseModule.default || traverseModule)(parse(entry, { sourceType: "module" }), {
    ObjectProperty(node) {
      if (node.node.key.value === source) loader = entry.slice(node.node.value.start, node.node.value.end);
    },
    AssignmentExpression(node) {
      if (node.node.left.object?.name === "globalThis" && node.node.left.property?.name === "__NEXUALPHA_PREPARE_LOCALE_COPY__") bootstrap = entry.slice(node.node.start, node.node.end);
    },
  });
  assert.ok(loader && bootstrap, `${source}: actual entry loader and bootstrap exist`);
  const preload = loader.match(/^\(\)=>\s*(\w+)\(/)?.[1];
  assert.ok(preload, "Vite preload helper is present");
  const absoluteImports = (code) => code.replace(/import\("(\.\/[^"\n]+)"\)/g, (_match, relative) => `import(${JSON.stringify(pathToFileURL(path.resolve(path.dirname(entryFile), relative)).href)})`);
  // Execute the actual emitted bootstrap and glob loader. Only stylesheet
  // preloading is stubbed. Do not prepare copy manually: that masks missing
  // wrappers when Rollup merges a source module into another route's chunk.
  const load = new Function(preload, "__vite__mapDeps", `${absoluteImports(bootstrap)};return (${absoluteImports(loader)});`)((callback) => callback(), () => []);
  let prepared = 0;
  const prepare = globalThis.__NEXUALPHA_PREPARE_LOCALE_COPY__;
  globalThis.__NEXUALPHA_PREPARE_LOCALE_COPY__ = async () => { prepared++; await prepare(); };
  const module = await load();
  assert.ok(prepared > 0, `${source}: locale preparation runs before the first import`);
  const runtime = await import(pathToFileURL(path.resolve("dist/client", copyManifest.runtime)).href);
  assert.ok(runtime.readLocaleCopy("data/v3-product.js:editions", locale), `${locale}: edition initialized`);
  if (typeof module[exportName] !== "function") throw new Error(`Missing ${exportName} in ${source}`);
  process.stdout.write(`${locale} ${pathname}: initialized\n`);
} finally {
  window.close();
}
