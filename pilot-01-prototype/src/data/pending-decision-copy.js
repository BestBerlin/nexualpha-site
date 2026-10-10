// Copy for a venue whose editorial decision has not been source-reviewed yet. One owner for the profile cards
// (VenueDecisionArticles) and the comparison rows (V3Pages DecisionComparisonValue); QA 2026-10-10 found these
// rendering English on 12 locales and Simplified Chinese on zh-Hant.
const PENDING = {
  en: { status: "Source review status", fit: "Verify public products, regional eligibility and official fees first", why: "Only source-linked facts with a review date are publishable", avoid: "Regional restrictions, account eligibility and campaign terms need official verification" },
  "zh-Hans": { status: "来源复核状态", fit: "公开产品、地区资格与官方费率待逐项核对", why: "仅展示有来源和复核日期的事实", avoid: "地区限制、账户资格与活动条件待官方核验" },
  "zh-Hant": { status: "來源複核狀態", fit: "公開產品、地區資格與官方費率待逐項核對", why: "僅展示有來源和複核日期的事實", avoid: "地區限制、帳戶資格與活動條件待官方核驗" },
  ja: { status: "出典の確認状況", fit: "公開商品、地域の適格性、公式手数料を先に確認してください", why: "出典と確認日のある事実だけを掲載します", avoid: "地域制限、口座の適格性、キャンペーン条件は公式確認が必要です" },
  ko: { status: "출처 검토 상태", fit: "공개 상품, 지역 자격, 공식 수수료를 먼저 확인하세요", why: "출처와 검토일이 있는 사실만 게시합니다", avoid: "지역 제한, 계정 자격, 캠페인 조건은 공식 확인이 필요합니다" },
  tr: { status: "Kaynak inceleme durumu", fit: "Önce herkese açık ürünleri, bölgesel uygunluğu ve resmî ücretleri doğrulayın", why: "Yalnızca kaynağı ve inceleme tarihi olan bilgiler yayımlanır", avoid: "Bölgesel kısıtlamalar, hesap uygunluğu ve kampanya koşulları resmî doğrulama gerektirir" },
  es: { status: "Estado de revisión de fuentes", fit: "Verifica primero los productos públicos, la elegibilidad regional y las comisiones oficiales", why: "Solo se publican datos con fuente y fecha de revisión", avoid: "Las restricciones regionales, la elegibilidad de la cuenta y las condiciones de campañas requieren verificación oficial" },
  "pt-BR": { status: "Status da revisão de fontes", fit: "Confira primeiro os produtos públicos, a elegibilidade regional e as taxas oficiais", why: "Só publicamos fatos com fonte e data de revisão", avoid: "Restrições regionais, elegibilidade da conta e condições de campanhas exigem verificação oficial" },
  fr: { status: "Statut de vérification des sources", fit: "Vérifiez d’abord les produits publics, l’éligibilité régionale et les frais officiels", why: "Seuls les faits sourcés et datés sont publiés", avoid: "Restrictions régionales, éligibilité du compte et conditions des campagnes à vérifier auprès de la source officielle" },
  de: { status: "Status der Quellenprüfung", fit: "Prüfen Sie zuerst öffentliche Produkte, regionale Zulassung und offizielle Gebühren", why: "Veröffentlicht werden nur Fakten mit Quelle und Prüfdatum", avoid: "Regionale Einschränkungen, Kontozulassung und Aktionsbedingungen erfordern eine offizielle Prüfung" },
  ru: { status: "Статус проверки источников", fit: "Сначала проверьте публичные продукты, доступность в регионе и официальные комиссии", why: "Публикуются только факты с источником и датой проверки", avoid: "Региональные ограничения, допуск аккаунта и условия акций требуют официальной проверки" },
  ar: { status: "حالة مراجعة المصدر", fit: "تحقق أولاً من المنتجات العامة والأهلية الإقليمية والرسوم الرسمية", why: "لا تُنشر إلا الحقائق ذات المصدر وتاريخ المراجعة", avoid: "القيود الإقليمية وأهلية الحساب وشروط الحملات تحتاج إلى تحقق رسمي" },
  id: { status: "Status tinjauan sumber", fit: "Cek dulu produk publik, kelayakan wilayah, dan biaya resmi", why: "Hanya fakta dengan sumber dan tanggal tinjauan yang dipublikasikan", avoid: "Pembatasan wilayah, kelayakan akun, dan syarat kampanye perlu verifikasi resmi" },
  vi: { status: "Trạng thái xem xét nguồn", fit: "Hãy kiểm tra trước sản phẩm công khai, điều kiện khu vực và phí chính thức", why: "Chỉ đăng các dữ kiện có nguồn và ngày xem xét", avoid: "Hạn chế khu vực, điều kiện tài khoản và điều khoản khuyến mãi cần xác minh chính thức" },
  it: { status: "Stato della verifica delle fonti", fit: "Verifica prima prodotti pubblici, idoneità regionale e commissioni ufficiali", why: "Pubblichiamo solo fatti con fonte e data di revisione", avoid: "Restrizioni regionali, idoneità dell’account e condizioni delle campagne richiedono verifica ufficiale" },
};

export function pendingDecisionCopy(locale = "en") {
  const value = String(locale || "en");
  if (PENDING[value]) return PENDING[value];
  if (/^zh-(hant|tw|hk)/i.test(value)) return PENDING["zh-Hant"];
  if (/^zh/i.test(value)) return PENDING["zh-Hans"];
  if (/^pt/i.test(value)) return PENDING["pt-BR"];
  return PENDING[value.split("-")[0]] || PENDING.en;
}
