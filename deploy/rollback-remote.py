# Runs ON the production server:  env RELEASE=... python3 - < rollback-remote.py
# Puts Nginx back on the container that was live before RELEASE (it is kept running).
# Python 3.6 compatible.
import os, pathlib, subprocess, sys

RELEASE = os.environ['RELEASE']
CONF = pathlib.Path('/www/server/panel/vhost/nginx/nexualpha.com.conf')
BACKUP = pathlib.Path('%s.backup-%s' % (CONF, RELEASE))
NGINX = '/www/server/nginx/sbin/nginx'
if not BACKUP.exists():
    sys.exit('ABORT no backup for %s; nothing changed' % RELEASE)
current = CONF.read_text()
CONF.write_text(BACKUP.read_text())
try:
    subprocess.run([NGINX, '-t'], check=True)
    subprocess.run([NGINX, '-s', 'reload'], check=True)
except Exception as e:
    CONF.write_text(current)
    subprocess.run([NGINX, '-s', 'reload'])
    sys.exit('ABORT nginx rejected the restored config, left as it was: %s' % e)
print('ROLLBACK_DONE nginx restored to the container that was live before %s' % RELEASE)
