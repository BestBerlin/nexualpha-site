"""Probe and fully decode all season exports, including the encoded end-card QR."""
import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

import engine


def verify(out, script):
    manifest = json.loads((out / 'render-manifest.json').read_text())
    assert manifest['status'] in ('INCOMPLETE_SILENT_DIAGNOSTIC', 'NARRATED')
    fingerprint = hashlib.sha256(json.dumps(script, sort_keys=True).encode()).hexdigest()
    assert manifest['script_sha256'] == fingerprint, 'Render does not match current episode'
    assert (out/'script.sha256').read_text() == fingerprint
    layout = json.loads((out/'layout-preflight.json').read_text())
    assert layout['status'] == 'PASS' and layout['scenes'] == len(script['scenes'])
    assert layout['minimum_font_px'] >= 34 and layout['sizes'] == [[1920,1080],[1080,1920]]
    evidence = {}
    for label, size in [('master', (1920,1080)), ('vertical', (1080,1920))]:
        for suffix in ('', '-captions'):
            path = out / f'{label}-zh-Hans{suffix}.mp4'
            probe = json.loads(engine.run([engine.FFPROBE, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]))
            video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            audio = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
            assert video['codec_name'] == 'h264' and video['pix_fmt'] == 'yuv420p'
            assert (video['width'], video['height']) == size and video['r_frame_rate'] == '30/1'
            assert audio['codec_name'] == 'aac'
            assert abs(float(probe['format']['duration']) - manifest['duration']) < .05
            engine.run([engine.FFMPEG, '-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'])
            evidence[path.name] = probe
    assert Image.open(out / 'poster.jpg').size == (1280,720)
    for orientation in ('landscape', 'vertical'):
        Image.open(out / f'contact-sheet-{orientation}.jpg').verify()
    import subprocess
    raw = subprocess.run([engine.FFMPEG, '-v', 'error', '-ss', str(manifest['duration']-3), '-i', str(out/'vertical-zh-Hans.mp4'), '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], check=True, capture_output=True, env=engine.ENV).stdout
    frame = np.frombuffer(raw, dtype=np.uint8).reshape((1920,1080,3))
    decoded = cv2.QRCodeDetector().detectAndDecode(frame[950:1250,64:364])[0]
    expected = f'https://nexualpha.com/zh-hans/starter/{script["meta"]["slug"]}?src=academy-video'
    assert decoded == expected, f'QR mismatch: {decoded}'
    evidence['qr_decode'] = {'decoded':decoded, 'pass':True}
    (out/'ffprobe.json').write_text(json.dumps(evidence, indent=2)+'\n')
    print(f'{out.name}: four streams + full decode + QR + contact sheets PASS', flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, default=engine.ROOT/'samples/season1')
    args = parser.parse_args()
    out = args.out.resolve()
    if engine.REPO not in out.parents:
        raise ValueError('Output must remain inside this checkout')
    paths = sorted((engine.ROOT/'episodes').glob('[0-9][0-9]-*.json'))
    assert len(paths) == 12
    for path in paths:
        verify(out/path.stem, json.loads(path.read_text()))


if __name__ == '__main__':
    main()
