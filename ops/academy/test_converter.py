# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path

import convert_writer_script as converter


EPISODES = Path(__file__).resolve().parent / "episodes"


class WriterConverterTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.episode_paths = sorted(EPISODES.glob("[0-9][0-9]-*.json"))
        cls.writer_scripts = [writer_from_episode(path) for path in cls.episode_paths]
        cls.scripts = [(Path(f"{script['meta']['level']:02d}-{script['meta']['slug']}.json"), script) for script in cls.writer_scripts]
        cls.by_slug = {script["meta"]["slug"]: script for _, script in cls.scripts}

    def test_generates_twelve_level_named_episodes_and_removes_stale_files(self):
        with checkout_tempdir() as tmp:
            source = write_writer_fixtures(tmp / "source", self.writer_scripts)
            out = tmp / "out"
            out.mkdir()
            stale = out / "04-network-check.json"
            stale.write_text("{}\n", encoding="utf-8")
            unrelated = out / "99-manual-note.json"
            unrelated.write_text("{}\n", encoding="utf-8")

            written = converter.convert_all(source, out)

            names = [path.name for path in written]
            self.assertEqual(len(names), 12)
            self.assertEqual(names[0], "01-what-am-i-buying.json")
            self.assertEqual(names[9], "10-check-network-before-withdraw.json")
            self.assertFalse(stale.exists())
            self.assertTrue(unrelated.exists())
            self.assertEqual([json.loads(path.read_text(encoding="utf-8"))["meta"]["level"] for path in written], list(range(1, 13)))
            self.assertEqual(len({json.loads(path.read_text(encoding="utf-8"))["meta"]["slug"] for path in written}), 12)

    def test_maps_cta_kinds_for_engine_while_retaining_writer_kind(self):
        converted = {script["meta"]["slug"]: converter.convert_script(script, self.by_slug) for _, script in self.scripts}

        self.assertEqual(converted["what-am-i-buying"]["meta"]["cta"]["kind"], "none")
        self.assertEqual(converted["what-am-i-buying"]["meta"]["cta"]["original_kind"], "none")

        self.assertEqual(converted["pick-an-exchange"]["meta"]["cta"]["kind"], "neutral")
        self.assertEqual(converted["pick-an-exchange"]["meta"]["cta"]["original_kind"], "signup")

        self.assertEqual(converted["first-spot-trade"]["meta"]["cta"]["kind"], "partner")
        self.assertEqual(converted["first-spot-trade"]["meta"]["cta"]["partner"], "bitget")
        self.assertEqual(converted["first-spot-trade"]["meta"]["cta"]["original_kind"], "trade")

        self.assertEqual(converted["check-network-before-withdraw"]["meta"]["cta"]["kind"], "neutral")
        self.assertEqual(converted["check-network-before-withdraw"]["meta"]["cta"]["original_kind"], "telegram")

    def test_derives_next_titles_from_sibling_scripts_and_final_completion(self):
        first = converter.convert_script(self.by_slug["what-am-i-buying"], self.by_slug)
        final = converter.convert_script(self.by_slug["before-futures-liquidation"], self.by_slug)

        self.assertEqual(first["meta"]["next_title_zh"], self.by_slug["pick-an-exchange"]["meta"]["title_zh"])
        self.assertEqual(first["meta"]["next_title_en"], self.by_slug["pick-an-exchange"]["meta"]["title_en"])
        self.assertEqual(final["meta"]["next_title_zh"], "回顾：从第一关再走一遍")
        self.assertEqual(final["meta"]["next_title_en"], "Season complete")

    def test_preserves_page_review_notes_and_original_writer_fields(self):
        writer = self.by_slug["first-spot-trade"]
        writer["custom_top_level"] = {"keep": True}
        writer["scenes"][0]["title_en"] = "Preserved English title"
        writer["scenes"][0]["sub_en"] = "Preserved English subtitle"
        writer["scenes"][0]["scene_extra"] = ["keep", "me"]
        converted = converter.convert_script(writer, self.by_slug)

        self.assertEqual(converted["page"], writer["page"])
        self.assertEqual(converted["custom_top_level"], {"keep": True})
        self.assertEqual(converted["meta"]["source_note"], writer["meta"]["review_notes"])
        self.assertEqual(converted["meta"]["writer_meta"], writer["meta"])
        self.assertEqual(converted["scenes"][0]["voice_zh"], writer["scenes"][0]["voice_zh"])
        self.assertEqual(converted["scenes"][0]["title_en"], "Preserved English title")
        self.assertEqual(converted["scenes"][0]["sub_en"], "Preserved English subtitle")
        self.assertEqual(converted["scenes"][0]["scene_extra"], ["keep", "me"])
        self.assertEqual(converted["scenes"][0]["visual"]["params"]["writer_params"], writer["scenes"][0]["visual"]["params"])

    def test_normalizes_params_without_rendering_handwritten_cta_cards(self):
        signup = converter.convert_script(self.by_slug["signup-and-kyc"], self.by_slug)
        spot = converter.convert_script(self.by_slug["first-spot-trade"], self.by_slug)
        liquidation = converter.convert_script(self.by_slug["before-futures-liquidation"], self.by_slug)

        rendered_params = [scene["visual"]["params"] for script in (signup, spot) for scene in script["scenes"]]
        self.assertTrue(any("cta_card" in params["writer_params"] for params in rendered_params))
        self.assertFalse(any("cta_card" in {key: value for key, value in params.items() if key != "writer_params"} for params in rendered_params))

        first_split = converter.convert_script(self.by_slug["what-am-i-buying"], self.by_slug)["scenes"][0]["visual"]["params"]
        self.assertEqual(first_split["left"], "比特币 BTC")
        self.assertEqual(first_split["right"], "USDT / 交易所账户")

        first_flow = converter.convert_script(self.by_slug["check-network-before-withdraw"], self.by_slug)["scenes"][1]["visual"]["params"]
        self.assertEqual(first_flow["steps"], ["USDT", "Ethereum（ERC20）", "Tron（TRC20）"])

        counter = liquidation["scenes"][2]["visual"]["params"]
        self.assertEqual(counter["value"], 1000.0)
        self.assertEqual(counter["suffix"], " USDT")

    def test_timeline_events_preserve_approved_writer_content(self):
        converted = converter.convert_script(self.by_slug["can-an-exchange-collapse"], self.by_slug)

        self.assertEqual(
            converted["scenes"][1]["visual"]["params"]["events"],
            self.by_slug["can-an-exchange-collapse"]["scenes"][1]["visual"]["params"]["events"],
        )
        self.assertEqual(
            converted["scenes"][2]["visual"]["params"]["events"][1]["text"],
            "证监会声明：未持牌，已转介警方",
        )

    def test_phone_string_fields_do_not_invent_pending_values(self):
        deposit = converter.convert_script(self.by_slug["first-deposit"], self.by_slug)
        network = converter.convert_script(self.by_slug["check-network-before-withdraw"], self.by_slug)

        self.assertEqual(
            deposit["scenes"][2]["visual"]["params"]["fields"],
            [["支付金额", ""], ["手续费", ""], ["到手数量", ""]],
        )
        self.assertEqual(
            network["scenes"][2]["visual"]["params"]["fields"],
            [["网络：TRC20", ""], ["地址：T…（示例）", ""]],
        )
        self.assertEqual(
            network["scenes"][5]["visual"]["params"]["fields"],
            [["地址：T9yD…k3Qp", ""], ["Memo：如需填写", ""]],
        )

    def test_warning_items_remain_visible_in_engine_body(self):
        for _, writer in self.scripts:
            for scene in writer["scenes"]:
                if scene["visual"]["type"] == "warning-card":
                    items = scene["visual"]["params"].get("items", [])
                    converted = converter.convert_scene(scene)
                    for item in items:
                        self.assertIn(item, converted["visual"]["params"]["body"])

    def test_written_json_is_stable_and_loadable(self):
        with checkout_tempdir() as tmp:
            source = write_writer_fixtures(tmp / "source", self.writer_scripts)
            [path] = [path for path in converter.convert_all(source, tmp / "out") if path.name == "08-first-spot-trade.json"]
            loaded = json.loads(path.read_text(encoding="utf-8"))

        self.assertEqual(loaded["meta"]["level"], 8)
        self.assertEqual(loaded["meta"]["cta"]["kind"], "partner")
        self.assertEqual(loaded["meta"]["cta"]["partner"], "bitget")

    def test_convert_all_matches_committed_outputs_from_reconstructed_writer_fixtures(self):
        with checkout_tempdir() as tmp:
            source = write_writer_fixtures(tmp / "source", self.writer_scripts)
            out = tmp / "out"
            written = converter.convert_all(source, out)

            self.assertEqual([path.name for path in written], [path.name for path in self.episode_paths])
            for expected_path in self.episode_paths:
                actual_path = out / expected_path.name
                self.assertEqual(json.loads(actual_path.read_text(encoding="utf-8")), json.loads(expected_path.read_text(encoding="utf-8")))

    def test_unknown_next_slug_fails(self):
        bad = json.loads(json.dumps(self.by_slug["what-am-i-buying"], ensure_ascii=False))
        bad["meta"]["next_slug"] = "missing-level"

        with self.assertRaisesRegex(ValueError, "unknown next_slug"):
            converter.convert_script(bad, self.by_slug)

    def test_validation_happens_before_write(self):
        with checkout_tempdir() as tmp:
            source = write_writer_fixtures(tmp / "source", self.writer_scripts)
            broken = json.loads((source / "01-what-am-i-buying.json").read_text(encoding="utf-8"))
            broken["scenes"][0]["visual"]["type"] = "not-supported"
            (source / "01-what-am-i-buying.json").write_text(json.dumps(broken, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            out = tmp / "out"

            with self.assertRaisesRegex(ValueError, "unsupported writer visual type"):
                converter.convert_all(source, out)

            self.assertFalse(out.exists())


def writer_from_episode(path: Path) -> dict:
    episode = json.loads(path.read_text(encoding="utf-8"))
    writer = {key: value for key, value in episode.items() if key not in {"meta", "scenes"}}
    writer["meta"] = episode["meta"]["writer_meta"]
    writer["scenes"] = []
    for scene in episode["scenes"]:
        writer_scene = {key: value for key, value in scene.items() if key != "visual"}
        writer_scene["visual"] = {
            "type": scene["visual"]["type"],
            "params": scene["visual"]["params"]["writer_params"],
        }
        writer["scenes"].append(writer_scene)
    return writer


def write_writer_fixtures(path: Path, scripts: list[dict]) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    for script in scripts:
        target = path / f"{script['meta']['level']:02d}-{script['meta']['slug']}.json"
        target.write_text(json.dumps(script, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


class checkout_tempdir:
    def __enter__(self) -> Path:
        self.path = Path(tempfile.mkdtemp(prefix=".test-converter-", dir=Path.cwd()))
        return self.path

    def __exit__(self, exc_type, exc, tb) -> None:
        shutil.rmtree(self.path)


if __name__ == "__main__":
    unittest.main()
