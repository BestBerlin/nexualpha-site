const normalizeCompareFaqLocale = (locale = "en") => {
  const value = String(locale || "en");
  if (value === "zh-Hant" || value === "zh-TW") return "zh-Hant";
  if (value.startsWith("zh")) return "zh-Hans";
  if (value.toLowerCase() === "pt-br") return "pt-BR";
  const base = value.split("-")[0];
  return COMPARE_FAQ_LOCALES[base] ? base : "en";
};

const applyTemplate = (template, vars) => String(template || "").replace(/\{(\w+)\}/g, (_, key) => vars?.[key] ?? "");
const entries = (rows) => rows.map(([q, a]) => ({ q, a }));

export const COMPARE_FAQ_LOCALES = {
  en: {
    stickyAria: "Compare registration options",
    badge: "COMPARE",
    eyebrow: "FAQ & decision checks",
    title: "{nameA} vs {nameB}: fees, product access and account checks",
    lead: "Use these questions before opening either official registration route.",
    more: (count) => (count === 1 ? "Show 1 more question" : `Show ${count} more questions`),
    fewer: "Show fewer questions",
    rows: entries([
      ["Which fees should I compare first?", "Check the published spot and futures fee rows, account tier and source date. Final fees can still vary by product, region, account level and the official account screen."],
      ["Is the product scope the same on both platforms?", "No. Compare spot, derivatives, copy trading and any stock-like exposure separately. Do not treat one product label as proof of availability on the other platform."],
      ["What should I verify about KYC and local funding?", "Confirm identity level, residence, local deposit and withdrawal rails, fiat support and product permissions in the official account flow before funding the account."],
      ["When should I use the registration link?", "Use it only after checking the official domain, current terms and the product you need. A partner route does not guarantee approval, bonus eligibility or final net cost."],
    ]),
  },
  "zh-Hans": {
    stickyAria: "比较开户注册选项",
    badge: "对比",
    eyebrow: "FAQ 与决策核对",
    title: "{nameA} vs {nameB}：费用、产品权限与账户核对",
    lead: "进入任一官方注册路径前，先用这些问题完成最后核对。",
    more: (count) => `查看其余 ${count} 个问题`,
    fewer: "收起其余问题",
    rows: entries([
      ["应该先比较哪些费用？", "先看本页已审核的现货、合约费率行、账户等级和来源日期；最终费用仍可能因产品、地区、账户等级和官方账户页面而变化。"],
      ["两家平台的产品范围一样吗？", "不一样。现货、衍生品、跟单和股票类敞口要分开看；不能用一个产品名称推断另一家平台一定可用。"],
      ["KYC 和本地入出金要核对什么？", "在入金前确认身份等级、居住地区、本地入金与提现通道、法币支持和产品权限，最终以官方账户流程为准。"],
      ["什么时候才适合点开户注册链接？", "确认官方域名、当前条款和所需产品后再打开。合作路径不保证开户通过、奖励资格或最终净成本。"],
    ]),
  },
  "zh-Hant": {
    stickyAria: "比較開戶註冊選項",
    badge: "比較",
    eyebrow: "FAQ 與決策核對",
    title: "{nameA} vs {nameB}：費用、產品權限與帳戶核對",
    lead: "進入任一官方註冊路徑前，先用這些問題完成最後核對。",
    more: (count) => `查看其餘 ${count} 個問題`,
    fewer: "收起其餘問題",
    rows: entries([
      ["應該先比較哪些費用？", "先看本頁已審核的現貨、合約費率列、帳戶等級和來源日期；最終費用仍可能因產品、地區、帳戶等級和官方帳戶頁面而變化。"],
      ["兩家平台的產品範圍一樣嗎？", "不一樣。現貨、衍生品、跟單和股票類敞口要分開看；不能用一個產品名稱推斷另一家平台一定可用。"],
      ["KYC 和本地入出金要核對什麼？", "入金前確認身份等級、居住地區、本地入金與提現通道、法幣支援和產品權限，最終以官方帳戶流程為準。"],
      ["什麼時候才適合點開戶註冊連結？", "確認官方網域、目前條款和所需產品後再打開。合作路徑不保證開戶通過、獎勵資格或最終淨成本。"],
    ]),
  },
  es: {
    stickyAria: "Comparar opciones de registro",
    badge: "COMPARAR",
    eyebrow: "FAQ y comprobaciones de decisión",
    title: "{nameA} vs {nameB}: comisiones, productos y cuenta",
    lead: "Revisa estas preguntas antes de abrir cualquier ruta oficial de registro.",
    more: (count) => (count === 1 ? "Ver 1 pregunta más" : `Ver ${count} preguntas más`),
    fewer: "Mostrar menos preguntas",
    rows: entries([
      ["¿Qué comisiones conviene comparar primero?", "Revisa las filas de comisiones spot y futures con fuente, el nivel de cuenta y la fecha de revisión. La comisión final puede variar por producto, región, nivel de cuenta y pantalla oficial."],
      ["¿El alcance de productos es igual en ambas plataformas?", "No. Separa spot, derivados, copy trading y exposición tipo acciones. Un nombre de producto no prueba disponibilidad en la otra plataforma."],
      ["¿Qué debo comprobar sobre KYC y fondeo local?", "Confirma nivel de identidad, residencia, depósitos y retiros locales, soporte fiat y permisos de producto dentro del flujo oficial antes de fondear."],
      ["¿Cuándo usar el enlace de registro?", "Úsalo después de comprobar dominio oficial, términos actuales y producto necesario. Una ruta de socio no garantiza aprobación, bonus ni coste neto final."],
    ]),
  },
  "pt-BR": {
    stickyAria: "Comparar opções de cadastro",
    badge: "COMPARAR",
    eyebrow: "FAQ e verificações de decisão",
    title: "{nameA} vs {nameB}: taxas, produtos e conta",
    lead: "Revise estas perguntas antes de abrir qualquer rota oficial de cadastro.",
    more: (count) => (count === 1 ? "Ver mais 1 pergunta" : `Ver mais ${count} perguntas`),
    fewer: "Mostrar menos perguntas",
    rows: entries([
      ["Quais taxas devo comparar primeiro?", "Confira as linhas de taxa spot e futures com fonte, o nível da conta e a data de revisão. A taxa final pode variar por produto, região, nível da conta e tela oficial."],
      ["O escopo de produtos é igual nas duas plataformas?", "Não. Separe spot, derivativos, copy trading e exposição parecida com ações. Um nome de produto não prova disponibilidade na outra plataforma."],
      ["O que revisar sobre KYC e entrada ou saída local?", "Confirme identidade, residência, depósito e saque locais, suporte fiat e permissões de produto no fluxo oficial antes de enviar fundos."],
      ["Quando usar o link de cadastro?", "Use depois de conferir domínio oficial, termos atuais e produto necessário. Uma rota de parceiro não garante aprovação, bônus nem custo líquido final."],
    ]),
  },
  fr: {
    stickyAria: "Comparer les options d’inscription",
    badge: "COMPARER",
    eyebrow: "FAQ et contrôles de décision",
    title: "{nameA} vs {nameB} : frais, produits et compte",
    lead: "Vérifiez ces points avant d’ouvrir une route officielle d’inscription.",
    more: (count) => (count === 1 ? "Afficher 1 question de plus" : `Afficher ${count} questions de plus`),
    fewer: "Afficher moins de questions",
    rows: entries([
      ["Quels frais comparer en premier ?", "Vérifiez les lignes de frais spot et futures sourcées, le niveau de compte et la date de revue. Le coût final peut varier selon produit, région, compte et écran officiel."],
      ["Les produits disponibles sont-ils les mêmes ?", "Non. Séparez spot, dérivés, copy trading et exposition de type action. Un nom de produit ne prouve pas l’accès sur l’autre plateforme."],
      ["Que vérifier pour le KYC et les rails locaux ?", "Confirmez identité, résidence, dépôts et retraits locaux, fiat et permissions produit dans le parcours officiel avant d’envoyer des fonds."],
      ["Quand utiliser le lien d’inscription ?", "Après avoir vérifié domaine officiel, conditions actuelles et produit voulu. Une route partenaire ne garantit ni approbation, ni bonus, ni coût net final."],
    ]),
  },
  de: {
    stickyAria: "Registrierungsoptionen vergleichen",
    badge: "VERGLEICH",
    eyebrow: "FAQ und Entscheidungsprüfung",
    title: "{nameA} vs {nameB}: Gebühren, Produkte und Konto",
    lead: "Prüfen Sie diese Punkte, bevor Sie eine offizielle Registrierung öffnen.",
    more: (count) => (count === 1 ? "1 weitere Frage anzeigen" : `${count} weitere Fragen anzeigen`),
    fewer: "Weniger Fragen anzeigen",
    rows: entries([
      ["Welche Gebühren sollte ich zuerst vergleichen?", "Prüfen Sie belegte Spot- und Futures-Gebühren, Kontostufe und Prüftermin. Endgültige Gebühren können nach Produkt, Region, Konto und offizieller Ansicht abweichen."],
      ["Ist der Produktumfang gleich?", "Nein. Spot, Derivate, Copy Trading und aktienähnliche Exposures getrennt prüfen. Ein Produktname beweist keine Verfügbarkeit bei der anderen Plattform."],
      ["Was ist bei KYC und lokalen Zahlungswegen zu prüfen?", "Identität, Wohnsitz, lokale Ein- und Auszahlungen, Fiat-Unterstützung und Produktrechte im offiziellen Kontofluss prüfen, bevor Geld eingeht."],
      ["Wann sollte ich den Registrierungslink nutzen?", "Erst nach Prüfung von offizieller Domain, aktuellen Bedingungen und benötigtem Produkt. Ein Partnerweg garantiert keine Freigabe, Boni oder Nettokosten."],
    ]),
  },
  ja: {
    stickyAria: "登録先の選択肢を比較",
    badge: "比較",
    eyebrow: "FAQ と判断チェック",
    title: "{nameA} vs {nameB}: 手数料、商品、口座条件",
    lead: "公式登録ルートを開く前に、この4点を確認してください。",
    more: (count) => `残り ${count} 件の質問を表示`,
    fewer: "質問を少なく表示",
    rows: entries([
      ["最初に比較すべき手数料は？", "出典付きの現物・先物手数料、口座ティア、確認日を見ます。最終手数料は商品、地域、口座条件、公式画面で変わる場合があります。"],
      ["両社の商品範囲は同じですか？", "同じとは限りません。現物、デリバティブ、コピー取引、株式型エクスポージャーは分けて確認します。商品名だけで利用可否は判断できません。"],
      ["KYC と地域の入出金で何を見るべきですか？", "本人確認レベル、居住地域、現地の入金・出金手段、法定通貨対応、商品権限を公式フローで確認してから入金します。"],
      ["登録リンクはいつ使うべきですか？", "公式ドメイン、現在の条件、必要な商品を確認してから使います。提携ルートは承認、特典、最終コストを保証しません。"],
    ]),
  },
  ko: {
    stickyAria: "가입 경로 비교",
    badge: "비교",
    eyebrow: "FAQ 및 결정 체크",
    title: "{nameA} vs {nameB}: 수수료, 상품, 계정 조건",
    lead: "공식 가입 경로를 열기 전에 아래 항목을 확인하세요.",
    more: (count) => `질문 ${count}개 더 보기`,
    fewer: "질문 간단히 보기",
    rows: entries([
      ["먼저 어떤 수수료를 비교해야 하나요?", "출처가 있는 현물·선물 수수료, 계정 등급과 검토일을 확인하세요. 최종 수수료는 상품, 지역, 계정 조건, 공식 화면에 따라 달라질 수 있습니다."],
      ["두 플랫폼의 상품 범위가 같나요?", "아닙니다. 현물, 파생상품, 카피트레이딩, 주식형 노출은 분리해서 봐야 합니다. 상품명만으로 다른 플랫폼의 이용 가능성을 판단할 수 없습니다."],
      ["KYC와 현지 입출금은 무엇을 확인해야 하나요?", "입금 전 신원확인 수준, 거주 지역, 현지 입금·출금 경로, 법정화폐 지원과 상품 권한을 공식 계정 흐름에서 확인하세요."],
      ["가입 링크는 언제 사용해야 하나요?", "공식 도메인, 현재 조건, 필요한 상품을 확인한 뒤 사용하세요. 파트너 경로는 승인, 보너스 자격, 최종 순비용을 보장하지 않습니다."],
    ]),
  },
  ar: {
    stickyAria: "مقارنة خيارات التسجيل",
    badge: "مقارنة",
    eyebrow: "أسئلة وفحوص قرار",
    title: "{nameA} مقابل {nameB}: الرسوم والمنتجات والحساب",
    lead: "راجع هذه النقاط قبل فتح أي مسار تسجيل رسمي.",
    more: (count) => (count === 1 ? "عرض سؤال إضافي واحد" : `عرض ${count} أسئلة إضافية`),
    fewer: "عرض أسئلة أقل",
    rows: entries([
      ["أي رسوم يجب مقارنتها أولاً؟", "راجع رسوم السبوت والعقود الآجلة ذات المصدر، مستوى الحساب وتاريخ المراجعة. قد تختلف الرسوم النهائية حسب المنتج والمنطقة والحساب والشاشة الرسمية."],
      ["هل نطاق المنتجات متماثل؟", "لا. افصل بين السبوت والمشتقات ونسخ التداول والتعرض الشبيه بالأسهم. اسم المنتج لا يثبت توفره في المنصة الأخرى."],
      ["ما الذي يجب فحصه في KYC والتمويل المحلي؟", "أكد مستوى الهوية والإقامة ومسارات الإيداع والسحب المحلية ودعم fiat وصلاحيات المنتج داخل المسار الرسمي قبل التمويل."],
      ["متى أستخدم رابط التسجيل؟", "استخدمه بعد فحص النطاق الرسمي والشروط الحالية والمنتج المطلوب. مسار الشريك لا يضمن الموافقة أو المكافأة أو التكلفة الصافية."],
    ]),
  },
  tr: {
    stickyAria: "Kayıt seçeneklerini karşılaştır",
    badge: "KARŞILAŞTIR",
    eyebrow: "SSS ve karar kontrolleri",
    title: "{nameA} vs {nameB}: ücretler, ürünler ve hesap",
    lead: "Herhangi bir resmî kayıt yolunu açmadan önce bu soruları kontrol edin.",
    more: (count) => `${count} soru daha göster`,
    fewer: "Daha az soru göster",
    rows: entries([
      ["Önce hangi ücretleri karşılaştırmalıyım?", "Kaynaklı spot ve futures ücret satırlarını, hesap seviyesini ve inceleme tarihini kontrol edin. Nihai ücret ürün, bölge, hesap seviyesi ve resmî ekrana göre değişebilir."],
      ["Ürün kapsamı iki platformda aynı mı?", "Hayır. Spot, türevler, copy trading ve hisse benzeri maruziyet ayrı okunmalı. Tek bir ürün adı diğer platformda erişim kanıtı değildir."],
      ["KYC ve yerel para giriş çıkışı için neye bakmalıyım?", "Fon göndermeden önce kimlik seviyesi, ikamet, yerel yatırma-çekme yolları, fiat desteği ve ürün izinlerini resmî hesap akışında doğrulayın."],
      ["Kayıt bağlantısını ne zaman kullanmalıyım?", "Resmî alan adını, güncel şartları ve gereken ürünü kontrol ettikten sonra kullanın. Partner yolu onay, bonus veya net maliyet garantisi vermez."],
    ]),
  },
  ru: {
    stickyAria: "Сравнить варианты регистрации",
    badge: "СРАВНИТЬ",
    eyebrow: "FAQ и проверки перед выбором",
    title: "{nameA} vs {nameB}: комиссии, продукты и аккаунт",
    lead: "Проверьте эти пункты перед открытием официального пути регистрации.",
    more: (count) => (count === 1 ? "Показать ещё 1 вопрос" : `Показать ещё ${count} вопроса`),
    fewer: "Показать меньше вопросов",
    rows: entries([
      ["Какие комиссии сравнить сначала?", "Проверьте строки спота и фьючерсов с источником, уровень аккаунта и дату проверки. Итоговая комиссия зависит от продукта, региона, аккаунта и официального экрана."],
      ["Одинаковый ли набор продуктов?", "Нет. Спот, деривативы, копитрейдинг и экспозиции к акциям нужно разделять. Название продукта не доказывает доступность на другой платформе."],
      ["Что проверить по KYC и местным вводам или выводам?", "До пополнения проверьте уровень личности, резидентство, местные вводы и выводы, fiat-поддержку и доступ к продукту в официальном аккаунте."],
      ["Когда использовать ссылку регистрации?", "После проверки официального домена, текущих условий и нужного продукта. Партнёрский путь не гарантирует одобрение, бонус или итоговую стоимость."],
    ]),
  },
  id: {
    stickyAria: "Bandingkan opsi pendaftaran",
    badge: "BANDINGKAN",
    eyebrow: "FAQ dan cek keputusan",
    title: "{nameA} vs {nameB}: biaya, produk, dan akun",
    lead: "Periksa poin ini sebelum membuka rute pendaftaran resmi.",
    more: (count) => `Lihat ${count} pertanyaan lagi`,
    fewer: "Tampilkan lebih sedikit",
    rows: entries([
      ["Biaya apa yang perlu dibandingkan dulu?", "Periksa biaya spot dan futures bersumber, level akun, dan tanggal tinjauan. Biaya akhir dapat berubah menurut produk, wilayah, level akun, dan layar resmi."],
      ["Apakah cakupan produk sama?", "Tidak. Spot, derivatif, copy trading, dan eksposur mirip saham perlu dipisahkan. Nama produk tidak membuktikan ketersediaan di platform lain."],
      ["Apa yang dicek untuk KYC dan dana lokal?", "Konfirmasi level identitas, domisili, jalur deposit dan penarikan lokal, dukungan fiat, serta izin produk di alur akun resmi sebelum mengirim dana."],
      ["Kapan memakai link pendaftaran?", "Gunakan setelah memeriksa domain resmi, syarat terbaru, dan produk yang dibutuhkan. Rute partner tidak menjamin persetujuan, bonus, atau biaya bersih akhir."],
    ]),
  },
  vi: {
    stickyAria: "So sánh lựa chọn đăng ký",
    badge: "SO SÁNH",
    eyebrow: "FAQ và kiểm tra quyết định",
    title: "{nameA} vs {nameB}: phí, sản phẩm và tài khoản",
    lead: "Hãy kiểm tra các điểm này trước khi mở đường đăng ký chính thức.",
    more: (count) => `Xem thêm ${count} câu hỏi`,
    fewer: "Hiển thị ít câu hỏi hơn",
    rows: entries([
      ["Nên so sánh phí nào trước?", "Kiểm tra phí spot và futures có nguồn, cấp tài khoản và ngày rà soát. Phí cuối cùng có thể đổi theo sản phẩm, khu vực, cấp tài khoản và màn hình chính thức."],
      ["Phạm vi sản phẩm có giống nhau không?", "Không. Spot, phái sinh, copy trading và tiếp xúc giống cổ phiếu phải tách riêng. Tên sản phẩm không chứng minh khả dụng trên nền tảng kia."],
      ["Cần kiểm tra gì về KYC và nạp rút địa phương?", "Xác nhận cấp danh tính, nơi cư trú, kênh nạp rút địa phương, hỗ trợ fiat và quyền sản phẩm trong luồng tài khoản chính thức trước khi nạp tiền."],
      ["Khi nào dùng link đăng ký?", "Dùng sau khi kiểm tra tên miền chính thức, điều khoản hiện tại và sản phẩm cần dùng. Đường đối tác không đảm bảo phê duyệt, bonus hay chi phí ròng."],
    ]),
  },
  it: {
    stickyAria: "Confronta opzioni di registrazione",
    badge: "CONFRONTA",
    eyebrow: "FAQ e controlli decisionali",
    title: "{nameA} vs {nameB}: commissioni, prodotti e account",
    lead: "Verifica questi punti prima di aprire un percorso ufficiale di registrazione.",
    more: (count) => (count === 1 ? "Mostra un'altra domanda" : `Mostra altre ${count} domande`),
    fewer: "Mostra meno domande",
    rows: entries([
      ["Quali commissioni confronto per prime?", "Controlla righe spot e futures con fonte, livello account e data di revisione. Il costo finale può variare per prodotto, regione, livello account e schermata ufficiale."],
      ["La gamma prodotti è uguale?", "No. Spot, derivati, copy trading ed esposizioni simili ad azioni vanno separati. Un nome prodotto non prova disponibilità sull’altra piattaforma."],
      ["Cosa verificare su KYC e movimenti locali?", "Conferma identità, residenza, depositi e prelievi locali, supporto fiat e permessi prodotto nel flusso ufficiale prima di inviare fondi."],
      ["Quando usare il link di registrazione?", "Dopo aver verificato dominio ufficiale, termini attuali e prodotto necessario. Un percorso partner non garantisce approvazione, bonus o costo netto finale."],
    ]),
  },
};

export function compareFaqLocaleCopy(locale = "en") {
  return COMPARE_FAQ_LOCALES[normalizeCompareFaqLocale(locale)] || COMPARE_FAQ_LOCALES.en;
}

export function compareFaqEntries(locale = "en", vars = {}) {
  const copy = compareFaqLocaleCopy(locale);
  return copy.rows.map(({ q, a }) => ({ q: applyTemplate(q, vars), a: applyTemplate(a, vars) }));
}

export function compareFaqSchemaEntries(locale = "en", vars = {}) {
  return compareFaqEntries(locale, vars).map(({ q, a }) => [q, a]);
}

export function compareFaqText(locale = "en", key, vars = {}) {
  const copy = compareFaqLocaleCopy(locale);
  const value = copy[key];
  if (typeof value === "function") return value(vars.count ?? 0);
  return applyTemplate(value, vars);
}

export function compareFaqBadge(locale = "en") {
  return compareFaqLocaleCopy(locale).badge;
}

export function compareStickyAria(locale = "en") {
  return compareFaqLocaleCopy(locale).stickyAria;
}

export { normalizeCompareFaqLocale };
