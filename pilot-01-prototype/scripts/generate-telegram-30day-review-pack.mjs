import { writeFile, mkdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TELEGRAM_30DAY_REVIEW_QUEUE, sourceEvidenceForReviewSlot } from '../src/data/telegram-30day-review-queue.js';
import { validateTelegramWeek4ContextReturnPackUrls } from '../src/data/telegram-config.js';

export function buildReviewPack(queue = TELEGRAM_30DAY_REVIEW_QUEUE) {
 const slots = queue.slots || [];
 if (queue.status !== 'draft_only' || slots.length !== 30 || queue.cadenceDays !== 30) throw new Error('Expected 30 draft-only calendar slots');
 if (new Set(slots.map(s => s.id)).size !== 30 || new Set(slots.map(s => s.reviewTargetDate)).size !== 30) throw new Error('Duplicate slot or review date');
 for (const [i, slot] of slots.entries()) {
  if (slot.day !== i + 1 || slot.status !== 'draft_pending_manual_review' || slot.approvedAt !== null || slot.publishedAt !== null) throw new Error('Invalid draft review state');
  if (!slot.sourceEvidence?.length || slot.sourceEvidence.some(s => !s.url.startsWith('https://') || !s.registry)) throw new Error('Missing registered source');
  if (JSON.stringify(slot.sourceEvidence) !== JSON.stringify(sourceEvidenceForReviewSlot(slot))) throw new Error('Source owner, registry or scope mismatch');
  if (slot.id === 'jp-exchange-source-check') {
   const expectedAction = { action: 'partner_desk', market: 'JP', locale: 'ja', product: 'spot', campaign: slot.returnContext.campaign };
   if (JSON.stringify(slot.botDeepLinkAction) !== JSON.stringify(expectedAction)
    || slot.returnContext.route !== '/jp' || slot.market !== 'JP' || slot.locale !== 'ja' || slot.product !== 'spot'
    || !slot.sourceEvidence.some(source => source.sourceOwner === 'JP' && new URL(source.url).hostname === 'bitflyer.com')
    || !slot.sourceEvidence.some(source => source.sourceOwner === 'JP' && new URL(source.url).hostname === 'www.fsa.go.jp')) throw new Error('Japan draft action does not match source-check landing intent');
  }
  if (slot.id === 'hk-account-language-route') {
   const expectedAction = { action: 'partner_desk', market: 'HK', locale: 'zh-Hant', product: 'spot', campaign: slot.returnContext.campaign };
   if (JSON.stringify(slot.botDeepLinkAction) !== JSON.stringify(expectedAction)
    || slot.returnContext.route !== '/hk' || slot.returnContext.venue !== undefined || slot.returnContext.pair !== undefined
    || slot.market !== 'HK' || slot.locale !== 'zh-Hant' || slot.product !== 'spot'
    || slot.returnContext.market !== 'HK' || slot.returnContext.locale !== 'zh-Hant' || slot.returnContext.product !== 'spot'
    || new URL(slot.firstOnsiteRoute, 'https://nexualpha.com').pathname !== '/hk'
    || !slot.sourceEvidence.some(source => source.sourceOwner === 'HK' && new URL(source.url).hostname === 'www.sfc.hk')) throw new Error('Hong Kong draft action does not match regional account-check landing intent');
  }
  if (!slot.reviewConditions?.length || !slot.draftCopy?.includes('https://nexualpha.com/')) throw new Error('Missing draft or review conditions');
  if (Object.keys(slot.returnContext).some(k => !queue.allowedContextFields.includes(k))) throw new Error('Unknown or private return context field');
  const query = new URL(slot.firstOnsiteRoute, 'https://nexualpha.com');
  if (query.origin !== 'https://nexualpha.com' || [...query.searchParams.keys()].some(k => !['market','product','locale','account_stage','funding'].includes(k))) throw new Error('Unsafe landing parameters');
 }
 const validation = validateTelegramWeek4ContextReturnPackUrls({ pack: queue, now: Date.UTC(2026, 9, 1, 12) });
 if (validation.problems.length) throw new Error(`Return-route mismatch: ${JSON.stringify(validation.problems)}`);
 const serialized = JSON.stringify(queue);
 if (/11350287|nexu888|luckybitcoin|partner\.bitget|bsmkweb|topzhjdgxcb|[?&](?:ref|referral|inviteCode)=/i.test(serialized)) throw new Error('Protected invitation material in draft inventory');
 return { ...queue, generatedAt: '2026-10-01', validationStatus: 'PASS_LOCAL_CONTRACT_ONLY', productionLandingReview: 'pending_manual_review', scope: { cadenceDays: 30, selectedSlotCount: 30, telegramApiCalls: 0, telegramMessagesSent: 0, externalSubmissions: 0, partnerRegistryEdited: false }, returnUrlPolicy: 'Mint TTL-limited URLs when the slot is actually reviewed; never schedule stored sample URLs.', validation: { checkedSlots: validation.checkedSlots, problems: validation.problems } };
}

function parseOutputOptions(argv) {
 const options = {};
 for (let i = 0; i < argv.length; i++) {
  const key = argv[i];
  if (!['--output-dir', '--reviewed-at'].includes(key) || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('Expected --output-dir <directory> --reviewed-at <YYYY-MM-DD>');
  if (options[key]) throw new Error(`Duplicate option: ${key}`);
  options[key] = argv[++i];
 }
 const reviewedAt = options['--reviewed-at'];
 if (!options['--output-dir'] || !/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt || '')
  || !Number.isFinite(Date.parse(`${reviewedAt}T00:00:00.000Z`))
  || new Date(`${reviewedAt}T00:00:00.000Z`).toISOString().slice(0, 10) !== reviewedAt) throw new Error('Explicit output directory and valid review date required');
 return { outputDir: path.resolve(options['--output-dir']), reviewedAt };
}

async function generate() {
 const { outputDir, reviewedAt } = parseOutputOptions(process.argv.slice(2));
 const queuePack = buildReviewPack();
 // Package generation is separate from calendar creation and official-source review.
 const pack = { ...queuePack, queueGeneratedAt: queuePack.generatedAt, generatedAt: new Date().toISOString(), reviewedAt };
 const stem = `telegram-30day-context-review-pack-${reviewedAt.replaceAll('-', '')}`;
 const jsonPath = path.join(outputDir, `${stem}.json`);
 const mdPath = path.join(outputDir, `${stem}.md`);
 // Check every destination before mkdir or write. lstat also protects dangling symlinks.
 for (const destination of [jsonPath, mdPath]) {
  try { await lstat(destination); }
  catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  throw new Error(`Refusing to overwrite existing archive: ${destination}`);
 }
 const rows = pack.slots.map(s => `| ${s.day} | ${s.reviewTargetDate} | ${s.locale} | ${s.title} | ${s.firstOnsiteRoute} | ${s.reviewFocus} |`).join('\n');
 const md = `# Telegram 30-day context review inventory\n\nGenerated: ${pack.generatedAt}. Package review date: ${reviewedAt}. Queue generated: ${pack.queueGeneratedAt}. This package date does not refresh official-source dates. Status: **draft_only / pending_manual_review**.\n\nDates are review targets from October 1 to October 30, not a send schedule. Thirty distinct decision slots reuse existing source registries and first-party landing routes. The first fourteen preserve existing landing and return contexts; the Japan source-check draft corrects the inherited Bitget action to the existing generic Japan partner-desk action without selecting a platform; sixteen additional questions cover Pix deposit/withdrawal/CPF/costs, SPEI/account/comparison/costs, venue risk mechanics, platform comparisons and fee assumptions.\n\nNo Telegram API, message send, external submission or protected referral edit occurs. Local validation checks route/context alignment; it does not assert current HTTP, full language quality, source freshness, account acceptance or growth. Official source dates remain historical and must be rechecked per slot. Source owner and registry are explicit: region-qualification context is distinct from English platform mechanics, and neither proves local eligibility. Bitget comparison material and the day-30 rates comparison material are supporting_context_only; they do not claim owner-page source verification. Missing owners never receive an implicit generic source fallback.\n\n| Day | Review target | Locale | Draft subject | First onsite landing | Specific review condition |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n\nEach JSON slot contains localized draft copy, registered source evidence, anonymous allowed return context and mandatory review conditions. Approval and publication timestamps remain null. Generate fresh TTL-limited return URLs only at actual review time. Use the onsite URL first; preserve research/noindex boundaries for regional subpages. The original four-week goal still ends October 25; this 30-day inventory does not extend or mark that goal complete.\n\nReview gates: inspect live landing, verify locale and official sources, verify allowed context and TTL, reject unsupported partner outcomes, then obtain explicit publication authorization. Review anonymous 24h and 7d signals separately; registration/KYC/deposit/trade/commission remain unknown.\n`;
 await mkdir(outputDir, { recursive: true });
 // Exclusive writes prevent a concurrent invocation from overwriting an archive.
 await writeFile(jsonPath, `${JSON.stringify(pack, null, 2)}\n`, { flag: 'wx' });
 await writeFile(mdPath, md, { flag: 'wx' });
 console.log('Generated 30 draft-only review slots; no external calls.');
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await generate();
