// All 15 locales for the V6 "Verify before you leave" band.
const k = (title, lead, venue, s1t, s1d, s1ok, s2t, s2d, none, copy, copied, s3t, s3b, s3link) =>
  ({ title, lead, venue, s1t, s1d, s1ok, s2t, s2d, none, copy, copied, s3t, s3b, s3link });

export const verifyCopy = {
  en: k("Verify before you leave", "Three checks that stop lookalike sites and surprise terms. Each uses the record we keep for this venue.", "Venue to verify",
    "Official domain", "Your address bar must show exactly this domain before you enter anything.", "In our reviewed record",
    "Referral code", "If the signup page does not prefill it, enter it before you submit.", "No code needed for this venue", "Copy code", "Copied",
    "Disclosure", "We may earn a commission when you sign up through our links, at no extra cost to you. Any benefit follows the platform's own terms.", "Read the affiliate disclosure"),
  "zh-Hans": k("离开前先核验", "三步核对，避开仿冒网站与意外条款。每一步都对应我们为该平台留存的记录。", "选择要核验的平台",
    "官方域名", "输入任何信息之前，请确认地址栏显示的域名与此完全一致。", "与我们已审核的记录一致",
    "邀请码", "若注册页未自动带入，请在提交前手动填写。", "该平台无需邀请码", "复制邀请码", "已复制",
    "披露", "通过本站链接注册，我们可能获得佣金，您无需额外付费。任何优惠均以平台自身条款为准。", "查看联盟披露说明"),
  "zh-Hant": k("離開前先核驗", "三步核對，避開仿冒網站與意外條款。每一步都對應我們為該平台留存的紀錄。", "選擇要核驗的平台",
    "官方網域", "輸入任何資料之前，請確認網址列顯示的網域與此完全一致。", "與我們已審核的紀錄一致",
    "邀請碼", "若註冊頁未自動帶入，請在提交前手動填寫。", "該平台無需邀請碼", "複製邀請碼", "已複製",
    "披露", "透過本站連結註冊，我們可能獲得佣金，您無需額外付費。任何優惠均以平台自身條款為準。", "查看聯盟披露說明"),
  ja: k("離れる前に確認", "偽サイトや想定外の条件を避ける3つの確認です。各項目は、このプラットフォームについて当サイトが保管する記録に基づきます。", "確認するプラットフォーム",
    "公式ドメイン", "何かを入力する前に、アドレスバーがこのドメインと完全に一致していることを確認してください。", "確認済みの記録に掲載",
    "紹介コード", "登録ページに自動入力されない場合は、送信前に入力してください。", "このプラットフォームではコード不要", "コードをコピー", "コピーしました",
    "開示", "当サイトのリンクから登録すると、追加費用なしで報酬を受け取る場合があります。特典はプラットフォーム自身の規約に従います。", "アフィリエイト開示を読む"),
  ko: k("떠나기 전에 확인", "가짜 사이트와 예상 밖의 약관을 막는 세 가지 확인입니다. 각 단계는 이 거래소에 대해 보관 중인 기록을 따릅니다.", "확인할 거래소",
    "공식 도메인", "무엇이든 입력하기 전에 주소창이 이 도메인과 정확히 일치하는지 확인하세요.", "검토된 기록에 있음",
    "추천 코드", "가입 페이지에 자동 입력되지 않으면 제출 전에 직접 입력하세요.", "이 거래소는 코드가 필요 없음", "코드 복사", "복사됨",
    "고지", "당사 링크로 가입하시면 추가 비용 없이 수수료를 받을 수 있습니다. 혜택은 플랫폼 자체 약관을 따릅니다.", "제휴 고지 읽기"),
  tr: k("Ayrılmadan önce doğrulayın", "Taklit sitelerin ve sürpriz koşulların önüne geçen üç kontrol. Her adım, bu platform için tuttuğumuz kayda dayanır.", "Doğrulanacak platform",
    "Resmi alan adı", "Herhangi bir şey girmeden önce adres çubuğu tam olarak bu alan adını göstermeli.", "İncelenmiş kayıtlarımızda",
    "Referans kodu", "Kayıt sayfası otomatik doldurmazsa göndermeden önce girin.", "Bu platform için kod gerekmez", "Kodu kopyala", "Kopyalandı",
    "Açıklama", "Bağlantılarımızla kaydolursanız size ek ücret olmadan komisyon kazanabiliriz. Avantajlar platformun kendi koşullarına tabidir.", "İş ortaklığı açıklamasını oku"),
  fr: k("Vérifiez avant de partir", "Trois contrôles contre les faux sites et les conditions surprises. Chacun s'appuie sur la fiche que nous tenons pour cette plateforme.", "Plateforme à vérifier",
    "Domaine officiel", "Avant de saisir quoi que ce soit, la barre d'adresse doit afficher exactement ce domaine.", "Dans notre fiche vérifiée",
    "Code de parrainage", "Si la page d'inscription ne le préremplit pas, saisissez-le avant de valider.", "Aucun code requis pour cette plateforme", "Copier le code", "Copié",
    "Divulgation", "Nous pouvons percevoir une commission si vous vous inscrivez via nos liens, sans frais supplémentaires pour vous. Tout avantage suit les conditions de la plateforme.", "Lire la divulgation d'affiliation"),
  de: k("Prüfen, bevor Sie gehen", "Drei Prüfungen gegen Fake-Seiten und überraschende Bedingungen. Jede stützt sich auf unseren Eintrag zu dieser Plattform.", "Zu prüfende Plattform",
    "Offizielle Domain", "Bevor Sie etwas eingeben, muss die Adressleiste genau diese Domain zeigen.", "In unserem geprüften Eintrag",
    "Empfehlungscode", "Wird er auf der Anmeldeseite nicht vorausgefüllt, tragen Sie ihn vor dem Absenden ein.", "Für diese Plattform ist kein Code nötig", "Code kopieren", "Kopiert",
    "Offenlegung", "Wir erhalten möglicherweise eine Provision, wenn Sie sich über unsere Links anmelden, ohne Mehrkosten für Sie. Vorteile richten sich nach den Bedingungen der Plattform.", "Affiliate-Offenlegung lesen"),
  es: k("Verifica antes de irte", "Tres comprobaciones contra sitios falsos y condiciones inesperadas. Cada una usa el registro que mantenemos de esta plataforma.", "Plataforma a verificar",
    "Dominio oficial", "Antes de introducir nada, la barra de direcciones debe mostrar exactamente este dominio.", "En nuestro registro revisado",
    "Código de referido", "Si la página de registro no lo rellena, introdúcelo antes de enviar.", "Esta plataforma no necesita código", "Copiar código", "Copiado",
    "Divulgación", "Podemos ganar una comisión si te registras con nuestros enlaces, sin coste adicional para ti. Cualquier beneficio sigue los términos de la plataforma.", "Leer la divulgación de afiliados"),
  "pt-BR": k("Verifique antes de sair", "Três verificações contra sites falsos e condições inesperadas. Cada uma usa o registro que mantemos desta plataforma.", "Plataforma a verificar",
    "Domínio oficial", "Antes de digitar qualquer coisa, a barra de endereço deve mostrar exatamente este domínio.", "No nosso registro revisado",
    "Código de indicação", "Se a página de cadastro não o preencher, informe-o antes de enviar.", "Esta plataforma não exige código", "Copiar código", "Copiado",
    "Divulgação", "Podemos receber uma comissão se você se cadastrar pelos nossos links, sem custo extra para você. Qualquer benefício segue os termos da plataforma.", "Ler a divulgação de afiliados"),
  ru: k("Проверьте перед уходом", "Три проверки против поддельных сайтов и неожиданных условий. Каждая опирается на запись, которую мы ведём по этой платформе.", "Платформа для проверки",
    "Официальный домен", "Прежде чем что-либо вводить, адресная строка должна показывать именно этот домен.", "В нашей проверенной записи",
    "Реферальный код", "Если страница регистрации не подставила его, введите перед отправкой.", "Для этой платформы код не нужен", "Скопировать код", "Скопировано",
    "Раскрытие", "Мы можем получить комиссию, если вы зарегистрируетесь по нашим ссылкам, без доплаты с вашей стороны. Любые бонусы определяются условиями платформы.", "Прочитать раскрытие партнёрства"),
  ar: k("تحقق قبل أن تغادر", "ثلاث فحوصات تحميك من المواقع المقلّدة والشروط المفاجئة. تعتمد كل خطوة على السجل الذي نحتفظ به لهذه المنصة.", "المنصة المراد التحقق منها",
    "النطاق الرسمي", "قبل إدخال أي شيء، يجب أن يعرض شريط العنوان هذا النطاق بالضبط.", "ضمن سجلنا المُراجَع",
    "رمز الإحالة", "إن لم تملأه صفحة التسجيل تلقائيًا فأدخله قبل الإرسال.", "لا حاجة إلى رمز في هذه المنصة", "نسخ الرمز", "تم النسخ",
    "الإفصاح", "قد نحصل على عمولة إذا سجّلت عبر روابطنا، دون أي تكلفة إضافية عليك. وتخضع أي مزايا لشروط المنصة نفسها.", "اقرأ إفصاح الشراكة"),
  id: k("Verifikasi sebelum pergi", "Tiga pemeriksaan untuk menghindari situs tiruan dan syarat tak terduga. Tiap langkah memakai catatan yang kami simpan untuk platform ini.", "Platform yang diverifikasi",
    "Domain resmi", "Sebelum memasukkan apa pun, bilah alamat harus menampilkan domain ini persis.", "Ada di catatan yang kami tinjau",
    "Kode referal", "Jika halaman pendaftaran tidak mengisinya, masukkan sebelum mengirim.", "Platform ini tidak butuh kode", "Salin kode", "Tersalin",
    "Pengungkapan", "Kami dapat memperoleh komisi bila Anda mendaftar lewat tautan kami, tanpa biaya tambahan bagi Anda. Manfaat mengikuti ketentuan platform.", "Baca pengungkapan afiliasi"),
  vi: k("Xác minh trước khi rời đi", "Ba bước kiểm tra chống trang giả mạo và điều khoản bất ngờ. Mỗi bước dựa trên hồ sơ chúng tôi lưu cho nền tảng này.", "Nền tảng cần xác minh",
    "Tên miền chính thức", "Trước khi nhập bất cứ gì, thanh địa chỉ phải hiện đúng tên miền này.", "Có trong hồ sơ đã rà soát",
    "Mã giới thiệu", "Nếu trang đăng ký không tự điền, hãy nhập trước khi gửi.", "Nền tảng này không cần mã", "Sao chép mã", "Đã sao chép",
    "Công bố", "Chúng tôi có thể nhận hoa hồng khi bạn đăng ký qua liên kết của chúng tôi, bạn không phải trả thêm phí. Mọi ưu đãi theo điều khoản của nền tảng.", "Đọc công bố liên kết đối tác"),
  it: k("Verifica prima di andare", "Tre controlli contro siti clone e condizioni a sorpresa. Ognuno usa la scheda che teniamo per questa piattaforma.", "Piattaforma da verificare",
    "Dominio ufficiale", "Prima di inserire qualsiasi cosa, la barra degli indirizzi deve mostrare esattamente questo dominio.", "Nella nostra scheda verificata",
    "Codice referral", "Se la pagina di registrazione non lo precompila, inseriscilo prima di inviare.", "Questa piattaforma non richiede codice", "Copia codice", "Copiato",
    "Informativa", "Potremmo ricevere una commissione se ti registri tramite i nostri link, senza costi aggiuntivi per te. Ogni vantaggio segue i termini della piattaforma.", "Leggi l'informativa affiliati"),
};

// The stamp that lands on the address bar once the domain matches our record.
const official = { en: "Official", "zh-Hans": "官方", "zh-Hant": "官方", ja: "公式", ko: "공식", tr: "Resmi", fr: "Officiel", de: "Offiziell", es: "Oficial", "pt-BR": "Oficial", ru: "Официальный", ar: "رسمي", id: "Resmi", vi: "Chính thức", it: "Ufficiale" };

export function getVerifyCopy(locale) {
  const l = locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale;
  const key = verifyCopy[l] ? l : verifyCopy[String(l || "").split("-")[0]] ? String(l).split("-")[0] : "en";
  return { ...verifyCopy[key], official: official[key] || official.en };
}
