// Shared scaffolding for the 2026-10-10 comparison pairs (binance-vs-bitget, bitget-vs-okx, bybit-vs-mexc,
// bitget-vs-mexc). The narrative copy lives in one file per pair; this module only holds the pieces that are
// identical in shape across pairs: official source links, localized internal-link labels, decision-card UI labels,
// the review label and the boundary sentence. No fee figures, products or KYC facts are stated here; the page
// renders those from venue-database.js and the reviewed fee records, so unknown values show the pending state.

export const COMPARE_PAIR_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]);
export const COMPARE_PAIR_REVIEWED_AT = "2026-10-10";

const source = (label, href) => [label, href];
const internal = (label, href) => [label, href];

export const VENUE_NAMES = Object.freeze({ binance: "Binance", okx: "OKX", bybit: "Bybit", bitget: "Bitget", mexc: "MEXC" });

// Official pages already used by the existing comparison data; nothing new is asserted about them.
const VENUE_SOURCE_LINKS = {
  binance: [
    source("Binance trading fee schedule", "https://www.binance.com/en/fee/trading"),
    source("Binance identity verification", "https://www.binance.com/en/support/faq/detail/360027287111"),
  ],
  okx: [
    source("OKX fees", "https://www.okx.com/fees"),
    source("OKX identity verification", "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported"),
  ],
  bybit: [
    source("Bybit Trading Fee Structure", "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure"),
    source("Bybit Individual KYC FAQ", "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ"),
    source("Bybit Copy Trading Profit Sharing", "https://www.bybit.com/en/help-center/article/Copy-Trading-Profit-Sharing-Explained"),
  ],
  bitget: [
    source("Bitget Trading Fees FAQ", "https://www.bitget.com/support/articles/12560603892734"),
    source("Bitget Futures Fees Guide", "https://www.bitget.com/support/articles/12560603817155"),
    source("Bitget Identity Verification", "https://www.bitget.com/support/articles/12560603795184"),
    source("Bitget Copy Trading Profit-Sharing", "https://www.bitget.com/support/articles/9083311039641"),
  ],
  mexc: [
    source("MEXC fee schedule", "https://www.mexc.com/fee"),
    source("MEXC support center", "https://www.mexc.com/support"),
  ],
};

export function sourceLinksFor(a, b) {
  return [...VENUE_SOURCE_LINKS[a], ...VENUE_SOURCE_LINKS[b]];
}

const INTERNAL_LABELS = {
  en: { profile: (n) => `Review ${n} profile`, factbook: (n) => `Open ${n} factbook`, rates: "Open the fee benchmark terminal", derivatives: "Use the derivatives checklist", meme: "Open the new-listing and meme coin guide" },
  "zh-Hans": { profile: (n) => `查看 ${n} 档案`, factbook: (n) => `打开 ${n} Factbook`, rates: "打开手续费基准终端", derivatives: "使用合约核对清单", meme: "打开新币与 Meme 币指南" },
  "zh-Hant": { profile: (n) => `查看 ${n} 檔案`, factbook: (n) => `打開 ${n} Factbook`, rates: "打開手續費基準終端", derivatives: "使用合約核對清單", meme: "打開新幣與迷因幣指南" },
  es: { profile: (n) => `Ver el perfil de ${n}`, factbook: (n) => `Abrir el factbook de ${n}`, rates: "Abrir el terminal de comisiones", derivatives: "Usar la lista de verificación de derivados", meme: "Abrir la guía de nuevos listados y meme coins" },
  "pt-BR": { profile: (n) => `Ver o perfil da ${n}`, factbook: (n) => `Abrir o factbook da ${n}`, rates: "Abrir o terminal de taxas", derivatives: "Usar a lista de verificação de derivativos", meme: "Abrir o guia de novas listagens e meme coins" },
  fr: { profile: (n) => `Voir le profil ${n}`, factbook: (n) => `Ouvrir le factbook ${n}`, rates: "Ouvrir le terminal des frais", derivatives: "Utiliser la liste de contrôle des dérivés", meme: "Ouvrir le guide des nouvelles cotations et meme coins" },
  de: { profile: (n) => `${n}-Profil prüfen`, factbook: (n) => `${n}-Factbook öffnen`, rates: "Gebühren-Benchmark öffnen", derivatives: "Derivate-Checkliste verwenden", meme: "Leitfaden zu Neulistings und Meme-Coins öffnen" },
  ja: { profile: (n) => `${n} のプロフィールを見る`, factbook: (n) => `${n} の Factbook を開く`, rates: "手数料ベンチマークを開く", derivatives: "デリバティブのチェックリストを使う", meme: "新規上場・ミームコインガイドを開く" },
  ko: { profile: (n) => `${n} 프로필 보기`, factbook: (n) => `${n} 팩트북 열기`, rates: "수수료 벤치마크 열기", derivatives: "파생상품 체크리스트 사용", meme: "신규 상장·밈코인 가이드 열기" },
  ar: { profile: (n) => `مراجعة ملف ${n}`, factbook: (n) => `فتح كتاب حقائق ${n}`, rates: "فتح لوحة مقارنة الرسوم", derivatives: "استخدام قائمة فحص المشتقات", meme: "فتح دليل الإدراجات الجديدة وعملات الميم" },
  tr: { profile: (n) => `${n} profilini incele`, factbook: (n) => `${n} factbook'unu aç`, rates: "Ücret karşılaştırma terminalini aç", derivatives: "Türev ürün kontrol listesini kullan", meme: "Yeni listeleme ve meme coin rehberini aç" },
  ru: { profile: (n) => `Открыть профиль ${n}`, factbook: (n) => `Открыть справку по ${n}`, rates: "Открыть сравнение комиссий", derivatives: "Открыть чек-лист по деривативам", meme: "Открыть обзор новых листингов и мем-коинов" },
  id: { profile: (n) => `Lihat profil ${n}`, factbook: (n) => `Buka factbook ${n}`, rates: "Buka terminal perbandingan biaya", derivatives: "Gunakan daftar periksa derivatif", meme: "Buka panduan listing baru dan meme coin" },
  vi: { profile: (n) => `Xem hồ sơ ${n}`, factbook: (n) => `Mở factbook ${n}`, rates: "Mở bảng so sánh phí", derivatives: "Dùng danh sách kiểm tra phái sinh", meme: "Mở hướng dẫn niêm yết mới và meme coin" },
  it: { profile: (n) => `Vedi il profilo di ${n}`, factbook: (n) => `Apri il factbook di ${n}`, rates: "Apri il terminale delle commissioni", derivatives: "Usa la checklist dei derivati", meme: "Apri la guida ai nuovi listing e alle meme coin" },
};

const TOPIC_HREFS = { rates: "/rates", derivatives: "/topics/derivatives", meme: "/topics/meme-coins" };

export function internalLinksFor(locale, a, b, topic = "rates") {
  const labels = INTERNAL_LABELS[locale] || INTERNAL_LABELS.en;
  const nameA = VENUE_NAMES[a];
  const nameB = VENUE_NAMES[b];
  return [
    internal(labels.profile(nameA), `/exchanges/${a}`),
    internal(labels.profile(nameB), `/exchanges/${b}`),
    internal(labels[topic], TOPIC_HREFS[topic]),
    internal(labels.factbook(nameA), `/factbook/${a}`),
    internal(labels.factbook(nameB), `/factbook/${b}`),
  ];
}

// UI labels of the final-choice card. Pair copy supplies only the card title and the two picks.
export const DECISION_CARD_LABELS = {
  en: { eyebrow: "Final call before signup", suitedForLabel: "Who it fits", verifyLabel: "Verify first", matrixLabel: "Full matrix", evidenceLabel: "Review sources and decision notes" },
  "zh-Hans": { eyebrow: "注册前最终怎么选", suitedForLabel: "适合谁", verifyLabel: "先核验什么", matrixLabel: "查看详细矩阵", evidenceLabel: "展开来源与判断依据" },
  "zh-Hant": { eyebrow: "註冊前最終怎麼選", suitedForLabel: "適合誰", verifyLabel: "先核驗什麼", matrixLabel: "查看詳細矩陣", evidenceLabel: "展開來源與判斷依據" },
  es: { eyebrow: "Decisión final antes de registrarte", suitedForLabel: "Para quién encaja", verifyLabel: "Verifica primero", matrixLabel: "Matriz completa", evidenceLabel: "Revisar fuentes y notas de decisión" },
  "pt-BR": { eyebrow: "Decisão final antes do cadastro", suitedForLabel: "Para quem faz sentido", verifyLabel: "Confira primeiro", matrixLabel: "Matriz completa", evidenceLabel: "Ver fontes e notas de decisão" },
  fr: { eyebrow: "Décision finale avant l’inscription", suitedForLabel: "Pour qui", verifyLabel: "À vérifier d’abord", matrixLabel: "Matrice complète", evidenceLabel: "Voir les sources et notes de décision" },
  de: { eyebrow: "Letzte Entscheidung vor der Registrierung", suitedForLabel: "Für wen geeignet", verifyLabel: "Zuerst prüfen", matrixLabel: "Vollständige Matrix", evidenceLabel: "Quellen und Entscheidungsnotizen ansehen" },
  ja: { eyebrow: "登録前の最終判断", suitedForLabel: "向いている人", verifyLabel: "先に確認", matrixLabel: "詳細マトリクス", evidenceLabel: "出典と判断根拠" },
  ko: { eyebrow: "가입 전 최종 판단", suitedForLabel: "적합한 사용자", verifyLabel: "먼저 확인", matrixLabel: "상세 매트릭스", evidenceLabel: "출처와 판단 근거" },
  ar: { eyebrow: "القرار النهائي قبل التسجيل", suitedForLabel: "لمن تناسب", verifyLabel: "تحقق أولاً", matrixLabel: "المصفوفة الكاملة", evidenceLabel: "مراجعة المصادر وملاحظات القرار" },
  tr: { eyebrow: "Kayıt öncesi son karar", suitedForLabel: "Kimler için uygun", verifyLabel: "Önce doğrula", matrixLabel: "Detay matrisi", evidenceLabel: "Kaynakları ve karar notlarını aç" },
  ru: { eyebrow: "Итог перед регистрацией", suitedForLabel: "Кому подходит", verifyLabel: "Сначала проверьте", matrixLabel: "Полная матрица", evidenceLabel: "Источники и заметки к решению" },
  id: { eyebrow: "Keputusan akhir sebelum mendaftar", suitedForLabel: "Cocok untuk siapa", verifyLabel: "Periksa dulu", matrixLabel: "Matriks lengkap", evidenceLabel: "Lihat sumber dan catatan keputusan" },
  vi: { eyebrow: "Quyết định cuối trước khi đăng ký", suitedForLabel: "Phù hợp với ai", verifyLabel: "Kiểm tra trước", matrixLabel: "Ma trận đầy đủ", evidenceLabel: "Xem nguồn và ghi chú quyết định" },
  it: { eyebrow: "Decisione finale prima della registrazione", suitedForLabel: "Per chi è adatto", verifyLabel: "Verifica prima", matrixLabel: "Matrice completa", evidenceLabel: "Vedi fonti e note decisionali" },
};

// CompareFinalChoiceCard normalises "Month D, YYYY" to ISO for English; other locales state the ISO date directly.
const REVIEWED_LABELS = {
  en: (a, b) => `Official ${a} and ${b} sources reviewed October 10, 2026`,
  "zh-Hans": (a, b) => `${a} 与 ${b} 官方来源复核于 2026-10-10`,
  "zh-Hant": (a, b) => `${a} 與 ${b} 官方來源複核於 2026-10-10`,
  es: (a, b) => `Fuentes oficiales de ${a} y ${b} revisadas el 2026-10-10`,
  "pt-BR": (a, b) => `Fontes oficiais da ${a} e da ${b} revisadas em 2026-10-10`,
  fr: (a, b) => `Sources officielles ${a} et ${b} vérifiées le 2026-10-10`,
  de: (a, b) => `Offizielle Quellen von ${a} und ${b} geprüft am 2026-10-10`,
  ja: (a, b) => `${a} と ${b} の公式ソースを 2026-10-10 に確認`,
  ko: (a, b) => `${a}·${b} 공식 출처 2026-10-10 확인`,
  ar: (a, b) => `تمت مراجعة المصادر الرسمية لـ ${a} و${b} بتاريخ 2026-10-10`,
  tr: (a, b) => `${a} ve ${b} resmî kaynakları 2026-10-10 tarihinde incelendi`,
  ru: (a, b) => `Официальные источники ${a} и ${b} проверены 2026-10-10`,
  id: (a, b) => `Sumber resmi ${a} dan ${b} ditinjau pada 2026-10-10`,
  vi: (a, b) => `Nguồn chính thức của ${a} và ${b} được rà soát ngày 2026-10-10`,
  it: (a, b) => `Fonti ufficiali di ${a} e ${b} verificate il 2026-10-10`,
};

const BOUNDARIES = {
  en: (a, b) => `This ${a} vs ${b} comparison cannot confirm product access, regional eligibility, identity approval, any user benefit or your final trading cost. The logged-in official account flow is the last check.`,
  "zh-Hans": (a, b) => `这份 ${a} 与 ${b} 的对比无法确认产品权限、地区资格、身份审核结果、任何用户权益或你的最终交易成本，最后一步仍以登录后的官方账户流程为准。`,
  "zh-Hant": (a, b) => `這份 ${a} 與 ${b} 的比較無法確認產品權限、地區資格、身份審核結果或你的最終交易成本，最後仍以登入後的官方帳戶流程為準。`,
  es: (a, b) => `Esta comparación entre ${a} y ${b} no puede confirmar el acceso a productos, la elegibilidad regional, la aprobación de identidad, ningún beneficio ni tu coste final de trading. La última comprobación es el flujo oficial dentro de la cuenta.`,
  "pt-BR": (a, b) => `Esta comparação entre ${a} e ${b} não confirma acesso a produtos, elegibilidade regional, aprovação de identidade, benefícios ou seu custo final de negociação. A última checagem é o fluxo oficial dentro da conta.`,
  fr: (a, b) => `Cette comparaison ${a} vs ${b} ne peut confirmer ni l’accès aux produits, ni l’éligibilité régionale, ni la validation d’identité, ni un avantage, ni votre coût final de trading. Le parcours officiel du compte connecté reste la dernière vérification.`,
  de: (a, b) => `Dieser Vergleich von ${a} und ${b} kann weder Produktzugang, regionale Berechtigung, Identitätsfreigabe, einen Nutzervorteil noch Ihre endgültigen Handelskosten bestätigen. Die letzte Prüfung ist der offizielle Kontoablauf nach dem Login.`,
  ja: (a, b) => `この ${a} と ${b} の比較では、商品の利用可否、地域資格、本人確認の結果、ユーザー特典、最終的な取引コストは確定できません。最後の確認はログイン後の公式アカウント画面で行ってください。`,
  ko: (a, b) => `이 ${a}·${b} 비교는 상품 이용 가능 여부, 지역 자격, 신원 심사 결과, 사용자 혜택, 최종 거래 비용을 확정하지 않습니다. 마지막 확인은 로그인한 공식 계정 화면에서 하세요.`,
  ar: (a, b) => `لا تستطيع هذه المقارنة بين ${a} و${b} تأكيد الوصول إلى المنتجات أو الأهلية الإقليمية أو نتيجة التحقق من الهوية أو تكلفة التداول النهائية. الفحص الأخير يكون داخل الحساب الرسمي بعد تسجيل الدخول.`,
  tr: (a, b) => `Bu ${a} ve ${b} karşılaştırması ürün erişimini, bölgesel uygunluğu, kimlik onayını veya nihai işlem maliyetinizi doğrulayamaz. Son kontrol, oturum açılmış resmî hesap akışında yapılır.`,
  ru: (a, b) => `Это сравнение ${a} и ${b} не подтверждает доступ к продуктам, доступность в вашем регионе, результат проверки личности или итоговую стоимость торговли. Последняя проверка — в официальном аккаунте после входа.`,
  id: (a, b) => `Perbandingan ${a} dan ${b} ini tidak dapat memastikan akses produk, kelayakan wilayah, hasil verifikasi identitas, manfaat apa pun, atau biaya trading akhir Anda. Pemeriksaan terakhir ada di alur akun resmi setelah login.`,
  vi: (a, b) => `So sánh ${a} và ${b} này không thể xác nhận quyền truy cập sản phẩm, điều kiện khu vực, kết quả xác minh danh tính, bất kỳ ưu đãi nào hay chi phí giao dịch cuối cùng của bạn. Bước kiểm tra cuối là luồng tài khoản chính thức sau khi đăng nhập.`,
  it: (a, b) => `Questo confronto tra ${a} e ${b} non può confermare l’accesso ai prodotti, l’idoneità regionale, l’approvazione dell’identità, alcun vantaggio o il tuo costo finale di trading. L’ultima verifica è il flusso ufficiale dell’account dopo il login.`,
};

/**
 * Assemble one locale entry in the compareDirectAnswers shape from pair-specific narrative copy.
 * @param {string} locale
 * @param {{a: string, b: string, topic?: "rates"|"derivatives"|"meme"}} pair
 * @param {{ownerQuestion: string, title: string, body: string, cardTitle: string, picks: Record<string,{fit: string, verify: string}>, faq: Array<[string,string]>, seoTitle: string, seoDescription: string, seoQuestion: string}} copy
 */
export function comparePairEntry(locale, pair, copy) {
  const nameA = VENUE_NAMES[pair.a];
  const nameB = VENUE_NAMES[pair.b];
  const labels = DECISION_CARD_LABELS[locale] || DECISION_CARD_LABELS.en;
  return {
    ownerQuestion: copy.ownerQuestion,
    title: copy.title,
    body: copy.body,
    reviewedAt: COMPARE_PAIR_REVIEWED_AT,
    reviewedLabel: (REVIEWED_LABELS[locale] || REVIEWED_LABELS.en)(nameA, nameB),
    decisionCard: { ...labels, title: copy.cardTitle, picks: copy.picks },
    productTypes: [],
    checks: [],
    searchDemand: [],
    nextSteps: [],
    boundary: (BOUNDARIES[locale] || BOUNDARIES.en)(nameA, nameB),
    sourceLinks: sourceLinksFor(pair.a, pair.b),
    internalLinks: internalLinksFor(locale, pair.a, pair.b, pair.topic || "rates"),
    faq: copy.faq,
    seoTitle: copy.seoTitle,
    seoDescription: copy.seoDescription,
    seoQuestion: copy.seoQuestion,
  };
}
