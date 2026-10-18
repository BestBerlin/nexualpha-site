# Editorial review (Claude owns review and publication)

A writer receipt, passing draft check, or builder output is not editorial approval.

- [ ] Check `manifest.json` (writer attempts, `meta.writer`/`meta.writerInfo`), `research.json` (fetched bodies; `failedUrls` were never cited), provenance and provider failures. Resolve `blocked` batches before retrying; retain reservations until explicitly cancelled or reviewed.
- [ ] Re-read the current content runbook, rewards verified fact sheet, partner registry and newest radar. Verify beginner alternation and locale rotation against the ledger.
- [ ] Re-fetch every cited source. Drop inaccessible official-source topics. Verify each factual/numeric claim against the original text, its date and jurisdiction. Headline feeds and rankings are discovery only.
- [ ] Read every edition independently: direct answer first, useful full-length prose, table/steps where appropriate, FAQ, no padding, no repeated boilerplate. Check native language quality manually.
- [ ] Check code labels, exact venue-specific codes from partners.json, no unsupported rebate/reward claims, no guarantees or disclosure/fine print. vi/ru and other neutral locales have no referral/sign-up language. Türkiye only OKX/Binance/Bybit; verify local entity eligibility.
- [ ] Check dedupe against both publication ledgers, the latest live titles/slugs and pending drafts, including cross-language intent. Verify internal links and tokenized-stock hub/tickers in every edition.
- [ ] Run the local draft gate: `node /Volumes/致态2TB/nx-agents/writers/validate-drafts.mjs <package-directory>` (repo copy: ops/writer-pipeline/validate-drafts.mjs).
- [ ] Before publication, run the managed engine validator: `node /Volumes/致态2TB/AEO-Crypto-Factory/scripts/nexualpha-content-validate.mjs <staging-batch-directory>`. `needs_review`/`PENDING` packages require explicit editorial preparation; a writer must never set review PASS to satisfy this gate.
- [ ] Complete and record four independent review passes: source/claim, editorial, SEO/AEO/GEO, commercial/compliance. Only the reviewer can assign approval and prepare publisher metadata.
- [ ] Review/rebuild using the managed tools, preserving first-publication dates for updates. Use the managed publisher rehearsal and publisher only. Writers never publish, submit, or append publication claims to a ledger.
- [ ] After publication perform runbook HTTP + real Chrome DOM schema checks, all native edition URLs and mobile checks. Report readable, index-allowed, submitted and actually indexed separately.
- [ ] Mark this draft manifest reviewed/cancelled with reviewer evidence, update ledger query/locale reservations and refresh the queue. Do not infer success from an empty queue.
