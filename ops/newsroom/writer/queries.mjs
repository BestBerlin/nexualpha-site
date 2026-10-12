import { publishEligibilitySql } from '../lib/pipeline.mjs';

const lit = value => `'${String(value).replaceAll("'", "''")}'`;
const rank = `(s.priority_override='official_major') DESC NULLS LAST, s.editorial_score DESC, e.source_published_at DESC NULLS LAST, e.id`;

export function claimQuery(limit, writer) {
  return `BEGIN;
UPDATE events SET state='new', claimed_by=NULL, claimed_at=NULL
WHERE state='claimed' AND claimed_at < now() - interval '90 minutes';
WITH selected AS (
  SELECT e.id FROM events e
  JOIN LATERAL (SELECT * FROM event_scores WHERE event_id=e.id ORDER BY scored_at DESC LIMIT 1) s ON true
  WHERE ${publishEligibilitySql()}
  ORDER BY ${rank} LIMIT ${limit} FOR UPDATE OF e SKIP LOCKED
), claimed AS (
  UPDATE events e SET state='claimed', claimed_by=${lit(writer)}, claimed_at=now()
  FROM selected WHERE e.id=selected.id RETURNING e.*
), shortfall AS (
  INSERT INTO shortfall_log(day,slot,wanted,eligible,published,note)
  SELECT (now() AT TIME ZONE 'Asia/Shanghai')::date,now(),${limit},count(*)::int,0,${lit(`Writer ${writer}: fewer eligible events than requested`)}
  FROM claimed HAVING count(*) < ${limit}
  ON CONFLICT(day,slot) DO UPDATE SET wanted=excluded.wanted,eligible=excluded.eligible,published=excluded.published,note=excluded.note
)
SELECT coalesce(jsonb_agg(to_jsonb(e) || jsonb_build_object(
  'score',to_jsonb(s),
  'entities',coalesce((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.id) FROM watchlist_entities w WHERE w.id=e.subject_entity OR w.id=ANY(e.subjects)), '[]'::jsonb),
  'evidence',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.id) FROM event_evidence v WHERE v.event_id=e.id),'[]'::jsonb),
  'related_articles',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.slug) FROM articles a WHERE a.event_id=e.id),'[]'::jsonb)
) ORDER BY ${rank}), '[]'::jsonb)
FROM claimed e JOIN LATERAL (SELECT * FROM event_scores WHERE event_id=e.id ORDER BY scored_at DESC LIMIT 1) s ON true;
COMMIT;`;
}

export function releaseQuery(id, writer) {
  return `WITH result AS (UPDATE events SET state='new',claimed_by=NULL,claimed_at=NULL
    WHERE id=${id} AND state='claimed'${writer ? ` AND claimed_by=${lit(writer)}` : ''} RETURNING *)
    SELECT coalesce(jsonb_agg(to_jsonb(result)),'[]'::jsonb) FROM result;`;
}

export function completeQuery(id, { article, url, writer }) {
  // A slug already owned by any article is a constraint error; the event update rolls back.
  return `WITH target AS (
    UPDATE events SET state='published',claimed_by=NULL,claimed_at=NULL
    WHERE id=${id} AND state='claimed' AND claimed_at >= now() - interval '90 minutes'
    ${writer ? `AND claimed_by=${lit(writer)}` : ''} RETURNING id
  ), registered AS (
    INSERT INTO articles(slug,event_id,lane,published_at,published_url)
    SELECT ${lit(article)},id,'event',now(),${lit(url)} FROM target RETURNING *
  ) SELECT coalesce(jsonb_agg(to_jsonb(registered)),'[]'::jsonb) FROM registered;`;
}
