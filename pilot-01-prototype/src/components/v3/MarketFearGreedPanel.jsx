/**
 * MarketFearGreedPanel — B3. 行情与恐慌贪婪情绪面板
 */
import React from "react";
import "./market-fear-greed-panel.css";

const copy = {
  "zh-Hans": {
    eyebrow: "市场情绪与风险监测",
    title: "市场恐慌贪婪指数与主流资产风向",
    subtitle: "当前候选包未连接可验证的行情与情绪源；不展示模拟价格、指数或平台建议。",
    fearIndexTitle: "今日恐慌与贪婪指数",
    fearIndexStatus: "数据不可用",
    fearIndexValue: "—",
    marketAssets: [],
    signalAdvice: "数据状态：不可用。接入验证源后再发布行情和情绪结论。",
  },
  "zh-Hant": {
    eyebrow: "市場情緒與風險監測",
    title: "市場恐慌貪婪指數與主流資產風向",
    subtitle: "當前候選包未連接可驗證的行情與情緒源；不展示模擬價格、指數或平台建議。",
    fearIndexTitle: "今日恐慌與貪婪指數",
    fearIndexStatus: "數據不可用",
    fearIndexValue: "—",
    marketAssets: [],
    signalAdvice: "數據狀態：不可用。接入驗證源後再發布行情和情緒結論。",
  },
  en: {
    eyebrow: "MARKET SENTIMENT & RISK MONITOR",
    title: "Crypto Fear & Greed Index & Asset Monitor",
    subtitle: "No verifiable market or sentiment feed is currently connected; simulated prices, indexes and venue advice are hidden.",
    fearIndexTitle: "Crypto Fear & Greed Index",
    fearIndexStatus: "Data unavailable",
    fearIndexValue: "—",
    marketAssets: [],
    signalAdvice: "Data status: unavailable. Connect a verified feed before publishing market or venue conclusions.",
  },
  ja: { eyebrow: "市場センチメントとリスク監視", title: "暗号資産の恐怖・強欲指数と資産モニター", subtitle: "検証可能な市場・センチメント情報源が未接続のため、模擬価格や推奨は表示しません。", fearIndexTitle: "今日の恐怖・強欲指数", fearIndexStatus: "データなし", fearIndexValue: "—", marketAssets: [], signalAdvice: "データ状態：利用できません。検証済み情報源の接続後に公開します。" },
  ko: { eyebrow: "시장 심리 및 위험 모니터", title: "암호화폐 공포·탐욕 지수와 자산 모니터", subtitle: "검증 가능한 시장·심리 데이터가 연결되지 않아 시뮬레이션 가격과 추천을 표시하지 않습니다.", fearIndexTitle: "오늘의 공포·탐욕 지수", fearIndexStatus: "데이터 없음", fearIndexValue: "—", marketAssets: [], signalAdvice: "데이터 상태: 사용할 수 없습니다. 검증된 소스 연결 후 공개합니다." },
  tr: { eyebrow: "Piyasa duyarlılığı ve risk izleme", title: "Kripto korku ve açgözlülük endeksi", subtitle: "Doğrulanabilir piyasa veya duyarlılık kaynağı bağlı değil; simüle fiyatlar ve öneriler gösterilmez.", fearIndexTitle: "Bugünün korku ve açgözlülük endeksi", fearIndexStatus: "Veri yok", fearIndexValue: "—", marketAssets: [], signalAdvice: "Veri durumu: kullanılamıyor. Doğrulanmış kaynak bağlandıktan sonra yayınlanır." },
  es: { eyebrow: "Monitor de sentimiento y riesgo del mercado", title: "Índice de miedo y codicia cripto y monitor de activos", subtitle: "No hay conectada ninguna fuente verificable de mercado o sentimiento; se ocultan precios simulados, índices y recomendaciones de plataformas.", fearIndexTitle: "Índice de miedo y codicia cripto", fearIndexStatus: "Datos no disponibles", fearIndexValue: "—", marketAssets: [], signalAdvice: "Estado de los datos: no disponibles. Conecte una fuente verificada antes de publicar conclusiones de mercado o de plataformas." },
  "pt-BR": { eyebrow: "Monitor de sentimento e risco do mercado", title: "Índice de medo e ganância cripto e monitor de ativos", subtitle: "Nenhuma fonte verificável de mercado ou sentimento está conectada; preços simulados, índices e recomendações de plataformas ficam ocultos.", fearIndexTitle: "Índice de medo e ganância cripto", fearIndexStatus: "Dados indisponíveis", fearIndexValue: "—", marketAssets: [], signalAdvice: "Status dos dados: indisponível. Conecte uma fonte verificada antes de publicar conclusões de mercado ou de plataformas." },
  fr: { eyebrow: "Suivi du sentiment de marché et des risques", title: "Indice crypto Fear & Greed et suivi des actifs", subtitle: "Aucune source vérifiable de marché ou de sentiment n’est connectée ; les prix simulés, indices et recommandations de plateformes sont masqués.", fearIndexTitle: "Indice crypto Fear & Greed", fearIndexStatus: "Données indisponibles", fearIndexValue: "—", marketAssets: [], signalAdvice: "État des données : indisponibles. Connectez une source vérifiée avant de publier des conclusions sur le marché ou les plateformes." },
  de: { eyebrow: "Marktstimmung und Risikomonitor", title: "Krypto-Angst-und-Gier-Index und Asset-Monitor", subtitle: "Es ist keine überprüfbare Markt- oder Stimmungsquelle verbunden; simulierte Preise, Indizes und Plattformempfehlungen werden ausgeblendet.", fearIndexTitle: "Krypto-Angst-und-Gier-Index", fearIndexStatus: "Daten nicht verfügbar", fearIndexValue: "—", marketAssets: [], signalAdvice: "Datenstatus: nicht verfügbar. Verbinden Sie eine geprüfte Quelle, bevor Markt- oder Plattformaussagen veröffentlicht werden." },
  it: { eyebrow: "Monitor del sentiment di mercato e del rischio", title: "Indice crypto Fear & Greed e monitor degli asset", subtitle: "Nessuna fonte verificabile di mercato o sentiment è collegata; prezzi simulati, indici e consigli sulle piattaforme sono nascosti.", fearIndexTitle: "Indice crypto Fear & Greed", fearIndexStatus: "Dati non disponibili", fearIndexValue: "—", marketAssets: [], signalAdvice: "Stato dei dati: non disponibili. Collega una fonte verificata prima di pubblicare conclusioni su mercato o piattaforme." },
  // l10n: needs native review
  ru: { eyebrow: "Монитор рыночных настроений и рисков", title: "Крипто-индекс страха и жадности и монитор активов", subtitle: "Проверяемый источник рыночных данных или настроений не подключён; смоделированные цены, индексы и рекомендации по платформам скрыты.", fearIndexTitle: "Крипто-индекс страха и жадности", fearIndexStatus: "Данные недоступны", fearIndexValue: "—", marketAssets: [], signalAdvice: "Статус данных: недоступны. Подключите проверенный источник, прежде чем публиковать выводы о рынке или платформах." },
  // l10n: needs native review
  id: { eyebrow: "Monitor sentimen pasar dan risiko", title: "Indeks ketakutan dan keserakahan kripto serta monitor aset", subtitle: "Tidak ada sumber pasar atau sentimen terverifikasi yang terhubung; harga simulasi, indeks, dan saran platform disembunyikan.", fearIndexTitle: "Indeks ketakutan dan keserakahan kripto", fearIndexStatus: "Data tidak tersedia", fearIndexValue: "—", marketAssets: [], signalAdvice: "Status data: tidak tersedia. Hubungkan sumber terverifikasi sebelum menerbitkan kesimpulan pasar atau platform." },
  // l10n: needs native review
  vi: { eyebrow: "Theo dõi tâm lý thị trường và rủi ro", title: "Chỉ số sợ hãi và tham lam tiền mã hóa và theo dõi tài sản", subtitle: "Chưa kết nối nguồn thị trường hoặc tâm lý có thể kiểm chứng; giá mô phỏng, chỉ số và khuyến nghị nền tảng được ẩn.", fearIndexTitle: "Chỉ số sợ hãi và tham lam tiền mã hóa", fearIndexStatus: "Không có dữ liệu", fearIndexValue: "—", marketAssets: [], signalAdvice: "Trạng thái dữ liệu: không khả dụng. Hãy kết nối nguồn đã xác minh trước khi công bố kết luận về thị trường hoặc nền tảng." },
  // l10n: needs native review
  ar: { eyebrow: "مراقبة معنويات السوق والمخاطر", title: "مؤشر الخوف والجشع للعملات المشفرة ومراقبة الأصول", subtitle: "لا يوجد مصدر سوق أو معنويات قابل للتحقق متصل حاليًا؛ الأسعار والمؤشرات المحاكاة وتوصيات المنصات مخفية.", fearIndexTitle: "مؤشر الخوف والجشع للعملات المشفرة", fearIndexStatus: "البيانات غير متاحة", fearIndexValue: "—", marketAssets: [], signalAdvice: "حالة البيانات: غير متاحة. اربط مصدرًا موثقًا قبل نشر أي استنتاجات عن السوق أو المنصات." },
};

export const marketFearGreedCopy = copy;

export function marketFearGreedCopyFor(locale = "en") {
  const normalized = String(locale || "en");
  const base = normalized.split("-")[0];
  if (normalized === "zh-TW" || normalized === "zh-HK") return copy["zh-Hant"];
  if (base === "pt") return copy["pt-BR"];
  return copy[normalized] || copy[base] || (base === "zh" ? copy["zh-Hans"] : copy.en);
}

export function MarketFearGreedPanel({ locale = "en" }) {
  const t = marketFearGreedCopyFor(locale);

  return (
    <section className="sentiment-section v2-shell">
      <header className="sentiment__header">
        <div className="sentiment__eyebrow">
          <span className="sentiment__pulse"></span>
          {t.eyebrow}
        </div>
        <h2 className="sentiment__title">{t.title}</h2>
        <p className="sentiment__subtitle">{t.subtitle}</p>
      </header>

      <div className="sentiment__grid">
        <div className="sentiment__card sentiment__card--index">
          <div className="sentiment-index__meta">
            <span className="sentiment-index__label">{t.fearIndexTitle}</span>
            <span className="sentiment-index__badge">{t.fearIndexStatus}</span>
          </div>

          <div className="sentiment-index__value-box">
            <span className="sentiment-index__value">{t.fearIndexValue}</span>
              <div className="sentiment-index__meter-bar">
              <div className="sentiment-index__meter-fill" style={{ width: t.fearIndexValue === "—" ? "0%" : `${t.fearIndexValue}%` }}></div>
            </div>
          </div>
        </div>

        <div className="sentiment__card sentiment__card--tickers">
          <div className="sentiment-tickers__grid">
            {t.marketAssets.map((asset) => (
              <div key={asset.symbol} className="sentiment-ticker">
                <span className="sentiment-ticker__symbol">{asset.symbol}</span>
                <strong className="sentiment-ticker__price">{asset.price}</strong>
                <span className={`sentiment-ticker__change ${asset.isUp ? "text-green" : "text-red"}`}>
                  {asset.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sentiment__advice-box">
        <span>{t.signalAdvice}</span>
      </div>
    </section>
  );
}

export default MarketFearGreedPanel;
