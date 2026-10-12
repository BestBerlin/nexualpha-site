import { readFileSync } from 'node:fs';

const lexicons = ['en', 'zh'].map(name => JSON.parse(readFileSync(new URL(`./lexicon/${name}.json`, import.meta.url))));
const partnerRegistry = JSON.parse(readFileSync(new URL('../../../pilot-01-prototype/public/intel/partners.json', import.meta.url))).partners;
const isPartner = venue => partnerRegistry.some(p => norm(p.slug) === norm(venue) || norm(p.name) === norm(venue));
const directKinds = new Set(['official_notice', 'original_statement', 'filing', 'court_record', 'onchain_tx', 'market_data']);
const intents = {
  liquidation_wave: ['site_tool', 'risk_tools'], price_move: ['site_tool', 'risk_tools'], liquidity_anomaly: ['site_tool', 'risk_tools'],
  withdrawal_halt: ['site_tool', 'withdrawal_conditions'], insolvency: ['site_tool', 'withdrawal_conditions'], hack_exploit: ['site_tool', 'withdrawal_conditions'],
  listing: ['site_tool', 'venue_support', 'fees', 'signup'], product_launch: ['site_tool', 'venue_support', 'fees', 'signup'], campaign: ['site_tool', 'venue_support', 'fees', 'signup'],
  regulation: ['site_tool'], enforcement: ['site_tool'], lawsuit: ['site_tool'], politics_market: ['site_tool'], fx_macro: ['site_tool'], dispute: ['site_tool'], viral_claim: ['site_tool']
};
const neutralOnly = new Set(['withdrawal_halt', 'insolvency', 'hack_exploit', 'regulation', 'enforcement', 'lawsuit', 'politics_market', 'fx_macro', 'dispute', 'viral_claim']);
const supportedLocales = new Set(['en', 'zh-Hans', 'zh-Hant']);
const norm = text => String(text ?? '').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]/gu, '');
const has = (key, text) => lexicons.some(l => new RegExp(l[key], 'iu').test(text));
const validUrl = url => { try { return ['https:', 'http:'].includes(new URL(url).protocol); } catch { return false; } };
const numbers = text => (String(text).match(/\d+(?:[.,]\d+)*/g) ?? []).map(n => n.replace(/,/g, ''));
const claimText = (c, locale) => c.texts?.[locale] ?? (locale === 'en' ? c.text_en : locale.startsWith('zh') ? c.text_zh : '') ?? '';
const sentenceList = body => body.replace(/^\s*\[[^\]]+\]\(https?:\/\/[^)]+\)\s*$/gm, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').split(/(?<=[!?。！？])\s*|(?<=\.)(?=\s|$)\s*|\n+/u).filter(s => s.trim() && !/^\s*(#|::cta)/.test(s));
const similarity = (a, b) => {
  a = norm(a); b = norm(b);
  if (a === b) return 1;
  const grams = s => new Set(Array.from({ length: Math.max(0, s.length - 1) }, (_, i) => s.slice(i, i + 2)));
  const x = grams(a), y = grams(b);
  return x.size + y.size ? 2 * [...x].filter(g => y.has(g)).length / (x.size + y.size) : 0;
};
const utcTime = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value) && Number.isFinite(Date.parse(value));

/** Pure, offline gate. Source truth is the supplied, freshly checked evidence bundle. */
export function checkPackage({ meta, articles, claimsDocument, evidence = [], history = [], now, historyComplete = true, humanReviews = [] }) {
  if (!Number.isFinite(Date.parse(now))) throw new Error('An explicit ISO evaluation time is required');
  const reasons = [];
  const add = (rule, severity, message, locale, claim_id) => reasons.push({ rule, severity, message, ...(locale && { locale }), ...(claim_id && { claim_id }) });
  if (!meta || !articles || !Object.keys(articles).length) throw new Error('meta and articles are required');
  if (!claimsDocument) return { status: 'needs-review', legacy: true, publishAllowed: false, reasons: [{ rule: 'LEGACY', severity: 'needs-review', message: 'No claims.json: legacy package requires migration and review.' }] };
  const claims = Array.isArray(claimsDocument) ? claimsDocument : claimsDocument.claims;
  if (!Array.isArray(claims) || !claims.length) throw new Error('claims.json must contain a non-empty claims array');
  const quotes = claimsDocument.quotes ?? meta.quotes ?? [];
  const plan = claimsDocument.ctaPlan ?? meta.ctaPlan ?? [];
  if (!Array.isArray(evidence) || !Array.isArray(quotes) || !Array.isArray(plan)) throw new Error('evidence, quotes and ctaPlan must be arrays');
  const byId = new Map(evidence.map(e => [e.id, e]));
  if (byId.size !== evidence.length || evidence.some(e => !e.id || !validUrl(e.url))) add('G1', 'fail', 'Evidence IDs must be unique and carry HTTP(S) URLs.');
  if (new Set(claims.map(c => c.id)).size !== claims.length) add('G1', 'fail', 'Claim IDs must be unique.');
  const event = meta.event_type ?? meta.eventType;
  const refs = c => (c.evidence_ids ?? []).map(id => byId.get(id)).filter(e => e && validUrl(e.url));
  const support = (c, field, predicate = () => true) => refs(c).some(e => e.id === c.metadata?.[field] && predicate(e));
  for (const c of claims) {
    const text = Object.keys(articles).map(l => claimText(c, l)).join(' '), m = c.metadata ?? {}, sources = refs(c);
    if (!c.id || typeof c.key !== 'boolean' || !c.kind || !text.trim()) add('G1', 'fail', 'Claim requires id, key, kind and locale text.', null, c.id);
    if (!sources.length || sources.length !== (c.evidence_ids ?? []).length) add('G1', 'fail', 'Claim has missing or invalid evidence references.', null, c.id);
    if (c.key && !sources.some(e => directKinds.has(e.kind)) && new Set(sources.filter(e => e.kind === 'media_report' && e.is_independent === true && e.origin_key).map(e => e.origin_key)).size < 2) add('G1', 'fail', 'Key claim needs direct evidence or two independent media origins.', null, c.id);
    if (sources.some(e => e.conflicting)) add('AUTO', 'needs-review', 'Conflicting evidence requires review.', null, c.id);
    if (['whale_transfer', 'exchange_flow'].includes(event) && has('sale', text) && !support(c, 'sale_confirmed_by', e => directKinds.has(e.kind) && e.finding === 'sale')) add('T1', 'fail', 'Transfer is not proof of sale.', null, c.id);
    if (has('deposit', text) && has('sale', text) && !support(c, 'sale_confirmed_by', e => directKinds.has(e.kind) && e.finding === 'sale')) add('T2', 'fail', 'Exchange deposit is not proof of dumping.', null, c.id);
    if (c.kind === 'address_label' || m.address_owner || /(?:address|地址).{0,35}(?:owner|belong|control|label|归属|歸屬|属于|屬於|控制)|(?:owned|controlled|labelled|labeled|控制|持有|归属|歸屬).{0,35}(?:address|地址)/iu.test(text)) {
      if (!m.label_source || !['high', 'medium', 'low'].includes(m.confidence) || !sources.some(e => e.label_source === m.label_source && e.confidence === m.confidence)) add('T3', 'fail', 'Named address requires matching evidence label source and confidence.', null, c.id);
      if (m.address_unknown && m.address_owner) add('T3', 'fail', 'An unknown address cannot be a named entity.', null, c.id);
    }
    if (c.kind === 'liquidation' || /liquidat|爆仓|爆倉|清算/iu.test(text)) {
      const isTotal = (m.total !== false || /total|aggregate|combined|sum|总计|總計|合计|合計|累计|累計/iu.test(text) || !/single|individual|one position|单笔|單筆|单个|單個/iu.test(text));
      if (!['realized', 'potential', 'unrealized', 'self_reported'].includes(m.liquidation_type)) add('L1', 'fail', 'Declare liquidation type.', null, c.id);
      if (isTotal && (!m.window || !m.venues?.length || !m.coins?.length || !sources.some(e => e.id === m.source || e.url === m.source) || !m.lower_bound)) add('L1', 'fail', 'Totals require window, venues, coins, source and lower_bound=true.', null, c.id);
      if (isTotal && m.window && Array.isArray(m.venues) && Array.isArray(m.coins)) {
        for (const locale of Object.keys(articles)) {
          if (!claimText(c, locale)) continue;
          const body = articles[locale];
          const source = sources.find(e => e.id === m.source || e.url === m.source);
          if (![m.window, ...m.venues, ...m.coins].every(value => norm(body).includes(norm(value))) || !source || ![source.url, source.author_account, source.publisher].filter(Boolean).some(value => norm(body).includes(norm(value))) || !/lower bound|下限/iu.test(body)) add('L1', 'fail', 'Liquidation total must visibly state window, venues, coins, source and lower bound.', locale, c.id);
        }
      }
      if (m.sum_of?.length) {
        const parts = m.sum_of.map(id => claims.find(p => p.id === id));
        if (parts.some(p => !p || !p.metadata?.source || !utcTime(p.metadata?.snapshot_at) || !['liquidation', 'arithmetic'].includes(p.kind)) || parts.some((p, i) => parts.slice(i + 1).some(q => p.metadata?.source === q.metadata?.source))) add('L2', 'fail', 'Cannot sum snapshots from the same liquidation source.', null, c.id);
      }
    }
    for (const [word, kind] of [['insolvency', 'insolvency'], ['filing', 'bankruptcy_filing'], ['bankruptcy', 'in_bankruptcy']]) {
      if (has(word, text) && !sources.some(e => e.finding === kind && (kind === 'insolvency' ? ['official_notice', 'filing', 'court_record'].includes(e.kind) : e.kind === 'court_record'))) add('R1', 'fail', `Stronger risk term requires ${kind} evidence.`, null, c.id);
    }
    if (has('prediction', text) && !has('attribution', text)) add('Q2', 'needs-review', 'Prediction must stay attributed.', null, c.id);
  }
  for (const [locale, body] of Object.entries(articles)) {
    const title = typeof meta.title === 'string' ? meta.title : meta.title?.[locale];
    if (!supportedLocales.has(locale)) add('LOCALE', 'needs-review', 'Localized semantics need human review; EN/ZH lexicons do not prove this edition.', locale);
    const subject = typeof meta.subject === 'string' ? meta.subject : meta.subject?.[locale];
    const eventTerms = meta.title_event_terms?.[locale] ?? [];
    if (!title || !subject || !norm(title).includes(norm(subject)) || !eventTerms.some(t => norm(title).includes(norm(t))) || [...title].length > (locale.startsWith('zh') ? 40 : 90) || has('bannedTitle', title)) add('TT1', 'fail', 'Title requires concrete subject and event, valid length, and no hype.', locale);
    if (/[?？]/u.test(title ?? '') && (has('wrongdoing', title) || norm(title) !== norm(meta.primaryQuery))) add('TT1', 'fail', 'Question title must be the literal reader query and cannot insinuate wrongdoing.', locale);
    if (/\(?20\d{2}\)?\s*$/u.test(title ?? '') && !meta.date_is_news) add('TT1', 'fail', 'Date suffix is allowed only when the date is news.', locale);
    if (numbers(title ?? '').some(n => !claims.some(c => numbers(claimText(c, locale)).includes(n)))) add('G1', 'fail', 'Title number absent from locale claims.', locale);
    if (['whale_transfer', 'exchange_flow'].includes(event) && has('sale', title ?? '') && !claims.some(c => support(c, 'sale_confirmed_by', e => directKinds.has(e.kind) && e.finding === 'sale'))) add('T1', 'fail', 'Headline transfer is not proof of sale.', locale);
    for (const [word, kind] of [['insolvency', 'insolvency'], ['filing', 'bankruptcy_filing'], ['bankruptcy', 'in_bankruptcy']]) {
      if (has(word, title ?? '') && !claims.some(c => refs(c).some(e => e.finding === kind && (kind === 'insolvency' ? ['official_notice', 'filing', 'court_record'].includes(e.kind) : e.kind === 'court_record')))) add('R1', 'fail', `Headline risk term requires ${kind} evidence.`, locale);
    }
    if (has('prediction', title ?? '') && !has('attribution', title ?? '')) add('Q2', 'needs-review', 'Headline prediction must stay attributed.', locale);
    const officialFraudFinding = claims.some(c => refs(c).some(e => ['court_record', 'official_notice'].includes(e.kind) && e.finding === 'fraud'));
    if (has('rug', title ?? '')) add('R1', 'fail', 'Rug/exit scam/跑路 cannot appear as a headline fact.');
    if (has('fraud', title ?? '') && !officialFraudFinding) add('D2', 'needs-review', 'Headline fraud allegation requires official evidence.', locale);
    const sentences = sentenceList(body);
    for (const sentence of sentences) {
      const ns = numbers(sentence);
      if (/our arithmetic:|我们的计算|我們的計算/iu.test(sentence)) {
        if (!claims.some(c => c.kind === 'arithmetic' && norm(claimText(c, locale)).includes(norm(sentence)))) add('G2', 'needs-review', 'Arithmetic marker requires a mapped calculation claim.', locale);
      }
      // Requiring all prose sentences prevents undeclared names from escaping a heuristic NER scan.
      if (!['Reviewed by ', '审核人 ', '審核人 '].some(prefix => meta.human_reviewed_by && norm(sentence) === norm(prefix + meta.human_reviewed_by)) && !claims.some(c => claimText(c, locale) && norm(claimText(c, locale)) === norm(sentence))) add('G2', 'needs-review', 'Prose sentence is not mapped verbatim to a locale claim (names cannot be omitted from entities to bypass coverage).', locale);
      if (ns.some(n => !claims.some(c => numbers(claimText(c, locale)).includes(n)))) add('G1', 'fail', 'Body number absent from locale claims.', locale);
      const mapped = claims.filter(c => claimText(c, locale) && norm(claimText(c, locale)) === norm(sentence));
      if (has('rug', sentence) && !mapped.some(c => c.metadata?.official_finding_quote && refs(c).some(e => ['court_record', 'official_notice'].includes(e.kind) && e.finding === 'fraud'))) add('R1', 'fail', 'Rug/exit scam/跑路 prohibited except a quoted official finding.', locale);
      if (has('fraud', sentence) && !mapped.some(c => refs(c).some(e => ['court_record', 'official_notice'].includes(e.kind) && e.finding === 'fraud'))) add('D2', 'needs-review', 'Unproven fraud allegation cannot auto-publish.', locale);
      if (has('heat', sentence) && !meta.discussion?.independent_posts) add('H1', 'fail', 'Heat words require measured independent discussion.', locale);
      if ((['politics_market', 'fx_macro'].includes(event) || /politic|election|sanction|政治|选举|選舉|制裁/iu.test(sentence)) && has('cause', sentence) && !(has('tentative', sentence) && meta.mechanism && meta.analysis && meta.fact_summary)) add('C1', 'needs-review', 'Causal link needs may/could, mechanism and separate facts/analysis.', locale);
    }
    for (const match of `${title ?? ''}\n${body}`.matchAll(/[“「『‘]([^”」』’\n]+)[”」』’]|"([^"\n]+)"|(?<![\p{L}\p{N}])'([^'\n]+)'(?![\p{L}\p{N}])/gu)) {
      const quoted = match[1] ?? match[2] ?? match[3];
      const q = quotes.find(q => q.locale === locale && norm(q.text) === norm(quoted));
      const e = q && byId.get(q.evidence_id);
      // Fuzzy tolerance is punctuation/spacing only: changed words and numbers never pass.
      if (!q || !e || !validUrl(e.url) || !['original_statement', 'court_record', 'official_notice'].includes(e.kind) || !norm(e.excerpt).includes(norm(q.original_text ?? quoted)) || !q.speaker || q.speaker !== e.author_account || !utcTime(q.date) || q.date !== e.published_at || !body.includes(q.speaker) || !body.includes(q.date.slice(0, 10)) || (q.original_text && norm(q.original_text) !== norm(quoted) && (!q.translated || !/translated|译文|譯文/iu.test(body)))) add('Q1', 'fail', 'Quote must match original excerpt, speaker/account and date; translations must be marked.', locale);
      else if (q.original_text && norm(q.original_text) !== norm(quoted)) add('Q1', 'needs-review', 'Translation fidelity needs human review.', locale);
    }
    const first = sentences[0] ?? '';
    const valueBlocks = [...body.matchAll(/^##\s+([^\n]+)\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/gm)];
    const hasValueBlock = valueBlocks.some(([, heading, content]) => /timeline|source check|metric definition|comparison|both.sides|correction|risk checklist|时间线|時間線|源头核验|来源核查|指标定义|指標定義|对比|對比|双方|雙方|纠错|糾錯|风险清单|風險清單/iu.test(heading) && norm(content.replace(/^::cta.*$/gm, '')).length >= 20);
    if (!subject || !norm(first).includes(norm(subject)) || !numbers(first).length || !/\b(is|was|has|announced|reported|launched|recorded|halted|filed|transferred|held|controlled|sold|purchased|withdrew|received|suspended|said)\b|宣布|报告|報告|推出|录得|錄得|暂停|暫停|转移|轉移|持有|控制|卖出|賣出|收到|表示|已破产|已破產|进入|進入/iu.test(first) || !hasValueBlock) add('W1', 'needs-review', 'Open with subject/action/figure and include a real value block.', locale);
    if (has('disclaimer', body)) add('CTA1', 'fail', 'Fine-print disclosure paragraphs belong only in footer/legal pages.', locale);
    if (has('reviewed', body) && !humanReviews.some(r => r.slug === meta.slug && r.reviewer === meta.human_reviewed_by && r.reviewed_at === meta.human_reviewed_at && utcTime(r.reviewed_at) && Date.parse(r.reviewed_at) <= Date.parse(now))) add('B1', 'fail', 'Reviewed by requires a matching trusted external human review record.', locale);
    const directives = [...body.matchAll(/^::cta\s+(\S+)(?:\s+(\S+))?\s*$/gm)];
    if (directives.length > 2) add('CTA1', 'fail', 'At most two in-body CTAs per edition.', locale);
    for (const [, intent, venue] of directives) {
      if (!plan.some(p => p.intent === intent && (p.venue ?? undefined) === venue && (!p.locale || p.locale === locale))) add('CTA1', 'fail', 'Directive absent from CTA plan.', locale);
    }
    // Direct affiliate links and invitation codes cannot bypass the directive plan.
    if (/\b(nexu888|nexubest|11350287|48553|4BRhe|7f97gkqw|luckybitcoin)\b|https?:\/\/[^\s)]+[?&](ref|referral|invite|affiliate|code)=/iu.test(body)) add('CTA1', 'fail', 'Partner codes/affiliate URLs must not be hard-coded in prose.', locale);
    const partnerMentions = partnerRegistry.map(p => p.name).reduce((count, venue) => count + (body.match(new RegExp(venue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu')) ?? []).length, 0);
    if (partnerMentions > 2) add('CTA1', 'fail', 'At most two partner mentions per edition.', locale);
  }
  for (const p of plan) {
    const allowed = meta.lane === 'search_intent' ? ['site_tool', 'fees', 'signup', 'venue_support'] : intents[event] ?? ['site_tool'];
    if (!allowed.includes(p.intent) || !meta.topic_tags?.includes(p.intent)) add('CTA1', 'fail', 'CTA intent must match event and topic tags.');
    if (p.venue && (!isPartner(p.venue) || neutralOnly.has(event) || !meta.partner_names?.includes(p.venue) || !meta.relatedVenues?.includes(p.venue) || !evidence.some(e => e.venues?.includes(p.venue) && directKinds.has(e.kind)))) add('CTA1', 'fail', 'Commercial venue must be a supporting story partner; this event may require neutral tools.');
  }
  if (plan.length > 2) add('CTA1', 'fail', 'At most two planned in-body CTAs.');
  if (['dispute', 'viral_claim', 'lawsuit'].includes(event)) {
    const response = meta.counterparty_response;
    const checked = meta.counterparty_checked_at;
    if (!(validUrl(response) && evidence.some(e => e.url === response) && Object.values(articles).every(body => body.includes(response))) && !(typeof response === 'string' && response === `no public response as of ${checked}` && utcTime(checked) && Date.parse(checked) <= Date.parse(now) && Object.values(articles).every(body => body.includes(response)))) add('D1', 'fail', 'Dispute needs sourced response or explicit checked UTC no-response statement.');
  }
  if (!historyComplete) add('DUP', 'needs-review', 'Both feed summary and ledger are required for duplicate checks.');
  for (const previous of history) {
    const timestamp = previous.publishedAt ?? previous.published_at ?? previous.createdAt ?? previous.recordedAt ?? previous.timestamp;
    if (!Number.isFinite(Date.parse(timestamp))) { add('DUP', 'needs-review', 'History row has no valid publication timestamp.'); continue; }
    const age = Date.parse(now) - Date.parse(timestamp);
    if (age < 0 || age > 48 * 3600 * 1000) continue;
    const titles = typeof previous.title === 'string' ? [previous.title] : Object.values(previous.title ?? {});
    if (!titles.length && !previous.primaryQuery) add('DUP', 'needs-review', 'Recent publication lacks title/query metadata.');
    const current = typeof meta.title === 'string' ? [meta.title] : Object.values(meta.title ?? {});
    if ((meta.primaryQuery && previous.primaryQuery && norm(meta.primaryQuery) === norm(previous.primaryQuery)) || current.some(a => titles.some(b => norm(a) === norm(b)))) add('DUP', 'fail', `Duplicate title/query in last 48 hours: ${previous.slug ?? 'unknown'}.`);
    else if (current.some(a => titles.some(b => similarity(a, b) >= 0.82)) || (meta.primaryQuery && previous.primaryQuery && similarity(meta.primaryQuery, previous.primaryQuery) >= 0.82)) add('DUP', 'needs-review', `Near-duplicate in last 48 hours: ${previous.slug ?? 'unknown'}.`);
  }
  if (!(meta.credibility >= 2)) add('AUTO', 'needs-review', 'Auto-publish requires credibility >= 2.');
  const status = reasons.some(r => r.severity === 'fail') ? 'fail' : reasons.length ? 'needs-review' : 'pass';
  return { status, legacy: false, publishAllowed: status === 'pass', reasons };
}
