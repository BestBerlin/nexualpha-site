// Operator-only draft inventory; importing this module cannot send or schedule messages.
import { TELEGRAM_WEEK4_CONTEXT_RETURN_PACK } from './telegram-config.js';
import { internationalSourceRegistry } from './international-source-registry.js';
import { BRAZIL_SOURCES, getBrazilPage } from './brazil-market.js';
import { priorityVenueAnswerFor } from './priority-venue-answers.js';
import { compareDirectAnswerFor } from './compare-direct-answers.js';

const titles = ['SPEI y comprobación de cuenta', 'Pix e conta: verificações separadas', '日本の利用条件を公式情報で確認', '지갑 연결 전 공식 경로 확인', 'Türkiye için kaynak ve hesap kontrolü', '香港帳戶與產品條件', 'Singapore: compare before choosing', '台灣法規來源與生效日期', 'US account and product boundaries', 'EU service entity and product checks', 'UK account scope and official sources', 'Indonesia: sumber dan kondisi akun', 'Perpetual DEX: funding and custody', 'Inspect the Bitget path on NexuAlpha'];
const lead = {
 en: 'Review the dated sources and account conditions on NexuAlpha before choosing your next step.',
 es: 'Revisa las fuentes fechadas y las condiciones de tu cuenta en NexuAlpha antes de elegir el siguiente paso.',
 'pt-BR': 'Confira as fontes datadas e as condições da conta na NexuAlpha antes de escolher o próximo passo.',
 ja: '次の操作を選ぶ前に、NexuAlphaで日付付きの情報源とアカウント条件を確認してください。',
 ko: '다음 단계를 선택하기 전에 NexuAlpha에서 날짜가 표시된 출처와 계정 조건을 확인하세요.',
 tr: 'Sonraki adımı seçmeden önce NexuAlpha üzerinde tarihli kaynakları ve hesap koşullarını kontrol edin.',
 'zh-Hant': '選擇下一步前，請在 NexuAlpha 核對附日期的來源與帳戶條件。',
 id: 'Periksa sumber bertanggal dan ketentuan akun di NexuAlpha sebelum memilih langkah berikutnya.',
};
// Each additional slot has a distinct decision question, rather than replaying the first fortnight.
const additional = [
 ['br-pix-deposit', 'BR', 'pt-BR', 'spot', '/br/pix', 'Pix: confira a rota de depósito', 'Match BRL deposit method, account holder and current platform screen.'],
 ['br-pix-withdraw', 'BR', 'pt-BR', 'spot', '/br/saque-pix', 'Pix: confira a rota de saque', 'Separate withdrawal availability, destination account and displayed costs.'],
 ['br-cpf-identity', 'BR', 'pt-BR', 'spot', '/br/kyc-cpf', 'CPF e verificação de identidade', 'Separate CPF documentation from KYC approval; verify the official flow.'],
 ['br-cost-assumptions', 'BR', 'pt-BR', 'spot', '/br/custos', 'Custos: revise as premissas', 'Review editable fee assumptions; do not claim a live or guaranteed net rate.'],
 ['br-shortlist-review', 'BR', 'pt-BR', 'spot', '/br', 'Compare sua lista de plataformas', 'Check shortlist suitability and Pix evidence without inventing local eligibility.'],
 ['mx-spei-funding', 'MX', 'es', 'spot', '/mx/conta', 'SPEI: revisa la titularidad de la cuenta', 'Check SPEI account identity and funding steps; preserve research/noindex policy.'],
 ['mx-comparison', 'MX', 'es', 'spot', '/mx/comparar', 'Compara antes de elegir', 'Review local scope and meaningful platform differences before any handoff.'],
 ['mx-cost-assumptions', 'MX', 'es', 'spot', '/mx/costos', 'Costos en MXN: comprueba las premisas', 'Separate published trading fees from funding, conversion and withdrawal assumptions.'],
 ['hyperliquid-fee-stack', 'GLOBAL', 'en', 'perpetuals', '/exchanges/hyperliquid', 'Hyperliquid: fees and funding are separate', 'Published fees, funding, account mode and liquidation conditions are separate checks.', 'hyperliquid'],
 ['uniswap-wallet-preview', 'GLOBAL', 'en', 'dex', '/exchanges/uniswap', 'Uniswap: check chain and wallet preview', 'Verify deployment address, approval and swap preview; do not imply testnet asset value.', 'uniswap'],
 ['gmx-pool-cost', 'GLOBAL', 'en', 'perpetuals', '/exchanges/gmx', 'GMX: pool liquidity and borrowing costs', 'Separate pool liquidity, collateral, funding and borrowing fee mechanics.', 'gmx'],
 ['deribit-margin-scope', 'GLOBAL', 'en', 'perpetuals', '/exchanges/deribit', 'Deribit: margin and API environments', 'Review product, margin and test/production environments without eligibility promises.', 'deribit'],
 ['cex-fee-vs-access', 'GLOBAL', 'en', 'spot', '/compare/binance-vs-okx', 'Binance vs OKX: cost and account access', 'Compare published cost, custody and account requirements without benefit guarantees.', 'binance-vs-okx'],
 ['copy-trading-scope', 'GLOBAL', 'en', 'perpetuals', '/compare/bybit-vs-bitget', 'Bybit vs Bitget: derivatives and copy-trading scope', 'Separate copy trading risk and derivatives access from registration.', 'bybit-vs-bitget'],
 ['swap-routing', 'GLOBAL', 'en', 'dex', '/compare/uniswap-vs-jupiter', 'Uniswap vs Jupiter: chain and routing', 'Review ecosystem, execution path and token/chain verification before signing.', 'uniswap-vs-jupiter'],
 ['rates-scenario-review', 'GLOBAL', 'en', 'spot', '/rates', 'Fee scenarios: assumptions before totals', 'Confirm maker/taker and scenario assumptions; no live rate or account outcome claim.'],
];

export function sourceEvidenceForReviewSlot(slot) {
 const rows = [];
 const path = new URL(slot.firstOnsiteRoute, 'https://nexualpha.com').pathname;
 if (slot.market === 'BR') {
  const ids = getBrazilPage(path)?.sourceIds || [];
  rows.push(...BRAZIL_SOURCES.filter(s => ids.includes(s.id)).map(s => ({ sourceId: s.id, url: s.url, recordedReviewDate: s.checkedAt, registry: 'src/data/brazil-market.js', sourceOwner: path, scope: 'regional_source_context', locale: 'pt-BR', provesRegionQualification: false })));
 } else {
  const regional = internationalSourceRegistry[slot.market];
  rows.push(...(regional?.sources || []).map(s => ({ url: s.url, recordedReviewDate: s.reviewedAt, registry: 'src/data/international-source-registry.js', sourceOwner: slot.market, scope: 'region_qualification_context', locale: null, provesRegionQualification: false })));
 }
 const venue = slot.returnContext.venue;
 const pair = slot.returnContext.pair;
 let owner = null;
 let answer = null;
 let registry = null;
 let scope = 'platform_mechanics';
 if (venue) {
  answer = priorityVenueAnswerFor(venue, 'en');
  if (answer) { owner = `/exchanges/${venue}`; registry = 'src/data/priority-venue-answers.js'; }
 } else if (pair) {
  answer = compareDirectAnswerFor(pair, 'en');
  if (answer) { owner = `/compare/${pair}`; registry = 'src/data/compare-direct-answers.js'; scope = 'platform_comparison'; }
 }
 // These documented supporting contexts are not the landing-page owner and
 // cannot stand in for either local eligibility or a completed decision review.
 if (!answer && (venue === 'bitget' || path === '/rates')) {
  const supportingPair = venue === 'bitget' ? 'bybit-vs-bitget' : 'binance-vs-okx';
  answer = compareDirectAnswerFor(supportingPair, 'en');
  owner = `/compare/${supportingPair}`;
  registry = 'src/data/compare-direct-answers.js';
  scope = 'supporting_context_only';
 }
 if (answer) rows.push(...(answer.sources || answer.sourceLinks || []).map(([label, url]) => ({ label, url, recordedReviewDate: answer.sourceReviewedAt?.[url] || answer.reviewedAt || null, registry, sourceOwner: owner, scope, locale: 'en', provesRegionQualification: false })));
 return rows;
}
const inherited = TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots.map((slot, i) => ({
 ...slot, title: titles[i], origin: 'existing-14day-template',
 // This regional source-check has FSA/bitFlyer evidence. Keep its landing
 // context and use the existing generic Japan action without selecting a venue.
 ...(slot.id === 'jp-exchange-source-check' ? { botDeepLinkAction: { action: 'partner_desk', market: 'JP', locale: 'ja', product: 'spot', campaign: slot.returnContext.campaign } } : {}),
 // Hong Kong account research does not select the legacy OKX monitor.
 ...(slot.id === 'hk-account-language-route' ? { botDeepLinkAction: { action: 'partner_desk', market: 'HK', locale: 'zh-Hant', product: 'spot', campaign: slot.returnContext.campaign } } : {}),
}));
const extra = additional.map(([id, market, locale, product, route, title, reviewFocus, object], i) => {
 const pair = object?.includes('-vs-') ? object : null;
 const venue = object && !pair ? object : null;
 const returnContext = { ...(pair ? { pair } : venue ? { venue } : { route }), market, locale, product, campaign: `oct01_${id.replaceAll('-', '_')}` };
 return { day: i + 15, id, market, locale, product, type: pair ? 'compare' : venue ? 'venue' : 'regional', firstOnsiteRoute: `${route}?market=${market}&product=${product}&locale=${locale}`, returnContext, title, reviewFocus, origin: 'distinct-second-fortnight-decision' };
});

export const TELEGRAM_30DAY_REVIEW_QUEUE = Object.freeze({
 version: '2026-10-01-context-review-30day-v1',
 createdAt: '2026-10-01', status: 'draft_only', cadenceDays: 30,
 calendarBoundary: 'Review target dates only; no scheduled delivery or publication authorization.',
 requiredReturnParams: TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.requiredReturnParams,
 allowedContextFields: ['route', 'venue', 'pair', 'market', 'locale', 'product', 'campaign', 'accountStage', 'funding'],
 reviewWindows: ['24h', '7d'],
 slots: [...inherited, ...extra].map(slot => ({
  ...slot, reviewTargetDate: new Date(Date.UTC(2026, 9, slot.day)).toISOString().slice(0, 10),
  status: 'draft_pending_manual_review', approvedAt: null, publishedAt: null,
  draftCopy: `${slot.title}\n\n${lead[slot.locale]}\nhttps://nexualpha.com${slot.firstOnsiteRoute}`,
  sourceEvidence: sourceEvidenceForReviewSlot(slot),
  reviewConditions: ['Verify live landing HTTP, locale and page scope.', 'Reopen registered official sources and record the actual review date; existing dates are historical.', 'Review sourceOwner and scope separately: platform mechanics and supporting context do not establish regional eligibility or a reviewed landing decision.', slot.reviewFocus, 'Reject unsupported eligibility, live rates, rewards or partner outcomes.', 'Mint anonymous return URL at review time; check its TTL and allowed fields.', 'Publication requires separate explicit authorization; leave approvedAt and publishedAt null until evidence exists.'],
 })),
});
