"""Validate the shipped season with actual production font/layout measurements."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import engine


class SeasonTest(unittest.TestCase):
    def test_every_episode_schema_and_layout(self):
        paths = sorted((engine.ROOT / 'episodes').glob('[0-9][0-9]-*.json'))
        self.assertEqual(len(paths), 12)
        self.assertEqual([json.loads(p.read_text())['meta']['level'] for p in paths], list(range(1, 13)))
        for path in paths:
            with self.subTest(episode=path.name), tempfile.TemporaryDirectory(dir=engine.REPO) as tmp:
                script = engine.validate(json.loads(path.read_text()))
                timing = engine.diagnostic_plan(script, Path(tmp))['zh-Hans']
                cta = engine.resolve_cta(script['meta'], 'zh-Hans')
                engine.preflight(script, timing, 'zh-Hans', cta)

    def test_none_and_neutral_end_cards_use_lesson_url_without_partner(self):
        script = json.loads(next((engine.ROOT / 'episodes').glob('01-*.json')).read_text())
        timing = {'duration':15, 'end_start':8, 'scenes':[], 'cues':[]}
        for kind in ('none', 'neutral'):
            script['meta']['cta']['kind'] = kind
            with mock.patch.object(engine, 'run') as run:
                self.assertIsNone(engine.resolve_cta(script['meta'], 'zh-Hans'))
                run.assert_not_called()
            with mock.patch.object(engine, 'text') as draw:
                engine.frame(script, timing, 10, (1920,1080), 'zh-Hans', None)
                values = [call.args[1] for call in draw.call_args_list]
                self.assertTrue(any('nexualpha.com/zh-hans/starter/' in v and script['meta']['slug'] in v for v in values))
                self.assertFalse(any('邀请码' in v for v in values))

    def test_bitget_domain_line_and_feed_code_on_level_eight(self):
        script = json.loads(next((engine.ROOT / 'episodes').glob('08-*.json')).read_text())
        partner = engine.resolve_cta(script['meta'], 'zh-Hans')
        self.assertEqual(partner['slug'], 'bitget')
        timing = {'duration':15, 'end_start':8, 'scenes':[], 'cues':[]}
        with mock.patch.object(engine, 'text') as draw:
            engine.frame(script, timing, 10, (1920,1080), 'zh-Hans', partner)
            values = [call.args[1] for call in draw.call_args_list]
            self.assertIn('partner.bitget.com 为 Bitget 官方合作域名', values)
            self.assertTrue(any(partner['inviteCode'] in v for v in values))
            self.assertTrue(any('佣金由交易所支付' in v for v in values))


class EncoderShutdownTest(unittest.TestCase):
    def test_all_encoder_inputs_close_before_waiting(self):
        processes = []

        class Pipe:
            closed = False

            def write(self, value):
                pass

            def close(self):
                self.closed = True

        class Process:
            returncode = 0

            def __init__(self, args, **kwargs):
                self.pipe = Pipe()
                self.stdin = self.pipe
                self.target = Path(args[-1])
                self.target.write_bytes(b'encoder-fixture')
                processes.append(self)

            def communicate(self, timeout):
                if not all(p.pipe.closed for p in processes):
                    raise AssertionError('An encoder is being awaited while another input is open')
                if timeout != 60:
                    raise AssertionError('Encoder completion must have a timeout')
                return None, b''

            def poll(self):
                return self.returncode

        with tempfile.TemporaryDirectory(dir=engine.REPO) as tmp:
            with mock.patch.object(engine.subprocess, 'Popen', Process), mock.patch.object(engine, 'frame') as frame:
                from PIL import Image
                frame.return_value = Image.new('RGB', (1,1))
                engine.render({}, {'duration':1, 'cues':[], 'diagnostic':True}, Path(tmp), 'zh-Hans', None, 1)
            self.assertEqual(len(list(Path(tmp).glob('*.mp4'))), 4)
        self.assertEqual(len(processes), 4)
