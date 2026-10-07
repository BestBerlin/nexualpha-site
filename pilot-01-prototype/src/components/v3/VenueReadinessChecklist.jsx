import { useEffect, useMemo, useState } from "react";
import "./VenueReadinessChecklist.css";

const READINESS_ITEMS = [
  {
    id: "region",
    en: ["Region", "Official country, residency and account availability checked."],
    "zh-Hans": ["地区", "已核对官方地区、居住地与账户可用性。"],
    "zh-Hant": ["地區", "已核對官方地區、居住地與帳戶可用性。"],
    es: ["Región", "País oficial, residencia y disponibilidad de cuenta revisados."],
    "pt-BR": ["Região", "País oficial, residência e disponibilidade da conta revisados."],
    fr: ["Région", "Pays officiel, résidence et disponibilité du compte vérifiés."],
    de: ["Region", "Offizielles Land, Wohnsitz und Kontoverfügbarkeit geprüft."],
    ja: ["地域", "公式の国、居住地、口座利用可否を確認済み。"],
    ko: ["지역", "공식 국가, 거주지, 계정 이용 가능 여부를 확인했습니다."],
    ar: ["المنطقة", "تم فحص الدولة الرسمية والإقامة وإتاحة الحساب."],
    tr: ["Bölge", "Resmi ülke, ikamet ve hesap uygunluğu kontrol edildi."],
    ru: ["Регион", "Официальная страна, резидентство и доступность аккаунта проверены."],
    idLocale: ["Wilayah", "Negara resmi, domisili, dan ketersediaan akun sudah diperiksa."],
    vi: ["Khu vực", "Đã kiểm tra quốc gia chính thức, nơi cư trú và khả dụng tài khoản."],
    it: ["Regione", "Paese ufficiale, residenza e disponibilità account verificati."],
  },
  {
    id: "kyc",
    en: ["KYC", "Identity tier, document type and account limits checked."],
    "zh-Hans": ["KYC", "已核对身份等级、证件类型与账户限制。"],
    "zh-Hant": ["KYC", "已核對身分等級、證件類型與帳戶限制。"],
    es: ["KYC", "Nivel de identidad, tipo de documento y límites de cuenta revisados."],
    "pt-BR": ["KYC", "Nível de identidade, tipo de documento e limites da conta revisados."],
    fr: ["KYC", "Niveau d'identité, type de document et limites du compte vérifiés."],
    de: ["KYC", "Identitätsstufe, Dokumenttyp und Kontolimits geprüft."],
    ja: ["本人確認", "本人確認レベル、書類タイプ、口座制限を確認済み。"],
    ko: ["KYC", "신원 인증 단계, 문서 유형, 계정 한도를 확인했습니다."],
    ar: ["اعرف عميلك", "تم فحص مستوى الهوية ونوع المستند وحدود الحساب."],
    tr: ["KYC", "Kimlik seviyesi, belge türü ve hesap limitleri kontrol edildi."],
    ru: ["KYC", "Уровень идентификации, тип документа и лимиты аккаунта проверены."],
    idLocale: ["KYC", "Level identitas, jenis dokumen, dan batas akun sudah diperiksa."],
    vi: ["KYC", "Đã kiểm tra cấp xác minh, loại giấy tờ và giới hạn tài khoản."],
    it: ["KYC", "Livello identità, tipo di documento e limiti account verificati."],
  },
  {
    id: "funding",
    en: ["Funding", "Deposit route, fiat or chain, and waiting time checked."],
    "zh-Hans": ["入金", "已核对入金路径、法币或链路与等待时间。"],
    "zh-Hant": ["入金", "已核對入金路徑、法幣或鏈路與等待時間。"],
    es: ["Depósito", "Ruta de depósito, fiat o red, y tiempo de espera revisados."],
    "pt-BR": ["Depósito", "Rota de depósito, moeda fiat ou rede e prazo de espera revisados."],
    fr: ["Dépôt", "Parcours de dépôt, monnaie fiat ou réseau, et délai vérifiés."],
    de: ["Einzahlung", "Einzahlungsweg, Fiat oder Netzwerk und Wartezeit geprüft."],
    ja: ["入金", "入金ルート、法定通貨またはチェーン、待ち時間を確認済み。"],
    ko: ["입금", "입금 경로, 법정화폐 또는 체인, 대기 시간을 확인했습니다."],
    ar: ["التمويل", "تم فحص مسار الإيداع والعملات الورقية أو الشبكة ووقت الانتظار."],
    tr: ["Para yatırma", "Yatırma yolu, itibari para veya ağ ve bekleme süresi kontrol edildi."],
    ru: ["Пополнение", "Маршрут депозита, фиат или сеть, а также время ожидания проверены."],
    idLocale: ["Pendanaan", "Rute deposit, fiat atau jaringan, dan waktu tunggu sudah diperiksa."],
    vi: ["Nạp tiền", "Đã kiểm tra tuyến nạp, tiền pháp định hoặc mạng và thời gian chờ."],
    it: ["Deposito", "Percorso di deposito, fiat o rete, e tempi di attesa verificati."],
  },
  {
    id: "products",
    en: ["Products", "Spot, derivatives, wallet or regional product scope checked."],
    "zh-Hans": ["产品", "已核对现货、合约、钱包或地区产品范围。"],
    "zh-Hant": ["產品", "已核對現貨、合約、錢包或地區產品範圍。"],
    es: ["Productos", "Alcance de spot, derivados, wallet o productos regionales revisado."],
    "pt-BR": ["Produtos", "Escopo de spot, derivativos, carteira ou produtos regionais revisado."],
    fr: ["Produits", "Périmètre spot, dérivés, wallet ou produits régionaux vérifié."],
    de: ["Produkte", "Spot, Derivate, Wallet oder regionaler Produktumfang geprüft."],
    ja: ["商品", "現物、デリバティブ、ウォレット、地域別商品の範囲を確認済み。"],
    ko: ["상품", "현물, 파생상품, 지갑 또는 지역별 상품 범위를 확인했습니다."],
    ar: ["المنتجات", "تم فحص نطاق التداول الفوري والمشتقات والمحفظة أو المنتجات الإقليمية."],
    tr: ["Ürünler", "Spot, türev, cüzdan veya bölgesel ürün kapsamı kontrol edildi."],
    ru: ["Продукты", "Спот, деривативы, кошелек или региональный набор продуктов проверены."],
    idLocale: ["Produk", "Cakupan spot, derivatif, wallet, atau produk regional sudah diperiksa."],
    vi: ["Sản phẩm", "Đã kiểm tra phạm vi spot, phái sinh, ví hoặc sản phẩm theo khu vực."],
    it: ["Prodotti", "Ambito spot, derivati, wallet o prodotti regionali verificato."],
  },
];

const copyByLocale = {
  en: {
    eyebrow: "Account readiness",
    title: "Check before opening the official flow",
    body: "Use this private page state to mark the four checks that still depend on your region and official account screen.",
    open: "Open checklist",
    close: "Collapse checklist",
    pending: "Pending",
    checked: "Checked",
    progress: (done) => `${done}/4 checked`,
    reset: "Reset",
    restored: "Restored from this browser or URL",
    boundary: "This guide stores only checklist state. It does not store account, identity, funding or payout outcomes.",
  },
  "zh-Hans": {
    eyebrow: "开户准备",
    title: "进入官方流程前先核对",
    body: "用本页私有状态标记四项仍依赖地区和官方账户页面的检查。",
    open: "展开清单",
    close: "收起清单",
    pending: "待核对",
    checked: "已核对",
    progress: (done) => `已核对 ${done}/4`,
    reset: "重置",
    restored: "已从本浏览器或 URL 恢复",
    boundary: "这里只保存清单状态，不保存开户、身份、入金或收益结果。",
  },
  "zh-Hant": {
    eyebrow: "開戶準備",
    title: "進入官方流程前先核對",
    body: "用本頁私有狀態標記四項仍依賴地區和官方帳戶頁面的檢查。",
    open: "展開清單",
    close: "收起清單",
    pending: "待核對",
    checked: "已核對",
    progress: (done) => `已核對 ${done}/4`,
    reset: "重置",
    restored: "已從本瀏覽器或 URL 恢復",
    boundary: "這裡只保存清單狀態，不保存開戶、身分、入金或收益結果。",
  },
  es: {
    eyebrow: "Preparación de cuenta",
    title: "Revisa antes de abrir el flujo oficial",
    body: "Usa este estado privado de la página para marcar las cuatro revisiones que aún dependen de tu región y de la pantalla oficial de cuenta.",
    open: "Abrir checklist",
    close: "Contraer checklist",
    pending: "Pendiente",
    checked: "Revisado",
    progress: (done) => `${done}/4 revisados`,
    reset: "Restablecer",
    restored: "Restaurado desde este navegador o URL",
    boundary: "Esta guía solo guarda el estado del checklist. No guarda resultados de cuenta, identidad, depósitos ni pagos.",
  },
  "pt-BR": {
    eyebrow: "Prontidão da conta",
    title: "Revise antes de abrir o fluxo oficial",
    body: "Use este estado privado da página para marcar as quatro checagens que ainda dependem da sua região e da tela oficial da conta.",
    open: "Abrir checklist",
    close: "Recolher checklist",
    pending: "Pendente",
    checked: "Revisado",
    progress: (done) => `${done}/4 revisados`,
    reset: "Redefinir",
    restored: "Restaurado deste navegador ou URL",
    boundary: "Este guia salva apenas o estado do checklist. Ele não salva resultados de conta, identidade, depósito ou pagamento.",
  },
  fr: {
    eyebrow: "Préparation du compte",
    title: "Vérifier avant d'ouvrir le parcours officiel",
    body: "Utilisez cet état privé de page pour marquer les quatre vérifications qui dépendent encore de votre région et de l'écran officiel du compte.",
    open: "Ouvrir la checklist",
    close: "Replier la checklist",
    pending: "En attente",
    checked: "Vérifié",
    progress: (done) => `${done}/4 vérifiés`,
    reset: "Réinitialiser",
    restored: "Restauré depuis ce navigateur ou cette URL",
    boundary: "Ce guide enregistre uniquement l'état de la checklist. Il n'enregistre aucun résultat de compte, d'identité, de dépôt ou de paiement.",
  },
  de: {
    eyebrow: "Kontobereitschaft",
    title: "Vor dem offiziellen Ablauf prüfen",
    body: "Nutze diesen privaten Seitenstatus, um die vier Prüfungen zu markieren, die weiterhin von deiner Region und der offiziellen Kontoseite abhängen.",
    open: "Checkliste öffnen",
    close: "Checkliste einklappen",
    pending: "Ausstehend",
    checked: "Geprüft",
    progress: (done) => `${done}/4 geprüft`,
    reset: "Zurücksetzen",
    restored: "Aus diesem Browser oder der URL wiederhergestellt",
    boundary: "Diese Anleitung speichert nur den Checklistenstatus. Sie speichert keine Konto-, Identitäts-, Einzahlungs- oder Auszahlungsergebnisse.",
  },
  ja: {
    eyebrow: "口座準備",
    title: "公式フローを開く前に確認",
    body: "このページ内の非公開状態で、地域と公式口座画面に依存する4つの確認項目を記録できます。",
    open: "チェックリストを開く",
    close: "チェックリストを閉じる",
    pending: "未確認",
    checked: "確認済み",
    progress: (done) => `${done}/4 確認済み`,
    reset: "リセット",
    restored: "このブラウザまたはURLから復元済み",
    boundary: "このガイドはチェックリストの状態のみを保存します。口座、本人確認、入金、報酬の結果は保存しません。",
  },
  ko: {
    eyebrow: "계정 준비도",
    title: "공식 절차를 열기 전에 확인",
    body: "이 페이지의 비공개 상태로 지역과 공식 계정 화면에 따라 달라지는 네 가지 확인 항목을 표시하세요.",
    open: "체크리스트 열기",
    close: "체크리스트 접기",
    pending: "대기 중",
    checked: "확인됨",
    progress: (done) => `${done}/4 확인됨`,
    reset: "초기화",
    restored: "이 브라우저 또는 URL에서 복원됨",
    boundary: "이 안내는 체크리스트 상태만 저장합니다. 계정, 신원, 입금 또는 지급 결과는 저장하지 않습니다.",
  },
  ar: {
    eyebrow: "جاهزية الحساب",
    title: "افحص قبل فتح المسار الرسمي",
    body: "استخدم حالة هذه الصفحة الخاصة لتحديد الفحوص الأربعة التي لا تزال تعتمد على منطقتك وشاشة الحساب الرسمية.",
    open: "فتح قائمة الفحص",
    close: "طي قائمة الفحص",
    pending: "قيد الفحص",
    checked: "تم الفحص",
    progress: (done) => `تم فحص ${done}/4`,
    reset: "إعادة ضبط",
    restored: "تمت الاستعادة من هذا المتصفح أو الرابط",
    boundary: "يحفظ هذا الدليل حالة قائمة الفحص فقط. لا يحفظ نتائج الحساب أو الهوية أو التمويل أو المدفوعات.",
  },
  tr: {
    eyebrow: "Hesap hazırlığı",
    title: "Resmi akışı açmadan önce kontrol et",
    body: "Bölgenize ve resmi hesap ekranına bağlı kalan dört kontrolü işaretlemek için bu sayfanın özel durumunu kullanın.",
    open: "Kontrol listesini aç",
    close: "Kontrol listesini daralt",
    pending: "Bekliyor",
    checked: "Kontrol edildi",
    progress: (done) => `${done}/4 kontrol edildi`,
    reset: "Sıfırla",
    restored: "Bu tarayıcıdan veya URL'den geri yüklendi",
    boundary: "Bu rehber yalnızca kontrol listesi durumunu saklar. Hesap, kimlik, yatırma veya ödeme sonuçlarını saklamaz.",
  },
  ru: {
    eyebrow: "Готовность аккаунта",
    title: "Проверьте перед открытием официального сценария",
    body: "Используйте это приватное состояние страницы, чтобы отметить четыре проверки, которые зависят от вашего региона и официального экрана аккаунта.",
    open: "Открыть список",
    close: "Свернуть список",
    pending: "Ожидает",
    checked: "Проверено",
    progress: (done) => `${done}/4 проверено`,
    reset: "Сбросить",
    restored: "Восстановлено из этого браузера или URL",
    boundary: "Этот гид сохраняет только состояние списка. Он не сохраняет результаты аккаунта, идентификации, пополнения или выплат.",
  },
  id: {
    eyebrow: "Kesiapan akun",
    title: "Periksa sebelum membuka alur resmi",
    body: "Gunakan status privat halaman ini untuk menandai empat pemeriksaan yang masih bergantung pada wilayah dan layar akun resmi.",
    open: "Buka checklist",
    close: "Ciutkan checklist",
    pending: "Menunggu",
    checked: "Sudah diperiksa",
    progress: (done) => `${done}/4 diperiksa`,
    reset: "Reset",
    restored: "Dipulihkan dari browser ini atau URL",
    boundary: "Panduan ini hanya menyimpan status checklist. Panduan ini tidak menyimpan hasil akun, identitas, pendanaan, atau pembayaran.",
  },
  vi: {
    eyebrow: "Mức sẵn sàng tài khoản",
    title: "Kiểm tra trước khi mở luồng chính thức",
    body: "Dùng trạng thái riêng của trang này để đánh dấu bốn mục vẫn phụ thuộc vào khu vực và màn hình tài khoản chính thức.",
    open: "Mở checklist",
    close: "Thu gọn checklist",
    pending: "Đang chờ",
    checked: "Đã kiểm tra",
    progress: (done) => `${done}/4 đã kiểm tra`,
    reset: "Đặt lại",
    restored: "Đã khôi phục từ trình duyệt này hoặc URL",
    boundary: "Hướng dẫn này chỉ lưu trạng thái checklist. Nó không lưu kết quả tài khoản, danh tính, nạp tiền hoặc thanh toán.",
  },
  it: {
    eyebrow: "Preparazione account",
    title: "Controlla prima di aprire il flusso ufficiale",
    body: "Usa questo stato privato della pagina per segnare i quattro controlli che dipendono ancora dalla tua regione e dalla schermata ufficiale dell'account.",
    open: "Apri checklist",
    close: "Riduci checklist",
    pending: "In sospeso",
    checked: "Verificato",
    progress: (done) => `${done}/4 verificati`,
    reset: "Reimposta",
    restored: "Ripristinato da questo browser o URL",
    boundary: "Questa guida salva solo lo stato della checklist. Non salva risultati di account, identità, deposito o pagamento.",
  },
};

function localeKey(locale) {
  const value = String(locale || "");
  if (copyByLocale[value]) return value;
  if (value === "zh-CN" || value.startsWith("zh")) return "zh-Hans";
  const base = value.split("-")[0];
  if (copyByLocale[base]) return base;
  return "en";
}

function itemLocaleKey(locale) {
  const key = localeKey(locale);
  return key === "id" ? "idLocale" : key;
}

function parseReadinessState(value, allowedIds) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item, index, items) => allowedIds.has(item) && items.indexOf(item) === index)
    .slice(0, READINESS_ITEMS.length);
}

function storageKey({ venueSlug, market, product }) {
  return `nexualpha:venue-readiness:${venueSlug || "unknown"}:${market || "unknown"}:${product || "unknown"}`;
}

export function VenueReadinessChecklist({ venueSlug, locale, market, product }) {
  const key = useMemo(() => storageKey({ venueSlug, market, product }), [venueSlug, market, product]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [activeStorageKey, setActiveStorageKey] = useState("");
  const [restored, setRestored] = useState(false);
  const labels = copyByLocale[localeKey(locale)];
  const allowedIds = useMemo(() => new Set(READINESS_ITEMS.map((item) => item.id)), []);
  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = parseReadinessState(params.get("readiness"), allowedIds);
    let fromSession = [];
    try {
      fromSession = parseReadinessState(window.sessionStorage.getItem(key), allowedIds);
    } catch {
      fromSession = [];
    }
    const restoredState = fromUrl.length ? fromUrl : fromSession;
    setCheckedIds(restoredState);
    setRestored(Boolean(restoredState.length));
    setActiveStorageKey(key);
  }, [allowedIds, key]);

  useEffect(() => {
    if (typeof window === "undefined" || activeStorageKey !== key) return;
    const value = checkedIds.join(",");
    try {
      if (value) {
        window.sessionStorage.setItem(key, value);
      } else {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Browser privacy settings can disable sessionStorage; URL state still works.
    }

    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("readiness", value);
    } else {
      url.searchParams.delete("readiness");
    }
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [activeStorageKey, checkedIds, key]);

  const toggleItem = (id) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (allowedIds.has(id)) next.add(id);
      return READINESS_ITEMS.map((item) => item.id).filter((item) => next.has(item));
    });
  };

  const reset = () => setCheckedIds([]);
  const done = checkedIds.length;

  return (
    <section className="venue-readiness" data-venue-readiness-checklist={venueSlug} aria-labelledby={`venue-readiness-${venueSlug}`}>
      <details className="venue-readiness__disclosure">
        <summary className="venue-readiness__summary">
          <h2 id={`venue-readiness-${venueSlug}`}>{labels.title}</h2>
          <strong>{labels.progress(done)}</strong>
        </summary>
      <div className="venue-readiness__head">
        <span>{labels.eyebrow}</span>
        <div>
          <p>{labels.body}</p>
        </div>

      </div>
      <div className="venue-readiness__grid">
        {READINESS_ITEMS.map((item) => {
          const localized = item[itemLocaleKey(locale)] || item.en;
          const isChecked = checkedSet.has(item.id);
          return (
            <label key={item.id} className="venue-readiness__item" data-readiness-item={item.id} data-readiness-status={isChecked ? "checked" : "pending"}>
              <input type="checkbox" checked={isChecked} onChange={() => toggleItem(item.id)} />
              <span aria-hidden="true">{isChecked ? "✓" : "○"}</span>
              <b>{localized[0]}</b>
              <small>{localized[1]}</small>
              <em>{isChecked ? labels.checked : labels.pending}</em>
            </label>
          );
        })}
      </div>
      <div className="venue-readiness__foot">
        <p>{labels.boundary}</p>
        <div>
          {restored && <small>{labels.restored}</small>}
          <button type="button" onClick={reset}>{labels.reset}</button>
        </div>
      </div>
      </details>
    </section>
  );
}
