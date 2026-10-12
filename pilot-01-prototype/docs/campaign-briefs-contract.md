# Campaign briefs: content-team contract

Publish `public/content/campaign-briefs.json` (served at `/content/campaign-briefs.json`). Replace it atomically after validation. The envelope has exactly one property, `items`, an array. Start with `{"items":[]}`; no sample claims ship.

Each item has this shape (values below illustrate types, not publishable claims):

```json
{
  "id": "<exact announcement feed ID>",
  "updated": "2026-10-12T00:00:00Z",
  "headline": {"en": "Human headline", "zh-Hans": "本地化标题"},
  "summary": {"en": "Two or three source-checked sentences. Explain the participation conditions."},
  "key_facts": [{"label": {"en": "Requirement"}, "value": "Source-checked fact"}],
  "who_can_join": {"en": "Source-checked eligibility"},
  "deadline": null,
  "reward_text": null,
  "source_checked": "2026-10-12T00:00:00Z"
}
```

Only `id` is required; all other fields are optional. IDs must be unique, nonempty strings of at most 2048 characters. Use the feed's ID verbatim, including URL IDs. IDs must exist in the current announcement feed (or curated activity pool), or have an `updated` timestamp within the last 30 days. `updated` and `source_checked`, when supplied, must be ISO timestamps with a timezone and cannot be in the future. `deadline` is an ISO timestamp with a timezone, or null; `reward_text` is a locale object or null. Omission/null means no deadline/reward display. Never extract amounts or dates from the raw headline.

Locale objects support `en`, `zh-Hans`, `zh-Hant`, `es`, `pt-BR`, `fr`, `de`, `it`, `ja`, `ko`, `ru`, `tr`, `id`, `vi`, `ar`, `ur`, `uk`. Each supplied translation must be nonempty text. Display selects the requested locale, then English, then the original title/template where appropriate. Partial briefs are allowed; English is recommended. Write summaries as 2–3 sentences; sentence counts are editorial, not machine-validated.

Maximum lengths (Unicode characters): headline 180, summary 1200, who_can_join 600, reward_text 300, fact label 80, fact value 300. Maximum 8 facts. Fact values are plain strings; only labels are localized. Unknown properties/locales, duplicates, malformed dates, URLs, referral/invite/partner-code text and known partner code values are rejected. IDs are exempt from text checks because feed IDs can be URLs. Do not put registration links or codes anywhere in brief text. Source links remain owned by the announcement feed.

Validate from `pilot-01-prototype`:

```sh
node scripts/validate-campaign-briefs.mjs
# Or validate a candidate before replacing the public asset:
node scripts/validate-campaign-briefs.mjs /absolute/path/to/candidate.json
```

Validation failure exits 1; success exits 0. Runtime reads the same public content asset through ASSETS for request-time SEO/SSR and browser fetch for client navigation. Missing/unavailable briefs preserve raw titles and template guidance. Original titles remain small text when overridden; update pages retain the bottom original source link. SEO title/description use existing budgets. Countdown renders a UTC deadline on SSR and starts hours:minutes remaining after hydration, refreshing every minute and clamping to zero after expiry.
