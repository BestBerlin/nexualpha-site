# Tokenized-stock research packet

Research date: 2026-10-15. This packet changes no website code, publishes nothing, and enables no commercial links.

The queue brief requested `/Volumes/致态2TB/nx-agents/research/tokenized-stocks/`. The task owner subsequently restricted all work to this branch/worktree. Therefore the export is staged here, at `research/tokenized-stocks/`, for a later authorized copy. No files are written to the requested external destination.

## Evidence rules

- Exchange/issuer facts use official product, announcement, help-center, terms, or documentation URLs. Search snippets are discovery evidence only; where curl is blocked, the source record must identify that limitation and any readable official browser/search extraction separately.
- `null` means unverified, not zero, unsupported, available, or globally permitted. Empty product/campaign arrays mean no verified entry was collected, not proof of absence.
- Launch ticker counts, dated promotions, leverage limits and general fee tiers must not be silently promoted to current product-wide facts. Country lists must identify whether they apply to the platform, issuer, particular product, or account entity.
- Tokens, perpetual derivatives, pre-IPO contracts, conventional brokerage shares, and tokenized fund interests are different instruments. A ticker match does not establish identical rights, liquidity, dividends, redemption, or hours.
- Retrieval timestamps are observation times; publication dates remain null when the official page does not disclose them. HTTP 200 does not alone establish readable body content; bot/interstitial responses are retained as access-limit evidence.
- Google autocomplete is public observed suggestion evidence, not volume, demand size, or a country eligibility signal. Editorial seed queries are not observed suggestions unless returned by Google.
- Local GSC/keyword files are historical read-only exports, not a live Search Console audit. Query-page and country dimensions and overlapping time windows must not be added together as unique query demand.

## Files and reproduction

- `entities/*.json`: independently researched exchange/issuer entries.
- `exchanges.json`: combined structured packet, including issuers under a distinct key.
- `REPORT.md`: comparison, demand findings, proposed information architecture and gaps.
- `evidence/`: curl retrieval records/bodies and public autocomplete responses.
- `search-demand.json`: relevant local snapshot records and 38 live autocomplete probes in nine languages.
- `collect-demand.py`: rerun with `python3 research/tokenized-stocks/collect-demand.py`. This reads the keyword folder and calls Google's public suggestion endpoint; rerunning changes the observation snapshot.
- `build-report.py`: assembles the packet and report from the checked-in research entries without network access.
- `validate.py`: checks coverage, source references, null semantics, evidence paths, URL domains, demand coverage, and research-only scope.

The report's IA and editorial priority are recommendations. They are not source-derived facts about search volume or a release approval.

## Local commit blocker

Standard `git add research/tokenized-stocks` failed with:

```text
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-tokenized-stocks-research/index.lock': Operation not permitted
```

The research files are intact and uncommitted on `codex/tokenized-stocks-research`. No repository permissions or worktree metadata were changed. Recovery requires an execution environment that permits standard Git writes to this worktree metadata, then staging and committing the packet on the same branch.
