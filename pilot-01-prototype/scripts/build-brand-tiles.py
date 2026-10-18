#!/usr/bin/env python3
"""Normalise venue marks into one tile system (de-AI pass 2026-10-18).

Every tile is a full-bleed square (64 and 128 px WebP) so the shared CSS tile (same radius, same hairline, same
size per context) shows every exchange at the same optical size. Rules:
  * opaque app icons are resized as-is;
  * pre-rounded or circular icons get their transparent corners filled with the icon's own edge colour;
  * bare glyphs on transparency sit at 68 % on the neutral tile colour (#16191F).
Sources are the official assets already recorded in src/content/brand-manifest.ts. Run: python3 scripts/build-brand-tiles.py
"""
import io, json, os, subprocess, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
OUT = os.path.join(ROOT, "brands", "tile")
NEUTRAL = (22, 25, 31, 255)
SOURCES = {
  "binance": "brands/binance.png", "okx": "brands/okx.png", "bybit": "brands/bybit.png",
  "bitget": "brands/bitget/manifest-icon.png", "gate-io": "brands/gate-io/app-store-icon.jpg",
  "mexc": "brands/mexc/app-store-icon.jpg", "htx": "brands/htx/google-play-icon.png", "kraken": "brands/kraken.png",
  "coinbase": "brands/coinbase/app-store-icon.jpg", "kucoin": "brands/kucoin/google-play-icon.png",
  "crypto-com": "brands/crypto-com/app-store-icon.jpg", "gemini": "brands/gemini/apple-touch-icon.png",
  "bitstamp": "brands/bitstamp/app-store-icon.jpg", "upbit": "brands/upbit/icon-square.png",
  "bithumb": "brands/bithumb/icon-square.png", "bingx": "brands/bingx/icon-square.png",
  "whitebit": "brands/whitebit/app-store-icon.jpg", "lbank": "brands/lbank/app-store-icon.jpg",
  "bullish": "brands/bullish/app-store-icon.jpg", "deribit": "brands/deribit/app-store-icon.jpg",
  "phemex": "brands/phemex/app-store-icon.jpg", "weex": "brands/weex/app-store-icon.jpg",
  "deepcoin": "brands/deepcoin/app-store-icon.jpg", "btse": "brands/btse/app-store-icon.jpg",
  "hashkey": "brands/hashkey/app-store-icon.jpg", "bitfinex": "brands/bitfinex/app-store-icon.jpg",
  "uniswap": "brands/uniswap/official-icon.png", "pancakeswap": "brands/pancakeswap/official-icon.png",
  "hyperliquid": "brands/hyperliquid/official-icon.png", "jupiter": "brands/jupiter/official-icon.png",
  "raydium": "brands/raydium/official-icon.png", "curve": "brands/curve/official-icon.png",
  "sushi": "brands/sushi/official-icon.png", "gmx": "brands/gmx/official-icon.png",
  "drift": "brands/drift/official-icon.png", "aster": "brands/aster/official-icon.png",
  "vertex": "brands/vertex/official-icon.png", "balancer": "brands/balancer/official-icon.png",
  "coinex": "brands/coinex/icon-square.svg", "coinw": "brands/coinw/icon-square.svg", "dydx": "brands/dydx/official-icon.svg",
  "aerodrome": "brands/aerodrome/official-logo.svg", "camelot": "brands/camelot/official-icon.svg",
}

def load(path):
  if not path.endswith(".svg"): return Image.open(path)
  # SVG marks are rasterised with the resvg binary the OG renderer already ships (node_modules/@resvg/resvg-js).
  js = "const {Resvg}=require('@resvg/resvg-js');process.stdout.write(new Resvg(require('fs').readFileSync(process.argv[1],'utf8'),{fitTo:{mode:'width',value:512}}).render().asPng())"
  png = subprocess.run(["node", "-e", js, path], check=True, capture_output=True, cwd=os.path.join(ROOT, "..")).stdout
  return Image.open(io.BytesIO(png))

def square(im):
  w, h = im.size
  if w == h: return im
  s = max(w, h); c = Image.new("RGBA", (s, s), (0, 0, 0, 0)); c.paste(im, ((s - w) // 2, (s - h) // 2)); return c

def tile(im):
  im = square(im.convert("RGBA"))
  w, _ = im.size
  alpha = im.getchannel("A")
  if alpha.getextrema()[0] == 255: return im
  # Transparent corners: is the icon a filled shape (edge midpoints opaque) or a bare glyph?
  mids = [im.getpixel((w // 2, 1)), im.getpixel((1, w // 2)), im.getpixel((w // 2, w - 2)), im.getpixel((w - 2, w // 2))]
  if all(p[3] > 240 for p in mids):
    bg = Image.new("RGBA", im.size, mids[0][:3] + (255,))
    # Grow the fill slightly under the shape so antialiased rounded edges never show a dark seam.
    bg.alpha_composite(im); return bg
  box = alpha.getbbox(); glyph = im.crop(box)
  size = 512; inner = int(size * 0.68)
  k = inner / max(glyph.size)
  glyph = glyph.resize((max(1, round(glyph.width * k)), max(1, round(glyph.height * k))), Image.LANCZOS)
  bg = Image.new("RGBA", (size, size), NEUTRAL)
  bg.alpha_composite(glyph, ((size - glyph.width) // 2, (size - glyph.height) // 2)); return bg

os.makedirs(OUT, exist_ok=True)
made = {}
for slug, rel in SOURCES.items():
  src = os.path.join(ROOT, rel)
  if not os.path.exists(src): print("missing", slug, rel, file=sys.stderr); continue
  t = tile(load(src))
  for px in (64, 128):
    t.resize((px, px), Image.LANCZOS).convert("RGB").save(os.path.join(OUT, f"{slug}-{px}.webp"), "WEBP", quality=88, method=6)
  made[slug] = rel
print(json.dumps(sorted(made)))
