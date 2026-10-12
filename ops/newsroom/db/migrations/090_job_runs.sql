-- Scheduler run log for the BaoTa deployment (T6). One row per scheduled job run.
create table if not exists job_runs (
  id bigserial primary key,
  job text not null,
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  exit_code int not null,
  duration_ms int,
  note text
);

create index if not exists idx_job_runs_job_started_desc on job_runs (job, started_at desc);
