// NexuAlpha site features surfaced in Telegram (owner 2026-10-13): pinned "start here" menu, the daily digest's
// "today on NexuAlpha" block, the weekly "tool of the week" post and the bot's /start menu.
// Self-contained on purpose (no imports): the poller patch copies this file into the compiled bot release.
// Rules baked in here and pinned by tests:
//   - Türkiye (tr): no Bitget anywhere (Bitget's Turkish entity is on the SPK liquidation list);
//   - neutral (information-only) locales — NEUTRAL_CTA_LOCALES, incl. ru and vi: news, market data and tools only;
//     no sign-up wording, no invite codes, no /go/ partner buttons, no campaign posts or join buttons;
//   - no fine print / disclaimers; never write domain-like brand text ("Bitget.com") — Telegram auto-links it.
export const SITE = "https://nexualpha.com";
// Information-only locales. Local copy of pilot-01-prototype/src/data/locale-policy.js (the Telegram runtime ships
// without the site tree); site-features.test.mjs fails when the two drift.
//   vi: owner 2026-10-13, Vietnam Resolution 05/2025/NQ-CP (only MoF-licensed platforms may advertise crypto services).
export const NEUTRAL_CTA_LOCALE_LIST = Object.freeze(["ru", "ar", "zh-Hant", "ur", "uk", "vi"]);
const NEUTRAL_CTA_LOCALE_PATTERN = /^(ru|ar|ur|uk|vi)(-|$)|^zh-(Hant|TW|HK)(-|$)/i;
/** True for an information-only locale (ru, vi, ...; region variants such as vi-VN or zh-TW included). */
export const isNeutralCtaLocale = (lang) => NEUTRAL_CTA_LOCALE_PATTERN.test(String(lang || ""));
export const BOT = "NexuAlphaAssistantBot";
export const FEATURE_LANGS = ["zh", "en", "ru", "tr", "vi", "id", "es", "pt"];
export const FEATURE_LOCALE_PATH = { zh: "/zh-hans", en: "", ru: "/ru", tr: "/tr", vi: "/vi", id: "/id-id", es: "/es", pt: "/pt-br" };
// Converter pair per reader: the local fiat where the site has a localized converter, USD otherwise.
const FIAT = { zh: "cny", en: "usd", ru: "usd", tr: "try", vi: "vnd", id: "idr", es: "usd", pt: "brl" };

// Order = weekly rotation order. `path` may be a function of lang. `bot: true` = a t.me deep link, not a site page.
export const FEATURE_KEYS = ["flash", "matrix", "academy", "calendar", "coins", "convert", "liquidations", "glossary", "alerts"];
const PATHS = {
  flash: () => "/flash",
  matrix: () => "/funding-rates/matrix",
  academy: () => "/academy",
  calendar: () => "/calendar",
  coins: () => "/coins/bitcoin",
  convert: (lang) => `/convert/btc-to-${FIAT[lang] || "usd"}`,
  liquidations: () => "/liquidations",
  glossary: () => "/glossary",
};
const EMOJI = { flash: "⚡", matrix: "🧮", academy: "🎓", calendar: "📅", coins: "🪙", convert: "💱", liquidations: "💥", glossary: "📖", alerts: "🔔", campaigns: "🎁" };

// label = menu line, blurb = 2–3 line weekly description, cta = button text.
const COPY = {
  zh: {
    flash: ["7×24 快讯", "上币、下架、爆仓、急涨急跌，一屏刷完。点“只看重要”，只留真正影响行情的几条。", "打开快讯"],
    matrix: ["资金费率套利计算器", "同一个币在不同交易所的资金费率并排对比，输入仓位就能算出每 8 小时能收多少。", "算一算"],
    academy: ["学院 · 24 节视频课", "从开户、充值到合约风险，每节几分钟，看完就能上手。", "开始上课"],
    calendar: ["加密日历", "FOMC、CPI、非农和交易所上币下架都在一张表上，统一新加坡时间（SGT），可一键订阅到手机日历。", "查看日历"],
    coins: ["哪里买币", "想买某个币？一页看清哪些交易所有现货、有合约、支持哪些法币入金。", "查 BTC"],
    convert: ["币价换算", "BTC、ETH 等主流币实时换算成人民币，顺便看看在哪里买最方便。", "去换算"],
    liquidations: ["爆仓数据", "1 小时、24 小时多空爆仓一目了然，行情剧烈时先看这里。", "看爆仓"],
    glossary: ["术语表", "资金费率、强平价、未平仓量……看不懂的词，30 秒查明白。", "查术语"],
    alerts: ["机器人价格提醒", "私聊机器人发 /alert btc > 70000，BTC 一过 7 万就提醒你；/alert eth 5% 盯住 1 小时波动。", "设置提醒"],
    campaigns: "交易所活动",
    menuTitle: "👋 NexuAlpha 从这里开始",
    menuLead: "常用工具都在下面，点开即用：",
    menuAlerts: "私聊机器人发 /alert btc > 70000 或 /alert eth 5%，到价就提醒。",
    weeklyTitle: "🧰 本周工具",
    todayTitle: "<b>今日 NexuAlpha</b>",
    flashHead: "重要快讯",
    calendarHead: "今日日历（新加坡时间）",
    allDay: "全天",
    startTitle: "👋 欢迎来到 NexuAlpha 助手",
    startLead: "在这里设置价格和异动提醒，随时打开网站工具。",
    startAlertsHead: "🔔 提醒示例（直接发给我）：",
    startExamples: ["/alert btc > 70000 — BTC 突破 7 万提醒", "/alert eth < 2500 — ETH 跌破 2500 提醒", "/alert sol 5% — SOL 1 小时波动 5% 提醒", "/alerts — 爆仓、急涨急跌、上币、每日简报订阅"],
    startToolsHead: "🧰 网站工具：",
    startStop: "/alert list 查看规则 · /stop 关闭全部",
  },
  en: {
    flash: ["24/7 flash", "Listings, delistings, liquidations and sharp moves in one feed. Tap “Important only” to keep just the items that move the market.", "Open flash"],
    matrix: ["Funding arbitrage calculator", "Funding rates for the same coin across exchanges, side by side. Enter a size and see what you'd collect every 8 hours.", "Run the numbers"],
    academy: ["Academy · 24 video lessons", "From your first deposit to futures risk, a few minutes per lesson.", "Start learning"],
    calendar: ["Crypto calendar", "FOMC, CPI, payrolls and exchange listings on one calendar, in SGT, with a one-tap calendar subscription.", "Open calendar"],
    coins: ["Where to buy", "Pick a coin and see which exchanges list it for spot and futures, and which currencies you can deposit.", "Check BTC"],
    convert: ["Crypto converter", "Live BTC, ETH and major-coin prices in your currency, plus where to buy.", "Convert"],
    liquidations: ["Liquidations", "1h and 24h long and short liquidations at a glance. Check here first when the market jumps.", "See liquidations"],
    glossary: ["Glossary", "Funding rate, liquidation price, open interest: any term explained in 30 seconds.", "Look it up"],
    alerts: ["Price alerts in the bot", "Message the bot /alert btc > 70000 and get pinged the moment BTC crosses 70k; /alert eth 5% watches 1h moves.", "Set an alert"],
    campaigns: "Exchange campaigns",
    menuTitle: "👋 NexuAlpha: start here",
    menuLead: "Everything worth opening, one tap away:",
    menuAlerts: "DM the bot /alert btc > 70000 or /alert eth 5% and get pinged when it hits.",
    weeklyTitle: "🧰 Tool of the week",
    todayTitle: "<b>Today on NexuAlpha</b>",
    flashHead: "Important flash",
    calendarHead: "Today's calendar (SGT)",
    allDay: "all day",
    startTitle: "👋 Welcome to the NexuAlpha assistant",
    startLead: "Set price and move alerts here, and open the site's tools any time.",
    startAlertsHead: "🔔 Alert examples (just send them to me):",
    startExamples: ["/alert btc > 70000 — BTC breaks 70k", "/alert eth < 2500 — ETH drops below 2500", "/alert sol 5% — SOL moves 5% in an hour", "/alerts — liquidations, sharp moves, listings, daily digest"],
    startToolsHead: "🧰 Tools on the site:",
    startStop: "/alert list shows your rules · /stop turns everything off",
  },
  ru: {
    flash: ["Лента новостей 24/7", "Листинги, делистинги, ликвидации и резкие движения в одной ленте. Фильтр «Только важные» оставит главное.", "Открыть ленту"],
    matrix: ["Калькулятор арбитража фандинга", "Ставки финансирования одной монеты на разных биржах рядом. Укажите объём и посмотрите доход за 8 часов.", "Посчитать"],
    academy: ["Академия · 24 видеоурока", "От первого пополнения до рисков фьючерсов, по несколько минут на урок.", "Смотреть уроки"],
    calendar: ["Криптокалендарь", "FOMC, CPI, данные по занятости и события бирж в одном календаре, с подпиской в ваш календарь.", "Открыть календарь"],
    coins: ["Где купить монету", "Выберите монету и посмотрите, на каких биржах есть спот и фьючерсы и какие валюты принимаются.", "Посмотреть BTC"],
    convert: ["Конвертер криптовалют", "Курс BTC, ETH и других монет в долларах в реальном времени.", "Конвертировать"],
    liquidations: ["Ликвидации", "Ликвидации лонгов и шортов за 1 ч и 24 ч. При резком движении рынка смотрите сюда первым делом.", "Смотреть ликвидации"],
    glossary: ["Словарь", "Ставка финансирования, цена ликвидации, открытый интерес: любой термин за 30 секунд.", "Найти термин"],
    alerts: ["Оповещения о цене в боте", "Напишите боту /alert btc > 70000, и он сообщит, когда BTC пройдёт 70 000; /alert eth 5% следит за движением за час.", "Настроить оповещение"],
    campaigns: "Акции бирж",
    menuTitle: "👋 NexuAlpha: с чего начать",
    menuLead: "Самое полезное, в одно касание:",
    menuAlerts: "Напишите боту /alert btc > 70000 или /alert eth 5%, и он сообщит о движении цены.",
    weeklyTitle: "🧰 Инструмент недели",
    todayTitle: "<b>Сегодня на NexuAlpha</b>",
    flashHead: "Важные новости",
    calendarHead: "Календарь на сегодня (SGT)",
    allDay: "весь день",
    startTitle: "👋 Ассистент NexuAlpha",
    startLead: "Здесь можно настроить оповещения о цене и движениях рынка и открыть инструменты сайта.",
    startAlertsHead: "🔔 Примеры оповещений (просто отправьте мне):",
    startExamples: ["/alert btc > 70000 — BTC выше 70 000", "/alert eth < 2500 — ETH ниже 2500", "/alert sol 5% — SOL сдвинулся на 5% за час", "/alerts — ликвидации, резкие движения, листинги, ежедневная сводка"],
    startToolsHead: "🧰 Инструменты сайта:",
    startStop: "/alert list — ваши правила · /stop — отключить всё",
  },
  tr: {
    flash: ["7/24 flaş haberler", "Listelemeler, delist kararları, likidasyonlar ve sert hareketler tek akışta. “Sadece önemli” filtresi piyasayı oynatanları bırakır.", "Akışı aç"],
    matrix: ["Fonlama arbitraj hesaplayıcı", "Aynı coinin farklı borsalardaki fonlama oranları yan yana. Pozisyon büyüklüğünü girin, 8 saatte ne kazanacağınızı görün.", "Hesapla"],
    academy: ["Akademi · 24 video ders", "İlk para yatırmadan vadeli işlem risklerine, ders başına birkaç dakika.", "Derslere başla"],
    calendar: ["Kripto takvimi", "FOMC, enflasyon, istihdam verileri ve borsa listelemeleri tek takvimde, tek dokunuşla telefon takviminize.", "Takvimi aç"],
    coins: ["Nereden alınır", "Bir coin seçin; hangi borsalarda spot ve vadeli işlem olduğunu, hangi para birimiyle yatırılabildiğini görün.", "BTC'ye bak"],
    convert: ["Kripto çevirici", "BTC, ETH ve büyük coinlerin anlık TL karşılığı, nereden alınacağıyla birlikte.", "Çevir"],
    liquidations: ["Likidasyonlar", "1 saatlik ve 24 saatlik long/short likidasyonları bir bakışta. Piyasa sertleşince önce buraya bakın.", "Likidasyonları gör"],
    glossary: ["Sözlük", "Fonlama oranı, likidasyon fiyatı, açık pozisyon: her terim 30 saniyede.", "Terimi bul"],
    alerts: ["Botta fiyat uyarıları", "Bota /alert btc > 70000 yazın, BTC 70 bini geçtiği an haber verelim; /alert eth 5% 1 saatlik hareketi izler.", "Uyarı kur"],
    campaigns: "Borsa kampanyaları",
    menuTitle: "👋 NexuAlpha: buradan başlayın",
    menuLead: "En kullanışlı araçlar tek dokunuşta:",
    menuAlerts: "Bota /alert btc > 70000 veya /alert eth 5% yazın, fiyat gelince haber verelim.",
    weeklyTitle: "🧰 Haftanın aracı",
    todayTitle: "<b>Bugün NexuAlpha'da</b>",
    flashHead: "Önemli flaşlar",
    calendarHead: "Bugünün takvimi (SGT)",
    allDay: "tüm gün",
    startTitle: "👋 NexuAlpha asistanına hoş geldiniz",
    startLead: "Fiyat ve hareket uyarılarınızı buradan kurun, sitedeki araçları istediğiniz an açın.",
    startAlertsHead: "🔔 Uyarı örnekleri (bana gönderin yeter):",
    startExamples: ["/alert btc > 70000 — BTC 70 bini geçince", "/alert eth < 2500 — ETH 2500'ün altına inince", "/alert sol 5% — SOL 1 saatte %5 oynayınca", "/alerts — likidasyonlar, sert hareketler, listelemeler, günlük özet"],
    startToolsHead: "🧰 Sitedeki araçlar:",
    startStop: "/alert list kurallarınız · /stop hepsini kapatır",
  },
  vi: {
    flash: ["Tin nhanh 24/7", "Niêm yết, hủy niêm yết, thanh lý và biến động mạnh trong một luồng. Bật “Chỉ tin quan trọng” để chỉ giữ tin làm thị trường chuyển động.", "Mở tin nhanh"],
    matrix: ["Máy tính chênh lệch funding", "Funding của cùng một coin trên nhiều sàn, đặt cạnh nhau. Nhập khối lượng để xem mỗi 8 giờ nhận được bao nhiêu.", "Tính thử"],
    academy: ["Học viện · 24 bài video", "Từ lần nạp tiền đầu tiên đến rủi ro hợp đồng tương lai, mỗi bài vài phút.", "Bắt đầu học"],
    calendar: ["Lịch crypto", "FOMC, CPI, bảng lương Mỹ và lịch niêm yết của sàn trên một lịch, thêm vào lịch điện thoại chỉ với một chạm.", "Mở lịch"],
    coins: ["Mua coin ở đâu", "Chọn một coin để xem sàn nào có spot, có futures và nhận nạp bằng đồng tiền nào.", "Xem BTC"],
    convert: ["Quy đổi crypto", "Giá BTC, ETH và các coin lớn quy ra VND theo thời gian thực, kèm nơi mua.", "Quy đổi"],
    liquidations: ["Dữ liệu thanh lý", "Thanh lý long/short 1 giờ và 24 giờ trong nháy mắt. Thị trường giật mạnh thì xem ở đây trước.", "Xem thanh lý"],
    glossary: ["Thuật ngữ", "Funding, giá thanh lý, open interest: mọi thuật ngữ giải thích trong 30 giây.", "Tra thuật ngữ"],
    alerts: ["Cảnh báo giá trong bot", "Nhắn bot /alert btc > 70000 để được báo ngay khi BTC vượt 70k; /alert eth 5% theo dõi biến động 1 giờ.", "Đặt cảnh báo"],
    campaigns: "Sự kiện sàn",
    menuTitle: "👋 NexuAlpha: bắt đầu từ đây",
    menuLead: "Những công cụ đáng mở nhất, chỉ một chạm:",
    menuAlerts: "Nhắn bot /alert btc > 70000 hoặc /alert eth 5% để được báo khi giá chạm mốc.",
    weeklyTitle: "🧰 Công cụ của tuần",
    todayTitle: "<b>Hôm nay trên NexuAlpha</b>",
    flashHead: "Tin nhanh quan trọng",
    calendarHead: "Lịch hôm nay (giờ SGT)",
    allDay: "cả ngày",
    startTitle: "👋 Chào mừng đến với trợ lý NexuAlpha",
    startLead: "Đặt cảnh báo giá và biến động tại đây, mở công cụ trên web bất cứ lúc nào.",
    startAlertsHead: "🔔 Ví dụ cảnh báo (cứ gửi cho tôi):",
    startExamples: ["/alert btc > 70000 — BTC vượt 70k", "/alert eth < 2500 — ETH xuống dưới 2500", "/alert sol 5% — SOL biến động 5% trong 1 giờ", "/alerts — thanh lý, biến động mạnh, niêm yết, bản tin hằng ngày"],
    startToolsHead: "🧰 Công cụ trên web:",
    startStop: "/alert list xem quy tắc · /stop tắt tất cả",
  },
  id: {
    flash: ["Kabar kilat 24/7", "Listing, delisting, likuidasi, dan pergerakan tajam dalam satu feed. Pilih “Penting saja” untuk menyisakan yang menggerakkan pasar.", "Buka kabar kilat"],
    matrix: ["Kalkulator arbitrase funding", "Funding rate satu koin di berbagai bursa, berdampingan. Masukkan ukuran posisi dan lihat hasil tiap 8 jam.", "Hitung"],
    academy: ["Akademi · 24 video", "Dari setoran pertama sampai risiko futures, beberapa menit per pelajaran.", "Mulai belajar"],
    calendar: ["Kalender kripto", "FOMC, CPI, data tenaga kerja, dan listing bursa dalam satu kalender, bisa langsung ditambahkan ke kalender ponsel.", "Buka kalender"],
    coins: ["Tempat beli koin", "Pilih koin dan lihat bursa mana yang punya spot, futures, dan mata uang setoran apa saja.", "Cek BTC"],
    convert: ["Konverter kripto", "Harga BTC, ETH, dan koin utama dalam rupiah secara real time, plus tempat membelinya.", "Konversi"],
    liquidations: ["Likuidasi", "Likuidasi long dan short 1 jam dan 24 jam sekilas. Saat pasar bergejolak, cek di sini dulu.", "Lihat likuidasi"],
    glossary: ["Glosarium", "Funding rate, harga likuidasi, open interest: setiap istilah dijelaskan dalam 30 detik.", "Cari istilah"],
    alerts: ["Peringatan harga di bot", "Kirim /alert btc > 70000 ke bot dan dapatkan notifikasi saat BTC menembus 70 ribu; /alert eth 5% memantau pergerakan 1 jam.", "Pasang peringatan"],
    campaigns: "Kampanye bursa",
    todayTitle: "<b>Hari ini di NexuAlpha</b>", flashHead: "Kabar kilat penting", calendarHead: "Kalender hari ini (SGT)", allDay: "sepanjang hari",
    startTitle: "👋 Selamat datang di asisten NexuAlpha",
    startLead: "Pasang peringatan harga dan pergerakan di sini, buka alat situs kapan saja.",
    startAlertsHead: "🔔 Contoh peringatan (kirim saja ke saya):",
    startExamples: ["/alert btc > 70000 — BTC menembus 70 ribu", "/alert eth < 2500 — ETH turun di bawah 2500", "/alert sol 5% — SOL bergerak 5% dalam 1 jam", "/alerts — likuidasi, pergerakan tajam, listing, ringkasan harian"],
    startToolsHead: "🧰 Alat di situs:",
    startStop: "/alert list melihat aturan · /stop mematikan semuanya",
  },
  es: {
    flash: ["Flash 24/7", "Listados, retiradas, liquidaciones y movimientos bruscos en un solo feed. Activa “Solo importantes” para quedarte con lo que mueve el mercado.", "Abrir flash"],
    matrix: ["Calculadora de arbitraje de funding", "Las tasas de financiación de una misma moneda en varios exchanges, lado a lado. Pon un tamaño y mira lo que cobrarías cada 8 horas.", "Calcular"],
    academy: ["Academia · 24 lecciones en video", "Desde tu primer depósito hasta el riesgo de futuros, pocos minutos por lección.", "Empezar"],
    calendar: ["Calendario cripto", "FOMC, IPC, empleo y listados de exchanges en un solo calendario, suscribible en un toque.", "Ver calendario"],
    coins: ["Dónde comprar", "Elige una moneda y mira qué exchanges la listan en spot y futuros y con qué monedas puedes depositar.", "Ver BTC"],
    convert: ["Conversor cripto", "Precio de BTC, ETH y las principales monedas en tiempo real, y dónde comprarlas.", "Convertir"],
    liquidations: ["Liquidaciones", "Liquidaciones de largos y cortos en 1 h y 24 h de un vistazo. Cuando el mercado salta, mira aquí primero.", "Ver liquidaciones"],
    glossary: ["Glosario", "Tasa de financiación, precio de liquidación, interés abierto: cualquier término en 30 segundos.", "Buscar término"],
    alerts: ["Alertas de precio en el bot", "Envía /alert btc > 70000 al bot y te avisamos cuando BTC cruce los 70k; /alert eth 5% vigila movimientos de 1 h.", "Crear alerta"],
    campaigns: "Campañas de exchanges",
    todayTitle: "<b>Hoy en NexuAlpha</b>", flashHead: "Flash importantes", calendarHead: "Calendario de hoy (SGT)", allDay: "todo el día",
    startTitle: "👋 Bienvenido al asistente de NexuAlpha",
    startLead: "Configura aquí alertas de precio y de movimiento, y abre las herramientas del sitio cuando quieras.",
    startAlertsHead: "🔔 Ejemplos de alertas (envíamelos tal cual):",
    startExamples: ["/alert btc > 70000 — BTC supera 70k", "/alert eth < 2500 — ETH baja de 2500", "/alert sol 5% — SOL se mueve un 5% en 1 h", "/alerts — liquidaciones, movimientos bruscos, listados, resumen diario"],
    startToolsHead: "🧰 Herramientas del sitio:",
    startStop: "/alert list ver tus reglas · /stop desactivar todo",
  },
  pt: {
    flash: ["Flash 24/7", "Listagens, remoções, liquidações e movimentos bruscos num só feed. Ative “Só importantes” para ficar com o que mexe o mercado.", "Abrir flash"],
    matrix: ["Calculadora de arbitragem de funding", "As taxas de funding de uma mesma moeda em várias corretoras, lado a lado. Informe o tamanho e veja quanto receberia a cada 8 horas.", "Calcular"],
    academy: ["Academia · 24 aulas em vídeo", "Do primeiro depósito ao risco de futuros, poucos minutos por aula.", "Começar"],
    calendar: ["Calendário cripto", "FOMC, CPI, payroll e listagens das corretoras num só calendário, para assinar com um toque.", "Ver calendário"],
    coins: ["Onde comprar", "Escolha uma moeda e veja quais corretoras têm spot e futuros e quais moedas aceitam no depósito.", "Ver BTC"],
    convert: ["Conversor cripto", "Preço de BTC, ETH e das principais moedas em reais, em tempo real, e onde comprar.", "Converter"],
    liquidations: ["Liquidações", "Liquidações de longs e shorts em 1 h e 24 h num relance. Quando o mercado dispara, olhe aqui primeiro.", "Ver liquidações"],
    glossary: ["Glossário", "Taxa de funding, preço de liquidação, open interest: qualquer termo em 30 segundos.", "Buscar termo"],
    alerts: ["Alertas de preço no bot", "Mande /alert btc > 70000 para o bot e receba um aviso quando o BTC passar de 70 mil; /alert eth 5% acompanha movimentos de 1 h.", "Criar alerta"],
    campaigns: "Campanhas das corretoras",
    todayTitle: "<b>Hoje na NexuAlpha</b>", flashHead: "Flash importantes", calendarHead: "Calendário de hoje (SGT)", allDay: "dia todo",
    startTitle: "👋 Boas-vindas ao assistente NexuAlpha",
    startLead: "Configure aqui alertas de preço e de movimento e abra as ferramentas do site quando quiser.",
    startAlertsHead: "🔔 Exemplos de alerta (é só me mandar):",
    startExamples: ["/alert btc > 70000 — BTC passa de 70 mil", "/alert eth < 2500 — ETH cai abaixo de 2500", "/alert sol 5% — SOL se move 5% em 1 h", "/alerts — liquidações, movimentos bruscos, listagens, resumo diário"],
    startToolsHead: "🧰 Ferramentas do site:",
    startStop: "/alert list mostra suas regras · /stop desliga tudo",
  },
};
export const featureCopy = (lang) => COPY[lang] || COPY.en;
export const featureLang = (lang) => (COPY[lang] ? lang : langFromCode(lang) || "en");

// Campaign pages per channel language. tr: no Bitget; ru: the neutral campaigns hub instead of single promos;
// every other neutral locale (vi, ...): no campaign links at all.
const CAMPAIGN_LABELS = {
  "bitget-alliance": { zh: "Bitget 联盟活动", en: "Bitget Alliance", vi: "Bitget Alliance", id: "Bitget Alliance", es: "Bitget Alliance", pt: "Bitget Alliance" },
  "binance-october-gifts": { zh: "Binance 十月礼遇", en: "Binance October gifts", tr: "Binance ekim hediyeleri", vi: "Quà tháng 10 của Binance", id: "Hadiah Oktober Binance", es: "Regalos de octubre de Binance", pt: "Presentes de outubro da Binance" },
  "bybit-stocks": { zh: "Bybit 美股代币", en: "Bybit stock tokens", tr: "Bybit hisse tokenları", vi: "Cổ phiếu token trên Bybit", id: "Token saham Bybit", es: "Acciones tokenizadas en Bybit", pt: "Ações tokenizadas na Bybit" },
};
export const CAMPAIGN_PAGES = Object.keys(CAMPAIGN_LABELS);

/** [{key,label,url}] of live campaign pages for this language (ru gets the hub only, other neutral locales none). */
export function campaignLinks(lang, src) {
  if (lang === "ru") return [{ key: "activities", label: featureCopy("ru").campaigns, url: featureUrl(lang, "/activities", src) }];
  if (isNeutralCtaLocale(lang)) return [];
  return CAMPAIGN_PAGES.filter((slug) => CAMPAIGN_LABELS[slug][lang] || (lang !== "tr" && CAMPAIGN_LABELS[slug].en))
    .filter((slug) => !(lang === "tr" && /bitget/i.test(slug)))
    .map((slug) => ({ key: slug, label: CAMPAIGN_LABELS[slug][lang] || CAMPAIGN_LABELS[slug].en, url: featureUrl(lang, `/activities/${slug}`, src) }));
}

export const featureUrl = (lang, path, src) => `${SITE}${FEATURE_LOCALE_PATH[lang] ?? ""}${path}${src ? `${path.includes("?") ? "&" : "?"}src=${src}` : ""}`;
export const botAlertsUrl = (lang) => `https://t.me/${BOT}?start=alerts-${featureLang(lang)}`;

/** One feature: {key, emoji, label, blurb, cta, url}. */
export function feature(key, lang, src) {
  const t = featureCopy(lang);
  const [label, blurb, cta] = t[key];
  const url = key === "alerts" ? botAlertsUrl(lang) : featureUrl(lang, PATHS[key](lang), src);
  return { key, emoji: EMOJI[key], label, blurb, cta, url };
}

const DAY = 24 * 3600e3;
/** 1–2 site features for the daily digest, rotating by UTC day (the bot alerts link is never in the rotation). */
export function rotatingFeatures(now, lang, src, count = 2) {
  const pool = FEATURE_KEYS.filter((k) => k !== "alerts");
  const day = Math.floor(new Date(now).getTime() / DAY);
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => feature(pool[(day * count + i) % pool.length], lang, src));
}

/** ISO-like week index used by the weekly post (weeks since 1970-01-05, a Monday) in Asia/Singapore. */
export function weekIndex(now) {
  const sgt = new Date(new Date(now).getTime() + 8 * 3600e3);
  return Math.floor((sgt.getTime() - Date.UTC(1970, 0, 5)) / (7 * DAY));
}
export const toolOfWeekKey = (now) => FEATURE_KEYS[((weekIndex(now) % FEATURE_KEYS.length) + FEATURE_KEYS.length) % FEATURE_KEYS.length];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Weekly "tool of the week" channel post: {text (HTML), buttons}. */
export function toolOfWeekMessage(now, lang) {
  const t = featureCopy(lang);
  const f = feature(toolOfWeekKey(now), lang, `tg-tool-${lang}`);
  const text = [`<b>${esc(t.weeklyTitle || COPY.en.weeklyTitle)}: ${f.emoji} ${esc(f.label)}</b>`, "", esc(f.blurb)].join("\n");
  return { text, buttons: [[{ text: `${f.emoji} ${f.cta}`, url: f.url }]], key: f.key };
}

/** Pinned "start here" menu per channel: {text (HTML), buttons}. */
export function pinnedMenuMessage(lang) {
  const t = featureCopy(lang);
  const src = `tg-pin-${lang}`;
  const line = (f) => `${f.emoji} <a href="${f.url}">${esc(f.label)}</a>`;
  const tools = ["flash", "calendar", "liquidations", "matrix", "coins", "convert", "academy", "glossary"].map((k) => line(feature(k, lang, src)));
  const campaigns = campaignLinks(lang, src);
  const lines = [`<b>${esc(t.menuTitle || COPY.en.menuTitle)}</b>`, "", esc(t.menuLead || COPY.en.menuLead), "", ...tools];
  if (campaigns.length) lines.push(`${EMOJI.campaigns} ${campaigns.map((c) => `<a href="${c.url}">${esc(c.label)}</a>`).join(" · ")}`);
  lines.push("", `${EMOJI.alerts} ${esc(t.menuAlerts || COPY.en.menuAlerts)}`);
  const alerts = feature("alerts", lang, src);
  return { text: lines.join("\n"), buttons: [[{ text: `${alerts.emoji} ${alerts.cta}`, url: alerts.url }]] };
}

/** Bot /start text (plain text: the poller sends without parse_mode) and URL buttons in the member's language. */
export function startMenu(lang, src = `tg-bot-start-${featureLang(lang)}`) {
  const l = featureLang(lang);
  const t = featureCopy(l);
  const text = [t.startTitle, "", t.startLead, "", t.startAlertsHead, ...t.startExamples.map((e) => `• ${e}`), "", t.startToolsHead,
    ...["flash", "calendar", "matrix", "coins", "academy", "liquidations"].map((k) => { const f = feature(k, l, src); return `${f.emoji} ${f.label}`; }), "", t.startStop].join("\n");
  const b = (k) => { const f = feature(k, l, src); return { text: `${f.emoji} ${f.label}`, url: f.url }; };
  const rows = [[b("flash"), b("calendar")], [b("matrix"), b("coins")], [b("academy"), b("liquidations")]];
  // neutral locales without their own copy (zh-Hant, uk, ar, ...) read zh/en text but never get a campaign row
  const camp = isNeutralCtaLocale(lang) && lang !== "ru" ? null : campaignLinks(l, src)[0];
  if (camp) rows.push([{ text: `${EMOJI.campaigns} ${camp.label}`, url: camp.url }]);
  return { text, rows };
}

/** Telegram language_code ("pt-br", "zh-hans", "ru") -> one of FEATURE_LANGS, or null. */
export function langFromCode(code) {
  const c = String(code || "").toLowerCase();
  if (!c) return null;
  if (c.startsWith("zh")) return "zh";
  if (c.startsWith("pt")) return "pt";
  const base = c.split(/[-_]/)[0];
  return FEATURE_LANGS.includes(base) ? base : null;
}

// ---------- digest "today on NexuAlpha" block ----------
const TZ = "Asia/Singapore";
const sgtDate = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const sgtTime = (d) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
const banned = (lang, ...texts) => lang === "tr" && texts.some((s) => /bitget/i.test(String(s || "")));
/** Calendar events whose start falls on the current SGT day (all-day events by their UTC date), max `limit`. */
export function todaysCalendarEvents(calendar, now, lang, limit = 3) {
  const today = sgtDate(new Date(now));
  return (Array.isArray(calendar?.events) ? calendar.events : [])
    .filter((e) => e?.title && Number.isFinite(Date.parse(e.start)))
    .filter((e) => (e.allDay ? String(e.start).slice(0, 10) === today : sgtDate(new Date(e.start)) === today))
    .filter((e) => !banned(lang, e.title, e.venue, eventTitle(e, lang)))
    .sort((a, b) => (a.allDay === b.allDay ? Date.parse(a.start) - Date.parse(b.start) : a.allDay ? 1 : -1))
    .slice(0, limit);
}
/** Important flash items from the last 24 h, newest first, de-duplicated by headline, max `limit`. */
export function topImportantFlash(flash, now, lang, limit = 3) {
  const seen = new Set();
  return (Array.isArray(flash?.items) ? flash.items : [])
    .filter((i) => i?.important && i.headline && i.path && new Date(now).getTime() - Date.parse(i.time) < DAY)
    .filter((i) => !banned(lang, i.headline, i.venue))
    .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
    .filter((i) => (seen.has(i.headline) ? false : seen.add(i.headline)))
    .slice(0, limit);
}
export const todayTitle = (lang) => featureCopy(lang).todayTitle || COPY.en.todayTitle;
const CAL_LOCALE = { zh: "zh-Hans", pt: "pt-BR" };
const eventTitle = (e, lang) => e.titles?.[CAL_LOCALE[lang] || lang] || e.title;
/** HTML lines for the digest block body (title via todayTitle): rotating features, important flash, today's calendar. */
export function todayBlock({ now = Date.now(), lang, flash, calendar, src = `tg-digest-${lang}` }) {
  const t = featureCopy(lang);
  const lines = [];
  for (const f of rotatingFeatures(now, lang, src)) lines.push(`${f.emoji} <a href="${f.url}">${esc(f.label)}</a>`);
  const items = topImportantFlash(flash, now, lang);
  if (items.length) {
    lines.push(`⚡ ${esc(t.flashHead || COPY.en.flashHead)}:`);
    for (const i of items) lines.push(`• <a href="${featureUrl(lang, i.path, src)}">${esc(i.headline)}</a>`);
  }
  const events = todaysCalendarEvents(calendar, now, lang);
  if (events.length) {
    lines.push(`📅 <a href="${featureUrl(lang, "/calendar", src)}">${esc(t.calendarHead || COPY.en.calendarHead)}</a>:`);
    for (const e of events) lines.push(`• ${e.allDay ? esc(t.allDay || COPY.en.allDay) : sgtTime(new Date(e.start))} ${esc(String(eventTitle(e, lang)).slice(0, 90))}`);
  }
  return lines;
}
