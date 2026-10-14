# Audit area 7: Server runtime

Scope: read-only review of the current server-runtime fixes in `pilot-01-prototype/server.mjs`, `pilot-01-prototype/server/cta-collector.mjs`, `pilot-01-prototype/server/ssr-page-cache.mjs`, and the related runtime tests. No deployment or production mutation was performed.

## Findings

| File:line | Severity | Fixed? | Finding | Proof |
| --- | --- | --- | --- | --- |
| `pilot-01-prototype/server.mjs:311` | P1 | Yes | The HTTP entry now streams `Response.body` through `pipeline(Readable.fromWeb(...), res)`, so a paused or disconnected client applies Node socket backpressure and cancels the upstream Web stream instead of eagerly draining it into memory. | `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && cd pilot-01-prototype && node --test tests/perf-ssr-page-cache.test.mjs tests/cta-collector.test.mjs tests/deep-audit-runtime.test.mjs` -> 51 tests passed, including `slow and disconnected clients apply backpressure and cancel the response source`. |
| `pilot-01-prototype/server.mjs:323` | P2 | Yes | Server `close` now stops the interval-backed intel, funding and FX readers and clears the SSR page cache, preventing local test/runtime shutdowns from retaining timers and cached page buffers. | Static review found the interval-backed feeds expose `stop()` in `server/intel-feed.mjs`, `server/funding-feed.mjs`, and `server/fx-feed.mjs`; `npm run typecheck` passed after the wiring. |
| `pilot-01-prototype/server/cta-collector.mjs:83` | P1 | Yes | CTA collector startup now streams JSONL recovery and keeps only the 30-day idempotency/assignment window in memory, instead of reading and splitting the entire historical event file. | Targeted tests passed, including `collector expires runtime idempotency keys using the same 30-day recovery window` and existing restart/dedupe tests. |
| `pilot-01-prototype/server/ssr-page-cache.mjs:33` | P1 | Yes | SSR page cache is now bounded by entry count and bytes, excludes private/no-store/no-cache/set-cookie/vary responses, bypasses partner-personalized `?p=`, isolates origins, and coalesces concurrent public renders. | Targeted tests passed, including `private, no-store, cookie-setting and varying responses never enter the shared cache`, `cache retention is bounded by bytes as well as entry count`, and `concurrent cookie-less crawler requests share one public render`. |
| `pilot-01-prototype/server/ssr-page-cache.mjs:81` | P2 | Partially | A production-server cookie-less `/exchanges` request does cache, but in the local supplied-worker harness the first two requests were `miss`, `miss` and the third was `hit`; this is consistent with the asynchronous feed fingerprint settling and should be monitored in a built-server smoke before claiming first-repeat hits. | Live probe result: `cache.first=miss`, `cache.second=miss`, `cache.third=hit`, `cache.cookie=null`, `renderCount=5`. |
| Runtime memory claim | P1 | Partially | The short local crawler/API probe shows bounded heap growth over repeated requests, but it does not prove the reported 743 MB -> 966 MB 90-minute production growth is fully resolved. | Probe result after cache warmup, 80-request crawler burst, 80 `/api/runtime-probe` requests and 400 cached loop requests: `rssDeltaMB=29.69`, `heapDeltaMB=3.25`, `rssEndMB=107.61`, `heapEndMB=13.2`. Needs a long-running built-server soak for the exact 90-minute claim. |

## Verification evidence

Targeted runtime tests:

```text
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && cd pilot-01-prototype && node --test tests/perf-ssr-page-cache.test.mjs tests/cta-collector.test.mjs tests/deep-audit-runtime.test.mjs
Result: pass; tests 51, pass 51, fail 0, duration_ms 436.478708.
```

Typecheck:

```text
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && cd pilot-01-prototype && npm run typecheck
Result: pass; tsc -p tsconfig.json completed with exit code 0.
```

Live local runtime probe:

```text
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && cd pilot-01-prototype && node --expose-gc - <<'NODE' ...
Result: pass; cache first/second/third = miss/miss/hit, cookie request bypassed shared cache, 80 crawler requests all 200 with miss/hit cache headers, 80 API requests all 200 with p95 32.6 ms, heap delta 3.25 MB.
```

Accidental broad verification note:

```text
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm --prefix pilot-01-prototype test -- --test-reporter=spec tests/perf-ssr-page-cache.test.mjs tests/cta-collector.test.mjs tests/deep-audit-runtime.test.mjs
Result: interrupted manually after many passing tests because npm mapped it to the full whole-site suite; not counted as completion evidence.
```

## Limitations

- I did not edit runtime code in this lane; this report audits the current uncommitted runtime fixes already present in the shared worktree.
- I did not run a 90-minute soak, so the production memory-growth report cannot be closed from this lane alone.
- I did not run `npm run build` or full `npm run test:sites`; those are broader branch-level gates and were outside this area-only runtime probe.
