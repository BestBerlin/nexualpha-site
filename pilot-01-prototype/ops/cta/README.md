# Private CTA maintenance (not installed)

`daily-cta.py` defaults to **metadata-only dry-run**. It does not open event
contents, create a report, acquire a writable lock, delete files, rotate logs or
change production services without `--apply`.

Default paths: `CTA_OPS_BASE=/data/private/nexualpha/analytics`,
`CTA_OPS_DIR=/data/private/nexualpha/ops`, `CTA_OPS_CONTAINER=nexualpha-web`.
`CTA_OPS_CONTAINER_DATA_DIR` defaults to `/analytics`. Both host directories must
already exist, be root-owned and mode 0700. Event files must be regular root-owned
0600 files. Keep ops outside the data directory. Ship the logrotate template next
to the Python script. The cron template is a review artifact, not an installed job.

```sh
python3 ops/cta/daily-cta.py --dry-run
node --test tests/production-cta-ops.test.mjs
```

With `--apply`, the job locks maintenance, removes only recognized expired
archives/report directories, checks disk limits, privately snapshots yesterday's
production events, runs the existing report generator and invokes rename-based
logrotate. No event bodies are printed. It never calls exchange endpoints or
changes referral configuration. Missing input fails explicitly. Snapshot files are
deleted on success, failure or SIGTERM. Snapshots from a hard-killed older job are
removed only after the next maintenance lock is acquired; reports and status
remain private.

Retention means 30 complete UTC days plus the active current-day file; whole-file
rotation has less than one day's boundary granularity. Files older than the cutoff
are expired even when current traffic is absent. `copytruncate` is forbidden. The
collector opens its append path for every write; `nocreate` allows its next append
to create the active file. No live-file rewrite or container restart is performed.

Disk use >=75% or free space <5 GiB is WARNING; >=85% or <2 GiB blocks a new
snapshot after only already-expired files are cleaned. Daily snapshots >128 MiB
require streaming report work before execution. `status.json` contains only
aggregate operational results. A monitor must detect failures and status older
than 26 hours; this implementation does not install a monitor or notify others.

Only one collector process may write the data directory. The maintenance lock
does not turn JSONL into multiwriter storage. Before adding Web replicas, migrate
the collector or route all event writes to one writer. Runtime restarts restore
dedupe only from the active log; multi-file reporting still deduplicates sessions
and platforms, but raw event-row totals are diagnostic rather than registrations.

Synthetic tests must set `CTA_OPS_SYNTHETIC=1` and put BASE/OPS under the system
temporary directory. This bypasses Docker inventory and uses the current uid,
local `CTA_OPS_NODE_BIN` and `CTA_OPS_REPORT_SCRIPT`. Synthetic mode cannot use the
production paths. `CTA_OPS_NOW_UTC` is permitted only in synthetic mode. Tests use
`CTA_OPS_LOGROTATE_BIN` to substitute a local fixture; no host rotation is invoked.

Rollback: disable the single scheduled entry, wait for the maintenance lock,
restore the previous script/template and leave active logs, archives and reports
intact. Never overwrite active events with archives. Retention deletion is
irreversible; test it in a synthetic directory before enabling `--apply`.
