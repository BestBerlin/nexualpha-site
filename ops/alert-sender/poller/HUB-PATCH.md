# Localized hub and registration language guard

The incremental patch reuses `/start` copy and tool buttons for private `/hub`.
Promotable hub menus retain a localized registration button. Neutral languages
(ru, ar, zh-Hant, ur, uk, vi) have no registration button or invite codes.
Registration requests keep the existing registry-backed card unless any current
or remembered language indicates a neutral locale.

Start-link language is stored as `nxStartLanguage` in the existing
`ALERT_SUBSCRIPTIONS_FILE` user record. This does not enable topics or change the
chosen `/alerts` language. Data deletion clears this field. No new database,
dependency, service, or disclaimer footer is introduced.

## Lead deployment

Deploy source files `ops/alert-sender/bot-menu.mjs` and
`ops/alert-sender/poller/apply-hub-patch.mjs`, alongside the unchanged existing
`site-features.mjs`, `apply-poller-patch.mjs`, `apply-start-patch.mjs`, and
`apply-neutral-patch.mjs` dependencies. On a fresh release, apply the existing
poller/start/neutral patches in that order, then:

```sh
node ops/alert-sender/poller/apply-hub-patch.mjs <releaseDir>
```

On a release already carrying all three existing patches, run only the new hub
patch. The older patch validators do not accept later patches changing their
replacement blocks; do not rerun those older patches over the final service.

The patch writes (and backs up changed existing files):

- `<releaseDir>/dist/apps/bot-community/src/mock-community-service.js`
- `<releaseDir>/dist/apps/bot-community/src/bot-menu.js`
- `<releaseDir>/dist/apps/bot-community/src/site-features.js` (only if changed)

Restart only the **community poller container** in the documented BaoTa Compose
project `nexualpha-tg`, configuration
`/srv/agent/stacks/crypto-telegram-ops/baota/apps-compose.yml`, profile `cutover`.
The exact running container/service name must be read from that Compose config
or `docker compose ps` by the lead; it is not recorded in this checkout.
No web, alert-sender, database, or CT121 container restart is required.
No deployment or live restart was performed by this task.

Rollback: restore the timestamped service/helper backups and remove the new
`bot-menu.js` if it was newly created, then restart the same community poller.
