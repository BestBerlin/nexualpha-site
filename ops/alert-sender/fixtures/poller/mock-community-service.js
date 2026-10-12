import { parseCommand } from "../../../packages/domain/src/commands.js";
import { handlePersonaInteraction } from "./bot-commands.js";
import { communityQuestBoardText, communityQuests } from "../../../packages/domain/src/community-quests.js";
import { weeklyCommunityRituals } from "../../../packages/domain/src/community-rituals.js";
import { checkCommunityLink } from "../../../packages/domain/src/link-check.js";
import { formatReviewedPlatformComparison, reviewedPlatformComparisonLinks } from "../../../packages/domain/src/reviewed-platform-comparison.js";
import { reviewedResourceCategoryRecords, searchReviewedResources } from "../../../packages/domain/src/reviewed-resource-search.js";
import { productVersionText } from "../../../packages/domain/src/product-version.js";
import { parseSupportBotTriageCallbackData, supportBotSelfServiceText, supportBotTriageOptions, supportDeskGuidanceFor, supportDeskReceiptText, supportDeskTriageOptions } from "../../../packages/domain/src/support-desk-triage.js";
import { planSourceBoundReviewedAnswer } from "../../../packages/ai/src/source-bound-reviewed-answer.js";
import { communityFeedbackCategories, parseCommunityFeedbackCategory } from "../../../packages/analytics/src/community-feedback-pulse.js";
import { renderMemberNewsDigest } from "../../../packages/content/src/member-news-digest.js";
import { renderMarketPulse } from "../../../packages/content/src/market-pulse.js";
import { renderRadarOverviewCard } from "../../../packages/content/src/market-radar.js";
import { telegramFailedDeliveryState } from "../../../packages/telegram/src/adapter.js";
import { emptyShadowObservationSummary } from "../../../packages/analytics/src/shadow-observation-summary.js";
import { unavailableRitualReadiness } from "./ritual-readiness.js";
import { isSignupIntent, signupMarkup, signupText } from "./partner-offers.js";
import { alertsMarkup, alertsText, handleAlertsCommand } from "./alert-subscriptions.js";
const channelUsername = "NexuAlphaClub";
const groupUsername = "NexuAlphaWorld";
const passportWebAppUrl = "https://app.nexuAlpha.com/";
/** Every command advertised through Telegram's group menu must produce one bounded in-group reply. */
const groupReplyCommands = new Set(["help", "hub", "community", "topics", "market", "radar", "brief", "rituals", "quests", "ask", "compare", "resources", "search", "risk", "quiz", "pulse", "ops", "report", "support", "feedback", "perks", "invite", "version", "signup", "alerts"]);
const topicCatalog = [
    { label: "市场简报", route: "brief", use: "只看人工审核后的市场脉络和风险提示" },
    { label: "交易所情报", route: "exchange", use: "沉淀 Binance / OKX 等官方公告、活动和规则变更" },
    { label: "费率与成本", route: "fees", use: "比较手续费、资金费率和出入金成本，不做收益承诺" },
    { label: "上币观察", route: "listing", use: "跟踪官方上币、下架、合约更新和流动性变化" },
    { label: "风险与反诈", route: "risk", use: "集中处理诈骗识别、假链接、私信诱导和资产安全" },
    { label: "订阅提醒", route: "alerts", use: "管理自愿订阅的提醒主题，不群发私信" },
];
const safetyInlineCards = [
    {
        id: "nexualpha_anti_scam",
        title: "NexuAlpha 反诈提醒",
        description: "固定安全卡：私信客服、验证码、转账核验都先停下核验。",
        messageText: "NexuAlpha 反诈提醒\n\n" +
            "遇到私信客服、验证码索取、转账核验或紧急解冻资产，请先停止操作，通过官方入口独立核验。\n\n" +
            "这张卡不判断价格、不提供交易建议，也不记录分享对象。",
        keywords: ["anti", "scam", "fraud", "risk", "safe", "safety", "反诈", "诈骗", "风险", "安全"],
    },
    {
        id: "nexualpha_wallet_safety",
        title: "钱包与链接安全",
        description: "固定安全卡：不输入助记词，不按陌生链接授权。",
        messageText: "钱包与链接安全\n\n" +
            "不要向任何人发送助记词、验证码或私钥。陌生链接、二维码和授权弹窗都先暂停，再从官方入口重新进入核验。\n\n" +
            "这张卡不访问链接、不读取钱包、不提供收益或交易指令。",
        keywords: ["wallet", "link", "qr", "phishing", "安全", "钱包", "链接", "二维码", "钓鱼"],
    },
    {
        id: "nexualpha_official_channel",
        title: "官方频道入口",
        description: "固定入口卡：NexuAlpha 官方频道是 @NexuAlphaClub。",
        messageText: "NexuAlpha 官方频道\n\n" +
            "官方频道：@NexuAlphaClub\n\n" +
            "请从频道资料页和置顶信息核验入口。任何冒充管理员、客服或收益承诺的私信都不代表官方确认。",
        keywords: ["official", "channel", "nexualpha", "entry", "官方", "频道", "入口"],
    },
    {
        id: "nexualpha_community",
        title: "NexuAlpha Club 社群",
        description: "固定社群卡：选择后可打开官方频道与讨论区；不追踪分享。",
        messageText: "NexuAlpha Club 社群\n\n" +
            "讨论社群：@NexuAlphaWorld\n\n" +
            "社群以来源审核、风险教育和人工主持为主。机器人不会主动私信、拉人、承诺收益或要求你立即操作。",
        keywords: ["community", "club", "group", "nexualpha", "社群", "群", "讨论"],
        replyMarkup: inlineCommunityMarkup(),
    },
    {
        id: "nexualpha_official_exchange_updates",
        title: "交易所官方公告核验",
        description: "固定资料卡：从 OKX / Binance 官方公告页自行核验规则、地区和生效时间。",
        messageText: "交易所官方公告核验\n\n" +
            "请仅从 OKX / Binance 官方公告页核验上币、下架、维护、产品和规则变更；公告不等于交易信号。\n\n" +
            "此卡不提供实时价格、收益预测、开户链接或交易指令，也不记录接收方或选择结果。",
        keywords: ["exchange", "announcement", "okx", "binance", "交易所", "公告", "规则"],
        replyMarkup: inlineOfficialResourceMarkup("exchange"),
    },
    {
        id: "nexualpha_fee_verification",
        title: "费率与成本核验",
        description: "固定资料卡：费率依地区、产品、等级和交易对而变，须以实际页面为准。",
        messageText: "费率与成本核验\n\n" +
            "手续费、资金费率、出入金和产品规则会随地区、账户等级及交易对变化。请以你的实际官方页面和下单确认页为准。\n\n" +
            "此卡不构成交易建议、不承诺成本或收益，也不记录接收方或选择结果。",
        keywords: ["fee", "fees", "funding", "cost", "费用", "费率", "手续费", "资金费率", "成本"],
        replyMarkup: inlineOfficialResourceMarkup("fees"),
    },
    {
        id: "nexualpha_listing_risk",
        title: "上币与下架风险核验",
        description: "固定资料卡：核验官方公告、生效时间、地区与产品条件，不把公告当交易信号。",
        messageText: "上币与下架风险核验\n\n" +
            "请核验官方公告、生效时间、地区限制、交易对、下架或迁移条件。上币、合约或活动公告不等于价格预测。\n\n" +
            "此卡不提供交易指令、不发奖励、不记录接收方或选择结果。",
        keywords: ["listing", "delisting", "contract", "上币", "下架", "合约", "迁移"],
        replyMarkup: inlineOfficialResourceMarkup("listing"),
    },
];
export async function handleMockCommunityEvent(adapter, event, controls, shadowSummary = emptyShadowObservationSummary(), ritualReadiness = unavailableRitualReadiness, marketPulse, newsDigest, publicContentReceipts = [], radarEvents = []) {
    if (!adapter.accept(event))
        return undefined;
    const updateDelivery = updateDeliveryTracker(adapter, event);
    try {
        const stopParsed = privateStopCommand(event);
        const rawParsed = stopParsed ?? parseCommand(event.text) ?? (event.isPrivateChat && isSignupIntent(event.text) ? { command: "signup", argument: undefined } : undefined);
        // deep links t.me/<bot>?start=alerts / ?start=signup open those cards directly (2026-10-10)
        const startTarget = rawParsed?.command === "start" ? rawParsed.argument?.trim().toLowerCase() : undefined;
        // ?start=alerts-<lang> (ru, tr, vi, id, es, pt, en, zh) opens the card in that language (2026-10-11)
        const startAlertsLang = startTarget && /^alerts-(zh|en|ru|tr|vi|id|es|pt)$/.test(startTarget) ? `lang-${startTarget.slice(7)}` : undefined;
        const parsed = startAlertsLang ? { command: "alerts", argument: startAlertsLang }
            : startTarget === "alerts" || startTarget === "signup" ? { command: startTarget, argument: undefined } : rawParsed;
        const controlEvent = stopParsed !== undefined || parsed?.command === "stop" ? { ...event, text: "/unsubscribe all" } : event;
        if (!parsed) {
            const btcAsset = marketPulse?.items?.find((item) => item.symbol === "BTC");
            const personaMessage = handlePersonaInteraction(event, {
                ...(btcAsset?.priceUsd !== undefined ? { btcPrice: btcAsset.priceUsd } : {}),
            });
            if (personaMessage) {
                await updateDelivery.track(() => adapter.send(personaMessage));
                adapter.markUpdateCompleted?.(event);
                return personaMessage.text;
            }
            adapter.markUpdateCompleted?.(event);
            return undefined;
        }
        if (parsed.command === "quiz" && (event.isPrivateChat || groupReplyCommands.has(parsed.command)) && adapter.sendQuiz !== undefined)
            await updateDelivery.track(() => adapter.sendQuiz?.(safetyQuiz(event)));
        let adminEntryOutcome;
        if (parsed.command === "pulse" || parsed.command === "ops")
            adminEntryOutcome = await groupAdministratorOutcome(adapter, event, parsed.command, updateDelivery.track);
        let memberOutcome;
        try {
            if (parsed.command === "start" && event.isPrivateChat) {
                adapter.markStarted(event.userId);
                await controls?.recordPrivateStart(controlEvent);
            }
            if (parsed.command === "subscribe" || parsed.command === "unsubscribe" || parsed.command === "stop") {
                memberOutcome = { kind: "subscription", result: controls ? await controls.handleSubscription(controlEvent) : "UNAVAILABLE" };
            }
            if (parsed.command === "delivery_consent") {
                memberOutcome = { kind: "delivery_consent", result: controls ? await controls.handleDeliveryConsent(controlEvent) : "UNAVAILABLE" };
            }
            if (parsed.command === "watch" || parsed.command === "unwatch") {
                memberOutcome = { kind: "market_watch", result: controls ? await controls.handleMarketWatch(controlEvent) : "UNAVAILABLE" };
            }
            if (parsed.command === "language") {
                const result = controls ? await controls.handleLocale(controlEvent) : "UNAVAILABLE";
                memberOutcome = result === "LOCALE_UPDATED" || result === "LOCALE_CURRENT"
                    ? { kind: "locale", result, locale: controls ? await controls.activeLocale(controlEvent) : "en" }
                    : { kind: "locale", result };
            }
            if (parsed.command === "alerts" && event.isPrivateChat) {
                memberOutcome = { kind: "alerts", state: handleAlertsCommand(event.userId, parsed.argument) };
            }
            if (parsed.command === "delete_my_data") {
                memberOutcome = { kind: "deletion", result: controls ? await controls.deleteMyData(controlEvent) : "USER_NOT_FOUND" };
            }
            if ((parsed.command === "settings" || parsed.command === "topics" || parsed.command === "today" || parsed.command === "market") && event.isPrivateChat) {
                memberOutcome = controls
                    ? { kind: "preferences", topics: await controls.activeTopics(controlEvent), deliveryConsentTopics: await controls.activeDeliveryConsentTopics(controlEvent), marketAssets: await controls.activeMarketWatch(controlEvent), locale: await controls.activeLocale(controlEvent) }
                    : { kind: "preferences" };
            }
        }
        catch (error) {
            logMemberControlFailure(parsed.command, error);
            memberOutcome = memberFailureOutcome(parsed.command);
        }
        const marketAssets = memberOutcome?.kind === "preferences" ? memberOutcome.marketAssets : undefined;
        const response = responseFor(parsed.command, parsed.argument, event.isPrivateChat, event.isPremium === true, memberOutcome, event.receivedAt, adminEntryOutcome, shadowSummary, ritualReadiness, marketPulse, newsDigest, marketAssets, publicContentReceipts, radarEvents);
        if (response && (event.isPrivateChat || groupReplyCommands.has(parsed.command))) {
            await updateDelivery.track(() => adapter.send(toOutboundMessage(event, response, parsed.command)));
        }
        const callbackQueryId = event.callbackQueryId;
        if (callbackQueryId !== undefined && adapter.answerCallbackQuery !== undefined)
            await updateDelivery.track(() => adapter.answerCallbackQuery?.(callbackQueryId));
        adapter.markUpdateCompleted?.(event);
        return response?.text;
    }
    catch (error) {
        updateDelivery.markFailed(error);
        throw error;
    }
}
export async function handleMockInlineQueryEvent(adapter, event) {
    const results = safetyCardsForInlineQuery(event.query);
    await adapter.answerInlineQuery?.({
        inlineQueryId: event.inlineQueryId,
        results,
        cacheTimeSeconds: 0,
        isPersonal: true,
    });
    return results;
}
/** A fixed receipt for a voluntarily opened channel-DM topic; it reads no body or sender. */
export async function handleChannelDirectMessageEvent(adapter, event) {
    if (!adapter.accept(event))
        return undefined;
    const updateDelivery = updateDeliveryTracker(adapter, event);
    try {
        const text = supportDeskReceiptText();
        await updateDelivery.track(() => adapter.send({
            chatId: event.chatId,
            directMessagesTopicId: event.directMessagesTopicId,
            replyToMessageId: event.messageId,
            text,
            replyMarkup: supportDeskTriageMarkup(),
        }));
        adapter.markUpdateCompleted?.(event);
        return text;
    }
    catch (error) {
        updateDelivery.markFailed(error);
        throw error;
    }
}
/** Fixed, topic-local self-service cards for a voluntary channel DM; no clicker or body is retained. */
export async function handleChannelDirectMessageCallbackEvent(adapter, event) {
    if (!adapter.accept(event))
        return undefined;
    const updateDelivery = updateDeliveryTracker(adapter, event);
    try {
        const guidance = supportDeskGuidanceFor(event.action);
        await updateDelivery.track(() => adapter.send({
            chatId: event.chatId,
            directMessagesTopicId: event.directMessagesTopicId,
            replyToMessageId: event.messageId,
            text: guidance.text,
            ...(guidance.includeCommunityLinks ? { replyMarkup: inlineCommunityMarkup() } : {}),
        }));
        if (adapter.answerCallbackQuery !== undefined)
            await updateDelivery.track(() => adapter.answerCallbackQuery?.(event.callbackQueryId));
        adapter.markUpdateCompleted?.(event);
        return guidance.text;
    }
    catch (error) {
        updateDelivery.markFailed(error);
        throw error;
    }
}
function updateDeliveryTracker(adapter, event) {
    let successfulExternalEffect = false;
    let uncertainExternalEffect = false;
    return {
        async track(operation) {
            try {
                const result = await operation();
                successfulExternalEffect = true;
                return result;
            }
            catch (error) {
                uncertainExternalEffect ||= telegramFailedDeliveryState(error) === "send_uncertain";
                throw error;
            }
        },
        markFailed(error) {
            if (successfulExternalEffect || uncertainExternalEffect || telegramFailedDeliveryState(error) === "send_uncertain") {
                adapter.markUpdateFailed?.(event, { deliveryState: "send_uncertain" });
                return;
            }
            adapter.markUpdateFailed?.(event, error);
        },
    };
}
export function safetyCardsForInlineQuery(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized)
        return [];
    return safetyInlineCards
        .filter((card) => card.keywords.some((keyword) => normalized.includes(keyword)))
        .map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        messageText: card.messageText,
        ...("replyMarkup" in card ? { replyMarkup: card.replyMarkup } : {}),
    }));
}
function responseFor(command, argument, isPrivateChat, isPremium, memberOutcome, receivedAt, adminEntryOutcome, shadowSummary, _ritualReadiness, marketPulse, newsDigest, marketAssets, publicContentReceipts = [], radarEvents = []) {
    const privateOnly = "请先私聊机器人并发送 /start，再使用此功能。\nPlease start a private chat with the bot first.";
    const normalizedArgument = argument?.trim().toLowerCase();
    switch (command) {
        case "start":
        case "hub":
            return isPrivateChat
                ? {
                    text: command === "start" ? startEntryText(normalizedArgument) : privateHubText(normalizedArgument),
                    replyMarkup: command === "start" && isEntryRoute(normalizedArgument)
                        ? entryRouteMarkup()
                        : normalizedArgument === "topics" || normalizedArgument === "brief" ? topicsMarkup() : hubMarkup(),
                }
                : {
                    text: "群内已收到。若要查看个人设置、订阅或私密提醒，请私聊机器人后发送 /start hub。",
                    replyMarkup: groupNudgeMarkup("打开私聊中枢", "hub"),
                };
        case "topics":
            return isPrivateChat
                ? {
                    text: deliveryConsentControlText(memberOutcome),
                    replyMarkup: hubMarkup(),
                }
                : {
                    text: communityTopicGuideText("group"),
                    replyMarkup: groupNudgeMarkup("打开主题分流", "topics"),
                };
        case "community":
            return isPrivateChat
                ? { text: communityMapText("private"), replyMarkup: communityMapMarkup() }
                : { text: communityMapText("group"), replyMarkup: groupNudgeMarkup("打开社区地图", "community") };
        case "help":
            return isPrivateChat
                ? {
                    text: "NexuAlpha 私聊操作台\n\n" +
                        "新版主导航优先放已实装、可直接使用的功能：\n" +
                        "• /market — 行情脉冲；/radar — 实时异动雷达；/watch BTC ETH SOL 与 /unwatch 管理关注\n" +
                        "• /subscribe <主题> — 保存主题偏好；/delivery_consent on <主题> — 单独开启私聊提醒同意\n" +
                        "• /rituals、/brief、/resources、/ask、/compare、/search — 互动、复盘与来源核验\n" +
                        "• /privacy、/delete_my_data — 查看边界与退出/删除最小记录\n\n" +
                        "兼容入口仍可使用但不占新版主按钮：/quests、/today、/perks、/invite、/community、/status、/version。\n" +
                        "管理员入口：/pulse、/ops。安全工具：/risk、/scenario、/quiz、/checklink、/report、/support、/feedback。\n\n" +
                        "行情快照须通过来源与时效校验；上币和平台信息须回到官方资料。请独立判断风险。",
                    replyMarkup: hubMarkup(),
                }
                : {
                    text: "群内可用：/help、/hub、/community、/topics、/perks、/market、/radar、/brief、/rituals、/quests、/ask、/compare、/search、/risk、/quiz、/pulse、/ops、/report、/support、/feedback、/version。\n/market、/brief、/ask、/compare、/search、/support 与 /feedback 在群内只给你本人显示，不主动私信、不收集问题或参数；/radar 为全群实时公开雷达广播；/pulse 与 /ops 只接受管理员主动发起，且不收集成员投票或个人资料。需要订阅、隐私或个人设置，请私聊机器人后发送 /start。",
                    replyMarkup: groupNudgeMarkup("打开私聊中枢", "hub"),
                };
        case "market":
            return {
                text: renderPersonalMarketPulse(marketPulse, receivedAt, isPrivateChat ? marketAssets : undefined),
                replyMarkup: isPrivateChat ? marketMarkup() : groupNudgeMarkup("查看行情脉冲", "market"),
            };
        case "radar": {
            const card = renderRadarOverviewCard(radarEvents, receivedAt);
            return {
                text: card,
                richMarkdown: card,
                ...(isPrivateChat ? { replyMarkup: marketMarkup() } : {}),
            };
        }
        case "brief":
            return {
                text: renderMemberNewsDigest(newsDigest, receivedAt),
                replyMarkup: isPrivateChat ? topicsMarkup() : groupNudgeMarkup("打开简报入口", "brief"),
            };
        case "rituals":
            return isPrivateChat
                ? { text: interactionReviewText(receivedAt, publicContentReceipts), replyMarkup: hubMarkup() }
                : { text: "本周社区节奏已就绪：市场雷达、收盘复盘、交易所比较、反诈诊所和新手训练营。除反诈诊所外，内容均须先完成来源审核；私聊机器人发送 /rituals 可查看完整时间表。", replyMarkup: groupNudgeMarkup("查看本周节奏", "rituals") };
        case "quests":
            return isPrivateChat
                ? { text: communityQuestBoardText("private", "zh-Hans"), replyMarkup: questsMarkup() }
                : { text: communityQuestBoardText("group", "zh-Hans"), replyMarkup: groupNudgeMarkup("打开每日任务", "quests") };
        case "risk":
            return isPrivateChat
                ? {
                    text: "风险提示：加密资产价格波动大，任何收益承诺、私信索要助记词/验证码、非官方链接或催促转账都应视为高风险。请仅通过频道置顶的官方入口核验。",
                    replyMarkup: riskMarkup(),
                }
                : {
                    text: "群内提醒：不要在公开聊天里发助记词、验证码或身份证明。需要风险教育请私聊机器人后发送 /risk。",
                    replyMarkup: groupNudgeMarkup("打开风险入口", "risk"),
                };
        case "scenario":
            return isPrivateChat
                ? { text: scenarioText(argument), replyMarkup: scenarioMarkup(argument) }
                : { text: privateOnly };
        case "quiz":
            return { text: "已发送匿名反诈测验。机器人不接收或保存参与者、答案；不计分、不排行、不发奖，也不构成交易建议。", replyMarkup: riskMarkup() };
        case "pulse":
            return communityPulseText(adminEntryOutcome, isPrivateChat);
        case "ops":
            return administratorOperationsText(adminEntryOutcome, isPrivateChat, shadowSummary);
        case "checklink":
            return isPrivateChat
                ? { text: linkCheckText(argument), replyMarkup: hubMarkup() }
                : { text: privateOnly };
        case "report":
            return isPrivateChat
                ? {
                    text: reportGuidance(argument),
                    replyMarkup: reportMarkup(),
                }
                : {
                    text: "群内看到可疑内容时，请直接回复该消息或私聊机器人提交说明。不要在群里转发敏感信息。",
                    replyMarkup: groupNudgeMarkup("打开举报入口", "report"),
                };
        case "support":
            return supportResponse(argument, isPrivateChat);
        case "feedback":
            return feedbackResponse(argument, isPrivateChat);
        case "invite":
            return isPrivateChat
                ? {
                    text: "NexuAlpha 官方邀请入口\n\n如你认为频道的风险教育与已核验信息对朋友有帮助，可自行选择分享。分享前请确认对方愿意接收；不要批量转发、不要承诺收益，也不要把邀请链接用于冒充管理员。\n\n机器人不会记录分享对象、次数、来源或转化。",
                    replyMarkup: inviteMarkup(),
                }
                : {
                    text: "邀请入口仅在私聊中提供，以避免在群内制造拉人压力。请私聊机器人后发送 /invite。",
                    replyMarkup: groupNudgeMarkup("打开私聊邀请入口", "invite"),
                };
        case "privacy":
            return isPrivateChat
                ? {
                    text: "隐私说明：仅处理回应你的请求所必需的数据。不会读取你的 Telegram 会话、通讯录或历史聊天记录。发送 /delete_my_data 可提出删除请求。",
                    replyMarkup: hubMarkup(),
                }
                : {
                    text: privateOnly,
                };
        case "delete_my_data":
            return isPrivateChat
                ? { text: deletionText(memberOutcome), replyMarkup: hubMarkup() }
                : { text: privateOnly };
        case "subscribe":
            return isPrivateChat
                ? {
                    text: subscriptionText(memberOutcome, argument),
                    replyMarkup: topicsMarkup(),
                }
                : { text: privateOnly };
        case "unsubscribe":
        case "stop":
            return isPrivateChat
                ? {
                    text: subscriptionText(memberOutcome, argument),
                    replyMarkup: topicsMarkup(),
                }
                : { text: privateOnly };
        case "delivery_consent":
            return isPrivateChat
                ? {
                    text: deliveryConsentText(memberOutcome, argument),
                    replyMarkup: topicsMarkup(),
                }
                : { text: privateOnly };
        case "language":
            return isPrivateChat
                ? { text: localeText(memberOutcome), replyMarkup: hubMarkup() }
                : { text: privateOnly };
        case "watch":
        case "unwatch":
            return isPrivateChat
                ? { text: marketWatchText(memberOutcome), replyMarkup: hubMarkup() }
                : { text: privateOnly };
        case "perks":
            return isPrivateChat
                ? {
                    text: perksText(isPremium),
                    replyMarkup: perksMarkup(),
                }
                : {
                    text: "群内先别展开会员权益。请私聊机器人后发送 /perks 查看你的专属入口。",
                    replyMarkup: groupNudgeMarkup("打开会员权益", "perks"),
                };
        case "settings":
            return isPrivateChat
                ? { text: preferenceSettingsText(memberOutcome), replyMarkup: hubMarkup() }
                : { text: privateOnly };
        case "today":
            return isPrivateChat
                ? { text: todayPathText(receivedAt, memberOutcome), replyMarkup: todayMarkup() }
                : { text: privateOnly };
        case "signup":
            return { text: signupText(), replyMarkup: signupMarkup(isPrivateChat ? [[navigationButton("返回中枢", "hub")]] : []) };
        case "exchange":
        case "fees":
        case "listing":
            return isPrivateChat
                ? {
                    text: officialResourceText(parsedCommandLabel(command)),
                    replyMarkup: officialResourceMarkup(command),
                }
                : { text: privateOnly };
        case "resources":
            return officialResourcesResponse(argument, isPrivateChat);
        case "search":
            return isPrivateChat
                ? {
                    text: reviewedResourceSearchText(argument),
                    replyMarkup: reviewedResourceSearchMarkup(argument),
                }
                : { text: privateOnly };
        case "compare":
            return isPrivateChat
                ? {
                    text: formatReviewedPlatformComparison(argument),
                    replyMarkup: reviewedPlatformComparisonMarkup(argument),
                }
                : {
                    text: "平台资料比较只在私聊中生成。请私聊机器人后发送 /compare Binance OKX；群内不会处理或保存参数，也不会主动私信。",
                    replyMarkup: groupNudgeMarkup("打开平台比较", "compare"),
                };
        case "ask":
            return isPrivateChat
                ? privateSourceBoundAnswerResponse(argument)
                : {
                    text: "来源问答只在私聊中回答。请私聊机器人后发送 /ask <问题>；群内不会处理或保存你的问题。",
                    replyMarkup: { inlineKeyboard: [[button("打开 Bot 私聊", "https://t.me/NexuAlphaAssistantBot")]] },
                };
        case "alerts":
            return isPrivateChat
                ? { text: alertsText(memberOutcome?.state), replyMarkup: alertsMarkup(memberOutcome?.state, [[navigationButton("返回中枢", "hub")]]) }
                : { text: "行情告警通过私信推送。请私聊机器人并发送 /alerts 选择主题。", replyMarkup: groupNudgeMarkup("订阅行情告警", "alerts") };
        case "status":
            return isPrivateChat
                ? { text: communityStatusText(), richMarkdown: communityStatusRichMarkdown(), replyMarkup: hubMarkup() }
                : { text: "社区安全状态卡仅在私聊中显示。请私聊机器人后发送 /status。", replyMarkup: groupNudgeMarkup("查看社区状态", "status") };
        case "version":
            return isPrivateChat
                ? { text: productVersionText("private"), replyMarkup: hubMarkup() }
                : { text: productVersionText("group"), replyMarkup: groupNudgeMarkup("查看版本透明", "version") };
        default:
            return undefined;
    }
}
function parsedCommandLabel(command) {
    if (command === "fees" || command === "listing")
        return command;
    return "exchange";
}
/**
 * A fixed first-party directory, rather than a feed: it makes no claim about
 * current listings, fees, availability, account status, or regional terms.
 */
function officialResourceText(topic) {
    const topicCopy = {
        exchange: "交易所官方资料目录：只提供 OKX 与 Binance 的官方公告入口，供你自行核验地区、时间、产品可用性与风险说明。",
        fees: "费率与成本官方资料目录：费率取决于地区、产品、账户等级和交易对；请以你实际下单页面与所在地区规则为准。",
        listing: "上币与规则变更官方资料目录：公告页面不是交易信号。请核验生效时间、地区、交易对、下架条件与风险说明。",
    };
    return `${topicCopy[topic]}\n\n不提供实时价格、收益预测、开户链接或交易指令；机器人不会记录你打开的入口。`;
}
function officialResourceMarkup(topic) {
    const links = {
        exchange: ["OKX 官方公告", "https://www.okx.com/help/category/announcements", "Binance 官方公告", "https://www.binance.com/en-AE/support/announcement/list/48"],
        fees: ["OKX 费率说明", "https://www.okx.com/en-us/help/fee-details", "Binance 官方公告", "https://www.binance.com/en-AE/support/announcement/list/48"],
        listing: ["OKX 上币/下架公告", "https://www.okx.com/help/category/announcements", "Binance 上币公告", "https://www.binance.com/en-AE/support/announcement/list/48"],
    };
    const [leftText, leftUrl, rightText, rightUrl] = links[topic];
    return { inlineKeyboard: [[button(leftText, leftUrl), button(rightText, rightUrl)], [navigationButton("返回社区中枢", "hub")]] };
}
function officialResourcesResponse(argument, isPrivateChat) {
    if (!isPrivateChat) {
        return {
            text: "官方资料目录只在私聊中显示。请私聊机器人后发送 /resources；群内不会处理或保存参数、展示来源链接、创建私信同意、主动联系成员、联网抓取或提供交易建议。",
            replyMarkup: groupNudgeMarkup("打开官方资料目录", "resources"),
        };
    }
    const parsed = parseOfficialResourceCategory(argument);
    if (parsed.category === undefined) {
        return {
            text: officialResourcesDirectoryText(parsed.unknownArgument),
            replyMarkup: officialResourcesDirectoryMarkup(),
        };
    }
    return {
        text: officialResourcesCategoryText(parsed.category),
        replyMarkup: officialResourcesCategoryMarkup(parsed.category),
    };
}
function officialResourcesDirectoryText(unknownArgument) {
    return "官方资料目录\n\n" +
        "这是固定的本地已审核 Binance / OKX 一手资料目录入口；不联网抓取、不按热度排序、不推荐平台、不声称实时，也不保存查询、参数或结果。\n\n" +
        "可浏览的安全类别：\n" +
        "• 交易所公告：官方公告目录，用于核验产品、维护、规则和地区边界。\n" +
        "• 费率与成本：官方费率说明与成本核验入口。\n" +
        "• 上币与规则变更：上币、下架、交易对和迁移公告核验入口。\n" +
        "• 风险边界：把公告当作证据来源，而不是交易信号。\n\n" +
        `${unknownArgument ? "未识别分类参数；已显示固定目录，参数不会回显或保存。\n\n" : ""}` +
        "也可发送 /resources exchange、/resources fees、/resources listing 或 /resources risk。";
}
function officialResourcesDirectoryMarkup() {
    return {
        inlineKeyboard: [
            [navigationButton("交易所公告", "exchange"), navigationButton("费率与成本", "fees")],
            [navigationButton("上币与规则变更", "listing"), navigationButton("风险边界", "risk")],
            [navigationButton("返回中枢", "hub")],
        ],
    };
}
function officialResourcesCategoryText(category) {
    const labels = {
        exchange: "交易所公告",
        fees: "费率与成本",
        listing: "上币与规则变更",
        risk: "风险边界",
    };
    const records = reviewedResourceCategoryRecords(category);
    const rows = records.map((record, index) => `${index + 1}. ${record.title}\n来源：${record.venue} · ${record.kind}\n区域边界：${record.regionBoundary}\n时效边界：${record.freshnessBoundary}\n说明：${record.summary}`);
    return [
        `官方资料目录 · ${labels[category]}`,
        "只使用本地已审核的一手 Binance / OKX 资料目录；不联网抓取、不按热度排序、不推荐平台、不声称实时，也不保存查询、参数或结果。",
        ...rows,
        "请把这些入口当作资料核验起点，不要当作价格、上币机会或交易建议。",
    ].join("\n\n");
}
function officialResourcesCategoryMarkup(category) {
    const records = reviewedResourceCategoryRecords(category);
    return {
        inlineKeyboard: [
            ...records.map((record) => [button(record.title, record.url)]),
            [navigationButton("返回资料目录", "resources"), navigationButton("返回中枢", "hub")],
        ],
    };
}
function parseOfficialResourceCategory(argument) {
    const normalized = argument?.normalize("NFKC").trim().toLowerCase();
    if (!normalized)
        return { unknownArgument: false };
    const aliases = {
        exchange: "exchange",
        announcements: "exchange",
        announcement: "exchange",
        "交易所": "exchange",
        "公告": "exchange",
        fees: "fees",
        fee: "fees",
        "费率": "fees",
        "费用": "fees",
        "成本": "fees",
        listing: "listing",
        listings: "listing",
        "上币": "listing",
        "下架": "listing",
        risk: "risk",
        risks: "risk",
        "风险": "risk",
        "边界": "risk",
    };
    return aliases[normalized] ? { category: aliases[normalized], unknownArgument: false } : { unknownArgument: true };
}
function reviewedResourceSearchText(query) {
    const result = searchReviewedResources(query);
    const header = "官方资料搜索\n\n只搜索本地受控的一手 Binance / OKX 资料目录；不联网抓取、不搜索群消息、不保存查询，也不输出实时行情、收益预测或投资建议。";
    if (result.kind === "REJECTED") {
        return result.reason === "EMPTY_QUERY"
            ? `${header}\n\n发送示例：/search OKX 上币、/search Binance 费率、/search 地区限制。每次最多返回 5 条结果。`
            : `${header}\n\n查询过长，请缩短到 64 个字符以内。`;
    }
    if (result.results.length === 0) {
        return `${header}\n\n未找到已审核资料记录：${result.normalizedQuery}\n\n当前只覆盖固定 OKX / Binance 官方公告、费率、上币/下架与风险边界资料。没有结果不代表市场不存在，只代表本地审核目录未覆盖。`;
    }
    return [
        header,
        `查询：${result.normalizedQuery}`,
        `结果：${result.results.length} 条（最多 5 条）`,
        ...result.results.map(formatReviewedResourceResult),
    ].join("\n\n");
}
function reviewedResourceSearchMarkup(query) {
    const result = searchReviewedResources(query);
    if (result.kind !== "MATCHES" || result.results.length === 0) {
        return { inlineKeyboard: [[navigationButton("交易所资料", "exchange"), navigationButton("费率资料", "fees")], [navigationButton("上币资料", "listing"), navigationButton("返回中枢", "hub")]] };
    }
    const resourceRows = result.results.map((record) => [button(record.title, record.url)]);
    return { inlineKeyboard: [...resourceRows, [navigationButton("返回中枢", "hub")]] };
}
function reviewedPlatformComparisonMarkup(argument) {
    const links = reviewedPlatformComparisonLinks(argument);
    if (links.length === 0) {
        return { inlineKeyboard: [[navigationButton("搜索官方资料", "search"), navigationButton("返回中枢", "hub")]] };
    }
    return { inlineKeyboard: [...links.map((record) => [button(record.title, record.url)]), [navigationButton("返回中枢", "hub")]] };
}
function privateSourceBoundAnswerResponse(question) {
    const header = "来源问答\n\n只基于本地已审核的一手 Binance / OKX 资料目录回答；不联网抓取、不调用外部模型、不搜索群消息、不保存问题，也不输出实时行情、收益预测、个性化投资建议或交易动作。";
    const plan = planSourceBoundReviewedAnswer(question, "zh");
    if (plan.state !== "ready") {
        return {
            text: `${header}\n\n${plan.answer}`,
            replyMarkup: { inlineKeyboard: [[navigationButton("搜索官方资料", "search"), navigationButton("返回中枢", "hub")]] },
        };
    }
    return {
        text: [header, plan.answer, ...plan.citations.map(formatSourceBoundCitation), "请把这里当作资料核验导航，不要当作买卖建议。"].join("\n\n"),
        replyMarkup: { inlineKeyboard: [...plan.citations.map(({ title, url }) => [button(title, url)]), [navigationButton("返回中枢", "hub")]] },
    };
}
function formatSourceBoundCitation(citation, index) {
    return `${index + 1}. ${citation.title}\n来源：${citation.source}\n${citation.url}\n地区边界：${citation.region}\n时效边界：${citation.freshness}`;
}
function formatReviewedResourceResult(record, index) {
    return `${index + 1}. ${record.title}\n来源：${record.venue} · ${record.kind}\n区域边界：${record.regionBoundary}\n时效边界：${record.freshnessBoundary}\n说明：${record.summary}`;
}
async function groupAdministratorOutcome(adapter, event, command, trackExternalEffect) {
    if (event.isPrivateChat)
        return "GROUP_REQUIRED";
    if (!adapter.isGroupAdministrator || (command === "pulse" && !adapter.sendCommunityPulse))
        return "UNAVAILABLE";
    try {
        // Telegram emits this flag only for a message sent as the same group;
        // ordinary member commands still require a fresh individual rights check.
        if (event.anonymousAdministrator !== true && !await adapter.isGroupAdministrator(event.chatId, event.userId))
            return "ADMIN_REQUIRED";
        if (command === "pulse") {
            // Persist the effect before transport. A recovered process treats any
            // existing record as uncertain rather than risking a duplicate poll.
            if (adapter.claimPublicEffect !== undefined && !await adapter.claimPublicEffect(event, "community_pulse"))
                return "UNAVAILABLE";
            try {
                await trackExternalEffect(() => adapter.sendCommunityPulse({
                    chatId: event.chatId,
                    question: "下周希望社区优先完善哪一类风险教育？",
                    options: ["反诈与账号安全", "交易所规则变更", "费率与资金成本", "上币与合约风险"],
                    ...(event.messageThreadId === undefined ? {} : { messageThreadId: event.messageThreadId }),
                }));
                await adapter.completePublicEffect?.(event, "community_pulse");
            }
            catch (error) {
                try {
                    await adapter.quarantinePublicEffect?.(event, "community_pulse");
                }
                catch { /* retain original failure; later replay remains blocked by in_flight */ }
                throw error;
            }
        }
        return "SENT";
    }
    catch {
        return "UNAVAILABLE";
    }
}
function communityPulseText(outcome, isPrivateChat) {
    if (isPrivateChat || outcome === "GROUP_REQUIRED")
        return { text: "匿名社区脉冲投票只在群内由管理员主动发起。它不收集投票人、答案、个人画像、积分或奖励。", replyMarkup: hubMarkup() };
    if (outcome === "ADMIN_REQUIRED")
        return { text: "仅群管理员可发起匿名社区脉冲投票，避免把群工具变成刷屏入口。机器人不会接收、保存或分析投票人和答案。", replyMarkup: groupNudgeMarkup("打开社区中枢", "hub") };
    if (outcome === "UNAVAILABLE")
        return { text: "当前运行时未能确认投票已发送；为避免重复执行，请管理员先查看群内是否已出现投票，再决定是否重试。", replyMarkup: groupNudgeMarkup("打开社区中枢", "hub") };
    return { text: "已发起匿名社区脉冲投票。机器人不订阅 poll_answer 更新，不保存投票人、答案、个人画像、积分或奖励；结果仅供管理员人工判断下周风险教育重点。", replyMarkup: groupNudgeMarkup("查看本周节奏", "rituals") };
}
function administratorOperationsText(outcome, isPrivateChat, shadowSummary) {
    if (isPrivateChat || outcome === "GROUP_REQUIRED")
        return { text: "NexuAlpha Club 管理员运营入口只在群内由当前管理员主动打开；它不读取成员名单、历史聊天或个人资料。", replyMarkup: hubMarkup() };
    if (outcome === "ADMIN_REQUIRED")
        return { text: "仅当前群管理员可打开运营入口。普通成员不会获得管理员操作信息，机器人也不会记录这次身份核验。", replyMarkup: groupNudgeMarkup("打开社区中枢", "hub") };
    if (outcome === "UNAVAILABLE")
        return { text: "当前运行时不能安全确认管理员身份，因此未展开运营入口。", replyMarkup: groupNudgeMarkup("打开社区中枢", "hub") };
    return { text: `NexuAlpha Club · 管理员运营入口\n\n1. /pulse — 主动发起一次固定、单选的匿名教育优先级投票；不接收或保存投票人、答案、积分或奖励。\n2. /rituals — 查看本周来源审核与人工主持节奏；日历不等于内容已经发布。\n3. /report — 引导成员用消息链接或必要截图举报可疑内容；不要转发助记词、验证码或证件。\n4. /topics — 展示讨论分流地图；不会自动创建话题、群发私信或改动群设置。\n\n${shadowObservationText(shadowSummary)}\n\n边界：自动发布、自动处罚、成员抓取、批量私信和交易建议均已禁用。`, replyMarkup: groupNudgeMarkup("查看本周节奏", "rituals") };
}
/** The group command receives only already-thresholded counters, after live administrator verification. */
function shadowObservationText(summary) {
    if (!summary.snapshotAvailable)
        return "观察摘要：尚未达到 5 条去标识化群消息的聚合展示门槛；不会展示单条消息或个人信息。";
    if (summary.attentionSignalCount === null)
        return `观察摘要：${summary.activeDays} 个 UTC 日累计 ${summary.observedMessageCount} 条群消息；复核信号未达到展示门槛。`;
    const categories = summary.reportedCategories.length === 0 ? "类别未达到展示门槛" : summary.reportedCategories.map(({ category, count }) => `${shadowCategoryLabel(category)} ${count}`).join("；");
    return `观察摘要：${summary.activeDays} 个 UTC 日累计 ${summary.observedMessageCount} 条群消息；需人工复核信号 ${summary.attentionSignalCount} 条。类别：${categories}。`;
}
function shadowCategoryLabel(category) {
    return ({ "suspicious-domain": "可疑域名", "unicode-confusable-domain": "仿冒域名", flood: "高频发送", "mass-mention": "批量提及", duplicate: "重复内容", "fake-admin-solicitation": "冒充管理索引" })[category];
}
function reportGuidance(argument) {
    if (argument === "prepare")
        return "举报准备清单：保留原消息链接或必要截图，并简要说明可疑原因。不要把助记词、私钥、验证码、身份证件或账户余额发送给机器人。此按钮不会提交、保存或转发任何材料。";
    if (argument === "protect")
        return "先保护自己：不要点私信链接、连接钱包、转账或给验证码；通过频道官方入口独立核验。此按钮不会访问链接、检查账户或联系任何成员。";
    if (argument === "after")
        return "提交后：管理员只做人工复核；不会自动删帖、禁言、曝光举报人或承诺处理时限。紧急资产风险请优先联系相关平台官方安全渠道。";
    return "举报安全中枢：可先了解准备材料、自我保护和人工复核边界。机器人不会通过此入口收集你的消息、链接、截图、身份或账户信息。";
}
function subscriptionText(outcome, argument) {
    const topic = argument?.trim().toLowerCase() || "该主题";
    if (outcome?.kind !== "subscription")
        return "订阅服务当前不可用，未保存任何偏好。";
    switch (outcome.result) {
        case "SUBSCRIBED": return `已订阅 ${topic}。这只是主题偏好，用于你主动查询和未来内容分组；不会自动发送私信。若你以后希望接收私聊投递，必须另行发送 /delivery_consent on ${topic}。`;
        case "UNSUBSCRIBED": return `已取消 ${topic} 订阅。以后可随时重新使用 /subscribe ${topic}。`;
        case "UNSUBSCRIBED_ALL": return "已取消全部主题订阅。此操作幂等：重复发送不会恢复或新增任何订阅；已保存的行情关注不受影响。";
        case "START_REQUIRED": return "请先发送 /start 建立私聊同意，再选择订阅主题。";
        case "TOPIC_REQUIRED": return "请指定主题，例如 /subscribe brief 或 /subscribe alerts。";
        case "UNKNOWN_TOPIC": return "未知主题。可选：brief、alerts、listing、risk、exchange。";
        case "PRIVATE_CHAT_REQUIRED": return "订阅仅限私聊机器人，以避免在群内保存偏好。";
        default: return "订阅服务当前不可用，未保存任何偏好。";
    }
}
function deliveryConsentText(outcome, argument) {
    const values = argument?.trim().toLowerCase().split(/[\s,，]+/u).filter(Boolean) ?? [];
    const topic = values[0] === "on" || values[0] === "off" || values[0] === "yes" || values[0] === "no" || values[0] === "开启" || values[0] === "关闭" || values[0] === "同意" || values[0] === "撤回"
        ? values[1] ?? "该主题"
        : values[0] ?? "该主题";
    if (outcome?.kind !== "delivery_consent")
        return "私聊投递同意服务当前不可用，未保存任何投递同意。";
    switch (outcome.result) {
        case "DELIVERY_CONSENT_ENABLED":
            return `已单独开启 ${topic} 的私聊投递同意。\n\n频率：每个主题同一成员最多 360 分钟一次；重复内容不会重复发送。\n静默时段：当前未设置固定静默窗口；如果之后配置静默时段，系统会延后到窗口结束后再尝试。\n退出：发送 /delivery_consent off ${topic}、/unsubscribe ${topic}、/unsubscribe all 或 /delete_my_data 都会撤回待投递计划。\n\n仍然只允许已审核、人工授权、通过投递门槛的内容进入本地计划；当前没有启用真实 Telegram 自动投递。`;
        case "DELIVERY_CONSENT_DISABLED": return `已撤回 ${topic} 的私聊投递同意，并撤销该主题未完成的待投递计划。主题偏好可用 /unsubscribe ${topic} 单独取消。`;
        case "START_REQUIRED": return `请先发送 /start，再用 /subscribe ${topic} 建立主题偏好，最后再单独发送 /delivery_consent on ${topic}。`;
        case "ACTION_REQUIRED": return "请明确 on 或 off，例如 /delivery_consent on alerts 或 /delivery_consent off alerts。";
        case "TOPIC_REQUIRED": return "请指定主题，例如 /delivery_consent on alerts。";
        case "UNKNOWN_TOPIC": return "未知主题。可选：brief、alerts、listing、risk、exchange。";
        case "PRIVATE_CHAT_REQUIRED": return "私聊投递同意只能在私聊机器人里设置。";
        default: return "私聊投递同意服务当前不可用，未保存任何投递同意。";
    }
}
function localeText(outcome) {
    if (outcome?.kind !== "locale")
        return "语言偏好服务当前不可用，未保存任何设置。";
    switch (outcome.result) {
        case "LOCALE_CURRENT": return `当前语言：${outcome.locale ?? "en"}。支持的语言：en、zh-Hans、zh-Hant、ja、ko、tr、es、pt-BR、id。`;
        case "LOCALE_UPDATED": return `语言已设置为 ${outcome.locale ?? "en"}。发送 /settings 可查看当前保存的语言、主题偏好、行情关注和明确私聊投递同意。`;
        case "START_REQUIRED": return "请先发送 /start 建立私聊记录，再设置语言。";
        case "PRIVATE_CHAT_REQUIRED": return "语言设置仅限私聊机器人。";
        case "UNSUPPORTED_LOCALE": return "支持的语言：en、zh-Hans、zh-Hant、ja、ko、tr、es、pt-BR、id。";
        default: return "语言偏好服务当前不可用，未保存任何设置。";
    }
}
function deliveryConsentControlText(outcome) {
    if (outcome?.kind !== "preferences" || outcome.topics === undefined || outcome.deliveryConsentTopics === undefined) {
        return "订阅/提醒同意控制台\n\n偏好服务当前不可用，无法确认你的主题偏好或明确提醒同意；本次请求没有开启、撤回或修改任何授权。\n\n主题偏好：发送 /subscribe <brief|alerts|listing|risk|exchange> 只保存你主动选择的内容方向，不会自动私信。\n明确提醒同意：发送 /delivery_consent on alerts 才会为该主题单独开启私聊投递同意；发送 /delivery_consent off alerts 可随时撤回。\n\n频率：每个主题同一成员最多 360 分钟一次；重复内容不会重复发送。\n静默时段：如配置静默窗口，系统会延后到窗口结束后再尝试。\n退出：/delivery_consent off <主题>、/unsubscribe <主题>、/unsubscribe all 或 /delete_my_data 都会撤回待投递计划。\n\n当前真实 Telegram 自动投递仍未启用；这里不会新增隐式同意，也不会把服务不可用误报成无授权。";
    }
    const topics = outcome.topics.length === 0 ? "未保存主题偏好" : outcome.topics.join("、");
    const delivery = outcome.deliveryConsentTopics.length === 0 ? "未开启任何明确提醒同意" : outcome.deliveryConsentTopics.join("、");
    return "订阅/提醒同意控制台\n\n" +
        `主题偏好：${topics}。\n` +
        `当前明确提醒同意：${delivery}。\n\n` +
        "可用命令：\n" +
        "• /subscribe alerts — 只保存主题偏好，不会自动发送私信\n" +
        "• /delivery_consent on alerts — 单独开启该主题的私聊投递同意\n" +
        "• /delivery_consent off alerts — 撤回该主题的私聊投递同意\n" +
        "• /unsubscribe all 或 /delete_my_data — 退出并撤销待投递计划\n\n" +
        "频率：每个主题同一成员最多 360 分钟一次；重复内容不会重复发送。\n" +
        "静默时段：如配置静默窗口，系统会延后到窗口结束后再尝试。\n" +
        "当前真实 Telegram 自动投递仍未启用；这里不会新增隐式同意，也不会把旧 /subscribe 当作投递授权。";
}
function deletionText(outcome) {
    if (outcome?.kind !== "deletion")
        return "当前没有找到可删除的持久化偏好。";
    switch (outcome.result) {
        case "DELETION_REQUEST_ACCEPTED": return "已删除你保存的订阅偏好和对应的最小成员记录。此操作不会影响 Telegram 账号或聊天记录。";
        case "DIRECT_MESSAGE_REQUIRED": return "删除请求只能在私聊机器人中提交。";
        default: return "当前没有找到可删除的持久化偏好。";
    }
}
function preferenceSettingsText(outcome) {
    if (outcome?.kind !== "preferences" || outcome.topics === undefined || outcome.marketAssets === undefined || outcome.deliveryConsentTopics === undefined || outcome.locale === undefined)
        return "偏好服务当前不可用，未读取或修改任何订阅。";
    const topics = outcome.topics.length === 0 ? "当前没有保存的主题订阅。" : `当前订阅：${outcome.topics.join("、")}。`;
    const delivery = outcome.deliveryConsentTopics.length === 0 ? "当前没有开启明确私聊提醒同意。" : `明确提醒同意：${outcome.deliveryConsentTopics.join("、")}。`;
    const watch = outcome.marketAssets.length === 0 ? "行情默认显示 BTC、ETH、SOL。" : `行情关注：${outcome.marketAssets.join("、")}；/market 仅在你主动查询时优先显示它们。`;
    return `你的私聊偏好\n\n语言：${outcome.locale}。\n${topics}\n${delivery}\n${watch}\n\n系统只保存：语言、主题偏好、行情关注和明确私聊投递同意；普通导航、风险演练答案和一次性问答不会保存为偏好。\n\n使用 /language ja 或 /locale pt-BR 设置语言。使用 /watch BTC ETH SOL 设置行情关注，/unwatch BTC 撤回单个关注，/unwatch BTC ETH SOL 清空。使用 /subscribe <主题> 添加主题偏好，/unsubscribe <主题> 撤回一个主题，/unsubscribe all、STOP、停止或退订取消全部主题订阅。\n\n这些偏好本身不会自动发送私信或定时投递。私聊投递必须另行使用 /delivery_consent on <主题> 明确开启；你可随时用 /delivery_consent off <主题>、/unsubscribe 或 /delete_my_data 退出。`;
}
function marketWatchText(outcome) {
    if (outcome?.kind !== "market_watch")
        return "行情关注偏好当前不可用，未保存任何设置。";
    switch (outcome.result) {
        case "WATCH_UPDATED": return "已更新行情关注。下次你主动发送 /market 时，将优先显示你选择的 BTC、ETH 或 SOL；不会因此自动发送提醒。";
        case "WATCH_CLEARED": return "已清空行情关注。下次主动发送 /market 时会显示默认 BTC、ETH、SOL；不会自动发送提醒。";
        case "ASSET_REQUIRED": return "请指定 BTC、ETH 或 SOL，例如 /watch BTC ETH。";
        case "UNKNOWN_ASSET": return "仅支持 BTC、ETH、SOL；未保存任何关注偏好。";
        case "PRIVATE_CHAT_REQUIRED": return "行情关注仅限私聊机器人，以避免在群内保存偏好。";
        case "START_REQUIRED": return "请先私聊发送 /start，再设置行情关注。";
        default: return "行情关注偏好当前不可用，未保存任何设置。";
    }
}
function renderPersonalMarketPulse(pulse, now, assets) {
    if (!assets || assets.length === 0)
        return renderMarketPulse(pulse, now);
    return `${renderMarketPulse(pulse, now, assets)}\n\n仅显示你主动设置的关注：${assets.join("、")}。此查询不会建立推送或交易指令。`;
}
/** A private, request-time route. It reads only the member's existing explicit topics and never records completion. */
function todayPathText(now, outcome) {
    const topics = outcome?.kind === "preferences" ? outcome.topics ?? [] : [];
    const monday = mondayOf(now);
    const today = now.toISOString().slice(0, 10);
    const rituals = weeklyCommunityRituals(monday).filter((ritual) => ritual.startsAt.toISOString().slice(0, 10) === today);
    const topicLine = topics.length === 0
        ? "你还没有保存主题偏好：可先用 /subscribe <brief|alerts|listing|risk|exchange> 主动选择。"
        : `你已主动选择的主题：${topics.join("、")}。本路径只在本次请求中读取这些偏好。`;
    const ritualLine = rituals.length === 0
        ? "今天没有固定仪式；可查看 /rituals 了解本周节奏。"
        : rituals.map((ritual) => `• ${formatUtcTime(ritual.startsAt)} ${ritual.title} — ${ritual.sourceRequired ? "待来源审核" : "人工主持"}`).join("\n");
    return "今日参与路径（UTC）\n\n" +
        `${topicLine}\n\n` +
        `今日节奏：\n${ritualLine}\n\n` +
        "建议顺序：先查看已审核入口，再完成一项风险学习；如果遇到可疑私信或链接，使用 /scenario 或 /checklink。\n\n" +
        "本路径不记录完成状态、不计分、不排行、不推送私信，也不构成投资或交易建议。";
}
export function interactionReviewText(now, receipts = []) {
    const poll = latestReceipt(receipts, "discussion_poll");
    const fallbackAnchor = poll ?? latestReceipt(receipts, "closed_recap") ?? latestReceipt(receipts, "market_card");
    const market = latestReceipt(receipts, "market_card", fallbackAnchor?.episodeId);
    const recap = latestReceipt(receipts, "closed_recap", fallbackAnchor?.episodeId);
    const otherEpisodeRecap = poll && !recap ? latestReceipt(receipts, "closed_recap") : undefined;
    const lines = [
        "互动/复盘状态",
        "",
        `市场卡片：${receiptStatusLine(market, "已发送", "等待公开市场卡片回执")}`,
        `讨论投票：${discussionPollStatusLine(now, poll, recap)}`,
        `收盘复盘：${recapStatusLine(recap, otherEpisodeRecap, poll)}`,
        "",
        "这张卡只读取既有公开回执状态，不会发起新投票、不会改写历史公共内容，也不会触发任何 Telegram 投递。",
    ];
    if (!market && !poll && !recap) {
        lines.splice(2, 3, "市场卡片：暂未读到公开回执", "讨论投票：暂未读到公开回执", "收盘复盘：暂未读到公开回执");
        lines.push("", "旧 /rituals 周节奏模板仍保留兼容；新版主导航优先展示真实闭环状态。");
    }
    return lines.join("\n");
}
function latestReceipt(receipts, artifact, episodeId) {
    return receipts
        .filter((receipt) => receipt.artifact === artifact && (episodeId === undefined || receipt.episodeId === episodeId) && validIsoDate(receipt.occurredAt))
        .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())[0];
}
function receiptStatusLine(receipt, successLabel, missingLabel) {
    if (!receipt)
        return missingLabel;
    const at = formatLocalDateTime(new Date(receipt.occurredAt));
    if (receipt.state === "sent" || receipt.state === "closed" || receipt.state === "completed")
        return `${successLabel}（${at}）`;
    return `${publicReceiptStateLabel(receipt.state)}（${at}）`;
}
function recapStatusLine(recap, otherEpisodeRecap, poll) {
    if (recap && poll?.state === "close_unknown")
        return `发现当前轮次复盘回执（${formatLocalDateTime(new Date(recap.occurredAt))}），但讨论投票关闭状态不确定；等待人工核验`;
    if (recap && poll && poll.state !== "closed" && poll.state !== "completed")
        return `发现当前轮次复盘回执（${formatLocalDateTime(new Date(recap.occurredAt))}），但等待投票关闭回执确认`;
    if (recap)
        return receiptStatusLine(recap, "已完成", "等待 24h 讨论窗口结束后的复盘回执");
    if (otherEpisodeRecap)
        return `发现其它轮次复盘回执（${formatLocalDateTime(new Date(otherEpisodeRecap.occurredAt))}），不用于当前投票闭环；等待当前轮次复盘回执`;
    return "等待 24h 讨论窗口结束后的复盘回执";
}
function discussionPollStatusLine(now, poll, recap) {
    if (!poll)
        return "等待公开讨论投票回执";
    const occurredAt = new Date(poll.occurredAt);
    const elapsedMs = Math.max(0, now.getTime() - occurredAt.getTime());
    const windowMs = 24 * 60 * 60_000;
    if (poll.state === "close_unknown")
        return `关闭状态不确定，需人工确认；不会重发投票（${formatLocalDateTime(occurredAt)}）`;
    if (recap && (recap.state === "sent" || recap.state === "completed") && (poll.state === "closed" || poll.state === "completed"))
        return `已闭环，复盘回执已记录（${formatLocalDateTime(new Date(recap.occurredAt))}）`;
    if (poll.state === "closed" || poll.state === "completed")
        return `已关闭，等待复盘回执确认（${formatLocalDateTime(occurredAt)}）`;
    if (poll.state === "sent" && elapsedMs < windowMs) {
        return `观察中，已观察 ${durationText(elapsedMs)} / 24h，还需 ${durationText(windowMs - elapsedMs)}；不发新投票（${formatLocalDateTime(occurredAt)}）`;
    }
    if (poll.state === "sent")
        return `已满 24h，等待关闭/复盘回执或人工确认；不重发投票（${formatLocalDateTime(occurredAt)}）`;
    return `${publicReceiptStateLabel(poll.state)}（${formatLocalDateTime(occurredAt)}）`;
}
function publicReceiptStateLabel(state) {
    switch (state) {
        case "pending": return "等待发送回执";
        case "sent": return "已发送";
        case "closed": return "已关闭";
        case "completed": return "已完成";
        case "close_unknown": return "关闭状态不确定";
        case "send_uncertain": return "发送结果不确定，需人工核验";
        case "failed": return "失败";
        case "cancelled": return "已取消";
    }
}
function durationText(ms) {
    const minutes = Math.max(0, Math.floor(ms / 60_000));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes.toString().padStart(2, "0")}m`;
}
function validIsoDate(value) {
    return Number.isFinite(new Date(value).valueOf());
}
function formatLocalDateTime(value) {
    return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Shanghai" }).format(value);
}
function memberFailureOutcome(command) {
    if (command === "delete_my_data")
        return { kind: "deletion", result: "USER_NOT_FOUND" };
    if (command === "settings" || command === "topics" || command === "today" || command === "market")
        return { kind: "preferences" };
    if (command === "delivery_consent")
        return { kind: "delivery_consent", result: "UNAVAILABLE" };
    if (command === "watch" || command === "unwatch")
        return { kind: "market_watch", result: "UNAVAILABLE" };
    if (command === "language")
        return { kind: "locale", result: "UNAVAILABLE" };
    return { kind: "subscription", result: "UNAVAILABLE" };
}
function privateStopCommand(event) {
    if (!event.isPrivateChat)
        return undefined;
    if (/^(?:stop|停止|退订|退订全部)$/iu.test(event.text.trim()))
        return { command: "unsubscribe", argument: "all" };
    return undefined;
}
function logMemberControlFailure(command, error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.warn(JSON.stringify({ service: "telegram-community-bot", event: "member_control_failed", command, errorName }));
}
function privateHubText(argument) {
    if (argument === "community")
        return communityMapText("private");
    if (argument === "topics") {
        return communityTopicGuideText("private");
    }
    if (argument === "brief") {
        return "欢迎来到 NexuAlpha 今日简报。\n\n这里优先沉淀币圈重大新闻、交易所动态、宏观与链上治理变化。每条内容都要能回到原文、原文日期和讨论问题；不会用内部计数冒充市场信息。";
    }
    if (argument === "market") {
        return "欢迎来到 NexuAlpha 行情脉冲。\n\n这里显示已落地行情快照：价格、24h 变化、成交额、观察时间和来源分开展示。缺失数据不会写成 0，也不会主动私信。";
    }
    return "NexuAlpha 私聊操作台\n\n" +
        "优先入口已经收敛到真正能用的几件事：\n" +
        "• 行情：查看来源标记的市场脉冲，并用 /watch 管理 BTC/ETH/SOL 关注\n" +
        "• 订阅/提醒：/subscribe 只保存主题偏好；/delivery_consent on/off 才是明确私聊提醒同意\n" +
        "• 互动/复盘：看本周节奏、新闻简报、官方资料，并进入群聊讨论\n" +
        "• 隐私退出：查看数据边界，随时 /delete_my_data 删除最小记录\n\n" +
        "旧 /quests、/today、/perks、/invite 继续兼容，但不放在新版主导航里。";
}
/** Maps only fixed Telegram deep-link payloads to contextual onboarding; it records and echoes no campaign data. */
function startEntryText(argument) {
    if (!isEntryRoute(argument))
        return privateHubText(argument);
    const context = {
        channel: "你从频道官方入口进入。先看行情脉搏，再进入讨论区围绕来源和事件交换看法。",
        group: "你从社区讨论入口进入。先看行情脉搏，再按关注主题选择讨论方向。",
        story: "你从 Telegram Story 入口进入。Story 只用于发现，不构成收益承诺或即时交易提示。",
        website: "你从官网入口进入。请继续核验当前页面、地区可用性和风险说明，不要把跳转本身当作安全认证。",
    };
    return `NexuAlpha 加密市场情报与研究讨论\n\n${context[argument]}\n\n优先路线：看行情、管理关注、订阅/明确提醒同意、参与互动复盘、确认隐私退出方式。旧每日任务、会员权益和邀请入口仍兼容，但不占新版主导航；不会记录来源、创建个人画像、自动发送私信或给出交易建议。`;
}
function isEntryRoute(value) {
    return value === "channel" || value === "group" || value === "story" || value === "website";
}
function entryRouteMarkup() {
    return {
        inlineKeyboard: [
            [navigationButton("🎁 注册交易所 · 邀请码", "signup")],
            [navigationButton("🔔 行情告警订阅（爆仓/急涨急跌）", "alerts")],
            [navigationButton("📈 行情脉冲", "market"), navigationButton("👀 管理关注", "settings")],
            [navigationButton("🔔 订阅/提醒同意", "topics"), navigationButton("🔁 互动/复盘", "rituals")],
            [button("💬 进入群聊", `https://t.me/${groupUsername}`), navigationButton("🛡 隐私退出", "privacy")],
            [navigationButton("进入社区中枢", "hub")],
        ],
    };
}
function hubMarkup() {
    return {
        inlineKeyboard: [
            [navigationButton("🎁 注册交易所 · 邀请码", "signup")],
            [navigationButton("🔔 行情告警订阅（爆仓/急涨急跌）", "alerts")],
            [
                navigationButton("📈 行情脉冲", "market"),
                navigationButton("👀 管理关注", "settings"),
            ],
            [
                navigationButton("🔔 订阅/提醒同意", "topics"),
                navigationButton("🔁 互动/复盘", "rituals"),
            ],
            [
                navigationButton("🧾 官方资料", "resources"),
                navigationButton("🛡 隐私退出", "privacy"),
            ],
            [
                button("📣 频道", `https://t.me/${channelUsername}`),
                button("💬 群聊", `https://t.me/${groupUsername}`),
            ],
        ],
    };
}
/** Fixed native Community directory; it creates no invite, membership, or tracking action. */
function communityMapText(surface) {
    const prefix = surface === "private" ? "NexuAlpha Community 地图" : "NexuAlpha Community 群内地图";
    return `${prefix}\n\n` +
        "📣 NexuAlpha（@NexuAlphaClub）：公开信息、人工审核后的更新与风险教育。\n" +
        "💬 NexuAlpha Club（@NexuAlphaWorld）：隐藏讨论聊天；仅已加入成员与 Community 管理员可见。\n\n" +
        "Community 不替代频道既有讨论关联，也不自动加入成员、创建话题、记录访问、发送私信或提供交易建议。请仅从频道置顶和已核验入口核对身份与链接。";
}
function communityMapMarkup() {
    return {
        inlineKeyboard: [
            [button("📣 打开 NexuAlpha", `https://t.me/${channelUsername}`), button("💬 打开 NexuAlpha Club", `https://t.me/${groupUsername}`)],
            [navigationButton("返回社区中枢", "hub")],
        ],
    };
}
function supportDeskTriageMarkup() {
    return {
        inlineKeyboard: [
            supportDeskTriageOptions.slice(0, 2).map(({ label, callbackData }) => callbackButton(label, callbackData)),
            supportDeskTriageOptions.slice(2, 4).map(({ label, callbackData }) => callbackButton(label, callbackData)),
            supportDeskTriageOptions.slice(4).map(({ label, callbackData }) => callbackButton(label, callbackData)),
        ],
    };
}
/** Inline articles can travel only after a member selects them; this markup has no callback, tracking, or share target. */
function inlineCommunityMarkup() {
    return {
        inlineKeyboard: [[
                button("📣 NexuAlpha 官方频道", `https://t.me/${channelUsername}`),
                button("💬 NexuAlpha Club 讨论", `https://t.me/${groupUsername}`),
            ]],
    };
}
/** Fixed official-resource links for Inline cards; no callbacks or analytics are attached. */
function inlineOfficialResourceMarkup(topic) {
    return officialResourceMarkup(topic);
}
/** Telegram's native share chooser; it creates no referral token, attribution, or recipient record. */
function inviteMarkup() {
    const channelUrl = `https://t.me/${channelUsername}`;
    const shareUrl = new URL("https://t.me/share/url");
    shareUrl.searchParams.set("url", channelUrl);
    shareUrl.searchParams.set("text", "NexuAlpha：已核验信息、风险教育与社区更新。请独立判断风险。 ");
    return {
        inlineKeyboard: [
            [button("↗ 选择聊天并分享", shareUrl.toString())],
            [button("📣 打开官方频道", channelUrl), button("💬 打开社区讨论", `https://t.me/${groupUsername}`)],
            [navigationButton("返回中枢", "hub")],
        ],
    };
}
function riskMarkup() {
    return {
        inlineKeyboard: [
            [navigationButton("🧠 风险情景演练", "scenario"), navigationButton("🔎 链接核验", "checklink")],
            [navigationButton("返回中枢", "hub")],
        ],
    };
}
function reportMarkup() {
    return { inlineKeyboard: [[callbackButton("准备什么材料", "report:prepare"), callbackButton("先保护自己", "report:protect")], [callbackButton("提交后会怎样", "report:after")], [navigationButton("返回中枢", "hub")]] };
}
function supportResponse(argument, isPrivateChat) {
    if (!isPrivateChat) {
        return {
            text: "自助支持只在 Bot 私聊中显示。请私聊机器人后发送 /support；群内不会处理或保存参数，不会创建私信同意、主动联系成员、转发内容、创建 case、发布/管理内容或提供交易建议。",
        };
    }
    const category = argument === undefined ? undefined : parseSupportBotTriageCallbackData(`support:${argument.trim().toLowerCase()}`);
    if (category) {
        const guidance = supportDeskGuidanceFor(category);
        return {
            text: guidance.text,
            ...(guidance.includeCommunityLinks ? { replyMarkup: inlineCommunityMarkup() } : {}),
        };
    }
    return { text: supportBotSelfServiceText(), replyMarkup: supportBotTriageMarkup() };
}
function supportBotTriageMarkup() {
    return {
        inlineKeyboard: [
            supportBotTriageOptions.slice(0, 2).map(({ label, callbackData }) => callbackButton(label, callbackData)),
            supportBotTriageOptions.slice(2, 4).map(({ label, callbackData }) => callbackButton(label, callbackData)),
            supportBotTriageOptions.slice(4).map(({ label, callbackData }) => callbackButton(label, callbackData)),
        ],
    };
}
function feedbackResponse(argument, isPrivateChat) {
    if (!isPrivateChat) {
        return {
            text: "匿名反馈只在 Bot 私聊中提交。请私聊机器人后发送 /feedback；群内不会处理或保存参数，不会创建私信同意、主动联系成员、转发内容、创建 case、发布/管理内容或提供交易建议。",
            replyMarkup: groupNudgeMarkup("打开匿名反馈", "feedback"),
        };
    }
    const category = parseCommunityFeedbackCategory(argument);
    if (category)
        return { text: feedbackReceiptText(category), replyMarkup: feedbackAfterSubmitMarkup() };
    return { text: feedbackMenuText(), replyMarkup: feedbackMarkup() };
}
function feedbackMenuText() {
    return [
        "NexuAlpha 匿名反馈",
        "",
        "请选择一个固定反馈方向。机器人不会读取、保存或转发你的正文，也不会记录用户、聊天、消息、按钮 ID、自由文本、来源链接、设备、画像、积分或奖励。",
        "",
        "系统只会按 UTC 日期和固定分类增加一个聚合计数；低于聚合阈值不会展示给运营台。",
    ].join("\n");
}
function feedbackReceiptText(category) {
    const labels = {
        useful: "有用",
        unclear: "没看懂",
        source_gap: "来源不足",
        more_topics: "希望增加主题",
        too_noisy: "信息太多",
    };
    return `反馈已收到：${labels[category]}\n\n仅写入 UTC 日期与固定分类聚合计数；不会保存用户、聊天、消息、按钮 ID、自由文本、链接、设备、画像、积分或奖励。感谢你帮我们把社区打磨得更清楚。`;
}
function feedbackMarkup() {
    const labels = {
        useful: "有用",
        unclear: "没看懂",
        source_gap: "来源不足",
        more_topics: "希望增加主题",
        too_noisy: "信息太多",
    };
    return {
        inlineKeyboard: [
            ...chunk(communityFeedbackCategories.map((category) => callbackButton(labels[category], `feedback:${category}`)), 2),
            [navigationButton("返回中枢", "hub")],
        ],
    };
}
function feedbackAfterSubmitMarkup() {
    return { inlineKeyboard: [[navigationButton("返回中枢", "hub"), navigationButton("继续反馈", "feedback")]] };
}
function scenarioMarkup(argument) {
    if (!argument) {
        return {
            inlineKeyboard: [
                [callbackButton("🧑‍💼 冒充客服", "scenario:support"), callbackButton("👛 钱包授权", "scenario:wallet")],
                [callbackButton("▣ 二维码钓鱼", "scenario:qr")],
                [navigationButton("返回风险教育", "risk")],
            ],
        };
    }
    if (argument === "support")
        return { inlineKeyboard: [[callbackButton("A. 先核验官方入口", "scenario:verify")], [callbackButton("B. 立即按私信转账", "scenario:transfer")], [callbackButton("C. 发送验证码求确认", "scenario:code")], [navigationButton("选择其他演练", "scenario")]] };
    if (argument === "wallet")
        return { inlineKeyboard: [[callbackButton("A. 先断开并核验授权", "scenario:wallet_disconnect")], [callbackButton("B. 立即签名领取", "scenario:wallet_sign")], [callbackButton("C. 输入助记词恢复", "scenario:wallet_seed")], [navigationButton("选择其他演练", "scenario")]] };
    if (argument === "qr")
        return { inlineKeyboard: [[callbackButton("A. 先查看来源与域名", "scenario:qr_preview")], [callbackButton("B. 扫码后立刻登录", "scenario:qr_scan")], [callbackButton("C. 导入二维码私钥", "scenario:qr_import")], [navigationButton("选择其他演练", "scenario")]] };
    return { inlineKeyboard: [[navigationButton("再做一次演练", "scenario")], [navigationButton("返回风险教育", "risk")]] };
}
function linkCheckText(argument) {
    const result = checkCommunityLink(argument);
    switch (result.kind) {
        case "OFFICIAL_DOMAIN_MATCH":
            return `域名匹配受控官方候选：${result.host}\n\n这只说明域名与本地清单一致，不代表页面内容、活动、地区可用性或资金安全已获审核。请继续核验具体页面与风险提示。`;
        case "LOOKALIKE_RISK":
            return `高风险仿冒提示：${result.host} 包含交易所品牌词，却不在受控官方域名清单中。机器人没有访问或保存该链接。不要登录、连接钱包、转账或提交验证码；请通过频道官方入口人工核验。`;
        case "UNVERIFIED":
            return `未验证域名：${result.host}\n\n机器人没有访问此链接，也不会把它保存或认定为安全。不要根据此结果进行登录、转账或交易；需要时请提交给管理员人工复核。`;
        case "REJECTED":
            return linkCheckRejectionText(result.reason);
    }
}
function scenarioText(argument) {
    switch (argument?.trim().toLowerCase()) {
        case "support":
            return "风险微课程 · 冒充客服\n\n你收到一条消息：\n“账户异常，点击链接并在 10 分钟内转账验证，否则限制提现。”\n\n你第一步会怎么做？\n\n这是学习工具，不是投资建议；机器人不会记录你的选择、给分、排行、发送私信或触发任何交易。";
        case "wallet":
            return "风险微课程 · 钱包授权\n\n你看到“空投补偿”页面，要求连接钱包并签名以领取奖励。\n\n你第一步会怎么做？\n\n这是学习工具，不访问钱包、不读取地址、不记录选择、不发放奖励，也不触发交易。";
        case "qr":
            return "风险微课程 · 二维码钓鱼\n\n陌生人发来“官方客服二维码”，称扫码可解除风控。\n\n你第一步会怎么做？\n\n这是学习工具，不读取二维码、不访问链接、不记录选择，也不代表任何平台的官方支持。";
        case "verify":
            return "演练结果：先核验官方入口是正确的第一步。\n\n不要使用私信提供的链接；从频道官方入口进入，再核对域名、地区、公告时间和风险提示。需要时可用 /checklink 检查域名，但它不等于页面安全认证。\n\n本演练不记录答案、不计分、不建立画像。";
        case "transfer":
            return "演练结果：不要因私信催促而转账。\n\n诈骗常利用限时、客服、补偿或错过机会制造压力。停止操作，独立从官方入口核验；如果已经转账，请保存必要凭证并联系平台官方支持。\n\n本演练不记录答案、不计分、不建立画像。";
        case "code":
            return "演练结果：绝不要发送验证码、助记词、私钥或登录二维码。\n\n官方人员不会在私信中索取这些信息。关闭可疑对话，通过官方应用或官网自行发起支持请求。\n\n本演练不记录答案、不计分、不建立画像。";
        case "wallet_disconnect":
            return "演练结果：先停止签名、断开可疑站点，再独立核验官方活动页和已授予的权限。\n\n不要把“免费领取”当作安全证明；任何批准、签名或授权都可能产生资产风险。必要时使用钱包自身的授权管理功能，并向平台官方渠道求证。\n\n本演练不读取钱包、不记录答案、不计分、不建立画像。";
        case "wallet_sign":
            return "演练结果：不要因为奖励、倒计时或客服催促而立即签名。\n\n先关闭页面，独立从官方入口确认活动，并理解签名或授权的具体后果。无法确认时不要连接钱包或批准交易。\n\n本演练不读取钱包、不记录答案、不计分、不建立画像。";
        case "wallet_seed":
            return "演练结果：绝不要在网页、机器人、私聊或二维码中输入助记词、私钥或恢复短语。\n\n任何索要恢复信息的页面都应视为高风险。请关闭页面，使用你已知的官方应用或硬件钱包流程自行检查账户。\n\n本演练不读取钱包、不记录答案、不计分、不建立画像。";
        case "qr_preview":
            return "演练结果：先停下并核验二维码的来源、展示的完整域名和官方公告。\n\n二维码只是载体，不代表安全；不要因为头像、群名或“客服”身份就扫码登录、连接钱包或授权。\n\n本演练不读取二维码、不记录答案、不计分、不建立画像。";
        case "qr_scan":
            return "演练结果：不要按陌生二维码立即登录或解除风控。\n\n关闭对话，从官方应用或频道已核验入口独立进入支持流程。不要通过私信链接、扫码页或远程协助交出登录权限。\n\n本演练不读取二维码、不记录答案、不计分、不建立画像。";
        case "qr_import":
            return "演练结果：绝不要把私钥、助记词、恢复短语或登录二维码导入陌生页面。\n\n这些凭据一旦泄露可能无法撤回。停止操作，使用可信设备和已知官方路径自行检查账户安全。\n\n本演练不读取二维码、不记录答案、不计分、不建立画像。";
        default:
            return "风险微课程\n\n选择一个固定场景，学习识别冒充客服、钱包授权与二维码钓鱼。\n\n这是学习工具，不是投资建议；机器人不会记录你的选择、给分、排行、发送私信或触发任何交易。";
    }
}
function safetyQuiz(event) { return { chatId: event.chatId, question: "收到“客服”私信要求立刻转账核验账户，第一步应该做什么？", options: ["从频道官方入口独立核验", "按私信链接转账", "发送验证码给对方"], correctOptionId: 0, explanation: "不要使用私信链接或发送验证码。通过频道官方入口独立核验；本匿名测验不记录参与者或答案。", ...(event.messageThreadId === undefined ? {} : { messageThreadId: event.messageThreadId }) }; }
function linkCheckRejectionText(reason) {
    switch (reason) {
        case "HTTPS_REQUIRED": return "仅接受完整 HTTPS 链接；HTTP 链接不会被核验。";
        case "CREDENTIALS_FORBIDDEN": return "链接含有用户名或密码字段，属于高风险格式，未被核验。";
        case "IP_ADDRESS_FORBIDDEN": return "链接直接使用 IP 地址，属于高风险格式，未被核验。";
        default: return "请使用完整链接，例如 /checklink https://www.binance.com/。机器人不会访问或保存该链接。";
    }
}
function topicsMarkup() {
    return {
        inlineKeyboard: [
            ...chunk(topicCatalog.map((topic) => navigationButton(topic.label, topic.route)), 2),
            [
                navigationButton("每日任务", "quests"),
            ],
            [
                navigationButton("会员权益", "perks"),
            ],
            [
                navigationButton("返回中枢", "hub"),
            ],
        ],
    };
}
function marketMarkup() {
    return {
        inlineKeyboard: [
            [navigationButton("新闻简报", "brief"), navigationButton("管理行情关注", "settings")],
            [navigationButton("平台资料", "resources"), button("参与讨论", `https://t.me/${groupUsername}`)],
            [navigationButton("返回中枢", "hub")],
        ],
    };
}
function questsMarkup() {
    return {
        inlineKeyboard: [
            ...chunk(communityQuests("zh-Hans").map((quest) => navigationButton(quest.title, quest.route)), 2),
            [
                navigationButton("返回中枢", "hub"),
            ],
        ],
    };
}
function todayMarkup() {
    return {
        inlineKeyboard: [
            [navigationButton("本周节奏", "rituals"), navigationButton("风险演练", "scenario")],
            [navigationButton("管理提醒偏好", "settings")],
            [navigationButton("返回中枢", "hub")],
        ],
    };
}
function chunk(items, size) {
    const rows = [];
    for (let index = 0; index < items.length; index += size)
        rows.push([...items.slice(index, index + size)]);
    return rows;
}
function perksMarkup() {
    return {
        inlineKeyboard: [
            [passportWebAppButton()],
            [
                navigationButton("🧭 查看可用社区入口", "hub"),
            ],
            [
                navigationButton("🧭 主题分流", "topics"),
                navigationButton("📊 市场简报", "brief"),
            ],
            [
                navigationButton("返回中枢", "hub"),
            ],
        ],
    };
}
function perksText(isPremium) {
    if (isPremium) {
        return "Telegram Premium 状态已在本次请求中识别。\n\n社区护照现可从下方按钮在 Telegram 内打开。签名会话仅用于当前展示；不会记录身份、Premium 状态、打开次数或转化。Premium 不会改变内容审核标准、交易风险提示或活动资格。";
    }
    return "当前请求未携带 Telegram Premium 标识。\n\n所有社区功能照常可用。机器人不销售、升级或承诺 Premium 权益；可从下方按钮在 Telegram 内打开社区护照。签名会话只用于当前展示，不会记录身份、打开次数或转化。";
}
/** Formats a deterministic public schedule; it does not claim that an unreviewed slot is published. */
export function weeklyRhythmText(now) {
    const monday = mondayOf(now);
    const lines = weeklyCommunityRituals(monday).map((ritual) => {
        const time = new Intl.DateTimeFormat("zh-CN", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(ritual.startsAt);
        const state = ritual.sourceRequired ? "待来源审核" : "人工主持";
        return `• ${time} ${ritual.title} — ${state}`;
    });
    return `本周社区节奏（UTC）\n\n${lines.join("\n")}\n\n除“反诈诊所”外，所有内容均须经过来源审核后才会进入发布队列；本消息不是交易建议，也不代表内容已发布。`;
}
/** Transparent capability state, not a service-health promise and not a trading signal. */
export function communityStatusText() {
    return "NexuAlpha Club · 社区状态\n\n" +
        "✓ 社区中枢、主题入口、风险教育、举报与本周节奏：可用\n" +
        "✓ 内容节奏：4 个来源审核槽位 + 1 个人工主持反诈诊所\n" +
        "✓ Telegram Premium：仅用于签名 Passport 的视觉呈现，不记录、不付费、不改变资格\n" +
        "• 内容发布：自动发布已禁用；未经审核内容不会发送\n" +
        "✓ Passport：私聊入口可在 Telegram 内打开；仅接受签名会话，不记录打开或转化\n" +
        "• 群内守护：以运行时 Bot API 读回为准；即使当前覆盖为 full，也未声明全量聊天监控、历史抓取或自动执法。离线或 Mock 状态显示未知，不等于权限缺失\n\n" +
        "这张状态卡不构成行情、交易或收益承诺。";
}
/** Rich formatting is private and member-requested; its state claims match the plain fallback exactly. */
export function communityStatusRichMarkdown() {
    return "# NexuAlpha Club · 社区状态\n\n" +
        "## 可用入口\n- 社区中枢、主题入口、风险教育、举报与本周节奏\n- 内容节奏：4 个来源审核槽位 + 1 个人工主持反诈诊所\n- Telegram Premium：仅用于签名 Passport 的视觉呈现，不记录、不付费、不改变资格\n\n" +
        "## 当前边界\n- 自动发布已禁用；未经审核内容不会发送\n- Passport 仅通过私聊按钮在 Telegram 内打开；只接受签名会话，不记录打开或转化\n- 群内守护以运行时 Bot API 读回为准；即使当前覆盖为 full，也未声明全量聊天监控、历史抓取或自动执法\n\n" +
        "> 离线或 Mock 状态显示未知，不等于权限缺失。\n\n这张状态卡不构成行情、交易或收益承诺。";
}
export function communityTopicGuideText(surface) {
    const header = surface === "private"
        ? "NexuAlpha Club 主题导航\n\n这是社区的讨论地图："
        : "群内主题导航已就绪。建议把讨论按这些分区沉淀：";
    const rows = topicCatalog.map((topic) => `• ${topic.label}：${topic.use}`).join("\n");
    const footer = surface === "private"
        ? "按钮会带你进入对应入口；当前不会自动创建 Telegram 话题、群发私信或发布未经审核内容。"
        : "如果群组已开启 Telegram Topics，机器人会把带话题 ID 的回复留在原话题里；建话题和置顶仍由管理员人工控制。";
    return `${header}\n${rows}\n\n${footer}`;
}
function mondayOf(now) {
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    return monday;
}
function formatUtcTime(value) {
    return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(value);
}
function groupNudgeMarkup(label, payload) {
    return {
        inlineKeyboard: [[navigationButton(label, payload)]],
    };
}
/** Fixed first-party Mini App entry. It is added only to private /perks replies. */
function passportWebAppButton() {
    return { text: "🪪 打开社区护照", webAppUrl: passportWebAppUrl };
}
function button(text, url) {
    return { text, url };
}
function navigationButton(text, command) {
    return { text, callbackData: `nav:${command}` };
}
function callbackButton(text, callbackData) {
    return { text, callbackData };
}
function toOutboundMessage(event, response, command) {
    return {
        chatId: event.chatId,
        text: response.text,
        replyToMessageId: event.messageId,
        ...(event.messageThreadId === undefined ? {} : { messageThreadId: event.messageThreadId }),
        ...(event.isPrivateChat || command === "radar" ? {} : { ephemeralReceiverUserId: event.userId }),
        ...(response.richMarkdown === undefined ? {} : { richMarkdown: response.richMarkdown }),
        ...(response.replyMarkup === undefined ? {} : { replyMarkup: response.replyMarkup }),
    };
}
//# sourceMappingURL=mock-community-service.js.map