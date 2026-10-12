import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const registryUrl = new URL('./source-registry.json', import.meta.url);

export const defaultNewsroomConfig = {
  weights: { relevance: 25, heat: 20, timeliness: 20, new_info: 20, impact: 15 },
  thresholds: {
    publish: 55,
    review: 70,
    publishCredibilityMin: 2,
    flashCredibilityMin: 3,
    reviewCredibilityMin: 1,
    repeatAngleSimilarity: 0.5,
  },
  ramp: {
    stage: 0,
    daily_cap: 24,
    next_caps: [30, 40],
    advance_to_30: { indexation_rate_min: 0.6, consecutive_days: 7, impressions_per_article: 'not_falling_vs_previous_14d' },
    advance_to_40: { indexation_rate_min: 0.6, consecutive_days: 14, impressions_per_article: 'not_falling_vs_previous_14d' },
    step_down: { indexation_rate_below: 0.4, consecutive_days: 5 },
  },
};

export function readSourceRegistry(url = registryUrl) {
  return JSON.parse(readFileSync(url, 'utf8'));
}

const sqlText = value => {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
};

const sqlBoolean = value => value ? 'true' : 'false';

const sqlInteger = value => {
  if (value === null || value === undefined) return 'null';
  if (!Number.isInteger(value)) throw new TypeError(`Expected integer, received ${value}`);
  return String(value);
};

const sqlDate = value => value ? `${sqlText(value)}::date` : 'null';

const sqlJson = value => `${sqlText(JSON.stringify(value))}::jsonb`;

const sqlTextArray = values => {
  const list = values ?? [];
  if (!Array.isArray(list)) throw new TypeError('Expected array');
  if (list.length === 0) return 'array[]::text[]';
  return `array[${list.map(item => `${sqlText(item)}::text`).join(',')}]`;
};

function sourceRow(source) {
  return [
    source.id,
    source.platform,
    source.name,
    source.url,
    source.topics ?? [],
    source.access_method,
    source.role,
    source.tier ?? 2,
    source.status,
    source.poll_seconds ?? 600,
    source.cost_note ?? null,
    source.quota_per_day ?? null,
    source.fallback_source_id ?? null,
    source.enabled ?? true,
    source.verified_official ?? false,
    source.verified_via ?? null,
    source.verified_at ?? null,
  ];
}

const sourceColumns = [
  'id',
  'platform',
  'name',
  'url',
  'topics',
  'access_method',
  'role',
  'tier',
  'status',
  'poll_seconds',
  'cost_note',
  'quota_per_day',
  'fallback_source_id',
  'enabled',
  'verified_official',
  'verified_via',
  'verified_at',
];

function renderSourceTuple(source) {
  const [id, platform, name, url, topics, accessMethod, role, tier, status, pollSeconds, costNote, quotaPerDay, fallbackSourceId, enabled, verifiedOfficial, verifiedVia, verifiedAt] = sourceRow(source);
  return `(${[
    sqlText(id),
    sqlText(platform),
    sqlText(name),
    sqlText(url),
    sqlTextArray(topics),
    sqlText(accessMethod),
    sqlText(role),
    sqlInteger(tier),
    sqlText(status),
    sqlInteger(pollSeconds),
    sqlText(costNote),
    sqlInteger(quotaPerDay),
    sqlText(fallbackSourceId),
    sqlBoolean(enabled),
    sqlBoolean(verifiedOfficial),
    sqlText(verifiedVia),
    sqlDate(verifiedAt),
  ].join(', ')})`;
}

function validateSources(sources) {
  const ids = new Set();
  for (const source of sources) {
    if (!source.id || ids.has(source.id)) throw new Error(`Duplicate or missing source id: ${source.id}`);
    ids.add(source.id);
    if (!['connected', 'partial', 'missing-authorization', 'temporarily-failing'].includes(source.status)) {
      throw new Error(`Invalid status for ${source.id}: ${source.status}`);
    }
    if (!['lead', 'verification', 'data'].includes(source.role)) {
      throw new Error(`Invalid role for ${source.id}: ${source.role}`);
    }
  }
}

export function buildSeedSql(sources = readSourceRegistry(), config = defaultNewsroomConfig) {
  validateSources(sources);
  const sourceSql = `insert into sources (${sourceColumns.join(', ')}) values\n${sources.map(renderSourceTuple).join(',\n')}\non conflict (id) do update set\n  platform = excluded.platform,\n  name = excluded.name,\n  url = excluded.url,\n  topics = excluded.topics,\n  access_method = excluded.access_method,\n  role = excluded.role,\n  tier = excluded.tier,\n  poll_seconds = excluded.poll_seconds,\n  cost_note = excluded.cost_note,\n  quota_per_day = excluded.quota_per_day,\n  fallback_source_id = excluded.fallback_source_id;`;

  const configSql = Object.entries(config).map(([key, value]) =>
    `insert into newsroom_config (key, value) values (${sqlText(key)}, ${sqlJson(value)}) on conflict (key) do nothing;`
  ).join('\n');

  return [
    '-- Generated from source-registry.json by generate-seed-sql.mjs.',
    '-- Re-seeding preserves source health/admin fields: status, enabled, verified_* fields, used_today, failures, and last error/success timestamps.',
    sourceSql,
    configSql,
    '',
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(buildSeedSql());
}
