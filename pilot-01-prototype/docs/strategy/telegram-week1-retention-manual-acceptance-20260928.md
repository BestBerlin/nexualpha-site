# Telegram Week1 Retention Manual Acceptance Pack

Date: 2026-09-28
Status: local acceptance pack only. No Telegram API call, no message send, no real account operation, no partner registry edit.

## Scope

This pack validates the Week1 local retention loop:

1. Bot entry receives a draft `start=` payload.
2. The payload resolves to market, locale, product and candidate venues.
3. The first return route is a NexuAlpha onsite deep link.
4. Subscription remains off until explicit opt-in.
5. Return review uses anonymous 24h and 7d counters only.

The machine-readable contract lives in `src/data/telegram-config.js` as `TELEGRAM_WEEK1_RETENTION_LOOP`.

## Protected Boundaries

- Do not send Telegram messages.
- Do not call Telegram Bot, channel, group or webhook APIs.
- Do not operate a real Telegram account.
- Do not execute `/choice`, `/stop`, `/delete` or any command that represents a user action.
- Do not expose raw exchange registration URLs, invitation codes, private commission terms or partner invite links.
- Do not edit `src/data/partner-registry.js` while validating this pack.

## Scenario Matrix

| Scenario | Market | Locale | Product | Candidate venues | First onsite route |
| --- | --- | --- | --- | --- | --- |
| `br-spot-pix-choice` | BR | pt-BR | spot | Binance, OKX, Bitget | `/br/conta?locale=pt-BR&market=BR&product=spot&tg_funnel=retention_week1` |
| `global-perp-compare-choice` | GLOBAL | en | perpetuals | Hyperliquid, dYdX, Bybit | `/compare/hyperliquid-vs-dydx?market=GLOBAL&product=perpetuals&tg_funnel=retention_week1` |
| `kr-dex-source-check` | KR | ko | dex | Uniswap, Jupiter, Hyperliquid | `/ko/exchanges/uniswap?market=KR&product=dex&tg_funnel=retention_week1` |

## Manual Acceptance Steps

For each scenario:

1. Generate or inspect the Bot deep link locally from `botDeepLinkAction`; do not open it in a real account.
2. Confirm the first visible route is the listed NexuAlpha onsite route.
3. Confirm candidate venues are comparison candidates only, not raw registration destinations.
4. Confirm subscription state is `off_until_explicit_opt_in`.
5. Confirm copy says Bot start, site return and invite click are not registration, KYC, deposit, trade, rebate or commission evidence.
6. Record only anonymous counters: `landingVisits`, `onsiteNextStepClicks`, `botStartsIfVisible`, `subscriptionOptIns`, `unsubscribes`, `sourceLocaleOrCtaIssues`.

## Hold Conditions

Hold the scenario if any of these are true:

- First hop is not a NexuAlpha onsite path.
- A raw exchange registration URL, invite code, partner invite link or private commission term appears.
- The scenario requires the operator to execute `/choice`, `/stop` or `/delete` for a user.
- Subscription defaults to on.
- The landing page lacks source, market, product or locale boundary language.
- Metrics imply registration, KYC, deposit, first trade, rebate activation or commission.

## Acceptance Record Template

```text
Scenario:
Reviewer:
Date:
Bot deep link inspected locally: yes/no
First onsite route matches contract: yes/no
Candidate venues are comparison-only: yes/no
Subscription default is off: yes/no
Protected user commands executed: no
Raw invite material exposed: no
24h anonymous counters:
7d anonymous counters:
Decision: keep / refresh / hold
Notes:
```
