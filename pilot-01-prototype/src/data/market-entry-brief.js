import { resolveMarketPolicy } from "./market-policy.js";

const PAYMENT_LABELS = {
  BRL: "BRL",
  Pix: "Pix",
  TED: "TED",
  MXN: "MXN",
  SPEI: "SPEI",
  TWD: "TWD",
  IDR: "IDR",
  JPY: "JPY",
  KRW: "KRW",
  SGD: "SGD",
  TRY: "TRY",
  SEPA: "SEPA",
  GBP: "GBP",
  sepa: "SEPA",
  bank_transfer: "Bank transfer",
  local_fiat: "Local fiat",
  card: "Card",
  usdt_onchain: "USDT on-chain",
  usdt_onsite: "USDT in platform",
  global_fiat: "Global fiat",
  crypto_onchain: "Crypto on-chain",
  unknown: "Unknown",
};

const PAYMENT_LABELS_LOCALIZED = {
  "zh-Hans": { "Bank transfer": "银行转账", Card: "银行卡", "Local fiat": "本地法币", "Global fiat": "全球法币", "USDT on-chain": "USDT 链上", "USDT in platform": "平台内 USDT" },
  "zh-Hant": { "Bank transfer": "銀行轉帳", Card: "銀行卡", "Local fiat": "本地法幣", "Global fiat": "全球法幣", "USDT on-chain": "USDT 鏈上", "USDT in platform": "平台內 USDT" },
  "pt-BR": { "Bank transfer": "Transferência bancária", Card: "Cartão", "Local fiat": "Moeda fiduciária local", "Global fiat": "Moeda fiduciária global", "USDT on-chain": "USDT on-chain", "USDT in platform": "USDT na plataforma" },
  id: { "Bank transfer": "Transferi bank", Card: "Kartu", "Local fiat": "Mata uang fiat lokal", "Global fiat": "Mata uang fiat global", "USDT on-chain": "USDT on-chain", "USDT in platform": "USDT di platform" },
  ar: { "Bank transfer": "تحويل بنكي", Card: "بطاقة", "Local fiat": "عملة محلية", "Global fiat": "عملة عالمية", "USDT on-chain": "USDT على السلسلة", "USDT in platform": "USDT داخل المنصة" },
  vi: { "Bank transfer": "Chuyển khoản ngân hàng", Card: "Thẻ", "Local fiat": "Tiền pháp định nội địa", "Global fiat": "Tiền pháp định toàn cầu", "USDT on-chain": "USDT on-chain", "USDT in platform": "USDT trên nền tảng" },
  it: { "Bank transfer": "Bonifico bancario", Card: "Carta", "Local fiat": "Valuta fiat locale", "Global fiat": "Valuta fiat globale", "USDT on-chain": "USDT on-chain", "USDT in platform": "USDT sulla piattaforma" },
  ja: { "Bank transfer": "銀行振込", Card: "カード", "Local fiat": "現地法定通貨", "Global fiat": "グローバル法定通貨", "USDT on-chain": "USDTオンチェーン", "USDT in platform": "プラットフォーム内USDT" },
  ko: { "Bank transfer": "은행 송금", Card: "카드", "Local fiat": "현지 법정화폐", "Global fiat": "글로벌 법정화폐", "USDT on-chain": "USDT 온체인", "USDT in platform": "플랫폼 내 USDT" },
  tr: { "Bank transfer": "Banka transferi", Card: "Kart", "Local fiat": "Yerel itibari para", "Global fiat": "Küresel itibari para", "USDT on-chain": "USDT on-chain", "USDT in platform": "Platform içi USDT" },
  fr: { "Bank transfer": "Virement bancaire", Card: "Carte", "Local fiat": "Monnaie fiat locale", "Global fiat": "Monnaie fiat mondiale", "USDT on-chain": "USDT on-chain", "USDT in platform": "USDT sur la plateforme" },
  de: { "Bank transfer": "Banküberweisung", Card: "Karte", "Local fiat": "Lokale Fiatwährung", "Global fiat": "Globale Fiatwährung", "USDT on-chain": "USDT on-chain", "USDT in platform": "USDT auf der Plattform" },
  es: { "Bank transfer": "Transferencia bancaria", Card: "Tarjeta", "Local fiat": "Moneda fiat local", "Global fiat": "Moneda fiat global", "USDT on-chain": "USDT on-chain", "USDT in platform": "USDT en la plataforma" },
  ru: { "Bank transfer": "Банковский перевод", Card: "Карта", "Local fiat": "Местная фиатная валюта", "Global fiat": "Глобальная фиатная валюта", "USDT on-chain": "USDT ончейн", "USDT in platform": "USDT на платформе" },
};

export function marketEntryBrief({ market, product, locale = "en" } = {}) {
  const policy = resolveMarketPolicy({ market });
  const payment = policy.payment || {};
  const language = String(locale || "").split("-")[0];
  const labels = PAYMENT_LABELS_LOCALIZED[locale] || PAYMENT_LABELS_LOCALIZED[language] || {};
  return {
    market: policy.targetMarket,
    product: product || policy.product || "unknown",
    paymentModes: (payment.modes || []).map((mode) => {
      const label = PAYMENT_LABELS[mode] || mode;
      return labels[label] || label;
    }),
    accountCurrency: payment.accountCurrency || [],
    paymentKnown: payment.applicable === true,
    requiresKyc: policy.accountStage?.requiresKyc === true,
    residenceMatchRequired: policy.accountStage?.requiresResidenceMatch === true,
    offerState: policy.offer?.shareableToUsers === true ? "shareable" : "conditional",
  };
}
