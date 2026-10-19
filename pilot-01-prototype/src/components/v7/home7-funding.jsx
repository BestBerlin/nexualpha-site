// Live funding-rate board (owner 2026-10-10). Data: FUNDING_PATH, refreshed by the server every 5 minutes from each
// exchange's public endpoint. Renders nothing until real data arrives; a venue that did not answer is not shown.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FUNDING_PATH, FUNDING_SYMBOLS, fundingTable, fundingSnapshot, isFundingSnapshot } from "../../data/funding-rates.js";
import { localizedHref } from "../../data/locale-routing.js";
import { formatSgt } from "../../data/local-time.js";
import { withoutTurkeyUnlistedVenueFeed } from "../../data/partner-geo-policy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { reduced } from "./home7-shared.jsx";
import { brandsBySlug } from "../../content/brand-manifest";
import { startJsonPolling } from "../shared/json-polling.js";
import { useClientNow } from "../data/useMarketEvents.js";

const COPY = {
  en: { h: "Live funding rates", sub: "Perpetual funding across six exchanges, refreshed every 5 minutes. Lower is cheaper for longs.", venue: "Exchange", rate: "Rate / period", apr: "Annualised", next: "Next funding", every: (h) => `every ${h}h`, note: "Positive: longs pay shorts. Negative: shorts pay longs. Annualised = rate × periods per year, for comparison only.", asOf: (d) => `Read from the exchanges' public APIs at ${d}` },
  "zh-Hans": { h: "实时资金费率", sub: "六家交易所永续合约资金费率，每 5 分钟更新。越低对多头越省钱。", venue: "交易所", rate: "每期费率", apr: "年化", next: "下次结算", every: (h) => `每 ${h} 小时`, note: "正数：多头付给空头；负数：空头付给多头。年化 = 每期费率 × 一年期数，仅用于横向比较。", asOf: (d) => `数据取自各交易所公开接口，${d}` },
  "zh-Hant": { h: "即時資金費率", sub: "六家交易所永續合約資金費率，每 5 分鐘更新。越低對多頭越省錢。", venue: "交易所", rate: "每期費率", apr: "年化", next: "下次結算", every: (h) => `每 ${h} 小時`, note: "正數：多頭付給空頭；負數：空頭付給多頭。年化 = 每期費率 × 一年期數，僅用於橫向比較。", asOf: (d) => `資料取自各交易所公開介面，${d}` },
  ja: { h: "リアルタイム資金調達率", sub: "6取引所の無期限先物の資金調達率。5分ごとに更新。低いほどロングに有利です。", venue: "取引所", rate: "1回あたり", apr: "年率換算", next: "次回", every: (h) => `${h}時間ごと`, note: "プラス：ロングがショートに支払い。マイナス：ショートがロングに支払い。年率換算は比較用です。", asOf: (d) => `各取引所の公開APIから取得：${d}` },
  ko: { h: "실시간 펀딩비", sub: "6개 거래소 무기한 선물 펀딩비, 5분마다 갱신. 낮을수록 롱에 유리합니다.", venue: "거래소", rate: "회당 펀딩비", apr: "연환산", next: "다음 정산", every: (h) => `${h}시간마다`, note: "양수: 롱이 숏에게 지급. 음수: 숏이 롱에게 지급. 연환산은 비교용입니다.", asOf: (d) => `각 거래소 공개 API 기준: ${d}` },
  tr: { h: "Canlı fonlama oranları", sub: "Altı borsada sürekli vadeli fonlama oranları, 5 dakikada bir güncellenir. Düşük olan long için daha ucuz.", venue: "Borsa", rate: "Dönem oranı", apr: "Yıllık", next: "Sonraki", every: (h) => `${h} saatte bir`, note: "Pozitif: long, short'a öder. Negatif: short, long'a öder. Yıllık değer yalnızca karşılaştırma içindir.", asOf: (d) => `Borsaların açık API'lerinden: ${d}` },
  es: { h: "Tasas de financiación en vivo", sub: "Financiación de perpetuos en seis exchanges, cada 5 minutos. Más baja = más barata para largos.", venue: "Exchange", rate: "Tasa / periodo", apr: "Anualizada", next: "Próximo pago", every: (h) => `cada ${h} h`, note: "Positiva: los largos pagan a los cortos. Negativa: los cortos pagan a los largos. La anualizada es solo para comparar.", asOf: (d) => `APIs públicas de los exchanges, ${d}` },
  "pt-BR": { h: "Taxas de financiamento ao vivo", sub: "Funding de perpétuos em seis corretoras, atualizado a cada 5 minutos. Mais baixo = mais barato para comprados.", venue: "Corretora", rate: "Taxa / período", apr: "Anualizada", next: "Próximo", every: (h) => `a cada ${h} h`, note: "Positiva: comprados pagam vendidos. Negativa: vendidos pagam comprados. A anualizada serve só para comparar.", asOf: (d) => `APIs públicas das corretoras, ${d}` },
  fr: { h: "Taux de financement en direct", sub: "Financement des perpétuels sur six plateformes, mis à jour toutes les 5 minutes. Plus bas = moins cher pour les acheteurs.", venue: "Plateforme", rate: "Taux / période", apr: "Annualisé", next: "Prochain", every: (h) => `toutes les ${h} h`, note: "Positif : les acheteurs paient les vendeurs. Négatif : l’inverse. L’annualisé sert uniquement à comparer.", asOf: (d) => `API publiques des plateformes, ${d}` },
  de: { h: "Live-Funding-Raten", sub: "Funding für Perpetuals an sechs Börsen, alle 5 Minuten aktualisiert. Niedriger = günstiger für Longs.", venue: "Börse", rate: "Rate / Periode", apr: "Annualisiert", next: "Nächste", every: (h) => `alle ${h} h`, note: "Positiv: Longs zahlen Shorts. Negativ: Shorts zahlen Longs. Annualisiert nur zum Vergleich.", asOf: (d) => `Öffentliche APIs der Börsen, ${d}` },
  ru: { h: "Ставки финансирования онлайн", sub: "Фандинг бессрочных фьючерсов на шести биржах, обновление каждые 5 минут. Ниже — дешевле для лонгов.", venue: "Биржа", rate: "За период", apr: "Годовых", next: "Следующее", every: (h) => `каждые ${h} ч`, note: "Плюс: лонги платят шортам. Минус: шорты платят лонгам. Годовая ставка — только для сравнения.", asOf: (d) => `Публичные API бирж, ${d}` },
  ar: { h: "معدلات التمويل المباشرة", sub: "معدلات تمويل العقود الدائمة في ست منصات، تُحدَّث كل 5 دقائق. الأقل أرخص للمراكز الطويلة.", venue: "المنصة", rate: "المعدل / الفترة", apr: "سنوي", next: "التسوية التالية", every: (h) => `كل ${h} ساعات`, note: "موجب: الطويل يدفع للقصير. سالب: القصير يدفع للطويل. السنوي للمقارنة فقط.", asOf: (d) => `من واجهات المنصات العامة، ${d}` },
  id: { h: "Funding rate langsung", sub: "Funding perpetual di enam bursa, diperbarui tiap 5 menit. Lebih rendah = lebih murah untuk posisi long.", venue: "Bursa", rate: "Rate / periode", apr: "Tahunan", next: "Berikutnya", every: (h) => `tiap ${h} jam`, note: "Positif: long membayar short. Negatif: short membayar long. Angka tahunan hanya untuk perbandingan.", asOf: (d) => `API publik bursa, ${d}` },
  vi: { h: "Funding rate trực tiếp", sub: "Funding hợp đồng vĩnh cửu trên sáu sàn, cập nhật mỗi 5 phút. Thấp hơn = rẻ hơn cho lệnh long.", venue: "Sàn", rate: "Mỗi kỳ", apr: "Quy năm", next: "Kỳ tới", every: (h) => `mỗi ${h} giờ`, note: "Dương: long trả cho short. Âm: short trả cho long. Quy năm chỉ để so sánh.", asOf: (d) => `API công khai của các sàn, ${d}` },
  it: { h: "Funding rate in tempo reale", sub: "Funding dei perpetui su sei exchange, aggiornato ogni 5 minuti. Più basso = più economico per i long.", venue: "Exchange", rate: "Tasso / periodo", apr: "Annualizzato", next: "Prossimo", every: (h) => `ogni ${h} h`, note: "Positivo: i long pagano gli short. Negativo: il contrario. L’annualizzato serve solo per confrontare.", asOf: (d) => `API pubbliche degli exchange, ${d}` },
  // l10n: needs native review
  ur: { h: "براہ راست فنڈنگ ریٹس", sub: "چھ ایکسچینجز پر پرپیچوئل فنڈنگ، ہر 5 منٹ بعد تازہ۔ لانگ پوزیشن کے لیے کم ریٹ سستا ہے۔", venue: "ایکسچینج", rate: "شرح / مدت", apr: "سالانہ", next: "اگلی فنڈنگ", every: (h) => `ہر ${h} گھنٹے`, note: "مثبت: لانگ شارٹ کو ادا کرتے ہیں۔ منفی: شارٹ لانگ کو ادا کرتے ہیں۔ سالانہ شرح صرف موازنے کے لیے ہے۔", asOf: (d) => `ایکسچینجز کی عوامی APIs سے، ${d}` },
  // l10n: needs native review
  uk: { h: "Поточні ставки фінансування", sub: "Фінансування безстрокових контрактів на шести біржах, оновлення кожні 5 хвилин. Нижча ставка дешевша для лонгів.", venue: "Біржа", rate: "Ставка / період", apr: "Річна", next: "Наступне", every: (h) => `кожні ${h} год`, note: "Плюс: лонги платять шортам. Мінус: шорти платять лонгам. Річна ставка лише для порівняння.", asOf: (d) => `Публічні API бірж, ${d}` },
};
const copyFor = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
const pct = (v, d) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v * 100).toFixed(d)}%`;
// Reduced motion: hh:mm, refreshed once a minute (no digits changing every second).
const countdown = (ms, seconds = true) => { if (!(ms > 0)) return "—"; const s = Math.floor(ms / 1000); const parts = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]; return (seconds ? parts : parts.slice(0, 2)).map((n) => String(n).padStart(2, "0")).join(":"); };

// SEO trust lane (2026-10-13): the board is server-seeded when prerender funding data exists. It hides until at least
// one selected symbol has a valid exchange row, so the home never ships an empty live table or placeholder dash rows.
function useFunding(initialFeed) {
  const [feed, setFeed] = useState(() => (initialFeed?.venues ? initialFeed : null));
  useEffect(() => {
    return startJsonPolling({
      request: FUNDING_PATH,
      intervalMs: 5 * 60 * 1000,
      cache: "no-cache",
      // An explicit unavailable snapshot must replace previously healthy rows.
      isData: isFundingSnapshot,
      onData: setFeed,
    });
  }, []);
  return feed;
}

function useTick(renderedAt) {
  const now = useClientNow();
  return now ?? (Number.isFinite(Date.parse(renderedAt)) ? Date.parse(renderedAt) : null);
}

const HEALTH = {
 en: ['Stale', 'Unavailable'], 'zh-Hans': ['数据过期', '暂不可用'], 'zh-Hant': ['資料過期', '暫不可用'], es: ['Desactualizado', 'No disponible'], 'pt-BR': ['Desatualizado', 'Indisponível'], fr: ['Périmé', 'Indisponible'], de: ['Veraltet', 'Nicht verfügbar'], it: ['Obsoleto', 'Non disponibile'], ja: ['更新遅延', '利用不可'], ko: ['오래된 데이터', '사용 불가'], ru: ['Устарело', 'Недоступно'], tr: ['Güncel değil', 'Kullanılamıyor'], id: ['Kedaluwarsa', 'Tidak tersedia'], vi: ['Đã cũ', 'Không khả dụng'], ar: ['بيانات قديمة', 'غير متاح'], ur: ['پرانا', 'دستیاب نہیں'], uk: ['Застаріло', 'Недоступно'],
};

function RateValue({ value, decimals }) {
  const ref = useRef(null), previous = useRef(value);
  useEffect(() => {
    const before = previous.current;
    previous.current = value;
    if (before === value) return;
    let stopped = false, cleanup;
    const run = () => import("./home7-board-motion.js").then(({ tweenValue }) => {
      if (!stopped && ref.current) cleanup = tweenValue(ref.current, before, value, n => pct(n, decimals));
    });
    const idle = typeof requestIdleCallback === "function";
    const id = idle ? requestIdleCallback(run) : setTimeout(run, 200);
    return () => { stopped = true; idle ? cancelIdleCallback(id) : clearTimeout(id); cleanup?.(); };
  }, [value, decimals]);
  return <span ref={ref}>{pct(value, decimals)}</span>;
}

export function FundingBoard({ locale, initialFeed }) {
  const t = copyFor(locale);
  // SSR has no media query. Adopt the reader preference only after hydration.
  const [showSeconds, setShowSeconds] = useState(true);
  useEffect(() => { setShowSeconds(!reduced()); }, []);
  const liveFeed = useFunding(initialFeed);
  const regionalFeed = useMemo(() => withoutTurkeyUnlistedVenueFeed(liveFeed, { locale }), [liveFeed, locale]);
  const now = useTick(initialFeed?.renderedAt || initialFeed?.generatedAt);
  const feed = useMemo(() => fundingSnapshot(regionalFeed, now), [regionalFeed, now]);
  const health = HEALTH[locale] || HEALTH.en;
  const availableSymbols = useMemo(() => (feed ? FUNDING_SYMBOLS.filter((s) => fundingTable(feed, s).length > 0) : []), [feed]);
  const [symbol, setSymbol] = useState("BTC");
  const selectedSymbol = availableSymbols.includes(symbol) ? symbol : availableSymbols[0];
  const rows = useMemo(() => (feed && selectedSymbol ? fundingTable(feed, selectedSymbol) : []), [feed, selectedSymbol]);
  if (!feed || (!selectedSymbol && feed.status !== "unavailable")) return null;
  const asOf = formatSgt(feed.lastSuccessAt || feed.generatedAt, locale);
  return (
    <section className="h7-in h7-fr" id="h7-funding" aria-labelledby="h7-fr-h">
      <div className="h7-ih"><h2 id="h7-fr-h">{t.h}</h2><p>{t.sub}</p></div>
      {feed.stale && <p role="status">{health[feed.status === "unavailable" ? 1 : 0]}</p>}
      {rows.length > 0 && <>
      <div className="h7-fr-tabs" role="tablist" aria-label={t.h}>
        {availableSymbols.map((s) => <button key={s} type="button" role="tab" aria-selected={s === selectedSymbol} className={s === selectedSymbol ? "on" : undefined} onClick={() => setSymbol(s)} translate="no">{s}</button>)}
      </div>
      <table className="h7-fr-table" aria-label={`${t.h} · ${selectedSymbol}`}>
        <thead><tr className="h7-fr-row h7-fr-head"><th scope="col">{t.venue}</th><th scope="col">{t.rate}</th><th scope="col">{t.apr}</th><th scope="col">{t.next}</th></tr></thead>
        <tbody>
        {rows.map((r, i) => (
          <tr key={r.venue} className={`h7-fr-row${i === 0 && !feed.stale ? " best" : ""}`}>
            <td><a className="h7-fr-v" href={localizedHref(`/exchanges/${r.venue}`, { locale })}><BrandMark slug={r.venue} compact /><span className="h7-fr-name">{brandsBySlug[r.venue]?.name || r.venue}<small>{r.stale ? `${health[0]} · ` : ""}{formatSgt(r.lastSuccessAt || r.readAt, locale)}</small></span></a></td>
            <td className="h7-fr-n" dir="ltr"><RateValue value={r.rate} decimals={4} /><span className="h7-rate-bar" aria-hidden="true"><i style={{ transform: `scaleX(${Math.min(1, Math.abs(r.rate) / Math.max(...rows.map(row => Math.abs(row.rate)), 0.000001))})` }} /></span><small>{t.every(r.intervalH)}</small></td>
            <td className={`h7-fr-n ${r.apr > 0 ? "pos" : r.apr < 0 ? "neg" : ""}`} dir="ltr"><RateValue value={r.apr} decimals={1} /></td>
            <td className="h7-fr-n h7-fr-cd" dir="ltr">{countdown(now === null ? null : Date.parse(r.nextAt) - now, showSeconds)}</td>
          </tr>
        ))}
        </tbody>
      </table>
      </>}
      <p className="h7-ia">{t.note}<br />{t.asOf(asOf)}</p>
    </section>
  );
}
