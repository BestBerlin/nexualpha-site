#!/usr/bin/env node
// Critical CSS for the home route (mobile-perf lane 2026-10-11, scorecard T4).
//
// The home page links ~26 stylesheets (~200 KB gzip, 1.2 MB raw) and all of them blocked the first paint; a coverage
// run showed that only ~90 KB of those rules match any element of the home page. This build step keeps, from the exact
// stylesheets the Worker links on the home route and in their cascade order, every rule whose selector can match an
// element of a prerendered home page (all 17 UI locales), and writes them to dist/client/critical-css.json. The Worker
// inlines that CSS and turns the stylesheet links into non-blocking loads (same order, so the final cascade is the one
// the page had before). A rule is dropped only when it provably matches nothing in the SSR markup:
//   - dynamic pseudo-classes (:hover, :focus-visible, :checked...), pseudo-elements and [open] (native <details>
//     toggling) are ignored for matching, so their rules are kept whenever the element exists; a :not(...) that
//     contained one is ignored as a whole;
//   - a selector the DOM engine cannot evaluate keeps its rule;
//   - @font-face, @property and every @keyframes referenced by a kept rule are kept.
// When the stylesheet set the Worker links no longer equals the set recorded here, the Worker serves the old blocking
// links (fail safe).
//
//   node scripts/build-critical-css.mjs [--dist dist]
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
// postcss ships with Vite (a direct dependency); resolve it through Vite so the build needs no extra package.
function loadPostcss() {
  try {
    return createRequire(require.resolve("vite"))("postcss");
  } catch {
    return require("postcss");
  }
}

export const CRITICAL_CSS_FILE = "critical-css.json";
export const CRITICAL_CSS_VERSION = 1;

// Pseudo-classes that describe document structure: kept for matching. Everything else (user-action, form-state,
// element-state pseudo-classes and all pseudo-elements) is removed before matching.
const STRUCTURAL = new Set([
  "root", "scope", "empty", "first-child", "last-child", "only-child", "first-of-type", "last-of-type", "only-of-type",
]);
const STRUCTURAL_FUNCTIONAL = new Set(["nth-child", "nth-last-child", "nth-of-type", "nth-last-of-type"]);
const LOGICAL = new Set(["not", "is", "where", "has", "matches", "-webkit-any"]);

function readBalanced(source, start) {
  // source[start] === "(" ; returns index after the matching ")"
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "\\") { i += 1; continue; }
    if (ch === "\"" || ch === "'") {
      const end = source.indexOf(ch, i + 1);
      i = end === -1 ? source.length : end;
      continue;
    }
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return source.length;
}

// Returns { selector, changed } where selector is a superset selector (matches at least every element the original
// matches in any interaction state), or null when nothing usable remains.
export function matchableSelector(selector, { relative = false } = {}) {
  // :has() takes relative selectors (">.a .b", "+ .c"): keep the leading combinator as it is.
  if (relative) {
    const lead = /^\s*([>+~])\s*/.exec(selector);
    if (lead) {
      const rest = matchableSelector(selector.slice(lead[0].length));
      return rest.selector === null ? rest : { selector: `${lead[1]}${rest.selector}`, changed: rest.changed };
    }
  }
  let out = "";
  let changed = false;
  for (let i = 0; i < selector.length; i += 1) {
    const ch = selector[i];
    if (ch === "\\") { out += ch + (selector[i + 1] ?? ""); i += 1; continue; }
    if (ch === "[") {
      let j = i + 1;
      while (j < selector.length && selector[j] !== "]") {
        if (selector[j] === "\\") j += 1;
        else if (selector[j] === "\"" || selector[j] === "'") { const end = selector.indexOf(selector[j], j + 1); j = end === -1 ? selector.length : end; }
        j += 1;
      }
      const attribute = selector.slice(i, j + 1);
      i = j;
      // <details open> is toggled natively, before any script runs: treat [open] like a state pseudo-class.
      if (/^\[\s*open\s*\]$/i.test(attribute)) { changed = true; continue; }
      out += attribute;
      continue;
    }
    if (ch !== ":") { out += ch; continue; }
    const isElement = selector[i + 1] === ":";
    const nameStart = i + (isElement ? 2 : 1);
    const nameMatch = /^-?[a-zA-Z][\w-]*/.exec(selector.slice(nameStart));
    if (!nameMatch) { out += ch; continue; }
    const name = nameMatch[0].toLowerCase();
    let end = nameStart + nameMatch[0].length;
    let arg = null;
    if (selector[end] === "(") {
      const close = readBalanced(selector, end);
      arg = selector.slice(end + 1, close - 1);
      end = close;
    }
    i = end - 1;
    if (!isElement && arg === null && STRUCTURAL.has(name)) { out += `:${name}`; continue; }
    if (!isElement && arg !== null && STRUCTURAL_FUNCTIONAL.has(name)) { out += `:${name}(${arg})`; continue; }
    if (!isElement && arg !== null && LOGICAL.has(name)) {
      const parts = splitSelectorList(arg).map((part) => matchableSelector(part, { relative: name === "has" }));
      const innerChanged = parts.some((part) => part.changed || part.selector === null);
      if (name === "not") {
        // Dropping part of a negation would narrow it; ignore the whole :not() instead (a superset).
        if (innerChanged) { changed = true; continue; }
        out += `:not(${arg})`;
        continue;
      }
      const kept = parts.map((part) => part.selector).filter(Boolean);
      if (innerChanged) changed = true;
      if (!kept.length) { changed = true; continue; }
      out += `:${name === "matches" || name === "-webkit-any" ? "is" : name}(${kept.join(",")})`;
      continue;
    }
    changed = true; // dynamic pseudo-class or pseudo-element: ignored for matching
  }
  return { selector: fillEmptyCompounds(out), changed };
}

// Collapses whitespace around top-level combinators and puts "*" where the removal left an empty compound
// ("a :hover" -> "a *", ":focus>b" -> "*>b"). Brackets, parentheses and strings are copied as they are.
function fillEmptyCompounds(selector) {
  const items = []; // compounds and combinators at depth 0
  let current = "";
  let depth = 0;
  let pendingSpace = false;
  const flush = () => { items.push({ compound: current }); current = ""; };
  for (let i = 0; i < selector.length; i += 1) {
    const ch = selector[i];
    if (ch === "\\") { current += ch + (selector[i + 1] ?? ""); i += 1; continue; }
    if (ch === "\"" || ch === "'") {
      const end = selector.indexOf(ch, i + 1);
      const stop = end === -1 ? selector.length : end;
      current += selector.slice(i, stop + 1);
      i = stop;
      continue;
    }
    if (ch === "(" || ch === "[") depth += 1;
    else if (ch === ")" || ch === "]") depth -= 1;
    if (depth === 0 && /\s/.test(ch)) { pendingSpace = true; continue; }
    if (depth === 0 && /[>+~]/.test(ch)) {
      flush();
      items.push({ combinator: ch });
      pendingSpace = false;
      continue;
    }
    if (pendingSpace) {
      const last = items[items.length - 1];
      if (current || (last && last.compound !== undefined)) { flush(); items.push({ combinator: " " }); }
      else if (!current && items.length && last.combinator === undefined) { flush(); items.push({ combinator: " " }); }
      pendingSpace = false;
    }
    current += ch;
  }
  flush();
  // Drop a leading empty compound only when the selector starts with a combinator (kept as "*").
  return items.map((item) => (item.combinator !== undefined ? item.combinator : item.compound || "*")).join("");
}

export function splitSelectorList(list) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < list.length; i += 1) {
    const ch = list[i];
    if (ch === "\\") { current += ch + (list[i + 1] ?? ""); i += 1; continue; }
    if (ch === "\"" || ch === "'") {
      const end = list.indexOf(ch, i + 1);
      const stop = end === -1 ? list.length : end;
      current += list.slice(i, stop + 1);
      i = stop;
      continue;
    }
    if (ch === "(" || ch === "[") depth += 1;
    else if (ch === ")" || ch === "]") depth -= 1;
    if (ch === "," && depth === 0) { parts.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// Class and id tokens a selector requires outside any parenthesised group (those may be alternatives or negations).
// When one of them appears nowhere in the documents, the selector cannot match (fast path before querySelector).
export function requiredTokens(selector) {
  return [...tokensOf(flatSelector(selector))];
}

// Tokens of the subject (rightmost) compound: an element matching the selector must carry all of them.
export function subjectTokens(selector) {
  return [...tokensOf(flatSelector(subjectCompound(selector)))];
}

// The rightmost compound selector, parenthesised groups included.
export function subjectCompound(selector) {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selector.length; i += 1) {
    const ch = selector[i];
    if (ch === "\\") { i += 1; continue; }
    if (ch === "(" || ch === "[") depth += 1;
    else if (ch === ")" || ch === "]") depth -= 1;
    else if (!depth && /[\s>+~]/.test(ch)) start = i + 1;
  }
  return selector.slice(start).trim();
}

// Elements that can be the subject of `selector`, from the token/tag index; null when the index cannot narrow it.
function subjectCandidates(selector, index) {
  const compound = subjectCompound(selector);
  const tokens = tokensOf(flatSelector(compound));
  if (tokens.length) return tokens.map((token) => index.get(token) || []).sort((a, b) => a.length - b.length)[0];
  const tag = /^[a-zA-Z][\w-]*/.exec(compound)?.[0]?.toLowerCase();
  if (tag) return index.get(`<${tag}`) || [];
  // ":is(A, B)" / ":where(A, B)" as the subject: the union of each alternative's candidates.
  const group = /^:(?:is|where)\(/.exec(compound);
  if (group) {
    const close = readBalanced(compound, group[0].length - 1);
    const union = new Set();
    for (const alternative of splitSelectorList(compound.slice(group[0].length, close - 1))) {
      const found = subjectCandidates(alternative, index);
      if (!found) return null;
      for (const element of found) union.add(element);
    }
    return [...union];
  }
  return null;
}

function tokensOf(flat) {
  const tokens = [];
  for (const match of flat.matchAll(/([.#])((?:\\.|[\w-])+)/g)) tokens.push(match[1] + match[2].replace(/\\(.)/g, "$1"));
  return tokens;
}

function flatSelector(selector) {
  let flat = "";
  let depth = 0;
  for (let i = 0; i < selector.length; i += 1) {
    const ch = selector[i];
    if (ch === "\\") { if (!depth) flat += ch + (selector[i + 1] ?? ""); i += 1; continue; }
    if (ch === "(" || ch === "[") { depth += 1; continue; }
    if (ch === ")" || ch === "]") { depth -= 1; continue; }
    if (!depth) flat += ch;
  }
  return flat;
}

// token -> elements carrying it, across all documents.
function tokenIndex(documents) {
  const index = new Map();
  const add = (token, element) => {
    if (!index.has(token)) index.set(token, []);
    index.get(token).push(element);
  };
  for (const doc of documents) {
    for (const element of doc.querySelectorAll("[class],[id]")) {
      for (const name of element.classList) add(`.${name}`, element);
      if (element.id) add(`#${element.id}`, element);
    }
    for (const element of doc.getElementsByTagName("*")) add(`<${element.localName}`, element);
  }
  return index;
}

const VENDOR_PSEUDO = /::?-(?:webkit|moz|ms|o)-/i;
const KEEP_AT_RULES = new Set(["font-face", "property", "counter-style", "font-feature-values", "charset", "import", "namespace"]);
const RECURSE_AT_RULES = new Set(["media", "supports", "layer", "container", "document", "-moz-document", "scope"]);

// Keeps the rules of `cssTexts` (ordered stylesheets) that can match an element of any of `documents`.
// Returns { css, stats }.
export function extractCriticalCss(cssTexts, documents, { postcss = loadPostcss() } = {}) {
  const matchCache = new Map();
  const stats = { rules: 0, kept: 0, unevaluable: 0, inputBytes: 0, outputBytes: 0 };
  const index = tokenIndex(documents);
  const matches = (selector) => {
    if (matchCache.has(selector)) return matchCache.get(selector);
    let result = false;
    const { selector: probe } = matchableSelector(selector);
    if (probe === null) result = true;
    else if (requiredTokens(probe).some((token) => !index.has(token))) result = false;
    else {
      try {
        // Test only the elements that can be the subject (rarest subject class/id, tag, or :is() alternatives).
        const candidates = subjectCandidates(probe, index);
        result = candidates ? candidates.some((element) => element.matches(probe)) : documents.some((doc) => doc.querySelector(probe) !== null);
      } catch {
        stats.unevaluable += 1;
        result = true;
      }
    }
    matchCache.set(selector, result);
    return result;
  };
  const roots = cssTexts.map((text) => {
    stats.inputBytes += Buffer.byteLength(text);
    return postcss.parse(text);
  });
  const prune = (container) => {
    container.each((node) => {
      if (node.type === "rule") {
        stats.rules += 1;
        const selectors = splitSelectorList(node.selector);
        const kept = selectors.filter(matches);
        if (!kept.length) { node.remove(); return; }
        stats.kept += 1;
        // Drop the selectors of a list that match nothing. Only when no selector of the list uses a vendor-prefixed
        // pseudo: a list Chrome rejects as a whole must stay as it is.
        if (kept.length < selectors.length && !selectors.some((selector) => VENDOR_PSEUDO.test(selector))) node.selector = kept.join(",");
        return;
      }
      if (node.type === "atrule") {
        const name = node.name.toLowerCase();
        if (name === "keyframes" || name.endsWith("-keyframes")) return; // decided after the rules
        if (KEEP_AT_RULES.has(name)) return;
        if (name === "layer" && !node.nodes) return; // layer order statement
        if (RECURSE_AT_RULES.has(name) && node.nodes) {
          prune(node);
          if (!node.nodes.length) node.remove();
          return;
        }
        node.remove(); // @page and other at-rules that never style the home markup
        return;
      }
      if (node.type === "comment") node.remove();
    });
  };
  roots.forEach(prune);
  // Keep the keyframes referenced by a kept declaration.
  const referenced = new Set();
  for (const root of roots) {
    root.walkDecls(/^(?:-webkit-)?animation(?:-name)?$/i, (decl) => {
      for (const token of decl.value.split(/[\s,]+/)) if (/^-?[a-zA-Z_][\w-]*$/.test(token)) referenced.add(token);
    });
  }
  for (const root of roots) {
    root.walkAtRules(/keyframes$/i, (node) => {
      if (!referenced.has(node.params.trim().replace(/^["']|["']$/g, ""))) node.remove();
    });
  }
  const css = roots.map((root) => root.toString().trim()).filter(Boolean).join("\n");
  stats.outputBytes = Buffer.byteLength(css);
  return { css, stats };
}

const HOME_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];

export function stylesheetHrefs(indexHtml) {
  return [...indexHtml.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]
    .map((match) => /\bhref=["']([^"']+)["']/i.exec(match[0])?.[1])
    .filter((href) => href && /^\/assets\/[\w-]+\.css$/.test(href));
}

async function main() {
  const distIndex = process.argv.indexOf("--dist");
  const distRoot = path.resolve(distIndex > -1 ? process.argv[distIndex + 1] : "dist");
  const clientRoot = path.join(distRoot, "client");
  const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const { homeRouteStylePrefixes } = await import(pathToFileURL(path.join(appRoot, "worker/index.js")).href);
  const { JSDOM } = require("jsdom");
  const indexHtml = await readFile(path.join(clientRoot, "index.html"), "utf8");
  const prefixes = homeRouteStylePrefixes();
  const sheets = stylesheetHrefs(indexHtml).filter((href) => prefixes.some((prefix) => href.split("/").pop().startsWith(prefix)));
  if (!sheets.length) throw new Error("critical css: no home stylesheets found in index.html");
  const cssTexts = await Promise.all(sheets.map((href) => readFile(path.join(clientRoot, href), "utf8")));
  const documents = [];
  for (const locale of HOME_LOCALES) {
    const asset = path.join(clientRoot, "prerender", locale, "home.json");
    if (!existsSync(asset)) throw new Error(`critical css: missing prerendered home for ${locale}`);
    const { html } = JSON.parse(await readFile(asset, "utf8"));
    const dir = ["ar", "ur"].includes(locale) ? "rtl" : "ltr";
    documents.push(new JSDOM(`<!doctype html><html lang="${locale}" dir="${dir}"><head></head><body><div id="root">${html}</div></body></html>`).window.document);
  }
  const { css, stats } = extractCriticalCss(cssTexts, documents);
  const payload = { version: CRITICAL_CSS_VERSION, routes: { home: { sheets, css } } };
  await writeFile(path.join(clientRoot, CRITICAL_CSS_FILE), `${JSON.stringify(payload)}\n`);
  process.stdout.write(`Critical CSS (home): ${sheets.length} stylesheets, ${stats.kept}/${stats.rules} rules kept, ${Math.round(stats.inputBytes / 1024)} KB -> ${Math.round(stats.outputBytes / 1024)} KB (${stats.unevaluable} selectors kept unevaluated)\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
