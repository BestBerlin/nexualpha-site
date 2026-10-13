import { z } from "zod";
import { channelDirectMessageCallbackEventSchema, channelDirectMessageEventSchema, inboundEventSchema, inlineQueryEventSchema, reactionCountEventSchema } from "../../contracts/src/telegram.js";
import { parseCommand } from "../../domain/src/commands.js";
import { parseCommunityFeedbackCategory } from "../../analytics/src/community-feedback-pulse.js";
import { parseSupportBotTriageCallbackData, parseSupportDeskTriageCallbackData } from "../../domain/src/support-desk-triage.js";
const rawUpdateSchema = z.object({
    update_id: z.number().int().nonnegative(),
    message: z.object({
        message_id: z.number().int().positive(),
        date: z.number().int().nonnegative(),
        text: z.string().max(4096).optional(),
        message_thread_id: z.number().int().positive().optional(),
        chat: z.object({ id: z.number().int(), type: z.enum(["private", "group", "supergroup", "channel"]) }),
        from: z.object({ id: z.number().int(), is_premium: z.boolean().optional(), first_name: z.string().optional(), username: z.string().optional() }).optional(),
        sender_chat: z.object({ id: z.number().int() }).optional(),
        reply_to_message: z.object({
            from: z.object({
                is_bot: z.boolean().optional(),
                username: z.string().optional(),
            }).optional(),
        }).optional(),
    }).optional(),
});
const rawCallbackUpdateSchema = z.object({
    update_id: z.number().int().nonnegative(),
    callback_query: z.object({
        id: z.string().min(1).max(128),
        data: z.string().min(1).max(64).optional(),
        from: z.object({ id: z.number().int(), is_premium: z.boolean().optional() }),
        message: z.object({
            message_id: z.number().int().positive(),
            date: z.number().int().nonnegative(),
            message_thread_id: z.number().int().positive().optional(),
            chat: z.object({ id: z.number().int(), type: z.enum(["private", "group", "supergroup", "channel"]), is_direct_messages: z.boolean().optional() }),
            direct_messages_topic: z.object({ topic_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) }).optional(),
        }).optional(),
    }),
});
const rawReactionCountUpdateSchema = z.object({
    update_id: z.number().int().nonnegative(),
    message_reaction_count: z.object({
        message_id: z.number().int().positive(),
        date: z.number().int().nonnegative(),
        chat: z.object({ id: z.number().int() }),
        reactions: z.array(z.object({ total_count: z.number().int().nonnegative() })).max(128),
    }),
});
const rawInlineQueryUpdateSchema = z.object({
    update_id: z.number().int().nonnegative(),
    inline_query: z.object({
        id: z.string().min(1).max(128),
        from: z.object({ id: z.number().int(), is_premium: z.boolean().optional() }),
        query: z.string().max(256),
        offset: z.string().max(64).optional(),
    }),
});
const rawChannelDirectMessageUpdateSchema = z.object({
    update_id: z.number().int().nonnegative(),
    message: z.object({
        message_id: z.number().int().positive(),
        date: z.number().int().nonnegative(),
        chat: z.object({ id: z.number().int(), is_direct_messages: z.literal(true) }),
        direct_messages_topic: z.object({ topic_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) }),
    }),
});
export function decodeBotApiUpdate(payload) {
    const result = rawUpdateSchema.safeParse(payload);
    if (!result.success || !result.data.message || result.data.message.text === undefined)
        return undefined;
    const { update_id: updateId, message } = result.data;
    const sender = message.from;
    if (!sender)
        return decodeAnonymousAdministratorCommand(updateId, message);
    return inboundEventSchema.parse({
        updateId,
        chatId: BigInt(message.chat.id),
        userId: BigInt(sender.id),
        isPremium: sender.is_premium === true,
        ...anonymousAdministratorMetadata(message),
        isPrivateChat: message.chat.type === "private",
        messageId: message.message_id,
        messageThreadId: message.message_thread_id,
        text: message.text,
        receivedAt: new Date(message.date * 1_000),
        ...(message.reply_to_message?.from?.is_bot === true ? { isReplyToBot: true } : {}),
        ...(sender.first_name ? { senderName: sender.first_name } : sender.username ? { senderName: sender.username } : {}),
    });
}
/**
 * An anonymous administrator can send as its group, so Telegram deliberately
 * omits a personal `from` object. Keep this route narrow: only `/pulse` and
 * `/ops`, only when the sender-chat is exactly the receiving group. The
 * sentinel user id is never sent to Telegram, stored, or used for member work.
 */
function decodeAnonymousAdministratorCommand(updateId, message) {
    if (!isAnonymousAdministratorCommand(message))
        return undefined;
    return inboundEventSchema.parse({
        updateId,
        chatId: BigInt(message.chat.id),
        userId: 0n,
        ...anonymousAdministratorMetadata(message),
        isPrivateChat: false,
        messageId: message.message_id,
        messageThreadId: message.message_thread_id,
        text: message.text,
        receivedAt: new Date(message.date * 1_000),
    });
}
function isAnonymousAdministratorCommand(message) {
    return anonymousAdministratorMetadata(message).anonymousAdministrator === true;
}
function anonymousAdministratorMetadata(message) {
    if (message.chat.type === "private")
        return {};
    const command = parseCommand(message.text ?? "")?.command;
    if (command !== "pulse" && command !== "ops")
        return {};
    const origin = message.sender_chat === undefined ? "absent" : message.sender_chat.id === message.chat.id ? "same_chat" : "other_chat";
    return origin === "same_chat" ? { anonymousAdministrator: true, anonymousAdministratorOrigin: origin } : { anonymousAdministratorOrigin: origin };
}
/** Decodes only bounded bot-owned navigation or safety-scenario callbacks from a concrete chat message. */
export function decodeBotApiCallbackQuery(payload) {
    const result = rawCallbackUpdateSchema.safeParse(payload);
    if (!result.success)
        return undefined;
    const callback = result.data.callback_query;
    const message = callback.message;
    if (!message || !callback.data || message.chat.is_direct_messages === true)
        return undefined;
    const text = callbackText(callback.data, message.chat.type === "private");
    if (!text)
        return undefined;
    return inboundEventSchema.parse({
        updateId: result.data.update_id,
        chatId: BigInt(message.chat.id),
        userId: BigInt(callback.from.id),
        isPremium: callback.from.is_premium === true,
        isPrivateChat: message.chat.type === "private",
        messageId: message.message_id,
        messageThreadId: message.message_thread_id,
        callbackQueryId: callback.id,
        text,
        receivedAt: new Date(message.date * 1_000),
    });
}
/** Decodes only fixed safety actions from a Bot-owned channel-DM receipt, omitting the clicker. */
export function decodeBotApiChannelDirectMessageCallbackQuery(payload) {
    const result = rawCallbackUpdateSchema.safeParse(payload);
    if (!result.success)
        return undefined;
    const callback = result.data.callback_query;
    const message = callback.message;
    if (!message || message.chat.is_direct_messages !== true || !message.direct_messages_topic || !callback.data)
        return undefined;
    const action = parseSupportDeskTriageCallbackData(callback.data);
    if (!action)
        return undefined;
    return channelDirectMessageCallbackEventSchema.parse({
        updateId: result.data.update_id,
        chatId: BigInt(message.chat.id),
        directMessagesTopicId: message.direct_messages_topic.topic_id,
        messageId: message.message_id,
        callbackQueryId: callback.id,
        action,
        receivedAt: new Date(message.date * 1_000),
    });
}
function callbackText(value, isPrivateChat) {
    if (value.startsWith("nav:")) {
        const command = value.slice("nav:".length);
        return /^[a-z_]{1,32}$/u.test(command) ? `/${command}` : undefined;
    }
    if (value.startsWith("alerts:")) {
        if (!isPrivateChat)
            return undefined;
        const argument = value.slice("alerts:".length);
        return /^(liquidation|moves|listings|digest|all|off|lang-(zh|en|ru|tr|vi|id|es|pt))$/.test(argument) ? `/alerts ${argument}` : undefined;
    }
    if (value.startsWith("support:")) {
        if (!isPrivateChat)
            return undefined;
        const category = parseSupportBotTriageCallbackData(value);
        return category ? `/support ${category}` : undefined;
    }
    if (value.startsWith("feedback:")) {
        if (!isPrivateChat)
            return undefined;
        const category = parseCommunityFeedbackCategory(value.slice("feedback:".length));
        return category ? `/feedback ${category}` : undefined;
    }
    const scenario = value.slice("scenario:".length);
    if (["support", "wallet", "qr", "verify", "transfer", "code", "wallet_disconnect", "wallet_sign", "wallet_seed", "qr_preview", "qr_scan", "qr_import"].includes(scenario))
        return `/scenario ${scenario}`;
    const report = value.slice("report:".length);
    return ["prepare", "protect", "after"].includes(report) ? `/report ${report}` : undefined;
}
/** Decodes only anonymous aggregate reaction counts and deliberately omits reaction actors/types. */
export function decodeBotApiReactionCountUpdate(payload) {
    const result = rawReactionCountUpdateSchema.safeParse(payload);
    if (!result.success)
        return undefined;
    const { update_id: updateId, message_reaction_count: reaction } = result.data;
    const totalCount = reaction.reactions.reduce((total, entry) => total + entry.total_count, 0);
    if (!Number.isSafeInteger(totalCount))
        return undefined;
    return reactionCountEventSchema.parse({
        updateId,
        chatId: BigInt(reaction.chat.id),
        messageId: reaction.message_id,
        observedAt: new Date(reaction.date * 1_000),
        totalCount,
    });
}
/** Decodes inline queries without chat, message, location, or chosen-result data. */
export function decodeBotApiInlineQuery(payload) {
    const result = rawInlineQueryUpdateSchema.safeParse(payload);
    if (!result.success)
        return undefined;
    const { update_id: updateId, inline_query: inlineQuery } = result.data;
    return inlineQueryEventSchema.parse({
        updateId,
        inlineQueryId: inlineQuery.id,
        userId: BigInt(inlineQuery.from.id),
        isPremium: inlineQuery.from.is_premium === true,
        query: inlineQuery.query,
        offset: inlineQuery.offset,
        receivedAt: new Date(),
    });
}
/** Identifies a channel-DM topic without reading text, sender, media, or suggested-post fields. */
export function decodeBotApiChannelDirectMessage(payload) {
    const result = rawChannelDirectMessageUpdateSchema.safeParse(payload);
    if (!result.success)
        return undefined;
    const { update_id: updateId, message } = result.data;
    return channelDirectMessageEventSchema.parse({
        updateId,
        chatId: BigInt(message.chat.id),
        directMessagesTopicId: message.direct_messages_topic.topic_id,
        messageId: message.message_id,
        receivedAt: new Date(message.date * 1_000),
    });
}
//# sourceMappingURL=update-decoder.js.map