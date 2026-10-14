#!/usr/bin/env python3
"""Syntax/evidence checks for the local audit diff; never starts a service."""
import argparse
import json
import pathlib
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument("--base", required=True)
args = parser.parse_args()
paths = subprocess.check_output(["git", "diff", "--name-only", args.base], text=True).splitlines()
paths += subprocess.check_output(["git", "ls-files", "--others", "--exclude-standard"], text=True).splitlines()
checked = []
for file in sorted(set(paths)):
    if file.endswith(".mjs"):
        subprocess.run(["node", "--check", file], check=True, capture_output=True, text=True)
        checked.append(file)
    elif file.endswith(".py"):
        compile(pathlib.Path(file).read_text(), file, "exec")
        checked.append(file)
for file in ["ops/telegram-scheduler/scheduler.sh", "ops/newsroom/deploy/scheduler.sh",
             "ops/newsroom/deploy/backup.sh", "ops/daily-social-cards/daily.sh", "ops/shorts/make-daily.sh"]:
    subprocess.run(["bash", "-n", file], check=True, capture_output=True, text=True)
    checked.append(file)
evidence = [file for file in pathlib.Path("docs/audits/deep-audit-telegram").glob("*.json")
            if file.name != "static-checks.json"]
for file in evidence:
    json.loads(file.read_text())
print(json.dumps({"checked": checked, "parsed_json_files": len(evidence)}, indent=2))
