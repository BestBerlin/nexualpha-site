/**
 * RebateTickerBar — 首页顶部来源状态与核验提示栏
 */
import React from "react";
import { localizedHref } from "../../data/locale-routing.js";
import "./rebate-ticker-bar.css";

const tickerData = {
  "zh-Hans": [
    { type: "INFO", text: "市场行情源在当前候选包中不可用 · 不展示模拟价格" },
    { type: "INFO", text: "平台用户权益与迎新条件需以官方账户页面核验" },
    { type: "DEEP", text: "专题研究提供官方来源入口；实时条件仍需逐项复核" },
    { type: "RATE", text: "费率比较展示公开基准；账户等级、地区与产品条件可能不同" },
    { type: "UPDATE", text: "官方活动中心只发布已审阅来源；过期和未核验项目保持关闭" },
  ],
  "zh-Hant": [
    { type: "INFO", text: "市場行情源在當前候選包中不可用 · 不展示模擬價格" },
    { type: "INFO", text: "平台用戶權益與迎新條件需以官方帳戶頁面核驗" },
    { type: "DEEP", text: "專題研究提供官方來源入口；即時條件仍需逐項複核" },
    { type: "RATE", text: "費率比較展示公開基準；帳戶等級、地區與產品條件可能不同" },
    { type: "UPDATE", text: "官方活動中心只發布已審閱來源；過期和未核驗項目保持關閉" },
  ],
  en: [
    { type: "INFO", text: "Market feed is currently unavailable · simulated prices are hidden" },
    { type: "INFO", text: "User benefits and welcome terms must be verified in the official account" },
    { type: "DEEP", text: "Topic research links to official sources; live conditions remain item-level pending" },
    { type: "RATE", text: "Fee comparisons show published base terms; account, region and product conditions vary" },
    { type: "UPDATE", text: "The activity hub publishes reviewed sources only; stale and unverified offers stay closed" },
  ],
  ja: [
    { type: "INFO", text: "市場フィードは利用できません。シミュレーション価格は非表示です" },
    { type: "INFO", text: "特典とウェルカム条件は公式アカウントで確認してください" },
    { type: "SOURCE", text: "公式ソースに基づくテーマ調査です。最新条件は個別確認が必要です" },
    { type: "DEEP", text: "テーマ調査は公式情報源にリンクしています。最新条件は項目ごとに確認中です" },
    { type: "RATE", text: "公開手数料はアカウント、地域、商品条件で異なります" },
    { type: "UPDATE", text: "アクティビティセンターは確認済みソースのみ掲載します" },
  ],
  ko: [
    { type: "INFO", text: "시장 피드를 사용할 수 없어 시뮬레이션 가격을 숨겼습니다" },
    { type: "INFO", text: "혜택과 가입 조건은 공식 계정에서 확인하세요" },
    { type: "SOURCE", text: "공식 출처 기반 주제 연구이며 현재 조건은 항목별 확인이 필요합니다" },
    { type: "DEEP", text: "주제 리서치는 공식 출처로 연결됩니다. 최신 조건은 항목별로 확인 중입니다" },
    { type: "RATE", text: "공개 수수료는 계정, 지역, 상품 조건에 따라 다릅니다" },
    { type: "UPDATE", text: "활동 센터에는 검토된 출처만 게시합니다" },
  ],
  tr: [
    { type: "INFO", text: "Piyasa akışı kullanılamıyor; simüle fiyatlar gizlendi" },
    { type: "INFO", text: "Avantajları ve karşılama koşullarını resmi hesapta doğrulayın" },
    { type: "SOURCE", text: "Konu araştırması resmi kaynaklara bağlanır; güncel koşullar ayrıca doğrulanır" },
    { type: "DEEP", text: "Konu araştırmaları resmi kaynaklara bağlanır; güncel koşullar madde bazında beklemede" },
    { type: "RATE", text: "Yayınlanan ücretler hesap, bölge ve ürüne göre değişir" },
    { type: "UPDATE", text: "Etkinlik merkezi yalnızca incelenmiş kaynakları yayımlar" },
  ],
  "pt-BR": [
    { type: "INFO", text: "O feed de mercado não está disponível; preços simulados ocultos" },
    { type: "INFO", text: "Confirme benefícios e condições na conta oficial" },
    { type: "SOURCE", text: "Pesquisa temática com fontes oficiais; condições atuais exigem revisão" },
    { type: "DEEP", text: "A pesquisa temática aponta para fontes oficiais; condições atuais aguardam verificação" },
    { type: "RATE", text: "As taxas publicadas variam por conta, região e produto" },
    { type: "UPDATE", text: "O centro de atividades publica apenas fontes revisadas" },
  ],
  es: [
    { type: "INFO", text: "El feed de mercado no está disponible; no se muestran precios simulados" },
    { type: "INFO", text: "Verifica beneficios y condiciones en la cuenta oficial" },
    { type: "SOURCE", text: "Investigación temática con fuentes oficiales; las condiciones actuales requieren revisión" },
    { type: "DEEP", text: "La investigación temática enlaza fuentes oficiales; las condiciones actuales están pendientes" },
    { type: "RATE", text: "Las tarifas publicadas varían según cuenta, región y producto" },
    { type: "UPDATE", text: "El centro de actividad publica solo fuentes revisadas" },
  ],
  fr: [
    { type: "INFO", text: "Le flux de marché est indisponible ; les prix simulés sont masqués" },
    { type: "INFO", text: "Vérifiez les avantages et conditions sur le compte officiel" },
    { type: "SOURCE", text: "Recherche thématique avec sources officielles ; les conditions actuelles doivent être vérifiées" },
    { type: "DEEP", text: "La recherche thématique renvoie aux sources officielles ; les conditions restent à vérifier" },
    { type: "RATE", text: "Les frais publiés varient selon le compte, la région et le produit" },
    { type: "UPDATE", text: "Le centre d'activité publie uniquement des sources examinées" },
  ],
  de: [
    { type: "INFO", text: "Der Marktdaten-Feed ist nicht verfügbar; simulierte Preise sind ausgeblendet" },
    { type: "INFO", text: "Prüfen Sie Vorteile und Willkommensbedingungen im offiziellen Konto" },
    { type: "SOURCE", text: "Themenrecherche mit offiziellen Quellen; aktuelle Bedingungen müssen geprüft werden" },
    { type: "DEEP", text: "Themenrecherchen verlinken offizielle Quellen; aktuelle Bedingungen stehen noch aus" },
    { type: "RATE", text: "Veröffentlichte Gebühren unterscheiden sich nach Konto, Region und Produkt" },
    { type: "UPDATE", text: "Das Aktivitätszentrum veröffentlicht nur geprüfte Quellen" },
  ],
  ru: [
    { type: "INFO", text: "Рыночная лента недоступна; симулированные цены скрыты" },
    { type: "INFO", text: "Проверьте преимущества и условия в официальном аккаунте" },
    { type: "SOURCE", text: "Тематическое исследование с официальными источниками; текущие условия требуют проверки" },
    { type: "DEEP", text: "Тематические исследования ведут к официальным источникам; актуальные условия проверяются" },
    { type: "RATE", text: "Опубликованные комиссии зависят от аккаунта, региона и продукта" },
    { type: "UPDATE", text: "Центр активности публикует только проверенные источники" },
  ],
  ar: [
    { type: "INFO", text: "بيانات السوق غير متاحة؛ تم إخفاء الأسعار التجريبية" },
    { type: "INFO", text: "تحقق من المزايا والشروط في الحساب الرسمي" },
    { type: "SOURCE", text: "بحث موضوعي مرتبط بالمصادر الرسمية؛ يجب التحقق من الشروط الحالية" },
    { type: "DEEP", text: "ترتبط أبحاث الموضوعات بالمصادر الرسمية؛ الشروط الحالية قيد التحقق" },
    { type: "RATE", text: "تختلف الرسوم المنشورة حسب الحساب والمنطقة والمنتج" },
    { type: "UPDATE", text: "ينشر مركز الأنشطة المصادر التي تمت مراجعتها فقط" },
  ],
  id: [
    { type: "INFO", text: "Feed pasar tidak tersedia; harga simulasi disembunyikan" },
    { type: "INFO", text: "Verifikasi manfaat dan ketentuan di akun resmi" },
    { type: "SOURCE", text: "Riset topik memakai sumber resmi; kondisi terbaru perlu diperiksa" },
    { type: "DEEP", text: "Riset topik terhubung ke sumber resmi; kondisi terbaru menunggu verifikasi" },
    { type: "RATE", text: "Biaya yang dipublikasikan berbeda menurut akun, wilayah, dan produk" },
    { type: "UPDATE", text: "Pusat aktivitas hanya menerbitkan sumber yang telah ditinjau" },
  ],
  vi: [
    { type: "INFO", text: "Nguồn dữ liệu thị trường không khả dụng; đã ẩn giá mô phỏng" },
    { type: "INFO", text: "Xác minh ưu đãi và điều kiện trong tài khoản chính thức" },
    { type: "SOURCE", text: "Nghiên cứu chủ đề dùng nguồn chính thức; điều kiện hiện tại cần kiểm tra" },
    { type: "DEEP", text: "Nghiên cứu chủ đề liên kết tới nguồn chính thức; điều kiện hiện tại đang chờ xác minh" },
    { type: "RATE", text: "Phí công bố thay đổi theo tài khoản, khu vực và sản phẩm" },
    { type: "UPDATE", text: "Trung tâm hoạt động chỉ đăng nguồn đã được rà soát" },
  ],
  it: [
    { type: "INFO", text: "Il feed di mercato non è disponibile; i prezzi simulati sono nascosti" },
    { type: "INFO", text: "Verifica vantaggi e condizioni nell'account ufficiale" },
    { type: "SOURCE", text: "Ricerca tematica con fonti ufficiali; le condizioni attuali richiedono verifica" },
    { type: "DEEP", text: "La ricerca tematica collega a fonti ufficiali; le condizioni aggiornate sono da verificare" },
    { type: "RATE", text: "Le commissioni pubblicate variano per account, regione e prodotto" },
    { type: "UPDATE", text: "Il centro attività pubblica solo fonti verificate" },
  ],
};

const sourceNoteActions = {
  "en": {
    "market": "How data is handled",
    "account": "Choose a platform to check conditions",
    "topic": "Open derivatives research and sources",
    "fees": "Open fee-cost check",
    "activity": "Check activities and item conditions"
  },
  "zh-Hans": {
    "market": "查看数据处理方法",
    "account": "选择平台并核对条件",
    "topic": "查看衍生品研究与来源",
    "fees": "打开交易成本检查",
    "activity": "查看活动及逐项条件"
  },
  "zh-Hant": {
    "market": "查看資料處理方法",
    "account": "選擇平台並核對條件",
    "topic": "查看衍生品研究與來源",
    "fees": "開啟交易成本檢查",
    "activity": "查看活動及逐項條件"
  },
  "ja": {
    "market": "データの取扱方法を確認",
    "account": "取引所を選び条件を確認",
    "topic": "デリバティブ調査と出典を開く",
    "fees": "取引コストの確認を開く",
    "activity": "キャンペーンと個別条件を確認"
  },
  "ko": {
    "market": "데이터 처리 방법 확인",
    "account": "거래소 선택 후 조건 확인",
    "topic": "파생상품 리서치와 출처 보기",
    "fees": "거래 비용 확인 열기",
    "activity": "캠페인과 개별 조건 확인"
  },
  "tr": {
    "market": "Verilerin nasıl işlendiğini incele",
    "account": "Koşulları kontrol etmek için platform seç",
    "topic": "Türev araştırmasını ve kaynakları aç",
    "fees": "İşlem maliyeti kontrolünü aç",
    "activity": "Etkinlikleri ve her birinin koşullarını incele"
  },
  "es": {
    "market": "Cómo se tratan los datos",
    "account": "Elige una plataforma para revisar condiciones",
    "topic": "Abre la investigación de derivados y sus fuentes",
    "fees": "Abre la revisión de costes",
    "activity": "Revisa actividades y condiciones de cada una"
  },
  "pt-BR": {
    "market": "Como os dados são tratados",
    "account": "Escolha uma plataforma para verificar condições",
    "topic": "Abra a pesquisa de derivativos e suas fontes",
    "fees": "Abra a verificação de custos",
    "activity": "Verifique atividades e condições de cada item"
  },
  "fr": {
    "market": "Consulter le traitement des données",
    "account": "Choisir une plateforme pour vérifier ses conditions",
    "topic": "Ouvrir la recherche sur les dérivés et ses sources",
    "fees": "Ouvrir la vérification des frais",
    "activity": "Vérifier les activités et leurs conditions"
  },
  "de": {
    "market": "Umgang mit Daten ansehen",
    "account": "Plattform auswählen und Bedingungen prüfen",
    "topic": "Derivaterecherche und Quellen öffnen",
    "fees": "Handelskosten prüfen",
    "activity": "Aktivitäten und jeweilige Bedingungen prüfen"
  },
  "ru": {
    "market": "Как обрабатываются данные",
    "account": "Выбрать платформу и проверить условия",
    "topic": "Открыть исследование деривативов и источники",
    "fees": "Открыть проверку торговых издержек",
    "activity": "Проверить активности и условия каждой"
  },
  "ar": {
    "market": "اطلع على كيفية معالجة البيانات",
    "account": "اختر منصة للتحقق من شروطها",
    "topic": "افتح أبحاث المشتقات ومصادرها",
    "fees": "افتح مراجعة تكاليف التداول",
    "activity": "تحقق من الأنشطة وشروط كل منها"
  },
  "id": {
    "market": "Lihat cara data diproses",
    "account": "Pilih platform untuk memeriksa ketentuan",
    "topic": "Buka riset derivatif dan sumbernya",
    "fees": "Buka pemeriksaan biaya perdagangan",
    "activity": "Periksa aktivitas dan ketentuan masing-masing"
  },
  "vi": {
    "market": "Xem cách xử lý dữ liệu",
    "account": "Chọn nền tảng để kiểm tra điều kiện",
    "topic": "Mở nghiên cứu phái sinh và nguồn tham khảo",
    "fees": "Mở kiểm tra chi phí giao dịch",
    "activity": "Kiểm tra hoạt động và điều kiện từng mục"
  },
  "it": {
    "market": "Consulta come vengono trattati i dati",
    "account": "Scegli una piattaforma per verificarne le condizioni",
    "topic": "Apri la ricerca sui derivati e le sue fonti",
    "fees": "Apri la verifica dei costi di trading",
    "activity": "Verifica attività e condizioni di ciascuna"
  }
};

const sourceNotePaths = Object.freeze({
  market: "/methodology#methodology-pillars-title",
  account: "/exchanges",
  topic: "/topics/derivatives",
  fees: "/#bleed-analyzer",
  activity: "/activities",
});

export function sourceNoteDestination(role, context) {
  const path = sourceNotePaths[role];
  return path ? localizedHref(path, context) : null;
}

function noteRole(item, index) {
  if (index === 0) return "market";
  if (index === 1) return "account";
  if (item.type === "RATE") return "fees";
  if (item.type === "UPDATE") return "activity";
  return "topic";
}

export function RebateTickerBar({ locale = "en", market = null, product = null }) {
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const tickerUi = {
    "zh-Hans": { badge: { INFO: "信息", SOURCE: "来源", DEEP: "详情", RATE: "费率", UPDATE: "更新" } },
    "zh-Hant": { badge: { INFO: "資訊", SOURCE: "來源", DEEP: "詳情", RATE: "費率", UPDATE: "更新" } },
    ja: { aria: "出典ステータス", tag: "出典メモ", viewAll: "すべて表示", hide: "閉じる", badge: { INFO: "情報", SOURCE: "出典", DEEP: "詳細", RATE: "手数料", UPDATE: "更新" } },
    ko: { aria: "출처 상태", tag: "출처 메모", viewAll: "전체 보기", hide: "닫기", badge: { INFO: "정보", SOURCE: "출처", DEEP: "상세", RATE: "수수료", UPDATE: "업데이트" } },
    tr: { aria: "Kaynak durumu", tag: "KAYNAK NOTLARI", viewAll: "Tümünü gör", hide: "Kapat", badge: { INFO: "BİLGİ", SOURCE: "KAYNAK", DEEP: "DETAY", RATE: "ÜCRET", UPDATE: "GÜNCEL" } },
    es: { aria: "Estado de fuentes", tag: "NOTAS DE FUENTES", viewAll: "Ver todo", hide: "Cerrar", badge: { INFO: "INFO", SOURCE: "FUENTE", DEEP: "DETALLE", RATE: "TARIFA", UPDATE: "ACTUALIZACIÓN" } },
    "pt-BR": { aria: "Status das fontes", tag: "NOTAS DE FONTES", viewAll: "Ver tudo", hide: "Fechar", badge: { INFO: "INFO", SOURCE: "FONTE", DEEP: "DETALHE", RATE: "TAXA", UPDATE: "ATUALIZAÇÃO" } },
    fr: { aria: "État des sources", tag: "NOTES DES SOURCES", viewAll: "Tout voir", hide: "Fermer", badge: { INFO: "INFO", SOURCE: "SOURCE", DEEP: "DÉTAIL", RATE: "FRAIS", UPDATE: "MISE À JOUR" } },
    de: { aria: "Quellenstatus", tag: "QUELLENHINWEISE", viewAll: "Alle anzeigen", hide: "Schließen", badge: { INFO: "INFO", SOURCE: "QUELLE", DEEP: "DETAIL", RATE: "GEBÜHR", UPDATE: "UPDATE" } },
    ru: { aria: "Статус источников", tag: "Источники", fullTag: "ЗАМЕТКИ ОБ ИСТОЧНИКАХ", viewAll: "Показать все", hide: "Закрыть", badge: { INFO: "ИНФО", SOURCE: "ИСТОЧНИК", DEEP: "ДЕТАЛИ", RATE: "КОМИССИЯ", UPDATE: "ОБНОВЛЕНИЕ" } },
    ar: { aria: "حالة المصادر", tag: "ملاحظات المصادر", viewAll: "عرض الكل", hide: "إغلاق", badge: { INFO: "معلومة", SOURCE: "مصدر", DEEP: "تفصيل", RATE: "رسوم", UPDATE: "تحديث" } },
    id: { aria: "Status sumber", tag: "CATATAN SUMBER", viewAll: "Lihat semua", hide: "Tutup", badge: { INFO: "INFO", SOURCE: "SUMBER", DEEP: "DETAIL", RATE: "BIAYA", UPDATE: "PEMBARUAN" } },
    vi: { aria: "Trạng thái nguồn", tag: "GHI CHÚ NGUỒN", viewAll: "Xem tất cả", hide: "Đóng", badge: { INFO: "THÔNG TIN", SOURCE: "NGUỒN", DEEP: "CHI TIẾT", RATE: "PHÍ", UPDATE: "CẬP NHẬT" } },
    it: { aria: "Stato delle fonti", tag: "NOTE SULLE FONTI", viewAll: "Vedi tutto", hide: "Chiudi", badge: { INFO: "INFO", SOURCE: "FONTE", DEEP: "DETTAGLI", RATE: "COSTI", UPDATE: "AGGIORNAMENTO" } },
  }[locale] || {};
  const items = tickerData[locale] || (isHant ? tickerData["zh-Hant"] : isZh ? tickerData["zh-Hans"] : tickerData.en);
  const sourceTag = tickerUi.tag || (isHant ? "來源提示" : isZh ? "来源提示" : "SOURCE NOTES");
  const sourceFullLabel = tickerUi.fullTag || null;
  const sourceRegionLabel = tickerUi.fullTag || tickerUi.aria || (isHant ? "來源狀態提示" : isZh ? "来源状态提示" : "Source status notes");
  const viewAllLabel = tickerUi.viewAll || (isHant ? "展開全部" : isZh ? "展开全部" : "View all");
  const actions = sourceNoteActions[locale] || (isHant ? sourceNoteActions["zh-Hant"] : isZh ? sourceNoteActions["zh-Hans"] : sourceNoteActions.en);
  const context = { locale, market, product };

  return (
    <aside className="rebate-ticker-bar" aria-label={sourceRegionLabel}>
      <div className="rebate-ticker__container v2-shell">
        <details className="rebate-ticker__details">
          <summary className="rebate-ticker__summary" aria-label={sourceFullLabel || undefined}>
            <span className="rebate-ticker__tag">{sourceTag}</span>{" "}
            <span className="rebate-ticker__action-label">{viewAllLabel}</span>
          </summary>
          <ol className="rebate-ticker__notes">
            {items.map((item, index) => {
              const role = noteRole(item, index);
              return <li key={`${role}-${index}`} className="rebate-ticker__note" data-source-note-role={role}>
                <span className={`rebate-ticker__badge rebate-ticker__badge--${item.type.toLowerCase()}`}>{tickerUi.badge?.[item.type] || item.type}</span>
                <p className="rebate-ticker__text">{item.text}</p>
                <a className="rebate-ticker__item" href={sourceNoteDestination(role, context)} data-source-note-action={role}>{actions[role]}</a>
              </li>;
            })}
          </ol>
        </details>
      </div>
    </aside>
  );
}

export default RebateTickerBar;
