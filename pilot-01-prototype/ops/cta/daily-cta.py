#!/usr/bin/env python3
"""Private CTA maintenance. Default: metadata-only dry run. Python 3.6+."""
import argparse
import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import signal
import stat
import subprocess
import sys
import tempfile

DEFAULT_BASE = '/data/private/nexualpha/analytics'
DEFAULT_OPS = '/data/private/nexualpha/ops'
ARCHIVE = re.compile(r'(production|smoke)\.jsonl-(\d{8})$')
PRODUCTION = re.compile(r'production\.jsonl(?:-\d{8})?$')
DAY = re.compile(r'\d{4}-\d{2}-\d{2}$')


class OpsError(Exception):
    pass


def require(condition, code):
    if not condition:
        raise OpsError(code)


def contained(path, parent):
    return os.path.commonpath([str(path.resolve()), str(parent.resolve())]) == str(parent.resolve())


class Config:
    def __init__(self):
        self.base = Path(os.environ.get('CTA_OPS_BASE', DEFAULT_BASE)).absolute()
        self.ops = Path(os.environ.get('CTA_OPS_DIR', DEFAULT_OPS)).absolute()
        self.container = os.environ.get('CTA_OPS_CONTAINER', 'nexualpha-web')
        self.container_data = os.environ.get('CTA_OPS_CONTAINER_DATA_DIR', '/analytics')
        self.synthetic = os.environ.get('CTA_OPS_SYNTHETIC') == '1'
        self.uid = os.getuid() if self.synthetic else 0
        self.docker = os.environ.get('CTA_OPS_DOCKER_BIN', 'docker')
        self.logrotate = os.environ.get('CTA_OPS_LOGROTATE_BIN', '/usr/sbin/logrotate')
        self.node = os.environ.get('CTA_OPS_NODE_BIN', 'node')
        self.report_script = os.environ.get('CTA_OPS_REPORT_SCRIPT', '/app/server/growth-report.mjs')
        require(re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_.-]*', self.container), 'CONTAINER_NAME_INVALID')
        require(self.container_data.startswith('/') and not re.search(r'[\s"\\]', self.container_data), 'CONTAINER_PATH_INVALID')
        require(not any(c in str(self.base) + str(self.ops) for c in ['\n', '\r', '"', '\\']), 'PRIVATE_PATH_INVALID')
        require(not contained(self.ops, self.base) and not contained(self.base, self.ops), 'DATA_OPS_PATH_OVERLAP')
        if self.synthetic:
            temp = Path(tempfile.gettempdir())
            require(contained(self.base, temp) and contained(self.ops, temp), 'SYNTHETIC_PATH_MUST_BE_TEMPORARY')
            require(str(self.base) != DEFAULT_BASE and str(self.ops) != DEFAULT_OPS, 'SYNTHETIC_PRODUCTION_PATH_DENIED')
        override = os.environ.get('CTA_OPS_NOW_UTC')
        require(not override or self.synthetic, 'CLOCK_OVERRIDE_REQUIRES_SYNTHETIC')
        try:
            self.now = dt.datetime.strptime(override, '%Y-%m-%dT%H:%M:%SZ') if override else dt.datetime.utcnow()
        except ValueError:
            raise OpsError('CLOCK_OVERRIDE_INVALID')
        self.today = self.now.date()
        self.day = self.today - dt.timedelta(days=1)
        self.cutoff = self.today - dt.timedelta(days=30)


def metadata(path, uid, mode, directory=False):
    try:
        value = path.lstat()
    except FileNotFoundError:
        raise OpsError('PRIVATE_PATH_MISSING')
    require(not stat.S_ISLNK(value.st_mode), 'PRIVATE_PATH_SYMLINK')
    require(stat.S_ISDIR(value.st_mode) if directory else stat.S_ISREG(value.st_mode), 'PRIVATE_PATH_TYPE')
    require(value.st_uid == uid and stat.S_IMODE(value.st_mode) == mode, 'PRIVATE_PATH_PERMISSIONS')
    return value


def external(args):
    return subprocess.check_output(args, stderr=subprocess.DEVNULL, timeout=60).decode('utf-8')


def verify_writer(config):
    if config.synthetic:
        return
    ids = external([config.docker, 'ps', '-q']).split()
    # Request mount/name metadata only; never retrieve container environment.
    fields = '{"Name":{{json .Name}},"Mounts":{{json .Mounts}}}'
    rows = [json.loads(line) for line in external([config.docker, 'inspect', '--format', fields] + ids).splitlines()] if ids else []
    writers = [row for row in rows if any(m.get('Source') == str(config.base) and m.get('RW') for m in row.get('Mounts', []))]
    require(len(writers) == 1 and writers[0]['Name'] == '/' + config.container, 'SINGLE_WRITER_CONTRACT')
    processes = external([config.docker, 'top', config.container, '-eo', 'pid,comm']).splitlines()[1:]
    commands = [row.split(None, 1)[1].strip() for row in processes if len(row.split(None, 1)) == 2]
    require(sum(command == 'node' for command in commands) == 1, 'COLLECTOR_PROCESS_COUNT')


def inventory(config):
    metadata(config.base, config.uid, 0o700, True)
    metadata(config.ops, config.uid, 0o700, True)
    if str(config.base) == DEFAULT_BASE:
        metadata(config.base.parent, config.uid, 0o700, True)
        metadata(config.base.parent.parent, config.uid, 0o700, True)
    production, expired, reports = [], [], []
    for item in config.base.iterdir():
        match = ARCHIVE.fullmatch(item.name)
        if item.name not in ['production.jsonl', 'smoke.jsonl'] and not match:
            continue
        metadata(item, config.uid, 0o600)
        try:
            archive_day = dt.datetime.strptime(match.group(2), '%Y%m%d').date() if match else None
        except ValueError:
            raise OpsError('ARCHIVE_DATE_INVALID')
        if archive_day and archive_day < config.cutoff:
            expired.append(item)
        elif PRODUCTION.fullmatch(item.name):
            production.append(item)
    report_root = config.base / 'reports'
    if report_root.exists() or report_root.is_symlink():
        metadata(report_root, config.uid, 0o700, True)
        for item in report_root.iterdir():
            if DAY.fullmatch(item.name):
                metadata(item, config.uid, 0o700, True)
                try:
                    report_day = dt.datetime.strptime(item.name, '%Y-%m-%d').date()
                except ValueError:
                    raise OpsError('REPORT_DATE_INVALID')
                if report_day < config.cutoff:
                    reports.append(item)
    return sorted(production), expired, reports


def disk_status(base):
    disk = shutil.disk_usage(str(base))
    percent = disk.used / disk.total
    level = 'CRITICAL' if percent >= 0.85 or disk.free < 2 * 1024**3 else 'WARNING' if percent >= 0.75 or disk.free < 5 * 1024**3 else 'OK'
    return dict(diskLevel=level, diskUsedPercent=round(percent * 100, 2), freeBytes=disk.free)


def rotate_config(config):
    template = Path(__file__).with_name('logrotate.conf.template').read_text(encoding='utf-8')
    require(not re.search(r'^\s*copytruncate\b', template, re.M), 'COPYTRUNCATE_FORBIDDEN')
    return template.replace('@@BASE@@', str(config.base))


def make_snapshot(config, files):
    fd, filename = tempfile.mkstemp(prefix='.report-input-', suffix='.jsonl', dir=str(config.base))
    snapshot = Path(filename)
    count, invalid = 0, 0
    start = dt.datetime.combine(config.day, dt.time())
    end = dt.datetime.combine(config.today, dt.time())
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as output:
            for item in files:
                metadata(item, config.uid, 0o600)
                # Bound the scan to the opening file size. New appends belong to
                # today and must not make the previous-day report unbounded.
                with item.open('rb') as source:
                    remaining = os.fstat(source.fileno()).st_size
                    while remaining > 0:
                        raw = source.readline(remaining)
                        if not raw:
                            break
                        remaining -= len(raw)
                        try:
                            row = json.loads(raw.decode('utf-8'))
                            stamp = dt.datetime.strptime(row.get('receivedAt', ''), '%Y-%m-%dT%H:%M:%S.%fZ')
                        except (ValueError, TypeError, AttributeError, UnicodeDecodeError):
                            invalid += 1
                            continue
                        if row.get('environment') == 'production' and start <= stamp < end:
                            output.write(json.dumps(row, ensure_ascii=False) + '\n')
                            count += 1
                            if output.tell() > 128 * 1024**2:
                                raise OpsError('DAILY_REPORT_REQUIRES_STREAMING')
        return snapshot, count, invalid
    except BaseException:
        snapshot.unlink()
        raise


def report(config, snapshot):
    report_root = config.base / 'reports'
    report_root.mkdir(mode=0o700, exist_ok=True)
    target = report_root / config.day.isoformat()
    target.mkdir(mode=0o700, exist_ok=True)
    metadata(target, config.uid, 0o700, True)
    environment = {
        'CTA_DATA_FILE': str(snapshot) if config.synthetic else config.container_data + '/' + snapshot.name,
        'GROWTH_REPORT_DIR': str(target) if config.synthetic else config.container_data + '/reports/' + config.day.isoformat(),
        'GROWTH_REPORT_ENVIRONMENT': 'production',
        'GROWTH_REPORT_FROM_UTC': config.day.isoformat() + 'T00:00:00.000Z',
        'GROWTH_REPORT_TO_UTC': config.today.isoformat() + 'T00:00:00.000Z',
    }
    if config.synthetic:
        command = [config.node, config.report_script]
        process_env = dict(os.environ, **environment)
    else:
        command = [config.docker, 'exec']
        for key, value in environment.items():
            command.extend(['-e', key + '=' + value])
        command.extend([config.container, 'node', '/app/server/growth-report.mjs'])
        process_env = None
    with (target / 'run-receipt.json').open('w', encoding='utf-8') as receipt:
        subprocess.check_call(command, env=process_env, stdout=receipt, stderr=subprocess.DEVNULL, timeout=180)


def persist_status(config, result):
    path = config.ops / 'status.new.json'
    path.write_text(json.dumps(result) + '\n', encoding='utf-8')
    os.replace(str(path), str(config.ops / 'status.json'))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--apply', action='store_true', help='Write private reports, expire old archives and rotate logs.')
    mode.add_argument('--dry-run', action='store_true', help='Metadata-only inspection (the default).')
    args = parser.parse_args(argv)
    os.umask(0o077)
    def terminate(_signal, _frame):
        raise OpsError('MAINTENANCE_TERMINATED')
    signal.signal(signal.SIGTERM, terminate)
    config = None
    lock = None
    snapshot = None
    try:
        config = Config()
        files, expired, old_reports = inventory(config)
        verify_writer(config)
        template = rotate_config(config)
        result = dict(status='DRY_RUN', reportDay=config.day.isoformat(), retentionCutoff=config.cutoff.isoformat(),
                      productionFiles=len(files), expiredArchives=len(expired), expiredReports=len(old_reports),
                      inputStatus='AVAILABLE' if files else 'INPUT_MISSING', **disk_status(config.base))
        if not args.apply:
            print(json.dumps(result))
            return 0
        lock = (config.ops / 'maintenance.lock').open('a')
        try:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print(json.dumps(dict(status='LOCKED', reason='MAINTENANCE_ALREADY_RUNNING')))
            return 75
        # Re-read metadata after acquiring the single maintenance lock.
        files, expired, old_reports = inventory(config)
        # Recover private snapshots from a hard-killed earlier job. The lock is
        # held and this job has not created its current snapshot yet.
        for item in config.base.iterdir():
            if re.fullmatch(r'\.report-input-[a-zA-Z0-9_-]+\.jsonl', item.name):
                metadata(item, config.uid, 0o600)
                item.unlink()
        for item in expired:
            item.unlink()
        for item in old_reports:
            shutil.rmtree(str(item))
        # Report the primary data-state failure before infrastructure guards.
        # This keeps an absent production stream distinct from a present stream
        # that cannot be processed because the disk is critical.
        require(files, 'PRODUCTION_INPUT_MISSING')
        result.update(disk_status(config.base))
        require(result['diskLevel'] != 'CRITICAL', 'DISK_THRESHOLD_REPORT_BLOCKED')
        snapshot, selected, invalid = make_snapshot(config, files)
        report(config, snapshot)
        generated = config.ops / 'logrotate.generated.conf'
        generated.write_text(template, encoding='utf-8')
        subprocess.check_call([config.logrotate, '-s', str(config.ops / 'logrotate.state'), str(generated)],
                              env=dict(os.environ, TZ='UTC'), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
        result.update(status='COMPLETED', selectedRows=selected, invalidSourceLines=invalid)
        persist_status(config, result)
        print(json.dumps(result))
        return 0
    except Exception as error:
        reason = str(error) if isinstance(error, OpsError) else type(error).__name__
        result = dict(status='ERROR', reason=reason)
        if args.apply and config and lock:
            try:
                persist_status(config, result)
            except Exception:
                pass
        print(json.dumps(result))
        return 1
    finally:
        if snapshot and snapshot.exists():
            snapshot.unlink()
        if lock:
            lock.close()


if __name__ == '__main__':
    sys.exit(main())
