// Telegram bot identity and the start-payload builder behind every t.me deep link on the site.
// Split out of telegram-config.js on 2026-10-11: regional shortlists (and through them the directory context the home
// first screen needs) only use getTelegramDeepLink, so the shell no longer ships the 90 KB of command catalogues,
// search topics and return-context contracts that telegram-config.js carries. telegram-config.js re-exports these.

export const TELEGRAM_CONFIG = {
  botUsername: "NexuAlphaAssistantBot",
  botUrl: "https://t.me/NexuAlphaAssistantBot",
  channelUsername: "NexuAlphaClub",
  channelUrl: "https://t.me/NexuAlphaClub",
  webPreviewUrl: "https://t.me/s/NexuAlphaClub",
  groupUsername: "NexuAlphaWorld",
  groupUrl: "https://t.me/NexuAlphaWorld",
};

export function sanitizeTelegramStartPayload(raw = "") {
  if (typeof raw !== "string") return "";
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function cleanTelegramStartPayload(raw = "") {
  return sanitizeTelegramStartPayload(raw).slice(0, 64);
}

export function telegramPayloadTag(raw = "") {
  let hash = 2166136261;
  for (const char of String(raw)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(36).slice(0, 6).padStart(6, "0");
}

export function compactTelegramMetaValue(raw = "", maxLength = 12) {
  const cleaned = sanitizeTelegramStartPayload(String(raw));
  if (cleaned.length <= maxLength) return cleaned;
  const tag = telegramPayloadTag(cleaned);
  const headLength = Math.max(1, maxLength - tag.length - 1);
  return `${cleaned.slice(0, headLength)}-${tag}`.slice(0, maxLength);
}

export function composeTelegramStartPayload(base = "", metaParts = []) {
  const cleanBase = sanitizeTelegramStartPayload(String(base));
  const cleanMetaParts = metaParts.map((part) => cleanTelegramStartPayload(part)).filter(Boolean);
  const criticalMetaParts = cleanMetaParts.filter((part) => /^(m|l|t)_/.test(part));
  const optionalMetaParts = cleanMetaParts.filter((part) => !/^(m|l|t)_/.test(part));
  const joinPayload = (basePart, parts) => [basePart, ...parts].filter(Boolean).join("_");

  const selectedParts = [...criticalMetaParts];
  for (const part of optionalMetaParts) {
    if (joinPayload(cleanBase, [...selectedParts, part]).length <= 64) {
      selectedParts.push(part);
    }
  }

  const fullPayload = joinPayload(cleanBase, selectedParts);
  if (fullPayload.length <= 64) return fullPayload;

  const suffix = selectedParts.length ? `_${selectedParts.join("_")}` : "";
  const baseLimit = Math.max(1, 64 - suffix.length);
  const tag = `_${telegramPayloadTag(cleanBase)}`;
  const compactBase = baseLimit > tag.length
    ? `${cleanBase.slice(0, baseLimit - tag.length).replace(/_+$/g, "")}${tag}`
    : telegramPayloadTag(cleanBase).slice(0, baseLimit);
  return `${compactBase}${suffix}`.slice(0, 64);
}

/**
 * 根据参数化路由构建标准的 Telegram Bot start 参数
 * @param {string|object} target 
 * @returns {string}
 */
export function buildTelegramStartPayload(target = "") {
  if (!target) return "";
  if (typeof target === "string") {
    const stripped = target.startsWith("/start ") ? target.slice(7) : target;
    return cleanTelegramStartPayload(stripped);
  }

  if (typeof target !== "object") return "";

  const { action, venue, pair, venueA, venueB, type, vol, domain, project, symbol, campaign, market, locale, product, publisher } = target;

  // 格式化辅助：若包含市场、语言或分发者标识，生成紧凑后缀（如 _m_BR_l_pt_p_c01）
  const metaParts = [];
  if (market) metaParts.push(`m_${compactTelegramMetaValue(market, 8)}`);
  if (locale) metaParts.push(`l_${compactTelegramMetaValue(String(locale).replace(/-/g, ""), 8)}`);
  if (product) metaParts.push(`t_${compactTelegramMetaValue(product, 12)}`);
  if (publisher) metaParts.push(`p_${compactTelegramMetaValue(publisher, 16)}`);
  if (campaign) metaParts.push(`c_${telegramPayloadTag(campaign)}`);

  switch (action) {
    case "partner_desk": {
      const p = publisher ? `_${publisher}` : "";
      return composeTelegramStartPayload(`partner_desk${p}`, metaParts.filter((part) => !part.startsWith("p_")));
    }
    case "fee_calc": {
      const v = venue || "general";
      const sub = [type, vol].filter(Boolean).join("_");
      const base = sub ? `fee_calc_${v}_${sub}` : `fee_calc_${v}`;
      return composeTelegramStartPayload(base, metaParts);
    }
    case "compare": {
      const p = pair || (venueA && venueB ? `${venueA}-vs-${venueB}` : "top");
      return composeTelegramStartPayload(`compare_${p}`, metaParts);
    }
    case "launchpool_alert": {
      const p = project || symbol || "";
      const base = p ? `launchpool_alert_${p}` : "launchpool_alert";
      return composeTelegramStartPayload(base, metaParts);
    }
    case "verify_domain": {
      const v = venue || domain || "general";
      return composeTelegramStartPayload(`verify_domain_${v}`, metaParts);
    }
    case "rates": {
      const v = venue || pair || "all";
      return composeTelegramStartPayload(`rates_${v}`, metaParts);
    }
    case "monitor": {
      const v = venue || domain || "general";
      return composeTelegramStartPayload(`monitor_${v}`, metaParts);
    }
    default: {
      if (action) {
        const parts = [venue, pair, type, vol, campaign, project].filter(Boolean).join("_");
        const base = parts ? `${action}_${parts}` : action;
        return composeTelegramStartPayload(base, metaParts);
      }
      return "";
    }
  }
}

/**
 * 生成符合 Telegram 官方 Deep Link 标准的唤醒链接
 * 支持对象参数与原始字符串两种调用方式
 * 
 * 示例：
 * getTelegramDeepLink({ action: 'fee_calc', venue: 'binance' })
 *  -> https://t.me/NexuAlphaAssistantBot?start=fee_calc_binance
 * getTelegramDeepLink({ action: 'compare', pair: 'binance-vs-okx' })
 *  -> https://t.me/NexuAlphaAssistantBot?start=compare_binance-vs-okx
 * getTelegramDeepLink({ action: 'launchpool_alert' })
 *  -> https://t.me/NexuAlphaAssistantBot?start=launchpool_alert
 * getTelegramDeepLink({ action: 'verify_domain', venue: 'okx' })
 *  -> https://t.me/NexuAlphaAssistantBot?start=verify_domain_okx
 * 
 * @param {string|object} target 启动参数或路由对象
 * @returns {string} 完整的 t.me Deep Link
 */
export function getTelegramDeepLink(target = "") {
  const payload = buildTelegramStartPayload(target);
  if (!payload) return TELEGRAM_CONFIG.botUrl;
  return `${TELEGRAM_CONFIG.botUrl}?start=${encodeURIComponent(payload)}`;
}
