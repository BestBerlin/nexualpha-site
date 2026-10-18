// /telegram first screen (owner 2026-10-10): the page sells the bot's alerts, not a research hub. One static sample
// message (clearly labelled as a sample, same structure as the bot's liquidation card), four subscriber benefits
// (custom /alert rules, /alerts topics, 21:00 SGT digest, campaigns + Monday tool of the week), the live commands
// (syntax accepted by ops/alert-sender/alert-triggers.mjs), one primary "Open the bot" deep link (?start=alerts-<lang>)
// and the channels (zh / en / ru) and Mini App as secondary routes. All times are SGT.
// Honest by construction: no subscriber counts, no invented metrics; the sample names its Binance + OKX public source.
import { TELEGRAM_ALERTS_URL, telegramAlertsUrl } from "./news/NewsTelegramAlerts.jsx";
import { TELEGRAM_ENTRIES, telegramCopy } from "../v7/home7-telegram.jsx";

export const MINI_APP_URL = "https://app.nexualpha.com/";

// Live bot commands, in the order of each locale's `cmds` labels. Syntax must stay parseable by alert-triggers.mjs.
export const TELEGRAM_ALERT_COMMANDS = Object.freeze(["/alert btc > 70000", "/alert eth < 2500", "/alert sol 5%", "/alert liq 50m", "/alert funding btc 0.1%", "/alert listing binance", "/alert list", "/alerts", "/stop"]);

// The sample is one fixed, invented-but-plausible event. Figures are placeholders and are labelled as a sample.
export const SAMPLE_ALERT = Object.freeze({ symbol: "BTCUSDT", amount: "$1.28M", exchange: "Binance USDT-M", time: "22:32 SGT", window: 15 });

const COPY = {
  en: {
    h1: "NexuAlpha Telegram research bot: your crypto alerts, a daily digest and exchange campaigns",
    sub: "Tell the bot what to watch: a price level, a fast move, a liquidation wave, extreme funding or a new listing. It messages you the moment it happens and sends a daily digest at 21:00 SGT.",
    sampleLabel: "Sample message",
    sampleNote: "Static example of the message format. Figures are placeholders.",
    card: { title: "Liquidation flush", asset: "Asset", side: "Side", long: "Longs liquidated", amount: "Liquidated", exchange: "Venue", window: (m) => `Last ${m} min`, time: "Time", source: "Source: Binance + OKX public data" },
    topicsTitle: "What the bot sends",
    topics: [
      ["Custom alerts", "Up to 10 rules of your own with /alert: price levels, 1h moves, liquidations, funding and new listings."],
      ["Topic alerts", "Liquidation waves, BTC / ETH sharp moves, new listings and the daily digest. Switch each one on or off in /alerts."],
      ["Daily digest, 21:00 SGT", "Prices, liquidations, the top Important flash items, today's calendar events and one featured NexuAlpha tool."],
      ["Campaigns and tool of the week", "Exchange campaigns with rewards you can claim, plus a tool of the week every Monday at 20:00 SGT in our channels."],
    ],
    cmdTitle: "Commands",
    cmds: ["BTC rises above 70,000", "ETH falls below 2,500", "SOL moves 5% within 1h", "Liquidations top $50M in 1h", "BTC funding beyond ±0.1%", "New listings on Binance", "See your alerts", "Topic alerts on / off", "Turn everything off"],
    primary: "Open the bot",
    primaryHint: "Opens @NexuAlphaAssistantBot on /alerts. You choose the topics there; nothing is sent before you opt in.",
    secondaryLabel: "Also on Telegram",
    miniApp: "Mini App",
    miniAppHint: "Fee comparison and rebates inside Telegram",
  },
  "zh-Hans": {
    h1: "自定义行情提醒、每日简报和交易所活动，都在 Telegram",
    sub: "告诉机器人你要盯什么：价格关口、急涨急跌、爆仓、资金费率极值或新币上线，触发时立刻私信你。每日简报 21:00 SGT 送达。",
    sampleLabel: "示例消息",
    sampleNote: "消息格式的静态示例，数字为占位。",
    card: { title: "合约大额爆仓", asset: "标的", side: "方向", long: "多头爆仓", amount: "清算金额", exchange: "平台", window: (m) => `近 ${m} 分钟`, time: "时间", source: "数据源：Binance + OKX 公开数据" },
    topicsTitle: "机器人会推送什么",
    topics: [
      ["自定义提醒", "用 /alert 设置最多 10 条自己的规则：价格关口、1 小时波动、爆仓、资金费率和新币上线。"],
      ["主题提醒", "爆仓、BTC / ETH 急涨急跌、新币上线和每日简报，在 /alerts 里逐项开关。"],
      ["每日简报 · 21:00 SGT", "主要币价、爆仓、最重要的快讯、今日日历事件，外加一个值得打开的站内工具。"],
      ["交易所活动与每周工具", "频道第一时间推送你能领的交易所活动奖励；每周一 20:00 SGT 推荐一个本周工具。"],
    ],
    cmdTitle: "常用指令",
    cmds: ["BTC 涨破 70000", "ETH 跌破 2500", "SOL 1 小时波动 5%", "1 小时爆仓超过 5000 万美元", "BTC 资金费率超过 ±0.1%", "Binance 新币上线", "查看我的提醒", "开关主题提醒", "关闭全部提醒"],
    primary: "打开机器人",
    primaryHint: "打开 @NexuAlphaAssistantBot 的 /alerts 页面，在那里选择主题；未确认订阅前不会推送。",
    secondaryLabel: "Telegram 其他入口",
    miniApp: "Mini App",
    miniAppHint: "在 Telegram 内查费率对比和返佣",
  },
  "zh-Hant": {
    h1: "自訂行情提醒、每日簡報和交易所活動，都在 Telegram",
    sub: "告訴機器人你要盯什麼：價格關口、急漲急跌、爆倉、資金費率極值或新幣上線，觸發時立刻私訊你。每日簡報 21:00 SGT 送達。",
    sampleLabel: "示例訊息",
    sampleNote: "訊息格式的靜態示例，數字為佔位。",
    card: { title: "合約大額爆倉", asset: "標的", side: "方向", long: "多頭爆倉", amount: "清算金額", exchange: "平台", window: (m) => `近 ${m} 分鐘`, time: "時間", source: "資料來源：Binance + OKX 公開資料" },
    topicsTitle: "機器人會推送什麼",
    topics: [
      ["自訂提醒", "用 /alert 設定最多 10 條自己的規則：價格關口、1 小時波動、爆倉、資金費率和新幣上線。"],
      ["主題提醒", "爆倉、BTC / ETH 急漲急跌、新幣上線和每日簡報，在 /alerts 裡逐項開關。"],
      ["每日簡報 · 21:00 SGT", "主要幣價、爆倉、最重要的快訊、今日日曆事件，外加一個值得打開的站內工具。"],
      ["交易所活動與每週工具", "頻道第一時間推送你能領的交易所活動獎勵；每週一 20:00 SGT 推薦一個本週工具。"],
    ],
    cmdTitle: "常用指令",
    cmds: ["BTC 漲破 70000", "ETH 跌破 2500", "SOL 1 小時波動 5%", "1 小時爆倉超過 5000 萬美元", "BTC 資金費率超過 ±0.1%", "Binance 新幣上線", "查看我的提醒", "開關主題提醒", "關閉全部提醒"],
    primary: "打開機器人",
    primaryHint: "打開 @NexuAlphaAssistantBot 的 /alerts 頁面，在那裡選擇主題；未確認訂閱前不會推送。",
    secondaryLabel: "Telegram 其他入口",
    miniApp: "Mini App",
    miniAppHint: "在 Telegram 內查費率比較和返傭",
  },
  es: {
    h1: "Tus propias alertas cripto, un resumen diario y campañas de exchanges, en Telegram",
    sub: "Dile al bot qué vigilar: un nivel de precio, un movimiento rápido, una ola de liquidaciones, funding extremo o un nuevo listado. Te escribe en cuanto ocurre y envía un resumen diario a las 21:00 SGT.",
    sampleLabel: "Mensaje de ejemplo",
    sampleNote: "Ejemplo estático del formato. Las cifras son de muestra.",
    card: { title: "Liquidación masiva", asset: "Activo", side: "Lado", long: "Largos liquidados", amount: "Liquidado", exchange: "Exchange", window: (m) => `Últimos ${m} min`, time: "Hora", source: "Fuente: datos públicos de Binance + OKX" },
    topicsTitle: "Qué envía el bot",
    topics: [
      ["Alertas a tu medida", "Hasta 10 reglas propias con /alert: niveles de precio, movimientos en 1 h, liquidaciones, funding y nuevos listados."],
      ["Alertas por tema", "Olas de liquidaciones, movimientos bruscos de BTC / ETH, nuevos listados y el resumen diario. Activa o desactiva cada una en /alerts."],
      ["Resumen diario, 21:00 SGT", "Precios, liquidaciones, las noticias flash más importantes, los eventos del calendario de hoy y una herramienta destacada de NexuAlpha."],
      ["Campañas y herramienta de la semana", "Campañas de exchanges con recompensas que puedes reclamar, y una herramienta de la semana cada lunes a las 20:00 SGT en nuestros canales."],
    ],
    cmdTitle: "Comandos",
    cmds: ["BTC sube por encima de 70.000", "ETH cae por debajo de 2.500", "SOL se mueve un 5% en 1 h", "Liquidaciones de más de $50M en 1 h", "Funding de BTC más allá de ±0,1%", "Nuevos listados en Binance", "Ver tus alertas", "Activar / desactivar temas", "Desactivarlo todo"],
    primary: "Abrir el bot",
    primaryHint: "Abre @NexuAlphaAssistantBot en /alerts. Allí eliges los temas; no se envía nada antes de que te suscribas.",
    secondaryLabel: "También en Telegram",
    miniApp: "Mini App",
    miniAppHint: "Comparación de comisiones y reembolsos dentro de Telegram",
  },
  "pt-BR": {
    h1: "Seus próprios alertas cripto, um resumo diário e campanhas de corretoras, no Telegram",
    sub: "Diga ao bot o que acompanhar: um nível de preço, um movimento rápido, uma onda de liquidações, funding extremo ou uma nova listagem. Ele avisa na hora e envia um resumo diário às 21:00 SGT.",
    sampleLabel: "Mensagem de exemplo",
    sampleNote: "Exemplo estático do formato. Os números são ilustrativos.",
    card: { title: "Liquidação em massa", asset: "Ativo", side: "Lado", long: "Longs liquidados", amount: "Liquidado", exchange: "Corretora", window: (m) => `Últimos ${m} min`, time: "Hora", source: "Fonte: dados públicos da Binance + OKX" },
    topicsTitle: "O que o bot envia",
    topics: [
      ["Alertas personalizados", "Até 10 regras suas com /alert: níveis de preço, movimentos em 1 h, liquidações, funding e novas listagens."],
      ["Alertas por tema", "Ondas de liquidação, movimentos bruscos de BTC / ETH, novas listagens e o resumo diário. Ligue ou desligue cada um em /alerts."],
      ["Resumo diário, 21:00 SGT", "Preços, liquidações, os flashes mais importantes, os eventos do calendário de hoje e uma ferramenta em destaque da NexuAlpha."],
      ["Campanhas e ferramenta da semana", "Campanhas de corretoras com recompensas para você resgatar, e uma ferramenta da semana toda segunda às 20:00 SGT nos nossos canais."],
    ],
    cmdTitle: "Comandos",
    cmds: ["BTC passa de 70.000", "ETH cai abaixo de 2.500", "SOL oscila 5% em 1 h", "Liquidações acima de US$ 50M em 1 h", "Funding de BTC além de ±0,1%", "Novas listagens na Binance", "Ver seus alertas", "Ligar / desligar temas", "Desligar tudo"],
    primary: "Abrir o bot",
    primaryHint: "Abre o @NexuAlphaAssistantBot em /alerts. Você escolhe os temas lá; nada é enviado antes de você assinar.",
    secondaryLabel: "Também no Telegram",
    miniApp: "Mini App",
    miniAppHint: "Comparação de taxas e cashback dentro do Telegram",
  },
  fr: {
    h1: "Vos propres alertes crypto, un point quotidien et les campagnes des plateformes, sur Telegram",
    sub: "Dites au bot quoi surveiller : un niveau de prix, un mouvement rapide, une vague de liquidations, un funding extrême ou un nouveau listing. Il vous écrit dès que ça arrive et envoie un point quotidien à 21:00 SGT.",
    sampleLabel: "Exemple de message",
    sampleNote: "Exemple statique du format. Les chiffres sont fictifs.",
    card: { title: "Vague de liquidations", asset: "Actif", side: "Sens", long: "Longs liquidés", amount: "Liquidé", exchange: "Plateforme", window: (m) => `${m} dernières min`, time: "Heure", source: "Source : données publiques Binance + OKX" },
    topicsTitle: "Ce que le bot envoie",
    topics: [
      ["Alertes sur mesure", "Jusqu’à 10 règles à vous avec /alert : niveaux de prix, mouvements sur 1 h, liquidations, funding et nouveaux listings."],
      ["Alertes par thème", "Vagues de liquidations, mouvements brusques BTC / ETH, nouveaux listings et point quotidien. Activez ou coupez chacun dans /alerts."],
      ["Point quotidien, 21:00 SGT", "Prix, liquidations, les flashs les plus importants, les événements du calendrier du jour et un outil NexuAlpha à la une."],
      ["Campagnes et outil de la semaine", "Les campagnes des plateformes avec des récompenses à récupérer, et un outil de la semaine chaque lundi à 20:00 SGT dans nos canaux."],
    ],
    cmdTitle: "Commandes",
    cmds: ["BTC passe au-dessus de 70 000", "ETH passe sous 2 500", "SOL bouge de 5 % en 1 h", "Plus de 50 M$ liquidés en 1 h", "Funding BTC au-delà de ±0,1 %", "Nouveaux listings sur Binance", "Voir vos alertes", "Activer / couper les thèmes", "Tout désactiver"],
    primary: "Ouvrir le bot",
    primaryHint: "Ouvre @NexuAlphaAssistantBot sur /alerts. Vous y choisissez les sujets ; rien n’est envoyé avant votre accord.",
    secondaryLabel: "Aussi sur Telegram",
    miniApp: "Mini App",
    miniAppHint: "Comparaison des frais et remboursements dans Telegram",
  },
  de: {
    h1: "Eigene Krypto-Alarme, ein tägliches Briefing und Börsenaktionen in Telegram",
    sub: "Sagen Sie dem Bot, was er beobachten soll: eine Preismarke, eine schnelle Bewegung, eine Liquidationswelle, extremes Funding oder ein neues Listing. Er meldet sich sofort und schickt um 21:00 SGT ein tägliches Briefing.",
    sampleLabel: "Beispielnachricht",
    sampleNote: "Statisches Beispiel des Formats. Zahlen sind Platzhalter.",
    card: { title: "Liquidationswelle", asset: "Asset", side: "Seite", long: "Longs liquidiert", amount: "Liquidiert", exchange: "Börse", window: (m) => `Letzte ${m} Min`, time: "Zeit", source: "Quelle: öffentliche Daten von Binance + OKX" },
    topicsTitle: "Was der Bot sendet",
    topics: [
      ["Eigene Alarme", "Bis zu 10 eigene Regeln mit /alert: Preismarken, 1h-Bewegungen, Liquidationen, Funding und neue Listings."],
      ["Themen-Alarme", "Liquidationswellen, BTC / ETH Kurssprünge, neue Listings und das tägliche Briefing. Jedes einzeln in /alerts an- oder ausschalten."],
      ["Tägliches Briefing, 21:00 SGT", "Kurse, Liquidationen, die wichtigsten Flash-Meldungen, heutige Kalendertermine und ein empfohlenes NexuAlpha-Tool."],
      ["Aktionen und Tool der Woche", "Börsenaktionen mit Prämien, die Sie sich sichern können, und jeden Montag um 20:00 SGT ein Tool der Woche in unseren Kanälen."],
    ],
    cmdTitle: "Befehle",
    cmds: ["BTC steigt über 70.000", "ETH fällt unter 2.500", "SOL bewegt sich 5 % in 1 h", "Über 50 Mio. $ liquidiert in 1 h", "BTC-Funding jenseits von ±0,1 %", "Neue Listings auf Binance", "Ihre Alarme ansehen", "Themen an / aus", "Alles ausschalten"],
    primary: "Bot öffnen",
    primaryHint: "Öffnet @NexuAlphaAssistantBot bei /alerts. Dort wählen Sie die Themen; vor Ihrer Zustimmung wird nichts gesendet.",
    secondaryLabel: "Auch auf Telegram",
    miniApp: "Mini App",
    miniAppHint: "Gebührenvergleich und Rückvergütung in Telegram",
  },
  it: {
    h1: "I tuoi avvisi cripto, un riepilogo giornaliero e le campagne degli exchange, su Telegram",
    sub: "Di’ al bot cosa tenere d’occhio: un livello di prezzo, un movimento rapido, un’ondata di liquidazioni, funding estremo o un nuovo listing. Ti scrive appena succede e invia un riepilogo giornaliero alle 21:00 SGT.",
    sampleLabel: "Messaggio di esempio",
    sampleNote: "Esempio statico del formato. Le cifre sono segnaposto.",
    card: { title: "Ondata di liquidazioni", asset: "Asset", side: "Lato", long: "Long liquidati", amount: "Liquidato", exchange: "Exchange", window: (m) => `Ultimi ${m} min`, time: "Ora", source: "Fonte: dati pubblici Binance + OKX" },
    topicsTitle: "Cosa invia il bot",
    topics: [
      ["Avvisi personalizzati", "Fino a 10 regole tue con /alert: livelli di prezzo, movimenti in 1 h, liquidazioni, funding e nuovi listing."],
      ["Avvisi per tema", "Ondate di liquidazioni, movimenti bruschi BTC / ETH, nuovi listing e riepilogo giornaliero. Attiva o spegni ciascuno in /alerts."],
      ["Riepilogo giornaliero, 21:00 SGT", "Prezzi, liquidazioni, le flash più importanti, gli eventi del calendario di oggi e uno strumento NexuAlpha in evidenza."],
      ["Campagne e strumento della settimana", "Campagne degli exchange con premi da riscattare, e uno strumento della settimana ogni lunedì alle 20:00 SGT nei nostri canali."],
    ],
    cmdTitle: "Comandi",
    cmds: ["BTC sopra 70.000", "ETH sotto 2.500", "SOL si muove del 5% in 1 h", "Oltre $50M liquidati in 1 h", "Funding BTC oltre ±0,1%", "Nuovi listing su Binance", "Vedi i tuoi avvisi", "Temi on / off", "Disattiva tutto"],
    primary: "Apri il bot",
    primaryHint: "Apre @NexuAlphaAssistantBot su /alerts. Scegli lì gli argomenti; nulla viene inviato prima della tua iscrizione.",
    secondaryLabel: "Anche su Telegram",
    miniApp: "Mini App",
    miniAppHint: "Confronto commissioni e rimborsi dentro Telegram",
  },
  ja: {
    h1: "自分だけの価格アラート、毎日のダイジェスト、取引所キャンペーンを Telegram で",
    sub: "見張りたいものをボットに伝えるだけ：価格ライン、急変動、清算の波、資金調達率の極値、新規上場。起きた瞬間にお知らせし、毎日 21:00 SGT にダイジェストを届けます。",
    sampleLabel: "サンプルメッセージ",
    sampleNote: "メッセージ形式の静的な例です。数値はダミーです。",
    card: { title: "大口清算", asset: "銘柄", side: "方向", long: "ロング清算", amount: "清算額", exchange: "取引所", window: (m) => `直近 ${m} 分`, time: "時刻", source: "データ：Binance + OKX 公開データ" },
    topicsTitle: "ボットが送るもの",
    topics: [
      ["カスタムアラート", "/alert で最大 10 件の自分のルール：価格ライン、1 時間の変動、清算、資金調達率、新規上場。"],
      ["トピック通知", "清算の波、BTC / ETH の急変動、新規上場、毎日のダイジェスト。/alerts でひとつずつオン・オフ。"],
      ["毎日のダイジェスト・21:00 SGT", "主要価格、清算、重要フラッシュ、今日のカレンダー、おすすめの NexuAlpha ツール。"],
      ["キャンペーンと今週のツール", "受け取れる特典付きの取引所キャンペーンと、毎週月曜 20:00 SGT の「今週のツール」をチャンネルで。"],
    ],
    cmdTitle: "コマンド",
    cmds: ["BTC が 70,000 を上抜け", "ETH が 2,500 を下抜け", "SOL が 1 時間で 5% 変動", "1 時間の清算が 5,000 万ドル超", "BTC 資金調達率 ±0.1% 超", "Binance の新規上場", "自分のアラートを見る", "トピック通知のオン・オフ", "すべて停止"],
    primary: "ボットを開く",
    primaryHint: "@NexuAlphaAssistantBot の /alerts を開きます。トピックはそこで選択。同意前には何も送られません。",
    secondaryLabel: "Telegram のその他の入口",
    miniApp: "Mini App",
    miniAppHint: "Telegram 内で手数料比較と還元を確認",
  },
  ko: {
    h1: "나만의 코인 알림, 데일리 다이제스트, 거래소 이벤트를 텔레그램으로",
    sub: "봇에게 지켜볼 것을 알려 주세요: 가격대, 급등락, 청산 물결, 극단적 펀딩비, 신규 상장. 발생하는 즉시 알려 드리고 매일 21:00 SGT에 다이제스트를 보냅니다.",
    sampleLabel: "샘플 메시지",
    sampleNote: "메시지 형식의 정적 예시입니다. 숫자는 예시값입니다.",
    card: { title: "대량 청산", asset: "자산", side: "방향", long: "롱 청산", amount: "청산 금액", exchange: "거래소", window: (m) => `최근 ${m}분`, time: "시간", source: "출처: Binance + OKX 공개 데이터" },
    topicsTitle: "봇이 보내는 것",
    topics: [
      ["맞춤 알림", "/alert로 최대 10개의 나만의 규칙: 가격대, 1시간 변동, 청산, 펀딩비, 신규 상장."],
      ["주제 알림", "청산 물결, BTC / ETH 급등락, 신규 상장, 데일리 다이제스트. /alerts에서 하나씩 켜고 끄세요."],
      ["데일리 다이제스트 · 21:00 SGT", "주요 시세, 청산, 중요 속보, 오늘의 캘린더 일정, 추천 NexuAlpha 도구 하나."],
      ["이벤트와 이번 주 도구", "받을 수 있는 보상이 있는 거래소 이벤트, 그리고 매주 월요일 20:00 SGT에 채널에서 이번 주 도구를 소개합니다."],
    ],
    cmdTitle: "명령어",
    cmds: ["BTC 70,000 돌파", "ETH 2,500 하회", "SOL 1시간 5% 변동", "1시간 청산 5,000만 달러 초과", "BTC 펀딩비 ±0.1% 초과", "Binance 신규 상장", "내 알림 보기", "주제 알림 켜기 / 끄기", "모두 끄기"],
    primary: "봇 열기",
    primaryHint: "@NexuAlphaAssistantBot의 /alerts를 엽니다. 주제는 거기서 선택하며, 동의 전에는 아무것도 전송되지 않습니다.",
    secondaryLabel: "텔레그램의 다른 입구",
    miniApp: "Mini App",
    miniAppHint: "텔레그램 안에서 수수료 비교와 리베이트 확인",
  },
  ru: {
    h1: "Свои уведомления по крипторынку, ежедневная сводка и акции бирж в Telegram",
    sub: "Скажите боту, за чем следить: уровень цены, резкое движение, волна ликвидаций, экстремальный фандинг или новый листинг. Он напишет сразу, как это произойдёт, а в 21:00 SGT пришлёт ежедневную сводку.",
    sampleLabel: "Пример сообщения",
    sampleNote: "Статический пример формата. Цифры условные.",
    card: { title: "Волна ликвидаций", asset: "Актив", side: "Сторона", long: "Ликвидированы лонги", amount: "Ликвидировано", exchange: "Биржа", window: (m) => `Последние ${m} мин`, time: "Время", source: "Источник: открытые данные Binance + OKX" },
    topicsTitle: "Что присылает бот",
    topics: [
      ["Свои уведомления", "До 10 собственных правил через /alert: уровни цены, движения за 1 ч, ликвидации, фандинг и новые листинги."],
      ["Тематические уведомления", "Волны ликвидаций, резкие движения BTC / ETH, новые листинги и ежедневная сводка. Каждое включается и выключается в /alerts."],
      ["Ежедневная сводка, 21:00 SGT", "Цены, ликвидации, самые важные молнии, события календаря на сегодня и один инструмент NexuAlpha."],
      ["Акции бирж и инструмент недели", "Акции бирж с наградами для вас и «инструмент недели» каждый понедельник в 20:00 SGT в наших каналах."],
    ],
    cmdTitle: "Команды",
    cmds: ["BTC выше 70 000", "ETH ниже 2 500", "SOL сдвинулся на 5% за 1 ч", "Ликвидации больше $50M за 1 ч", "Фандинг BTC за пределами ±0,1%", "Новые листинги на Binance", "Мои уведомления", "Темы: вкл / выкл", "Выключить всё"],
    primary: "Открыть бота",
    primaryHint: "Открывает @NexuAlphaAssistantBot на /alerts. Темы вы выбираете там; до подписки ничего не отправляется.",
    secondaryLabel: "Также в Telegram",
    miniApp: "Mini App",
    miniAppHint: "Сравнение комиссий и возврат внутри Telegram",
  },
  tr: {
    h1: "Kendi kripto uyarıların, günlük özet ve borsa kampanyaları Telegram'da",
    sub: "Bota neyi izleyeceğini söyle: bir fiyat seviyesi, hızlı bir hareket, tasfiye dalgası, aşırı fonlama ya da yeni listeleme. Olduğu anda sana yazar ve her gün 21:00 SGT'de özet gönderir.",
    sampleLabel: "Örnek mesaj",
    sampleNote: "Biçimin statik örneği. Rakamlar temsilidir.",
    card: { title: "Tasfiye dalgası", asset: "Varlık", side: "Yön", long: "Longlar tasfiye edildi", amount: "Tasfiye", exchange: "Borsa", window: (m) => `Son ${m} dk`, time: "Saat", source: "Kaynak: Binance + OKX açık verisi" },
    topicsTitle: "Bot ne gönderir",
    topics: [
      ["Kişisel uyarılar", "/alert ile en fazla 10 kendi kuralın: fiyat seviyeleri, 1 saatlik hareketler, tasfiyeler, fonlama ve yeni listelemeler."],
      ["Konu uyarıları", "Tasfiye dalgaları, BTC / ETH sert hareketleri, yeni listelemeler ve günlük özet. Her birini /alerts içinde aç ya da kapat."],
      ["Günlük özet, 21:00 SGT", "Fiyatlar, tasfiyeler, en önemli flaş haberler, bugünün takvim olayları ve öne çıkan bir NexuAlpha aracı."],
      ["Kampanyalar ve haftanın aracı", "Alabileceğin ödüllerle borsa kampanyaları ve her pazartesi 20:00 SGT'de kanallarımızda haftanın aracı."],
    ],
    cmdTitle: "Komutlar",
    cmds: ["BTC 70.000'in üstüne çıkınca", "ETH 2.500'ün altına inince", "SOL 1 saatte %5 hareket edince", "1 saatte 50 milyon $ üstü tasfiye", "BTC fonlaması ±%0,1'i aşınca", "Binance'te yeni listelemeler", "Uyarılarını gör", "Konu uyarılarını aç / kapat", "Hepsini kapat"],
    primary: "Botu aç",
    primaryHint: "@NexuAlphaAssistantBot'u /alerts ile açar. Konuları orada seçersiniz; onay vermeden hiçbir şey gönderilmez.",
    secondaryLabel: "Telegram'da ayrıca",
    miniApp: "Mini App",
    miniAppHint: "Telegram içinde ücret karşılaştırması ve iade",
  },
  id: {
    h1: "Peringatan kripto versimu, ringkasan harian, dan kampanye bursa di Telegram",
    sub: "Beri tahu bot apa yang perlu dipantau: level harga, pergerakan cepat, gelombang likuidasi, funding ekstrem, atau listing baru. Bot langsung mengabarimu dan mengirim ringkasan harian pukul 21:00 SGT.",
    sampleLabel: "Contoh pesan",
    sampleNote: "Contoh statis format pesan. Angka hanya ilustrasi.",
    card: { title: "Likuidasi massal", asset: "Aset", side: "Sisi", long: "Long dilikuidasi", amount: "Dilikuidasi", exchange: "Bursa", window: (m) => `${m} menit terakhir`, time: "Waktu", source: "Sumber: data publik Binance + OKX" },
    topicsTitle: "Apa yang dikirim bot",
    topics: [
      ["Peringatan kustom", "Hingga 10 aturanmu sendiri lewat /alert: level harga, pergerakan 1 jam, likuidasi, funding, dan listing baru."],
      ["Peringatan topik", "Gelombang likuidasi, pergerakan tajam BTC / ETH, listing baru, dan ringkasan harian. Nyalakan atau matikan masing-masing di /alerts."],
      ["Ringkasan harian, 21:00 SGT", "Harga, likuidasi, berita kilat paling penting, agenda kalender hari ini, dan satu alat NexuAlpha pilihan."],
      ["Kampanye dan alat minggu ini", "Kampanye bursa dengan hadiah yang bisa kamu klaim, plus alat minggu ini setiap Senin pukul 20:00 SGT di kanal kami."],
    ],
    cmdTitle: "Perintah",
    cmds: ["BTC naik di atas 70.000", "ETH turun di bawah 2.500", "SOL bergerak 5% dalam 1 jam", "Likuidasi di atas $50 jt dalam 1 jam", "Funding BTC melewati ±0,1%", "Listing baru di Binance", "Lihat peringatanmu", "Nyalakan / matikan topik", "Matikan semua"],
    primary: "Buka bot",
    primaryHint: "Membuka @NexuAlphaAssistantBot di /alerts. Pilih topik di sana; tidak ada yang dikirim sebelum Anda berlangganan.",
    secondaryLabel: "Juga di Telegram",
    miniApp: "Mini App",
    miniAppHint: "Perbandingan biaya dan rebate di dalam Telegram",
  },
  vi: {
    h1: "Cảnh báo crypto theo ý bạn, bản tin hằng ngày và sự kiện sàn trên Telegram",
    sub: "Cho bot biết cần theo dõi gì: mốc giá, biến động nhanh, làn sóng thanh lý, funding cực trị hay niêm yết mới. Bot báo ngay khi xảy ra và gửi bản tin hằng ngày lúc 21:00 SGT.",
    sampleLabel: "Tin nhắn mẫu",
    sampleNote: "Ví dụ tĩnh về định dạng tin nhắn. Số liệu chỉ để minh họa.",
    card: { title: "Thanh lý hàng loạt", asset: "Tài sản", side: "Chiều", long: "Long bị thanh lý", amount: "Giá trị thanh lý", exchange: "Sàn", window: (m) => `${m} phút qua`, time: "Thời gian", source: "Nguồn: dữ liệu công khai Binance + OKX" },
    topicsTitle: "Bot gửi gì",
    topics: [
      ["Cảnh báo tùy chỉnh", "Tối đa 10 quy tắc của riêng bạn với /alert: mốc giá, biến động 1 giờ, thanh lý, funding và niêm yết mới."],
      ["Cảnh báo theo chủ đề", "Làn sóng thanh lý, biến động mạnh BTC / ETH, niêm yết mới và bản tin hằng ngày. Bật hoặc tắt từng mục trong /alerts."],
      ["Bản tin hằng ngày, 21:00 SGT", "Giá, thanh lý, tin nhanh quan trọng nhất, sự kiện lịch hôm nay và một công cụ NexuAlpha nổi bật."],
      ["Sự kiện sàn và công cụ của tuần", "Sự kiện sàn có phần thưởng bạn nhận được, cùng công cụ của tuần vào 20:00 SGT mỗi thứ Hai trên kênh của chúng tôi."],
    ],
    cmdTitle: "Lệnh",
    cmds: ["BTC vượt 70.000", "ETH xuống dưới 2.500", "SOL biến động 5% trong 1 giờ", "Thanh lý trên 50 triệu USD trong 1 giờ", "Funding BTC vượt ±0,1%", "Niêm yết mới trên Binance", "Xem cảnh báo của bạn", "Bật / tắt chủ đề", "Tắt tất cả"],
    primary: "Mở bot",
    primaryHint: "Mở @NexuAlphaAssistantBot tại /alerts. Bạn chọn chủ đề ở đó; không gửi gì trước khi bạn đăng ký.",
    secondaryLabel: "Cũng có trên Telegram",
    miniApp: "Mini App",
    miniAppHint: "So sánh phí và hoàn phí ngay trong Telegram",
  },
  ar: {
    h1: "تنبيهات كريبتو خاصة بك، وموجز يومي، وحملات المنصات على تيليجرام",
    sub: "أخبر البوت بما يراقبه: مستوى سعر، أو تحرك سريع، أو موجة تصفية، أو تمويل متطرف، أو إدراج جديد. يراسلك فور حدوثه ويرسل موجزًا يوميًا في 21:00 SGT.",
    sampleLabel: "رسالة نموذجية",
    sampleNote: "مثال ثابت على شكل الرسالة. الأرقام توضيحية.",
    card: { title: "موجة تصفية", asset: "الأصل", side: "الاتجاه", long: "تصفية مراكز شراء", amount: "قيمة التصفية", exchange: "المنصة", window: (m) => `آخر ${m} دقيقة`, time: "الوقت", source: "المصدر: بيانات عامة من Binance وOKX" },
    topicsTitle: "ما يرسله البوت",
    topics: [
      ["تنبيهات مخصصة", "حتى 10 قواعد خاصة بك عبر /alert: مستويات الأسعار، وتحركات ساعة، والتصفيات، والتمويل، والإدراجات الجديدة."],
      ["تنبيهات المواضيع", "موجات التصفية، وتحركات BTC / ETH الحادة، والإدراجات الجديدة، والموجز اليومي. فعّل أو أوقف كلًا منها في /alerts."],
      ["الموجز اليومي، 21:00 SGT", "الأسعار، والتصفيات، وأهم الأخبار العاجلة، وأحداث تقويم اليوم، وأداة مختارة من NexuAlpha."],
      ["الحملات وأداة الأسبوع", "حملات المنصات بمكافآت يمكنك الحصول عليها، وأداة الأسبوع كل اثنين في 20:00 SGT في قنواتنا."],
    ],
    cmdTitle: "الأوامر",
    cmds: ["BTC يتجاوز 70,000", "ETH ينزل تحت 2,500", "SOL يتحرك 5% خلال ساعة", "تصفيات تتجاوز 50 مليون $ خلال ساعة", "تمويل BTC يتجاوز ±0.1%", "إدراجات جديدة على Binance", "عرض تنبيهاتك", "تشغيل / إيقاف المواضيع", "إيقاف كل شيء"],
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
  h1: "اپنے کرپٹو الرٹس، روزانہ خلاصہ اور ایکسچینج مہمات Telegram میں",
  sub: "بوٹ کو بتائیں کس چیز پر نظر رکھنی ہے: قیمت کی سطح، تیز حرکت، لیکویڈیشن کی لہر، انتہائی فنڈنگ یا نئی لسٹنگ۔ ہوتے ہی پیغام بھیجتا ہے اور روزانہ 21:00 SGT پر خلاصہ بھیجتا ہے۔",
  sampleLabel: "نمونہ پیغام",
  sampleNote: "پیغام کے فارمیٹ کی جامد مثال۔ اعداد صرف جگہ رکھنے کے لیے ہیں۔",
  card: { ...COPY.en.card, title: "لیکویڈیشن کی لہر", asset: "اثاثہ", side: "سمت", long: "لیکویڈ لانگ پوزیشنز", amount: "لیکویڈ رقم", exchange: "پلیٹ فارم", window: (m) => `گزشتہ ${m} منٹ`, time: "وقت", source: "ماخذ: Binance + OKX عوامی ڈیٹا" },
  topicsTitle: "بوٹ کیا بھیجتا ہے",
  topics: [
    ["اپنے الرٹس", "/alert سے اپنے 10 تک اصول: قیمت کی سطحیں، 1 گھنٹے کی حرکت، لیکویڈیشنز، فنڈنگ اور نئی لسٹنگز۔"],
    ["موضوعاتی الرٹس", "لیکویڈیشن کی لہریں، BTC / ETH کی تیز حرکت، نئی لسٹنگز اور روزانہ خلاصہ۔ ہر ایک کو /alerts میں آن یا آف کریں۔"],
    ["روزانہ خلاصہ، 21:00 SGT", "قیمتیں، لیکویڈیشنز، اہم ترین فلیش خبریں، آج کے کیلنڈر ایونٹس اور NexuAlpha کا ایک منتخب ٹول۔"],
    ["مہمات اور ہفتے کا ٹول", "ایکسچینج مہمات جن کے انعامات آپ حاصل کر سکتے ہیں، اور ہر پیر 20:00 SGT پر ہمارے چینلز میں ہفتے کا ٹول۔"],
  ],
  cmdTitle: "کمانڈز",
  cmds: ["BTC 70,000 سے اوپر", "ETH 2,500 سے نیچے", "SOL ایک گھنٹے میں 5% حرکت", "ایک گھنٹے میں 50M$ سے زیادہ لیکویڈیشن", "BTC فنڈنگ ±0.1% سے زیادہ", "Binance پر نئی لسٹنگز", "اپنے الرٹس دیکھیں", "موضوعات آن / آف", "سب بند کریں"],
  primary: "بوٹ کھولیں",
  primaryHint: "@NexuAlphaAssistantBot کو /alerts پر کھولتا ہے۔ موضوعات آپ وہاں منتخب کرتے ہیں؛ آپ کی منظوری سے پہلے کچھ نہیں بھیجا جاتا۔",
  secondaryLabel: "Telegram پر بھی",
  miniApp: "Mini App",
  miniAppHint: "Telegram کے اندر فیس موازنہ اور ریبیٹ",
};
// l10n: needs native review
COPY.uk = {
  ...COPY.en,
  h1: "Власні криптосповіщення, щоденний дайджест і кампанії бірж у Telegram",
  sub: "Скажіть боту, за чим стежити: рівень ціни, швидкий рух, хвиля ліквідацій, екстремальне фінансування чи новий лістинг. Він напише одразу, щойно це станеться, і надсилає щоденний дайджест о 21:00 SGT.",
  sampleLabel: "Приклад повідомлення",
  sampleNote: "Статичний приклад формату повідомлення. Числа є заповнювачами.",
  card: { ...COPY.en.card, title: "Хвиля ліквідацій", asset: "Актив", side: "Сторона", long: "Ліквідовано довгі позиції", amount: "Ліквідовано", exchange: "Платформа", window: (m) => `Останні ${m} хв`, time: "Час", source: "Джерело: публічні дані Binance + OKX" },
  topicsTitle: "Що надсилає бот",
  topics: [
    ["Власні сповіщення", "До 10 власних правил через /alert: рівні ціни, рухи за 1 год, ліквідації, фінансування й нові лістинги."],
    ["Тематичні сповіщення", "Хвилі ліквідацій, різкі рухи BTC / ETH, нові лістинги та щоденний дайджест. Кожне вмикається й вимикається в /alerts."],
    ["Щоденний дайджест, 21:00 SGT", "Ціни, ліквідації, найважливіші блискавки, події календаря на сьогодні та один інструмент NexuAlpha."],
    ["Кампанії та інструмент тижня", "Кампанії бірж із винагородами для вас та інструмент тижня щопонеділка о 20:00 SGT у наших каналах."],
  ],
  cmdTitle: "Команди",
  cmds: ["BTC вище 70 000", "ETH нижче 2 500", "SOL рухається на 5% за 1 год", "Ліквідації понад $50M за 1 год", "Фінансування BTC понад ±0,1%", "Нові лістинги на Binance", "Мої сповіщення", "Теми: увімк. / вимк.", "Вимкнути все"],
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
  // The reader's own-language channel comes first (zh, ru, otherwise en).
  const own = String(locale || "").startsWith("zh") ? "channel-zh" : locale === "ru" ? "channel-ru" : "channel-en";
  const channels = [
    TELEGRAM_ENTRIES.channelZh && { key: "channel-zh", href: TELEGRAM_ENTRIES.channelZh, label: tg.ch, handle: "@NexuAlphaClub" },
    TELEGRAM_ENTRIES.channelEn && { key: "channel-en", href: TELEGRAM_ENTRIES.channelEn, label: tg.en, handle: `@${TELEGRAM_ENTRIES.channelEn.split("/").pop()}` },
    TELEGRAM_ENTRIES.channelRu && { key: "channel-ru", href: TELEGRAM_ENTRIES.channelRu, label: tg.ruc, handle: `@${TELEGRAM_ENTRIES.channelRu.split("/").pop()}` },
  ].filter(Boolean).sort((a, b) => (b.key === own) - (a.key === own));
  const secondary = [
    ...channels,
    { key: "mini-app", href: MINI_APP_URL, label: t.miniApp, handle: t.miniAppHint },
    TELEGRAM_ENTRIES.group && { key: "group", href: TELEGRAM_ENTRIES.group, label: tg.grp, handle: "@NexuAlphaWorld" },
  ].filter(Boolean);
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
        <Sub className="tg-signal-hero__topics-title tg-signal-hero__cmds-title">{t.cmdTitle}</Sub>
        <ul className="tg-signal-hero__cmds">
          {TELEGRAM_ALERT_COMMANDS.map((cmd, i) => <li key={cmd}><code translate="no" dir="ltr">{cmd}</code><span>{t.cmds[i]}</span></li>)}
        </ul>
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
