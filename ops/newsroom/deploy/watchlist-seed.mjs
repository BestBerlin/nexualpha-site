#!/usr/bin/env node
// Prints idempotent SQL that loads the T7 watchlist (watchlist.json) and event words (keywords.json) into
// watchlist_entities / keywords. Usage: node watchlist-seed.mjs DIR | psql ...
// Interim loader until T2's `newsroom.mjs seed:watchlist` is deployed (deploy.sh prefers that command when present).
// Re-running updates descriptive fields but never changes an operator-set status (active/candidate/retired).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const lit = value => (value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`);
const arr = values => `ARRAY[${values.map(lit).join(',')}]::text[]`;
const STOP_ALIASES = new Set(['strategy', 'checkmate', 'onyx', 'kinexys by j.p. morgan', 'none', 'unverified', 'mas']);

// Same id rule as the T2 seed loader (collectors/seeds.mjs) so `seed:watchlist` later upserts these rows in place.
export const slugify = name => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const LANG = { zh: 'zh-Hans' };

const isUsable = value => typeof value === 'string' && value.trim() && !/^none\b/i.test(value.trim()) && !/unverified/i.test(value);

export function entityRow(entry) {
  const base = entry.name.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const inner = [...entry.name.matchAll(/\(([^)]*)\)/g)].flatMap(match => match[1].split(/\s*[\/,]\s*/)).map(value => value.trim()).filter(Boolean);
  const cjk = inner.find(value => /[一-鿿]/.test(value));
  const display = { en: base, ...(cjk ? { 'zh-Hans': cjk } : {}) };
  const accounts = Object.fromEntries(Object.entries(entry.accounts ?? {}).filter(([, value]) => isUsable(value)));
  const handle = typeof accounts.x === 'string' && accounts.x.startsWith('@') ? accounts.x.slice(1) : null;
  const aliases = [...new Set([...inner, ...(handle && handle.length >= 4 ? [handle] : [])]
    .filter(alias => alias.length >= 2 && !STOP_ALIASES.has(alias.toLowerCase()) && alias.toLowerCase() !== base.toLowerCase()))];
  const urls = [...new Set([entry.official_site, entry.newsroom_url, entry.rss_url, ...(entry.verification ?? [])].filter(isUsable))];
  return {
    id: slugify(entry.name), kind: entry.type, display, aliases,
    role_note: [entry.current_role, entry.org].filter(isUsable).join(' — ') || null,
    official_urls: urls, accounts, priority: Number.isInteger(entry.priority) ? entry.priority : 2,
  };
}

export function buildWatchlistSql(watchlist, keywords) {
  const byId = new Map();
  for (const entry of watchlist) {
    const row = entityRow(entry);
    if (!row.id) continue;
    const prior = byId.get(row.id);
    if (prior) { // duplicate names (e.g. two "Lookonchain" rows): merge aliases, URLs and accounts
      prior.aliases = [...new Set([...prior.aliases, ...row.aliases])];
      prior.official_urls = [...new Set([...prior.official_urls, ...row.official_urls])];
      prior.accounts = { ...row.accounts, ...prior.accounts };
      prior.priority = Math.min(prior.priority, row.priority);
    } else byId.set(row.id, row);
  }
  const entityValues = [...byId.values()].map(row => `(${lit(row.id)}, ${lit(row.kind)}, ${lit(JSON.stringify(row.display))}::jsonb, ${arr(row.aliases)}, ${lit(row.role_note)}, ${arr(row.official_urls)}, ${lit(JSON.stringify(row.accounts))}::jsonb, ${row.priority}, 'active', 'nx-agents/newsroom/watchlist/watchlist.json')`);
  const words = Object.entries(keywords.event_words ?? {}).flatMap(([lang, terms]) => [...new Set(terms)].map(term => `(${lit(term)}, ${lit(LANG[lang] ?? lang)}, 'active', 'nx-agents/newsroom/watchlist/keywords.json')`));
  return [
    'BEGIN;',
    'SELECT pg_advisory_xact_lock(20261012,1);',
    `INSERT INTO watchlist_entities (id, kind, display_name, aliases, role_note, official_urls, accounts, priority, status, discovered_from) VALUES\n${entityValues.join(',\n')}\nON CONFLICT (id) DO UPDATE SET kind=excluded.kind, display_name=excluded.display_name, aliases=excluded.aliases, role_note=excluded.role_note, official_urls=excluded.official_urls, accounts=excluded.accounts, priority=excluded.priority;`,
    words.length ? `INSERT INTO keywords (term, lang, status, added_by) VALUES\n${words.join(',\n')}\nON CONFLICT (term, lang) DO NOTHING;` : '',
    'COMMIT;',
  ].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: watchlist-seed.mjs DIR (containing watchlist.json and keywords.json)'); process.exit(2); }
  const watchlist = JSON.parse(readFileSync(resolve(dir, 'watchlist.json'), 'utf8'));
  const keywords = JSON.parse(readFileSync(resolve(dir, 'keywords.json'), 'utf8'));
  process.stdout.write(`${buildWatchlistSql(Array.isArray(watchlist) ? watchlist : watchlist.entities, keywords)}\n`);
}
