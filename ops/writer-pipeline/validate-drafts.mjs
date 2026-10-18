#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const neutral = new Set(['vi', 'ru', 'ar', 'zh-Hant', 'uk', 'ur']);
const label = /(?:referral code|invite code|邀请码|推荐码|邀請碼|kode referral|referans kodu|código de referido|招待コード|초대 코드|реферальный код|mã giới thiệu)\s*[:：]?\s*([\p{L}\p{N}_-]+)/giu;
export function checkDraft(meta, articles, research, built) {
  const errors = [];
  if (meta.status !== 'needs_review' || built.status !== 'needs_review' || built.review?.verdict !== 'PENDING' || built.review?.reviewedAt || built.review?.passes?.length) errors.push('Draft must not claim review or publication');
  if (!articles.en || !articles['zh-Hans']) errors.push('English and Chinese required');
  const sources = meta.sources ?? [], fetched = new Set(research.sources?.filter(s => s.body?.length >= 100 && Number.isFinite(Date.parse(s.fetchedAt))).map(s => s.url));
  if (new Set(sources.map(s => s.url)).size < 2 || !sources.some(s => s.primary === true)) errors.push('Two distinct sources including a primary required');
  if (sources.some(s => !fetched.has(s.url))) errors.push('Citation not fetched');
  const ids = new Set(sources.map(s => s.id));
  if (!meta.claims?.length || meta.claims.some(c => !c.sourceIds?.length || c.sourceIds.some(id => !ids.has(id)))) errors.push('Claims need valid source IDs');
  const partners = research.partners?.partners ?? [];
  const codes = new Set(partners.map(p => p.inviteCode).filter(Boolean));
  for (const [locale, md] of Object.entries(articles)) {
    const title = meta.titles?.[locale];
    if (!title || !md.startsWith(`# ${title}\n`)) errors.push(`${locale}: H1/title mismatch`);
    const body = md.slice(md.indexOf('\n## ') + 1);
    if (!md.includes('\n## ') || (locale === 'en' && !body.startsWith('## The short answer\n')) || (locale === 'zh-Hans' && !body.startsWith('## 简短回答\n'))) errors.push(`${locale}: short answer first`);
    const count = /^(zh|ja|ko)/.test(locale) ? (body.match(/[\u3400-\u9fff]/g) ?? []).length : (body.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’-]*/gu) ?? []).length;
    if (count < (/^(zh|ja|ko)/.test(locale) ? 1000 : 900)) errors.push(`${locale}: thin body (${count})`);
    if (!/^## .*?(?:FAQ|Quick answers|常见问题|常見問題|Sorular|sorular|hỏi|ответ|Preguntas|Perguntas|Pertanyaan)/im.test(body)) errors.push(`${locale}: FAQ missing`);
    const combined = `${title}\n${md}\n${meta.summary?.[locale] ?? ''}${locale === 'en' ? `\n${meta.seo?.title ?? ''}` : ''}`;
    if (/not (?:financial|investment) advice|affiliate disclosure|we (?:may )?earn (?:a )?commission|不构成投资建议|免责声明|保證收益|保证收益|guaranteed (?:profit|reward)/i.test(combined)) errors.push(`${locale}: prohibited fine print or guarantee`);
    // Only code-shaped tokens count ("invite code field" is prose, "invite code ABC123" is a code).
    const codeShaped = token => codes.has(token) || /\d/.test(token) || /^[A-Z0-9_-]{4,}$/.test(token);
    for (const match of combined.matchAll(label)) {
      if (!codeShaped(match[1])) continue;
      if (neutral.has(locale) || !codes.has(match[1])) errors.push(`${locale}: unverified/neutral referral code ${match[1]}`);
    }
    // Verify a title's code belongs to the venue it names, rather than any known code.
    for (const text of [title, meta.summary?.[locale] ?? '', ...(locale === 'en' ? [meta.seo?.title ?? ''] : [])]) {
      for (const match of text.matchAll(label)) {
        const venues = partners.filter(p => text.toLowerCase().includes(p.name?.toLowerCase() || p.slug));
        if (venues.length !== 1 || venues[0].inviteCode !== match[1]) errors.push(`${locale}: code-title venue mismatch`);
      }
    }
    if (neutral.has(locale) && (/sign.?up|register|referral|invite code|đăng ký|giới thiệu|регистра|рефераль|注册|邀请码/i.test(combined) || [...codes].some(code => combined.includes(code)))) errors.push(`${locale}: neutral edition promotion`);
    if (locale === 'tr' && /bitget|backpack|hyperliquid|kraken|coinbase|gate\.io|mexc|kucoin|htx/i.test(combined)) errors.push('tr: unsupported venue');
    if (/tokenized stocks|xstocks|bstocks|rtoken|代币化股票|美股代币/i.test(combined)) {
      const prefix = locale === 'en' ? '' : `/${locale === 'zh-Hans' ? 'zh-hans' : locale === 'pt-BR' ? 'pt-br' : locale === 'id' ? 'id-id' : locale}`;
      const hub = `${prefix}/tokenized-stocks`;
      if (!md.includes(`](${hub})`) || !meta.internalLinks?.includes(hub)) errors.push(`${locale}: tokenized stock hub missing`);
      for (const ticker of ['NVDA','TSLA','AAPL','MSFT','COIN','MSTR','HOOD','CRCL','GOOGL','AMZN','SPY','QQQ']) if (new RegExp(`\\b${ticker}\\b`).test(md)) {
        const link = `${hub}/${ticker.toLowerCase()}`;
        if (!md.includes(`](${link})`) || !meta.internalLinks?.includes(link)) errors.push(`${locale}: ${ticker} link missing`);
      }
    }
  }
  return errors;
}
// Reviewer aid, not a gate: numbers in the English edition that appear in no fetched source body.
// Years, list ordinals, step numbers and our own partner codes are ignored.
export function ungroundedNumbers(articles, research) {
  const corpus = (research.sources ?? []).map(s => s.body ?? '').join('\n').replace(/[,\s]/g, '');
  const codes = new Set((research.partners?.partners ?? []).map(p => String(p.inviteCode)));
  const found = new Set();
  for (const m of (articles.en ?? '').matchAll(/\d[\d,]*(?:\.\d+)?%?/g)) {
    const n = m[0].replace(/,/g, '').replace(/%$/, '');
    if (n.length < 2 || /^(19|20)\d\d$/.test(n) || codes.has(n)) continue;
    if (!corpus.includes(n)) found.add(m[0]);
  }
  return [...found];
}
export async function validate(directory) {
  const json = async f => JSON.parse(await readFile(path.join(directory, f), 'utf8'));
  const [meta, research, built] = await Promise.all(['meta.json', 'research.json', 'article.json'].map(json));
  const articles = {};
  for (const l of Object.keys(meta.titles ?? {})) articles[l] = await readFile(path.join(directory, `article.${l}.md`), 'utf8');
  return checkDraft(meta, articles, research, built);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const errors = await validate(process.argv[2]);
    const json = async f => JSON.parse(await readFile(path.join(process.argv[2], f), 'utf8'));
    const en = await readFile(path.join(process.argv[2], 'article.en.md'), 'utf8').catch(() => '');
    const warnings = { ungroundedNumbers: ungroundedNumbers({ en }, await json('research.json')) };
    console.log(JSON.stringify({ draftChecksOnly: true, errors, warnings }, null, 2)); if (errors.length) process.exitCode = 1;
  }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
