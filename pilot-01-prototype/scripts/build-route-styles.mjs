#!/usr/bin/env node
// Resolve SSR stylesheet usage from the Vite manifest and rendered component surface.
// Keep whole assets (including interaction rules), never purge declarations or reorder layers.
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { pageStylesheetAllowed } from '../worker/index.js';
import { TS_PATH } from '../src/data/tokenized-stocks-routes.js';
import { loadPostcss, matchableSelector, requiredTokens, splitSelectorList, stylesheetHrefs } from './build-critical-css.mjs';

const postcss = loadPostcss();

export function markupTokens(html) {
  const tokens = new Set();
  for (const [, attribute, value] of html.matchAll(/\b(class|id)="([^"]*)"/g)) {
    for (const token of attribute === 'class' ? value.split(/\s+/) : [value]) if (token) tokens.add((attribute === 'class' ? '.' : '#') + token);
  }
  return tokens;
}

export function stylesheetUsage(css) {
  const alternatives = [];
  const root = postcss.parse(css);
  let global = false;
  root.walkAtRules((rule) => {
    if (['font-face', 'property', 'import', 'namespace'].includes(rule.name.toLowerCase())) global = true;
  });
  root.walkRules((rule) => {
    // A keyframe is used only through an animation declaration in the same asset.
    for (let parent = rule.parent; parent; parent = parent.parent) if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) return;
    for (const selector of splitSelectorList(rule.selector)) {
      const probe = matchableSelector(selector).selector;
      alternatives.push({ probe, required: probe === null ? [] : requiredTokens(probe) });
    }
  });
  return (tokens, document) => global || alternatives.some(({ probe, required }) => {
    if (!required.every((token) => tokens.has(token))) return false;
    if (!document || probe === null) return true;
    try { return document.querySelector(probe) !== null; }
    catch { return true; } // Unknown browser/vendor selectors stay conservative.
  });
}

export function manifestStylesheets(manifest) {
  return new Set(Object.values(manifest).flatMap((entry) => [
    ...(entry.css || []), ...(entry.file?.endsWith('.css') ? [entry.file] : []),
  ]).map((file) => '/' + file));
}

// Only merge neighbours: moving a small early/mid/late sheet into a distant route
// chunk would change precedence. Runtime-referenced assets keep their original URL.
export function mergeableNeighbours(left, right, referenced, limit = 2048) {
  return Math.min(Buffer.byteLength(left.css), Buffer.byteLength(right.css)) < limit
    && !referenced.has(left.href) && !referenced.has(right.href)
    && !/@(?:import|charset|namespace)\b/i.test(left.css + right.css);
}

async function main() {
  const root = path.resolve('dist/client');
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const manifest = JSON.parse(await readFile(path.join(root, '.vite/manifest.json'), 'utf8'));
  const moduleStyles = JSON.parse(await readFile(path.join(root, 'style-modules.json'), 'utf8'));
  const { routeStyleModules, render } = await import(pathToFileURL(path.resolve('dist/ssr/entry-server.js')).href);
  const inventory = JSON.parse(await readFile(path.join(root, 'prerender-manifest.json'), 'utf8'));
  const linked = stylesheetHrefs(html);
  const declared = manifestStylesheets(manifest);
  // build-route-css rejoins CSS-only v6 layers, outside Rollup. It records those
  // replacements in the manifest too, so an omitted asset is a build failure.
  for (const href of linked) if (!declared.has(href)) throw new Error(`route styles: ${href} missing from build manifest`);
  const surfacesByAsset = new Map(Object.values(manifest).filter((entry) => entry.surface).map((entry) => ['/' + entry.file, entry.surface]));
  const assets = await Promise.all(linked.map(async (href) => {
    const css = await readFile(path.join(root, href), 'utf8');
    return { href, css, uses: stylesheetUsage(css), surface: surfacesByAsset.get(href) };
  }));
  const surfaces = new Map();
  const families = new Map();
  for (const route of Object.values(inventory.routes)) {
    if (!surfaces.has(route.pathname)) surfaces.set(route.pathname, []);
    surfaces.get(route.pathname).push(route);
  }
  // This live-data template deliberately has no build-time SEO/prerender entry.
  // Sample it with the same renderer; its owned chunk also covers stock details.
  const locales = [...new Set(Object.values(inventory.routes).filter((route) => route.pathname === "/").map((route) => route.locale))];
  surfaces.set(TS_PATH, locales.map((locale) => ({ pathname: TS_PATH, locale,
    markup: render(new URL(`${TS_PATH}?locale=${locale}`, "https://nexualpha.com").href) })));
  const selectedByPath = new Map();
  for (const [pathname, editions] of surfaces) {
    const used = new Set();
    const owned = new Set(editions.flatMap((route) => routeStyleModules(new URL(`${pathname}?locale=${route.locale}`, "https://nexualpha.com").href))
      .flatMap((module) => moduleStyles[module]?.css || []).map((file) => "/" + file));
    const surface = pathname === "/" ? "home" : "inner";
    for (const route of editions) {
      const markup = route.markup ?? JSON.parse(await readFile(path.join(root, route.asset), "utf8")).html;
      const tokens = markupTokens(markup);
      const dir = ["ar", "ur"].includes(route.locale) ? "rtl" : "ltr";
      const dom = new JSDOM(`<!doctype html><html lang="${route.locale}" dir="${dir}"><body><div id="root">${markup}</div></body></html>`);
      for (const asset of assets) {
        if (used.has(asset.href) || (asset.surface && asset.surface !== surface)
          || !pageStylesheetAllowed(asset.href, new URL(pathname, "https://nexualpha.com"))) continue;
        if (owned.has(asset.href) || asset.uses(tokens, dom.window.document)) used.add(asset.href);
      }
      dom.window.close();
    }
    selectedByPath.set(pathname, used);
    if (selectedByPath.size % 100 === 0) console.log(`Route styles: scanned ${selectedByPath.size}/${surfaces.size} route surfaces`);
    const family = pathname === TS_PATH ? "tokenized-stocks" : /^\/(news|exchanges|compare)\/[^/]+$/.exec(pathname)?.[1];
    if (family) {
      if (!families.has(family)) families.set(family, new Set());
      for (const href of used) families.get(family).add(href);
    }
  }
  const referenced = new Set();
  for (const file of await readdir(path.join(root, 'assets'))) {
    if (!file.endsWith('.js')) continue;
    const source = await readFile(path.join(root, 'assets', file), 'utf8');
    for (const asset of assets) if (source.includes(path.basename(asset.href))) referenced.add(asset.href);
  }
  const bundles = {};
  const select = async (used) => {
    const selected = assets.filter((asset) => used.has(asset.href));
    const result = [];
    for (let index = 0; index < selected.length; index += 1) {
      const asset = selected[index];
      const next = selected[index + 1];
      if (!next || !mergeableNeighbours(asset, next, referenced)) { result.push(asset.href); continue; }
      const css = asset.css.trim() + '\n' + next.css.trim() + '\n';
      const hash = createHash('sha256').update(css).digest('hex').slice(0, 12);
      const href = `/assets/route-css-${hash}.css`;
      if (!bundles[href]) {
        await writeFile(path.join(root, href), css);
        bundles[href] = [asset.href, next.href];
      }
      result.push(href);
      index += 1;
    }
    return result;
  };
  const routes = {};
  const templates = {};
  for (const [pathname, used] of selectedByPath) routes[pathname] = await select(used);
  for (const [family, tokens] of families) templates[family] = await select(tokens);
  const entry = /<script\b[^>]*type="module"[^>]*src="([^"]+)"/.exec(html)?.[1];
  const payload = { version: 1, entry, stylesheets: linked, routes, templates, bundles };
  await writeFile(path.join(root, 'route-styles.json'), JSON.stringify(payload) + '\n');
  console.log(`Route styles: ${Object.keys(routes).length} rendered routes, ${linked.length} manifest assets, ${Object.keys(bundles).length} safe adjacent merges`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main().catch((error) => { console.error(error); process.exitCode = 1; });
