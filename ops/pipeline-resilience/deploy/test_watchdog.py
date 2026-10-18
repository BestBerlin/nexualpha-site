import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('watchdog', Path(__file__).with_name('watchdog.py'))
watchdog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watchdog)
NOW = 1792022400


class WatchdogTests(unittest.TestCase):
    def state(self, status='unhealthy', started='2026-10-14T00:00:00Z'):
        return {'Status': 'running', 'StartedAt': started, 'Health': {'Status': status}}

    def test_only_unhealthy_after_ten_minute_grace(self):
        self.assertIsNotNone(watchdog.restart_reason(self.state(), NOW))
        self.assertIsNone(watchdog.restart_reason(self.state('healthy'), NOW))
        self.assertIsNone(watchdog.restart_reason(self.state(started='2026-10-15T00:00:00Z'), NOW))
        self.assertIsNone(watchdog.restart_reason({**self.state(), 'Status': 'exited'}, NOW))

    def test_scoped_restart_and_dry_run(self):
        calls = []
        def command(args):
            calls.append(args)
            if args[1] == 'ps':
                self.assertIn('label=com.nexualpha.watchdog=true', args)
                return 'abc' if args[-1].endswith('nexualpha-tg') else ''
            if args[1] == 'inspect':
                self.assertIn('{{json .State}}', args)
                return json.dumps(self.state())
            return ''
        self.assertEqual(watchdog.sweep(NOW, command=command, dry_run=True), ['abc'])
        self.assertFalse(any(c[1] == 'restart' for c in calls))
        calls.clear()
        self.assertEqual(watchdog.sweep(NOW, command=command), ['abc'])
        self.assertEqual([c for c in calls if c[1] == 'restart'], [['docker', 'restart', '--time', '20', 'abc']])


if __name__ == '__main__':
    unittest.main()
