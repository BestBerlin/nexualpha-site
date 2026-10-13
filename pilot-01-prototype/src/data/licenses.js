import { researchRecords, licenseResearch } from "./licenses-research.js";
import { countryEditorial } from "./licenses-editorial.js";
import { localizedPath } from "./locale-routing.js";
import { venueDisplayName } from "./venue-display-names.js";

export { venueDisplayName };

export const LICENSE_PATH = "/licenses";
export const LICENSE_INDEX_LOCALES = Object.freeze(["en", "zh-Hans", "es", "pt-BR", "tr", "vi", "id", "ja", "ko", "fr", "de", "ar", "ur", "uk"]);

export const LICENSE_COUNTRIES = Object.freeze([
  Object.freeze({ slug: "turkey", code: "TR", name: "Türkiye" }),
  Object.freeze({ slug: "singapore", code: "SG", name: "Singapore" }),
  Object.freeze({ slug: "japan", code: "JP", name: "Japan" }),
  Object.freeze({ slug: "united-arab-emirates", code: "AE", name: "United Arab Emirates" }),
  Object.freeze({ slug: "france", code: "FR", name: "France" }),
  Object.freeze({ slug: "germany", code: "DE", name: "Germany" }),
  Object.freeze({ slug: "cyprus", code: "CY", name: "Cyprus" }),
  Object.freeze({ slug: "malta", code: "MT", name: "Malta" }),
  Object.freeze({ slug: "austria", code: "AT", name: "Austria" }),
  Object.freeze({ slug: "ireland", code: "IE", name: "Ireland" }),
  Object.freeze({ slug: "luxembourg", code: "LU", name: "Luxembourg" }),
  Object.freeze({ slug: "philippines", code: "PH", name: "Philippines" }),
  Object.freeze({ slug: "brazil", code: "BR", name: "Brazil" }),
  Object.freeze({ slug: "nigeria", code: "NG", name: "Nigeria" }),
  Object.freeze({ slug: "indonesia", code: "ID", name: "Indonesia" }),
  Object.freeze({ slug: "vietnam", code: "VN", name: "Vietnam" }),
  Object.freeze({ slug: "india", code: "IN", name: "India" }),
  Object.freeze({ slug: "south-korea", code: "KR", name: "South Korea" }),
  Object.freeze({ slug: "thailand", code: "TH", name: "Thailand" }),
  Object.freeze({ slug: "mexico", code: "MX", name: "Mexico" }),
  Object.freeze({ slug: "argentina", code: "AR", name: "Argentina" }),
  Object.freeze({ slug: "pakistan", code: "PK", name: "Pakistan" }),
  Object.freeze({ slug: "ukraine", code: "UA", name: "Ukraine" }),
  Object.freeze({ slug: "hong-kong", code: "HK", name: "Hong Kong" }),
  Object.freeze({ slug: "european-union", code: "EU", name: "European Union" }),
  Object.freeze({ slug: "united-kingdom", code: "GB", name: "United Kingdom" }),
  Object.freeze({ slug: "australia", code: "AU", name: "Australia" }),
  Object.freeze({ slug: "canada", code: "CA", name: "Canada" }),
]);

const SPK_OPERATING_SOURCE = "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi";
const SPK_LIQUIDATION_SOURCE = "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi";
const MAS_DPT_SOURCE = "https://eservices.mas.gov.sg/fid/institution?activity=Digital+Payment+Token+Service";
const FSA_JAPAN_SOURCE = "https://www.fsa.go.jp/en/regulated/licensed/en_kasoutuka.pdf";
const ESMA_CASP_SOURCE = "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv";
const VARA_REGISTER_SOURCE = "https://www.vara.ae/en/licenses-and-register/public-register/";
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

const legacyRecords = [
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
    number: "Director of the Kanto Finance Bureau No.00027",
    status: "registered",
    sourceUrl: FSA_JAPAN_SOURCE,
  }),
  row({
    exchange: "coinbase",
    entityName: "Coinbase Co., Ltd.",
    country: "JP",
    regulator: "Japan FSA",
    type: "Crypto-asset Exchange Service Provider",
    number: "Director of the Kanto Finance Bureau No.00028",
    status: "registered",
    sourceUrl: FSA_JAPAN_SOURCE,
  }),
  row({
    exchange: "binance",
    entityName: "Binance Japan Inc.",
    country: "JP",
    regulator: "Japan FSA",
    type: "Crypto-asset Exchange Service Provider",
    number: "Director of the Kanto Finance Bureau No.00031",
    status: "registered",
    sourceUrl: FSA_JAPAN_SOURCE,
  }),
  // Added 2026-10-13: each row read directly from the official register named in sourceUrl; `evidence` records what
  // the register showed. Numbers appear only when the register prints one.
  row({
    exchange: "okx",
    entityName: "OKCoin Japan K.K.",
    country: "JP",
    regulator: "Japan FSA",
    type: "Crypto-asset Exchange Service Provider",
    number: "Director of the Kanto Finance Bureau No.00020",
    status: "registered",
    sourceUrl: FSA_JAPAN_SOURCE,
    evidence: "Japan FSA list (as of 1 September 2026) shows OKCoin Japan K.K. as a registered crypto-asset exchange service provider.",
  }),
  row({
    exchange: "okx",
    entityName: "OKX SG PTE. LTD.",
    country: "SG",
    regulator: "MAS",
    type: "Major Payment Institution - Digital Payment Token Service",
    status: "licensed",
    sourceUrl: "https://eservices.mas.gov.sg/fid/institution/detail/422854-OKX-SG-PTE-LTD",
    evidence: "MAS Financial Institutions Directory lists OKX SG PTE. LTD. as a Major Payment Institution with Digital Payment Token Service.",
  }),
  row({
    exchange: "okx",
    entityName: "OKX Middle East Fintech FZE",
    country: "AE",
    regulator: "Dubai VARA",
    type: "VASP Licence (Exchange, Broker-Dealer, Lending and Borrowing, Management and Investment)",
    number: "VL/23/12/003",
    status: "licensed",
    sourceUrl: VARA_REGISTER_SOURCE,
    evidence: "VARA public register: VASP Licence VL/23/12/003, issued 2024-09-17, status Active.",
  }),
  row({
    exchange: "binance",
    entityName: "Binance FZE",
    country: "AE",
    regulator: "Dubai VARA",
    type: "VASP Licence (Exchange, Broker-Dealer, Lending and Borrowing, Management and Investment)",
    number: "VL/24/04/001",
    status: "licensed",
    sourceUrl: VARA_REGISTER_SOURCE,
    evidence: "VARA public register: VASP Licence VL/24/04/001, issued 2024-04-15, status Active.",
  }),
  row({
    exchange: "kraken",
    entityName: "Payward FZCO",
    country: "AE",
    regulator: "Dubai VARA",
    type: "VASP Licence (Broker-Dealer, Management and Investment)",
    number: "VL/26/10/002",
    status: "licensed",
    sourceUrl: VARA_REGISTER_SOURCE,
    evidence: "VARA public register: VASP Licence VL/26/10/002, issued 2026-10-06, status Active.",
  }),
  row({
    exchange: "bybit",
    entityName: "Bybit EU GmbH",
    country: "FR",
    regulator: "AMF",
    type: "MiCA CASP (PSCA) - passported authorisation",
    status: "licensed",
    sourceUrl: "https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-blanches/psca/bybit-eu-gmbh",
    evidence: "AMF white list: PSCA 'Agréé MICA' via passport from 2025-05-28; home authority FMA (Austria).",
  }),
  row({
    exchange: "coinbase",
    entityName: "Coinbase Luxembourg S.A.",
    country: "FR",
    regulator: "AMF",
    type: "MiCA CASP (PSCA) - passported authorisation",
    status: "licensed",
    sourceUrl: "https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-blanches/psca/coinbase-luxembourg-sa",
    evidence: "AMF white list: PSCA 'Agréé MICA' via passport from 2025-06-20; home authority CSSF (Luxembourg).",
  }),
  row({
    exchange: "kraken",
    entityName: "Payward Europe Solutions Limited (Kraken Digital Asset Exchange)",
    country: "FR",
    regulator: "AMF",
    type: "MiCA CASP (PSCA) - passported authorisation",
    status: "licensed",
    sourceUrl: "https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-blanches/psca/payward-europe-solutions-limited-kraken-digital-asset-exchange-kraken",
    evidence: "AMF white list: PSCA 'Agréé MICA' via passport from 2025-06-25; home authority Central Bank of Ireland.",
  }),
  row({
    exchange: "bybit",
    entityName: "Bybit EU GmbH",
    country: "DE",
    regulator: "BaFin",
    type: "Cross-border MiCA CASP services (Art. 65 MiCA)",
    status: "licensed",
    sourceUrl: "https://portal.mvp.bafin.de/database/InstInfo/institutDetails.do?cmd=loadInstitutAction&institutId=164511",
    evidence: "BaFin company database (BaFin-ID 10164511) lists incoming MiCA services from 2025-05-28; supervised in Austria.",
  }),
  row({
    exchange: "coinbase",
    entityName: "Coinbase Financial Services Europe Ltd",
    country: "CY",
    regulator: "CySEC",
    type: "Cyprus Investment Firm (MiFID investment services)",
    number: "374/19",
    status: "licensed",
    sourceUrl: "https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/84044/",
    evidence: "CySEC Investment Firms register: licence 374/19 dated 2019-04-15.",
  }),
  row({
    exchange: "kraken",
    entityName: "Payward Europe Digital Solutions (CY) Limited",
    country: "CY",
    regulator: "CySEC",
    type: "Cyprus Investment Firm (MiFID investment services)",
    number: "342/17",
    status: "licensed",
    sourceUrl: "https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/45914/",
    evidence: "CySEC Investment Firms register: licence 342/17 dated 2017-11-13 (formerly I.F. Greenfields Wealth Ltd).",
  }),
  row({
    exchange: "okx",
    entityName: "OKX Europe Limited",
    country: "MT",
    regulator: "MFSA",
    type: "MiCA CASP authorisation",
    status: "licensed",
    sourceUrl: ESMA_CASP_SOURCE,
    evidence: "ESMA interim MiCA CASP register: authorised 2025-01-27 by the Malta Financial Services Authority (LEI 54930069NLWEIGLHXU42).",
  }),
  row({
    exchange: "bybit",
    entityName: "Bybit EU GmbH",
    country: "AT",
    regulator: "FMA",
    type: "MiCA CASP authorisation",
    status: "licensed",
    sourceUrl: ESMA_CASP_SOURCE,
    evidence: "ESMA interim MiCA CASP register: authorised 2025-05-28 by the Austrian FMA (LEI 5299005V5GBSN2A4C303).",
  }),
  row({
    exchange: "kraken",
    entityName: "Payward Europe Solutions Limited",
    country: "IE",
    regulator: "Central Bank of Ireland",
    type: "MiCA CASP authorisation",
    status: "licensed",
    sourceUrl: ESMA_CASP_SOURCE,
    evidence: "ESMA interim MiCA CASP register: authorised 2025-06-25 by the Central Bank of Ireland (LEI 254900641D8KNHUZYX24).",
  }),
  row({
    exchange: "kraken",
    entityName: "Payward Global Solutions Limited",
    country: "IE",
    regulator: "Central Bank of Ireland",
    type: "MiCA CASP authorisation (operation of a trading platform)",
    status: "licensed",
    sourceUrl: ESMA_CASP_SOURCE,
    evidence: "ESMA interim MiCA CASP register: authorised 2025-06-25 by the Central Bank of Ireland (LEI 9845003D98SCC2851458).",
  }),
  row({
    exchange: "coinbase",
    entityName: "Coinbase Luxembourg S.A.",
    country: "LU",
    regulator: "CSSF",
    type: "MiCA CASP authorisation",
    status: "licensed",
    sourceUrl: ESMA_CASP_SOURCE,
    evidence: "ESMA interim MiCA CASP register: authorised 2025-06-20 by the CSSF (LEI 984500F14CA4571AAC11).",
  }),
];
// Replace a researched jurisdiction atomically; unreadable sources retain their historical check dates.
export const licenseRecords = Object.freeze([
  ...legacyRecords.filter(record => !licenseResearch[record.country]?.replaceLegacy).map(record => record.country === "CY" ? Object.freeze({ ...record, authorised: false }) : record),
  ...researchRecords.map(record => Object.freeze(record)),
]);

const STATUS_LABELS_EN = Object.freeze({
  authorised: "Authorised",
  licensed: "Licensed",
  registered: "Registered",
  applied: "Applied / listed, not authorised",
  warning: "Warning",
  withdrawn: "Withdrawn",
  revoked: "Revoked",
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
    answer: "A record means we found a specific exchange entity in an official register source.",
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
    answer: "一条记录只表示我们在官方登记来源中找到了具体交易所实体。",
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
    answer: "Un registro significa que encontramos una entidad concreta en una fuente oficial.",
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
    answer: "Um registro significa que encontramos uma entidade específica em fonte oficial.",
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
    answer: "Bir kayıt, belirli bir borsa şirketini resmi bir kaynakta bulduğumuz anlamına gelir.",
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
    answer: "Satu catatan berarti kami menemukan entitas tertentu dalam sumber resmi.",
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
    answer: "記録は、特定の法人を公式ソースで確認したことを意味します。",
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
    answer: "기록은 특정 법인을 공식 출처에서 찾았다는 뜻입니다.",
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
    answer: "Un enregistrement signifie que nous avons trouvé une entité précise dans une source officielle.",
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
    answer: "Ein Eintrag bedeutet, dass wir eine bestimmte Gesellschaft in einer offiziellen Quelle gefunden haben.",
    statuses: { licensed: "Lizenziert", registered: "Registriert", applied: "Beantragt/gelistet, keine Zulassung", restricted: "Beschränkt", banned: "Verboten", "liquidation list": "Liquidationsliste" },
  },
};

BASE_COPY.ar = { ...BASE_COPY.en, title: "دليل تراخيص منصات التداول", hubTitle: "تراخيص منصات العملات المشفرة", hubAnswer: "يعرض الدليل سجلات رسمية مع فصل الترخيص والتسجيل والطلبات. الإدراج ليس ترخيصًا.", exchange: "المنصة", country: "الدولة", entity: "الكيان", regulator: "الجهة الرقابية", type: "نوع الترخيص أو التسجيل", status: "الحالة", source: "السجل الرسمي", lastChecked: "آخر فحص", all: "الكل", empty: "لا توجد سجلات رسمية مطابقة.", question: "قراءة الدليل", answer: "كل صف يربط كيانًا بسجل رسمي. التسجيل لا يضمن جميع المنتجات أو أهلية الحساب.", statuses: { licensed: "مرخص", registered: "مسجل", applied: "طلب دون ترخيص", restricted: "مقيد", banned: "محظور", "liquidation list": "قائمة التصفية" } };
BASE_COPY.ur = { ...BASE_COPY.en, title: "ایکسچینج لائسنس ڈائریکٹری", hubTitle: "کرپٹو ایکسچینج لائسنس اور حیثیت", hubAnswer: "یہ ڈائریکٹری سرکاری رجسٹر کے شواہد پیش کرتی ہے۔ درخواست لائسنس نہیں ہے۔", exchange: "ایکسچینج", country: "ملک", entity: "ادارہ", regulator: "نگران ادارہ", type: "لائسنس یا رجسٹریشن", status: "حیثیت", source: "سرکاری رجسٹر", lastChecked: "آخری جانچ", all: "سب", empty: "کوئی مماثل سرکاری ریکارڈ نہیں۔", question: "ڈائریکٹری کیسے پڑھیں", answer: "ہر سطر ادارے کو سرکاری رجسٹر سے جوڑتی ہے۔ رجسٹریشن تمام مصنوعات یا اکاؤنٹ کی اہلیت کی ضمانت نہیں۔", statuses: { licensed: "لائسنس یافتہ", registered: "رجسٹرڈ", applied: "درخواست، اجازت نہیں", restricted: "محدود", banned: "ممنوع", "liquidation list": "تصفیہ کی فہرست" } };
BASE_COPY.uk = { ...BASE_COPY.en, title: "Каталог ліцензій бірж", hubTitle: "Ліцензії та регуляторний статус криптобірж", hubAnswer: "Каталог містить записи офіційних реєстрів. Заявка не є ліцензією.", exchange: "Біржа", country: "Країна", entity: "Юридична особа", regulator: "Регулятор", type: "Тип ліцензії або реєстрації", status: "Статус", source: "Офіційний реєстр", lastChecked: "Перевірено", all: "Усі", empty: "Відповідних офіційних записів немає.", question: "Як читати каталог", answer: "Кожен рядок пов’язує юридичну особу з офіційним реєстром. Реєстрація не гарантує всі продукти або право відкрити рахунок.", statuses: { licensed: "Ліцензовано", registered: "Зареєстровано", applied: "Заявка, без дозволу", restricted: "Обмежено", banned: "Заборонено", "liquidation list": "Список ліквідації" } };

const negativeLabels = { en: ['Warning', 'Withdrawn', 'Revoked'], 'zh-Hans': ['警示', '已撤回', '已撤销'], es: ['Advertencia', 'Retirado', 'Revocado'], 'pt-BR': ['Alerta', 'Retirado', 'Revogado'], tr: ['Uyarı', 'Geri çekilmiş', 'İptal edilmiş'], vi: ['Cảnh báo', 'Đã rút', 'Đã thu hồi'], id: ['Peringatan', 'Ditarik', 'Dicabut'], ja: ['警告', '撤回', '取消'], ko: ['경고', '철회', '취소'], fr: ['Avertissement', 'Retiré', 'Révoqué'], de: ['Warnung', 'Zurückgezogen', 'Widerrufen'], ar: ['تحذير', 'مسحوب', 'ملغى'], ur: ['انتباہ', 'واپس لیا گیا', 'منسوخ'], uk: ['Попередження', 'Відкликано', 'Скасовано'] };
for (const [locale, labels] of Object.entries(negativeLabels)) {
  BASE_COPY[locale].statuses = { ...BASE_COPY[locale].statuses, authorised: locale === "en" ? "Authorised" : locale === "zh-Hans" ? "获授权" : BASE_COPY[locale].statuses.licensed, warning: labels[0], withdrawn: labels[1], revoked: labels[2] };
}

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
  const exchanges = [...new Set(records.map((record) => venueDisplayName(record.exchange)))].join(", ");
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
  if (countrySlug) return countryEditorial(licenseCountryName(countrySlug, locale), locale, licenseRecordsForCountry(countrySlug), licenseLastmod(countrySlug)).title;
  return t.hubTitle;
}

export function licenseAnswer(countrySlug, locale = "en") {
  const t = licenseCopy(locale);
  const summary = fillLicense(countrySlug ? t.countryAnswer : t.hubAnswer, countryVars(countrySlug, locale));
  if (!countrySlug) return summary;
  return countryEditorial(licenseCountryName(countrySlug, locale), locale, licenseRecordsForCountry(countrySlug), licenseLastmod(countrySlug)).answer;
}

export function licenseResearchForCountry(countrySlug) {
  return licenseResearch[licenseCountry(countrySlug)?.code] || null;
}

export function licenseSourceUrls(countrySlug) {
  const records = countrySlug ? licenseRecordsForCountry(countrySlug) : licenseRecords;
  return [...new Set(records.map((record) => record.sourceUrl).filter(Boolean))];
}

export function licenseLastmod(countrySlug) {
  const records = countrySlug ? licenseRecordsForCountry(countrySlug) : licenseRecords;
  return [licenseResearchForCountry(countrySlug)?.checkedDate, ...records.map(record => record.lastChecked)].filter(Boolean).sort().pop() || LAST_CHECKED;
}

export function licenseSchemas(countrySlug, locale = "en", url) {
  const t = licenseCopy(locale);
  const title = licenseTitle(countrySlug, locale);
  const answer = licenseAnswer(countrySlug, locale);
  const sourceUrls = licenseSourceUrls(countrySlug);
  const pageUrl = url || `https://nexualpha.com${localizedPath(licensePath(countrySlug), locale)}`;
  const records = countrySlug ? licenseRecordsForCountry(countrySlug) : licenseRecords;
  const itemList = {
    "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#records`,
    numberOfItems: records.length,
    itemListElement: records.map((record, index) => ({
      "@type": "ListItem", position: index + 1,
      name: `${venueDisplayName(record.exchange)} ${record.country} ${record.regulator}`,
      description: `${record.entityName} — ${record.type} — ${t.statuses[record.status] || record.status}${record.number ? ` — ${record.number}` : ''} — ${record.lastChecked}`,
      url: record.sourceUrl,
    })),
  };
  return [
    itemList,
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
      measurementTechnique: "Manual extraction from readable official regulator registers; source URL and check date retained per entity.",
      variableMeasured: ["exchange", "entityName", "country", "regulator", "type", "number", "status", "sourceUrl", "lastChecked"],
      mainEntity: itemList,
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
