import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { costDecisionCopy } from "../src/data/cost-decision-copy.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const feeBenchmark = await read("src/components/v3/FeeBenchmarkTerminal.jsx");
const costDecision = await read("src/components/v3/CostDecision.jsx");
const telegramHub = await read("src/components/v3/TelegramBotHub.jsx");
const onchainBoard = await read("src/components/v3/OnChainLiquidityBoard.jsx");

test("rates route owns Spanish and Brazilian Portuguese decision copy", () => {
  assert.match(feeBenchmark, /copy\.es = \{ \.\.\.copy\.en,[\s\S]*Comparador de comisiones publicadas y slippage/);
  assert.match(feeBenchmark, /copy\["pt-BR"\] = \{ \.\.\.copy\.en,[\s\S]*Comparador de taxas publicadas e slippage/);
  assert.match(feeBenchmark, /Fuente pendiente de revisión/);
  assert.match(feeBenchmark, /Fonte pendente de revisão/);
  assert.match(feeBenchmark, /Verificación oficial pendiente/);
  assert.match(feeBenchmark, /Verificação oficial pendente/);
  assert.match(feeBenchmark, /Verificar elegibilidad/);
  assert.match(feeBenchmark, /Verificar elegibilidade/);
  assert.match(feeBenchmark, /Ver las \$\{total\} plataformas/);
  assert.match(feeBenchmark, /Ver todas as \$\{total\} plataformas/);
});

test("rates cost calculator localizes Spanish and Brazilian Portuguese visible controls and states", () => {
  const es = costDecisionCopy("es");
  const pt = costDecisionCopy("pt-BR");
  assert.equal(es.eyebrow, "Calcular coste de trading");
  assert.equal(es.pending, "Fuente pendiente de revisión");
  assert.equal(es.verify, "Verificar elegibilidad regional primero");
  assert.match(es.compare, /Comparar elegibilidad de Binance y OKX/);
  assert.equal(pt.eyebrow, "Calcular custo de trading");
  assert.equal(pt.pending, "Fonte pendente de revisão");
  assert.equal(pt.verify, "Verificar elegibilidade regional primeiro");
  assert.match(pt.compare, /Comparar elegibilidade de Binance e OKX/);
  assert.deepEqual(costDecisionCopy("es-MX"), es);
  assert.match(costDecision, /costDecisionCopy\(locale\)/);
});

test("telegram priority locales do not fall back to English for visible inbound and review sections", () => {
  for (const [locale, expected] of [
    ["ja", "53件の研究経路はBotの前にNexuAlphaページへ戻します"],
    ["ko", "검토된 경로 53개는 Bot 전에 NexuAlpha 페이지로 보냅니다"],
    ["tr", "53 incelenen araştırma yolu Bot'tan önce NexuAlpha sayfasına döner"],
    ["es", "53 borradores llevan a NexuAlpha antes del Bot"],
  ]) {
    assert.match(telegramHub, new RegExp(`${locale}: \\{[\\s\\S]*${expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `${locale} inbound title`);
  }

  for (const phrase of [
    "수동 게시 전 NexuAlpha 우선 링크",
    "Manuel paylaşım öncesi NexuAlpha bağlantısının ilk sırada olduğunu",
    "Comunidad de traders NexuAlpha",
  ]) {
    assert.match(telegramHub, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  const priorityVisibleCopy = telegramHub.slice(telegramHub.indexOf("ja: {", telegramHub.indexOf("inboundBadge: \"サイト内回答を優先\"")), telegramHub.indexOf("es: {", telegramHub.indexOf("inboundBadge: \"RESPUESTA PRIMERO EN EL SITIO\"")));
  assert.doesNotMatch(priorityVisibleCopy, /WAVE14|NexuAlpha-first|landing|drafts|taslak|초안|草稿/);
});

test("onchain body renders each localized checklist title once", () => {
  assert.doesNotMatch(onchainBoard, /<h2>\{t\.checksTitle\}<\/h2>\s*<h2>\{t\.checksTitle\}<\/h2>/);
});
