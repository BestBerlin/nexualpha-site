// Official NexuAlpha social accounts (owner 2026-10-23: show the social matrix site-wide, not only Telegram).
// brand-entity.js builds BRAND.telegram / BRAND.profiles and the Organization sameAs from these constants and re-exports
// socialLinksFor(); this file stays tiny on purpose because the header (browser entry), footer and article pages import
// it directly, and brand-entity.js carries ~30 KB of localized entity copy that must not reach the entry bundle.
export const SOCIAL_X = "https://x.com/NexuAlpha";
export const SOCIAL_YOUTUBE = Object.freeze({ zh: "https://www.youtube.com/@NexuAlphaCN", global: "https://www.youtube.com/@NexuAlphaGlobal" });
export const SOCIAL_TELEGRAM = Object.freeze({
  channelZh: "https://t.me/NexuAlphaClub",
  channelEn: "https://t.me/NexuAlphaGlobal",
  group: "https://t.me/NexuAlphaWorld",
  bot: "https://t.me/NexuAlphaAssistantBot",
  miniApp: "https://app.nexualpha.com/",
});

const isChinese = (locale) => String(locale || "").startsWith("zh");
const handle = (url) => `@${String(url).replace(/\/+$/, "").split("/").pop().replace(/^@/, "")}`;

/** Locale-appropriate official links: Chinese pages get @NexuAlphaCN / @NexuAlphaClub, every other locale the Global ones. */
export function socialLinksFor(locale = "en") {
  const zh = isChinese(locale);
  const youtube = zh ? SOCIAL_YOUTUBE.zh : SOCIAL_YOUTUBE.global;
  const telegramChannel = zh ? SOCIAL_TELEGRAM.channelZh : SOCIAL_TELEGRAM.channelEn;
  return Object.freeze({
    x: SOCIAL_X,
    youtube,
    telegramChannel,
    telegramGroup: SOCIAL_TELEGRAM.group,
    telegramBot: SOCIAL_TELEGRAM.bot,
    handles: Object.freeze({ x: handle(SOCIAL_X), youtube: handle(youtube), telegramChannel: handle(telegramChannel), telegramGroup: handle(SOCIAL_TELEGRAM.group) }),
  });
}

// Short shell labels shared by the header, mobile menu, footer and article follow line (the home band has its own copy
// in home7-follow.jsx).
const SOCIAL_LABELS = {
  en: { follow: "Follow us", channel: "Telegram channel", group: "Telegram group" },
  "zh-Hans": { follow: "关注我们", channel: "Telegram 频道", group: "Telegram 交流群" },
  "zh-Hant": { follow: "關注我們", channel: "Telegram 頻道", group: "Telegram 交流群" },
  es: { follow: "Síguenos", channel: "Canal de Telegram", group: "Grupo de Telegram" },
  "pt-BR": { follow: "Siga-nos", channel: "Canal no Telegram", group: "Grupo no Telegram" },
  fr: { follow: "Suivez-nous", channel: "Canal Telegram", group: "Groupe Telegram" },
  de: { follow: "Folgen Sie uns", channel: "Telegram-Kanal", group: "Telegram-Gruppe" },
  it: { follow: "Seguici", channel: "Canale Telegram", group: "Gruppo Telegram" },
  ja: { follow: "フォローする", channel: "Telegram チャンネル", group: "Telegram グループ" },
  ko: { follow: "팔로우하기", channel: "텔레그램 채널", group: "텔레그램 그룹" },
  tr: { follow: "Bizi takip edin", channel: "Telegram kanalı", group: "Telegram grubu" },
  ru: { follow: "Подписывайтесь", channel: "Telegram-канал", group: "Telegram-группа" },
  ar: { follow: "تابعنا", channel: "قناة Telegram", group: "مجموعة Telegram" },
  id: { follow: "Ikuti kami", channel: "Kanal Telegram", group: "Grup Telegram" },
  vi: { follow: "Theo dõi chúng tôi", channel: "Kênh Telegram", group: "Nhóm Telegram" },
  // l10n: needs native review
  ur: { follow: "ہمیں فالو کریں", channel: "Telegram چینل", group: "Telegram گروپ" },
  uk: { follow: "Стежте за нами", channel: "Telegram-канал", group: "Telegram-група" },
};
export const socialLabels = (locale) => SOCIAL_LABELS[locale] || (isChinese(locale) ? SOCIAL_LABELS["zh-Hans"] : SOCIAL_LABELS.en);
