import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const runFile = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('experiment activation readiness writes an auditable non-activation gate', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-experiment-gate-'));
  try {
    const reportPath = path.join(dir, `${randomUUID()}.json`);
    const result = await runFile(process.execPath, ['scripts/verify-experiment-activation-readiness.mjs'], {
      cwd: root,
      env: { ...process.env, EXPERIMENT_READINESS_REPORT: reportPath },
      timeout: 20000,
      maxBuffer: 1024 * 1024,
    });
    const cli = JSON.parse(result.stdout);
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const partnerRegistrySource = await readFile(path.join(root, 'src/data/partner-registry.js'));
    const partnerRegistrySha256 = createHash('sha256').update(partnerRegistrySource).digest('hex');

    assert.equal(cli.pass, true);
    assert.equal(report.pass, true);
    assert.equal(report.productionRegistryStatus, 'DESIGNED');
    assert.equal(report.activationGate.readyToActivate, false);
    assert.equal(report.activationGate.decision, 'DO_NOT_ACTIVATE');
    assert.equal(report.activationGate.candidateConfig.status, 'CANDIDATE_CONFIG_ONLY');
    assert.equal(report.activationGate.boundaries.minimumSamplePerVariant, 200);
    assert.equal(report.activationGate.boundaries.exposureWindowDays, 14);
    assert.equal(report.activationGate.boundaries.attributionMaturityDays, 14);
    assert.ok(report.activationGate.blockers.includes('minimum_sample_per_variant_not_met'));
    assert.ok(report.activationGate.blockers.includes('real_production_exposure_window_not_started'));
    assert.ok(report.activationGate.blockers.includes('attribution_maturity_window_not_elapsed'));
    assert.equal(report.activationGate.protectedPartnerRoutes.partnerRegistrySha256, partnerRegistrySha256);
    assert.equal(report.forbiddenKeysPresent.length, 0);
    assert.match(report.activationGate.boundary, /not a conversion-lift result/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
