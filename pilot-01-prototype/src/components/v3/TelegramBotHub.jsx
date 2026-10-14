/**
 * TelegramBotHub — C2. Telegram 官方机器人与社群生态看板
 * 链接本地 Mac mini Telegram 工程资产，将 Web 用户导入 Telegram 私域。
 * 包含极速指令交互卡（/fees, /alert, /checklink）与参数化 Deep Link 直达唤起。
 */
import React, { useState, useCallback, useEffect } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { TELEGRAM_CONFIG, TELEGRAM_COMMANDS, TELEGRAM_RESEARCH_PATHS, getTelegramDeepLink } from "../../data/telegram-config.js";
import { buildTelegramReturnContext, readTelegramReturnContext, telegramReturnDataAttrs } from "../../data/telegram-decision-return.js";
import { TelegramAlertsHero, telegramAlertsHeroCopy } from "./TelegramAlertsHero.jsx";
import { hydratedTelegramReturnAttrs, telegramReturnClockOption, useHydratedTelegramReturnNow } from "./telegram-return-hydration.js";
import "./telegram-bot-hub.css";

const copy = {
  "zh-Hans": {
    badge: "TELEGRAM BOT ECOSYSTEM / 决策工具入口",
    title: "把比较、核验与回访路径带进 Telegram",
    subtitle: "从 Telegram 打开同一条研究路径，查看来源状态、公开费率情景和官方入口。具体数据与用户权益仍以页面和官方账户为准。",
    inboundBadge: "WAVE14 回流承接",
    inboundTitle: "53 条草稿先回到站内答案页，再进入 Bot",
    inboundSubtitle: "每条 Telegram 消息都对应一个可先在 NexuAlpha 查看的页面。用户先看比较、地区核对、费用工具或研究页，再决定是否继续到 Bot。",
    inboundStats: [["53", "待审核草稿"], ["7 天", "人工节奏"], ["0", "原始注册链接"]],
    commandsBadge: "COMMAND DECK / 指令入口",
    commandsTitle: "在 Telegram 中继续你的研究路径",
    commandsSubtitle: "下面的指令用于打开对应的比较、测算、活动研究或域名核验入口；结果是否实时取决于当前已连接并通过检查的数据源。",
    btnCopyCmd: "复制指令",
    btnCopiedCmd: "已复制",
    btnCopyFailed: "复制失败，请长按手动复制",
    btnLaunchDeepLink: "直达唤起",
    samplePrefix: "示例：",
    features: [
      {
        icon: "",
        title: "来源标注的费率研究",
        desc: "从公开比较路径回到页面，查看费率、更新时间和官方条件；没有来源的数据保持待核验。",
      },
      {
        icon: "",
        title: "官方域名核验入口",
        desc: "把交易所域名送入核验路径，结果只依据已记录的官方来源，不把入口链接当作安全保证。",
      },
      {
        icon: "",
        title: "主动订阅的研究提醒",
        desc: "未来接入并通过检查的活动或费率更新后，才进入提醒；当前未连接的数据源会明确标注。",
      },
    ],
    channelFeedBadge: "OFFICIAL BROADCAST / 官方广播与长尾反链",
    channelFeedTitle: "订阅 Telegram 官方研究频道",
    channelFeedDesc: "频道用于发布有来源的研究、比较和安全提示；发布频率与内容取决于已核验的资料，不承诺实时或收益结果。",
    tgBotHandle: `@${TELEGRAM_CONFIG.botUsername}`,
    tgGroupTitle: "NexuAlpha 交易者交流社群",
    tgGroupDesc: "与社区成员讨论平台条件、费率口径和官方入口核验；不要把社群消息当作开户或收益保证。",
    btnJoinBot: "在 Telegram 中启动助手 Bot ↗",
    btnJoinGroup: "加入 Telegram 社区群 ↗",
    btnJoinChannel: "订阅官方频道 ↗",
    btnWebPreview: "公开频道 Web 预览 ↗",
    topicBadge: "ANSWER-FIRST ROUTES / 站内研究入口",
    topicTitle: "先回答问题，再决定下一步",
    topicSubtitle: "Telegram 回流用户先进入公开研究页面：比较、详情、费用工具或地区核对完成后，再按需要打开 Bot。",
    topicOpen: "打开站内入口",
    topicBot: "继续到 Bot",
    topicMore: "查看更多研究入口",
    topicLess: "收起其他研究入口",
    searchBadge: "SEARCH TOPIC QUEUE / 搜索主题草稿",
    searchTitle: "本周高意图搜索回流队列",
    searchSubtitle: "这些入口对应待人工审核 Telegram 草稿；先打开站内页面回答问题，再决定是否进入 Bot。",
    searchPrimary: "站内落地页",
    searchCadence: "更新节奏",
    reviewBadge: "MANUAL REVIEW / 匿名指标",
    reviewTitle: "发布前后只看站内匿名信号",
    reviewSubtitle: "人工发布前确认 NexuAlpha 链接优先、UTM 参数完整、没有裸注册链接或邀请码。发布后只记录 24h/7d 聚合指标，不推断开户、KYC、交易或佣金。",
    reviewParamLabel: "必保留参数",
    reviewForbiddenLabel: "禁用内容",
    opsSummary: "展开 Telegram 运营复核与搜索草稿",
    commandsSummary: "展开高级 Bot 指令",
    returnTitle: "给下一次回访一个明确理由",
    returnSubtitle: "不用重新开始：从上次比较、费率测算或平台监控继续。",
    returnItems: [
      ["保存比较", "回到 Binance 与 OKX 的公开条件对比", { action: "compare", pair: "binance-vs-okx" }],
      ["继续测算", "重新打开公开费率情景入口", { action: "fee_calc", venue: "binance" }],
      ["关注变化", "主动订阅已核验的平台条件更新", { action: "rates", venue: "binance" }],
    ],
  },
  "zh-Hant": {
    badge: "TELEGRAM BOT ECOSYSTEM / 決策工具入口",
    title: "把比較、核驗與回訪路徑帶進 Telegram",
    subtitle: "從 Telegram 打開同一條研究路徑，查看來源狀態、公開費率情景和官方入口。具體資料與用戶權益仍以頁面和官方帳戶為準。",
    inboundBadge: "WAVE14 回流承接",
    inboundTitle: "53 條草稿先回到站內答案頁，再進入 Bot",
    inboundSubtitle: "每則 Telegram 訊息都對應一個可先在 NexuAlpha 查看的頁面。用戶先看比較、地區核對、費用工具或研究頁，再決定是否繼續到 Bot。",
    inboundStats: [["53", "待審核草稿"], ["7 天", "人工節奏"], ["0", "原始註冊連結"]],
    commandsBadge: "COMMAND DECK / 指令入口",
    commandsTitle: "在 Telegram 中繼續你的研究路徑",
    commandsSubtitle: "下方指令用於打開對應的比較、測算、活動研究或網域核驗入口；結果是否即時取決於目前已連接並通過檢查的資料源。",
    btnCopyCmd: "複製指令",
    btnCopiedCmd: "已複製",
    btnCopyFailed: "複製失敗，請長按手動複製",
    btnLaunchDeepLink: "直達喚起",
    samplePrefix: "示例：",
    features: [
      {
        icon: "",
        title: "來源標注的費率研究",
        desc: "從公開比較路徑回到頁面，查看費率、更新時間和官方條件；沒有來源的資料保持待核驗。",
      },
      {
        icon: "",
        title: "官方網域核驗入口",
        desc: "把交易所網域送入核驗路徑，結果只依據已記錄的官方來源，不把入口連結當作安全保證。",
      },
      {
        icon: "",
        title: "主動訂閱的研究提醒",
        desc: "未來接入並通過檢查的活動或費率更新後，才進入提醒；目前未連接的資料源會明確標注。",
      },
    ],
    channelFeedBadge: "OFFICIAL BROADCAST / 官方廣播與長尾反鏈",
    channelFeedTitle: "訂閱 Telegram 官方研究頻道",
    channelFeedDesc: "頻道用於發布有來源的研究、比較和安全提示；發布頻率與內容取決於已核驗的資料，不承諾即時或收益結果。",
    tgBotHandle: `@${TELEGRAM_CONFIG.botUsername}`,
    tgGroupTitle: "NexuAlpha 交易者交流社群",
    tgGroupDesc: "與社區成員討論平台條件、費率口徑和官方入口核驗；不要把社群消息當作開戶或收益保證。",
    btnJoinBot: "在 Telegram 中啟動助手 Bot ↗",
    btnJoinGroup: "加入 Telegram 社區群 ↗",
    btnJoinChannel: "訂閱官方頻道 ↗",
    btnWebPreview: "公開頻道 Web 預覽 ↗",
    topicBadge: "ANSWER-FIRST ROUTES / 站內研究入口",
    topicTitle: "先回答問題，再決定下一步",
    topicSubtitle: "Telegram 回流用戶先進入公開研究頁面：比較、詳情、費用工具或地區核對完成後，再按需要打開 Bot。",
    topicOpen: "打開站內入口",
    topicBot: "繼續到 Bot",
    topicMore: "查看更多研究入口",
    topicLess: "收起其他研究入口",
    searchBadge: "SEARCH TOPIC QUEUE / 搜尋主題草稿",
    searchTitle: "本週高意圖搜尋回流隊列",
    searchSubtitle: "這些入口對應待人工審核 Telegram 草稿；先打開站內頁面回答問題，再決定是否進入 Bot。",
    searchPrimary: "站內落地頁",
    searchCadence: "更新節奏",
    reviewBadge: "MANUAL REVIEW / 匿名指標",
    reviewTitle: "發布前後只看站內匿名信號",
    reviewSubtitle: "人工發布前確認 NexuAlpha 連結優先、UTM 參數完整、沒有裸註冊連結或邀請碼。發布後只記錄 24h/7d 聚合指標，不推斷開戶、KYC、交易或佣金。",
    reviewParamLabel: "必保留參數",
    reviewForbiddenLabel: "禁用內容",
    opsSummary: "展開 Telegram 營運複核與搜尋草稿",
    commandsSummary: "展開進階 Bot 指令",
    returnTitle: "為下一次回訪留下一個明確理由",
    returnSubtitle: "不用重新開始：從上次比較、費率測算或平台監控繼續。",
    returnItems: [
      ["保存比較", "回到 Binance 與 OKX 的公開條件對比", { action: "compare", pair: "binance-vs-okx" }],
      ["繼續測算", "重新打開公開費率情景入口", { action: "fee_calc", venue: "binance" }],
      ["關注變化", "主動訂閱已核驗的平台條件更新", { action: "rates", venue: "binance" }],
    ],
  },
  en: {
    badge: "TELEGRAM BOT ECOSYSTEM",
    title: "Continue exchange research inside Telegram",
    subtitle: "Open the same comparison, source-review, and official-link paths from Telegram. Data and user benefits remain subject to the page and official account.",
    inboundBadge: "WAVE14 INBOUND PATH",
    inboundTitle: "53 reviewed drafts send users to NexuAlpha before the Bot",
    inboundSubtitle: "Each Telegram message links to a NexuAlpha page you can read first. Visitors get the comparison, regional checklist, fee tool, or research answer before any Bot follow-up.",
    inboundStats: [["53", "review drafts"], ["7 days", "manual rhythm"], ["0", "raw signup links"]],
    commandsBadge: "SOURCE-REVIEW COMMANDS",
    commandsTitle: "Telegram research command deck",
    commandsSubtitle: "Use one-click deep links for comparison, fee scenarios, campaign research, or domain verification. Real-time results require a connected, checked data source.",
    btnCopyCmd: "Copy",
    btnCopiedCmd: "Copied!",
    btnLaunchDeepLink: "Launch Bot",
    samplePrefix: "Sample: ",
    features: [
      {
        icon: "",
        title: "Source-labelled fee research",
        desc: "Return to a comparison path with source, date, and official conditions; values we have not verified are marked “not yet checked”.",
      },
      {
        icon: "",
        title: "Official-domain review path",
        desc: "Send a domain into the protected source-review path; an outbound link is never a security guarantee.",
      },
      {
        icon: "",
        title: "Opt-in research reminders",
        desc: "Only connected, source-checked updates can become reminders; unavailable feeds remain explicitly labelled.",
      },
    ],
    channelFeedBadge: "OFFICIAL BROADCAST",
    channelFeedTitle: "Subscribe to the official research channel",
    channelFeedDesc: "The channel publishes sourced research, comparisons, and security notes. Cadence and coverage depend on verified inputs.",
    tgBotHandle: `@${TELEGRAM_CONFIG.botUsername}`,
    tgGroupTitle: "NexuAlpha Trader Community",
    tgGroupDesc: "Discuss platform conditions, fee definitions, and official-link checks with the community; group posts are not signup or return guarantees.",
    btnJoinBot: "Launch Assistant Bot ↗",
    btnJoinGroup: "Join Community Group ↗",
    btnJoinChannel: "Subscribe to Official Channel ↗",
    btnWebPreview: "Web Preview Archive ↗",
    btnCopyFailed: "Copy failed",
    topicBadge: "ANSWER-FIRST ROUTES",
    topicTitle: "Answer the question before the Telegram handoff",
    topicSubtitle: "Telegram visitors get a clear onsite path first: comparison, venue detail, fee tool, or regional checklist. The Bot is the follow-up route.",
    topicOpen: "Open onsite path",
    topicBot: "Continue in Bot",
    topicMore: "View more research routes",
    topicLess: "Hide extra research routes",
    searchBadge: "SEARCH TOPIC QUEUE",
    searchTitle: "Search-led Telegram drafts for this week",
    searchSubtitle: "Each draft starts with a NexuAlpha landing page and keeps Telegram as the follow-up path after the answer.",
    searchPrimary: "Onsite landing",
    searchCadence: "Cadence",
    reviewBadge: "MANUAL REVIEW",
    reviewTitle: "Measure anonymous onsite signals before and after posting",
    reviewSubtitle: "Before a human post, confirm NexuAlpha-first links, complete UTM context, and no raw signup links or invite codes. After posting, record only 24h/7d aggregate metrics; do not infer account creation, KYC, trades, or commission.",
    reviewParamLabel: "Required parameters",
    reviewForbiddenLabel: "Forbidden content",
    opsSummary: "Open Telegram review controls and search drafts",
    commandsSummary: "Open advanced Bot commands",
    returnTitle: "Give the next visit a clear reason",
    returnSubtitle: "Pick up where you left off: comparison, fee scenario, or venue monitoring.",
    returnItems: [
      ["Save comparison", "Return to the public Binance vs OKX conditions", { action: "compare", pair: "binance-vs-okx" }],
      ["Continue model", "Reopen the published-fee scenario entry", { action: "fee_calc", venue: "binance" }],
      ["Watch changes", "Opt in to checked venue-condition updates", { action: "rates", venue: "binance" }],
    ],
  },
  "pt-BR": {
    badge: "ECOSSISTEMA DO BOT TELEGRAM",
    title: "Continue a pesquisa de exchanges no Telegram",
    subtitle: "Abra os mesmos caminhos de comparação, revisão de fontes e links oficiais dentro do Telegram. Dados e benefícios dependem da página e da conta oficial.",
    inboundBadge: "RESPOSTA NO SITE PRIMEIRO",
    inboundTitle: "53 caminhos de pesquisa levam primeiro à página da NexuAlpha",
    inboundSubtitle: "Cada caminho do Telegram preserva a página pública da NexuAlpha, o contexto UTM revisável e a checagem manual. O visitante vê comparação, checklist regional, ferramenta de custo ou pesquisa antes do Bot.",
    inboundStats: [["53", "caminhos revisados"], ["7 dias", "ritmo manual"], ["0", "links diretos"]],
    commandsBadge: "COMANDOS RÁPIDOS",
    commandsTitle: "Painel de comandos de pesquisa",
    commandsSubtitle: "Use deep links para comparação, cenários de taxas, pesquisa de campanhas ou verificação de domínios. Resultados em tempo real exigem uma fonte conectada e verificada.",
    btnCopyCmd: "Copiar",
    btnCopiedCmd: "Copiado!",
    btnCopyFailed: "Falha ao copiar",
    btnLaunchDeepLink: "Abrir Bot",
    samplePrefix: "Exemplo: ",
    features: [
      {
        icon: "",
        title: "Pesquisa de taxas com fonte",
        desc: "Volte ao caminho de comparação com fonte, data e condições oficiais; valores não verificados ficam pendentes.",
      },
      {
        icon: "",
        title: "Caminho de revisão de domínio",
        desc: "Envie um domínio para a revisão das fontes registadas; um link externo nunca é uma garantia de segurança.",
      },
      {
        icon: "",
        title: "Lembretes de pesquisa opt-in",
        desc: "Somente atualizações conectadas e verificadas podem gerar lembretes; feeds indisponíveis ficam identificados.",
      },
    ],
    channelFeedBadge: "CANAL OFICIAL",
    channelFeedTitle: "Inscreva-se no canal oficial de pesquisa",
    channelFeedDesc: "O canal publica pesquisas, comparações e notas de segurança com fontes. A cobertura depende dos dados verificados.",
    tgBotHandle: `@${TELEGRAM_CONFIG.botUsername}`,
    tgGroupTitle: "Comunidade de Traders NexuAlpha",
    tgGroupDesc: "Discuta condições de plataformas, definições de taxas e verificações de links oficiais; mensagens do grupo não garantem cadastro ou retorno.",
    btnJoinBot: "Abrir Bot no Telegram ↗",
    btnJoinGroup: "Entrar no Grupo ↗",
    btnJoinChannel: "Entrar no Canal Oficial ↗",
    btnWebPreview: "Ver Prévia Web ↗",
    topicBadge: "ROTAS COM RESPOSTA PRIMEIRO",
    topicTitle: "Responda a pergunta antes do handoff Telegram",
    topicSubtitle: "Visitantes do Telegram entram primeiro em uma página pública: comparação, detalhe, ferramenta de custo ou checklist regional. O Bot fica como próximo passo.",
    topicOpen: "Abrir rota no site",
    topicBot: "Continuar no Bot",
    topicMore: "Ver mais rotas de pesquisa",
    topicLess: "Ocultar rotas adicionais",
    searchBadge: "TÓPICOS DE BUSCA",
    searchTitle: "Caminhos Telegram guiados por busca",
    searchSubtitle: "Cada caminho começa por uma página NexuAlpha e deixa o Telegram como próximo passo depois da resposta.",
    searchPrimary: "Página de destino",
    searchCadence: "Cadência",
    reviewBadge: "REVISÃO MANUAL",
    reviewTitle: "Meça apenas sinais anônimos no site",
    reviewSubtitle: "Antes da publicação manual, confirme link da NexuAlpha primeiro, UTM completo e nenhum link direto de cadastro ou código de convite. Depois, registre apenas métricas agregadas de 24h/7d.",
    reviewParamLabel: "Parâmetros obrigatórios",
    reviewForbiddenLabel: "Conteúdo proibido",
    opsSummary: "Abrir revisão Telegram e rascunhos de busca",
    commandsSummary: "Abrir comandos avançados do Bot",
    returnTitle: "Dê um motivo claro para voltar",
    returnSubtitle: "Continue de onde parou: comparação, cenário de taxas ou monitoramento.",
    returnItems: [
      ["Salvar comparação", "Voltar à comparação pública Binance vs OKX", { action: "compare", pair: "binance-vs-okx" }],
      ["Continuar cálculo", "Reabrir o cenário de taxas publicadas", { action: "fee_calc", venue: "binance" }],
      ["Acompanhar mudanças", "Receber atualizações de condições verificadas", { action: "rates", venue: "binance" }],
    ],
  },
};

copy.ja = { ...copy.en, commandsSummary: "高度な Bot コマンドを開く", badge: "TELEGRAM BOT ECOSYSTEM / 調査ツール", title: "比較・確認・再訪を Telegram で続ける", subtitle: "Telegram から同じ比較、出典確認、公式リンクの導線を開けます。データとユーザー向け条件はページと公式アカウントをご確認ください。", commandsBadge: "調査コマンド", commandsTitle: "Telegramで調査を続ける", commandsSubtitle: "比較、手数料シナリオ、活動調査、ドメイン確認を開きます。リアルタイム結果は接続済みの確認済みデータに依存します。", btnCopyCmd: "コマンドをコピー", btnCopiedCmd: "コピーしました", btnCopyFailed: "コピーに失敗しました", btnLaunchDeepLink: "Botを開く", samplePrefix: "例：", features: [{ icon: "", title: "出典付き手数料調査", desc: "出典、日付、公式条件を確認できる比較ページへ戻ります。未確認の値は確認待ちとして表示します。" }, { icon: "", title: "公式ドメイン確認ルート", desc: "ドメインを設定済みの公式ソース確認ルートへ送ります。外部リンクは安全を保証しません。" }, { icon: "", title: "研究更新の通知登録", desc: "確認済みの更新だけを通知対象にします。未接続のデータソースは明示します。" }], channelFeedBadge: "公式配信", channelFeedTitle: "公式 Telegram 調査チャンネルを購読", channelFeedDesc: "出典付きの調査、比較、安全情報を掲載します。頻度と範囲は確認済みデータに依存します。", tgGroupTitle: "NexuAlpha トレーダーコミュニティ", tgGroupDesc: "プラットフォーム条件、手数料の定義、公式リンクを確認できます。コミュニティ投稿は登録や利益を保証しません。", btnJoinBot: "TelegramでBotを起動 ↗", btnJoinGroup: "Telegramコミュニティに参加 ↗", btnJoinChannel: "公式チャンネルを購読 ↗", btnWebPreview: "Webプレビュー ↗", returnTitle: "次回戻る理由を保存", returnSubtitle: "比較、手数料計算、プラットフォーム監視を続きから再開できます。", returnItems: [["比較を保存", "Binance と OKX の公開条件比較に戻る", { action: "compare", pair: "binance-vs-okx" }], ["計算を続ける", "公開手数料シナリオを再び開く", { action: "fee_calc", venue: "binance" }], ["変化を追う", "確認済みの条件更新を購読する", { action: "rates", venue: "binance" }]] };
copy.ko = { ...copy.en, commandsSummary: "고급 Bot 명령 열기", badge: "TELEGRAM BOT ECOSYSTEM / 리서치 도구", title: "Telegram에서 비교·검증·재방문을 계속하세요", subtitle: "Telegram에서 동일한 비교, 출처 검토, 공식 링크 경로를 엽니다. 데이터와 사용자 혜택은 페이지와 공식 계정 기준입니다.", commandsBadge: "리서치 명령", commandsTitle: "Telegram 리서치 명령 센터", commandsSubtitle: "비교, 수수료 시나리오, 활동 조사, 도메인 검증을 엽니다. 실시간 결과는 연결된 검증 데이터에 따라 달라집니다.", btnCopyCmd: "명령 복사", btnCopiedCmd: "복사됨", btnCopyFailed: "복사 실패", btnLaunchDeepLink: "Bot 열기", samplePrefix: "예시: ", channelFeedTitle: "공식 Telegram 리서치 채널 구독", btnJoinBot: "Telegram에서 Bot 시작 ↗", btnJoinGroup: "Telegram 커뮤니티 참여 ↗", btnJoinChannel: "공식 채널 구독 ↗", btnWebPreview: "웹 미리보기 ↗", returnTitle: "다시 방문할 이유를 저장하세요", returnSubtitle: "비교, 수수료 계산 또는 플랫폼 모니터링을 이어서 진행합니다." };
copy.tr = { ...copy.en, commandsSummary: "Gelişmiş Bot komutlarını aç", badge: "TELEGRAM BOT EKOSİSTEMİ / ARAŞTIRMA ARAÇLARI", title: "Karşılaştırma ve doğrulamaya Telegram'da devam edin", subtitle: "Aynı karşılaştırma, kaynak inceleme ve resmi bağlantı yollarını Telegram'dan açın. Veriler ve kullanıcı koşulları sayfaya ve resmi hesaba bağlıdır.", commandsBadge: "ARAŞTIRMA KOMUTLARI", commandsTitle: "Telegram araştırma komut merkezi", commandsSubtitle: "Karşılaştırma, ücret senaryosu, kampanya araştırması veya alan adı doğrulamasını açın. Canlı sonuçlar doğrulanmış veri kaynağı gerektirir.", btnCopyCmd: "Komutu kopyala", btnCopiedCmd: "Kopyalandı", btnCopyFailed: "Kopyalama başarısız", btnLaunchDeepLink: "Botu aç", samplePrefix: "Örnek: ", channelFeedTitle: "Resmi Telegram araştırma kanalına abone olun", btnJoinBot: "Telegram'da Botu başlat ↗", btnJoinGroup: "Telegram topluluğuna katıl ↗", btnJoinChannel: "Resmi kanala abone ol ↗", btnWebPreview: "Web önizlemesi ↗", returnTitle: "Geri dönmek için net bir neden", returnSubtitle: "Karşılaştırma, ücret hesabı veya platform takibine kaldığınız yerden devam edin." };
copy.es = { ...copy.en, commandsSummary: "Abrir comandos avanzados del bot", badge: "ECOSISTEMA DEL BOT DE TELEGRAM / HERRAMIENTAS", title: "Continúa la comparación y verificación en Telegram", subtitle: "Abre desde Telegram las mismas rutas de comparación, fuentes y enlaces oficiales. Los datos y beneficios dependen de la página y la cuenta oficial.", commandsBadge: "COMANDOS DE INVESTIGACIÓN", commandsTitle: "Centro de comandos de Telegram", btnCopyCmd: "Copiar comando", btnCopiedCmd: "Copiado", btnCopyFailed: "No se pudo copiar", btnLaunchDeepLink: "Abrir bot", samplePrefix: "Ejemplo: ", channelFeedTitle: "Suscríbete al canal oficial de investigación", btnJoinBot: "Iniciar bot en Telegram ↗", btnJoinGroup: "Unirse a la comunidad de Telegram ↗", btnJoinChannel: "Suscribirse al canal oficial ↗", btnWebPreview: "Vista previa web ↗", returnTitle: "Deja un motivo claro para volver", returnSubtitle: "Continúa desde tu última comparación, cálculo o monitorización." };
copy.fr = { ...copy.en, commandsSummary: "Ouvrir les commandes avancées du bot", badge: "ÉCOSYSTÈME DU BOT TELEGRAM / OUTILS", title: "Poursuivez la comparaison et la vérification dans Telegram", subtitle: "Ouvrez depuis Telegram les mêmes parcours de comparaison, de sources et de liens officiels. Les données et avantages dépendent de la page et du compte officiel.", commandsBadge: "COMMANDES DE RECHERCHE", commandsTitle: "Centre de commandes Telegram", btnCopyCmd: "Copier la commande", btnCopiedCmd: "Copié", btnCopyFailed: "Échec de la copie", btnLaunchDeepLink: "Ouvrir le bot", samplePrefix: "Exemple : ", channelFeedTitle: "S’abonner au canal officiel de recherche", btnJoinBot: "Lancer le bot dans Telegram ↗", btnJoinGroup: "Rejoindre la communauté Telegram ↗", btnJoinChannel: "S’abonner au canal officiel ↗", btnWebPreview: "Aperçu web ↗", returnTitle: "Donnez une raison claire de revenir", returnSubtitle: "Reprenez votre comparaison, calcul ou suivi précédent." };
copy.de = { ...copy.en, commandsSummary: "Erweiterte Bot-Befehle öffnen", badge: "TELEGRAM-BOT-ÖKOSYSTEM / TOOLS", title: "Vergleiche und Prüfungen in Telegram fortsetzen", subtitle: "Öffnen Sie dieselben Vergleichs-, Quellen- und offiziellen Linkpfade in Telegram. Daten und Vorteile richten sich nach Seite und offiziellem Konto.", commandsBadge: "RECHERCHE-BEFEHLE", commandsTitle: "Telegram-Befehlszentrale", btnCopyCmd: "Befehl kopieren", btnCopiedCmd: "Kopiert", btnCopyFailed: "Kopieren fehlgeschlagen", btnLaunchDeepLink: "Bot öffnen", samplePrefix: "Beispiel: ", channelFeedTitle: "Offiziellen Recherchekanal abonnieren", btnJoinBot: "Bot in Telegram starten ↗", btnJoinGroup: "Telegram-Community beitreten ↗", btnJoinChannel: "Offiziellen Kanal abonnieren ↗", btnWebPreview: "Webvorschau ↗", returnTitle: "Einen klaren Grund für den nächsten Besuch speichern", returnSubtitle: "Vergleich, Gebührenberechnung oder Plattformüberwachung fortsetzen." };
// l10n: needs native review — commandsSummary for ru/ar/id/vi
copy.ru = { ...copy.en, commandsSummary: "Открыть расширенные команды бота", badge: "ЭКОСИСТЕМА TELEGRAM-БОТА / ИНСТРУМЕНТЫ", title: "Продолжайте сравнение и проверку в Telegram", subtitle: "Откройте в Telegram те же маршруты сравнения, источников и официальных ссылок. Данные и преимущества зависят от страницы и официального аккаунта.", commandsBadge: "КОМАНДЫ ИССЛЕДОВАНИЯ", commandsTitle: "Центр команд Telegram", btnCopyCmd: "Скопировать команду", btnCopiedCmd: "Скопировано", btnCopyFailed: "Не удалось скопировать", btnLaunchDeepLink: "Открыть бота", samplePrefix: "Пример: ", channelFeedTitle: "Подписаться на официальный исследовательский канал", btnJoinBot: "Запустить бота в Telegram ↗", btnJoinGroup: "Войти в сообщество Telegram ↗", btnJoinChannel: "Подписаться на официальный канал ↗", btnWebPreview: "Веб-просмотр ↗", returnTitle: "Сохраните понятную причину вернуться", returnSubtitle: "Продолжите сравнение, расчёт или мониторинг с прошлого места." };
copy.ar = { ...copy.en, commandsSummary: "فتح أوامر البوت المتقدمة", badge: "منظومة بوت Telegram / أدوات البحث", title: "تابع المقارنة والتحقق داخل Telegram", subtitle: "افتح مسارات المقارنة والمصادر والروابط الرسمية نفسها من Telegram. تعتمد البيانات والمزايا على الصفحة والحساب الرسمي.", commandsBadge: "أوامر البحث", commandsTitle: "مركز أوامر Telegram", btnCopyCmd: "نسخ الأمر", btnCopiedCmd: "تم النسخ", btnCopyFailed: "فشل النسخ", btnLaunchDeepLink: "فتح البوت", samplePrefix: "مثال: ", channelFeedTitle: "اشترك في قناة البحث الرسمية", btnJoinBot: "تشغيل البوت في Telegram ↗", btnJoinGroup: "انضم إلى مجتمع Telegram ↗", btnJoinChannel: "الاشتراك في القناة الرسمية ↗", btnWebPreview: "معاينة الويب ↗", returnTitle: "احفظ سبباً واضحاً للعودة", returnSubtitle: "تابع المقارنة أو الحساب أو المراقبة من حيث توقفت." };
copy.id = { ...copy.en, commandsSummary: "Buka perintah Bot lanjutan", badge: "EKOSISTEM BOT TELEGRAM / ALAT RISET", title: "Lanjutkan perbandingan dan verifikasi di Telegram", subtitle: "Buka jalur perbandingan, sumber, dan tautan resmi yang sama dari Telegram. Data dan manfaat mengikuti halaman dan akun resmi.", commandsBadge: "PERINTAH RISET", commandsTitle: "Pusat perintah Telegram", btnCopyCmd: "Salin perintah", btnCopiedCmd: "Tersalin", btnCopyFailed: "Gagal menyalin", btnLaunchDeepLink: "Buka bot", samplePrefix: "Contoh: ", channelFeedTitle: "Berlangganan kanal riset resmi", btnJoinBot: "Mulai bot di Telegram ↗", btnJoinGroup: "Gabung komunitas Telegram ↗", btnJoinChannel: "Berlangganan kanal resmi ↗", btnWebPreview: "Pratinjau web ↗", returnTitle: "Simpan alasan yang jelas untuk kembali", returnSubtitle: "Lanjutkan perbandingan, kalkulator, atau pemantauan dari tempat terakhir." };
copy.vi = { ...copy.en, commandsSummary: "Mở các lệnh Bot nâng cao", badge: "HỆ SINH THÁI BOT TELEGRAM / CÔNG CỤ NGHIÊN CỨU", title: "Tiếp tục so sánh và xác minh trên Telegram", subtitle: "Mở cùng các đường dẫn so sánh, nguồn và liên kết chính thức từ Telegram. Dữ liệu và lợi ích phụ thuộc vào trang và tài khoản chính thức.", commandsBadge: "LỆNH NGHIÊN CỨU", commandsTitle: "Trung tâm lệnh Telegram", btnCopyCmd: "Sao chép lệnh", btnCopiedCmd: "Đã sao chép", btnCopyFailed: "Sao chép thất bại", btnLaunchDeepLink: "Mở bot", samplePrefix: "Ví dụ: ", channelFeedTitle: "Theo dõi kênh nghiên cứu chính thức", btnJoinBot: "Khởi động bot trên Telegram ↗", btnJoinGroup: "Tham gia cộng đồng Telegram ↗", btnJoinChannel: "Theo dõi kênh chính thức ↗", btnWebPreview: "Xem trước web ↗", returnTitle: "Lưu lý do rõ ràng để quay lại", returnSubtitle: "Tiếp tục so sánh, tính phí hoặc theo dõi từ lần trước." };
copy.it = { ...copy.en, commandsSummary: "Apri i comandi avanzati del bot", badge: "ECOSISTEMA BOT TELEGRAM / STRUMENTI", title: "Continua confronto e verifica su Telegram", subtitle: "Apri da Telegram gli stessi percorsi di confronto, fonti e link ufficiali. Dati e vantaggi dipendono dalla pagina e dall’account ufficiale.", commandsBadge: "COMANDI DI RICERCA", commandsTitle: "Centro comandi Telegram", btnCopyCmd: "Copia comando", btnCopiedCmd: "Copiato", btnCopyFailed: "Copia non riuscita", btnLaunchDeepLink: "Apri bot", samplePrefix: "Esempio: ", channelFeedTitle: "Segui il canale ufficiale di ricerca", btnJoinBot: "Avvia bot su Telegram ↗", btnJoinGroup: "Unisciti alla community Telegram ↗", btnJoinChannel: "Segui il canale ufficiale ↗", btnWebPreview: "Anteprima web ↗", returnTitle: "Salva un motivo chiaro per tornare", returnSubtitle: "Riprendi confronto, calcolo o monitoraggio da dove eri rimasto." };
for (const [locale, labels] of Object.entries({
  ko: { channelFeedBadge: "공식 방송", channelFeedDesc: "출처가 확인된 조사, 비교 및 보안 정보를 게시합니다. 빈도와 범위는 검증된 데이터에 따라 달라집니다.", tgGroupTitle: "NexuAlpha 트레이더 커뮤니티", tgGroupDesc: "플랫폼 조건, 수수료 정의와 공식 링크를 확인하세요. 커뮤니티 글은 가입이나 수익을 보장하지 않습니다.", features: [{ icon: "", title: "출처 기반 수수료 조사", desc: "출처, 날짜, 공식 조건을 확인할 수 있는 비교 경로로 돌아갑니다. 미확인 값은 대기로 표시합니다." }, { icon: "", title: "공식 도메인 검토 경로", desc: "도메인을 설정된 공식 출처 검토 경로로 보냅니다. 외부 링크는 보안을 보장하지 않습니다." }, { icon: "", title: "연구 업데이트 알림", desc: "확인된 업데이트만 알림 대상이 되며 연결되지 않은 데이터는 명시합니다." }] },
  tr: { channelFeedBadge: "RESMÎ YAYIN", channelFeedDesc: "Kaynaklı araştırma, karşılaştırma ve güvenlik notları yayımlarız. Sıklık ve kapsam doğrulanmış verilere bağlıdır.", tgGroupTitle: "NexuAlpha Trader Topluluğu", tgGroupDesc: "Platform koşullarını, ücret tanımlarını ve resmî bağlantıları inceleyin. Topluluk paylaşımları kayıt veya kazanç garantisi değildir.", features: [{ icon: "", title: "Kaynaklı ücret araştırması", desc: "Kaynak, tarih ve resmî koşulları gösteren karşılaştırma yoluna dönün. Doğrulanmamış değerler beklemede kalır." }, { icon: "", title: "Resmî alan adı inceleme yolu", desc: "Alan adını yapılandırılmış resmî kaynak incelemesine gönderin. Dış bağlantı güvenlik garantisi değildir." }, { icon: "", title: "Araştırma güncellemeleri", desc: "Yalnızca kontrol edilmiş güncellemeler bildirim olabilir; bağlı olmayan veriler açıkça işaretlenir." }] },
})) copy[locale] = { ...copy[locale], ...labels };

for (const [locale, labels] of Object.entries({
  ja: {
    inboundBadge: "サイト内回答を優先",
    inboundTitle: "53件の研究経路はBotの前にNexuAlphaページへ戻します",
    inboundSubtitle: "各Telegram経路はNexuAlphaの公開ページ、確認可能なUTM、手動チェックを持ちます。ユーザーは比較、地域確認、手数料ツール、調査回答を先に読み、その後Botへ進みます。",
    inboundStats: [["53", "確認済み経路"], ["7日", "手動運用"], ["0", "生の登録リンク"]],
  },
  ko: {
    inboundBadge: "사이트 답변 우선",
    inboundTitle: "검토된 경로 53개는 Bot 전에 NexuAlpha 페이지로 보냅니다",
    inboundSubtitle: "각 Telegram 경로에는 NexuAlpha 공개 페이지, 검토 가능한 UTM, 수동 점검이 있습니다. 방문자는 비교, 지역 체크리스트, 수수료 도구 또는 리서치 답변을 먼저 본 뒤 Bot을 엽니다.",
    inboundStats: [["53", "검토된 경로"], ["7일", "수동 리듬"], ["0", "원시 가입 링크"]],
    topicBadge: "답변 우선 경로",
    topicTitle: "Telegram handoff 전에 질문에 먼저 답합니다",
    topicSubtitle: "Telegram 방문자는 비교, 상세 페이지, 수수료 도구 또는 지역 체크리스트를 먼저 확인합니다. Bot은 후속 경로입니다.",
    topicOpen: "사이트 경로 열기",
    topicBot: "Bot에서 계속",
    topicMore: "연구 경로 더 보기",
    topicLess: "추가 연구 경로 숨기기",
    searchBadge: "검색 주제",
    searchTitle: "이번 주 검색 기반 Telegram 경로",
    searchSubtitle: "각 경로는 NexuAlpha 페이지에서 답을 먼저 제공하고, Telegram은 후속 경로로 둡니다.",
    searchPrimary: "사이트 페이지",
    searchCadence: "주기",
    reviewBadge: "수동 검토",
    reviewTitle: "게시 전후에는 익명 사이트 신호만 측정합니다",
    reviewSubtitle: "수동 게시 전 NexuAlpha 우선 링크, 완전한 UTM 문맥, 원시 가입 링크나 초대코드 부재를 확인합니다. 게시 후에는 24시간/7일 집계 지표만 기록하며 계정 생성, 본인확인, 거래 또는 커미션을 추정하지 않습니다.",
    reviewParamLabel: "필수 파라미터",
    reviewForbiddenLabel: "금지 내용",
    returnItems: [["비교 저장", "Binance와 OKX의 공개 조건 비교로 돌아가기", { action: "compare", pair: "binance-vs-okx" }], ["계산 계속", "공개 수수료 시나리오 다시 열기", { action: "fee_calc", venue: "binance" }], ["변경 추적", "검증된 플랫폼 조건 업데이트 구독", { action: "rates", venue: "binance" }]],
  },
  tr: {
    inboundBadge: "ÖNCE SİTEDE YANIT",
    inboundTitle: "53 incelenen araştırma yolu Bot'tan önce NexuAlpha sayfasına döner",
    inboundSubtitle: "Her Telegram yolu NexuAlpha kamu sayfasını, incelenebilir UTM bağlamını ve manuel kontrol listesini taşır. Ziyaretçi Bot'a geçmeden önce karşılaştırma, bölge kontrolü, ücret aracı veya araştırma yanıtını görür.",
    inboundStats: [["53", "incelenen yol"], ["7 gün", "manuel ritim"], ["0", "ham kayıt linki"]],
    topicBadge: "ÖNCE YANIT ROTALARI",
    topicTitle: "Telegram yönlendirmesinden önce soruyu yanıtla",
    topicSubtitle: "Telegram ziyaretçisi önce karşılaştırma, detay, ücret aracı veya bölge kontrolünü açar. Bot sonraki adımdır.",
    topicOpen: "Site rotasını aç",
    topicBot: "Bot'ta devam et",
    topicMore: "Daha fazla araştırma rotası",
    topicLess: "Ek rotaları gizle",
    searchBadge: "ARAMA KONULARI",
    searchTitle: "Bu haftanın arama odaklı Telegram yolları",
    searchSubtitle: "Her yol NexuAlpha sayfasıyla başlar; cevap verildikten sonra Telegram takip rotası olur.",
    searchPrimary: "Site sayfası",
    searchCadence: "Periyot",
    reviewBadge: "MANUEL İNCELEME",
    reviewTitle: "Paylaşım öncesi ve sonrası yalnızca anonim site sinyallerini ölç",
    reviewSubtitle: "Manuel paylaşım öncesi NexuAlpha bağlantısının ilk sırada olduğunu, UTM bağlamının tam olduğunu ve ham kayıt linki ya da davet kodu bulunmadığını kontrol et. Sonrasında yalnızca 24s/7g toplu metrik kaydet; hesap açma, kimlik doğrulama, işlem veya komisyon çıkarımı yapma.",
    reviewParamLabel: "Zorunlu parametreler",
    reviewForbiddenLabel: "Yasak içerik",
    returnItems: [["Karşılaştırmayı kaydet", "Binance ve OKX kamu koşulları karşılaştırmasına dön", { action: "compare", pair: "binance-vs-okx" }], ["Hesaba devam et", "Yayımlanmış ücret senaryosunu yeniden aç", { action: "fee_calc", venue: "binance" }], ["Değişimleri izle", "Kontrol edilmiş platform koşullarına abone ol", { action: "rates", venue: "binance" }]],
  },
  es: {
    inboundBadge: "RESPUESTA PRIMERO EN EL SITIO",
    inboundTitle: "53 borradores llevan a NexuAlpha antes del Bot",
    inboundSubtitle: "Cada mensaje de Telegram enlaza a una página de NexuAlpha que puedes leer primero. El visitante ve comparación, checklist regional, herramienta de costes o respuesta de investigación antes de abrir el Bot.",
    inboundStats: [["53", "borradores"], ["7 días", "ritmo manual"], ["0", "links directos de registro"]],
    channelFeedBadge: "CANAL OFICIAL",
    channelFeedDesc: "El canal publica investigación con fuentes, comparaciones y notas de seguridad. Frecuencia y cobertura dependen de datos verificados.",
    tgGroupTitle: "Comunidad de traders NexuAlpha",
    tgGroupDesc: "Comenta condiciones de plataformas, definiciones de comisiones y revisiones de enlaces oficiales. Los mensajes del grupo no garantizan registro ni retorno.",
  },
})) copy[locale] = { ...copy[locale], ...labels };

for (const [locale, labels] of Object.entries({
  "zh-Hans": { primaryActionsLabel: "主要 Telegram 操作" },
  "zh-Hant": { primaryActionsLabel: "主要 Telegram 動作" },
  ja: { primaryActionsLabel: "主な Telegram 操作" },
  ko: { primaryActionsLabel: "주요 Telegram 작업" },
  tr: { primaryActionsLabel: "Birincil Telegram eylemleri" },
  es: { primaryActionsLabel: "Acciones principales de Telegram" },
  "pt-BR": { primaryActionsLabel: "Ações principais do Telegram" },
})) copy[locale] = { ...copy[locale], ...labels };

for (const [locale, labels] of Object.entries({
  fr: {
    primaryActionsLabel: "Actions Telegram principales",
    channelFeedBadge: "CANAL OFFICIEL",
    channelFeedDesc: "Le canal publie des recherches sourcées, des comparaisons et des notes de sécurité. La cadence et la couverture dépendent des données vérifiées.",
    tgGroupTitle: "Communauté de traders NexuAlpha",
    tgGroupDesc: "Discutez des conditions des plateformes, des définitions de frais et des vérifications de liens officiels. Les messages du groupe ne garantissent ni inscription ni rendement.",
  },
  de: {
    primaryActionsLabel: "Primäre Telegram-Aktionen",
    channelFeedBadge: "OFFIZIELLER KANAL",
    channelFeedDesc: "Der Kanal veröffentlicht quellenbasierte Recherchen, Vergleiche und Sicherheitshinweise. Rhythmus und Abdeckung hängen von geprüften Daten ab.",
    tgGroupTitle: "NexuAlpha-Trader-Community",
    tgGroupDesc: "Besprechen Sie Plattformbedingungen, Gebührendefinitionen und Prüfungen offizieller Links. Gruppenbeiträge garantieren keine Registrierung und keinen Ertrag.",
  },
  ru: {
    primaryActionsLabel: "Основные действия Telegram",
    channelFeedBadge: "ОФИЦИАЛЬНЫЙ КАНАЛ",
    channelFeedDesc: "Канал публикует исследования с источниками, сравнения и заметки по безопасности. Частота и охват зависят от проверенных данных.",
    tgGroupTitle: "Сообщество трейдеров NexuAlpha",
    tgGroupDesc: "Обсуждайте условия платформ, определения комиссий и проверку официальных ссылок. Сообщения группы не гарантируют регистрацию или доход.",
  },
  ar: {
    primaryActionsLabel: "إجراءات Telegram الأساسية",
    channelFeedBadge: "القناة الرسمية",
    channelFeedDesc: "تنشر القناة أبحاثاً موثقة بالمصادر ومقارنات وملاحظات أمان. يعتمد الإيقاع والتغطية على البيانات المتحقق منها.",
    tgGroupTitle: "مجتمع متداولي NexuAlpha",
    tgGroupDesc: "ناقش شروط المنصات وتعريفات الرسوم وفحص الروابط الرسمية. منشورات المجموعة لا تضمن التسجيل أو العائد.",
  },
  id: {
    primaryActionsLabel: "Aksi utama Telegram",
    channelFeedBadge: "KANAL RESMI",
    channelFeedDesc: "Kanal menerbitkan riset bersumber, perbandingan, dan catatan keamanan. Ritme dan cakupan bergantung pada data yang sudah diverifikasi.",
    tgGroupTitle: "Komunitas trader NexuAlpha",
    tgGroupDesc: "Diskusikan kondisi platform, definisi biaya, dan pemeriksaan tautan resmi. Postingan grup bukan jaminan pendaftaran atau imbal hasil.",
  },
  vi: {
    primaryActionsLabel: "Hành động Telegram chính",
    channelFeedBadge: "KÊNH CHÍNH THỨC",
    channelFeedDesc: "Kênh đăng nghiên cứu có nguồn, so sánh và ghi chú bảo mật. Nhịp đăng và phạm vi phụ thuộc vào dữ liệu đã được xác minh.",
    tgGroupTitle: "Cộng đồng nhà giao dịch NexuAlpha",
    tgGroupDesc: "Thảo luận điều kiện nền tảng, định nghĩa phí và kiểm tra liên kết chính thức. Bài đăng trong nhóm không bảo đảm đăng ký hay lợi nhuận.",
  },
  it: {
    primaryActionsLabel: "Azioni Telegram principali",
    channelFeedBadge: "CANALE UFFICIALE",
    channelFeedDesc: "Il canale pubblica ricerche con fonti, confronti e note di sicurezza. Cadenza e copertura dipendono dai dati verificati.",
    tgGroupTitle: "Community di trader NexuAlpha",
    tgGroupDesc: "Discuti condizioni delle piattaforme, definizioni delle commissioni e verifiche dei link ufficiali. I post del gruppo non garantiscono registrazione o rendimento.",
  },
})) copy[locale] = { ...copy[locale], ...labels };


// Topic gateway in reader language (SEO audit 2026-10-11 #6): the heading and intro used to describe the routing spec
// ("Answer the question before the Telegram handoff … Telegram visitors get a clear onsite path first"). Same in 15 locales.
for (const [locale, [topicBadge, topicTitle, topicSubtitle]] of Object.entries({
  en: ["START WITH THE ANSWER", "Find your answer on NexuAlpha first", "Compare venues, open a profile, check fees or go through your region's checklist here. The Bot can pick up from there."],
  "zh-Hans": ["站内研究入口", "先在站内找到答案", "先在 NexuAlpha 比较平台、查看档案、核对费用或地区清单，之后再按需要在 Bot 中继续。"],
  "zh-Hant": ["站內研究入口", "先在站內找到答案", "先在 NexuAlpha 比較平台、查看檔案、核對費用或地區清單，之後再按需要在 Bot 中繼續。"],
  ja: ["まずサイトで確認", "答えはまず NexuAlpha で", "取引所の比較、プロフィール、手数料、地域チェックリストをここで確認できます。続きは Bot でも開けます。"],
  ko: ["사이트에서 먼저", "답은 먼저 NexuAlpha에서 확인하세요", "거래소 비교, 프로필, 수수료, 지역 체크리스트를 여기에서 확인하세요. 이어서 Bot에서 계속할 수 있습니다."],
  tr: ["ÖNCE YANIT", "Yanıtı önce NexuAlpha'da bulun", "Platformları karşılaştırın, profil açın, ücretleri veya bölgenizin kontrol listesini burada inceleyin. Bot daha sonra kaldığınız yerden devam eder."],
  es: ["EMPIEZA POR LA RESPUESTA", "Encuentra primero la respuesta en NexuAlpha", "Compara plataformas, abre un perfil, revisa comisiones o la lista de tu región aquí. Después puedes seguir en el bot."],
  "pt-BR": ["COMECE PELA RESPOSTA", "Encontre a resposta primeiro na NexuAlpha", "Compare plataformas, abra um perfil, confira taxas ou o checklist da sua região aqui. Depois, continue no bot."],
  fr: ["D’ABORD LA RÉPONSE", "Trouvez d’abord la réponse sur NexuAlpha", "Comparez les plateformes, ouvrez un profil, vérifiez les frais ou la liste de votre région ici. Le bot prend ensuite le relais."],
  de: ["ZUERST DIE ANTWORT", "Die Antwort zuerst auf NexuAlpha finden", "Vergleichen Sie Plattformen, öffnen Sie ein Profil, prüfen Sie Gebühren oder die Checkliste Ihrer Region hier. Danach geht es im Bot weiter."],
  it: ["PRIMA LA RISPOSTA", "Trova prima la risposta su NexuAlpha", "Confronta le piattaforme, apri un profilo, controlla le commissioni o la checklist della tua regione qui. Poi puoi continuare nel bot."],
  ru: ["СНАЧАЛА ОТВЕТ", "Сначала найдите ответ на NexuAlpha", "Сравните платформы, откройте профиль, проверьте комиссии или чек-лист своего региона здесь. Затем можно продолжить в боте."],
  id: ["MULAI DARI JAWABAN", "Temukan jawabannya dulu di NexuAlpha", "Bandingkan platform, buka profil, cek biaya, atau daftar periksa wilayah Anda di sini. Setelah itu lanjutkan di bot."],
  vi: ["BẮT ĐẦU TỪ CÂU TRẢ LỜI", "Tìm câu trả lời trên NexuAlpha trước", "So sánh nền tảng, mở hồ sơ, kiểm tra phí hoặc danh sách kiểm tra theo khu vực của bạn tại đây. Sau đó tiếp tục trong bot."],
  ar: ["ابدأ بالإجابة", "ابحث عن الإجابة في NexuAlpha أولًا", "قارن المنصات وافتح ملفًا وراجع الرسوم أو قائمة التحقق الخاصة بمنطقتك هنا، ثم تابع في البوت."],
})) copy[locale] = { ...copy[locale], topicBadge, topicTitle, topicSubtitle };


// l10n: needs native review
copy.ur = {
  ...copy.en,
  badge: "TELEGRAM BOT ایکو سسٹم / فیصلے کا راستہ",
  title: "موازنہ، تصدیق اور واپسی کے راستے Telegram میں لے جائیں",
  subtitle: "Telegram سے وہی تحقیقی راستہ کھولیں، ماخذ کی حالت، عوامی فیس منظرنامے اور سرکاری داخلے دیکھیں۔ مخصوص ڈیٹا اور صارف فوائد پھر بھی صفحے اور سرکاری اکاؤنٹ کے تابع ہیں۔",
  inboundBadge: "واپسی کا راستہ", inboundTitle: "مسودے پہلے سائٹ کے جواب صفحے پر آتے ہیں، پھر Bot میں", inboundSubtitle: "ہر Telegram پیغام ایک ایسے صفحے سے جڑا ہے جسے پہلے NexuAlpha پر دیکھا جا سکتا ہے۔", inboundStats: [["53", "زیر جائزہ مسودے"], ["7 دن", "دستی رفتار"], ["0", "خام رجسٹریشن لنک"]],
  commandsBadge: "کمانڈ ڈیک", commandsTitle: "Telegram میں اپنا تحقیقی راستہ جاری رکھیں", commandsSubtitle: "یہ کمانڈز موازنہ، حساب، مہم تحقیق یا ڈومین تصدیق کا راستہ کھولتی ہیں؛ نتیجہ موجودہ جانچے ہوئے ڈیٹا ذرائع پر منحصر ہے۔",
  btnCopyCmd: "کمانڈ کاپی کریں", btnCopiedCmd: "کاپی ہو گیا", btnCopyFailed: "کاپی ناکام، دستی طور پر کاپی کریں", btnLaunchDeepLink: "براہ راست کھولیں", samplePrefix: "مثال:",
  features: [["", "ماخذی فیس تحقیق", "عوامی موازنہ راستے سے صفحے پر واپس آ کر فیس، اپ ڈیٹ وقت اور سرکاری شرائط دیکھیں؛ بے ماخذ ڈیٹا زیر تصدیق رہتا ہے۔"], ["", "سرکاری ڈومین تصدیق", "ایکسچینج ڈومین کو تصدیقی راستے میں بھیجیں؛ نتیجہ صرف ترتیب شدہ سرکاری ماخذوں پر مبنی ہے۔"], ["", "آپٹ اِن تحقیقی الرٹس", "صرف جانچے ہوئے مہم یا فیس اپ ڈیٹس الرٹس میں جاتے ہیں؛ غیر منسلک ذرائع صاف نشان زد رہتے ہیں۔"]].map(([icon,title,desc]) => ({ icon, title, desc })),
  btnJoinBot: "Telegram میں معاون Bot شروع کریں ↗", btnJoinGroup: "Telegram کمیونٹی میں شامل ہوں ↗", btnJoinChannel: "سرکاری چینل سبسکرائب کریں ↗", btnWebPreview: "عوامی چینل پیش منظر ↗",
  topicBadge: "پہلے جواب والے راستے", topicTitle: "پہلے سوال کا جواب، پھر اگلا قدم", topicSubtitle: "Telegram سے واپس آنے والے صارف پہلے عوامی تحقیقی صفحہ دیکھتے ہیں؛ موازنہ یا فیس چیک کے بعد ضرورت ہو تو Bot کھولتے ہیں۔", topicOpen: "سائٹ کا راستہ کھولیں", topicBot: "Bot میں جاری رکھیں", topicMore: "مزید تحقیقی راستے", topicLess: "اضافی راستے چھپائیں",
  reviewTitle: "اشاعت سے پہلے اور بعد صرف گمنام سائٹ اشارے", reviewSubtitle: "اشاعت سے پہلے NexuAlpha لنک، UTM پیرامیٹرز اور خام رجسٹریشن لنک نہ ہونے کی جانچ کریں؛ بعد میں صرف مجموعی 24h/7d اشارے۔", returnTitle: "اگلی واپسی کی واضح وجہ دیں", returnSubtitle: "دوبارہ شروع نہ کریں: آخری موازنہ، فیس حساب یا پلیٹ فارم نگرانی سے جاری رکھیں۔",
};
// l10n: needs native review
copy.uk = {
  ...copy.en,
  badge: "TELEGRAM BOT ECOSYSTEM / Вхід до рішення",
  title: "Перенесіть порівняння, перевірки й маршрути повернення в Telegram",
  subtitle: "Відкривайте той самий дослідницький маршрут із Telegram, переглядайте стан джерел, публічні сценарії комісій і офіційні входи. Конкретні дані й переваги користувача залежать від сторінки та офіційного акаунта.",
  inboundBadge: "Маршрут повернення", inboundTitle: "Чернетки спершу повертаються на сторінки відповідей, потім у Bot", inboundSubtitle: "Кожне повідомлення Telegram відповідає сторінці, яку спершу можна переглянути на NexuAlpha.", inboundStats: [["53", "чернетки на перевірці"], ["7 днів", "ручний ритм"], ["0", "сирих реєстраційних посилань"]],
  commandsBadge: "Панель команд", commandsTitle: "Продовжуйте дослідження в Telegram", commandsSubtitle: "Команди відкривають порівняння, розрахунки, дослідження кампаній або перевірку домену; актуальність залежить від підключених і перевірених джерел.",
  btnCopyCmd: "Копіювати команду", btnCopiedCmd: "Скопійовано", btnCopyFailed: "Не вдалося скопіювати, скопіюйте вручну", btnLaunchDeepLink: "Відкрити напряму", samplePrefix: "Приклад:",
  features: [["", "Дослідження комісій із джерелами", "Поверніться зі шляху порівняння на сторінку й перегляньте комісії, час оновлення та офіційні умови; дані без джерела лишаються на перевірці."], ["", "Перевірка офіційного домену", "Передайте домен біржі в маршрут перевірки; результат спирається лише на налаштовані офіційні джерела."], ["", "Дослідницькі сповіщення за згодою", "До сповіщень потрапляють лише перевірені кампанії або оновлення комісій; непідключені джерела позначаються явно."]].map(([icon,title,desc]) => ({ icon, title, desc })),
  btnJoinBot: "Запустити помічника Bot у Telegram ↗", btnJoinGroup: "Приєднатися до Telegram-спільноти ↗", btnJoinChannel: "Підписатися на офіційний канал ↗", btnWebPreview: "Публічний перегляд каналу ↗",
  topicBadge: "Маршрути з відповіддю спочатку", topicTitle: "Спершу відповідь, потім наступний крок", topicSubtitle: "Користувачі з Telegram спершу потрапляють на публічну дослідницьку сторінку; після порівняння або перевірки комісій за потреби відкривають Bot.", topicOpen: "Відкрити маршрут на сайті", topicBot: "Продовжити в Bot", topicMore: "Більше дослідницьких маршрутів", topicLess: "Сховати додаткові маршрути",
  reviewTitle: "До й після публікації — лише анонімні сигнали сайту", reviewSubtitle: "Перед публікацією перевіряйте пріоритет посилання NexuAlpha, повні UTM і відсутність сирих реєстраційних посилань; після — лише агреговані 24h/7d сигнали.", returnTitle: "Дайте чітку причину повернутися", returnSubtitle: "Не починайте заново: продовжуйте з останнього порівняння, розрахунку комісій або моніторингу платформи.",
};

const RETURN_RAIL_COPY = Object.freeze({
  en: {
    title: "Return to the actual onsite tools",
    subtitle: "Choose one concrete next step on NexuAlpha: compare platforms, calculate a fee scenario, or read reviewed updates.",
    items: [
      ["Reopen comparison", "Open the Binance vs OKX comparison page", "/compare/binance-vs-okx", "compare_binance_okx"],
      ["Calculate fees", "Open the rate benchmark and fee calculator", "/rates", "rates"],
      ["View latest research", "Open reviewed activity and source updates", "/activities", "activities"],
    ],
  },
  "zh-Hans": { title: "回到实际可用的站内工具", subtitle: "选择一个明确下一步：重新比较平台、计算费用情景，或查看已审阅资料。", items: [["重新打开比较", "打开 Binance vs OKX 站内比较页", "/compare/binance-vs-okx", "compare_binance_okx"], ["计算费用", "打开费率基准与费用计算器", "/rates", "rates"], ["查看最新资料", "打开已审阅活动与来源更新", "/activities", "activities"]] },
  "zh-Hant": { title: "回到實際可用的站內工具", subtitle: "選擇一個明確下一步：重新比較平台、計算費用情境，或查看已審閱資料。", items: [["重新打開比較", "打開 Binance vs OKX 站內比較頁", "/compare/binance-vs-okx", "compare_binance_okx"], ["計算費用", "打開費率基準與費用計算器", "/rates", "rates"], ["查看最新資料", "打開已審閱活動與來源更新", "/activities", "activities"]] },
  ja: { title: "実際に使えるサイト内ツールへ戻る", subtitle: "次の一手を選びます：比較を開く、費用を計算する、確認済み資料を見る。", items: [["比較を再度開く", "Binance vs OKX の比較ページを開く", "/compare/binance-vs-okx", "compare_binance_okx"], ["費用を計算", "料率ベンチマークと計算ツールを開く", "/rates", "rates"], ["最新資料を見る", "確認済みの活動と出典更新を開く", "/activities", "activities"]] },
  ko: { title: "실제로 사용할 수 있는 사이트 도구로 돌아가기", subtitle: "다음 단계를 고르세요: 비교 다시 열기, 비용 계산, 검토된 자료 확인.", items: [["비교 다시 열기", "Binance vs OKX 비교 페이지 열기", "/compare/binance-vs-okx", "compare_binance_okx"], ["비용 계산", "수수료 벤치마크와 계산기 열기", "/rates", "rates"], ["최신 자료 보기", "검토된 활동과 출처 업데이트 열기", "/activities", "activities"]] },
  tr: { title: "Gerçek site araçlarına dön", subtitle: "Somut bir sonraki adım seçin: karşılaştırmayı açın, maliyeti hesaplayın veya incelenmiş kaynakları görün.", items: [["Karşılaştırmayı yeniden aç", "Binance vs OKX karşılaştırma sayfasını aç", "/compare/binance-vs-okx", "compare_binance_okx"], ["Ücreti hesapla", "Ücret karşılaştırması ve hesaplayıcıyı aç", "/rates", "rates"], ["Güncel bilgileri gör", "İncelenmiş etkinlik ve kaynak güncellemelerini aç", "/activities", "activities"]] },
  es: { title: "Volver a herramientas reales del sitio", subtitle: "Elige un siguiente paso concreto: comparar, calcular costes o leer material revisado.", items: [["Reabrir comparación", "Abrir la comparación Binance vs OKX", "/compare/binance-vs-okx", "compare_binance_okx"], ["Calcular costes", "Abrir benchmark de tarifas y calculadora", "/rates", "rates"], ["Ver material reciente", "Abrir actividades y fuentes revisadas", "/activities", "activities"]] },
  "pt-BR": { title: "Voltar às ferramentas reais do site", subtitle: "Escolha um próximo passo concreto: comparar, calcular custos ou ler materiais revisados.", items: [["Reabrir comparação", "Abrir a comparação Binance vs OKX", "/compare/binance-vs-okx", "compare_binance_okx"], ["Calcular custos", "Abrir benchmark de taxas e calculadora", "/rates", "rates"], ["Ver materiais recentes", "Abrir atividades e fontes revisadas", "/activities", "activities"]] },
  fr: { title: "Revenir aux outils réels du site", subtitle: "Choisissez une suite concrète : comparer, calculer les frais ou lire les éléments vérifiés.", items: [["Rouvrir la comparaison", "Ouvrir la comparaison Binance vs OKX", "/compare/binance-vs-okx", "compare_binance_okx"], ["Calculer les frais", "Ouvrir le benchmark des frais et le calculateur", "/rates", "rates"], ["Voir les derniers éléments", "Ouvrir les activités et sources vérifiées", "/activities", "activities"]] },
  de: { title: "Zu den echten Website-Tools zurückkehren", subtitle: "Wählen Sie den nächsten konkreten Schritt: vergleichen, Kosten berechnen oder geprüfte Materialien lesen.", items: [["Vergleich erneut öffnen", "Binance vs OKX Vergleich öffnen", "/compare/binance-vs-okx", "compare_binance_okx"], ["Kosten berechnen", "Gebühren-Benchmark und Rechner öffnen", "/rates", "rates"], ["Aktuelle Unterlagen ansehen", "Geprüfte Aktivitäten und Quellen öffnen", "/activities", "activities"]] },
  ru: { title: "Вернуться к реальным инструментам сайта", subtitle: "Выберите конкретный следующий шаг: сравнение, расчёт затрат или проверенные материалы.", items: [["Снова открыть сравнение", "Открыть сравнение Binance vs OKX", "/compare/binance-vs-okx", "compare_binance_okx"], ["Рассчитать комиссии", "Открыть бенчмарк тарифов и калькулятор", "/rates", "rates"], ["Посмотреть свежие материалы", "Открыть проверенные активности и источники", "/activities", "activities"]] },
  ar: { title: "العودة إلى أدوات الموقع الفعلية", subtitle: "اختر خطوة ملموسة: أعد فتح المقارنة أو احسب التكلفة أو اقرأ المواد المراجعة.", items: [["إعادة فتح المقارنة", "افتح صفحة مقارنة Binance وOKX", "/compare/binance-vs-okx", "compare_binance_okx"], ["حساب الرسوم", "افتح معيار الرسوم والحاسبة", "/rates", "rates"], ["عرض أحدث المواد", "افتح الأنشطة والمصادر المراجعة", "/activities", "activities"]] },
  id: { title: "Kembali ke alat situs yang benar-benar tersedia", subtitle: "Pilih langkah konkret: buka perbandingan, hitung biaya, atau baca materi yang ditinjau.", items: [["Buka ulang perbandingan", "Buka halaman Binance vs OKX", "/compare/binance-vs-okx", "compare_binance_okx"], ["Hitung biaya", "Buka benchmark biaya dan kalkulator", "/rates", "rates"], ["Lihat materi terbaru", "Buka aktivitas dan sumber yang ditinjau", "/activities", "activities"]] },
  vi: { title: "Quay lại công cụ thật trên site", subtitle: "Chọn bước tiếp theo cụ thể: mở so sánh, tính chi phí hoặc đọc tài liệu đã rà soát.", items: [["Mở lại so sánh", "Mở trang Binance vs OKX", "/compare/binance-vs-okx", "compare_binance_okx"], ["Tính phí", "Mở benchmark phí và máy tính", "/rates", "rates"], ["Xem tài liệu mới", "Mở hoạt động và nguồn đã rà soát", "/activities", "activities"]] },
  it: { title: "Torna agli strumenti reali del sito", subtitle: "Scegli un prossimo passo concreto: confronto, calcolo costi o materiali verificati.", items: [["Riapri confronto", "Apri il confronto Binance vs OKX", "/compare/binance-vs-okx", "compare_binance_okx"], ["Calcola costi", "Apri benchmark fee e calcolatore", "/rates", "rates"], ["Vedi materiali recenti", "Apri attività e fonti verificate", "/activities", "activities"]] },

  // l10n: needs native review
  ur: { title: "اصل سائٹ ٹولز پر واپس جائیں", subtitle: "ایک واضح اگلا قدم چنیں: پلیٹ فارم موازنہ، فیس منظرنامہ یا جائزہ شدہ اپ ڈیٹس۔", items: [["موازنہ دوبارہ کھولیں", "Binance vs OKX موازنہ صفحہ کھولیں", "/compare/binance-vs-okx", "compare_binance_okx"], ["فیس حساب کریں", "فیس بنچ مارک اور کیلکولیٹر کھولیں", "/rates", "rates"], ["تازہ تحقیق دیکھیں", "جائزہ شدہ سرگرمیاں اور ماخذ اپ ڈیٹس کھولیں", "/activities", "activities"]] },

  // l10n: needs native review
  uk: { title: "Повернутися до реальних інструментів сайту", subtitle: "Оберіть конкретний наступний крок: порівняти платформи, розрахувати комісії або прочитати перевірені оновлення.", items: [["Знову відкрити порівняння", "Відкрити сторінку Binance vs OKX", "/compare/binance-vs-okx", "compare_binance_okx"], ["Розрахувати комісії", "Відкрити бенчмарк комісій і калькулятор", "/rates", "rates"], ["Переглянути останні дослідження", "Відкрити перевірені активності й оновлення джерел", "/activities", "activities"]] },
});

function returnRailCopyFor(locale) {
  const normalized = String(locale || "en");
  const base = normalized.split("-")[0];
  if (normalized === "pt-BR" || base === "pt") return RETURN_RAIL_COPY["pt-BR"];
  return RETURN_RAIL_COPY[normalized] || RETURN_RAIL_COPY[base] || RETURN_RAIL_COPY.en;
}

function pickLocalized(value, locale, fallback = "") {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return fallback;
  const normalizedLocale = String(locale || "en");
  const baseLocale = normalizedLocale.split("-")[0];
  return value[normalizedLocale] || value[baseLocale] || value.en || fallback;
}

const contextValue = (value, fallback) => String(value || fallback || "").trim();

const returnStatusCopy = {
  // l10n: needs native review
  ur: { restored: "Telegram واپسی کا سیاق بحال", fallback: "صرف ویب fallback فعال", body: "بحال شدہ عوامی صفحہ سیاق سے جاری رکھیں۔ یہ ایکسچینج رجسٹریشن، گروپ شمولیت یا کمیشن واقعہ نہیں۔" },
  // l10n: needs native review
  uk: { restored: "Контекст повернення з Telegram відновлено", fallback: "Активний лише веб-запасний шлях", body: "Продовжуйте з відновленого публічного контексту сторінки. Це не реєстрація на біржі, вступ до групи чи комісійна подія." },
  en: { restored: "Telegram return context restored", fallback: "Web-only fallback active", body: "Continue from the restored public page context. This is not an exchange registration, group join or commission event." },
  "zh-Hans": { restored: "已恢复 Telegram 回流上下文", fallback: "已启用站内降级路径", body: "继续查看恢复的公开页面上下文；这不是交易所注册、入群或佣金事件。" },
  "zh-Hant": { restored: "已恢復 Telegram 回流脈絡", fallback: "已啟用站內降級路徑", body: "繼續查看恢復的公開頁面脈絡；這不是交易所註冊、入群或佣金事件。" },
  "pt-BR": { restored: "Contexto de retorno do Telegram restaurado", fallback: "Fallback apenas web ativo", body: "Continue pelo contexto publico restaurado. Isto nao e cadastro na exchange, entrada em grupo ou evento de comissao." },
  ko: { restored: "Telegram 복귀 맥락 복원됨", fallback: "웹 전용 대체 경로 활성화", body: "복원된 공개 페이지 맥락에서 이어갑니다. 거래소 가입, 그룹 참여 또는 커미션 이벤트가 아닙니다." },
  tr: { restored: "Telegram dönüş bağlamı geri yüklendi", fallback: "Yalnızca web yedek yolu aktif", body: "Geri yüklenen herkese açık sayfa bağlamından devam edin. Bu bir borsa kaydı, grup katılımı veya komisyon olayı değildir." },
};

function returnCopyFor(locale) {
  const normalized = String(locale || "en");
  return returnStatusCopy[normalized] || returnStatusCopy[normalized.split("-")[0]] || returnStatusCopy.en;
}

const topicDisclosureLabels = Object.freeze({
  // l10n: needs native review
  ur: ["مزید تحقیقی راستے دیکھیں", "اضافی تحقیقی راستے چھپائیں"],
  // l10n: needs native review
  uk: ["Показати більше дослідницьких маршрутів", "Сховати додаткові маршрути"],
  ja: ["他の研究ルートを見る", "追加の研究ルートを閉じる"],
  ko: ["더 많은 연구 경로 보기", "추가 연구 경로 숨기기"],
  tr: ["Daha fazla araştırma yolu", "Ek araştırma yollarını gizle"],
  es: ["Ver más rutas de investigación", "Ocultar rutas adicionales"],
  fr: ["Voir plus de parcours de recherche", "Masquer les parcours supplémentaires"],
  de: ["Weitere Recherchewege anzeigen", "Zusätzliche Recherchewege ausblenden"],
  ru: ["Показать другие маршруты исследования", "Скрыть дополнительные маршруты"],
  ar: ["عرض المزيد من مسارات البحث", "إخفاء مسارات البحث الإضافية"],
  id: ["Lihat jalur riset lainnya", "Sembunyikan jalur tambahan"],
  vi: ["Xem thêm lộ trình nghiên cứu", "Ẩn lộ trình bổ sung"],
  it: ["Mostra altri percorsi di ricerca", "Nascondi i percorsi aggiuntivi"],
});

const expandableControlLabels = Object.freeze({
  // l10n: needs native review
  ur: { moreCommands: "مزید کمانڈز دیکھیں", lessCommands: "کمانڈز چھپائیں", moreFeatures: "Telegram خصوصیات دیکھیں", lessFeatures: "Telegram خصوصیات چھپائیں" },
  // l10n: needs native review
  uk: { moreCommands: "Показати інші команди", lessCommands: "Сховати інші команди", moreFeatures: "Показати функції Telegram", lessFeatures: "Сховати функції Telegram" },
  ja: { moreCommands: "他のコマンドを見る", lessCommands: "他のコマンドを閉じる", moreFeatures: "Telegram 機能を見る", lessFeatures: "Telegram 機能を閉じる" },
  ko: { moreCommands: "다른 명령 보기", lessCommands: "다른 명령 숨기기", moreFeatures: "Telegram 기능 보기", lessFeatures: "Telegram 기능 숨기기" },
  tr: { moreCommands: "Diğer komutları göster", lessCommands: "Diğer komutları gizle", moreFeatures: "Telegram özelliklerini göster", lessFeatures: "Telegram özelliklerini gizle" },
});

// Audit NX-08 (2026-10-11): at most four natural related questions instead of the long keyword-style list of search
// queries (that queue stays in telegram-config.js for the Telegram drafting workflow, not as public copy).
// l10n: ur/uk labels need native review
const RELATED_QUESTIONS = [
  { id: "related-rates", primaryPath: "/rates", campaign: "telegram_related_rates", labels: {
    en: "Which exchange is cheapest for my trading volume?", "zh-Hans": "按我的成交额，哪家交易所手续费最低？", "zh-Hant": "依我的成交額，哪家交易所手續費最低？", ja: "自分の取引量だと、どの取引所の手数料が最も安い？", ko: "내 거래량 기준으로 수수료가 가장 낮은 거래소는?", tr: "İşlem hacmime göre en ucuz borsa hangisi?", es: "¿Qué plataforma es más barata para mi volumen?", "pt-BR": "Qual corretora é mais barata para o meu volume?", fr: "Quelle plateforme coûte le moins pour mon volume ?", de: "Welche Börse ist für mein Volumen am günstigsten?", ru: "Какая биржа дешевле всего при моём объёме?", ar: "أي منصة أرخص لحجم تداولي؟", id: "Bursa mana yang termurah untuk volume saya?", vi: "Sàn nào rẻ nhất với khối lượng giao dịch của tôi?", it: "Quale piattaforma costa meno per il mio volume?",
    // l10n: needs native review
    ur: "میرے حجم کے لیے کون سا ایکسچینج سب سے سستا ہے؟",
    // l10n: needs native review
    uk: "Яка біржа найдешевша для мого обсягу?",
  } },
  { id: "related-binance-okx", primaryPath: "/compare/binance-vs-okx", campaign: "telegram_related_compare", labels: {
    en: "Binance vs OKX: fees and account conditions", "zh-Hans": "币安与 OKX：手续费与开户条件对比", "zh-Hant": "幣安與 OKX：手續費與開戶條件對比", ja: "Binance と OKX：手数料と口座条件の比較", ko: "Binance vs OKX: 수수료와 계정 조건", tr: "Binance ve OKX: ücretler ve hesap koşulları", es: "Binance vs OKX: comisiones y condiciones de cuenta", "pt-BR": "Binance vs OKX: taxas e condições de conta", fr: "Binance vs OKX : frais et conditions de compte", de: "Binance vs. OKX: Gebühren und Kontobedingungen", ru: "Binance и OKX: комиссии и условия аккаунта", ar: "Binance مقابل OKX: الرسوم وشروط الحساب", id: "Binance vs OKX: biaya dan ketentuan akun", vi: "Binance và OKX: phí và điều kiện tài khoản", it: "Binance vs OKX: commissioni e condizioni del conto",
    // l10n: needs native review
    ur: "Binance vs OKX: فیس اور اکاؤنٹ شرائط",
    // l10n: needs native review
    uk: "Binance vs OKX: комісії та умови акаунта",
  } },
  { id: "related-hyperliquid", primaryPath: "/exchanges/hyperliquid", campaign: "telegram_related_hyperliquid", labels: {
    en: "Hyperliquid fees, funding and liquidation rules", "zh-Hans": "Hyperliquid 的手续费、资金费率与强平规则", "zh-Hant": "Hyperliquid 的手續費、資金費率與強平規則", ja: "Hyperliquid の手数料・資金調達率・清算ルール", ko: "Hyperliquid 수수료, 펀딩비, 청산 규칙", tr: "Hyperliquid ücretleri, fonlama ve likidasyon kuralları", es: "Hyperliquid: comisiones, financiación y liquidaciones", "pt-BR": "Hyperliquid: taxas, funding e regras de liquidação", fr: "Hyperliquid : frais, financement et règles de liquidation", de: "Hyperliquid: Gebühren, Funding und Liquidationsregeln", ru: "Hyperliquid: комиссии, фандинг и правила ликвидации", ar: "Hyperliquid: الرسوم والتمويل وقواعد التصفية", id: "Hyperliquid: biaya, funding, dan aturan likuidasi", vi: "Hyperliquid: phí, funding và quy tắc thanh lý", it: "Hyperliquid: commissioni, funding e regole di liquidazione",
    // l10n: needs native review
    ur: "Hyperliquid: فیس، فنڈنگ اور لیکویڈیشن قواعد",
    // l10n: needs native review
    uk: "Hyperliquid: комісії, фінансування й правила ліквідації",
  } },
  { id: "related-derivatives", primaryPath: "/topics/derivatives", campaign: "telegram_related_derivatives", labels: {
    en: "Which perpetual-contract costs should I check?", "zh-Hans": "永续合约要核对哪些成本？", "zh-Hant": "永續合約要核對哪些成本？", ja: "無期限先物で確認すべきコストは？", ko: "무기한 선물에서 확인할 비용은?", tr: "Sürekli vadeli işlemlerde hangi maliyetleri kontrol etmeliyim?", es: "¿Qué costes de los perpetuos debo revisar?", "pt-BR": "Quais custos dos perpétuos devo verificar?", fr: "Quels coûts vérifier sur les contrats perpétuels ?", de: "Welche Kosten bei Perpetual-Kontrakten prüfen?", ru: "Какие расходы проверять по бессрочным контрактам?", ar: "ما تكاليف العقود الدائمة التي يجب التحقق منها؟", id: "Biaya kontrak perpetual apa yang perlu dicek?", vi: "Cần kiểm tra những chi phí nào của hợp đồng vĩnh cửu?", it: "Quali costi dei contratti perpetui controllare?",
    // l10n: needs native review
    ur: "پرپیچوئل معاہدوں کی کون سی لاگت چیک کرنی چاہیے؟",
    // l10n: needs native review
    uk: "Які витрати безстрокових контрактів перевіряти?",
  } },
];

const editorialDisclosureLabels = {
  // l10n: needs native review
  "ur": "NexuAlpha پر جواب دیے گئے سوالات",
  // l10n: needs native review
  "uk": "Питання з відповідями на NexuAlpha",
  "en": "Questions answered on NexuAlpha",
  "zh-Hans": "NexuAlpha 已解答的问题",
  "zh-Hant": "NexuAlpha 已解答的問題",
  "ja": "NexuAlpha で回答済みの質問",
  "ko": "NexuAlpha에서 답한 질문",
  "tr": "NexuAlpha'da yanıtlanan sorular",
  "es": "Preguntas respondidas en NexuAlpha",
  "pt-BR": "Perguntas respondidas no NexuAlpha",
  "fr": "Questions traitées sur NexuAlpha",
  "de": "Auf NexuAlpha beantwortete Fragen",
  "ru": "Вопросы с ответами на NexuAlpha",
  "ar": "أسئلة أجاب عنها NexuAlpha",
  "id": "Pertanyaan yang dijawab di NexuAlpha",
  "vi": "Câu hỏi đã được NexuAlpha trả lời",
  "it": "Domande con risposta su NexuAlpha"
};

export function TelegramBotHub({ locale = "en", headingLevel = 2, market, product }) {
  const localeBase = String(locale || "en").split("-")[0];
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const isPt = locale === "pt" || locale.startsWith("pt");
  const hubCopy = copy[locale] || copy[String(locale || "").split("-")[0]] || (isHant ? copy["zh-Hant"] : isZh ? copy["zh-Hans"] : isPt ? copy["pt-BR"] : copy.en);
  // The page title is the alerts product (owner 2026-10-10); the research-hub copy below keeps its own labels.
  const alertsCopy = telegramAlertsHeroCopy(locale);
  const t = { ...hubCopy, title: alertsCopy.h1, subtitle: alertsCopy.sub };
  const [topicMore, topicLess] = topicDisclosureLabels[localeBase] || [t.topicMore, t.topicLess];
  const supportsTopicGateway = localeBase === "en" || isZh || isPt || ["ko", "tr"].includes(localeBase);
  const supportsReturnRail = true;
  const returnRail = returnRailCopyFor(locale);
  const supportsCommandDeck = localeBase === "en" || isZh || ["ja", "ko", "tr"].includes(localeBase);
  const expandableLabels = expandableControlLabels[localeBase];
  const SectionHeading = headingLevel === 1 ? "h2" : "h3";
  const CardHeading = headingLevel === 1 ? "h3" : "h4";
  const telegramContext = {
    market: contextValue(market, "GLOBAL"),
    locale: contextValue(locale, "en"),
    product: contextValue(product, "research"),
  };
  const withTelegramContext = (target, campaign) => ({
    ...target,
    ...(target?.market || !market ? {} : { market: contextValue(market, "") }),
    locale: target?.locale || contextValue(locale, "en"),
    ...(target?.product || !product ? {} : { product: contextValue(product, "") }),
    campaign: target?.campaign || campaign,
  });
  const growthContextAttrs = (campaign) => ({
    "data-growth-market": telegramContext.market,
    "data-growth-product": telegramContext.product,
    ...(campaign ? { "data-growth-campaign": campaign } : {}),
  });
  const telegramReturnNow = useHydratedTelegramReturnNow();
  const returnContextFor = (target = {}, campaign) => buildTelegramReturnContext({
    venue: target.venue,
    pair: target.pair,
    activity: target.activity,
    market: target.market || telegramContext.market,
    locale: target.locale || telegramContext.locale,
    product: target.product || telegramContext.product,
    campaign: target.campaign || campaign,
    ...telegramReturnClockOption(telegramReturnNow),
  });
  const returnAttrs = (target, campaign) => hydratedTelegramReturnAttrs(telegramReturnDataAttrs(returnContextFor(target, campaign)), telegramReturnNow);
  const webOnlyReturnContext = {
    status: "fallback",
    reason: "missing",
    webOnly: true,
    object: { kind: "directory" },
    market: telegramContext.market,
    locale: telegramContext.locale,
    product: telegramContext.product,
    href: localizedHref("/exchanges", { locale, market: telegramContext.market, product: telegramContext.product }),
    boundary: "Web-only fallback: no verified Telegram return context is present. This is not registration, KYC, group-join or commission evidence.",
  };
  const hubReturnContext = returnContextFor({}, "telegram_alerts");
  const platformPathLabel = ({ ja: "取引所を比較", ko: "플랫폼 비교", tr: "Platformları karşılaştır", ar: "قارن المنصات", "pt-BR": "Comparar plataformas", es: "Comparar plataformas", fr: "Comparer les plateformes", de: "Plattformen vergleichen", ru: "Сравнить платформы", id: "Bandingkan platform", vi: "So sánh nền tảng", it: "Confronta le piattaforme" }[locale] || (isHant ? "比較平台" : locale.startsWith("zh") ? "比较平台" : "Compare platforms"));

  const [copiedCmdId, setCopiedCmdId] = useState(null);
  const [copyFailedCmdId, setCopyFailedCmdId] = useState(null);
  const [showAllCommands, setShowAllCommands] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [inboundReturn, setInboundReturn] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setInboundReturn(readTelegramReturnContext(window.location.search));
  }, []);

  const handleCopy = useCallback((cmdId, text) => {
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopyFailedCmdId(null);
        setCopiedCmdId(cmdId);
        setTimeout(() => {
          setCopiedCmdId((current) => (current === cmdId ? null : current));
        }, 2000);
      }).catch(() => {
        // 捕获拒绝权限或写入异常，显式反馈失败而非假性成功
        setCopiedCmdId(null);
        setCopyFailedCmdId(cmdId);
        setTimeout(() => {
          setCopyFailedCmdId((current) => (current === cmdId ? null : current));
        }, 2500);
      });
    } else {
      // 不支持 clipboard API
      setCopiedCmdId(null);
      setCopyFailedCmdId(cmdId);
      setTimeout(() => {
        setCopyFailedCmdId((current) => (current === cmdId ? null : current));
      }, 2500);
    }
  }, []);

  const activeReturnContext = inboundReturn?.status === "restored" ? inboundReturn : webOnlyReturnContext;
  const activeReturnCopy = returnCopyFor(locale);

  return (
    <section className={`tg-hub-section v2-shell${headingLevel === 1 ? " tg-task-desk" : ""}`} id="telegram-hub">
      <div className="tg-hub__container">
        {/* First screen: the alerts product — sample message, four topics, "Open the bot" (?start=alerts), channels + Mini App. */}
        <TelegramAlertsHero
          locale={locale}
          headingLevel={headingLevel}
          heading={headingLevel === 1 ? <h1 className="tg-hub__title">{t.title}</h1> : <h2 className="tg-hub__title">{t.title}</h2>}
          primaryAttrs={{ ...growthContextAttrs("telegram_alerts"), ...hydratedTelegramReturnAttrs(telegramReturnDataAttrs(hubReturnContext), telegramReturnNow) }}
        />


        {inboundReturn && inboundReturn.reason !== "missing" && <section className="tg-return-context" data-telegram-context-status={activeReturnContext.status} {...telegramReturnDataAttrs(activeReturnContext)}>
          <strong>{activeReturnContext.status === "restored" ? activeReturnCopy.restored : activeReturnCopy.fallback}</strong>
          <p>{activeReturnCopy.body}</p>
          <a href={activeReturnContext.href} data-cta-kind="internal" data-cta-placement="telegram-return-context" data-growth-decision="telegram_return_context" data-growth-placement="telegram-hub" {...growthContextAttrs("telegram_return_context")}>
            {activeReturnContext.object?.kind === "venue" ? activeReturnContext.object.venue : activeReturnContext.object?.kind === "pair" ? activeReturnContext.object.pair : activeReturnContext.object?.kind === "activity" ? activeReturnContext.object.activity : platformPathLabel} →
          </a>
        </section>}

        {supportsTopicGateway ? <section className="tg-topic-gateway" aria-labelledby="telegram-topic-title">
          <div className="tg-topic-gateway__header">
            <span className="tg-topic-gateway__badge font-mono">{t.topicBadge}</span>
            <SectionHeading id="telegram-topic-title">{t.topicTitle}</SectionHeading>
            <p>{t.topicSubtitle}</p>
          </div>
          <div className="tg-topic-gateway__grid">
            {TELEGRAM_RESEARCH_PATHS.map((topic, index) => (
              <article key={topic.id} className={`tg-topic-card${index > 1 && !showAllTopics ? " tg-topic-card--mobile-collapsed" : ""}`}>
                <CardHeading>{pickLocalized(topic.question, locale)}</CardHeading>
                <p>{pickLocalized(topic.answer, locale)}</p>
                <div className="tg-topic-card__links" role="group" aria-label={pickLocalized(topic.question, locale)}>
                  {topic.entries.map((entry) => (
                    <a key={entry.href} href={localizedHref(entry.href, { locale, market: telegramContext.market, product: telegramContext.product })} data-cta-kind="internal" data-cta-placement="telegram-topic-onsite" data-growth-decision={topic.id} data-growth-placement="telegram-topic-gateway" {...growthContextAttrs(`telegram_topic_${topic.id}`)}>
                      <span>{pickLocalized(entry.label, locale)}</span>
                    </a>
                  ))}
                </div>
                <a
                  className="tg-topic-card__bot"
                  href={getTelegramDeepLink(withTelegramContext(topic.deepLinkAction, `telegram_topic_${topic.id}`))}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta-kind="telegram"
                  data-cta-placement="telegram-topic-bot"
                  data-growth-decision={topic.id}
                  data-growth-placement="telegram-topic-gateway"
                  {...growthContextAttrs(`telegram_topic_${topic.id}`)}
                  {...returnAttrs(topic.deepLinkAction, `telegram_topic_${topic.id}`)}
                >
                  {t.topicBot} ↗
                </a>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="tg-topic-gateway__toggle"
            aria-expanded={showAllTopics}
            onClick={() => setShowAllTopics((current) => !current)}
          >
            {showAllTopics ? topicLess : topicMore}
          </button>
        </section> : null}

        {/* 首屏社群与 Bot 转化盒子：让视觉与键盘路径保持一致 */}
        <div className="tg-hub__cta-box">
          <div className="tg-cta-left">
            <span className="tg-bot-handle font-mono">{t.tgBotHandle}</span>
            <SectionHeading className="tg-group-title">{t.tgGroupTitle}</SectionHeading>
            <p className="tg-group-desc">{t.tgGroupDesc}</p>
          </div>
          <div className="tg-cta-buttons">
            <a href={TELEGRAM_CONFIG.groupUrl} target="_blank" rel="noopener noreferrer" className="tg-btn tg-btn--secondary" data-cta-kind="telegram" data-cta-placement="telegram-hub-group" data-growth-decision="telegram_group" data-growth-placement="telegram-hub" {...growthContextAttrs("telegram_hub_group")}>
              {t.btnJoinGroup}
            </a>
            <a href={localizedHref("/exchanges", { locale, market: telegramContext.market, product: telegramContext.product })} className="tg-btn tg-btn--secondary" data-cta-kind="internal" data-cta-placement="telegram-hub-platform-directory" data-growth-decision="platform_directory" data-growth-placement="telegram-hub" {...growthContextAttrs("telegram_hub_directory")}>
              {platformPathLabel} →
            </a>
          </div>
        </div>


        {supportsReturnRail ? <section className="tg-return-rail" aria-labelledby="telegram-return-title">
          <div className="tg-return-rail__header">
            <SectionHeading id="telegram-return-title">{returnRail.title}</SectionHeading>
            <p>{returnRail.subtitle}</p>
          </div>
          <div className="tg-return-rail__grid">
            {returnRail.items.map(([label, description, href, decision]) => (
              <a key={decision} className="tg-return-card" href={localizedHref(href, { locale, market: telegramContext.market, product: telegramContext.product })} data-cta-kind="internal" data-cta-placement="onsite-return-rail" data-growth-decision={decision} data-growth-placement="onsite-return-rail" {...growthContextAttrs(`onsite_return_${decision}`)}>
                <strong>{label} →</strong>
                <span>{description}</span>
              </a>
            ))}
          </div>
        </section> : null}

        {/* Telegram 极速指令交互卡控制台 */}
        {supportsCommandDeck ? <details className="tg-command-disclosure">
          <summary>
            <span>{t.commandsSummary || copy.en.commandsSummary}</span>
            <small>{t.commandsTitle}</small>
          </summary>
          <div className="tg-deck">
          <div className="tg-deck__header">
            <div className="tg-deck__badge font-mono">{t.commandsBadge}</div>
            <SectionHeading className="tg-deck__title">{t.commandsTitle}</SectionHeading>
            <p className="tg-deck__subtitle">{t.commandsSubtitle}</p>
          </div>

          <div className="tg-deck__grid">
            {TELEGRAM_COMMANDS.map((cmd, index) => {
              const name = isHant ? cmd.nameHant : isZh ? cmd.nameZh : cmd[`name${localeBase === "ja" ? "Ja" : localeBase === "ko" ? "Ko" : localeBase === "tr" ? "Tr" : "En"}`];
              const desc = isHant ? cmd.descHant : isZh ? cmd.descZh : cmd[`desc${localeBase === "ja" ? "Ja" : localeBase === "ko" ? "Ko" : localeBase === "tr" ? "Tr" : "En"}`];
              const badge = isHant ? cmd.badgeHant : isZh ? cmd.badgeZh : cmd[`badge${localeBase === "ja" ? "Ja" : localeBase === "ko" ? "Ko" : localeBase === "tr" ? "Tr" : "En"}`];
              const deepLink = getTelegramDeepLink(withTelegramContext(cmd.deepLinkAction, `telegram_command_${cmd.id}`));
              const commandReturnAttrs = returnAttrs(cmd.deepLinkAction, `telegram_command_${cmd.id}`);
              const isCopied = copiedCmdId === cmd.id;
              const isFailed = copyFailedCmdId === cmd.id;

              return (
                <div key={cmd.id} className={`tg-cmd-card${index > 1 && !showAllCommands ? " tg-cmd-card--mobile-collapsed" : ""}`}>
                  <div className="tg-cmd-card__top">
                    <div className="tg-cmd-card__meta">
                      <span className="tg-cmd-card__icon">{cmd.icon}</span>
                      <span className="tg-cmd-card__badge">{badge}</span>
                    </div>
                    <code className="tg-cmd-card__command font-mono">
                      <span className="tg-cmd-card__prompt">&gt;</span> {cmd.command}
                    </code>
                  </div>

                  <div className="tg-cmd-card__body">
                    <CardHeading className="tg-cmd-card__name">{name}</CardHeading>
                    <p className="tg-cmd-card__desc">{desc}</p>
                    <div className="tg-cmd-card__sample font-mono">
                      <span className="tg-cmd-card__sample-label">{t.samplePrefix}</span>
                      <span className="tg-cmd-card__sample-code">{cmd.sampleUsage}</span>
                    </div>
                  </div>

                  <div className="tg-cmd-card__actions">
                    <button
                      type="button"
                      onClick={() => handleCopy(cmd.id, cmd.command)}
                      className={`tg-cmd-btn tg-cmd-btn--copy ${isCopied ? "is-copied" : ""} ${isFailed ? "is-failed" : ""}`}
                      title={isCopied ? t.btnCopiedCmd : isFailed ? t.btnCopyFailed : t.btnCopyCmd}
                      aria-label={`${t.btnCopyCmd} ${cmd.command}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {isCopied ? (
                          <polyline points="20 6 9 17 4 12" />
                        ) : isFailed ? (
                          <>
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </>
                        ) : (
                          <>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </>
                        )}
                      </svg>
                      <span>{isCopied ? t.btnCopiedCmd : isFailed ? t.btnCopyFailed : t.btnCopyCmd}</span>
                    </button>

                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tg-cmd-btn tg-cmd-btn--launch"
                      data-cta-kind="telegram"
                      data-cta-placement="telegram-command-deep-link"
                      data-growth-decision={cmd.id}
                      data-growth-placement="telegram-command"
                      {...growthContextAttrs(`telegram_command_${cmd.id}`)}
                      {...commandReturnAttrs}
                      title={`${t.btnLaunchDeepLink}: ${cmd.command}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                      </svg>
                      <span>{t.btnLaunchDeepLink}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" className="tg-deck__toggle" data-telegram-command-toggle aria-expanded={showAllCommands} onClick={() => setShowAllCommands((open) => !open)}>
            {showAllCommands ? (expandableLabels?.lessCommands || (isHant ? "收起其他指令" : isZh ? "收起其他指令" : isPt ? "Ocultar outros comandos" : "Hide other commands")) : (expandableLabels?.moreCommands || (isHant ? "查看其他指令" : isZh ? "查看其他指令" : isPt ? "Ver outros comandos" : "View other commands"))}
            <span aria-hidden="true">{showAllCommands ? " ↑" : " ↓"}</span>
          </button>
          </div>
        </details> : null}

        {supportsTopicGateway && <details className="tg-ops-pack tg-public-topics-disclosure">
          <summary>{editorialDisclosureLabels[locale] || editorialDisclosureLabels[localeBase] || editorialDisclosureLabels.en}</summary>
          <nav className="tg-public-topics" aria-label={editorialDisclosureLabels[locale] || editorialDisclosureLabels[localeBase] || editorialDisclosureLabels.en}>
            <ul className="tg-public-topics__list">
              {RELATED_QUESTIONS.map((topic) => (
                <li key={topic.id}>
                  <a href={localizedHref(topic.primaryPath, { locale, market: telegramContext.market, product: telegramContext.product })} data-cta-kind="internal" data-cta-placement="telegram-wave7-onsite" data-growth-decision={topic.id} data-growth-placement="telegram-search-topic-onsite" {...growthContextAttrs(topic.campaign)}>
                    {topic.labels[locale] || topic.labels[localeBase] || topic.labels.en}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </details>}

      </div>
    </section>
  );
}

export default TelegramBotHub;
