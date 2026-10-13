#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { campaignTarget } from '../src/data/campaign-autodraft.js';
import { localizedPath } from '../src/data/locale-routing.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const HOSTS = { okx: ['www.okx.com', 'okx.com'], binance: ['www.binance.com', 'binance.com'], bybit: ['announcements.bybit.com', 'www.bybit.com', 'bybit.com'], bitget: ['www.bitget.com', 'bitget.com'], kraken: ['blog.kraken.com', 'www.kraken.com', 'kraken.com', 'support.kraken.com'] };
const ID = /^[a-z0-9][a-z0-9-]{0,69}$/;
const todo = (en, zh) => ({ en: `TODO: ${en}`, 'zh-Hans': `TODO: ${zh}` });
const json = file => JSON.parse(readFileSync(file, 'utf8'));
const atomic = (file, value) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(`${file}.tmp`, value); renameSync(`${file}.tmp`, file); };
export function sgtDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return null;
  const calendar = value.slice(0, 10);
  if (new Date(`${calendar}T00:00:00Z`).toISOString().slice(0, 10) !== calendar) return null;
  return new Date(Date.parse(value) + 8 * 3600000).toISOString().slice(0, 19) + '+08:00';
}
export function announcementDraft(row) {
  if (!['campaign', 'promotion'].includes(row.event_type ?? row.event_type_guess ?? row.type)) return null;
  const candidates = [row.sourceUrl, row.url, ...(row.original_links ?? [])].filter(Boolean);
  let source;
  let venue;
  for (const value of candidates) {
    try {
      const candidate = new URL(value);
      const partner = Object.keys(HOSTS).find(key => HOSTS[key].includes(candidate.hostname));
      if (partner && candidate.protocol === 'https:' && !candidate.username && !candidate.password && !candidate.port) {
        source = candidate; venue = partner; break;
      }
    } catch { /* malformed evidence URL */ }
  }
  if (!source) return null;
  source.hash = '';
  // Tracking queries never define announcement identity.
  for (const key of [...source.searchParams.keys()]) if (/^(utm_|ref$|affiliate|invite)/i.test(key)) source.searchParams.delete(key);
  const sourceKey = `${venue}:${source.href}`;
  const id = `${venue}-${createHash('sha256').update(sourceKey).digest('hex').slice(0, 16)}`;
  const facts = row.campaign ?? {};
  const startAt = sgtDate(facts.startAt ?? row.metrics?.campaign_start_at);
  const endAt = sgtDate(facts.endAt ?? row.metrics?.campaign_end_at);
  const title = row.title ?? row.title_internal ?? '';
  const copy = {};
  for (const locale of ['en', 'zh-Hans']) {
    const input = facts.copy?.[locale] ?? {};
    copy[locale] = {
      title: input.title ?? (locale === 'en' && title ? title : todo('translate official title', '翻译官方标题')[locale]),
      rewardHeadline: input.rewardHeadline ?? todo('state what the user can win from the source', '依据来源填写用户可获奖励')[locale],
      eligibility: input.eligibility ?? todo('confirm eligible users and markets', '确认参与资格与地区')[locale],
      steps: input.steps ?? [todo('confirm enrollment and qualifying steps', '确认报名与达标步骤')[locale]],
    };
  }
  return { id, status: 'DRAFT', venue, sourceKey, sourceUrl: source.href, sourceExcerpt: row.body_excerpt ?? row.fact_summary ?? '',
    startAt, endAt, timezone: 'Asia/Singapore', copy, goRoute: `/go/campaign-${id}`,
    signupRoute: `/go/${venue}`, campaignLinkRequired: facts.campaignLinkRequired !== false,
    campaignUrl: null, campaignLinkTodo: 'TODO: owner confirms whether a special enrollment link is required; supply the attributed URL if required',
    restrictedCountries: facts.restrictedCountries ?? [], allowedCountries: facts.allowedCountries ?? [],
    eligibilityReviewed: false, reviewedBy: null, reviewedAt: null };
}
export function promotionErrors(draft) {
  const errors = [];
  if (!ID.test(draft.id) || !HOSTS[draft.venue]) errors.push('invalid id or venue');
  const basis = announcementDraft({ type: 'campaign', url: draft.sourceUrl });
  if (!basis || basis.id !== draft.id || basis.venue !== draft.venue || basis.sourceKey !== draft.sourceKey) errors.push('source identity changed');
  if (draft.status !== 'APPROVED' || !draft.reviewedBy?.trim() || !sgtDate(draft.reviewedAt)) errors.push('owner approval requires status APPROVED, reviewedBy and reviewedAt');
  if (draft.eligibilityReviewed !== true || !['restrictedCountries', 'allowedCountries'].every(key => Array.isArray(draft[key]) && draft[key].every(code => /^[A-Z]{2}$/.test(code)))) errors.push('review eligibility and country gates');
  if (typeof draft.campaignLinkRequired !== 'boolean' || !campaignTarget(draft)) errors.push('resolve campaign link TODO with an attributed target');
  if (!sgtDate(draft.startAt) || !sgtDate(draft.endAt) || Date.parse(draft.startAt) >= Date.parse(draft.endAt)) errors.push('confirm ordered timezone-qualified dates');
  const complete = value => typeof value === 'string' && value.trim() && !/TODO|https?:\/\/|\/go\//i.test(value);
  for (const locale of ['en', 'zh-Hans']) {
    const copy = draft.copy?.[locale];
    if (!copy || !['title', 'rewardHeadline', 'eligibility'].every(key => complete(copy[key])) || !Array.isArray(copy.steps) || !copy.steps.length || !copy.steps.every(complete)) errors.push(`complete ${locale} copy`);
  }
  return errors;
}
function registry(root) {
  const file = path.join(root, 'src/data/campaign-autodraft.generated.js');
  const body = readFileSync(file, 'utf8');
  return JSON.parse(body.slice(body.indexOf('=') + 1).trim().replace(/;$/, ''));
}
function reviewList(folder, live = []) {
  const drafts = readdirSync(folder).filter(file => file.endsWith('.json')).sort().map(file => json(path.join(folder, file)));
  atomic(path.join(folder, 'REVIEW.md'), '# Campaign draft review\n\nNothing in this folder is published. Confirm source facts, both editions, SGT dates, market eligibility and special-link requirements; set status to APPROVED, eligibilityReviewed, reviewedBy and reviewedAt, then run --promote <id>.\n\n' + drafts.map(d => `- [${d.id}](${d.id}.json) — ${live.some(c => c.id === d.id) ? "PROMOTED" : d.status}; ${d.venue}; ${d.copy.en.title.replace(/[\r\n]/g, ' ')}; ${d.startAt ?? 'TODO start'} → ${d.endAt ?? 'TODO end'}; ${live.some(c => c.id === d.id) ? 'in the local live registry' : promotionErrors(d).join('; ') || 'ready to promote'}`).join('\n') + '\n');
}
export function generateDrafts(payload, { root = ROOT, since } = {}) {
  const rows = Array.isArray(payload) ? payload : payload.events ?? payload.raw_items ?? payload.items;
  if (!Array.isArray(rows)) throw new Error('Expected an array or {events|raw_items|items: [...]} export');
  if (since && !sgtDate(since)) throw new Error('--since requires a timezone-qualified ISO timestamp');
  const folder = path.join(root, 'drafts/campaigns');
  mkdirSync(folder, { recursive: true });
  const live = registry(root);
  const created = [];
  for (const row of rows) {
    const publishedAt = row.published_at ?? row.source_published_at;
    if (since && (!sgtDate(publishedAt) || Date.parse(publishedAt) <= Date.parse(since))) continue;
    const draft = announcementDraft(row);
    if (!draft || live.some(c => c.sourceKey === draft.sourceKey)) continue;
    const file = path.join(folder, `${draft.id}.json`);
    if (existsSync(file)) continue; // Never overwrite an owner's review work.
    atomic(file, JSON.stringify(draft, null, 2) + '\n');
    created.push(draft.id);
  }
  reviewList(folder, live);
  return created;
}
export function promoteDraft(id, { root = ROOT } = {}) {
  if (!ID.test(id)) throw new Error('Invalid campaign id');
  const folder = path.join(root, 'drafts/campaigns');
  const draft = json(path.join(folder, `${id}.json`));
  if (draft.id !== id) throw new Error('Draft id does not match filename');
  const errors = promotionErrors(draft);
  if (errors.length) throw new Error(errors.join('; '));
  const campaigns = registry(root);
  if (campaigns.some(c => c.id === id || c.sourceKey === draft.sourceKey)) throw new Error('Campaign already promoted');
  // Validate and read every output before mutation. These are local files; deployment is a separate owner action.
  const sitemapFile = path.join(root, 'public/sitemap-campaigns.xml');
  const sitemap = readFileSync(sitemapFile, 'utf8');
  if (!sitemap.includes('</urlset>')) throw new Error('Invalid campaign sitemap');
  const approved = { ...draft, startAt: sgtDate(draft.startAt), endAt: sgtDate(draft.endAt), reviewedAt: sgtDate(draft.reviewedAt), sourceExcerpt: undefined, campaignUrl: draft.campaignLinkRequired ? campaignTarget(draft) : null, campaignLinkTodo: null, goRoute: `/go/campaign-${id}`, signupRoute: `/go/${draft.venue}` };
  const entries = ['en', 'zh-Hans'].map(locale => `  <url><loc>https://nexualpha.com${localizedPath(`/activities/${id}`, locale)}</loc><lastmod>${approved.reviewedAt.slice(0, 10)}</lastmod></url>`).join('\n');
  atomic(path.join(root, 'src/data/campaign-autodraft.generated.js'), '// Only the explicit campaign-autodraft --promote command writes this registry.\nexport const APPROVED_CAMPAIGNS = ' + JSON.stringify([...campaigns, approved], null, 2) + ';\n');
  atomic(sitemapFile, sitemap.replace('</urlset>', `${entries}\n</urlset>`));
  reviewList(folder, [...campaigns, approved]);
  return approved;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const args = process.argv.slice(2);
    if (args[0] === '--promote' && args.length === 2) console.log(`Promoted ${promoteDraft(args[1]).id} locally; not deployed.`);
    else if (args[0] === '--input' && (args.length === 2 || args.length === 4 && args[2] === '--since')) console.log(JSON.stringify({ created: generateDrafts(json(args[1]), { since: args[3] }) }));
    else throw new Error('Usage: node scripts/campaign-autodraft.mjs --input export.json [--since ISO] | --promote <id>');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
