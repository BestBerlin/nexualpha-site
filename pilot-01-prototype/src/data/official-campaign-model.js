import { campaignResearchLocalizedText, hasCampaignResearchLocale } from './official-campaign-localizations.js';

// Independent public-source research is not the Core's human-approved activity
// feed. This projection deliberately has no reviewStatus, verifiedAt or offer.
export const RESEARCH_RECHECK_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
export const OFFICIAL_RESEARCH_DOMAINS = {
  binance: ["binance.com"], coinbase: ["coinbase.com"], bybit: ["bybit.com"], bitget: ["bitget.com"], okx: ["okx.com"], kraken: ["kraken.com"],
  "gate-io": ["gate.com"], kucoin: ["kucoin.com"], mexc: ["mexc.com"], backpack: ["backpack.exchange"], deribit: ["deribit.com"],
  uniswap: ["uniswap.org"], pancakeswap: ["pancakeswap.finance"], jupiter: ["jup.ag"], raydium: ["raydium.io"], aerodrome: ["aerodrome.finance"],
  curve: ["curve.finance"], hyperliquid: ["hyperliquid.gitbook.io", "hyperliquid.xyz"], dydx: ["dydx.xyz"], gmx: ["gmx.io"], drift: ["drift.trade"],
};
const rewardStatuses = new Set(["PUBLIC_TERMS", "ACCOUNT_CONFIRMATION", "UNCONFIRMED", "NOT_APPLICABLE", "ENDED"]);


function timestamp(value) {
  if (typeof value !== "string" || !/T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function safeResearchUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".") || /^[\d.]+$/.test(url.hostname) || url.hostname.endsWith(".local")) return null;
    if (/(?:^|\/)(?:register|signup|sign-up|sign_in|signin|login|join)(?:\/|$)/i.test(url.pathname)) return null;
    if ([...url.searchParams.keys()].some((key) => /^(?:ref|referral|referralCode|invite|inviteCode|affiliate|affiliateId|utm_.*)$/i.test(key))) return null;
    return url.href;
  } catch { return null; }
}

export function officialResearchUrl(value, venueSlug) {
  const url = safeResearchUrl(value);
  if (!url) return null;
  const host = new URL(url).hostname;
  return (OFFICIAL_RESEARCH_DOMAINS[venueSlug] ?? []).some((domain) => host === domain || host.endsWith(`.${domain}`)) ? url : null;
}

export function campaignPeriod({ startAt = null, endAt = null } = {}, currentDate = Date.now()) {
  const now = currentDate instanceof Date ? currentDate.getTime() : Number(currentDate);
  const start = timestamp(startAt);
  const end = timestamp(endAt);
  if (!Number.isFinite(now) || (startAt && start === null) || (endAt && end === null) || (start !== null && end !== null && start >= end)) return "INVALID";
  if (end !== null && end <= now) return "ENDED";
  if (start !== null && start > now) return "UPCOMING";
  if (start !== null && end !== null) return "WITHIN_DATES";
  return "UNKNOWN";
}

const localizedResearchFallback = {
  ja: "公式ソースの詳細は現在確認中です。参加条件と特典は公式ページで確認してください。",
  ko: "공식 출처의 세부 내용은 현재 확인 중입니다. 참여 조건과 혜택은 공식 페이지에서 확인하세요.",
  tr: "Resmi kaynak ayrıntıları şu anda inceleniyor. Katılım koşullarını ve avantajları resmi sayfada doğrulayın.",
  es: "Los detalles de la fuente oficial se están verificando. Confirma las condiciones y los beneficios en la página oficial.",
  "pt-BR": "Os detalhes da fonte oficial estão em verificação. Confirme as condições e os benefícios na página oficial.",
  fr: "Les détails de la source officielle sont en cours de vérification. Confirmez les conditions et les avantages sur la page officielle.",
  de: "Die Details der offiziellen Quelle werden derzeit geprüft. Bestätige Bedingungen und Vorteile auf der offiziellen Seite.",
  ru: "Подробности официального источника проверяются. Уточните условия и преимущества на официальной странице.",
  ar: "يجري التحقق من تفاصيل المصدر الرسمي. تحقق من الشروط والمزايا في الصفحة الرسمية.",
  id: "Detail sumber resmi sedang diverifikasi. Konfirmasikan ketentuan dan manfaat di halaman resmi.",
  vi: "Chi tiết từ nguồn chính thức đang được xác minh. Hãy kiểm tra điều kiện và ưu đãi trên trang chính thức.",
  it: "I dettagli della fonte ufficiale sono in verifica. Conferma condizioni e vantaggi sulla pagina ufficiale.",
};

const unknownReward = {
  en: "No readable official reward source supports an offer at this check.",
  "zh-Hans": "本次核对没有可读取的官方奖励来源支持优惠结论。",
  "zh-Hant": "本次核對沒有可讀取的官方獎勵來源支持優惠結論。",
  ja: "今回の確認では、特典を裏付ける読み取り可能な公式リワードソースはありません。",
  ko: "이번 확인에서는 혜택을 뒷받침하는 읽을 수 있는 공식 보상 출처가 없습니다.",
  tr: "Bu kontrolde teklifi destekleyen okunabilir resmi ödül kaynağı yok.",
  ar: "لا يوجد في هذا الفحص مصدر مكافأة رسمي قابل للقراءة يدعم عرضاً.",
  es: "En esta revisión no hay una fuente oficial de recompensa legible que respalde una oferta.",
  "pt-BR": "Nesta verificação não há fonte oficial de recompensa legível que sustente uma oferta.",
  fr: "Lors de cette vérification, aucune source officielle de récompense lisible ne soutient une offre.",
  de: "Bei dieser Prüfung belegt keine lesbare offizielle Reward-Quelle ein Angebot.",
  ru: "В этой проверке нет читаемого официального источника вознаграждений, подтверждающего предложение.",
  id: "Pada pemeriksaan ini tidak ada sumber reward resmi yang dapat dibaca untuk mendukung suatu penawaran.",
  vi: "Trong lần kiểm tra này không có nguồn phần thưởng chính thức đọc được để hỗ trợ một ưu đãi.",
  it: "In questa verifica non esiste una fonte ufficiale leggibile sulle ricompense che supporti un’offerta.",
};

const supportedDisplayLocale = (locale) => {
  if (hasCampaignResearchLocale('binance', locale)) return locale;
  const baseLocale = String(locale || "").split("-")[0];
  return hasCampaignResearchLocale('binance', baseLocale) ? baseLocale : "en";
};

const hasLocaleText = (value, locale) => {
  if (typeof value === "string") return locale === "en";
  if (typeof value?.[locale] === "string") return true;
  const baseLocale = String(locale || "").split("-")[0];
  return typeof value?.[baseLocale] === "string";
};

const selectSourceContentLocale = (record, locale) => {
  if (hasLocaleText(record?.summary, locale)) return locale;
  const baseLocale = String(locale || "").split("-")[0];
  if (baseLocale && hasLocaleText(record?.summary, baseLocale)) return baseLocale;
  return "en";
};

const localText = (value, locale) => {
  if (typeof value === "string") return value;
  if (typeof value?.[locale] === "string") return value[locale];
  const baseLocale = String(locale || "").split("-")[0];
  if (typeof value?.[baseLocale] === "string") return value[baseLocale];
  return value?.en || localizedResearchFallback[locale] || localizedResearchFallback[baseLocale] || "";
};

const ownedText = (record, path, value, contentLocale, sourceContentLocale) => {
  const localized = campaignResearchLocalizedText(record.venueSlug, path, contentLocale);
  if (localized) return localized;
  return localText(value, sourceContentLocale);
};

export function researchView(record, locale = "en", currentDate = Date.now()) {
  if (!record || record.reviewMode !== "AI_SOURCE_CHECKED" || !/^[a-z0-9-]+$/.test(record.venueSlug ?? "")) return null;
  const now = currentDate instanceof Date ? currentDate.getTime() : Number(currentDate);
  const requestedLocale = supportedDisplayLocale(locale);
  const sourceContentLocale = selectSourceContentLocale(record, requestedLocale);
  const contentLocale = hasCampaignResearchLocale(record.venueSlug, requestedLocale) ? requestedLocale : sourceContentLocale;
  const checkedAt = timestamp(record.checkedAt);
  const sources = (record.sources ?? []).flatMap((source) => {
    const url = officialResearchUrl(source.url, record.venueSlug);
    if (!url) return [];
    const sourceTime = timestamp(source.checkedAt);
    return [{
      ...source, url, host: new URL(url).host, summary: ownedText(record, ['sources', source.id, 'summary'], source.summary, contentLocale, sourceContentLocale),
      access: source.access === "READ" && sourceTime !== null && sourceTime <= now ? "READ" : "INACCESSIBLE",
      checkedAt: sourceTime === null ? null : source.checkedAt,
      publishedAt: timestamp(source.publishedAt) === null ? null : source.publishedAt,
      startAt: timestamp(source.startAt) === null ? null : source.startAt,
      endAt: timestamp(source.endAt) === null ? null : source.endAt,
      freshness: sourceTime !== null && sourceTime <= now && now - sourceTime <= RESEARCH_RECHECK_AFTER_MS ? "SOURCE_SNAPSHOT" : "NEEDS_RECHECK",
      period: source.observedStatus === "ENDED" ? "ENDED" : campaignPeriod(source, now),
    }];
  });
  const sourceUrls = new Set(sources.filter((source) => source.access === "READ").map((source) => source.url));
  const reward = record.signupReward ?? {};
  const rewardSourceUrls = (reward.sourceUrls ?? []).map(safeResearchUrl).filter((url) => url && sourceUrls.has(url));
  const requestedStatus = rewardStatuses.has(reward.status) ? reward.status : "UNCONFIRMED";
  const status = ["PUBLIC_TERMS", "ACCOUNT_CONFIRMATION"].includes(requestedStatus) && !rewardSourceUrls.length ? "UNCONFIRMED" : requestedStatus;
  const unsupportedReward = status === "UNCONFIRMED" && requestedStatus !== status;
  return {
    venueSlug: record.venueSlug, checkedAt: checkedAt === null ? null : record.checkedAt,
    reviewMode: "AI_SOURCE_CHECKED", humanApproved: false, commercialAction: null,
    contentLocale, sourceContentLocale, usedFallback: sourceContentLocale !== contentLocale, summary: unsupportedReward ? localText(unknownReward, contentLocale) : ownedText(record, ['summary'], record.summary, contentLocale, sourceContentLocale),
    freshness: checkedAt !== null && checkedAt <= now && now - checkedAt <= RESEARCH_RECHECK_AFTER_MS && sources.length > 0 && sources.every((source) => source.freshness === "SOURCE_SNAPSHOT" && source.access === "READ") ? "SOURCE_SNAPSHOT" : "NEEDS_RECHECK",
    readSourceCount: sources.filter((source) => source.access === "READ").length,
    sources,
    evidenceRequirements: Object.fromEntries(Object.entries(record.evidenceRequirements ?? {}).map(([key, value]) => [key, Array.isArray(value) ? value.map((item, index) => ownedText(record, ['evidenceRequirements', key, String(index)], item, contentLocale, sourceContentLocale)).filter(Boolean) : value === null ? null : ownedText(record, ['evidenceRequirements', key], value, contentLocale, sourceContentLocale)])),
    signupReward: {
      status, kind: reward.kind ?? null,
      amount: status === "UNCONFIRMED" ? null : reward.amount ?? null,
      checkedAt: timestamp(reward.checkedAt) === null ? null : reward.checkedAt,
      summary: unsupportedReward ? localText(unknownReward, contentLocale) : ownedText(record, ['signupReward', 'summary'], reward.summary, contentLocale, sourceContentLocale),
      conditions: (unsupportedReward ? [] : reward.conditions ?? []).map((item, index) => ownedText(record, ['signupReward', 'conditions', String(index)], item, contentLocale, sourceContentLocale)).filter(Boolean),
      sourceUrls: rewardSourceUrls,
      startAt: timestamp(reward.startAt) === null ? null : reward.startAt,
      endAt: timestamp(reward.endAt) === null ? null : reward.endAt,
      timeZone: reward.timeZone ?? null,
      period: requestedStatus === "ENDED" ? "ENDED" : campaignPeriod(reward, now),
    },
    notices: (record.notices ?? []).map((item, index) => ownedText(record, ['notices', String(index)], item, contentLocale, sourceContentLocale)).filter(Boolean),
  };
}

// Research slugs share the catalogue, but never resolve as human-reviewed IDs.
export function researchRoute(pathname, venues = []) {
  if (!pathname.startsWith("/activities/research/")) return null;
  const match = pathname.match(/^\/activities\/research\/([a-z0-9-]+)$/);
  return match && venues.some((venue) => venue.slug === match[1])
    ? { name: "research", slug: match[1] }
    : { name: "notFound" };
}
