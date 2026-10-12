#!/usr/bin/env bash
# Daily encrypted dump of the `newsroom` database (host cron on BaoTa). Same key and format as the Telegram
# backup (crypto-telegram-ops/baota/backup.sh): pg_dump custom format, AES-256-CBC + PBKDF2 via OpenSSL 3.
set -euo pipefail
stack_dir=/data/agent/srv/stacks/crypto-telegram-ops
artifact_dir=/data/agent/srv/projects/crypto-telegram-ops/artifacts/backups
set -a; . "$stack_dir/.env"; set +a
: "${BACKUP_ENCRYPTION_KEY:?remote-only BACKUP_ENCRYPTION_KEY is required}"
install -d -m 0750 "$artifact_dir"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
encrypted_dump="$artifact_dir/newsroom-$timestamp.dump.enc"
docker exec crypto-telegram-ops-postgres-1 pg_dump -U telegram_ops -d newsroom --format=custom \
  | docker run --rm -i -e BACKUP_ENCRYPTION_KEY python:3.11-slim openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_ENCRYPTION_KEY > "$encrypted_dump.tmp"
mv "$encrypted_dump.tmp" "$encrypted_dump"; chmod 0600 "$encrypted_dump"
find "$artifact_dir" -type f -name 'newsroom-*.dump.enc' -mtime +14 -delete
printf '%s %s\n' "$timestamp" "$encrypted_dump"
