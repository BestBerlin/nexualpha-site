# Telegram bot cleanup plan

1. Add regression coverage for localized hub replies and English registration intent after neutral `/alerts` and `/start` choices.
2. Reuse `startMenu` and the existing neutral guard; leave partner-offers and registry codes untouched.
3. Persist only the start-link language in the existing subscriptions record, without enabling alert topics; clear it on data deletion.
4. Add an incremental, backed-up, idempotent release patch after poller/start/neutral patches; verify the ops suite and generated JavaScript.
5. Commit locally. Deployment belongs to the lead.
