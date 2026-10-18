#!/usr/bin/env python3
"""Server-only content freshness check. No credentials leave the Docker host."""
import argparse
import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request


def atomic_json(file, value):
    file = Path(file)
    file.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=file.name + '.', dir=file.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(value, stream)
            stream.write('\n')
        os.replace(tmp, file)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def freshness(feed, now, max_age=10800):
    dates = []
    for article in feed.get('articles', []):
        if article.get('status', 'PUBLISHED') not in ('PUBLISHED', 'PUBLISHED_AND_VERIFIED'):
            continue
        try:
            stamp = dt.datetime.fromisoformat(article['publishedAt'].replace('Z', '+00:00')).timestamp()
            if stamp <= now + 300:
                dates.append(stamp)
        except (KeyError, TypeError, ValueError):
            continue
    newest = max(dates) if dates else None
    return {'ok': newest is not None and now - newest <= max_age,
            'newestPublishedAt': dt.datetime.fromtimestamp(newest, dt.timezone.utc).isoformat() if newest else None,
            'ageSeconds': round(now - newest) if newest else None}


def load_feed(location):
    if location.startswith(('http://', 'https://')):
        with urllib.request.urlopen(location, timeout=20) as response:
            return json.load(response)
    with open(location) as stream:
        return json.load(stream)


def owner_dm(message):
    # Same private owner route as nx-agents/qa/health/health-check.mjs SEND_REMOTE.
    # Inspect only on the server, capture locally, never log environments or Telegram URLs.
    def env(container):
        try:
            result = subprocess.run(['docker', 'inspect', '--format', '{{json .Config.Env}}', container],
                                    capture_output=True, text=True, timeout=10, check=True)
            return dict(row.split('=', 1) for row in json.loads(result.stdout) if '=' in row)
        except Exception:
            return {}
    try:
        chat = env('nexualpha-tg-alert-sender-1').get('OWNER_CHAT_ID', '')
        if not chat.isdigit() or int(chat) <= 0:
            return False
        token = env('nexualpha-tg-community-poller-1').get('COMMUNITY_BOT_TOKEN')
        if not token:
            token = env('nexualpha-tg-miniapp-verifier-1').get('COMMUNITY_BOT_TOKEN')
        if not token:
            return False
        data = urllib.parse.urlencode({'chat_id': chat, 'text': message, 'disable_web_page_preview': 'true'}).encode()
        request = urllib.request.Request('https://api.telegram.org/bot' + token + '/sendMessage', data=data)
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.load(response).get('ok') is True
    except Exception:
        # Exception text can contain a Telegram URL/token. Never print it.
        return False


def check(location, state_dir, now=None, dry_run=False, send=owner_dm):
    now = time.time() if now is None else now
    try:
        result = freshness(load_feed(location), now)
    except Exception:
        result = {'ok': False, 'newestPublishedAt': None, 'ageSeconds': None, 'reason': 'feed unreadable'}
    result['updatedAt'] = dt.datetime.fromtimestamp(now, dt.timezone.utc).isoformat()
    if dry_run:
        return {**result, 'delivery': 'dry-run'}
    root = Path(state_dir)
    root.mkdir(parents=True, exist_ok=True)
    # Cron overlap cannot race the receipt. Crash releases the lock automatically.
    with open(root / 'guard.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            previous = json.loads((root / 'state.json').read_text())
        except (OSError, ValueError):
            previous = {}
        incident = not result['ok']
        was_alerted = previous.get('alerted', False)
        if incident:
            atomic_json(root / 'ALERT.json', result)
        should_send = incident and not was_alerted or not incident and was_alerted
        delivered = send(('NexuAlpha content ALERT: no publication in 3h. ' if incident else 'NexuAlpha content recovered. ') +
                         'Newest publishedAt: ' + str(result['newestPublishedAt'])) if should_send else False
        alerted = (True if incident else False) if delivered else was_alerted
        atomic_json(root / 'state.json', {**result, 'alerted': alerted})
        # Keep ALERT until feed recovers; failed notification remains visible in state.
        if not incident:
            (root / 'ALERT.json').unlink(missing_ok=True)
        return {**result, 'delivery': 'sent' if delivered else 'pending' if should_send else 'unchanged'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--feed', default='https://nexualpha.com/content/news-feed-summary.json')
    parser.add_argument('--state-dir', default='/data/agent/state/content-guard')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    print(json.dumps(check(args.feed, args.state_dir, dry_run=args.dry_run)))
