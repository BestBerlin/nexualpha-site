#!/usr/bin/env python3
"""Generate light, royalty-free (self-synthesised, no samples) background beds for promo Shorts.
  python3 music_bed.py OUT.wav [--style bright|calm] [--seconds 64]
Bright = 104 BPM I-V-vi-IV pluck arpeggio + warm pad + soft kick/shaker. Calm = 88 BPM, pad + sparse bells, no drums.
Deterministic (fixed seed). Output 48 kHz stereo 16-bit, peak about -6 dBFS; the muxer sets the final level and ducks it.
"""
import sys, wave, numpy as np
SR = 48000
def note(m): return 440.0 * 2 ** ((m - 69) / 12)
def env(n, a, d, s, r, sus_len):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    e = np.concatenate([np.linspace(0, 1, max(a, 1)), np.linspace(1, s, max(d, 1)), np.full(max(sus_len - a - d, 0), s), np.linspace(s, 0, max(r, 1))])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))
def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR); y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y
def main(out, style="bright", seconds=64):
    rng = np.random.default_rng(7)
    bpm = 104 if style == "bright" else 88
    beat = 60 / bpm; bar = 4 * beat
    total = int(seconds * SR)
    L = np.zeros(total); R = np.zeros(total)
    chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]  # C G Am F
    t_bar = int(bar * SR)
    nbars = int(np.ceil(seconds / bar))
    for b in range(nbars):
        ch = chords[b % 4]; s0 = b * t_bar
        n = min(t_bar + int(0.8 * SR), total - s0)
        if n <= 0: break
        t = np.arange(n) / SR
        pad = sum(np.sin(2 * np.pi * note(m - 12) * t * (1 + det)) for m in ch for det in (-0.002, 0.002))
        pad = pad / 6 * env(n, 0.6, 0.4, 0.8, 0.8, t_bar)
        L[s0:s0 + n] += 0.22 * pad; R[s0:s0 + n] += 0.22 * pad
        bass = np.sin(2 * np.pi * note(ch[0] - 24) * t) * env(n, 0.02, 0.3, 0.6, 0.3, t_bar)
        L[s0:s0 + n] += 0.18 * bass; R[s0:s0 + n] += 0.18 * bass
        steps = 8 if style == "bright" else 4
        arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12, ch[2] + 12]
        for k in range(steps):
            st = s0 + int(k * bar / steps * SR); m = min(int(0.6 * SR), total - st)
            if m <= 0: continue
            tt = np.arange(m) / SR; f = note(arp[k % 8])
            tone = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * (7 if style == "bright" else 3))
            pan = 0.35 + 0.3 * (k % 2)
            L[st:st + m] += 0.16 * tone * (1 - pan); R[st:st + m] += 0.16 * tone * pan
        if style == "bright":
            for k in range(4):
                st = s0 + int(k * beat * SR)
                if k in (0, 2):
                    m = min(int(0.25 * SR), total - st)
                    if m > 0:
                        tt = np.arange(m) / SR
                        kick = np.sin(2 * np.pi * (50 + 70 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 18)
                        L[st:st + m] += 0.30 * kick; R[st:st + m] += 0.30 * kick
                so = st + int(beat / 2 * SR); m = min(int(0.05 * SR), total - so)
                if m > 0:
                    sh = rng.standard_normal(m) * np.exp(-np.arange(m) / SR * 80)
                    sh = sh - lowpass(sh, 6000)
                    L[so:so + m] += 0.05 * sh; R[so:so + m] += 0.05 * sh
    fade = int(1.5 * SR)
    for ch_ in (L, R):
        ch_[:int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR)); ch_[-fade:] *= np.linspace(1, 0, fade)
    st = np.stack([L, R], 1); st *= 0.5 / max(1e-9, np.abs(st).max())
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype("<i2").tobytes())
if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(2)
    style = a[a.index("--style") + 1] if "--style" in a else "bright"
    secs = float(a[a.index("--seconds") + 1]) if "--seconds" in a else 64
    main(a[0], style, secs)
