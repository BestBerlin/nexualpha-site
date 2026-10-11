"""Animated PIL visual components for NexuAlpha academy episodes.

The engine owns scene layout and frame loops. This module owns the reusable
animated components and rejects text that cannot fit at the academy minimum
font size, so render failures happen during production instead of in a final
video frame.
"""

from __future__ import annotations

import glob
import math
import re
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Iterable, Mapping, Optional, Sequence, Union

from PIL import Image, ImageDraw, ImageFont


Color = Union[str, tuple[int, int, int], tuple[int, int, int, int]]
Box = tuple[float, float, float, float]

MIN_FONT_SIZE = 34
PINGFANG_GLOB = "/System/Library/AssetsV2/com_apple_MobileAsset_Font8/**/PingFang.ttc"
AVENIR_NEXT = "/System/Library/Fonts/Avenir Next.ttc"
AVENIR = "/System/Library/Fonts/Avenir.ttc"

BG = "#0b0d10"
PANEL = "#111720"
PANEL_2 = "#17202b"
STROKE = "#273244"
TEXT = "#f5f7fb"
MUTED = "#9ba6b8"
BLUE = "#4f7cff"
GREEN = "#3ddc97"
RED = "#ff5c5c"
AMBER = "#f8bb6a"


class TextOverflowError(ValueError):
    """Raised when text cannot fit inside a box at >= MIN_FONT_SIZE."""


@dataclass(frozen=True)
class TextLayout:
    text: str
    lines: tuple[str, ...]
    font: Union[ImageFont.FreeTypeFont, ImageFont.ImageFont]
    font_size: int
    line_height: int
    width: int
    height: int


def draw_visual(
    image: Image.Image,
    box: Box,
    kind: str,
    params: Optional[Mapping[str, Any]] = None,
    t: float = 0.0,
    duration: float = 1.0,
    locale: str = "zh-Hans",
) -> Image.Image:
    """Draw an animated academy visual component into ``image``.

    Args:
        image: Target PIL image. RGB and RGBA images are supported.
        box: Component bounds as ``(x0, y0, x1, y1)`` in final frame pixels.
        kind: One of ``flow``, ``phone-mock``, ``checklist``, ``compare-table``,
            ``warning-card``, ``number-counter``, ``timeline``,
            ``split-choice``, or ``quote``.
        params: Component data. Every field is optional and has a generic,
            exchange-neutral fallback.
        t: Seconds elapsed inside the current scene.
        duration: Total scene seconds. Used to normalize reveal timing.
        locale: Locale hint for font selection and text wrapping.

    Returns:
        The same image object, after drawing.

    Raises:
        TextOverflowError: If visible text cannot fit at >= 34 px.
        ValueError: If ``kind`` is unknown or ``box`` is invalid.
    """

    params = dict(params or {})
    bounds = _normalize_box(box, image.size)
    progress = _progress(t, duration)
    draw = ImageDraw.Draw(image, "RGBA")
    ctx = _Context(image=image, draw=draw, box=bounds, params=params, progress=progress, t=max(0.0, t), locale=locale)

    dispatch = {
        "flow": _draw_flow,
        "phone-mock": _draw_phone_mock,
        "checklist": _draw_checklist,
        "compare-table": _draw_compare_table,
        "warning-card": _draw_warning_card,
        "number-counter": _draw_number_counter,
        "timeline": _draw_timeline,
        "split-choice": _draw_split_choice,
        "splitchoice": _draw_split_choice,
        "quote": _draw_quote,
        "definition": _draw_quote,
    }
    try:
        dispatch[kind](ctx)
    except KeyError as exc:
        raise ValueError(f"unknown visual kind: {kind}") from exc
    return image


def fit_text(
    draw: ImageDraw.ImageDraw,
    text: Any,
    box: Box,
    *,
    locale: str = "zh-Hans",
    max_size: int = 64,
    min_size: int = MIN_FONT_SIZE,
    weight: str = "regular",
    line_spacing: float = 1.16,
    max_lines: Optional[int] = None,
) -> TextLayout:
    """Fit text inside a box without going below the academy font minimum."""

    if min_size < MIN_FONT_SIZE:
        raise ValueError(f"min_size must be at least {MIN_FONT_SIZE}px")
    value = _clean_text(text)
    x0, y0, x1, y1 = _as_int_box(box)
    width = max(0, x1 - x0)
    height = max(0, y1 - y0)
    if width <= 0 or height <= 0:
        raise TextOverflowError("text box has no drawable area")

    for size in range(max(max_size, min_size), min_size - 1, -2):
        font = load_font(size, locale=locale, weight=weight)
        lines = _wrap_text(draw, value, font, width, locale)
        if max_lines is not None and len(lines) > max_lines:
            continue
        line_height = max(int(size * line_spacing), size + 4)
        measured_width = max((_text_width(draw, line, font) for line in lines), default=0)
        measured_height = len(lines) * line_height - max(0, line_height - size)
        if measured_width <= width and measured_height <= height:
            return TextLayout(value, tuple(lines), font, size, line_height, measured_width, measured_height)

    font = load_font(min_size, locale=locale, weight=weight)
    lines = _wrap_text(draw, value, font, width, locale)
    measured_width = max((_text_width(draw, line, font) for line in lines), default=0)
    measured_height = len(lines) * max(int(min_size * line_spacing), min_size + 4)
    raise TextOverflowError(
        f"text overflows {width}x{height}px at {min_size}px: "
        f"{len(lines)} lines, measured {measured_width}x{measured_height}px"
    )


def draw_text_fit(
    draw: ImageDraw.ImageDraw,
    box: Box,
    text: Any,
    *,
    locale: str = "zh-Hans",
    fill: Color = TEXT,
    max_size: int = 64,
    min_size: int = MIN_FONT_SIZE,
    weight: str = "regular",
    align: str = "left",
    valign: str = "top",
    line_spacing: float = 1.16,
    max_lines: Optional[int] = None,
) -> TextLayout:
    """Fit and draw text inside a box, raising on overflow."""

    layout = fit_text(
        draw,
        text,
        box,
        locale=locale,
        max_size=max_size,
        min_size=min_size,
        weight=weight,
        line_spacing=line_spacing,
        max_lines=max_lines,
    )
    x0, y0, x1, y1 = _as_int_box(box)
    if valign == "center":
        y = y0 + max(0, (y1 - y0 - layout.height) // 2)
    elif valign == "bottom":
        y = y1 - layout.height
    else:
        y = y0

    for line in layout.lines:
        line_width = _text_width(draw, line, layout.font)
        if align == "center":
            x = x0 + (x1 - x0 - line_width) // 2
        elif align == "right":
            x = x1 - line_width
        else:
            x = x0
        draw.text((x, y), line, font=layout.font, fill=fill, anchor="lt")
        y += layout.line_height
    return layout


@lru_cache(maxsize=128)
def load_font(size: int, *, locale: str = "zh-Hans", weight: str = "regular") -> Union[ImageFont.FreeTypeFont, ImageFont.ImageFont]:
    """Load PingFang for CJK locales and Avenir Next elsewhere."""

    candidates: list[str] = []
    if _prefers_pingfang(locale):
        candidates.extend(glob.glob(PINGFANG_GLOB, recursive=True))
        candidates.extend([AVENIR_NEXT, AVENIR])
    else:
        candidates.extend([AVENIR_NEXT, AVENIR])
        candidates.extend(glob.glob(PINGFANG_GLOB, recursive=True))

    for path in candidates:
        try:
            if path.endswith("PingFang.ttc"):
                index = 11 if weight in {"bold", "semibold", "heavy"} else 3
            else:
                index = 0 if weight in {"bold", "semibold", "heavy"} else 7
            return ImageFont.truetype(path, size=size, index=index)
        except OSError:
            continue
    raise RuntimeError("Required PingFang SC / Avenir font is unavailable")


@dataclass
class _Context:
    image: Image.Image
    draw: ImageDraw.ImageDraw
    box: tuple[int, int, int, int]
    params: dict[str, Any]
    progress: float
    t: float
    locale: str

    @property
    def w(self) -> int:
        return self.box[2] - self.box[0]

    @property
    def h(self) -> int:
        return self.box[3] - self.box[1]

    def sx(self, value: float) -> int:
        return int(round(self.box[0] + self.w * value))

    def sy(self, value: float) -> int:
        return int(round(self.box[1] + self.h * value))

    def size(self, fraction: float, floor: int = MIN_FONT_SIZE) -> int:
        base = min(self.w, self.h)
        return max(floor, int(round(base * fraction)))


def _draw_flow(ctx: _Context) -> None:
    nodes = _list_param(ctx, "nodes", _list_param(ctx, "steps", ["Receiver", "Network", "Sender"]))
    branches = _list_param(ctx, "branches", [])
    edge_labels = _list_param(ctx, "labels", [])
    note = _param(ctx, "note", _param(ctx, "warning", _param(ctx, "label", None)))
    if len(nodes) < 2:
        nodes = [nodes[0], "Confirm"] if nodes else ["Receiver", "Confirm"]

    _rounded(ctx.draw, ctx.box, 28, fill="#0f151d", outline="#1e2a3a")
    if branches:
        _draw_flow_branches(ctx, nodes[0], branches, note)
        return

    count = len(nodes)
    vertical = ctx.h > ctx.w
    # Distribute node edges, rather than centres, inside the card's safe box.
    margin = max(48, int(min(ctx.w, ctx.h) * 0.08))
    gap = max(64, int((ctx.h if vertical else ctx.w) * 0.07))
    available = (ctx.h * (0.72 if note else 0.86) if vertical else ctx.w) - 2 * margin
    extent = int((available - gap * (count - 1)) / count)
    if extent < (76 if vertical else 96):
        raise TextOverflowError("flow nodes cannot fit inside the 48px safe margin")
    node_w = int(ctx.w * 0.72) if vertical else min(int(ctx.w * 0.26), extent)
    node_h = min(180, extent) if vertical else int(ctx.h * 0.46)
    extent = node_h if vertical else node_w
    span = count * extent + (count - 1) * gap
    origin = (ctx.sy(0.40 if note else 0.50) if vertical else ctx.sx(0.50)) - span / 2
    points = [(ctx.sx(0.50), int(origin + extent / 2 + i * (extent + gap))) if vertical
              else (int(origin + extent / 2 + i * (extent + gap)), ctx.sy(0.42 if note else 0.50)) for i in range(count)]
    active = min(count - 1, int(ctx.progress * count))
    for index in range(count - 1):
        x0, y0 = points[index]
        x1, y1 = points[index + 1]
        start = (x0, y0 + node_h // 2) if vertical else (x0 + node_w // 2, y0)
        end = (x1, y1 - node_h // 2) if vertical else (x1 - node_w // 2, y1)
        local = _range_progress(ctx.progress, index / (count - 1), (index + 1) / (count - 1))
        tip = tuple(int(a + (b - a) * local) for a, b in zip(start, end))
        ctx.draw.line(start + end, fill=_rgba(BLUE, 80), width=5)
        ctx.draw.line(start + tip, fill=BLUE, width=7)
        if vertical:
            ctx.draw.polygon([(end[0], end[1]), (end[0]-10, end[1]-16), (end[0]+10, end[1]-16)], fill=BLUE)
        else:
            _arrow(ctx.draw, (end[0] - 24, end[1]), end, BLUE)
        if index < len(edge_labels) and edge_labels[index]:
            label_box = (start[0] + 24, start[1], ctx.box[2] - margin, end[1]) if vertical else (start[0] - 30, y0 - node_h * 0.85, end[0] + 30, y0 - node_h * 0.52)
            draw_text_fit(ctx.draw, label_box, edge_labels[index], locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.043), align="center", valign="center", max_lines=2)
        ctx.draw.ellipse((tip[0]-10, tip[1]-10, tip[0]+10, tip[1]+10), fill=GREEN)
    for index, (x, y) in enumerate(points):
        box = (x - node_w // 2, y - node_h // 2, x + node_w // 2, y + node_h // 2)
        _rounded(ctx.draw, box, 22, fill="#172234" if index > active else "#14342d", outline=GREEN if index <= active else "#334056", width=3)
        draw_text_fit(ctx.draw, _pad(box, 24, 16, 24, 16), nodes[index], locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.072), align="center", valign="center", max_lines=3)
    if note:
        draw_text_fit(ctx.draw, (ctx.sx(0.09), ctx.sy(0.80), ctx.sx(0.91), ctx.sy(0.94)), note, locale=ctx.locale, fill=AMBER, max_size=ctx.size(0.046), align="center", valign="center", max_lines=2)


def _draw_phone_mock(ctx: _Context) -> None:
    title = _param(ctx, "title", _param(ctx, "screen", "Generic verification form"))
    pairs = _phone_fields(ctx)
    tabs = _list_param(ctx, "tabs", [])
    note = _param(ctx, "note", _param(ctx, "label", None))
    if ctx.w > ctx.h:
        _draw_phone_mock_compact(ctx, title, pairs, tabs, note)
        return
    phone_w = int(ctx.w * 0.72)
    phone_h = min(ctx.h, int(phone_w * 1.55))
    x0 = ctx.box[0] + (ctx.w - phone_w) // 2
    y0 = ctx.box[1] + (ctx.h - phone_h) // 2
    x1 = x0 + phone_w
    y1 = y0 + phone_h
    drift = int(math.sin(ctx.t * 1.4) * max(3, ctx.w * 0.004))

    _rounded(ctx.draw, (x0 + drift, y0, x1 + drift, y1), max(34, phone_w // 13), fill="#0e141c", outline="#344054", width=4)
    screen = (x0 + drift + phone_w * 0.07, y0 + phone_h * 0.06, x1 + drift - phone_w * 0.07, y1 - phone_h * 0.07)
    _rounded(ctx.draw, screen, max(24, phone_w // 18), fill="#121a24", outline="#202c3c")
    ctx.draw.rounded_rectangle((x0 + drift + phone_w * 0.38, y0 + phone_h * 0.025, x0 + drift + phone_w * 0.62, y0 + phone_h * 0.045), radius=6, fill="#2d3748")
    title_box = (
        int(screen[0] + phone_w * 0.07),
        int(screen[1] + phone_h * 0.06),
        int(screen[2] - phone_w * 0.07),
        int(screen[1] + phone_h * 0.18),
    )
    draw_text_fit(ctx.draw, title_box, title, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.062), weight="bold", max_lines=2)

    cursor_y = int(screen[1] + phone_h * 0.22)
    if tabs:
        tab_h = max(58, int(phone_h * 0.08))
        tab_gap = 10
        tab_w = int((screen[2] - screen[0] - phone_w * 0.10 - tab_gap * (len(tabs) - 1)) / max(1, len(tabs)))
        tab_x = int(screen[0] + phone_w * 0.05)
        for index, tab in enumerate(tabs):
            reveal = _range_progress(ctx.progress, index / max(1, len(tabs)), (index + 0.7) / max(1, len(tabs)))
            box = (tab_x + index * (tab_w + tab_gap), cursor_y, tab_x + index * (tab_w + tab_gap) + tab_w, cursor_y + tab_h)
            active = index == 0
            _rounded(ctx.draw, box, 16, fill="#183044" if active else "#182231", outline=BLUE if active else "#29364a", width=3 if active else 2)
            draw_text_fit(ctx.draw, _pad(box, 10, 4, 10, 4), tab, locale=ctx.locale, fill=TEXT if active else MUTED, max_size=38, weight="bold" if active else "regular", align="center", valign="center", max_lines=1)
        cursor_y += tab_h + 16

    start_y = cursor_y
    bottom_y = int(screen[3] - phone_h * (0.13 if note else 0.06))
    row_h = int((bottom_y - start_y) / max(1, len(pairs)))
    if row_h < 58:
        raise TextOverflowError(f"phone-mock has {len(pairs)} fields but only {bottom_y - start_y}px available")
    for index, (label, value, state) in enumerate(pairs):
        reveal = _range_progress(ctx.progress, index / max(1, len(pairs)), (index + 0.8) / max(1, len(pairs)))
        row = (int(screen[0] + phone_w * 0.05), start_y + index * row_h, int(screen[2] - phone_w * 0.05), start_y + index * row_h + row_h - 8)
        _rounded(ctx.draw, row, 18, fill="#182231", outline="#29364a")
        if row_h >= 82:
            label_box = (row[0] + 16, row[1] + 6, row[2] - 46, row[1] + 40)
            value_box = (row[0] + 16, row[1] + 42, row[2] - 46, row[3] - 6)
        else:
            label_box = (row[0] + 16, row[1] + 8, row[0] + int((row[2] - row[0]) * 0.44), row[3] - 8)
            value_box = (label_box[2] + 10, row[1] + 8, row[2] - 42, row[3] - 8)
        draw_text_fit(ctx.draw, label_box, label, locale=ctx.locale, fill=MUTED, max_size=38, max_lines=1, valign="center")
        visible = _clip_text(str(value), reveal)
        draw_text_fit(ctx.draw, value_box, visible or " ", locale=ctx.locale, fill={"ok": GREEN, "bad": RED, "neutral": MUTED}[state], max_size=42, weight="bold", max_lines=2 if row_h >= 96 else 1, valign="center")
        if reveal >= 0.98 and state != "neutral":
            _status_icon(ctx.draw, (int(row[2] - 30), int((row[1] + row[3]) / 2)), 15, state)
    if note:
        draw_text_fit(ctx.draw, (int(screen[0] + phone_w * 0.05), int(screen[3] - phone_h * 0.11), int(screen[2] - phone_w * 0.05), int(screen[3] - phone_h * 0.03)), note, locale=ctx.locale, fill=MUTED, max_size=36, align="center", valign="center", max_lines=2)


def _draw_phone_mock_compact(ctx: _Context, title: Any, pairs: Sequence[tuple[str, str, str]], tabs: Sequence[str], note: Any) -> None:
    _rounded(ctx.draw, ctx.box, 28, fill="#0e141c", outline="#344054", width=4)
    screen = _pad(ctx.box, ctx.w * 0.035, ctx.h * 0.06, ctx.w * 0.035, ctx.h * 0.04)
    _rounded(ctx.draw, screen, 22, fill="#121a24", outline="#202c3c")
    ctx.draw.rounded_rectangle((ctx.sx(0.43), ctx.sy(0.045), ctx.sx(0.57), ctx.sy(0.065)), radius=7, fill="#2d3748")
    draw_text_fit(ctx.draw, (screen[0] + 24, screen[1] + 8, screen[2] - 24, screen[1] + 50), title, locale=ctx.locale, fill=TEXT, max_size=42, weight="bold", max_lines=1, valign="center")
    rows_top = screen[1] + 54
    if tabs:
        tab_h = 48
        gap = 8
        tab_w = int((screen[2] - screen[0] - 44 - gap * (len(tabs) - 1)) / max(1, len(tabs)))
        for index, tab in enumerate(tabs):
            box = (screen[0] + 22 + index * (tab_w + gap), rows_top, screen[0] + 22 + index * (tab_w + gap) + tab_w, rows_top + tab_h)
            _rounded(ctx.draw, box, 14, fill="#183044" if index == 0 else "#182231", outline=BLUE if index == 0 else "#29364a")
            draw_text_fit(ctx.draw, _pad(box, 8, 3, 8, 3), tab, locale=ctx.locale, fill=TEXT if index == 0 else MUTED, max_size=36, align="center", valign="center", max_lines=1)
        rows_top += tab_h + 10
    rows_bottom = screen[3] - (54 if note else 12)
    row_h = int((rows_bottom - rows_top) / max(1, len(pairs)))
    if row_h < 46:
        raise TextOverflowError(f"phone-mock has {len(pairs)} fields but only {rows_bottom - rows_top}px available")
    for index, (label, value, state) in enumerate(pairs):
        reveal = _range_progress(ctx.progress, index / max(1, len(pairs)), (index + 0.8) / max(1, len(pairs)))
        row = (screen[0] + 22, rows_top + index * row_h, screen[2] - 22, rows_top + index * row_h + row_h - 8)
        _rounded(ctx.draw, row, 16, fill="#182231", outline="#29364a")
        label_box = (row[0] + 16, row[1] + 6, row[0] + int((row[2] - row[0]) * 0.34), row[3] - 6)
        value_box = (label_box[2] + 12, row[1] + 6, row[2] - 44, row[3] - 6)
        draw_text_fit(ctx.draw, label_box, label, locale=ctx.locale, fill=MUTED, max_size=38, max_lines=1, valign="center")
        draw_text_fit(ctx.draw, value_box, _clip_text(str(value), reveal) or " ", locale=ctx.locale, fill={"ok": GREEN, "bad": RED, "neutral": MUTED}[state], max_size=40, weight="bold", max_lines=2 if row_h >= 82 else 1, valign="center")
        if reveal >= 0.98 and state != "neutral":
            _status_icon(ctx.draw, (row[2] - 26, (row[1] + row[3]) // 2), 14, state)
    if note:
        draw_text_fit(ctx.draw, (screen[0] + 22, screen[3] - 50, screen[2] - 22, screen[3] - 10), note, locale=ctx.locale, fill=MUTED, max_size=34, align="center", valign="center", max_lines=1)


def _draw_checklist(ctx: _Context) -> None:
    title = _param(ctx, "title", "核对清单" if _prefers_pingfang(ctx.locale) else "Checklist")
    items = _list_param(ctx, "items", ["Asset matches", "Network matches", "Address checked", "Memo included if required"])
    active_raw = _param(ctx, "active", None)
    all_checked = bool(_param(ctx, "all_checked", False))
    example = _param(ctx, "example", None)
    risk_note = _param(ctx, "risk_note", None)
    _rounded(ctx.draw, ctx.box, 30, fill="#101721", outline="#26364a")
    draw_text_fit(ctx.draw, (ctx.sx(0.07), ctx.sy(0.06), ctx.sx(0.93), ctx.sy(0.18)), title, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.058), weight="bold", max_lines=2)
    if ctx.h < 420 and len(items) >= 5:
        _draw_checklist_tiles(ctx, items)
        return
    top = ctx.sy(0.21)
    bottom = ctx.sy(0.87 if (example or risk_note) else 0.90)
    row_h = int((bottom - top) / max(1, len(items)))
    if row_h < math.ceil(MIN_FONT_SIZE * 1.6) + 20:
        raise TextOverflowError(f"checklist has {len(items)} items but only {bottom - top}px available")
    active = int(active_raw) if isinstance(active_raw, int) and not isinstance(active_raw, bool) else None
    for index, item in enumerate(items):
        reveal = _range_progress(ctx.progress, index / max(1, len(items)), (index + 0.7) / max(1, len(items)))
        y0 = top + index * row_h
        row = (ctx.sx(0.08), y0, ctx.sx(0.92), y0 + row_h - 12)
        highlighted = all_checked or active == index or (active is None and reveal > 0.55)
        _rounded(ctx.draw, row, 18, fill=_rgba("#172130", int(95 + 70 * reveal)), outline=GREEN if highlighted else "#2b3a50", width=3 if highlighted else 2)
        cx = row[0] + max(30, min(42, row_h // 2))
        cy = (row[1] + row[3]) // 2
        icon = max(15, min(19, row_h // 3))
        ctx.draw.ellipse((cx - icon, cy - icon, cx + icon, cy + icon), outline=GREEN if highlighted else "#48576c", width=3)
        if highlighted:
            _check(ctx.draw, (cx, cy), icon, GREEN)
        draw_text_fit(ctx.draw, (cx + icon + 16, row[1] + 3, row[2] - 16, row[3] - 3), item, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.065), line_spacing=1.6, max_lines=2, valign="center")
    footer = example or risk_note
    if footer:
        draw_text_fit(ctx.draw, (ctx.sx(0.09), ctx.sy(0.875), ctx.sx(0.91), ctx.sy(0.98)), footer, locale=ctx.locale, fill=AMBER if risk_note else MUTED, max_size=ctx.size(0.040), align="center", valign="center", max_lines=2)


def _draw_checklist_tiles(ctx: _Context, items: Sequence[str]) -> None:
    left = ctx.sx(0.06)
    right = ctx.sx(0.94)
    top = ctx.sy(0.30)
    bottom = ctx.sy(0.88)
    gap = max(10, int(ctx.w * 0.008))
    tile_w = int((right - left - gap * (len(items) - 1)) / max(1, len(items)))
    if tile_w < 96 or bottom - top < 120:
        raise TextOverflowError(f"checklist tile layout cannot fit {len(items)} items")
    for index, item in enumerate(items):
        reveal = _range_progress(ctx.progress, index / max(1, len(items)), (index + 0.7) / max(1, len(items)))
        x0 = left + index * (tile_w + gap)
        tile = (x0, top, x0 + tile_w, bottom)
        _rounded(ctx.draw, tile, 18, fill=_rgba("#172130", int(95 + 70 * reveal)), outline="#2b3a50")
        cx = (tile[0] + tile[2]) // 2
        cy = tile[1] + 32
        icon = 16
        ctx.draw.ellipse((cx - icon, cy - icon, cx + icon, cy + icon), outline=GREEN if reveal > 0.45 else "#48576c", width=3)
        if reveal > 0.55:
            _check(ctx.draw, (cx, cy), icon, GREEN)
        draw_text_fit(ctx.draw, (tile[0] + 12, tile[1] + 62, tile[2] - 12, tile[3] - 12), item, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.05), line_spacing=1.6, align="center", valign="center", max_lines=3)


def _draw_compare_table(ctx: _Context) -> None:
    source_params = ctx.params.get("writer_params") if isinstance(ctx.params.get("writer_params"), Mapping) else ctx.params
    table_ctx = _Context(ctx.image, ctx.draw, ctx.box, dict(source_params), ctx.progress, ctx.t, ctx.locale)
    columns = _list_param(table_ctx, "columns", ["Receiver", "Sender"])
    rows = _param(table_ctx, "rows", [["Asset", "USDT", "USDT"], ["Network", "ERC-20", "ERC-20"], ["Memo", "Required", "Included"]])
    if not isinstance(rows, Sequence):
        rows = []
    rows = [list(row) if isinstance(row, Sequence) and not isinstance(row, str) else [row] for row in rows]
    note = _param(table_ctx, "note", _param(table_ctx, "risk_note", None))
    if len(columns) == 2 and any(len(row) == 3 for row in rows):
        columns = [""] + columns
    max_cols = max([len(columns), *(len(row) for row in rows)] or [2])
    max_cols = max(2, min(4, max_cols))
    columns = (columns + [""] * max_cols)[:max_cols]
    rows = [(row + [""] * max_cols)[:max_cols] for row in rows]
    _rounded(ctx.draw, ctx.box, 26, fill="#101721", outline="#28374a")
    left = ctx.sx(0.06)
    right = ctx.sx(0.94)
    header_h = max(54, min(82, int(ctx.h * 0.17)))
    header = (left, ctx.sy(0.055), right, ctx.sy(0.055) + header_h)
    _rounded(ctx.draw, header, 16, fill="#162134", outline="#2a3a54")
    widths = _table_widths(max_cols)
    edges = _scaled_edges(left, right, widths)
    for col, heading in enumerate(columns):
        draw_text_fit(ctx.draw, (edges[col] + 10, header[1] + 8, edges[col + 1] - 10, header[3] - 8), heading, locale=ctx.locale, fill=BLUE if col else MUTED, max_size=ctx.size(0.046), weight="bold", align="center" if col else "left", valign="center", max_lines=1)
    rows_top = header[3] + max(6, int(ctx.h * 0.020))
    rows_bottom = ctx.sy(0.84 if note else 0.92)
    row_h = int((rows_bottom - rows_top) / max(1, len(rows)))
    if row_h < 48:
        raise TextOverflowError(f"compare-table has {len(rows)} rows but only {rows_bottom - rows_top}px available")
    for index, row in enumerate(rows):
        reveal = _range_progress(ctx.progress, index / max(1, len(rows)), (index + 0.7) / max(1, len(rows)))
        y0 = rows_top + index * row_h
        alpha = int(60 + 120 * reveal)
        fill = _rgba("#152132", alpha)
        _rounded(ctx.draw, (left, y0, right, y0 + row_h - 12), 14, fill=fill, outline="#253449")
        comparable = len(row) >= 3 and str(row[-1]).lower().replace(" ✓", "") == str(row[-2]).lower()
        for col, cell in enumerate(row):
            fill_color = MUTED if col == 0 else (GREEN if col == max_cols - 1 and comparable else TEXT)
            draw_text_fit(ctx.draw, (edges[col] + 10, y0 + 3, edges[col + 1] - 10, y0 + row_h - 7), cell, locale=ctx.locale, fill=fill_color, max_size=ctx.size(0.044), weight="bold" if col == 0 else "regular", align="center" if col else "left", valign="center", max_lines=2 if row_h >= 72 else 1)
    if note:
        draw_text_fit(ctx.draw, (ctx.sx(0.08), ctx.sy(0.855), ctx.sx(0.92), ctx.sy(0.98)), note, locale=ctx.locale, fill=AMBER, max_size=ctx.size(0.038), align="center", valign="center", max_lines=2)


def _draw_warning_card(ctx: _Context) -> None:
    level = str(_param(ctx, "level", "warn")).lower()
    title = _param(ctx, "title", _param(ctx, "text", "Check before you confirm"))
    items = _list_param(ctx, "items", [])
    body = _param(ctx, "body", _param(ctx, "detail", "\n".join(items) if items else "A lower fee is not a reason to choose a different network."))
    source = _param(ctx, "source", None)
    color = RED if level in {"danger", "warn"} else AMBER
    pulse = 0.5 + 0.5 * math.sin(ctx.t * 2.6)
    inset = int(max(0, math.sin(ctx.t * 1.8)) * ctx.w * 0.006)
    card = (ctx.box[0] + inset, ctx.box[1] + inset, ctx.box[2] - inset, ctx.box[3] - inset)
    _rounded(ctx.draw, card, 30, fill="#211316" if level != "info" else "#181b16", outline=_rgba(color, int(150 + 80 * pulse)), width=4)
    cx = ctx.sx(0.16)
    cy = ctx.sy(0.30)
    size = min(ctx.w, ctx.h) * 0.12
    ctx.draw.polygon([(cx, cy - size), (cx - size, cy + size * 0.78), (cx + size, cy + size * 0.78)], fill=_rgba(color, 75), outline=color)
    mark_w = max(5, int(size * 0.12))
    ctx.draw.line((cx, cy - size * 0.30, cx, cy + size * 0.22), fill=color, width=mark_w)
    dot = max(4, int(size * 0.10))
    ctx.draw.ellipse((cx - dot, cy + size * 0.38 - dot, cx + dot, cy + size * 0.38 + dot), fill=color)
    draw_text_fit(ctx.draw, (ctx.sx(0.30), ctx.sy(0.16), ctx.sx(0.91), ctx.sy(0.40)), title, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.075), weight="bold", max_lines=2)
    body_box = (ctx.sx(0.10), ctx.sy(0.47), ctx.sx(0.90), ctx.sy(0.76 if source else 0.84))
    draw_text_fit(ctx.draw, body_box, body, locale=ctx.locale, fill="#ffdfe1", max_size=ctx.size(0.055), max_lines=4, valign="center")
    if source:
        draw_text_fit(ctx.draw, (ctx.sx(0.12), ctx.sy(0.78), ctx.sx(0.88), ctx.sy(0.92)), source, locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.040), align="center", valign="center", max_lines=1)


def _draw_number_counter(ctx: _Context) -> None:
    label = _param(ctx, "label", "Checks before confirm")
    _rounded(ctx.draw, ctx.box, 34, fill="#101721", outline="#28374a")
    orbit = 0.5 + 0.5 * math.sin(ctx.t * 1.3)
    ctx.draw.ellipse((ctx.sx(0.62), ctx.sy(0.10 + orbit * 0.05), ctx.sx(0.92), ctx.sy(0.46 + orbit * 0.05)), fill=_rgba(BLUE, 28))
    if "from" in ctx.params or "rate" in ctx.params or "result" in ctx.params:
        source = f"{_param(ctx, 'from', '')} {_param(ctx, 'unit', '')}".strip()
        rate = _param(ctx, "rate", "")
        result = _param(ctx, "result", "")
        draw_text_fit(ctx.draw, (ctx.sx(0.09), ctx.sy(0.13), ctx.sx(0.91), ctx.sy(0.27)), label, locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.052), weight="bold", align="center", max_lines=1)
        draw_text_fit(ctx.draw, (ctx.sx(0.10), ctx.sy(0.31), ctx.sx(0.42), ctx.sy(0.60)), source, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.090), weight="bold", align="center", valign="center", max_lines=1)
        draw_text_fit(ctx.draw, (ctx.sx(0.44), ctx.sy(0.31), ctx.sx(0.57), ctx.sy(0.60)), "×", locale=ctx.locale, fill=BLUE, max_size=ctx.size(0.080), align="center", valign="center", max_lines=1)
        draw_text_fit(ctx.draw, (ctx.sx(0.59), ctx.sy(0.31), ctx.sx(0.90), ctx.sy(0.60)), rate, locale=ctx.locale, fill=AMBER, max_size=ctx.size(0.090), weight="bold", align="center", valign="center", max_lines=1)
        draw_text_fit(ctx.draw, (ctx.sx(0.11), ctx.sy(0.66), ctx.sx(0.89), ctx.sy(0.86)), result, locale=ctx.locale, fill=GREEN, max_size=ctx.size(0.060), weight="bold", align="center", valign="center", max_lines=2)
        return
    formula_keys = ["margin", "leverage", "position", "move", "loss"]
    if any(key in ctx.params for key in formula_keys):
        values = [(key, _param(ctx, key, "")) for key in formula_keys if _param(ctx, key, None) not in (None, "")]
        draw_text_fit(ctx.draw, (ctx.sx(0.09), ctx.sy(0.09), ctx.sx(0.91), ctx.sy(0.22)), label, locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.050), weight="bold", align="center", max_lines=1)
        grid_top = ctx.sy(0.27)
        grid_bottom = ctx.sy(0.77)
        cols = 3 if ctx.w >= ctx.h else 2
        rows = math.ceil(len(values) / cols)
        gap = max(10, int(ctx.w * 0.012))
        cell_w = int((ctx.sx(0.88) - ctx.sx(0.12) - gap * (cols - 1)) / cols)
        cell_h = int((grid_bottom - grid_top - gap * (rows - 1)) / rows)
        if cell_h < 72:
            raise TextOverflowError(f"number-counter formula grid cannot fit {len(values)} values")
        for index, (_, value_text) in enumerate(values):
            col = index % cols
            row = index // cols
            x0 = ctx.sx(0.12) + col * (cell_w + gap)
            y0 = grid_top + row * (cell_h + gap)
            card = (x0, y0, x0 + cell_w, y0 + cell_h)
            last = index == len(values) - 1
            _rounded(ctx.draw, card, 18, fill="#142336" if not last else "#123327", outline=GREEN if last else "#27364c", width=3 if last else 2)
            draw_text_fit(ctx.draw, _pad(card, 10, 6, 10, 6), value_text, locale=ctx.locale, fill=GREEN if last else TEXT, max_size=ctx.size(0.055), weight="bold", align="center", valign="center", max_lines=1)
        risk_note = _param(ctx, "risk_note", None)
        if risk_note:
            draw_text_fit(ctx.draw, (ctx.sx(0.10), ctx.sy(0.82), ctx.sx(0.90), ctx.sy(0.92)), risk_note, locale=ctx.locale, fill=AMBER, max_size=ctx.size(0.038), align="center", valign="center", max_lines=2)
        return

    value = _param(ctx, "value", _param(ctx, "end", 5))
    if _is_number(value):
        start = float(_param(ctx, "start", 0))
        end = float(value)
        suffix = str(_param(ctx, "suffix", ""))
        decimals = int(_param(ctx, "decimals", 0))
        current = start + (end - start) * _ease_out_cubic(ctx.progress)
        number = f"{current:,.{decimals}f}{suffix}"
    else:
        number = str(value)
    draw_text_fit(ctx.draw, (ctx.sx(0.09), ctx.sy(0.16), ctx.sx(0.91), ctx.sy(0.34)), label, locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.055), weight="bold", align="center", max_lines=2)
    draw_text_fit(ctx.draw, (ctx.sx(0.08), ctx.sy(0.37), ctx.sx(0.92), ctx.sy(0.67)), number, locale=ctx.locale, fill=GREEN, max_size=ctx.size(0.18), weight="bold", align="center", valign="center", max_lines=1)
    caption = _param(ctx, "caption", None)
    steps = _list_param(ctx, "steps", [])
    footer = caption or " · ".join(steps)
    if footer:
        draw_text_fit(ctx.draw, (ctx.sx(0.12), ctx.sy(0.72), ctx.sx(0.88), ctx.sy(0.90)), footer, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.05), align="center", max_lines=2)


def _draw_timeline(ctx: _Context) -> None:
    events = _timeline_events(ctx)
    source = _param(ctx, "source", _param(ctx, "risk_note", None))
    _rounded(ctx.draw, ctx.box, 28, fill="#101721", outline="#28374a")
    count = len(events)
    vertical = ctx.image.height > ctx.image.width
    if vertical:
        x = ctx.sx(0.14)
        top, bottom = ctx.sy(0.10), ctx.sy(0.82 if source else 0.91)
        row_h = (bottom - top) / count
        centers = [top + (i + 0.5) * row_h for i in range(count)]
        ctx.draw.line((x, centers[0], x, centers[-1]), fill="#2a3648", width=5)
        ctx.draw.line((x, centers[0], x, centers[0] + (centers[-1] - centers[0]) * ctx.progress), fill=BLUE, width=7)
        for index, (date, event) in enumerate(events):
            y = centers[index]
            reveal = _range_progress(ctx.progress, index / count, (index + 0.8) / count)
            ctx.draw.ellipse((x - 18, y - 18, x + 18, y + 18), fill=GREEN if reveal > 0.8 else "#1f2a3a", outline=BLUE, width=3)
            label = f"{date} · {event}" if date else event
            draw_text_fit(ctx.draw, (ctx.sx(0.23), top + index * row_h + 8, ctx.sx(0.92), top + (index + 1) * row_h - 8), label, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.048), valign="center", max_lines=4)
    else:
        left, right = ctx.sx(0.04), ctx.sx(0.96)
        cell_w = (right - left) / count
        y = ctx.sy(0.20)
        centers = [left + (i + 0.5) * cell_w for i in range(count)]
        ctx.draw.line((centers[0], y, centers[-1], y), fill="#2a3648", width=5)
        ctx.draw.line((centers[0], y, centers[0] + (centers[-1] - centers[0]) * ctx.progress, y), fill=BLUE, width=7)
        for index, (date, event) in enumerate(events):
            x = centers[index]
            reveal = _range_progress(ctx.progress, index / count, (index + 0.8) / count)
            ctx.draw.ellipse((x - 18, y - 18, x + 18, y + 18), fill=GREEN if reveal > 0.8 else "#1f2a3a", outline=BLUE, width=3)
            label = f"{date} · {event}" if date else event
            draw_text_fit(ctx.draw, (left + index * cell_w + 16, ctx.sy(0.32), left + (index + 1) * cell_w - 16, ctx.sy(0.79 if source else 0.91)), label, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.045), align="center", valign="center", max_lines=4)
    if source:
        draw_text_fit(ctx.draw, (ctx.sx(0.10), ctx.sy(0.84), ctx.sx(0.90), ctx.sy(0.97)), source, locale=ctx.locale, fill=MUTED if "sec" in str(source).lower() or "sfc" in str(source).lower() else AMBER, max_size=ctx.size(0.038), align="center", valign="center", max_lines=2)


def _draw_split_choice(ctx: _Context) -> None:
    options = _list_param(ctx, "options", [])
    question = _param(ctx, "question", None)
    note = _param(ctx, "note", None)
    highlight = _param(ctx, "highlight", 0)
    if options:
        choices = [(option, "") for option in options[:3]]
    else:
        left = _param(ctx, "left", "Exact match")
        right = _param(ctx, "right", "Different network")
        left_caption = _param(ctx, "left_caption", "Continue")
        right_caption = _param(ctx, "right_caption", "Pause")
        choices = [(left, left_caption), (right, right_caption)]
    if question:
        draw_text_fit(ctx.draw, (ctx.sx(0.08), ctx.sy(0.06), ctx.sx(0.92), ctx.sy(0.18)), question, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.058), weight="bold", align="center", valign="center", max_lines=2)
    gap = max(24, int(ctx.w * 0.035))
    y0 = ctx.sy(0.22 if question else 0.16)
    y1 = ctx.sy(0.76 if note else 0.84)
    left_edge = ctx.sx(0.06)
    right_edge = ctx.sx(0.94)
    count = len(choices)
    image_vertical = ctx.image.height > ctx.image.width
    if image_vertical and count >= 3:
        row_gap = max(18, int(ctx.h * 0.018))
        card_h = int((y1 - y0 - row_gap * (count - 1)) / count)
        for index, (title, caption) in enumerate(choices):
            top = y0 + index * (card_h + row_gap)
            box = (left_edge, top, right_edge, top + card_h)
            _choice_row(ctx, box, title, int(highlight) == index, _range_progress(ctx.progress, index * 0.10, 0.72 + index * 0.10))
        if note:
            draw_text_fit(ctx.draw, (ctx.sx(0.10), ctx.sy(0.79), ctx.sx(0.90), ctx.sy(0.91)), note, locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.044), align="center", valign="center", max_lines=2)
        return
    card_w = int((right_edge - left_edge - gap * (count - 1)) / max(1, count))
    for index, (title, caption) in enumerate(choices):
        box = (left_edge + index * (card_w + gap), y0, left_edge + index * (card_w + gap) + card_w, y1)
        _choice_card(ctx, box, title, caption, int(highlight) == index, _range_progress(ctx.progress, index * 0.10, 0.72 + index * 0.10))
    if note:
        draw_text_fit(ctx.draw, (ctx.sx(0.10), ctx.sy(0.79), ctx.sx(0.90), ctx.sy(0.91)), note, locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.044), align="center", valign="center", max_lines=2)


def _draw_quote(ctx: _Context) -> None:
    if "term" in ctx.params or "lines" in ctx.params:
        _draw_definition(ctx)
        return
    quote = _param(ctx, "quote", _param(ctx, "text", "Network first. Address next. Confirm once."))
    source = _param(ctx, "source", _param(ctx, "label", "NexuAlpha Starter Path"))
    _rounded(ctx.draw, ctx.box, 34, fill="#101721", outline="#28374a")
    ctx.draw.rectangle((ctx.sx(0.08), ctx.sy(0.18), ctx.sx(0.095), ctx.sy(0.78)), fill=BLUE)
    draw_text_fit(ctx.draw, (ctx.sx(0.14), ctx.sy(0.16), ctx.sx(0.90), ctx.sy(0.66)), quote, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.085), weight="bold", valign="center", max_lines=5)
    draw_text_fit(ctx.draw, (ctx.sx(0.14), ctx.sy(0.72), ctx.sx(0.90), ctx.sy(0.86)), source, locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.045), max_lines=2)
    glint = ctx.sx(0.12 + 0.70 * ((ctx.t * 0.16) % 1.0))
    ctx.draw.line((glint, ctx.sy(0.16), glint + ctx.w * 0.10, ctx.sy(0.86)), fill=_rgba("#ffffff", 22), width=max(2, ctx.w // 260))


def _draw_definition(ctx: _Context) -> None:
    term = _param(ctx, "term", "Definition")
    lines = _list_param(ctx, "lines", [])
    body = "\n".join(lines) if lines else _param(ctx, "text", "")
    source = _param(ctx, "source", _param(ctx, "risk_note", None))
    _rounded(ctx.draw, ctx.box, 34, fill="#101721", outline="#28374a")
    ctx.draw.rectangle((ctx.sx(0.08), ctx.sy(0.16), ctx.sx(0.095), ctx.sy(0.82)), fill=BLUE)
    draw_text_fit(ctx.draw, (ctx.sx(0.14), ctx.sy(0.12), ctx.sx(0.90), ctx.sy(0.32)), term, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.090), weight="bold", valign="center", max_lines=2)
    body_bottom = ctx.sy(0.70 if source else 0.82)
    if body:
        draw_text_fit(ctx.draw, (ctx.sx(0.15), ctx.sy(0.36), ctx.sx(0.90), body_bottom), body, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.052), valign="center", max_lines=max(3, len(lines)))
    if source:
        draw_text_fit(ctx.draw, (ctx.sx(0.15), ctx.sy(0.73), ctx.sx(0.90), ctx.sy(0.88)), source, locale=ctx.locale, fill=AMBER if "风险" in str(source) else MUTED, max_size=ctx.size(0.040), max_lines=2)
    glint = ctx.sx(0.12 + 0.70 * ((ctx.t * 0.16) % 1.0))
    ctx.draw.line((glint, ctx.sy(0.14), glint + ctx.w * 0.10, ctx.sy(0.86)), fill=_rgba("#ffffff", 22), width=max(2, ctx.w // 260))


def _draw_flow_branches(ctx: _Context, root: str, branches: Sequence[str], note: Any) -> None:
    root_box = (ctx.sx(0.08), ctx.sy(0.28), ctx.sx(0.34), ctx.sy(0.62))
    _rounded(ctx.draw, root_box, 24, fill="#14342d", outline=GREEN, width=3)
    draw_text_fit(ctx.draw, _pad(root_box, 14, 12, 14, 12), root, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.060), weight="bold", align="center", valign="center", max_lines=2)
    right_x0 = ctx.sx(0.48)
    right_x1 = ctx.sx(0.92)
    top = ctx.sy(0.18)
    bottom = ctx.sy(0.76 if note else 0.84)
    row_h = int((bottom - top) / max(1, len(branches)))
    for index, branch in enumerate(branches):
        y0 = top + index * row_h
        card = (right_x0, y0, right_x1, y0 + row_h - 10)
        reveal = _range_progress(ctx.progress, index / max(1, len(branches)), (index + 0.7) / max(1, len(branches)))
        _rounded(ctx.draw, card, 20, fill=_rgba("#172234", int(100 + 70 * reveal)), outline=BLUE)
        start = (root_box[2], (root_box[1] + root_box[3]) // 2)
        end = (card[0], (card[1] + card[3]) // 2)
        ctx.draw.line(start + end, fill=_rgba(BLUE, int(80 + 120 * reveal)), width=5)
        _arrow(ctx.draw, (end[0] - 26, end[1]), (end[0] - 2, end[1]), BLUE)
        draw_text_fit(ctx.draw, _pad(card, 18, 8, 18, 8), branch, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.054), align="center", valign="center", max_lines=2)
    if note:
        draw_text_fit(ctx.draw, (ctx.sx(0.09), ctx.sy(0.80), ctx.sx(0.91), ctx.sy(0.92)), note, locale=ctx.locale, fill=AMBER, max_size=ctx.size(0.044), align="center", valign="center", max_lines=2)


def _choice_card(ctx: _Context, box: tuple[int, int, int, int], title: Any, caption: Any, ok: bool, reveal: float) -> None:
    neutral = not bool(_clean_text(caption))
    color = GREEN if ok else (BLUE if neutral else RED)
    fill = "#10231e" if ok else ("#172234" if neutral else "#24171a")
    _rounded(ctx.draw, box, 24, fill=_rgba(fill, int(105 + 70 * reveal)), outline=_rgba(color, int(80 + 145 * reveal)), width=3)
    cx = (box[0] + box[2]) // 2
    card_h = box[3] - box[1]
    icon_size = max(28, min(36, card_h // 7))
    icon_y = int(box[1] + card_h * 0.23)
    ctx.draw.ellipse((cx - icon_size, icon_y - icon_size, cx + icon_size, icon_y + icon_size), fill=_rgba(color, 44), outline=color, width=4)
    if ok:
        _check(ctx.draw, (cx, icon_y), max(20, icon_size - 6), color)
    elif not neutral:
        cross = max(14, icon_size - 12)
        ctx.draw.line((cx - cross, icon_y - cross, cx + cross, icon_y + cross), fill=color, width=7)
        ctx.draw.line((cx + cross, icon_y - cross, cx - cross, icon_y + cross), fill=color, width=7)
    draw_text_fit(ctx.draw, (box[0] + 28, box[1] + card_h * 0.40, box[2] - 28, box[1] + card_h * 0.66), title, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.058), weight="bold", align="center", valign="center", max_lines=2)
    if not neutral:
        draw_text_fit(ctx.draw, (box[0] + 28, box[1] + card_h * 0.70, box[2] - 28, box[3] - 20), caption, locale=ctx.locale, fill=color, max_size=ctx.size(0.045), align="center", valign="center", max_lines=2)


def _choice_row(ctx: _Context, box: tuple[int, int, int, int], title: Any, active: bool, reveal: float) -> None:
    color = GREEN if active else BLUE
    fill = "#10231e" if active else "#172234"
    _rounded(ctx.draw, box, 22, fill=_rgba(fill, int(110 + 65 * reveal)), outline=_rgba(color, int(100 + 120 * reveal)), width=3 if active else 2)
    cy = (box[1] + box[3]) // 2
    icon_size = max(22, min(32, (box[3] - box[1]) // 4))
    cx = box[0] + 54
    ctx.draw.ellipse((cx - icon_size, cy - icon_size, cx + icon_size, cy + icon_size), fill=_rgba(color, 44), outline=color, width=4)
    if active:
        _check(ctx.draw, (cx, cy), max(18, icon_size - 6), color)
    draw_text_fit(ctx.draw, (box[0] + 100, box[1] + 14, box[2] - 28, box[3] - 14), title, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.052), weight="bold", valign="center", max_lines=2)


def _table_widths(columns: int) -> list[float]:
    if columns == 2:
        return [0.42, 0.58]
    if columns == 3:
        return [0.34, 0.33, 0.33]
    return [0.28, 0.24, 0.24, 0.24]


def _scaled_edges(left: int, right: int, widths: Sequence[float]) -> list[int]:
    total = float(sum(widths)) or 1.0
    span = right - left
    edges = [left]
    cursor = left
    for width in widths[:-1]:
        cursor += int(round(span * (width / total)))
        edges.append(cursor)
    edges.append(right)
    return edges


def _timeline_events(ctx: _Context) -> list[tuple[str, str]]:
    raw = _param(ctx, "events", ["Receive instructions", "Match network", "Confirm"])
    events: list[tuple[str, str]] = []
    if isinstance(raw, Sequence) and not isinstance(raw, str):
        for item in raw:
            if isinstance(item, Mapping):
                events.append((str(item.get("t", "")), str(item.get("text", ""))))
            else:
                events.append(("", str(item)))
    if not events:
        events = [("", "Receive instructions"), ("", "Match network"), ("", "Confirm")]
    return events


def _is_number(value: Any) -> bool:
    try:
        float(value)
    except (TypeError, ValueError):
        return False
    return True


def _normalize_box(box: Box, image_size: tuple[int, int]) -> tuple[int, int, int, int]:
    if len(box) != 4:
        raise ValueError("box must contain four coordinates")
    x0, y0, x1, y1 = _as_int_box(box)
    width, height = image_size
    x0 = max(0, min(width, x0))
    x1 = max(0, min(width, x1))
    y0 = max(0, min(height, y0))
    y1 = max(0, min(height, y1))
    if x1 <= x0 or y1 <= y0:
        raise ValueError(f"invalid box: {box}")
    return (x0, y0, x1, y1)


def _as_int_box(box: Box) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = box
    return (int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1)))


def _progress(t: float, duration: float) -> float:
    if duration <= 0:
        return 1.0
    return _ease_in_out_cubic(max(0.0, min(1.0, t / duration)))


def _ease_in_out_cubic(x: float) -> float:
    if x < 0.5:
        return 4 * x * x * x
    return 1 - pow(-2 * x + 2, 3) / 2


def _ease_out_cubic(x: float) -> float:
    return 1 - pow(1 - max(0.0, min(1.0, x)), 3)


def _range_progress(progress: float, start: float, end: float) -> float:
    if end <= start:
        return 1.0 if progress >= end else 0.0
    return _ease_out_cubic((progress - start) / (end - start))


def _rounded(draw: ImageDraw.ImageDraw, box: Box, radius: int, *, fill: Color, outline: Optional[Color] = None, width: int = 2) -> None:
    draw.rounded_rectangle(_as_int_box(box), radius=max(1, int(radius)), fill=fill, outline=outline, width=width)


def _arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], fill: Color) -> None:
    x0, y0 = start
    x1, y1 = end
    draw.line((x0, y0, x1, y1), fill=fill, width=5)
    draw.polygon([(x1, y1), (x1 - 16, y1 - 10), (x1 - 16, y1 + 10)], fill=fill)


def _check(draw: ImageDraw.ImageDraw, center: tuple[int, int], size: int, fill: Color) -> None:
    cx, cy = center
    draw.line((cx - size, cy, cx - size // 3, cy + size // 2, cx + size, cy - size), fill=fill, width=max(4, size // 4), joint="curve")


def _pad(box: Box, left: float, top: float, right: float, bottom: float) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = box
    return (int(x0 + left), int(y0 + top), int(x1 - right), int(y1 - bottom))


def _rgba(color: str, alpha: int) -> tuple[int, int, int, int]:
    color = color.lstrip("#")
    return (int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16), max(0, min(255, int(alpha))))


def _param(ctx: _Context, name: str, default: Any = None) -> Any:
    locale = ctx.locale.lower()
    suffixes: list[str] = []
    if locale.startswith("en"):
        suffixes.append("_en")
    elif "hant" in locale:
        suffixes.extend(["_zh_hant", "_zh"])
    elif "zh" in locale or "hans" in locale:
        suffixes.extend(["_zh_hans", "_zh"])
    for suffix in suffixes:
        key = f"{name}{suffix}"
        if key in ctx.params:
            return ctx.params[key]
    return ctx.params.get(name, default)


def _list_param(ctx: _Context, name: str, default: Sequence[Any]) -> list[str]:
    value = _param(ctx, name, default)
    if isinstance(value, str):
        return [value]
    if not isinstance(value, Iterable):
        return [str(value)]
    return [str(item) for item in value]


def _field_state(value: str, explicit: Optional[str] = None) -> str:
    """Unknown form data is neutral; only positive statuses earn a check."""
    if explicit is not None:
        if explicit not in ("ok", "bad", "neutral"):
            raise ValueError(f"invalid phone field state: {explicit!r}")
        return explicit
    value = _clean_text(value).lower()
    if any(word in value for word in ("示意", "非真实", "illustrative", "illustration", "not a real", "generic", "example")):
        return "neutral"
    if any(word in value for word in ("未通过", "失败", "拒绝", "冻结", "错误", "未开启", "未完成", "不一致")) or re.search(r"\b(failed?|rejected?|frozen|error|not approved|disabled)\b", value):
        return "bad"
    if any(word in value for word in ("已通过", "已开启", "已完成", "成功")) or re.search(r"\b(approved|verified|enabled|complete[d]?|success|selected)\b", value):
        return "ok"
    return "neutral"


def _phone_fields(ctx: _Context) -> list[tuple[str, str, str]]:
    pairs = _field_pairs(ctx)
    fields = _param(ctx, "fields", [])
    if not isinstance(fields, Sequence) or isinstance(fields, str):
        fields = []
    return [(label, value, _field_state(value, fields[i].get("state") if i < len(fields) and isinstance(fields[i], Mapping) else None))
            for i, (label, value) in enumerate(pairs)]


def _status_icon(draw: ImageDraw.ImageDraw, center: tuple[int, int], size: int, state: str) -> None:
    if state == "ok":
        _check(draw, center, size, GREEN)
    elif state == "bad":
        cx, cy = center
        radius = size * 0.7
        for direction in (-1, 1):
            draw.line((cx - radius, cy - direction * radius, cx + radius, cy + direction * radius), fill=RED, width=max(4, size // 4))


def _field_pairs(ctx: _Context) -> list[tuple[str, str]]:
    if "fields" not in ctx.params and "values" not in ctx.params:
        pairs: list[tuple[str, str]] = []
        status = _param(ctx, "status", None)
        if status:
            pairs.append(("状态" if _prefers_pingfang(ctx.locale) else "Status", str(status)))
        message = _param(ctx, "message", None)
        if message:
            pairs.append(("消息" if _prefers_pingfang(ctx.locale) else "Message", str(message)))
        toggle = _param(ctx, "toggle", None)
        state = _param(ctx, "state", None)
        if toggle or state:
            pairs.append((str(toggle or ("开关" if _prefers_pingfang(ctx.locale) else "Toggle")), str(state or "")))
        highlight = _param(ctx, "highlight", None)
        if highlight:
            pairs.append(("重点" if _prefers_pingfang(ctx.locale) else "Focus", str(highlight)))
        return pairs
    fields = _param(ctx, "fields", [["Asset", "USDT"], ["Network", "Selected"], ["Address", "0x71...E92A"], ["Memo", "If required"]])
    values = _param(ctx, "values", None)
    if isinstance(fields, Sequence) and not isinstance(fields, str):
        pairs: list[tuple[str, str]] = []
        for item in fields:
            if isinstance(item, Mapping):
                label = item.get("label", item.get("name", "Field"))
                value = item.get("value", item.get("text", ""))
                pairs.append((str(label), str(value)))
            elif isinstance(item, Sequence) and not isinstance(item, str) and len(item) >= 2:
                pairs.append((str(item[0]), str(item[1])))
            else:
                pairs.append((str(item), ""))
        if values is not None:
            value_list = _list_param(ctx, "values", [])
            return [(label, value_list[index] if index < len(value_list) else value) for index, (label, value) in enumerate(pairs)]
        return pairs
    labels = _list_param(ctx, "fields", ["Asset", "Network", "Address", "Memo"])
    value_list = _list_param(ctx, "values", ["USDT", "Selected", "0x71...E92A", "If required"])
    return list(zip(labels, value_list or [""] * len(labels)))


def _compare_cells(row: Sequence[Any]) -> tuple[str, str, str]:
    cells = list(row)
    if len(cells) >= 3:
        return str(cells[0]), str(cells[1]), str(cells[2])
    if len(cells) == 2:
        return "", str(cells[0]), str(cells[1])
    if len(cells) == 1:
        return "", str(cells[0]), ""
    return "", "", ""


def _clip_text(value: str, fraction: float) -> str:
    chars = list(value)
    return "".join(chars[: max(0, min(len(chars), int(math.ceil(len(chars) * fraction))))])


def _clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _prefers_pingfang(locale: str) -> bool:
    return bool(re.search(r"zh|ja|ko|hans|hant", locale, re.IGNORECASE))


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, width: int, locale: str) -> list[str]:
    if not text:
        return [""]
    tokens = _tokens(text, locale)
    lines: list[str] = []
    current = ""
    for token in tokens:
        candidate = _join_token(current, token, locale)
        if _text_width(draw, candidate, font) <= width:
            current = candidate
            continue
        if current:
            lines.append(current)
            current = ""
        if _text_width(draw, token, font) <= width:
            current = token
            continue
        pieces = _break_token(draw, token, font, width)
        lines.extend(pieces[:-1])
        current = pieces[-1]
    if current:
        lines.append(current)
    return lines or [""]


def _tokens(text: str, locale: str) -> list[str]:
    if _prefers_pingfang(locale) or re.search(r"[\u3400-\u9fff]", text):
        return list(text)
    return text.split(" ")


def _join_token(current: str, token: str, locale: str) -> str:
    if not current:
        return token
    if _prefers_pingfang(locale) or re.search(r"[\u3400-\u9fff]", current + token):
        return current + token
    return f"{current} {token}"


def _break_token(draw: ImageDraw.ImageDraw, token: str, font: ImageFont.ImageFont, width: int) -> list[str]:
    pieces: list[str] = []
    current = ""
    for char in token:
        candidate = current + char
        if _text_width(draw, candidate, font) <= width:
            current = candidate
            continue
        if not current:
            raise TextOverflowError(f"single character cannot fit at {MIN_FONT_SIZE}px: {char!r}")
        pieces.append(current)
        current = char
    if current:
        pieces.append(current)
    return pieces


def _text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    if not text:
        return 0
    return int(math.ceil(draw.textlength(text, font=font)))

