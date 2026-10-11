// Localized labels for generic funding methods recorded in venue-database.js `fiatChannels` (audit NX-07, 2026-10-11:
// /zh-hans, /fr and /ar exchange pages showed "Credit Card" and "Bank Transfer" in English). Only generic words are
// translated; brand and network names (Apple Pay, Google Pay, SEPA, FedWire, FastTrade) and any unknown record value
// are shown exactly as recorded. The venue records themselves are never rewritten.

const LABELS = {
  "P2P": {
    // l10n: needs native review
    ur: "P2P (صارفین کے درمیان)",
    // l10n: needs native review
    uk: "P2P (між користувачами)",
    "zh-Hans": "P2P 交易", "zh-Hant": "P2P 交易", ja: "P2P取引", ko: "P2P 거래", es: "P2P (entre usuarios)", "pt-BR": "P2P (entre usuários)",
    fr: "P2P (entre particuliers)", de: "P2P (zwischen Nutzern)", it: "P2P (tra utenti)", ru: "P2P (между пользователями)",
    tr: "P2P (kullanıcılar arası)", id: "P2P (antarpengguna)", vi: "P2P (giữa người dùng)", ar: "P2P (بين المستخدمين)",
  },
  "Credit Card": {
    // l10n: needs native review
    ur: "کریڈٹ کارڈ",
    // l10n: needs native review
    uk: "Кредитна картка",
    "zh-Hans": "信用卡", "zh-Hant": "信用卡", ja: "クレジットカード", ko: "신용카드", es: "Tarjeta de crédito", "pt-BR": "Cartão de crédito",
    fr: "Carte de crédit", de: "Kreditkarte", it: "Carta di credito", ru: "Кредитная карта", tr: "Kredi kartı", id: "Kartu kredit",
    vi: "Thẻ tín dụng", ar: "بطاقة ائتمان",
  },
  "Debit Card": {
    // l10n: needs native review
    ur: "ڈیبٹ کارڈ",
    // l10n: needs native review
    uk: "Дебетова картка",
    "zh-Hans": "借记卡", "zh-Hant": "金融卡", ja: "デビットカード", ko: "체크카드", es: "Tarjeta de débito", "pt-BR": "Cartão de débito",
    fr: "Carte de débit", de: "Debitkarte", it: "Carta di debito", ru: "Дебетовая карта", tr: "Banka kartı", id: "Kartu debit",
    vi: "Thẻ ghi nợ", ar: "بطاقة خصم",
  },
  "Bank Transfer": {
    // l10n: needs native review
    ur: "بینک ٹرانسفر",
    // l10n: needs native review
    uk: "Банківський переказ",
    "zh-Hans": "银行转账", "zh-Hant": "銀行轉帳", ja: "銀行振込", ko: "은행 송금", es: "Transferencia bancaria", "pt-BR": "Transferência bancária",
    fr: "Virement bancaire", de: "Banküberweisung", it: "Bonifico bancario", ru: "Банковский перевод", tr: "Banka havalesi",
    id: "Transfer bank", vi: "Chuyển khoản ngân hàng", ar: "تحويل بنكي",
  },
  "Select Bank Transfer": {
    // l10n: needs native review
    ur: "منتخب بینکوں سے ٹرانسفر",
    // l10n: needs native review
    uk: "Переказ з окремих банків",
    "zh-Hans": "部分银行转账", "zh-Hant": "部分銀行轉帳", ja: "一部の銀行振込", ko: "일부 은행 송금", es: "Transferencia de bancos seleccionados",
    "pt-BR": "Transferência de bancos selecionados", fr: "Virement depuis certaines banques", de: "Überweisung ausgewählter Banken",
    it: "Bonifico da banche selezionate", ru: "Перевод из отдельных банков", tr: "Seçili bankalardan havale", id: "Transfer bank tertentu",
    vi: "Chuyển khoản một số ngân hàng", ar: "تحويل من بنوك محددة",
  },
  "Bank Wire": {
    // l10n: needs native review
    ur: "بین الاقوامی بینک ٹرانسفر",
    // l10n: needs native review
    uk: "Міжнародний банківський переказ",
    "zh-Hans": "银行电汇", "zh-Hant": "銀行電匯", ja: "銀行電信送金", ko: "은행 전신 송금", es: "Transferencia bancaria internacional",
    "pt-BR": "Transferência bancária internacional", fr: "Virement télégraphique", de: "Bankdrahtüberweisung", it: "Bonifico internazionale",
    ru: "Банковский SWIFT-перевод", tr: "Banka EFT/SWIFT", id: "Wire transfer bank", vi: "Chuyển tiền điện ngân hàng", ar: "حوالة بنكية برقية",
  },
  "Bank Wire (USD)": {
    // l10n: needs native review
    ur: "بین الاقوامی بینک ٹرانسفر (USD)",
    // l10n: needs native review
    uk: "Міжнародний банківський переказ (USD)",
    "zh-Hans": "银行电汇（USD）", "zh-Hant": "銀行電匯（USD）", ja: "銀行電信送金（USD）", ko: "은행 전신 송금(USD)",
    es: "Transferencia bancaria internacional (USD)", "pt-BR": "Transferência bancária internacional (USD)", fr: "Virement télégraphique (USD)",
    de: "Bankdrahtüberweisung (USD)", it: "Bonifico internazionale (USD)", ru: "Банковский SWIFT-перевод (USD)", tr: "Banka EFT/SWIFT (USD)",
    id: "Wire transfer bank (USD)", vi: "Chuyển tiền điện ngân hàng (USD)", ar: "حوالة بنكية برقية (USD)",
  },
  "Wire Transfer": {
    // l10n: needs native review
    ur: "بین الاقوامی ٹرانسفر",
    // l10n: needs native review
    uk: "Міжнародний переказ",
    "zh-Hans": "电汇", "zh-Hant": "電匯", ja: "電信送金", ko: "전신 송금", es: "Transferencia internacional", "pt-BR": "Transferência internacional",
    fr: "Virement télégraphique", de: "Drahtüberweisung", it: "Bonifico internazionale", ru: "SWIFT-перевод", tr: "Havale (SWIFT)",
    id: "Wire transfer", vi: "Chuyển tiền điện", ar: "حوالة برقية",
  },
  "ACH Transfer": {
    // l10n: needs native review
    ur: "ACH ٹرانسفر",
    // l10n: needs native review
    uk: "Переказ ACH",
    "zh-Hans": "ACH 转账", "zh-Hant": "ACH 轉帳", ja: "ACH振込", ko: "ACH 이체", es: "Transferencia ACH", "pt-BR": "Transferência ACH",
    fr: "Virement ACH", de: "ACH-Überweisung", it: "Bonifico ACH", ru: "Перевод ACH", tr: "ACH transferi", id: "Transfer ACH",
    vi: "Chuyển khoản ACH", ar: "تحويل ACH",
  },
  "Third-party payment": {
    // l10n: needs native review
    ur: "تیسرے فریق کی ادائیگی",
    // l10n: needs native review
    uk: "Оплата через сторонні сервіси",
    "zh-Hans": "第三方支付", "zh-Hant": "第三方支付", ja: "第三者決済", ko: "제3자 결제", es: "Pago con terceros", "pt-BR": "Pagamento por terceiros",
    fr: "Paiement par un tiers", de: "Drittanbieter-Zahlung", it: "Pagamento tramite terzi", ru: "Сторонние платёжные сервисы",
    tr: "Üçüncü taraf ödeme", id: "Pembayaran pihak ketiga", vi: "Thanh toán bên thứ ba", ar: "دفع عبر طرف ثالث",
  },
  "Third-party providers": {
    // l10n: needs native review
    ur: "تیسرے فریق کے فراہم کنندگان",
    // l10n: needs native review
    uk: "Сторонні постачальники",
    "zh-Hans": "第三方服务商", "zh-Hant": "第三方服務商", ja: "第三者プロバイダー", ko: "제3자 제공업체", es: "Proveedores externos",
    "pt-BR": "Provedores terceiros", fr: "Prestataires tiers", de: "Drittanbieter", it: "Fornitori terzi", ru: "Сторонние провайдеры",
    tr: "Üçüncü taraf sağlayıcılar", id: "Penyedia pihak ketiga", vi: "Nhà cung cấp bên thứ ba", ar: "مزودون من طرف ثالث",
  },
  "Third-party gateways": {
    // l10n: needs native review
    ur: "تیسرے فریق کے ادائیگی گیٹ ویز",
    // l10n: needs native review
    uk: "Сторонні платіжні шлюзи",
    "zh-Hans": "第三方支付通道", "zh-Hant": "第三方支付通道", ja: "第三者決済ゲートウェイ", ko: "제3자 결제 게이트웨이",
    es: "Pasarelas de pago externas", "pt-BR": "Gateways de pagamento terceiros", fr: "Passerelles de paiement tierces",
    de: "Zahlungs-Gateways von Drittanbietern", it: "Gateway di pagamento terzi", ru: "Сторонние платёжные шлюзы",
    tr: "Üçüncü taraf ödeme ağ geçitleri", id: "Gateway pembayaran pihak ketiga", vi: "Cổng thanh toán bên thứ ba", ar: "بوابات دفع من طرف ثالث",
  },
  "Crypto Deposit": {
    // l10n: needs native review
    ur: "کرپٹو ڈپازٹ",
    // l10n: needs native review
    uk: "Поповнення криптовалютою",
    "zh-Hans": "加密货币充值", "zh-Hant": "加密貨幣入金", ja: "暗号資産入金", ko: "암호화폐 입금", es: "Depósito en cripto", "pt-BR": "Depósito em cripto",
    fr: "Dépôt en crypto", de: "Krypto-Einzahlung", it: "Deposito in crypto", ru: "Депозит криптовалютой", tr: "Kripto yatırma",
    id: "Deposit kripto", vi: "Nạp tiền mã hóa", ar: "إيداع عملات رقمية",
  },
  "Crypto": {
    // l10n: needs native review
    ur: "کرپٹو",
    // l10n: needs native review
    uk: "Криптовалюта",
    "zh-Hans": "加密货币", "zh-Hant": "加密貨幣", ja: "暗号資産", ko: "암호화폐", es: "Cripto", "pt-BR": "Cripto", fr: "Crypto", de: "Krypto",
    it: "Crypto", ru: "Криптовалюта", tr: "Kripto", id: "Kripto", vi: "Tiền mã hóa", ar: "عملات رقمية",
  },
};

/** Generic labels that have a translation for every non-English UI locale (tests check full coverage). */
export const LOCALIZED_PAYMENT_METHODS = Object.freeze(Object.keys(LABELS));

function labelLocale(locale) {
  const raw = String(locale || "en");
  if (raw === "zh-TW" || raw === "zh-HK") return "zh-Hant";
  if (raw.startsWith("zh")) return raw === "zh-Hant" ? "zh-Hant" : "zh-Hans";
  if (raw.startsWith("pt")) return "pt-BR";
  return raw.split("-")[0];
}

/** Localized label for one recorded funding method; brand names and unknown values are returned unchanged. */
export function paymentMethodLabel(method, locale = "en") {
  const value = String(method || "").trim();
  return LABELS[value]?.[labelLocale(locale)] || value;
}

/**
 * Localized, de-duplicated list of recorded funding methods. Two records that localize to the same label
 * ("Bank Wire" and "Wire Transfer" in French) appear once.
 */
export function paymentMethodLabels(methods, locale = "en") {
  const seen = new Set();
  const out = [];
  for (const method of Array.isArray(methods) ? methods : []) {
    if (typeof method !== "string" || !method.trim()) continue;
    const label = paymentMethodLabel(method, locale);
    const key = label.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

/** List separator for inline method lists: CJK uses the ideographic comma, Arabic the Arabic comma. */
export function paymentMethodSeparator(locale = "en") {
  if (/^(zh|ja)/.test(String(locale))) return "、";
  return /^(ar|ur)/.test(String(locale)) ? "، " : ", ";
}
