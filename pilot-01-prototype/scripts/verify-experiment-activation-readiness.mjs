import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProductionServer } from '../server.mjs';
import { experimentRegistry } from '../src/data/experiment-registry.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(process.env.EXPERIMENT_READINESS_REPORT || 'docs/evidence/four-week-growth-20260927/experiment-activation-runtime-20260928.json');
const origin = 'https://nexualpha.com';
const experiment = { ...experimentRegistry.br_compare_entry_v1, status: 'ACTIVE' };
const registry = { br_compare_entry_v1: experiment };
const temp = await mkdtemp(path.join(os.tmpdir(), 'nexualpha-experiment-runtime-'));
const dataFile = path.join(temp, 'production.jsonl');
const smokeFile = path.join(temp, 'smoke.jsonl');
const env = { NODE_ENV: 'production', CTA_ENVIRONMENT: 'production', CTA_ALLOWED_ORIGIN: origin, CTA_DATA_FILE: dataFile, CTA_SMOKE_DATA_FILE: smokeFile };
const worker = { fetch: async () => new Response('candidate-ok') };
const session = randomUUID();
const common = { version: 2, session, page: '/br', locale: 'pt-BR', source: 'direct', market: 'BR', product: 'spot', device: 'mobile', experiment: experiment.id, variant: experiment.control.id };
const events = [
  { ...common, type: 'page_view', eventId: randomUUID() },
  { ...common, type: 'decision_select', eventId: randomUUID(), decision: 'compare_first', placement: 'br-intent-switch' },
  { ...common, type: 'cta_visible', eventId: randomUUID(), platform: 'binance', placement: 'br-primary' },
  { ...common, type: 'referral_click', eventId: randomUUID(), platform: 'binance', placement: 'br-primary' },
  { ...common, type: 'outbound_handoff', eventId: randomUUID(), platform: 'binance', placement: 'br-primary' },
];

async function start() {
  const server = await createProductionServer({ env, appRoot: projectRoot, worker, experimentRegistry: registry });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}
async function close(server) { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
async function post(base, body, headers = {}) {
  return fetch(`${base}/api/analytics/cta`, { method: 'POST', headers: { origin, 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0', ...headers }, body: JSON.stringify(body) });
}
async function health(base, route) { const response = await fetch(`${base}${route}`); return { status: response.status, body: await response.json() }; }

let runtime;
try {
  runtime = await start();
  const live = await health(runtime.base, '/health/live');
  const webReady = await health(runtime.base, '/health/web-ready');
  const ctaReady = await health(runtime.base, '/health/cta-ready');
  const dependencies = await health(runtime.base, '/health/dependencies');
  const acceptedStatuses = [];
  for (const event of events) acceptedStatuses.push((await post(runtime.base, event)).status);
  const rejected = {
    unregistered: (await post(runtime.base, { ...events[0], eventId: randomUUID(), session: randomUUID(), experiment: 'missing_experiment' })).status,
    wrongVariant: (await post(runtime.base, { ...events[0], eventId: randomUUID(), session: randomUUID(), variant: 'other' })).status,
    wrongRoute: (await post(runtime.base, { ...events[0], eventId: randomUUID(), session: randomUUID(), page: '/' })).status,
    wrongMarket: (await post(runtime.base, { ...events[0], eventId: randomUUID(), session: randomUUID(), market: 'JP' })).status,
    partialContext: (await post(runtime.base, (() => { const row = { ...events[0], eventId: randomUUID(), session: randomUUID() }; delete row.variant; return row; })())).status,
    variantConflict: (await post(runtime.base, { ...events[1], eventId: randomUUID(), variant: experiment.treatment.id })).status,
    wrongOrigin: (await post(runtime.base, { ...events[0], eventId: randomUUID(), session: randomUUID() }, { origin: 'https://evil.example' })).status,
  };
  await close(runtime.server);
  runtime = await start();
  const duplicateAfterRestart = (await post(runtime.base, events[0])).status;
  await close(runtime.server); runtime = null;
  const rows = (await readFile(dataFile, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
  const safeKeys = [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();
  const forbiddenKeys = ['email','ip','commission','registration','kyc','deposit','trade','rawUrl','query','accountId'];
  const partnerRegistrySha256 = await sha256File(path.join(projectRoot, 'src/data/partner-registry.js'));
  const activationGate = buildActivationGate({ experiment, rows, partnerRegistrySha256 });
  const report = {
    generatedAt: new Date().toISOString(),
    experiment: experiment.id,
    candidateStatus: 'ACTIVE_TEST_ONLY',
    productionRegistryStatus: experimentRegistry.br_compare_entry_v1.status,
    activationGate,
    health: { live, webReady, ctaReady, dependencies },
    acceptedStatuses,
    rejected,
    duplicateAfterRestart,
    persistedRows: rows.length,
    persistedTypes: rows.map((row) => row.type).sort(),
    environmentValues: [...new Set(rows.map((row) => row.environment))],
    receivedAtPresent: rows.every((row) => typeof row.receivedAt === 'string'),
    experimentContextExact: rows.every((row) => row.experiment === experiment.id && row.variant === experiment.control.id),
    safeKeys,
    forbiddenKeysPresent: forbiddenKeys.filter((key) => safeKeys.includes(key)),
    pass: live.status === 200 && webReady.status === 200 && ctaReady.status === 200
      && dependencies.body?.dependencies?.cta?.ready === true
      && acceptedStatuses.every((status) => status === 204)
      && Object.entries(rejected).every(([key, status]) => status === (key === 'variantConflict' ? 409 : key === 'wrongOrigin' ? 403 : 400))
      && duplicateAfterRestart === 204 && rows.length === events.length
      && rows.every((row) => row.environment === 'production')
      && activationGate.readyToActivate === false
      && activationGate.candidateConfig.status === 'CANDIDATE_CONFIG_ONLY'
      && activationGate.boundaries.minimumSamplePerVariant === 200
      && activationGate.boundaries.exposureWindowDays === 14
      && activationGate.boundaries.attributionMaturityDays === 14
      && forbiddenKeys.filter((key) => safeKeys.includes(key)).length === 0,
    boundary: 'This proves candidate first-party event integrity only. It does not prove registration, KYC, deposit, trade, commission or conversion lift.',
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ pass: report.pass, output, persistedRows: report.persistedRows, rejected: report.rejected }, null, 2));
  if (!report.pass) process.exitCode = 1;
} finally {
  if (runtime?.server) await close(runtime.server).catch(() => {});
  await rm(temp, { recursive: true, force: true });
}

async function sha256File(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

function buildActivationGate({ experiment, rows, partnerRegistrySha256 }) {
  const observedByVariant = new Map();
  for (const row of rows) {
    if (row.type !== 'page_view') continue;
    const current = observedByVariant.get(row.variant) || new Set();
    current.add(row.session);
    observedByVariant.set(row.variant, current);
  }
  const variants = [experiment.control.id, experiment.treatment.id].map((variant) => ({
    variant,
    measurableSessions: observedByVariant.get(variant)?.size || 0,
    sampleSufficient: (observedByVariant.get(variant)?.size || 0) >= experiment.minimumSamplePerVariant,
  }));
  const blockers = [];
  if (experimentRegistry.br_compare_entry_v1.status !== 'DESIGNED') blockers.push('production_registry_not_designed');
  if (experiment.activationGate?.status !== 'CANDIDATE_CONFIG_ONLY') blockers.push('candidate_config_missing');
  if (experiment.activationGate?.readyToActivate !== false) blockers.push('candidate_config_attempts_activation');
  if (!variants.every((row) => row.sampleSufficient)) blockers.push('minimum_sample_per_variant_not_met');
  blockers.push('real_production_exposure_window_not_started');
  blockers.push('attribution_maturity_window_not_elapsed');
  return {
    readyToActivate: false,
    decision: 'DO_NOT_ACTIVATE',
    blockers,
    candidateConfig: {
      status: experiment.activationGate?.status || null,
      decision: experiment.activationGate?.decision || null,
      plannedAllocation: experiment.activationGate?.plannedAllocation || null,
      requiredChecks: experiment.activationGate?.requiredChecks || [],
    },
    boundaries: {
      minimumSamplePerVariant: experiment.minimumSamplePerVariant,
      exposureWindowDays: experiment.exposureWindowDays,
      attributionMaturityDays: experiment.attributionMaturityDays,
      winnerPolicy: experiment.winnerPolicy,
    },
    observedCandidateSmoke: {
      variants,
      persistedRows: rows.length,
      measuredOutcomes: [...new Set(rows.map((row) => row.type))].sort(),
    },
    protectedPartnerRoutes: {
      partnerRegistrySha256,
      invariantTest: 'tests/invitation-link-invariants.test.mjs',
      note: 'This readiness report hashes the partner registry for audit continuity and does not modify or normalize invitation links.',
    },
    boundary: 'Candidate runtime smoke is not real production exposure, not a conversion-lift result and not authorization to activate traffic.',
  };
}
