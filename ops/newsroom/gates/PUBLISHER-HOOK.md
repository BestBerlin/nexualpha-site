# Publisher Hook

This file documents the read-only integration points inspected on 2026-10-12. It does not modify the external content engine or publisher.

## CLI contract

```sh
node <repo>/ops/newsroom/gates/check-package.mjs <packageDir> --history <summary.json> --ledger <ledger.jsonl> --queue <directory> [--reviews <review-records.json>]
```

The gate is local and network-free. It exits with:

- `0` when the package can publish.
- `1` when failures must block publish.
- `2` when the package must go to review.

Exit `0` is not enough by itself. Builders and publishers must parse stdout JSON and only publish when the gate returns `{"status":"pass","publishAllowed":true}` and `legacy` is not `true`. Empty, malformed, non-object, or missing-output responses are errors and must not fall back to pass.

Legacy output with `{"status":"needs-review","legacy":true}` maps to review and must not publish.

History and ledger inputs are required in publisher mode so duplicate checks cover the last 48 hours of titles and primary queries. Trusted human-review records are optional and may be passed with `--reviews <file>` or `NEWSROOM_REVIEW_RECORDS=<file>` when the core gate needs to validate "Reviewed by" claims.

## One-line hooks

Build package hook:

```sh
NEXUALPHA_NEWSROOM_GATE=/Volumes/致态2TB/nx-wt-codex-newsroom-gates/ops/newsroom/gates/check-package.mjs \
NEXUALPHA_NEWSROOM_HISTORY="$NEWS_FEED_SUMMARY_JSON" \
NEXUALPHA_NEWSROOM_LEDGER="$ARTICLE_LEDGER_JSONL" \
NEXUALPHA_NEWSROOM_REVIEW_QUEUE="$REVIEW_QUEUE_DIR" \
NEWSROOM_REVIEW_RECORDS="$OPTIONAL_REVIEW_RECORDS_JSON" \
python3 deployment/nexualpha-content-engine/tools/build-package.py "$PACKAGE_DIR"
```

Publisher hook:

```sh
NEXUALPHA_NEWSROOM_GATE=/Volumes/致态2TB/nx-wt-codex-newsroom-gates/ops/newsroom/gates/check-package.mjs \
NEWSROOM_REVIEW_RECORDS="$OPTIONAL_REVIEW_RECORDS_JSON" \
node scripts/nexualpha-content-publish.mjs "$BATCH_DIR"
```

## Exact patch for `build-package.py`

Inspected file:

`/Users/bestberlin/Documents/AEO Crypto Factory/deployment/nexualpha-content-engine/tools/build-package.py`

Patch placement: after `manifest` is assembled and before `article.json`, `sources.md`, `preview.html`, and `image-prompt.md` are written. This keeps failed or review-only packages from materializing generated outputs as publishable artifacts.

```diff
--- a/deployment/nexualpha-content-engine/tools/build-package.py	2026-10-12 21:09:10
+++ b/deployment/nexualpha-content-engine/tools/build-package.py	2026-10-12 21:09:10
@@ -14,7 +14,9 @@
 """
 import html
 import json
+import os
 import re
+import subprocess
 import sys
 from datetime import datetime, timezone
 from pathlib import Path
@@ -113,6 +115,32 @@
                          f"Lengths: {en_words} English words, {zh_han} Han characters"
                          + "".join(f", {locale}: {n}" for locale, n in extra_lengths.items()) + "."]},
 }
+
+gate_script = os.environ.get("NEXUALPHA_NEWSROOM_GATE")
+gate_history = os.environ.get("NEXUALPHA_NEWSROOM_HISTORY")
+gate_ledger = os.environ.get("NEXUALPHA_NEWSROOM_LEDGER")
+gate_queue = os.environ.get("NEXUALPHA_NEWSROOM_REVIEW_QUEUE")
+gate_reviews = os.environ.get("NEWSROOM_REVIEW_RECORDS")
+if not gate_script or not gate_history or not gate_ledger or not gate_queue:
+    sys.exit("PACKAGE REJECTED: newsroom gate requires NEXUALPHA_NEWSROOM_GATE, NEXUALPHA_NEWSROOM_HISTORY, NEXUALPHA_NEWSROOM_LEDGER and NEXUALPHA_NEWSROOM_REVIEW_QUEUE")
+gate_args = ["node", gate_script, str(d), "--history", gate_history, "--ledger", gate_ledger, "--queue", gate_queue]
+if gate_reviews:
+    gate_args.extend(["--reviews", gate_reviews])
+result = subprocess.run(gate_args, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
+gate_output = (result.stdout or "").strip()
+gate_error = (result.stderr or "").strip()
+try:
+    gate_result = json.loads(gate_output) if gate_output else {"status": "error", "publishAllowed": False, "reasons": ["empty gate output"]}
+except json.JSONDecodeError:
+    gate_result = {"status": "error", "publishAllowed": False, "reasons": ["malformed gate output", gate_output[:500]]}
+if result.returncode == 0 and gate_result.get("status") == "pass" and gate_result.get("publishAllowed") is True and gate_result.get("legacy") is not True:
+    pass
+elif result.returncode == 2 or gate_result.get("status") == "needs-review":
+    sys.exit("PACKAGE NEEDS REVIEW: " + (gate_output or gate_error))
+elif result.returncode == 1 or gate_result.get("status") == "fail":
+    sys.exit("PACKAGE REJECTED: " + (gate_output or gate_error))
+else:
+    sys.exit("PACKAGE REJECTED: newsroom gate did not return pass/publishAllowed: " + (gate_output or gate_error or f"exit {result.returncode}"))
 (d / "article.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
 
 src_lines = ["# Sources", "", f"Accessed: {now}", ""]
```

## Exact patch for the publisher

Inspected file:

`/Users/bestberlin/Documents/AEO Crypto Factory/scripts/nexualpha-content-publish.mjs`

Patch placement: after `loadBatchPackages()` and before any public fetches, backups, local mutation, remote upload, or ledger promotion. This makes the publisher a second defensive gate even if a package was built elsewhere.

```diff
--- a/scripts/nexualpha-content-publish.mjs	2026-10-12 21:09:10
+++ b/scripts/nexualpha-content-publish.mjs	2026-10-12 21:09:10
@@ -476,8 +476,55 @@
   }
   if (packages.length === 0) throw new Error("No article packages were found in the requested batch");
   return packages;
+}
+
+function parseNewsroomGateOutput(raw) {
+  if (!raw) return { status: "error", publishAllowed: false, reasons: ["empty gate output"] };
+  try {
+    const parsed = JSON.parse(raw);
+    if (!parsed || typeof parsed !== "object") return { status: "error", publishAllowed: false, reasons: ["non-object gate output"] };
+    return { ...parsed, status: parsed.status || "error", publishAllowed: parsed.publishAllowed === true, reasons: parsed.reasons || [] };
+  } catch {
+    return { status: "error", publishAllowed: false, reasons: ["malformed gate output", raw.slice(0, 500)] };
+  }
 }
 
+async function applyNewsroomGate(packages) {
+  const gateScript = process.env.NEXUALPHA_NEWSROOM_GATE;
+  if (!gateScript) throw new Error("NEXUALPHA_NEWSROOM_GATE is required for publisher newsroom gates");
+  const gateHistory = path.join(websitePublicRoot, "content/news-feed-summary.json");
+  const gateLedger = path.join(stateRoot, "article-ledger.jsonl");
+  const gateQueue = path.join(stateRoot, "review-queue");
+  const gateReviews = process.env.NEWSROOM_REVIEW_RECORDS;
+  await mkdir(gateQueue, { recursive: true });
+  const qualified = [];
+  const results = [];
+  for (const item of packages) {
+    const args = [gateScript, item.directory, "--history", gateHistory, "--ledger", gateLedger, "--queue", gateQueue];
+    if (gateReviews) args.push("--reviews", gateReviews);
+    const result = spawnSync(process.execPath, args, {
+      cwd: repoRoot,
+      encoding: "utf8",
+      maxBuffer: 20 * 1024 * 1024,
+    });
+    if (result.error) throw result.error;
+    const parsed = parseNewsroomGateOutput((result.stdout || "").trim());
+    const status = parsed.status === "needs-review" || parsed.legacy === true ? "needs-review" : parsed.status;
+    const entry = { slug: item.manifest.slug, status, publishAllowed: parsed.publishAllowed === true, exitStatus: result.status, reasons: parsed.reasons || [] };
+    results.push(entry);
+    if (result.status === 0 && status === "pass" && parsed.publishAllowed === true && parsed.legacy !== true) {
+      qualified.push(item);
+      continue;
+    }
+    if (result.status === 1 || result.status === 2 || status === "fail" || status === "needs-review" || status === "error") {
+      await appendFile(path.join(gateQueue, "publisher-review-queue.jsonl"), `${JSON.stringify({ ...entry, packageDir: item.directory, stderr: (result.stderr || "").slice(0, 1000), queuedAt: new Date().toISOString() })}\n`);
+      continue;
+    }
+    throw new Error(`Newsroom gate crashed for ${item.manifest.slug}: ${(result.stderr || result.stdout || "").trim()}`);
+  }
+  return { qualified, results };
+}
+
 export async function copyManagedFiles(fromRoot, toRoot, options = {}) {
   const copied = [];
   const skippedMissing = [];
@@ -847,7 +894,15 @@
     const validation = JSON.parse(command(process.execPath, [path.join(repoRoot, "scripts/nexualpha-content-validate.mjs"), batchDir]));
     report.validation = { packageCount: validation.packageCount, validCount: validation.validCount, invalidCount: validation.invalidCount };
     if (validation.invalidCount > 0) throw new Error("Batch validation failed");
-    const packages = await loadBatchPackages(batchDir);
+    let packages = await loadBatchPackages(batchDir);
+    const newsroomGate = await applyNewsroomGate(packages);
+    report.newsroomGate = newsroomGate.results;
+    packages = newsroomGate.qualified;
+    if (packages.length === 0) {
+      report.status = "NO_QUALIFIED_PACKAGES_NEWSROOM_GATE";
+      report.completedAt = new Date().toISOString();
+      return;
+    }
     const publicationResponse = await fetchText(`${publicOrigin}/content/search-publication-report.json?before=${Date.now()}`);
     if (!publicationResponse.ok) throw new Error("REVIEWED_PUBLICATION_REPORT_UNAVAILABLE");
     const legacyRoster = reviewedPublicationRoster(JSON.parse(publicationResponse.body));
```

The publisher patch deliberately does not use `command()` for the gate, because `command()` throws before the caller can inspect stdout/stderr or distinguish exit `1` from exit `2`. `spawnSync` preserves the gate exit code and stdout. Empty or malformed stdout becomes `status:"error", publishAllowed:false`; it is queued and skipped, never treated as pass.

The publish set is mutable: only packages with exit `0`, `status:"pass"`, `publishAllowed:true`, and `legacy!==true` remain in `packages`. Failed, review, legacy, malformed, and error outputs are appended to `state/review-queue/publisher-review-queue.jsonl`. If every package is skipped, the run records `NO_QUALIFIED_PACKAGES_NEWSROOM_GATE`, writes the receipt in the existing `finally` block, and returns before public fetches, local mutation, remote deploy, IndexNow, or ledger promotion.
