# F04/F17/F20/F21 repository preparation

No production access or deployment is part of this branch. See `deploy/README.md`
for the Node image selector/digest pin and `deploy/healthchecks/README.md` for
unapplied container probes. Run the app tooling with Node 24.14.0 on PATH.

## Dependency triage (F17)

The original lock audit flagged 14 package entries (12 high, 2 moderate),
representing 10 distinct advisories. The actual production absence of these
packages comes from the lead's audit of the release whitelist/container; npm's
prod/dev flags alone do not prove runtime absence. This branch keeps the
no-server-install contract and the release's `node_modules/@resvg` packaging.

Vite 6.4.2 → 6.4.4 and React plugin 5.0.4 → 5.2.0 stay within their existing
major lines. Targeted lock refreshes update the Babel helper/parser chain,
Browserslist/baseline data, PostCSS 8.5.16 → 8.5.31, nanoid 3.3.15 → 3.3.20,
and source-map-js 1.2.1 → 1.2.2. No new direct dependency or forced audit fix.
Paraglide stays 2.25.0; unrelated runtime packages stay pinned. A fresh registry
lock audit returned zero flagged entries. This is a dated registry snapshot,
not proof that arbitrary build inputs or the whole supply chain are safe.

Vite advisories concern developer-server conditions (including Windows-specific
paths), PostCSS/source-map advisories require hostile CSS/maps, and the
Browserslist/nanoid/baseline groups require special untrusted inputs. Continue
using reviewed repository build inputs, private dev servers and no third-party
CSS ingestion. See the source audit's `reports/dependencies.md` for all 10 GHSA
IDs and exposure boundaries. Container OS and other services are outside scope.

## CSP observation (F20)

`server/csp-report.mjs` adds a separate report-only header on the production
HTTP server. The existing enforced CSP is unchanged. `default-src 'self'`,
`script-src 'self'`, `object-src 'none'`, `base-uri 'self'` describe the candidate
policy; hashes allow executable inline scripts found in the trusted build's
`dist/client/index.html`. JSON data blocks are not executable scripts. Dynamic
inline SSR scripts may still report violations: do not hash arbitrary response
HTML, since that could authorize an injected script. This strict default also
intentionally observes inline style and external resource violations.

Reports POST to `/api/csp-report` using legacy CSP or Reporting API JSON. The
same stdout log as the existing server receives JSON events named
`csp-report-only`, containing only allowlisted directive and blocked-resource
categories. Document URL, referrer, URL paths/queries, samples, IP and user agent
are discarded. Bodies are capped at 16 KiB, batches at five reports, and a
global per-process budget admits 20 requests/minute (including invalid input).
The endpoint is untrusted telemetry: spoofed/dropped reports are possible and
zero reports do not prove zero violations. Access proxies must independently
avoid retaining sensitive request bodies; this code does not configure them.

The lead can review `docker logs <staged-web>` and aggregate those JSON category
counts. Compare a staged browser matrix across locales/routes, inline bootstrap,
SSR navigation, styles, OG and commercial handoffs. Identify each legitimate
source; add explicit trusted hashes/origins only after review. Hashes must be
regenerated on each build. If dynamic nonces are needed, integrate them into
both renderer and cache strategy before promotion. Keep the header report-only
until that browser review and owner approval; promoting/enforcing CSP is a
separate change. Removing the report-only header/endpoint rolls back observation
without touching the existing enforced policy. Local tests do not establish
browser completeness or production telemetry delivery.

Runner options stay before the first test filename; new regression files are
first in `test:sites`. The Node 24 one-shot runners use `--test-force-exit`: repeated runs without
it stalled after completed test-file output, consistent with the compiler/native
resource lifetime issue documented by the build CLIs. This is a bounded-runner
workaround; clean teardown and the precise retained handle are not established.
Assertions and failure exit status remain intact.

The extra standalone-package check exposed a stale fixture: it copied only
`dist/server/index.js` and `dist/src/data`, while the Worker already imports
prepared shared components and server freshness helpers. Its fixture now copies
the complete prepared `dist/server` and `dist/src` trees. Repository isolation,
network denial and deliberate missing-transitive-dependency assertions remain.
