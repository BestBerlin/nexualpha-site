-- Backfill claim-quality metadata from already captured raw item facts and market metrics.
-- Missing hidden exchange assets stay review-only until a later body capture supplies details.
with item_facts as (
  select
    r.event_id,
    upper(case
      when coalesce(r.metrics->'tickers'->>0, r.metrics->'assets'->>0, r.metrics->'asset_symbols'->>0, '') ~ '.{2,}(USDT|USDC|USD)$'
        then regexp_replace(coalesce(r.metrics->'tickers'->>0, r.metrics->'assets'->>0, r.metrics->'asset_symbols'->>0, ''), '(USDT|USDC|USD)$', '')
      else coalesce(r.metrics->'tickers'->>0, r.metrics->'assets'->>0, r.metrics->'asset_symbols'->>0, '')
    end) as asset,
    r.event_type_guess as action,
    (r.metrics->>'effective_at')::timestamptz as effective_at,
    coalesce((r.metrics->>'deadline_at')::timestamptz, (r.metrics->>'campaign_end_at')::timestamptz) as deadline_at,
    case
      when r.event_type_guess='liquidation_wave' and r.metrics->'provenance'->>'window'='h1' and coalesce(r.metrics->>'total_liquidations_usd','') ~ '^-?[0-9]+(\.[0-9]+)?$' then (r.metrics->>'total_liquidations_usd')::numeric
      else null
    end as liquidations_usd_1h,
    case
      when r.event_type_guess='liquidation_wave' and r.metrics->'provenance'->>'window'='h24' and coalesce(r.metrics->>'total_liquidations_usd','') ~ '^-?[0-9]+(\.[0-9]+)?$' then (r.metrics->>'total_liquidations_usd')::numeric
      else null
    end as liquidations_usd_24h,
    case
      when coalesce(r.metrics->>'price_move_pct_1h', r.metrics->>'price_change_pct_1h', r.metrics->>'change_pct_1h', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
        then coalesce(r.metrics->>'price_move_pct_1h', r.metrics->>'price_change_pct_1h', r.metrics->>'change_pct_1h')::numeric
      else null
    end as price_move_pct_1h,
    nullif((regexp_match(r.source_id, '^(binance|okx|bybit|bitget|coinbase|kucoin|kraken)-(announcements|status)$'))[1], '') as venue
  from raw_items r
  where r.event_id is not null
), per_event as (
  select
    event_id,
    nullif((array_agg(asset order by asset) filter (where asset <> ''))[1], '') as story_asset,
    (array_agg(action order by action) filter (where action in ('listing','delisting','price_move','liquidation_wave')))[1] as story_action,
    min(effective_at) as effective_at,
    min(deadline_at) as deadline_at,
    max(liquidations_usd_1h) as liquidations_usd_1h,
    max(liquidations_usd_24h) as liquidations_usd_24h,
    max(abs(price_move_pct_1h)) as price_move_pct_1h,
    coalesce(jsonb_agg(distinct venue) filter (where venue is not null), '[]'::jsonb) as story_venues
  from item_facts
  group by event_id
)
update events e
set
  story_asset=coalesce(e.story_asset, per_event.story_asset),
  story_action=coalesce(e.story_action, per_event.story_action, e.event_type),
  story_group_key=coalesce(e.story_group_key,
    case when coalesce(e.story_asset, per_event.story_asset) is not null
      then concat_ws(':', coalesce(e.story_action, per_event.story_action, e.event_type), lower(coalesce(e.story_asset, per_event.story_asset)))
      else null end),
  effective_at=coalesce(e.effective_at, per_event.effective_at),
  deadline_at=coalesce(e.deadline_at, per_event.deadline_at),
  discussion=jsonb_strip_nulls(coalesce(e.discussion, '{}'::jsonb)
    || jsonb_build_object(
      'asset', coalesce(e.story_asset, per_event.story_asset),
      'action', coalesce(e.story_action, per_event.story_action),
      'story_venues', case when jsonb_array_length(per_event.story_venues) > 0 then per_event.story_venues else null end
    )
    || case when jsonb_strip_nulls(jsonb_build_object(
        'liquidations_usd_1h', per_event.liquidations_usd_1h,
        'liquidations_usd_24h', per_event.liquidations_usd_24h,
        'price_move_pct_1h', per_event.price_move_pct_1h
      )) = '{}'::jsonb then '{}'::jsonb else jsonb_build_object(
        'market', coalesce(e.discussion->'market', '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
          'liquidations_usd_1h', per_event.liquidations_usd_1h,
          'liquidations_usd_24h', per_event.liquidations_usd_24h,
          'price_move_pct_1h', per_event.price_move_pct_1h
        ))
      ) end)
from per_event
where e.id=per_event.event_id;

update events e
set verification_status='needs-review', verified_at=null, last_update_at=now()
where e.event_type in ('listing','delisting')
  and e.story_asset is null
  and e.title_internal ~* '(token\(s\)|[0-9]+\s+tokens?|trading pairs?)'
  and e.verification_status in ('verified-primary','corroborated','verified','partially_verified','unverified');
