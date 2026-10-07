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
import json, os, pathlib, re, socket, subprocess, sys, time, urllib.request

RELEASE = os.environ['RELEASE']
BUILD_ID = os.environ['BUILD_ID']
BASELINE = os.environ['BASELINE_BUILD_ID']
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


def get(port, path, timeout=30):
    with urllib.request.urlopen('http://127.0.0.1:%s%s' % (port, path), timeout=timeout) as resp:
        return resp.status, resp.read().decode('utf-8', 'replace')


def cta_links(html):
    hrefs = re.findall(r'href="([^"]+)"', html)
    return sorted(set(h for h in hrefs if h.startswith('http') and any(m in h.lower() for m in CTA_MARKERS)))


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
version = json.loads(pathlib.Path(ROOT + '/dist/client/version.json').read_text())
if version['buildId'] != BUILD_ID:
    sys.exit('ABORT package buildId %s != expected %s' % (version['buildId'], BUILD_ID))
args = ['docker', 'run', '-d', '--name', NEW, '--restart', 'unless-stopped',
        '-p', '127.0.0.1:%s:8080' % new_port, '-v', ROOT + ':/app:ro']
if content:
    args += ['-v', content[0] + ':/app/dist/client/content:ro']
args += ['-w', '/app']
for item in info['Config']['Env']:
    key = item.split('=', 1)[0]
    if key in ['PORT', 'BUILD_ID', 'CTA_ANALYTICS_ORIGIN', 'NODE_ENV']:
        args += ['-e', ('BUILD_ID=' + BUILD_ID) if key == 'BUILD_ID' else item]
args += [info['Config']['Image'], 'node', 'server.mjs']
sh(*args, stdout=subprocess.DEVNULL)
for net in (info.get('NetworkSettings', {}).get('Networks') or {}):
    if net not in ('bridge', 'host', 'none'):
        subprocess.run(['docker', 'network', 'connect', net, NEW], check=False)


def preflight():
    for r in ROUTES:
        status, _ = get(new_port, r)
        if status != 200:
            raise RuntimeError('%s -> %s' % (r, status))
    got = json.loads(get(new_port, '/version.json')[1])['buildId']
    if got != BUILD_ID:
        raise RuntimeError('buildId %s != %s' % (got, BUILD_ID))


def abort(msg):
    subprocess.run(['docker', 'logs', '--tail', '40', NEW])
    subprocess.run(['docker', 'rm', '-f', NEW])
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
    a = cta_links(get(old_port, page)[1])
    b = cta_links(get(new_port, page)[1])
    if a != b:
        cta_diff.append('%s: removed %s added %s' % (page, sorted(set(a) - set(b)), sorted(set(b) - set(a))))
    print('cta %s: live %d / standby %d links%s' % (page, len(a), len(b), '' if a == b else '  DIFFERENT'))
if cta_diff and not ALLOW_CTA_CHANGE:
    abort('registration links differ from live:\n  ' + '\n  '.join(cta_diff))

pathlib.Path(STATE).write_text(json.dumps({
    'old_port': old_port, 'old_container': old, 'old_build': live_build, 'new_port': new_port,
    'new_container': NEW, 'buildId': BUILD_ID, 'content_mount': content[0] if content else None}))
print('STANDBY_READY %s on 127.0.0.1:%s buildId %s (live %s on %s untouched)' % (NEW, new_port, BUILD_ID, old, old_port))
