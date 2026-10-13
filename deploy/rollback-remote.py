# Run on the server via stdin. Python 3.6 compatible.
# Restart and validate the retained previous container BEFORE restoring nginx.
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


def main():
    release = os.environ['RELEASE']
    backup = pathlib.Path('%s.backup-%s' % (CONF, release))
    if not backup.exists():
        sys.exit('ABORT no backup for %s; nothing changed' % release)
    state = json.loads(pathlib.Path('/data/wwwroot/nexualpha-release-%s.state.json' % release).read_text())
    subprocess.run(['docker', 'start', state['old_container']], check=True)
    ready(state['old_port'], state['old_build'], state.get('routes', ROUTES))
    switch(CONF.read_text(), backup.read_text())
    print('ROLLBACK_DONE previous container ready and nginx restored for %s' % release)


if __name__ == '__main__':
    main()
