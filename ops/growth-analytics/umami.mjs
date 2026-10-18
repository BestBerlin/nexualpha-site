import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { classifyTraffic } from './bots.mjs';

export async function loadUmamiEnv(file = path.join(os.homedir(), '.codex/private/umami.env')) {
  let text;
  try { text = await readFile(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return {}; throw new Error('UMAMI_CREDENTIAL_FILE_UNREADABLE'); }
  return Object.fromEntries(text.split('\n').flatMap(line => {
    const m = /^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) return [];
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1,-1);
    return [[m[1], value]];
  }));
}
export function dayBounds(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('INVALID_DATE');
  const startAt = Date.parse(`${date}T00:00:00+08:00`);
  if (!Number.isFinite(startAt) || new Date(startAt + 8*3600_000).toISOString().slice(0,10) !== date) throw new Error('INVALID_DATE');
  return { startAt, endAt: startAt + 86400_000 - 1, timezone: 'Asia/Shanghai' };
}
const bucket = (map, key) => { key = String(key || 'unknown').slice(0,200); map[key] = (map[key] || 0) + 1; };
const sorted = map => Object.entries(map).map(([key,count]) => ({key,count})).sort((a,b) => b.count-a.count || a.key.localeCompare(b.key));
export function summarizeUmami(sessions, events, env = {}) {
  const groups = new Map();
  for (const event of events) {
    if (!groups.has(event.sessionId)) groups.set(event.sessionId, []);
    groups.get(event.sessionId).push(event);
  }
  const classes = new Map(sessions.map(s => [s.id || s.sessionId, classifyTraffic(s, groups.get(s.id || s.sessionId) || [], env)]));
  const counts = { human_candidate: 0, bot_or_qa: 0, unknown: 0 };
  const country = {}, device = {}, pages = {}, go = {}, copy = {}, telegram = {}, reasons = {};
  for (const session of sessions) {
    const result = classes.get(session.id || session.sessionId);
    counts[result.classification]++;
    for (const reason of result.reasons) bucket(reasons, reason);
    if (result.classification === 'human_candidate') { bucket(country,session.country); bucket(device,session.device); }
  }
  let orphanEvents = 0;
  for (const event of events) {
    const classification = classes.get(event.sessionId)?.classification;
    if (!classification) { orphanEvents++; continue; }
    if (classification !== 'human_candidate') continue;
    const pathname = String(event.urlPath || event.path || '/').split('?')[0];
    const query = new URLSearchParams(event.urlQuery || '');
    const props = event.data || event.properties || {};
    const name = String(event.eventName || event.name || '');
    const src = props.src || query.get('src') || 'unknown';
    const venue = props.venue || props.partner || props.platform || pathname.match(/^\/go\/([^/]+)/)?.[1] || 'unknown';
    if (event.eventType === 1) bucket(pages,pathname);
    if (pathname.startsWith('/go/') || /^(?:go_click|referral_click|outbound_handoff|cta_click)$/.test(name)) bucket(go,`${venue} | ${src}`);
    if (/copy[-_ ]?(?:code|invite)|(?:code|invite)[-_ ]?copy/i.test(name)) bucket(copy,`${venue} | ${src}`);
    if (/telegram|tg_click/i.test(name)) bucket(telegram,src);
  }
  return { sessions: counts, humanCandidates: { visitors: counts.human_candidate, countries: sorted(country), devices: sorted(device), topPages: sorted(pages), goClicksByVenueAndSrc: sorted(go), copyCodeEvents: sorted(copy), telegramClicks: sorted(telegram) }, excludedReasons: sorted(reasons), orphanEvents, coverage: { rawUa: sessions.filter(s => s.userAgent || s.ua).length, ip: sessions.filter(s => s.ip).length, asn: sessions.filter(s => s.asn).length, jsSignal: sessions.filter(s => typeof s.javascript === 'boolean' || typeof s.noJs === 'boolean').length } };
}
export function umamiChineseReport(data) {
  if (data.status !== 'ok') return `# ${data.date} 流量日报\n\n状态：${data.status}（${data.reason}）。数据不可用，不报告为零流量。\n`;
  const h = data.metrics.humanCandidates;
  const lines = [`# ${data.date} 流量日报`, '', `状态：${data.status}；日期时区：Asia/Shanghai。`, '', `候选真人访客（Umami 匿名会话标识去重）：${h.visitors}。已识别机器人/QA：${data.metrics.sessions.bot_or_qa}；无法判断：${data.metrics.sessions.unknown}；缺失会话的事件：${data.metrics.orphanEvents}。`, '', '候选真人仅表示没有检测到已知自动化信号，不代表已证实的自然人。机房 ASN、无 JS 和高频请求单独列入无法判断。Umami 通常不提供原始 UA/IP/ASN，缺失信号不会被猜测补齐。', ''];
  for (const [label, rows] of [['国家',h.countries],['设备',h.devices],['热门页面',h.topPages],['/go 与转出点击（平台 | src）',h.goClicksByVenueAndSrc],['复制邀请码事件',h.copyCodeEvents],['Telegram 点击',h.telegramClicks]]) {
    lines.push(`## ${label}`, '', ...(rows.length ? rows.slice(0,30).map(r => `- ${r.key.replace(/[\r\n]/g,' ')}：${r.count}`) : ['- 本次可观测事件中为 0；不代表未埋点行为为 0。']), '');
  }
  lines.push('## 数据边界', '', ...data.limitations.map(x => `- ${x}`), '', `信号覆盖：${JSON.stringify(data.metrics.coverage)}`);
  return lines.join('\n')+'\n';
}
export async function runUmami({ date, outputDir, env, fetchImpl = globalThis.fetch } = {}) {
  const config = env || { ...await loadUmamiEnv(), ...process.env };
  const range = dayBounds(date);
  let result = { date, source:'umami', status:'blocked', reason:'UMAMI_CREDENTIALS_MISSING', range };
  if (config.UMAMI_URL && config.UMAMI_USERNAME && config.UMAMI_PASSWORD && config.UMAMI_WEBSITE_ID) {
    try {
      const base = new URL(config.UMAMI_URL);
      if (base.protocol !== 'https:' || base.username || base.password) throw new Error('UMAMI_HTTPS_REQUIRED');
      const request = async (route, options = {}) => {
        const response = await fetchImpl(`${base.href.replace(/\/$/,'')}/api/${route}`, { redirect:'error', signal:AbortSignal.timeout(20_000), ...options });
        if (!response.ok) throw new Error(`UMAMI_HTTP_${response.status}`);
        try { return await response.json(); } catch { throw new Error('UMAMI_INVALID_JSON'); }
      };
      const login = await request('auth/login', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:config.UMAMI_USERNAME,password:config.UMAMI_PASSWORD})});
      if (typeof login.token !== 'string' || !login.token) throw new Error('UMAMI_AUTH_TOKEN_MISSING');
      const list = async kind => {
        const rows = [];
        for (let page = 1; page <= 1000; page++) {
          const query = new URLSearchParams({ startAt:String(range.startAt),endAt:String(range.endAt),page:String(page),pageSize:'100' });
          const payload = await request(`websites/${encodeURIComponent(config.UMAMI_WEBSITE_ID)}/${kind}?${query}`, {headers:{authorization:`Bearer ${login.token}`}});
          if (!Array.isArray(payload.data) || !Number.isInteger(payload.count) || payload.count < 0) throw new Error('UMAMI_INVALID_PAGINATION');
          rows.push(...payload.data);
          if (rows.length >= payload.count) return rows;
          if (!payload.data.length) throw new Error('UMAMI_INCOMPLETE_PAGINATION');
        }
        throw new Error('UMAMI_PAGINATION_LIMIT');
      };
      const [sessions, events] = await Promise.all([list('sessions'),list('events')]);
      result = { ...result, status:'ok', reason:undefined, metrics:summarizeUmami(sessions,events,config), limitations:[
        '当前 API 会话通常只包含 browser/OS/device，原始 UA、IP、ASN 和无 JS 信号可能缺失；该部分机器人无法可靠排除。',
        '复制码、Telegram 和 /go 仅统计已记录到 Umami 且带会话的事件；服务端 CLICK_EVENT_FILE 不在此数据源中，缺失埋点不等于实际零点击。',
        '标准事件 API 不提供逐事件自定义属性时，平台/src 仅能从 URL 查询参数识别，未知归因明确标记 unknown。',
        '不保存原始会话、IP、UA、认证响应或事件明细，仅输出聚合与信号覆盖。',
      ] };
    } catch (error) {
      // Never log a fetch error or upstream body: either could contain credentials/URLs.
      result.reason = /^UMAMI_[A-Z0-9_]+$/.test(error.message) ? error.message : 'UMAMI_FETCH_FAILED';
    }
  }
  if (outputDir) {
    const dir = path.join(outputDir,'umami');
    await mkdir(dir,{recursive:true});
    await writeFile(path.join(dir,`${date}.json`),JSON.stringify(result,null,2)+'\n',{mode:0o600});
    await writeFile(path.join(dir,`${date}.md`),umamiChineseReport(result),{mode:0o600});
    result.paths = { json: path.join(dir,`${date}.json`), report: path.join(dir,`${date}.md`) };
  }
  return result;
}
