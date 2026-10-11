// Light compare helpers (split out of compare-generated.js on 2026-10-11): slugs, canonical order, locale
// normalisation and the picker copy. No data imports, so the directory picker, compare-routes.js and the
// next-decision bridge can use them without pulling the 200 KB template/pair module into their chunk.
export const COMPARE_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"]);

// Mirror of ACTIVE_VENUE_SLUGS in worker/index.js (the worker builds its set from this list).
export const ACTIVE_COMPARE_VENUE_SLUGS = Object.freeze([
  "binance", "coinbase", "bybit", "bitget", "okx", "kraken", "gate-io", "kucoin", "mexc", "backpack", "deribit",
  "uniswap", "pancakeswap", "jupiter", "raydium", "aerodrome", "curve", "hyperliquid", "dydx", "gmx", "drift",
]);

// Hand-written comparison pages. Their slug order is editorial and stays canonical; the reverse slug redirects.
export const CURATED_COMPARISON_SLUGS = Object.freeze([
  "binance-vs-okx", "binance-vs-bybit", "okx-vs-bybit", "binance-vs-mexc",
  "okx-vs-mexc", "bybit-vs-bitget", "hyperliquid-vs-dydx", "uniswap-vs-jupiter", "binance-vs-kraken", "gate-io-vs-mexc",
  // 2026-10-10 market plan: most-wanted pairs that had no indexable page.
  "binance-vs-bitget", "bitget-vs-okx", "bybit-vs-mexc", "bitget-vs-mexc",
]);

const LOCALE_SET = new Set(COMPARE_LOCALES);
const ACTIVE = new Set(ACTIVE_COMPARE_VENUE_SLUGS);
const CURATED = new Set(CURATED_COMPARISON_SLUGS);
const CURATED_BY_KEY = new Map(CURATED_COMPARISON_SLUGS.map((slug) => [[...slug.split("-vs-")].sort().join("|"), slug]));

export const isActiveCompareVenue = (slug) => ACTIVE.has(String(slug || ""));
export const isCuratedComparison = (pair) => CURATED.has(String(pair || ""));

export function parseComparePair(pair) {
  const slugs = String(pair || "").split("-vs-").filter(Boolean);
  if (slugs.length < 2 || slugs.length > 3 || new Set(slugs).size !== slugs.length) return null;
  return slugs.every(isActiveCompareVenue) ? slugs : null;
}

// Canonical slug for a selection. Two venues: the curated slug when the pair is curated (either order), otherwise
// alphabetical. Three-venue selections are not canonicalized (no generated page policy applies to them).
export function canonicalComparePairSlug(slugs = []) {
  const list = Array.isArray(slugs) ? slugs.filter(Boolean) : String(slugs || "").split("-vs-").filter(Boolean);
  if (list.length !== 2 || list[0] === list[1]) return list.join("-vs-");
  return CURATED_BY_KEY.get([...list].sort().join("|")) || [...list].sort().join("-vs-");
}
export const canonicalComparePath = (slugs) => `/compare/${canonicalComparePairSlug(slugs)}`;
export function isCanonicalComparePair(pair) {
  const slugs = parseComparePair(pair);
  return Boolean(slugs) && (slugs.length !== 2 || canonicalComparePairSlug(slugs) === pair);
}


// Locale normalisation shared by the heavy template module and the light helpers (same rules as before the split).
export function normalizeCompareLocale(locale = "en") {
  const value = String(locale || "en");
  if (LOCALE_SET.has(value)) return value;
  if (value === "zh-CN" || value === "zh-SG") return "zh-Hans";
  if (value === "zh-TW" || value === "zh-HK" || value === "zh-MO") return "zh-Hant";
  if (value.startsWith("zh")) return "zh-Hans";
  if (value.toLowerCase().startsWith("pt")) return "pt-BR";
  const base = value.split(/[-_]/)[0];
  return LOCALE_SET.has(base) ? base : "en";
}

export const COMPARE_PICKER_COPY = Object.freeze({
  "en": {
    "title": "Compare any two platforms",
    "a": "First platform",
    "b": "Second platform",
    "submit": "Compare",
    "hint": "Pick two different platforms; the page opens in its canonical order.",
    "same": "Choose two different platforms.",
    "placeholder": "Select a platform"
  },
  "zh-Hans": {
    "title": "任选两家平台对比",
    "a": "第一家平台",
    "b": "第二家平台",
    "submit": "开始对比",
    "hint": "选择两家不同的平台，页面将按统一顺序打开。",
    "same": "请选择两家不同的平台。",
    "placeholder": "选择平台"
  },
  "zh-Hant": {
    "title": "任選兩家平台比較",
    "a": "第一家平台",
    "b": "第二家平台",
    "submit": "開始比較",
    "hint": "選擇兩家不同的平台，頁面會以統一順序開啟。",
    "same": "請選擇兩家不同的平台。",
    "placeholder": "選擇平台"
  },
  "es": {
    "title": "Compara dos plataformas cualesquiera",
    "a": "Primera plataforma",
    "b": "Segunda plataforma",
    "submit": "Comparar",
    "hint": "Elige dos plataformas distintas; la página se abre en su orden canónico.",
    "same": "Elige dos plataformas distintas.",
    "placeholder": "Selecciona una plataforma"
  },
  "pt-BR": {
    "title": "Compare duas plataformas quaisquer",
    "a": "Primeira plataforma",
    "b": "Segunda plataforma",
    "submit": "Comparar",
    "hint": "Escolha duas plataformas diferentes; a página abre na ordem canônica.",
    "same": "Escolha duas plataformas diferentes.",
    "placeholder": "Selecione uma plataforma"
  },
  "fr": {
    "title": "Comparer deux plateformes au choix",
    "a": "Première plateforme",
    "b": "Seconde plateforme",
    "submit": "Comparer",
    "hint": "Choisissez deux plateformes différentes ; la page s’ouvre dans l’ordre canonique.",
    "same": "Choisissez deux plateformes différentes.",
    "placeholder": "Sélectionner une plateforme"
  },
  "de": {
    "title": "Zwei beliebige Plattformen vergleichen",
    "a": "Erste Plattform",
    "b": "Zweite Plattform",
    "submit": "Vergleichen",
    "hint": "Wählen Sie zwei verschiedene Plattformen; die Seite öffnet in kanonischer Reihenfolge.",
    "same": "Wählen Sie zwei verschiedene Plattformen.",
    "placeholder": "Plattform wählen"
  },
  "ja": {
    "title": "任意の2つのプラットフォームを比較",
    "a": "1つ目のプラットフォーム",
    "b": "2つ目のプラットフォーム",
    "submit": "比較する",
    "hint": "異なる2つのプラットフォームを選ぶと、統一された順序でページが開きます。",
    "same": "異なる2つのプラットフォームを選んでください。",
    "placeholder": "プラットフォームを選択"
  },
  "ko": {
    "title": "원하는 두 플랫폼 비교",
    "a": "첫 번째 플랫폼",
    "b": "두 번째 플랫폼",
    "submit": "비교하기",
    "hint": "서로 다른 두 플랫폼을 선택하면 표준 순서로 페이지가 열립니다.",
    "same": "서로 다른 두 플랫폼을 선택하세요.",
    "placeholder": "플랫폼 선택"
  },
  "ar": {
    "title": "قارن أي منصتين",
    "a": "المنصة الأولى",
    "b": "المنصة الثانية",
    "submit": "قارن",
    "hint": "اختر منصتين مختلفتين؛ تُفتح الصفحة بالترتيب القياسي.",
    "same": "اختر منصتين مختلفتين.",
    "placeholder": "اختر منصة"
  },
  "tr": {
    "title": "Herhangi iki platformu karşılaştırın",
    "a": "Birinci platform",
    "b": "İkinci platform",
    "submit": "Karşılaştır",
    "hint": "İki farklı platform seçin; sayfa standart sırayla açılır.",
    "same": "İki farklı platform seçin.",
    "placeholder": "Platform seçin"
  },
  "ru": {
    "title": "Сравнить любые две платформы",
    "a": "Первая платформа",
    "b": "Вторая платформа",
    "submit": "Сравнить",
    "hint": "Выберите две разные платформы; страница откроется в каноническом порядке.",
    "same": "Выберите две разные платформы.",
    "placeholder": "Выберите платформу"
  },
  "id": {
    "title": "Bandingkan dua platform mana pun",
    "a": "Platform pertama",
    "b": "Platform kedua",
    "submit": "Bandingkan",
    "hint": "Pilih dua platform yang berbeda; halaman terbuka dalam urutan kanonis.",
    "same": "Pilih dua platform yang berbeda.",
    "placeholder": "Pilih platform"
  },
  "vi": {
    "title": "So sánh hai nền tảng bất kỳ",
    "a": "Nền tảng thứ nhất",
    "b": "Nền tảng thứ hai",
    "submit": "So sánh",
    "hint": "Chọn hai nền tảng khác nhau; trang sẽ mở theo thứ tự chuẩn.",
    "same": "Hãy chọn hai nền tảng khác nhau.",
    "placeholder": "Chọn nền tảng"
  },
  "it": {
    "title": "Confronta due piattaforme a scelta",
    "a": "Prima piattaforma",
    "b": "Seconda piattaforma",
    "submit": "Confronta",
    "hint": "Scegli due piattaforme diverse; la pagina si apre nell’ordine canonico.",
    "same": "Scegli due piattaforme diverse.",
    "placeholder": "Seleziona una piattaforma"
  },
  "ur": {
    "title": "کوئی بھی دو platforms compare کریں",
    "a": "پہلا platform",
    "b": "دوسرا platform",
    "submit": "Compare",
    "hint": "دو مختلف platforms منتخب کریں؛ page canonical order میں کھلے گا۔",
    "same": "دو مختلف platforms منتخب کریں۔",
    "placeholder": "Platform منتخب کریں"
  },
  "uk": {
    "title": "Порівняйте будь-які дві platforms",
    "a": "Перша platform",
    "b": "Друга platform",
    "submit": "Порівняти",
    "hint": "Оберіть дві різні platforms; page відкриється в canonical order.",
    "same": "Оберіть дві різні platforms.",
    "placeholder": "Оберіть platform"
  }
});
export function comparePickerCopy(locale) {
  return COMPARE_PICKER_COPY[normalizeCompareLocale(locale)];
}
