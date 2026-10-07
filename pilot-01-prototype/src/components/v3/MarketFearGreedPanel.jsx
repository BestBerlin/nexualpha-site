/**
 * MarketFearGreedPanel — B3. 行情与恐慌贪婪情绪面板
 */
import React from "react";
import "./market-fear-greed-panel.css";

const copy = {
  "zh-Hans": {
    eyebrow: "MARKET SENTIMENT & RISK MONITOR",
    title: "市场恐慌贪婪指数与主流资产风向",
    subtitle: "当前候选包未连接可验证的行情与情绪源；不展示模拟价格、指数或平台建议。",
    fearIndexTitle: "今日恐慌与贪婪指数",
    fearIndexStatus: "数据不可用",
    fearIndexValue: "—",
    marketAssets: [],
    signalAdvice: "数据状态：不可用。接入验证源后再发布行情和情绪结论。",
  },
  "zh-Hant": {
    eyebrow: "MARKET SENTIMENT & RISK MONITOR",
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
};

export function MarketFearGreedPanel({ locale = "en" }) {
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const t = copy[locale] || copy[String(locale || "").split("-")[0]] || (isHant ? copy["zh-Hant"] : isZh ? copy["zh-Hans"] : copy.en);

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
