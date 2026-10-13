# Beginner path external integration

The queue instruction restricts writes to the `codex/beginner-path` worktree. The live keyword radar and content runbook are outside that boundary and were left unchanged.

`external-changes.patch` contains their proposed changes against the files read on 2026-10-14. `keyword-seeds.json` contains six hand-authored newcomer-intent queries for each of the 17 locales. These are labelled seeds, not measured search demand. Neutral locales retain the existing exclusion gates and receive explainer intent. The `beginner` lane adds 10 points to the score. The runbook note prefers an unused beginner query in one of every two runs while retaining ledger deduplication and publication gates.

Recreate and syntax-check the preview within this worktree:

```sh
python3 ops/beginner-path/prepare-external-patch.py
node --check ops/beginner-path/radar.preview.mjs
```

The preview is not the active radar. Applying the patch requires a write scope that includes the two external files; this branch does not activate the keyword or runbook changes.

The bot fixture references `ops/packages/domain/src/link-check.js`, which is absent from this checkout. The site checker therefore shares the bot's documented HTTPS/domain-only result semantics while obtaining official hosts and approved mirrors from the live site registry. It rejects userinfo, IPs, non-HTTPS URLs, non-default ports, punycode and lookalike domains; it never visits or stores the submitted URL. Restore the bot package before consolidating the implementations into a shared cross-project module.
