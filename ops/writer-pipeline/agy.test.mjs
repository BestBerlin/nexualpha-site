import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseServers, chooseProject, parseArgs, rpc, conversationIdOf, summarizeTrajectory, readConfig, writeConfig} from './agy.mjs';

test('process discovery excludes CLI children and preserves token only in memory', () => {
  const servers = parseServers(' 12 /app/bin/language_server --csrf_token secret\n 13 /app/bin/language_server agentapi new-conversation hello');
  assert.deepEqual(servers, [{pid: '12', token: 'secret'}]);
});
test('project selection rejects guesses and ambiguity', () => {
  const projects = [{id: 'real-id', environments: [{uri: 'file:///work/writer'}]}];
  assert.equal(chooseProject(projects, '/work/writer'), 'real-id');
  assert.equal(chooseProject(projects, '/work/writer/staging/topic-1'), 'real-id');
  assert.throws(() => chooseProject(projects, '/work/writer-other'));
  assert.throws(() => chooseProject(projects, '/other'));
  assert.throws(() => chooseProject(projects, '/work/writer', 'folder-name'));
  assert.throws(() => chooseProject([...projects, ...projects], '/work/writer'));
});
test('CLI rejects unsupported named models and unbounded timeouts', () => {
  assert.equal(parseArgs(['--model', 'flash', '--output', 'draft', 'write']).model, 'flash');
  assert.throws(() => parseArgs(['--model', 'opus-4.6']));
  assert.throws(() => parseArgs(['--timeout', 'Infinity']));
});
test('RPC is restricted to loopback and errors do not reveal token', async () => {
  await assert.rejects(rpc('https://example.com', 'secret', 'ListProjects'), /loopback/);
  const server = createServer((req, res) => {
    assert.equal(req.headers['x-codeium-csrf-token'], 'test-secret');
    assert.equal(req.url, '/exa.language_server_pb.LanguageServerService/ListProjects');
    res.writeHead(403); res.end('test-secret');
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    await assert.rejects(rpc(`127.0.0.1:${server.address().port}`, 'test-secret', 'ListProjects'), error => {
      assert.equal(error.message.includes('test-secret'), false); return true;
    });
  } finally { await new Promise(done => server.close(done)); }
});
test('new-conversation response shape observed live 2026-10-18 yields the conversation ID', () => {
  assert.equal(conversationIdOf({response: {newConversation: {prompt: 'p', conversationId: 'bb14ebfe-9a5a'}}}), 'bb14ebfe-9a5a');
  assert.equal(conversationIdOf({conversationId: 'flat'}), 'flat');
  assert.equal(conversationIdOf({response: {}}), null);
});
test('trajectory summary reports run status, final text and served model', () => {
  const summary = summarizeTrajectory({status: 'CASCADE_RUN_STATUS_IDLE', trajectory: {steps: [
    {type: 'CORTEX_STEP_TYPE_USER_INPUT', status: 'CORTEX_STEP_STATUS_DONE'},
    {type: 'CORTEX_STEP_TYPE_PLANNER_RESPONSE', status: 'CORTEX_STEP_STATUS_DONE', plannerResponse: {response: 'done'}, metadata: {generatorModel: 'MODEL_PLACEHOLDER_M322', responseModel: 'gemini-3.8-flash-tiered'}},
  ]}});
  assert.equal(summary.status, 'CASCADE_RUN_STATUS_IDLE');
  assert.equal(summary.finalResponse, 'done');
  assert.equal(summary.responseModel, 'gemini-3.8-flash-tiered');
  assert.equal(summary.modelEnum, 'MODEL_PLACEHOLDER_M322');
});
test('project config round-trips and tolerates a missing file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'agy-config-'));
  try {
    assert.deepEqual(readConfig(join(dir, 'missing.json')), {});
    writeConfig({projectId: 'p1', workspace: '/w'}, join(dir, 'agy.json'));
    assert.equal(readConfig(join(dir, 'agy.json')).projectId, 'p1');
  } finally { rmSync(dir, {recursive: true}); }
});
