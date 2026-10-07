function localeKey(locale = "en") {
  return locale === "pt-BR" ? "pt-BR" : String(locale || "en").split("-")[0];
}

function joinList(values = [], fallback = "—") {
  return values.filter(Boolean).join(" · ") || fallback;
}

const BOUNDARY_COPY = {
  en: {
    linked: (authority, reviewedAt) => `${authority} sources reviewed on ${reviewedAt}; final funding, KYC, product access and benefit outcome must still be checked in the official account flow.`,
    pending: "Source pack pending; use this page as a compact decision checklist and verify funding, KYC, product access and benefits in the official account flow.",
  },
  es: {
    linked: (authority, reviewedAt) => `Fuentes de ${authority} revisadas el ${reviewedAt}; financiación, KYC, producto y beneficio deben confirmarse en la cuenta oficial.`,
    pending: "Paquete de fuentes pendiente; usa esta página como checklist compacto y confirma financiación, KYC, producto y beneficios en la cuenta oficial.",
  },
  id: {
    linked: (authority, reviewedAt) => `Sumber ${authority} ditinjau pada ${reviewedAt}; pendanaan, KYC, akses produk, dan manfaat tetap harus dicek di akun resmi.`,
    pending: "Paket sumber masih tertunda; gunakan halaman ini sebagai checklist ringkas dan verifikasi pendanaan, KYC, produk, serta manfaat di akun resmi.",
  },
  "zh-Hans": {
    linked: (authority, reviewedAt) => `${authority} 来源已于 ${reviewedAt} 核对；入金、KYC、产品权限和优惠结果仍需在官方账户流程中确认。`,
    pending: "来源包待补充；本页只作为紧凑决策清单，入金、KYC、产品权限和优惠需在官方账户流程中确认。",
  },
  "zh-Hant": {
    linked: (authority, reviewedAt) => `${authority} 來源已於 ${reviewedAt} 核對；入金、KYC、產品權限與優惠結果仍需在官方帳戶流程中確認。`,
    pending: "來源包待補充；本頁只作為緊湊決策清單，入金、KYC、產品權限與優惠需在官方帳戶流程中確認。",
  },
  ja: {
    linked: (authority, reviewedAt) => `${authority} の情報源は ${reviewedAt} に確認済みです。入金、本人確認、商品アクセス、特典は公式アカウントで確認してください。`,
    pending: "情報源パックは保留中です。このページは短い確認リストとして使い、入金、本人確認、商品、特典は公式アカウントで確認してください。",
  },
  ko: {
    linked: (authority, reviewedAt) => `${authority} 공식 자료를 ${reviewedAt}에 검토했습니다. 입금, 본인확인, 상품 이용 가능 여부와 혜택은 공식 가입 화면에서 다시 확인하세요.`,
    pending: "출처 패키지는 아직 검토 중입니다. 이 페이지는 가입 전 체크리스트로만 사용하고 입금, 본인확인, 상품, 혜택은 공식 가입 화면에서 확인하세요.",
  },
  tr: {
    linked: (authority, reviewedAt) => `${authority} kaynakları ${reviewedAt} tarihinde gözden geçirildi; para yatırma, kimlik doğrulama, ürün erişimi ve kullanıcı avantajı yine de resmi hesap akışında kontrol edilmelidir.`,
    pending: "Kaynak paketi beklemede; bu sayfayı kayıt öncesi kontrol listesi olarak kullanın ve para yatırma, kimlik doğrulama, ürün erişimi ile avantajları resmi hesap akışında doğrulayın.",
  },
  vi: {
    linked: (authority, reviewedAt) => `Nguồn ${authority} đã được rà soát vào ${reviewedAt}; đường nạp, KYC, quyền truy cập sản phẩm và quyền lợi cuối cùng vẫn phải xác nhận trong tài khoản chính thức.`,
    pending: "Gói nguồn đang chờ hoàn thiện; hãy dùng trang này như checklist quyết định ngắn và xác nhận đường nạp, KYC, sản phẩm cùng quyền lợi trong tài khoản chính thức.",
  },
};

const NEXT_STEP_COPY = {
  en: {
    payment: (payment, currency) => `Next: check ${payment} and account currency ${currency} inside the platform before depositing.`,
    kyc: (kyc, source) => `Next: confirm ${kyc}; use ${source} as the review starting point, not an eligibility promise.`,
    product: (product, source) => `Next: keep product set to ${product} and verify product scope against ${source}.`,
  },
  es: {
    payment: (payment, currency) => `Siguiente: confirma ${payment} y moneda de cuenta ${currency} dentro de la plataforma antes de depositar.`,
    kyc: (kyc, source) => `Siguiente: confirma ${kyc}; usa ${source} como punto de revisión, no como promesa de elegibilidad.`,
    product: (product, source) => `Siguiente: mantén producto ${product} y verifica su alcance con ${source}.`,
  },
  id: {
    payment: (payment, currency) => `Langkah berikutnya: cek ${payment} dan mata uang akun ${currency} di platform sebelum deposit.`,
    kyc: (kyc, source) => `Langkah berikutnya: konfirmasi ${kyc}; gunakan ${source} sebagai awal pengecekan, bukan janji kelayakan.`,
    product: (product, source) => `Langkah berikutnya: pertahankan produk ${product} dan cek cakupannya melalui ${source}.`,
  },
  "zh-Hans": {
    payment: (payment, currency) => `下一步：入金前在平台内核对 ${payment} 与账户货币 ${currency}。`,
    kyc: (kyc, source) => `下一步：确认 ${kyc}；${source} 只是核对起点，不是资格承诺。`,
    product: (product, source) => `下一步：保持产品为 ${product}，再按 ${source} 核对产品范围。`,
  },
  "zh-Hant": {
    payment: (payment, currency) => `下一步：入金前在平台內核對 ${payment} 與帳戶貨幣 ${currency}。`,
    kyc: (kyc, source) => `下一步：確認 ${kyc}；${source} 只是核對起點，不是資格承諾。`,
    product: (product, source) => `下一步：保持產品為 ${product}，再按 ${source} 核對產品範圍。`,
  },
  ja: {
    payment: (payment, currency) => `次に、入金前に ${payment} と口座通貨 ${currency} を公式画面で確認します。`,
    kyc: (kyc, source) => `次に、${kyc} を確認します。${source} は確認の起点であり、利用資格の保証ではありません。`,
    product: (product, source) => `次に、商品を ${product} として、${source} で利用範囲を確認します。`,
  },
  ko: {
    payment: (payment, currency) => `다음 단계: 입금하기 전에 ${payment} 경로와 계정 통화 ${currency}를 공식 화면에서 확인하세요.`,
    kyc: (kyc, source) => `다음 단계: ${kyc} 조건을 확인하세요. ${source}는 검토 출발점일 뿐, 계정 승인 보장이 아닙니다.`,
    product: (product, source) => `다음 단계: 선택한 상품을 ${product}로 두고 ${source} 기준으로 실제 이용 범위를 확인하세요.`,
  },
  tr: {
    payment: (payment, currency) => `Sıradaki adım: para yatırmadan önce ${payment} yolunu ve hesap para birimi ${currency} bilgisini resmi ekranda kontrol edin.`,
    kyc: (kyc, source) => `Sıradaki adım: ${kyc} koşulunu doğrulayın; ${source} inceleme başlangıcıdır, hesap onayı vaadi değildir.`,
    product: (product, source) => `Sıradaki adım: ürünü ${product} olarak bırakın ve gerçek erişim kapsamını ${source} ile kontrol edin.`,
  },
  vi: {
    payment: (payment, currency) => `Bước tiếp theo: kiểm tra ${payment} và đơn vị tiền tệ ${currency} trong tài khoản chính thức trước khi nạp.`,
    kyc: (kyc, source) => `Bước tiếp theo: xác nhận ${kyc}; dùng ${source} làm điểm bắt đầu rà soát, không phải cam kết đủ điều kiện.`,
    product: (product, source) => `Bước tiếp theo: giữ sản phẩm ở ${product} và xác minh phạm vi sử dụng qua ${source}.`,
  },
};

const TERMS_BY_LOCALE = {
  ja: {
    kycRequired: "本人確認",
    accountChecks: "表示された口座確認手続き",
    spotProduct: "現物",
    unknownProduct: "現物または利用予定の商品",
    fallbackPayment: "表示された入金経路",
    fallbackCurrency: "表示された口座通貨",
    fallbackSource: "公式プラットフォーム手続き",
  },
  ko: {
    kycRequired: "본인확인",
    accountChecks: "표시된 계정 확인 절차",
    spotProduct: "현물",
    unknownProduct: "현물 또는 이용하려는 상품",
    fallbackPayment: "표시된 입금 경로",
    fallbackCurrency: "표시된 계정 통화",
    fallbackSource: "공식 플랫폼 절차",
  },
  tr: {
    kycRequired: "kimlik doğrulama",
    accountChecks: "gösterilen hesap kontrolleri",
    spotProduct: "spot",
    unknownProduct: "spot veya hedef ürün",
    fallbackPayment: "gösterilen para yatırma yolu",
    fallbackCurrency: "gösterilen hesap para birimi",
    fallbackSource: "resmi platform akışı",
  },
  vi: {
    kycRequired: "KYC / xác minh danh tính",
    accountChecks: "các bước kiểm tra tài khoản được hiển thị",
    spotProduct: "giao ngay",
    unknownProduct: "giao ngay hoặc sản phẩm dự định sử dụng",
    fallbackPayment: "đường nạp được hiển thị",
    fallbackCurrency: "đơn vị tiền tệ hiển thị trong tài khoản",
    fallbackSource: "quy trình tài khoản chính thức",
  },
};

const INDEXABLE_REGIONAL_PATHS = {
  BR: "/br",
  MX: "/mx",
  TW: "/tw",
  ID: "/id",
  HK: "/hk",
  EU: "/eu",
  UK: "/uk",
  US: "/us",
  JP: "/jp",
  KR: "/kr",
  SG: "/sg",
  TR: "/tr/markets/turkiye",
};

const COMPACT_AEO_COPY = {
  en: {
    title: "Direct answer from the question registry",
    open: "Open registry-based verification answer",
    close: "Hide registry-based verification answer",
    known: "Known from current source pack",
    unknown: "Still unknown until the official account flow",
    sequence: "Verification order",
    preview: "Preview only",
    sourceLine: (sourceLinked, count) => `${sourceLinked}/${count} source-linked registry questions.`,
    indexed: (path) => `Current public carrier: ${path}.`,
    noindex: "This market remains a noindex preview; use it as research context, not a published AEO claim.",
    answer: (count, market, authority) => `${market} has ${count} reviewed registry question${count === 1 ? "" : "s"} for regulation, identity, funding or product scope. Start with ${authority}, then confirm the official account screen for residence, identity, payment rail, fees, limits and product availability. The page can explain what to verify, but it cannot promise account approval, local funding access, fee outcome, benefit eligibility or registration attribution.`,
    knownItems: (count, sourceLinked, authority) => [
      `${count} fixed registry question${count === 1 ? "" : "s"} mapped to this market.`,
      sourceLinked ? `${sourceLinked} question${sourceLinked === 1 ? "" : "s"} carry source URLs or official-source registry context.` : `No source-linked question is recorded yet; use ${authority} only as a starting point.`,
      "The page can route users to directory, rate and comparison checks without changing partner destinations.",
    ],
    unknownItems: [
      "Whether this exact user can pass KYC or residence checks.",
      "Whether the local fiat rail appears in their current account.",
      "Whether a promotion, rebate, fee tier or product remains available after signup.",
    ],
    steps: ["Check official regulator or source list", "Match legal entity and official domain", "Open the platform account flow", "Confirm identity, fiat rail, fees, limits and product scope"],
  },
  "pt-BR": {
    title: "Resposta direta do registro de perguntas",
    open: "Abrir resposta de verificação",
    close: "Ocultar resposta de verificação",
    known: "Já conhecido pelo pacote de fontes",
    unknown: "Ainda desconhecido até a conta oficial",
    sequence: "Ordem de verificação",
    preview: "Prévia",
    sourceLine: (sourceLinked, count) => `${sourceLinked}/${count} perguntas do registro com fonte.`,
    indexed: (path) => `Página pública atual: ${path}.`,
    noindex: "Este mercado ainda é prévia noindex; use como contexto de pesquisa, não como cobertura AEO publicada.",
    answer: (count, market, authority) => `${market} tem ${count} pergunta${count === 1 ? "" : "s"} revisada${count === 1 ? "" : "s"} sobre regulação, identidade, pagamento ou produto. Comece por ${authority}, depois confirme residência, identidade, rota de pagamento, taxas, limites e produto na conta oficial. A página explica o que verificar, mas não promete aprovação, Pix/BRL, taxa final, benefício ou atribuição de cadastro.`,
    knownItems: (count, sourceLinked, authority) => [
      `${count} pergunta${count === 1 ? "" : "s"} fixa${count === 1 ? "" : "s"} ligada${count === 1 ? "" : "s"} a este mercado.`,
      sourceLinked ? `${sourceLinked} pergunta${sourceLinked === 1 ? "" : "s"} com URL de fonte ou contexto oficial.` : `Sem pergunta com fonte vinculada; use ${authority} apenas como ponto de partida.`,
      "A página pode levar a diretório, taxas e comparação sem alterar destinos de parceiro.",
    ],
    unknownItems: ["Se este usuário passará por KYC ou residência.", "Se a rota local aparece na conta atual.", "Se promoção, desconto, taxa ou produto continuam disponíveis após o cadastro."],
    steps: ["Conferir fonte oficial", "Casar entidade legal e domínio oficial", "Abrir o fluxo da conta", "Confirmar identidade, pagamento, taxas, limites e produto"],
  },
  ja: {
    title: "質問レジストリからの直接回答",
    open: "確認回答を開く",
    close: "確認回答を閉じる",
    known: "現在の情報源で分かること",
    unknown: "公式アカウント画面まで分からないこと",
    sequence: "確認順序",
    preview: "プレビューのみ",
    sourceLine: (sourceLinked, count) => `情報源付き質問 ${sourceLinked}/${count} 件。`,
    indexed: (path) => `現在の公開ページ: ${path}。`,
    noindex: "この市場は noindex プレビューです。公開済みAEO回答ではなく調査文脈として扱ってください。",
    answer: (count, market, authority) => `${market} には、規制、本人確認、入金経路、商品範囲に関する確認済み質問が ${count} 件あります。まず ${authority} を確認し、その後、公式アカウント画面で居住地、本人確認、入金経路、手数料、限度額、商品利用可否を確認します。このページは確認順序を示しますが、口座承認、入金可否、手数料、特典、登録成果は約束しません。`,
    knownItems: (count, sourceLinked, authority) => [`この市場に紐づく固定質問は ${count} 件です。`, sourceLinked ? `${sourceLinked} 件に情報源URLまたは公式ソース文脈があります。` : `情報源付き質問は未記録です。${authority} は確認の起点です。`, "ディレクトリ、手数料、比較への導線は維持し、提携先リンクは変更しません。"],
    unknownItems: ["このユーザーが本人確認や居住地条件を通過できるか。", "現在の口座に現地通貨の入出金経路が表示されるか。", "登録後も特典、手数料、商品が利用できるか。"],
    steps: ["公式情報源を確認", "法人名と公式ドメインを照合", "公式アカウント画面を開く", "本人確認、入金、手数料、限度額、商品範囲を確認"],
  },
  ko: {
    title: "질문 레지스트리 기반 직접 답변",
    open: "검증 답변 열기",
    close: "검증 답변 닫기",
    known: "현재 출처로 확인된 내용",
    unknown: "공식 계정 화면 전까지 알 수 없는 내용",
    sequence: "확인 순서",
    preview: "미리보기",
    sourceLine: (sourceLinked, count) => `출처 연결 질문 ${sourceLinked}/${count}개.`,
    indexed: (path) => `현재 공개 경로: ${path}.`,
    noindex: "이 시장은 noindex 미리보기입니다. 공개 AEO 답변이 아니라 리서치 맥락으로만 사용하세요.",
    answer: (count, market, authority) => `${market}에는 규제, 본인확인, 입금 경로 또는 상품 범위와 연결된 검토 질문이 ${count}개 있습니다. 먼저 ${authority}를 확인하고, 공식 계정 화면에서 거주지, 본인확인, 결제 경로, 수수료, 한도와 상품 이용 가능 여부를 다시 확인해야 합니다. 이 페이지는 확인 순서를 설명하지만 계정 승인, 입금 가능성, 수수료 결과, 혜택 또는 가입 귀속을 약속하지 않습니다.`,
    knownItems: (count, sourceLinked, authority) => [`이 시장에 매핑된 고정 질문은 ${count}개입니다.`, sourceLinked ? `${sourceLinked}개 질문에 출처 URL 또는 공식 출처 맥락이 있습니다.` : `출처 연결 질문은 아직 없습니다. ${authority}는 출발점일 뿐입니다.`, "디렉터리, 수수료, 비교 경로는 유지하며 파트너 목적지는 바꾸지 않습니다."],
    unknownItems: ["사용자가 KYC 또는 거주지 조건을 통과할 수 있는지.", "현재 계정에 현지 입출금 경로가 표시되는지.", "혜택, 수수료 등급 또는 상품이 가입 후에도 이용 가능한지."],
    steps: ["공식 규제 또는 출처 확인", "법인명과 공식 도메인 대조", "플랫폼 계정 절차 열기", "본인확인, 결제, 수수료, 한도, 상품 범위 확인"],
  },
  tr: {
    title: "Soru kayıtlarından doğrudan yanıt",
    open: "Doğrulama yanıtını aç",
    close: "Doğrulama yanıtını gizle",
    known: "Mevcut kaynak paketinden bilinenler",
    unknown: "Resmî hesap akışına kadar bilinmeyenler",
    sequence: "Doğrulama sırası",
    preview: "Ön izleme",
    sourceLine: (sourceLinked, count) => `${sourceLinked}/${count} soru kaynak bağlantılı.`,
    indexed: (path) => `Geçerli yayın yolu: ${path}.`,
    noindex: "Bu pazar noindex ön izlemedir; yayınlanmış AEO kapsamı değil araştırma bağlamıdır.",
    answer: (count, market, authority) => `${market} için regülasyon, kimlik, TRY/HKD/EUR benzeri fonlama veya ürün kapsamına bağlı ${count} incelenmiş soru var. Önce ${authority} kontrol edilir, sonra resmî hesap akışında ikamet, kimlik, ödeme yolu, ücret, limit ve ürün erişimi doğrulanır. Sayfa neyi kontrol edeceğini açıklar; hesap onayı, fonlama, ücret sonucu, kullanıcı avantajı veya kayıt atfı vaat etmez.`,
    knownItems: (count, sourceLinked, authority) => [`Bu pazara bağlı ${count} sabit soru var.`, sourceLinked ? `${sourceLinked} soru kaynak URL'si veya resmî kaynak bağlamı taşıyor.` : `Kaynak bağlı soru yok; ${authority} sadece başlangıçtır.`, "Dizin, ücret ve karşılaştırma yolları korunur; partner hedefleri değişmez."],
    unknownItems: ["Kullanıcının kimlik veya ikamet kontrolünden geçip geçmeyeceği.", "Yerel para yatırma yolunun mevcut hesapta görünüp görünmeyeceği.", "Promosyon, ücret seviyesi veya ürünün kayıt sonrası kullanılabilir kalıp kalmayacağı."],
    steps: ["Resmî kaynak listesini kontrol et", "Tüzel kişi ve resmî alan adını eşleştir", "Platform hesap akışını aç", "Kimlik, fonlama, ücret, limit ve ürün kapsamını doğrula"],
  },
  ar: {
    title: "إجابة مباشرة من سجل الأسئلة",
    open: "فتح إجابة التحقق",
    close: "إخفاء إجابة التحقق",
    known: "المعروف من حزمة المصادر الحالية",
    unknown: "غير معروف حتى مسار الحساب الرسمي",
    sequence: "ترتيب التحقق",
    preview: "معاينة فقط",
    sourceLine: (sourceLinked, count) => `${sourceLinked}/${count} أسئلة في السجل مرتبطة بمصادر.`,
    indexed: (path) => `المسار العام الحالي: ${path}.`,
    noindex: "يبقى هذا السوق كمعاينة noindex؛ استخدمه كسياق بحث، لا كادعاء AEO منشور.",
    answer: (count, market, authority) => `لدى ${market} عدد ${count} من أسئلة السجل المراجعة حول التنظيم أو الهوية أو التمويل أو نطاق المنتج. ابدأ بـ ${authority}، ثم تحقق من شاشة الحساب الرسمية للإقامة والهوية ومسار الدفع والرسوم والحدود وتوفر المنتج. تشرح الصفحة ما يجب التحقق منه، لكنها لا تعد بالموافقة على الحساب أو التمويل المحلي أو نتيجة الرسوم أو أهلية المزايا أو إسناد التسجيل.`,
    knownItems: (count, sourceLinked, authority) => [
      `${count} أسئلة ثابتة مرتبطة بهذا السوق.`,
      sourceLinked ? `${sourceLinked} أسئلة تحمل روابط مصادر أو سياق مصادر رسمية.` : `لا توجد أسئلة مرتبطة بمصادر بعد؛ استخدم ${authority} كنقطة بداية فقط.`,
      "يمكن للصفحة توجيه المستخدم إلى الدليل والرسوم والمقارنة دون تغيير وجهات الشركاء.",
    ],
    unknownItems: [
      "هل يمكن لهذا المستخدم اجتياز فحوص KYC أو الإقامة.",
      "هل يظهر مسار العملة المحلية في حسابه الحالي.",
      "هل تبقى الحملة أو الخصم أو مستوى الرسوم أو المنتج متاحاً بعد التسجيل.",
    ],
    steps: ["تحقق من الجهة التنظيمية أو قائمة المصادر الرسمية", "طابق الكيان القانوني والنطاق الرسمي", "افتح مسار حساب المنصة", "أكد الهوية والتمويل والرسوم والحدود ونطاق المنتج"],
  },
  es: {
    title: "Respuesta directa del registro de preguntas",
    open: "Abrir respuesta de verificación",
    close: "Ocultar respuesta de verificación",
    known: "Conocido por el paquete de fuentes",
    unknown: "Desconocido hasta el flujo oficial",
    sequence: "Orden de verificación",
    preview: "Vista previa",
    sourceLine: (sourceLinked, count) => `${sourceLinked}/${count} preguntas del registro con fuente.`,
    indexed: (path) => `Ruta pública actual: ${path}.`,
    noindex: "Este mercado sigue como vista previa noindex; úsalo como contexto de investigación, no como cobertura AEO publicada.",
    answer: (count, market, authority) => `${market} tiene ${count} pregunta${count === 1 ? "" : "s"} revisada${count === 1 ? "" : "s"} sobre regulación, identidad, financiación o producto. Empieza por ${authority} y luego confirma residencia, identidad, método de pago, comisiones, límites y producto en la cuenta oficial. La página explica qué verificar; no promete aprobación, financiación, tarifa, beneficio ni atribución de registro.`,
    knownItems: (count, sourceLinked, authority) => [`${count} pregunta${count === 1 ? "" : "s"} fija${count === 1 ? "" : "s"} mapeada${count === 1 ? "" : "s"} a este mercado.`, sourceLinked ? `${sourceLinked} pregunta${sourceLinked === 1 ? "" : "s"} con URL de fuente o contexto oficial.` : `Sin pregunta con fuente vinculada; ${authority} es solo el punto de partida.`, "La página puede llevar a directorio, tarifas y comparación sin cambiar destinos de partner."],
    unknownItems: ["Si este usuario superará KYC o residencia.", "Si la ruta local aparece en su cuenta actual.", "Si promoción, tarifa o producto siguen disponibles tras registrarse."],
    steps: ["Revisar fuente oficial", "Coincidir entidad legal y dominio oficial", "Abrir el flujo de cuenta", "Confirmar identidad, pago, comisiones, límites y producto"],
  },
  id: {
    title: "Jawaban langsung dari registri pertanyaan",
    open: "Buka jawaban verifikasi",
    close: "Sembunyikan jawaban verifikasi",
    known: "Diketahui dari paket sumber saat ini",
    unknown: "Belum diketahui sebelum alur akun resmi",
    sequence: "Urutan verifikasi",
    preview: "Pratinjau",
    sourceLine: (sourceLinked, count) => `${sourceLinked}/${count} pertanyaan registri bertaut sumber.`,
    indexed: (path) => `Rute publik saat ini: ${path}.`,
    noindex: "Pasar ini masih pratinjau noindex; gunakan sebagai konteks riset, bukan klaim AEO terbit.",
    answer: (count, market, authority) => `${market} memiliki ${count} pertanyaan yang ditinjau tentang regulasi, identitas, pendanaan, atau cakupan produk. Mulai dari ${authority}, lalu cek domisili, identitas, jalur pembayaran, biaya, batas, dan produk di alur akun resmi. Halaman ini menjelaskan urutan verifikasi; bukan janji persetujuan akun, pendanaan lokal, biaya, manfaat, atau atribusi pendaftaran.`,
    knownItems: (count, sourceLinked, authority) => [`${count} pertanyaan tetap dipetakan ke pasar ini.`, sourceLinked ? `${sourceLinked} pertanyaan punya URL sumber atau konteks resmi.` : `Belum ada pertanyaan bertaut sumber; ${authority} hanya titik awal.`, "Halaman tetap bisa mengarah ke direktori, biaya, dan perbandingan tanpa mengubah tujuan partner."],
    unknownItems: ["Apakah pengguna ini lolos KYC atau syarat domisili.", "Apakah jalur lokal muncul di akun saat ini.", "Apakah promo, biaya, atau produk tetap tersedia setelah daftar."],
    steps: ["Cek sumber resmi", "Cocokkan badan hukum dan domain resmi", "Buka alur akun platform", "Konfirmasi identitas, pembayaran, biaya, batas, dan produk"],
  },
  vi: {
    title: "Câu trả lời trực tiếp từ sổ câu hỏi",
    open: "Mở câu trả lời xác minh",
    close: "Ẩn câu trả lời xác minh",
    known: "Thông tin đã biết từ gói nguồn hiện tại",
    unknown: "Thông tin chưa biết trước khi mở tài khoản chính thức",
    sequence: "Thứ tự xác minh",
    preview: "Bản xem trước",
    sourceLine: (sourceLinked, count) => `${sourceLinked}/${count} câu hỏi có liên kết nguồn.`,
    indexed: (path) => `Đường dẫn công khai hiện tại: ${path}.`,
    noindex: "Thị trường này vẫn là bản xem trước noindex; chỉ dùng làm ngữ cảnh nghiên cứu, không phải tuyên bố AEO đã xuất bản.",
    answer: (count, market, authority) => `${market} có ${count} câu hỏi rà soát về quy định, danh tính, funding hoặc phạm vi sản phẩm. Bắt đầu từ ${authority}, sau đó xác nhận nơi cư trú, danh tính, đường thanh toán, phí, giới hạn và sản phẩm trong tài khoản chính thức. Trang này chỉ giải thích thứ tự kiểm tra; không cam kết duyệt tài khoản, nạp tiền nội địa, mức phí, quyền lợi hay quy kết đăng ký.`,
    knownItems: (count, sourceLinked, authority) => [`Có ${count} câu hỏi cố định gắn với thị trường này.`, sourceLinked ? `${sourceLinked} câu hỏi có URL nguồn hoặc ngữ cảnh nguồn chính thức.` : `Chưa có câu hỏi gắn nguồn; ${authority} chỉ là điểm bắt đầu.`, "Trang có thể dẫn tới danh mục, phí và so sánh mà không thay đổi đích liên kết đối tác."],
    unknownItems: ["Người dùng cụ thể có vượt qua KYC hoặc điều kiện cư trú hay không.", "Đường nạp nội địa có xuất hiện trong tài khoản hiện tại hay không.", "Ưu đãi, bậc phí hoặc sản phẩm có còn khả dụng sau khi đăng ký hay không."],
    steps: ["Kiểm tra nguồn chính thức", "Đối chiếu pháp nhân và tên miền chính thức", "Mở quy trình tài khoản của nền tảng", "Xác nhận danh tính, thanh toán, phí, giới hạn và phạm vi sản phẩm"],
  },
};

function compactCopyFor(locale) {
  return COMPACT_AEO_COPY[locale] || COMPACT_AEO_COPY[localeKey(locale)] || COMPACT_AEO_COPY.en;
}

export function regionalAeoCoverageSummary({ market = "", questions = [], registry = {}, locale = "en" } = {}) {
  const normalizedMarket = String(market || "").toUpperCase();
  const copy = compactCopyFor(locale);
  const officialAuthority = registry?.sources?.length ? (registry.authority || "official sources") : "the official account flow";
  const sourceLinked = questions.filter((item) => item?.sourceUrls?.length || item?.status === "source-linked").length;
  const path = INDEXABLE_REGIONAL_PATHS[normalizedMarket] || `/${normalizedMarket.toLowerCase()}`;
  const isIndexedCarrier = Boolean(INDEXABLE_REGIONAL_PATHS[normalizedMarket]);
  const count = questions.length;
  return {
    title: copy.title,
    openLabel: copy.open,
    closeLabel: copy.close,
    knownLabel: copy.known,
    unknownLabel: copy.unknown,
    sequenceLabel: copy.sequence,
    publicationStatus: isIndexedCarrier ? copy.indexed(path) : copy.noindex,
    statusTone: isIndexedCarrier ? "indexed" : "preview",
    count,
    sourceLinked,
    sourceLine: copy.sourceLine(sourceLinked, count),
    directAnswer: copy.answer(count, normalizedMarket || "this market", officialAuthority),
    knownItems: copy.knownItems(count, sourceLinked, officialAuthority),
    unknownItems: copy.unknownItems,
    verificationSteps: copy.steps,
    previewLabel: copy.preview,
  };
}

function termsFor(locale) {
  return TERMS_BY_LOCALE[locale] || TERMS_BY_LOCALE[localeKey(locale)] || {};
}

export function regionalPageBoundary({ registry, locale = "en", reviewedAt = "" } = {}) {
  const copy = BOUNDARY_COPY[locale] || BOUNDARY_COPY[localeKey(locale)] || BOUNDARY_COPY.en;
  if (registry?.sources?.length) return copy.linked(registry.authority || "official", reviewedAt);
  return copy.pending;
}

export function regionalQuestionNextSteps({ gate = {}, registry = {}, locale = "en", product = "unknown" } = {}) {
  const copy = NEXT_STEP_COPY[locale] || NEXT_STEP_COPY[localeKey(locale)] || NEXT_STEP_COPY.en;
  const terms = termsFor(locale);
  const payment = joinList(gate.paymentModes, terms.fallbackPayment || "the displayed funding path");
  const currency = joinList(gate.accountCurrency, terms.fallbackCurrency || "the account currency shown");
  const kyc = gate.requiresKyc ? (terms.kycRequired || "KYC / identity verification") : (terms.accountChecks || "the account checks shown");
  const source = registry?.sources?.length ? (registry.authority || "official sources") : (terms.fallbackSource || "the official platform flow");
  const productLabel = product === "unknown" ? (terms.unknownProduct || "spot or the intended product") : (terms[`${product}Product`] || product);
  return [copy.kyc(kyc, source), copy.payment(payment, currency), copy.product(productLabel, source)];
}
