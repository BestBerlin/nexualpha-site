-- A writer's completion receipt is not evidence of readability or indexing.
alter table articles add column if not exists published_url text;
