# Run on the server via stdin after stage-remote.py. Python 3.6 compatible.
# No container is stopped until the validated reload and old nginx workers drain.
import json, os, pathlib, subprocess, sys, tempfile, time, urllib.request

CONF = pathlib.Path('/www/server/panel/vhost/nginx/nexualpha.com.conf')
NGINX = '/www/server/nginx/sbin/nginx'
ROUTES = ['/', '/exchanges', '/exchanges/binance', '/exchanges/bitget', '/exchanges/okx',
          '/compare/binance-vs-okx', '/activities', '/news', '/rates', '/telegram', '/br', '/methodology', '/zh-hans']


def health(port, build, routes):
    for route in list(routes) + ['/version.json']:
        with urllib.request.urlopen('http://127.0.0.1:%s%s' % (port, route), timeout=30) as response:
            if response.status != 200:
                raise RuntimeError('%s returned %s' % (route, response.status))
            if route == '/version.json' and json.loads(response.read().decode('utf-8'))['buildId'] != build:
                raise RuntimeError('unexpected buildId on port %s' % port)


def ready(port, build, routes):
    for attempt in range(30):
        try:
            health(port, build, routes)
            return
        except Exception:
            if attempt == 29:
                raise
            time.sleep(1)


def atomic_config(text):
    # Same-filesystem rename; retain nginx's existing file mode and ownership.
    stat = CONF.stat()
    fd, name = tempfile.mkstemp(prefix=CONF.name + '.', dir=str(CONF.parent))
    try:
        with os.fdopen(fd, 'w') as target:
            target.write(text)
            target.flush()
            os.fsync(target.fileno())
        os.chmod(name, stat.st_mode)
        os.chown(name, stat.st_uid, stat.st_gid)
        os.replace(name, str(CONF))
    finally:
        if os.path.exists(name):
            os.unlink(name)


def switch(original, replacement):
    atomic_config(replacement)
    try:
        subprocess.run([NGINX, '-t'], check=True)
        subprocess.run([NGINX, '-s', 'reload'], check=True)
    except Exception:
        atomic_config(original)
        subprocess.run([NGINX, '-t'], check=True)
        subprocess.run([NGINX, '-s', 'reload'], check=True)
        raise


def workers():
    output = subprocess.check_output(['ps', '-C', 'nginx', '-o', 'pid=,args='], universal_newlines=True)
    return set(int(line.split()[0]) for line in output.splitlines() if 'nginx: worker process' in line)


def main():
    release = os.environ['RELEASE']
    state = json.loads(pathlib.Path('/data/wwwroot/nexualpha-release-%s.state.json' % release).read_text())
    old = CONF.read_text()
    needle = '127.0.0.1:%s' % state['old_port']
    if old.count(needle) != 1:
        sys.exit('ABORT live upstream not found exactly once; nothing changed')
    # Staging already started this container; start is idempotent if it remained running.
    subprocess.run(['docker', 'start', state['new_container']], check=True)
    ready(state['new_port'], state['buildId'], state.get('routes', ROUTES))
    backup = pathlib.Path('%s.backup-%s' % (CONF, release))
    if not backup.exists():
        backup.write_text(old)
    previous_workers = workers()
    if not previous_workers:
        sys.exit('ABORT no nginx workers found; refusing to retire the live container')
    switch(old, old.replace(needle, '127.0.0.1:%s' % state['new_port']))
    # reload returns before graceful workers have finished their outstanding requests.
    deadline = time.monotonic() + 60
    while previous_workers & workers():
        if time.monotonic() >= deadline:
            print('CUTOVER_DONE; old workers still draining, old container kept running for rollback')
            return
        time.sleep(0.2)
    # Recheck before retiring old; failure restores the live upstream while old still runs.
    try:
        health(state['new_port'], state['buildId'], state.get('routes', ROUTES))
    except Exception:
        switch(CONF.read_text(), old)
        raise
    subprocess.run(['docker', 'stop', '--time', '30', state['old_container']], check=True)
    print('CUTOVER_DONE %s -> %s; old container stopped (rollback restarts it)' % (state['old_port'], state['new_port']))


if __name__ == '__main__':
    main()
