import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/verify-cta-transport.py', import.meta.url));
function fixture() {
  return {
    web: { Config: { Env: ['CTA_ANALYTICS_ORIGIN=http://collector-alias:8080', 'PRIVATE_TOKEN=never-display-this'] }, NetworkSettings: { Networks: { 'nexualpha-internal': { NetworkID: 'internal-id' } } } },
    collector: { Name: '/collector-r58', NetworkSettings: { Networks: { 'nexualpha-internal': { NetworkID: 'internal-id', Aliases: ['collector-alias'] } } } },
  };
}
function probe(input) {
  const run = spawnSync('python3', [script, '--fixture'], { input: JSON.stringify(input), encoding: 'utf8' });
  assert.equal(run.error, undefined);
  assert.doesNotMatch(run.stdout + run.stderr, /never-display-this|PRIVATE_TOKEN|http:\/\/collector-alias/);
  return { exit: run.status, body: JSON.parse(run.stdout) };
}
test('CTA transport accepts shared user-defined network with collector-owned origin alias', () => {
  const result = probe(fixture());
  assert.equal(result.exit, 0);
  assert.equal(result.body.status, 'PASS_METADATA');
});
test('CTA transport rejects bridge-only regression despite matching hostname', () => {
  const input = fixture();
  input.web.NetworkSettings.Networks = { bridge: { NetworkID: 'bridge-id' } };
  input.collector.NetworkSettings.Networks = { bridge: { NetworkID: 'bridge-id', Aliases: ['collector-alias'] } };
  assert.equal(probe(input).body.reasonCode, 'CTA_SHARED_USER_NETWORK_MISSING');
});
test('CTA transport rejects absent origin, wrong alias and network identity drift', () => {
  for (const [change, reason] of [
    [input => input.web.Config.Env = [], 'CTA_ORIGIN_MISSING_OR_DUPLICATED'],
    [input => input.collector.NetworkSettings.Networks['nexualpha-internal'].Aliases = ['other'], 'CTA_COLLECTOR_HOSTNAME_NOT_OWNED'],
    [input => input.web.NetworkSettings.Networks['nexualpha-internal'].NetworkID = 'other-id', 'CTA_SHARED_USER_NETWORK_MISSING'],
  ]) {
    const input = fixture(); change(input);
    const result = probe(input); assert.equal(result.exit, 1); assert.equal(result.body.reasonCode, reason);
  }
});

test('CTA transport respects DNS case insensitivity for existing mixed-case aliases', () => {
  const input=fixture();
  input.web.Config.Env=['CTA_ANALYTICS_ORIGIN=http://collector-R42:8080'];
  input.collector.NetworkSettings.Networks['nexualpha-internal'].Aliases=['collector-R42'];
  assert.equal(probe(input).exit,0);
});
