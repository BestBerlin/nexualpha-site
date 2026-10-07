#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TELEGRAM_CONFIG,
  TELEGRAM_WEEK1_RETENTION_LOOP,
  buildTelegramWebsiteFunnelContext,
  getTelegramDeepLink,
  resolveTelegramWebsiteStartPayloadRuntime,
} from "../src/data/telegram-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

export const DEFAULT_TELEGRAM_PROTOCOL_REPLAY_JSON = path.join(
  projectRoot,
  "docs/evidence/telegram-protocol-replay-20260928.json",
);
export const DEFAULT_TELEGRAM_PROTOCOL_REPLAY_MARKDOWN = path.join(
  projectRoot,
  "docs/evidence/telegram-protocol-replay-20260928.md",
);

export const TELEGRAM_PROTOCOL_COMMAND_SEQUENCE = Object.freeze([
  { command: "/choice save", phase: "choice_save" },
  { command: "/choice view", phase: "choice_view" },
  { command: "/choice change", phase: "choice_change" },
  { command: "/choice clear", phase: "choice_clear" },
  { command: "/stop", phase: "stop" },
  { command: "/delete", phase: "delete" },
]);

const RAW_EXCHANGE_REGISTRATION_URL_RE =
  /(accounts\.binance\.com|binance\.com\/(?:join|register|ref)|bsmkweb\.cc|partner\.bitget|bitget\.com\/(?:expressly|register|referral|signup)|okx\.com\/(?:join|register|referral)|topzhjdgxcb\.net|backpack\.exchange\/join|bybit\.com\/(?:invite|register|sign-up|signup)|bingx\.com\/(?:invite|register)|gate\.io\/(?:signup|ref)|mexc\.com\/(?:register|invite)|kucoin\.com\/(?:r|ucenter\/signup))/i;
const INVITE_CODE_RE =
  /\b(?:11350287|nexu888|luckybitcoin|LUCKX|CANDY007|INS898|1836370407|NEXU888|invite\s*code|referral\s*code|邀请码|邀請碼)\b/i;
const PRIVATE_OUTCOME_RE =
  /\b(?:registration|kyc|deposit|firstTrade|rebateActivation|privateCommission|commission payout|commission rate)\s*:\s*(?:true|[1-9]\d*)\b/i;

function parseArgs(argv) {
  const options = {
    output: DEFAULT_TELEGRAM_PROTOCOL_REPLAY_JSON,
    markdown: DEFAULT_TELEGRAM_PROTOCOL_REPLAY_MARKDOWN,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output") options.output = path.resolve(argv[++index]);
    else if (arg === "--markdown") options.markdown = path.resolve(argv[++index]);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function cloneState() {
  return {
    savedChoice: null,
    subscriptionState: "off_until_explicit_opt_in",
    deletionState: "active_local_simulation",
    realUserDataTouched: false,
    telegramApiCalls: 0,
    telegramMessagesSent: 0,
  };
}

function scenarioToFunnelContext(scenario) {
  const firstVenue = scenario.candidateVenues[0];
  if (scenario.botIntent === "compare") {
    return buildTelegramWebsiteFunnelContext({
      intent: "compare",
      pair: String(scenario.onsiteReturnHref).match(/\/compare\/([^?]+)/)?.[1] || "hyperliquid-vs-dydx",
      market: scenario.market,
      locale: scenario.locale,
      product: scenario.product,
      campaign: scenario.botDeepLinkAction?.campaign,
    });
  }

  return buildTelegramWebsiteFunnelContext({
    intent: scenario.botIntent === "verify_domain" ? "monitor" : "selected",
    venue: firstVenue,
    market: scenario.market,
    locale: scenario.locale,
    product: scenario.product,
    campaign: scenario.botDeepLinkAction?.campaign,
  });
}

function visibleState(state) {
  return {
    savedChoice: state.savedChoice
      ? {
          venue: state.savedChoice.venue,
          market: state.savedChoice.market,
          locale: state.savedChoice.locale,
          product: state.savedChoice.product,
          onsiteReturnHref: state.savedChoice.onsiteReturnHref,
        }
      : null,
    subscriptionState: state.subscriptionState,
    deletionState: state.deletionState,
    realUserDataTouched: state.realUserDataTouched,
    telegramApiCalls: state.telegramApiCalls,
    telegramMessagesSent: state.telegramMessagesSent,
  };
}

function applyProtocolStep(state, scenario, step) {
  const next = { ...state };
  const firstVenue = scenario.candidateVenues[0];
  const alternateVenue = scenario.candidateVenues[1] || firstVenue;

  if (step.phase === "choice_save") {
    next.savedChoice = {
      venue: firstVenue,
      market: scenario.market,
      locale: scenario.locale,
      product: scenario.product,
      candidateVenues: [...scenario.candidateVenues],
      onsiteReturnHref: scenario.onsiteReturnHref,
      returnFunnel: scenarioToFunnelContext(scenario),
    };
  } else if (step.phase === "choice_view") {
    // Local read-only view. State intentionally does not change.
  } else if (step.phase === "choice_change") {
    next.savedChoice = {
      ...(next.savedChoice || {}),
      venue: alternateVenue,
      market: scenario.market,
      locale: scenario.locale,
      product: scenario.product,
      candidateVenues: [...scenario.candidateVenues],
      onsiteReturnHref: scenario.onsiteReturnHref,
      returnFunnel: buildTelegramWebsiteFunnelContext({
        intent: "selected",
        venue: alternateVenue,
        market: scenario.market,
        locale: scenario.locale,
        product: scenario.product,
        campaign: scenario.botDeepLinkAction?.campaign,
      }),
    };
  } else if (step.phase === "choice_clear") {
    next.savedChoice = null;
  } else if (step.phase === "stop") {
    next.subscriptionState = "off_after_local_stop_replay";
  } else if (step.phase === "delete") {
    next.savedChoice = null;
    next.subscriptionState = "off_after_local_delete_replay";
    next.deletionState = "local_simulation_deleted";
  }

  return {
    command: step.command,
    phase: step.phase,
    mode: "local_protocol_replay_only",
    before: visibleState(state),
    after: visibleState(next),
    boundary:
      "This step simulates protocol state only; it does not call Telegram, send messages, operate a real account, or write real user data.",
    stillRequiresRealAccountConfirmation: ["/stop", "/delete"].includes(step.command)
      ? "Human-visible Telegram confirmation is still required before representing live unsubscribe or deletion behavior."
      : "Real Bot UI copy and callback rendering still require a human-visible account check before promotion.",
    nextState: next,
  };
}

function replayScenario(scenario) {
  const initialState = cloneState();
  const botDeepLink = getTelegramDeepLink(scenario.botDeepLinkAction);
  const funnelContext = scenarioToFunnelContext(scenario);
  const runtimeReturn = resolveTelegramWebsiteStartPayloadRuntime(`/start ${funnelContext.startPayload}`, {
    market: scenario.market,
    locale: scenario.locale,
    product: scenario.product,
    source: "local_protocol_replay",
  });
  const steps = [];
  let state = initialState;

  for (const command of TELEGRAM_PROTOCOL_COMMAND_SEQUENCE) {
    const result = applyProtocolStep(state, scenario, command);
    state = result.nextState;
    delete result.nextState;
    steps.push(result);
  }

  return {
    id: scenario.id,
    market: scenario.market,
    locale: scenario.locale,
    product: scenario.product,
    botIntent: scenario.botIntent,
    candidateVenues: [...scenario.candidateVenues],
    botStartDeepLink: botDeepLink,
    botStartPayload: new URL(botDeepLink).searchParams.get("start"),
    firstOnsiteReturnHref: scenario.onsiteReturnHref,
    generatedReturnHref: funnelContext.returnHref,
    generatedStartPayload: funnelContext.startPayload,
    generatedDeepLink: funnelContext.deepLink,
    runtimeReturnHref: runtimeReturn.href,
    runtimeReturnStatus: runtimeReturn.status,
    runtimeReplyKind: runtimeReturn.safeReply.kind,
    commandReplay: steps,
    finalState: visibleState(state),
    localAcceptance: {
      firstHopIsNexuAlphaOnsite: scenario.onsiteReturnHref.startsWith("/") && !scenario.onsiteReturnHref.startsWith("//"),
      runtimeReturnIsNexuAlphaOnsite: runtimeReturn.href.startsWith("/") && !runtimeReturn.href.startsWith("//"),
      subscriptionDefaultsOff: scenario.subscriptionState === "off_until_explicit_opt_in",
      protectedCommandsRemainRepresentational: true,
      rawInviteMaterialExposed: false,
      realUserDataTouched: false,
      telegramApiCalls: 0,
      telegramMessagesSent: 0,
    },
  };
}

function reviewProtectedBoundaries(payload) {
  const serialized = JSON.stringify(payload);
  const problems = [];
  if (RAW_EXCHANGE_REGISTRATION_URL_RE.test(serialized)) {
    problems.push("Replay evidence contains a raw exchange registration URL or partner invite host.");
  }
  if (INVITE_CODE_RE.test(serialized)) {
    problems.push("Replay evidence contains an invitation or referral code.");
  }
  if (PRIVATE_OUTCOME_RE.test(serialized)) {
    problems.push("Replay evidence appears to claim a private conversion outcome.");
  }
  return problems;
}

export function runTelegramProtocolReplay({ generatedAt = new Date().toISOString() } = {}) {
  const scenarios = TELEGRAM_WEEK1_RETENTION_LOOP.scenarioMatrix.map(replayScenario);
  const result = {
    review: "telegram_protocol_local_replay",
    generatedAt,
    status: "PASS_LOCAL_PROTOCOL_REPLAY",
    telegramSurface: {
      botUsername: TELEGRAM_CONFIG.botUsername,
      channelUsername: TELEGRAM_CONFIG.channelUsername,
      groupUsername: TELEGRAM_CONFIG.groupUsername,
    },
    scope: {
      telegramApiCalls: 0,
      telegramMessagesSent: 0,
      realAccountsOperated: 0,
      realUserDataTouched: false,
      externalSubmissions: 0,
      partnerRegistryEdited: false,
      protectedUserCommandsExecuted: [],
      simulatedCommands: TELEGRAM_PROTOCOL_COMMAND_SEQUENCE.map((step) => step.command),
    },
    contract: {
      source: "src/data/telegram-config.js#TELEGRAM_WEEK1_RETENTION_LOOP",
      scenarioCount: scenarios.length,
      commandPhases: TELEGRAM_PROTOCOL_COMMAND_SEQUENCE.map((step) => step.phase),
      requiredContextFields: [...TELEGRAM_WEEK1_RETENTION_LOOP.requiredContextFields],
      firstHopPolicy: "NexuAlpha onsite route before Bot follow-up or exchange handoff",
      subscriptionDefault: "off_until_explicit_opt_in",
    },
    scenarios,
    stillRequiresRealAccountConfirmation: [
      "Live Telegram Bot rendering for /choice save, /choice view, /choice change and /choice clear.",
      "Live /stop unsubscribe behavior inside a real Telegram account.",
      "Live /delete account-data deletion behavior inside a real Telegram account.",
      "Any human publication to channel or group surfaces.",
    ],
    limitations: [
      "This replay proves only the local protocol state machine and URL/context boundaries.",
      "It does not prove Telegram delivery, Telegram UI callbacks, traffic, registrations, KYC, deposits, trades, rebate activation or commission.",
      "Partner invitation links and invite codes remain protected and are not inspected, emitted or changed by this replay.",
    ],
  };
  const problems = reviewProtectedBoundaries(result);
  if (problems.length) {
    result.status = "NEEDS_REVIEW";
    result.problems = problems;
  } else {
    result.problems = [];
  }
  return result;
}

export function renderTelegramProtocolReplayMarkdown(result) {
  const lines = [
    "# Telegram protocol local replay",
    "",
    `Generated: ${result.generatedAt}`,
    `Status: ${result.status}`,
    "",
    "## Scope",
    "",
    `- Telegram API calls: **${result.scope.telegramApiCalls}**`,
    `- Telegram messages sent: **${result.scope.telegramMessagesSent}**`,
    `- Real accounts operated: **${result.scope.realAccountsOperated}**`,
    `- Real user data touched: **${result.scope.realUserDataTouched ? "yes" : "no"}**`,
    `- Partner registry edited: **${result.scope.partnerRegistryEdited ? "yes" : "no"}**`,
    `- Protected user commands executed: **${result.scope.protectedUserCommandsExecuted.length}**`,
    "",
    "## Covered Command States",
    "",
    "| Command | State phase | Local replay only |",
    "| --- | --- | --- |",
    ...TELEGRAM_PROTOCOL_COMMAND_SEQUENCE.map((step) => `| \`${step.command}\` | \`${step.phase}\` | yes |`),
    "",
    "## Scenario Results",
    "",
    "| Scenario | Market | Locale | Product | First onsite return | Final state |",
    "| --- | --- | --- | --- | --- | --- |",
    ...result.scenarios.map((scenario) => {
      const finalState = scenario.finalState.deletionState;
      return `| \`${scenario.id}\` | ${scenario.market} | ${scenario.locale} | ${scenario.product} | \`${scenario.firstOnsiteReturnHref}\` | \`${finalState}\` |`;
    }),
    "",
    "## Still Requires Real Account Confirmation",
    "",
    ...result.stillRequiresRealAccountConfirmation.map((item) => `- ${item}`),
    "",
    "## Limitations",
    "",
    ...result.limitations.map((item) => `- ${item}`),
  ];

  if (result.problems.length) {
    lines.push("", "## Problems", "", ...result.problems.map((problem) => `- ${problem}`));
  }

  return `${lines.join("\n")}\n`;
}

export async function writeTelegramProtocolReplay({
  output = DEFAULT_TELEGRAM_PROTOCOL_REPLAY_JSON,
  markdown = DEFAULT_TELEGRAM_PROTOCOL_REPLAY_MARKDOWN,
  generatedAt,
} = {}) {
  const result = runTelegramProtocolReplay({ generatedAt });
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  if (markdown) {
    await fs.mkdir(path.dirname(markdown), { recursive: true });
    await fs.writeFile(markdown, renderTelegramProtocolReplayMarkdown(result), "utf8");
  }
  return result;
}

function printHelp() {
  console.log(`Usage: node scripts/replay-telegram-protocol.mjs [--output file] [--markdown file]

Runs a local-only Telegram protocol replay. It does not call Telegram, send
messages, operate a real account, write user data or edit partner links.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
  } else {
    writeTelegramProtocolReplay(options)
      .then((result) => {
        console.log(`${result.status}: ${result.scenarios.length} scenarios, ${result.scope.simulatedCommands.length} local command states`);
        if (result.problems.length) process.exitCode = 1;
      })
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}
