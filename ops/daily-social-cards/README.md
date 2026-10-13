# Daily social cards

Node 22+; uses the existing pilot `@resvg/resvg-js`, bundled Inter font, site logo and `src/styles/tokens.css`. No new dependencies. The default run reads the two production JSON feeds and writes a dated `output/YYYY-MM-DD/` directory with `card.png` (1200×675), four plain text files and `summary.json`; stdout is one JSON summary. Date is Singapore time. The shared English image contains five gainers, five losers, observed 24h liquidations, the largest observed single liquidation and BTC funding per venue/period; captions are independently Chinese and English. Partial/missing funding is labelled unavailable; stale data or fewer than five rows on either side aborts rather than inventing numbers. All three source timestamps must be within 15 minutes and not in the future.

From the repository root:

```sh
node ops/daily-social-cards/generate.mjs --fixture ops/daily-social-cards/fixtures/daily.json --at 2026-10-13T01:00:00Z
node ops/daily-social-cards/generate.mjs --out /existing/artifact/directory
node --test ops/daily-social-cards/daily.test.mjs ops/x-poster/x-poster.test.mjs ops/alert-sender/*.test.mjs
```

On this Mac prefix heavy generation/tests with `zsh /Volumes/致态2TB/nx-agents/load-gate.sh &&`. Generated preview artifacts stay in the worktree's ignored output folder for this scoped task.

## Lead activation (not installed or executed by this task)

1. Review the fixture PNG/texts and a fresh production dry-run. Provision the script, existing helper directories, fonts, logo/tokens and pilot dependencies on the production scheduler (`nexualpha-prod`, Cijiyun HK; the `nexualpha-tg` scheduler container — CT121 and the old BaoTa host are rollback-only). Keep credentials out of the repository.
2. Set `X_ENV_FILE` to the scheduler's existing OAuth1 credential file; `BOT_ENV_FILE` to its `community-poller.env` (`COMMUNITY_BOT_TOKEN`); and `DAILY_SOCIAL_STATE_DIR` to a private persistent journal directory owned by the scheduler user. The existing X helper verifies that the account is @NexuAlpha before uploading/posting. Check app upload permissions and billing before activation.
3. Run `sh /path/to/repo/ops/daily-social-cards/daily.sh --out /persistent/artifacts/daily-social` for a dry-run. To enable delivery explicitly append `--post`; fixtures, artificial clocks and `--dry-run` cannot be combined with posting. `--x-locale en` (default) sends one English X post; `--x-locale zh-Hans` selects Chinese instead. Both texts are always generated. Telegram always sends to exactly `zh-Hans:@NexuAlphaClub` and `en:@NexuAlphaGlobal`; `ALERT_CHANNELS` cannot expand those targets. No ru/tr/vi or other channels are permitted.
4. After approval, install on the existing scheduler (this task does not install cron). For a cron implementation supporting `CRON_TZ`:

```cron
CRON_TZ=Asia/Singapore
0 9 * * * /path/to/repo/ops/daily-social-cards/daily.sh --out /persistent/artifacts/daily-social --post >> /persistent/private/daily-social.log 2>&1
```

Alternatively use `0 1 * * *` on a scheduler explicitly configured in UTC. Set environment via the existing scheduler's private configuration. Invoke with `sh` if checkout permissions do not preserve executable bits. Disable by removing this cron entry; do not delete the journal.

Posting acquires an exclusive `run.lock` and persists a per-SGT-day record **before** each outbound delivery. Recorded pending/sent/unknown targets are skipped on later runs, including when changing X language. Errors stop the run without retries. A later run can finish unattempted channels. Inspect actual account/channel state before resolving unknown entries or a crash-left lock; never blindly remove a record to resend. Preview success and mocked transports do not prove live delivery.

The X image adapter uses the existing OAuth1 signer with the legacy simple multipart upload endpoint, then `/2/tweets` with `media_ids`. Live legacy upload availability for the owner's app remains unverified; failures stop without falling back to text-only. Current [X upload documentation](https://docs.x.com/x-api/media/upload-media) describes the v2 OAuth2 endpoint; adopting that would require a separately authorized credential change. Telegram multipart uses the official [sendPhoto contract](https://core.telegram.org/bots/api#sendphoto). No live posts or credential reads are needed to test this feature.

All text links open only `https://nexualpha.com/en?src=x-daily` / `zh-hans?src=x-daily` (or `tg-daily`). Symbol validation rejects domain-style names; source names/headlines are never copied into captions. Four short lines, no hashtags, codes, disclaimers or predictions. Observed liquidation totals use ≥ to preserve the feed's lower-bound meaning.
