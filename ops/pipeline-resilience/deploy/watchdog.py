#!/usr/bin/env python3
"""Bounded host cron watchdog, restricted to explicitly labelled containers."""
import datetime as dt
import json
from pathlib import Path
import subprocess
import sys
import time

# Only these two projects may opt in; no wildcard/unlabelled restarts.
PROJECTS = {'nexualpha-tg', 'nexualpha-newsroom'}
LABEL = 'com.nexualpha.watchdog=true'


def restart_reason(state, now):
    if state.get('Status') != 'running' or state.get('Health', {}).get('Status') != 'unhealthy':
        return None
    started = dt.datetime.fromisoformat(state['StartedAt'].replace('Z', '+00:00')).timestamp()
    if now - started < 600:
        return None
    return 'healthcheck unhealthy after startup grace; heartbeat deadline 600s'


def run(command):
    return subprocess.run(command, check=True, capture_output=True, text=True, timeout=25).stdout


def sweep(now=None, command=run, dry_run=False):
    now = time.time() if now is None else now
    restarted = []
    # Listing is filtered first. Inspect a redacted projection, never Config.Env.
    for project in sorted(PROJECTS):
        ids = command(['docker', 'ps', '-q', '--filter', 'label=' + LABEL,
                       '--filter', 'label=com.docker.compose.project=' + project]).split()
        for container in ids:
            try:
                state = json.loads(command(['docker', 'inspect', '--format', '{{json .State}}', container]))
                reason = restart_reason(state, now)
                if reason:
                    if not dry_run:
                        command(['docker', 'restart', '--time', '20', container])
                    print(json.dumps({'event': 'watchdog-would-restart' if dry_run else 'watchdog-restarted',
                                      'container': container, 'project': project, 'reason': reason}), flush=True)
                    restarted.append(container)
            except Exception as error:
                # No command output (which might include secrets) in logs.
                print(json.dumps({'event': 'watchdog-error', 'container': container, 'errorType': type(error).__name__}), flush=True)
    return restarted


if __name__ == '__main__':
    import fcntl
    # Host cron overlap is serialized; this is not run inside an application container.
    lock_path = Path('/data/agent/state/pipeline-watchdog.lock')
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            sys.exit(0)
        try:
            sweep(dry_run='--dry-run' in sys.argv)
        except Exception as error:
            print(json.dumps({'event': 'watchdog-failed', 'errorType': type(error).__name__}), flush=True)
            sys.exit(1)
