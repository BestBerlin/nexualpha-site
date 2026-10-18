#!/opt/homebrew/bin/node
// Answer-engine observer: reads public, logged-out AI answer pages with a real Chrome window (puppeteer-core).
// Boundaries: robots.txt is fetched and evaluated live per engine before any query; CAPTCHAs / human checks /
// login walls / rate-limit notices stop that engine for the run (recorded, never solved); no paid API, no login,
// no fingerprint spoofing, one query at a time with a pause. Output feeds aeo.mjs via NEXU_AEO_EVIDENCE_FILE.
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const PUPPETEER_FROM = '/Users/bestberlin/.codex/shared-tools/web-quality/package.json';
const UA_TOKEN = '*';

/** Engines and the public URL a normal person would open. `observe: false` engines are robots/login-checked only. */
export const ENGINES = {
  'chatgpt-search': { origin: 'https://chatgpt.com', url: q => `/?q=${encodeURIComponent(q)}&hints=search`, observe: true },
  perplexity: { origin: 'https://www.perplexity.ai', url: q => `/search?q=${encodeURIComponent(q)}`, observe: true },
  'google-ai-overview': { origin: 'https://www.google.com', url: q => `/search?q=${encodeURIComponent(q)}`, observe: true },
  'bing-copilot': { origin: 'https://www.bing.com', url: q => `/search?q=${encodeURIComponent(q)}`, observe: true },
};

/** Minimal RFC 9309 matcher: groups for UA, longest match wins, Allow wins ties, supports * and $. */
export function robotsAllows(robotsTxt, pathWithQuery, ua = UA_TOKEN) {
  const groups = []; let current = null; let lastWasAgent = false;
  for (const raw of String(robotsTxt).split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim(); if (!line.includes(':')) continue;
    const key = line.slice(0, line.indexOf(':')).trim().toLowerCase(); const value = line.slice(line.indexOf(':') + 1).trim();
    if (key === 'user-agent') { if (!lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); } current.agents.push(value.toLowerCase()); lastWasAgent = true; continue; }
    lastWasAgent = false;
    if (current && (key === 'allow' || key === 'disallow')) current.rules.push({ allow: key === 'allow', pattern: value });
  }
  const specific = groups.filter(g => g.agents.includes(ua.toLowerCase()) && ua !== '*');
  const rules = (specific.length ? specific : groups.filter(g => g.agents.includes('*'))).flatMap(g => g.rules).filter(r => r.pattern);
  let best = null;
  for (const rule of rules) {
    const anchored = rule.pattern.endsWith('$');
    const body = anchored ? rule.pattern.slice(0, -1) : rule.pattern;
    const regex = new RegExp('^' + body.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + (anchored ? '$' : ''));
    if (!regex.test(pathWithQuery)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) best = rule;
  }
  return best ? best.allow : true;
}

const CHALLENGE = /verify you are human|请验证您是真人|請驗證您是真人|just a moment\.\.\.|unusual traffic|are you a robot|select all (?:squares|images)|选择所有包含|机器人也使用|captcha/i;
const RATE_LIMIT = /too many requests|rate limit|you've reached|you have reached|达到.*上限|请求过多/i;
export function classifyPage({ httpStatus, text, answerText, citations }) {
  if (CHALLENGE.test(text)) return { status: 'blocked', reason: 'HUMAN_VERIFICATION_SERVED_NOT_SOLVED' };
  if (RATE_LIMIT.test(answerText || '')) return { status: 'blocked', reason: 'RATE_LIMITED' };
  if (httpStatus >= 400) return { status: 'blocked', reason: `HTTP_${httpStatus}` };
  if (!answerText || answerText.length < 40) return { status: 'unavailable', reason: 'NO_ANSWER_RENDERED' };
  return { status: 'observed', reason: null, citations };
}

/** Citation URLs keep only scheme/host/path; utm and other query data are stripped. */
export function cleanCitation(href) {
  try {
    const url = new URL(href);
    if (!['https:', 'http:'].includes(url.protocol) || /(^|\.)(chatgpt|openai)\.com$/.test(url.hostname)) return null;
    url.search = ''; url.hash = ''; url.username = ''; url.password = '';
    return url.href;
  } catch { return null; }
}
export const mentionsUs = text => /nexualpha|nexu\s?alpha/i.test(String(text));

async function robotsFor(origin, fetchImpl = fetch) {
  try { const r = await fetchImpl(`${origin}/robots.txt`, { signal: AbortSignal.timeout(15000) }); return r.ok ? await r.text() : ''; }
  catch { return null; }
}

async function observeChatGpt(browser, query, evidenceDir) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1200, height: 860 });
    const response = await page.goto(ENGINES['chatgpt-search'].origin + ENGINES['chatgpt-search'].url(query.query), { waitUntil: 'domcontentloaded', timeout: 45000 });
    // Wait until the assistant text stops changing (max ~70 s).
    let last = '', stable = 0;
    for (let i = 0; i < 35 && stable < 3; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const now = await page.evaluate(() => document.body.innerText.length).catch(() => 0);
      stable = now === last && now > 0 ? stable + 1 : 0; last = now;
    }
    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      const start = Math.max(text.lastIndexOf('ChatGPT said:'), text.lastIndexOf('ChatGPT 说：'), text.lastIndexOf('ChatGPT 說：'));
      const answerText = start >= 0 ? text.slice(start).split(/ChatGPT (?:is AI|can make mistakes|是 AI|可能会犯错)/)[0] : '';
      const citations = [...document.querySelectorAll('a[href*="utm_source=chatgpt.com"]')].map(a => a.href);
      return { text: text.slice(0, 4000), answerText: answerText.slice(0, 6000), citations };
    });
    const shot = path.join(evidenceDir, `${query.id}-chatgpt.png`);
    await page.screenshot({ path: shot });
    const citations = [...new Set(data.citations.map(cleanCitation).filter(Boolean))];
    const verdict = classifyPage({ httpStatus: response?.status() ?? 0, text: data.text, answerText: data.answerText, citations });
    return { ...verdict, citations, mentioned: mentionsUs(data.answerText), answerExcerpt: data.answerText.replace(/\s+/g, ' ').slice(0, 600), answerEvidence: shot };
  } finally { await page.close().catch(() => {}); }
}

export async function runBrowserAeo({ queries, date, outputDir, pauseMs = 12000, headful = true, fetchImpl = fetch, launch } = {}) {
  const evidenceDir = path.join(outputDir, 'aeo-evidence', date);
  await mkdir(evidenceDir, { recursive: true });
  const results = []; const engineStatus = {};
  for (const [engine, spec] of Object.entries(ENGINES)) {
    const robots = await robotsFor(spec.origin, fetchImpl);
    const allowed = robots === null ? null : robotsAllows(robots, spec.url(queries[0].query));
    engineStatus[engine] = robots === null ? { status: 'unavailable', reason: 'ROBOTS_FETCH_FAILED' }
      : !allowed ? { status: 'unavailable', reason: 'ROBOTS_DISALLOWS_QUERY_URL' } : { status: 'pending' };
  }
  if (engineStatus['chatgpt-search'].status === 'pending') {
    const require = createRequire(PUPPETEER_FROM);
    const browser = await (launch ? launch() : require('puppeteer-core').launch({ executablePath: CHROME, headless: headful ? false : 'new', args: ['--no-first-run', '--no-default-browser-check', '--window-size=1200,860'] }));
    try {
      for (const query of queries) {
        if (engineStatus['chatgpt-search'].status === 'blocked') break;
        let row;
        try { row = await observeChatGpt(browser, query, evidenceDir); }
        catch { row = { status: 'unavailable', reason: 'PAGE_LOAD_FAILED', citations: [] }; }
        results.push({ engine: 'chatgpt-search', queryId: query.id, query: query.query, lang: query.lang, observedAt: new Date().toISOString(), ...row });
        if (row.status === 'blocked') engineStatus['chatgpt-search'] = { status: 'blocked', reason: row.reason, afterQuery: query.id };
        await new Promise(r => setTimeout(r, pauseMs + Math.floor(Math.random() * 4000)));
      }
      if (engineStatus['chatgpt-search'].status === 'pending') engineStatus['chatgpt-search'] = { status: 'ok' };
    } finally { await browser.close().catch(() => {}); }
  }
  // Engines not observed this run get explicit per-query unavailable rows with the engine-level reason.
  for (const [engine, state] of Object.entries(engineStatus)) {
    if (engine === 'chatgpt-search' && state.status === 'ok') continue;
    for (const query of queries) {
      if (results.some(r => r.engine === engine && r.queryId === query.id)) continue;
      results.push({ engine, queryId: query.id, query: query.query, lang: query.lang, status: state.status === 'pending' ? 'unavailable' : state.status, reason: state.reason || 'NOT_RUN', citations: [] });
    }
  }
  const evidence = { schema: 'nexualpha.aeo-browser.v1', date, generatedAt: new Date().toISOString(), observerNote: 'Logged-out answers vary by IP location and time; the observer egress location is part of the evidence.', engineStatus, results };
  const file = path.join(outputDir, `aeo-browser-${date}.json`);
  await writeFile(file, JSON.stringify(evidence, null, 2) + '\n');
  return { file, evidence };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { MONEY_QUERIES } = await import('./aeo.mjs');
  const args = process.argv.slice(2);
  const arg = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const date = arg('--date') || new Date().toISOString().slice(0, 10);
  const limit = Number(arg('--limit') || MONEY_QUERIES.length);
  const { file, evidence } = await runBrowserAeo({ queries: MONEY_QUERIES.slice(0, limit), date, outputDir: arg('--output-dir') || '/Volumes/致态2TB/nx-agents/analytics', headful: !args.includes('--headless') });
  console.log(JSON.stringify({ file, engineStatus: evidence.engineStatus, observed: evidence.results.filter(r => r.status === 'observed').length, cited: evidence.results.filter(r => r.citations?.some(u => /nexualpha\.com/.test(u))).length }));
}
