import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_RE = /^[a-z0-9](?:[a-z0-9_-]{0,46}[a-z0-9])?$/;
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.html']);
const IGNORED_SEGMENTS = new Set([
  '.git',
  '.next',
  'baseline',
  'build',
  'coverage',
  'dist',
  'docs',
  'evidence',
  'fixtures',
  'node_modules',
  'test',
  'tests',
  'vendor',
]);

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ACTIVE_SOURCE_ROOTS = Object.freeze(['pilot-01-prototype/src', 'pilot-01-prototype/server', 'pilot-01-prototype/worker', 'ops', 'backend', 'deploy']);

function sourceRoot(path) {
  const rel = path.replace(/\\/g, '/');
  return ACTIVE_SOURCE_ROOTS.some((root) => rel === root || rel.startsWith(`${root}/`));
}

const EXCLUDED_TEMPLATE_FAMILIES = Object.freeze([
  {
    family: 'regional-market-preview runtime item ids',
    pattern: 'regional-onchain-${type}, regional-related-${type}',
    source: 'pilot-01-prototype/src/components/v3/international/RegionalMarketPreview.jsx',
    reason: 'The values come from localized runtime route tuples; the registry records the template provenance rather than guessing inactive ids.',
  },
  {
    family: 'worker decision rail ids',
    pattern: 'decision-rail-${link.id}',
    source: 'pilot-01-prototype/worker/index.js',
    reason: 'Worker SSR expands ids from page-specific route models. Literal active ids should be added by source once promoted to stable placements.',
  },
]);

function shouldReadFile(root, path) {
  const rel = relative(root, path).replace(/\\/g, '/');
  if (!rel || rel.startsWith('..')) return false;
  if (!sourceRoot(rel) || rel.startsWith('ops/funnel/')) return false;
  const segments = rel.split('/');
  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) return false;
  if (/(^|[.-])(test|spec)\.[cm]?[jt]sx?$/i.test(segments.at(-1))) return false;
  const ext = path.match(/\.[^.]+$/)?.[0] || '';
  return SOURCE_EXTENSIONS.has(ext);
}

function walkFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try { entries = readdirSync(current, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const path = resolve(current, entry.name);
      const segments = relative(root, path).split(/[\\/]/);
      if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) continue;
      if (entry.isDirectory()) {
        stack.push(path);
      } else if (entry.isFile() && shouldReadFile(root, path)) {
        files.push(path);
      }
    }
  }
  return files.sort((a, b) => relative(root, a).localeCompare(relative(root, b)));
}

function lineNumber(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

function add(records, placement, provenance) {
  const src = String(placement || '').trim().toLowerCase();
  if (src === 'unknown') return;
  if (!SRC_RE.test(src)) return;
  const current = records.get(src) || { src, provenance: [] };
  current.provenance.push(provenance);
  records.set(src, current);
}

function extractLiteralPlacements(records, rel, text) {
  const patterns = [
    /data-cta-placement\s*=\s*["']([^"'${}]+)["']/g,
    /data-cta-placement\s*=\s*\{\s*["']([^"'${}]+)["']\s*\}/g,
    /data-cta-placement\s*=\s*\{\s*`([^`$]+)`\s*\}/g,
    /\bplacement\s*=\s*["']([^"'${}]+)["']/g,
    /\bplacement\s*=\s*\{\s*["']([^"'${}]+)["']\s*\}/g,
    /\bplacement\s*:\s*["']([^"'${}]+)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      add(records, match[1], { source: rel, line: lineNumber(text, match.index), kind: 'data-cta-placement' });
    }
  }
}

function extractQuerySources(records, rel, text) {
  const pattern = /[?&]src=([a-z0-9](?:[a-z0-9_-]{0,46}[a-z0-9])?)(?=[&#"'\s`)]|$)/gi;
  for (const match of text.matchAll(pattern)) {
    add(records, match[1], { source: rel, line: lineNumber(text, match.index), kind: '?src=' });
  }
}

function extractObjectSourceLiterals(records, rel, text) {
  const lines = text.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!/\bpartner\s*:|\bkind\s*:\s*["'](?:site|go)["']/.test(line)) continue;
    for (const match of line.matchAll(/\bsrc\s*:\s*["']([^"']+)["']/g)) {
      add(records, match[1], { source: rel, line: index + 1, kind: 'src: literal' });
    }
  }
}

function extractHelperCallSources(records, rel, text) {
  const patterns = [
    /\b(?:go|sitePath|readMore)\s*\(([^)]*)\)/g,
    /\bpartnerButtons\s*\(([^)]*)\)/g,
  ];
  for (const pattern of patterns) {
    for (const call of text.matchAll(pattern)) {
      for (const literal of call[1].matchAll(/["']([a-z0-9][a-z0-9_-]{0,47})["']/gi)) {
        add(records, literal[1], { source: rel, line: lineNumber(text, call.index), kind: 'helper src literal' });
      }
    }
  }
}

function academyIds(root) {
  const season = resolve(root, 'pilot-01-prototype/src/data/academy-season1.js');
  if (!existsSync(season)) return [];
  const text = readFileSync(season, 'utf8');
  return [...text.matchAll(/"id"\s*:\s*"([A-Za-z0-9_-]+)"/g)]
    .map((match) => `academy-${match[1].toLowerCase()}`)
    .filter((src, index, all) => all.indexOf(src) === index);
}

function stringArrayExport(root, rel, name) {
  const path = resolve(root, rel);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  const match = text.match(new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*\\[([^\\]]*)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/["']([a-z0-9-]+)["']/gi)].map((m) => m[1]);
}

function objectKeys(root, rel, name) {
  const path = resolve(root, rel);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  const match = text.match(new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*Object\\.freeze\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)`));
  if (!match) return [];
  return [...match[1].matchAll(/(?:^|,)\s*["']?([a-z0-9-]+)["']?\s*:\s*\{/gi)].map((m) => m[1]);
}

function dynamicFamilies(root) {
  const groups = [
    { family: 'alert sender channel alert buttons', values: stringArrayExport(root, 'ops/alert-sender/alert-sender.mjs', 'LANGS').map((locale) => `tg-alert-channel-${locale}`), source: 'ops/alert-sender/alert-sender.mjs' },
    { family: 'alert sender direct-message alert buttons', values: stringArrayExport(root, 'ops/alert-sender/alert-sender.mjs', 'LANGS').map((locale) => `tg-alert-dm-${locale}`), source: 'ops/alert-sender/alert-sender.mjs' },
    { family: 'alert sender digest buttons', values: stringArrayExport(root, 'ops/alert-sender/alert-sender.mjs', 'LANGS').map((locale) => `tg-digest-${locale}`), source: 'ops/alert-sender/alert-sender.mjs' },
    { family: 'alert sender direct-message listing buttons', values: stringArrayExport(root, 'ops/alert-sender/alert-sender.mjs', 'LANGS').map((locale) => `tg-dm-listing-${locale}`), source: 'ops/alert-sender/alert-sender.mjs' },
    { family: 'channel feed signup buttons', values: Object.keys((() => {
      const path = resolve(root, 'ops/channel-feed/channel-feed.mjs');
      if (!existsSync(path)) return {};
      const text = readFileSync(path, 'utf8');
      const match = text.match(/const\s+LOCALE_PATH\s*=\s*\{([^}]+)\}/);
      return Object.fromEntries([...(match?.[1] || '').matchAll(/([a-z]+)\s*:/g)].map((m) => [m[1], true]));
    })()).map((locale) => `tg-channel-${locale}`), source: 'ops/channel-feed/channel-feed.mjs' },
    { family: 'channel feed article backlinks', values: stringArrayExport(root, 'ops/channel-feed/article-feed.mjs', 'ARTICLE_LANGS').map((locale) => `tg-article-${locale}`), source: 'ops/channel-feed/article-feed.mjs' },
    { family: 'channel feed guide backlinks', values: stringArrayExport(root, 'ops/channel-feed/pin-guide.mjs', 'GUIDE_LANGS').map((locale) => `tg-guide-${locale}`), source: 'ops/channel-feed/pin-guide.mjs' },
    { family: 'morning channel rhythm backlinks', values: stringArrayExport(root, 'ops/alert-sender/channel-rhythm.mjs', 'RHYTHM_LANGS').map((locale) => `tg-morning-${locale}`), source: 'ops/alert-sender/channel-rhythm.mjs' },
    { family: 'shorts platform backlinks', values: stringArrayExport(root, 'ops/shorts/strings.mjs', 'PLATFORM_KEYS').map((platform) => `${platform}-short`), source: 'ops/shorts/builders.mjs' },
    { family: 'embed widget landing attribution', values: objectKeys(root, 'pilot-01-prototype/src/data/market-data-pages.js', 'EMBED_KINDS').map((kind) => `embed-${kind}`), source: 'pilot-01-prototype/src/data/market-data-pages.js' },
    { family: 'collection hub kinds', values: ['topics-collection-hero-primary', 'topics-collection-hero-secondary', 'factbook-collection-hero-secondary'], source: 'pilot-01-prototype/src/components/v3/CollectionHubPage.jsx' },
    { family: 'mobile bottom nav item ids', values: ['mobile-nav-exchanges', 'mobile-nav-calculator', 'mobile-nav-campaigns', 'mobile-nav-compare', 'mobile-nav-search'], source: 'pilot-01-prototype/src/components/v3/MobileBottomNav.jsx' },
  ];
  return groups.filter((group) => existsSync(resolve(root, group.source)) && group.values.length);
}

export function knownPlacementRecords(root = DEFAULT_ROOT) {
  const base = resolve(root);
  if (!existsSync(base) || !statSync(base).isDirectory()) throw new Error(`Placement root is not a directory: ${base}`);
  const records = new Map();
  for (const path of walkFiles(base)) {
    const rel = relative(base, path).replace(/\\/g, '/');
    const text = readFileSync(path, 'utf8');
    extractLiteralPlacements(records, rel, text);
    extractQuerySources(records, rel, text);
    extractObjectSourceLiterals(records, rel, text);
    extractHelperCallSources(records, rel, text);
  }
  for (const src of academyIds(base)) {
    add(records, src, { source: 'pilot-01-prototype/src/data/academy-season1.js', line: 1, kind: 'academy episode id expansion' });
  }
  for (const group of dynamicFamilies(base)) {
    for (const src of group.values) add(records, src, { source: group.source, line: 1, kind: group.family });
  }
  return [...records.values()]
    .map((record) => ({ ...record, provenance: record.provenance.sort((a, b) => a.source.localeCompare(b.source) || a.line - b.line || a.kind.localeCompare(b.kind)) }))
    .sort((a, b) => a.src.localeCompare(b.src));
}

export function knownPlacements(root = DEFAULT_ROOT) {
  return knownPlacementRecords(root).map((record) => record.src);
}

export function knownPlacementDiscovery(root = DEFAULT_ROOT) {
  return {
    root: resolve(root),
    ignoredSegments: [...IGNORED_SEGMENTS].sort(),
    activeSourceRoots: [...ACTIVE_SOURCE_ROOTS],
    dynamicFamilies: dynamicFamilies(resolve(root)).map(({ family, values, source }) => ({ family, source, values: [...values].sort() })),
    unresolvedDynamicFamilies: EXCLUDED_TEMPLATE_FAMILIES.map((item) => ({ ...item })),
    records: knownPlacementRecords(root),
  };
}
