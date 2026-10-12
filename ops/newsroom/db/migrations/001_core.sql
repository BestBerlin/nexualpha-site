create extension if not exists pg_trgm;

create table if not exists sources (
  id text primary key,
  platform text not null,
  name text not null,
  url text not null,
  topics text[] not null default '{}',
  access_method text not null,
  role text not null check (role in ('lead','verification','data')),
  tier smallint not null default 2,
  status text not null check (status in ('connected','partial','missing-authorization','temporarily-failing')),
  poll_seconds int not null default 600,
  cost_note text,
  quota_per_day int,
  used_today int default 0,
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  consecutive_failures int not null default 0,
  fallback_source_id text references sources(id),
  enabled boolean not null default true,
  verified_official boolean not null default false,
  verified_via text,
  verified_at date
);

create table if not exists watchlist_entities (
  id text primary key,
  kind text not null,
  display_name jsonb not null,
  aliases text[] not null default '{}',
  role_note text,
  role_verified_at date,
  official_urls text[] not null default '{}',
  accounts jsonb not null default '{}',
  addresses jsonb not null default '[]',
  partner_slug text,
  priority smallint not null default 2,
  status text not null default 'active' check (status in ('active','candidate','retired')),
  discovered_from text,
  discovered_at timestamptz
);

create table if not exists keywords (
  id serial primary key,
  term text not null,
  lang text not null,
  event_type text,
  entity_id text references watchlist_entities(id),
  weight real not null default 1,
  status text not null default 'active',
  added_by text,
  added_at timestamptz default now(),
  unique(term, lang)
);

create table if not exists raw_items (
  id bigserial primary key,
  source_id text not null references sources(id),
  external_id text not null,
  url text not null,
  canonical_url text,
  origin_item_id bigint references raw_items(id),
  author text,
  author_account text,
  title text,
  body_excerpt text,
  lang text,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  metrics jsonb,
  metrics_at timestamptz,
  entities text[] not null default '{}',
  event_type_guess text,
  simhash bigint,
  content_hash text,
  event_id bigint,
  unique(source_id, external_id)
);

create index if not exists idx_raw_items_published_at_desc on raw_items (published_at desc);
create index if not exists idx_raw_items_title_trgm on raw_items using gin (title gin_trgm_ops);
create index if not exists idx_raw_items_event_id on raw_items (event_id);

create table if not exists events (
  id bigserial primary key,
  subject_entity text references watchlist_entities(id),
  subjects text[] not null default '{}',
  event_type text not null,
  title_internal text not null,
  occurred_at timestamptz,
  source_published_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_update_at timestamptz not null default now(),
  original_links text[] not null default '{}',
  fact_summary text,
  discussion jsonb,
  verification_status text not null default 'unverified'
     check (verification_status in ('unverified','partially_verified','verified','conflicting','debunked')),
  credibility smallint not null default 0,
  state text not null default 'new'
     check (state in ('new','candidate','claimed','in_review','published','followup_watch','rejected','expired')),
  reject_reason text,
  claimed_by text,
  claimed_at timestamptz,
  next_recheck_at timestamptz,
  parent_event_id bigint references events(id)
);

create index if not exists idx_events_state_last_update_desc on events (state, last_update_at desc);

create table if not exists event_evidence (
  id bigserial primary key,
  event_id bigint not null references events(id),
  raw_item_id bigint references raw_items(id),
  url text not null,
  kind text not null check (kind in ('official_notice','original_statement','filing','court_record','onchain_tx','market_data','media_report','social_post','video')),
  is_independent boolean not null default true,
  origin_key text,
  excerpt text,
  author_account text,
  published_at timestamptz,
  supports text,
  confidence text check (confidence in ('high','medium','low')),
  label_source text,
  checked_at timestamptz default now()
);

create table if not exists event_scores (
  event_id bigint not null references events(id),
  scored_at timestamptz not null default now(),
  relevance smallint,
  heat smallint,
  timeliness smallint,
  new_info smallint,
  impact smallint,
  weights jsonb not null,
  editorial_score real not null,
  credibility smallint not null,
  priority_override text,
  explain jsonb,
  primary key (event_id, scored_at)
);

create table if not exists articles (
  slug text primary key,
  event_id bigint references events(id),
  lane text not null check (lane in ('event','search_intent','followup','legacy')),
  format text check (format in ('flash','breakdown','quote_check','dispute','data_explainer','followup','guide')),
  main_question text,
  publish_slot timestamptz,
  published_at timestamptz,
  locales text[] not null default '{en,zh-Hans}',
  gate_result jsonb,
  human_reviewed_by text,
  human_reviewed_at timestamptz,
  states jsonb,
  indexed_at timestamptz,
  inspected_at timestamptz,
  coverage_state text
);

create table if not exists article_metrics (
  slug text references articles(slug),
  day date,
  locale text default 'en',
  impressions int,
  clicks int,
  position real,
  cta_clicks int,
  primary key (slug, day, locale)
);

create table if not exists promotions (
  id text primary key,
  partner_slug text not null,
  kind text not null check (kind in ('referral','campaign','product')),
  official_basis_url text not null,
  code text,
  link text not null,
  share_pct real,
  regions_allowed text[],
  regions_blocked text[] not null default '{}',
  locales_neutral text[] not null default '{ru,ar,zh-Hant,uk,ur}',
  conditions jsonb,
  valid_from timestamptz,
  valid_until timestamptz,
  last_verified_at timestamptz,
  link_status text not null default 'unknown' check (link_status in ('ok','broken','redirect_changed','unknown')),
  link_checked_at timestamptz,
  link_failures int not null default 0,
  partnership_confirmed boolean not null default false,
  enabled boolean not null default true,
  auto_disabled_reason text,
  auto_disabled_at timestamptz
);

create table if not exists article_ctas (
  slug text references articles(slug),
  position text check (position in ('body_1','body_2','end_card','rail','mobile_card')),
  intent text not null,
  promotion_id text references promotions(id),
  fallback_href text not null,
  primary key (slug, position)
);

create table if not exists review_queue (
  id bigserial primary key,
  event_id bigint references events(id),
  slug text,
  reason text not null,
  rule_ids text[] not null,
  created_at timestamptz default now(),
  resolved_at timestamptz,
  resolution text
);

create table if not exists shortfall_log (
  day date,
  slot timestamptz,
  wanted int,
  eligible int,
  published int,
  note text,
  primary key (day, slot)
);

create table if not exists newsroom_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
