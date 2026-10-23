import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default || traverseModule;
export const LOCALE_COPY_RUNTIME = "virtual:nexualpha-locale-copy";
const RUNTIME_ID = `\0${LOCALE_COPY_RUNTIME}`;
const PACK_PREFIX = "\0virtual:nexualpha-locale-copy/";
export const LOCALE_COPY_PREPARE_GLOBAL = "__NEXUALPHA_PREPARE_LOCALE_COPY__";
export const COPY_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"]);
const localeSet = new Set(COPY_LOCALES);
const editionNames = Object.freeze({ en: "en", zhHans: "zh-Hans", zhHant: "zh-Hant", es: "es", ptBR: "pt-BR", fr: "fr", de: "de", ja: "ja", ko: "ko", ar: "ar", tr: "tr", ru: "ru", id: "id", vi: "vi", it: "it", ur: "ur", uk: "uk" });

// Explicitly bounded to public copy on the measured routes. Source modules and SSR stay untouched.
export const LOCALE_COPY_MODULES = Object.freeze([
  "content/v3-interface-copy.js", "data/market-data-pages.js", "data/v3-product.js",
  "data/partner-venue-faq.js", "data/priority-venue-answers.js", "data/venue-decision-content.js",
  "data/answer-first.js", "data/reviewed-fee-copy.js", "data/telegram-config.js",
  "data/official-campaign-localizations.js",
  "data/compare-generated.js", "data/compare-direct-answers.js", "data/compare-direct-answer-drafts.js",
  "components/v3/activity/campaign-copy.js", "components/v3/venue-detail-shared.jsx",
  "components/v3/news/news-detail-copy-l10n.js",
  "components/v3/RegistrationCard.jsx", "components/v3/VenueDetailPage.jsx", "components/v3/VenueFaqSection.jsx",
  "data/venue-keyword-sections.js", "data/tokenized-stocks-teaser.js", "data/exchange-key-facts-copy.js",
  "components/v6/inner-r9-copy.js", "data/telegram-decision-return.js",
  "data/regional-shortlist.js", "data/exchange-quick-answers.js", "data/venue-faq-fallback.js",
  "components/v3/VenueReadinessChecklist.jsx", "components/v3/TelegramReturnBanner.jsx",
  "components/v3/exchange-matrix-copy.js", "components/v3/LeanHeroCopyVerify.js", "components/v3/LeanHeroCopyLab.js",
  "data/trading-bleed-feedback.js", "components/v3/venue-page-slimming.js", "components/v3/ExchangeFactsV5.jsx",
  "data/fiat-labels.js", "data/license-region-names.js", "data/licenses-editorial.js", "data/venue-fee-summary.js",
  "data/plural-copy.js", "components/v3/inner9-copy.js", "components/licenses/license-profile-copy.js",
  "components/shared/HubNewsLinks.jsx",
]);

const propertyKey = (node) => node?.type === "Identifier" ? node.name : node?.type === "StringLiteral" ? node.value : null;
const inside = (node, container) => node.start >= container.start && node.end <= container.end;

function capturesFor(valuePath, source) {
  const captures = new Set();
  const edits = new Map();
  let unsafe = false;
  const inspect = (identifier) => {
    if (!identifier.isReferencedIdentifier()) return;
    const name = identifier.node.name;
    const binding = identifier.scope.getBinding(name);
    if (binding && !inside(binding.identifier, valuePath.node)) {
      captures.add(name);
      const shorthand = identifier.parentPath.isObjectProperty() && identifier.parent.shorthand;
      edits.set(identifier.node.start, { start: identifier.node.start, end: identifier.node.end, text: shorthand ? `${name}:${name}()` : `${name}()` });
    }
    // A generated arrow factory must not change the lexical owner of arguments.
    if (!binding && name === "arguments") unsafe = true;
  };
  if (valuePath.isIdentifier()) inspect(valuePath);
  valuePath.traverse({
    ReferencedIdentifier: inspect,
    ThisExpression() { unsafe = true; },
    Super() { unsafe = true; },
    MetaProperty() { unsafe = true; },
    AwaitExpression() { unsafe = true; },
    YieldExpression() { unsafe = true; },
    JSXElement() { unsafe = true; },
    JSXFragment() { unsafe = true; },
    AssignmentExpression(assignment) {
      const left = assignment.get("left");
      if (left.isIdentifier() && !inside(left.scope.getBinding(left.node.name)?.identifier || left.node, valuePath.node)) unsafe = true;
    },
    UpdateExpression(update) {
      const argument = update.get("argument");
      if (argument.isIdentifier() && !inside(argument.scope.getBinding(argument.node.name)?.identifier || argument.node, valuePath.node)) unsafe = true;
    },
  });
  if (unsafe) return null;
  let expression = source?.slice(valuePath.node.start, valuePath.node.end);
  if (source) for (const edit of [...edits.values()].sort((a, b) => b.start - a.start)) {
    const start = edit.start - valuePath.node.start, end = edit.end - valuePath.node.start;
    expression = expression.slice(0, start) + edit.text + expression.slice(end);
  }
  return { captures: [...captures].sort(), expression };
}

function flattenedEdition(valuePath, source, seen = new Set()) {
  if (seen.has(valuePath.node)) return null;
  seen.add(valuePath.node);
  const fields = new Map();
  for (const property of valuePath.get("properties")) {
    if (property.isSpreadElement()) {
      const argument = property.get("argument");
      const binding = argument.isIdentifier() && argument.scope.getBinding(argument.node.name);
      const init = binding?.path.isVariableDeclarator() && binding.path.get("init");
      if (!init?.isObjectExpression() || !editionNames[argument.node.name]) return null;
      const inherited = flattenedEdition(init, source, new Set(seen));
      if (!inherited) return null;
      for (const [key, field] of inherited.fields) fields.set(key, field);
    } else {
      if (!property.isObjectProperty() || property.node.computed) return null;
      const key = propertyKey(property.node.key);
      if (key == null) return null;
      const value = property.get("value");
      const captured = capturesFor(value, source);
      if (!captured) return null;
      fields.set(key, { key, value: source.slice(value.node.start, value.node.end), ...captured });
    }
  }
  return { fields,
    expression: `{${[...fields.values()].map((field) => `${JSON.stringify(field.key)}:${field.expression}`).join(",\n")}}`,
    originalExpression: `{${[...fields.values()].map((field) => `${JSON.stringify(field.key)}:${field.value}`).join(",\n")}}`,
    captures: [...new Set([...fields.values()].flatMap((field) => field.captures))].sort(),
  };
}

function enumeratesValues(objectPath) {
  // These two modules eagerly visit every edition, including editions not needed by this browser.
  // Keeping their tables intact preserves that contract (keys alone are insufficient).
  const parent = objectPath.parentPath;
  const declaration = parent?.isVariableDeclarator() ? parent : parent?.isCallExpression() && parent.parentPath?.isVariableDeclarator() ? parent.parentPath : null;
  if (!declaration?.get("id").isIdentifier()) return false;
  const binding = declaration.scope.getBinding(declaration.node.id.name);
  return binding?.referencePaths.some((reference) => {
    const call = reference.parentPath;
    if (!call?.isCallExpression() || call.node.arguments[0] !== reference.node) return false;
    const callee = call.node.callee;
    return callee.type === "MemberExpression" && callee.object.type === "Identifier" && callee.object.name === "Object"
      && ["entries", "values"].includes(propertyKey(callee.property));
  }) || false;
}

function mutatesLocaleValues(objectPath) {
  const declaration = objectPath.parentPath;
  if (!declaration.isVariableDeclarator() || !declaration.get("id").isIdentifier()) return false;
  const binding = declaration.scope.getBinding(declaration.node.id.name);
  return binding?.referencePaths.some((reference) => {
    const member = reference.parentPath;
    const call = member?.parentPath;
    if (!member?.isMemberExpression() || member.node.object !== reference.node || !call?.isCallExpression() || call.node.arguments[0] !== member.node) return false;
    const callee = call.node.callee;
    return callee.type === "MemberExpression" && callee.object.type === "Identifier" && callee.object.name === "Object"
      && propertyKey(callee.property) === "assign";
  }) || false;
}

/** Pure extraction helper; values remain expressions so functions and captured helpers retain their behavior. */
export function extractLocaleCopy(source, filename, { minimumBytes = 250 } = {}) {
  const ast = parse(source, { sourceType: "module", plugins: ["jsx", "typescript"] });
  const entries = [];
  const skipped = [];
  const edits = [];
  let tableIndex = 0;
  let readerName = "__nxReadLocaleCopy";
  while (source.includes(readerName)) readerName += "_";

  function extract(valuePath, tableId, locale, flattened, { edit = true } = {}) {
    const captured = flattened || capturesFor(valuePath, source);
    if (!captured) return false;
    const { captures } = captured;
    const expression = flattened?.originalExpression || source.slice(valuePath.node.start, valuePath.node.end);
    entries.push({ tableId, locale, captures, expression, factory: `(${captures.join(",")}) => (${captured.expression})` });
    if (edit) edits.push({ start: valuePath.node.start, end: valuePath.node.end,
      text: `${readerName}(${JSON.stringify(tableId)},${JSON.stringify(locale)}${captures.length ? `,${captures.map((name) => `()=>${name}`).join(",")}` : ""})` });
    return captured;
  }

  traverse(ast, {
    CallExpression(call) {
      // Registration copy incrementally augments initialized locale objects. Keep those targets intact;
      // an unloaded override is an undefined Object.assign source, which the language explicitly ignores.
      const callee = call.node.callee;
      if (filename !== "components/v3/RegistrationCard.jsx" || callee.type !== "MemberExpression"
        || callee.object.type !== "Identifier" || callee.object.name !== "Object" || propertyKey(callee.property) !== "assign"
        || call.node.arguments.length !== 2) return;
      const [target, value] = call.get("arguments");
      if (!target.isMemberExpression() || !value.isObjectExpression()) return;
      const locale = propertyKey(target.node.property);
      if (!localeSet.has(locale) || value.node.end - value.node.start < minimumBytes) return;
      if (extract(value, `${filename}:override-${tableIndex++}`, locale)) call.skip();
    },
    VariableDeclarator(declaration) {
      if (filename !== "data/v3-product.js" || !declaration.parentPath.parentPath.isProgram()) return;
      const locale = editionNames[declaration.node.id?.name];
      const value = declaration.get("init");
      if (!locale || !value.isObjectExpression() || value.node.end - value.node.start < minimumBytes) return;
      const flattened = flattenedEdition(value, source);
      if (flattened && extract(value, `${filename}:editions`, locale, flattened)) declaration.skip();
    },
    ObjectExpression(object) {
      const properties = object.get("properties");
      if (properties.length < 2 || properties.some((property) => !property.isObjectProperty() || property.node.computed || !localeSet.has(propertyKey(property.node.key)))) return;
      const size = properties.reduce((sum, property) => sum + property.node.value.end - property.node.value.start, 0);
      if (size < minimumBytes) return;
      const tableId = `${filename}:${tableIndex++}`;
      if (object.parentPath.isCallExpression()) {
        const callee = object.parentPath.node.callee;
        const safe = callee.type === "MemberExpression" && callee.object.type === "Identifier" && callee.object.name === "Object"
          && ["freeze", "assign"].includes(propertyKey(callee.property));
        if (!safe) {
          skipped.push({ tableId, reason: "opaque locale-table constructor" });
          object.skip();
          return;
        }
      }
      if (enumeratesValues(object)) {
        skipped.push({ tableId, reason: "enumerates locale values" });
        object.skip();
        return;
      }
      if (mutatesLocaleValues(object)) {
        skipped.push({ tableId, reason: "mutates locale values" });
        object.skip();
        return;
      }
      // Extract an entire table or none: partial edits can leave dependencies on another edition in the source.
      if (properties.some((property) => !capturesFor(property.get("value")))) {
        skipped.push({ tableId, reason: "context-sensitive expression" });
        object.skip();
        return;
      }
      const keys = [];
      const capturesByLocale = [];
      for (const property of properties) {
        const locale = propertyKey(property.node.key);
        const { captures } = extract(property.get("value"), tableId, locale, undefined, { edit: false });
        keys.push(locale);
        if (captures.length) capturesByLocale.push(`${JSON.stringify(locale)}:[${captures.map((name) => `()=>${name}`).join(",")}]`);
      }
      // One call per table avoids making the small remaining source larger than the copy removed from it.
      edits.push({ start: object.node.start, end: object.node.end,
        text: `${readerName}(${JSON.stringify(tableId)},${JSON.stringify(keys)}${capturesByLocale.length ? `,{${capturesByLocale.join(",")}}` : ""})` });
      object.skip();
    },
  });
  let code = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) code = code.slice(0, edit.start) + edit.text + code.slice(edit.end);
  if (edits.length) code = `import { readLocaleCopy as ${readerName} } from ${JSON.stringify(LOCALE_COPY_RUNTIME)};\n${code}`;
  return { code, entries, skipped };
}

export function localeCopyPackSource(entries) {
  return `export default {${entries.map((entry) => `${JSON.stringify(entry.tableId)}:${entry.factory}`).join(",\n")}};\n`;
}

export function localeCopyRuntimeSource(locales = COPY_LOCALES) {
  const loaders = locales.map((locale) => `${JSON.stringify(locale)}:()=>import(${JSON.stringify(`${PACK_PREFIX}${locale}`)})`).join(",\n");
  return `import { parsePublicRoute } from "/src/data/locale-routing.js";
const loaders={${loaders}};
const packs=new Map(),pending=new Map();
export function normalizeCopyLocale(locale){
 const raw=String(locale||"en").trim().toLowerCase();
 if(["zh-hant","zh-tw","zh-hk"].includes(raw))return "zh-Hant";
 if(raw.startsWith("zh"))return "zh-Hans";
 if(raw==="pt"||raw==="pt-br")return "pt-BR";
 const key=raw.split("-")[0];return Object.hasOwn(loaders,key)?key:"en";
}
export async function loadLocaleCopy(locale){
 const key=normalizeCopyLocale(locale);if(packs.has(key))return;
 if(!pending.has(key))pending.set(key,loaders[key]().then(mod=>{packs.set(key,mod.default);}).catch(error=>{pending.delete(key);throw error;}));
 await pending.get(key);
}
export function readLocaleCopy(tableId,locale,...captures){
 if(Array.isArray(locale)){const bindings=captures[0]||{};return Object.fromEntries(locale.map(key=>[key,readLocaleCopy(tableId,key,...(bindings[key]||[]))]));}
 const pack=packs.get(locale);return pack?.[tableId]?.(...captures);
}
export async function ensureLocaleCopiesForUrl(input,state){
 const locales=new Set(["en"]);
 if(state?.locale)locales.add(normalizeCopyLocale(state.locale));
 if(input){const url=new URL(input,"https://nexualpha.com");
 const params=new URLSearchParams(url.searchParams);if(params.has("locale"))params.set("locale",normalizeCopyLocale(params.get("locale")));
 const route=parsePublicRoute(url.pathname,params);
 locales.add(normalizeCopyLocale(route.locale));
 if(route.localeSource!=="path"){
 const match=url.hash.match(/(?:^#|[?&])locale=([^&]*)/);if(match){try{locales.add(normalizeCopyLocale(decodeURIComponent(match[1])));}catch{}}
 }
 }
 await Promise.all([...locales].map(loadLocaleCopy));
}
`;
}

export function localeCopyMainBootstrap() {
  return `globalThis.${LOCALE_COPY_PREPARE_GLOBAL}=async()=>{
 const runtime=await import(${JSON.stringify(LOCALE_COPY_RUNTIME)});
 let state=null;
 if(typeof document!=="undefined"){const text=document.getElementById("nexualpha-prerender-state")?.textContent;if(text){try{state=JSON.parse(text);}catch{}}}
 await runtime.ensureLocaleCopiesForUrl(typeof location!=="undefined"?location.href:null,state);
};\n`;
}

export default function localeCopyPlugin() {
  let srcRoot;
  let enabled = true;
  const transformed = new Map();
  const packs = new Map(COPY_LOCALES.map((locale) => [locale, []]));
  return {
    name: "nexualpha-locale-copy",
    apply: "build",
    enforce: "pre",
    configResolved(config) { srcRoot = path.resolve(config.root, "src"); enabled = !config.build.ssr; },
    async buildStart() {
      if (!enabled) return;
      transformed.clear();
      for (const entries of packs.values()) entries.length = 0;
      const pairsRoot = path.join(srcRoot, "data/compare-pairs");
      const pairFiles = (await fs.readdir(pairsRoot)).filter((file) => file.endsWith(".js")).map((file) => `data/compare-pairs/${file}`);
      for (const relative of [...LOCALE_COPY_MODULES, ...pairFiles].sort()) {
        const absolute = path.join(srcRoot, relative);
        this.addWatchFile(absolute);
        const source = await fs.readFile(absolute, "utf8");
        const result = extractLocaleCopy(source, relative);
        transformed.set(absolute, result);
        for (const entry of result.entries) packs.get(entry.locale).push(entry);
      }
    },
    resolveId(id) { if (enabled && (id === LOCALE_COPY_RUNTIME || id.startsWith(PACK_PREFIX))) return id === LOCALE_COPY_RUNTIME ? RUNTIME_ID : id; },
    load(id) {
      if (!enabled) return null;
      if (id === RUNTIME_ID) return localeCopyRuntimeSource();
      if (id.startsWith(PACK_PREFIX)) {
        const locale = id.slice(PACK_PREFIX.length);
        if (!packs.has(locale)) throw new Error(`Unknown locale copy pack: ${locale}`);
        return localeCopyPackSource(packs.get(locale));
      }
      return null;
    },
    transform(source, id, options) {
      if (!enabled || options?.ssr) return null;
      const filename = id.split("?")[0];
      if (filename === path.join(srcRoot, "main.jsx")) return { code: localeCopyMainBootstrap() + source, map: null };
      const result = transformed.get(filename);
      return result?.entries.length ? { code: result.code, map: null } : null;
    },
    renderChunk(code, chunk, _options, meta) {
      if (!enabled || !chunk.dynamicImports.length || !meta?.chunks) return null;
      const chunkModules = (candidate) => Object.keys(candidate.modules);
      const isRuntimeOrPack = (candidate) => chunkModules(candidate).some((id) => id === RUNTIME_ID || id.startsWith(PACK_PREFIX));
      // Runtime preparation imports the runtime and its packs itself. Wrapping those imports recurses.
      if (isRuntimeOrPack(chunk)) return null;
      const chunks = new Map(Object.values(meta.chunks).map((candidate) => [candidate.fileName, candidate]));
      const resolveChunk = (owner, specifier) => chunks.has(specifier) ? specifier
        : specifier.startsWith(".") ? path.posix.normalize(path.posix.join(path.posix.dirname(owner), specifier)) : specifier;
      const reachesRuntime = new Map();
      const needsPreparation = (filename) => {
        if (reachesRuntime.has(filename)) return reachesRuntime.get(filename);
        const target = chunks.get(filename);
        if (!target || isRuntimeOrPack(target)) return false;
        const visited = new Set();
        const pending = [filename];
        let found = false;
        while (pending.length) {
          const current = pending.pop();
          if (visited.has(current)) continue;
          visited.add(current);
          const candidate = chunks.get(current);
          if (!candidate) continue;
          if (chunkModules(candidate).includes(RUNTIME_ID)) { found = true; break; }
          for (const imported of candidate.imports) pending.push(resolveChunk(current, imported));
        }
        reachesRuntime.set(filename, found);
        return found;
      };
      const edits = [];
      const ast = parse(code, { sourceType: "module", createImportExpressions: true });
      traverse(ast, { enter(importPath) {
        const node = importPath.node;
        const argument = node.type === "ImportExpression" ? node.source
          : node.type === "CallExpression" && node.callee.type === "Import" ? node.arguments[0] : null;
        if (argument?.type !== "StringLiteral") return;
        const target = resolveChunk(chunk.fileName, argument.value);
        if (!needsPreparation(target)) return;
        edits.push({ start: node.start, end: node.end,
          text: `globalThis.${LOCALE_COPY_PREPARE_GLOBAL}().then(()=>${code.slice(node.start, node.end)})` });
      } });
      if (!edits.length) return null;
      let rendered = code;
      for (const edit of edits.sort((a, b) => b.start - a.start)) rendered = rendered.slice(0, edit.start) + edit.text + rendered.slice(edit.end);
      // Render-phase edits participate in Rollup's final hashes; never mutate generated chunk code afterward.
      return { code: rendered, map: null };
    },
    generateBundle(_options, bundle) {
      if (!enabled) return;
      const manifest = { runtime: null, locales: {} };
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;
        for (const id of Object.keys(chunk.modules)) {
          if (id === RUNTIME_ID) manifest.runtime = chunk.fileName;
          if (id.startsWith(PACK_PREFIX)) manifest.locales[id.slice(PACK_PREFIX.length)] = chunk.fileName;
        }
      }
      this.emitFile({ type: "asset", fileName: "locale-copy-manifest.json", source: JSON.stringify(manifest, null, 2) });
    },
  };
}
