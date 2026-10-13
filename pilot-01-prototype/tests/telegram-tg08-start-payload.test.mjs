import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function loadTelegramBotHub() {
  const code = buildSync({
    stdin: { contents: "export { TelegramBotHub } from './src/components/v3/TelegramBotHub.jsx';", resolveDir: projectRoot, loader: "jsx" },
    bundle: true,
    write: false,
    format: "cjs",
    platform: "node",
    external: ["react", "react/jsx-runtime"],
    loader: { ".css": "empty" },
  }).outputFiles[0].text;
  const module = { exports: {} };
  const jsx = (type, props, key) => React.createElement(type, key === undefined ? props : { ...props, key });
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => name === "react/jsx-runtime" ? { jsx, jsxs: jsx, Fragment: React.Fragment } : require(name),
    console,
    URL,
    URLSearchParams,
    Intl,
    setTimeout,
    clearTimeout,
  });
  return module.exports.TelegramBotHub;
}

function botHrefs(props) {
  const TelegramBotHub = loadTelegramBotHub();
  const html = renderToStaticMarkup(React.createElement(TelegramBotHub, props));
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((href) => href.startsWith("https://t.me/NexuAlphaAssistantBot"));
}

test("TG-08 hub topic deep links use actual page context instead of BR/Binance defaults", () => {
  const contextual = botHrefs({ locale: "en", headingLevel: 1, market: "KR", product: "perp" }).join("\n");
  assert.match(contextual, /start=fee_calc_general_m_KR_l_en_t_perp/);
  assert.match(contextual, /start=partner_desk_m_KR_l_en_t_perp/);
  assert.doesNotMatch(contextual, /fee_calc_binance|partner_desk_m_BR_l_ptBR_t_spot/);

  const localeOnly = botHrefs({ locale: "pt-BR", headingLevel: 1 }).join("\n");
  assert.match(localeOnly, /start=fee_calc_general_l_ptBR/);
  assert.match(localeOnly, /start=partner_desk_l_ptBR/);
  const tg08TopicLinks = localeOnly.split("\n").filter((href) => /start=(fee_calc_general|partner_desk)/.test(href)).join("\n");
  assert.doesNotMatch(tg08TopicLinks, /_m_BR|_t_spot|fee_calc_binance/);
});
