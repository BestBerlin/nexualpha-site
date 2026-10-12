#!/usr/bin/env python3
# NexuAlpha official-announcement archive, host-side merge (2026-10-12).
# Merges the live feed https://nexualpha.com/intel/official-announcements.json into the append-only archive that the
# web container mounts at /intel-state (INTEL_ARCHIVE_FILE). The web server merges every refresh itself; this cron is the
# safety net for releases that predate the archive code and for container restarts. Same rules as
# pilot-01-prototype/src/data/announcement-archive.js: keyed by id, 400-day retention by publishedAt, at most 6000 rows.
import json, os, sys, tempfile, time, urllib.request
from datetime import datetime, timezone

ARCHIVE = os.environ.get('INTEL_ARCHIVE_FILE', '/data/private/nexualpha/intel/official-announcements-archive.json')
FEED_URL = os.environ.get('INTEL_FEED_URL', 'https://nexualpha.com/intel/official-announcements.json')
RETENTION_S = 400 * 86400
MAX_ITEMS = 6000
FIELDS = ['id', 'venue', 'category', 'title', 'url', 'publishedAt', 'sourceType', 'summary', 'startAt', 'endAt', 'expiresAt']
CATEGORIES = {'listing', 'event', 'delisting', 'news', 'product', 'security'}


def ts(value):
    try:
        return datetime.strptime(value[:19], '%Y-%m-%dT%H:%M:%S').replace(tzinfo=timezone.utc).timestamp()
    except Exception:
        return None


def valid(item, now):
    if not isinstance(item, dict):
        return False
    if not all(isinstance(item.get(k), str) and item.get(k) for k in ('id', 'venue', 'title', 'url', 'publishedAt')):
        return False
    if item.get('category') not in CATEGORIES or not item['url'].startswith('https://'):
        return False
    published = ts(item['publishedAt'])
    return published is not None and published <= now + 3600 and now - published <= RETENTION_S


def main():
    now = time.time()
    seen = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    req = urllib.request.Request(FEED_URL, headers={'accept': 'application/json', 'user-agent': 'NexuAlphaArchive/1.0'})
    feed = json.loads(urllib.request.urlopen(req, timeout=30).read().decode('utf-8'))
    try:
        with open(ARCHIVE, encoding='utf-8') as fh:
            archive = json.load(fh)
    except FileNotFoundError:
        archive = {'version': 1, 'items': []}
    rows = {r['id']: r for r in archive.get('items', []) if valid(r, now)}
    for item in feed.get('items', []):
        if not valid(item, now):
            continue
        prev = rows.get(item['id'], {})
        row = dict(prev)
        row.update({k: item[k] for k in FIELDS if isinstance(item.get(k), str) and item.get(k)})
        row['firstSeenAt'] = prev.get('firstSeenAt') or seen
        row['lastSeenAt'] = seen
        rows[item['id']] = row
    ordered = sorted(rows.values(), key=lambda r: (-(ts(r['publishedAt']) or 0), r['id']))[:MAX_ITEMS]
    out = {'version': 1, 'updatedAt': seen, 'items': ordered}
    fd, tmp = tempfile.mkstemp(prefix='.archive-', dir=os.path.dirname(ARCHIVE))
    with os.fdopen(fd, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(',', ':'))
        fh.write('\n')
    os.chmod(tmp, 0o644)
    os.rename(tmp, ARCHIVE)
    print('%s archive %d items' % (seen, len(ordered)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
