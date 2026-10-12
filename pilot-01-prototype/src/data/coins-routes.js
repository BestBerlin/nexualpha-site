// "Where to buy <coin>" pages (/coins, /coins/<slug>), 2026-10-12. Entry-safe helpers only: the header, the router and
// the route module cache import this file, so it must stay tiny (no coin table here; that is coins.js in the route chunk).

export const COINS_PATH = "/coins";
// Search editions with natural template copy and our own coin descriptions. Other UI locales render the same page
// (English descriptions) as noindex,follow.
export const COIN_INDEX_LOCALES = Object.freeze(["en", "es", "pt-BR", "tr", "vi", "id", "zh-Hans", "ja", "ko", "fr", "de"]);
// Same neutral set as the academy and the campaign join block: no sign-up wording or partner code.
export const COIN_NEUTRAL_LOCALES = new Set(["ru", "ar", "zh-Hant", "ur", "uk"]);

export const coinContentLocale = (locale) => (COIN_INDEX_LOCALES.includes(locale) ? locale : "en");
export const coinContentModulePath = (locale) => `./data/coin-content-${coinContentLocale(locale).toLowerCase()}.js`;
export const coinPath = (slug) => `${COINS_PATH}/${slug}`;

/** { kind: "hub" } | { kind: "coin", slug } | { kind: "missing" } for /coins paths, null elsewhere. */
export function parseCoinsPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === COINS_PATH) return { kind: "hub" };
  const match = path.match(/^\/coins\/([a-z0-9][a-z0-9-]{0,60})$/);
  if (match) return { kind: "coin", slug: match[1] };
  return path.startsWith(`${COINS_PATH}/`) ? { kind: "missing" } : null;
}

// Header/footer/home labels (shell chunk: keep small).
const SHELL = {
  en: { venueTitle: "Popular coins on {venue}", nav: "Coins", popular: "Popular coins", popularLead: "Where to buy the most-traded coins, with the pairs each exchange lists.", all: "All coins" },
  "zh-Hans": { venueTitle: "{venue} 上的热门币种", nav: "币种", popular: "热门币种", popularLead: "主流币种在哪里买：每家交易所上架的交易对一目了然。", all: "全部币种" },
  "zh-Hant": { venueTitle: "{venue} 上的熱門幣種", nav: "幣種", popular: "熱門幣種", popularLead: "主流幣種在哪裡交易：各交易所上架的交易對。", all: "全部幣種" },
  es: { venueTitle: "Monedas populares en {venue}", nav: "Monedas", popular: "Monedas populares", popularLead: "Dónde comprar las monedas más negociadas y qué pares ofrece cada exchange.", all: "Todas las monedas" },
  "pt-BR": { venueTitle: "Moedas populares na {venue}", nav: "Moedas", popular: "Moedas populares", popularLead: "Onde comprar as moedas mais negociadas e quais pares cada corretora oferece.", all: "Todas as moedas" },
  fr: { venueTitle: "Cryptos populaires sur {venue}", nav: "Cryptos", popular: "Cryptos populaires", popularLead: "Où acheter les cryptos les plus échangées, avec les paires de chaque plateforme.", all: "Toutes les cryptos" },
  de: { venueTitle: "Beliebte Coins auf {venue}", nav: "Coins", popular: "Beliebte Coins", popularLead: "Wo du die meistgehandelten Coins kaufst – mit den Paaren jeder Börse.", all: "Alle Coins" },
  ja: { venueTitle: "{venue}で人気の銘柄", nav: "銘柄", popular: "人気の銘柄", popularLead: "主要銘柄をどこで買えるか、取引所ごとの取扱ペアと合わせて確認できます。", all: "すべての銘柄" },
  ko: { venueTitle: "{venue} 인기 코인", nav: "코인", popular: "인기 코인", popularLead: "주요 코인을 어디서 살 수 있는지, 거래소별 거래쌍과 함께 확인하세요.", all: "전체 코인" },
  tr: { venueTitle: "{venue} üzerindeki popüler coinler", nav: "Coinler", popular: "Popüler coinler", popularLead: "En çok işlem gören coinleri nereden alabileceğiniz ve her borsadaki pariteler.", all: "Tüm coinler" },
  vi: { venueTitle: "Coin phổ biến trên {venue}", nav: "Coin", popular: "Coin phổ biến", popularLead: "Mua các coin giao dịch nhiều nhất ở đâu, kèm các cặp mà từng sàn niêm yết.", all: "Tất cả coin" },
  id: { venueTitle: "Koin populer di {venue}", nav: "Koin", popular: "Koin populer", popularLead: "Tempat membeli koin yang paling banyak diperdagangkan, lengkap dengan pasangan di tiap bursa.", all: "Semua koin" },
  ru: { venueTitle: "Популярные монеты на {venue}", nav: "Монеты", popular: "Популярные монеты", popularLead: "Где торгуются самые популярные монеты и какие пары есть на каждой бирже.", all: "Все монеты" },
  ar: { venueTitle: "عملات شائعة على {venue}", nav: "العملات", popular: "عملات شائعة", popularLead: "أين تُتداول العملات الأكثر نشاطاً والأزواج المتاحة في كل منصة.", all: "كل العملات" },
  it: { venueTitle: "Monete popolari su {venue}", nav: "Monete", popular: "Monete popolari", popularLead: "Dove comprare le monete più scambiate, con le coppie di ogni exchange.", all: "Tutte le monete" },
  ur: { venueTitle: "{venue} پر مقبول کوائنز", nav: "کوائنز", popular: "مقبول کوائنز", popularLead: "سب سے زیادہ ٹریڈ ہونے والے کوائنز کہاں دستیاب ہیں اور ہر ایکسچینج پر کون سے جوڑے ہیں۔", all: "تمام کوائنز" },
  uk: { venueTitle: "Популярні монети на {venue}", nav: "Монети", popular: "Популярні монети", popularLead: "Де торгуються найпопулярніші монети та які пари є на кожній біржі.", all: "Усі монети" },
};
export function coinShellCopy(locale) {
  return SHELL[locale] || (String(locale || "").startsWith("zh") ? SHELL["zh-Hans"] : SHELL.en);
}
