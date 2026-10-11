# -*- coding: utf-8 -*-
from __future__ import annotations

import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from PIL import Image

import engine
import visuals


class AcademyPolishRegressionTest(unittest.TestCase):
    def test_phone_mock_status_states_drive_icons_in_landscape_and_portrait(self):
        for value in ("未通过", "失败", "拒绝", "冻结", "错误", "failed", "rejected", "frozen", "error"):
            with self.subTest(value=value):
                self.assertEqual(visuals._field_state(value), "bad")
        self.assertEqual(visuals._field_state("示意画面，非真实界面"), "neutral")
        self.assertEqual(visuals._field_state("manual note only"), "neutral")
        with self.assertRaisesRegex(ValueError, "invalid phone field state"):
            visuals._field_state("未通过", explicit="validated")

        params = {
            "title": "交易所 App · 身份认证",
            "fields": [
                {"label": "状态", "value": "未通过"},
                {"label": "说明", "value": "示意画面，非真实界面"},
                {"label": "审核", "value": "通过", "state": "ok"},
            ],
        }
        for size, box in [
            ((1920, 1080), engine.scene_layout((1920, 1080))["component"]),
            ((1080, 1920), engine.scene_layout((1080, 1920))["component"]),
        ]:
            with self.subTest(size=size):
                icons: list[tuple[str, tuple[int, int], int]] = []
                fills: list[tuple[str, object]] = []
                original = visuals._status_icon
                original_text_fit = visuals.draw_text_fit

                def record_status_icon(draw, center, size, state):
                    icons.append((state, center, size))
                    return original(draw, center, size, state)

                def record_text_fit(draw, text_box, text, **kwargs):
                    fills.append((str(text), kwargs.get("fill")))
                    return original_text_fit(draw, text_box, text, **kwargs)

                image = Image.new("RGB", size, engine.BG)
                with mock.patch.object(visuals, "_status_icon", side_effect=record_status_icon), mock.patch.object(
                    visuals, "draw_text_fit", side_effect=record_text_fit
                ):
                    visuals.draw_visual(image, box, "phone-mock", params, t=4.0, duration=4.0, locale="zh-Hans")

                self.assertEqual([state for state, _, _ in icons], ["bad", "ok"])
                self.assertIn(("未通过", visuals.RED), fills)
                self.assertIn(("示意画面，非真实界面", visuals.MUTED), fills)
                for state, center, icon_size in icons:
                    radius = icon_size + 8
                    crop = image.crop((center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius))
                    red_pixels = sum(1 for r, g, b in crop.getdata() if r > 180 and g < 120 and b < 120)
                    green_pixels = sum(1 for r, g, b in crop.getdata() if g > 150 and r < 120 and b < 170)
                    if state == "bad":
                        self.assertGreater(red_pixels, 0)
                    elif state == "ok":
                        self.assertGreater(green_pixels, 0)
                    else:
                        self.assertEqual(red_pixels + green_pixels, 0)

    def test_flow_nodes_stay_inside_component_safe_box(self):
        cases = [
            {"steps": ["查看拒绝原因", "只改对应那一项", "重新提交"]},
            {"steps": ["查看拒绝原因", "只改对应那一项", "重新提交", "等待复审"], "note": "只提交改变过的一项"},
            {"nodes": ["拒绝后"], "branches": ["看原因", "改一项", "再提交"], "note": "不要重复提交同一份材料"},
        ]
        for size, box in [
            ((1920, 1080), engine.scene_layout((1920, 1080))["component"]),
            ((1080, 1920), engine.scene_layout((1080, 1920))["component"]),
        ]:
            for params in cases:
                with self.subTest(size=size, params=params):
                    rounded_boxes: list[tuple[int, int, int, int]] = []
                    original = visuals._rounded

                    def record_rounded(draw, rounded_box, radius, **kwargs):
                        if kwargs.get("outline") in {visuals.GREEN, visuals.BLUE, "#334056"}:
                            rounded_boxes.append(visuals._as_int_box(rounded_box))
                        return original(draw, rounded_box, radius, **kwargs)

                    image = Image.new("RGB", size, engine.BG)
                    with mock.patch.object(visuals, "_rounded", side_effect=record_rounded):
                        visuals.draw_visual(image, box, "flow", params, t=4.0, duration=4.0, locale="zh-Hans")

                    self.assertGreaterEqual(len(rounded_boxes), 3)
                    safe = 48
                    for rounded_box in rounded_boxes:
                        self.assertGreaterEqual(rounded_box[0], box[0] + safe)
                        self.assertLessEqual(rounded_box[2], box[2] - safe)
                        self.assertGreaterEqual(rounded_box[1], box[1] + safe)
                        self.assertLessEqual(rounded_box[3], box[3] - safe)

    def test_checklist_rows_use_loose_line_height_and_centered_text(self):
        params = {
            "title": "核对清单",
            "items": ["本人有效政府证件", "年满 18 岁", "网络稳定，光线充足的地方", "信息一致"],
            "all_checked": True,
        }
        for size, box in [
            ((1920, 1080), engine.scene_layout((1920, 1080))["component"]),
            ((1080, 1920), engine.scene_layout((1080, 1920))["component"]),
        ]:
            with self.subTest(size=size):
                rounded_boxes: list[tuple[int, int, int, int]] = []
                original = visuals._rounded

                def record_rounded(draw, rounded_box, radius, **kwargs):
                    if kwargs.get("outline") == visuals.GREEN:
                        rounded_boxes.append(visuals._as_int_box(rounded_box))
                    return original(draw, rounded_box, radius, **kwargs)

                image = Image.new("RGB", size, engine.BG)
                with mock.patch.object(visuals, "_rounded", side_effect=record_rounded):
                    visuals.draw_visual(image, box, "checklist", params, t=4.0, duration=4.0, locale="zh-Hans")

                calls = []
                original = visuals.draw_text_fit

                def record_text_fit(draw, text_box, text, **kwargs):
                    layout = original(draw, text_box, text, **kwargs)
                    calls.append((visuals._as_int_box(text_box), text, kwargs, layout))
                    return layout

                image = Image.new("RGB", size, engine.BG)
                with mock.patch.object(visuals, "draw_text_fit", side_effect=record_text_fit):
                    visuals.draw_visual(image, box, "checklist", params, t=4.0, duration=4.0, locale="zh-Hans")

                item_calls = [call for call in calls if call[1] in params["items"]]
                self.assertEqual(len(item_calls), len(params["items"]))
                for text_box, _, kwargs, layout in item_calls:
                    self.assertEqual(kwargs.get("line_spacing"), 1.6)
                    self.assertGreaterEqual(layout.font_size, 34)
                    self.assertEqual(kwargs.get("valign"), "center")
                    row_height = text_box[3] - text_box[1]
                    self.assertLessEqual(layout.height, row_height)

    def test_scene_layout_centers_component_and_frame_uses_it(self):
        script = {
            "meta": {
                "level": 4,
                "slug": "signup-and-kyc",
                "title_zh": "注册 + KYC 一次过",
                "title_en": "Pass signup and KYC",
                "next_title_zh": "先锁好账户",
                "next_title_en": "Lock your account first",
                "cta": {"kind": "none"},
            },
            "scenes": [
                {
                    "voice_zh": "看原因。",
                    "voice_en": "Read the reason.",
                    "title": "被拒怎么办",
                    "title_en": "If rejected",
                    "sub": "看原因 → 改一项 → 再提交",
                    "sub_en": "Read reason, change one item, resubmit",
                    "min_s": 4.0,
                    "visual": {"type": "flow", "params": {"steps": ["查看拒绝原因", "只改对应那一项", "重新提交"]}},
                }
            ],
        }
        timing = {"duration": 14, "end_start": 9, "scenes": [{"start": 3, "duration": 6}], "cues": []}
        for size in ((1920, 1080), (1080, 1920)):
            with self.subTest(size=size):
                layout = engine.scene_layout(size)
                component = layout["component"]
                height_ratio = (component[3] - component[1]) / size[1]
                self.assertGreaterEqual(height_ratio, 0.55)
                self.assertLessEqual(height_ratio, 0.65)
                available_center = (layout["sub"][3] + layout["caption"][1]) / 2
                component_center = (component[1] + component[3]) / 2
                self.assertLess(abs(component_center - available_center), 2)

                captured = {}

                def record_draw_visual(image, box, kind, params, t, duration, locale):
                    captured["box"] = box
                    return image

                with mock.patch.object(visuals, "draw_visual", side_effect=record_draw_visual):
                    engine.frame(copy.deepcopy(script), timing, 4.5, size, "zh-Hans", None, burn=True)

                self.assertEqual(captured["box"], component)


if __name__ == "__main__":
    unittest.main()
