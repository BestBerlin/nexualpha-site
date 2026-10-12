# Offline newsroom publication gates

Run from the repository root (Node 20+; no dependencies):

```sh
node ops/newsroom/gates/check-package.mjs /path/to/package --history /path/to/content/news-feed-summary.json --ledger /path/to/article-ledger.jsonl --queue /path/to/review-queue
node --test ops/newsroom/gates/gates.test.mjs
python3 ops/newsroom/gates/verify-hooks.py '/path/to/AEO Crypto Factory'
```

`run.mjs` aliases the design's hook name. Exit codes: **0 pass**, **1 fail**, **2 needs-review**. Only zero authorizes downstream publication. Missing/malformed input fails closed; absent history or ledger requires review. No network requests, production writes, or source retrieval occur. `--now <ISO>` fixes the evaluation clock for reproducible runs. The three path options can also be provided by `NEWSROOM_HISTORY`, `NEWSROOM_LEDGER`, and `NEWSROOM_REVIEW_QUEUE`.

The pure `checkPackage(input)` export returns `{status, legacy, publishAllowed, reasons:[{rule,severity,message,locale?,claim_id?}]}`. Pass/fail evaluation is deterministic for identical inputs and `now`. Review envelopes include `version`, `slug`, `event_id`, `checked_at` and the result; the file adapter atomically renames a content-hashed JSON file into the queue. A future T1 DB adapter can ingest the envelope without changing the rule library. Failures are returned to the caller; review items are queued. Re-running at a different time produces a new audit record.

## Writer contract

Keep existing `meta.json` and all `article.<locale>.md` files. Add `claims.json` and `evidence.json`. Legacy `meta.claims` and `meta.sources` do not silently satisfy the new contract: missing `claims.json` returns `legacy:true`, `status:needs-review`.

```json
{
  "claims": [{
    "id": "c1", "key": true, "kind": "fact",
    "text_en": "Acme announced product X on 12 October 2026.",
    "text_zh": "Acme 于2026年10月12日宣布推出产品X。",
    "evidence_ids": ["e1"], "metadata": {}
  }],
  "quotes": [], "ctaPlan": []
}
```

A bare claims array is accepted as specified by the design; companion `quotes` and `ctaPlan` then live in `meta.json`. Localized text uses `texts:{"tr":"…"}`. Every prose sentence must match a locale claim after punctuation/spacing normalization. This conservative rule also catches undeclared names in every script; reference-only Markdown link lines and exact reviewer bylines are handled separately. Numbers absent from claims fail; missing sentence mapping requires review. Titles are checked for uncovered numbers and allegations too. Inline Markdown URLs are removed before numeric scanning. Mark arithmetic `(our arithmetic: …)` and provide a mapped `kind:arithmetic` claim. Do not treat an arithmetic marker as permission to invent a number.

`evidence.json` is an array (or `{evidence:[]}`) of `{id,url,kind,excerpt,author_account,published_at,origin_key,is_independent,confidence,label_source,finding,venues}`. Evidence may alternatively be embedded in `claims.json.evidence` or `meta.event_evidence`. Only HTTP(S) URLs qualify. One direct evidence item or two explicitly independent media origins supports a key claim. Reposts sharing an origin count once. `conflicting:true` forces review. This tests the supplied evidence contract, not the authenticity or factual truth of URLs: the writer must freshly retrieve and verify sources before submitting the bundle.

Metadata required for event auto-publication:

- `subject` (string or locale map), `title_event_terms` (locale → nonempty event words), `title`, `entities`, `event_type`, `credibility >= 2`.
- `fact_summary`, `mechanism`, `analysis` for tentative political/macro causal explanations.
- `counterparty_response` with a URL present in evidence and every edition, or exactly `no public response as of <UTC ISO time>`, `counterparty_checked_at` and the same statement in every edition. This asserts a checked time, not proof that a search was performed.
- `human_reviewed_by` plus `human_reviewed_at` when claiming human review, matched to a record in the separate trusted `--reviews <file>` / `NEWSROOM_REVIEW_RECORDS` input. Records are `{slug,reviewer,reviewed_at}`; the pure API uses `humanReviews`. Package metadata alone always fails. Keep this publisher-controlled file outside writer packages.
- `partner_names`, `relatedVenues`, and required `topic_tags` for CTAs; venues must also exist in the repository's existing `pilot-01-prototype/public/intel/partners.json`, which is read without modification; the supporting direct evidence must name the venue in `venues`.

Claim metadata: `sale_confirmed_by` references direct supporting evidence with `finding:sale` (a transfer URL alone does not confirm a sale); address labels need `label_source`, `confidence`, and matching evidence, with `address_unknown` incompatible with `address_owner`. Liquidations need `liquidation_type`, and totals require `window`, `venues`, `coins`, `source` (an evidence ID/URL), `lower_bound:true`; individual orders explicitly set `total:false` and must say single/individual (or 单笔/單筆); total wording overrides that flag. Aggregates declare `sum_of:[claim IDs]`, and component claims must have kind liquidation/arithmetic and declare `source` and UTC `snapshot_at`; snapshots from a shared source cannot be summed. Strong risk terms need evidence `finding:insolvency|bankruptcy_filing|in_bankruptcy`; bankruptcy states need court records.

Quotes require `{locale,text,evidence_id,speaker,date}`; speaker must equal the source account and date must equal `published_at` (UTC ISO). Speaker and calendar date must appear in the body. Fuzzy matching tolerates punctuation/whitespace, never altered words or figures. Translation uses `original_text`, `translated:true`, and a visible translated/译文 marker; translation fidelity requires review. Official fraud finding quotations also require the mapped claim's `metadata.official_finding_quote:true` and official/court evidence with `finding:fraud`.

`ctaPlan` is an array of `{intent,venue?,locale?}` matching each `::cta <intent> [venue]` directive. At most two CTAs/partner mentions per edition. Mention counts use the existing partner registry, so omitting `partner_names` cannot bypass the count. Risk/dispute/regulation topics allow only the neutral intents defined in §7. Commercial promotion eligibility, regional restrictions and current link validity are still the renderer/matcher's responsibility; this gate cannot approve a promotion from prose alone. Hard-coded partner codes, direct affiliate URLs, fine-print disclaimers, and undocumented reviewed bylines fail.

A real value block uses a `## Timeline`, `## Source check`, `## Metric definition`, `## Comparison`, `## Both sides`, `## Correction`, `## Risk checklist` heading (or Chinese equivalent). The value section must contain at least 20 normalized characters of content, excluding CTA directives. The structure gate flags missing core-fact opening/value block for review; humans still assess whether the block adds value.

## Limits and integration

EN, Simplified Chinese and Traditional Chinese have regex lexicons. Every other edition always requires review while its semantic lexicon is unavailable; numeric, quote, duplicate and CTA checks still run. Regexes identify risky wording, not logical entailment. Ambiguous paraphrases and translations require review. Treat claims, evidence, reviewer records, title terms and semantic metadata as trusted verifier inputs, never as unvalidated text from a generator.

Duplicate checks read both feed and ledger, using only publications in the inclusive previous 48 hours. Exact normalized title or primary query fails; bigram Dice similarity >= 0.82 requires review. Feed rows without queries still contribute titles. The CLI joins ledger publication rows (`recordedAt`) to staged `packagePath` metadata and same-slug feed rows; recent rows without either title or query require review. Invalid historical timestamps require review; a same-slug record is not exempt (a republish needs an explicit workflow outside automatic new-article publication).

See `PUBLISHER-HOOK.md` for the exact external patches. This repository supplies the gate, not an installed production hook. Keep fixtures offline: real examples are historical package copies and intentionally produce legacy review outcomes; synthetic fixtures in the tests cover current pass/fail rules.
