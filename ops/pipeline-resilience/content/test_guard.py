import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import subprocess

spec = importlib.util.spec_from_file_location('guard', Path(__file__).with_name('guard.py'))
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)
NOW = 1792022400


class ContentGuardTests(unittest.TestCase):
    def test_age_is_published_clock_not_generation_or_future_article(self):
        old = '2026-10-14T00:00:00Z'
        payload = {'generatedAt': '2099-01-01T00:00:00Z', 'articles': [
            {'status': 'PUBLISHED', 'publishedAt': old},
            {'status': 'DRAFT', 'publishedAt': '2026-10-15T00:00:00Z'},
            {'status': 'PUBLISHED', 'publishedAt': '2099-01-01T00:00:00Z'}]}
        result = guard.freshness(payload, NOW)
        self.assertFalse(result['ok'])
        self.assertTrue(result['newestPublishedAt'].startswith('2026-10-14'))

    def test_alert_dedup_recovery_and_failure_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            feed = Path(tmp) / 'feed.json'
            root = Path(tmp) / 'state'
            feed.write_text(json.dumps({'articles': []}))
            messages = []
            def send(text):
                messages.append(text)
                return len(messages) > 1  # first DM fails, next cron retries
            self.assertEqual(guard.check(str(feed), root, NOW, send=send)['delivery'], 'pending')
            self.assertTrue((root / 'ALERT.json').exists())
            self.assertEqual(guard.check(str(feed), root, NOW + 1800, send=send)['delivery'], 'sent')
            self.assertEqual(guard.check(str(feed), root, NOW + 3600, send=send)['delivery'], 'unchanged')
            self.assertEqual(len(messages), 2)
            feed.write_text(json.dumps({'articles': [{'status': 'PUBLISHED', 'publishedAt': '2026-10-15T00:00:00Z'}]}))
            result = guard.check(str(feed), root, NOW, send=send)
            self.assertTrue(result['ok'])
            self.assertEqual(len(messages), 3)
            self.assertFalse((root / 'ALERT.json').exists())

    def test_missing_poller_uses_server_verifier_fallback(self):
        def inspect(args, **kwargs):
            if args[-1] == 'nexualpha-tg-community-poller-1':
                raise subprocess.CalledProcessError(1, args)
            rows = ['OWNER_CHAT_ID=123'] if args[-1].endswith('alert-sender-1') else ['COMMUNITY_BOT_TOKEN=test-only-fixture']
            return subprocess.CompletedProcess(args, 0, stdout=json.dumps(rows))
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return b'{"ok":true}'
        with patch.object(guard.subprocess, 'run', side_effect=inspect), patch.object(guard.urllib.request, 'urlopen', return_value=Response()) as send:
            self.assertTrue(guard.owner_dm('fixture message'))
            self.assertEqual(send.call_count, 1)

    def test_dry_run_never_writes_or_sends_and_unreadable_alerts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / 'unused'
            def forbidden(_):
                self.fail('dry-run attempted send')
            result = guard.check(str(root / 'missing'), root, NOW, dry_run=True, send=forbidden)
            self.assertFalse(result['ok'])
            self.assertFalse(root.exists())


if __name__ == '__main__':
    unittest.main()
