#!/usr/bin/env python3
"""Host-side (prod): copy a slim, public-safe view of the newsroom top-events into the x-poster
state dir so the scheduler container (which cannot see /data/private) can rank the day's keywords.
Only asset / action / title / score are kept. Runs from /etc/cron.d/nexualpha-x-keywords."""
import json, os, sys, tempfile
SRC = sys.argv[1] if len(sys.argv) > 1 else '/data/private/nexualpha/newsroom/top-events.json'
DST = sys.argv[2] if len(sys.argv) > 2 else '/data/agent/state/var/lib/crypto-telegram-ops/x-poster/top-events.json'
with open(SRC) as f:
    d = json.load(f)
events = []
for e in (d.get('events') or [])[:20]:
    s = e.get('score') or {}
    events.append({'story_asset': e.get('story_asset'), 'event_type': e.get('event_type'),
                   'title_internal': (e.get('title_internal') or '')[:200],
                   'score': {'editorial_score': s.get('editorial_score') if isinstance(s, dict) else None}})
out = {'schema': 'x-poster.top-events.v1', 'generated_at': d.get('generated_at'), 'events': events}
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(DST))
with os.fdopen(fd, 'w') as f:
    json.dump(out, f)
os.chmod(tmp, 0o600)
os.replace(tmp, DST)
