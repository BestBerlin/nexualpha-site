update sources
set
  url = 'https://www.panewslab.com/rss.xml?lang=en&type=NEWS',
  cost_note = 'Free RSS; official generator page exposes rss.xml?lang=en&type=NEWS, while the previous rss/index.xml now returns 404.',
  status = case
    when last_success_at is null or last_success_at < '2026-10-12T14:47:57Z'::timestamptz then 'connected'
    else status
  end,
  last_error = case
    when last_success_at is null or last_success_at < '2026-10-12T14:47:57Z'::timestamptz then null
    else last_error
  end,
  last_error_at = case
    when last_success_at is null or last_success_at < '2026-10-12T14:47:57Z'::timestamptz then null
    else last_error_at
  end,
  consecutive_failures = case
    when last_success_at is null or last_success_at < '2026-10-12T14:47:57Z'::timestamptz then 0
    else consecutive_failures
  end
where id = 'panews-rss'
  and url = 'https://www.panewslab.com/rss/index.xml';

update sources
set
  url = 'https://rss.odaily.news/rss/newsflash',
  cost_note = 'Free RSS from Odaily''s official RSS repository; the previous www.odaily.news/rss/newsflash path now returns 404.',
  fallback_source_id = null,
  status = case
    when last_success_at is null or last_success_at < '2026-10-12T14:47:57Z'::timestamptz then 'connected'
    else status
  end,
  last_error = case
    when last_success_at is null or last_success_at < '2026-10-12T14:47:57Z'::timestamptz then null
    else last_error
  end,
  last_error_at = case
    when last_success_at is null or last_success_at < '2026-10-12T14:47:57Z'::timestamptz then null
    else last_error_at
  end,
  consecutive_failures = case
    when last_success_at is null or last_success_at < '2026-10-12T14:47:57Z'::timestamptz then 0
    else consecutive_failures
  end
where id = 'odaily-newsflash-rss'
  and url = 'https://www.odaily.news/rss/newsflash';
