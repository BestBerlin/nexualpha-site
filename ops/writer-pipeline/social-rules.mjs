// Shared rules for every social draft (X, Telegram, YouTube Shorts scripts). Pure, no network.
// Owner rules: no fine print/disclaimers; never mention what we or the inviter earn; neutral locales
// (ru/ar/zh-Hant/ur/uk/vi) carry no codes or CTA; tr never Bitget; links only to OUR pages; owner stays anonymous.
import { weightedLength } from '../x-poster/x-poster.mjs';

export const NEUTRAL = Object.freeze(['ru', 'ar', 'zh-Hant', 'ur', 'uk', 'vi']);
export const isNeutral = (locale) => NEUTRAL.includes(locale);
export const SITE = 'https://nexualpha.com';
// Site locale prefixes (same as the site router and alert-sender LOCALE_PATH).
export const LOCALE_PATH = Object.freeze({ en: '', 'zh-Hans': '/zh-hans', 'zh-Hant': '/zh-hant', es: '/es', 'pt-BR': '/pt-br', id: '/id-id', tr: '/tr', vi: '/vi', ru: '/ru', ar: '/ar', ur: '/ur', uk: '/uk', ja: '/ja', ko: '/ko' });
// Telegram channels the social lane may draft for (ids are public chat ids, not secrets).
export const TELEGRAM_CHATS = Object.freeze({ 'zh-Hans': '@NexuAlphaClub', en: '@NexuAlphaGlobal', ru: '@NexuAlphaRU', tr: '-1003789577571', vi: '-1004303684624' });

const FINE_PRINT = /not (?:financial|investment|trading) advice|\bNFA\b|\bDYOR\b|do your own research|\bdisclaimer\b|\bdisclosure\b|\baffiliate\b|terms (?:and conditions )?apply|\bT&Cs? apply\b|risk warning|past performance|capital (?:is )?at risk|data may be delayed|lower bound|for reference only|免责声明|不构成(?:任何)?投资建议|投资有风险|风险提示|仅供参考|不構成(?:任何)?投資建議|投資有風險|不是投资建议|не является (?:инвестиционн|финансов)|yatırım tavsiyesi değil|no es (?:un )?consejo (?:financiero|de inversión)|não é (?:um )?conselho (?:financeiro|de investimento)|bukan (?:saran|nasihat) (?:keuangan|investasi)|không phải (?:là )?lời khuyên/i;
// What we / the inviter earn. Users' own rebate is fine; our side never appears.
const EARNINGS = /\bkickbacks?\b|\brev(?:enue)?[- ]share\b|\baffiliate (?:fee|income|payout)s?\b|\b(?:we|i|our team|nexualpha|the inviter|inviters?|referrers?|your inviter)\s+(?:also\s+)?(?:earn|get paid|receive|make|keep|pocket)s?\b|\b(?:we|i|nexualpha|the inviter|inviters?|referrers?|your inviter)\s+(?:also\s+)?gets?\s+(?:\d|a cut|a share|paid|rewarded|a reward|a rebate|a bonus)|\b(?:inviter|referrer)(?:'s)? (?:reward|bonus|commission|cut|share)\b|佣金|返佣给我们|我们(?:也)?(?:赚|获得|拿到|收取)|邀请人(?:也)?(?:获得|赚|可得|奖励)|推荐人(?:也)?(?:获得|赚|可得|奖励)|комисси[яюи] (?:нам|для нас)|мы (?:зарабатываем|получаем)/i;
const COMMISSION = /\bcommissions?\b/i;
const REGULATOR_COMMISSION = /(?:securities and exchange|commodity futures trading|federal trade|european|financial services|securities) commission/gi;
const PREDICTION = /\b(?:will|could|is going to|expected to|set to|predicted to|about to) (?:rise|fall|rally|surge|pump|moon|crash|reach|hit|explode|skyrocket)\b|\bprice (?:prediction|target)s?\b|\bguarantee[ds]?\b|\brisk[- ]free\b|\b\d{2,}x (?:gains?|returns?)\b|\bto the moon\b|稳赚|保证收益|保證收益|必涨|必漲|暴富|百倍/i;
const ANONYMITY = /best\s?berlin|btc_?berlin|bitcoin\s?berlin|柏萬億|柏万亿|lilixin|berlin2025|@\w*berlin\w*/i;
// Neutral locales: no sign-up/CTA/code/campaign pitch in any language we draft.
const CTA = /sign[\s-]?up|register|registration|join (?:now|today|here)|open an account|create an account|use (?:my |our |the )?code|invite code|referral|promo code|bonus|rebate|cashback|claim (?:your|the)|\/go\/|注册|註冊|邀请码|邀請碼|推荐码|返佣|返还|返還|开户|開戶|регистр|реферал|промокод|бонус|кэшбэк|đăng ký|mã giới thiệu|mã mời|hoàn phí|khuyến mãi|تسجيل|رمز الإحالة|مكافأة|رجسٹر|ریفرل|бонус|реєстр|реферальн|kayıt ol|referans kodu|davet kodu/i;
const CODE_LABEL = /(?:referral code|invite code|invitation code|promo code|(?:use|with|enter) code|邀请码|推荐码|邀請碼|kode referral|referans kodu|davet kodu|código(?: de referido| de convite| de indicação)?|招待コード|초대 코드|реферальный код|mã giới thiệu)\s*[:：]?\s*([\p{L}\p{N}_-]+)/giu;
// Any http(s) URL or bare domain. nexualpha.com is the only host allowed in social copy.
const URLISH = /(?:https?:\/\/[^\s<>"')]+|(?<![@\w.-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|io|net|org|xyz|exchange|app|cc|co|me|info|finance|trade|pro|ai|gg|so|to|us|tv|ly|link|site|top|vip|cafe|global)(?:\/[^\s<>"')]*)?)/gi;

export function linksIn(text) {
  return [...String(text ?? '').matchAll(URLISH)].map((m) => m[0].replace(/[.,!?;:。！？)]+$/u, ''));
}
// Our own page with an optional src tag; never /go/ (direct exchange redirect) and never another host.
export function ourLink(url) {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.protocol === 'https:' && /^(?:www\.)?nexualpha\.com$/i.test(u.hostname) && !/^\/(?:[a-z-]+\/)?go(?:\/|$)/i.test(u.pathname) && ![...u.searchParams.keys()].some((k) => /^(?:ref|referral|invite|code|affiliate_id|vipCode)$/i.test(k));
  } catch { return false; }
}
export const pageUrl = (locale, pathname, src) => `${SITE}${LOCALE_PATH[locale] ?? ''}${pathname}${src ? `?src=${src}` : ''}`;
export const tagsIn = (text) => String(text ?? '').match(/(?<![\w$#&])(?:#[\p{L}\p{N}_]+|\$[A-Za-z][A-Za-z0-9_]*)/gu) ?? [];

// Collect every human-readable string of a draft (text, link, script fields) for the shared rules.
export function draftStrings(draft) {
  const out = [draft.text, draft.title, draft.link, draft.hook, draft.cta, draft.description];
  for (const s of draft.scenes ?? []) out.push(s.visual, s.narration, s.onScreen);
  return out.filter((x) => typeof x === 'string' && x);
}

/**
 * Shared rule check for one social draft. Returns a list of error strings (empty = passes).
 * draft: { channel: 'x'|'telegram'|'youtube', locale, text?, link?, title?, hook?, scenes?, cta? }
 * ctx: { partners: [{ slug, name, inviteCode }] } (from /intel/partners.json)
 */
export function checkSocialDraft(draft, { partners = [] } = {}) {
  const errors = [];
  const locale = draft.locale;
  const all = draftStrings(draft).join('\n');
  const prose = all.replace(REGULATOR_COMMISSION, '');
  if (!['x', 'telegram', 'youtube'].includes(draft.channel)) errors.push('unknown channel');
  if (typeof locale !== 'string' || !locale) errors.push('locale required');
  if (FINE_PRINT.test(all)) errors.push('fine print / disclaimer');
  if (EARNINGS.test(all) || COMMISSION.test(prose)) errors.push('mentions what we or the inviter earn');
  if (PREDICTION.test(all)) errors.push('price prediction or guarantee');
  if (ANONYMITY.test(all)) errors.push('owner identity (anonymity rule)');
  for (const url of linksIn(all)) if (!ourLink(url)) errors.push(`link not to our page: ${url}`);
  if (draft.link && !ourLink(draft.link)) errors.push('draft link must be a nexualpha.com page');
  const codes = new Map(partners.filter((p) => p?.inviteCode).map((p) => [String(p.inviteCode).toLowerCase(), p]));
  const codeShaped = (t) => codes.has(t.toLowerCase()) || /\d/.test(t) || /^[A-Z0-9_-]{4,}$/.test(t);
  for (const m of all.matchAll(CODE_LABEL)) {
    if (!codeShaped(m[1])) continue;
    if (isNeutral(locale)) errors.push(`neutral locale carries a code (${m[1]})`);
    else if (!codes.has(m[1].toLowerCase())) errors.push(`unknown partner code ${m[1]}`);
  }
  if (isNeutral(locale)) {
    if (CTA.test(all)) errors.push('neutral locale carries a CTA / sign-up / bonus pitch');
    for (const code of codes.keys()) if (code.length >= 5 && new RegExp(`(?<![\\p{L}\\p{N}])${code.replace(/[-]/g, '\\-')}(?![\\p{L}\\p{N}])`, 'iu').test(all)) errors.push(`neutral locale carries partner code ${code}`);
  }
  if (locale === 'tr' && /bitget/i.test(all)) errors.push('tr: Bitget not allowed');
  if (locale === 'tr' && /backpack|hyperliquid/i.test(all) && (CTA.test(all) || [...all.matchAll(CODE_LABEL)].length)) errors.push('tr: no Backpack/Hyperliquid promotion');
  if (draft.channel === 'x') {
    const text = String(draft.text ?? '');
    const n = weightedLength(text);
    if (!text.trim()) errors.push('x: empty text');
    if (n > 280) errors.push(`x: ${n} weighted chars > 280`);
    const tags = tagsIn(text);
    if (tags.length < 2 || tags.length > 4) errors.push(`x: ${tags.length} tags (need 2-4)`);
  }
  if (draft.channel === 'telegram') {
    const text = String(draft.text ?? '');
    if (!text.trim()) errors.push('telegram: empty text');
    if (text.length > 1000) errors.push(`telegram: ${text.length} chars > 1000`);
    for (const m of text.matchAll(/<\/?([a-z]+)[^>]*>/gi)) if (!['b', 'i', 'a'].includes(m[1].toLowerCase())) errors.push(`telegram: tag <${m[1]}> not allowed`);
    for (const m of text.matchAll(/<a\s+href="([^"]+)"/gi)) if (!ourLink(m[1])) errors.push('telegram: anchor must point to our page');
  }
  if (draft.channel === 'youtube') {
    const scenes = draft.scenes ?? [];
    if (!draft.title || draft.title.length > 100) errors.push('youtube: title required (<=100 chars)');
    if (scenes.length < 3 || scenes.length > 8) errors.push('youtube: 3-8 scenes');
    if (scenes.some((s) => !s?.visual || !s?.narration)) errors.push('youtube: every scene needs visual + narration');
    const words = scenes.map((s) => s?.narration ?? '').join(' ');
    const length = /^(zh|ja|ko)/.test(locale) ? (words.match(/[㐀-鿿぀-ヿ가-힯]/g) ?? []).length / 2.5 : (words.match(/[\p{L}\p{N}]+/gu) ?? []).length;
    if (length > 170) errors.push(`youtube: narration too long (~${Math.round(length)} words > 170 for 60 s)`);
    if (!/cartoon|animated|mascot|chibi|q-?version|Q版/i.test(scenes.map((s) => s?.visual ?? '').join(' '))) errors.push('youtube: visuals must describe the cartoon mascot style');
  }
  return [...new Set(errors)];
}
