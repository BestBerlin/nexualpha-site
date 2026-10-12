// Reads a local sitemap.xml and, when it is a <sitemapindex> (since #118), the child sitemaps it lists.
// Children are resolved by file name in the same folder (public/ or dist/client/), never fetched.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const isSitemapIndex = (xml) => /<sitemapindex[\s>]/.test(String(xml || ""));
export const sitemapLocs = (xml) => [...String(xml || "").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim().replace(/&amp;/g, "&"));

// Returns { files: [{ file, xml }], missing: [childLoc] } with the root first. A plain <urlset> is a single file.
export function readSitemapTree(sitemapPath, { maxDepth = 2 } = {}) {
  const files = [];
  const missing = [];
  const visit = (file, depth) => {
    const xml = readFileSync(file, "utf8");
    files.push({ file, xml });
    if (!isSitemapIndex(xml)) return;
    if (depth >= maxDepth) throw new Error(`Sitemap index nesting is too deep at ${file}`);
    for (const loc of sitemapLocs(xml)) {
      let name;
      try { name = path.basename(new URL(loc).pathname); } catch { missing.push(loc); continue; }
      const child = path.join(path.dirname(file), name);
      if (existsSync(child)) visit(child, depth + 1);
      else missing.push(loc);
    }
  };
  visit(sitemapPath, 0);
  return { files, missing };
}

// Page URLs only: the <loc>s of every <urlset> in the tree, deduplicated in order.
export function sitemapPageUrls(tree) {
  return [...new Set(tree.files.filter(({ xml }) => !isSitemapIndex(xml)).flatMap(({ xml }) => sitemapLocs(xml)))];
}
