import { REFERRAL_PARTNERS } from './referral-partners.generated.js';
import { binanceProStep } from './binance-pro-step.js';
import { isPartnerPromotableIn } from './partner-geo-policy.js';
import { isNeutralCtaLocale } from './locale-policy.js';
import en, { entryByVenue as enEntry } from './referral-native-copy/en.js';
import tr, { entryByVenue as trEntry } from './referral-native-copy/tr.js';
import id, { entryByVenue as idEntry } from './referral-native-copy/id.js';
import pt, { entryByVenue as ptEntry } from './referral-native-copy/pt-BR.js';
import es, { entryByVenue as esEntry } from './referral-native-copy/es.js';
import hans, { entryByVenue as hansEntry } from './referral-native-copy/zh-Hans.js';
import hant from './referral-native-copy/zh-Hant.js';
import vi from './referral-native-copy/vi.js';

const COPY = { en: { ...en, entryByVenue: enEntry }, tr: { ...tr, entryByVenue: trEntry }, id: { ...id, entryByVenue: idEntry }, 'pt-BR': { ...pt, entryByVenue: ptEntry }, es: { ...es, entryByVenue: esEntry }, 'zh-Hans': { ...hans, entryByVenue: hansEntry }, 'zh-Hant': hant, vi };
export const NATIVE_REFERRAL_SLUGS = Object.freeze(['bitget', 'okx', 'binance', 'bybit', 'htx', 'coinw', 'kraken']);
// Help-page review is separate from owner-confirmed partner terms. Null means not readable/verified.
export const REFERRAL_HELP = Object.freeze({
  bitget: { reviewedAt: '2026-10-14', official: 'https://www.bitget.com/support/articles/12560603808241', entry: 'field' },
  okx: { reviewedAt: '2026-10-14', official: 'https://www.okx.com/help/what-is-okx-referral-program', entry: 'field' },
  binance: { reviewedAt: '2026-10-14', official: 'https://www.binance.com/en/support/faq/detail/185520b0cb3d43d2a1ab0d12ba223d35', entry: 'binance', entrySource: { official: 'https://www.binance.com/en/support/faq/detail/360042718372' }, later: 'Binance' },
  bybit: { reviewedAt: '2026-10-14', official: 'https://www.bybit.com/en/help-center/article/How-to-Add-and-Check-Registered-Affiliate-Code', entry: 'bybit', entrySource: { official: 'https://www.bybit.com/en/help-center/article/How-to-register-an-account' }, later: 'Bybit' },
  htx: { reviewedAt: null, official: 'https://www.htx.com/support/en-us/detail/24870990308506', entry: null },
  coinw: { reviewedAt: '2026-10-14', official: 'https://www.coinw.com/help-center/faq/referral/2025-08-13/the-operation-process-of-generating-and-sharing-invitation-codes/6341', entry: 'field' },
  kraken: { reviewedAt: '2026-10-14', official: 'https://support.kraken.com/articles/kraken-app-referral-program', entry: 'app' },
});

// Answer-first lead (SEO/GEO pass 2026-10-15): one self-contained sentence an answer engine can quote verbatim —
// code, user benefit, payout cadence and the date the partner terms were confirmed. Values come from the partner
// registry; nothing is hand-typed. Neutral editions (zh-Hant, vi) get no lead because they show no code.
const SHORT_ANSWER = {
  en: { label: 'The short answer:', text: (name, code, benefit, cadence, date) => `Use ${name} referral code ${code} when you sign up. ${benefit}${cadence ? `, paid ${cadence}` : ''} (partner terms confirmed ${date}).` },
  'zh-Hans': { label: '简短回答：', text: (name, code, benefit, cadence, date) => `注册 ${name} 时填写邀请码 ${code}。${benefit}${cadence ? `，按${cadence}发放` : ''}（合作条款确认于 ${date}）。` },
  es: { label: 'Respuesta corta:', text: (name, code, benefit, cadence, date) => `Usa el código de referido de ${name} ${code} al registrarte. ${benefit}${cadence ? `, pagado ${cadence}` : ''} (condiciones del partner confirmadas el ${date}).` },
  'pt-BR': { label: 'Resposta curta:', text: (name, code, benefit, cadence, date) => `Use o código de indicação da ${name} ${code} no cadastro. ${benefit}${cadence ? `, pago ${cadence}` : ''} (termos do parceiro confirmados em ${date}).` },
  id: { label: 'Jawaban singkat:', text: (name, code, benefit, cadence, date) => `Gunakan kode referral ${name} ${code} saat mendaftar. ${benefit}${cadence ? `, dibayar ${cadence}` : ''} (ketentuan mitra dikonfirmasi ${date}).` },
  tr: { label: 'Kısa cevap:', text: (name, code, benefit, cadence, date) => `Kayıt olurken ${name} referans kodu ${code} kodunu girin. ${benefit}${cadence ? `, ödeme ${cadence}` : ''} (iş ortağı koşulları ${date} tarihinde doğrulandı).` },
};

export function nativeReferralFor(slug, locale = 'en', market) {
  const raw = String(locale || 'en').toLowerCase().replaceAll('_', '-');
  if (/^zh-(hant|tw|hk|mo)(-|$)/.test(raw)) locale = 'zh-Hant';
  else if (/^zh($|-(hans|cn|sg)(-|$))/.test(raw)) locale = 'zh-Hans';
  else if (/^pt(-|$)/.test(raw)) locale = 'pt-BR';
  else locale = raw.split('-')[0];
  const copy = COPY[locale];
  const partner = REFERRAL_PARTNERS.find(p => p.slug === slug);
  if (!copy || !partner || !NATIVE_REFERRAL_SLUGS.includes(slug)) return null;
  const neutral = isNeutralCtaLocale(locale) || !isPartnerPromotableIn(slug, { locale, market });
  // zh-Hant receives an informational answer, preserving its neutral policy. vi never receives a code page.
  if (neutral && locale !== 'zh-Hant') return null;
  const record = REFERRAL_HELP[slug];
  const help = { ...record, href: record.official, entryHref: record.entrySource?.official || record.official };
  const benefit = !neutral && partner.share != null && partner.termsConfirmedOn ? copy.share(Math.round(partner.share * 100)) : copy.noBenefit;
  const verifiedAt = !neutral ? partner.termsConfirmedOn || help.reviewedAt : help.reviewedAt;
  const code = neutral ? null : partner.inviteCode;
  // SEO audit 2026-10-14: keep native referral titles short and code-only. Dates and benefit wording stay in the
  // description/body, so search titles do not confuse a verification year with the invite code.
  const title = code ? `${copy.query(partner.name)}: ${code}` : null;
  const later = help.reviewedAt ? (copy[`later${help.later}`] || copy.laterUnknown) : copy.pending;
  const entry = help.reviewedAt && help.entry ? (copy.entryByVenue?.[slug] || copy.entryText) : copy.pending;
  // Owner 2026-10-14: the Binance code is a Pro-mode code, so its sign-up answer starts with that step.
  const entryWithStep = slug === 'binance' && code ? `${binanceProStep(locale)} ${entry}` : entry;
  const payout = !neutral && partner.termsConfirmedOn && partner.settle ? copy.payoutText(partner.name, copy.cadence[partner.settle]) : copy.noPayout;
  const lead = SHORT_ANSWER[locale];
  const shortAnswer = !neutral && code && lead && partner.share != null && partner.termsConfirmedOn
    ? { label: lead.label, text: lead.text(partner.name, code, benefit, partner.settle ? copy.cadence?.[partner.settle] : '', partner.termsConfirmedOn) }
    : null;
  return { slug, locale, copy, neutral, code, benefit, verifiedAt, title, help, entry: entryWithStep, later, payout, shortAnswer, partnerDate: neutral ? null : partner.termsConfirmedOn,
    faq: [ { question: copy.faqEntry(partner.name), answer: entryWithStep, source: help.entryHref }, { question: copy.faqLater(partner.name), answer: later, source: help.href }, { question: copy.faqPayout(partner.name), answer: payout, source: '/intel/partners.json', origin: 'partner-data' } ],
  };
}

// Exact title/H1 parity for this finite set of dated native-language answers. Other titles retain their budget.
export function isNativeReferralTitle(title, locale) {
  return typeof title === 'string' && NATIVE_REFERRAL_SLUGS.some(slug => nativeReferralFor(slug, locale)?.title === title);
}
