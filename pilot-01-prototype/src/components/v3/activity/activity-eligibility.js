const labelsByLocale = {
  en: {
    regions: "Regions",
    accountTypes: "Account type",
    userSegment: "New / existing users",
    taskSteps: "Task steps",
    rewardTypes: "Reward type",
    deadline: "Deadline / status",
    unknown: "Unknown from reviewed source",
    officialSource: "Official source",
    statusCurrent: "Current, CTA gated",
    statusReady: "Current, required fields present",
    statusExpired: "Expired",
    statusBlocked: "CTA unavailable",
    ctaReady: "Activity detail available",
    ctaBlocked: "Activity CTA unavailable until eligibility fields are complete and current.",
    researchAlternative: "Open same-platform research instead",
  },
  "zh-Hans": {
    regions: "适用地区",
    accountTypes: "账户类型",
    userSegment: "新老用户",
    taskSteps: "任务步骤",
    rewardTypes: "奖励类型",
    deadline: "截止 / 状态",
    unknown: "已审核来源未说明",
    officialSource: "官方来源",
    statusCurrent: "有效，CTA 受控",
    statusReady: "有效，关键字段完整",
    statusExpired: "已过期",
    statusBlocked: "CTA 不可用",
    ctaReady: "可打开活动详情",
    ctaBlocked: "资格字段完整且未过期前，活动 CTA 保持关闭。",
    researchAlternative: "改看同平台研究",
  },
  "zh-Hant": {
    regions: "適用地區",
    accountTypes: "帳戶類型",
    userSegment: "新舊用戶",
    taskSteps: "任務步驟",
    rewardTypes: "獎勵類型",
    deadline: "截止 / 狀態",
    unknown: "已審核來源未說明",
    officialSource: "官方來源",
    statusCurrent: "有效，CTA 受控",
    statusReady: "有效，關鍵欄位完整",
    statusExpired: "已過期",
    statusBlocked: "CTA 不可用",
    ctaReady: "可打開活動詳情",
    ctaBlocked: "資格欄位完整且未過期前，活動 CTA 保持關閉。",
    researchAlternative: "改看同平台研究",
  },
};

export function activityEligibilityCopy(locale = "en") {
  return labelsByLocale[locale] ?? labelsByLocale[String(locale).split("-")[0]] ?? labelsByLocale.en;
}

function asArray(value) {
  if (Array.isArray(value)) return value.flatMap(asArray);
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

function localText(value, locale) {
  if (typeof value === "string") return value;
  if (typeof value?.[locale] === "string") return value[locale];
  const baseLocale = String(locale || "").split("-")[0];
  if (typeof value?.[baseLocale] === "string") return value[baseLocale];
  if (typeof value?.en === "string") return value.en;
  if (typeof value?.["zh-Hans"] === "string") return value["zh-Hans"];
  return "";
}

function textList(value, locale) {
  return asArray(value).map((item) => localText(item, locale).trim()).filter(Boolean);
}

function firstValue(...values) {
  for (const value of values) {
    const list = Array.isArray(value) ? value.filter((item) => item !== null && item !== undefined && item !== "") : textList(value, "en");
    if (list.length) return value;
  }
  return null;
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function formatDate(locale, value, unknown) {
  const time = Date.parse(value ?? "");
  if (!Number.isFinite(time)) return unknown;
  return new Intl.DateTimeFormat(locale || "en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(time)) + " UTC";
}

function fieldRow(labels, key, rawValue, locale) {
  const values = textList(rawValue, locale);
  return {
    key,
    label: labels[key],
    value: values.length ? values.join(" · ") : labels.unknown,
    missing: values.length === 0,
  };
}

export function normalizeActivityEligibility(update, { locale = "en", now = Date.now(), researchHref = "" } = {}) {
  const labels = activityEligibilityCopy(locale);
  const eligibility = update?.eligibility ?? update?.qualification ?? {};
  const tasks = update?.tasks ?? update?.taskSteps ?? update?.requirements?.tasks ?? eligibility.taskSteps;
  const sourceUrl = update?.officialSource?.url ?? update?.sourceUrl;
  const source = normalizeUrl(sourceUrl);
  const expiresAt = update?.expiresAt ?? update?.deadline ?? eligibility.expiresAt;
  const expiresAtTime = Date.parse(expiresAt ?? "");
  const expired = Number.isFinite(expiresAtTime) && expiresAtTime <= Number(now);
  const deadlineMissing = !Number.isFinite(expiresAtTime);

  const rows = [
    fieldRow(labels, "regions", firstValue(eligibility.regions, update?.regions, update?.requirements?.regions), locale),
    fieldRow(labels, "accountTypes", firstValue(eligibility.accountTypes, eligibility.accountType, update?.accountTypes, update?.accountType), locale),
    fieldRow(labels, "userSegment", firstValue(eligibility.userSegment, eligibility.newOrExistingUsers, update?.userSegment, update?.newOrExistingUsers), locale),
    fieldRow(labels, "taskSteps", tasks, locale),
    fieldRow(labels, "rewardTypes", firstValue(eligibility.rewardTypes, eligibility.rewardType, update?.rewardTypes, update?.rewardType, update?.reward?.type), locale),
    {
      key: "deadline",
      label: labels.deadline,
      value: deadlineMissing ? labels.unknown : formatDate(locale, expiresAt, labels.unknown),
      missing: deadlineMissing,
    },
    {
      key: "officialSource",
      label: labels.officialSource,
      value: source?.host ?? labels.unknown,
      missing: !source,
    },
  ];

  const missingKeys = rows.filter((row) => row.missing).map((row) => row.key);
  const criticalMissing = missingKeys.length > 0;
  const activityAction = update?.activityCta ?? update?.participationCta ?? null;
  const actionUrl = normalizeUrl(activityAction?.url);
  const actionVerified = activityAction?.verified === true && actionUrl;
  const ctaEnabled = Boolean(!expired && !criticalMissing && actionVerified);
  const status = expired
    ? "expired"
    : criticalMissing || !actionVerified
      ? "blocked"
      : "ready";

  return {
    rows,
    missingKeys,
    expired,
    status,
    statusLabel: status === "expired" ? labels.statusExpired : status === "ready" ? labels.statusReady : labels.statusBlocked,
    source: source ? { url: source.href, host: source.host, type: update?.officialSource?.type ?? update?.sourceType ?? "official" } : null,
    cta: {
      enabled: ctaEnabled,
      href: ctaEnabled ? actionUrl.href : null,
      label: ctaEnabled ? labels.ctaReady : labels.ctaBlocked,
      alternativeHref: researchHref,
      alternativeLabel: labels.researchAlternative,
    },
  };
}
