import { pathToFileURL } from 'node:url';
import { measure, saveReport, proposalTable, defaultDir } from './measure.mjs';
import { verify } from './verify.mjs';
import { readOverrides, writeJson, overridesFile, applyProposals } from './overrides.mjs';
export async function run({ apply = false, dir = process.env.SEO_AUTOPILOT_DIR || defaultDir } = {}) {
  const report = await measure({ dir });
  const original = await readOverrides();
  const verified = await verify(report, original, { dir });
  const result = applyProposals(report.targets, verified, report.date);
  report.application = { mode: apply ? 'apply' : 'dry-run', applied: apply ? result.applied : [], proposed: result.applied, rejected: result.rejected, pendingReverts: Object.keys(verified).filter((p) => verified[p].revert) };
  if (apply) await writeJson(overridesFile, result.overrides);
  await saveReport(report, dir);
  console.log(proposalTable(report.targets));
  console.log(JSON.stringify(report.application));
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.slice(2).some((arg) => arg !== '--apply')) throw new Error('Usage: node ops/seo-autopilot/run.mjs [--apply]');
  run({ apply: process.argv.includes('--apply') }).catch(() => { console.error('SEO autopilot failed; report may be incomplete. Check GSC credentials/network. No production writes performed.'); process.exitCode = 1; });
}
