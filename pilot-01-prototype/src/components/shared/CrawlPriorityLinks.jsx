// "Related research" crawl index (home closing band, directory, rates, compare, tokenized pages). Its own lazy module
// since 2026-10-12 (build budget): SSR renders it eagerly; in the browser it sits in a Suspense boundary, so React keeps
// the server HTML until the chunk arrives (same pattern as ToolArticleLinks). Moved unchanged from App.jsx.
import React from "react";
import { ResearchComparisonCard } from "./ResearchComparisonCard.jsx";
import "./crawl-priority-layout.css";
import { localizedHref } from "../../data/locale-routing.js";
import { withoutTurkeyUnlisted } from "../../data/partner-geo-policy.js";

const crawlPriorityLinks = Object.freeze({
  // Root -> edition archive -> any archive page -> article stays within three clicks.
  // This lazy module carries native labels; no news library joins the home entry graph.
  editions: [
    ["en", "English"], ["zh-Hans", "简体中文"], ["zh-Hant", "繁體中文"],
    ["es", "Español"], ["pt-BR", "Português"], ["fr", "Français"],
    ["de", "Deutsch"], ["it", "Italiano"], ["ja", "日本語"], ["ko", "한국어"],
    ["tr", "Türkçe"], ["ru", "Русский"], ["id", "Bahasa Indonesia"],
    ["vi", "Tiếng Việt"], ["ar", "العربية"],
  ].map(([edition, label]) => [localizedHref("/news", { locale: edition }), label, edition]),
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
    ["/topics", "Topic research hubs"],
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
    ["/topics", copy.label],
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
    home: ["brazil", "compare", "tools", "tokenized", "editions"],
    directory: ["compare", "tools", "tokenized"],
    rates: ["compare", "tokenized"],
    // three groups like the directory, so the Related research grid keeps three columns (the fee benchmark is a real next step here)
    compare: ["compare", "tools", "tokenized"],
    tokenized: ["compare", "tools"],
  };
  const groups = (groupsByScope[scope] || groupsByScope.home)
    .filter((group) => group !== "brazil" || locale === "pt-BR" || locale === "en")
    .filter((group) => group !== "editions" || locale === "en");
  const navigationCopy = ({
    en: ["All comparisons", "More research"],
    "zh-Hans": ["全部比较", "更多研究"], "zh-Hant": ["全部比較", "更多研究"],
    "pt-BR": ["Todas as comparações", "Mais pesquisas"], es: ["Todas las comparaciones", "Más investigación"],
    fr: ["Toutes les comparaisons", "Plus de recherches"], de: ["Alle Vergleiche", "Weitere Analysen"],
    it: ["Tutti i confronti", "Altre ricerche"], ja: ["すべての比較", "その他のリサーチ"], ko: ["모든 비교", "더 많은 리서치"],
    tr: ["Tüm karşılaştırmalar", "Daha fazla araştırma"], ru: ["Все сравнения", "Другие исследования"],
    id: ["Semua perbandingan", "Riset lainnya"], vi: ["Tất cả so sánh", "Nghiên cứu khác"],
    ar: ["جميع المقارنات", "المزيد من الأبحاث"], ur: ["تمام موازنے", "مزید تحقیق"], uk: ["Усі порівняння", "Інші дослідження"],
  })[locale] || ["All comparisons", "More research"];
  const groupLinks = (group) => withoutTurkeyUnlisted([...crawlPriorityLinks[group], ...(group === "tools" && scope === "home" && locale === "en" ? [
    ["/coins", "Coin research"], ["/licenses", "Exchange licenses"], ["/convert/btc-to-usd", "Crypto converter"],
  ] : []), ...(group === "compare" && locale === "en" ? [
    ["/us", "US exchange research"], ["/id", "Indonesia exchange research"], ["/tw", "Taiwan exchange research"],
    ["/topics/bybit-alternatives", "Bybit alternatives"],
    ["/topics/brazil-crypto-exchange-deadline-2026", "Brazil exchange authorization deadline"],
  ] : [])], { locale }, ([href]) => href);
  const destination = (href, edition) => edition || href.startsWith("/br") ? href : localizedHref(href, { locale });
  const renderCard = ([href, label, edition], group) => {
    const pair = href.match(/^\/compare\/([a-z-]+)-vs-([a-z-]+)$/);
    if (pair && !edition) return <ResearchComparisonCard key={href} href={destination(href, edition)} pair={pair.slice(1)} label={labelOverrides.get(href) || label} />;
    return <a className={`research-library__card${pair ? " research-library__card--compare" : ""}${edition ? " research-library__chip" : ""}`}
      key={href} lang={edition} hrefLang={edition} href={destination(href, edition)}>
      {!edition ? <ResearchIcon kind={group} /> : null}
      <span className="research-library__card-label">{labelOverrides.get(href) || label}</span>
      {!edition && <span className="research-library__arrow" aria-hidden="true">↗</span>}
    </a>;
  };
  return <nav className="crawl-priority-links research-library v2-shell" data-crawl-priority-links={scope} aria-label={copy.label}>
    <header className="research-library__intro">
      <h2>{copy.label}</h2>
      <p>{copy.note}</p>
    </header>
    <div className="research-library__sections">
      {groups.map((group) => {
        const links = groupLinks(group);
        const comparisons = group === "compare" ? links.filter(([href]) => href.startsWith("/compare/")) : [];
        const featured = comparisons.slice(0, 6);
        const extra = links.filter((link) => !featured.includes(link));
        return <section className={`research-library__section research-library__section--${group}`} key={group}
          data-news-editions={group === "editions" ? "" : undefined}>
          <header className="research-library__heading">
            <h3><ResearchIcon kind={group} />{group === "editions" ? "News by language" : copy[group]}</h3>
            {group === "compare" && <a className="research-library__all" href={localizedHref("/compare", { locale })}>{navigationCopy[0]} <span aria-hidden="true">↗</span></a>}
          </header>
          {group === "compare" ? <>
            <div className="research-library__cards research-library__cards--compare">{featured.map((link) => renderCard(link, group))}</div>
            {extra.length > 0 && <details className="research-library__more">
              <summary>{navigationCopy[1]}<span aria-hidden="true">＋</span></summary>
              <div className="research-library__cards">{extra.map((link) => renderCard(link, group))}</div>
            </details>}
          </> : <div className={group === "editions" ? "research-library__languages" : "research-library__cards"}>{links.map((link) => renderCard(link, group))}</div>}
        </section>;
      })}
    </div>
  </nav>;
}

// Static SVGs stay in this existing lazy route module; no icon library or home-entry imports.
function ResearchIcon({ kind }) {
  const paths = {
    compare: "M4 7h14m-4-4 4 4-4 4M20 17H6m4-4-4 4 4 4",
    tools: "M4 19V9m8 10V5m8 14V12M2 9h4m4-4h4m4 7h4",
    tokenized: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
    brazil: "M3 7h18v12H3V7Zm0 4h18M7 15h4M8 3h8",
    editions: "M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Zm0 0h18M12 3c4 4 4 14 0 18-4-4-4-14 0-18Z",
  };
  return <svg className="research-library__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind] || paths.tools} /></svg>;
}

export default CrawlPriorityLinks;
