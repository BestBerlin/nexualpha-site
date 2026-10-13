// /telegram first screen (owner 2026-10-10): the page sells the bot's alerts, not a research hub. One static sample
// message (clearly labelled as a sample, same structure as the bot's liquidation card), the four alert topics, one
// primary "Open the bot" deep link (?start=alerts) and the channels / Mini App as secondary routes.
// Honest by construction: no subscriber counts, no invented metrics; the sample names its Binance + OKX public source.
import { TELEGRAM_ALERTS_URL, telegramAlertsUrl } from "./news/NewsTelegramAlerts.jsx";
import { TELEGRAM_ENTRIES, telegramCopy } from "../v7/home7-telegram.jsx";

export const MINI_APP_URL = "https://app.nexualpha.com/";

// The sample is one fixed, invented-but-plausible event. Figures are placeholders and are labelled as a sample.
export const SAMPLE_ALERT = Object.freeze({ symbol: "BTCUSDT", amount: "$1.28M", exchange: "Binance USDT-M", time: "22:32 SGT", window: 15 });

const COPY = {
  en: {
    h1: "Liquidation and sharp-move alerts, plus a daily brief, in Telegram",
    sub: "The bot sends one message when longs or shorts get flushed, when BTC or ETH moves sharply, or when an exchange lists a token or starts a campaign. The daily brief lands at 21:00 SGT.",
    sampleLabel: "Sample message",
    sampleNote: "Static example of the message format. Figures are placeholders.",
    card: { title: "Liquidation flush", asset: "Asset", side: "Side", long: "Longs liquidated", amount: "Liquidated", exchange: "Venue", window: (m) => `Last ${m} min`, time: "Time", source: "Source: Binance + OKX public data" },
    topicsTitle: "What the bot sends",
    topics: [
      ["Liquidations", "Long and short flushes above the 7-day baseline, 60-minute cooldown per asset."],
      ["BTC / ETH sharp moves", "Only when the move clears the threshold; no tick-by-tick noise."],
      ["Listings and campaigns", "New listings, sign-up drives and trading competitions from official announcements."],
      ["Daily brief", "21:00 SGT: 24h liquidations, funding extremes and one exchange campaign."],
    ],
    primary: "Open the bot",
    primaryHint: "Opens @NexuAlphaAssistantBot on /alerts. You choose the topics there; nothing is sent before you opt in.",
    secondaryLabel: "Also on Telegram",
    miniApp: "Mini App",
    miniAppHint: "Fee comparison and rebates inside Telegram",
  },
  "zh-Hans": {
    h1: "爆仓、急涨急跌告警和每日简报，直接发到 Telegram",
    sub: "多头或空头被集中清算（多空双杀）、BTC/ETH 急涨急跌、交易所上新或开始活动时，机器人只发一条消息。每日简报21:00 新加坡时间送达。",
    sampleLabel: "示例消息",
    sampleNote: "消息格式的静态示例，数字为占位。",
    card: { title: "合约大额爆仓", asset: "标的", side: "方向", long: "多头爆仓", amount: "清算金额", exchange: "平台", window: (m) => `近 ${m} 分钟`, time: "时间", source: "数据源：Binance + OKX 公开数据" },
    topicsTitle: "机器人会推送什么",
    topics: [
      ["爆仓告警", "多空双杀：超过 7 天基线的集中清算，每个币种 60 分钟冷却。"],
      ["BTC / ETH 急涨急跌", "只在波动超过阈值时推送，不推逐笔噪音。"],
      ["上新与活动", "来自官方公告的新币上线、注册活动和交易赛。"],
      ["每日简报", "21:00 新加坡时间：24 小时爆仓、资金费率极值和一条交易所活动。"],
    ],
    primary: "打开机器人",
    primaryHint: "打开 @NexuAlphaAssistantBot 的 /alerts 页面，在那里选择主题；未确认订阅前不会推送。",
    secondaryLabel: "Telegram 其他入口",
    miniApp: "Mini App",
    miniAppHint: "在 Telegram 内查费率对比和返佣",
  },
  "zh-Hant": {
    h1: "爆倉、急漲急跌提醒和每日簡報，直接發到 Telegram",
    sub: "多頭或空頭被集中清算（多空雙殺）、BTC/ETH 急漲急跌、交易所上新或開始活動時，機器人只發一則訊息。每日簡報21:00 新加坡時間送達。",
    sampleLabel: "示例訊息",
    sampleNote: "訊息格式的靜態示例，數字為佔位。",
    card: { title: "合約大額爆倉", asset: "標的", side: "方向", long: "多頭爆倉", amount: "清算金額", exchange: "平台", window: (m) => `近 ${m} 分鐘`, time: "時間", source: "資料來源：Binance + OKX 公開資料" },
    topicsTitle: "機器人會推送什麼",
    topics: [
      ["爆倉提醒", "多空雙殺：超過 7 天基線的集中清算，每個幣種 60 分鐘冷卻。"],
      ["BTC / ETH 急漲急跌", "只在波動超過門檻時推送，不推逐筆雜訊。"],
      ["上新與活動", "來自官方公告的新幣上線、註冊活動和交易賽。"],
      ["每日簡報", "21:00 新加坡時間：24 小時爆倉、資金費率極值和一則交易所活動。"],
    ],
    primary: "打開機器人",
    primaryHint: "打開 @NexuAlphaAssistantBot 的 /alerts 頁面，在那裡選擇主題；未確認訂閱前不會推送。",
    secondaryLabel: "Telegram 其他入口",
    miniApp: "Mini App",
    miniAppHint: "在 Telegram 內查費率比較和返傭",
  },
  es: {
    h1: "Alertas de liquidaciones y movimientos bruscos, más un resumen diario, en Telegram",
    sub: "El bot envía un mensaje cuando se liquidan largos o cortos, cuando BTC o ETH se mueven con fuerza o cuando un exchange lista un token o lanza una campaña. El resumen diario llega a las 21:00 SGT.",
    sampleLabel: "Mensaje de ejemplo",
    sampleNote: "Ejemplo estático del formato. Las cifras son de muestra.",
    card: { title: "Liquidación masiva", asset: "Activo", side: "Lado", long: "Largos liquidados", amount: "Liquidado", exchange: "Exchange", window: (m) => `Últimos ${m} min`, time: "Hora", source: "Fuente: datos públicos de Binance + OKX" },
    topicsTitle: "Qué envía el bot",
    topics: [
      ["Liquidaciones", "Barridos de largos y cortos por encima de la base de 7 días, con 60 minutos de pausa por activo."],
      ["Movimientos bruscos de BTC / ETH", "Solo cuando el movimiento supera el umbral; sin ruido tick a tick."],
      ["Listados y campañas", "Nuevos listados, bonos de registro y competiciones desde los anuncios oficiales."],
      ["Resumen diario", "21:00 SGT: liquidaciones de 24 h, extremos de funding y una campaña de exchange."],
    ],
    primary: "Abrir el bot",
    primaryHint: "Abre @NexuAlphaAssistantBot en /alerts. Allí eliges los temas; no se envía nada antes de que te suscribas.",
    secondaryLabel: "También en Telegram",
    miniApp: "Mini App",
    miniAppHint: "Comparación de comisiones y reembolsos dentro de Telegram",
  },
  "pt-BR": {
    h1: "Alertas de liquidações e movimentos bruscos, mais um resumo diário, no Telegram",
    sub: "O bot envia uma mensagem quando longs ou shorts são liquidados, quando BTC ou ETH se movem com força ou quando uma corretora lista um token ou abre uma campanha. O resumo diário chega às 21:00 SGT.",
    sampleLabel: "Mensagem de exemplo",
    sampleNote: "Exemplo estático do formato. Os números são ilustrativos.",
    card: { title: "Liquidação em massa", asset: "Ativo", side: "Lado", long: "Longs liquidados", amount: "Liquidado", exchange: "Corretora", window: (m) => `Últimos ${m} min`, time: "Hora", source: "Fonte: dados públicos da Binance + OKX" },
    topicsTitle: "O que o bot envia",
    topics: [
      ["Liquidações", "Varridas de longs e shorts acima da base de 7 dias, com pausa de 60 minutos por ativo."],
      ["Movimentos bruscos de BTC / ETH", "Só quando o movimento passa do limite; sem ruído tick a tick."],
      ["Listagens e campanhas", "Novas listagens, bônus de cadastro e competições a partir dos anúncios oficiais."],
      ["Resumo diário", "21:00 SGT: liquidações de 24 h, extremos de funding e uma campanha de corretora."],
    ],
    primary: "Abrir o bot",
    primaryHint: "Abre o @NexuAlphaAssistantBot em /alerts. Você escolhe os temas lá; nada é enviado antes de você assinar.",
    secondaryLabel: "Também no Telegram",
    miniApp: "Mini App",
    miniAppHint: "Comparação de taxas e cashback dentro do Telegram",
  },
  fr: {
    h1: "Alertes de liquidations et de mouvements brusques, plus un point quotidien, sur Telegram",
    sub: "Le bot envoie un message quand des longs ou des shorts sont liquidés, quand BTC ou ETH bouge fortement, ou quand une plateforme liste un jeton ou lance une campagne. Le point quotidien arrive à 21:00 SGT.",
    sampleLabel: "Exemple de message",
    sampleNote: "Exemple statique du format. Les chiffres sont fictifs.",
    card: { title: "Vague de liquidations", asset: "Actif", side: "Sens", long: "Longs liquidés", amount: "Liquidé", exchange: "Plateforme", window: (m) => `${m} dernières min`, time: "Heure", source: "Source : données publiques Binance + OKX" },
    topicsTitle: "Ce que le bot envoie",
    topics: [
      ["Liquidations", "Vagues de longs et de shorts au-dessus de la base sur 7 jours, 60 minutes de pause par actif."],
      ["Mouvements brusques BTC / ETH", "Seulement quand le mouvement dépasse le seuil ; pas de bruit tick par tick."],
      ["Listings et campagnes", "Nouveaux listings, bonus d’inscription et compétitions depuis les annonces officielles."],
      ["Point quotidien", "21:00 SGT : liquidations sur 24 h, extrêmes de funding et une campagne de plateforme."],
    ],
    primary: "Ouvrir le bot",
    primaryHint: "Ouvre @NexuAlphaAssistantBot sur /alerts. Vous y choisissez les sujets ; rien n’est envoyé avant votre accord.",
    secondaryLabel: "Aussi sur Telegram",
    miniApp: "Mini App",
    miniAppHint: "Comparaison des frais et remboursements dans Telegram",
  },
  de: {
    h1: "Liquidations- und Kurssprung-Alarme plus ein tägliches Briefing in Telegram",
    sub: "Der Bot schickt eine Nachricht, wenn Longs oder Shorts liquidiert werden, wenn BTC oder ETH stark ausschlagen oder wenn eine Börse einen Token listet bzw. eine Aktion startet. Das tägliche Briefing kommt um 21:00 SGT.",
    sampleLabel: "Beispielnachricht",
    sampleNote: "Statisches Beispiel des Formats. Zahlen sind Platzhalter.",
    card: { title: "Liquidationswelle", asset: "Asset", side: "Seite", long: "Longs liquidiert", amount: "Liquidiert", exchange: "Börse", window: (m) => `Letzte ${m} Min`, time: "Zeit", source: "Quelle: öffentliche Daten von Binance + OKX" },
    topicsTitle: "Was der Bot sendet",
    topics: [
      ["Liquidationen", "Long- und Short-Wellen über der 7-Tage-Basis, 60 Minuten Pause je Asset."],
      ["BTC / ETH Kurssprünge", "Nur wenn die Bewegung die Schwelle überschreitet; kein Tick-für-Tick-Rauschen."],
      ["Listings und Aktionen", "Neue Listings, Anmeldeboni und Trading-Wettbewerbe aus offiziellen Meldungen."],
      ["Tägliches Briefing", "21:00 SGT: 24h-Liquidationen, Funding-Extreme und eine Börsenaktion."],
    ],
    primary: "Bot öffnen",
    primaryHint: "Öffnet @NexuAlphaAssistantBot bei /alerts. Dort wählen Sie die Themen; vor Ihrer Zustimmung wird nichts gesendet.",
    secondaryLabel: "Auch auf Telegram",
    miniApp: "Mini App",
    miniAppHint: "Gebührenvergleich und Rückvergütung in Telegram",
  },
  it: {
    h1: "Avvisi di liquidazioni e movimenti bruschi, più un riepilogo giornaliero, su Telegram",
    sub: "Il bot invia un messaggio quando long o short vengono liquidati, quando BTC o ETH si muovono con forza o quando un exchange lista un token o avvia una campagna. Il riepilogo giornaliero arriva alle 21:00 SGT.",
    sampleLabel: "Messaggio di esempio",
    sampleNote: "Esempio statico del formato. Le cifre sono segnaposto.",
    card: { title: "Ondata di liquidazioni", asset: "Asset", side: "Lato", long: "Long liquidati", amount: "Liquidato", exchange: "Exchange", window: (m) => `Ultimi ${m} min`, time: "Ora", source: "Fonte: dati pubblici Binance + OKX" },
    topicsTitle: "Cosa invia il bot",
    topics: [
      ["Liquidazioni", "Ondate di long e short sopra la base a 7 giorni, 60 minuti di pausa per asset."],
      ["Movimenti bruschi BTC / ETH", "Solo quando il movimento supera la soglia; niente rumore tick per tick."],
      ["Listing e campagne", "Nuovi listing, bonus di iscrizione e competizioni dagli annunci ufficiali."],
      ["Riepilogo giornaliero", "21:00 SGT: liquidazioni 24h, estremi di funding e una campagna exchange."],
    ],
    primary: "Apri il bot",
    primaryHint: "Apre @NexuAlphaAssistantBot su /alerts. Scegli lì gli argomenti; nulla viene inviato prima della tua iscrizione.",
    secondaryLabel: "Anche su Telegram",
    miniApp: "Mini App",
    miniAppHint: "Confronto commissioni e rimborsi dentro Telegram",
  },
  ja: {
    h1: "清算と急変動のアラート、毎日のブリーフを Telegram で受け取る",
    sub: "ロングやショートがまとめて清算されたとき、BTC/ETH が急変動したとき、取引所が上場やキャンペーンを発表したときに、ボットが 1 通だけ送ります。毎日のブリーフは21:00 新加坡時間に届きます。",
    sampleLabel: "サンプルメッセージ",
    sampleNote: "メッセージ形式の静的な例です。数値はダミーです。",
    card: { title: "大口清算", asset: "銘柄", side: "方向", long: "ロング清算", amount: "清算額", exchange: "取引所", window: (m) => `直近 ${m} 分`, time: "時刻", source: "データ：Binance + OKX 公開データ" },
    topicsTitle: "ボットが送るもの",
    topics: [
      ["清算アラート", "7 日基準を超えるロング/ショートの連鎖清算。銘柄ごとに 60 分のクールダウン。"],
      ["BTC / ETH 急変動", "しきい値を超えたときだけ。ティックごとのノイズは送りません。"],
      ["上場とキャンペーン", "公式告知からの新規上場、登録キャンペーン、取引大会。"],
      ["毎日のブリーフ", "21:00 新加坡時間：24 時間の清算、資金調達率の極値、取引所キャンペーン 1 件。"],
    ],
    primary: "ボットを開く",
    primaryHint: "@NexuAlphaAssistantBot の /alerts を開きます。トピックはそこで選択。同意前には何も送られません。",
    secondaryLabel: "Telegram のその他の入口",
    miniApp: "Mini App",
    miniAppHint: "Telegram 内で手数料比較と還元を確認",
  },
  ko: {
    h1: "청산·급등락 알림과 데일리 브리핑을 텔레그램으로",
    sub: "롱이나 숏이 대량 청산될 때, BTC/ETH가 급등락할 때, 거래소가 상장이나 이벤트를 발표할 때 봇이 메시지 한 건만 보냅니다. 데일리 브리핑은 21:00 SGT에 도착합니다.",
    sampleLabel: "샘플 메시지",
    sampleNote: "메시지 형식의 정적 예시입니다. 숫자는 예시값입니다.",
    card: { title: "대량 청산", asset: "자산", side: "방향", long: "롱 청산", amount: "청산 금액", exchange: "거래소", window: (m) => `최근 ${m}분`, time: "시간", source: "출처: Binance + OKX 공개 데이터" },
    topicsTitle: "봇이 보내는 것",
    topics: [
      ["청산 알림", "7일 기준선을 넘는 롱/숏 연쇄 청산, 자산별 60분 쿨다운."],
      ["BTC / ETH 급등락", "임계값을 넘을 때만 전송. 틱 단위 노이즈 없음."],
      ["상장과 이벤트", "공식 공지의 신규 상장, 가입 이벤트, 트레이딩 대회."],
      ["데일리 브리핑", "21:00 SGT: 24시간 청산, 펀딩 극단값, 거래소 이벤트 1건."],
    ],
    primary: "봇 열기",
    primaryHint: "@NexuAlphaAssistantBot의 /alerts를 엽니다. 주제는 거기서 선택하며, 동의 전에는 아무것도 전송되지 않습니다.",
    secondaryLabel: "텔레그램의 다른 입구",
    miniApp: "Mini App",
    miniAppHint: "텔레그램 안에서 수수료 비교와 리베이트 확인",
  },
  ru: {
    h1: "Уведомления о ликвидациях и резких движениях плюс ежедневная сводка в Telegram",
    sub: "Бот присылает одно сообщение, когда ликвидируют лонги или шорты, когда BTC или ETH резко двигаются или когда биржа листит токен либо запускает акцию. Ежедневная сводка приходит в 21:00 SGT.",
    sampleLabel: "Пример сообщения",
    sampleNote: "Статический пример формата. Цифры условные.",
    card: { title: "Волна ликвидаций", asset: "Актив", side: "Сторона", long: "Ликвидированы лонги", amount: "Ликвидировано", exchange: "Биржа", window: (m) => `Последние ${m} мин`, time: "Время", source: "Источник: открытые данные Binance + OKX" },
    topicsTitle: "Что присылает бот",
    topics: [
      ["Ликвидации", "Волны лонгов и шортов выше 7-дневной базы, пауза 60 минут на актив."],
      ["Резкие движения BTC / ETH", "Только когда движение превышает порог; без тикового шума."],
      ["Листинги и акции", "Новые листинги, бонусы за регистрацию и конкурсы из официальных объявлений."],
      ["Ежедневная сводка", "21:00 SGT: ликвидации за 24 ч, экстремумы фандинга и одна акция биржи."],
    ],
    primary: "Открыть бота",
    primaryHint: "Открывает @NexuAlphaAssistantBot на /alerts. Темы вы выбираете там; до подписки ничего не отправляется.",
    secondaryLabel: "Также в Telegram",
    miniApp: "Mini App",
    miniAppHint: "Сравнение комиссий и возврат внутри Telegram",
  },
  tr: {
    h1: "Tasfiye ve sert hareket uyarıları ile günlük özet, Telegram'da",
    sub: "Bot; longlar veya shortlar tasfiye edildiğinde, BTC ya da ETH sert hareket ettiğinde veya bir borsa token listelediğinde ya da kampanya başlattığında tek bir mesaj gönderir. Günlük özet 21:00 SGT'de gelir.",
    sampleLabel: "Örnek mesaj",
    sampleNote: "Biçimin statik örneği. Rakamlar temsilidir.",
    card: { title: "Tasfiye dalgası", asset: "Varlık", side: "Yön", long: "Longlar tasfiye edildi", amount: "Tasfiye", exchange: "Borsa", window: (m) => `Son ${m} dk`, time: "Saat", source: "Kaynak: Binance + OKX açık verisi" },
    topicsTitle: "Bot ne gönderir",
    topics: [
      ["Tasfiyeler", "7 günlük tabanın üzerindeki long ve short dalgaları, varlık başına 60 dakika bekleme."],
      ["BTC / ETH sert hareketler", "Yalnızca hareket eşiği aştığında; tick bazlı gürültü yok."],
      ["Listelemeler ve kampanyalar", "Resmî duyurulardan yeni listelemeler, kayıt kampanyaları ve yarışmalar."],
      ["Günlük özet", "21:00 SGT: 24 saatlik tasfiyeler, fonlama uçları ve bir borsa kampanyası."],
    ],
    primary: "Botu aç",
    primaryHint: "@NexuAlphaAssistantBot'u /alerts ile açar. Konuları orada seçersiniz; onay vermeden hiçbir şey gönderilmez.",
    secondaryLabel: "Telegram'da ayrıca",
    miniApp: "Mini App",
    miniAppHint: "Telegram içinde ücret karşılaştırması ve iade",
  },
  id: {
    h1: "Peringatan likuidasi dan pergerakan tajam, plus ringkasan harian, di Telegram",
    sub: "Bot mengirim satu pesan saat long atau short dilikuidasi, saat BTC atau ETH bergerak tajam, atau saat bursa melisting token atau memulai kampanye. Ringkasan harian tiba pukul 21:00 SGT.",
    sampleLabel: "Contoh pesan",
    sampleNote: "Contoh statis format pesan. Angka hanya ilustrasi.",
    card: { title: "Likuidasi massal", asset: "Aset", side: "Sisi", long: "Long dilikuidasi", amount: "Dilikuidasi", exchange: "Bursa", window: (m) => `${m} menit terakhir`, time: "Waktu", source: "Sumber: data publik Binance + OKX" },
    topicsTitle: "Apa yang dikirim bot",
    topics: [
      ["Likuidasi", "Gelombang long dan short di atas garis dasar 7 hari, jeda 60 menit per aset."],
      ["Pergerakan tajam BTC / ETH", "Hanya saat pergerakan melewati ambang; tanpa derau tick per tick."],
      ["Listing dan kampanye", "Listing baru, bonus pendaftaran, dan kompetisi dari pengumuman resmi."],
      ["Ringkasan harian", "21:00 SGT: likuidasi 24 jam, funding ekstrem, dan satu kampanye bursa."],
    ],
    primary: "Buka bot",
    primaryHint: "Membuka @NexuAlphaAssistantBot di /alerts. Pilih topik di sana; tidak ada yang dikirim sebelum Anda berlangganan.",
    secondaryLabel: "Juga di Telegram",
    miniApp: "Mini App",
    miniAppHint: "Perbandingan biaya dan rebate di dalam Telegram",
  },
  vi: {
    h1: "Cảnh báo thanh lý và biến động mạnh, kèm bản tin hằng ngày, trên Telegram",
    sub: "Bot gửi một tin nhắn khi long hoặc short bị thanh lý hàng loạt, khi BTC hoặc ETH biến động mạnh, hoặc khi sàn niêm yết token hay mở sự kiện. Bản tin hằng ngày đến lúc 21:00 SGT.",
    sampleLabel: "Tin nhắn mẫu",
    sampleNote: "Ví dụ tĩnh về định dạng tin nhắn. Số liệu chỉ để minh họa.",
    card: { title: "Thanh lý hàng loạt", asset: "Tài sản", side: "Chiều", long: "Long bị thanh lý", amount: "Giá trị thanh lý", exchange: "Sàn", window: (m) => `${m} phút qua`, time: "Thời gian", source: "Nguồn: dữ liệu công khai Binance + OKX" },
    topicsTitle: "Bot gửi gì",
    topics: [
      ["Thanh lý", "Đợt thanh lý long/short vượt nền 7 ngày, nghỉ 60 phút cho mỗi tài sản."],
      ["Biến động mạnh BTC / ETH", "Chỉ khi biến động vượt ngưỡng; không có nhiễu từng tick."],
      ["Niêm yết và sự kiện", "Niêm yết mới, thưởng đăng ký và giải giao dịch từ thông báo chính thức."],
      ["Bản tin hằng ngày", "21:00 SGT: thanh lý 24h, funding cực trị và một sự kiện sàn."],
    ],
    primary: "Mở bot",
    primaryHint: "Mở @NexuAlphaAssistantBot tại /alerts. Bạn chọn chủ đề ở đó; không gửi gì trước khi bạn đăng ký.",
    secondaryLabel: "Cũng có trên Telegram",
    miniApp: "Mini App",
    miniAppHint: "So sánh phí và hoàn phí ngay trong Telegram",
  },
  ar: {
    h1: "تنبيهات التصفية والتحركات الحادة، مع موجز يومي، على تيليجرام",
    sub: "يرسل البوت رسالة واحدة عند تصفية مراكز الشراء أو البيع، أو عند تحرك BTC أو ETH بحدة، أو عندما تدرج منصة عملة أو تبدأ حملة. يصل الموجز اليومي في 21:00 SGT.",
    sampleLabel: "رسالة نموذجية",
    sampleNote: "مثال ثابت على شكل الرسالة. الأرقام توضيحية.",
    card: { title: "موجة تصفية", asset: "الأصل", side: "الاتجاه", long: "تصفية مراكز شراء", amount: "قيمة التصفية", exchange: "المنصة", window: (m) => `آخر ${m} دقيقة`, time: "الوقت", source: "المصدر: بيانات عامة من Binance وOKX" },
    topicsTitle: "ما يرسله البوت",
    topics: [
      ["التصفيات", "موجات تصفية الشراء والبيع فوق خط الأساس لسبعة أيام، مع توقف 60 دقيقة لكل أصل."],
      ["تحركات BTC / ETH الحادة", "فقط عندما يتجاوز التحرك العتبة؛ بلا ضجيج لكل حركة."],
      ["الإدراجات والحملات", "إدراجات جديدة وحملات تسجيل ومسابقات من الإعلانات الرسمية."],
      ["الموجز اليومي", "21:00 SGT: تصفيات 24 ساعة، أقصى معدلات التمويل، وحملة منصة واحدة."],
    ],
    primary: "افتح البوت",
    primaryHint: "يفتح @NexuAlphaAssistantBot على /alerts. تختار المواضيع هناك؛ لا يُرسل شيء قبل اشتراكك.",
    secondaryLabel: "أيضًا على تيليجرام",
    miniApp: "Mini App",
    miniAppHint: "مقارنة الرسوم والاسترداد داخل تيليجرام",
  },
};

// l10n: needs native review
COPY.ur = {
  ...COPY.en,
  h1: "لیکویڈیشن، تیز حرکت کے الرٹس اور روزانہ خلاصہ Telegram میں",
  sub: "بوٹ اس وقت ایک پیغام بھیجتا ہے جب لانگ یا شارٹ پوزیشنز بڑی مقدار میں لیکویڈ ہوں، BTC یا ETH تیزی سے حرکت کرے، یا کوئی ایکسچینج ٹوکن لسٹ کرے یا مہم شروع کرے۔ روزانہ خلاصہ 21:00 SGT پر آتا ہے۔",
  sampleLabel: "نمونہ پیغام",
  sampleNote: "پیغام کے فارمیٹ کی جامد مثال۔ اعداد صرف جگہ رکھنے کے لیے ہیں۔",
  card: { ...COPY.en.card, title: "لیکویڈیشن کی لہر", asset: "اثاثہ", side: "سمت", long: "لیکویڈ لانگ پوزیشنز", amount: "لیکویڈ رقم", exchange: "پلیٹ فارم", window: (m) => `گزشتہ ${m} منٹ`, time: "وقت", source: "ماخذ: Binance + OKX عوامی ڈیٹا" },
  topicsTitle: "بوٹ کیا بھیجتا ہے",
  topics: [["لیکویڈیشنز", "7 دن کی بنیادی سطح سے اوپر لانگ اور شارٹ کی صفائی؛ ہر اثاثے پر 60 منٹ کا وقفہ۔"], ["BTC / ETH کی تیز حرکت", "صرف حد عبور ہونے پر؛ ہر ٹک کا شور نہیں۔"], ["لسٹنگز اور مہمات", "سرکاری اعلانات سے نئی لسٹنگز، رجسٹریشن مہمات اور ٹریڈنگ مقابلے۔"], ["روزانہ خلاصہ", "21:00 SGT: 24 گھنٹے کی لیکویڈیشنز، فنڈنگ کی انتہائیں اور ایک ایکسچینج مہم۔"]],
  primary: "بوٹ کھولیں",
  primaryHint: "@NexuAlphaAssistantBot کو /alerts پر کھولتا ہے۔ موضوعات آپ وہاں منتخب کرتے ہیں؛ آپ کی منظوری سے پہلے کچھ نہیں بھیجا جاتا۔",
  secondaryLabel: "Telegram پر بھی",
  miniApp: "Mini App",
  miniAppHint: "Telegram کے اندر فیس موازنہ اور ریبیٹ",
};
// l10n: needs native review
COPY.uk = {
  ...COPY.en,
  h1: "Сповіщення про ліквідації й різкі рухи та щоденний бриф у Telegram",
  sub: "Бот надсилає одне повідомлення, коли масово ліквідуються довгі або короткі позиції, коли BTC чи ETH різко рухається або коли біржа лістить токен чи запускає кампанію. Щоденний бриф приходить о 21:00 SGT.",
  sampleLabel: "Приклад повідомлення",
  sampleNote: "Статичний приклад формату повідомлення. Числа є заповнювачами.",
  card: { ...COPY.en.card, title: "Хвиля ліквідацій", asset: "Актив", side: "Сторона", long: "Ліквідовано довгі позиції", amount: "Ліквідовано", exchange: "Платформа", window: (m) => `Останні ${m} хв`, time: "Час", source: "Джерело: публічні дані Binance + OKX" },
  topicsTitle: "Що надсилає бот",
  topics: [["Ліквідації", "Зачистки довгих і коротких позицій вище 7-денної бази, 60 хвилин паузи на актив."], ["Різкі рухи BTC / ETH", "Лише коли рух проходить поріг; без шуму кожного тіку."], ["Лістинги й кампанії", "Нові лістинги, реєстраційні кампанії та торгові конкурси з офіційних оголошень."], ["Щоденний бриф", "21:00 SGT: ліквідації за 24 год, крайні ставки фінансування й одна кампанія біржі."]],
  primary: "Відкрити бота",
  primaryHint: "Відкриває @NexuAlphaAssistantBot на /alerts. Теми ви обираєте там; до вашої згоди нічого не надсилається.",
  secondaryLabel: "Також у Telegram",
  miniApp: "Mini App",
  miniAppHint: "Порівняння комісій і ребейти всередині Telegram",
};

export const telegramAlertsHeroCopy = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
export const TELEGRAM_ALERTS_HERO_LOCALES = Object.freeze(Object.keys(COPY));

function PlaneIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M21.6 3.2 2.9 10.4c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.8c.3-1.3-.5-1.9-1.4-1.5ZM8.3 13.2l10.4-6.6c.5-.3.9-.1.6.2l-8.9 8-.3 3.7-1.8-5.3Z" /></svg>;
}

export function TelegramAlertsHero({ locale = "en", headingLevel = 1, heading = null, primaryAttrs = {} }) {
  const t = telegramAlertsHeroCopy(locale);
  const tg = telegramCopy(locale);
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const Sub = headingLevel === 1 ? "h2" : "h3";
  const secondary = [
    TELEGRAM_ENTRIES.channelZh && { key: "channel-zh", href: TELEGRAM_ENTRIES.channelZh, label: tg.ch, handle: "@NexuAlphaClub" },
    TELEGRAM_ENTRIES.channelEn && { key: "channel-en", href: TELEGRAM_ENTRIES.channelEn, label: tg.en, handle: `@${TELEGRAM_ENTRIES.channelEn.split("/").pop()}` },
    { key: "mini-app", href: MINI_APP_URL, label: t.miniApp, handle: t.miniAppHint },
    TELEGRAM_ENTRIES.group && { key: "group", href: TELEGRAM_ENTRIES.group, label: tg.grp, handle: "@NexuAlphaWorld" },
  ].filter(Boolean);
  if (!String(locale || "").startsWith("zh")) {
    const zh = secondary.findIndex((item) => item.key === "channel-zh");
    const en = secondary.findIndex((item) => item.key === "channel-en");
    if (zh > -1 && en > zh) [secondary[zh], secondary[en]] = [secondary[en], secondary[zh]];
  }
  return (
    <section className="tg-signal-hero" aria-labelledby="telegram-alerts-title" data-telegram-alerts-hero="">
      <div className="tg-signal-hero__copy">
        {heading || <Heading className="tg-hub__title" id="telegram-alerts-title">{t.h1}</Heading>}
        <p className="tg-hub__subtitle">{t.sub}</p>
        <div className="tg-signal-hero__cta" role="group" aria-label={t.primary}>
          <a href={telegramAlertsUrl(locale)} target="_blank" rel="noopener noreferrer" className="tg-btn tg-btn--primary tg-signal-hero__primary" data-cta-kind="telegram" data-cta-placement="telegram-alerts-open-bot" data-growth-decision="telegram_alerts" data-growth-placement="telegram-alerts-hero" {...primaryAttrs}><PlaneIcon />{t.primary}</a>
          <p className="tg-signal-hero__hint">{t.primaryHint}</p>
        </div>
        <Sub className="tg-signal-hero__topics-title">{t.topicsTitle}</Sub>
        <ol className="tg-signal-hero__topics">
          {t.topics.map(([name, desc]) => <li key={name}><strong>{name}</strong><span>{desc}</span></li>)}
        </ol>
      </div>

      <figure className="tg-signal-sample" aria-label={t.sampleLabel}>
        <figcaption className="tg-signal-sample__label"><span>{t.sampleLabel}</span><small>{t.sampleNote}</small></figcaption>
        <div className="tg-signal-sample__bubble" dir="auto">
          <p className="tg-signal-sample__head"><span className="tg-signal-sample__sender">NexuAlpha Assistant</span><time>{SAMPLE_ALERT.time}</time></p>
          <p className="tg-signal-sample__title">💥 {t.card.title}</p>
          <dl className="tg-signal-sample__rows">
            <div><dt>{t.card.asset}</dt><dd translate="no" lang="en" dir="ltr">{SAMPLE_ALERT.symbol}</dd></div>
            <div><dt>{t.card.side}</dt><dd><span className="tg-signal-sample__side tg-signal-sample__side--long">{t.card.long}</span></dd></div>
            <div><dt>{t.card.amount}</dt><dd translate="no" lang="en" dir="ltr">{SAMPLE_ALERT.amount}</dd></div>
            <div><dt>{t.card.exchange}</dt><dd translate="no" lang="en" dir="ltr">{SAMPLE_ALERT.exchange}</dd></div>
            <div><dt>{t.card.time}</dt><dd>{t.card.window(SAMPLE_ALERT.window)}</dd></div>
          </dl>
          <p className="tg-signal-sample__source">{t.card.source}</p>
        </div>
        <ul className="tg-signal-hero__secondary" aria-label={t.secondaryLabel}>
          {secondary.map((item) => (
            <li key={item.key}>
              <a href={item.href} target="_blank" rel="noopener noreferrer" data-cta-kind="telegram" data-cta-placement={`telegram-alerts-${item.key}`}>
                <b>{item.label}</b><small translate="no" dir={item.key === "mini-app" ? undefined : "ltr"}>{item.handle}</small>
              </a>
            </li>
          ))}
        </ul>
      </figure>
    </section>
  );
}

export default TelegramAlertsHero;
