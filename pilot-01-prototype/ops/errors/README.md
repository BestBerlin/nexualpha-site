# Private error event maintenance (not installed)

The web error monitor writes newline-delimited JSON to one private append-only
file configured by `ERROR_EVENT_FILE`. Keep the file outside the app and build
directories. The directory should be root-owned and mode 0700; the active file
should be mode 0600.

The monitor opens the append path for each event, so rename-based log rotation is
safe. `copytruncate` is forbidden because it can split or duplicate concurrent
JSONL writes. `nocreate` allows the next monitor append to create the active file
with the runtime's private file mode.

Templates in this directory are review artifacts. They are not installed by the
repository:

```sh
node --test tests/error-monitor.test.mjs
```

Retention keeps 30 complete UTC days plus the active file. The event schema is
intentionally strict: only bounded route categories, stable component names,
stable error codes, status integers and request identifiers are stored. Exception
messages, query strings, request bodies and upstream response bodies must not be
written to this log.

Rollback: remove the scheduled entry, restore the previous logrotate template and
leave active logs and archives intact. Never overwrite the active error file with
an archive.
