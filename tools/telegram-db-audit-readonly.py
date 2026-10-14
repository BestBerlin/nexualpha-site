#!/usr/bin/env python3
"""Execute the checked-in diagnostic SELECTs via the authorized SSH wrapper.

The connection username stays on the remote host. SQL transactions are forced
read-only; errors suppress connection details. No backup or database write.
"""
import argparse
import pathlib
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument("--ssh-wrapper", required=True)
parser.add_argument("--sql", default="docs/audits/deep-audit-telegram/read-only.sql")
parser.add_argument("--summarize-json", action="store_true")
args = parser.parse_args()
sql = pathlib.Path(args.sql).read_text()
remote = """
import subprocess,json
c=json.loads(subprocess.check_output(['docker','inspect','crypto-telegram-ops-postgres-1']))[0]
env=dict(entry.split('=',1) for entry in c['Config']['Env'] if '=' in entry)
query=QUERY
result=subprocess.run(['docker','exec','-e','PGOPTIONS=-c default_transaction_read_only=on -c statement_timeout=15000','crypto-telegram-ops-postgres-1','psql','-X','-v','ON_ERROR_STOP=1','-U',env.get('POSTGRES_USER','postgres'),'-d','newsroom',FORMAT,'-c',query],capture_output=True,text=True,timeout=30)
if result.returncode:
    print('Read-only database audit failed; connection details suppressed')
else:
    OUTPUT
raise SystemExit(result.returncode)
""".replace("QUERY", repr(sql))
if args.summarize_json:
    remote = remote.replace("FORMAT", repr("-At")).replace("OUTPUT", "rows=json.loads(result.stdout); print(json.dumps({'row_count':len(rows),'json_bytes':len(result.stdout.encode()),'last_event_id':rows[-1]['id'] if rows else None}))")
else:
    remote = remote.replace("FORMAT", repr("--csv")).replace("OUTPUT", "print(result.stdout)")
result = subprocess.run(["zsh", args.ssh_wrapper, "python3 -"], input=remote, capture_output=True, text=True, timeout=60)
print(result.stdout, end="")
if result.returncode and not result.stdout:
    print("Read-only SSH database audit failed; transport details suppressed")
raise SystemExit(result.returncode)
