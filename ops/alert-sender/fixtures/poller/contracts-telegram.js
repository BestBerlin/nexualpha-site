import { z } from "zod";
export const supportedCommands = [
    "start", "help", "hub", "community", "topics", "settings", "language", "locale", "today", "market", "radar", "brief", "rituals", "search", "ask",
    "compare", "resources", "quests", "exchange", "fees", "listing", "risk", "scenario", "quiz", "pulse", "ops", "feedback", "alerts", "checklink", "subscribe",
    "unsubscribe", "stop", "delivery_consent", "watch", "unwatch", "report", "support", "privacy", "delete_my_data", "status", "version", "perks", "invite", "signup",
];
export const inboundEventSchema = z.object({
    updateId: z.number().int().nonnegative(),
    chatId: z.bigint(),
    userId: z.bigint(),
    isPremium: z.boolean().optional(),
    /**
     * Telegram omits `from` when an administrator deliberately sends as the
     * group. This is accepted only for the bounded group-admin command path;
     * it is not a member identity and must never be persisted or profiled.
     */
    anonymousAdministrator: z.literal(true).optional(),
    /** Ephemeral transport classification for the two bounded admin commands; never persisted. */
    anonymousAdministratorOrigin: z.enum(["same_chat", "other_chat", "absent"]).optional(),
    isPrivateChat: z.boolean(),
    messageId: z.number().int().positive(),
    messageThreadId: z.number().int().positive().optional(),
    callbackQueryId: z.string().min(1).max(128).optional(),
    text: z.string().max(4096),
    receivedAt: z.date(),
    isReplyToBot: z.boolean().optional(),
    senderName: z.string().optional(),
});
/** A channel-DM receipt omits body, sender, and parent-channel metadata. */
export const channelDirectMessageEventSchema = z.object({
    updateId: z.number().int().nonnegative(),
    chatId: z.bigint(),
    directMessagesTopicId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    messageId: z.number().int().positive(),
    receivedAt: z.date(),
});
export const channelDirectMessageCallbackActions = ["safety", "official_source", "product_help", "boundaries", "community"];
/** A fixed callback from a Bot-owned channel-DM safety receipt; it omits actor and body. */
export const channelDirectMessageCallbackEventSchema = z.object({
    updateId: z.number().int().nonnegative(),
    chatId: z.bigint(),
    directMessagesTopicId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    messageId: z.number().int().positive(),
    callbackQueryId: z.string().min(1).max(128),
    action: z.enum(channelDirectMessageCallbackActions),
    receivedAt: z.date(),
});
export const inlineQueryEventSchema = z.object({
    updateId: z.number().int().nonnegative(),
    inlineQueryId: z.string().min(1).max(128),
    userId: z.bigint(),
    isPremium: z.boolean().optional(),
    query: z.string().max(256),
    offset: z.string().max(64).optional(),
    receivedAt: z.date(),
});
/** Anonymous aggregate reaction counts only; no reacting member identity is accepted. */
export const reactionCountEventSchema = z.object({
    updateId: z.number().int().nonnegative(),
    chatId: z.bigint(),
    messageId: z.number().int().positive(),
    observedAt: z.date(),
    totalCount: z.number().int().nonnegative().max(2_147_483_647),
});
//# sourceMappingURL=telegram.js.map