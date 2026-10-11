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
        draw.text((x, y), line, font=layout.font, fill=fill)
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
    labels = _list_param(ctx, "steps", _list_param(ctx, "labels", ["Receiver", "Network", "Sender"]))
    if len(labels) < 2:
        labels = [labels[0], "Confirm"] if labels else ["Receiver", "Confirm"]
    active = min(len(labels) - 1, int(ctx.progress * len(labels)))
    y = ctx.sy(0.48)
    radius = max(90, min(ctx.w // (len(labels) * 5), ctx.h // 7))
    left = ctx.sx(0.12)
    right = ctx.sx(0.88)
    gap = (right - left) / max(1, len(labels) - 1)
    points = [(int(round(left + i * gap)), y) for i in range(len(labels))]

    _rounded(ctx.draw, ctx.box, 28, fill="#0f151d", outline="#1e2a3a")
    for index in range(len(points) - 1):
        x0, y0 = points[index]
        x1, y1 = points[index + 1]
        local = _range_progress(ctx.progress, index / (len(points) - 1), (index + 1) / (len(points) - 1))
        ctx.draw.line((x0 + radius, y0, x1 - radius, y1), fill=_rgba(BLUE, 90), width=max(5, ctx.h // 90))
        ctx.draw.line((x0 + radius, y0, x0 + radius + int((x1 - x0 - 2 * radius) * local), y1), fill=BLUE, width=max(7, ctx.h // 76))
        _arrow(ctx.draw, (x1 - radius - 12, y1), (x1 - radius + 18, y1), BLUE if local > 0.82 else _rgba(BLUE, 90))

    for index, (x, node_y) in enumerate(points):
        fill = "#172234" if index > active else "#14342d"
        outline = GREEN if index <= active else "#334056"
        _rounded(ctx.draw, (x - radius, node_y - radius, x + radius, node_y + radius), radius // 2, fill=fill, outline=outline, width=3)
        draw_text_fit(
            ctx.draw,
            (x - radius + 14, node_y - radius + 16, x + radius - 14, node_y + radius - 16),
            labels[index],
            locale=ctx.locale,
            fill=TEXT,
            max_size=ctx.size(0.075),
            align="center",
            valign="center",
            max_lines=2,
        )

    path_index = min(len(points) - 2, int(ctx.progress * (len(points) - 1)))
    segment_t = (ctx.progress * (len(points) - 1)) % 1
    if len(points) > 1:
        x0, dot_y = points[path_index]
        x1, _ = points[path_index + 1]
        dot_x = int(round((x0 + radius) + (x1 - x0 - 2 * radius) * segment_t))
        pulse = 0.7 + 0.3 * math.sin(ctx.t * 7.0)
        ctx.draw.ellipse((dot_x - 12, dot_y - 12, dot_x + 12, dot_y + 12), fill=_rgba(GREEN, int(190 + 50 * pulse)))


def _draw_phone_mock(ctx: _Context) -> None:
    title = _param(ctx, "title", "Generic verification form")
    pairs = _field_pairs(ctx)
    if ctx.h < 500:
        _draw_phone_mock_compact(ctx, title, pairs)
        return
    phone_w = int(ctx.w * 0.72)
    phone_h = min(int(ctx.h * 0.92), int(phone_w * 1.55))
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

    start_y = int(screen[1] + phone_h * 0.24)
    bottom_y = int(screen[3] - phone_h * 0.06)
    row_h = int((bottom_y - start_y) / max(1, len(pairs)))
    if row_h < 58:
        raise TextOverflowError(f"phone-mock has {len(pairs)} fields but only {bottom_y - start_y}px available")
    for index, (label, value) in enumerate(pairs):
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
        draw_text_fit(ctx.draw, value_box, visible or " ", locale=ctx.locale, fill=GREEN if reveal >= 0.98 else TEXT, max_size=42, weight="bold", max_lines=1, valign="center")
        if reveal >= 0.98:
            _check(ctx.draw, (int(row[2] - 30), int(row[1] + row_h * 0.36)), 15, GREEN)


def _draw_phone_mock_compact(ctx: _Context, title: Any, pairs: Sequence[tuple[str, str]]) -> None:
    _rounded(ctx.draw, ctx.box, 28, fill="#0e141c", outline="#344054", width=4)
    screen = _pad(ctx.box, ctx.w * 0.035, ctx.h * 0.06, ctx.w * 0.035, ctx.h * 0.04)
    _rounded(ctx.draw, screen, 22, fill="#121a24", outline="#202c3c")
    ctx.draw.rounded_rectangle((ctx.sx(0.43), ctx.sy(0.045), ctx.sx(0.57), ctx.sy(0.065)), radius=7, fill="#2d3748")
    draw_text_fit(ctx.draw, (screen[0] + 24, screen[1] + 8, screen[2] - 24, screen[1] + 50), title, locale=ctx.locale, fill=TEXT, max_size=42, weight="bold", max_lines=1, valign="center")
    rows_top = screen[1] + 54
    rows_bottom = screen[3] - 12
    row_h = int((rows_bottom - rows_top) / max(1, len(pairs)))
    if row_h < 46:
        raise TextOverflowError(f"phone-mock has {len(pairs)} fields but only {rows_bottom - rows_top}px available")
    for index, (label, value) in enumerate(pairs):
        reveal = _range_progress(ctx.progress, index / max(1, len(pairs)), (index + 0.8) / max(1, len(pairs)))
        row = (screen[0] + 22, rows_top + index * row_h, screen[2] - 22, rows_top + index * row_h + row_h - 8)
        _rounded(ctx.draw, row, 16, fill="#182231", outline="#29364a")
        label_box = (row[0] + 16, row[1] + 6, row[0] + int((row[2] - row[0]) * 0.34), row[3] - 6)
        value_box = (label_box[2] + 12, row[1] + 6, row[2] - 44, row[3] - 6)
        draw_text_fit(ctx.draw, label_box, label, locale=ctx.locale, fill=MUTED, max_size=38, max_lines=1, valign="center")
        draw_text_fit(ctx.draw, value_box, _clip_text(str(value), reveal) or " ", locale=ctx.locale, fill=GREEN if reveal >= 0.98 else TEXT, max_size=40, weight="bold", max_lines=1, valign="center")
        if reveal >= 0.98:
            _check(ctx.draw, (row[2] - 26, (row[1] + row[3]) // 2), 14, GREEN)


def _draw_checklist(ctx: _Context) -> None:
    title = _param(ctx, "title", "Pre-confirm checklist")
    items = _list_param(ctx, "items", ["Asset matches", "Network matches", "Address checked", "Memo included if required"])
    _rounded(ctx.draw, ctx.box, 30, fill="#101721", outline="#26364a")
    draw_text_fit(ctx.draw, (ctx.sx(0.07), ctx.sy(0.08), ctx.sx(0.93), ctx.sy(0.22)), title, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.075), weight="bold", max_lines=2)
    if ctx.h < 420 and len(items) >= 5:
        _draw_checklist_tiles(ctx, items)
        return
    top = ctx.sy(0.27)
    row_h = int((ctx.sy(0.90) - top) / max(1, len(items)))
    if row_h < 50:
        raise TextOverflowError(f"checklist has {len(items)} items but only {ctx.sy(0.90) - top}px available")
    for index, item in enumerate(items):
        reveal = _range_progress(ctx.progress, index / max(1, len(items)), (index + 0.7) / max(1, len(items)))
        y0 = top + index * row_h
        row = (ctx.sx(0.08), y0, ctx.sx(0.92), y0 + row_h - 6)
        _rounded(ctx.draw, row, 18, fill=_rgba("#172130", int(95 + 70 * reveal)), outline="#2b3a50")
        cx = row[0] + max(30, min(42, row_h // 2))
        cy = (row[1] + row[3]) // 2
        icon = max(15, min(19, row_h // 3))
        ctx.draw.ellipse((cx - icon, cy - icon, cx + icon, cy + icon), outline=GREEN if reveal > 0.45 else "#48576c", width=3)
        if reveal > 0.55:
            _check(ctx.draw, (cx, cy), icon, GREEN)
        draw_text_fit(ctx.draw, (cx + icon + 16, row[1] + 3, row[2] - 16, row[3] - 3), item, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.055), max_lines=1, valign="center")


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
        draw_text_fit(ctx.draw, (tile[0] + 12, tile[1] + 62, tile[2] - 12, tile[3] - 12), item, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.05), align="center", valign="center", max_lines=3)


def _draw_compare_table(ctx: _Context) -> None:
    columns = _list_param(ctx, "columns", ["Receiver", "Sender"])[:2]
    rows = _param(ctx, "rows", [["Asset", "USDT", "USDT"], ["Network", "ERC-20", "ERC-20"], ["Memo", "Required", "Included"]])
    if not isinstance(rows, Sequence):
        rows = []
    rows = [list(row) for row in rows]
    _rounded(ctx.draw, ctx.box, 26, fill="#101721", outline="#28374a")
    left = ctx.sx(0.06)
    mid = ctx.sx(0.36)
    col2 = ctx.sx(0.66)
    right = ctx.sx(0.94)
    header_h = max(70, min(96, int(ctx.h * 0.24)))
    header = (left, ctx.sy(0.07), right, ctx.sy(0.07) + header_h)
    _rounded(ctx.draw, header, 16, fill="#162134", outline="#2a3a54")
    draw_text_fit(ctx.draw, (mid + 18, header[1] + 8, col2 - 16, header[3] - 8), columns[0], locale=ctx.locale, fill=BLUE, max_size=ctx.size(0.05), weight="bold", align="center", valign="center", max_lines=1)
    draw_text_fit(ctx.draw, (col2 + 18, header[1] + 8, right - 16, header[3] - 8), columns[1], locale=ctx.locale, fill=BLUE, max_size=ctx.size(0.05), weight="bold", align="center", valign="center", max_lines=1)
    rows_top = header[3] + max(12, int(ctx.h * 0.035))
    rows_bottom = ctx.sy(0.92)
    row_h = int((rows_bottom - rows_top) / max(1, len(rows)))
    if row_h < 52:
        raise TextOverflowError(f"compare-table has {len(rows)} rows but only {rows_bottom - rows_top}px available")
    for index, row in enumerate(rows):
        reveal = _range_progress(ctx.progress, index / max(1, len(rows)), (index + 0.7) / max(1, len(rows)))
        y0 = rows_top + index * row_h
        alpha = int(60 + 120 * reveal)
        fill = _rgba("#152132", alpha)
        _rounded(ctx.draw, (left, y0, right, y0 + row_h - 12), 14, fill=fill, outline="#253449")
        label, a, b = _compare_cells(row)
        draw_text_fit(ctx.draw, (left + 18, y0 + 8, mid - 14, y0 + row_h - 20), label, locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.045), weight="bold", valign="center", max_lines=1)
        draw_text_fit(ctx.draw, (mid + 16, y0 + 8, col2 - 16, y0 + row_h - 20), a, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.05), align="center", valign="center", max_lines=1)
        draw_text_fit(ctx.draw, (col2 + 16, y0 + 8, right - 16, y0 + row_h - 20), b, locale=ctx.locale, fill=GREEN if str(a).lower() == str(b).lower() else AMBER, max_size=ctx.size(0.05), align="center", valign="center", max_lines=1)


def _draw_warning_card(ctx: _Context) -> None:
    title = _param(ctx, "title", "Check before you confirm")
    body = _param(ctx, "body", "A lower fee is not a reason to choose a different network.")
    pulse = 0.5 + 0.5 * math.sin(ctx.t * 2.6)
    inset = int(max(0, math.sin(ctx.t * 1.8)) * ctx.w * 0.006)
    card = (ctx.box[0] + inset, ctx.box[1] + inset, ctx.box[2] - inset, ctx.box[3] - inset)
    _rounded(ctx.draw, card, 30, fill="#211316", outline=_rgba(RED, int(150 + 80 * pulse)), width=4)
    cx = ctx.sx(0.16)
    cy = ctx.sy(0.30)
    size = min(ctx.w, ctx.h) * 0.12
    ctx.draw.polygon([(cx, cy - size), (cx - size, cy + size * 0.78), (cx + size, cy + size * 0.78)], fill=_rgba(RED, 75), outline=RED)
    mark_w = max(5, int(size * 0.12))
    ctx.draw.line((cx, cy - size * 0.30, cx, cy + size * 0.22), fill=RED, width=mark_w)
    dot = max(4, int(size * 0.10))
    ctx.draw.ellipse((cx - dot, cy + size * 0.38 - dot, cx + dot, cy + size * 0.38 + dot), fill=RED)
    draw_text_fit(ctx.draw, (ctx.sx(0.30), ctx.sy(0.16), ctx.sx(0.91), ctx.sy(0.40)), title, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.075), weight="bold", max_lines=2)
    draw_text_fit(ctx.draw, (ctx.sx(0.10), ctx.sy(0.49), ctx.sx(0.90), ctx.sy(0.84)), body, locale=ctx.locale, fill="#ffdfe1", max_size=ctx.size(0.058), max_lines=4, valign="center")


def _draw_number_counter(ctx: _Context) -> None:
    label = _param(ctx, "label", "Checks before confirm")
    start = float(_param(ctx, "start", 0))
    end = float(_param(ctx, "value", _param(ctx, "end", 5)))
    suffix = str(_param(ctx, "suffix", ""))
    decimals = int(_param(ctx, "decimals", 0))
    value = start + (end - start) * _ease_out_cubic(ctx.progress)
    number = f"{value:,.{decimals}f}{suffix}"
    _rounded(ctx.draw, ctx.box, 34, fill="#101721", outline="#28374a")
    orbit = 0.5 + 0.5 * math.sin(ctx.t * 1.3)
    ctx.draw.ellipse((ctx.sx(0.62), ctx.sy(0.10 + orbit * 0.05), ctx.sx(0.92), ctx.sy(0.46 + orbit * 0.05)), fill=_rgba(BLUE, 28))
    draw_text_fit(ctx.draw, (ctx.sx(0.09), ctx.sy(0.16), ctx.sx(0.91), ctx.sy(0.34)), label, locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.055), weight="bold", align="center", max_lines=2)
    draw_text_fit(ctx.draw, (ctx.sx(0.08), ctx.sy(0.37), ctx.sx(0.92), ctx.sy(0.72)), number, locale=ctx.locale, fill=GREEN, max_size=ctx.size(0.22), weight="bold", align="center", valign="center", max_lines=1)
    caption = _param(ctx, "caption", None)
    if caption is not None:
        draw_text_fit(ctx.draw, (ctx.sx(0.12), ctx.sy(0.76), ctx.sx(0.88), ctx.sy(0.90)), caption, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.05), align="center", max_lines=2)


def _draw_timeline(ctx: _Context) -> None:
    events = _list_param(ctx, "events", ["Receive instructions", "Match network", "Verify address", "Confirm once"])
    _rounded(ctx.draw, ctx.box, 28, fill="#101721", outline="#28374a")
    vertical = ctx.h > ctx.w
    if vertical:
        x = ctx.sx(0.17)
        y0 = ctx.sy(0.12)
        y1 = ctx.sy(0.88)
        ctx.draw.line((x, y0, x, y1), fill="#2a3648", width=5)
        ctx.draw.line((x, y0, x, y0 + int((y1 - y0) * ctx.progress)), fill=BLUE, width=7)
        for index, event in enumerate(events):
            pos = index / max(1, len(events) - 1)
            y = int(y0 + (y1 - y0) * pos)
            reveal = _range_progress(ctx.progress, max(0, pos - 0.12), min(1, pos + 0.12))
            ctx.draw.ellipse((x - 18, y - 18, x + 18, y + 18), fill=GREEN if reveal > 0.8 else "#1f2a3a", outline=GREEN if reveal > 0.25 else "#45546a", width=3)
            draw_text_fit(ctx.draw, (ctx.sx(0.25), y - 40, ctx.sx(0.92), y + 42), event, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.052), valign="center", max_lines=2)
    else:
        y = ctx.sy(0.50)
        x0 = ctx.sx(0.10)
        x1 = ctx.sx(0.90)
        ctx.draw.line((x0, y, x1, y), fill="#2a3648", width=5)
        ctx.draw.line((x0, y, x0 + int((x1 - x0) * ctx.progress), y), fill=BLUE, width=7)
        for index, event in enumerate(events):
            pos = index / max(1, len(events) - 1)
            x = int(x0 + (x1 - x0) * pos)
            reveal = _range_progress(ctx.progress, max(0, pos - 0.12), min(1, pos + 0.12))
            ctx.draw.ellipse((x - 18, y - 18, x + 18, y + 18), fill=GREEN if reveal > 0.8 else "#1f2a3a", outline=GREEN if reveal > 0.25 else "#45546a", width=3)
            text_box = (x - ctx.w * 0.13, ctx.sy(0.58), x + ctx.w * 0.13, ctx.sy(0.84))
            draw_text_fit(ctx.draw, text_box, event, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.043), align="center", max_lines=3)


def _draw_split_choice(ctx: _Context) -> None:
    left = _param(ctx, "left", "Exact match")
    right = _param(ctx, "right", "Different network")
    left_caption = _param(ctx, "left_caption", "Continue")
    right_caption = _param(ctx, "right_caption", "Pause")
    gap = max(24, int(ctx.w * 0.035))
    card_w = (ctx.w - gap - int(ctx.w * 0.12)) // 2
    y0 = ctx.sy(0.16)
    y1 = ctx.sy(0.84)
    left_box = (ctx.sx(0.06), y0, ctx.sx(0.06) + card_w, y1)
    right_box = (ctx.sx(0.06) + card_w + gap, y0, ctx.sx(0.06) + card_w * 2 + gap, y1)
    _choice_card(ctx, left_box, left, left_caption, True, _range_progress(ctx.progress, 0.0, 0.7))
    _choice_card(ctx, right_box, right, right_caption, False, _range_progress(ctx.progress, 0.18, 0.9))


def _draw_quote(ctx: _Context) -> None:
    quote = _param(ctx, "quote", _param(ctx, "text", "Network first. Address next. Confirm once."))
    source = _param(ctx, "source", _param(ctx, "label", "NexuAlpha Starter Path"))
    _rounded(ctx.draw, ctx.box, 34, fill="#101721", outline="#28374a")
    ctx.draw.rectangle((ctx.sx(0.08), ctx.sy(0.18), ctx.sx(0.095), ctx.sy(0.78)), fill=BLUE)
    draw_text_fit(ctx.draw, (ctx.sx(0.14), ctx.sy(0.16), ctx.sx(0.90), ctx.sy(0.66)), quote, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.085), weight="bold", valign="center", max_lines=5)
    draw_text_fit(ctx.draw, (ctx.sx(0.14), ctx.sy(0.72), ctx.sx(0.90), ctx.sy(0.86)), source, locale=ctx.locale, fill=MUTED, max_size=ctx.size(0.045), max_lines=2)
    glint = ctx.sx(0.12 + 0.70 * ((ctx.t * 0.16) % 1.0))
    ctx.draw.line((glint, ctx.sy(0.16), glint + ctx.w * 0.10, ctx.sy(0.86)), fill=_rgba("#ffffff", 22), width=max(2, ctx.w // 260))


def _choice_card(ctx: _Context, box: tuple[int, int, int, int], title: Any, caption: Any, ok: bool, reveal: float) -> None:
    color = GREEN if ok else RED
    fill = "#10231e" if ok else "#24171a"
    _rounded(ctx.draw, box, 24, fill=_rgba(fill, int(105 + 70 * reveal)), outline=_rgba(color, int(80 + 145 * reveal)), width=3)
    cx = (box[0] + box[2]) // 2
    card_h = box[3] - box[1]
    icon_size = max(28, min(36, card_h // 7))
    icon_y = int(box[1] + card_h * 0.23)
    ctx.draw.ellipse((cx - icon_size, icon_y - icon_size, cx + icon_size, icon_y + icon_size), fill=_rgba(color, 44), outline=color, width=4)
    if ok:
        _check(ctx.draw, (cx, icon_y), max(20, icon_size - 6), color)
    else:
        cross = max(14, icon_size - 12)
        ctx.draw.line((cx - cross, icon_y - cross, cx + cross, icon_y + cross), fill=color, width=7)
        ctx.draw.line((cx + cross, icon_y - cross, cx - cross, icon_y + cross), fill=color, width=7)
    draw_text_fit(ctx.draw, (box[0] + 28, box[1] + card_h * 0.40, box[2] - 28, box[1] + card_h * 0.66), title, locale=ctx.locale, fill=TEXT, max_size=ctx.size(0.058), weight="bold", align="center", valign="center", max_lines=2)
    draw_text_fit(ctx.draw, (box[0] + 28, box[1] + card_h * 0.70, box[2] - 28, box[3] - 20), caption, locale=ctx.locale, fill=color, max_size=ctx.size(0.045), align="center", valign="center", max_lines=2)


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


def _field_pairs(ctx: _Context) -> list[tuple[str, str]]:
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

