import { FACTBOOK_REGISTRY, FACTBOOK_SLUGS } from "./factbook-registry.js";
import { feeFact, discountFact, factsForVenue, feePair } from "./exchange-facts.js";
import { TOPIC_GUIDES, TOPIC_SLUGS } from "./topic-guides-data.js";

export const TOPIC_HUB_PATH = "/topics";
export const FACTBOOK_HUB_PATH = "/factbook";

export function topicHubItems(locale = "en") {
  const isZh = String(locale).startsWith("zh");
  return TOPIC_SLUGS.map((slug) => {
    const topic = TOPIC_GUIDES[slug];
    return {
      slug,
      href: `/topics/${slug}`,
      title: isZh ? topic.metaTitleZh : topic.metaTitleEn,
      description: isZh ? topic.descZh : topic.descEn,
      name: isZh ? (locale === "zh-Hant" && topic.categoryZhHant ? topic.categoryZhHant : topic.categoryZh) : topic.categoryEn,
      updatedOn: /^\d{4}-\d{2}-\d{2}$/.test(String(topic.lastUpdated || "")) ? topic.lastUpdated : null,
      count: Array.isArray(topic.platforms) ? topic.platforms.length : 0,
    };
  });
}

// Each row says what its record actually holds, from exchange-facts.js (the one fee source): the checked
// spot / perpetual base fees, the token discount, and how many of the two fee fields are checked, with the date.
function factbookRowFacts(slug, name, isZh) {
  const spot = feeFact(slug, "spot");
  const perp = feeFact(slug, "perp");
  const checked = [spot, perp].filter((f) => f.state === "checked");
  const date = checked.map((f) => f.checkedOn).filter(Boolean).sort().at(-1) || null;
  const token = factsForVenue(slug)?.discount?.token || null;
  const spotOff = discountFact(slug, "spot");
  const fee = (f) => (f.state === "checked" ? feePair(f.maker, f.taker) : null);
  if (isZh) {
    const parts = [
      fee(spot) ? `现货 ${fee(spot)}（挂单 / 吃单）` : "现货费率尚未核对",
      fee(perp) ? `永续 ${fee(perp)}` : "永续费率尚未核对",
    ];
    if (token && spotOff != null) parts.push(`用 ${token} 支付现货手续费可减 ${spotOff}%`);
    return {
      checkedOn: date, checkedFields: checked.length,
      description: `${parts.join("；")}。`,
      meta: date ? `费率核对 ${date} · ${checked.length}/2 个费率字段` : "费率尚未核对 · 0/2 个费率字段",
    };
  }
  const parts = [
    fee(spot) ? `spot ${fee(spot)} (maker / taker)` : "spot fees not yet checked",
    fee(perp) ? `perpetual ${fee(perp)}` : "perpetual fees not yet checked",
  ];
  if (token && spotOff != null) parts.push(`${spotOff}% off spot fees paid in ${token}`);
  return {
    checkedOn: date, checkedFields: checked.length,
    description: `${name}: ${parts.join("; ")}.`,
    meta: date ? `Fees checked ${date} · ${checked.length}/2 fee fields` : "Fees not yet checked · 0/2 fee fields",
  };
}

export function factbookHubItems(locale = "en") {
  const isZh = String(locale).startsWith("zh");
  return FACTBOOK_SLUGS.map((slug) => {
    const venue = FACTBOOK_REGISTRY[slug];
    const facts = factbookRowFacts(slug, venue.name, isZh);
    return {
      slug,
      href: `/factbook/${slug}`,
      title: `${venue.name} Factbook`,
      description: facts.description,
      meta: facts.meta,
      checkedOn: facts.checkedOn,
      checkedFields: facts.checkedFields,
      category: venue.category,
      officialDomain: venue.officialDomain,
    };
  });
}

// Hub copy (editorial templates 2026-10-11): headings, intro and index labels exist in all 15 locales. Record titles
// and descriptions below the headings stay in their reviewed language (English, or Chinese for zh) and are marked so.
const HUB_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
const FACTBOOK_HUB_COPY = {
  en: { title: "Source Review Factbook", description: "A platform-level collection of published source records, fee fields, account conditions, official domains and verification limits. Each detail page remains a dated research record.", itemLabel: "Factbook records", primaryCta: "Start with Binance source record", secondaryCta: "Browse platform directory", cardCta: "Open fact record" },
  "zh-Hans": { title: "来源审阅事实库", description: "按平台聚合公开来源、费率字段、账户条件、官方域名与核验边界。每个详情页仍需回到来源日期和官方流程确认。", itemLabel: "平台事实库", primaryCta: "先看 Binance 来源事实库", secondaryCta: "查看平台黄页", cardCta: "打开事实记录" },
  "zh-Hant": { title: "來源審閱事實庫", description: "按平台彙整公開來源、費率欄位、帳戶條件、官方網域與核驗邊界。每個詳情頁仍需回到來源日期和官方流程確認。", itemLabel: "平台事實庫", primaryCta: "先看 Binance 來源事實庫", secondaryCta: "查看平台黃頁", cardCta: "打開事實記錄" },
  es: { title: "Factbook de fuentes revisadas", description: "Registros por plataforma de fuentes publicadas, campos de comisiones, condiciones de cuenta, dominios oficiales y límites de verificación, cada uno con fecha.", itemLabel: "Registros del factbook", primaryCta: "Empezar por el registro de Binance", secondaryCta: "Ver el directorio de plataformas", cardCta: "Abrir registro" },
  "pt-BR": { title: "Factbook de fontes revisadas", description: "Registros por plataforma de fontes publicadas, campos de taxas, condições de conta, domínios oficiais e limites de verificação, cada um com data.", itemLabel: "Registros do factbook", primaryCta: "Começar pelo registro da Binance", secondaryCta: "Ver o diretório de plataformas", cardCta: "Abrir registro" },
  fr: { title: "Factbook des sources vérifiées", description: "Fiches par plateforme : sources publiées, champs de frais, conditions de compte, domaines officiels et limites de vérification, chacune datée.", itemLabel: "Fiches du factbook", primaryCta: "Commencer par la fiche Binance", secondaryCta: "Voir l’annuaire des plateformes", cardCta: "Ouvrir la fiche" },
  de: { title: "Factbook geprüfter Quellen", description: "Datensätze je Plattform: veröffentlichte Quellen, Gebührenfelder, Kontobedingungen, offizielle Domains und Prüfgrenzen, jeweils mit Datum.", itemLabel: "Factbook-Einträge", primaryCta: "Mit dem Binance-Eintrag beginnen", secondaryCta: "Plattformverzeichnis ansehen", cardCta: "Eintrag öffnen" },
  it: { title: "Factbook delle fonti verificate", description: "Schede per piattaforma: fonti pubblicate, campi commissioni, condizioni del conto, domini ufficiali e limiti di verifica, ognuna con data.", itemLabel: "Schede del factbook", primaryCta: "Inizia dalla scheda Binance", secondaryCta: "Vedi l’elenco delle piattaforme", cardCta: "Apri la scheda" },
  ja: { title: "出典確認ファクトブック", description: "公開ソース、手数料項目、口座条件、公式ドメイン、確認範囲をプラットフォーム別に日付付きで整理した記録集です。", itemLabel: "ファクトブック記録", primaryCta: "Binance の記録から見る", secondaryCta: "プラットフォーム一覧を見る", cardCta: "記録を開く" },
  ko: { title: "출처 검토 팩트북", description: "공개 출처, 수수료 항목, 계정 조건, 공식 도메인과 검증 범위를 플랫폼별로 날짜와 함께 정리한 기록입니다.", itemLabel: "팩트북 기록", primaryCta: "Binance 기록부터 보기", secondaryCta: "플랫폼 목록 보기", cardCta: "기록 열기" },
  ru: { title: "Справочник проверенных источников", description: "Записи по площадкам: опубликованные источники, поля комиссий, условия аккаунта, официальные домены и границы проверки, каждая с датой.", itemLabel: "Записи справочника", primaryCta: "Начать с записи Binance", secondaryCta: "Каталог площадок", cardCta: "Открыть запись" },
  tr: { title: "Kaynak İnceleme Bilgi Kitabı", description: "Platform bazında yayımlanmış kaynaklar, ücret alanları, hesap koşulları, resmi alan adları ve doğrulama sınırları; her kayıt tarihli.", itemLabel: "Bilgi kitabı kayıtları", primaryCta: "Binance kaydıyla başlayın", secondaryCta: "Platform dizinine göz atın", cardCta: "Kaydı aç" },
  id: { title: "Factbook Sumber Tertinjau", description: "Catatan per platform: sumber terbitan, kolom biaya, syarat akun, domain resmi dan batas verifikasi, masing-masing bertanggal.", itemLabel: "Catatan factbook", primaryCta: "Mulai dari catatan Binance", secondaryCta: "Lihat direktori platform", cardCta: "Buka catatan" },
  vi: { title: "Sổ dữ kiện nguồn đã rà soát", description: "Hồ sơ theo nền tảng: nguồn đã công bố, trường phí, điều kiện tài khoản, tên miền chính thức và giới hạn xác minh, mỗi hồ sơ có ngày.", itemLabel: "Hồ sơ dữ kiện", primaryCta: "Bắt đầu với hồ sơ Binance", secondaryCta: "Xem danh bạ nền tảng", cardCta: "Mở hồ sơ" },
  ar: { title: "سجل الحقائق المراجَعة المصادر", description: "سجلات لكل منصة: المصادر المنشورة وحقول الرسوم وشروط الحساب والنطاقات الرسمية وحدود التحقق، وكل سجل مؤرخ.", itemLabel: "سجلات الحقائق", primaryCta: "ابدأ بسجل Binance", secondaryCta: "تصفح دليل المنصات", cardCta: "افتح السجل" },
};
const TOPIC_HUB_COPY = {
  en: { title: "Topic Research Hubs", description: "A collection of trading-topic research paths covering platform comparisons, fee checks, regional conditions, on-chain risks and source records.", itemLabel: "Topic guides", primaryCta: "Start with derivatives decision path", secondaryCta: "Open fee calculator", cardCta: "Open research path" },
  "zh-Hans": { title: "主题研究聚合页", description: "按交易主题聚合平台比较、费用核验、地区条件、链上风险与来源记录。先选主题，再进入详情核对具体平台。", itemLabel: "主题研究", primaryCta: "先看衍生品决策路径", secondaryCta: "查看费用计算器", cardCta: "打开研究路径" },
  "zh-Hant": { title: "主題研究彙整頁", description: "按交易主題彙整平台比較、費用核驗、地區條件、鏈上風險與來源記錄。先選主題，再進入詳情核對具體平台。", itemLabel: "主題研究", primaryCta: "先看衍生品決策路徑", secondaryCta: "查看費用計算器", cardCta: "打開研究路徑" },
  es: { title: "Guías de investigación por tema", description: "Rutas de investigación por tema de trading: comparativas de plataformas, comisiones, condiciones regionales, riesgos on-chain y registros de fuentes.", itemLabel: "Guías temáticas", primaryCta: "Empezar por derivados", secondaryCta: "Abrir la calculadora de comisiones", cardCta: "Abrir la guía" },
  "pt-BR": { title: "Guias de pesquisa por tema", description: "Rotas de pesquisa por tema de trading: comparações de plataformas, taxas, condições regionais, riscos on-chain e registros de fontes.", itemLabel: "Guias temáticos", primaryCta: "Começar por derivativos", secondaryCta: "Abrir a calculadora de taxas", cardCta: "Abrir o guia" },
  fr: { title: "Dossiers de recherche par thème", description: "Parcours de recherche par thème : comparaisons de plateformes, frais, conditions régionales, risques on-chain et sources.", itemLabel: "Dossiers thématiques", primaryCta: "Commencer par les dérivés", secondaryCta: "Ouvrir le calculateur de frais", cardCta: "Ouvrir le dossier" },
  de: { title: "Themen-Recherchen", description: "Recherchepfade nach Handelsthema: Plattformvergleiche, Gebührenprüfungen, regionale Bedingungen, On-Chain-Risiken und Quellen.", itemLabel: "Themenleitfäden", primaryCta: "Mit Derivaten beginnen", secondaryCta: "Gebührenrechner öffnen", cardCta: "Leitfaden öffnen" },
  it: { title: "Ricerche per tema", description: "Percorsi di ricerca per tema di trading: confronti tra piattaforme, commissioni, condizioni regionali, rischi on-chain e fonti.", itemLabel: "Guide tematiche", primaryCta: "Inizia dai derivati", secondaryCta: "Apri il calcolatore commissioni", cardCta: "Apri la guida" },
  ja: { title: "テーマ別リサーチ", description: "プラットフォーム比較、手数料確認、地域条件、オンチェーンのリスク、出典記録を取引テーマごとにまとめた調査ルートです。", itemLabel: "テーマガイド", primaryCta: "デリバティブから始める", secondaryCta: "手数料計算ツールを開く", cardCta: "ガイドを開く" },
  ko: { title: "주제별 리서치", description: "플랫폼 비교, 수수료 확인, 지역 조건, 온체인 위험과 출처 기록을 거래 주제별로 정리한 리서치 경로입니다.", itemLabel: "주제 가이드", primaryCta: "파생상품부터 보기", secondaryCta: "수수료 계산기 열기", cardCta: "가이드 열기" },
  ru: { title: "Исследования по темам", description: "Маршруты исследований по торговым темам: сравнения площадок, комиссии, региональные условия, ончейн-риски и источники.", itemLabel: "Тематические гиды", primaryCta: "Начать с деривативов", secondaryCta: "Открыть калькулятор комиссий", cardCta: "Открыть гид" },
  tr: { title: "Konu bazlı araştırmalar", description: "İşlem konularına göre araştırma yolları: platform karşılaştırmaları, ücret kontrolleri, bölgesel koşullar, zincir üstü riskler ve kaynaklar.", itemLabel: "Konu rehberleri", primaryCta: "Türevlerle başlayın", secondaryCta: "Ücret hesaplayıcısını aç", cardCta: "Rehberi aç" },
  id: { title: "Riset per topik", description: "Jalur riset per topik trading: perbandingan platform, pemeriksaan biaya, syarat regional, risiko on-chain dan catatan sumber.", itemLabel: "Panduan topik", primaryCta: "Mulai dari derivatif", secondaryCta: "Buka kalkulator biaya", cardCta: "Buka panduan" },
  vi: { title: "Nghiên cứu theo chủ đề", description: "Lộ trình nghiên cứu theo chủ đề giao dịch: so sánh nền tảng, kiểm tra phí, điều kiện khu vực, rủi ro on-chain và nguồn.", itemLabel: "Hướng dẫn chủ đề", primaryCta: "Bắt đầu với phái sinh", secondaryCta: "Mở công cụ tính phí", cardCta: "Mở hướng dẫn" },
  ar: { title: "أبحاث حسب الموضوع", description: "مسارات بحث حسب موضوع التداول: مقارنات المنصات وفحص الرسوم والشروط الإقليمية ومخاطر السلسلة وسجلات المصادر.", itemLabel: "أدلة المواضيع", primaryCta: "ابدأ بالمشتقات", secondaryCta: "افتح حاسبة الرسوم", cardCta: "افتح الدليل" },
};
// Index labels for the editorial hub layout (featured row, grouped sections, counts, review dates).
const HUB_INDEX_COPY = {
  en: { featured: "Featured", index: "Index", updated: "Updated", reviewed: "Fees checked", notChecked: "Fees not yet checked", fields: (n) => `${n}/2 fee fields`, platforms: (n) => `${n} platforms`, records: (n) => `${n} records`, groups: { CEX: ["Centralized exchanges", "Custodial accounts: fee schedules, KYC and official domains."], "Perp DEX": ["Perpetual DEXs", "Wallet-connected perpetuals: protocol fees, funding and settlement."], DEX: ["Spot DEXs", "Swap protocols: pool fees, routing and contract addresses."] } },
  "zh-Hans": { featured: "精选", index: "索引", updated: "更新于", reviewed: "费率核对", notChecked: "费率尚未核对", fields: (n) => `${n}/2 个费率字段`, platforms: (n) => `${n} 个平台`, records: (n) => `${n} 条记录`, groups: { CEX: ["中心化交易所", "托管账户：费率表、KYC 与官方域名。"], "Perp DEX": ["永续合约 DEX", "钱包直连永续：协议费、资金费率与结算。"], DEX: ["现货 DEX", "兑换协议：池子费率、路由与合约地址。"] } },
  "zh-Hant": { featured: "精選", index: "索引", updated: "更新於", reviewed: "費率核對", notChecked: "費率尚未核對", fields: (n) => `${n}/2 個費率欄位`, platforms: (n) => `${n} 個平台`, records: (n) => `${n} 筆記錄`, groups: { CEX: ["中心化交易所", "託管帳戶：費率表、KYC 與官方網域。"], "Perp DEX": ["永續合約 DEX", "錢包直連永續：協議費、資金費率與結算。"], DEX: ["現貨 DEX", "兌換協議：池子費率、路由與合約地址。"] } },
  es: { featured: "Destacado", index: "Índice", updated: "Actualizado", reviewed: "Comisiones revisadas", notChecked: "Comisiones aún sin revisar", fields: (n) => `${n}/2 campos de comisión`, platforms: (n) => `${n} plataformas`, records: (n) => `${n} registros`, groups: { CEX: ["Exchanges centralizados", "Cuentas custodiadas: comisiones, KYC y dominios oficiales."], "Perp DEX": ["DEX de perpetuos", "Perpetuos con wallet: comisiones del protocolo, funding y liquidación."], DEX: ["DEX spot", "Protocolos de swap: comisiones de pool, rutas y contratos."] } },
  "pt-BR": { featured: "Destaque", index: "Índice", updated: "Atualizado", reviewed: "Taxas conferidas", notChecked: "Taxas ainda não conferidas", fields: (n) => `${n}/2 campos de taxa`, platforms: (n) => `${n} plataformas`, records: (n) => `${n} registros`, groups: { CEX: ["Corretoras centralizadas", "Contas custodiadas: tabelas de taxas, KYC e domínios oficiais."], "Perp DEX": ["DEX de perpétuos", "Perpétuos via carteira: taxas do protocolo, funding e liquidação."], DEX: ["DEX spot", "Protocolos de swap: taxas de pool, rotas e contratos."] } },
  fr: { featured: "À la une", index: "Index", updated: "Mis à jour", reviewed: "Frais vérifiés", notChecked: "Frais pas encore vérifiés", fields: (n) => `${n}/2 champs de frais`, platforms: (n) => `${n} plateformes`, records: (n) => `${n} fiches`, groups: { CEX: ["Exchanges centralisés", "Comptes conservés : grilles de frais, KYC et domaines officiels."], "Perp DEX": ["DEX de perpétuels", "Perpétuels via wallet : frais du protocole, funding et règlement."], DEX: ["DEX spot", "Protocoles d’échange : frais de pool, routage et contrats."] } },
  de: { featured: "Empfohlen", index: "Verzeichnis", updated: "Aktualisiert", reviewed: "Gebühren geprüft", notChecked: "Gebühren noch nicht geprüft", fields: (n) => `${n}/2 Gebührenfelder`, platforms: (n) => `${n} Plattformen`, records: (n) => `${n} Einträge`, groups: { CEX: ["Zentrale Börsen", "Verwahrkonten: Gebührentabellen, KYC und offizielle Domains."], "Perp DEX": ["Perpetual-DEXs", "Perpetuals per Wallet: Protokollgebühren, Funding und Abwicklung."], DEX: ["Spot-DEXs", "Swap-Protokolle: Pool-Gebühren, Routing und Verträge."] } },
  it: { featured: "In evidenza", index: "Indice", updated: "Aggiornato", reviewed: "Commissioni verificate", notChecked: "Commissioni non ancora verificate", fields: (n) => `${n}/2 campi commissione`, platforms: (n) => `${n} piattaforme`, records: (n) => `${n} schede`, groups: { CEX: ["Exchange centralizzati", "Conti in custodia: tabelle commissioni, KYC e domini ufficiali."], "Perp DEX": ["DEX di perpetui", "Perpetui via wallet: commissioni del protocollo, funding e regolamento."], DEX: ["DEX spot", "Protocolli di swap: commissioni dei pool, routing e contratti."] } },
  ja: { featured: "注目", index: "索引", updated: "更新", reviewed: "手数料確認", notChecked: "手数料は未確認", fields: (n) => `手数料項目 ${n}/2`, platforms: (n) => `${n} プラットフォーム`, records: (n) => `${n} 件`, groups: { CEX: ["中央集権型取引所", "カストディ口座：手数料表、KYC、公式ドメイン。"], "Perp DEX": ["無期限先物 DEX", "ウォレット接続の無期限先物：プロトコル手数料、資金調達率、決済。"], DEX: ["現物 DEX", "スワッププロトコル：プール手数料、ルーティング、コントラクト。"] } },
  ko: { featured: "추천", index: "색인", updated: "업데이트", reviewed: "수수료 확인", notChecked: "수수료 미확인", fields: (n) => `수수료 항목 ${n}/2`, platforms: (n) => `플랫폼 ${n}곳`, records: (n) => `기록 ${n}건`, groups: { CEX: ["중앙화 거래소", "수탁 계정: 수수료표, KYC, 공식 도메인."], "Perp DEX": ["무기한 선물 DEX", "지갑 연결 무기한 선물: 프로토콜 수수료, 펀딩, 정산."], DEX: ["현물 DEX", "스왑 프로토콜: 풀 수수료, 라우팅, 컨트랙트."] } },
  ru: { featured: "Главное", index: "Указатель", updated: "Обновлено", reviewed: "Комиссии проверены", notChecked: "Комиссии ещё не проверены", fields: (n) => `полей комиссий: ${n}/2`, platforms: (n) => `площадок: ${n}`, records: (n) => `записей: ${n}`, groups: { CEX: ["Централизованные биржи", "Кастодиальные аккаунты: комиссии, KYC и официальные домены."], "Perp DEX": ["Perp DEX", "Бессрочные контракты через кошелёк: комиссии протокола, фандинг и расчёты."], DEX: ["Спотовые DEX", "Протоколы обмена: комиссии пулов, маршрутизация и контракты."] } },
  tr: { featured: "Öne çıkan", index: "Dizin", updated: "Güncellendi", reviewed: "Ücretler kontrol edildi", notChecked: "Ücretler henüz kontrol edilmedi", fields: (n) => `${n}/2 ücret alanı`, platforms: (n) => `${n} platform`, records: (n) => `${n} kayıt`, groups: { CEX: ["Merkezi borsalar", "Saklamalı hesaplar: ücret tabloları, KYC ve resmi alan adları."], "Perp DEX": ["Vadeli DEX'ler", "Cüzdanla vadeli işlemler: protokol ücretleri, fonlama ve takas."], DEX: ["Spot DEX'ler", "Takas protokolleri: havuz ücretleri, yönlendirme ve sözleşmeler."] } },
  id: { featured: "Unggulan", index: "Indeks", updated: "Diperbarui", reviewed: "Biaya diperiksa", notChecked: "Biaya belum diperiksa", fields: (n) => `${n}/2 kolom biaya`, platforms: (n) => `${n} platform`, records: (n) => `${n} catatan`, groups: { CEX: ["Bursa terpusat", "Akun kustodian: tabel biaya, KYC dan domain resmi."], "Perp DEX": ["DEX perpetual", "Perpetual lewat dompet: biaya protokol, funding dan penyelesaian."], DEX: ["DEX spot", "Protokol swap: biaya pool, rute dan kontrak."] } },
  vi: { featured: "Nổi bật", index: "Mục lục", updated: "Cập nhật", reviewed: "Đã kiểm tra phí", notChecked: "Chưa kiểm tra phí", fields: (n) => `${n}/2 trường phí`, platforms: (n) => `${n} nền tảng`, records: (n) => `${n} hồ sơ`, groups: { CEX: ["Sàn tập trung", "Tài khoản lưu ký: biểu phí, KYC và tên miền chính thức."], "Perp DEX": ["DEX hợp đồng vĩnh cửu", "Hợp đồng vĩnh cửu qua ví: phí giao thức, funding và thanh toán."], DEX: ["DEX giao ngay", "Giao thức hoán đổi: phí pool, định tuyến và hợp đồng."] } },
  ar: { featured: "مختارات", index: "الفهرس", updated: "تاريخ التحديث", reviewed: "تم فحص الرسوم", notChecked: "لم تُفحص الرسوم بعد", fields: (n) => `${n}/2 من حقول الرسوم`, platforms: (n) => `${n} منصات`, records: (n) => `${n} سجلًا`, groups: { CEX: ["البورصات المركزية", "حسابات الحفظ: جداول الرسوم والتحقق من الهوية والنطاقات الرسمية."], "Perp DEX": ["منصات العقود الدائمة اللامركزية", "عقود دائمة عبر المحفظة: رسوم البروتوكول والتمويل والتسوية."], DEX: ["منصات التبادل الفوري اللامركزية", "بروتوكولات المبادلة: رسوم المجمعات والتوجيه والعقود."] } },
};
export const COLLECTION_HUB_LOCALES = Object.freeze(HUB_LOCALES);
function hubLocale(locale) {
  const value = String(locale || "en");
  if (HUB_LOCALES.includes(value)) return value;
  if (/^zh-(hant|tw|hk)/i.test(value)) return "zh-Hant";
  if (value.startsWith("zh")) return "zh-Hans";
  if (/^pt/i.test(value)) return "pt-BR";
  const base = value.split("-")[0];
  return HUB_LOCALES.includes(base) ? base : "en";
}
export function collectionHubIndexCopy(locale = "en") {
  return HUB_INDEX_COPY[hubLocale(locale)];
}
export function collectionHubCopy(kind, locale = "en") {
  const code = hubLocale(locale);
  if (kind === "factbook") {
    return { eyebrow: "FACTBOOK COLLECTION", ...FACTBOOK_HUB_COPY[code], primaryHref: "/factbook/binance", secondaryHref: "/exchanges" };
  }
  return { eyebrow: "TOPIC COLLECTION", ...TOPIC_HUB_COPY[code], primaryHref: "/topics/derivatives", secondaryHref: "/rates" };
}
