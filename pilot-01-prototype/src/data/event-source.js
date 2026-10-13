import { readIntelFeed } from "./announcement-intel.js";
import { campaignVisibleInLocale } from "./campaign-locale-policy.js";


export function sharedOfficialEventItems(feed, options = {}) {
  return readIntelFeed(feed, options);
}

export const EVENT_SOURCE_STATES = Object.freeze({
  CURRENT: "current",
  NO_NEWS: "no-news",
  PENDING_REVIEW: "pending-review",
  REGION_UNAVAILABLE: "region-unavailable",
});

export function eventVenueSlug(item) {
  return String(item?.venue || item?.platform?.slug || "").trim().toLowerCase();
}

function eventUrl(item) {
  return item?.officialSource?.url || item?.url || item?.sourceUrl || "";
}

function hasHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function hasPublicReview(item) {
  const rawReviewFields = Object.prototype.hasOwnProperty.call(item, "reviewStatus") || Object.prototype.hasOwnProperty.call(item, "fixture");
  return rawReviewFields ? item.reviewStatus === "APPROVED" && item.fixture === false : true;
}

function usesReviewedUpdateShape(item) {
  return Object.prototype.hasOwnProperty.call(item, "officialSource")
    || Object.prototype.hasOwnProperty.call(item, "reviewStatus")
    || Object.prototype.hasOwnProperty.call(item, "verifiedAt");
}

function eventDateStatus(item, now) {
  const expiry = Date.parse(item?.expiresAt ?? "");
  if (Number.isFinite(expiry) && expiry <= now) return "expired";
  if (usesReviewedUpdateShape(item)) {
    return Number.isFinite(Date.parse(item?.discoveredAt ?? "")) && Number.isFinite(Date.parse(item?.verifiedAt ?? ""))
      ? "valid"
      : "missing";
  }
  return Number.isFinite(Date.parse(item?.publishedAt ?? "")) ? "valid" : "missing";
}

function isPublicEvent(item, now) {
  return Boolean(item && typeof item === "object")
    && hasPublicReview(item)
    && hasHttpsUrl(eventUrl(item))
    && eventDateStatus(item, now) === "valid";
}

export function visibleEventSourceItems(items = [], { locale = "en", venue, now = Date.now() } = {}) {
  const list = Array.isArray(items) ? items.filter((item) => item && typeof item === "object") : [];
  const venueKey = venue ? String(venue).trim().toLowerCase() : "";
  const scoped = venueKey ? list.filter((item) => eventVenueSlug(item) === venueKey) : list;
  if (!scoped.length) return { items: [], state: EVENT_SOURCE_STATES.NO_NEWS };

  const localeVisible = scoped.filter((item) => campaignVisibleInLocale(item, locale));
  if (!localeVisible.length) return { items: [], state: EVENT_SOURCE_STATES.REGION_UNAVAILABLE };

  const publicItems = localeVisible.filter((item) => isPublicEvent(item, now));
  if (publicItems.length) return { items: publicItems, state: EVENT_SOURCE_STATES.CURRENT };

  const hasPendingReview = localeVisible.some((item) => eventDateStatus(item, now) !== "expired" && (!hasPublicReview(item) || eventDateStatus(item, now) === "missing" || !hasHttpsUrl(eventUrl(item))));
  return {
    items: [],
    state: hasPendingReview ? EVENT_SOURCE_STATES.PENDING_REVIEW : EVENT_SOURCE_STATES.NO_NEWS,
  };
}

const EVENT_STATE_COPY = Object.freeze({
  en: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "No current exchange notice from the shared official feed.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Official notices are pending review before publication.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "No current notice is available for your region.",
  },
  "zh-Hans": {
    [EVENT_SOURCE_STATES.NO_NEWS]: "共享官方来源中暂无当前交易所公告。",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "官方公告仍在审核，暂不发布。",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "你所在地区暂无可展示公告。",
  },
  "zh-Hant": {
    [EVENT_SOURCE_STATES.NO_NEWS]: "共享官方來源中暫無目前交易所公告。",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "官方公告仍在審核，暫不發布。",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "你所在地區暫無可展示公告。",
  },
  ja: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "共有公式フィードに現在の取引所通知はありません。",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "公式通知は公開前レビュー中です。",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "この地域で表示できる現在の通知はありません。",
  },
  ko: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "공유 공식 피드에 현재 거래소 공지가 없습니다.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "공식 공지는 게시 전 검토 중입니다.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "현재 지역에서 표시할 수 있는 공지가 없습니다.",
  },
  tr: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "Paylaşılan resmi akışta güncel borsa duyurusu yok.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Resmi duyurular yayınlanmadan önce inceleniyor.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "Bölgeniz için güncel duyuru mevcut değil.",
  },
  ar: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "لا يوجد إشعار منصة حالي في موجز المصادر الرسمية المشترك.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "الإشعارات الرسمية قيد المراجعة قبل النشر.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "لا يوجد إشعار حالي متاح لمنطقتك.",
  },
  es: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "No hay aviso actual de la plataforma en la fuente oficial compartida.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Los avisos oficiales están pendientes de revisión antes de publicarse.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "No hay aviso actual disponible para tu región.",
  },
  "pt-BR": {
    [EVENT_SOURCE_STATES.NO_NEWS]: "Não há aviso atual da corretora no feed oficial compartilhado.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Avisos oficiais aguardam revisão antes da publicação.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "Não há aviso atual disponível para sua região.",
  },
  fr: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "Aucun avis actuel de plateforme dans le flux officiel partagé.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Les avis officiels sont en attente de revue avant publication.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "Aucun avis actuel n'est disponible pour votre région.",
  },
  de: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "Keine aktuelle Börsenmitteilung im gemeinsamen offiziellen Feed.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Offizielle Mitteilungen warten vor der Veröffentlichung auf Prüfung.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "Für Ihre Region ist derzeit keine Mitteilung verfügbar.",
  },
  ru: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "В общей официальной ленте нет текущего уведомления биржи.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Официальные уведомления ожидают проверки перед публикацией.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "Для вашего региона нет текущего уведомления.",
  },
  id: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "Tidak ada pemberitahuan bursa terkini di feed resmi bersama.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Pemberitahuan resmi masih menunggu peninjauan sebelum diterbitkan.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "Tidak ada pemberitahuan terkini yang tersedia untuk wilayah Anda.",
  },
  vi: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "Nguồn chính thức chung chưa có thông báo sàn hiện hành.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Thông báo chính thức đang chờ rà soát trước khi xuất bản.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "Khu vực của bạn chưa có thông báo hiện hành.",
  },
  it: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "Nessun avviso attuale della piattaforma nel feed ufficiale condiviso.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Gli avvisi ufficiali sono in revisione prima della pubblicazione.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "Nessun avviso attuale disponibile per la tua regione.",
  },
  ur: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "مشترک سرکاری فیڈ میں کوئی موجودہ ایکسچینج نوٹس نہیں۔",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "سرکاری نوٹس اشاعت سے پہلے جائزے کے منتظر ہیں۔",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "آپ کے علاقے کے لیے کوئی موجودہ نوٹس دستیاب نہیں۔",
  },
  uk: {
    [EVENT_SOURCE_STATES.NO_NEWS]: "У спільній офіційній стрічці немає поточного повідомлення біржі.",
    [EVENT_SOURCE_STATES.PENDING_REVIEW]: "Офіційні повідомлення очікують перевірки перед публікацією.",
    [EVENT_SOURCE_STATES.REGION_UNAVAILABLE]: "Для вашого регіону немає поточного повідомлення.",
  },
});

export function eventSourceStateLabel(state, locale = "en") {
  const raw = String(locale || "en");
  const key = raw === "zh" || raw === "zh-CN" ? "zh-Hans" : raw === "zh-TW" || raw === "zh-HK" ? "zh-Hant" : raw;
  return (EVENT_STATE_COPY[key] || EVENT_STATE_COPY[key.split("-")[0]] || EVENT_STATE_COPY.en)[state] || EVENT_STATE_COPY.en[EVENT_SOURCE_STATES.NO_NEWS];
}
