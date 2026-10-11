// Internal links from news articles to the commercial pages (owner 2026-10-10, GSC: /exchanges/* and /compare/* earn
// no clicks). The first plain-text mention of each partner exchange in an article body links to its profile page, and
// an article that mentions two or more partners ends with a short "Related" line. Partner names and slugs come from
// src/data/partner-registry.js (never typed here); headings, code spans and existing links are left untouched because
// the linker only rewrites plain string segments that the markdown renderer hands it.
import { getAllPartners } from "../../../data/partner-registry.js";
import { localizedPath } from "../../../data/locale-routing.js";
import { referralTitleAllowed } from "../../../data/referral-seo.js";

// Mirror of the Worker's curated comparison routes (worker/index.js CURATED_COMPARISONS): only these pairs get a
// "Compare A vs B" link, in the order the route is published.
export const CURATED_COMPARE_PAIRS = Object.freeze([
  ["binance", "okx"], ["binance", "bybit"], ["okx", "bybit"], ["binance", "mexc"], ["okx", "mexc"], ["bybit", "bitget"],
  ["hyperliquid", "dydx"], ["uniswap", "jupiter"], ["binance", "kraken"], ["gate-io", "mexc"],
]);

export const PARTNER_RELATED_COPY = Object.freeze({
  en: { related: "Related", feesRebate: (n) => `${n} fees & rebate`, feesProfile: (n) => `${n} fees & profile`, compare: (a, b) => `Compare ${a} vs ${b}` },
  "zh-Hans": { related: "相关", feesRebate: (n) => `${n} 手续费与返佣`, feesProfile: (n) => `${n} 手续费与平台档案`, compare: (a, b) => `对比 ${a} 与 ${b}` },
  "zh-Hant": { related: "相關", feesRebate: (n) => `${n} 手續費與返傭`, feesProfile: (n) => `${n} 手續費與平台檔案`, compare: (a, b) => `比較 ${a} 與 ${b}` },
  es: { related: "Relacionado", feesRebate: (n) => `Comisiones y reembolso de ${n}`, feesProfile: (n) => `Comisiones y perfil de ${n}`, compare: (a, b) => `Comparar ${a} y ${b}` },
  "pt-BR": { related: "Relacionado", feesRebate: (n) => `Taxas e cashback da ${n}`, feesProfile: (n) => `Taxas e perfil da ${n}`, compare: (a, b) => `Comparar ${a} e ${b}` },
  fr: { related: "À lire aussi", feesRebate: (n) => `Frais et remise ${n}`, feesProfile: (n) => `Frais et profil ${n}`, compare: (a, b) => `Comparer ${a} et ${b}` },
  de: { related: "Verwandt", feesRebate: (n) => `${n} Gebühren und Rabatt`, feesProfile: (n) => `${n} Gebühren und Profil`, compare: (a, b) => `${a} und ${b} vergleichen` },
  it: { related: "Correlati", feesRebate: (n) => `Commissioni e rimborso ${n}`, feesProfile: (n) => `Commissioni e profilo ${n}`, compare: (a, b) => `Confronta ${a} e ${b}` },
  ja: { related: "関連", feesRebate: (n) => `${n} の手数料と還元`, feesProfile: (n) => `${n} の手数料と概要`, compare: (a, b) => `${a} と ${b} を比較` },
  ko: { related: "관련", feesRebate: (n) => `${n} 수수료와 페이백`, feesProfile: (n) => `${n} 수수료와 프로필`, compare: (a, b) => `${a} vs ${b} 비교` },
  ru: { related: "См. также", feesRebate: (n) => `Комиссии и возврат ${n}`, feesProfile: (n) => `Комиссии и профиль ${n}`, compare: (a, b) => `Сравнить ${a} и ${b}` },
  tr: { related: "İlgili", feesRebate: (n) => `${n} ücretleri ve iade`, feesProfile: (n) => `${n} ücretleri ve profil`, compare: (a, b) => `${a} ile ${b} karşılaştırması` },
  id: { related: "Terkait", feesRebate: (n) => `Biaya dan rabat ${n}`, feesProfile: (n) => `Biaya dan profil ${n}`, compare: (a, b) => `Bandingkan ${a} vs ${b}` },
  vi: { related: "Liên quan", feesRebate: (n) => `Phí và hoàn phí ${n}`, feesProfile: (n) => `Phí và hồ sơ ${n}`, compare: (a, b) => `So sánh ${a} và ${b}` },
  ar: { related: "ذات صلة", feesRebate: (n) => `رسوم ${n} والاسترداد`, feesProfile: (n) => `رسوم ${n} وملف المنصة`, compare: (a, b) => `مقارنة ${a} و${b}` },

 // l10n: needs native review
 ur: {related:"متعلقہ",feesRebate:(n)=>`${n} کی فیس اور واپسی`,feesProfile:(n)=>`${n} کی فیس اور تعارف`,compare:(a,b)=>`${a} اور ${b} کا موازنہ`},
 // l10n: needs native review
 uk: {related:"Пов’язане",feesRebate:(n)=>`Комісії та повернення ${n}`,feesProfile:(n)=>`Комісії та профіль ${n}`,compare:(a,b)=>`Порівняти ${a} та ${b}`},
});

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Mention patterns for every partner, longest name first so "Gate.io" is matched before any shorter overlap. */
export function partnerMentionTargets(partners = getAllPartners()) {
  return partners
    .filter((partner) => partner?.slug && partner?.name)
    .map((partner) => ({
      slug: partner.slug,
      name: partner.name,
      // Latin letters/digits mark a word boundary; CJK text may touch the name directly ("OKX手续费").
      pattern: new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(partner.name)}(?![A-Za-z0-9])`, "i"),
    }))
    .sort((a, b) => b.name.length - a.name.length);
}

/**
 * Stateful linker for one article render. `createLink({ slug, name, href, text })` builds the link node.
 * - linkSegments(segments): rewrites plain string segments, linking the FIRST mention of each partner once per article;
 *   non-string segments (existing links, code, strong) pass through untouched.
 * - observe(text): records mentions without linking (headings), so the related line can still count them.
 */
export function createPartnerAutolinker({ locale = "en", partners = getAllPartners(), createLink }) {
  const targets = partnerMentionTargets(partners);
  const linked = new Set();
  const mentioned = [];
  const note = (slug) => { if (!mentioned.includes(slug)) mentioned.push(slug); };
  const observe = (text) => {
    for (const target of targets) if (target.pattern.test(String(text))) note(target.slug);
  };
  const linkText = (text) => {
    const out = [];
    let rest = String(text);
    while (rest) {
      let best = null;
      for (const target of targets) {
        if (linked.has(target.slug)) {
          if (target.pattern.test(rest)) note(target.slug);
          continue;
        }
        const match = target.pattern.exec(rest);
        if (match && (!best || match.index < best.index)) best = { index: match.index, text: match[0], target };
      }
      if (!best) { out.push(rest); break; }
      if (best.index > 0) out.push(rest.slice(0, best.index));
      linked.add(best.target.slug);
      note(best.target.slug);
      out.push(createLink({ slug: best.target.slug, name: best.target.name, href: localizedPath(`/exchanges/${best.target.slug}`, locale), text: best.text }));
      rest = rest.slice(best.index + best.text.length);
    }
    return out;
  };
  const linkSegments = (segments) => (Array.isArray(segments) ? segments : [segments])
    .flatMap((segment) => (typeof segment === "string" ? linkText(segment) : [segment]));
  return { linkSegments, observe, mentionedSlugs: () => [...mentioned], linkedSlugs: () => [...linked] };
}

function curatedPair(slugs) {
  const set = new Set(slugs);
  return CURATED_COMPARE_PAIRS.find(([a, b]) => set.has(a) && set.has(b)) || null;
}

/**
 * The end-of-article "Related" line: one profile link per mentioned partner (first three), plus a curated comparison
 * when the article mentions both venues of a published pair. Returns null below two partner mentions.
 */
export function relatedPartnerLinks({ locale = "en", slugs = [], partners = getAllPartners() }) {
  const copy = PARTNER_RELATED_COPY[locale] || PARTNER_RELATED_COPY.en;
  const bySlug = new Map(partners.map((partner) => [partner.slug, partner]));
  const mentioned = slugs.filter((slug) => bySlug.has(slug));
  if (mentioned.length < 2) return null;
  const profiles = mentioned.slice(0, 3).map((slug) => {
    const partner = bySlug.get(slug);
    const promotional = Boolean(partner.hasReferral && partner.inviteCode) && referralTitleAllowed(slug, locale);
    return { slug, name: partner.name, href: localizedPath(`/exchanges/${slug}`, locale), label: (promotional ? copy.feesRebate : copy.feesProfile)(partner.name) };
  });
  const pair = curatedPair(mentioned);
  const compare = pair
    ? { slug: `${pair[0]}-vs-${pair[1]}`, href: localizedPath(`/compare/${pair[0]}-vs-${pair[1]}`, locale), label: copy.compare(bySlug.get(pair[0]).name, bySlug.get(pair[1]).name) }
    : null;
  return { label: copy.related, profiles, compare };
}
