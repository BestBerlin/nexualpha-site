#!/opt/homebrew/bin/node
import { mkdir, writeFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_OUTPUT = '/Volumes/致态2TB/nx-agents/analytics';
export function localDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function previousDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(`${day}T00:00:00Z`).toISOString().slice(0,10) !== day) throw new Error('Invalid date');
  return new Date(Date.parse(`${day}T00:00:00Z`) - 86400000).toISOString().slice(0,10);
}
export function aeoDue(day, force = false) { return force || new Date(`${day}T00:00:00Z`).getUTCDay() === 1; }

export async function runNightly({ outputDir = DEFAULT_OUTPUT, runDate = localDay(), forceAeo = false, runners } = {}) {
  const date = previousDay(runDate);
  if (path.resolve(outputDir).startsWith('/Volumes/致态2TB/')) {
    const [volume, volumesRoot] = await Promise.all([stat('/Volumes/致态2TB'), stat('/Volumes')]);
    if (!volume.isDirectory() || volume.dev === volumesRoot.dev) throw new Error('External SSD is not mounted');
  }
  await mkdir(outputDir, { recursive: true, mode: 0o700 });
  // A crashed process leaves the lock in place: inspect before removing; never run two pulls concurrently.
  const lock = path.join(outputDir, '.nightly-lock');
  try { await mkdir(lock); } catch (error) { if (error.code === 'EEXIST') throw new Error('Nightly lock exists; inspect the previous run before removing it'); throw error; }
  try {
    await writeFile(path.join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    runners ??= {
      umami: (await import('./umami.mjs')).runUmami,
      search: (await import('./search.mjs')).runSearch,
      aeo: (await import('./aeo.mjs')).runAeo,
    };
    const results = {};
    let umamiMetrics = null;
    let trafficReport = '';
    for (const name of ['umami', 'search', ...(aeoDue(runDate, forceAeo) ? ['aeo'] : [])]) {
      try {
        const result = await runners[name]({ date: name === 'aeo' ? runDate : date, outputDir });
        const reports = name === 'umami' ? [`umami/${date}.json`, `umami/${date}.md`] : name === 'search' ? [`search-${date}.json`, `content-tasks-${date}.json`] : [`aeo-${runDate}.json`, `monday-${result.week}.md`];
        results[name] = { status: result?.status ?? 'completed', reports };
        if (name === 'umami') {
          umamiMetrics = result?.metrics ?? null;
          if (result?.source === 'umami') trafficReport = (await import('./umami.mjs')).umamiChineseReport(result);
        }
      } catch {
        // Do not serialize exception strings: network errors can contain credential-bearing URLs.
        results[name] = { status: 'failed', reason: 'COLLECTOR_FAILED_REVIEW_PRIVATE_CONFIGURATION_AND_CONNECTIVITY' };
      }
    }
    if (!results.aeo) results.aeo = { status: 'not_scheduled', next: 'Monday 06:30 Asia/Shanghai; --aeo performs a recovery run' };
    const manifest = { generatedAt: new Date().toISOString(), runDate, date, timezone: 'Asia/Shanghai', results, umamiMetrics, evidenceBoundary: 'See collector reports for availability and coverage; completed does not mean every source succeeded.' };
    await mkdir(path.join(outputDir, 'daily'), { recursive: true });
    await writeFile(path.join(outputDir, 'daily', `${date}.json`), `${JSON.stringify(manifest,null,2)}\n`, { mode: 0o600 });
    await writeFile(path.join(outputDir, 'daily', `${date}.md`), `# 增长测量日报 ${date}\n\n运行日期：${runDate}（Asia/Shanghai），统计前一完整自然日。\n\n${Object.entries(results).map(([name,value]) => `- ${name}: ${value.status}；${(value.reports || []).join('、') || value.reason || value.next}。`).join('\n')}\n\n未知、缺失、机器人疑似流量不能当作真实人类访问；搜索代理结果不能当作 ChatGPT 或 Perplexity 引用。\n\n${trafficReport}`, { mode: 0o600 });
    return manifest;
  } finally { await rm(lock, { recursive: true, force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const value = (flag) => { const index = args.indexOf(flag); if (index < 0) return undefined; if (!args[index+1] || args[index+1].startsWith('--')) throw new Error(`Missing ${flag} value`); return args[index+1]; };
  try {
    const result = await runNightly({ outputDir: value('--output-dir'), runDate: value('--run-date'), forceAeo: args.includes('--aeo') });
    console.log(JSON.stringify({ runDate: result.runDate, date: result.date, results: result.results }));
    if (Object.values(result.results).some(item => ['failed','blocked','unavailable','partial'].includes(item.status))) process.exitCode = 2;
  } catch { console.error('Nightly run failed; check output path, date and lock. No credentials logged.'); process.exitCode = 1; }
}
