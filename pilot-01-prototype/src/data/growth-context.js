import { resolveMarketPolicy } from "./market-policy.js";
import {
  sanitizeDecisionAccountStage,
  sanitizeDecisionFunding,
  sanitizeDecisionMarket,
  sanitizeDecisionProduct,
} from "./decision-passport.js";

const SLUG_RE = /^[a-zA-Z0-9._-]{1,60}$/;
const WHITELIST_QUERY_KEYS = ['utm_source', 'utm_campaign', 'publisher', 'market', 'product', 'account_stage', 'funding'];

export function sanitizeGrowthSlug(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return SLUG_RE.test(trimmed) ? trimmed : null;
}

export function sanitizeMarket(value) {
  return sanitizeDecisionMarket(value);
}

export function sanitizeProduct(value) {
  return sanitizeDecisionProduct(value);
}

export function sanitizeAccountStage(value) {
  return sanitizeDecisionAccountStage(value);
}

export function sanitizeFunding(value, market) {
  return sanitizeDecisionFunding(value, market);
}

export function getGrowthContext(search = '', overrides = {}) {
  const params = new URLSearchParams(search || '');
  const market = sanitizeMarket(overrides.market)
    || sanitizeMarket(params.get('market'))
    || resolveMarketPolicy({ pathname: overrides.pathname }).targetMarket
    || 'unknown';
  const product = sanitizeProduct(overrides.product)
    || sanitizeProduct(params.get('product'))
    || targetProductFromPath(overrides.pathname)
    || 'unknown';
  const campaign = sanitizeGrowthSlug(overrides.campaign) || sanitizeGrowthSlug(params.get('utm_campaign'));
  const publisher = sanitizeGrowthSlug(overrides.publisher) || sanitizeGrowthSlug(params.get('publisher'));
  const accountStage = sanitizeAccountStage(overrides.accountStage) || sanitizeAccountStage(params.get('account_stage'));
  const funding = sanitizeFunding(overrides.funding, market) || sanitizeFunding(params.get('funding'), market);
  return {
    market,
    product,
    ...(campaign ? { campaign } : {}),
    ...(publisher ? { publisher } : {}),
    ...(accountStage ? { accountStage } : {}),
    ...(funding ? { funding } : {}),
  };
}

export function targetMarketFromPath(pathname) {
  if (typeof pathname !== 'string') return null;
  const policy = resolveMarketPolicy({ pathname });
  return ["BR", "ID", "TW", "HK", "OTHER", "EU", "UK"].includes(policy?.targetMarket) ? policy.targetMarket : null;
}

export function targetProductFromPath(pathname) {
  if (typeof pathname !== 'string') return null;
  if (pathname === '/br' || pathname.startsWith('/br/')) return 'spot';
  return null;
}

export function growthQuery(search = '', overrides = {}) {
  const params = new URLSearchParams();
  const source = sanitizeGrowthSlug(new URLSearchParams(search || '').get('utm_source'));
  const context = getGrowthContext(search, overrides);
  if (source) params.set('utm_source', source);
  if (context.campaign) params.set('utm_campaign', context.campaign);
  if (context.publisher) params.set('publisher', context.publisher);
  if (context.market !== 'unknown') params.set('market', context.market);
  if (context.product !== 'unknown') params.set('product', context.product);
  if (context.accountStage) params.set('account_stage', context.accountStage);
  if (context.funding) params.set('funding', context.funding);
  return params.toString();
}

export function appendGrowthQuery(href, search = '', overrides = {}) {
  const query = growthQuery(search, overrides);
  if (!query) return href;
  const [base, hash = ''] = href.split('#');
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}${query}${hash ? `#${hash}` : ''}`;
}

export function whitelistGrowthParams(search = '') {
  const input = new URLSearchParams(search || '');
  const output = new URLSearchParams();
  for (const key of WHITELIST_QUERY_KEYS) {
    const value = input.get(key);
    if (!value) continue;
    if (key === 'market' && !sanitizeMarket(value)) continue;
    if (key === 'product' && !sanitizeProduct(value)) continue;
    if (key === 'account_stage' && !sanitizeAccountStage(value)) continue;
    if (key === 'funding' && !sanitizeFunding(value, sanitizeMarket(input.get('market')))) continue;
    if (key !== 'market' && key !== 'product' && key !== 'account_stage' && key !== 'funding' && !sanitizeGrowthSlug(value)) continue;
    output.set(key, key === 'market' ? sanitizeMarket(value) : key === 'product' ? sanitizeProduct(value) : key === 'account_stage' ? sanitizeAccountStage(value) : key === 'funding' ? sanitizeFunding(value, sanitizeMarket(input.get('market'))) : value.trim());
  }
  return output;
}
