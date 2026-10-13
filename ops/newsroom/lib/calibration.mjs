export const DEFAULT_CALIBRATION_THRESHOLDS = [40, 45, 50, 55];
export const DEFAULT_CALIBRATION_WINDOW_HOURS = 72;
export const DEFAULT_CALIBRATION_TARGET_PER_DAY = 40;

export function buildCalibrationQuery({
  thresholds = DEFAULT_CALIBRATION_THRESHOLDS,
  windowHours = DEFAULT_CALIBRATION_WINDOW_HOURS,
  targetPerDay = DEFAULT_CALIBRATION_TARGET_PER_DAY,
} = {}) {
  if (!Array.isArray(thresholds) || thresholds.length === 0) throw new Error('calibration thresholds required');
  if (!Number.isInteger(windowHours) || windowHours < 1 || windowHours > 24 * 30) throw new Error('invalid calibration window');
  if (!Number.isInteger(targetPerDay) || targetPerDay < 1 || targetPerDay > 500) throw new Error('invalid calibration target');
  const normalizedThresholds = thresholds.map(value => {
    if (!Number.isInteger(value) || value < 0 || value > 100) throw new Error('invalid calibration threshold');
    return value;
  });
  return `WITH threshold_values(threshold) AS (
  VALUES ${normalizedThresholds.map(value => `(${value})`).join(', ')}
),
latest_scores AS (
  SELECT DISTINCT ON (event_id) *
  FROM event_scores
  ORDER BY event_id, scored_at DESC
),
calibration_events AS (
  SELECT
    e.id,
    (coalesce(e.source_published_at, e.first_seen_at) AT TIME ZONE 'UTC')::date AS event_day,
    coalesce(e.source_published_at, e.first_seen_at) AS source_time,
    s.editorial_score,
    s.relevance,
    s.credibility,
    coalesce((s.explain->>'required_credibility_for_publish')::int, 2) AS required_credibility
  FROM events e
  JOIN latest_scores s ON s.event_id=e.id
  WHERE e.state IN ('new','candidate','claimed','published','followup_watch')
    AND coalesce(e.source_published_at, e.first_seen_at) >= now() - interval '${windowHours} hours'
    AND coalesce(e.source_published_at, e.first_seen_at) <= now()
    AND e.verification_status IN ('verified-primary','corroborated')
    AND e.verified_at >= e.last_update_at
    AND s.scored_at >= e.last_update_at
    AND s.relevance > 0
    AND NOT EXISTS (SELECT 1 FROM review_queue q WHERE q.event_id=e.id AND q.resolved_at IS NULL)
),
days AS (
  SELECT generate_series(((now() - interval '${windowHours} hours') AT TIME ZONE 'UTC')::date, (now() AT TIME ZONE 'UTC')::date, interval '1 day')::date AS event_day
),
counts AS (
  SELECT
    d.event_day,
    t.threshold,
    count(c.id) FILTER (WHERE c.editorial_score >= t.threshold AND c.credibility >= c.required_credibility) AS eligible
  FROM days d
  CROSS JOIN threshold_values t
  LEFT JOIN calibration_events c ON c.event_day=d.event_day
  GROUP BY d.event_day, t.threshold
),
coverage AS (
  -- A pool younger than the window would otherwise be averaged over days it never collected.
  SELECT greatest(1, least(${windowHours}::numeric,
    extract(epoch FROM now() - coalesce((SELECT min(fetched_at) FROM raw_items), now() - interval '${windowHours} hours')) / 3600))::numeric AS hours
),
threshold_summary AS (
  SELECT threshold, sum(eligible) AS eligible_total,
    round((sum(eligible)::numeric / ((SELECT hours FROM coverage) / 24)), 2) AS eligible_per_day
  FROM counts
  GROUP BY threshold
),
day_rows AS (
  SELECT event_day, jsonb_object_agg(threshold::text, eligible ORDER BY threshold) AS eligible_by_threshold
  FROM counts
  GROUP BY event_day
)
SELECT jsonb_build_object(
  'schema', 'newsroom.calibration.v1',
  'generated_at', now(),
  'window_hours', ${windowHours},
  'coverage_hours', (SELECT round(hours, 1) FROM coverage),
  'target_per_day', ${targetPerDay},
  'thresholds', (SELECT jsonb_agg(threshold ORDER BY threshold) FROM threshold_values),
  'summary', (SELECT jsonb_object_agg(threshold::text, jsonb_build_object(
      'eligible_total', eligible_total,
      'eligible_per_day', eligible_per_day,
      'delta_vs_target_per_day', eligible_per_day - ${targetPerDay}
    ) ORDER BY threshold) FROM threshold_summary),
  'days', (SELECT coalesce(jsonb_agg(jsonb_build_object('day', event_day, 'eligible_by_threshold', eligible_by_threshold) ORDER BY event_day), '[]'::jsonb) FROM day_rows),
  'note', 'Read-only threshold calibration over latest scored verified/corroborated events, including already claimed/published events; article gates and writer capacity still apply.'
);`;
}

export function runCalibration(execute, options = {}) {
  return execute(buildCalibrationQuery(options));
}
