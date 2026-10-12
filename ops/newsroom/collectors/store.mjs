const fields = ['source_id','external_id','url','canonical_url','author','author_account','title','body_excerpt','lang','published_at','fetched_at','metrics','metrics_at','entities','event_type_guess','content_hash'];
const record = "source_id text,external_id text,url text,canonical_url text,author text,author_account text,title text,body_excerpt text,lang text,published_at timestamptz,fetched_at timestamptz,metrics jsonb,metrics_at timestamptz,entities text[],event_type_guess text,content_hash text";
export function databaseStore(execute, literal) {
  const json = value => `${literal(JSON.stringify(value))}::jsonb`;
  const read = query => JSON.parse(execute(`SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM (${query}) t;`));
  return {
    sources: () => read('SELECT * FROM sources ORDER BY id'),
    entities: () => read("SELECT * FROM watchlist_entities WHERE status='active' ORDER BY priority,id"),
    keywords: () => read("SELECT * FROM keywords WHERE status='active' ORDER BY lang,term"),
    config: () => Object.fromEntries(read('SELECT key,value FROM newsroom_config').map(r=>[r.key,r.value])),
    persist(source, items, health) {
      const insert = items.length ? `INSERT INTO raw_items(${fields.join(',')}) SELECT ${fields.join(',')} FROM jsonb_to_recordset(${json(items)}) AS r(${record}) ON CONFLICT(source_id,external_id) DO UPDATE SET metrics=excluded.metrics,metrics_at=excluded.metrics_at;` : '';
      const success = health.last_success_at ? `last_success_at=${literal(health.last_success_at)}::timestamptz,` : '';
      const origins=source.id==='x-api-v2' && items.length ? `UPDATE raw_items r SET origin_item_id=o.id FROM raw_items o WHERE r.source_id='x-api-v2' AND o.source_id=r.source_id AND r.origin_item_id IS NULL AND r.id<>o.id AND o.external_id=(SELECT ref->>'id' FROM jsonb_array_elements(coalesce(r.metrics->'referenced_tweets','[]'::jsonb)) ref WHERE ref->>'type' IN ('quoted','retweeted') LIMIT 1);` : '';
      execute(`BEGIN; ${insert} ${origins} UPDATE sources SET status=${literal(health.status)},${success}last_error=${health.last_error ? literal(health.last_error) : 'null'},last_error_at=${health.last_error ? `${literal(health.at)}::timestamptz` : 'null'},consecutive_failures=${health.consecutive_failures} WHERE id=${literal(source.id)}; COMMIT;`);
    },
    reserve(platform, amount, cap, day) {
      if (!Number.isSafeInteger(cap) || cap < 0 || !Number.isSafeInteger(amount) || amount <= 0) return false;
      const key = literal(`collector_usage:${platform}:${day}`);
      // One lock shared by all collectors of a platform; the live owner cap is
      // reread under lock, so a concurrent config:set reduction takes effect.
      const budgetKey = literal(platform === 'x' ? 'x_daily_read_budget' : 'youtube_daily_unit_budget');
      const fallback = platform === 'x' ? 0 : 2000;
      const output=execute(`BEGIN;
SELECT pg_advisory_xact_lock(20261012,${platform === 'x' ? 2 : 3});
INSERT INTO newsroom_config(key,value) VALUES (${key},'0'::jsonb) ON CONFLICT(key) DO NOTHING;
WITH budget AS (SELECT CASE WHEN jsonb_typeof(value)='number' AND value::text ~ '^[0-9]+$' THEN least(value::text::numeric,${cap}) ELSE 0 END AS cap FROM newsroom_config WHERE key=${budgetKey}), updated AS (
UPDATE newsroom_config SET value=to_jsonb((value::text)::bigint+${amount}),updated_at=now() WHERE key=${key} AND (value::text)::bigint+${amount} <= coalesce((SELECT cap FROM budget),least(${fallback},${cap})) RETURNING 1)
SELECT count(*) FROM updated;
COMMIT;`);
      return output.split('\n').some(line=>line.trim()==='1');
    },
    seed({entities,keywords,sources=[]}) {
      execute(`BEGIN;
${sources.length ? `INSERT INTO sources(id,platform,name,url,access_method,role,tier,status,poll_seconds,enabled,verified_official,verified_via)
SELECT id,platform,name,url,access_method,role,tier,status,poll_seconds,enabled,verified_official,verified_via FROM jsonb_to_recordset(${json(sources)}) AS s(id text,platform text,name text,url text,access_method text,role text,tier smallint,status text,poll_seconds integer,enabled boolean,verified_official boolean,verified_via text) ON CONFLICT(id) DO NOTHING;` : ''}
INSERT INTO watchlist_entities(id,kind,display_name,aliases,official_urls,accounts,addresses,role_note,priority,status)
SELECT id,kind,display_name,aliases,official_urls,accounts,addresses,role_note,priority,status FROM jsonb_to_recordset(${json(entities)}) AS e(id text,kind text,display_name jsonb,aliases text[],official_urls text[],accounts jsonb,addresses jsonb,role_note text,priority smallint,status text)
ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name,aliases=excluded.aliases,official_urls=excluded.official_urls,accounts=excluded.accounts,role_note=excluded.role_note;
INSERT INTO keywords(term,lang,event_type,weight,status,added_by)
SELECT term,lang,event_type,weight,status,'verified-watchlist-import' FROM jsonb_to_recordset(${json(keywords)}) AS k(term text,lang text,event_type text,weight real,status text)
ON CONFLICT(term,lang) DO NOTHING;
INSERT INTO newsroom_config(key,value) VALUES ('x_daily_read_budget','0'),('youtube_daily_unit_budget','2000') ON CONFLICT(key) DO NOTHING;
COMMIT;`);
    },
  };
}
