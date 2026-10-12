#!/usr/bin/env python3
"""Check documented patches against a read-only content-engine checkout."""
import ast
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

if len(sys.argv) != 2:
    sys.exit('Usage: verify-hooks.py <AEO-Crypto-Factory-root>')
root = Path(sys.argv[1]).resolve()
gates = Path(__file__).resolve().parent
patches = re.findall(r'```diff\n(.*?)\n```', (gates / 'PUBLISHER-HOOK.md').read_text(), re.S)
if len(patches) != 2:
    sys.exit('Expected exactly two documented patches')
files = ['deployment/nexualpha-content-engine/tools/build-package.py', 'scripts/nexualpha-content-publish.mjs']
with tempfile.TemporaryDirectory(prefix='.hook-check-', dir=gates) as scratch:
    scratch = Path(scratch)
    for name, patch in zip(files, patches):
        target = scratch / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / name, target)
        subprocess.run(['patch', '-p1', '--dry-run'], input=patch + '\n', text=True, cwd=scratch, check=True)
        subprocess.run(['patch', '-p1'], input=patch + '\n', text=True, cwd=scratch, check=True)
        if name.endswith('.py'):
            ast.parse(target.read_text())
        else:
            subprocess.run(['node', '--check', str(target)], check=True)
print('Both documented patches apply cleanly; patched Python and JavaScript syntax pass. Originals untouched.')
