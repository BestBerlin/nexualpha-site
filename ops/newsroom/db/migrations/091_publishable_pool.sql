-- Re-runnable upgrade; a durable work queue avoids timestamp cursor races/backlog loss.
alter table raw_items add column if not exists state text not null default 'pending'
  check (state in ('pending','processed','irrelevant'));
update raw_items set state='processed' where event_id is not null and state='pending';
create index if not exists idx_raw_items_origin_item_id on raw_items(origin_item_id);
create index if not exists idx_raw_items_fetched_at on raw_items(fetched_at);
create index if not exists idx_raw_items_pending on raw_items(id) where state='pending' and event_id is null;
create index if not exists idx_event_evidence_event_id on event_evidence(event_id);
create index if not exists idx_event_scores_score on event_scores(editorial_score desc, event_id);
-- state/last_update is already indexed by 001; scores live in event_scores.
alter table events drop constraint if exists events_verification_status_check;
alter table events add constraint events_verification_status_check check
  (verification_status in ('unverified','partially_verified','verified','conflicting','debunked','verified-primary','corroborated','needs-review'));
alter table events add column if not exists verified_at timestamptz;

-- Existing mirror rows are not independent evidence either.
update event_evidence v set is_independent=false from raw_items r
where r.id=v.raw_item_id and (
  r.source_id like 'nexualpha-official%'
  or r.source_id='telegram-nexualphaclub-preview'
  or r.url ~* '^https://t\.me/(s/)?NexuAlphaClub(/|$)'
);
