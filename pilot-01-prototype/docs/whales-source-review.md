# Whale source decision and validation plan

Reviewed 2026-10-13. Use the brief's explicit fallback: no clearly permitted,
working keyless replacement was established. Keep PublicNode pending provider
permission; reduce redundant queries without changing thresholds, labels, the
60-second cache, or the rolling retention window.

Before editing, lock down fixture coverage for native ETH receipt success,
USDT/USDC contract identity, older exchange flows, duplicate and removed logs,
incremental scans, failures, and at least 20 qualifying rows. Measure request
counts and UTF-8 JSON request/response bytes against the original implementation
on the same fixture. Then combine token contract filters and omit exchange
queries for ranges already covered by the general scan. Run targeted tests,
typecheck, strict build, and test:sites through the supplied load gate; compare
site failures against origin/main. Record limitations and options below.

## Provider evidence and options

- **Blockscout:** [hosted terms](https://eaas.blockscout.com/terms-and-conditions)
  sections 3 and 18 establish intended-purpose access but do not explicitly
  establish commercial redistribution rights for this feed. A software licence
  is separate from hosted-service permission. [Current API docs](https://docs.blockscout.com/devs/apis/requests-and-limits)
  announce per-instance API deprecation July 1 and list an archived default
  keyless limit of 300 requests/minute/IP; individual endpoints can differ.
  [Official announcement](https://mail.blockscout.com/p/news-july-1-is-pro-api-day)
  specifies July 1, 2026 and keyed PRO access. [PRO pricing](https://www.blog.blockscout.com/going-pro-api/)
  lists a free keyed plan of 5 RPS and 100K credits/day. A keyless USDC transfer
  probe returned HTTP 200 and 77,513 decoded body bytes; technical access does
  not establish permission. Option: obtain explicit display permission and a
  PRO key, then evaluate bounded native/token queries against these fixtures.
- **PublicNode:** [section B](https://www.publicnode.com/terms) allows RPC access
  alongside broad redistribution/extraction restrictions. Retention is the
  brief's fallback, not a finding that the commercial-use concern is resolved.
  Option: obtain written confirmation for NexuAlpha's public transfer display,
  or inject an authorised RPC through the existing whale-source interface.
- **Cloudflare:** [Ethereum Gateway docs](https://developers.cloudflare.com/web3/ethereum-gateway/)
  describe provisioned gateways with usage-based billing, rather than an
  established keyless, free hosted feed under this brief. No account setup or
  paid-service change was made. An operated Ethereum node is another option,
  but infrastructure provisioning is outside this task.
- **BTC:** [hosted terms](https://mempool.space/terms-of-service) render through
  JavaScript; reviewed the [official published component](https://github.com/mempool/mempool/blob/master/frontend/src/app/components/terms-of-service/terms-of-service.component.html),
  updated July 10, 2024. It covers associated APIs and contains no identified
  redistribution prohibition; this is not an affirmative commercial licence.
  [REST docs](https://mempool.space/docs/api/rest) warn about HTTP 429 and bans
  without promising a numeric quota. Keep the existing bounded BTC fetcher.

## Load evidence

`scripts/measure-whales-source.mjs` counts RPC calls and JSON request/response
bytes. Fixture measurements use identical deterministic data and thresholds;
they exclude HTTP headers and compression. The same 26 qualifying cold rows
(native ETH plus both stablecoins, including an older sourced exchange flow)
and one new warm row survive before and after. BTC is excluded and unchanged
(at most one recent request plus ten detail requests per refresh).

| Refresh | Before calls | After calls | Before request bytes | After request bytes | Before response bytes | After response bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Cold | 35 | 20 | 74,383 | 19,733 | 12,944 | 12,040 |
| Warm, five new blocks | 16 | 7 | 37,053 | 743 | 1,609 | 1,285 |
| Unchanged head | 1 | 1 | 63 | 63 | 41 | 41 |

Sequential live cold scans on 2026-10-13: before 69 calls, 77,472 request bytes,
14,758,089 decoded response bytes, 59 rows; after 54 calls, 22,702 request
bytes, 14,445,023 decoded response bytes, 60 rows. These scans reached
different live heads, so they prove access and sufficient sampled rows, not
identical live coverage or a fixed bandwidth saving. A separate optimized live
scan returned ETH/USDT/USDC together (53 calls, 61 raw rows); the public feed
still caps rows at 60. Full native blocks dominate response size; fewer topic
requests mainly save calls and outbound bytes. Live warm throughput and future
row availability are not guaranteed.

General token ranges contain all exchange flows, so requesting the same range
again for each labelled address is redundant. The cold scan now queries only
the older exchange range; warm scans omit those topic batches entirely. Both
contracts share a JSON-RPC address-array filter; returned contract addresses
and Transfer signatures determine token identity. Native receipts, thresholds,
proof-of-reserves labels, 60-second cache, incremental cursor, catch-up limit,
and three-hour retention remain unchanged. No retries or alternate host routing
are used to bypass provider limits.

## Verification

From `pilot-01-prototype`, the targeted command
`node --test tests/whales-source.test.mjs tests/position-radar.test.mjs tests/radar-api.test.mjs tests/radar-seo.test.mjs`
passed 22/22. `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run typecheck`
passed. `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run build` passed,
including the strict budget check, after copying the existing ignored
`.openai/hosting.json` from the main worktree (initial build lacked this input).
`zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run test:sites` passed
1,618 tests, zero failures, one skip. The pre-edit origin/main baseline at
`af254ee96fe90e3a9dc01f5e709b317bf2ce3a0a` had 1,426 passes, 147 failures,
and 12 skips before local build preparation; comparison found no new failing
test names. The baseline and final builds were not identical environments:
missing build output and generated translation state affected baseline tests.
No claim is made that this scoped change fixed those baseline failures.

The supplied load gate was invoked as requested but its `sysctl`/`pgrep`
probes emitted sandbox permission errors while it still returned success;
system headroom was not independently verified. Build-generated changes to
tracked publication/partner files were restored; only scoped edits remain.

To reproduce the fixture comparison, first create a temporary baseline module
with `git show af254ee96fe90e3a9dc01f5e709b317bf2ce3a0a:pilot-01-prototype/server/position-radar.mjs > server/position-radar.before-whales-source.mjs`,
then run `node scripts/measure-whales-source.mjs server/position-radar.before-whales-source.mjs`
and `node scripts/measure-whales-source.mjs`. Remove the temporary module after
comparison. Add `--live` to measure a real cold scan; live data changes between
runs and no future row-count or provider availability is promised.
