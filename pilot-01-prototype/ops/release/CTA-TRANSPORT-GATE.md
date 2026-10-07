# Required production CTA transport gate

The 2026-10-02 R92 incident proved that a Web `/health/cta-ready` response based on environment presence is insufficient: R90 and R86 had `CTA_ANALYTICS_ORIGIN` but lacked the collector Docker network. The collector stayed healthy while Web POSTs returned503.

Before any subsequent production promotion:

1. Inspect the currently active Web and independent collector networking privately. Resolve `CTA_ANALYTICS_ORIGIN` to the existing collector name/alias; do not print full environment or create a second collector.
2. Start the candidate with the collector-owned user-defined network attached. Copying only environment/image/command is insufficient. Preserve all existing necessary networks; do not assume default bridge provides hostname resolution.
3. Run `scripts/verify-cta-transport.py --web-container <candidate> --collector-container <collector>` on the production host. It must validate matching hostname ownership, a shared user-defined network and actual Web-container GET to collector `/health/cta-ready` with ready=true/environment=production before Nginx cutover. Apply the same gate to the warm rollback.
4. Accept same-origin malformed payload400 and foreign Origin403 through the public Web route; these probes must not add production rows. A status204 for a known crawler is not proof of durable human event capture.
5. Retain network-state backup and reversible connect/disconnect commands alongside release evidence. After cutover, observe natural first-party events separately. Never fabricate an event to count as a real user or registration; requests are not users.

Current R92 repair connects R90/18191 and rollbackR86/18190 to existing `nexualpha-internal`, preserving bridge and R58 collector/R42 alias. It changes no site build, invitation link or partner registry. Historical R91 scripts remain immutable executed evidence; future stage scripts must attach required networking and execute this gate.

This gate establishes transport/readiness, not Google indexing, traffic lift, durable capture of unobserved human events or third-party signup outcomes.

## Required release resource and probe gate (R94)

R94 found 25 superseded NexuAlpha Web containers still running: about 1,016,744 KiB RSS in aggregate, with host swap almost full. Their production references were checked across153 Nginx vhost files before stopping them. Container/source files remained recoverable; collectors and other projects were untouched. Available memory increased from385MiB to1558MiB. These observations support retiring unused runtimes; they do not alone prove the exact cause of every earlier SSH timeout.

Before staging/promoting another release:

- Record actual active Nginx app/upstream, candidate, named warm rollback(s), host available memory/swap and NexuAlpha Web container inventory. Reconcile previous release jobs before starting a new probe.
- Keep current Web, candidate and explicitly required recent rollback(s) running. Reversibly stop older NexuAlpha Web instances only after checking their app mounts and ports are unreferenced by current vhost configuration. Preserve containers, source trees and a private restart inventory. Never stop collector or unrelated services through this rule.
- Run transport gates after capacity checks and before a large page scan. Docker read/exec timeout is a failed verification, not proof of missing referral parameters or an unavailable upstream.
- For a full861-route origin scan use at most2 workers and2 pending requests, starts spaced at least0.5s,10s socket timeout and900s total hard deadline. Abort on origin connectivity failure and preserve partial evidence. A partial scan must never leave or create a PASS file. The R94 bounded origin verifier retains all prior acceptance assertions.
- Do not overlap strict builds with tests reading generated artifacts. Verify build completion before those tests start.

After acceptance, record public version/HTTP/browser/invites and retire only superseded, unreferenced runtimes under the same reversible rules. Lighthouse, Search Console, IndexNow and anonymous first-party counts each remain separate evidence boundaries.
