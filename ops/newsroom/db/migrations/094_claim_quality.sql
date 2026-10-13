-- Additive claim-quality fields for freshness deadlines and cross-venue story grouping.
alter table events add column if not exists effective_at timestamptz;
alter table events add column if not exists deadline_at timestamptz;
alter table events add column if not exists major_followup_at timestamptz;
alter table events add column if not exists story_asset text;
alter table events add column if not exists story_action text;
alter table events add column if not exists story_group_key text;

create index if not exists idx_events_claim_deadline on events(deadline_at) where state in ('new','candidate');
create index if not exists idx_events_story_group on events(story_group_key, source_published_at) where story_group_key is not null;

insert into newsroom_config(key,value) values ('claim_quality','{
  "default_freshness_hours": 48,
  "freshness_hours_by_type": {
    "flash": 12,
    "liquidation_wave": 6,
    "price_move": 6,
    "listing": 48,
    "delisting": 48
  },
  "story_window_days": 7,
  "market_story_cadence_hours": 6,
  "liquidation_usd_1h_min": 50000000,
  "major_coin_price_move_pct_1h_min": 3
}'::jsonb) on conflict(key) do nothing;
