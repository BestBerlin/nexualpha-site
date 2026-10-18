// "Related research" crawl index (home closing band, directory, rates, compare, tokenized pages). Its own lazy module
// since 2026-10-12 (build budget): SSR renders it eagerly; in the browser it sits in a Suspense boundary, so React keeps
// the server HTML until the chunk arrives (same pattern as ToolArticleLinks). Moved unchanged from App.jsx.
import React from "react";
import "./crawl-priority-layout.css";
import { localizedHref } from "../../data/locale-routing.js";
import { withoutTurkeyUnlisted } from "../../data/partner-geo-policy.js";

const crawlPriorityLinks = Object.freeze({
  brazil: [
    ["/br/comparar", "Brazil platform comparison"],
    ["/br/conta", "Brazil account route"],
    ["/br/custos", "Brazil cost check"],
    ["/br/kyc-cpf", "Brazil KYC and CPF"],
    ["/br/pix", "Brazil Pix deposit route"],
    ["/br/saque-pix", "Brazil Pix withdrawal route"],
  ],
  compare: [
    ["/compare/binance-vs-kraken", "Binance vs Kraken"],
    ["/compare/binance-vs-mexc", "Binance vs MEXC"],
    ["/compare/binance-vs-okx", "Binance vs OKX"],
    ["/compare/bybit-vs-bitget", "Bybit vs Bitget"],
    ["/compare/hyperliquid-vs-dydx", "Hyperliquid vs dYdX"],
    ["/compare/okx-vs-bybit", "OKX vs Bybit"],
    ["/compare/okx-vs-mexc", "OKX vs MEXC"],
  ],
  tools: [
    ["/rates", "Exchange fee benchmark"],
  ],
  tokenized: [
    ["/topics/tokenized-assets", "Tokenized assets hub"],
    ["/topics/tokenized-stocks-vs-perpetuals", "Tokenized stocks vs perpetuals"],
    ["/topics/tokenized-treasuries", "Tokenized Treasuries checklist"],
  ],
});

export function CrawlPriorityLinks({ locale = "en", scope = "home" }) {
  const copy = ({
    "zh-Hans": { label: "相关研究", note: "继续比较地区、平台、费率与资产结构", brazil: "巴西决策", compare: "平台比较", tools: "费率工具", tokenized: "代币化资产" },
    "zh-Hant": { label: "相關研究", note: "繼續比較地區、平台、費率與資產結構", brazil: "巴西決策", compare: "平台比較", tools: "費率工具", tokenized: "代幣化資產" },
    "pt-BR": { label: "Pesquisas relacionadas", note: "Compare regiões, plataformas, taxas e estruturas de ativos", brazil: "Decisão Brasil", compare: "Comparações", tools: "Taxas", tokenized: "Ativos tokenizados" },
    es: { label: "Investigación relacionada", note: "Sigue comparando regiones, plataformas, comisiones y estructuras de activos", brazil: "Decisiones de Brasil", compare: "Comparaciones", tools: "Herramientas de comisiones", tokenized: "Activos tokenizados" },
    fr: { label: "Recherches associées", note: "Poursuivez la comparaison des régions, plateformes, frais et structures d’actifs", brazil: "Décisions Brésil", compare: "Comparaisons", tools: "Outils de frais", tokenized: "Actifs tokenisés" },
    de: { label: "Verwandte Analysen", note: "Vergleichen Sie Regionen, Plattformen, Gebühren und Asset-Strukturen weiter", brazil: "Brasilien-Entscheidungen", compare: "Vergleiche", tools: "Gebühren-Tools", tokenized: "Tokenisierte Assets" },
    ja: { label: "関連リサーチ", note: "地域、プラットフォーム、手数料、資産構造を続けて比較できます", brazil: "ブラジルの選択肢", compare: "比較", tools: "手数料ツール", tokenized: "トークン化資産" },
    ko: { label: "관련 리서치", note: "지역, 플랫폼, 수수료와 자산 구조를 계속 비교하세요", brazil: "브라질 선택지", compare: "비교", tools: "수수료 도구", tokenized: "토큰화 자산" },
    // l10n: needs native review
    ur: { label: "متعلقہ تحقیق", note: "علاقوں، پلیٹ فارم، فیس اور اثاثوں کی ساخت کا موازنہ جاری رکھیں", brazil: "برازیل کے راستے", compare: "موازنہ", tools: "فیس ٹولز", tokenized: "ٹوکنائزڈ اثاثے" },
    // l10n: needs native review
    uk: { label: "Пов’язані дослідження", note: "Продовжуйте порівнювати регіони, платформи, комісії та структури активів", brazil: "Маршрути Бразилії", compare: "Порівняння", tools: "Інструменти комісій", tokenized: "Токенізовані активи" },
    ar: { label: "أبحاث ذات صلة", note: "تابع مقارنة المناطق والمنصات والرسوم وهياكل الأصول", brazil: "خيارات البرازيل", compare: "المقارنات", tools: "أدوات الرسوم", tokenized: "الأصول المرمّزة" },
    tr: { label: "İlgili araştırmalar", note: "Bölgeleri, platformları, ücretleri ve varlık yapılarını karşılaştırmaya devam edin", brazil: "Brezilya seçenekleri", compare: "Karşılaştırmalar", tools: "Ücret araçları", tokenized: "Tokenleştirilmiş varlıklar" },
    ru: { label: "Связанные исследования", note: "Продолжайте сравнивать регионы, платформы, комиссии и структуры активов", brazil: "Решения для Бразилии", compare: "Сравнения", tools: "Инструменты комиссий", tokenized: "Токенизированные активы" },
    id: { label: "Riset terkait", note: "Lanjutkan perbandingan wilayah, platform, biaya, dan struktur aset", brazil: "Pilihan Brasil", compare: "Perbandingan", tools: "Alat biaya", tokenized: "Aset tertokenisasi" },
    vi: { label: "Nghiên cứu liên quan", note: "Tiếp tục so sánh khu vực, nền tảng, phí và cấu trúc tài sản", brazil: "Lựa chọn Brazil", compare: "So sánh", tools: "Công cụ phí", tokenized: "Tài sản mã hóa" },
    it: { label: "Ricerche correlate", note: "Continua a confrontare regioni, piattaforme, commissioni e strutture degli asset", brazil: "Scelte per il Brasile", compare: "Confronti", tools: "Strumenti commissioni", tokenized: "Asset tokenizzati" },
  })[locale] || { label: "Related research", note: "Continue across regions, platforms, fees and asset structures", brazil: "Brazil decisions", compare: "Comparisons", tools: "Fee tools", tokenized: "Tokenized assets" };
  const localizedLabels = {
    "zh-Hans": ["交易平台费率基准", "代币化资产中心", "代币化股票与永续合约", "代币化美债核对清单"],
    "zh-Hant": ["交易平台費率基準", "代幣化資產中心", "代幣化股票與永續合約", "代幣化美債核對清單"],
    "pt-BR": ["Comparador de taxas", "Central de ativos tokenizados", "Ações tokenizadas e perpétuos", "Checklist de títulos tokenizados"],
    es: ["Comparador de comisiones", "Centro de activos tokenizados", "Acciones tokenizadas y perpetuos", "Lista de bonos tokenizados"],
    fr: ["Comparateur de frais", "Centre des actifs tokenisés", "Actions tokenisées et perpétuels", "Liste des bons tokenisés"],
    de: ["Gebührenvergleich", "Zentrum für tokenisierte Vermögenswerte", "Tokenisierte Aktien und Perpetuals", "Prüfliste für tokenisierte Staatsanleihen"],
    ja: ["手数料比較", "トークン化資産ハブ", "トークン化株式と無期限先物", "トークン化国債チェックリスト"],
    ko: ["수수료 비교", "토큰화 자산 허브", "토큰화 주식과 무기한 선물", "토큰화 국채 점검표"],
    // l10n: needs native review
    ur: ["فیس موازنہ", "ٹوکنائزڈ اثاثوں کا مرکز", "ٹوکنائزڈ حصص اور پرپیچوئل", "ٹوکنائزڈ ٹریژری کی چیک لسٹ"],
    // l10n: needs native review
    uk: ["Порівняння комісій", "Центр токенізованих активів", "Токенізовані акції й безстрокові контракти", "Перевірки токенізованих казначейських облігацій"],
    ar: ["مقارنة الرسوم", "مركز الأصول المرمّزة", "الأسهم المرمّزة والعقود الدائمة", "قائمة تحقق للخزانة المرمّزة"],
    tr: ["Ücret karşılaştırması", "Tokenleştirilmiş varlık merkezi", "Tokenleştirilmiş hisseler ve sürekli vadeli işlemler", "Tokenleştirilmiş tahvil kontrol listesi"],
    ru: ["Сравнение комиссий", "Центр токенизированных активов", "Токенизированные акции и бессрочные контракты", "Проверка токенизированных казначейских бумаг"],
    id: ["Perbandingan biaya", "Pusat aset tertokenisasi", "Saham tertokenisasi dan kontrak perpetual", "Daftar periksa obligasi pemerintah tertokenisasi"],
    vi: ["So sánh phí", "Trung tâm tài sản mã hóa", "Cổ phiếu mã hóa và hợp đồng vĩnh cửu", "Danh sách kiểm tra trái phiếu kho bạc mã hóa"],
    it: ["Confronto commissioni", "Centro degli asset tokenizzati", "Azioni tokenizzate e perpetui", "Checklist dei titoli di Stato tokenizzati"],
  }[locale] || ["Exchange fee benchmark", "Tokenized assets hub", "Tokenized stocks vs perpetuals", "Tokenized Treasuries checklist"];
  const labelOverrides = new Map([
    ["/rates", localizedLabels[0]],
    ["/topics/tokenized-assets", localizedLabels[1]],
    ["/topics/tokenized-stocks-vs-perpetuals", localizedLabels[2]],
    ["/topics/tokenized-treasuries", localizedLabels[3]],
    ...(locale === "pt-BR" ? [
      ["/br/comparar", "Comparação de plataformas no Brasil"],
      ["/br/conta", "Rota de abertura de conta no Brasil"],
      ["/br/custos", "Verificação de custos no Brasil"],
      ["/br/kyc-cpf", "KYC e CPF no Brasil"],
      ["/br/pix", "Rota de depósito via Pix"],
      ["/br/saque-pix", "Rota de saque via Pix"],
    ] : []),
  ]);
  const groupsByScope = {
    home: ["brazil", "compare", "tools", "tokenized"],
    directory: ["compare", "tools", "tokenized"],
    rates: ["compare", "tokenized"],
    // three groups like the directory, so the Related research grid keeps three columns (the fee benchmark is a real next step here)
    compare: ["compare", "tools", "tokenized"],
    tokenized: ["compare", "tools"],
  };
  const groups = (groupsByScope[scope] || groupsByScope.home)
    .filter((group) => group !== "brazil" || locale === "pt-BR" || locale === "en");
  return <nav className="crawl-priority-links v2-shell" data-crawl-priority-links={scope} aria-label={copy.label}>
    <details className="crawl-priority-links__details" open>
      <summary className="crawl-priority-links__intro">
        <strong>{copy.label}</strong>
        <span>{copy.note}</span>
        <b aria-hidden="true">＋</b>
      </summary>
      <div className="crawl-priority-links__groups">
        {groups.map((group) => (
          <div className="crawl-priority-links__group" key={group}>
            <span>{copy[group]}</span>
            {withoutTurkeyUnlisted([...crawlPriorityLinks[group], ...(group === "compare" && locale === "en" ? [
              ["/us", "US exchange research"], ["/id", "Indonesia exchange research"], ["/tw", "Taiwan exchange research"],
              ["/topics/bybit-alternatives", "Bybit alternatives"],
              ["/topics/brazil-crypto-exchange-deadline-2026", "Brazil exchange authorization deadline"],
            ] : [])], { locale }, ([href]) => href).map(([href, label]) => (
              <a key={href} href={href.startsWith("/br") ? href : localizedHref(href, { locale })}>{labelOverrides.get(href) || label}</a>
            ))}
          </div>
        ))}
      </div>
    </details>
  </nav>;
}

export default CrawlPriorityLinks;
