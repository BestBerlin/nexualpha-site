#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

export const DEFAULT_WAVE15_PACK_DIR = path.join(projectRoot, "docs/strategy/telegram-manual-publish-pack-20260915-wave15");
export const DEFAULT_WAVE15_AUDIT_JSON = path.join(projectRoot, "docs/evidence/telegram-wave16-wave15-audit-20260915.json");
export const DEFAULT_WAVE15_AUDIT_MARKDOWN = path.join(projectRoot, "docs/evidence/telegram-wave16-wave15-audit-20260915.md");
export const DEFAULT_TELEGRAM_PACK_WAVE_LABEL = "Wave15";
export const DEFAULT_TELEGRAM_PACK_EXPECTED_SLOTS = 6;

export const TELEGRAM_PACK_REQUIRED_DOCS = Object.freeze([
  "queue.json",
  "copy-pack.md",
  "preflight-checklist.md",
  "attribution-guide.md",
  "post-log-template.md",
  "weekly-review-template.md",
]);

export const TELEGRAM_PACK_REQUIRED_PARAMS = Object.freeze([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "tg_market",
  "tg_locale",
  "tg_product",
  "tg_funnel",
  "tg_intent",
  "tg_theme",
  "tg_draft",
]);

export const TELEGRAM_ANONYMOUS_METRIC_WINDOWS = Object.freeze({
  "24h": [
    "landingVisits",
    "onsiteNextStepClicks",
    "comparisonOrToolClicks",
    "protectedOutboundClicks",
    "botStartsIfVisible",
    "repliesOrDiscussionNotes",
    "sourceLocaleOrCtaIssues",
  ],
  "7d": [
    "landingVisits",
    "repeatVisits",
    "onsiteNextStepClicks",
    "comparisonOrToolClicks",
    "protectedOutboundClicks",
    "botStartsIfVisible",
    "searchImpressionDeltaIfAvailable",
    "decision",
  ],
});

const RAW_EXCHANGE_REGISTRATION_URL_RE = /(?:accounts\.binance\.com|binance\.com\/(?:join|register|ref)|bsmkweb\.cc|partner\.bitget|bitget\.com\/(?:expressly|register|referral|signup)|okx\.com\/(?:join|register|referral)|topzhjdgxcb\.net|backpack\.exchange\/join|bybit\.com\/(?:invite|register|sign-up|signup)|bingx\.com\/(?:invite|register)|gate\.io\/(?:signup|ref)|mexc\.com\/(?:register|invite)|kucoin\.com\/(?:r|ucenter\/signup))/i;
const INVITE_CODE_RE = /\b(?:invite\s*code|referral\s*code|邀请码|邀請碼|초대\s*코드|davet\s*kodu)\b/i;
const POSITIVE_PROMISE_RE = /\b(?:guaranteed|guarantees|promise[sd]?)\s+(?:signup|approval|discount|ranking|profit|return|commission|conversion)\b/i;
const NEXUALPHA_ORIGIN = "https://nexualpha.com";
const BOT_DEEP_LINK_RE = /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/;

function parseArgs(argv) {
  const options = {
    packDir: DEFAULT_WAVE15_PACK_DIR,
    output: DEFAULT_WAVE15_AUDIT_JSON,
    markdown: DEFAULT_WAVE15_AUDIT_MARKDOWN,
    waveLabel: DEFAULT_TELEGRAM_PACK_WAVE_LABEL,
    expectedSlots: DEFAULT_TELEGRAM_PACK_EXPECTED_SLOTS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--pack-dir") options.packDir = path.resolve(argv[++index]);
    else if (arg === "--output") options.output = path.resolve(argv[++index]);
    else if (arg === "--markdown") options.markdown = path.resolve(argv[++index]);
    else if (arg === "--wave-label") options.waveLabel = argv[++index];
    else if (arg === "--expected-slots") options.expectedSlots = Number(argv[++index]);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.expectedSlots) || options.expectedSlots <= 0) {
    throw new Error("--expected-slots must be a positive integer");
  }
  return options;
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

function flattenQueue(queue = []) {
  return queue.flatMap((day) => (day.slots || []).map((slot, slotIndex) => ({ day, slot, slotIndex })));
}

function toProblem(scope, message) {
  return { scope, message };
}

function reviewUrl(slot, problems) {
  const url = slot.canonicalLandingUrl || slot.onsiteUrl || "";
  if (!url) {
    problems.push(toProblem(slot.itemId || "slot", "Missing canonicalLandingUrl or onsiteUrl."));
    return null;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    problems.push(toProblem(slot.itemId || "slot", `Invalid NexuAlpha URL: ${url}`));
    return null;
  }

  if (parsed.origin !== NEXUALPHA_ORIGIN) {
    problems.push(toProblem(slot.itemId || "slot", `Landing URL must stay on ${NEXUALPHA_ORIGIN}: ${url}`));
  }

  for (const param of TELEGRAM_PACK_REQUIRED_PARAMS) {
    if (!parsed.searchParams.get(param)) {
      problems.push(toProblem(slot.itemId || "slot", `Missing required public/Telegram URL parameter: ${param}`));
    }
  }

  if (parsed.searchParams.get("utm_source") !== "tg_channel") {
    problems.push(toProblem(slot.itemId || "slot", "utm_source must remain tg_channel."));
  }
  if (parsed.searchParams.get("utm_medium") !== "broadcast") {
    problems.push(toProblem(slot.itemId || "slot", "utm_medium must remain broadcast."));
  }
  if (slot.campaign && parsed.searchParams.get("utm_campaign") !== slot.campaign) {
    problems.push(toProblem(slot.itemId || "slot", "utm_campaign must match the queue campaign."));
  }

  return parsed;
}

function reviewCopyOrder(copyPack, slots, problems) {
  if (!copyPack) {
    problems.push(toProblem("copy-pack.md", "Missing copy pack; cannot confirm onsite-first order."));
    return;
  }

  for (const { slot } of slots) {
    const id = slot.itemId || slot.id || slot.campaign;
    const landing = slot.canonicalLandingUrl || slot.onsiteUrl;
    const bot = slot.botDeepLink;
    const landingIndex = landing ? copyPack.indexOf(landing) : -1;
    const botIndex = bot ? copyPack.indexOf(bot) : -1;
    if (landingIndex === -1) problems.push(toProblem(id, "Copy pack does not contain the exact NexuAlpha landing URL."));
    if (botIndex === -1) problems.push(toProblem(id, "Copy pack does not contain the exact Bot follow-up link."));
    if (landingIndex !== -1 && botIndex !== -1 && landingIndex > botIndex) {
      problems.push(toProblem(id, "Bot link appears before the NexuAlpha landing URL in copy pack."));
    }
  }
}

function reviewDocs(docs, problems) {
  const missingDocs = TELEGRAM_PACK_REQUIRED_DOCS.filter((name) => docs[name] === null);
  for (const doc of missingDocs) {
    problems.push(toProblem(doc, "Required manual-publish document is missing."));
  }

  const preflight = docs["preflight-checklist.md"] || "";
  for (const param of TELEGRAM_PACK_REQUIRED_PARAMS) {
    if (!preflight.includes(param)) {
      problems.push(toProblem("preflight-checklist.md", `Preflight checklist does not name required parameter ${param}.`));
    }
  }
  if (!/NexuAlpha/i.test(preflight) || !/Bot/i.test(preflight) || !/24h/i.test(preflight) || !/7d/i.test(preflight)) {
    problems.push(toProblem("preflight-checklist.md", "Preflight must cover NexuAlpha-first links, Bot handoff, 24h review and 7d review."));
  }

  const postLog = docs["post-log-template.md"] || "";
  for (const field of [...TELEGRAM_ANONYMOUS_METRIC_WINDOWS["24h"], ...TELEGRAM_ANONYMOUS_METRIC_WINDOWS["7d"]]) {
    if (!postLog.includes(field)) {
      problems.push(toProblem("post-log-template.md", `Post log template is missing anonymous metric field ${field}.`));
    }
  }

  const weekly = docs["weekly-review-template.md"] || "";
  if (!/24h/i.test(weekly) || !/7d/i.test(weekly) || !/keep \/ refresh \/ pause \/ localize/i.test(weekly)) {
    problems.push(toProblem("weekly-review-template.md", "Weekly review template must include 24h/7d evidence and an explicit decision field."));
  }

  const attribution = docs["attribution-guide.md"] || "";
  if (!/anonymous/i.test(attribution) || !/utm_source=tg_channel/i.test(attribution) || !/no user/i.test(attribution)) {
    problems.push(toProblem("attribution-guide.md", "Attribution guide must document anonymous UTM measurement and no user identifiers."));
  }

  return missingDocs;
}

export async function auditTelegramManualPack({
  packDir = DEFAULT_WAVE15_PACK_DIR,
  waveLabel = DEFAULT_TELEGRAM_PACK_WAVE_LABEL,
  expectedSlots = DEFAULT_TELEGRAM_PACK_EXPECTED_SLOTS,
} = {}) {
  const resolvedPackDir = path.resolve(packDir);
  const docs = Object.fromEntries(await Promise.all(TELEGRAM_PACK_REQUIRED_DOCS.map(async (name) => [name, await readTextIfExists(path.join(resolvedPackDir, name))])));
  const problems = [];
  const missingDocs = reviewDocs(docs, problems);

  let payload = null;
  if (docs["queue.json"]) {
    try {
      payload = JSON.parse(docs["queue.json"]);
    } catch (error) {
      problems.push(toProblem("queue.json", `Cannot parse queue JSON: ${error.message}`));
    }
  }

  const slots = payload ? flattenQueue(payload.queue || []) : [];
  if (payload) {
    if (payload.status !== "draft_only" && payload.distributionPolicy?.status !== "draft_only") {
      problems.push(toProblem("queue.json", "Queue status must remain draft_only."));
    }
    if (payload.noTelegramApiCall !== true && payload.distributionPolicy?.noTelegramApiCall !== true) {
      problems.push(toProblem("queue.json", "Queue must declare noTelegramApiCall: true."));
    }
    if (payload.validation?.rawExchangeRegistrationLinks !== false) {
      problems.push(toProblem("queue.json", "Validation must prove rawExchangeRegistrationLinks is false."));
    }
    if (payload.validation?.requiredUtmParams !== true) {
      problems.push(toProblem("queue.json", "Validation must prove requiredUtmParams is true."));
    }
    if (slots.length !== expectedSlots) {
      problems.push(toProblem("queue.json", `Expected ${expectedSlots} ${waveLabel} slots, found ${slots.length}.`));
    }

    for (const { slot } of slots) {
      reviewUrl(slot, problems);
      const id = slot.itemId || slot.id || slot.campaign || "slot";
      if (slot.state !== "draft_only") {
        problems.push(toProblem(id, "Slot state must remain draft_only."));
      }
      if (slot.review !== "manual_review_required") {
        problems.push(toProblem(id, "Slot must require manual review before publication."));
      }
      if (slot.publishOrder !== "onsite_link_before_bot_deep_link") {
        problems.push(toProblem(id, "Slot must publish the NexuAlpha onsite link before the Bot deep link."));
      }
      if (slot.humanAuthorizationRequired !== true) {
        problems.push(toProblem(id, "Slot must require explicit human authorization before publication."));
      }
      if (slot.authorizationRecord?.status !== "not_authorized" || slot.authorizationRecord?.requiredBeforePost !== true) {
        problems.push(toProblem(id, "Slot authorization record must stay not_authorized and required before post."));
      }
      if (!slot.botDeepLink || !BOT_DEEP_LINK_RE.test(slot.botDeepLink)) {
        problems.push(toProblem(id, "Bot follow-up must use the official NexuAlphaAssistantBot deep link."));
      }
      const serializedSlot = JSON.stringify(slot);
      if (RAW_EXCHANGE_REGISTRATION_URL_RE.test(serializedSlot)) {
        problems.push(toProblem(id, "Slot contains a raw exchange registration URL."));
      }
      if (INVITE_CODE_RE.test(serializedSlot)) {
        problems.push(toProblem(id, "Slot contains invitation-code wording."));
      }
      if (POSITIVE_PROMISE_RE.test(serializedSlot)) {
        problems.push(toProblem(id, "Slot contains a prohibited guaranteed outcome claim."));
      }
    }
  }

  const combinedDocs = Object.entries(docs)
    .filter(([, text]) => typeof text === "string")
    .map(([name, text]) => `\n--- ${name} ---\n${text}`)
    .join("\n");
  if (RAW_EXCHANGE_REGISTRATION_URL_RE.test(combinedDocs)) {
    problems.push(toProblem("manual-pack-docs", "Manual pack docs contain a raw exchange registration URL."));
  }
  reviewCopyOrder(docs["copy-pack.md"], slots, problems);

  const campaigns = slots.map(({ slot }) => slot.campaign).filter(Boolean);
  const landingUrls = slots.map(({ slot }) => slot.canonicalLandingUrl || slot.onsiteUrl).filter(Boolean);

  return {
    audit: "telegram_manual_publish_pack",
    packDir: resolvedPackDir,
    generatedAt: new Date().toISOString(),
    waveLabel,
    expectedSlots,
    status: problems.length ? "NEEDS_REVIEW" : "PASS",
    noTelegramApiCall: payload?.noTelegramApiCall === true || payload?.distributionPolicy?.noTelegramApiCall === true,
    totals: {
      days: Array.isArray(payload?.queue) ? payload.queue.length : 0,
      slots: slots.length,
      campaigns: campaigns.length,
      nexuAlphaLandingUrls: landingUrls.filter((url) => url.startsWith(`${NEXUALPHA_ORIGIN}/`)).length,
    },
    requiredDocs: TELEGRAM_PACK_REQUIRED_DOCS,
    missingDocs,
    requiredParams: TELEGRAM_PACK_REQUIRED_PARAMS,
    anonymousMetricWindows: TELEGRAM_ANONYMOUS_METRIC_WINDOWS,
    campaigns,
    selectedIds: payload?.selectedIds || slots.map(({ slot }) => slot.itemId).filter(Boolean),
    problems,
    limitations: [
      "No Telegram API call was made; this is a local pre-publication audit only.",
      "It verifies NexuAlpha-first links, UTM shape, anonymous metric templates and copy-pack order; it does not prove traffic, registrations or conversions.",
      "HTTP 200 and Search Console panels still require a separate live/visible check before any human publication.",
    ],
  };
}

export function renderTelegramManualPackAuditMarkdown(result) {
  const problemLines = result.problems.length
    ? result.problems.map((problem) => `- ${problem.scope}: ${problem.message}`)
    : ["- None; local pack structure passed the offline audit."];

  return [
    `# ${result.waveLabel} Telegram manual pack audit`,
    "",
    `Status: ${result.status}`,
    `Pack: ${path.relative(projectRoot, result.packDir)}`,
    `Generated at: ${result.generatedAt}`,
    "",
    "## What was checked",
    "",
    `- ${result.totals.slots} ${result.waveLabel} draft slots across ${result.totals.days} queue days.`,
    `- ${result.totals.nexuAlphaLandingUrls} NexuAlpha landing URLs, all expected to be first before Bot handoff.`,
    `- Required UTM/context params: ${result.requiredParams.join(", ")}.`,
    "- Manual publish docs: queue, copy pack, preflight, attribution guide, post log and weekly review template.",
    "- Anonymous 24h/7d metric fields only; no user IDs, exchange account IDs, private commission terms or raw registration links.",
    "",
    "## Campaigns",
    "",
    ...result.campaigns.map((campaign) => `- ${campaign}`),
    "",
    "## Problems",
    "",
    ...problemLines,
    "",
    "## Limits",
    "",
    ...result.limitations.map((item) => `- ${item}`),
    "",
  ].join("\n");
}

export async function writeTelegramManualPackAudit({
  packDir = DEFAULT_WAVE15_PACK_DIR,
  output = DEFAULT_WAVE15_AUDIT_JSON,
  markdown = DEFAULT_WAVE15_AUDIT_MARKDOWN,
  waveLabel = DEFAULT_TELEGRAM_PACK_WAVE_LABEL,
  expectedSlots = DEFAULT_TELEGRAM_PACK_EXPECTED_SLOTS,
} = {}) {
  const result = await auditTelegramManualPack({ packDir, waveLabel, expectedSlots });
  if (output) {
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  if (markdown) {
    await fs.mkdir(path.dirname(markdown), { recursive: true });
    await fs.writeFile(markdown, renderTelegramManualPackAuditMarkdown(result), "utf8");
  }
  return result;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write("Usage: node scripts/audit-telegram-manual-pack.mjs [--pack-dir DIR] [--output FILE] [--markdown FILE] [--wave-label LABEL] [--expected-slots N]\n");
    return;
  }
  const result = await writeTelegramManualPackAudit(options);
  process.stdout.write(`Telegram manual pack audit: ${result.status}\n`);
  process.stdout.write(`Slots: ${result.totals.slots}; NexuAlpha landing URLs: ${result.totals.nexuAlphaLandingUrls}\n`);
  if (result.problems.length) {
    process.stdout.write(result.problems.map((problem) => `- ${problem.scope}: ${problem.message}`).join("\n"));
    process.stdout.write("\n");
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
