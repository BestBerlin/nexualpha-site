import { localizedPath } from "./locale-routing.js";

export const LICENSE_PATH = "/licenses";
export const LICENSE_INDEX_LOCALES = Object.freeze(["en", "zh-Hans", "es", "pt-BR", "tr", "vi", "id", "ja", "ko", "fr", "de"]);

export const LICENSE_COUNTRIES = Object.freeze([
  Object.freeze({ slug: "turkey", code: "TR", name: "Türkiye" }),
  Object.freeze({ slug: "singapore", code: "SG", name: "Singapore" }),
  Object.freeze({ slug: "japan", code: "JP", name: "Japan" }),
]);

const SPK_OPERATING_SOURCE = "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi";
const SPK_LIQUIDATION_SOURCE = "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi";
const MAS_DPT_SOURCE = "https://eservices.mas.gov.sg/fid/institution?activity=Digital+Payment+Token+Service";
const FSA_JAPAN_SOURCE = "https://www.fsa.go.jp/en/regulated/licensed/en_kasoutuka.pdf";
const DATA_LICENSE_URL = "https://nexualpha.com/methodology#data-license";
const LAST_CHECKED = "2026-10-13";

const row = (entry) => Object.freeze({ lastChecked: LAST_CHECKED, ...entry });

const spkApplied = (exchange, entityName) => row({
  exchange,
  entityName,
  country: "TR",
  regulator: "SPK",
  type: "Temporary operating-list entry for crypto-asset service providers",
  status: "applied",
  statusNote: "SPK states that presence on the operating list does not mean the entity has been authorized under the relevant legislation.",
  sourceUrl: SPK_OPERATING_SOURCE,
});

export const licenseRecords = Object.freeze([
  spkApplied("binance", "Binance Turkey Kripto Varlık Alım Satım Platformu AŞ"),
  spkApplied("bybit", "Bybit Kripto Varlık Alım Satım Platformu AŞ"),
  spkApplied("gate-io", "Gate Kripto Varlık Alım Satım Platformu AŞ"),
  spkApplied("kucoin", "Kucoın TR Kripto Varlık Alım Satım Platformu AŞ"),
  spkApplied("mexc", "Mexc Kripto Varlık Alım Satım Platformu AŞ"),
  spkApplied("okx", "OKX TR Kripto Varlık Alım Satım Platformu AŞ"),
  row({
    exchange: "bitget",
    entityName: "Bitget Teknoloji AŞ",
    country: "TR",
    regulator: "SPK",
    type: "Temporary liquidation-list entry for crypto-asset service providers",
    status: "liquidation list",
    sourceUrl: SPK_LIQUIDATION_SOURCE,
  }),
  row({
    exchange: "coinbase",
    entityName: "COINBASE SINGAPORE PTE. LTD.",
    country: "SG",
    regulator: "MAS",
    type: "Major Payment Institution - Digital Payment Token Service",
    status: "licensed",
    sourceUrl: MAS_DPT_SOURCE,
  }),
  row({
    exchange: "hashkey",
    entityName: "HashKey Japan Co., Ltd.",
    country: "JP",
    regulator: "Japan FSA",
    type: "Crypto-asset Exchange Service Provider",
    number: "Director of the Kanto Finance Bureau No.00028",
    status: "registered",
    sourceUrl: FSA_JAPAN_SOURCE,
  }),
  row({
    exchange: "coinbase",
    entityName: "Coinbase Co., Ltd.",
    country: "JP",
    regulator: "Japan FSA",
    type: "Crypto-asset Exchange Service Provider",
    number: "Director of the Kanto Finance Bureau No.00029",
    status: "registered",
    sourceUrl: FSA_JAPAN_SOURCE,
  }),
  row({
    exchange: "binance",
    entityName: "Binance Japan Inc.",
    country: "JP",
    regulator: "Japan FSA",
    type: "Crypto-asset Exchange Service Provider",
    number: "Director of the Kanto Finance Bureau No.00032",
    status: "registered",
    sourceUrl: FSA_JAPAN_SOURCE,
  }),
]);

const STATUS_LABELS_EN = Object.freeze({
  licensed: "Licensed",
  registered: "Registered",
  applied: "Applied / listed, not authorised",
  restricted: "Restricted",
  banned: "Banned",
  "liquidation list": "Liquidation list",
});

const BASE_COPY = {
  en: {
    title: "Crypto exchange license directory",
    hubTitle: "Crypto exchange licenses and regulatory status",
    hubDescription: "Official-source directory of crypto exchange licence, registration, application and liquidation-list records by jurisdiction.",
    countryTitle: "Which crypto exchanges are licensed in {country}?",
    countryDescription: "Official register entries for crypto exchanges in {country}, with source links, status and last-checked dates.",
    hubAnswer: "This directory lists only exchange-by-jurisdiction records that NexuAlpha can tie to verified official registers. A listed or applied status is not treated as a licence.",
    countryAnswer: "For {country}, NexuAlpha currently records {count} exchange entries from {regulators}: {exchanges}. Licensed, registered, applied and liquidation-list statuses are separated because they do not mean the same thing.",
    exchange: "Exchange",
    country: "Country",
    entity: "Entity",
    regulator: "Regulator",
    type: "License or register type",
    status: "Status",
    source: "Official source",
    lastChecked: "Last checked",
    all: "All",
    open: "Open account",
    empty: "No official-source records match these filters.",
    question: "How to read this directory",
    answer: "A record means we found a specific exchange entity in an official register source. It does not replace the regulator page or the account screen shown during sign-up, and it does not prove product access, deposits, withdrawals, rebates or suitability.",
    statuses: STATUS_LABELS_EN,
  },
  "zh-Hans": {
    title: "交易所牌照目录",
    hubTitle: "加密交易所牌照与监管状态",
    hubDescription: "按司法辖区整理的官方来源交易所牌照、注册、申请与清算名单记录。",
    countryTitle: "{country} 有哪些加密交易所牌照记录？",
    countryDescription: "{country} 加密交易所官方登记记录，包含来源链接、状态和核验日期。",
    hubAnswer: "本目录只收录 NexuAlpha 能关联到既有已审核官方登记 URL 的交易所与司法辖区记录。列名或申请状态不会被写成持牌。",
    countryAnswer: "{country} 当前收录 {count} 条来自 {regulators} 的交易所记录：{exchanges}。持牌、登记、申请和清算名单状态必须分开阅读。",
    exchange: "交易所",
    country: "国家/地区",
    entity: "实体",
    regulator: "监管机构",
    type: "牌照或登记类型",
    status: "状态",
    source: "官方来源",
    lastChecked: "核验日期",
    all: "全部",
    open: "开户注册",
    empty: "没有符合筛选条件的官方来源记录。",
    question: "如何阅读本目录",
    answer: "一条记录只表示我们在官方登记来源中找到了具体交易所实体；它不能替代监管机构原页面或注册时的账户页面，也不证明产品、入出金、返佣或适当性。",
    statuses: { licensed: "持牌", registered: "已登记", applied: "已申请/列名，非授权", restricted: "受限", banned: "禁止", "liquidation list": "清算名单" },
  },
  es: {
    title: "Directorio de licencias de exchanges cripto",
    hubTitle: "Licencias y estado regulatorio de exchanges cripto",
    hubDescription: "Directorio con fuentes oficiales de licencias, registros, solicitudes y listas de liquidación por jurisdicción.",
    countryTitle: "¿Qué exchanges cripto están licenciados en {country}?",
    countryDescription: "Entradas oficiales de registro para exchanges cripto en {country}, con fuente, estado y fecha de revisión.",
    hubAnswer: "Este directorio solo lista registros que NexuAlpha puede vincular a URLs oficiales ya revisadas. Una lista o solicitud no se trata como licencia.",
    countryAnswer: "Para {country}, NexuAlpha registra {count} entradas de {regulators}: {exchanges}. Licenciado, registrado, solicitado y liquidación son estados separados.",
    exchange: "Exchange",
    country: "País",
    entity: "Entidad",
    regulator: "Regulador",
    type: "Tipo de licencia o registro",
    status: "Estado",
    source: "Fuente oficial",
    lastChecked: "Última revisión",
    all: "Todos",
    open: "Abrir cuenta",
    empty: "No hay registros oficiales para estos filtros.",
    question: "Cómo leer este directorio",
    answer: "Un registro significa que encontramos una entidad concreta en una fuente oficial. No sustituye la página del regulador ni la pantalla de cuenta, ni prueba acceso a productos, depósitos, retiradas, reembolsos o idoneidad.",
    statuses: { licensed: "Con licencia", registered: "Registrado", applied: "Solicitado / listado, no autorizado", restricted: "Restringido", banned: "Prohibido", "liquidation list": "Lista de liquidación" },
  },
  "pt-BR": {
    title: "Diretório de licenças de corretoras cripto",
    hubTitle: "Licenças e status regulatório de corretoras cripto",
    hubDescription: "Diretório com fontes oficiais de licenças, registros, pedidos e listas de liquidação por jurisdição.",
    countryTitle: "Quais corretoras cripto são licenciadas em {country}?",
    countryDescription: "Registros oficiais de corretoras cripto em {country}, com fonte, status e data de checagem.",
    hubAnswer: "Este diretório lista apenas registros que a NexuAlpha consegue ligar a URLs oficiais já revisadas. Lista ou pedido não é tratado como licença.",
    countryAnswer: "Para {country}, a NexuAlpha registra {count} entradas de {regulators}: {exchanges}. Licenciada, registrada, solicitada e liquidação são status separados.",
    exchange: "Corretora",
    country: "País",
    entity: "Entidade",
    regulator: "Regulador",
    type: "Tipo de licença ou registro",
    status: "Status",
    source: "Fonte oficial",
    lastChecked: "Última checagem",
    all: "Todos",
    open: "Abrir conta",
    empty: "Não há registros oficiais para estes filtros.",
    question: "Como ler este diretório",
    answer: "Um registro significa que encontramos uma entidade específica em fonte oficial. Ele não substitui a pagina do regulador nem a tela de conta, e não prova acesso a produtos, depósitos, saques, rebates ou adequação.",
    statuses: { licensed: "Licenciada", registered: "Registrada", applied: "Pedido/listada, não autorizada", restricted: "Restrita", banned: "Proibida", "liquidation list": "Lista de liquidação" },
  },
  tr: {
    title: "Kripto borsa lisans dizini",
    hubTitle: "Kripto borsa lisansları ve düzenleyici durum",
    hubDescription: "Yetki alanına göre resmi kaynaklı lisans, kayıt, başvuru ve tasfiye listesi kayıtları.",
    countryTitle: "{country} için hangi kripto borsaları lisanslı?",
    countryDescription: "{country} için resmi kaynaklı borsa kayıtları, durum ve son kontrol tarihi.",
    hubAnswer: "Bu dizin yalnızca NexuAlpha'nın mevcut incelenmiş verilerindeki resmi kayıt URL'lerine bağlayabildiği kayıtları listeler. Liste veya başvuru lisans olarak yazılmaz.",
    countryAnswer: "{country} için NexuAlpha {regulators} kaynaklarından {count} borsa kaydı tutuyor: {exchanges}. Lisanslı, kayıtlı, başvuruda ve tasfiye listesi durumları ayrıdır.",
    exchange: "Borsa",
    country: "Ülke",
    entity: "Şirket",
    regulator: "Düzenleyici",
    type: "Lisans veya kayıt türü",
    status: "Durum",
    source: "Resmi kaynak",
    lastChecked: "Son kontrol",
    all: "Tümü",
    open: "Hesap aç",
    empty: "Bu filtrelerle eşleşen resmi kaynaklı kayıt yok.",
    question: "Bu dizin nasıl okunmalı?",
    answer: "Bir kayıt, belirli bir borsa şirketini resmi bir kaynakta bulduğumuz anlamına gelir. Düzenleyicinin sayfasının veya hesap ekranının yerine geçmez; ürün, para yatırma, çekme, indirim veya uygunluk kanıtı değildir.",
    statuses: { licensed: "Lisanslı", registered: "Kayıtlı", applied: "Başvuruda/listede, yetki değil", restricted: "Kısıtlı", banned: "Yasaklı", "liquidation list": "Tasfiye listesi" },
  },
  vi: {
    title: "Danh bạ giấy phép sàn giao dịch tiền mã hóa",
    hubTitle: "Giấy phép và tình trạng quản lý sàn giao dịch tiền mã hóa",
    hubDescription: "Danh bạ nguồn chính thức về giấy phép, đăng ký, hồ sơ đăng ký và danh sách thanh lý theo khu vực.",
    countryTitle: "Sàn giao dịch tiền mã hóa nào được cấp phép tại {country}?",
    countryDescription: "Hồ sơ chính thức cho sàn giao dịch tại {country}, kèm nguồn, trạng thái và ngày kiểm tra.",
    hubAnswer: "Danh bạ chỉ liệt kê hồ sơ có nguồn đăng ký chính thức đã được kiểm tra. Việc có tên trong danh sách hoặc nộp đơn không được xem là giấy phép.",
    countryAnswer: "Tại {country}, NexuAlpha ghi nhận {count} hồ sơ từ {regulators}: {exchanges}. Cấp phép, đăng ký, nộp đơn và thanh lý là các trạng thái riêng biệt.",
    exchange: "Sàn giao dịch", country: "Quốc gia", entity: "Pháp nhân", regulator: "Cơ quan quản lý",
    type: "Loại giấy phép hoặc đăng ký", status: "Trạng thái", source: "Nguồn chính thức", lastChecked: "Kiểm tra lần cuối",
    all: "Tất cả", open: "Mở tài khoản", empty: "Không có hồ sơ từ nguồn chính thức phù hợp với bộ lọc.",
    question: "Cách đọc danh bạ này",
    answer: "Mỗi hồ sơ ghi nhận một pháp nhân cụ thể trong nguồn chính thức. Giấy phép, đăng ký, đơn đăng ký và danh sách thanh lý có ý nghĩa khác nhau.",
    statuses: { licensed: "Được cấp phép", registered: "Đã đăng ký", applied: "Đã nộp đơn/có tên trong danh sách, chưa cấp phép", restricted: "Bị hạn chế", banned: "Bị cấm", "liquidation list": "Danh sách thanh lý" },
  },
  id: {
    title: "Direktori lisensi bursa kripto",
    hubTitle: "Lisensi dan status regulator bursa kripto",
    hubDescription: "Direktori sumber resmi untuk lisensi, registrasi, pengajuan, dan daftar likuidasi menurut yurisdiksi.",
    countryTitle: "Bursa kripto mana yang berlisensi di {country}?",
    countryDescription: "Entri register resmi untuk bursa kripto di {country}, dengan sumber, status, dan tanggal cek.",
    hubAnswer: "Direktori ini hanya mencantumkan catatan yang dapat dihubungkan NexuAlpha ke URL register resmi yang sudah ditinjau. Tercantum atau mengajukan tidak dianggap sebagai lisensi.",
    countryAnswer: "Untuk {country}, NexuAlpha mencatat {count} entri dari {regulators}: {exchanges}. Berlisensi, terdaftar, mengajukan, dan daftar likuidasi adalah status yang berbeda.",
    exchange: "Bursa",
    country: "Negara",
    entity: "Entitas",
    regulator: "Regulator",
    type: "Jenis lisensi atau registrasi",
    status: "Status",
    source: "Sumber resmi",
    lastChecked: "Terakhir dicek",
    all: "Semua",
    open: "Buka akun",
    empty: "Tidak ada catatan sumber resmi untuk filter ini.",
    question: "Cara membaca direktori ini",
    answer: "Satu catatan berarti kami menemukan entitas tertentu dalam sumber resmi. Ini tidak menggantikan halaman regulator atau layar akun, dan tidak membuktikan akses produk, deposit, penarikan, rebate, atau kesesuaian.",
    statuses: { licensed: "Berlisensi", registered: "Terdaftar", applied: "Mengajukan/tercantum, bukan izin", restricted: "Dibatasi", banned: "Dilarang", "liquidation list": "Daftar likuidasi" },
  },
  ja: {
    title: "暗号資産交換業者ライセンス・登録ディレクトリ",
    hubTitle: "暗号資産交換業者のライセンスと規制状況",
    hubDescription: "公式ソースに基づくライセンス、登録、申請、清算リストの国別ディレクトリ。",
    countryTitle: "{country} でライセンスを持つ暗号資産交換業者は?",
    countryDescription: "{country} の暗号資産交換業者に関する公式登録行、ソース、状態、確認日。",
    hubAnswer: "このディレクトリは、NexuAlpha が既存のレビュー済み公式登録 URL に結び付けられる記録だけを掲載します。掲載や申請はライセンスとして扱いません。",
    countryAnswer: "{country} について、NexuAlpha は {regulators} から {count} 件を記録しています: {exchanges}。ライセンス、登録、申請、清算リストは別の状態です。",
    exchange: "取引所",
    country: "国・地域",
    entity: "法人",
    regulator: "監督機関",
    type: "ライセンスまたは登録種別",
    status: "状態",
    source: "公式ソース",
    lastChecked: "確認日",
    all: "すべて",
    open: "口座を開く",
    empty: "この条件に一致する公式ソース記録はありません。",
    question: "このディレクトリの読み方",
    answer: "記録は、特定の法人を公式ソースで確認したことを意味します。監督機関ページや口座画面の代替ではなく、商品アクセス、入出金、リベート、適合性を証明しません。",
    statuses: { licensed: "ライセンス取得", registered: "登録済み", applied: "申請/掲載、認可ではない", restricted: "制限あり", banned: "禁止", "liquidation list": "清算リスト" },
  },
  ko: {
    title: "암호화폐 거래소 라이선스 및 등록 디렉터리",
    hubTitle: "암호화폐 거래소 라이선스와 규제 상태",
    hubDescription: "공식 출처 기반의 라이선스, 등록, 신청, 청산 목록 국가별 디렉터리.",
    countryTitle: "{country}에서 라이선스를 보유한 암호화폐 거래소는?",
    countryDescription: "{country}의 암호화폐 거래소 공식 등록 행, 출처, 상태, 확인일.",
    hubAnswer: "이 디렉터리는 NexuAlpha가 기존 검토된 공식 등록 URL에 연결할 수 있는 기록만 나열합니다. 등재나 신청은 라이선스로 취급하지 않습니다.",
    countryAnswer: "{country}에 대해 NexuAlpha는 {regulators}에서 {count}건을 기록합니다: {exchanges}. 라이선스, 등록, 신청, 청산 목록은 서로 다른 상태입니다.",
    exchange: "거래소",
    country: "국가",
    entity: "법인",
    regulator: "감독기관",
    type: "라이선스 또는 등록 유형",
    status: "상태",
    source: "공식 출처",
    lastChecked: "최종 확인",
    all: "전체",
    open: "계정 열기",
    empty: "이 필터와 일치하는 공식 출처 기록이 없습니다.",
    question: "이 디렉터리 읽는 법",
    answer: "기록은 특정 법인을 공식 출처에서 찾았다는 뜻입니다. 감독기관 페이지나 계정 화면을 대체하지 않으며 상품 접근, 입출금, 리베이트, 적합성을 증명하지 않습니다.",
    statuses: { licensed: "라이선스 보유", registered: "등록됨", applied: "신청/등재, 인가 아님", restricted: "제한", banned: "금지", "liquidation list": "청산 목록" },
  },
  fr: {
    title: "Répertoire des licences de plateformes crypto",
    hubTitle: "Licences et statut réglementaire des plateformes crypto",
    hubDescription: "Répertoire par juridiction des licences, enregistrements, demandes et listes de liquidation de sources officielles.",
    countryTitle: "Quelles plateformes crypto sont agréées en {country} ?",
    countryDescription: "Entrées officielles pour les plateformes crypto en {country}, avec source, statut et date de vérification.",
    hubAnswer: "Ce répertoire ne liste que les enregistrements reliés à des URLs officielles déjà examinées par NexuAlpha. Une inscription ou demande n'est pas une licence.",
    countryAnswer: "Pour {country}, NexuAlpha enregistre {count} entrées de {regulators}: {exchanges}. Licence, enregistrement, demande et liquidation sont des statuts séparés.",
    exchange: "Plateforme",
    country: "Pays",
    entity: "Entité",
    regulator: "Régulateur",
    type: "Type de licence ou registre",
    status: "Statut",
    source: "Source officielle",
    lastChecked: "Dernière vérification",
    all: "Tous",
    open: "Ouvrir un compte",
    empty: "Aucune source officielle ne correspond à ces filtres.",
    question: "Comment lire ce répertoire",
    answer: "Un enregistrement signifie que nous avons trouvé une entité précise dans une source officielle. Il ne remplace pas la page du régulateur ni l’écran du compte, et ne prouve pas l’accès aux produits, dépôts, retraits, rebates ou l’adéquation.",
    statuses: { licensed: "Agréé", registered: "Enregistré", applied: "Demande/liste, non autorisé", restricted: "Restreint", banned: "Interdit", "liquidation list": "Liste de liquidation" },
  },
  de: {
    title: "Lizenzverzeichnis für Kryptoborsen",
    hubTitle: "Kryptoborsen-Lizenzen und regulatorischer Status",
    hubDescription: "Offiziell belegtes Verzeichnis von Lizenzen, Registrierungen, Anträgen und Liquidationslisten nach Land.",
    countryTitle: "Welche Kryptoborsen sind in {country} lizenziert?",
    countryDescription: "Offizielle Registereinträge für Kryptoborsen in {country}, mit Quelle, Status und Prüfdatum.",
    hubAnswer: "Dieses Verzeichnis listet nur Einträge, die NexuAlpha mit bereits geprüften offiziellen Register-URLs verbinden kann. Listung oder Antrag wird nicht als Lizenz behandelt.",
    countryAnswer: "Für {country} erfasst NexuAlpha {count} Einträge von {regulators}: {exchanges}. Lizenz, Registrierung, Antrag und Liquidationsliste sind getrennte Status.",
    exchange: "Börse",
    country: "Land",
    entity: "Gesellschaft",
    regulator: "Aufsicht",
    type: "Lizenz- oder Registertyp",
    status: "Status",
    source: "Offizielle Quelle",
    lastChecked: "Zuletzt geprüft",
    all: "Alle",
    open: "Konto öffnen",
    empty: "Keine offiziellen Registereinträge fur diese Filter.",
    question: "So liest man dieses Verzeichnis",
    answer: "Ein Eintrag bedeutet, dass wir eine bestimmte Gesellschaft in einer offiziellen Quelle gefunden haben. Er ersetzt weder Aufsichtsseite noch Kontoanzeige und beweist keinen Produktzugang, keine Einzahlungen, Auszahlungen, Rabatte oder Eignung.",
    statuses: { licensed: "Lizenziert", registered: "Registriert", applied: "Beantragt/gelistet, keine Zulassung", restricted: "Beschränkt", banned: "Verboten", "liquidation list": "Liquidationsliste" },
  },
};

for (const locale of LICENSE_INDEX_LOCALES) {
  if (!BASE_COPY[locale]) BASE_COPY[locale] = BASE_COPY.en;
}

const COPY = Object.freeze(Object.fromEntries(Object.entries(BASE_COPY).map(([locale, value]) => [locale, Object.freeze(value)])));

export function licenseCopy(locale = "en") {
  return COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
}

export const licensePath = (countrySlug) => countrySlug ? `${LICENSE_PATH}/${countrySlug}` : LICENSE_PATH;

export function licenseCountry(countrySlug) {
  const value = String(countrySlug || "").toLowerCase();
  return LICENSE_COUNTRIES.find((country) => country.slug === value || country.code.toLowerCase() === value) || null;
}

export function licenseRecordsForCountry(countrySlug) {
  const country = licenseCountry(countrySlug);
  return country ? licenseRecords.filter((record) => record.country === country.code) : [];
}

export function licenseCountryName(countrySlug, locale = "en") {
  const country = licenseCountry(countrySlug);
  if (!country) return "";
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(country.code) || country.name;
  } catch {
    return country.name;
  }
}

export function fillLicense(template, vars = {}) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (_match, key) => (vars[key] ?? ""));
}

function countryVars(countrySlug, locale) {
  const records = countrySlug ? licenseRecordsForCountry(countrySlug) : licenseRecords;
  const exchanges = [...new Set(records.map((record) => record.exchange.toUpperCase()))].join(", ");
  const regulators = [...new Set(records.map((record) => record.regulator))].join(", ");
  return {
    country: countrySlug ? licenseCountryName(countrySlug, locale) : "all jurisdictions",
    count: records.length,
    exchanges,
    regulators,
  };
}

export function licenseTitle(countrySlug, locale = "en") {
  const t = licenseCopy(locale);
  return fillLicense(countrySlug ? t.countryTitle : t.hubTitle, countryVars(countrySlug, locale));
}

export function licenseAnswer(countrySlug, locale = "en") {
  const t = licenseCopy(locale);
  const summary = fillLicense(countrySlug ? t.countryAnswer : t.hubAnswer, countryVars(countrySlug, locale));
  if (!countrySlug) return summary;
  const records = licenseRecordsForCountry(countrySlug);
  const groups = [...new Set(records.map(record => record.status))].map(status =>
    `${t.statuses[status]}: ${records.filter(record => record.status === status).map(record => record.exchange.toUpperCase()).join(", ")}`
  );
  return `${summary} ${groups.join("; ")}.`;
}

export function licenseSourceUrls(countrySlug) {
  const records = countrySlug ? licenseRecordsForCountry(countrySlug) : licenseRecords;
  return [...new Set(records.map((record) => record.sourceUrl).filter(Boolean))];
}

export function licenseLastmod(countrySlug) {
  const records = countrySlug ? licenseRecordsForCountry(countrySlug) : licenseRecords;
  return records.map((record) => record.lastChecked).filter(Boolean).sort().pop() || LAST_CHECKED;
}

export function licenseSchemas(countrySlug, locale = "en", url) {
  const t = licenseCopy(locale);
  const title = licenseTitle(countrySlug, locale);
  const answer = licenseAnswer(countrySlug, locale);
  const sourceUrls = licenseSourceUrls(countrySlug);
  const pageUrl = url || `https://nexualpha.com${localizedPath(licensePath(countrySlug), locale)}`;
  const records = countrySlug ? licenseRecordsForCountry(countrySlug) : licenseRecords;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "@id": `${pageUrl}#dataset`,
      name: title,
      description: `${countrySlug ? t.countryDescription.replace("{country}", licenseCountryName(countrySlug, locale)) : t.hubDescription} Source-bound dataset; not account approval, product access, deposit or withdrawal availability, user-benefit eligibility, suitability or legal advice.`,
      url: pageUrl,
      inLanguage: locale,
      dateModified: licenseLastmod(countrySlug),
      license: DATA_LICENSE_URL,
      creator: { "@type": "Organization", name: "NexuAlpha", url: "https://nexualpha.com" },
      isBasedOn: sourceUrls,
      measurementTechnique: "Manual extraction from official regulator register pages already present in NexuAlpha reviewed source data.",
      variableMeasured: ["exchange", "entityName", "country", "regulator", "type", "number", "status", "sourceUrl", "lastChecked"],
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: records.length,
        itemListElement: records.map((record, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${record.exchange.toUpperCase()} ${record.country} ${record.regulator}`,
          url: record.sourceUrl,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: [
        {
          "@type": "Question",
          name: title,
          acceptedAnswer: { "@type": "Answer", text: answer, citation: sourceUrls },
        },
        {
          "@type": "Question",
          name: t.question,
          acceptedAnswer: { "@type": "Answer", text: t.answer, citation: sourceUrls },
        },
      ],
    },
  ];
}
