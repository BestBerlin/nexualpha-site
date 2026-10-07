import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbidden = /https?:\/\/|partner\.bitget|bsmkweb|topzhjdgxcb|11350287|nexu888|LUCKX|guaranteed|approved by FCA|best UK exchange/i;

async function render() {
  const dir = await mkdtemp(path.join(root, "tests/.tmp-r18-depth-"));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketDecisionDepth } from "../../src/components/v3/international/RegionalMarketDecisionDepth.jsx";
      console.log(JSON.stringify({
        eu: renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "EU" })),
        uk: renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "UK" })),
        br: renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "BR" })),
        jp: renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "JP" })),
        kr: renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "KR" })),
        sg: renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "SG" })),
        tr: renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "TR" })),
      }));
    `);
    const esbuild = path.join(root, "node_modules/.bin/esbuild");
    await access(esbuild);
    execFileSync(esbuild, [entry, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundle}`, "--loader:.css=empty", "--log-level=warning"], { cwd: root });
    return JSON.parse(execFileSync("node", [bundle], { cwd: root, encoding: "utf8" }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("R18 EU and UK decision depth renders only on owner-market pages", async () => {
  const html = await render();
  assert.match(html.eu, /data-regional-decision-depth="EU"/);
  assert.match(html.eu, /France and Germany are evidence signals/);
  assert.match(html.eu, /source-pending/);
  assert.match(html.eu, /SEPA \/ bank/);
  assert.match(html.uk, /data-regional-decision-depth="UK"/);
  assert.match(html.uk, /Four checks before treating a UK account route as ready/);
  assert.match(html.uk, /FCA \/ service entity/);
  assert.match(html.uk, /GBP funding \+ bank-name \/ deposit-withdrawal/);
  assert.doesNotMatch(`${html.eu}\n${html.uk}`, forbidden);
});

test("R37 BR, JP, KR, SG and TR decision depth gives localized payment, identity, cost and product boundaries", async () => {
  const html = await render();
  assert.match(html.br, /data-regional-decision-depth="BR"/);
  assert.match(html.br, /CHECKLIST BRASIL ANTES DO CADASTRO/);
  assert.match(html.br, /Pix|TED|BRL bank transfer/);
  assert.match(html.br, /CPF|CNPJ|titularidade bancária/);
  assert.match(html.br, /Custos e prazos/);
  assert.match(html.br, /Banco Central do Brasil/);

  assert.match(html.jp, /data-regional-decision-depth="JP"/);
  assert.match(html.jp, /FSA登録、本人確認、JPY入金、商品範囲/);
  assert.match(html.jp, /本人名義の登録銀行口座/);
  assert.match(html.jp, /手数料と反映時間/);
  assert.match(html.jp, /日本の金融庁と公式プラットフォーム資料/);

  assert.match(html.kr, /data-regional-decision-depth="KR"/);
  assert.match(html.kr, /규제 맥락, 본인확인, KRW 실명계좌/);
  assert.match(html.kr, /실명 은행계좌/);
  assert.match(html.kr, /수수료와 처리 시간/);
  assert.match(html.kr, /한국 금융위원회, 금융정보분석원 및 공식 플랫폼 자료/);

  assert.match(html.sg, /data-regional-decision-depth="SG"/);
  assert.match(html.sg, /MAS context, identity, SGD rails and product scope/);
  assert.match(html.sg, /PayNow or FAST/);
  assert.match(html.sg, /Fees and timing/);
  assert.match(html.sg, /Monetary Authority of Singapore/);

  assert.match(html.tr, /data-regional-decision-depth="TR"/);
  assert.match(html.tr, /SPK listesi, tasfiye durumu, kimlik, TRY/);
  assert.match(html.tr, /Bitget Teknoloji AŞ/);
  assert.match(html.tr, /Ücret ve işlem süresi/);
  assert.match(html.tr, /Türkiye Sermaye Piyasası Kurulu \(SPK\) ve resmi platform kaynakları/);

  assert.doesNotMatch(`${html.br}\n${html.jp}\n${html.kr}\n${html.sg}\n${html.tr}`, forbidden);
});

test("R18 depth keeps UK detail and EU table compact on mobile", async () => {
  const css = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../src/components/v3/international/regional-market-decision-depth.css", import.meta.url), "utf8"));
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /regional-decision-depth__steps[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /regional-decision-depth__grid[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /regional-decision-depth table[\s\S]*display: block/);
});

test("regional funding depth keeps long evidence behind a native disclosure", async () => {
  const html = await render();
  const css = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../src/components/v3/international/regional-market-decision-depth.css", import.meta.url), "utf8"));

  for (const market of ["BR", "JP", "KR", "SG", "TR"]) {
    assert.match(html[market.toLowerCase()], /class="regional-decision-depth__evidence"/, `${market} evidence disclosure should render`);
    assert.match(html[market.toLowerCase()], /<summary><span><strong>/, `${market} disclosure has a readable summary`);
  }
  assert.match(css, /\.regional-decision-depth__evidence > summary[\s\S]*min-height: 44px;/);
  assert.match(css, /\.regional-decision-depth__evidence > summary:focus-visible/);
  assert.match(css, /\.regional-decision-depth__evidence\[open\] > summary b/);
});
