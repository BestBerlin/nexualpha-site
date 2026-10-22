import { canonicalComparePairSlug } from './compare-slug.js';
import { feeFact } from './exchange-facts.js';
import { formatFee } from './format-fee.js';

export const STRIKING_DISTANCE_VENUES = Object.freeze(['bybit', 'gate-io', 'okx', 'hyperliquid', 'deribit', 'jupiter', 'mexc', 'backpack']);
const names = { bybit: 'Bybit', 'gate-io': 'Gate.io', okx: 'OKX', hyperliquid: 'Hyperliquid', deribit: 'Deribit', jupiter: 'Jupiter', mexc: 'MEXC', backpack: 'Backpack' };
const supported = (slug, locale) => STRIKING_DISTANCE_VENUES.includes(slug) && ['en', 'zh-Hans'].includes(locale);
const pair = (slug, product, locale) => {
  const fact = feeFact(slug, product);
  return fact.state === 'checked' ? `${formatFee(fact.maker, locale)}/${formatFee(fact.taker, locale)}` : null;
};

// Reviewed fee facts are shared with the fee ledger. Never turn an unchecked rate into a flat fee claim.
export function strikingDistanceVenueLead(slug, locale = 'en', { referral = true } = {}) {
  if (!supported(slug, locale)) return null;
  const zh = locale === 'zh-Hans';
  const name = names[slug];
  const spot = pair(slug, 'spot', locale);
  const perp = pair(slug, 'perp', locale);
  if (slug === 'hyperliquid' && !zh) return `Hyperliquid fees are ${spot || 'unverified'} maker/taker on spot and ${perp || 'unverified'} on perpetuals. A Hyperliquid funded account here uses your own USDC collateral, not an offer to get funded to trade Hyperliquid; Hyperliquid rebates refer to ${referral ? 'a conditional 4% referral fee discount' : 'referral terms to verify in the official app'}, not cashback.`;
  if (slug === 'gate-io' && !zh) return `Gate.io register: create an account on the official site, then check KYC and regional eligibility. ${spot && perp ? `Base maker/taker fees are ${spot} on spot and ${perp} on perpetuals; account tier and pair can change costs.` : 'Unchecked fee schedules are withheld; verify your account rate before trading.'}`;
  if (slug === 'hyperliquid') return zh
    ? `${name} 基础 maker/taker 费率：现货 ${spot}，永续合约 ${perp}。${referral ? "符合邀请条件的交易手续费享 4% 折扣；" : ""}通过官方 App 连接钱包并存入 USDC。`
    : `${name} base maker/taker fees are ${spot} on spot and ${perp} on perpetuals. ${referral ? "Eligible referred trading fees receive a 4% discount; connect" : "Connect"} a wallet and deposit USDC through the official app.`;
  if (spot && perp) return zh
    ? `${name} 已核对的基础 maker/taker 费率：现货 ${spot}，${slug === 'deribit' ? 'USDC 永续合约' : '永续合约'} ${perp}。账户等级、交易对和地区条件可能改变实际费率。`
    : `${name} checked base maker/taker fees are ${spot} on spot and ${perp} on ${slug === 'deribit' ? 'USDC perpetuals' : 'perpetuals'}. Account tier, pair and regional conditions can change the final rate.`;
  if (slug === 'mexc') return zh
    ? 'MEXC 手续费按交易对及地区变化，官方费率页与 API 的数字不一致，因此本页不发布统一费率。注册前请在官方页面核对交易对、身份认证和账户资格。'
    : 'MEXC fees vary by pair and region, and the official fee page and API disagree, so this page withholds a flat rate. Check the trading pair, KYC and account eligibility on the official site before signing up.';
  if (slug === 'gate-io') return zh
    ? 'Gate.io 注册前请在官方页面确认邀请码、KYC 和地区资格。当前未核对的费率不作为统一收费标准发布。'
    : 'Before signing up for Gate.io, check the code, KYC and regional eligibility on the official site. Unchecked rates are withheld rather than published as a flat fee.';
  if (slug === 'jupiter') return zh
    ? 'Jupiter 是 Solana 上的流动性路由，Swap API 提供报价与交易构建。本页尚无已核对的统一 maker/taker 费率；签名前核对实际报价、路由及网络成本。'
    : 'Jupiter routes Solana liquidity, with its Swap API providing quotes and transaction building. No flat maker/taker rate is verified here; check the quote, route and network costs before signing.';
  return zh
    ? 'Backpack Exchange 支持现货和永续合约，与自托管 Backpack Wallet 是不同产品。本页尚无已核对的统一费率；注册前请核对官方费率表、KYC 和地区资格。'
    : 'Backpack Exchange supports spot and perpetuals and is separate from the self-custodial Backpack Wallet. No flat rate is verified here; check the official fee schedule, KYC and regional eligibility before sign-up.';
}

export function strikingDistanceVenueTitle(slug, locale = 'en', code = null, year = new Date().getUTCFullYear()) {
  if (!supported(slug, locale)) return null;
  const name = names[slug];
  const wallet = ['hyperliquid', 'jupiter'].includes(slug);
  // GSC 2026-10-22: one title per ranking URL; related query variants live in the lead and FAQ.
  if (locale === 'en' && slug === 'hyperliquid') return `Hyperliquid fees, rebates & funded account checks (${year})`;
  if (locale === 'en' && slug === 'gate-io') return `Gate.io register: KYC, fees${code ? ` & code ${code}` : ` (${year})`}`;
  if (locale === 'zh-Hans') return `${name} ${wallet ? '手续费与钱包使用' : '手续费、注册与 KYC'}${code ? ` — 邀请码 ${code}` : ''}（${year}） | NexuAlpha`;
  return `${name} ${wallet ? 'fees & wallet setup' : 'fees, sign-up & KYC'}${code ? ` — referral code ${code}` : ''} (${year}) | NexuAlpha`;
}
export function strikingDistanceVenueH1(slug, locale = 'en', code = null) {
  if (!supported(slug, locale)) return null;
  const name = names[slug];
  const wallet = ['hyperliquid', 'jupiter'].includes(slug);
  if (locale === 'en' && slug === 'hyperliquid') return `Hyperliquid fees, rebates & funded account checks${code ? `: code ${code}` : ''}`;
  if (locale === 'en' && slug === 'gate-io') return `Gate.io register: KYC, fees${code ? ` & code ${code}` : ' & account checks'}`;
  return locale === 'zh-Hans'
    ? `${name} ${wallet ? '手续费与钱包使用' : '注册、手续费与 KYC'}${code ? `：邀请码 ${code} 有什么权益？` : '：需要核对什么？'}`
    : `${name} ${wallet ? 'fees and wallet setup' : 'sign-up, fees and KYC'}${code ? `: what you get with code ${code}` : ': what to check'}`;
}
export function strikingDistanceVenueDescription(slug, locale = 'en', partner = null) {
  if (!supported(slug, locale)) return null;
  const zh = locale === 'zh-Hans';
  const name = names[slug];
  const spot = pair(slug, 'spot', locale);
  if (!zh && slug === 'hyperliquid') return `Hyperliquid fees: perps maker/taker ${pair(slug, 'perp', locale) || 'unverified'}. Funded accounts use your USDC; ${partner?.inviteCode ? 'rebates mean a conditional 4% fee discount.' : 'check referral terms in the app.'}`;
  if (!zh && slug === 'gate-io') return `Gate.io register: sign up on the official site and check KYC. ${spot ? `Spot maker/taker ${spot}.` : 'Fee schedule unverified.'} Confirm your region and account terms.`;
  let lead = spot ? (zh ? `${name} 现货 maker/taker ${spot}。` : `${name} spot maker/taker ${spot}.`) : strikingDistanceVenueLead(slug, locale).split(zh ? '。' : '. ')[0] + (zh ? '。' : '.');
  if (slug === 'hyperliquid') lead = zh ? `${name} 永续 maker/taker ${pair(slug, 'perp', locale)}${partner?.inviteCode ? "；符合邀请条件享手续费 4% 折扣" : ""}。` : `${name} perps maker/taker ${pair(slug, 'perp', locale)}${partner?.inviteCode ? "; eligible referrals save 4% on fees" : ""}.`;
  if (slug === 'deribit') lead = zh ? `Deribit 现货 maker/taker ${spot}；USDC 永续 ${pair(slug, 'perp', locale)}（官方 API，${feeFact(slug, 'perp').checkedOn}）。注册前核对 KYC、账户实体与实际费率。` : `Deribit spot maker/taker ${spot}; USDC perps ${pair(slug, 'perp', locale)} (official API, ${feeFact(slug, 'perp').checkedOn}). Check KYC and account eligibility.`;
  if (slug === 'mexc') lead = zh ? 'MEXC 费率按交易对及地区变化，官方来源不一致，未发布统一费率。' : 'MEXC fees vary by pair and region; conflicting official rates are withheld.';
  if (slug === 'backpack') lead = zh ? 'Backpack 现货及永续费率需核对官方费率表。' : 'Backpack spot and perpetual fees: check the official schedule.';
  if (slug === 'jupiter') lead = zh ? 'Jupiter 提供 Solana 报价与交易路由；签名前核对报价及网络成本。' : 'Jupiter routes Solana swaps; check the quote and network costs before signing.';
  if (!partner?.inviteCode) return lead;
  const code = partner.inviteCode;
  if (slug === 'hyperliquid') return `${lead} ${zh ? '邀请码' : 'Referral code'} ${code}.`;
  const share = partner.share != null && partner.termsConfirmedOn ? Math.round(partner.share * 100) : null;
  return zh ? `${lead}官方注册邀请码 ${code}；${share ? `手续费最高返还 ${share}%。` : '尚未核实额外折扣。'}` : `${lead} Official sign-up code ${code}; ${share ? `up to ${share}% of fees back.` : 'no extra discount verified.'}`;
}
export function isStrikingDistanceVenueTitle(title, locale) {
  return supported(STRIKING_DISTANCE_VENUES.find(slug => title?.startsWith(`${names[slug]} `)), locale) && (title.includes(' | NexuAlpha'));
}
// Existing canonical comparison routes; each link is rendered in the profile body, with locale-aware routing.
export const STRIKING_DISTANCE_VENUE_COMPARISONS = Object.freeze(Object.fromEntries(Object.entries({
  bybit: ['binance-vs-bybit', 'bitget-vs-bybit'], 'gate-io': ['gate-io-vs-mexc', 'coinbase-vs-gate-io'], okx: ['binance-vs-okx', 'bybit-vs-okx'],
  hyperliquid: ['dydx-vs-hyperliquid', 'binance-vs-hyperliquid'], deribit: ['bybit-vs-deribit', 'deribit-vs-okx'], jupiter: ['jupiter-vs-uniswap', 'jupiter-vs-raydium'],
  mexc: ['gate-io-vs-mexc', 'binance-vs-mexc'], backpack: ['backpack-vs-binance', 'backpack-vs-bybit'],
}).map(([slug, pairs]) => [slug, Object.freeze(pairs.map(pair => canonicalComparePairSlug(pair.split('-vs-'))))])));
