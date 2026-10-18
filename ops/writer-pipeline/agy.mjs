#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, existsSync, statSync, mkdirSync, renameSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {homedir} from 'node:os';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';

export const MODEL_ALIASES = ['flash_lite', 'flash', 'pro'];
const service = '/exa.language_server_pb.LanguageServerService/';
function parseJSON(text) {
  try { return JSON.parse(text); } catch { throw new Error('Antigravity returned invalid JSON'); }
}
function command(file, args, env = process.env) {
  try {
    return execFileSync(file, args, {env, encoding: 'utf8', timeout: 30000,
      maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
  } catch {
    // Do not expose process arguments, environment or raw tool errors.
    throw new Error(`Command failed or timed out: ${file.split('/').pop()}`);
  }
}
export function parseServers(text) {
  return text.split('\n').flatMap(line => {
    if (!line.includes('/language_server ') || line.includes(' agentapi ')) return [];
    const pid = line.match(/^\s*(\d+)/)?.[1];
    const token = line.match(/--csrf_token(?:=|\s+)([^\s]+)/)?.[1];
    return pid && token ? [{pid, token}] : [];
  });
}
// Project IDs are stable; the CSRF token and port are not and are never persisted.
export const CONFIG_PATH = process.env.AGY_CONFIG || join(homedir(), '.config', 'nexualpha', 'agy.json');
export const DEFAULT_WORKSPACE = '/Users/bestberlin/Documents/ChatGPT/Crypto聚合';
export function readConfig(file = CONFIG_PATH) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return {}; }
}
export function writeConfig(config, file = CONFIG_PATH) {
  mkdirSync(dirname(file), {recursive: true});
  writeFileSync(`${file}.tmp`, JSON.stringify(config, null, 2) + '\n', {mode: 0o600});
  renameSync(`${file}.tmp`, file);
}
// agentapi new-conversation prints {"response":{"newConversation":{"prompt":...,"conversationId":...}}}.
export function conversationIdOf(started) {
  const roots = [started, started?.response, started?.response?.newConversation, started?.newConversation];
  for (const r of roots) {
    const id = r?.conversationId ?? r?.conversation_id ?? r?.cascadeId ?? r?.cascade_id;
    if (typeof id === 'string' && id) return id;
  }
  return null;
}
// Summarise GetCascadeTrajectory: run status, final planner text and model actually used.
export function summarizeTrajectory(t) {
  const steps = t?.trajectory?.steps ?? [];
  const responses = steps.filter(s => s.type === 'CORTEX_STEP_TYPE_PLANNER_RESPONSE').map(s => s.plannerResponse?.modifiedResponse ?? s.plannerResponse?.response).filter(Boolean);
  const text = JSON.stringify(t ?? {});
  const responseModel = [...text.matchAll(/"responseModel":"([^"]+)"/g)].map(m => m[1]).at(-1) ?? null;
  const modelEnum = [...text.matchAll(/"generatorModel":"([^"]+)"/g)].map(m => m[1]).at(-1) ?? null;
  const errors = steps.filter(s => /ERROR|CANCELED/.test(s.status ?? '')).length;
  return {status: t?.status ?? 'CASCADE_RUN_STATUS_UNSPECIFIED', steps: steps.length, errors, finalResponse: responses.at(-1) ?? '', responseModel, modelEnum};
}
export async function rpc(address, token, method, body = {}, timeoutMs = 5000) {
  const url = new URL(address.includes('://') ? address : `http://${address}`);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    throw new Error('Language server must use a loopback HTTP address');
  }
  url.pathname = service + method;
  const response = await fetch(url, {method: 'POST', signal: AbortSignal.timeout(timeoutMs),
    headers: {'Content-Type': 'application/json', 'X-Codeium-Csrf-Token': token}, body: JSON.stringify(body)});
  if (!response.ok) throw new Error(`Language server ${method} returned HTTP ${response.status}`);
  return parseJSON(await response.text());
}
export function chooseProject(projects, cwd, explicit) {
  const idOf = project => project.id ?? project.projectId ?? project.project_id;
  if (explicit) {
    if (projects.some(project => idOf(project) === explicit)) return explicit;
    throw new Error('Configured project ID is not present in ReadProjects');
  }
  const normalized = resolve(cwd);
  const strings = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
  const candidates = projects.filter(project => strings(project).some(value => {
    let folder;
    try { folder = value.startsWith('file://') ? fileURLToPath(value) : value.startsWith('/') ? decodeURI(value) : null; }
    catch { return false; }
    if (!folder) return false;
    const root = resolve(folder);
    return root !== '/' && (normalized === root || normalized.startsWith(`${root}/`));
  }));
  if (candidates.length !== 1) throw new Error('Cannot uniquely match current directory to an Antigravity project; set ANTIGRAVITY_PROJECT_ID from ListProjects');
  return idOf(candidates[0]);
}
export async function discover(env = process.env, cwd = process.cwd(), options = {}) {
  let address = env.ANTIGRAVITY_LS_ADDRESS;
  let token = env.ANTIGRAVITY_CSRF_TOKEN;
  if (!address || !token) {
    let servers;
    try { servers = parseServers(command('/bin/ps', ['-axo', 'pid=,command='])); }
    catch { throw new Error('Process discovery is unavailable; use the Antigravity integrated terminal environment (ANTIGRAVITY_LS_ADDRESS, ANTIGRAVITY_CSRF_TOKEN, ANTIGRAVITY_PROJECT_ID)'); }
    const connections = [];
    for (const server of servers) {
      const ports = command('/usr/sbin/lsof', ['-nP', '-a', '-p', server.pid, '-iTCP', '-sTCP:LISTEN']);
      for (const match of ports.matchAll(/127\.0\.0\.1:(\d+) \(LISTEN\)/g)) {
        const candidate = `127.0.0.1:${match[1]}`;
        if (address && address.replace(/^http:\/\//, '') !== candidate) continue;
        try {
          await rpc(candidate, token || server.token, 'ListProjects');
          connections.push({address: candidate, token: token || server.token});
        } catch { /* HTTPS/gRPC ports and stale servers are excluded. */ }
      }
    }
    if (connections.length !== 1) throw new Error('Cannot uniquely discover an HTTP language server; set Antigravity environment explicitly');
    ({address, token} = connections[0]);
  }
  const listing = await rpc(address, token, 'ListProjects');
  const ids = listing.projectIds ?? listing.project_ids ?? [];
  if (!ids.length) throw new Error('Antigravity ListProjects returned no project IDs');
  const details = await rpc(address, token, 'ReadProjects', {ids});
  const projects = details.projects ?? [];
  // Resolution order: explicit env, cached config (cwd-independent), cwd, default workspace.
  const cached = options.refresh ? {} : readConfig(options.configPath);
  let project = null, source = null;
  if (env.ANTIGRAVITY_PROJECT_ID) { project = chooseProject(projects, cwd, env.ANTIGRAVITY_PROJECT_ID); source = 'env'; }
  else if (cached.projectId && ids.includes(cached.projectId)) { project = cached.projectId; source = 'config'; }
  else {
    for (const dir of [cwd, cached.workspace, DEFAULT_WORKSPACE].filter(Boolean)) {
      try { project = chooseProject(projects, dir); source = 'workspace'; break; } catch { /* try next */ }
    }
    if (!project) throw new Error('Cannot match an Antigravity project; run from the project folder once or set ANTIGRAVITY_PROJECT_ID');
  }
  if (source !== 'config' && options.cache !== false) {
    writeConfig({projectId: project, workspace: cached.workspace ?? DEFAULT_WORKSPACE, resolvedAt: new Date().toISOString()}, options.configPath);
  }
  return {...env, ANTIGRAVITY_LS_ADDRESS: address, ANTIGRAVITY_CSRF_TOKEN: token, ANTIGRAVITY_PROJECT_ID: project, AGY_PROJECT_SOURCE: source};
}
export function parseArgs(args) {
  const options = {model: 'pro', timeout: 600, prompt: []};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (['--models', '--diagnose', '--help', '--json', '--refresh-project'].includes(arg)) options[arg.slice(2)] = true;
    else if (['--model', '--output', '--prompt-file', '--timeout'].includes(arg)) {
      const value = args[++i]; if (!value) throw new Error(`Missing ${arg} value`);
      options[arg.slice(2)] = value;
    } else if (arg.startsWith('--')) throw new Error(`Unknown option ${arg}`);
    else options.prompt.push(arg);
  }
  if (!MODEL_ALIASES.includes(options.model)) throw new Error('Model must be flash_lite, flash or pro');
  options.timeout = Number(options.timeout);
  if (!Number.isFinite(options.timeout) || options.timeout < 1 || options.timeout > 3600) throw new Error('Timeout must be 1..3600 seconds');
  return options;
}
const sleep = ms => new Promise(done => setTimeout(done, ms));
async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('agy --model pro|flash|flash_lite --output PATH [--prompt-file PATH] [--timeout SECONDS] [--json] PROMPT\nagy --models | --diagnose [--refresh-project]'); return;
  }
  if (options.models) {
    console.log(JSON.stringify({aliases: MODEL_ALIASES, observed: {flash: 'gemini-3.8-flash-tiered (MODEL_PLACEHOLDER_M322, 2026-10-18)', pro: 'see responseModel in --json output'}})); return;
  }
  const env = await discover(process.env, process.cwd(), {refresh: options['refresh-project']});
  if (options.diagnose) { console.log(JSON.stringify({available: true, projectValidated: true, projectSource: env.AGY_PROJECT_SOURCE, config: CONFIG_PATH})); return; }
  if (!options.output) throw new Error('--output is required so completion can be verified without guessing metadata state');
  const output = resolve(options.output);
  if (!existsSync(dirname(output))) throw new Error('Output parent directory must already exist');
  if (existsSync(output)) throw new Error('Output already exists; refusing to accept stale output');
  const marker = `${output}.${randomUUID()}.complete`;
  const prompt = options['prompt-file'] ? readFileSync(options['prompt-file'], 'utf8') : options.prompt.join(' ');
  if (!prompt.trim()) throw new Error('Prompt is required');
  const instruction = `${prompt}\n\nReturn the complete requested text by writing it to ${JSON.stringify(output)} with your file-writing tool. Do not publish, deploy, commit, or change other project files. After closing that nonempty file, as your LAST action write exactly AGY_COMPLETE to ${JSON.stringify(marker)}. The marker is a completion receipt, not review approval.`;
  const binary = env.AGY_AGENTAPI || `${env.HOME}/.gemini/antigravity/bin/agentapi`;
  const started = parseJSON(command(binary, ['new-conversation', `--model=${options.model}`, '--title=Writer draft (needs review)', instruction], env));
  if (started.error) throw new Error('Antigravity rejected new-conversation; inspect its UI without exposing tokens');
  const id = conversationIdOf(started);
  if (!id) throw new Error('Unrecognized new-conversation response; no conversation ID');
  const address = env.ANTIGRAVITY_LS_ADDRESS, token = env.ANTIGRAVITY_CSRF_TOKEN;
  const done = () => existsSync(marker) && readFileSync(marker, 'utf8').trim() === 'AGY_COMPLETE' && existsSync(output) && statSync(output).size > 0;
  const deadline = Date.now() + options.timeout * 1000;
  let summary = {status: 'CASCADE_RUN_STATUS_UNSPECIFIED'}, idleSeen = 0, metadataChecked = false;
  while (Date.now() < deadline) {
    await sleep(3000);
    if (!metadataChecked) {
      const metadata = parseJSON(command(binary, ['get-conversation-metadata', id], env));
      if (metadata.error || !metadata.response?.conversationMetadata) throw new Error('Antigravity metadata lookup failed');
      metadataChecked = true;
    }
    try { summary = summarizeTrajectory(await rpc(address, token, 'GetCascadeTrajectory', {cascadeId: id}, 30000)); } catch { /* transient; keep polling */ }
    if (done() && summary.status !== 'CASCADE_RUN_STATUS_RUNNING' && summary.status !== 'CASCADE_RUN_STATUS_BUSY') break;
    if (summary.status !== 'CASCADE_RUN_STATUS_IDLE') idleSeen = 0;
    // The run went idle without a receipt: the agent finished without writing the file.
    if (summary.status === 'CASCADE_RUN_STATUS_IDLE' && summary.steps > 1 && !done() && ++idleSeen >= 3) {
      throw new Error(`Antigravity conversation ${id} finished without a verified output (${summary.errors} error steps)`);
    }
  }
  if (!done()) {
    try { await rpc(address, token, 'CancelCascadeInvocation', {cascadeId: id}); } catch { /* best effort */ }
    throw new Error(`Antigravity timed out without a verified output; cancel requested for conversation ${id}. Do not reuse its output path.`);
  }
  try { (await import('node:fs')).unlinkSync(marker); } catch { /* receipt cleanup is optional */ }
  if (options.json) console.log(JSON.stringify({output, conversationId: id, alias: options.model, responseModel: summary.responseModel, modelEnum: summary.modelEnum, status: summary.status}));
  else console.log(output);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const token = process.env.ANTIGRAVITY_CSRF_TOKEN;
    const message = token ? error.message.split(token).join('[REDACTED]') : error.message;
    console.error(`agy: ${message}`); process.exitCode = 1;
  });
}
