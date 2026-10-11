# -*- coding: utf-8 -*-
from __future__ import annotations

import copy
import json
import subprocess
import tempfile
import unittest
import wave
from pathlib import Path
from unittest import mock

from PIL import Image

import engine
import visuals


def valid_script():
    return {
        "meta": {
            "level": 1,
            "slug": "network-check",
            "title_zh": "网络核对",
            "title_en": "Network check",
            "next_title_zh": "下一关",
            "next_title_en": "Next level",
            "cta": {"kind": "partner", "partner": "binance"},
        },
        "scenes": [
            {
                "voice_zh": "先核对网络。再核对备注。",
                "voice_en": "Check the network. Check the memo.",
                "title": "核对网络",
                "title_en": "Check the network",
                "sub": "不要只看币种名",
                "sub_en": "Do not only read the asset symbol",
                "min_s": 2.0,
                "visual": {"type": "definition", "params": {"term": "USDT"}},
            }
        ],
    }


def write_silent_wav(path: Path, seconds: float = 0.05) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(48000)
        target.writeframes(b"\0" * round(seconds * 48000) * 2)


class EngineValidationTest(unittest.TestCase):
    def test_validate_rejects_bad_meta_and_scene_shapes(self):
        with self.assertRaisesRegex(ValueError, "meta object required"):
            engine.validate({"scenes": []})

        bad_level = valid_script()
        bad_level["meta"]["level"] = True
        with self.assertRaisesRegex(ValueError, "positive integer level required"):
            engine.validate(bad_level)

        bad_slug = valid_script()
        bad_slug["meta"]["slug"] = "../unsafe"
        with self.assertRaisesRegex(ValueError, "safe slug required"):
            engine.validate(bad_slug)

        bad_minimum = valid_script()
        bad_minimum["scenes"][0]["min_s"] = 0
        with self.assertRaisesRegex(ValueError, "finite positive min_s required"):
            engine.validate(bad_minimum)

        bad_visual = valid_script()
        bad_visual["scenes"][0]["visual"] = {"type": "unknown", "params": {}}
        with self.assertRaisesRegex(ValueError, "supported visual type and params required"):
            engine.validate(bad_visual)

    def test_validate_rejects_empty_invalid_cta_and_non_dict_scene(self):
        empty_cta = valid_script()
        empty_cta["meta"]["cta"] = {}
        with self.assertRaisesRegex(ValueError, "CTA kind neutral or partner required"):
            engine.validate(empty_cta)

        invalid_cta = valid_script()
        invalid_cta["meta"]["cta"] = {"kind": "partner"}
        with self.assertRaisesRegex(ValueError, "CTA kind neutral or partner required"):
            engine.validate(invalid_cta)

        bad_scene = valid_script()
        bad_scene["scenes"] = ["not a scene object"]
        with self.assertRaises((ValueError, AttributeError)):
            engine.validate(bad_scene)

    def test_audio_duration_rejects_empty_or_unusable_probe_output(self):
        with mock.patch.object(engine, "run", return_value="N/A\n"):
            with self.assertRaisesRegex(RuntimeError, "Empty narration"):
                engine.audio_duration(Path("empty.wav"))

        with mock.patch.object(engine, "run", return_value="0.000000\n"):
            with self.assertRaisesRegex(RuntimeError, "Empty narration"):
                engine.audio_duration(Path("zero.wav"))

    def test_plan_uses_say_ffmpeg_and_measured_sentence_audio(self):
        durations = {
            "zh-Hans-0-0.wav": 1.2,
            "zh-Hans-0-1.wav": 0.5,
            "en-0-0.wav": 0.8,
            "en-0-1.wav": 0.7,
        }
        calls = []

        def fake_run(args):
            args = [str(arg) for arg in args]
            calls.append(args)
            if args[0] == "say":
                Path(args[args.index("-o") + 1]).write_bytes(b"fake aiff")
                return ""
            if Path(args[0]).name == "ffmpeg":
                write_silent_wav(Path(args[-1]))
                return ""
            raise AssertionError(f"unexpected command: {args}")

        def fake_audio_duration(path):
            return durations[Path(path).name]

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            with mock.patch.object(engine, "run", side_effect=fake_run), mock.patch.object(
                engine, "audio_duration", side_effect=fake_audio_duration
            ):
                timelines = engine.plan(valid_script(), out)

            self.assertEqual(len([call for call in calls if call[0] == "say"]), 4)
            self.assertEqual(len([call for call in calls if Path(call[0]).name == "ffmpeg"]), 4)
            self.assertEqual(timelines["zh-Hans"]["cues"][0]["start"], 3.0)
            self.assertAlmostEqual(timelines["zh-Hans"]["cues"][0]["end"], 4.2)
            self.assertAlmostEqual(timelines["zh-Hans"]["cues"][1]["start"], 4.2)
            self.assertAlmostEqual(timelines["en"]["cues"][0]["end"], 3.8)
            self.assertGreaterEqual(timelines["zh-Hans"]["scenes"][0]["duration"], 2.3)
            self.assertTrue((out / "zh-Hans.wav").exists())
            self.assertTrue((out / "en.wav").exists())
            self.assertTrue((out / "zh-Hans.srt").read_text(encoding="utf-8").startswith("1\n00:00:03,000"))
            cached = json.loads((out / "timing.json").read_text(encoding="utf-8"))
            self.assertEqual(cached["en"]["cues"][1]["text"], "Check the memo.")


class EngineCtaTest(unittest.TestCase):
    def test_resolve_cta_blocks_neutral_paths_before_subprocess(self):
        neutral_meta = copy.deepcopy(valid_script()["meta"])
        neutral_meta["cta"] = {"kind": "neutral"}
        with mock.patch.object(engine, "run") as run_mock:
            self.assertIsNone(engine.resolve_cta(neutral_meta, "en"))
            run_mock.assert_not_called()

        partner_meta = copy.deepcopy(valid_script()["meta"])
        with mock.patch.object(engine, "run") as run_mock:
            self.assertIsNone(engine.resolve_cta(partner_meta, "ar"))
            self.assertIsNone(engine.resolve_cta(partner_meta, "ru"))
            self.assertIsNone(engine.resolve_cta(partner_meta, "zh-Hant"))
            run_mock.assert_not_called()

    def test_node_cta_gate_returns_partner_only_for_promotable_locale(self):
        en = subprocess.run(
            ["node", str(engine.ROOT / "cta.mjs"), "binance", "en"],
            check=True,
            capture_output=True,
            text=True,
            cwd=engine.REPO,
        )
        zh_hans = subprocess.run(
            ["node", str(engine.ROOT / "cta.mjs"), "binance", "zh-Hans"],
            check=True,
            capture_output=True,
            text=True,
            cwd=engine.REPO,
        )
        ar = subprocess.run(
            ["node", str(engine.ROOT / "cta.mjs"), "binance", "ar"],
            check=True,
            capture_output=True,
            text=True,
            cwd=engine.REPO,
        )

        self.assertEqual(json.loads(en.stdout)["slug"], "binance")
        self.assertEqual(json.loads(zh_hans.stdout)["slug"], "binance")
        self.assertIsNone(json.loads(ar.stdout))


class EngineTextAndBrandTest(unittest.TestCase):
    def test_text_layout_rejects_overflow_and_enforces_minimum_font(self):
        with self.assertRaisesRegex(ValueError, "minimum on-screen type is 34px"):
            engine.font(33, "en")

        class FakeFont:
            def __init__(self, size):
                self.size = size

            def getlength(self, value):
                return len(value) * self.size

        with mock.patch.object(engine, "font", side_effect=lambda size, locale="en": FakeFont(size)):
            with self.assertRaisesRegex(ValueError, "Text token does not fit"):
                engine.lines_for("supercalifragilistic", width=100, size=34, locale="en")

    def test_logo_rasterizes_official_svg(self):
        self.assertTrue((engine.REPO / "pilot-01-prototype/public/brand/nexualpha/nexualpha-round.svg").exists())
        image = engine.logo(64)
        self.assertEqual(image.size, (64, 64))
        self.assertEqual(image.mode, "RGBA")
        self.assertGreater(sum(1 for pixel in image.getdata() if pixel[3]), 100)

    def test_sentence_segmentation_and_spoken_normalization(self):
        self.assertEqual(
            engine.sentences("First sentence. Second? 继续。"),
            ["First sentence.", "Second?", "继续。"],
        )
        self.assertEqual(engine.spoken("USDT Memo Tag", "zh-Hans"), "U S D T 备注 标签")
        self.assertEqual(engine.spoken("25% 100 1.25 USDT", "zh-Hans"), "百分之二十五 一百 一点二五 U S D T")
        self.assertEqual(engine.spoken("USDT Memo Tag", "en"), "U S D T Memo Tag")


class VisualComponentTest(unittest.TestCase):
    COMPONENTS = {
        "flow": {
            "steps": ["Wallet", "Network", "Exchange"],
            "steps_zh_hans": ["钱包", "网络", "平台"],
        },
        "phone-mock": {
            "title": "Receive form",
            "title_zh_hans": "收款表单",
            "fields": [["Asset", "USDT"], ["Network", "TRC20"], ["Memo", "Required"]],
            "fields_zh_hans": [["币种", "USDT"], ["网络", "TRC20"], ["备注", "必填"]],
        },
        "checklist": {
            "title": "Pre-confirm checklist",
            "title_zh_hans": "确认前清单",
            "items": ["Asset", "Network", "Address"],
            "items_zh_hans": ["币种", "网络", "地址"],
        },
        "compare-table": {
            "columns": ["Receiver", "Sender"],
            "columns_zh_hans": ["收款", "转出"],
            "rows": [["Asset", "USDT", "USDT"], ["Network", "TRC20", "TRC20"], ["Memo", "Yes", "Yes"]],
            "rows_zh_hans": [["币种", "USDT", "USDT"], ["网络", "TRC20", "TRC20"], ["备注", "需要", "已填"]],
        },
        "warning-card": {
            "title": "Pause before confirm",
            "title_zh_hans": "确认前暂停",
            "body": "A cheap fee is not a network match.",
            "body_zh_hans": "低手续费不等于网络匹配。",
        },
        "number-counter": {
            "label": "Checks complete",
            "label_zh_hans": "已完成核对",
            "value": 3,
            "caption": "Confirm once",
            "caption_zh_hans": "只确认一次",
        },
        "timeline": {
            "events": ["Read", "Match", "Confirm"],
            "events_zh_hans": ["阅读", "匹配", "确认"],
        },
        "split-choice": {
            "left": "Exact match",
            "left_zh_hans": "完全匹配",
            "left_caption": "Continue",
            "left_caption_zh_hans": "继续",
            "right": "Mismatch",
            "right_zh_hans": "不匹配",
            "right_caption": "Pause",
            "right_caption_zh_hans": "暂停",
        },
        "quote": {
            "quote": "Network first. Confirm once.",
            "quote_zh_hans": "先看网络。只确认一次。",
            "source": "NexuAlpha",
        },
    }

    BOXES = [
        ((1920, 1080), (64, 470, 1856, 810)),
        ((1080, 1920), (64, 620, 1016, 1430)),
    ]

    def test_all_visual_components_fit_and_animate_in_production_boxes(self):
        for kind, params in self.COMPONENTS.items():
            for size, box in self.BOXES:
                for locale in ("en", "zh-Hans"):
                    with self.subTest(kind=kind, size=size, locale=locale):
                        start = Image.new("RGB", size, engine.BG)
                        end = Image.new("RGB", size, engine.BG)

                        visuals.draw_visual(start, box, kind, params, t=0.2, duration=4.0, locale=locale)
                        visuals.draw_visual(end, box, kind, params, t=3.2, duration=4.0, locale=locale)

                        self.assertIsNotNone(start.getbbox())
                        self.assertIsNotNone(end.getbbox())
                        self.assertNotEqual(start.crop(box).tobytes(), end.crop(box).tobytes())


class EndCardContractTest(unittest.TestCase):
    def test_watermark_remains_visible_at_transition_boundaries(self):
        script=valid_script()
        timing={'duration':15,'end_start':8,'scenes':[{'start':3,'duration':5}], 'cues':[]}
        for size in ((1920,1080),(1080,1920)):
            w,h=size
            for t in (0,3,8,14.99):
                with self.subTest(size=size,t=t):
                    im=engine.frame(script,timing,t,size,'en',None)
                    crop=im.crop((w-345,h-80,w-40,h-20))
                    self.assertGreater(len(set(crop.getdata())),1)

    def test_partner_claim_uses_fractional_share_only_on_end_card(self):
        script=valid_script()
        timing={'duration':15,'end_start':8,'scenes':[{'start':3,'duration':5}], 'cues':[]}
        partner={'name':'Example','inviteCode':'TEST-CODE','share':.25}
        for size in ((1920,1080),(1080,1920)):
            with self.subTest(size=size), mock.patch.object(engine,'text') as draw:
                engine.frame(script,timing,10,size,'en',partner)
                values=[call.args[1] for call in draw.call_args_list]
                claim=next(value for value in values if 'TEST-CODE' in value)
                self.assertIn('25%',claim)
                self.assertNotIn('0.25%',claim)
                self.assertTrue(any('commission paid by the exchange' in value for value in values))
            with mock.patch.object(engine,'text') as draw:
                engine.frame(script,timing,4,size,'en',partner)
                self.assertFalse(any('TEST-CODE' in call.args[1] for call in draw.call_args_list))
        partner['share']=None
        with mock.patch.object(engine,'text') as draw:
            engine.frame(script,timing,10,(1920,1080),'en',partner)
            claim=next(call.args[1] for call in draw.call_args_list if 'TEST-CODE' in call.args[1])
            self.assertNotIn('%',claim)


if __name__ == "__main__":
    unittest.main()
