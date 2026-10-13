#!/usr/bin/env bash
# Daily encrypted dump of the `newsroom` database (host cron on BaoTa). Same key and format as the Telegram
# backup (crypto-telegram-ops/baota/backup.sh): pg_dump custom format, AES-256-CBC + PBKDF2 via OpenSSL 3.
set -euo pipefail
stack_dir=${NEWSROOM_STACK_DIR:-/data/agent/srv/stacks/crypto-telegram-ops}
artifact_dir=${NEWSROOM_BACKUP_DIR:-/data/agent/srv/projects/crypto-telegram-ops/artifacts/backups}
postgres_container=${NEWSROOM_POSTGRES_CONTAINER:-crypto-telegram-ops-postgres-1}
docker_bin=${NEWSROOM_DOCKER:-docker}
if [[ "${1:-}" == "--dry-run" ]]; then
  server_major=$("$docker_bin" exec "$postgres_container" psql -U telegram_ops -d newsroom -Atc 'show server_version_num' | awk '{print int($1/10000)}')
  dump_major=$("$docker_bin" exec "$postgres_container" pg_dump --version | sed -E 's/.*PostgreSQL[^0-9]*([0-9]+).*/\1/')
  if [[ -z "$server_major" || -z "$dump_major" || "$server_major" != "$dump_major" ]]; then
    printf 'pg_dump major mismatch: server=%s pg_dump=%s container=%s\n' "${server_major:-unknown}" "${dump_major:-unknown}" "$postgres_container" >&2
    exit 1
  fi
  printf 'pg_dump major %s matches PostgreSQL server major %s in %s\n' "$dump_major" "$server_major" "$postgres_container"
  exit 0
fi
set -a; . "$stack_dir/.env"; set +a
: "${BACKUP_ENCRYPTION_KEY:?remote-only BACKUP_ENCRYPTION_KEY is required}"
install -d -m 0750 "$artifact_dir"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
encrypted_dump="$artifact_dir/newsroom-$timestamp.dump.enc"
"$docker_bin" exec "$postgres_container" pg_dump -U telegram_ops -d newsroom --format=custom \
  | "$docker_bin" run --rm -i -e BACKUP_ENCRYPTION_KEY python:3.11-slim openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_ENCRYPTION_KEY > "$encrypted_dump.tmp"
mv "$encrypted_dump.tmp" "$encrypted_dump"; chmod 0600 "$encrypted_dump"
find "$artifact_dir" -type f -name 'newsroom-*.dump.enc' -mtime +14 -delete
printf '%s %s\n' "$timestamp" "$encrypted_dump"
