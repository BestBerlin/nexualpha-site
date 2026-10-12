#!/usr/bin/env python3
"""Listen-check proxy for generated narration (offline, cached faster-whisper `small`).

    /usr/bin/python3 verify-narration.py [--ids id1,id2] [--audio-dir DIR] [--out FILE]

Transcribes every wav named in build/narration/narration-plan.json and compares it with the
script text. A line FAILS when word accuracy < 0.9, when the last script word is not heard
(clipped tail) or when the transcript has extra words (garbled/repeated). Results are written to
build/narration/verify.json; exit status 1 when any line fails. No model download is attempted.
"""
import argparse, json, os, re, sys
from difflib import SequenceMatcher

os.environ.setdefault("HF_HUB_OFFLINE", "1")
from faster_whisper import WhisperModel  # noqa: E402

ROOT = os.path.dirname(os.path.abspath(__file__))
NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten", "20": "twenty"}


# British/American spelling variants are the same spoken word.
SPELLING = {"judgement": "judgment", "practise": "practice", "unrealised": "unrealized", "colour": "color", "prioritises": "prioritizes", "labelled": "labeled"}


def words(text):
    text = text.lower().replace("’", "'").replace("%", " percent").replace("10x", "ten x").replace("20x", "twenty x")
    text = re.sub(r"(?<=\d),(?=\d)", "", text)
    out = []
    for w in re.findall(r"[a-z0-9.']+", text):
        w = w.strip(".'")
        if not w:
            continue
        out.append(SPELLING.get(NUM.get(w, w), NUM.get(w, w)))
    return out


def score(script, heard):
    a, b = words(script), words(heard)
    sm = SequenceMatcher(None, a, b, autojunk=False)
    matched = sum(block.size for block in sm.get_matching_blocks())
    accuracy = matched / max(1, len(a))
    extra = max(0, len(b) - matched)
    # Tail: the last script word (by stem, so "conditions"/"condition" is a clipped-tail suspect only if the stem is missing).
    tail_ok = bool(b) and (not a or any(w[:5] == a[-1][:5] for w in b[-3:]))
    # Whisper splits brand/code tokens ("Bitget" -> "bit get", "nexu888" -> "next you 888"); compare spacing-free text too.
    chars = SequenceMatcher(None, "".join(a), "".join(b), autojunk=False).ratio()
    return accuracy, extra, tail_ok, chars


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", default="")
    ap.add_argument("--audio-dir", default=os.path.join(ROOT, "build/narration/audio"))
    ap.add_argument("--plan", default=os.path.join(ROOT, "build/narration/narration-plan.json"))
    ap.add_argument("--out", default=os.path.join(ROOT, "build/narration/verify.json"))
    ap.add_argument("--min-accuracy", type=float, default=0.9)
    args = ap.parse_args()
    plan = json.load(open(args.plan))
    wanted = set(filter(None, args.ids.split(",")))
    model = WhisperModel("small", device="cpu", compute_type="int8", local_files_only=True)
    previous = json.load(open(args.out)) if os.path.exists(args.out) else {}
    results, failed = dict(previous), []
    for ep in plan["episodes"]:
        for scene in ep["scenes"]:
            for line in scene["lines"]:
                if wanted and line["id"] not in wanted:
                    continue
                wav = os.path.join(args.audio_dir, f"{line['id']}_000.wav")
                segments, _ = model.transcribe(wav, language="en", beam_size=5, vad_filter=False)
                heard = " ".join(s.text.strip() for s in segments)
                accuracy, extra, tail_ok, chars = score(line["text"], heard)
                ok = tail_ok and ((accuracy >= args.min_accuracy and extra <= 2) or chars >= 0.95)
                results[line["id"]] = {"text": line["text"], "heard": heard, "accuracy": round(accuracy, 3), "extra_words": extra, "tail_heard": tail_ok, "char_similarity": round(chars, 3), "pass": ok}
                print(("PASS " if ok else "FAIL ") + f"{line['id']} acc={accuracy:.2f} chars={chars:.2f} extra={extra} tail={tail_ok}" + ("" if ok else f"\n   script: {line['text']}\n   heard:  {heard}"), flush=True)
                if not ok:
                    failed.append(line["id"])
    json.dump(results, open(args.out, "w"), indent=2, ensure_ascii=False)
    print(f"{len(results)} lines recorded, {len(failed)} failed: {','.join(failed)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
