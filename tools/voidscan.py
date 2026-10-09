#!/usr/bin/env python3
"""voidscan.py - pixel-based whitespace / void detector for NexuAlpha pages.

WHAT IT DOES
  For every URL x width it opens a fresh Chromium (channel='chromium', --disable-gpu,
  one page per browser, retried on failure), scrolls the page top->bottom so lazy
  and reveal-on-scroll content renders, returns to the top, takes a FULL-PAGE
  screenshot IN MEMORY (nothing written to disk unless --shots), and analyses the
  pixels inside the content container (default 1200px, centred; narrower viewports
  use viewport minus gutters):

  band    a horizontal run of rows that contain no content (no pixel edges across
          the whole container width; flat colour, smooth gradients and full-width
          hairlines count as empty). Bands up to the deliberate section-padding
          allowance are ignored: <=128px at widths >=1024, <=72px below.
          Reported height = full band; "excess" = height - allowance.
  column  an empty rectangle >=160x160px inside rows that DO have content, e.g. the
          right column of a two-column block that is much shorter than the left,
          an empty card, a sidebar running out. Symmetric side gutters of a centred
          narrow column (article measure) are not reported (use --gutters to keep them).

  Each finding gets the nearest section selector (innermost section/article/aside/
  header/footer/[id] block containing it) so you can jump to the CSS.
  Findings are ranked by void area (excess x width for bands, w x h for columns).

USAGE
  voidscan.py https://nexualpha.com / /exchanges /compare/binance-vs-okx
  voidscan.py --base http://localhost:5031 --paths /,/exchanges,/zh-hans/
  voidscan.py URL... --widths 1440,390 --top 8 --json out.json
  voidscan.py URL... --shots /tmp/vs --shots-max 4     # annotated JPEGs of worst pages
  voidscan.py URL... --budget 0      # exit 1 if any page has a band/column void

  Positional args are full URLs or paths (paths need --base or BASE_URL env).

OPTIONS
  --widths 1440,1280,1024,768,390   viewport widths (height 900; 390 uses 844 + touch)
  --container 1200                  max content container width in px
  --min 160                         min column-void width AND height
  --pad-desktop 128 --pad-mobile 72 deliberate-padding allowance for bands
  --edge 18                         channel delta that counts as a pixel edge
  --jobs 2                          parallel browsers (each loads one page)
  --retries 2                       retries per page on navigation/screenshot error
  --max-height 40000                crop analysis below this y (very long pages)
  --top 10                          findings printed per page
  --json FILE                       write machine-readable results ('-' = stdout)
  --shots DIR                       save annotated JPEGs (red=band, orange=column)
  --shots-max 6                     only the N worst page x width combos get a JPEG
  --budget PX                       fail (exit 1) if any page's total excess void px > PX
  --reduced-motion                  emulate prefers-reduced-motion (default: off,
                                    i.e. real scroll-reveal behaviour is exercised)

OUTPUT (text)
  == https://nexualpha.com/ @1440  H=6234  voids=3  excess=412px
     1. band    y=2310 h=268 (+140)  x=120..1320   in section#faq
     2. column  y=4100 h=320 w=540   x=780..1320   in section.cl-rail
  Exit codes: 0 ok, 1 budget exceeded, 2 some pages failed to load.
"""
import argparse, asyncio, io, json, os, sys, time

import numpy as np
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

SECTIONS_JS = r'''()=>{
const sel=e=>{let s=e.tagName.toLowerCase();if(e.id)return s+'#'+e.id;
 const c=[...e.classList].filter(x=>!/^(is-|js-|astro-)/.test(x)).slice(0,2);if(c.length)s+='.'+c.join('.');return s};
const out=[];const q='header,footer,main,section,article,aside,nav,form,table,[id],main>div,main>*>div,[class*="section"],[class*="grid"],[class*="rail"]';
for(const e of document.querySelectorAll(q)){const r=e.getBoundingClientRect();if(r.width<40||r.height<8)continue;
 let d=0,p=e;while(p=p.parentElement)d++;
 out.push({s:sel(e),t:Math.round(r.top+scrollY),b:Math.round(r.bottom+scrollY),l:Math.round(r.left),r:Math.round(r.right),d})}
return out}'''


def parse():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('targets', nargs='*', help='URLs or paths')
    ap.add_argument('--base', default=os.environ.get('BASE_URL', ''))
    ap.add_argument('--paths', default='', help='comma list of paths (joined to --base)')
    ap.add_argument('--widths', default='1440,1280,1024,768,390')
    ap.add_argument('--container', type=int, default=1200)
    ap.add_argument('--min', type=int, default=160)
    ap.add_argument('--pad-desktop', type=int, default=128)
    ap.add_argument('--pad-mobile', type=int, default=72)
    ap.add_argument('--edge', type=int, default=18)
    ap.add_argument('--jobs', type=int, default=2)
    ap.add_argument('--retries', type=int, default=2)
    ap.add_argument('--max-height', type=int, default=40000)
    ap.add_argument('--top', type=int, default=10)
    ap.add_argument('--json')
    ap.add_argument('--shots')
    ap.add_argument('--shots-max', type=int, default=6)
    ap.add_argument('--budget', type=int)
    ap.add_argument('--gutters', action='store_true')
    ap.add_argument('--reduced-motion', action='store_true')
    ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args()
    urls = []
    items = list(a.targets) + [p for p in a.paths.split(',') if p]
    for t in items:
        if t.startswith('http'):
            urls.append(t)
        else:
            if not a.base:
                ap.error(f'path {t} needs --base or BASE_URL')
            urls.append(a.base.rstrip('/') + (t if t.startswith('/') else '/' + t))
    if not urls:
        ap.error('no URLs given')
    a.urls = urls
    a.widthlist = [int(w) for w in a.widths.split(',') if w]
    return a


def container_x(W, cmax):
    gutter = 16 if W < 768 else 32
    cw = min(cmax, W - 2 * gutter)
    x0 = (W - cw) // 2
    return x0, x0 + cw


def edges(img, t):
    """bool maps: horizontal-diff edges (H,W) and vertical-diff edges (H,W)."""
    a = img.astype(np.int16)
    h = np.zeros(a.shape[:2], bool)
    v = np.zeros(a.shape[:2], bool)
    h[:, 1:] = (np.abs(a[:, 1:] - a[:, :-1]).max(axis=2) > t)
    v[1:, :] = (np.abs(a[1:] - a[:-1]).max(axis=2) > t)
    return h, v


def runs(mask):
    """start,end (exclusive) of True runs in 1-D bool array."""
    m = np.concatenate([[False], mask, [False]]).astype(np.int8)
    d = np.diff(m)
    return list(zip(np.where(d == 1)[0], np.where(d == -1)[0]))


def largest_rects(empty, mincells, maxn=12):
    """Greedy maximal empty rectangles on a cell grid (rows x cols)."""
    found = []
    g = empty.copy()
    R, C = g.shape
    for _ in range(maxn):
        hist = np.zeros(C, int)
        best = (0, None)
        for r in range(R):
            hist = np.where(g[r], hist + 1, 0)
            # largest rectangle in histogram
            st = []
            for c in range(C + 1):
                hc = hist[c] if c < C else 0
                start = c
                while st and st[-1][1] >= hc:
                    s0, h0 = st.pop()
                    w = c - s0
                    if h0 >= mincells and w >= mincells and h0 * w > best[0]:
                        best = (h0 * w, (r - h0 + 1, s0, r + 1, c))
                    start = s0
                st.append((start, hc))
        if not best[1]:
            break
        r0, c0, r1, c1 = best[1]
        found.append(best[1])
        g[r0:r1, c0:c1] = False
    return found


def analyse(img, W, a):
    H = img.shape[0]
    x0, x1 = container_x(W, a.container)
    pad = a.pad_desktop if W >= 1024 else a.pad_mobile
    he, ve = edges(img[:, x0:x1], a.edge)
    rowc = he.sum(axis=1) >= 2           # row has content
    found = []
    for s, e in runs(~rowc):
        h = e - s
        if s == 0 or e >= H - 1:         # ignore page top/bottom margins
            continue
        if h > pad:
            found.append({'kind': 'band', 'y': int(s), 'h': int(h), 'x': int(x0), 'w': int(x1 - x0),
                          'excess': int(h - pad), 'area': int((h - pad) * (x1 - x0))})
    # column voids: 8px cells, cell empty when no h/v edges inside
    cs = 8
    cw = (x1 - x0) // cs
    R = H // cs
    if cw > 0 and R > 0:
        e2 = (he | ve)[:R * cs, :cw * cs].reshape(R, cs, cw, cs).any(axis=(1, 3))
        empty = ~e2
        rowcells_content = ~empty.all(axis=1)
        empty[~rowcells_content] = False  # pure empty rows are bands, handled above
        if not a.gutters:
            for r in range(R):
                nz = np.where(~empty[r])[0]
                if not len(nz):
                    continue
                l, rr = nz[0], cw - 1 - nz[-1]
                if abs(l - rr) <= 6:  # symmetric side margins of a centred column = gutters
                    empty[r, :nz[0]] = False
                    empty[r, nz[-1] + 1:] = False
        for r0, c0, r1, c1 in largest_rects(empty, a.min // cs):
            y, h = r0 * cs, (r1 - r0) * cs
            x, w = x0 + c0 * cs, (c1 - c0) * cs
            found.append({'kind': 'column', 'y': int(y), 'h': int(h), 'x': int(x), 'w': int(w),
                          'excess': int(h), 'area': int(w * h)})
    found.sort(key=lambda f: -f['area'])
    return found


def nearest(sections, f):
    cy = f['y'] + f['h'] / 2
    cx = f['x'] + f['w'] / 2
    inside = [s for s in sections if s['t'] <= cy <= s['b'] and s['l'] <= cx <= s['r']]
    if inside:
        s = min(inside, key=lambda s: (s['b'] - s['t'], -s['d']))
        return 'in ' + s['s']
    prev = [s for s in sections if s['b'] <= cy]
    if prev:
        s = max(prev, key=lambda s: (s['b'], s['d']))
        return 'after ' + s['s']
    return '?'


async def prepare_page(pg, Hv):
    """Wait for hydration, scroll top->bottom in small steps so lazy/reveal content mounts, return to top.
    Shared with pilot-01-prototype/tests/e2e/run.py."""
    try:
        await pg.wait_for_function('document.documentElement.dataset.nexualphaHydrated==="true"', timeout=10000)
    except Exception:
        pass
    await pg.wait_for_timeout(600)
    H = await pg.evaluate('document.documentElement.scrollHeight')
    y = 0
    while y < H:
        await pg.evaluate(f'window.scrollTo(0,{y})')
        await pg.wait_for_timeout(110)
        y += int(Hv * 0.45)  # small steps: reveal observers with high thresholds must fire
        H = await pg.evaluate('document.documentElement.scrollHeight')
    await pg.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)')
    await pg.wait_for_timeout(500)
    # anything hydrated late and still armed (data-phase=armed / not revealed) gets visited once more
    n = await pg.evaluate("""async()=>{const els=[...document.querySelectorAll('[data-phase="armed"]')];
      for(const e of els){e.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,350))}return els.length}""")
    await pg.evaluate('window.scrollTo(0,0)')
    try:
        await pg.wait_for_load_state('networkidle', timeout=5000)
    except Exception:
        pass
    await pg.wait_for_timeout(700)
    return n


async def scan_one(pw, url, W, a):
    Hv = 844 if W < 600 else 900
    err = None
    for attempt in range(a.retries + 1):
        b = None
        try:
            b = await pw.chromium.launch(channel='chromium', args=['--disable-gpu'])
            ctx = await b.new_context(viewport={'width': W, 'height': Hv}, device_scale_factor=1,
                                      has_touch=W < 600, is_mobile=False,
                                      reduced_motion='reduce' if a.reduced_motion else 'no-preference')
            pg = await ctx.new_page()
            await pg.goto(url, wait_until='load', timeout=60000)
            try:
                await pg.wait_for_load_state('networkidle', timeout=8000)
            except Exception:
                pass
            await prepare_page(pg, Hv)
            await pg.wait_for_timeout(700)
            sections = await pg.evaluate(SECTIONS_JS)
            sw = await pg.evaluate('document.documentElement.scrollWidth')
            png = await pg.screenshot(full_page=True, type='png', animations='disabled')
            await b.close()
            im = Image.open(io.BytesIO(png)).convert('RGB')
            del png
            if im.height > a.max_height:
                im = im.crop((0, 0, im.width, a.max_height))
            arr = np.asarray(im)
            if arr.shape[1] != W:  # horizontal overflow widened the shot; analyse viewport width only
                arr = arr[:, :W]
            found = analyse(arr, W, a)
            for f in found:
                f['near'] = nearest(sections, f)
            return {'url': url, 'w': W, 'H': int(arr.shape[0]), 'scrollWidth': sw, 'voids': found,
                    'excess': int(sum(f['excess'] for f in found)), 'area': int(sum(f['area'] for f in found)),
                    '_img': im if a.shots else None}
        except Exception as ex:
            err = f'{type(ex).__name__}: {str(ex)[:160]}'
            if b:
                try:
                    await b.close()
                except Exception:
                    pass
            await asyncio.sleep(1 + attempt)
    return {'url': url, 'w': W, 'error': err, 'voids': [], 'excess': 0, 'area': 0}


def annotate(r, outdir):
    im = r['_img'].copy()
    d = ImageDraw.Draw(im)
    for i, f in enumerate(r['voids'][:12], 1):
        col = (230, 30, 30) if f['kind'] == 'band' else (255, 140, 0)
        for k in range(3):
            d.rectangle([f['x'] + k, f['y'] + k, f['x'] + f['w'] - k, f['y'] + f['h'] - k], outline=col)
        d.text((f['x'] + 6, f['y'] + 6), f"#{i} {f['kind']} {f['h']}px {f['near']}", fill=col)
    sc = min(1.0, 720 / im.width)
    if sc < 1:
        im = im.resize((int(im.width * sc), int(im.height * sc)))
    name = r['url'].split('://', 1)[-1].split('/', 1)[-1].strip('/').replace('/', '_') or 'home'
    p = os.path.join(outdir, f"{name}-{r['w']}.jpg")
    im.save(p, 'JPEG', quality=68)
    return p


async def main():
    a = parse()
    jobs = [(u, w) for u in a.urls for w in a.widthlist]
    sem = asyncio.Semaphore(max(1, a.jobs))
    t0 = time.time()
    async with async_playwright() as pw:
        async def run(u, w):
            async with sem:
                return await scan_one(pw, u, w, a)
        res = await asyncio.gather(*[run(u, w) for u, w in jobs])
    failed = [r for r in res if r.get('error')]
    if not a.quiet:
        for r in res:
            if r.get('error'):
                print(f"== {r['url']} @{r['w']}  ERROR {r['error']}")
                continue
            ov = f"  OVERFLOW sw={r['scrollWidth']}" if r['scrollWidth'] > r['w'] else ''
            print(f"== {r['url']} @{r['w']}  H={r['H']}  voids={len(r['voids'])}  excess={r['excess']}px{ov}")
            for i, f in enumerate(r['voids'][:a.top], 1):
                extra = f" (+{f['excess']})" if f['kind'] == 'band' else f" w={f['w']}"
                print(f"   {i:2}. {f['kind']:6} y={f['y']:<6} h={f['h']:<4}{extra:10} x={f['x']}..{f['x'] + f['w']}  {f['near']}")
        tot = sum(len(r['voids']) for r in res)
        print(f"-- {len(res)} page x width scans, {tot} voids, {len(failed)} failed, {time.time() - t0:.0f}s")
    if a.shots:
        os.makedirs(a.shots, exist_ok=True)
        worst = sorted([r for r in res if r.get('_img') is not None and r['voids']], key=lambda r: -r['area'])[:a.shots_max]
        for r in worst:
            print('shot', annotate(r, a.shots))
    for r in res:
        r.pop('_img', None)
    if a.json:
        s = json.dumps(res, indent=1)
        if a.json == '-':
            print(s)
        else:
            open(a.json, 'w').write(s)
    if failed:
        sys.exit(2)
    if a.budget is not None and any(r['excess'] > a.budget for r in res):
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
