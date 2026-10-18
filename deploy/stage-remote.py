# Runs ON the production server:  env RELEASE=... BUILD_ID=... python3 - < stage-remote.py
# Python 3.6 compatible (the server runs CentOS python3.6).
#
# Starts a new release as a STANDBY container next to the live one. Never touches Nginx.
# Hard gates (any failure removes the standby and exits non-zero; the live site is untouched):
#   1. exactly one live upstream port in the Nginx vhost, and a running container publishing it
#   2. the live buildId is one this repository knows: BASELINE_BUILD_ID, or a build made by this
#      pipeline (contains "-GH-"). Anything else means someone deployed outside this repo -> stop.
#   3. the standby answers 200 on every preflight route and reports the expected buildId
#   4. registration / invite links on the money pages are identical to the live site
#      (unless ALLOW_CTA_CHANGE=1)
import glob
from html.parser import HTMLParser
from urllib.parse import urlsplit
import urllib.error
import json, os, pathlib, re, socket, subprocess, sys, time, urllib.request

RELEASE = os.environ.get('RELEASE', '')
BUILD_ID = os.environ.get('BUILD_ID', '')
BASELINE = os.environ.get('BASELINE_BUILD_ID', '')
ALLOW_CTA_CHANGE = os.environ.get('ALLOW_CTA_CHANGE') == '1'
PKG = '/data/wwwroot/nexualpha-ui-%s.tgz' % RELEASE
ROOT = '/data/wwwroot/nexualpha-release-%s' % RELEASE
NEW = 'nexualpha-web-%s' % RELEASE
STATE = ROOT + '.state.json'
CONF = pathlib.Path('/www/server/panel/vhost/nginx/nexualpha.com.conf')
ROUTES = ['/', '/exchanges', '/exchanges/binance', '/exchanges/bitget', '/exchanges/okx',
          '/compare/binance-vs-okx', '/activities', '/news', '/rates', '/telegram', '/br', '/methodology', '/zh-hans']
CTA_PAGES = ['/', '/exchanges', '/exchanges/binance', '/exchanges/bitget', '/exchanges/okx', '/compare/binance-vs-okx']
CTA_MARKERS = ('ref=', 'referral', 'invite', 'vipcode', 'channelcode', 'affiliate', 'register', 'signup', 'sign-up')


def out(*a):
    return subprocess.check_output(list(a), universal_newlines=True)


def sh(*a, **k):
    return subprocess.run(list(a), check=True, **k)


def get(port, path, timeout=60, tries=4):
    last = None
    for _ in range(tries):
        try:
            with urllib.request.urlopen('http://127.0.0.1:%s%s' % (port, path), timeout=timeout) as resp:
                return resp.status, resp.read().decode('utf-8', 'replace')
        except Exception as e:
            last = e
            print('  retry %s%s after %s' % (port, path, e))
            time.sleep(5)
    raise RuntimeError('port %s %s: %s' % (port, path, last))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def resolve_go(port, href):
    # Never follow a redirect or contact the partner. Fail closed on broken /go links.
    request = urllib.request.Request('http://127.0.0.1:%s%s' % (port, href), method='HEAD')
    try:
        response = urllib.request.build_opener(NoRedirect()).open(request, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        destination = response.headers.get('Location', '')
        if response.code not in (301, 302, 303, 307, 308) or urlsplit(destination).scheme not in ('http', 'https') or not urlsplit(destination).netloc:
            raise RuntimeError('invalid /go redirect on port %s: %s -> %s' % (port, href, response.code))
        return destination


class CTAMarkup(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self, convert_charrefs=True)
        self.links = []
        self.codes = []
        self.code_depth = 0
        self.code_text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a':
            self.links.append((attrs.get('href', ''), attrs.get('rel', '').split()))
        if self.code_depth and tag not in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'):
            self.code_depth += 1
        elif not self.code_depth and 'registration-card__code-value' in attrs.get('class', '').split():
            self.code_depth = 1
            self.code_text = []

    def handle_endtag(self, tag):
        if self.code_depth:
            self.code_depth -= 1
            if not self.code_depth:
                self.codes.append(''.join(self.code_text).strip())

    def handle_data(self, data):
        if self.code_depth:
            self.code_text.append(data)


def cta_links(html, port=None):
    parser = CTAMarkup()
    parser.feed(html)
    found = set('code:' + code for code in parser.codes)
    for href, rel in parser.links:
        if href.startswith('/go/'):
            if port is None:
                raise RuntimeError('port required to resolve /go links')
            href = resolve_go(port, href)
            is_cta = True
        else:
            is_cta = 'sponsored' in rel or any(k in href.lower() for k in CTA_MARKERS)
        if urlsplit(href).scheme in ('http', 'https') and is_cta:
            # Build-time timestamp is not part of the partner identity.
            found.add(re.sub(r'tg_expires=\d+', 'tg_expires=N', href))
    return sorted(found)


def main():
    if not all((RELEASE, BUILD_ID, BASELINE)):
        sys.exit('ABORT RELEASE, BUILD_ID and BASELINE_BUILD_ID are required')
    conf = CONF.read_text()
    ports = sorted(set(re.findall(r'127\.0\.0\.1:(18\d\d\d)', conf)))
    if len(ports) != 1:
        sys.exit('ABORT expected exactly one upstream port in nginx conf, found %s' % ports)
    old_port = ports[0]
    if conf.count('127.0.0.1:' + old_port) != 1:
        sys.exit('ABORT upstream port appears more than once in nginx conf')
    old = None
    for line in out('docker', 'ps', '--format', '{{.Names}}\t{{.Ports}}').splitlines():
        name, _, p = line.partition('\t')
        if '127.0.0.1:%s->' % old_port in p:
            old = name
    if not old:
        sys.exit('ABORT no running container publishes live port %s' % old_port)

    live_build = json.loads(get(old_port, '/version.json')[1])['buildId']
    if live_build != BASELINE and '-GH-' not in live_build:
        sys.exit('ABORT live build %s is neither the repo baseline %s nor a build from this pipeline; '
                 'someone deployed outside this repository. Refusing to overwrite it.' % (live_build, BASELINE))
    if live_build == BUILD_ID:
        sys.exit('ABORT %s is already live' % BUILD_ID)
    print('live %s (%s on %s) is a known base' % (live_build, old, old_port))

    # Remove leftovers of earlier FAILED stagings (container + release dir without a state file).
    for line in out('docker', 'ps', '-a', '--format', '{{.Names}}').splitlines():
        if line.startswith('nexualpha-web-gh-') and line != old:
            rel = line[len('nexualpha-web-'):]
            root = '/data/wwwroot/nexualpha-release-%s' % rel
            if not pathlib.Path(root + '.state.json').exists():
                print('removing leftover of failed staging: %s' % line)
                subprocess.run(['docker', 'rm', '-f', line], stdout=subprocess.DEVNULL)
                subprocess.run(['rm', '-rf', '--', root])

    if pathlib.Path(ROOT).exists():
        sys.exit('ABORT %s already exists' % ROOT)
    if subprocess.run(['docker', 'inspect', NEW], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
        sys.exit('ABORT container %s already exists' % NEW)


    def free(port):
        s = socket.socket()
        try:
            s.bind(('127.0.0.1', port))
            return True
        except OSError:
            return False
        finally:
            s.close()


    used = set(re.findall(r'127\.0\.0\.1:(\d+)->', out('docker', 'ps', '-a', '--format', '{{.Ports}}')))
    new_port = next((p for p in range(int(old_port) + 1, int(old_port) + 60) if str(p) not in used and free(p)), None)
    if not new_port:
        sys.exit('ABORT no free standby port')

    info = json.loads(out('docker', 'inspect', old))[0]
    content = [m['Source'] for m in info.get('Mounts', []) if m.get('Destination') == '/app/dist/client/content']
    pathlib.Path(ROOT).mkdir(parents=True)
    sh('tar', '-xzf', PKG, '-C', ROOT)
    # 2026-10-10: keep hashed JS/CSS from recent releases. HTML cached by browsers and search engines still references
    # them; deleting them on every release produced 404s (Googlebot fetched /assets/route-news-detail-XKXONHly.js after
    # its release was replaced). Hashed names never collide with different content; the new build's files win (cp -n).
    for old_assets in sorted(glob.glob('/data/wwwroot/*/dist/client/assets')):
        if old_assets.startswith(ROOT) or time.time() - os.path.getmtime(old_assets) > 21 * 86400:
            continue
        subprocess.run(['sh', '-c', 'cp -np "$0"/*-*.js "$0"/*-*.css "$1"/ 2>/dev/null; true', old_assets, ROOT + '/dist/client/assets'])
    version = json.loads(pathlib.Path(ROOT + '/dist/client/version.json').read_text())
    if version['buildId'] != BUILD_ID:
        sys.exit('ABORT package buildId %s != expected %s' % (version['buildId'], BUILD_ID))
    args = ['docker', 'run', '-d', '--name', NEW, '--restart', 'unless-stopped',
            '-p', '127.0.0.1:%s:8080' % new_port, '-v', ROOT + ':/app:ro']
    if content:
        args += ['-v', content[0] + ':/app/dist/client/content:ro']
    args += ['-w', '/app']
    # 2026-10-10: the CTA proxy target used to be copied from the previous container. That carried a collector that had
    # exited (R42) and the default bridge network, so every click event failed with 503 from 2026-10-06. The target is now
    # the newest *running* collector, and the container always joins the network the collectors live on.
    COLLECTOR_NET = 'nexualpha-internal'
    running = [n for n in out('docker', 'ps', '--filter', 'name=nexualpha-cta-collector-', '--format', '{{.CreatedAt}}\t{{.Names}}').splitlines() if n.strip() and 'rollback' not in n]
    collector = sorted(running)[-1].split('\t')[1] if running else None
    for item in info['Config']['Env']:
        key = item.split('=', 1)[0]
        if key in ['PORT', 'BUILD_ID', 'NODE_ENV']:
            args += ['-e', ('BUILD_ID=' + BUILD_ID) if key == 'BUILD_ID' else item]
    if collector:
        args += ['-e', 'CTA_ANALYTICS_ORIGIN=http://%s:8080' % collector]
    # Error monitor (/health/errors-ready): append-only events outside the app tree, same directory older releases used.
    args += ['-v', '/data/private/nexualpha/errors:/errors', '-e', 'ERROR_EVENT_FILE=/errors/nexualpha-web.jsonl']
    # Tracked partner redirect /go/<partner>?src= (2026-10-10): anonymous click log outside the app tree.
    args += ['-v', '/data/private/nexualpha/clicks:/clicks', '-e', 'CLICK_EVENT_FILE=/clicks/go-clicks.jsonl']
    # Social cards /og/<kind>/<id>.png (2026-10-10): rendered PNGs are cached outside the read-only app tree, keyed by build id.
    args += ['-v', '/data/private/nexualpha/og-cache:/og-cache', '-e', 'OG_CACHE_DIR=/og-cache']
    # Host fonts for the cards (node:20-bookworm-slim has none): DejaVu covers Latin/Cyrillic/Arabic, WenQuanYi covers CJK.
    args += ['-v', '/data/private/nexualpha/og-fonts:/og-fonts:ro', '-e', 'OG_FONT_DIR=/og-fonts']
    # Append-only official-announcement archive (2026-10-12): update pages whose item left the live feed stay 200, not 404.
    args += ['-v', '/data/private/nexualpha/intel:/intel-state', '-e', 'INTEL_ARCHIVE_FILE=/intel-state/official-announcements-archive.json']
    # Runtime coin snapshot (2026-10-12): ops/coins-refresh rewrites it on the host daily/weekly; /coins pages read it without a redeploy.
    args += ['-e', 'COINS_FILE=/intel-state/coins.json']
    args += ['-e', 'TS_LIVE_FILE=/intel-state/tokenized-stocks.json']
    # Spot ETF flows + crypto calendar (2026-10-13): ops/intel-tools rewrites them on the host daily; the pages read them without a redeploy.
    args += ['-e', 'ETF_FLOWS_FILE=/intel-state/etf-flows.json', '-e', 'CALENDAR_FILE=/intel-state/calendar.json']
    # Live market feeds (written by collectors; nginx serves market-events as /intel/market-events.json) for data pages and whale watch.
    args += ['-v', '/data/agent/state/market:/market:ro', '-e', 'MARKET_EVENTS_FILE=/market/market-events.json', '-e', 'WHALES_FILE=/market/whales.json']
    args += [info['Config']['Image'], 'node', 'server.mjs']
    sh(*args, stdout=subprocess.DEVNULL)
    nets = {n for n in (info.get('NetworkSettings', {}).get('Networks') or {}) if n not in ('bridge', 'host', 'none')}
    if collector:
        nets.add(COLLECTOR_NET)
    for net in sorted(nets):
        subprocess.run(['docker', 'network', 'connect', net, NEW], check=False)


    def preflight():
        for r in ROUTES:
            status, _ = get(new_port, r, 30, 1)
            if status != 200:
                raise RuntimeError('%s -> %s' % (r, status))
        # the click collector must be reachable from the new container (a configured-but-dead proxy reads "ready")
        if collector:
            probe = subprocess.run(['docker', 'exec', NEW, 'node', '-e',
                'fetch("http://%s:8080/health/cta-ready").then(r=>r.json()).then(j=>process.exit(j.ready?0:3)).catch(()=>process.exit(4))' % collector])
            if probe.returncode != 0:
                raise RuntimeError('cta collector %s unreachable from standby (%s)' % (collector, probe.returncode))
            # 2026-10-14: "reachable" is not "accepting". The collector ran R58 code (2026-10-01) whose experiment registry
            # predates the home hero test (home_hero_copy_v1, 2026-10-11), so every event from a bucketed home visitor,
            # sign-up clicks included, got 400 for three days. One smoke-mode event (written to the collector's smoke
            # file, never to production) carrying this release's live experiment context must be accepted.
            probe = subprocess.run(['docker', 'exec', '-w', '/app', NEW, 'node', '--input-type=module', '-e', '''
const { homeHeroEventContext } = await import("/app/src/data/home-hero-experiment.js");
const { resolveExperimentContext } = await import("/app/src/data/experiment-registry.js");
const hero = homeHeroEventContext({ pathname: "/", cookie: "nx_hero=b" });
const context = hero.experiment ? resolveExperimentContext({ ...hero, pathname: "/", market: "unknown" }).context : {};
const event = { version: 2, type: "page_view", eventId: crypto.randomUUID(), session: crypto.randomUUID(), page: "/", locale: "en",
  source: "deploy-probe", market: "unknown", product: "unknown", device: "unknown", ...context };
const r = await fetch("http://%s:8080/api/analytics/cta", { method: "POST", body: JSON.stringify(event),
  headers: { "content-type": "application/json", origin: "https://nexualpha.com", "x-nexualpha-analytics-mode": "smoke" } });
if (r.status !== 204) { console.error("collector answered", r.status, "for", JSON.stringify(context)); process.exit(5); }
''' % collector])
            if probe.returncode != 0:
                raise RuntimeError('cta collector %s rejects this release\'s events (%s): upgrade the collector first' % (collector, probe.returncode))
        errors = json.loads(get(new_port, '/health/errors-ready', 30, 1)[1] or '{}')
        if not errors.get('ready'):
            raise RuntimeError('error monitor not ready: %s' % errors.get('reasonCode'))
        got = json.loads(get(new_port, '/version.json', 30, 1)[1])['buildId']
        if got != BUILD_ID:
            raise RuntimeError('buildId %s != %s' % (got, BUILD_ID))


    def abort(msg):
        subprocess.run(['sh', '-c', 'uptime; free -m; docker stats --no-stream --format "{{.Name}} {{.CPUPerc}} {{.MemUsage}}" | sort -k3 -h | tail -8'])
        subprocess.run(['docker', 'logs', '--tail', '40', NEW])
        subprocess.run(['docker', 'rm', '-f', NEW])
        subprocess.run(['rm', '-rf', '--', ROOT])
        sys.exit('ABORT %s; standby removed, live site untouched' % msg)


    err = None
    for _ in range(30):
        try:
            preflight()
            err = None
            break
        except Exception as e:
            err = e
            time.sleep(3)
    if err:
        abort('standby preflight failed: %s' % err)
    print('preflight: %d routes 200, buildId %s' % (len(ROUTES), BUILD_ID))

    cta_diff = []
    for page in CTA_PAGES:
        try:
            a = cta_links(get(old_port, page)[1], old_port)
            b = cta_links(get(new_port, page)[1], new_port)
        except Exception as e:
            abort('could not compare registration links on %s: %s' % (page, e))
        if a != b:
            cta_diff.append('%s: removed %s added %s' % (page, sorted(set(a) - set(b)), sorted(set(b) - set(a))))
        print('cta %s: live %d / standby %d links%s' % (page, len(a), len(b), '' if a == b else '  DIFFERENT'))
    if cta_diff and not ALLOW_CTA_CHANGE:
        abort('registration links differ from live:\n  ' + '\n  '.join(cta_diff))

    pathlib.Path(STATE).write_text(json.dumps({
        'old_port': old_port, 'old_container': old, 'old_build': live_build, 'new_port': new_port,
        'new_container': NEW, 'routes': ROUTES, 'buildId': BUILD_ID, 'content_mount': content[0] if content else None}))
    print('STANDBY_READY %s on 127.0.0.1:%s buildId %s (live %s on %s untouched)' % (NEW, new_port, BUILD_ID, old, old_port))


if __name__ == '__main__':
    main()
