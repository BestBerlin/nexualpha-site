#!/usr/bin/env node
// Review step for social drafts (Claude only). Writers never call this.
//   social-post.mjs list
//   social-post.mjs show <id>
//   social-post.mjs approve <id> [--text-file edited.txt]   re-validates; reviewer edits allowed
//   social-post.mjs reject <id> --reason "..."
//   social-post.mjs post <id> [--live]       X / Telegram; DRY RUN unless --live
//   social-post.mjs handoff <id>             YouTube: approved script -> video pipeline inbox (no upload)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSocialDraft, TELEGRAM_CHATS, tagsIn } from './social-rules.mjs';
import { findDraft, saveRun, socialRuns, ageHours, STALE_HOURS } from './social-queue.mjs';
import { xClient, weightedLength, costClass } from '../x-poster/x-poster.mjs';

export const POST_DEFAULTS = {
  root: '/Volumes/致态2TB/nx-agents/writers',
  engine: '/Volumes/致态2TB/AEO-Crypto-Factory/deployment/nexualpha-content-engine',
  xEnvFile: path.join(os.homedir(), '.codex/private/x-nexualpha-publisher.env'),
  // Telegram bot token never leaves the prod server: the send runs there over ssh.
  sshHost: 'nexualpha-prod',
  botEnvFile: '/srv/agent/stacks/crypto-telegram-ops/community-poller.env',
  // Social posts come on top of the automatic x-poster (10 plain + 1 link/day on prod) and channel feeds.
  xPerDay: 4, xLinkPerDay: 1, telegramPerChatPerDay: 3,
};
const sgtDay = (t) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date(t));

// @NexuAlpha keys only. X_BERLIN_* (owner's personal account) is never read.
export function loadXCredentials(file) {
  const env = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !m[1].startsWith('X_BERLIN')) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  const c = { consumerKey: env.X_API_KEY || env.X_CONSUMER_KEY, consumerSecret: env.X_API_SECRET || env.X_API_KEY_SECRET || env.X_CONSUMER_SECRET,
    accessToken: env.X_ACCESS_TOKEN, accessSecret: env.X_ACCESS_TOKEN_SECRET || env.X_ACCESS_SECRET };
  if (Object.values(c).some((v) => !v)) throw new Error('X credentials incomplete');
  return c;
}

// Python on the prod host reads the bot token from its env file and posts; message arrives on stdin.
const TG_PY = `import json,sys,urllib.request,urllib.parse
m=json.load(sys.stdin);tok=''
for l in open(sys.argv[1],encoding='utf-8'):
  if l.startswith('COMMUNITY_BOT_TOKEN='):tok=l.split('=',1)[1].strip().strip('"').strip("'")
if not tok:print(json.dumps({'ok':False,'description':'token missing'}));sys.exit(0)
d=urllib.parse.urlencode({'chat_id':m['chat'],'text':m['text'],'parse_mode':'HTML','disable_web_page_preview':'false'}).encode()
try:
  r=json.load(urllib.request.urlopen('https://api.telegram.org/bot'+tok+'/sendMessage',d,timeout=20))
  print(json.dumps({'ok':r.get('ok') is True,'id':(r.get('result') or {}).get('message_id')}))
except urllib.error.HTTPError as e:
  b=json.load(e);print(json.dumps({'ok':False,'status':e.code,'description':str(b.get('description',''))[:200]}))
except Exception as e:print(json.dumps({'ok':False,'ambiguous':True,'description':type(e).__name__}))`;
export function telegramViaSsh({ sshHost, botEnvFile }) {
  return (chat, text) => new Promise((resolve) => {
    const child = spawn('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', sshHost, `python3 -c 'exec(__import__("base64").b64decode("${Buffer.from(TG_PY).toString('base64')}"))' ${botEnvFile}`], { stdio: ['pipe', 'pipe', 'ignore'] });
    let out = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); }, 45000);
    child.stdout.on('data', (b) => { out += b; });
    child.on('close', () => { clearTimeout(timer); try { resolve(JSON.parse(out.trim().split('\n').at(-1))); } catch { resolve({ ok: false, ambiguous: true, description: 'no response' }); } });
    child.stdin.end(JSON.stringify({ chat, text }));
  });
}

async function partnersFor(runDir) {
  try { return JSON.parse(await readFile(path.join(runDir, 'partners.json'), 'utf8')).partners ?? []; } catch { return []; }
}
const posted = (runs, pred) => runs.flatMap((r) => r.data.drafts ?? []).filter((d) => ['posting', 'posted', 'post_unknown'].includes(d.status) && pred(d));

/** Post one approved draft. Dry run unless live. send functions are injectable for tests. */
export async function postDraft(id, { live = false, now = Date.now(), sendX, sendTelegram, log = console.log, ...opts } = {}) {
  const c = { ...POST_DEFAULTS, ...opts };
  const { run, draft } = await findDraft(c.root, id);
  if (draft.channel === 'youtube') throw new Error('YouTube scripts are never posted from here; use handoff');
  if (draft.status !== 'approved') throw new Error(`draft is ${draft.status}; approve it first`);
  if (ageHours(draft, now) > STALE_HOURS) throw new Error(`draft is ${Math.round(ageHours(draft, now))} h old (> ${STALE_HOURS} h); stale news is not posted`);
  const errors = checkSocialDraft(draft, { partners: await partnersFor(run.dir) });
  if (errors.length) throw new Error(`rules failed: ${errors.join('; ')}`);
  const day = sgtDay(now), runs = await socialRuns(c.root);
  const today = (d) => d.postedAt && sgtDay(Date.parse(d.postedAt)) === day;
  if (draft.channel === 'x') {
    const cls = costClass(draft.text);
    if (posted(runs, (d) => d.channel === 'x' && today(d)).length >= c.xPerDay) throw new Error(`X social cap ${c.xPerDay}/day reached`);
    if (cls === 'link' && posted(runs, (d) => d.channel === 'x' && today(d) && costClass(d.text) === 'link').length >= c.xLinkPerDay) throw new Error('X social link cap reached');
  } else if (posted(runs, (d) => d.channel === 'telegram' && d.chat === draft.chat && today(d)).length >= c.telegramPerChatPerDay) throw new Error(`Telegram cap ${c.telegramPerChatPerDay}/day reached for ${draft.chat}`);
  const chat = draft.channel === 'telegram' ? TELEGRAM_CHATS[draft.locale] : null;
  if (draft.channel === 'telegram' && chat !== draft.chat) throw new Error('telegram chat does not match locale');
  const preview = { id, channel: draft.channel, locale: draft.locale, chat, weighted: draft.channel === 'x' ? weightedLength(draft.text) : undefined,
    costClass: draft.channel === 'x' ? costClass(draft.text) : undefined, tags: draft.channel === 'x' ? tagsIn(draft.text) : undefined, text: draft.text };
  if (!live) { log(JSON.stringify({ dryRun: true, ...preview }, null, 2)); return { dryRun: true, ...preview }; }
  // Record intent before the network call; an ambiguous result is never retried automatically.
  draft.status = 'posting'; draft.postedAt = new Date(now).toISOString(); await saveRun(run.file, run.data);
  let result;
  try {
    if (draft.channel === 'x') {
      const client = sendX ? null : xClient(loadXCredentials(c.xEnvFile));
      if (client) await client.verifyAccount(); // @NexuAlpha only
      result = await (sendX ?? ((t) => client.send(t)))(draft.text);
    } else result = await (sendTelegram ?? telegramViaSsh(c))(chat, draft.text);
  } catch (error) { result = { ok: false, ambiguous: true, error: String(error.message).slice(0, 200) }; }
  draft.status = result?.ok ? 'posted' : result?.ambiguous ? 'post_unknown' : 'post_rejected';
  draft.postResult = { id: result?.id ?? null, status: result?.status ?? null, error: result?.error ?? result?.description ?? null };
  if (draft.status === 'post_rejected') delete draft.postedAt;
  await saveRun(run.file, run.data);
  log(JSON.stringify({ id, status: draft.status, ...draft.postResult }));
  return draft;
}

export async function review(cmd, id, { text, reason, now = Date.now(), ...opts } = {}) {
  const c = { ...POST_DEFAULTS, ...opts };
  const { run, draft } = await findDraft(c.root, id);
  if (cmd === 'approve') {
    if (!['needs_review', 'approved'].includes(draft.status)) throw new Error(`cannot approve a ${draft.status} draft`);
    const next = text ? { ...draft, text: text.trim() } : draft;
    const errors = checkSocialDraft(next, { partners: await partnersFor(run.dir) });
    if (errors.length) throw new Error(`rules failed: ${errors.join('; ')}`);
    Object.assign(draft, next, { status: 'approved', reviewedBy: 'claude', reviewedAt: new Date(now).toISOString(), edited: Boolean(text) || draft.edited || false });
  } else if (cmd === 'reject') {
    if (!reason) throw new Error('reject needs --reason');
    Object.assign(draft, { status: 'rejected', reviewedBy: 'claude', reviewedAt: new Date(now).toISOString(), reason });
  } else if (cmd === 'handoff') {
    if (draft.channel !== 'youtube' || draft.status !== 'approved') throw new Error('handoff is for approved YouTube scripts');
    const inbox = path.join(c.root, 'social', 'youtube-approved');
    await mkdir(inbox, { recursive: true });
    await writeFile(path.join(inbox, `${id}.json`), JSON.stringify(draft, null, 2) + '\n');
    Object.assign(draft, { status: 'handed_off', handedOffAt: new Date(now).toISOString() });
  } else throw new Error(`unknown command ${cmd}`);
  await saveRun(run.file, run.data);
  const { refreshQueue } = await import('./write-batch.mjs');
  await refreshQueue({ root: c.root, engine: c.engine });
  return draft;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, id, ...rest] = process.argv.slice(2);
  const flag = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };
  const opts = process.env.SOCIAL_ROOT ? { root: process.env.SOCIAL_ROOT } : {};
  try {
    if (cmd === 'list') {
      for (const r of await socialRuns(opts.root ?? POST_DEFAULTS.root)) for (const d of r.data.drafts ?? []) if (['needs_review', 'approved'].includes(d.status)) console.log(`${d.id}\t${d.status}\t${Math.round(ageHours(d))}h\t${(d.text ?? d.title ?? '').replace(/\s+/g, ' ').slice(0, 90)}`);
    } else if (cmd === 'show') console.log(JSON.stringify((await findDraft(opts.root ?? POST_DEFAULTS.root, id)).draft, null, 2));
    else if (cmd === 'post') await postDraft(id, { ...opts, live: rest.includes('--live') });
    else if (['approve', 'reject', 'handoff'].includes(cmd)) {
      const file = flag('--text-file');
      console.log(JSON.stringify(await review(cmd, id, { ...opts, reason: flag('--reason'), text: file ? await readFile(file, 'utf8') : undefined }), null, 2));
    } else throw new Error('usage: social-post.mjs list | show <id> | approve <id> [--text-file f] | reject <id> --reason r | post <id> [--live] | handoff <id>');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
