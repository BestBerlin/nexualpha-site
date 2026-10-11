# -*- coding: utf-8 -*-
"""Convert approved academy writer scripts into renderer episode JSON.

The converter is intentionally deterministic: the writer scripts remain the
source of truth, while renderer-facing params are normalized into the small
component vocabulary supported by ``ops/academy/visuals.py``.
"""
from __future__ import annotations

import argparse
import json
import re
from copy import deepcopy
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parent
DEFAULT_SOURCE = Path("/Volumes/致态2TB/nx-agents/education/scripts-final")
DEFAULT_OUT = ROOT / "episodes"

VISUAL_TYPES = {
    "flow",
    "phone-mock",
    "checklist",
    "compare-table",
    "warning-card",
    "number-counter",
    "timeline",
    "split-choice",
    "definition",
}

PARTNER_KINDS = {"signup", "trade", "deposit"}


def read_writer_scripts(source: Path) -> list[tuple[Path, dict[str, Any]]]:
    scripts: list[tuple[Path, dict[str, Any]]] = []
    for path in sorted(source.glob("[0-9][0-9]-*.json")):
        scripts.append((path, json.loads(path.read_text(encoding="utf-8"))))
    return scripts


def convert_all(source: Path = DEFAULT_SOURCE, out_dir: Path = DEFAULT_OUT) -> list[Path]:
    scripts = read_writer_scripts(source)
    if len(scripts) != 12:
        raise ValueError(f"expected 12 writer scripts in {source}, found {len(scripts)}")
    validate_writer_collection(scripts)

    by_slug = {script["meta"]["slug"]: script for _, script in scripts}
    converted_scripts = [convert_script(script, by_slug) for _, script in scripts]
    validate_converted(converted_scripts)

    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for converted in converted_scripts:
        level = converted["meta"]["level"]
        slug = converted["meta"]["slug"]
        target = out_dir / f"{level:02d}-{slug}.json"
        target.write_text(json.dumps(converted, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        written.append(target)

    (out_dir / "04-network-check.json").unlink(missing_ok=True)
    return written


def validate_writer_collection(scripts: list[tuple[Path, dict[str, Any]]]) -> None:
    levels = [script["meta"].get("level") for _, script in scripts]
    slugs = [script["meta"].get("slug") for _, script in scripts]
    if levels != list(range(1, 13)):
        raise ValueError(f"writer levels must be exactly 1..12 in order, got {levels}")
    if len(set(slugs)) != len(slugs):
        raise ValueError("writer slugs must be unique")


def convert_script(script: dict[str, Any], by_slug: dict[str, dict[str, Any]]) -> dict[str, Any]:
    meta = script["meta"]
    next_slug = str(meta.get("next_slug") or "")
    next_script = by_slug.get(next_slug)
    if next_script:
        next_title_zh = next_script["meta"]["title_zh"]
        next_title_en = next_script["meta"]["title_en"]
    elif next_slug:
        raise ValueError(f"unknown next_slug for {meta['slug']}: {next_slug}")
    else:
        final_scene = script.get("scenes", [{}])[-1]
        next_title_zh = str(final_scene.get("sub") or "新手村第一季完成")
        next_title_en = "Season complete"

    converted = deepcopy(script)
    converted["meta"] = {
        **deepcopy(meta),
        **{
            "level": meta["level"],
            "slug": meta["slug"],
            "title_zh": meta["title_zh"],
            "title_en": meta["title_en"],
            "hook_zh": meta.get("hook_zh"),
            "next_slug": next_slug,
            "next_title_zh": next_title_zh,
            "next_title_en": next_title_en,
            "cta": normalize_cta(meta.get("cta") or {}),
            "sources": deepcopy(meta.get("sources", [])),
            "sensitive": bool(meta.get("sensitive", False)),
            "writer_meta": deepcopy(meta),
        },
    }
    if meta.get("review_notes"):
        converted["meta"]["source_note"] = meta["review_notes"]
    converted["scenes"] = [convert_scene(scene) for scene in script.get("scenes", [])]
    return converted


def validate_converted(scripts: list[dict[str, Any]]) -> None:
    import engine

    names = set()
    for script in scripts:
        engine.validate(script)
        name = f"{script['meta']['level']:02d}-{script['meta']['slug']}.json"
        if name in names:
            raise ValueError(f"duplicate converted episode name: {name}")
        names.add(name)


def normalize_cta(cta: dict[str, Any]) -> dict[str, Any]:
    original_kind = str(cta.get("kind") or "none")
    partner = cta.get("partner")
    if original_kind == "none":
        kind = "none"
    elif partner and original_kind in PARTNER_KINDS:
        kind = "partner"
    else:
        kind = "neutral"
    return {
        "kind": kind,
        "partner": partner if kind == "partner" else None,
        "original_kind": original_kind,
        "line_zh": cta.get("line_zh"),
        "line_en": cta.get("line_en"),
    }


def convert_scene(scene: dict[str, Any]) -> dict[str, Any]:
    visual = scene.get("visual") or {}
    kind = str(visual.get("type") or "")
    if kind not in VISUAL_TYPES:
        raise ValueError(f"unsupported writer visual type: {kind}")
    original_params = deepcopy(visual.get("params") or {})
    converted = deepcopy(scene)
    converted.update({
        "voice_zh": scene["voice_zh"],
        "voice_en": scene["voice_en"],
        "title": scene["title"],
        "sub": scene["sub"],
        "visual": {
            "type": kind,
            "params": normalize_visual_params(kind, original_params),
        },
        "min_s": scene["min_s"],
    })
    return converted


def normalize_visual_params(kind: str, params: dict[str, Any]) -> dict[str, Any]:
    normalized = deepcopy(params)
    normalized.pop("cta_card", None)
    original = deepcopy(params)

    if kind == "flow":
        if "nodes" in params:
            normalized["steps"] = list_of_text(params["nodes"])
        elif "labels" in params:
            normalized["steps"] = list_of_text(params["labels"])
        if params.get("branches"):
            base = list_of_text(params.get("nodes", []))
            normalized["steps"] = base + list_of_text(params["branches"])
        caption = params.get("note") or params.get("warning") or params.get("label")
        if caption:
            normalized["caption"] = str(caption)

    elif kind == "phone-mock":
        normalized["title"] = str(params.get("screen") or params.get("title") or "通用示意界面")
        fields = phone_fields(params)
        if fields:
            normalized["fields"] = fields

    elif kind == "warning-card":
        normalized["title"] = str(params.get("text") or params.get("title") or "确认前暂停")
        normalized["body"] = str(params.get("detail") or params.get("body") or "；".join(list_of_text(params.get("items", []))) or params.get("note") or params.get("source") or "")

    elif kind == "definition":
        term = str(params.get("term") or params.get("label") or "关键概念")
        lines = list_of_text(params.get("lines", []))
        normalized["quote"] = term if not lines else f"{term}：" + "；".join(lines)
        normalized["source"] = str(params.get("source") or params.get("label") or "NexuAlpha Starter Path")

    elif kind == "compare-table":
        columns, rows = compare_table(params)
        normalized["columns"] = columns
        normalized["rows"] = rows

    elif kind == "split-choice":
        normalized.update(split_choice(params))

    elif kind == "number-counter":
        normalized.update(number_counter(params))

    elif kind in {"checklist", "timeline"}:
        key = "items" if kind == "checklist" else "events"
        if key in params and kind == "checklist":
            normalized[key] = list_of_text(params[key])

    normalized["writer_params"] = original
    return normalized


def phone_fields(params: dict[str, Any]) -> list[list[str]]:
    if params.get("fields"):
        fields = params["fields"]
        if isinstance(fields, Iterable) and not isinstance(fields, (str, bytes, dict)):
            result: list[list[str]] = []
            for item in fields:
                if isinstance(item, dict):
                    result.append([str(item.get("label") or item.get("name") or "字段"), str(item.get("value") or item.get("text") or "")])
                elif isinstance(item, Iterable) and not isinstance(item, (str, bytes)):
                    values = [str(value) for value in item]
                    result.append([values[0], values[1] if len(values) > 1 else ""])
                else:
                    result.append([str(item), ""])
            return result
    if params.get("message"):
        return [["消息", str(params["message"])], ["来源", str(params.get("label") or "示意")]]
    if params.get("toggle") or params.get("state"):
        return [[str(params.get("toggle") or "设置"), str(params.get("state") or "")]]
    if params.get("tabs"):
        return [["模式", " / ".join(list_of_text(params["tabs"]))], ["说明", str(params.get("note") or "通用示意界面")]]
    if params.get("highlight"):
        return [["重点", str(params["highlight"])], ["说明", str(params.get("note") or "示意")]]
    if params.get("status") or params.get("note"):
        fields = []
        if params.get("status"):
            fields.append(["状态", str(params["status"])])
        if params.get("note"):
            fields.append(["说明", str(params["note"])])
        return fields
    return []


def compare_table(params: dict[str, Any]) -> tuple[list[str], list[list[str]]]:
    columns = list_of_text(params.get("columns", []))
    rows = params.get("rows", [])
    if not isinstance(rows, list):
        rows = []

    if len(columns) >= 3:
        display_columns = [columns[1], " / ".join(columns[2:])]
        display_rows = []
        for row in rows:
            cells = list_of_text(row)
            if len(cells) >= 3:
                display_rows.append([cells[0], cells[1], " / ".join(cells[2:])])
            elif len(cells) == 2:
                display_rows.append(["", cells[0], cells[1]])
        return display_columns, display_rows

    display_columns = columns[:2] if len(columns) == 2 else ["项目", "说明"]
    display_rows = []
    for row in rows:
        cells = list_of_text(row)
        if len(cells) >= 3:
            display_rows.append([cells[0], cells[1], " / ".join(cells[2:])])
        elif len(cells) == 2:
            display_rows.append(["", cells[0], cells[1]])
        elif len(cells) == 1:
            display_rows.append(["", cells[0], ""])
    return display_columns, display_rows


def split_choice(params: dict[str, Any]) -> dict[str, str]:
    options = list_of_text(params.get("options", []))
    highlight = params.get("highlight")
    try:
        highlight_index = int(highlight) if highlight is not None else 0
    except (TypeError, ValueError):
        highlight_index = 0
    if not options:
        options = ["继续", "暂停"]
    highlight_index = max(0, min(highlight_index, len(options) - 1))
    left = options[highlight_index]
    rest = [option for index, option in enumerate(options) if index != highlight_index]
    right = " / ".join(rest) if rest else "暂停"
    note = str(params.get("note") or params.get("question") or "")
    return {
        "left": left,
        "right": right,
        "left_caption": note or "继续",
        "right_caption": "暂停核对",
    }


def number_counter(params: dict[str, Any]) -> dict[str, Any]:
    if "value" in params and is_number(params["value"]):
        return {"value": float(params["value"]), "label": str(params.get("label") or "数值"), "caption": str(params.get("caption") or "")}
    if params.get("steps"):
        steps = list_of_text(params["steps"])
        return {"value": len(steps), "label": str(params.get("label") or "步骤"), "caption": " / ".join(steps)}
    if params.get("result"):
        value = first_number(params.get("result")) or first_number(params.get("rate")) or 0.0
        return {"value": value, "label": "手续费估算", "suffix": " USDT" if "USDT" in str(params.get("result")) else "", "decimals": 1, "caption": str(params.get("result"))}
    if params.get("position"):
        return {
            "value": first_number(params["position"]) or 0,
            "label": f"仓位 {params.get('position')}",
            "suffix": " USDT",
            "decimals": 0,
            "caption": str(params.get("risk_note") or params.get("loss") or ""),
        }
    return {"value": 0, "label": str(params.get("label") or "数值"), "caption": str(params.get("risk_note") or "")}


def list_of_text(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (str, bytes)):
        return [str(value)]
    if isinstance(value, Iterable):
        return [str(item) for item in value]
    return [str(value)]


def is_number(value: Any) -> bool:
    try:
        float(value)
    except (TypeError, ValueError):
        return False
    return True


def first_number(value: Any) -> float | None:
    match = re.search(r"-?\d[\d,]*(?:\.\d+)?", str(value))
    return float(match.group(0).replace(",", "")) if match else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", nargs="?", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    written = convert_all(args.source, args.out)
    print(json.dumps({"written": [str(path) for path in written]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
