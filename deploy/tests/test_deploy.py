import importlib.util
import json
import pathlib
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, str(ROOT / (name + '-remote.py')))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


stage = load('stage')
cutover = load('cutover')
rollback = load('rollback')


class Redirects(BaseHTTPRequestHandler):
    destination = 'https://partner.example/register?ref=CODE&lang=en'
    requests = []

    def do_HEAD(self):
        self.requests.append(('HEAD', self.path))
        if self.path.startswith('/go/good'):
            self.send_response(302)
            self.send_header('Location', self.destination)
        elif self.path == '/go/relative':
            self.send_response(302)
            self.send_header('Location', '/register?ref=CODE')
        else:
            self.send_response(200)
        self.end_headers()

    def do_GET(self):
        self.requests.append(('GET', self.path))
        self.send_response(500)
        self.end_headers()

    def log_message(self, *args):
        pass


class CTA(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Redirects)
        cls.thread = threading.Thread(target=cls.server.serve_forever)
        cls.thread.start()
        cls.port = cls.server.server_port

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_raw_to_go_equivalence_and_head_only(self):
        Redirects.requests = []
        raw = '<a rel="sponsored" href="https://partner.example/register?ref=CODE&amp;lang=en">Join</a>'
        tracked = "<a href='/go/good?src=home'>Join</a>"
        self.assertEqual(stage.cta_links(raw, self.port), stage.cta_links(tracked, self.port))
        self.assertEqual(Redirects.requests, [('HEAD', '/go/good?src=home')])

    def test_resolves_on_each_port(self):
        with patch.object(stage, 'resolve_go', side_effect=['https://x/register?ref=OLD', 'https://x/register?ref=NEW']) as resolve:
            old = stage.cta_links('<a href="/go/x">Join</a>', 18001)
            new = stage.cta_links('<a href="/go/x">Join</a>', 18002)
            self.assertNotEqual(old, new)
            self.assertEqual(resolve.call_args_list[0].args, (18001, '/go/x'))
            self.assertEqual(resolve.call_args_list[1].args, (18002, '/go/x'))

    def test_code_changed_or_removed(self):
        old = '<a href="https://x/register?ref=OLD">Join</a><span class="registration-card__code-value">OLD</span>'
        for new in [old.replace('OLD', 'NEW'), '<a href="https://x/register">Join</a>', '']:
            self.assertNotEqual(stage.cta_links(old), stage.cta_links(new))

    def test_code_markup_css_entities_and_timestamp(self):
        html = '<style>.registration-card__code-value>FAKE<</style><span class="registration-card__code-value"><b>A&amp;B</b></span>'
        self.assertEqual(stage.cta_links(html), ['code:A&B'])
        a = '<a href="https://x/signup?tg_expires=123">Join</a>'
        self.assertEqual(stage.cta_links(a), stage.cta_links(a.replace('123', '999')))

    def test_bad_redirects_fail_closed(self):
        for path in ['/go/missing', '/go/relative']:
            with self.assertRaises(RuntimeError):
                stage.cta_links('<a href="%s">Join</a>' % path, self.port)
        with self.assertRaises(RuntimeError):
            stage.cta_links('<a href="/go/good">Join</a>')

    def test_ordinary_links_ignored(self):
        self.assertEqual(stage.cta_links('<a href="/news">News</a><a href="https://example.com/docs">Docs</a>'), [])


class Polling(unittest.TestCase):
    def test_local_success_and_failed_baseline(self):
        import io
        import sys
        spec = importlib.util.spec_from_file_location('poll', str(ROOT / 'poll-cutover.py'))
        poll = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(poll)
        class Home(BaseHTTPRequestHandler):
            status = 200
            def do_GET(self):
                self.send_response(self.status)
                self.end_headers()
            def log_message(self, *args):
                pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), Home)
        thread = threading.Thread(target=server.serve_forever)
        thread.start()
        try:
            argv = ['poll-cutover.py', 'http://127.0.0.1:%s/' % server.server_port, '--', sys.executable, '-c', 'pass']
            with patch.object(sys, 'argv', argv), patch.object(sys, 'stdout', io.StringIO()) as output:
                self.assertEqual(poll.main(), 0)
                self.assertIn('non_200=0 command_exit=0', output.getvalue())
                samples = [line for line in output.getvalue().splitlines() if not line.startswith('samples=')]
                self.assertGreaterEqual(len(samples), 15)
            Home.status = 503
            with patch.object(sys, 'argv', argv), patch.object(sys, 'stdout', io.StringIO()), patch.object(sys, 'stderr', io.StringIO()), patch.object(poll.subprocess, 'call') as command:
                self.assertEqual(poll.main(), 1)
                command.assert_not_called()
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


class Health(unittest.TestCase):
    def test_all_routes_and_build_identity(self):
        from unittest.mock import MagicMock
        for module in (cutover, rollback):
            def response(url, **kwargs):
                result = MagicMock()
                result.__enter__.return_value = result
                result.status = 200
                result.read.return_value = b'{"buildId":"expected"}'
                return result
            with patch.object(module.urllib.request, 'urlopen', side_effect=response) as request:
                module.health(18002, 'expected', ['/', '/news'])
                self.assertEqual([call.args[0] for call in request.call_args_list],
                                 ['http://127.0.0.1:18002/', 'http://127.0.0.1:18002/news',
                                  'http://127.0.0.1:18002/version.json'])
                with self.assertRaises(RuntimeError):
                    module.health(18002, 'wrong', ['/'])
            failed = MagicMock()
            failed.__enter__.return_value = failed
            failed.status = 503
            with patch.object(module.urllib.request, 'urlopen', return_value=failed):
                with self.assertRaises(RuntimeError):
                    module.health(18002, 'expected', ['/'])

    def test_ready_retries_and_fails_closed(self):
        for module in (cutover, rollback):
            with patch.object(module, 'health', side_effect=[RuntimeError('starting'), None]) as health, patch.object(module.time, 'sleep'):
                module.ready(18002, 'expected', ['/'])
                self.assertEqual(health.call_count, 2)
            with patch.object(module, 'health', side_effect=RuntimeError('dead')) as health, patch.object(module.time, 'sleep'):
                with self.assertRaises(RuntimeError):
                    module.ready(18002, 'expected', ['/'])
                self.assertEqual(health.call_count, 30)


class Switch(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.conf = pathlib.Path(self.temp.name) / 'nginx.conf'
        self.original = 'proxy_pass http://127.0.0.1:18001;\n'
        self.conf.write_text(self.original)
        self.state = dict(old_port=18001, new_port=18002, old_container='old', new_container='new',
                          old_build='old-build', buildId='new-build', routes=['/', '/news'])
        self.state_path = pathlib.Path(self.temp.name) / 'state.json'
        self.state_path.write_text(json.dumps(self.state))

    def main_patches(self, module):
        # Map only the fixed state path; config and backup remain real temporary files.
        real_path = type(self.conf)
        def path(value):
            if str(value).startswith('/data/wwwroot/nexualpha-release-'):
                return self.state_path
            return real_path(value)
        return patch.object(module.pathlib, 'Path', side_effect=path)

    def test_atomic_replacement_and_mode(self):
        self.conf.chmod(0o640)
        with patch.object(cutover, 'CONF', self.conf):
            cutover.atomic_config('new')
        self.assertEqual(self.conf.read_text(), 'new')
        self.assertEqual(self.conf.stat().st_mode & 0o777, 0o640)
        self.assertEqual(set(self.conf.parent.iterdir()), {self.conf, self.state_path})

    def test_nginx_failure_restores_config(self):
        for failure in [0, 1]:
            calls = []
            def run(args, **kwargs):
                calls.append(args)
                if len(calls) - 1 == failure:
                    raise RuntimeError('nginx failed')
            with patch.object(cutover, 'CONF', self.conf), patch.object(cutover.subprocess, 'run', side_effect=run):
                with self.assertRaises(RuntimeError):
                    cutover.switch(self.original, 'new')
            self.assertEqual(self.conf.read_text(), self.original)
            self.assertEqual(calls[-2:], [[cutover.NGINX, '-t'], [cutover.NGINX, '-s', 'reload']])

    def test_cutover_order_and_worker_drain(self):
        events = []
        with patch.object(cutover, 'CONF', self.conf), self.main_patches(cutover), patch.dict('os.environ', RELEASE='test'), \
                patch.object(cutover.subprocess, 'run', side_effect=lambda args, **kw: events.append(args)), \
                patch.object(cutover, 'ready', side_effect=lambda *a: events.append('ready')), \
                patch.object(cutover, 'health', side_effect=lambda *a: events.append('health')), \
                patch.object(cutover, 'workers', side_effect=[{1}, {1}, set()]), patch.object(cutover.time, 'sleep'):
            cutover.main()
        self.assertEqual(events, [['docker', 'start', 'new'], 'ready', [cutover.NGINX, '-t'],
                                  [cutover.NGINX, '-s', 'reload'], 'health', ['docker', 'stop', '--time', '30', 'old']])
        self.assertIn(':18002', self.conf.read_text())

    def test_unhealthy_standby_never_switches_or_stops_old(self):
        with patch.object(cutover, 'CONF', self.conf), self.main_patches(cutover), patch.dict('os.environ', RELEASE='test'), \
                patch.object(cutover.subprocess, 'run') as run, patch.object(cutover, 'ready', side_effect=RuntimeError('not ready')):
            with self.assertRaises(RuntimeError):
                cutover.main()
        self.assertEqual(self.conf.read_text(), self.original)
        self.assertEqual(run.call_count, 1)

    def test_worker_timeout_keeps_old_running(self):
        with patch.object(cutover, 'CONF', self.conf), self.main_patches(cutover), patch.dict('os.environ', RELEASE='test'), \
                patch.object(cutover.subprocess, 'run') as run, patch.object(cutover, 'ready'), \
                patch.object(cutover, 'workers', return_value={1}), patch.object(cutover.time, 'monotonic', side_effect=[0, 61]):
            cutover.main()
        self.assertFalse(any(call.args[0][:2] == ['docker', 'stop'] for call in run.call_args_list))

    def test_post_reload_failure_restores_before_retirement(self):
        with patch.object(cutover, 'CONF', self.conf), self.main_patches(cutover), patch.dict('os.environ', RELEASE='test'), \
                patch.object(cutover.subprocess, 'run') as run, patch.object(cutover, 'ready'), \
                patch.object(cutover, 'workers', side_effect=[{1}, set()]), patch.object(cutover, 'health', side_effect=RuntimeError('dead')):
            with self.assertRaises(RuntimeError):
                cutover.main()
        self.assertEqual(self.conf.read_text(), self.original)
        self.assertFalse(any(call.args[0][:2] == ['docker', 'stop'] for call in run.call_args_list))

    def test_rollback_starts_and_checks_before_reload(self):
        pathlib.Path(str(self.conf) + '.backup-test').write_text(self.original)
        self.conf.write_text('proxy_pass http://127.0.0.1:18002;\n')
        events = []
        with patch.object(rollback, 'CONF', self.conf), self.main_patches(rollback), patch.dict('os.environ', RELEASE='test'), \
                patch.object(rollback.subprocess, 'run', side_effect=lambda args, **kw: events.append(args)), \
                patch.object(rollback, 'ready', side_effect=lambda *a: events.append(('ready', a))):
            rollback.main()
        self.assertEqual(events[0], ['docker', 'start', 'old'])
        self.assertEqual(events[1], ('ready', (18001, 'old-build', ['/', '/news'])))
        self.assertEqual(events[2:], [[rollback.NGINX, '-t'], [rollback.NGINX, '-s', 'reload']])
        self.assertEqual(self.conf.read_text(), self.original)

    def test_unhealthy_rollback_does_not_switch(self):
        pathlib.Path(str(self.conf) + '.backup-test').write_text(self.original)
        self.conf.write_text('new')
        with patch.object(rollback, 'CONF', self.conf), self.main_patches(rollback), patch.dict('os.environ', RELEASE='test'), \
                patch.object(rollback.subprocess, 'run') as run, patch.object(rollback, 'ready', side_effect=RuntimeError('dead')):
            with self.assertRaises(RuntimeError):
                rollback.main()
        self.assertEqual(self.conf.read_text(), 'new')
        self.assertEqual(run.call_count, 1)


if __name__ == '__main__':
    unittest.main()
