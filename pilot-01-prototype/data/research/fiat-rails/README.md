# Fiat deposit, withdrawal and spending-card research

Official documentation snapshot dated **2026-10-15**. Research only; no product code, production mutations, transactions or referral changes.

- `rails.json`: flattened exchange × market × method records, global purchase-card capabilities, source registry and unresolved gaps.
- `cards.json`: exchange spending cards, including scoped availability, retirement/migration notices and unknown products.
- `exchanges/*.json`: individually researched source records for the 11 exchanges.
- `REPORT.md`: country shortlist, limitations, highlights and proposed site features.
- `RESEARCH-CONTRACT.md`: shared evidence and data rules.
- `build.py`: standard-library validator and deterministic assembler.

Run from the repository root:

```sh
python3 research/fiat-rails/build.py
python3 research/fiat-rails/build.py --check
```

`null` means unknown from collected evidence, not unsupported. `false` means an explicit restriction or absence was documented. Global provider, payment network or currency support never proves country eligibility. Bank deposits, bank withdrawals, card purchases, merchant P2P and third-party checkout are separate methods. Exchange availability and bank/card issuer acceptance remain separate requirements. Source IDs resolve to HTTPS URLs with access dates; source publication/update dates are recorded when known. Search-index excerpts may lag an opened official page; conflicting evidence is recorded rather than silently combined.

Market labels follow the brief; `EU/SEPA` is a grouping and `Korea` refers to South Korea. Check each record's residence, identity-document and account-region restrictions. A published typical settlement time is not a completed-transfer measurement. Promotional cashback and zero-fee statements retain their conditions; unknown total costs remain null.

The brief requested `/Volumes/致态2TB/nx-agents/research/fiat-rails/`. The newer instruction confines work to this worktree, so these committed files live at `research/fiat-rails/` instead. No files were written to the requested external destination or queue report path; the final response is intended to be saved by the task runner.
