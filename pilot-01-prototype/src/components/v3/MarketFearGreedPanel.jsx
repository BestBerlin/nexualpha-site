/**
 * MarketFearGreedPanel — B3. 行情与恐慌贪婪情绪面板
 */
import React from "react";
import "./market-fear-greed-panel.css";

const copy = {
  "zh-Hans": {
    eyebrow: "市场情绪与风险监测",
    title: "市场恐慌贪婪指数与主流资产风向",
    subtitle: "目前没有接入可验证的行情与情绪数据源；不展示模拟价格、指数或平台建议。",
    fearIndexTitle: "今日恐慌与贪婪指数",
    fearIndexStatus: "数据不可用",
    fearIndexValue: "—",
    marketAssets: [],
    signalAdvice: "数据状态：暂无经核验的数据源，因此不给出行情或平台结论。",
  },
  "zh-Hant": {
    eyebrow: "市場情緒與風險監測",
    title: "市場恐慌貪婪指數與主流資產風向",
    subtitle: "目前沒有接入可驗證的行情與情緒資料源；不展示模擬價格、指數或平台建議。",
    fearIndexTitle: "今日恐慌與貪婪指數",
    fearIndexStatus: "數據不可用",
    fearIndexValue: "—",
    marketAssets: [],
    signalAdvice: "資料狀態：暫無經核驗的資料源，因此不提供行情或平台結論。",
  },
  en: {
    eyebrow: "MARKET SENTIMENT & RISK MONITOR",
    title: "Crypto Fear & Greed Index & Asset Monitor",
    subtitle: "No verifiable market or sentiment feed is currently connected; simulated prices, indexes and venue advice are hidden.",
    fearIndexTitle: "Crypto Fear & Greed Index",
    fearIndexStatus: "Data unavailable",
    fearIndexValue: "—",
    marketAssets: [],
    signalAdvice: "Data status: no verified live feed yet, so no market or venue conclusions are shown.",
  },
  ja: { eyebrow: "市場センチメントとリスク監視", title: "暗号資産の恐怖・強欲指数と資産モニター", subtitle: "検証可能な市場・センチメント情報源が未接続のため、模擬価格や推奨は表示しません。", fearIndexTitle: "今日の恐怖・強欲指数", fearIndexStatus: "データなし", fearIndexValue: "—", marketAssets: [], signalAdvice: "データ状態：検証済みのライブデータがまだないため、市場やプラットフォームの結論は表示しません。" },
  ko: { eyebrow: "시장 심리 및 위험 모니터", title: "암호화폐 공포·탐욕 지수와 자산 모니터", subtitle: "검증 가능한 시장·심리 데이터가 연결되지 않아 시뮬레이션 가격과 추천을 표시하지 않습니다.", fearIndexTitle: "오늘의 공포·탐욕 지수", fearIndexStatus: "데이터 없음", fearIndexValue: "—", marketAssets: [], signalAdvice: "데이터 상태: 검증된 실시간 데이터가 아직 없어 시장·플랫폼 결론을 표시하지 않습니다." },
  tr: { eyebrow: "Piyasa duyarlılığı ve risk izleme", title: "Kripto korku ve açgözlülük endeksi", subtitle: "Doğrulanabilir piyasa veya duyarlılık kaynağı bağlı değil; simüle fiyatlar ve öneriler gösterilmez.", fearIndexTitle: "Bugünün korku ve açgözlülük endeksi", fearIndexStatus: "Veri yok", fearIndexValue: "—", marketAssets: [], signalAdvice: "Veri durumu: henüz doğrulanmış canlı veri yok, bu yüzden piyasa veya platform sonucu gösterilmiyor." },
  es: { eyebrow: "Monitor de sentimiento y riesgo del mercado", title: "Índice de miedo y codicia cripto y monitor de activos", subtitle: "No hay conectada ninguna fuente verificable de mercado o sentimiento; se ocultan precios simulados, índices y recomendaciones de plataformas.", fearIndexTitle: "Índice de miedo y codicia cripto", fearIndexStatus: "Datos no disponibles", fearIndexValue: "—", marketAssets: [], signalAdvice: "Estado de los datos: aún no hay un feed verificado en vivo, por eso no se muestran conclusiones de mercado ni de plataformas." },
  "pt-BR": { eyebrow: "Monitor de sentimento e risco do mercado", title: "Índice de medo e ganância cripto e monitor de ativos", subtitle: "Nenhuma fonte verificável de mercado ou sentimento está conectada; preços simulados, índices e recomendações de plataformas ficam ocultos.", fearIndexTitle: "Índice de medo e ganância cripto", fearIndexStatus: "Dados indisponíveis", fearIndexValue: "—", marketAssets: [], signalAdvice: "Status dos dados: ainda não há feed verificado ao vivo, por isso nenhuma conclusão de mercado ou de plataforma é exibida." },
  fr: { eyebrow: "Suivi du sentiment de marché et des risques", title: "Indice crypto Fear & Greed et suivi des actifs", subtitle: "Aucune source vérifiable de marché ou de sentiment n’est connectée ; les prix simulés, indices et recommandations de plateformes sont masqués.", fearIndexTitle: "Indice crypto Fear & Greed", fearIndexStatus: "Données indisponibles", fearIndexValue: "—", marketAssets: [], signalAdvice: "État des données : pas encore de flux vérifié en direct, aucune conclusion sur le marché ou les plateformes n’est donc affichée." },
  de: { eyebrow: "Marktstimmung und Risikomonitor", title: "Krypto-Angst-und-Gier-Index und Asset-Monitor", subtitle: "Es ist keine überprüfbare Markt- oder Stimmungsquelle verbunden; simulierte Preise, Indizes und Plattformempfehlungen werden ausgeblendet.", fearIndexTitle: "Krypto-Angst-und-Gier-Index", fearIndexStatus: "Daten nicht verfügbar", fearIndexValue: "—", marketAssets: [], signalAdvice: "Datenstatus: noch kein verifizierter Live-Feed, daher werden keine Markt- oder Plattformaussagen angezeigt." },
  it: { eyebrow: "Monitor del sentiment di mercato e del rischio", title: "Indice crypto Fear & Greed e monitor degli asset", subtitle: "Nessuna fonte verificabile di mercato o sentiment è collegata; prezzi simulati, indici e consigli sulle piattaforme sono nascosti.", fearIndexTitle: "Indice crypto Fear & Greed", fearIndexStatus: "Dati non disponibili", fearIndexValue: "—", marketAssets: [], signalAdvice: "Stato dei dati: nessun feed live verificato per ora, quindi non mostriamo conclusioni su mercato o piattaforme." },
  // l10n: needs native review
  ru: { eyebrow: "Монитор рыночных настроений и рисков", title: "Крипто-индекс страха и жадности и монитор активов", subtitle: "Проверяемый источник рыночных данных или настроений не подключён; смоделированные цены, индексы и рекомендации по платформам скрыты.", fearIndexTitle: "Крипто-индекс страха и жадности", fearIndexStatus: "Данные недоступны", fearIndexValue: "—", marketAssets: [], signalAdvice: "Статус данных: проверенного потока пока нет, поэтому выводы о рынке и платформах не показываются." },
  // l10n: needs native review
  id: { eyebrow: "Monitor sentimen pasar dan risiko", title: "Indeks ketakutan dan keserakahan kripto serta monitor aset", subtitle: "Tidak ada sumber pasar atau sentimen terverifikasi yang terhubung; harga simulasi, indeks, dan saran platform disembunyikan.", fearIndexTitle: "Indeks ketakutan dan keserakahan kripto", fearIndexStatus: "Data tidak tersedia", fearIndexValue: "—", marketAssets: [], signalAdvice: "Status data: belum ada feed langsung terverifikasi, jadi tidak ada kesimpulan pasar atau platform yang ditampilkan." },
  // l10n: needs native review
  vi: { eyebrow: "Theo dõi tâm lý thị trường và rủi ro", title: "Chỉ số sợ hãi và tham lam tiền mã hóa và theo dõi tài sản", subtitle: "Chưa kết nối nguồn thị trường hoặc tâm lý có thể kiểm chứng; giá mô phỏng, chỉ số và khuyến nghị nền tảng được ẩn.", fearIndexTitle: "Chỉ số sợ hãi và tham lam tiền mã hóa", fearIndexStatus: "Không có dữ liệu", fearIndexValue: "—", marketAssets: [], signalAdvice: "Trạng thái dữ liệu: chưa có nguồn trực tiếp đã xác minh nên không hiển thị kết luận về thị trường hay nền tảng." },
  // l10n: needs native review
  ar: { eyebrow: "مراقبة معنويات السوق والمخاطر", title: "مؤشر الخوف والجشع للعملات المشفرة ومراقبة الأصول", subtitle: "لا يوجد مصدر سوق أو معنويات قابل للتحقق متصل حاليًا؛ الأسعار والمؤشرات المحاكاة وتوصيات المنصات مخفية.", fearIndexTitle: "مؤشر الخوف والجشع للعملات المشفرة", fearIndexStatus: "البيانات غير متاحة", fearIndexValue: "—", marketAssets: [], signalAdvice: "حالة البيانات: لا يوجد مصدر مباشر موثّق بعد، لذلك لا تُعرض استنتاجات عن السوق أو المنصات." },
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
