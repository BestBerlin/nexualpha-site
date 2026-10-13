import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildSeedSql, defaultNewsroomConfig, readSourceRegistry } from '../db/generate-seed-sql.mjs';

const migrationPath = fileURLToPath(new URL('../db/migrations/001_core.sql', import.meta.url));
const feedHealthMigrationPath = fileURLToPath(new URL('../db/migrations/092_source_feed_health.sql', import.meta.url));
const claimQualityMigrationPath = fileURLToPath(new URL('../db/migrations/094_claim_quality.sql', import.meta.url));
const claimQualityBackfillPath = fileURLToPath(new URL('../db/migrations/095_claim_quality_backfill.sql', import.meta.url));
const seedPath = fileURLToPath(new URL('../db/seeds/001_sources.sql', import.meta.url));
const registryPath = new URL('../db/source-registry.json', import.meta.url);

const expectedSourceStatuses = {
  'x-api-v2': 'connected',
  'x-owner-chrome-session': 'partial',
  'youtube-data-api': 'connected',
  'youtube-captions': 'missing-authorization',
  'google-trends-us': 'connected',
  'google-trends-gb': 'connected',
  'google-trends-tr': 'connected',
  'google-trends-vn': 'connected',
  'google-trends-br': 'connected',
  'google-trends-id': 'connected',
  'google-news-crypto': 'connected',
  'weibo-public': 'missing-authorization',
  'instagram-public': 'missing-authorization',
  'tiktok-public': 'missing-authorization',
  'binance-announcements': 'connected',
  'okx-announcements': 'connected',
  'bybit-announcements': 'connected',
  'bitget-announcements': 'connected',
  'kucoin-announcements': 'connected',
  'kraken-announcements': 'connected',
  'coinbase-status': 'partial',
  'kraken-status': 'connected',
  'nexualpha-official-announcements': 'connected',
  'ethereum-blog': 'partial',
  'solana-news': 'partial',
  'hyperliquid-medium-dropped': 'partial',
  'sec-press': 'connected',
  'sec-litigation': 'connected',
  'cftc-rss': 'connected',
  'fca-news': 'temporarily-failing',
  'mas-search': 'partial',
  'esma-rss': 'connected',
  'hk-sfc-news': 'partial',
  'japan-fsa-rss': 'connected',
  'ofac-recent-actions': 'partial',
  'fed-press-all': 'connected',
  'courtlistener-search': 'connected',
  'pacer': 'missing-authorization',
  'sec-edgar-full-text': 'connected',
  'sec-edgar-submissions': 'connected',
  'etherscan-v2': 'missing-authorization',
  'whale-alert-api': 'partial',
  'arkham-transport': 'temporarily-failing',
  'arkham-api-application': 'missing-authorization',
  'mempool-space': 'connected',
  'blockchair-bitcoin-stats': 'connected',
  'defillama-protocols': 'connected',
  'defillama-stablecoins': 'connected',
  'hyperliquid-info': 'connected',
  'coinglass-v4': 'missing-authorization',
  'binance-futures-24hr': 'connected',
  'cointelegraph-rss': 'connected',
  'decrypt-rss': 'connected',
  'the-block-rss': 'connected',
  'coindesk-rss': 'connected',
  'reuters-crypto': 'missing-authorization',
  'bloomberg-markets-rss': 'connected',
  'panews-rss': 'connected',
  'odaily-newsflash-rss': 'connected',
  'blockbeats-api': 'partial',
  'wublockchain-preview': 'connected',
  'telegram-nexualphaclub-preview': 'connected',
  'rsshub-telegram-wublockchainenglish': 'connected',
  'tiingo-fx-crypto': 'connected',
  'fred-csv-dgs10': 'connected',
  'fred-api': 'missing-authorization',
  'stooq-csv': 'temporarily-failing',
  'nexualpha-market-events': 'connected',
  'nexualpha-partners': 'connected',
  'keyword-csvs': 'connected',
};

function stripLineComments(sql) {
  return sql.split('\n').map(line => line.replace(/--.*$/, '')).join('\n');
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    current += char;
    if (char === "'") {
      if (inSingleQuote && sql[i + 1] === "'") {
        current += sql[i + 1];
        i += 1;
      } else {
        inSingleQuote = !inSingleQuote;
      }
    }
    if (char === ';' && !inSingleQuote) {
      statements.push(current.trim());
      current = '';
    }
  }
  assert.equal(inSingleQuote, false, 'SQL has an unterminated single-quoted string');
  assert.equal(current.trim(), '', 'SQL has trailing text without a semicolon');
  return statements.filter(Boolean);
}

test('core migration defines the required event-pool tables and named idempotent indexes', () => {
  const sql = readFileSync(migrationPath, 'utf8');
  const statements = splitSqlStatements(stripLineComments(sql)).map(statement => statement.toLowerCase());
  const requiredTables = [
    'sources',
    'watchlist_entities',
    'keywords',
    'raw_items',
    'events',
    'event_evidence',
    'event_scores',
    'articles',
    'article_metrics',
    'promotions',
    'article_ctas',
    'review_queue',
    'shortfall_log',
    'newsroom_config',
  ];
  for (const table of requiredTables) {
    assert.ok(statements.some(statement => statement.startsWith(`create table if not exists ${table} `)), `${table} table is missing or not idempotent`);
  }
  for (const indexName of [
    'idx_raw_items_published_at_desc',
    'idx_raw_items_title_trgm',
    'idx_raw_items_event_id',
    'idx_events_state_last_update_desc',
  ]) {
    assert.ok(statements.some(statement => statement.includes(`create index if not exists ${indexName}`)), `${indexName} is missing`);
  }
  assert.match(sql, /create extension if not exists pg_trgm;/);
  assert.match(sql, /create table if not exists article_metrics/);
});

test('source registry covers every SOURCES.md row with explicit status expectations', () => {
  const sources = readSourceRegistry(registryPath);
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(sources.length, Object.keys(expectedSourceStatuses).length);
  for (const [id, status] of Object.entries(expectedSourceStatuses)) {
    assert.equal(byId.get(id)?.status, status, `${id} status mismatch`);
  }
  for (const status of ['connected', 'partial', 'missing-authorization', 'temporarily-failing']) {
    assert.ok(sources.some(source => source.status === status), `missing status class ${status}`);
  }
  for (const source of sources) {
    if (source.fallback_source_id) assert.ok(byId.has(source.fallback_source_id), `${source.id} fallback points to a missing source`);
  }
  assert.equal(byId.get('arkham-transport')?.status, 'temporarily-failing');
  assert.equal(byId.get('arkham-api-application')?.status, 'missing-authorization');
  assert.equal(byId.get('fred-csv-dgs10')?.status, 'connected');
  assert.equal(byId.get('fred-api')?.status, 'missing-authorization');
  assert.equal(byId.get('fred-csv-dgs10')?.access_method, 'csv');
  assert.equal(byId.get('fred-api')?.access_method, 'api');
  assert.equal(byId.get('hyperliquid-medium-dropped')?.enabled, false);
  assert.equal(byId.get('hyperliquid-info')?.status, 'connected');
  assert.equal(byId.get('x-api-v2')?.quota_per_day, undefined);
});

test('source feed-health migration upgrades stale media feed URLs without overwriting newer live success', () => {
  const sql = readFileSync(feedHealthMigrationPath, 'utf8');
  const statements = splitSqlStatements(stripLineComments(sql));
  assert.equal(statements.length, 2);
  assert.match(sql, /id = 'panews-rss'/);
  assert.match(sql, /https:\/\/www\.panewslab\.com\/rss\/index\.xml/);
  assert.match(sql, /https:\/\/www\.panewslab\.com\/rss\.xml\?lang=en&type=NEWS/);
  assert.match(sql, /id = 'odaily-newsflash-rss'/);
  assert.match(sql, /https:\/\/www\.odaily\.news\/rss\/newsflash/);
  assert.match(sql, /https:\/\/rss\.odaily\.news\/rss\/newsflash/);
  assert.match(sql, /then 'connected'/);
  assert.match(sql, /fallback_source_id = null/);
  assert.match(sql, /last_success_at is null or last_success_at < '2026-10-12T14:47:57Z'::timestamptz/);
  assert.doesNotMatch(sql, /last_success_at\s*=\s*null/i);
});

test('claim-quality migration adds additive freshness and story grouping fields', () => {
  const sql = readFileSync(claimQualityMigrationPath, 'utf8');
  const statements = splitSqlStatements(stripLineComments(sql)).map(statement => statement.toLowerCase());
  for (const column of ['effective_at', 'deadline_at', 'major_followup_at', 'story_asset', 'story_action', 'story_group_key']) {
    assert.ok(statements.some(statement => statement.includes(`alter table events add column if not exists ${column}`)), `${column} migration missing`);
  }
  for (const indexName of ['idx_events_claim_deadline', 'idx_events_story_group']) {
    assert.ok(statements.some(statement => statement.includes(`create index if not exists ${indexName}`)), `${indexName} is missing`);
  }
  assert.match(sql, /'claim_quality'/);
  assert.match(sql, /"default_freshness_hours": 48/);
  assert.match(sql, /"liquidation_usd_1h_min": 50000000/);
});


test('claim-quality backfill populates story metadata without arbitrary date fallback', () => {
  const sql = readFileSync(claimQualityBackfillPath, 'utf8');
  const statements = splitSqlStatements(stripLineComments(sql)).map(statement => statement.toLowerCase());
  assert.equal(statements.length, 2);
  for (const text of ['story_asset', 'story_action', 'story_group_key', 'campaign_end_at', 'story_venues', 'liquidations_usd_1h', 'price_move_pct_1h']) assert.match(sql, new RegExp(text));
  assert.doesNotMatch(sql, /campaign_start_at'\)::timestamptz as effective_at/);
  assert.doesNotMatch(sql, /metrics->'dates'/);
  assert.match(sql, /coalesce\(e\.discussion->'market', '\{\}'::jsonb\) \|\| jsonb_strip_nulls/);
  assert.match(sql, /verification_status='needs-review'/);
});

test('generated seed SQL is checked in, parseable, and preserves health/admin fields on reseed', () => {
  const generated = buildSeedSql(readSourceRegistry(registryPath));
  const checkedIn = readFileSync(seedPath, 'utf8');
  assert.equal(checkedIn, generated);
  const statements = splitSqlStatements(stripLineComments(checkedIn));
  assert.ok(statements.length >= 4, 'seed should contain source insert plus config inserts');
  assert.doesNotMatch(checkedIn, /\bBEGIN\b|\bCOMMIT\b/i);
  assert.match(checkedIn, /on conflict \(id\) do update set/i);
  assert.match(buildSeedSql([{ ...readSourceRegistry(registryPath)[0], id: 'empty-topics-example', topics: [] }]), /array\[\]::text\[\]/);
  for (const preservedColumn of ['status', 'enabled', 'verified_official', 'verified_via', 'verified_at', 'used_today', 'last_success_at', 'last_error_at', 'last_error', 'consecutive_failures']) {
    assert.doesNotMatch(checkedIn, new RegExp(`\\b${preservedColumn}\\s*=\\s*excluded\\.`, 'i'), `${preservedColumn} should be preserved on reseed`);
  }
  for (const source of readSourceRegistry(registryPath)) {
    assert.ok(checkedIn.includes(`'${source.id.replaceAll("'", "''")}'`), `${source.id} missing from seed SQL`);
  }
});

test('default newsroom config seeds owner weights, thresholds, and stage-0 cap without overwriting live config', () => {
  const sql = readFileSync(seedPath, 'utf8');
  assert.deepEqual(defaultNewsroomConfig.weights, { relevance: 25, heat: 20, timeliness: 20, new_info: 20, impact: 15 });
  assert.equal(defaultNewsroomConfig.thresholds.publish, 55);
  assert.equal(defaultNewsroomConfig.thresholds.review, 70);
  assert.equal(defaultNewsroomConfig.thresholds.publishCredibilityMin, 2);
  assert.equal(defaultNewsroomConfig.thresholds.flashCredibilityMin, 3);
  assert.equal(defaultNewsroomConfig.thresholds.reviewCredibilityMin, 1);
  assert.equal(defaultNewsroomConfig.thresholds.repeatAngleSimilarity, 0.5);
  assert.equal(defaultNewsroomConfig.ramp.stage, 0);
  assert.equal(defaultNewsroomConfig.ramp.daily_cap, 24);
  for (const key of ['weights', 'thresholds', 'ramp']) {
    assert.match(sql, new RegExp(`insert into newsroom_config \\(key, value\\) values \\('${key}',`));
  }
  assert.match(sql, /on conflict \(key\) do nothing;/i);
});
