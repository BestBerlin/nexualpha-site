// Social draft storage + REVIEW-QUEUE sections (one per channel). No network, no posting.
// Layout: <root>/social/<SGT-date>/<UTC-run>-social/drafts.json  { id, createdAt, status, drafts: [...] }
import { readFile, writeFile, readdir, rename } from 'node:fs/promises';
import path from 'node:path';

export const STALE_HOURS = 18; // X/Telegram drafts older than this are not posted (news moves on)
export const QUEUE_HOURS = 36; // older needs_review drafts drop out of the queue as expired
export const CHANNEL_TITLES = Object.freeze({ x: 'X drafts (@NexuAlpha)', telegram: 'Telegram channel drafts', youtube: 'YouTube Shorts scripts (scripts only; video/voice pipeline is separate)' });

async function dirs(dir) {
  try { return (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => path.join(dir, e.name)); }
  catch (e) { if (e.code === 'ENOENT') return []; throw e; }
}
export async function socialRuns(root) {
  const runs = [];
  for (const date of await dirs(path.join(root, 'social'))) for (const run of await dirs(date)) {
    if (!run.endsWith('-social')) continue;
    try { runs.push({ dir: run, file: path.join(run, 'drafts.json'), data: JSON.parse(await readFile(path.join(run, 'drafts.json'), 'utf8')) }); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return runs.sort((a, b) => String(b.data.createdAt).localeCompare(String(a.data.createdAt)));
}
export async function saveRun(file, data) {
  const tmp = `${file}.tmp`; await writeFile(tmp, JSON.stringify(data, null, 2) + '\n'); await rename(tmp, file);
}
export async function findDraft(root, id) {
  for (const run of await socialRuns(root)) {
    const draft = run.data.drafts?.find((d) => d.id === id);
    if (draft) return { run, draft };
  }
  throw new Error(`draft ${id} not found`);
}
export const ageHours = (draft, now = Date.now()) => (now - Date.parse(draft.createdAt)) / 3600000;
const oneLine = (s, n = 110) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, n);

// Markdown sections for REVIEW-QUEUE.md. Lists needs_review and approved-but-unposted drafts per channel.
export async function socialSections(root, now = Date.now()) {
  const rows = { x: [], telegram: [], youtube: [] };
  for (const run of await socialRuns(root)) {
    for (const d of run.data.drafts ?? []) {
      if (!rows[d.channel] || !['needs_review', 'approved'].includes(d.status)) continue;
      if (d.status === 'needs_review' && ageHours(d, now) > QUEUE_HOURS) continue;
      const stale = d.channel !== 'youtube' && ageHours(d, now) > STALE_HOURS ? ' (stale, do not post)' : '';
      const what = d.channel === 'youtube' ? d.title : d.text;
      rows[d.channel].push(`- [ ] ${d.id} — ${d.locale}${d.chat ? ` ${d.chat}` : ''} — ${d.status}${stale} — writer ${d.writer ?? '?'} — ${oneLine(what)}`);
    }
  }
  const out = ['', '# Social drafts awaiting review', '', 'Writers draft, Claude reviews: `node /Volumes/致态2TB/nx-agents/writers/social-post.mjs show|approve|reject|post|handoff <id>` (post is a dry run unless `--live`). Rules: social-rules.mjs.', ''];
  for (const ch of ['x', 'telegram', 'youtube']) out.push(`## ${CHANNEL_TITLES[ch]}`, '', ...(rows[ch].length ? rows[ch] : ['- (none)']), '');
  return out.join('\n');
}
