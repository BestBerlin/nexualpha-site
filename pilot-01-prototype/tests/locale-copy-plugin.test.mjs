import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import { build } from "esbuild";
import localeCopyPlugin, { COPY_LOCALES, LOCALE_COPY_MODULES, LOCALE_COPY_RUNTIME, LOCALE_COPY_PREPARE_GLOBAL, extractLocaleCopy, localeCopyPackSource, localeCopyRuntimeSource } from "../scripts/locale-copy-plugin.mjs";

const traverse = traverseModule.default || traverseModule;
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(new URL("../package.json", import.meta.url));
const stripRuntimeImport = (code) => code.replace(/^import \{ readLocaleCopy as (\w+) \} from [^;]+;/, "const $1 = globalThis.read;");
const compileFactory = (entry) => new Function(`return (${entry.factory});`)();
function readerFor(entries, locales) {
  const read = (tableId, locale, ...captures) => {
    if (Array.isArray(locale)) return Object.fromEntries(locale.map((key) => [key, read(tableId, key, ...(captures[0]?.[key] || []))]));
    const entry = entries.find((entry) => entry.tableId === tableId && entry.locale === locale);
    return locales.includes(locale) && entry ? compileFactory(entry)(...captures) : undefined;
  };
  return read;
}

test("extracts locale values, preserves keys and fallback, and leaves source copy intact", () => {
  const source = 'const table={en:{title:"English"},fr:{title:"Français"}}; globalThis.result={keys:Object.keys(table),value:table.ja||table.en,missing:table.fr};';
  const result = extractLocaleCopy(source, "fixture.js", { minimumBytes: 1 });
  const context = { read: readerFor(result.entries, ["en"]) };
  vm.runInNewContext(stripRuntimeImport(result.code), context);
  assert.equal(result.entries.length, 2);
  assert.equal(JSON.stringify(context.result.keys), '["en","fr"]');
  assert.equal(context.result.value.title, "English");
  assert.equal(context.result.missing, undefined);
  assert.ok(!result.code.includes("Français"));
  assert.ok(source.includes("Français"));
  assert.equal(result.code.match(/__nxReadLocaleCopy\(/g)?.length, 1, "the entire locale table uses one reader call");
});

test("capture thunks preserve closures, mutable bindings, shorthand fields and delayed TDZ reads", () => {
  const source = `let value="first"; const table={en:{value,run:()=>later+value},fr:{value,run:()=>later+value}}; const later="ready:"; value="second"; globalThis.result=[table.en.value,table.en.run()];`;
  const result = extractLocaleCopy(source, "fixture.js", { minimumBytes: 1 });
  const context = { read: readerFor(result.entries, ["en"]) };
  vm.runInNewContext(stripRuntimeImport(result.code), context);
  assert.equal(JSON.stringify(context.result), '["first","ready:second"]');
  assert.ok(result.entries.every((entry) => entry.captures.join(",") === "later,value"));
});

test("scope analysis does not capture shadowed function parameters or object keys", () => {
  const source = 'const suffix="!";const table={en:{label:(suffix)=>({suffix}),other:()=>suffix},fr:{label:(suffix)=>({suffix}),other:()=>suffix}};';
  const result = extractLocaleCopy(source, "fixture.js", { minimumBytes: 1 });
  const value = compileFactory(result.entries[0])(() => "outer!");
  assert.equal(JSON.stringify(value.label("inner")), '{"suffix":"inner"}');
  assert.equal(value.other(), "outer!");
  assert.deepEqual(result.entries[0].captures, ["suffix"]);
});

test("capture rewriting preserves computed keys and shorthand properties", () => {
  const source = 'const key="heading",label="Translated";const table={en:{[key]:label,label},fr:{[key]:label,label}};';
  const result = extractLocaleCopy(source, "fixture.js", { minimumBytes: 1 });
  const value = compileFactory(result.entries[0])(() => "heading", () => "Translated");
  assert.deepEqual(value, { heading: "Translated", label: "Translated" });
});

test("literal edition spreads preserve inheritance without loading unrelated editions", () => {
  const source = 'const zhHans={inherited:"中文",title:"中文",count:(n)=>n};const en={...zhHans,title:"English"};const es={...en,title:"Español"};globalThis.result=es;';
  const result = extractLocaleCopy(source, "data/v3-product.js", { minimumBytes: 1 });
  const context = { read: readerFor(result.entries, ["en", "es"]) };
  vm.runInNewContext(stripRuntimeImport(result.code), context);
  assert.equal(context.result.title, "Español");
  assert.equal(context.result.inherited, "中文");
  assert.equal(context.result.count(3), 3);
  assert.ok(result.entries.every((entry) => !entry.captures.includes("zhHans") && !entry.captures.includes("en")));
});

test("skips eagerly enumerated edition values and context-sensitive expressions", () => {
  for (const source of [
    'const table={en:["English"],fr:["Français"]};const values=Object.entries(table).map(([key,value])=>value[0]);',
    'const table={en:{run:()=>this.value},fr:{run:()=>this.value}};',
    'let value=1;const table={en:{run:()=>value++},fr:{run:()=>value++}};',
    'const table=localeText({en:"English",fr:"French"});',
    'const table={en:{title:"English"},fr:{title:"French"}};Object.assign(table.fr,{title:"New French"});',
  ]) {
    const result = extractLocaleCopy(source, "fixture.js", { minimumBytes: 1 });
    assert.equal(result.code, source);
    assert.equal(result.entries.length, 0);
    assert.equal(result.skipped.length, 1);
  }
});

test("registration overrides preserve initialized mutation targets with only the current locale loaded", () => {
  const source = 'const table={en:{title:"English"},fr:{title:"French"}};Object.assign(table.en,{extra:"English details"});Object.assign(table.fr,{extra:"French details"});globalThis.result=table;';
  const result = extractLocaleCopy(source, "components/v3/RegistrationCard.jsx", { minimumBytes: 1 });
  const context = { read: readerFor(result.entries, ["en"]) };
  vm.runInNewContext(stripRuntimeImport(result.code), context);
  assert.equal(context.result.en.extra, "English details");
  assert.equal(context.result.fr.title, "French");
  assert.equal(context.result.fr.extra, undefined);
  assert.ok(!result.code.includes("French details"));
  assert.equal(result.entries.length, 2);
});

test("plugin is build-only, and SSR transformations remain untouched", () => {
  const plugin = localeCopyPlugin();
  assert.equal(plugin.apply, "build");
  plugin.configResolved({ root, build: { ssr: true } });
  assert.equal(plugin.transform('const copy={en:"English",fr:"French"};', path.join(root, "src/data/answer-first.js"), { ssr: true }), null);
  assert.equal(plugin.resolveId(LOCALE_COPY_RUNTIME), undefined);
  assert.equal(plugin.load("\0" + LOCALE_COPY_RUNTIME), null);
  assert.equal(plugin.transform("globalThis.body=true;", path.join(root, "src/main.jsx"), { ssr: true }), null);
});

test("main registers preparation before its body and defers runtime loading until requested", async () => {
  const plugin = localeCopyPlugin();
  plugin.configResolved({ root, build: { ssr: false } });
  const source = `globalThis.bodySawCallback=typeof globalThis.${LOCALE_COPY_PREPARE_GLOBAL}==="function";`;
  const transformed = plugin.transform(source, path.join(root, "src/main.jsx"), {});
  assert.ok(transformed.code.indexOf(`globalThis.${LOCALE_COPY_PREPARE_GLOBAL}=`) < transformed.code.indexOf("globalThis.bodySawCallback"));
  const requests = [];
  const context = {
    document: { getElementById: () => ({ textContent: '{"locale":"fr"}' }) },
    location: { href: "https://nexualpha.com/fr/exchanges/bitget" },
    fetchRuntime: async () => {
      requests.push("runtime");
      return { ensureLocaleCopiesForUrl: async (url, state) => requests.push([url, state.locale]) };
    },
  };
  vm.runInNewContext(transformed.code.replace(`import(${JSON.stringify(LOCALE_COPY_RUNTIME)})`, "fetchRuntime()"), context);
  assert.equal(context.bodySawCallback, true);
  assert.deepEqual(requests, [], "registering preparation must not load a runtime or locale pack on home");
  await context[LOCALE_COPY_PREPARE_GLOBAL]();
  assert.deepEqual(requests, ["runtime", [context.location.href, "fr"]]);
});

test("emitted chunk closures prepare merged routes and exclude runtime, packs and unrelated imports", () => {
  const plugin = localeCopyPlugin();
  const runtime = "\0" + LOCALE_COPY_RUNTIME;
  const pack = runtime + "/fr";
  const emitted = (filename, modules, imports = [], dynamicImports = []) => ({ fileName: `assets/${filename}`, modules: Object.fromEntries(modules.map((id) => [id, {}])), imports: imports.map((file) => `assets/${file}`), dynamicImports: dynamicImports.map((file) => `assets/${file}`) });
  const chunks = Object.fromEntries([
    emitted("main.js", ["main.jsx"], [], ["venue.js", "home.js", "runtime.js", "fr.js"]),
    // The route source itself has no runtime import. Rollup merged it with a chunk whose static imports do.
    emitted("venue.js", ["VenueAlternativesPage.jsx"], ["shared-2.js"]),
    emitted("shared-2.js", ["shared-copy.js"], ["shared-6.js"]),
    emitted("shared-6.js", ["other-copy.js"], ["runtime.js"]),
    emitted("home.js", ["home.jsx"], ["healthy.js"], ["venue.js"]),
    emitted("healthy.js", ["healthy.js"], ["home.js"]),
    emitted("cycle-a.js", ["a.js"], ["cycle-b.js"]),
    emitted("cycle-b.js", ["b.js"], ["cycle-a.js", "runtime.js"]),
    emitted("runtime.js", [runtime], [], ["fr.js", "venue.js"]),
    emitted("fr.js", [pack], [], ["venue.js"]),
  ].map((chunk) => [chunk.fileName, chunk]));
  const hook = (code, origin = "main.js") => plugin.renderChunk(code, chunks[`assets/${origin}`], {}, { chunks });
  const wrapped = (specifier) => `globalThis.${LOCALE_COPY_PREPARE_GLOBAL}().then(()=>import(${JSON.stringify(specifier)}))`;
  assert.equal(hook('const load=()=>import("./venue.js");').code, `const load=()=>${wrapped("./venue.js")};`);
  assert.equal(hook('const load=()=>import("./cycle-a.js");').code, `const load=()=>${wrapped("./cycle-a.js")};`);
  assert.equal(hook('import("./home.js");'), null, "dynamic descendants do not make a static dependency");
  assert.equal(hook('import("./missing.js");'), null);
  assert.equal(hook('import(path);'), null);
  assert.equal(hook('import("external-package");'), null);
  assert.equal(hook('import("./runtime.js");'), null);
  assert.equal(hook('import("./fr.js");'), null);
  assert.equal(hook('import("./venue.js");', "runtime.js"), null);
  assert.equal(hook('import("./venue.js");', "fr.js"), null);
  const many = hook('const a=()=>import("./venue.js");const b=()=>import("./cycle-a.js");const c=()=>import("./home.js");');
  assert.equal(many.code, `const a=()=>${wrapped("./venue.js")};const b=()=>${wrapped("./cycle-a.js")};const c=()=>import("./home.js");`);
  parse(many.code, { sourceType: "module" });
  plugin.configResolved({ root, build: { ssr: true } });
  assert.equal(hook('import("./venue.js");'), null);
  assert.equal(typeof plugin.renderDynamicImport, "undefined", "source module graphs cannot detect merged output closures");
});

test("runtime selects actual public-route locales without top-level loading and retries failed imports", async () => {
  const { parsePublicRoute } = await import("../src/data/locale-routing.js");
  const runtimeSource = localeCopyRuntimeSource().replace(/^import[^\n]+\n/, "").replace(/export /g, "");
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const loadRuntime = async (url, state, failingLocale) => {
    const requested = [];
    let failed = false;
    const code = runtimeSource.replace(/import\("\\u0000virtual:nexualpha-locale-copy\/([^"\\]+)"\)/g, (_match, locale) => `fetchPack(${JSON.stringify(locale)})`);
    const runtime = await new AsyncFunction("parsePublicRoute", "fetchPack", "document", "location", `${code};return {readLocaleCopy,ensureLocaleCopiesForUrl,normalizeCopyLocale,loadLocaleCopy};`)(
      parsePublicRoute,
      async (locale) => { requested.push(locale); if (locale === failingLocale && !failed) { failed = true; throw new Error("pack unavailable"); } return { default: {} }; },
      { getElementById: () => ({ textContent: JSON.stringify(state) }) },
      { href: url },
    );
    assert.deepEqual(requested, [], "the runtime exports helpers without starting pack imports");
    if (!failingLocale) await runtime.ensureLocaleCopiesForUrl(url, state);
    return { runtime, requested };
  };
  for (const [url, expected] of [["https://nexualpha.com/fr/exchanges/bitget?locale=ja", "fr"], ["https://nexualpha.com/br", "pt-BR"], ["https://nexualpha.com/id-id/funding-rates", "id"], ["https://nexualpha.com/uk-ua/news", "uk"], ["https://nexualpha.com/exchanges/bitget?locale=zh-CN", "zh-Hans"]]) {
    const { requested } = await loadRuntime(url, { locale: expected });
    assert.deepEqual(requested, expected === "en" ? ["en"] : ["en", expected]);
  }
  const { runtime } = await loadRuntime("https://nexualpha.com/", null);
  assert.deepEqual((await loadRuntime("https://nexualpha.com/exchanges/bitget#?locale=%", null)).requested, ["en"]);
  assert.equal(runtime.normalizeCopyLocale("zh-TW"), "zh-Hant");
  assert.equal(runtime.normalizeCopyLocale("en-US"), "en");
  assert.equal(runtime.readLocaleCopy("missing", "fr"), undefined);
  const retry = await loadRuntime("https://nexualpha.com/fr/news", null, "fr");
  await assert.rejects(retry.runtime.ensureLocaleCopiesForUrl("https://nexualpha.com/fr/news", null), /pack unavailable/);
  await retry.runtime.ensureLocaleCopiesForUrl("https://nexualpha.com/fr/news", null);
  assert.deepEqual(retry.requested, ["en", "fr", "fr"], "failed promises are evicted so a later preparation can retry");
  const ast = parse(localeCopyRuntimeSource(), { sourceType: "module" });
  traverse(ast, { AwaitExpression(awaitPath) { assert.ok(awaitPath.getFunctionParent(), "no top-level await is needed"); } });
});

function comparable(value, depth = 0) {
  if (depth > 12) return "[depth]";
  if (typeof value === "function") return [[], [2], ["Example", 3], ["Platform A", "CEX"]].map((args) => {
    try { return comparable(value(...args), depth + 1); } catch (error) { return { error: error.name }; }
  });
  if (Array.isArray(value)) return value.map((entry) => comparable(entry, depth + 1));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, comparable(entry, depth + 1)]));
  return value;
}

test("actual extracted factories match every original locale expression using source dependencies", async () => {
  const files = [...LOCALE_COPY_MODULES, ...(await fs.readdir(path.join(root, "src/data/compare-pairs"))).filter((file) => file.endsWith(".js")).map((file) => `data/compare-pairs/${file}`)];
  let checked = 0;
  const checkedLocales = new Set();
  for (const file of files) {
    const filename = path.join(root, "src", file);
    const source = await fs.readFile(filename, "utf8");
    const result = extractLocaleCopy(source, file);
    if (!result.entries.length) continue;
    const ast = parse(source, { sourceType: "module", plugins: ["jsx", "typescript"] });
    let bindings;
    traverse(ast, { Program(program) { bindings = program.scope.bindings; program.stop(); } });
    const captures = [...new Set(result.entries.flatMap((entry) => entry.captures))].filter((name) => bindings[name]);
    const bundled = await build({ stdin: { contents: `${source}\nexport const __nxCopyFixtures={${captures.join(",")}};`, resolveDir: path.dirname(filename), sourcefile: filename, loader: file.endsWith(".jsx") ? "jsx" : "js" }, absWorkingDir: root, bundle: true, write: false, platform: "node", format: "cjs", packages: "external", loader: { ".css": "empty" }, logLevel: "silent" });
    const context = { module: { exports: {} }, exports: {}, require, console, process, URL, URLSearchParams, TextEncoder, TextDecoder, setTimeout, clearTimeout };
    context.exports = context.module.exports;
    vm.runInNewContext(bundled.outputFiles[0].text, context, { filename });
    const fixtures = { nameA: "Platform A", nameB: "Platform B", name: "Example Venue", locName: "Localized Venue", ...context.module.exports.__nxCopyFixtures };
    for (const entry of result.entries) {
      assert.ok(entry.captures.every((name) => Object.hasOwn(fixtures, name)), `${entry.tableId}: unresolved fixture`);
      const values = entry.captures.map((name) => fixtures[name]);
      const original = new Function(...entry.captures, `return (${entry.expression});`)(...values);
      const extracted = compileFactory(entry)(...values.map((value) => () => value));
      assert.deepEqual(comparable(extracted), comparable(original), `${entry.tableId} (${entry.locale})`);
      checked++;
      checkedLocales.add(entry.locale);
    }
    // Evaluate the transformed module with only English and one selected pack available. This catches eager
    // table walks, inheritance assumptions and lexical initialization errors that isolated factories cannot.
    const compiled = await build({ stdin: { contents: result.code, resolveDir: path.dirname(filename), sourcefile: filename, loader: file.endsWith(".jsx") ? "jsx" : "js" }, absWorkingDir: root, bundle: true, write: false, platform: "node", format: "cjs", packages: "external", loader: { ".css": "empty" }, logLevel: "silent", plugins: [{ name: "test-copy-reader", setup(builder) {
      builder.onResolve({ filter: /^virtual:nexualpha-locale-copy$/ }, () => ({ path: "reader", namespace: "copy-test" }));
      builder.onLoad({ filter: /.*/, namespace: "copy-test" }, () => ({ contents: "export const readLocaleCopy=(...args)=>globalThis.__read(...args);" }));
    } }] });
    for (const locale of COPY_LOCALES) vm.runInNewContext(compiled.outputFiles[0].text, { ...context, module: { exports: {} }, __read: readerFor(result.entries, ["en", locale]) }, { filename: `${filename}:${locale}` });
    // Packs are import-free factories and parse as ordinary JS, including the JSX-host module's extracted text.
    for (const locale of COPY_LOCALES) parse(localeCopyPackSource(result.entries.filter((entry) => entry.locale === locale)), { sourceType: "module" });
  }
  assert.ok(checked > 1000, `expected substantial real source coverage, got ${checked}`);
  assert.deepEqual([...checkedLocales].sort(), [...COPY_LOCALES].sort());
});
