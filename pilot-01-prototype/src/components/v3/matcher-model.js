import { localizedHref } from "../../data/locale-routing.js";
import { buildRegionalShortlist, regionalShortlistCopy } from "../../data/regional-shortlist.js";

const categoriesByIntent = {
  accountCex: "CEX",
  walletDex: "DEX",
  onchainPerp: "Perp DEX",
};

export const platformMatcherIntentKeys = Object.keys(categoriesByIntent);

const sharedIntentMeta = {
  accountCex: { category: "CEX", value: "account-based-cex" },
  walletDex: { category: "DEX", value: "wallet-swap-dex" },
  onchainPerp: { category: "Perp DEX", value: "onchain-perp" },
};

export const matcherDecisionDefaults = Object.freeze({
  kycPreference: "unsure",
  usageFrequency: "monthly",
  usageScale: "regular_size",
});

const matcherDecisionOptions = Object.freeze({
  kycPreference: ["unsure", "kyc_ok", "avoid_kyc"],
  usageFrequency: ["monthly", "weekly", "daily"],
  usageScale: ["small_size", "regular_size", "larger_size"],
});

const REVIEWED_CANDIDATE_STATUSES = new Set(["researchable", "account_confirm"]);

const matcherDecisionCopyByLocale = {
  en: {
    filters: {
      kycPreference: "KYC preference",
      usageFrequency: "Usage rhythm",
      usageScale: "Usage tier",
    },
    options: {
      kycPreference: { unsure: "Not sure yet", kyc_ok: "KYC is acceptable", avoid_kyc: "Prefer no KYC" },
      usageFrequency: { monthly: "Monthly", weekly: "Weekly", daily: "Daily" },
      usageScale: { small_size: "Small tier", regular_size: "Regular tier", larger_size: "Larger tier" },
    },
    candidateLabels: {
      score: "Match score",
      reasons: "Why this is shown",
      nextSteps: "Next steps",
      profile: "Open onsite profile",
      compare: "Compare reviewed pair",
      verify: "Verify regional fit",
    },
    reasons: {
      sourceReviewed: "Regional source row is reviewed",
      fundingRoute: "Funding route is in the reviewed matrix",
      accountConfirm: "Account flow still needs logged-in confirmation",
      kycConflict: "No-KYC preference conflicts with account-based venues",
      paused: "Paused source context is excluded from matching",
      frequency: "Usage rhythm is handled as a tier",
      scale: "Usage scale uses a tier, not an amount",
    },
    failClosed: "Need at least two reviewed candidates before comparing. Use the profile and verification steps instead.",
  },
  "zh-Hans": {
    filters: {
      kycPreference: "KYC 偏好",
      usageFrequency: "使用频率",
      usageScale: "使用档位",
    },
    options: {
      kycPreference: { unsure: "暂不确定", kyc_ok: "可接受 KYC", avoid_kyc: "倾向无 KYC" },
      usageFrequency: { monthly: "每月", weekly: "每周", daily: "每天" },
      usageScale: { small_size: "小档", regular_size: "常规档", larger_size: "较大档" },
    },
    candidateLabels: {
      score: "匹配分",
      reasons: "展示原因",
      nextSteps: "下一步",
      profile: "打开站内档案",
      compare: "比较已审阅候选",
      verify: "核验地区适配",
    },
    reasons: {
      sourceReviewed: "地区来源行已审阅",
      fundingRoute: "入金路径来自已审阅矩阵",
      accountConfirm: "账户流程仍需登录后确认",
      kycConflict: "无 KYC 偏好与账户型平台存在冲突",
      paused: "暂停复核来源已排除在匹配之外",
      frequency: "使用频率按档位处理",
      scale: "使用规模使用档位，不使用具体金额",
    },
    failClosed: "至少需要两个已审阅候选才开放比较；请先查看档案并核验地区适配。",
  },
  "zh-Hant": {
    filters: {
      kycPreference: "KYC 偏好",
      usageFrequency: "使用頻率",
      usageScale: "使用檔位",
    },
    options: {
      kycPreference: { unsure: "暫不確定", kyc_ok: "可接受 KYC", avoid_kyc: "傾向無 KYC" },
      usageFrequency: { monthly: "每月", weekly: "每週", daily: "每天" },
      usageScale: { small_size: "小檔", regular_size: "常規檔", larger_size: "較大檔" },
    },
    candidateLabels: {
      score: "匹配分",
      reasons: "展示原因",
      nextSteps: "下一步",
      profile: "打開站內檔案",
      compare: "比較已審閱候選",
      verify: "核驗地區適配",
    },
    reasons: {
      sourceReviewed: "地區來源列已審閱",
      fundingRoute: "入金路徑來自已審閱矩陣",
      accountConfirm: "帳戶流程仍需登入後確認",
      kycConflict: "無 KYC 偏好與帳戶型平台存在衝突",
      paused: "暫停複核來源已排除在匹配之外",
      frequency: "使用頻率按檔位處理",
      scale: "使用規模使用檔位，不使用具體金額",
    },
    failClosed: "至少需要兩個已審閱候選才開放比較；請先查看檔案並核驗地區適配。",
  },
};

const copyByLocale = {
  en: {
    eyebrow: "Platform matcher",
    title: "Choose by how you intend to trade",
    body: "Pick an access model to get a focused shortlist with custody, execution model, and risk checks before any registration handoff.",
    shortlistLabel: "Matched shortlist",
    detailLabel: "Open profile",
    compareLabel: "Compare the first two",
    comparePending: "Need two platforms to compare",
    sourceLabel: "Official source",
    selectLabel: "Choose platform access model",
    decisionLabels: { custody: "Custody", model: "Model", risk: "Risk" },
    intents: {
      accountCex: { label: "Account CEX", title: "Account-based exchange", body: "Custody and login sit with the exchange account. Check region, KYC, funding, fees, and product access before registration.", custody: "Exchange account custody", model: "Order book and account routes", risk: "KYC, region, fee, withdrawal, and product limits" },
      walletDex: { label: "Wallet DEX", title: "Wallet swap route", body: "You keep wallet control and interact on-chain. Verify domain, network, contract address, liquidity, and gas before connecting.", custody: "Self-custody wallet", model: "On-chain swap and routing", risk: "Contract, routing, liquidity, network, and gas risk" },
      onchainPerp: { label: "On-chain perp", title: "On-chain perpetual venue", body: "Wallet-based derivatives need extra checks for collateral, liquidation, oracle, funding, and jurisdiction limits.", custody: "Wallet collateral control", model: "On-chain perpetual contracts", risk: "Liquidation, leverage, oracle, funding, and contract risk" },
    },
  },
  "zh-Hans": {
    eyebrow: "平台匹配器",
    title: "按你的交易方式选择平台",
    body: "按交易方式筛选候选平台；注册或连接钱包前，先看账户/钱包、如何成交和主要风险。",
    shortlistLabel: "匹配结果",
    detailLabel: "看详情",
    compareLabel: "对比前两家",
    comparePending: "至少两家平台才能对比",
    sourceLabel: "官方来源",
    selectLabel: "按交易方式筛选",
    decisionLabels: { custody: "账户/钱包", model: "如何成交", risk: "先看风险" },
    intents: {
      accountCex: { label: "账户 CEX", title: "用交易所账户交易", body: "登录、入金和资产记录在交易所账户侧处理。注册前查看地区说明、KYC、费用、入出金和产品页面。", custody: "交易所账户", model: "订单簿撮合", risk: "KYC、地区、费用、提现和产品限制" },
      walletDex: { label: "钱包 DEX", title: "用钱包连接交易", body: "你保留钱包控制权，交易在链上或通过路由完成。连接前查看域名、网络、合约地址、流动性和 Gas。", custody: "自托管钱包", model: "链上兑换/路由", risk: "合约、路由、流动性、网络与 Gas 风险" },
      onchainPerp: { label: "Perp DEX", title: "用钱包交易永续", body: "钱包式永续需要额外查看抵押品、清算、预言机、资金费率和地区限制说明。", custody: "钱包抵押品", model: "链上永续合约", risk: "清算、杠杆、预言机、资金费率与合约风险" },
    },
  },
  "zh-Hant": {
    eyebrow: "平台匹配器",
    title: "按你的交易方式選擇平台",
    body: "按交易方式篩選候選平台；註冊或連接錢包前，先看帳戶/錢包、如何成交和主要風險。",
    shortlistLabel: "匹配結果",
    detailLabel: "看詳情",
    compareLabel: "比較前兩家",
    comparePending: "至少兩家平台才能比較",
    sourceLabel: "官方來源",
    selectLabel: "按交易方式篩選",
    decisionLabels: { custody: "帳戶/錢包", model: "如何成交", risk: "先看風險" },
    intents: {
      accountCex: { label: "帳戶 CEX", title: "用交易所帳戶交易", body: "登入、入金和資產紀錄在交易所帳戶側處理。註冊前查看地區說明、KYC、費用、入出金和產品頁面。", custody: "交易所帳戶", model: "訂單簿撮合", risk: "KYC、地區、費用、提現和產品限制" },
      walletDex: { label: "錢包 DEX", title: "用錢包連接交易", body: "你保留錢包控制權，交易在鏈上或透過路由完成。連接前查看網域、網絡、合約地址、流動性和 Gas。", custody: "自託管錢包", model: "鏈上兌換/路由", risk: "合約、路由、流動性、網絡與 Gas 風險" },
      onchainPerp: { label: "Perp DEX", title: "用錢包交易永續", body: "錢包式永續需要額外查看抵押品、清算、預言機、資金費率和地區限制說明。", custody: "錢包抵押品", model: "鏈上永續合約", risk: "清算、槓桿、預言機、資金費率與合約風險" },
    },
  },
  es: {
    eyebrow: "Selector de plataformas",
    title: "Elige según cómo quieres operar",
    body: "Selecciona un modelo de acceso para ver una lista corta con custodia, ejecución y riesgos antes de cualquier registro.",
    shortlistLabel: "Lista corta",
    detailLabel: "Abrir perfil",
    compareLabel: "Comparar las dos primeras",
    comparePending: "Se necesitan dos plataformas",
    sourceLabel: "Fuente oficial",
    selectLabel: "Elegir modelo de acceso",
    decisionLabels: { custody: "Custodia", model: "Modelo", risk: "Riesgo" },
    intents: {
      accountCex: { label: "CEX con cuenta", title: "Exchange basado en cuenta", body: "La custodia y el inicio de sesión quedan en la cuenta del exchange. Revisa región, KYC, depósitos, comisiones y productos.", custody: "Custodia en cuenta del exchange", model: "Libro de órdenes y rutas de cuenta", risk: "KYC, región, comisiones, retiros y límites de producto" },
      walletDex: { label: "DEX con wallet", title: "Ruta de swap con wallet", body: "Mantienes el control de la wallet e interactúas on-chain. Verifica dominio, red, contrato, liquidez y gas.", custody: "Wallet en autocustodia", model: "Swap y enrutamiento on-chain", risk: "Contrato, ruta, liquidez, red y gas" },
      onchainPerp: { label: "Perp on-chain", title: "Venue de perpetuos on-chain", body: "Los derivados con wallet exigen revisar colateral, liquidación, oráculo, funding y límites jurisdiccionales.", custody: "Control de colateral en wallet", model: "Contratos perpetuos on-chain", risk: "Liquidación, apalancamiento, oráculo, funding y contrato" },
    },
  },
  "pt-BR": {
    eyebrow: "Seletor de plataformas",
    title: "Escolha pelo modo como pretende operar",
    body: "Selecione um modelo de acesso para ver uma lista curta com custódia, execução e riscos antes de qualquer cadastro.",
    shortlistLabel: "Lista curta",
    detailLabel: "Abrir perfil",
    compareLabel: "Comparar as duas primeiras",
    comparePending: "São necessárias duas plataformas",
    sourceLabel: "Fonte oficial",
    selectLabel: "Escolher modelo de acesso",
    decisionLabels: { custody: "Custódia", model: "Modelo", risk: "Risco" },
    intents: {
      accountCex: { label: "CEX com conta", title: "Exchange baseado em conta", body: "Custódia e login ficam na conta da exchange. Verifique região, KYC, depósitos, taxas e acesso a produtos.", custody: "Custódia na conta da exchange", model: "Livro de ofertas e rotas de conta", risk: "KYC, região, taxas, saque e limites de produto" },
      walletDex: { label: "DEX com wallet", title: "Rota de swap com wallet", body: "Você mantém o controle da wallet e interage on-chain. Verifique domínio, rede, contrato, liquidez e gas.", custody: "Wallet em autocustódia", model: "Swap e roteamento on-chain", risk: "Contrato, rota, liquidez, rede e gas" },
      onchainPerp: { label: "Perp on-chain", title: "Plataforma de perpétuos on-chain", body: "Derivativos via wallet exigem checagens de colateral, liquidação, oráculo, funding e jurisdição.", custody: "Controle de colateral na wallet", model: "Contratos perpétuos on-chain", risk: "Liquidação, alavancagem, oráculo, funding e contrato" },
    },
  },
  fr: {
    eyebrow: "Sélecteur de plateformes",
    title: "Choisissez selon votre manière de trader",
    body: "Sélectionnez un modèle d'accès pour obtenir une liste courte avec garde, exécution et risques avant toute inscription.",
    shortlistLabel: "Sélection",
    detailLabel: "Ouvrir le profil",
    compareLabel: "Comparer les deux premières",
    comparePending: "Deux plateformes sont requises",
    sourceLabel: "Source officielle",
    selectLabel: "Choisir le modèle d'accès",
    decisionLabels: { custody: "Garde", model: "Modèle", risk: "Risque" },
    intents: {
      accountCex: { label: "CEX avec compte", title: "Exchange basé sur un compte", body: "La garde et la connexion relèvent du compte exchange. Vérifiez région, KYC, dépôts, frais et produits.", custody: "Garde par compte exchange", model: "Carnet d'ordres et parcours compte", risk: "KYC, région, frais, retraits et limites produit" },
      walletDex: { label: "DEX wallet", title: "Parcours swap avec wallet", body: "Vous gardez le contrôle du wallet et interagissez on-chain. Vérifiez domaine, réseau, contrat, liquidité et gas.", custody: "Wallet en auto-garde", model: "Swap et routage on-chain", risk: "Contrat, routage, liquidité, réseau et gas" },
      onchainPerp: { label: "Perp on-chain", title: "Plateforme de perpétuels on-chain", body: "Les dérivés via wallet exigent des contrôles sur collatéral, liquidation, oracle, funding et juridiction.", custody: "Contrôle du collatéral par wallet", model: "Contrats perpétuels on-chain", risk: "Liquidation, levier, oracle, funding et contrat" },
    },
  },
  de: {
    eyebrow: "Plattform-Matcher",
    title: "Nach geplanter Handelsweise wählen",
    body: "Wählen Sie ein Zugangsmodell für eine fokussierte Auswahl mit Verwahrung, Ausführung und Risikoprüfung vor der Registrierung.",
    shortlistLabel: "Passende Auswahl",
    detailLabel: "Profil öffnen",
    compareLabel: "Erste zwei vergleichen",
    comparePending: "Zwei Plattformen nötig",
    sourceLabel: "Offizielle Quelle",
    selectLabel: "Zugangsmodell wählen",
    decisionLabels: { custody: "Verwahrung", model: "Modell", risk: "Risiko" },
    intents: {
      accountCex: { label: "Konto-CEX", title: "Kontobasierte Börse", body: "Verwahrung und Login liegen beim Börsenkonto. Prüfen Sie Region, KYC, Einzahlung, Gebühren und Produktzugang.", custody: "Verwahrung im Börsenkonto", model: "Orderbuch und Kontorouten", risk: "KYC, Region, Gebühren, Auszahlungen und Produktgrenzen" },
      walletDex: { label: "Wallet-DEX", title: "Wallet-Swap-Route", body: "Sie behalten die Wallet-Kontrolle und interagieren on-chain. Prüfen Sie Domain, Netzwerk, Vertrag, Liquidität und Gas.", custody: "Self-Custody-Wallet", model: "On-chain Swap und Routing", risk: "Vertrag, Routing, Liquidität, Netzwerk und Gas" },
      onchainPerp: { label: "On-chain Perp", title: "On-chain Perpetual-Plattform", body: "Wallet-Derivate brauchen Prüfungen zu Sicherheiten, Liquidation, Oracle, Funding und Rechtsraum.", custody: "Wallet-Kontrolle der Sicherheiten", model: "On-chain Perpetual-Kontrakte", risk: "Liquidation, Hebel, Oracle, Funding und Vertrag" },
    },
  },
  ja: {
    eyebrow: "プラットフォーム判定",
    title: "取引方法から候補を選ぶ",
    body: "アクセス方式を選ぶと、登録前に保管、執行モデル、リスク確認を整理した候補に絞れます。",
    shortlistLabel: "候補リスト",
    detailLabel: "プロフィールを見る",
    compareLabel: "先頭 2 件を比較",
    comparePending: "比較には 2 件必要です",
    sourceLabel: "公式ソース",
    selectLabel: "アクセス方式を選択",
    decisionLabels: { custody: "保管", model: "モデル", risk: "リスク" },
    intents: {
      accountCex: { label: "口座型 CEX", title: "口座ベースの取引所", body: "保管とログインは取引所口座側です。地域、KYC、入金、手数料、商品アクセスを確認します。", custody: "取引所口座での保管", model: "注文板と口座ルート", risk: "KYC、地域、手数料、出金、商品制限" },
      walletDex: { label: "ウォレット DEX", title: "ウォレット swap ルート", body: "ウォレット管理を保ったままオンチェーンで操作します。ドメイン、ネットワーク、コントラクト、流動性、Gas を確認します。", custody: "自己管理ウォレット", model: "オンチェーン swap とルーティング", risk: "コントラクト、経路、流動性、ネットワーク、Gas" },
      onchainPerp: { label: "オンチェーン perp", title: "オンチェーン永久先物", body: "ウォレット型デリバティブでは担保、清算、オラクル、Funding、地域制限を追加確認します。", custody: "ウォレット担保管理", model: "オンチェーン永久契約", risk: "清算、レバレッジ、オラクル、Funding、契約リスク" },
    },
  },
  ko: {
    eyebrow: "플랫폼 매처",
    title: "거래 방식에 맞춰 고르기",
    body: "접근 모델을 선택하면 가입 전 보관, 실행 방식, 위험 확인을 담은 후보로 좁힙니다.",
    shortlistLabel: "매칭 후보",
    detailLabel: "프로필 열기",
    compareLabel: "앞의 두 곳 비교",
    comparePending: "비교에는 두 플랫폼이 필요합니다",
    sourceLabel: "공식 출처",
    selectLabel: "접근 모델 선택",
    decisionLabels: { custody: "보관", model: "모델", risk: "위험" },
    intents: {
      accountCex: { label: "계정형 CEX", title: "계정 기반 거래소", body: "보관과 로그인은 거래소 계정에서 처리됩니다. 지역, KYC, 입금, 수수료, 상품 접근을 확인하세요.", custody: "거래소 계정 보관", model: "오더북과 계정 경로", risk: "KYC, 지역, 수수료, 출금, 상품 제한" },
      walletDex: { label: "월렛 DEX", title: "월렛 스왑 경로", body: "월렛 통제권을 유지하고 온체인에서 상호작용합니다. 도메인, 네트워크, 계약, 유동성, Gas 를 확인하세요.", custody: "자가 보관 월렛", model: "온체인 스왑과 라우팅", risk: "계약, 라우팅, 유동성, 네트워크, Gas" },
      onchainPerp: { label: "온체인 perp", title: "온체인 무기한 플랫폼", body: "월렛 기반 파생상품은 담보, 청산, 오라클, funding, 관할 제한을 추가로 확인해야 합니다.", custody: "월렛 담보 통제", model: "온체인 무기한 계약", risk: "청산, 레버리지, 오라클, funding, 계약 위험" },
    },
  },
  ar: {
    eyebrow: "مطابق المنصات",
    title: "اختر حسب طريقة التداول",
    body: "اختر نموذج الوصول لعرض قائمة مركزة توضّح الحفظ، وآلية التنفيذ، وفحوص المخاطر قبل أي تسجيل.",
    shortlistLabel: "القائمة المطابقة",
    detailLabel: "فتح الملف",
    compareLabel: "قارن أول منصتين",
    comparePending: "تحتاج منصتين للمقارنة",
    sourceLabel: "المصدر الرسمي",
    selectLabel: "اختيار نموذج الوصول",
    decisionLabels: { custody: "الحفظ", model: "النموذج", risk: "المخاطر" },
    intents: {
      accountCex: { label: "CEX بحساب", title: "منصة تعتمد على الحساب", body: "الحفظ وتسجيل الدخول يتمان عبر حساب المنصة. افحص المنطقة و KYC والتمويل والرسوم وإتاحة المنتجات.", custody: "حفظ عبر حساب المنصة", model: "دفتر أوامر ومسارات حساب", risk: "KYC والمنطقة والرسوم والسحب وحدود المنتجات" },
      walletDex: { label: "DEX بمحفظة", title: "مسار تبديل بالمحفظة", body: "تبقى المحفظة تحت سيطرتك وتتفاعل على السلسلة. تحقق من النطاق والشبكة والعقد والسيولة والغاز.", custody: "محفظة ذاتية الحفظ", model: "تبديل وتوجيه على السلسلة", risk: "العقد والتوجيه والسيولة والشبكة والغاز" },
      onchainPerp: { label: "Perp على السلسلة", title: "منصة عقود دائمة على السلسلة", body: "المشتقات عبر المحفظة تحتاج فحص الضمان والتصفية والأوراكل والتمويل والقيود القانونية.", custody: "تحكم المحفظة في الضمان", model: "عقود دائمة على السلسلة", risk: "التصفية والرافعة والأوراكل والتمويل ومخاطر العقد" },
    },
  },
  tr: {
    eyebrow: "Platform eşleyici",
    title: "İşlem biçimine göre seç",
    body: "Erişim modelini seçin; kayıt öncesinde saklama, yürütme modeli ve risk kontrolleriyle kısa liste oluşur.",
    shortlistLabel: "Eşleşen kısa liste",
    detailLabel: "Profili aç",
    compareLabel: "İlk ikisini karşılaştır",
    comparePending: "Karşılaştırma için iki platform gerekir",
    sourceLabel: "Resmi kaynak",
    selectLabel: "Erişim modeli seç",
    decisionLabels: { custody: "Saklama", model: "Model", risk: "Risk" },
    intents: {
      accountCex: { label: "Hesaplı CEX", title: "Hesap tabanlı borsa", body: "Saklama ve giriş borsa hesabındadır. Bölge, KYC, fonlama, ücretler ve ürün erişimini kontrol edin.", custody: "Borsa hesabı saklaması", model: "Emir defteri ve hesap rotaları", risk: "KYC, bölge, ücret, çekim ve ürün sınırları" },
      walletDex: { label: "Cüzdan DEX", title: "Cüzdan swap rotası", body: "Cüzdan kontrolü sizdedir ve işlem on-chain gerçekleşir. Alan adı, ağ, sözleşme, likidite ve gas kontrol edilir.", custody: "Kendi saklama cüzdanı", model: "On-chain swap ve yönlendirme", risk: "Sözleşme, rota, likidite, ağ ve gas riski" },
      onchainPerp: { label: "On-chain perp", title: "On-chain perpetual platform", body: "Cüzdan temelli türevlerde teminat, likidasyon, oracle, funding ve yargı sınırları ayrıca kontrol edilir.", custody: "Cüzdan teminat kontrolü", model: "On-chain perpetual kontratlar", risk: "Likidasyon, kaldıraç, oracle, funding ve kontrat riski" },
    },
  },
  ru: {
    eyebrow: "Подбор платформ",
    title: "Выберите по способу торговли",
    body: "Выберите модель доступа, чтобы получить короткий список с проверками хранения, исполнения и рисков до регистрации.",
    shortlistLabel: "Подходящий список",
    detailLabel: "Открыть профиль",
    compareLabel: "Сравнить первые две",
    comparePending: "Для сравнения нужны две платформы",
    sourceLabel: "Официальный источник",
    selectLabel: "Выбрать модель доступа",
    decisionLabels: { custody: "Хранение", model: "Модель", risk: "Риск" },
    intents: {
      accountCex: { label: "CEX с аккаунтом", title: "Биржа с учетной записью", body: "Хранение и вход находятся на стороне биржевого аккаунта. Проверьте регион, KYC, пополнение, комиссии и продукты.", custody: "Хранение в биржевом аккаунте", model: "Стакан заявок и аккаунтные маршруты", risk: "KYC, регион, комиссии, вывод и лимиты продуктов" },
      walletDex: { label: "DEX с кошельком", title: "Маршрут swap через кошелек", body: "Контроль кошелька остается у вас, взаимодействие идет on-chain. Проверьте домен, сеть, контракт, ликвидность и gas.", custody: "Самостоятельное хранение в кошельке", model: "On-chain swap и маршрутизация", risk: "Контракт, маршрут, ликвидность, сеть и gas" },
      onchainPerp: { label: "On-chain perp", title: "Площадка on-chain perpetual", body: "Деривативы через кошелек требуют проверки залога, ликвидации, оракула, funding и юрисдикции.", custody: "Контроль залога в кошельке", model: "On-chain perpetual контракты", risk: "Ликвидация, плечо, оракул, funding и контракт" },
    },
  },
  id: {
    eyebrow: "Pencocok platform",
    title: "Pilih berdasarkan cara Anda trading",
    body: "Pilih model akses untuk melihat daftar singkat dengan cek kustodi, eksekusi, dan risiko sebelum registrasi.",
    shortlistLabel: "Daftar cocok",
    detailLabel: "Buka profil",
    compareLabel: "Bandingkan dua pertama",
    comparePending: "Perlu dua platform untuk dibandingkan",
    sourceLabel: "Sumber resmi",
    selectLabel: "Pilih model akses",
    decisionLabels: { custody: "Kustodi", model: "Model", risk: "Risiko" },
    intents: {
      accountCex: { label: "CEX akun", title: "Exchange berbasis akun", body: "Kustodi dan login berada di akun exchange. Cek wilayah, KYC, funding, biaya, dan akses produk.", custody: "Kustodi akun exchange", model: "Order book dan rute akun", risk: "KYC, wilayah, biaya, penarikan, dan batas produk" },
      walletDex: { label: "DEX wallet", title: "Rute swap wallet", body: "Kontrol wallet tetap di Anda dan interaksi terjadi on-chain. Cek domain, jaringan, kontrak, likuiditas, dan gas.", custody: "Wallet self-custody", model: "Swap dan routing on-chain", risk: "Kontrak, routing, likuiditas, jaringan, dan gas" },
      onchainPerp: { label: "Perp on-chain", title: "Venue perpetual on-chain", body: "Derivatif berbasis wallet perlu cek kolateral, likuidasi, oracle, funding, dan batas yurisdiksi.", custody: "Kontrol kolateral wallet", model: "Kontrak perpetual on-chain", risk: "Likuidasi, leverage, oracle, funding, dan kontrak" },
    },
  },
  vi: {
    eyebrow: "Bộ ghép nền tảng",
    title: "Chọn theo cách bạn muốn giao dịch",
    body: "Chọn mô hình truy cập để có danh sách ngắn kèm kiểm tra lưu ký, thực thi và rủi ro trước khi đăng ký.",
    shortlistLabel: "Danh sách phù hợp",
    detailLabel: "Mở hồ sơ",
    compareLabel: "So sánh hai nền tảng đầu",
    comparePending: "Cần hai nền tảng để so sánh",
    sourceLabel: "Nguồn chính thức",
    selectLabel: "Chọn mô hình truy cập",
    decisionLabels: { custody: "Lưu ký", model: "Mô hình", risk: "Rủi ro" },
    intents: {
      accountCex: { label: "CEX tài khoản", title: "Sàn dựa trên tài khoản", body: "Lưu ký và đăng nhập nằm ở tài khoản sàn. Kiểm tra khu vực, KYC, nạp tiền, phí và sản phẩm.", custody: "Lưu ký qua tài khoản sàn", model: "Sổ lệnh và tuyến tài khoản", risk: "KYC, khu vực, phí, rút tiền và giới hạn sản phẩm" },
      walletDex: { label: "DEX ví", title: "Tuyến swap bằng ví", body: "Bạn giữ quyền kiểm soát ví và tương tác on-chain. Kiểm tra miền, mạng, hợp đồng, thanh khoản và gas.", custody: "Ví tự lưu ký", model: "Swap và định tuyến on-chain", risk: "Hợp đồng, định tuyến, thanh khoản, mạng và gas" },
      onchainPerp: { label: "Perp on-chain", title: "Nền tảng hợp đồng vĩnh cửu on-chain", body: "Phái sinh qua ví cần kiểm tra tài sản thế chấp, thanh lý, oracle, funding và giới hạn khu vực.", custody: "Kiểm soát tài sản thế chấp bằng ví", model: "Hợp đồng vĩnh cửu on-chain", risk: "Thanh lý, đòn bẩy, oracle, funding và hợp đồng" },
    },
  },
  it: {
    eyebrow: "Matcher piattaforme",
    title: "Scegli in base a come vuoi fare trading",
    body: "Seleziona un modello di accesso per una lista breve con controlli su custodia, esecuzione e rischi prima della registrazione.",
    shortlistLabel: "Lista abbinata",
    detailLabel: "Apri profilo",
    compareLabel: "Confronta le prime due",
    comparePending: "Servono due piattaforme",
    sourceLabel: "Fonte ufficiale",
    selectLabel: "Scegli modello di accesso",
    decisionLabels: { custody: "Custodia", model: "Modello", risk: "Rischio" },
    intents: {
      accountCex: { label: "CEX con account", title: "Exchange basato su account", body: "Custodia e login sono nell'account exchange. Verifica regione, KYC, funding, commissioni e prodotti.", custody: "Custodia nell'account exchange", model: "Order book e percorsi account", risk: "KYC, regione, commissioni, prelievi e limiti prodotto" },
      walletDex: { label: "DEX con wallet", title: "Percorso swap con wallet", body: "Mantieni il controllo del wallet e interagisci on-chain. Verifica dominio, rete, contratto, liquidità e gas.", custody: "Wallet in self-custody", model: "Swap e routing on-chain", risk: "Contratto, routing, liquidità, rete e gas" },
      onchainPerp: { label: "Perp on-chain", title: "Venue perpetual on-chain", body: "I derivati via wallet richiedono controlli su collaterale, liquidazione, oracle, funding e giurisdizione.", custody: "Controllo collaterale nel wallet", model: "Contratti perpetual on-chain", risk: "Liquidazione, leva, oracle, funding e contratto" },
    },
  },
};

export function matcherCopy(locale = "en") {
  return copyByLocale[locale] ?? copyByLocale.en;
}

export function matcherSupportedLocales() {
  return Object.keys(copyByLocale);
}

export function matcherDecisionCopy(locale = "en") {
  return matcherDecisionCopyByLocale[locale] ?? matcherDecisionCopyByLocale.en;
}

export function matcherDecisionChoiceGroups(locale = "en") {
  const copy = matcherDecisionCopy(locale);
  return Object.entries(matcherDecisionOptions).map(([key, values]) => ({
    key,
    label: copy.filters[key],
    options: values.map((value) => ({ value, label: copy.options[key]?.[value] || matcherDecisionCopy("en").options[key][value] })),
  }));
}

export function categoryForIntent(intentKey) {
  return categoriesByIntent[intentKey] ?? categoriesByIntent.accountCex;
}

export function normalizeIntentKey(intentKey) {
  return platformMatcherIntentKeys.includes(intentKey) ? intentKey : "accountCex";
}

export function detailHref(locale, slug) {
  return localizedHref(`/exchanges/${encodeURIComponent(slug)}`, { locale: locale || "en" });
}

export function compareHref(locale, slugs) {
  const pair = Array.isArray(slugs) ? slugs.filter(Boolean).slice(0, 2) : [];
  if (pair.length < 2) return "";
  return localizedHref(`/compare/${pair.map((slug) => encodeURIComponent(slug)).join("-vs-")}`, { locale: locale || "en" });
}

function normalizeDecisionValue(key, value) {
  return matcherDecisionOptions[key].includes(value) ? value : matcherDecisionDefaults[key];
}

export function normalizeMatcherDecisionPassport(decisionPassport = {}) {
  const input = decisionPassport && typeof decisionPassport === "object" ? decisionPassport : {};
  return {
    ...input,
    kycPreference: normalizeDecisionValue("kycPreference", input.kycPreference),
    usageFrequency: normalizeDecisionValue("usageFrequency", input.usageFrequency),
    usageScale: normalizeDecisionValue("usageScale", input.usageScale),
  };
}

function hrefWithDecisionContext(href, { locale = "en", decision = {} } = {}) {
  if (!href) return "";
  return localizedHref(href, {
    locale,
    kyc: decision.kycPreference,
    usage_frequency: decision.usageFrequency,
    usage_scale: decision.usageScale,
  });
}

function scoreRegionalCandidate(candidate, { activeIntentKey, decision, hasFunding }) {
  let score = 70;
  if (candidate.status === "researchable") score += 18;
  if (candidate.status === "account_confirm") score += 7;
  if (hasFunding) score += 4;
  if (activeIntentKey === "accountCex" && decision.kycPreference === "avoid_kyc") score -= 24;
  if (decision.usageFrequency === "daily") score += 3;
  if (decision.usageScale === "larger_size") score += 2;
  return Math.max(0, Math.min(99, score));
}

function regionalCandidateReasons(candidate, { copy, activeIntentKey, decision, hasFunding }) {
  const reasons = [copy.reasons.sourceReviewed];
  if (hasFunding) reasons.push(copy.reasons.fundingRoute);
  if (candidate.status === "account_confirm") reasons.push(copy.reasons.accountConfirm);
  if (activeIntentKey === "accountCex" && decision.kycPreference === "avoid_kyc") reasons.push(copy.reasons.kycConflict);
  reasons.push(copy.reasons.frequency, copy.reasons.scale);
  return reasons;
}

function reviewedRegionalCandidates(candidates = [], context) {
  return (Array.isArray(candidates) ? candidates : [])
    .filter((candidate) => candidate?.slug && REVIEWED_CANDIDATE_STATUSES.has(candidate.status) && candidate.sourceLabel)
    .map((candidate) => ({
      ...candidate,
      score: scoreRegionalCandidate(candidate, context),
      reasons: regionalCandidateReasons(candidate, context),
    }))
    .sort((a, b) => b.score - a.score || String(a.slug).localeCompare(String(b.slug)))
    .slice(0, 3);
}

export function venuesForIntent(venues = [], intentKey = "accountCex") {
  const category = categoryForIntent(intentKey);
  return (Array.isArray(venues) ? venues : []).filter((venue) => venue?.category === category);
}

export function selectionForIntent(venues = [], intentKey = "accountCex") {
  return venuesForIntent(venues, intentKey).slice(0, 2).map((venue) => venue.slug);
}

export function intentFromSelection(venues = [], selected = []) {
  const selectedSlug = Array.isArray(selected) ? selected.find(Boolean) : null;
  const selectedVenue = (Array.isArray(venues) ? venues : []).find((venue) => venue?.slug === selectedSlug);
  const category = selectedVenue?.category;
  return platformMatcherIntentKeys.find((key) => categoriesByIntent[key] === category) ?? "accountCex";
}

export function platformMatcherModel({ locale = "en", venues = [], selected = [], intentKey, decisionPassport = {} } = {}) {
  const copy = matcherCopy(locale);
  const decisionCopy = matcherDecisionCopy(locale);
  const matcherDecision = normalizeMatcherDecisionPassport(decisionPassport);
  const activeIntentKey = normalizeIntentKey(intentKey ?? intentFromSelection(venues, selected));
  const activeSlugs = new Set(Array.isArray(selected) ? selected : []);
  const intents = platformMatcherIntentKeys.map((key) => ({
    key,
    ...sharedIntentMeta[key],
    ...copy.intents[key],
    selected: key === activeIntentKey,
    count: venuesForIntent(venues, key).length,
  }));
  const shortlist = venuesForIntent(venues, activeIntentKey).slice(0, 5).map((venue) => ({
    slug: venue.slug,
    name: venue.name,
    category: venue.category,
    officialDomain: venue.officialDomain || "",
    selected: activeSlugs.has(venue.slug),
    href: detailHref(locale, venue.slug),
  }));
  const genericComparisonSlugs = shortlist.slice(0, 2).map((venue) => venue.slug);
  const regionalShortlist = matcherDecision?.market
    ? buildRegionalShortlist({
      market: matcherDecision.market,
      locale,
      product: matcherDecision.product || (activeIntentKey === "walletDex" ? "dex" : activeIntentKey === "onchainPerp" ? "perpetuals" : "spot"),
      funding: matcherDecision.funding || "",
      accountStage: matcherDecision.accountStage || "new_account",
    })
    : null;
  const regionalCopy = regionalShortlist ? regionalShortlistCopy(locale) : null;
  const normalizedRegionalCandidates = reviewedRegionalCandidates(regionalShortlist?.candidates, {
    copy: decisionCopy,
    activeIntentKey,
    decision: matcherDecision,
    hasFunding: Boolean(regionalShortlist?.funding),
  });
  const regionalComparisonSlugs = normalizedRegionalCandidates.slice(0, 2).map((candidate) => candidate.slug);
  const canRegionalCompare = regionalComparisonSlugs.length >= 2;
  const regionalCompareHref = canRegionalCompare
    ? localizedHref(`/compare/${regionalComparisonSlugs.map((slug) => encodeURIComponent(slug)).join("-vs-")}`, {
      locale,
      market: regionalShortlist.market,
      product: regionalShortlist.product || "spot",
      account_stage: regionalShortlist.accountStage || "new_account",
      ...(regionalShortlist.funding ? { funding: regionalShortlist.funding } : {}),
      kyc: matcherDecision.kycPreference,
      usage_frequency: matcherDecision.usageFrequency,
      usage_scale: matcherDecision.usageScale,
    })
    : "";
  const regionalVerifyHref = regionalShortlist
    ? hrefWithDecisionContext(`/exchanges?market=${encodeURIComponent(regionalShortlist.market)}&product=${encodeURIComponent(regionalShortlist.product || "spot")}&account_stage=${encodeURIComponent(regionalShortlist.accountStage || "new_account")}${regionalShortlist.funding ? `&funding=${encodeURIComponent(regionalShortlist.funding)}` : ""}`, { locale, decision: matcherDecision })
    : "";
  const regionalCandidates = normalizedRegionalCandidates
    .map((candidate) => ({
      slug: candidate.slug,
      name: candidate.name,
      status: candidate.status,
      statusLabel: regionalCopy?.[candidate.status] || candidate.status,
      note: candidate.note,
      sourceLabel: candidate.sourceLabel,
      score: candidate.score,
      reasons: candidate.reasons,
      href: hrefWithDecisionContext(detailHref(locale, candidate.slug), { locale, decision: matcherDecision }),
      nextSteps: [
        { kind: "profile", label: decisionCopy.candidateLabels.profile, href: hrefWithDecisionContext(detailHref(locale, candidate.slug), { locale, decision: matcherDecision }) },
        ...(canRegionalCompare ? [{ kind: "compare", label: decisionCopy.candidateLabels.compare, href: hrefWithDecisionContext(regionalCompareHref, { locale, decision: matcherDecision }) }] : []),
        ...(regionalVerifyHref ? [{ kind: "verify", label: decisionCopy.candidateLabels.verify, href: regionalVerifyHref }] : []),
      ],
    }));
  const hasRegionalContext = Boolean(regionalShortlist);
  const comparisonSlugs = hasRegionalContext ? regionalComparisonSlugs : genericComparisonSlugs;
  const comparisonHref = hasRegionalContext ? regionalCompareHref : compareHref(locale, comparisonSlugs);
  return {
    locale,
    copy,
    decision: {
      copy: decisionCopy,
      values: {
        kycPreference: matcherDecision.kycPreference,
        usageFrequency: matcherDecision.usageFrequency,
        usageScale: matcherDecision.usageScale,
      },
      choices: matcherDecisionChoiceGroups(locale),
    },
    activeIntentKey,
    activeIntent: intents.find((intent) => intent.key === activeIntentKey),
    intents,
    shortlist,
    comparisonSlugs,
    comparisonHref,
    canCompare: comparisonSlugs.length >= 2,
    regional: regionalShortlist ? {
      copy: regionalCopy,
      market: regionalShortlist.market,
      product: regionalShortlist.product,
      funding: regionalShortlist.funding,
      fundingOptions: regionalShortlist.row?.paymentRails || [],
      accountStage: regionalShortlist.accountStage,
      candidates: regionalCandidates,
      compareHref: regionalCompareHref,
      verifyHref: regionalVerifyHref,
      telegramHref: regionalShortlist.telegramHref,
      note: canRegionalCompare ? regionalCopy?.note || "" : decisionCopy.failClosed,
    } : null,
  };
}
