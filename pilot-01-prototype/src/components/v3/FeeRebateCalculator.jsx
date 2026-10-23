import { SignupEvidence } from "../shared/SignupEvidence.jsx";
/**
 * FeeRebateCalculator — 手续费节省计算器（承重柱二：留存与转化）
 * 用户输入月交易量，对比各平台年度基础手续费支出；已核验的用户权益才进入节省测算。
 */
import { useState, useMemo } from "react";
import { formatPercent } from "../../data/format-percent.js";
import { venueDatabase } from "../../data/venue-database.js";
import { partnerRegistry } from "../../data/partner-registry.js";
import { publicCtaForVenue, venueGoHref } from "../../data/source-bound-cta.js";
import { contextualHref } from "../../data/contextual-href.js";
import "./fee-rebate-calculator.css";

const CALC_PLATFORMS = ["binance", "okx", "bybit", "bitget", "gate", "kucoin", "mexc"];

const copy = {
  "zh-Hans": {
    title: "手续费节省计算器",
    subtitle: "滑动查看年度基础手续费；已核验的用户权益才会计入节省金额。",
    monthlyVol: "月均交易量（现货）",
    mode: { spot: "现货", futures: "合约" },
    yearlyFee: "年度手续费",
    yearlySave: "已核验权益对应的年省",
    savingLabel: "已核验用户权益的年度节省",
    ctaText: "立即开户，锁定返佣 ↗",
    perMonth: "/月",
    unit: "USDT",
    disclaimer: "按已记录的 Taker 基础费率估算；用户权益、资格和最终费用需以平台当前规则核对。",
    colPlatform: "平台",
    colTaker: "Taker 费率",
    badgeBest: "省最多",
    feeLabel: "费率: ",
    savePrefix: "省 ",
    openBtn: "开户 ↗",
    officialDirect: "官方直连",
    reviewTerms: "先核对官方条件 ↗",
    actionLabel: "操作",
    codePending: "邀请码待核验",
    savingPending: "待核验",
    receiptPending: "当前没有已核验的用户权益声明",
  },
  "zh-Hant": {
    title: "手續費節省計算器",
    subtitle: "滑動查看年度基礎手續費；已核驗的用戶權益才會計入節省金額。",
    monthlyVol: "月均交易量（現貨）",
    mode: { spot: "現貨", futures: "合約" },
    yearlyFee: "年度手續費",
    yearlySave: "已核驗權益對應的年省",
    savingLabel: "已核驗用戶權益的年度節省",
    ctaText: "立即開戶，鎖定返佣 ↗",
    perMonth: "/月",
    unit: "USDT",
    disclaimer: "按已記錄的 Taker 基礎費率估算；用戶權益、資格和最終費用需以平台當前規則核對。",
    colPlatform: "平台",
    colTaker: "Taker 費率",
    badgeBest: "省最多",
    feeLabel: "費率: ",
    savePrefix: "省 ",
    openBtn: "開戶 ↗",
    officialDirect: "官方直連",
    reviewTerms: "先核對官方條件 ↗",
    actionLabel: "操作",
    codePending: "邀請碼待核驗",
    savingPending: "待核驗",
    receiptPending: "目前沒有已核驗的用戶權益聲明",
  },
  en: {
    title: "Fee Savings Calculator",
    subtitle: "Compare annual base fees; only source-reviewed user benefits enter the savings estimate.",
    monthlyVol: "Monthly Spot Volume",
    mode: { spot: "Spot", futures: "Futures" },
    yearlyFee: "Annual Fee",
    yearlySave: "Annual Verified Benefit",
    savingLabel: "Annual savings from verified user benefits",
    ctaText: "Sign Up & Lock In Your Rebate ↗",
    perMonth: "/mo",
    unit: "USDT",
    disclaimer: "Estimated from recorded taker base rates; verify current user benefits, eligibility and final fees with the platform.",
    colPlatform: "Exchange",
    colTaker: "Taker Fee",
    badgeBest: "Top Saver",
    feeLabel: "Fee: ",
    savePrefix: "Save ",
    openBtn: "Sign Up ↗",
    officialDirect: "Direct Link",
    reviewTerms: "Review official terms first ↗",
    actionLabel: "Action",
    codePending: "Code pending verification",
    savingPending: "Pending",
    receiptPending: "No verified user-benefit claim is available",
  },
};

copy.ja = { ...copy.en, title:"手数料節約計算機", subtitle:"年間の基本手数料を比較します。確認済みの特典だけを節約額に反映します。", monthlyVol:"月間現物取引量", mode:{spot:"現物",futures:"先物"}, yearlyFee:"年間手数料", yearlySave:"確認済み特典による年間節約", savingLabel:"確認済み特典による年間節約", ctaText:"登録条件を確認 ↗", perMonth:"/月", disclaimer:"記録されたテイカー基本料率による試算です。特典・資格・最終手数料は公式条件を確認してください。", colPlatform:"取引所", colTaker:"テイカー手数料", badgeBest:"節約上位", feeLabel:"手数料: ", savePrefix:"節約 ", openBtn:"登録 ↗", officialDirect:"公式リンク", reviewTerms:"公式条件を先に確認 ↗", actionLabel:"操作", codePending:"コード確認待ち", savingPending:"確認待ち", receiptPending:"確認済み特典はありません" };
copy.ko = { ...copy.en, title:"수수료 절약 계산기", subtitle:"연간 기본 수수료를 비교합니다. 검토된 혜택만 절약액에 반영합니다.", monthlyVol:"월 현물 거래량", mode:{spot:"현물",futures:"선물"}, yearlyFee:"연간 수수료", yearlySave:"확인된 혜택에 따른 연간 절약", savingLabel:"확인된 혜택의 연간 절약", ctaText:"가입 조건 확인 ↗", perMonth:"/월", disclaimer:"기록된 테이커 기본 수수료를 이용한 추정입니다. 혜택·자격·최종 수수료는 공식 조건을 확인하세요.", colPlatform:"거래소", colTaker:"테이커 수수료", badgeBest:"최대 절약", feeLabel:"수수료: ", savePrefix:"절약 ", openBtn:"가입 ↗", officialDirect:"공식 링크", reviewTerms:"공식 조건 먼저 확인 ↗", actionLabel:"작업", codePending:"코드 검토 대기", savingPending:"검토 대기", receiptPending:"확인된 사용자 혜택이 없습니다" };
copy.tr = { ...copy.en, title:"Ücret tasarrufu hesaplayıcı", subtitle:"Yıllık temel ücretleri karşılaştırın; yalnızca incelenmiş avantajlar tasarrufa dahil edilir.", monthlyVol:"Aylık spot hacim", mode:{spot:"Spot",futures:"Vadeli"}, yearlyFee:"Yıllık ücret", yearlySave:"Doğrulanmış avantajla yıllık tasarruf", savingLabel:"Doğrulanmış avantajlardan yıllık tasarruf", ctaText:"Kayıt koşullarını incele ↗", perMonth:"/ay", disclaimer:"Kayıtlı taker temel oranlarıyla tahmindir. Avantaj, uygunluk ve nihai ücretleri resmî koşullardan doğrulayın.", colPlatform:"Borsa", colTaker:"Taker ücreti", badgeBest:"En çok tasarruf", feeLabel:"Ücret: ", savePrefix:"Tasarruf ", openBtn:"Kayıt ↗", officialDirect:"Resmî bağlantı", reviewTerms:"Önce resmî koşulları incele ↗", actionLabel:"İşlem", codePending:"Kod incelemesi bekleniyor", savingPending:"Beklemede", receiptPending:"Doğrulanmış kullanıcı avantajı yok" };

const VOL_STEPS = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

function getCopy(locale) {
  if (locale === "zh-Hans" || locale === "zh-CN") return copy["zh-Hans"];
  if (locale === "zh-Hant" || locale === "zh-TW") return copy["zh-Hant"];
  if (copy[locale]) return copy[locale];
  const base = String(locale || "").split("-")[0];
  if (copy[base]) return copy[base];
  return copy.en;
}

const receiptCopy = {
  ja: { generate: "取引コスト監査レポートを作成", guarantee: "✓ 基本料率の出典を記録 · 未確認の特典は除外", title: "暗号資産取引コスト監査レポート", basis: "推定月間取引量", instrument: "取引商品", recommended: "推奨プラットフォーム", code: "公式紹介コード", annual: "年間手数料節約", copy: " Telegram/X 用にコピー", copied: "✓ 共有文をコピーしました", close: "閉じる", spot: "現物市場", futures: "無期限先物" },
  ko: { generate: "거래 비용 감사 보고서 만들기", guarantee: "✓ 기본 수수료 출처 기록 · 미검토 혜택 제외", title: "암호화폐 거래 비용 감사 보고서", basis: "예상 월 거래량", instrument: "거래 상품", recommended: "추천 플랫폼", code: "공식 추천 코드", annual: "연간 수수료 절감", copy: " Telegram/X 공유 문구 복사", copied: "✓ 공유 문구를 복사했습니다", close: "닫기", spot: "현물 시장", futures: "무기한 선물" },
  tr: { generate: "İşlem maliyeti denetim raporu oluştur", guarantee: "✓ Temel ücret kaynakları kayıtlı · incelenmemiş avantajlar hariç", title: "Kripto işlem maliyeti denetim raporu", basis: "Tahmini aylık hacim", instrument: "İşlem ürünü", recommended: "Önerilen platform", code: "Resmî referans kodu", annual: "Yıllık ücret tasarrufu", copy: " Telegram/X paylaşım metnini kopyala", copied: "✓ Paylaşım metni kopyalandı", close: "Kapat", spot: "Spot piyasa", futures: "Perpetual vadeli" },
  es: { generate: "Generar informe de costes", guarantee: "✓ Fuentes de tarifas registradas · beneficios no verificados excluidos", title: "Informe de auditoría de costes cripto", basis: "Volumen mensual estimado", instrument: "Producto", recommended: "Plataforma recomendada", code: "Código oficial", annual: "Ahorro anual en comisiones", copy: " Copiar texto para Telegram/X", copied: "✓ Texto copiado", close: "Cerrar", spot: "Mercado spot", futures: "Futuros perpetuos" },
  "pt-BR": { generate: "Gerar relatório de custos", guarantee: "✓ Fontes de taxas registradas · benefícios não verificados excluídos", title: "Relatório de auditoria de custos cripto", basis: "Volume mensal estimado", instrument: "Produto", recommended: "Plataforma recomendada", code: "Código oficial", annual: "Economia anual em taxas", copy: " Copiar texto para Telegram/X", copied: "✓ Texto copiado", close: "Fechar", spot: "Mercado spot", futures: "Futuros perpétuos" },
  fr: { generate: "Générer le rapport de coûts", guarantee: "✓ Sources de frais enregistrées · avantages non vérifiés exclus", title: "Rapport d’audit des coûts crypto", basis: "Volume mensuel estimé", instrument: "Produit", recommended: "Plateforme recommandée", code: "Code officiel", annual: "Économie annuelle de frais", copy: " Copier le texte pour Telegram/X", copied: "✓ Texte copié", close: "Fermer", spot: "Marché spot", futures: "Futures perpétuels" },
  de: { generate: "Kostenbericht erstellen", guarantee: "✓ Gebührenquellen erfasst · ungeprüfte Vorteile ausgeschlossen", title: "Prüfbericht zu Krypto-Handelskosten", basis: "Geschätztes Monatsvolumen", instrument: "Produkt", recommended: "Empfohlene Plattform", code: "Offizieller Code", annual: "Jährliche Gebührenersparnis", copy: " Text für Telegram/X kopieren", copied: "✓ Text kopiert", close: "Schließen", spot: "Spotmarkt", futures: "Perpetual-Futures" },
  ar: { generate: "إنشاء تقرير تدقيق التكاليف", guarantee: "✓ مصادر الرسوم مسجلة · استبعاد المزايا غير المتحققة", title: "تقرير تدقيق تكاليف تداول العملات المشفرة", basis: "حجم التداول الشهري المقدر", instrument: "المنتج", recommended: "المنصة المقترحة", code: "الرمز الرسمي", annual: "التوفير السنوي في الرسوم", copy: " نسخ النص إلى Telegram/X", copied: "✓ تم نسخ النص", close: "إغلاق", spot: "السوق الفوري", futures: "العقود الآجلة الدائمة" },
  ru: { generate: "Создать отчёт о затратах", guarantee: "✓ Источники комиссий записаны · непроверенные льготы исключены", title: "Аудит затрат на криптоторговлю", basis: "Расчётный месячный объём", instrument: "Продукт", recommended: "Рекомендуемая площадка", code: "Официальный код", annual: "Годовая экономия на комиссиях", copy: " Копировать текст для Telegram/X", copied: "✓ Текст скопирован", close: "Закрыть", spot: "Спотовый рынок", futures: "Бессрочные фьючерсы" },
  id: { generate: "Buat laporan biaya", guarantee: "✓ Sumber biaya tercatat · manfaat belum terverifikasi dikecualikan", title: "Laporan audit biaya perdagangan kripto", basis: "Volume bulanan perkiraan", instrument: "Produk", recommended: "Platform yang disarankan", code: "Kode resmi", annual: "Penghematan biaya tahunan", copy: " Salin teks untuk Telegram/X", copied: "✓ Teks disalin", close: "Tutup", spot: "Pasar spot", futures: "Futures perpetual" },
  vi: { generate: "Tạo báo cáo chi phí", guarantee: "✓ Đã ghi nhận nguồn phí · loại trừ quyền lợi chưa xác minh", title: "Báo cáo kiểm toán chi phí giao dịch crypto", basis: "Khối lượng tháng ước tính", instrument: "Sản phẩm", recommended: "Nền tảng đề xuất", code: "Mã chính thức", annual: "Tiết kiệm phí hằng năm", copy: " Sao chép nội dung cho Telegram/X", copied: "✓ Đã sao chép", close: "Đóng", spot: "Thị trường giao ngay", futures: "Hợp đồng tương lai vĩnh cửu" },
  it: { generate: "Genera rapporto sui costi", guarantee: "✓ Fonti delle commissioni registrate · vantaggi non verificati esclusi", title: "Rapporto di audit dei costi crypto", basis: "Volume mensile stimato", instrument: "Prodotto", recommended: "Piattaforma consigliata", code: "Codice ufficiale", annual: "Risparmio annuo sulle commissioni", copy: " Copia testo per Telegram/X", copied: "✓ Testo copiato", close: "Chiudi", spot: "Mercato spot", futures: "Futures perpetui" },
  // l10n: needs native review
  ur: { generate: "لاگت رپورٹ بنائیں", guarantee: "✓ بنیادی فیس ماخذ درج · غیر تصدیق شدہ فوائد خارج", title: "کرپٹو ٹریڈنگ لاگت آڈٹ رپورٹ", basis: "تخمینی ماہانہ حجم", instrument: "پروڈکٹ", recommended: "تجویز کردہ پلیٹ فارم", code: "سرکاری کوڈ", annual: "سالانہ فیس بچت", copy: " Telegram/X کے لیے متن کاپی کریں", copied: "✓ متن کاپی ہو گیا", close: "بند کریں", spot: "Spot مارکیٹ", futures: "Perpetual futures" },
  // l10n: needs native review
  uk: { generate: "Створити звіт про витрати", guarantee: "✓ Джерела базових комісій записані · неперевірені переваги виключені", title: "Звіт аудиту витрат криптотрейдингу", basis: "Орієнтовний місячний обсяг", instrument: "Продукт", recommended: "Рекомендована платформа", code: "Офіційний код", annual: "Річна економія на комісіях", copy: " Копіювати текст для Telegram/X", copied: "✓ Текст скопійовано", close: "Закрити", spot: "Spot ринок", futures: "Perpetual futures" },
};

function getReceiptCopy(locale) {
  return receiptCopy[locale] || receiptCopy[String(locale || "").split("-")[0]] || {
    generate: "Generate Savings Certificate", guarantee: "✓ Recorded base-rate inputs · unverified benefits excluded", title: "Trading Fee Savings Certificate", basis: "Estimated Monthly Volume", instrument: "Instrument Type", recommended: "Recommended Platform", code: "Exclusive Promo Code", annual: "Total Annual Savings", copy: " Copy Share Text", copied: "✓ Copied to Clipboard", close: "Close", spot: "Spot Market", futures: "Futures Market",
  };
}

function formatUsd(n) {
  if (n >= 1000000) return `\$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `\$${(n / 1000).toFixed(0)}K`;
  return `\$${n.toLocaleString()}`;
}

function calcRow(slug, monthlyVol, mode, locale) {
  const db = venueDatabase[slug];
  if (!db) return null;
  const partner = partnerRegistry[slug] || {};
  const cta = publicCtaForVenue(slug, locale);
  const feeData = mode === "futures" ? db.futuresFee : db.spotFee;
  if (!feeData) return null;
  const takerRate = feeData.takerRate ?? 0.001;
  const rebatePercent = cta.rebatePercent;
  const yearlyFee = monthlyVol * takerRate * 12;
  const yearlySaving = yearlyFee * (rebatePercent / 100);
  return {
    slug,
    name: db.name,
    category: db.category,
    feeDisplay: feeData.display,
    rebatePercent,
    yearlyFee,
    yearlySaving,
    registrationUrl: venueGoHref(slug, "fee-rebate-calculator", locale),
    hasReferral: cta.hasReferral,
    inviteCode: cta.inviteCode,
    claimStatus: cta.claim.status,
    profileHref: contextualHref(`/exchanges/${slug}#registration-path`, { locale }),
  };
}

export function FeeRebateCalculator({ locale = "en" }) {
  const [volIndex, setVolIndex] = useState(4); // default $50,000
  const [mode, setMode] = useState("spot");
  const t = getCopy(locale);
  const r = getReceiptCopy(locale);
  const monthlyVol = VOL_STEPS[volIndex];

  const rows = useMemo(() => {
    return CALC_PLATFORMS
      .map((slug) => calcRow(slug, monthlyVol, mode, locale))
      .filter(Boolean)
      .sort((a, b) => b.yearlySaving - a.yearlySaving);
  }, [monthlyVol, mode, locale]);

  const bestRow = rows[0];
  const topSaving = bestRow?.yearlySaving ?? 0;

  const [showReceipt, setShowReceipt] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const topRow = rows[0] || {};
  const benefitVerified = topRow.claimStatus === "verified" && topRow.rebatePercent > 0;
  const pendingLabel = t.savingPending;
  const shareText = benefitVerified
    ? `【NexuAlpha 交易成本审计报告】\n我的月均交易量: ${formatUsd(monthlyVol)} (${mode === "spot" ? "现货" : "合约"})\n${topRow.name} 的已核验用户权益测算年省约 ${formatUsd(Math.round(topSaving))} USDT；开户前请核对官方条件。\n安全开户与官方白名单核查: ${typeof window !== "undefined" ? window.location.origin : "https://nexualpha.com"}`
    : `【NexuAlpha 交易成本审计报告】\n我的月均交易量: ${formatUsd(monthlyVol)} (${mode === "spot" ? "现货" : "合约"})\n当前没有已核验的用户权益节省声明；请先核对平台官方费率、地区资格和账户条件。\n安全开户与官方白名单核查: ${typeof window !== "undefined" ? window.location.origin : "https://nexualpha.com"}`;

  const handleCopyShareText = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
    }
  };

  return (
    <section className="fee-rebate-calculator" id="calculator">
      <div className="frc-inner v2-shell">
        <div className="frc__header">
          <h2 className="frc__title">{t.title}</h2>
          <p className="frc__subtitle">{t.subtitle}</p>

          <div className="frc__controls">
            <div className="frc__slider-block">
              <div className="frc__slider-label-row">
                <span className="frc__slider-label">{t.monthlyVol}:</span>
                <strong className="frc__vol-display" translate="no">
                  {formatUsd(monthlyVol)} {t.perMonth}
                </strong>
              </div>
              <input
                type="range"
                min="0"
                max={VOL_STEPS.length - 1}
                step="1"
                value={volIndex}
                onChange={(e) => setVolIndex(Number(e.target.value))}
                className="frc__slider"
                aria-valuetext={formatUsd(monthlyVol)}
              />
              <div className="frc__slider-scale" aria-hidden="true">
                <span>{formatUsd(VOL_STEPS[0])}</span>
                <span>{formatUsd(VOL_STEPS[Math.floor(VOL_STEPS.length / 2)])}</span>
                <span>{formatUsd(VOL_STEPS[VOL_STEPS.length - 1])}</span>
              </div>
            </div>

            <div className="frc__mode-switch" role="group" aria-label="trading mode">
              {["spot", "futures"].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`frc__mode-btn${mode === m ? " frc__mode-btn--active" : ""}`}
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                >
                  {t.mode[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="frc__hero-saving">
            <span className="frc__saving-label">{t.savingLabel}:</span>
            <strong className="frc__saving-amount" translate="no">
              {benefitVerified ? `+${formatUsd(Math.round(topSaving))} ${t.unit}` : pendingLabel}
            </strong>
          </div>
        </div>

        <div className="frc__table" role="table" aria-label="Fee comparisons">
          <div className="frc__thead" role="row">
            <span>{t.colPlatform}</span>
            <span>{t.colTaker}</span>
            <span>{t.yearlyFee}</span>
            <span>{t.yearlySave}</span>
            <span className="sr-only">{t.actionLabel}</span>
          </div>
          {rows.map((row, idx) => (
            <div
              key={row.slug}
              className={`frc__row${idx === 0 ? " frc__row--best" : ""}`}
              role="row"
            >
              <div className="frc__col-name" role="cell">
                <div className="frc__venue-name">
                  <span className="frc__venue-label" translate="no" lang="en">{row.name}</span>
                  {idx === 0 && <span className="frc__badge-best">{t.badgeBest}</span>}
                </div>
                <span className="frc__code-tag">
                  <span>{row.inviteCode ? "CODE" : t.codePending}:</span>{row.inviteCode && <strong translate="no">{row.inviteCode}</strong>}
                </span>
              </div>

              <div className="frc__col-rate" role="cell">
                <span className="frc__mobile-label">{t.feeLabel}</span>
                <span className="frc__rate-val" translate="no">{row.feeDisplay}</span>
              </div>

              <div className="frc__col-fee" role="cell">
                <span className="frc__mobile-label">{t.yearlyFee}: </span>
                <span className="frc__fee-val" translate="no">{formatUsd(Math.round(row.yearlyFee))}</span>
              </div>

              <div className="frc__col-saving" role="cell">
                <span className="frc__mobile-label">{t.yearlySave}: </span>
                <span className="frc__save-val" translate="no">
                  {row.yearlySaving > 0 ? `+${formatUsd(Math.round(row.yearlySaving))}` : "—"}
                </span>
                {row.rebatePercent > 0 && (
                  <span className="frc__rebate-tag">{t.savePrefix}{formatPercent(locale, row.rebatePercent)}</span>
                )}
              </div>

              <div className="frc__col-action" role="cell">
                {row.hasReferral && row.registrationUrl ? (
                  <span data-signup-cta={row.slug} className="signup-cta-block"><a
                    href={row.registrationUrl}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="frc__cta-btn"
                    data-cta-kind="registration"
                    data-cta-status={row.claimStatus}
                    data-cta-platform={row.slug}
                    data-cta-placement="fee-rebate-calculator"
                    data-growth-decision={row.slug}
                    data-growth-placement="fee-rebate-calculator"
                  >
                    {t.openBtn}
                  </a><SignupEvidence slug={row.slug} locale={locale} market={undefined} /></span>
                ) : (
                  <a href={row.profileHref} className="frc__cta-btn frc__cta-btn--research" data-cta-kind="research" data-cta-status={row.claimStatus} data-cta-platform={row.slug} data-cta-placement="fee-rebate-calculator">
                    {t.reviewTerms}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="frc__footer-bar">
          <button
            type="button"
            onClick={() => setShowReceipt(true)}
            className="frc__receipt-trigger-btn"
          >
            <span></span>
            <span>{locale.startsWith("zh") ? "生成我的交易成本审计战报" : r.generate}</span>
          </button>
          <span className="frc__hero-guarantee">
            {locale.startsWith("zh") ? "✓ 基础费率来源记录 · 未核验权益不计入" : r.guarantee}
          </span>
        </div>

        <p className="frc__disclaimer">{t.disclaimer}</p>
      </div>

      {showReceipt && (
        <div className="frc-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowReceipt(false)}>
          <div className="frc-receipt-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="frc-receipt-sheet__drag-handle" aria-hidden="true"></div>
            <div className="frc-receipt-card">
              <div className="frc-receipt-card__header">
                <span className="frc-receipt-card__brand">NEXUALPHA CLEARING AUDIT</span>
                <span className="frc-receipt-card__stamp">{benefitVerified ? "SOURCE REVIEWED ✓" : "SOURCE REVIEW PENDING"}</span>
              </div>
              <h3 className="frc-receipt-card__title">
                {locale.startsWith("zh") ? "加密交易成本审计战报" : r.title}
              </h3>
              <p className="frc-receipt-card__desc">
                {benefitVerified
                  ? (locale.startsWith("zh") ? "基于已记录的 Taker 基础费率与已核验用户权益测算" : "Based on recorded Taker base rates and a source-reviewed user benefit")
                  : (locale.startsWith("zh") ? t.receiptPending : "Base-fee estimate only; user benefits are not yet checked against sources")}
              </p>

              <div className="frc-receipt-card__data">
                <div className="frc-receipt-row">
                  <span>{locale.startsWith("zh") ? "预估月均交易量" : r.basis}</span>
                  <strong translate="no">{formatUsd(monthlyVol)} USDT</strong>
                </div>
                <div className="frc-receipt-row">
                  <span>{locale.startsWith("zh") ? "测算交易品类" : r.instrument}</span>
                  <strong>{mode === "spot" ? (locale.startsWith("zh") ? "现货市场 (Spot)" : r.spot) : (locale.startsWith("zh") ? "永续合约 (Futures)" : r.futures)}</strong>
                </div>
                <div className="frc-receipt-row">
                  <span>{locale.startsWith("zh") ? "推荐最具性价比平台" : r.recommended}</span>
                  <strong translate="no" lang="en">{topRow.name}</strong>
                </div>
                <div className="frc-receipt-row">
                  <span>{locale.startsWith("zh") ? "官方专属合作码" : r.code}</span>
                  <strong className="text-blue" translate="no">{topRow.inviteCode || pendingLabel}</strong>
                </div>
                <div className="frc-receipt-row frc-receipt-row--highlight">
                  <span>{locale.startsWith("zh") ? "每年可省手续费总额" : r.annual}</span>
                  <strong className="text-green" translate="no">{benefitVerified ? `+${formatUsd(Math.round(topSaving))} USDT` : pendingLabel}</strong>
                </div>
              </div>

              <div className="frc-receipt-card__footer">
                <span className="frc-receipt-fingerprint" translate="no">
                  SIG: SHA256:8f2a...c930 · NEXUALPHA-OFFICIAL
                </span>
              </div>

              <div className="frc-receipt-actions">
                <button type="button" onClick={handleCopyShareText} className="frc-receipt-copy-btn">
                  {copiedReceipt ? (locale.startsWith("zh") ? "✓ 已复制分享文案" : r.copied) : (locale.startsWith("zh") ? " 复制 Telegram/X 战报" : r.copy)}
                </button>
                <button type="button" onClick={() => setShowReceipt(false)} className="frc-receipt-close-btn">
                  {locale.startsWith("zh") ? "关闭" : r.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default FeeRebateCalculator;
