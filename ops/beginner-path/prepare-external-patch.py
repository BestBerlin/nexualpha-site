"""Read the out-of-scope files and prepare a patch without modifying them."""
import difflib
import json
from pathlib import Path
root = Path(__file__).resolve().parent
seeds = json.loads((root / 'keyword-seeds.json').read_text())
radar = Path('/Volumes/致态2TB/nx-agents/keywords/radar/radar.mjs')
runbook = Path('/Users/bestberlin/Documents/AEO Crypto Factory/deployment/nexualpha-content-engine/CLAUDE-CONTENT-RUNBOOK.md')
before = radar.read_text()
after = before.replace('// ---------------------------------------------------------------- constants', '// Hand-authored search seeds, not observed demand. Neutral locales stay informational.\nconst BEGINNER_SEEDS = '+json.dumps(seeds, ensure_ascii=False)+';\n// ---------------------------------------------------------------- constants', 1)
after = after.replace('  let total = commercial + fresh + ability;', '  let total = commercial + fresh + ability + (r.lanes.has("beginner") ? 10 : 0);', 1)
after = after.replace('    r.sources.add(o.source);', '    if (o.beginner) r.lanes.add("beginner");\n    r.sources.add(o.source);', 1)
after = after.replace('  // 2-4. autocomplete seeds', '''  // Beginner queries are labelled seeds; no measured demand or conversion is invented.
  for (const [market, queries] of Object.entries(BEGINNER_SEEDS)) for (const q of queries) {
    add({ source: "beginner_seed", market, q, intent: NEUTRAL_SIGNUP.has(market) ? "explainer" : classifyIntent(q), beginner: true, evidence: "editorial beginner-intent seed (unmeasured)" });
  }
  // 2-4. autocomplete seeds''', 1)
# Locale codes already use the market as the default language; preserve existing geo/neutral exclusion gates.
assert after != before and 'r.lanes.has("beginner") ? 10' in after
(root / 'radar.preview.mjs').write_text(after)
patch = ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile=str(radar), tofile=str(radar), n=0))
before = runbook.read_text()
needle = '### §0a PRIORITY QUEUE'
index = before.index('\n', before.index(needle))
after = before[:index+1] + '**Beginner rotation (2026-10-14).** In one of every two runs, prefer an unused, non-duplicate radar query tagged `beginner` for Article A. Use the run ledger to alternate; keep neutral locales information-only and retain every source and publication gate below.\n' + before[index+1:]
patch += ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile=str(runbook), tofile=str(runbook), n=0))
(root / 'external-changes.patch').write_text(patch)
print('Prepared external-changes.patch; external files unchanged.')
