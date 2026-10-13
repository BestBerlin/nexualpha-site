import { claimEligibilitySql, claimRankSql } from '../lib/pipeline.mjs';
import { claimFreshnessRankSql, claimStoryGroupKeySql, claimStoryVenueJsonSql, claimStoryWindowSql } from '../lib/claim-quality.mjs';

const lit = value => `'${String(value).replaceAll("'", "''")}'`;
const rank = claimRankSql();
const groupKey = claimStoryGroupKeySql();
const freshnessRank = claimFreshnessRankSql();
const storyWindow = claimStoryWindowSql();

export function claimQuery(limit, writer) {
  return `BEGIN;
SELECT pg_advisory_xact_lock(20261012,5);
UPDATE events SET state='new', claimed_by=NULL, claimed_at=NULL
WHERE state='claimed' AND claimed_at < now() - interval '90 minutes';
WITH eligible AS (
  SELECT e.id, e.event_type, e.source_published_at, e.occurred_at, e.first_seen_at, ${groupKey} AS story_group_key, ${freshnessRank} AS freshness_rank,
    s.editorial_score, s.priority_override
  FROM events e
  JOIN LATERAL (SELECT * FROM event_scores WHERE event_id=e.id ORDER BY scored_at DESC LIMIT 1) s ON true
  WHERE ${claimEligibilitySql()}
    AND NOT EXISTS (
      SELECT 1 FROM events existing
      WHERE existing.id<>e.id
        AND existing.state IN ('claimed','published','followup_watch')
        AND ${claimStoryGroupKeySql({ eventAlias: 'existing' })}=${claimStoryGroupKeySql({ eventAlias: 'e' })}
        AND abs(extract(epoch from (coalesce(existing.source_published_at, existing.occurred_at, existing.first_seen_at) - coalesce(e.source_published_at, e.occurred_at, e.first_seen_at)))) <= extract(epoch from ${storyWindow})
    )
  ORDER BY ${rank}
), story_heads AS (
  SELECT candidate.*
  FROM eligible candidate
  WHERE NOT EXISTS (
    SELECT 1 FROM eligible better
    WHERE better.story_group_key=candidate.story_group_key
      AND abs(extract(epoch from (coalesce(better.source_published_at, better.occurred_at, better.first_seen_at) - coalesce(candidate.source_published_at, candidate.occurred_at, candidate.first_seen_at)))) <= extract(epoch from ${storyWindow})
      AND (
        better.freshness_rank > candidate.freshness_rank
        OR (better.freshness_rank = candidate.freshness_rank AND better.editorial_score > candidate.editorial_score)
        OR (better.freshness_rank = candidate.freshness_rank AND better.editorial_score = candidate.editorial_score AND coalesce((better.priority_override='official_major')::int,0) > coalesce((candidate.priority_override='official_major')::int,0))
        OR (better.freshness_rank = candidate.freshness_rank AND better.editorial_score = candidate.editorial_score AND coalesce((better.priority_override='official_major')::int,0) = coalesce((candidate.priority_override='official_major')::int,0) AND better.source_published_at > candidate.source_published_at)
        OR (better.freshness_rank = candidate.freshness_rank AND better.editorial_score = candidate.editorial_score AND coalesce((better.priority_override='official_major')::int,0) = coalesce((candidate.priority_override='official_major')::int,0) AND better.source_published_at IS NOT DISTINCT FROM candidate.source_published_at AND better.id < candidate.id)
      )
  )
), throttled_heads AS (
  SELECT *, row_number() OVER (
    PARTITION BY CASE WHEN event_type IN ('liquidation_wave','price_move') THEN 'market-story' ELSE 'head:' || id::text END
    ORDER BY freshness_rank DESC, editorial_score DESC, coalesce((priority_override='official_major')::int,0) DESC, source_published_at DESC NULLS LAST, id
  ) AS cadence_rank
  FROM story_heads
), selected AS (
  SELECT id, story_group_key FROM throttled_heads
  WHERE cadence_rank=1
  ORDER BY freshness_rank DESC, editorial_score DESC, (priority_override='official_major') DESC NULLS LAST, source_published_at DESC NULLS LAST, id
  LIMIT ${limit}
), claimed AS (
  UPDATE events e SET state='claimed', claimed_by=${lit(writer)}, claimed_at=now()
  FROM selected
  JOIN eligible anchor ON anchor.id=selected.id
  JOIN eligible member ON member.story_group_key=selected.story_group_key
    AND abs(extract(epoch from (coalesce(member.source_published_at, member.occurred_at, member.first_seen_at) - coalesce(anchor.source_published_at, anchor.occurred_at, anchor.first_seen_at)))) <= extract(epoch from ${storyWindow})
  WHERE e.id=member.id AND e.state IN ('new','candidate')
  RETURNING e.*
), claimed_heads AS (
  SELECT claimed.* FROM claimed JOIN selected ON claimed.id=selected.id
), shortfall AS (
  INSERT INTO shortfall_log(day,slot,wanted,eligible,published,note)
  SELECT (now() AT TIME ZONE 'Asia/Shanghai')::date,now(),${limit},count(*)::int,0,${lit(`Writer ${writer}: fewer eligible story groups than requested`)}
  FROM selected HAVING count(*) < ${limit}
  ON CONFLICT(day,slot) DO UPDATE SET wanted=excluded.wanted,eligible=excluded.eligible,published=excluded.published,note=excluded.note
)
SELECT coalesce(jsonb_agg(to_jsonb(e) || jsonb_build_object(
  'score',to_jsonb(s),
  'claim_rank_score', ${claimFreshnessRankSql({ eventAlias: 'e', scoreAlias: 's' })},
  'entities',coalesce((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.id) FROM watchlist_entities w WHERE w.id=e.subject_entity OR w.id=ANY(e.subjects)), '[]'::jsonb),
  'story_group_key', ${claimStoryGroupKeySql({ eventAlias: 'e' })},
  'story_event_ids', coalesce((SELECT jsonb_agg(related_event.id ORDER BY related_event.source_published_at, related_event.id)
    FROM claimed related_event
    WHERE ${claimStoryGroupKeySql({ eventAlias: 'related_event' })}=${claimStoryGroupKeySql({ eventAlias: 'e' })}
      AND abs(extract(epoch from (coalesce(related_event.source_published_at, related_event.occurred_at, related_event.first_seen_at) - coalesce(e.source_published_at, e.occurred_at, e.first_seen_at)))) <= extract(epoch from ${storyWindow})
  ), '[]'::jsonb),
  'venues', coalesce((SELECT jsonb_agg(DISTINCT story_venue.name)
    FROM claimed related_event
    CROSS JOIN LATERAL jsonb_array_elements_text(${claimStoryVenueJsonSql({ eventAlias: 'related_event' })}) AS story_venue(name)
    WHERE ${claimStoryGroupKeySql({ eventAlias: 'related_event' })}=${claimStoryGroupKeySql({ eventAlias: 'e' })}
      AND story_venue.name IS NOT NULL AND story_venue.name <> ''
      AND abs(extract(epoch from (coalesce(related_event.source_published_at, related_event.occurred_at, related_event.first_seen_at) - coalesce(e.source_published_at, e.occurred_at, e.first_seen_at)))) <= extract(epoch from ${storyWindow})
  ), '[]'::jsonb),
  'story', jsonb_build_object(
    'story_group_key', ${claimStoryGroupKeySql({ eventAlias: 'e' })},
    'story_event_ids', coalesce((SELECT jsonb_agg(related_event.id ORDER BY related_event.source_published_at, related_event.id) FROM claimed related_event
      WHERE ${claimStoryGroupKeySql({ eventAlias: 'related_event' })}=${claimStoryGroupKeySql({ eventAlias: 'e' })}
        AND abs(extract(epoch from (coalesce(related_event.source_published_at, related_event.occurred_at, related_event.first_seen_at) - coalesce(e.source_published_at, e.occurred_at, e.first_seen_at)))) <= extract(epoch from ${storyWindow})
    ), '[]'::jsonb),
    'venues', coalesce((SELECT jsonb_agg(DISTINCT story_venue.name) FROM claimed related_event
      CROSS JOIN LATERAL jsonb_array_elements_text(${claimStoryVenueJsonSql({ eventAlias: 'related_event' })}) AS story_venue(name)
      WHERE ${claimStoryGroupKeySql({ eventAlias: 'related_event' })}=${claimStoryGroupKeySql({ eventAlias: 'e' })}
        AND story_venue.name IS NOT NULL AND story_venue.name <> ''
        AND abs(extract(epoch from (coalesce(related_event.source_published_at, related_event.occurred_at, related_event.first_seen_at) - coalesce(e.source_published_at, e.occurred_at, e.first_seen_at)))) <= extract(epoch from ${storyWindow})
    ), '[]'::jsonb)
  ),
  'evidence',coalesce((SELECT jsonb_agg(to_jsonb(v) || jsonb_build_object('source_id', r.source_id, 'source_tier', so.tier, 'source_status', so.status, 'source_platform', so.platform) ORDER BY v.id)
    FROM event_evidence v
    JOIN claimed related_event ON related_event.id=v.event_id
    LEFT JOIN raw_items r ON r.id=v.raw_item_id
    LEFT JOIN sources so ON so.id=r.source_id
    WHERE ${claimStoryGroupKeySql({ eventAlias: 'related_event' })}=${claimStoryGroupKeySql({ eventAlias: 'e' })}
      AND abs(extract(epoch from (coalesce(related_event.source_published_at, related_event.occurred_at, related_event.first_seen_at) - coalesce(e.source_published_at, e.occurred_at, e.first_seen_at)))) <= extract(epoch from ${storyWindow})
  ),'[]'::jsonb),
  'related_articles',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.slug) FROM articles a WHERE a.event_id=e.id OR a.states->'story_event_ids' @> jsonb_build_array(e.id)),'[]'::jsonb)
) ORDER BY ${rank}), '[]'::jsonb)
FROM claimed_heads e JOIN LATERAL (SELECT * FROM event_scores WHERE event_id=e.id ORDER BY scored_at DESC LIMIT 1) s ON true;
COMMIT;`;
}

export function releaseQuery(id, writer) {
  return `WITH target AS (
    SELECT id, ${claimStoryGroupKeySql()} AS story_group_key, source_published_at, occurred_at, first_seen_at FROM events e
    WHERE id=${id} AND state='claimed'${writer ? ` AND claimed_by=${lit(writer)}` : ''}
  ), result AS (UPDATE events e SET state='new',claimed_by=NULL,claimed_at=NULL
    FROM target
    WHERE e.state='claimed'${writer ? ` AND e.claimed_by=${lit(writer)}` : ''}
      AND (${claimStoryGroupKeySql({ eventAlias: 'e' })}=target.story_group_key
        AND abs(extract(epoch from (coalesce(e.source_published_at, e.occurred_at, e.first_seen_at) - coalesce(target.source_published_at, target.occurred_at, target.first_seen_at)))) <= extract(epoch from ${storyWindow}))
    RETURNING e.*)
    SELECT coalesce(jsonb_agg(to_jsonb(result)),'[]'::jsonb) FROM result;`;
}

export function completeQuery(id, { article, url, writer }) {
  // A slug already owned by any article is a constraint error; the event update rolls back.
  return `WITH anchor AS (
    SELECT id, ${claimStoryGroupKeySql()} AS story_group_key, source_published_at, occurred_at, first_seen_at FROM events e
    WHERE id=${id} AND state='claimed' AND claimed_at >= now() - interval '90 minutes'
    ${writer ? `AND claimed_by=${lit(writer)}` : ''}
  ), target AS (
    UPDATE events e SET state='published',claimed_by=NULL,claimed_at=NULL
    FROM anchor
    WHERE e.state='claimed' AND e.claimed_at >= now() - interval '90 minutes'
      ${writer ? `AND e.claimed_by=${lit(writer)}` : ''}
      AND (${claimStoryGroupKeySql({ eventAlias: 'e' })}=anchor.story_group_key
        AND abs(extract(epoch from (coalesce(e.source_published_at, e.occurred_at, e.first_seen_at) - coalesce(anchor.source_published_at, anchor.occurred_at, anchor.first_seen_at)))) <= extract(epoch from ${storyWindow}))
    RETURNING e.id
  ), registered AS (
    INSERT INTO articles(slug,event_id,lane,published_at,published_url,states)
    SELECT ${lit(article)},(SELECT id FROM anchor),'event',now(),${lit(url)},
      jsonb_build_object('story_event_ids', coalesce((SELECT jsonb_agg(id ORDER BY id) FROM target), '[]'::jsonb))
    FROM anchor WHERE EXISTS (SELECT 1 FROM target) RETURNING *
  ) SELECT coalesce(jsonb_agg(to_jsonb(registered)),'[]'::jsonb) FROM registered;`;
}
