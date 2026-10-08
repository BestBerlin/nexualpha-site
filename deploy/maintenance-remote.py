# Runs ON the production server. Python 3.6 compatible.
# ACTION=disk-report   read-only inventory
# ACTION=remove-old-web  remove every nexualpha-web-* container except the live one and the
#                        rollback target, then delete their release directories under
#                        /data/wwwroot when no remaining container mounts them.
import json, os, re, subprocess, pathlib
ACTION = os.environ['ACTION']
CONF = pathlib.Path('/www/server/panel/vhost/nginx/nexualpha.com.conf')
def out(*a): return subprocess.check_output(list(a), universal_newlines=True)
def sh(cmd): subprocess.run(['sh', '-c', cmd])

live_port = re.findall(r'127\.0\.0\.1:(18\d\d\d)', CONF.read_text())[0]
rows = [l.split('\t') for l in out('docker', 'ps', '-a', '--format', '{{.Names}}\t{{.Ports}}').splitlines()]
live = [n for n, p in rows if '127.0.0.1:%s->' % live_port in p][0]
backups = sorted(CONF.parent.glob(CONF.name + '.backup-*'), key=lambda p: p.stat().st_mtime)
prev_port = re.findall(r'127\.0\.0\.1:(18\d\d\d)', backups[-1].read_text())[0] if backups else None
prev = [n for n, p in rows if prev_port and '127.0.0.1:%s->' % prev_port in p]
keep = {live} | set(prev)
print('live: %s (port %s)' % (live, live_port))
print('rollback target kept: %s' % (', '.join(prev) or 'none'))
sh('df -h /data / | sed 1d; free -m | sed -n 2,3p')

def mounts(name):
    info = json.loads(out('docker', 'inspect', name))[0]
    return [m['Source'] for m in info.get('Mounts', [])]

if ACTION == 'remove-old-web':
    targets = [n for n, _ in rows if n.startswith('nexualpha-web-') and n not in keep]
    roots = set()
    for n in targets:
        for src in mounts(n):
            if src.startswith('/data/wwwroot/nexualpha-') and '/content' not in src:
                roots.add(src)
        r = subprocess.run(['docker', 'rm', '-f', n], stdout=subprocess.DEVNULL)
        print('removed container %s%s' % (n, '' if r.returncode == 0 else ' FAILED'))
    still = set()
    for n in out('docker', 'ps', '-a', '--format', '{{.Names}}').split():
        still.update(mounts(n))
    for root in sorted(roots):
        if any(s == root or s.startswith(root + '/') for s in still):
            print('kept dir (still mounted): %s' % root)
            continue
        subprocess.run(['rm', '-rf', '--', root])
        print('deleted dir %s' % root)
    print('\nafter:')
    sh('df -h /data / | sed 1d; free -m | sed -n 2,3p; echo "containers running: $(docker ps -q | wc -l)"')
elif ACTION == 'disk-report':
    sh('ls -la /data/wwwroot | wc -l; echo; ls -laS /data/wwwroot/*.tgz /data/wwwroot/*.zip 2>/dev/null | head -20; '
       'echo; echo "release dirs: $(ls -d /data/wwwroot/nexualpha-release-* 2>/dev/null | wc -l)"; '
       'timeout 240 du -xsh /data/* 2>/dev/null | sort -h | tail -12; echo; docker system df')
