#!/usr/bin/env python3
"""NexuAlpha e2e layout/invariant suite.

Runs against a running site (BASE_URL / --base, e.g. a preview on :50xx or https://nexualpha.com)
or serves a built package locally (--serve DIR, where DIR holds server.mjs + dist/).

  python3 tests/e2e/run.py --base https://nexualpha.com                 # ci route set, 1440+390
  BASE_URL=http://localhost:5031 python3 tests/e2e/run.py --set full --widths 1440,1280,1024,768,390
  python3 tests/e2e/run.py --serve . --port 5091 --md /tmp/qa.md       # built dist in this dir
  python3 tests/e2e/run.py --base URL --checks cta --update-golden      # needs ALLOW_CTA_CHANGE=1 if golden exists
  python3 tests/e2e/run.py --base URL --baseline tests/e2e/golden/metrics-baseline.json   # fail on regressions

Checks (--checks, comma list; default all):
  void      pixel void scan (tools/voidscan.py analyser): bands > section padding, column voids >=160x160
  type      text sizes in {12,14,16,20,28,44,72}, weights 400/500/600, first family Geist*
  overflow  document wider than viewport (+ offending elements)               [blocking]
  tap       interactive targets < 44x44 at widths < 600 (inline text links exempt)
  collision overlapping text boxes, rail (.rr-dock / *rail*) vs text flagged separately
  css       h1 present/visible/Geist, body Geist, header+footer present, *-sr / sr-only
            classes actually hidden (catches CSS-chunk regressions like round-9 .cl-sr) [blocking];
            DOM classes without any CSS rule are listed (informational)
  cta       sponsored hrefs + data-cta-code per route vs golden/cta-invariants.json [blocking;
            ALLOW_CTA_CHANGE=1 turns a diff into a warning]
  jsoff     JS disabled: h1 visible, main text present, no overflow [blocking]; content hidden
            by reveal classes without JS (warning)
  console   page errors, console errors, same-origin >=400 / failed requests [blocking];
            third-party failures (warning)
  i18n      tools/i18naudit.py on routes.json i18n locales x paths
  clicklat  tools/clicklat.py on home; warn if any click duration > 200ms

Exit status: 1 if any blocking check fails, or (with --baseline) any metric regressed; else 0.
"""
import argparse, asyncio, io, json, os, re, subprocess, sys, time, types, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
sys.path.insert(0, str(REPO / 'tools'))
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402
import voidscan  # noqa: E402

CHECKS_JS = (HERE / 'checks.js').read_text()
ROUTES = json.loads((HERE / 'routes.json').read_text())
GOLDEN = HERE / 'golden' / 'cta-invariants.json'
ALL = ['void', 'type', 'overflow', 'tap', 'collision', 'css', 'cta', 'jsoff', 'console', 'i18n', 'clicklat']
T = dict(sizes=[12, 14, 16, 20, 28, 44, 72], weights=[400, 500, 600], family='^Geist', tapMin=44,
         railSel='[class*="rr-dock"],[class*="rail"]', clickMs=200, mainText=200)
NO_H1_OK = {'/compare', '/embed/calculator'}


def args():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--base', default=os.environ.get('BASE_URL', ''))
    ap.add_argument('--serve', help='dir containing server.mjs and dist/ to serve locally')
    ap.add_argument('--port', type=int, default=5091)
    ap.add_argument('--set', default='ci', choices=['ci', 'full', 'cta'])
    ap.add_argument('--routes', help='comma list overriding --set')
    ap.add_argument('--widths', default='1440,390')
    ap.add_argument('--checks', default=','.join(ALL))
    ap.add_argument('--jobs', type=int, default=2)
    ap.add_argument('--json')
    ap.add_argument('--md')
    ap.add_argument('--baseline', help='metrics json; fail if any metric got worse')
    ap.add_argument('--write-baseline')
    ap.add_argument('--update-golden', action='store_true')
    a = ap.parse_args()
    a.checks = [c for c in a.checks.split(',') if c]
    a.widthlist = [int(w) for w in a.widths.split(',')]
    if a.routes:
        a.routelist = a.routes.split(',')
    elif a.set == 'full':
        a.routelist = ROUTES['ci'] + ROUTES['extended']
    elif a.set == 'cta':
        a.routelist = ROUTES['cta']
    else:
        a.routelist = list(ROUTES['ci'])
    if 'cta' in a.checks:
        a.routelist += [r for r in ROUTES['cta'] if r not in a.routelist]
    return a


VS = types.SimpleNamespace(container=1200, pad_desktop=128, pad_mobile=72, edge=18, min=160, gutters=False)


async def visit(pw, base, route, W, a, js=True, retries=2):
    Hv = 844 if W < 600 else 900
    url = base + route
    host = re.sub(r'^https?://', '', base).split('/')[0]
    last = None
    for attempt in range(retries + 1):
        b = None
        log = {'pageerror': [], 'console': [], 'failed': [], 'status': []}
        try:
            b = await pw.chromium.launch(channel='chromium', args=['--disable-gpu'])
            ctx = await b.new_context(viewport={'width': W, 'height': Hv}, device_scale_factor=1, has_touch=W < 600,
                                      java_script_enabled=js)
            pg = await ctx.new_page()
            strip = os.environ.get('QA_CSS_STRIP')  # self-test: drop CSS rules whose selector matches this regex
            if strip:
                async def _strip(route):
                    r = await route.fetch()
                    css = re.sub(r'(?<=[{}])([^{}@]*(?:' + strip + r')[^{}]*)\{[^{}]*\}', '', await r.text())
                    await route.fulfill(response=r, body=css)
                await pg.route('**/*.css', _strip)
            pg.on('pageerror', lambda e: log['pageerror'].append(str(e)[:200]))
            pg.on('console', lambda m: m.type == 'error' and log['console'].append(m.text[:200]))
            pg.on('requestfailed', lambda r: log['failed'].append((r.url[:160], (r.failure or '')[:60])))
            pg.on('response', lambda r: r.status >= 400 and log['status'].append((r.url[:160], r.status)))
            resp = await pg.goto(url, wait_until='load', timeout=60000)
            try:
                await pg.wait_for_load_state('networkidle', timeout=8000)
            except Exception:
                pass
            if js:
                await voidscan.prepare_page(pg, Hv)
            opts = dict(T, tap=W < 600)
            d = await pg.evaluate(CHECKS_JS, opts)
            d['httpStatus'] = resp.status if resp else 0
            if js and 'void' in a.checks:
                png = await pg.screenshot(full_page=True, type='png', animations='disabled')
                im = Image.open(io.BytesIO(png)).convert('RGB')
                del png
                if im.height > 40000:
                    im = im.crop((0, 0, im.width, 40000))
                arr = np.asarray(im)[:, :W]
                vs = voidscan.analyse(arr, W, VS, await pg.evaluate(voidscan.STICKY_JS))
                for f in vs:
                    f['near'] = voidscan.nearest(d['sections'], f)
                d['voids'] = vs
                del arr, im
            await b.close()
            d.pop('sections', None)
            d['log'] = log
            d['host'] = host
            return d
        except Exception as ex:
            last = f'{type(ex).__name__}: {str(ex)[:200]}'
            if b:
                try:
                    await b.close()
                except Exception:
                    pass
            await asyncio.sleep(1 + 2 * attempt)
    return {'error': last}


def start_server(a):
    d = Path(a.serve).resolve()
    env = dict(os.environ, PORT=str(a.port), NODE_ENV='production', HOST='127.0.0.1')
    env.pop('BUILD_ID', None)
    proc = subprocess.Popen(['node', 'server.mjs'], cwd=d, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT,
                            start_new_session=True)
    base = f'http://127.0.0.1:{a.port}'
    for _ in range(60):
        try:
            urllib.request.urlopen(base + '/', timeout=2)
            return proc, base
        except Exception:
            time.sleep(0.5)
    proc.terminate()
    sys.exit(f'server in {d} did not answer on {base}')


def sub(cmd, timeout):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.stdout + r.stderr
    except subprocess.TimeoutExpired as e:
        return f'TIMEOUT {e}'


async def main():
    a = args()
    proc = None
    if a.serve:
        proc, base = start_server(a)
    else:
        base = a.base.rstrip('/')
        if not base:
            sys.exit('need --base / BASE_URL or --serve')
    t0 = time.time()
    try:
        build = json.loads(urllib.request.urlopen(base + '/version.json', timeout=15).read()).get('buildId', '?')
    except Exception:
        build = '?'
    res = {}
    jsoff = {}
    sem = asyncio.Semaphore(max(1, a.jobs))
    try:
        async with async_playwright() as pw:
            async def one(r, w, js):
                async with sem:
                    d = await visit(pw, base, r, w, a, js=js)
                    (res if js else jsoff)[f'{r}@{w}'] = d
                    st = 'ERR ' + d['error'] if 'error' in d else f"ok H={d['H']}"
                    print(f"  {'js ' if js else 'off'} {r}@{w} {st}", flush=True)
            jobs = []
            dom_checks = {'void', 'type', 'overflow', 'tap', 'collision', 'css', 'cta', 'console'}
            if dom_checks & set(a.checks):
                cta_only = not (dom_checks - {'cta'}) & set(a.checks)
                for r in a.routelist:
                    if cta_only and r not in ROUTES['cta']:
                        continue
                    for w in a.widthlist:
                        jobs.append(one(r, w, True))
            if 'jsoff' in a.checks:
                for r in a.routelist:
                    for w in sorted({a.widthlist[0], a.widthlist[-1]}):
                        jobs.append(one(r, w, False))
            await asyncio.gather(*jobs)
    finally:
        if proc and 'i18n' not in a.checks and 'clicklat' not in a.checks:
            pass
    ext = {}
    if 'i18n' in a.checks:
        i = ROUTES['i18n']
        out = sub([sys.executable, str(REPO / 'tools' / 'i18naudit.py'), base, ','.join(i['locales']), ','.join(i['paths'])], 900)
        m = re.search(r'TOTAL flagged: (\d+)', out)
        ext['i18n'] = {'total': int(m.group(1)) if m else None, 'out': out[-6000:]}
    if 'clicklat' in a.checks:
        out = sub([sys.executable, str(REPO / 'tools' / 'clicklat.py'), base, '/', '2'], 300)
        mx = {}
        for line in out.splitlines():
            m = re.match(r'(\w+) (\[.*\])$', line)
            if m:
                try:
                    mx[m.group(1)] = max([max(x['click_dur'] or [0]) for x in json.loads(m.group(2))] or [0])
                except Exception:
                    pass
        ext['clicklat'] = {'max': mx, 'out': out[-2000:]}
    if proc:
        proc.terminate()
    report = evaluate(a, base, build, res, jsoff, ext)
    report['seconds'] = round(time.time() - t0)
    print_report(report)
    if a.json:
        Path(a.json).write_text(json.dumps({'report': report, 'raw': res, 'jsoff': jsoff}, indent=1, default=str))
    if a.md:
        Path(a.md).write_text(markdown(report))
    if a.write_baseline:
        Path(a.write_baseline).write_text(json.dumps(report['metrics'], indent=1, sort_keys=True))
    sys.exit(1 if report['blocking'] else 0)


def evaluate(a, base, build, res, jsoff, ext):
    rep = {'base': base, 'build': build, 'checks': {}, 'metrics': {}, 'defects': [], 'blocking': []}
    expected404 = set(ROUTES.get('expected404', []))

    def add(check, sev, key, msg, rank=0):
        rep['defects'].append({'check': check, 'sev': sev, 'page': key, 'msg': msg, 'rank': rank})
        if sev == 'FAIL':
            rep['blocking'].append(f'{check}: {key}: {msg}')

    for key, d in sorted(res.items()):
        route, w = key.rsplit('@', 1)
        w = int(w)
        if 'error' in d:
            add('load', 'FAIL', key, d['error'])
            continue
        m = rep['metrics'].setdefault(key, {})
        if 'void' in a.checks:
            v = d.get('voids', [])
            m['voids'] = len(v)
            m['voidExcess'] = sum(f['excess'] for f in v)
            for s in d.get('stuck', []):
                add('void', 'WARN', key, f"invisible block after full scroll (reveal never fired?) {s['s']} y={s['y']} {s['w']}x{s['h']}", s['w'] * s['h'])
            m['stuck'] = len(d.get('stuck', []))
            for f in v:
                add('void', 'WARN', key, f"{f['kind']} y={f['y']} h={f['h']}" + (f" (+{f['excess']} over padding)" if f['kind'] == 'band' else f" w={f['w']} x={f['x']}") + f" {f['near']}", f['area'])
        if 'type' in a.checks:
            bad = d['type']['bad']
            m['typeBad'] = sum(x['c'] for k in bad for x in bad[k].values())
            for kind in ('size', 'weight', 'family'):
                for val, x in sorted(bad[kind].items(), key=lambda kv: -kv[1]['c']):
                    add('type', 'WARN', key, f"{kind} {val} x{x['c']} e.g. {x['ex']}", x['c'])
        if 'overflow' in a.checks:
            o = d['overflow']
            if o['sw'] > o['cw'] + 1:
                add('overflow', 'FAIL', key, f"scrollWidth {o['sw']} > {o['cw']}: " + ', '.join(f"{x['s']}(r={x['right']})" for x in o['offenders'][:4]), o['sw'] - o['cw'])
            m['overflow'] = max(0, o['sw'] - o['cw'])
        if 'tap' in a.checks and w < 600:
            m['tap'] = len(d['tap'])
            for t in d['tap'][:25]:
                add('tap', 'WARN', key, f"{t['w']}x{t['h']} {t['s']} '{t['t']}' y={t['y']}", 44 * 44 - t['w'] * t['h'])
        if 'collision' in a.checks:
            c = d['collisions']
            m['collisions'] = len(c)
            m['railCollisions'] = sum(1 for x in c if x['rail'])
            for x in c:
                add('collision', 'WARN', key, f"{'RAIL ' if x['rail'] else ''}{x['a']} '{x['ta']}' overlaps {x['b']} '{x['tb']}' at y={x['at']} x={x['x']} ({x['area']}px2)", x['area'] * (4 if x['rail'] else 1))
        if 'css' in a.checks:
            c = d['css']
            probs = []
            if not c['h1'] and route not in NO_H1_OK:
                probs.append('no h1')
            elif c['h1']:
                if not c['h1']['visible'] and route not in NO_H1_OK:
                    probs.append('h1 not visible')
                if not re.match(T['family'], c['h1']['family']):
                    probs.append(f"h1 family {c['h1']['family']}")
                if c['h1']['size'] < 20:
                    probs.append(f"h1 size {c['h1']['size']}px (unstyled?)")
            if not re.match(T['family'], c['bodyFont']):
                add('css', 'WARN', key, f"body font-family resolves to {c['bodyFont']} (not Geist)", 10)
            if not route.startswith('/embed/') and (c['headerH'] == 0 or c['headerH'] > 200):
                probs.append(f"header height {c['headerH']}")
            if not c['footer']:
                probs.append('footer missing/collapsed')
            for s in c['srLeaks']:
                probs.append(f"visible sr-only {s['s']} {s['w']}x{s['h']} '{s['t']}'")
            for p in probs:
                add('css', 'FAIL', key, p, 1000)
            m['uncoveredClasses'] = len(c['uncovered'])
            m['h1'] = c['h1']['size'] if c['h1'] else 0
        if 'console' in a.checks:
            L = d['log']
            for e in L['pageerror']:
                add('console', 'FAIL', key, 'pageerror ' + e, 500)
            for e in L['console']:
                add('console', 'WARN' if 'Failed to load resource' in e else 'FAIL', key, 'console.error ' + e, 400)
            for u, s in L['status']:
                same = d['host'] in u
                path = re.sub(r'^https?://[^/]+', '', u).split('?')[0]
                if same and path.rstrip('/') in expected404 and s == 404:
                    continue
                add('console', 'FAIL' if same else 'WARN', key, f'HTTP {s} {u}', 300)
            for u, f in L['failed']:
                if 'ERR_ABORTED' in f:
                    continue
                add('console', 'FAIL' if d['host'] in u else 'WARN', key, f'request failed {f} {u}', 200)
    if 'cta' in a.checks:
        cur = {k: res[k]['cta'] for k in res if 'error' not in res[k] and k.rsplit('@', 1)[0] in ROUTES['cta']}
        codes = sorted({c for k in res if 'error' not in res[k] for c in res[k].get('codes', [])})
        allow = os.environ.get('ALLOW_CTA_CHANGE') == '1'
        if GOLDEN.exists():
            g = json.loads(GOLDEN.read_text())
            for k, v in sorted(cur.items()):
                if k not in g['routes']:
                    if any(x.rsplit('@', 1)[0] == k.rsplit('@', 1)[0] for x in g['routes']):
                        continue  # width not snapshotted (golden holds 1440 and 390)
                    add('cta', 'WARN', k, 'route not in golden (run --update-golden with ALLOW_CTA_CHANGE=1)')
                    continue
                gone = sorted(set(g['routes'][k]) - set(v))
                new = sorted(set(v) - set(g['routes'][k]))
                for x in gone:
                    add('cta', 'WARN' if allow else 'FAIL', k, 'MISSING sponsored link ' + x, 2000)
                for x in new:
                    add('cta', 'WARN' if allow else 'FAIL', k, 'NEW sponsored link ' + x, 2000)
            rep['ctaGoldenRoutes'] = len(g['routes'])
        else:
            add('cta', 'FAIL' if not a.update_golden else 'WARN', 'golden', 'golden/cta-invariants.json missing')
        if a.update_golden:
            if GOLDEN.exists() and not allow:
                add('cta', 'FAIL', 'golden', 'refusing --update-golden without ALLOW_CTA_CHANGE=1')
            else:
                old = json.loads(GOLDEN.read_text())['routes'] if GOLDEN.exists() else {}
                old.update(cur)
                GOLDEN.write_text(json.dumps({'_doc': 'Sponsored hrefs | data-cta-code per route@width, collected after a full scroll. Change only with user approval (ALLOW_CTA_CHANGE=1).',
                                              'build': build, 'codes': codes, 'routes': old}, indent=1, sort_keys=True) + '\n')
                print('golden written:', GOLDEN)
        rep['ctaLinks'] = sum(len(v) for v in cur.values())
    if 'jsoff' in a.checks:
        for key, d in sorted(jsoff.items()):
            route = key.rsplit('@', 1)[0]
            if 'error' in d:
                add('jsoff', 'FAIL', key, d['error'])
                continue
            m = rep['metrics'].setdefault(key, {})
            c = d['css']
            if route not in NO_H1_OK and (not c['h1'] or not c['h1']['visible']):
                add('jsoff', 'FAIL', key, 'no visible h1 without JS', 900)
            if d['mainText'] < T['mainText'] and route not in NO_H1_OK:
                add('jsoff', 'FAIL', key, f"main text only {d['mainText']} chars without JS", 900)
            if d['overflow']['sw'] > d['overflow']['cw'] + 1:
                add('jsoff', 'FAIL', key, f"overflow without JS sw={d['overflow']['sw']}", 800)
            m['jsoffInvisible'] = d['invisible']
            if d['invisible']:
                add('jsoff', 'WARN', key, f"{d['invisible']} text elements invisible without JS e.g. {', '.join(d['invisibleEx'])}", d['invisible'])
            for s in c['srLeaks']:
                add('jsoff', 'FAIL', key, f"visible sr-only without JS {s['s']} '{s['t']}'", 900)
    if 'i18n' in ext:
        t = ext['i18n']['total']
        rep['metrics'].setdefault('_site', {})['i18n'] = t if t is not None else -1
        if t is None:
            add('i18n', 'WARN', 'site', 'i18naudit did not finish: ' + ext['i18n']['out'][-300:])
        for line in ext['i18n']['out'].splitlines():
            mm = re.match(r"\s+'(.*)'\s+@ (.*)$", line)
            if mm:
                add('i18n', 'WARN', mm.group(2), 'English leftover: ' + mm.group(1)[:120], 1)
        rep['i18nTotal'] = t
    if 'clicklat' in ext:
        mx = ext['clicklat']['max']
        rep['clicklat'] = mx
        if not mx:
            add('clicklat', 'WARN', '/@1440', 'clicklat produced no data: ' + ext['clicklat']['out'][-300:])
        for k, v in mx.items():
            if v > T['clickMs']:
                add('clicklat', 'WARN', '/@1440', f'{k} click duration {v}ms > {T["clickMs"]}ms', v)
    if a.baseline and Path(a.baseline).exists():
        b = json.loads(Path(a.baseline).read_text())
        for key, m in rep['metrics'].items():
            for k, v in m.items():
                if k in ('h1', 'uncoveredClasses'):  # informational only
                    continue
                old = b.get(key, {}).get(k)
                tol = 24 if k == 'voidExcess' else 0  # sub-pixel/font raster jitter
                if old is not None and v > old + tol:
                    add('regression', 'FAIL', key, f'{k} {old} -> {v}', 1500)
    for c in a.checks + ['load', 'regression']:
        ds = [x for x in rep['defects'] if x['check'] == c]
        st = 'FAIL' if any(x['sev'] == 'FAIL' for x in ds) else ('WARN' if ds else 'PASS')
        if ds or c in a.checks:
            rep['checks'][c] = {'status': st, 'fail': sum(x['sev'] == 'FAIL' for x in ds), 'warn': sum(x['sev'] == 'WARN' for x in ds)}
    rep['defects'].sort(key=lambda x: (x['sev'] != 'FAIL', x['check'], -x['rank']))
    return rep


def print_report(rep):
    print(f"\n== e2e {rep['base']} build {rep['build']} ({rep.get('seconds', '?')}s)")
    for c, s in rep['checks'].items():
        print(f"  {c:10} {s['status']:4}  fail={s['fail']} warn={s['warn']}")
    for x in [d for d in rep['defects'] if d['sev'] == 'FAIL'][:40]:
        print(f"  FAIL {x['check']:9} {x['page']}: {x['msg'][:220]}")
    print('BLOCKING' if rep['blocking'] else 'no blocking failures')


def markdown(rep):
    L = [f"# e2e report: {rep['base']}", '', f"Build `{rep['build']}`, {rep.get('seconds', '?')}s.", '', '| Check | Status | Fail | Warn |', '|---|---|---|---|']
    for c, s in rep['checks'].items():
        L.append(f"| {c} | {s['status']} | {s['fail']} | {s['warn']} |")
    for c in ['load', 'css', 'cta', 'overflow', 'console', 'jsoff', 'void', 'collision', 'type', 'tap', 'i18n', 'clicklat', 'regression']:
        ds = [d for d in rep['defects'] if d['check'] == c]
        if not ds:
            continue
        ds.sort(key=lambda d: (d['sev'] != 'FAIL', -d['rank']))
        L += ['', f'## {c} ({len(ds)})', '']
        for d in ds[:60]:
            L.append(f"- {d['sev']} `{d['page']}` {d['msg']}")
        if len(ds) > 60:
            L.append(f'- ... {len(ds) - 60} more')
    return '\n'.join(L) + '\n'


if __name__ == '__main__':
    asyncio.run(main())
