// Market alert subscriptions (owner 2026-10-10). A member turns topics on or off in a private chat with the bot;
// turning a topic on is the explicit consent to receive those alerts by private message, and "off" stops all of them.
// Stored in a small JSON file shared with the alert-sender service; only the Telegram user id, chosen topics,
// language and timestamps are kept.
// 2026-10-11: the card speaks 8 languages (zh, en, ru, tr, vi, id, es, pt) so the site's locale deep links
// (?start=alerts-<lang>) land on a card the reader can use; alert messages themselves fall back to en for the
// languages the sender does not have yet.
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import path from "node:path";

const FILE = process.env.ALERT_SUBSCRIPTIONS_FILE || "/var/lib/crypto-telegram-ops/alert-subscriptions.json";
export const ALERT_LANGS = ["zh", "en", "ru", "tr", "vi", "id", "es", "pt"];
const LANG_LABEL = { zh: "中文", en: "English", ru: "Русский", tr: "Türkçe", vi: "Tiếng Việt", id: "Bahasa Indonesia", es: "Español", pt: "Português" };

// topic key -> label per language
const TOPICS = {
    liquidation: { zh: "💥 爆仓 / 多空双杀", en: "💥 Liquidations", ru: "💥 Ликвидации", tr: "💥 Tasfiyeler", vi: "💥 Thanh lý", id: "💥 Likuidasi", es: "💥 Liquidaciones", pt: "💥 Liquidações" },
    moves: { zh: "📈 BTC/ETH 急涨急跌", en: "📈 BTC/ETH sharp moves", ru: "📈 Резкие движения BTC/ETH", tr: "📈 BTC/ETH sert hareketler", vi: "📈 BTC/ETH biến động mạnh", id: "📈 Pergerakan tajam BTC/ETH", es: "📈 Movimientos bruscos BTC/ETH", pt: "📈 Movimentos bruscos BTC/ETH" },
    listings: { zh: "🆕 交易所上币与活动", en: "🆕 Listings & campaigns", ru: "🆕 Листинги и акции бирж", tr: "🆕 Listelemeler ve kampanyalar", vi: "🆕 Niêm yết & chiến dịch", id: "🆕 Listing & kampanye", es: "🆕 Listados y campañas", pt: "🆕 Listagens e campanhas" },
    digest: { zh: "🗞 每日市场简报（21:00）", en: "🗞 Daily brief (13:00 UTC)", ru: "🗞 Ежедневная сводка (13:00 UTC)", tr: "🗞 Günlük özet (13:00 UTC)", vi: "🗞 Bản tin hằng ngày (13:00 UTC)", id: "🗞 Ringkasan harian (13:00 UTC)", es: "🗞 Resumen diario (13:00 UTC)", pt: "🗞 Resumo diário (13:00 UTC)" },
};
export const ALERT_TOPICS = Object.entries(TOPICS).map(([key, labels]) => [key, labels.zh, labels.en]);
const TOPIC_KEYS = Object.keys(TOPICS);

const TEXT = {
    zh: { title: "🔔 NexuAlpha 行情告警订阅", intro: "点按钮开关对应主题。开启后，机器人会私信推送；发送 /alerts off 可随时全部关闭。", note: "爆仓数据来自 Binance、OKX 公开数据，是下限估计，不代表全市场。不构成投资建议。", allOn: "全部开启", allOff: "全部关闭", lang: "语言" },
    en: { title: "🔔 NexuAlpha market alerts", intro: "Tap a topic to switch it on or off. Alerts arrive as private messages from this bot; send /alerts off to stop all of them.", note: "Liquidation figures come from Binance and OKX public data and are a lower bound, not the whole market. Not investment advice.", allOn: "Turn all on", allOff: "Turn all off", lang: "Language" },
    ru: { title: "🔔 Оповещения NexuAlpha", intro: "Нажмите на тему, чтобы включить или выключить её. Оповещения приходят личными сообщениями от этого бота; отправьте /alerts off, чтобы отключить все.", note: "Данные о ликвидациях берутся из открытых данных Binance и OKX и являются нижней оценкой, а не всем рынком. Не является инвестиционной рекомендацией.", allOn: "Включить все", allOff: "Выключить все", lang: "Язык" },
    tr: { title: "🔔 NexuAlpha piyasa uyarıları", intro: "Bir konuyu açıp kapatmak için dokunun. Uyarılar bu bottan özel mesaj olarak gelir; tümünü durdurmak için /alerts off gönderin.", note: "Tasfiye rakamları Binance ve OKX açık verilerinden gelir ve alt sınırdır, tüm piyasayı temsil etmez. Yatırım tavsiyesi değildir.", allOn: "Tümünü aç", allOff: "Tümünü kapat", lang: "Dil" },
    vi: { title: "🔔 Cảnh báo thị trường NexuAlpha", intro: "Chạm vào một chủ đề để bật hoặc tắt. Cảnh báo được gửi dưới dạng tin nhắn riêng từ bot này; gửi /alerts off để tắt tất cả.", note: "Số liệu thanh lý lấy từ dữ liệu công khai của Binance và OKX, là mức ước tính thấp nhất, không phải toàn bộ thị trường. Không phải lời khuyên đầu tư.", allOn: "Bật tất cả", allOff: "Tắt tất cả", lang: "Ngôn ngữ" },
    id: { title: "🔔 Peringatan pasar NexuAlpha", intro: "Ketuk topik untuk mengaktifkan atau menonaktifkannya. Peringatan dikirim sebagai pesan pribadi dari bot ini; kirim /alerts off untuk menghentikan semuanya.", note: "Angka likuidasi berasal dari data publik Binance dan OKX dan merupakan batas bawah, bukan seluruh pasar. Bukan saran investasi.", allOn: "Aktifkan semua", allOff: "Matikan semua", lang: "Bahasa" },
    es: { title: "🔔 Alertas de mercado de NexuAlpha", intro: "Toca un tema para activarlo o desactivarlo. Las alertas llegan como mensajes privados de este bot; envía /alerts off para detenerlas todas.", note: "Las cifras de liquidaciones provienen de datos públicos de Binance y OKX y son un límite inferior, no todo el mercado. No es asesoramiento de inversión.", allOn: "Activar todo", allOff: "Desactivar todo", lang: "Idioma" },
    pt: { title: "🔔 Alertas de mercado da NexuAlpha", intro: "Toque em um tema para ativá-lo ou desativá-lo. Os alertas chegam como mensagens privadas deste bot; envie /alerts off para parar todos.", note: "Os números de liquidações vêm de dados públicos da Binance e da OKX e são um limite inferior, não o mercado inteiro. Não é recomendação de investimento.", allOn: "Ativar tudo", allOff: "Desativar tudo", lang: "Idioma" },
};

function load() {
    try {
        const data = JSON.parse(readFileSync(FILE, "utf8"));
        return data && typeof data.users === "object" ? data : { version: 1, users: {} };
    }
    catch {
        return { version: 1, users: {} };
    }
}
function save(data) {
    mkdirSync(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.tmp`;
    writeFileSync(tmp, JSON.stringify(data));
    renameSync(tmp, FILE);
}

function normalizeLang(value) {
    return ALERT_LANGS.includes(value) ? value : "zh";
}

export function isAlertArgument(value) {
    return value === undefined || [...TOPIC_KEYS, "all", "off", ...ALERT_LANGS.map((l) => `lang-${l}`)].includes(value);
}

/** Applies the command argument (topic toggle, all, off, lang-xx) and returns the member's current state. */
export function handleAlertsCommand(userId, argument) {
    const key = String(userId);
    const data = load();
    const now = new Date().toISOString();
    const state = data.users[key] || { topics: [], lang: "zh", createdAt: now };
    const arg = typeof argument === "string" ? argument.trim().toLowerCase() : undefined;
    if (arg && isAlertArgument(arg)) {
        if (arg === "all") state.topics = [...TOPIC_KEYS];
        else if (arg === "off") state.topics = [];
        else if (arg.startsWith("lang-")) state.lang = normalizeLang(arg.slice(5));
        else state.topics = state.topics.includes(arg) ? state.topics.filter((t) => t !== arg) : [...state.topics, arg];
        state.updatedAt = now;
        // a language choice is kept even before any topic is on, so the next tap opens in that language
        if (state.topics.length || data.users[key] || arg.startsWith("lang-")) data.users[key] = state;
        if (!state.topics.length && arg === "off") delete data.users[key];
        save(data);
    }
    return { topics: state.topics, lang: normalizeLang(state.lang) };
}

export function alertsText(state) {
    const on = new Set(state?.topics || []);
    const lang = normalizeLang(state?.lang);
    const t = TEXT[lang];
    const lines = [t.title, "", t.intro, ""];
    for (const key of TOPIC_KEYS) lines.push(`${on.has(key) ? "✅" : "⬜"} ${TOPICS[key][lang]}`);
    lines.push("", t.note);
    return lines.join("\n");
}

export function alertsMarkup(state, extraRows = []) {
    const on = new Set(state?.topics || []);
    const lang = normalizeLang(state?.lang);
    const t = TEXT[lang];
    const rows = TOPIC_KEYS.map((key) => [{ text: `${on.has(key) ? "✅" : "⬜"} ${TOPICS[key][lang]}`, callbackData: `alerts:${key}` }]);
    rows.push([
        { text: t.allOn, callbackData: "alerts:all" },
        { text: t.allOff, callbackData: "alerts:off" },
    ]);
    // language picker: two rows of the other languages (Telegram allows up to 8 buttons per row; keep 4 for width)
    const others = ALERT_LANGS.filter((l) => l !== lang).map((l) => ({ text: LANG_LABEL[l], callbackData: `alerts:lang-${l}` }));
    rows.push(others.slice(0, 4));
    rows.push(others.slice(4));
    return { inlineKeyboard: [...rows, ...extraRows] };
}
