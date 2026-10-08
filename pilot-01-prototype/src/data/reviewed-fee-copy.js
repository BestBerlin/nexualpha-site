const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];

const TIER_COPY = Object.freeze({
  en: {
    "regular-user": "Regular user",
    "standard-non-vip": "Standard non-VIP",
    "vip-0": "VIP 0",
    unknown: "Public source tier",
  },
  "zh-Hans": {
    "regular-user": "普通用户",
    "standard-non-vip": "标准非 VIP",
    "vip-0": "VIP 0",
    unknown: "公开来源档位",
  },
  "zh-Hant": {
    "regular-user": "普通用戶",
    "standard-non-vip": "標準非 VIP",
    "vip-0": "VIP 0",
    unknown: "公開來源等級",
  },
  es: {
    "regular-user": "Usuario regular",
    "standard-non-vip": "Estándar sin VIP",
    "vip-0": "VIP 0",
    unknown: "Nivel de fuente pública",
  },
  "pt-BR": {
    "regular-user": "Usuário regular",
    "standard-non-vip": "Padrão sem VIP",
    "vip-0": "VIP 0",
    unknown: "Nível de fonte pública",
  },
  fr: {
    "regular-user": "Utilisateur standard",
    "standard-non-vip": "Standard non VIP",
    "vip-0": "VIP 0",
    unknown: "Niveau de source publique",
  },
  de: {
    "regular-user": "Regulärer Nutzer",
    "standard-non-vip": "Standard ohne VIP",
    "vip-0": "VIP 0",
    unknown: "Öffentliche Quellenstufe",
  },
  ja: {
    "regular-user": "一般ユーザー",
    "standard-non-vip": "標準・非 VIP",
    "vip-0": "VIP 0",
    unknown: "公開ソースの階層",
  },
  ko: {
    "regular-user": "일반 사용자",
    "standard-non-vip": "표준 비VIP",
    "vip-0": "VIP 0",
    unknown: "공개 출처 등급",
  },
  ar: {
    "regular-user": "مستخدم عادي",
    "standard-non-vip": "قياسي غير VIP",
    "vip-0": "VIP 0",
    unknown: "فئة من مصدر عام",
  },
  tr: {
    "regular-user": "Normal kullanıcı",
    "standard-non-vip": "Standart VIP dışı",
    "vip-0": "VIP 0",
    unknown: "Kamusal kaynak kademesi",
  },
  ru: {
    "regular-user": "Обычный пользователь",
    "standard-non-vip": "Стандартный без VIP",
    "vip-0": "VIP 0",
    unknown: "Уровень из публичного источника",
  },
  id: {
    "regular-user": "Pengguna reguler",
    "standard-non-vip": "Standar non-VIP",
    "vip-0": "VIP 0",
    unknown: "Tingkat sumber publik",
  },
  vi: {
    "regular-user": "Người dùng thường",
    "standard-non-vip": "Tiêu chuẩn không VIP",
    "vip-0": "VIP 0",
    unknown: "Bậc từ nguồn công khai",
  },
  it: {
    "regular-user": "Utente regolare",
    "standard-non-vip": "Standard non VIP",
    "vip-0": "VIP 0",
    unknown: "Livello da fonte pubblica",
  },
});

const SCOPE_COPY = Object.freeze({
  en: {
    official: { scope: "Base rate from the official fee page", conditions: "Taken from the platform's official fee page on the check date shown. VIP tiers, token discounts, promotions, account-specific terms and regional eligibility are excluded and must be confirmed in the official account flow." },
    binance: {
      scope: "Binance standard spot base range, excluding USDC columns",
      conditions: "Uses Binance's Regular User row from the public Spot & Margin table. BNB 25% off, USDC columns, VIP tiers, promotions, account-specific terms and regional eligibility must be confirmed in the official account flow.",
    },
    bitget: {
      scope: "Bitget standard spot base range",
      conditions: "Uses Bitget's standard spot fee before VIP tier or BGB discount. BGB fee-payment discounts, VIP tiers, promotions, account-specific terms and regional eligibility must be checked on the live Fee Schedule and in the official account flow.",
    },
    bybit: {
      scope: "Bybit normal-zone crypto-to-crypto spot base range",
      conditions: "Uses Bybit's VIP 0 row for Spot Trading (Crypto-Crypto). Fiat spot pairs, Adventure Zone, xStocks, derivatives, options, Pro, VIP and market-maker schedules are excluded; final rates can vary by region and logged-in My Fee Rate after identity verification.",
    },
    unknown: {
      scope: "Public source/account-confirmation range",
      conditions: "This fee record needs the official source, account tier, product scope and regional account flow to be confirmed before it is treated as a user-specific rate.",
    },
  },
  "zh-Hans": {
    official: { scope: "官方费率页的基础费率", conditions: "取自核实日期当天的平台官方费率页。VIP 档位、平台币折扣、活动、账户专属条款和地区资格均不包含在内，需在官方账户流程中确认。" },
    binance: { scope: "Binance 标准现货基础范围，不含 USDC 列", conditions: "使用 Binance 公开现货与杠杆费率表中的普通用户行。BNB 25% 折扣、USDC 列、VIP 档位、活动、账户专属条款和地区资格，都必须在官方账户流程中确认。" },
    bitget: { scope: "Bitget 标准现货基础范围", conditions: "使用 Bitget 在 VIP 档位或 BGB 折扣之前的标准现货费率。BGB 抵扣、VIP 档位、活动、账户专属条款和地区资格，需在实时 Fee Schedule 与官方账户流程中核对。" },
    bybit: { scope: "Bybit 普通区币币现货基础范围", conditions: "使用 Bybit 币币现货公开表中的 VIP 0 行。法币现货、Adventure Zone、xStocks、合约、期权、Pro、VIP 和做市商费率表均排除；最终费率可能因地区及实名后的 My Fee Rate 而变化。" },
    unknown: { scope: "公开来源 / 账户确认范围", conditions: "该费率记录需要先确认官方来源、账户档位、产品范围和地区账户流程，才能作为用户个人费率参考。" },
  },
  "zh-Hant": {
    official: { scope: "官方費率頁的基礎費率", conditions: "取自核實日期當天的平台官方費率頁。VIP 等級、平台幣折扣、活動、帳戶專屬條款和地區資格均不包含在內，需在官方帳戶流程中確認。" },
    binance: { scope: "Binance 標準現貨基礎範圍，不含 USDC 欄", conditions: "使用 Binance 公開現貨與槓桿費率表中的普通用戶列。BNB 25% 折扣、USDC 欄、VIP 等級、活動、帳戶專屬條款和地區資格，都必須在官方帳戶流程中確認。" },
    bitget: { scope: "Bitget 標準現貨基礎範圍", conditions: "使用 Bitget 在 VIP 等級或 BGB 折扣之前的標準現貨費率。BGB 抵扣、VIP 等級、活動、帳戶專屬條款和地區資格，需在即時 Fee Schedule 與官方帳戶流程中核對。" },
    bybit: { scope: "Bybit 普通區幣幣現貨基礎範圍", conditions: "使用 Bybit 幣幣現貨公開表中的 VIP 0 列。法幣現貨、Adventure Zone、xStocks、合約、期權、Pro、VIP 和做市商費率表均排除；最終費率可能因地區及實名後的 My Fee Rate 而變化。" },
    unknown: { scope: "公開來源 / 帳戶確認範圍", conditions: "該費率記錄需要先確認官方來源、帳戶等級、產品範圍和地區帳戶流程，才能作為用戶個人費率參考。" },
  },
  es: {
    official: { scope: "Tarifa base de la página oficial de comisiones", conditions: "Tomada de la página oficial de comisiones de la plataforma en la fecha de verificación indicada. Niveles VIP, descuentos con token, promociones, condiciones de cuenta y elegibilidad regional quedan excluidos y deben confirmarse en el flujo oficial de cuenta." },
    binance: { scope: "Rango base spot estándar de Binance, sin columnas USDC", conditions: "Usa la fila Regular User de la tabla pública Spot & Margin de Binance. El 25% con BNB, las columnas USDC, niveles VIP, promociones, condiciones de cuenta y elegibilidad regional deben confirmarse en el flujo oficial de cuenta." },
    bitget: { scope: "Rango base spot estándar de Bitget", conditions: "Usa la comisión spot estándar de Bitget antes de niveles VIP o descuento BGB. Descuentos con pago en BGB, VIP, promociones, términos de cuenta y elegibilidad regional deben revisarse en el Fee Schedule vigente y en el flujo oficial de cuenta." },
    bybit: { scope: "Rango base spot cripto-cripto de zona normal Bybit", conditions: "Usa la fila VIP 0 de Spot Trading (Crypto-Crypto) de Bybit. Pares spot fiat, Adventure Zone, xStocks, derivados, opciones, Pro, VIP y market maker quedan excluidos; la tarifa final puede variar por región y My Fee Rate tras verificación de identidad." },
    unknown: { scope: "Rango de fuente pública y confirmación de cuenta", conditions: "Este registro de comisión requiere confirmar fuente oficial, nivel de cuenta, alcance del producto y flujo regional de cuenta antes de tratarlo como tarifa específica del usuario." },
  },
  "pt-BR": {
    official: { scope: "Taxa base da página oficial de taxas", conditions: "Obtida na página oficial de taxas da plataforma na data de verificação indicada. Níveis VIP, descontos com token, promoções, termos da conta e elegibilidade regional ficam excluídos e precisam ser confirmados no fluxo oficial da conta." },
    binance: { scope: "Faixa base spot padrão da Binance, sem colunas USDC", conditions: "Usa a linha Regular User da tabela pública Spot & Margin da Binance. Desconto de 25% com BNB, colunas USDC, níveis VIP, promoções, termos específicos da conta e elegibilidade regional precisam ser confirmados no fluxo oficial da conta." },
    bitget: { scope: "Faixa base spot padrão da Bitget", conditions: "Usa a taxa spot padrão da Bitget antes de nível VIP ou desconto BGB. Descontos com pagamento em BGB, níveis VIP, promoções, termos da conta e elegibilidade regional devem ser conferidos no Fee Schedule ao vivo e no fluxo oficial da conta." },
    bybit: { scope: "Faixa base spot cripto-cripto da zona normal da Bybit", conditions: "Usa a linha VIP 0 de Spot Trading (Crypto-Crypto) da Bybit. Pares spot fiat, Adventure Zone, xStocks, derivativos, opções, Pro, VIP e tabelas de market maker ficam excluídos; a taxa final pode variar por região e pelo My Fee Rate após verificação de identidade." },
    unknown: { scope: "Faixa de fonte pública e confirmação de conta", conditions: "Este registro de taxa exige confirmar fonte oficial, nível de conta, escopo do produto e fluxo regional da conta antes de ser tratado como taxa específica do usuário." },
  },
  fr: {
    official: { scope: "Tarif de base de la page officielle des frais", conditions: "Relevé sur la page officielle des frais de la plateforme à la date de vérification indiquée. Niveaux VIP, remises en jeton, promotions, conditions de compte et éligibilité régionale sont exclus et doivent être confirmés dans le parcours officiel du compte." },
    binance: { scope: "Fourchette de base spot standard Binance, hors colonnes USDC", conditions: "Utilise la ligne Regular User du tableau public Spot & Margin de Binance. La remise BNB 25%, les colonnes USDC, niveaux VIP, promotions, conditions de compte et l’éligibilité régionale doivent être confirmés dans le parcours officiel du compte." },
    bitget: { scope: "Fourchette de base spot standard Bitget", conditions: "Utilise les frais spot standard Bitget avant niveau VIP ou remise BGB. Les remises de paiement en BGB, niveaux VIP, promotions, conditions de compte et l’éligibilité régionale doivent être vérifiés dans le Fee Schedule en direct et le parcours officiel du compte." },
    bybit: { scope: "Fourchette de base spot crypto-crypto zone normale Bybit", conditions: "Utilise la ligne VIP 0 de Spot Trading (Crypto-Crypto) chez Bybit. Les paires spot fiat, Adventure Zone, xStocks, dérivés, options, Pro, VIP et barèmes market maker sont exclus ; les frais finaux peuvent varier selon la région et My Fee Rate après vérification d’identité." },
    unknown: { scope: "Fourchette source publique / confirmation de compte", conditions: "Cet enregistrement de frais exige de confirmer la source officielle, le niveau de compte, le périmètre produit et le parcours régional du compte avant d’être traité comme un taux propre à l’utilisateur." },
  },
  de: {
    official: { scope: "Basissatz von der offiziellen Gebührenseite", conditions: "Am angegebenen Prüfdatum von der offiziellen Gebührenseite der Plattform übernommen. VIP-Stufen, Token-Rabatte, Aktionen, kontospezifische Bedingungen und regionale Eignung sind ausgeschlossen und müssen im offiziellen Kontoweg bestätigt werden." },
    binance: { scope: "Binance Standard-Spot-Basisbereich, ohne USDC-Spalten", conditions: "Verwendet die Regular User-Zeile der öffentlichen Spot & Margin-Tabelle von Binance. BNB 25% Rabatt, USDC-Spalten, VIP-Stufen, Aktionen, kontospezifische Bedingungen und regionale Eignung müssen im offiziellen Kontoweg bestätigt werden." },
    bitget: { scope: "Bitget Standard-Spot-Basisbereich", conditions: "Verwendet die Standard-Spot-Gebühr von Bitget vor VIP-Stufe oder BGB-Rabatt. BGB-Zahlungsrabatte, VIP-Stufen, Aktionen, Kontobedingungen und regionale Eignung müssen im aktuellen Fee Schedule und im offiziellen Kontoweg geprüft werden." },
    bybit: { scope: "Bybit Normalzonen-Krypto-zu-Krypto-Spot-Basisbereich", conditions: "Verwendet die VIP 0-Zeile für Spot Trading (Crypto-Crypto) bei Bybit. Fiat-Spotpaare, Adventure Zone, xStocks, Derivate, Optionen, Pro, VIP und Market-Maker-Pläne sind ausgeschlossen; endgültige Gebühren können nach Region und eingeloggtem My Fee Rate nach Identitätsprüfung variieren." },
    unknown: { scope: "Öffentliche Quelle / Konto-Bestätigungsbereich", conditions: "Dieser Gebührensatz erfordert offizielle Quelle, Kontostufe, Produktumfang und regionalen Kontoweg, bevor er als nutzerspezifische Gebühr gilt." },
  },
  ja: {
    official: { scope: "公式手数料ページの基本料率", conditions: "表示された確認日にプラットフォームの公式手数料ページから取得しました。VIP階層、トークン割引、プロモーション、口座別条件、地域資格は含まれず、公式アカウント手続きで確認が必要です。" },
    binance: { scope: "Binance 標準現物の基礎範囲（USDC 列を除く）", conditions: "Binance の公開 Spot & Margin 手数料表にある Regular User 行を使用します。BNB 25% オフ、USDC 列、VIP 階層、プロモーション、口座別条件、地域資格は公式アカウント手続きで確認が必要です。" },
    bitget: { scope: "Bitget 標準現物の基礎範囲", conditions: "VIP 階層または BGB 割引前の Bitget 標準現物手数料を使用します。BGB 支払い割引、VIP 階層、プロモーション、口座別条件、地域資格はライブ Fee Schedule と公式アカウント手続きで確認してください。" },
    bybit: { scope: "Bybit 通常ゾーンの暗号資産間現物基礎範囲", conditions: "Bybit の Spot Trading (Crypto-Crypto) にある VIP 0 行を使用します。法定通貨現物ペア、Adventure Zone、xStocks、デリバティブ、オプション、Pro、VIP、マーケットメーカー表は除外され、最終手数料は地域と本人確認後の My Fee Rate により変わる場合があります。" },
    unknown: { scope: "公開ソース / アカウント確認範囲", conditions: "この手数料記録は、ユーザー固有の料率として扱う前に、公式ソース、口座階層、商品範囲、地域別アカウント手続きを確認する必要があります。" },
  },
  ko: {
    official: { scope: "공식 수수료 페이지의 기본 요율", conditions: "표시된 확인일에 플랫폼 공식 수수료 페이지에서 가져왔습니다. VIP 등급, 토큰 할인, 프로모션, 계정별 조건 및 지역 자격은 제외되며 공식 계정 절차에서 확인해야 합니다." },
    binance: { scope: "Binance 표준 현물 기본 범위, USDC 열 제외", conditions: "Binance 공개 Spot & Margin 수수료표의 Regular User 행을 사용합니다. BNB 25% 할인, USDC 열, VIP 등급, 프로모션, 계정별 조건 및 지역 자격은 공식 계정 절차에서 확인해야 합니다." },
    bitget: { scope: "Bitget 표준 현물 기본 범위", conditions: "VIP 등급 또는 BGB 할인 전 Bitget 표준 현물 수수료를 사용합니다. BGB 수수료 결제 할인, VIP 등급, 프로모션, 계정별 조건 및 지역 자격은 실시간 Fee Schedule과 공식 계정 절차에서 확인해야 합니다." },
    bybit: { scope: "Bybit 일반 구역 암호화폐 간 현물 기본 범위", conditions: "Bybit Spot Trading (Crypto-Crypto)의 VIP 0 행을 사용합니다. 법정화폐 현물 페어, Adventure Zone, xStocks, 파생상품, 옵션, Pro, VIP 및 마켓메이커 스케줄은 제외되며, 최종 수수료는 지역과 본인 확인 후 My Fee Rate에 따라 달라질 수 있습니다." },
    unknown: { scope: "공개 출처 / 계정 확인 범위", conditions: "이 수수료 기록은 사용자별 요율로 다루기 전에 공식 출처, 계정 등급, 상품 범위, 지역 계정 절차를 확인해야 합니다." },
  },
  ar: {
    official: { scope: "السعر الأساسي من صفحة الرسوم الرسمية", conditions: "مأخوذ من صفحة الرسوم الرسمية للمنصة في تاريخ التحقق المعروض. فئات VIP وخصومات الرمز والعروض وشروط الحساب والأهلية الإقليمية مستبعدة ويجب تأكيدها في مسار الحساب الرسمي." },
    binance: { scope: "نطاق الأساس الفوري القياسي في Binance مع استبعاد أعمدة USDC", conditions: "يعتمد على صف Regular User في جدول Spot & Margin العام لدى Binance. خصم BNB 25%، وأعمدة USDC، وفئات VIP، والعروض، وشروط الحساب والأهلية الإقليمية يجب تأكيدها داخل مسار الحساب الرسمي." },
    bitget: { scope: "نطاق الأساس الفوري القياسي في Bitget", conditions: "يعتمد على رسوم Bitget الفورية القياسية قبل فئة VIP أو خصم BGB. خصومات الدفع بـ BGB، وفئات VIP، والعروض، وشروط الحساب والأهلية الإقليمية يجب مراجعتها في Fee Schedule الحي ومسار الحساب الرسمي." },
    bybit: { scope: "نطاق الأساس الفوري عملة-لعملة في المنطقة العادية لدى Bybit", conditions: "يعتمد على صف VIP 0 ضمن Spot Trading (Crypto-Crypto) لدى Bybit. أزواج الفيات الفورية، وAdventure Zone، وxStocks، والمشتقات، والخيارات، وPro، وVIP، وجداول صانعي السوق مستبعدة؛ وقد تختلف الرسوم النهائية حسب المنطقة وMy Fee Rate بعد التحقق من الهوية." },
    unknown: { scope: "نطاق مصدر عام وتأكيد حساب", conditions: "يتطلب سجل الرسوم هذا تأكيد المصدر الرسمي وفئة الحساب ونطاق المنتج ومسار الحساب الإقليمي قبل معاملته كرسوم خاصة بالمستخدم." },
  },
  tr: {
    official: { scope: "Resmî ücret sayfasındaki temel oran", conditions: "Gösterilen kontrol tarihinde platformun resmî ücret sayfasından alınmıştır. VIP kademeleri, token indirimleri, kampanyalar, hesaba özel koşullar ve bölgesel uygunluk hariçtir; resmi hesap akışında doğrulanmalıdır." },
    binance: { scope: "Binance standart spot temel aralığı, USDC sütunları hariç", conditions: "Binance genel Spot & Margin tablosundaki Regular User satırını kullanır. BNB %25 indirim, USDC sütunları, VIP kademeleri, kampanyalar, hesaba özel koşullar ve bölgesel uygunluk resmi hesap akışında doğrulanmalıdır." },
    bitget: { scope: "Bitget standart spot temel aralığı", conditions: "VIP kademesi veya BGB indirimi öncesindeki Bitget standart spot ücretini kullanır. BGB ile ücret ödeme indirimleri, VIP kademeleri, kampanyalar, hesap koşulları ve bölgesel uygunluk canlı Fee Schedule ve resmi hesap akışında kontrol edilmelidir." },
    bybit: { scope: "Bybit normal bölge kripto-kripto spot temel aralığı", conditions: "Bybit Spot Trading (Crypto-Crypto) için VIP 0 satırını kullanır. Fiat spot çiftleri, Adventure Zone, xStocks, türevler, opsiyonlar, Pro, VIP ve piyasa yapıcı tarifeleri hariçtir; nihai ücretler bölgeye ve kimlik doğrulaması sonrası oturum açılmış My Fee Rate değerine göre değişebilir." },
    unknown: { scope: "Kamusal kaynak / hesap onayı aralığı", conditions: "Bu ücret kaydı kullanıcıya özel oran sayılmadan önce resmi kaynak, hesap kademesi, ürün kapsamı ve bölgesel hesap akışı doğrulanmalıdır." },
  },
  ru: {
    official: { scope: "Базовая ставка с официальной страницы комиссий", conditions: "Взята с официальной страницы комиссий платформы на указанную дату проверки. Уровни VIP, скидки за токен, акции, условия аккаунта и региональная доступность не учтены и подтверждаются в официальном аккаунте." },
    binance: { scope: "Базовый стандартный спотовый диапазон Binance, без столбцов USDC", conditions: "Использует строку Regular User из публичной таблицы Spot & Margin Binance. Скидка BNB 25%, столбцы USDC, уровни VIP, акции, условия аккаунта и региональная доступность должны подтверждаться в официальном аккаунтном процессе." },
    bitget: { scope: "Базовый стандартный спотовый диапазон Bitget", conditions: "Использует стандартную спотовую комиссию Bitget до уровня VIP или скидки BGB. Скидки оплаты комиссий в BGB, уровни VIP, акции, условия аккаунта и региональная доступность проверяются в актуальном Fee Schedule и официальном аккаунтном процессе." },
    bybit: { scope: "Базовый спотовый диапазон Bybit crypto-to-crypto в обычной зоне", conditions: "Использует строку VIP 0 для Spot Trading (Crypto-Crypto) Bybit. Фиатные спотовые пары, Adventure Zone, xStocks, деривативы, опционы, Pro, VIP и маркет-мейкерские расписания исключены; итоговые комиссии могут зависеть от региона и My Fee Rate после проверки личности." },
    unknown: { scope: "Диапазон публичного источника и подтверждения аккаунта", conditions: "Эта запись комиссии требует подтверждения официального источника, уровня аккаунта, охвата продукта и регионального аккаунтного процесса перед использованием как персональной ставки пользователя." },
  },
  id: {
    official: { scope: "Tarif dasar dari halaman biaya resmi", conditions: "Diambil dari halaman biaya resmi platform pada tanggal pemeriksaan yang ditampilkan. Tingkat VIP, diskon token, promosi, ketentuan akun, dan kelayakan regional tidak termasuk dan harus dikonfirmasi di alur akun resmi." },
    binance: { scope: "Rentang dasar spot standar Binance, tanpa kolom USDC", conditions: "Menggunakan baris Regular User pada tabel publik Spot & Margin Binance. Diskon BNB 25%, kolom USDC, tingkat VIP, promosi, ketentuan akun, dan kelayakan wilayah harus dikonfirmasi dalam alur akun resmi." },
    bitget: { scope: "Rentang dasar spot standar Bitget", conditions: "Menggunakan biaya spot standar Bitget sebelum tingkat VIP atau diskon BGB. Diskon pembayaran biaya dengan BGB, tingkat VIP, promosi, ketentuan akun, dan kelayakan wilayah harus diperiksa pada Fee Schedule live dan alur akun resmi." },
    bybit: { scope: "Rentang dasar spot kripto-ke-kripto zona normal Bybit", conditions: "Menggunakan baris VIP 0 pada Spot Trading (Crypto-Crypto) Bybit. Pasangan spot fiat, Adventure Zone, xStocks, derivatif, opsi, Pro, VIP, dan jadwal market maker dikecualikan; biaya akhir dapat berbeda menurut wilayah dan My Fee Rate setelah verifikasi identitas." },
    unknown: { scope: "Rentang sumber publik dan konfirmasi akun", conditions: "Catatan biaya ini perlu mengonfirmasi sumber resmi, tingkat akun, cakupan produk, dan alur akun regional sebelum diperlakukan sebagai tarif khusus pengguna." },
  },
  vi: {
    official: { scope: "Mức phí cơ bản từ trang phí chính thức", conditions: "Lấy từ trang phí chính thức của nền tảng vào ngày kiểm tra hiển thị. Bậc VIP, giảm phí bằng token, khuyến mãi, điều khoản tài khoản và điều kiện khu vực không được tính và cần xác nhận trong quy trình tài khoản chính thức." },
    binance: { scope: "Phạm vi cơ sở spot tiêu chuẩn Binance, không gồm cột USDC", conditions: "Dùng dòng Regular User trong bảng công khai Spot & Margin của Binance. Ưu đãi BNB 25%, cột USDC, bậc VIP, khuyến mãi, điều kiện tài khoản và điều kiện khu vực phải được xác nhận trong luồng tài khoản chính thức." },
    bitget: { scope: "Phạm vi cơ sở spot tiêu chuẩn Bitget", conditions: "Dùng phí spot tiêu chuẩn của Bitget trước bậc VIP hoặc giảm giá BGB. Giảm phí thanh toán bằng BGB, bậc VIP, khuyến mãi, điều kiện tài khoản và điều kiện khu vực cần kiểm tra trong Fee Schedule trực tiếp và luồng tài khoản chính thức." },
    bybit: { scope: "Phạm vi cơ sở spot crypto-crypto khu vực thường của Bybit", conditions: "Dùng dòng VIP 0 trong Spot Trading (Crypto-Crypto) của Bybit. Cặp spot fiat, Adventure Zone, xStocks, phái sinh, quyền chọn, Pro, VIP và biểu phí market maker bị loại trừ; phí cuối cùng có thể thay đổi theo khu vực và My Fee Rate sau xác minh danh tính." },
    unknown: { scope: "Phạm vi nguồn công khai và xác nhận tài khoản", conditions: "Bản ghi phí này cần xác nhận nguồn chính thức, bậc tài khoản, phạm vi sản phẩm và luồng tài khoản khu vực trước khi xem là mức phí riêng của người dùng." },
  },
  it: {
    official: { scope: "Tariffa base dalla pagina ufficiale delle commissioni", conditions: "Presa dalla pagina ufficiale delle commissioni della piattaforma alla data di verifica indicata. Livelli VIP, sconti in token, promozioni, condizioni del conto e idoneità regionale sono esclusi e vanno confermati nel flusso ufficiale del conto." },
    binance: { scope: "Intervallo base spot standard Binance, escluse colonne USDC", conditions: "Usa la riga Regular User della tabella pubblica Spot & Margin di Binance. Sconto BNB 25%, colonne USDC, livelli VIP, promozioni, condizioni account e idoneità regionale devono essere confermati nel flusso ufficiale dell’account." },
    bitget: { scope: "Intervallo base spot standard Bitget", conditions: "Usa la commissione spot standard Bitget prima del livello VIP o dello sconto BGB. Sconti per pagamento commissioni in BGB, livelli VIP, promozioni, condizioni account e idoneità regionale devono essere verificati nel Fee Schedule live e nel flusso ufficiale dell’account." },
    bybit: { scope: "Intervallo base spot crypto-crypto zona normale Bybit", conditions: "Usa la riga VIP 0 per Spot Trading (Crypto-Crypto) di Bybit. Coppie spot fiat, Adventure Zone, xStocks, derivati, opzioni, Pro, VIP e piani market maker sono esclusi; le commissioni finali possono variare per regione e My Fee Rate dopo verifica identità." },
    unknown: { scope: "Intervallo fonte pubblica e conferma account", conditions: "Questo record di commissione richiede conferma di fonte ufficiale, livello account, ambito prodotto e flusso account regionale prima di essere trattato come tariffa specifica dell’utente." },
  },
});

const SCOPE_ALIAS = Object.freeze({
  "official-fee-page-base-account-region-not-proven": "official",
  "public-spot-margin-base-account-region-not-proven-discounts-excluded": "binance",
  "public-standard-spot-base-account-region-not-proven-bgb-discount-excluded": "bitget",
  "public-crypto-to-crypto-spot-base-region-account-not-proven-special-zones-excluded": "bybit",
});

function normalizeLocale(locale) {
  if (locale === "zh-CN") return "zh-Hans";
  if (locale === "zh-TW" || locale === "zh-HK") return "zh-Hant";
  if (locales.includes(locale)) return locale;
  const base = String(locale || "").split("-")[0];
  return locales.includes(base) ? base : "en";
}

export function reviewedFeeCopy(rate = {}, locale = "en") {
  const key = normalizeLocale(locale);
  const tierSet = TIER_COPY[key] || TIER_COPY.en;
  const scopeSet = SCOPE_COPY[key] || SCOPE_COPY.en;
  const scopeKey = SCOPE_ALIAS[rate?.scopeKey] || "unknown";
  const scopeCopy = scopeSet[scopeKey] || scopeSet.unknown;
  return {
    // Every checked row is the venue's public base (non-VIP) tier, so all venues show the same "Regular user" label;
    // the venue's own row name (VIP 0, Standard non-VIP, ...) stays in the conditions text.
    tier: tierSet["regular-user"],
    scope: scopeCopy.scope,
    conditions: scopeCopy.conditions,
  };
}
