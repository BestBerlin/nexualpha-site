# Daily SEO autopilot

From `pilot-01-prototype`, run `node ops/seo-autopilot/run.mjs` for measurement and proposals, or add `--apply` to write guarded metadata experiments. No deployment, search submission, partner changes or scheduler installation. Node only; no dependencies added.

`SEO_AUTOPILOT_DIR` defaults to `/Volumes/致态2TB/nx-agents/seo-autopilot/reports`; override for local testing. GSC uses the existing root newsroom client, final data ending three days before execution and disjoint inclusive seven-day windows. The existing striking-distance predicate supplies the configurable 8–70 band. Bing retains provider-native buckets; its failures warn. GSC failure fails the run. Reports are dated in Asia/Shanghai and contain metrics/breakdowns, decay, selected and excluded queries, live title/H1 evidence, radar hints, inspections, verification and application decisions. At most 100 pages are fetched; all candidates remain in strikingDistance.

No `src` write without `--apply`. Existing experiments retain their baseline/date. A page observed at position <=8 in current page metrics or any 28-day query row is protected. JSON keys are exact public pathnames (including locale prefix). Copy keys are `en` and `zh-hans`; no locale fallback. The static JSON consumer is SSR-only and shared by the Worker and SSR after existing budgets. Articles, noindex and unsupported routes are excluded. Empty JSON ships by default.

Verification queries the exact query+URL after seven days, with a one-position tolerance. Missing observations are explicitly inconclusive. Fourteen consecutive daily worse observations for the same experiment mark `revert: true` on apply (dry-run reports pending reverts). The record is retained; a flagged entry is suppressed until lead review. A report or inspection request does not prove indexing or causal SEO impact.

Limits: inbound-link analysis reuses the successfully fetched GSC target HTML without extra requests. It counts same-origin plain anchors inside `<main>`, excludes noindex sources and deduplicates canonical source URLs. Reports mark this `coverage: gsc-target-sample`, `complete: false`; observed inbound counts are lower bounds for this sample, never a complete built-site graph or proof of five live inlinks. GSC targets always have a landing page; explicit radar `new-article` entries without a URL are passed as editorial hints, not proof of an exhaustive intent audit. They write to `SEO_AUTOPILOT_TOPICS_FILE` (default `/Volumes/致态2TB/nx-agents/keywords/radar/autopilot-topics.json`) only when nonempty. Set this to a checkout-local path during scoped runs. No independent sitemap-to-intent matching is implemented. Description suggestions prefix the observed query to existing metadata; normal guards reject oversized or unbranded strings. Answer-first changes are never auto-applied.

## Proposed registry entry — lead installs

Path: `/Volumes/致态2TB/nx-agents/jobs/registry/seo-autopilot.json`. Uses the existing runner daily schedule and script command fields. Default job is dry-run; topic handoff needs a separately allowed exact file path.

```json
{
  "id": "seo-autopilot",
  "label": "Daily SEO measurement and proposals",
  "enabled": true,
  "kind": "script",
  "schedule": { "type": "daily", "time": "07:40", "tz": "Asia/Shanghai" },
  "cwd": "/Volumes/致态2TB/nexualpha-site-git/pilot-01-prototype",
  "command": "node ops/seo-autopilot/run.mjs",
  "allowedWritePaths": [
    "/Volumes/致态2TB/nx-agents/seo-autopilot/reports",
    "/Volumes/致态2TB/nexualpha-site-git/pilot-01-prototype/src/data/seo-autopilot-overrides.json"
  ],
  "doneCheck": "test -s /Volumes/致态2TB/nx-agents/seo-autopilot/reports/$(TZ=Asia/Shanghai date +%F).json"
}
```

## Validation

`node --test tests/seo-autopilot.test.mjs` uses no network. Included in `npm run test:sites`. Covers selection/noise, guards, weekly windows/decay, Worker endpoint parity for venue/compare, consumer exclusions and verification. Existing route-seo tests cover broader head parity.
