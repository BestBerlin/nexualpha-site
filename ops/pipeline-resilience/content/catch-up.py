#!/usr/bin/env python3
"""One locked Claude content run, kept awake on macOS. Install nothing automatically."""
import argparse
import fcntl
from pathlib import Path
import subprocess
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--engine', type=Path, required=True)
parser.add_argument('--dry-run', action='store_true')
args = parser.parse_args()
engine = args.engine.resolve(strict=True)
runbook = engine / 'CLAUDE-CONTENT-RUNBOOK.md'
if not runbook.is_file():
    parser.error('engine has no CLAUDE-CONTENT-RUNBOOK.md')
# Use this same wrapper for scheduled and manual runs to share the lock.
if args.dry_run:
    print('Validated runbook; would run caffeinate -dims claude -p under a shared content lock')
    sys.exit(0)
with open(engine / 'state' / 'content-run.lock', 'a') as lock:
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print('Content run already active; catch-up skipped')
        sys.exit(0)
    prompt = ('Read and follow CLAUDE-CONTENT-RUNBOOK.md exactly. Run one scheduled content cycle now. '
              'Read the current ledgers first; preserve quotas and do not duplicate published intent. '
              'Use the managed publisher and verify the public result.\n\n' + runbook.read_text())
    sys.exit(subprocess.run(['/usr/bin/caffeinate', '-dims', str(Path.home() / '.local/bin/claude'), '-p', prompt], cwd=engine).returncode)
