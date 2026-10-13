# Campaign autodraft

Run from `pilot-01-prototype`:

```sh
node scripts/campaign-autodraft.mjs --input /path/to/newsroom-export.json
node scripts/campaign-autodraft.mjs --input /path/to/newsroom-export.json --since 2026-10-13T00:00:00Z
node scripts/campaign-autodraft.mjs --promote <id>
```

The input is a JSON array or `{events: [...]}`, `{raw_items: [...]}` or `{items: [...]}`. Export newsroom events with `event_type` campaign/promotion, `title_internal`, `original_links`, `source_published_at`, `fact_summary`; collector rows use `event_type_guess`, `title`, `url`, `published_at`, `body_excerpt`, and `metrics.campaign_start_at`/`campaign_end_at`. No DB credentials or logged-in scraping are needed. The generator accepts official hostnames for OKX, Binance, Bybit, Bitget and Kraken only. It identifies each campaign by normalized source URL; tracking queries and repeated imports do not create new drafts or overwrite owner edits. `--since` filters publication timestamps strictly after the supplied instant.

Optional source-backed enrichment is `campaign: {startAt, endAt, campaignLinkRequired, restrictedCountries, allowedCountries, copy: {en: {title, rewardHeadline, eligibility, steps: [...]}, "zh-Hans": {...}}}`. Dates require timezone-qualified ISO timestamps and are stored in Singapore time (+08:00). Feed excerpts alone cannot establish eligibility, rewards, enrollment steps or translate Chinese: missing fields remain explicit editorial TODOs. Announcement publication dates are never substituted for campaign dates. See `tests/fixtures/campaign-autodraft/announcements.json` for the exact input shape.

Drafts are written to `drafts/campaigns/<id>.json` with a Markdown `REVIEW.md`. They are excluded from routes, build output and sitemaps. Review source facts and both editions; fill TODOs, confirm country restrictions, set `eligibilityReviewed: true`, `status: "APPROVED"`, `reviewedBy`, and timezone-qualified `reviewedAt`. Set `campaignLinkRequired: false` only when the normal referral signup is sufficient; otherwise supply the special enrollment URL in `campaignUrl`. Every signup resolves through the partner registry with its exact code. Sitewide-supported venues have their registry parameter attached; other special URLs must already bind the exact registered query parameter/code or equal a registered destination. Unresolved links block promotion. Public copy leads with the user's reward; templates add no commission language or disclaimers. Keep URLs and partner codes out of copy; the source is stored separately and displayed as text.

Promotion copies the approved data into `src/data/campaign-autodraft.generated.js`, registers `/activities/<id>` and `/go/campaign-<id>`, and adds both English and Simplified Chinese sitemap entries. Subsequent builds regenerate those entries from the same registry. Other locales use the English informational edition with noindex. Neutral locales (including variants and Vietnamese), VN markets, Türkiye Bitget restrictions, partner policy, campaign country gates and active dates are enforced for page CTAs and direct redirect requests. Cloudflare country headers take priority over user market hints at the redirect. Allowed-country campaigns require a known market. The attribution guard reads the approved registry and verifies its destinations through the real redirect handler.

Promotion is local and explicit. This command neither deploys nor submits indexing requests. Keep generation and promotion single-owner (do not run overlapping mutations). Review approval is the owner's attestation; the script does not independently verify announcement claims or link health. After changing the registry, run the strict build, test:sites and typecheck before deployment through the existing release process.
