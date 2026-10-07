# Runs ON the production server:  env RELEASE=... python3 - < cutover-remote.py
# Switches Nginx from the live port to the standby port; restores the original config on any error.
# Python 3.6 compatible.
import json, os, pathlib, subprocess, sys

RELEASE = os.environ['RELEASE']
STATE = '/data/wwwroot/nexualpha-release-%s.state.json' % RELEASE
CONF = pathlib.Path('/www/server/panel/vhost/nginx/nexualpha.com.conf')
BACKUP = pathlib.Path('%s.backup-%s' % (CONF, RELEASE))
NGINX = '/www/server/nginx/sbin/nginx'

s = json.loads(pathlib.Path(STATE).read_text())
old = CONF.read_text()
needle = '127.0.0.1:%s' % s['old_port']
if old.count(needle) != 1:
    sys.exit('ABORT live upstream not found exactly once (nginx changed since staging); nothing changed')
if not BACKUP.exists():
    BACKUP.write_text(old)
CONF.write_text(old.replace(needle, '127.0.0.1:%s' % s['new_port']))
try:
    subprocess.run([NGINX, '-t'], check=True)
    subprocess.run([NGINX, '-s', 'reload'], check=True)
except Exception as e:
    CONF.write_text(old)
    subprocess.run([NGINX, '-s', 'reload'])
    sys.exit('ABORT nginx rejected the change, original config restored: %s' % e)
print('CUTOVER_DONE %s -> %s (backup %s); old container %s kept running for rollback'
      % (s['old_port'], s['new_port'], BACKUP, s['old_container']))
