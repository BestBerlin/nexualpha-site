#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const checkPackageCli = path.join(repoRoot, 'ops/newsroom/gates/check-package.mjs');
const requiredLocales = ['en', 'zh-Hans'];
const directKinds = new Set(['official_notice', 'original_statement', 'filing', 'court_record', 'onchain_tx', 'market_data']);

const json = async file => JSON.parse(await readFile(file, 'utf8'));
const validIso = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const array = value => Array.isArray(value) ? value : value == null ? [] : [value];
const clean = value => String(value ?? '').trim();
const normLocale = locale => {
  const normalized = locale === 'zh' ? 'zh-Hans' : locale;
  if (!/^[-\w]+$/.test(String(normalized))) throw new Error(`Unsafe locale ${locale}`);
  return normalized;
};

function slugify(value) {
  const slug = clean(value).normalize('NFKD').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || `event-${Date.now()}`;
}

function parseArgs(argv) {
  const options = { article: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--article') {
      const raw = String(argv[++i] ?? '');
      const split = raw.indexOf(':');
      const locale = raw.slice(0, split);
      const file = raw.slice(split + 1);
      if (split < 1 || !file) throw new Error('--article expects locale:path');
      options.article[normLocale(locale)] = file;
    } else if (['--event', '--articles', '--out', '--history', '--ledger', '--queue', '--reviews', '--now'].includes(key)) {
      options[key.slice(2)] = argv[++i];
    } else {
      throw new Error(`Unknown option ${key}`);
    }
  }
  if (!options.event || !options.out) throw new Error('Usage: package-from-event.mjs --event event.json --out packageDir (--articles articles.json | --article en:file --article zh-Hans:file) [--history summary.json --ledger ledger.jsonl --queue dir --reviews reviews.json --now ISO]');
  return options;
}

function firstHeading(markdown) {
  return clean(markdown?.match(/^#\s+(.+)$/m)?.[1]);
}

function titleFor(locale, event, article, writerArticles) {
  const body = typeof article === 'string' ? article : article?.markdown;
  return clean(writerArticles.titles?.[locale] ?? writerArticles.title?.[locale] ?? event.title?.[locale] ?? event.titles?.[locale] ?? article?.title ?? firstHeading(body));
}

function subjectFor(locale, event) {
  return clean(event.subject?.[locale] ?? (typeof event.subject === 'string' ? event.subject : undefined));
}

function eventTermsFor(locale, event, title) {
  const supplied = event.title_event_terms?.[locale] ?? event.titleEventTerms?.[locale] ?? event.event_terms ?? event.eventTerms;
  const terms = array(supplied).map(clean).filter(Boolean);
  if (terms.length) return terms;
  const words = clean(title).replace(/[()]/g, ' ').split(/[^\p{L}\p{N}%$.-]+/u).filter(word => word.length >= (locale.startsWith('zh') ? 1 : 4));
  return words.slice(1, 4);
}

function normalizeEvidence(event) {
  return array(event.evidence ?? event.event_evidence ?? event.eventEvidence).map(item => ({
    id: item.id ?? item.evidence_id,
    url: clean(item.url),
    ...(item.kind && { kind: clean(item.kind) }),
    ...(item.type && !item.kind && { kind: clean(item.type) }),
    ...(item.excerpt && { excerpt: clean(item.excerpt) }),
    ...(item.body_excerpt && !item.excerpt && { excerpt: clean(item.body_excerpt) }),
    ...(item.supports && { supports: clean(item.supports) }),
    ...(item.author_account && { author_account: clean(item.author_account) }),
    ...(item.author && !item.author_account && { author_account: clean(item.author) }),
    ...(item.published_at && { published_at: item.published_at }),
    ...(item.publishedAt && !item.published_at && { published_at: item.publishedAt }),
    ...(item.origin_key && { origin_key: clean(item.origin_key) }),
    ...(item.originKey && !item.origin_key && { origin_key: clean(item.originKey) }),
    ...(item.is_independent != null && { is_independent: item.is_independent }),
    ...(item.isIndependent != null && item.is_independent == null && { is_independent: item.isIndependent }),
    ...(item.confidence && { confidence: item.confidence }),
    ...(item.label_source && { label_source: item.label_source }),
    ...(item.finding && { finding: item.finding }),
    ...(item.conflicting != null && { conflicting: Boolean(item.conflicting) }),
    ...(item.venues && { venues: array(item.venues).map(clean).filter(Boolean) })
  })).filter(item => item.id != null && item.id !== '');
}

function sourceFromEvidence(item) {
  return {
    id: String(item.id),
    url: item.url,
    publisher: item.publisher ?? item.author_account ?? item.kind ?? 'unknown',
    title: item.title ?? item.excerpt ?? item.url,
    publishedAt: item.published_at ?? null,
    primary: directKinds.has(item.kind),
    role: item.supports ?? item.excerpt ?? item.kind ?? 'Evidence supplied with the newsroom event.'
  };
}

function legacyClaimFromGateClaim(claim) {
  return {
    id: String(claim.id),
    text: claim.text ?? claim.text_en ?? claim.texts?.en ?? Object.values(claim.texts ?? {})[0] ?? claim.text_zh ?? String(claim.id),
    sourceIds: array(claim.sourceIds ?? claim.source_ids ?? claim.evidence_ids).map(String),
    risk: claim.risk ?? 'medium'
  };
}

function ctaPlanFromArticles(articles) {
  const plan = [];
  for (const [locale, body] of Object.entries(articles)) {
    for (const match of body.matchAll(/^::cta\s+(\S+)(?:\s+(\S+))?\s*$/gm)) {
      plan.push({ intent: match[1], ...(match[2] && { venue: match[2] }), locale });
    }
  }
  return plan;
}

function articlePath(locale, slug) {
  return locale === 'en' ? `/news/${slug}` : `/${locale.toLowerCase()}/news/${slug}`;
}

function sourcesMarkdown(evidence) {
  const rows = evidence.map(item => `- ${item.id}: ${item.url}${item.excerpt ? ` - ${item.excerpt}` : ''}`);
  return `${rows.join('\n')}\n`;
}

export function packageShapeFromEvent(event, writerArticles) {
  const eventId = event.id ?? event.event_id;
  if (!(Number.isInteger(Number(eventId)) && Number(eventId) > 0)) throw new Error('A positive event id is required');
  const reserved = new Set(['claims', 'quotes', 'ctaPlan', 'titles', 'title']);
  const articleEntries = Object.entries(writerArticles).filter(([key, value]) => !reserved.has(key) && (typeof value === 'string' || typeof value?.markdown === 'string'));
  const articles = Object.fromEntries(articleEntries.map(([locale, value]) => [normLocale(locale), typeof value === 'string' ? value : value.markdown]));
  for (const locale of requiredLocales) {
    if (!clean(articles[locale])) throw new Error(`Missing article.${locale}.md`);
  }
  const locales = Object.keys(articles).sort((a, b) => {
    const ai = requiredLocales.indexOf(a);
    const bi = requiredLocales.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b);
  });
  const slug = clean(event.slug) || slugify(writerArticles.titles?.en ?? event.title?.en ?? event.titles?.en);
  const evidence = normalizeEvidence(event);
  const titles = Object.fromEntries(locales.map(locale => [locale, titleFor(locale, event, writerArticles[locale], writerArticles)]));
  const subject = Object.fromEntries(locales.map(locale => [locale, subjectFor(locale, event)]));
  const title_event_terms = Object.fromEntries(locales.map(locale => [locale, eventTermsFor(locale, event, titles[locale])]));
  const ctaPlan = writerArticles.ctaPlan ?? event.ctaPlan ?? ctaPlanFromArticles(articles);
  const claims = array(writerArticles.claims ?? event.claims);
  const meta = {
    version: 1,
    id: event.package_id ?? `event-${eventId}`,
    batchId: event.batchId ?? event.batch_id ?? `event-${eventId}`,
    status: event.status ?? 'STAGED',
    contentType: event.contentType ?? event.content_type ?? 'market_structure',
    pillar: event.pillar ?? 'decision_relevant_industry_news',
    slug,
    lane: event.lane ?? 'event',
    format: event.format ?? event.suggested_format,
    event_id: eventId,
    event_type: event.event_type ?? event.eventType,
    credibility: event.credibility ?? event.verification?.credibility ?? 0,
    title: titles,
    titles,
    subject,
    title_event_terms,
    suggestedPaths: Object.fromEntries(locales.map(locale => [locale, articlePath(locale, slug)])),
    primaryQuery: event.primaryQuery ?? event.main_question ?? titles.en,
    stage: event.stage ?? 'awareness',
    entities: array(event.entities ?? event.subjects ?? event.subject_entity).map(value => typeof value === 'object' ? clean(value.id ?? value.name) : clean(value)).filter(Boolean),
    internalLinks: array(event.internalLinks ?? event.internal_links),
    relatedVenues: array(event.relatedVenues ?? event.related_venues).map(clean).filter(Boolean),
    partner_names: array(event.partner_names ?? event.partnerNames).map(clean).filter(Boolean),
    topic_tags: array(event.topic_tags ?? event.topicTags ?? ctaPlan.map(item => item.intent)).map(clean).filter(Boolean),
    bodyFiles: Object.fromEntries([...locales.map(locale => [locale, `article.${locale}.md`]), ['htmlPreview', 'preview.html']]),
    sources: array(event.sources).length ? event.sources : evidence.map(sourceFromEvidence),
    claims: array(event.publisherClaims ?? event.publisher_claims).length ? array(event.publisherClaims ?? event.publisher_claims) : claims.map(legacyClaimFromGateClaim),
    seo: event.seo ?? { title: titles.en, description: event.description ?? event.fact_summary ?? titles.en },
    aeo: event.aeo ?? { directAnswer: event.directAnswer ?? event.fact_summary ?? titles.en, questions: array(event.questions) },
    geo: event.geo ?? { knownUnknowns: array(event.knownUnknowns ?? event.known_unknowns) },
    imageBrief: event.imageBrief ?? event.image_brief ?? titles.en,
    fact_summary: event.fact_summary,
    mechanism: event.mechanism,
    analysis: event.analysis,
    counterparty_response: event.counterparty_response,
    counterparty_checked_at: event.counterparty_checked_at,
    availableLocales: locales,
    locales,
    event_evidence: evidence
  };
  Object.keys(meta).forEach(key => meta[key] === undefined && delete meta[key]);
  const claimsDocument = claims.length ? { claims, quotes: array(writerArticles.quotes ?? event.quotes), ctaPlan } : undefined;
  return { meta, articles, claimsDocument, evidence };
}

export async function writePackage(directory, shape) {
  await mkdir(path.dirname(directory), { recursive: true });
  await mkdir(directory);
  await writeFile(path.join(directory, 'meta.json'), `${JSON.stringify(shape.meta, null, 2)}\n`);
  if (shape.claimsDocument) await writeFile(path.join(directory, 'claims.json'), `${JSON.stringify(shape.claimsDocument, null, 2)}\n`);
  await writeFile(path.join(directory, 'evidence.json'), `${JSON.stringify(shape.evidence, null, 2)}\n`);
  await writeFile(path.join(directory, 'sources.md'), sourcesMarkdown(shape.evidence));
  await Promise.all(Object.entries(shape.articles).map(([locale, body]) => writeFile(path.join(directory, `article.${normLocale(locale)}.md`), body.endsWith('\n') ? body : `${body}\n`)));
}

export async function runPackageGate(directory, { historyPath, ledgerPath, reviewsPath, now = new Date().toISOString(), queue } = {}) {
  if (!validIso(now)) throw new Error('now must be an ISO timestamp');
  const args = [checkPackageCli, directory, '--now', now];
  if (historyPath) args.push('--history', historyPath);
  if (ledgerPath) args.push('--ledger', ledgerPath);
  if (queue) args.push('--queue', queue);
  if (reviewsPath) args.push('--reviews', reviewsPath);
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  const envelope = JSON.parse(result.stdout || '{}');
  if (![0, 1, 2].includes(result.status)) throw new Error(result.stderr || envelope.error || 'check-package failed unexpectedly');
  return envelope;
}

export async function packageFromEvent({ event, articles, outDir, historyPath, ledgerPath, reviewsPath, now = new Date().toISOString(), queue }) {
  const shape = packageShapeFromEvent(event, articles);
  await writePackage(outDir, shape);
  const gate = await runPackageGate(outDir, { historyPath, ledgerPath, reviewsPath, now, queue });
  return { packageDir: outDir, status: gate.status, publishAllowed: gate.publishAllowed, gate };
}

async function loadArticles(options) {
  if (options.articles) return json(options.articles);
  const entries = await Promise.all(Object.entries(options.article).map(async ([locale, file]) => [locale, await readFile(file, 'utf8')]));
  return Object.fromEntries(entries);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [event, articles] = await Promise.all([json(options.event), loadArticles(options)]);
  const result = await packageFromEvent({
    event,
    articles,
    outDir: path.resolve(repoRoot, options.out),
    historyPath: options.history,
    ledgerPath: options.ledger,
    reviewsPath: options.reviews,
    now: options.now ?? new Date().toISOString(),
    queue: options.queue
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = { pass: 0, fail: 1, 'needs-review': 2 }[result.status];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stdout.write(`${JSON.stringify({ status: 'fail', publishAllowed: false, error: error.message })}\n`);
    process.exitCode = 1;
  });
}
