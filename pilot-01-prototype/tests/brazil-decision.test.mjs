import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DECISION_STORAGE_KEY,
  browserSessionStorage,
  costEstimate,
  decisionStateFromSearch,
  decisionStateFromUrl,
  loadDecisionState,
  normalizeDecisionState,
  saveDecisionState,
  writeDecisionStateToUrl,
} from "../src/data/decision-state.js";
import { regionalVenueCta, publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { getPartner } from "../src/data/partner-registry.js";
import { publicCtaForVenue as basePublicCtaForVenue } from "../src/data/public-cta.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const brazilPageSource = await readFile(new URL("../src/components/v3/international/BrazilDecisionPage.jsx", import.meta.url), "utf8");
const brazilCss = await readFile(new URL("../src/components/v3/international/brazil-decision-page.css", import.meta.url), "utf8");

async function renderBrazilPage(pathname = "/br", search = "?locale=pt-BR&market=BR&product=spot") {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-brazil-decision-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { BrazilDecisionPage } from "../../src/components/v3/international/BrazilDecisionPage.jsx";

      const html = renderToStaticMarkup(React.createElement(BrazilDecisionPage, {
        pathname: ${JSON.stringify(pathname)},
        initialUrl: "https://nexualpha.com${pathname}${search}",
        locale: "pt-BR",
        trackGrowthDecision: () => {},
      }));
      console.log(html);
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function registrationAnchors(html) {
  return [...html.matchAll(/<a\b(?=[^>]*data-cta-kind="registration")[^>]*>/g)].map((match) => match[0]);
}

test("Brazil decision state keeps only safe URL values", () => {
  const state = decisionStateFromSearch("?market=Brazil&product=invalid&platform=evil&amount=2500.456&spot_fee_bps=12.345&deposit_fee_pct=0.6&deposit_fixed_brl=-10&utm_source=https://evil.example");
  assert.deepEqual(state, {
    region: "OTHER",
    product: "unknown",
    platform: "",
    amount: 2500.46,
    spotFeeBps: 12.35,
    depositFeePercent: 0.6,
    depositFixedBrl: 0,
    source: "",
    medium: "",
    campaign: "",
    publisher: "",
    accountStage: "",
    funding: "",
  });
});

test("safe tracking source accepts public source tokens", () => {
  assert.equal(decisionStateFromSearch("?utm_source=embed_widget").source, "embed_widget");
  assert.equal(decisionStateFromSearch("?utm_source=creator.br-01").source, "creator.br-01");
  assert.equal(decisionStateFromSearch("?utm_source=https://evil.example/private").source, "");
});

test("URL state has priority and omits defaults when shared", () => {
  const state = decisionStateFromUrl("https://nexualpha.com/br?market=TW&product=spot&platform=binance&amount=3000&utm_source=creator&uid=secret@example.com&publisher=site_a");
  assert.equal(state.region, "TW");
  assert.equal(state.platform, "binance");
  assert.equal(writeDecisionStateToUrl("/br/comparar?locale=pt-BR&uid=secret@example.com", state), "/br/comparar?locale=pt-BR&market=TW&product=spot&platform=binance&amount=3000&spot_fee_bps=10&deposit_fee_pct=0&deposit_fixed_brl=0&utm_source=creator&publisher=site_a");
});

test("Brazil URL state strips unsupported UI locale parameters during client fallback", () => {
  const state = decisionStateFromUrl("https://nexualpha.com/br?locale=ja&market=BR&product=spot&utm_source=creator");
  assert.equal(
    writeDecisionStateToUrl("/br?locale=ja&market=BR&utm_source=creator", state),
    "/br?market=BR&product=spot&amount=1000&spot_fee_bps=10&deposit_fee_pct=0&deposit_fixed_brl=0&utm_source=creator",
  );
  assert.equal(
    writeDecisionStateToUrl("/br/pix?locale=pt-BR&market=BR", state),
    "/br/pix?locale=pt-BR&market=BR&product=spot&amount=1000&spot_fee_bps=10&deposit_fee_pct=0&deposit_fixed_brl=0&utm_source=creator",
  );
});

test("session storage fallback is schema-versioned and blocked storage is harmless", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(saveDecisionState(storage, { region: "HK", amount: 99 }), true);
  assert.equal(JSON.parse(values.get(DECISION_STORAGE_KEY)).version, 1);
  assert.equal(loadDecisionState(storage).region, "HK");
  assert.deepEqual(loadDecisionState({ getItem() { throw new Error("denied"); } }), normalizeDecisionState());
  assert.equal(saveDecisionState({ setItem() { throw new Error("denied"); } }, { region: "BR" }), false);
  assert.equal(browserSessionStorage({ get sessionStorage() { throw new Error("denied"); } }), null);
});

test("cost estimate treats spot and deposit inputs as assumptions, not market quotes", () => {
  const estimate = costEstimate({ amount: 1000, spotFeeBps: 10, depositFeePercent: 0.2, depositFixedBrl: 1 });
  assert.equal(estimate.spotFee, 1);
  assert.equal(estimate.depositFee, 3);
  assert.equal(estimate.total, 4);
});


test("explicit URL amount remains authoritative over a prior session amount", () => {
  const stored = normalizeDecisionState({ amount: 1000, spotFeeBps: 10 });
  const fromUrl = decisionStateFromUrl("https://nexualpha.com/br/custos?market=BR&product=spot&amount=2500&spot_fee_bps=20&deposit_fee_pct=1&deposit_fixed_brl=3");
  assert.equal(stored.amount, 1000);
  assert.equal(fromUrl.amount, 2500);
  assert.equal(fromUrl.spotFeeBps, 20);
  assert.equal(fromUrl.depositFeePercent, 1);
  assert.equal(fromUrl.depositFixedBrl, 3);
});

test("Brazil selected platform surfaces protected registration confirmation inside the first decision panel", () => {
  const panel = brazilPageSource.slice(
    brazilPageSource.indexOf('className="br-decision-panel"'),
    brazilPageSource.indexOf('<BrazilDecisionPath', brazilPageSource.indexOf('className="br-decision-panel"'))
  );
  assert.match(brazilPageSource, /regionalVenueCta\(state\.platform, pageLocale, state\.region, state\.product\)/);
  assert.match(panel, /className="br-selected-registration-confirm"/);
  assert.match(panel, /href=\{activeRegionalCta\.ctaHref\}/);
  assert.match(panel, /rel="sponsored noopener noreferrer"/);
  assert.match(panel, /data-cta-placement="brazil-selected-registration-confirm"/);
  assert.match(brazilCss, /\.br-selected-registration-confirm\s*\{/);
});

test("Brazil first viewport registration step keeps stable CTA instrumentation", () => {
  const pathBlock = brazilPageSource.slice(
    brazilPageSource.indexOf("function BrazilDecisionPath"),
    brazilPageSource.indexOf("export function BrazilEntryLink", brazilPageSource.indexOf("function BrazilDecisionPath"))
  );
  assert.match(pathBlock, /const ctaHref = finalHref;/);
  assert.match(pathBlock, /href=\{ctaHref\}/);
  assert.match(pathBlock, /data-cta-placement="brazil-first-viewport-register"/);
  assert.doesNotMatch(pathBlock, /data-cta-placement=\{finalKind === "registration"/);
});

test("Brazil local pages render one compact stateful four-step CTA chain plus evidence entries", () => {
  assert.match(brazilPageSource, /function BrazilDecisionChain\(\{ page, state, pageLocale, onDecision \}\)/);
  assert.match(brazilPageSource, /BRAZIL_DECISION_CHAIN\.map/);
  assert.match(brazilPageSource, /Rota principal · passo \{currentIndex \+ 1\} de \{items\.length\}/);
  assert.match(brazilPageSource, /BRAZIL_EVIDENCE_CHAIN\.map/);
  assert.match(brazilPageSource, /withBrazilState\(item\.path, state, pageLocale\)/);
  assert.match(brazilPageSource, /const primaryHref = next \? withBrazilState\(next\.path, state, pageLocale\) : platformReturnHref/);
  assert.match(brazilPageSource, /const platformReturnHref = `#br-shortlist-title`/);
  assert.match(brazilPageSource, /<BrazilDecisionChain page=\{page\} state=\{state\} pageLocale=\{pageLocale\} onDecision=\{emitDecision\} \/>/);
  assert.match(brazilCss, /\.br-chain__crumbs\s*\{[\s\S]*?grid-template-columns: repeat\(4/);
  assert.match(brazilCss, /\.br-chain__evidence\s*\{[\s\S]*?grid-template-columns: auto repeat\(3/);
  assert.match(brazilCss, /@media \(max-width: 560px\) \{[\s\S]*?\.br-chain__crumbs\s*\{[\s\S]*?overflow-x: auto;/);
  assert.match(brazilCss, /\.br-chain__crumbs li\s*\{[\s\S]*?flex: 0 0 72px;/);
});

test("Brazil early next step is compact, stateful, and bounded to two platforms", () => {
  assert.match(brazilPageSource, /function BrazilEarlyNextStep\(\{ venues, state, pageLocale, copy, onDecision \}\)/);
  assert.match(brazilPageSource, /earlyNextStepItems\(\{ venues, state, pageLocale \}\)/);
  assert.match(brazilPageSource, /selectVenues\(venues, state\.platform\)\.slice\(0, 2\)\.map/);
  assert.match(brazilPageSource, /const publicCta = publicCtaForVenue\(venue\.slug, pageLocale\)/);
  assert.match(brazilPageSource, /const regionalCta = regionalVenueCta\(venue\.slug, pageLocale, state\.region, state\.product\)/);
  assert.match(brazilPageSource, /primaryHref: canRegister \? regionalCta\.ctaHref : withBrazilPassport\(`\/exchanges\/\$\{venue\.slug\}#registration-path`, state, pageLocale\)/);
  assert.match(brazilPageSource, /compareHref: withBrazilState\("\/br\/comparar", state, pageLocale, venue\.slug\)/);
  assert.match(brazilPageSource, /const pixHref = withBrazilState\("\/br\/pix", state, pageLocale, items\[0\]\?\.venue\.slug \|\| state\.platform\)/);
  assert.match(brazilPageSource, /<BrazilEarlyNextStep[\s\S]*?venues=\{venues\}[\s\S]*?state=\{state\}/);
  assert.match(brazilCss, /\.br-early-next-step\s*\{/);
  assert.match(brazilCss, /\.br-early-next-step__items\s*\{[\s\S]*?grid-template-columns: repeat\(2/);
  assert.match(brazilCss, /@media \(max-width: 560px\) \{[\s\S]*?\.br-early-next-step__items,[\s\S]*?grid-template-columns: 1fr;/);
});

test("Brazil early next step SSR preserves projected CTA hrefs and BR spot context", async () => {
  const html = await renderBrazilPage("/br", "?locale=pt-BR&market=BR&product=spot");
  const start = html.indexOf('data-testid="brazil-early-next-step"');
  assert.ok(start > -1, "early next step rendered");
  const end = html.indexOf('class="br-answer', start);
  const block = html.slice(start, end);
  const items = [...block.matchAll(/data-testid="brazil-early-next-step-([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(items, ["binance", "okx"]);
  assert.ok(items.length <= 2);

  for (const slug of items) {
    const projected = regionalVenueCta(slug, "pt-BR", "BR", "spot");
    assert.equal(projected.direct, false);
    assert.equal(projected.ctaState, "verify");
    const anchor = block.match(new RegExp(`<a[^>]*data-cta-placement="brazil-early-next-step-${slug}"[^>]*>`))?.[0];
    assert.ok(anchor, slug);
    const href = anchor.match(/href="([^"]+)"/)?.[1].replaceAll("&amp;", "&");
    const actual = new URL(href, "https://nexualpha.com");
    const expected = new URL(projected.ctaHref, "https://nexualpha.com");
    assert.equal(actual.pathname, expected.pathname.replace(/^\/pt-br(?=\/)/, ""));
    assert.equal(actual.searchParams.get("locale"), "pt-BR");
    assert.equal(actual.hash, "#registration-path");
    assert.equal(actual.searchParams.get("market"), "BR");
    assert.equal(actual.searchParams.get("product"), "spot");
    assert.match(anchor, /data-cta-kind="research"/);
    assert.doesNotMatch(anchor, /target="_blank"/);
    assert.match(block, new RegExp(`href="\\/br\\/comparar\\?locale=pt-BR&amp;market=BR&amp;product=spot&amp;platform=${slug}`));
  }
  assert.match(block, /href="\/br\/pix\?locale=pt-BR&amp;market=BR&amp;product=spot&amp;platform=binance/);
  assert.match(block, /data-growth-market="BR"/);
  assert.match(block, /data-growth-product="spot"/);
});

test("R72 Brazil onsite chain preserves Telegram attribution across state and passport links", async () => {
  const attributionSearch = "?locale=pt-BR&market=BR&product=spot&utm_source=tg_channel&utm_medium=manual_draft&utm_campaign=r72_br_pix_ownership_check&uid=private@example.com";
  const html = await renderBrazilPage("/br", attributionSearch);

  for (const pattern of [
    /href="\/br\/comparar\?[^"]*utm_source=tg_channel[^"]*utm_medium=manual_draft[^"]*utm_campaign=r72_br_pix_ownership_check/,
    /href="\/br\/pix\?[^"]*utm_source=tg_channel[^"]*utm_medium=manual_draft[^"]*utm_campaign=r72_br_pix_ownership_check/,
    /href="\/exchanges\/binance\?[^"]*utm_source=tg_channel[^"]*utm_medium=manual_draft[^"]*utm_campaign=r72_br_pix_ownership_check[^"]*#registration-path/,
  ]) {
    assert.match(html, pattern);
  }

  assert.doesNotMatch(html, /href="\/\//);
  assert.doesNotMatch(html, /uid=private/);

  const compareHtml = await renderBrazilPage("/br/comparar", attributionSearch);
  assert.match(compareHtml, /href="\/rates\?[^"]*utm_source=tg_channel[^"]*utm_medium=manual_draft[^"]*utm_campaign=r72_br_pix_ownership_check/);
  assert.doesNotMatch(compareHtml, /href="\/\//);
  assert.doesNotMatch(compareHtml, /uid=private/);
});


test("R73 Brazil comparison page promotes shortlist after hero and keeps support content after it", async () => {
  const html = await renderBrazilPage("/br/comparar", "?locale=pt-BR&market=BR&product=spot");
  const hero = html.indexOf('class="br-hero v2-shell br-hero--comparison"');
  const shortlist = html.indexOf('class="br-shortlist v2-shell"');
  const answer = html.indexOf('class="br-answer v2-shell"');
  const early = html.indexOf('data-testid="brazil-early-next-step"');
  const chain = html.indexOf('class="br-chain v2-shell"');
  const telegram = html.indexOf('brazil-owner-telegram-handoff');
  const nextSteps = html.indexOf('class="br-next-steps v2-shell"');
  const support = html.indexOf('id="br-decision-rail-title"');

  assert.ok(hero > -1, "comparison hero gets scoped layout class");
  assert.ok(shortlist > hero, "shortlist moves directly after comparison hero");
  for (const [name, index] of Object.entries({ answer, early, chain, telegram, nextSteps, support })) {
    assert.ok(index > shortlist, `${name} remains after the promoted shortlist`);
  }
});

test("R73 Brazil comparison journey is a closed native disclosure without losing its links", async () => {
  const html = await renderBrazilPage("/br/comparar", "?locale=pt-BR&market=BR&product=spot&utm_source=tg_channel&utm_medium=manual_draft&utm_campaign=r73_layout");
  const match = html.match(/<details class="br-decision-path br-decision-path--disclosure"[\s\S]*?<\/details>/);
  assert.ok(match, "comparison journey renders as native details");
  const block = match[0];
  assert.doesNotMatch(block.slice(0, block.indexOf(">") + 1), / open(=|>| )/);
  assert.match(block, /<summary>Shortlist sugerido: Binance ou OKX<\/summary>/);
  assert.match(block, /href="\/br\/pix\?[^"]*utm_source=tg_channel[^"]*utm_medium=manual_draft[^"]*utm_campaign=r73_layout/);
  assert.match(block, /href="#br-shortlist-title"/);
});

test("R73 Brazil comparison cards use explicit short actions and preserve full account-condition help", async () => {
  const html = await renderBrazilPage("/br/comparar", "?locale=pt-BR&market=BR&product=spot");
  for (const slug of ["binance", "okx"]) {
    const card = html.match(new RegExp(`<article[^>]*data-testid="brazil-venue-${slug}"[\\s\\S]*?<\\/article>`))?.[0];
    assert.ok(card, slug);
    const venue = slug === "binance" ? "Binance" : "OKX";
    assert.match(card, new RegExp(`<button[^>]*aria-pressed="false"[^>]*>Selecionar ${venue}<\/button>`));
    assert.match(card, /<a[^>]*data-cta-kind="research"[^>]*>Verificar condições<\/a>/);
    assert.match(card, /<small class="br-venue-card__check-note">Confira domínio, KYC, moeda de depósito e elegibilidade antes de inserir dados\.<\/small>/);
  }
});

test("R73 Brazil comparison CSS scopes the vertical hero and responsive controls to comparar", () => {
  assert.match(brazilCss, /\.br-hero--comparison\s*\{[\s\S]*?grid-template-columns: 1fr;/);
  assert.match(brazilCss, /\.br-hero--comparison \.br-control-grid\s*\{[\s\S]*?grid-template-columns: 1fr;/);
  assert.match(brazilCss, /@media \(min-width: 1040px\) \{[\s\S]*?\.br-hero--comparison \.br-control-grid\s*\{[\s\S]*?grid-template-columns: repeat\(3, minmax\(220px, 1fr\)\)/);
  assert.match(brazilCss, /\.br-decision--comparison \.br-venue-card__actions button\[aria-pressed="true"\]/);
});

test("R73/R262 non-comparison Brazil pages expose precise shortlist actions, intact warning, and original section order", async () => {
  const html = await renderBrazilPage("/br", "?locale=pt-BR&market=BR&product=spot");
  const hero = html.indexOf('class="br-hero v2-shell"');
  const early = html.indexOf('data-testid="brazil-early-next-step"');
  const answer = html.indexOf('class="br-answer v2-shell"');
  const chain = html.indexOf('class="br-chain v2-shell"');
  const nextSteps = html.indexOf('class="br-next-steps v2-shell"');
  const shortlist = html.indexOf('class="br-shortlist v2-shell"');

  assert.ok(hero > -1);
  assert.ok(hero < answer && answer < shortlist && shortlist < early, "entry shortlist precedes supplementary recommendations");
  assert.ok(early < chain && chain < nextSteps, "all supporting routes retain their original relative sequence");

  const card = html.match(/<article[^>]*data-testid="brazil-venue-binance"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card);
  assert.match(card, /<button[^>]*aria-pressed="false"[^>]*>Escolher Binance<\/button>/);
  assert.match(card, /<a[^>]*data-cta-kind="research"[^>]*>Ver perfil e condições<\/a>/);
  assert.match(card, /<small class="br-venue-card__check-note">Confira domínio, KYC, moeda de depósito e elegibilidade antes de inserir dados\.<\/small>/);
  assert.equal(card.split("Confira domínio, KYC, moeda de depósito e elegibilidade antes de inserir dados.").length - 1, 1);
  assert.doesNotMatch(html, /br-decision--comparison/);
});

test("Brazil selected platform early next step renders only that platform", async () => {
  const html = await renderBrazilPage("/br", "?locale=pt-BR&market=BR&product=spot&platform=okx");
  const start = html.indexOf('data-testid="brazil-early-next-step"');
  const end = html.indexOf('class="br-answer', start);
  const block = html.slice(start, end);
  const items = [...block.matchAll(/data-testid="brazil-early-next-step-([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(items, ["okx"]);
  assert.match(block, /href="\/br\/comparar\?locale=pt-BR&amp;market=BR&amp;product=spot&amp;platform=okx/);
  assert.match(block, /href="\/br\/pix\?locale=pt-BR&amp;market=BR&amp;product=spot&amp;platform=okx/);
});

// The production component uses source-bound CTA projection: pending BR routes
// retain partner records but resolve to onsite verification, not external signup.
async function assertPendingBrazilRoutes(search, expectedPlatforms) {
  const html = await renderBrazilPage("/br", search);
  assert.equal(registrationAnchors(html).length, 0, "pending BR account eligibility cannot open external signup anywhere on the page");
  for (const platform of expectedPlatforms) {
    const card = html.match(new RegExp(`<article[^>]*data-testid="brazil-venue-${platform}"[\\s\\S]*?<\\/article>`))?.[0];
    assert.ok(card, platform);
    const anchor = card.match(/<a[^>]*data-cta-kind="research"[^>]*>/)?.[0];
    assert.ok(anchor, "shortlist retains an onsite action");
    const href = anchor.match(/href="([^"]+)"/)?.[1].replaceAll("&amp;", "&");
    const url = new URL(href, "https://nexualpha.com");
    assert.equal(url.origin, "https://nexualpha.com");
    assert.ok([`/exchanges/${platform}`, `/pt-br/exchanges/${platform}`].includes(url.pathname));
    assert.equal(url.hash, "#registration-path");
    assert.equal(url.searchParams.get("market"), "BR");
    assert.equal(url.searchParams.get("product"), "spot");
    assert.equal(url.searchParams.get("locale"), "pt-BR");
    assert.doesNotMatch(anchor, /target="_blank"|rel="sponsored/);
  }
  for (const platform of expectedPlatforms) {
    const projected = regionalVenueCta(platform, "pt-BR", "BR", "spot");
    assert.equal(projected.direct, false);
    const partner = getPartner(platform);
    const cta = publicCtaForVenue(platform, "pt-BR");
    assert.ok(partner.registrationUrl && partner.inviteCode);
    const base = basePublicCtaForVenue(platform, "pt-BR");
    assert.ok(base.registrationUrl && base.inviteCode);
    assert.equal(cta.registrationUrl, base.registrationUrl);
    assert.equal(cta.inviteCode, base.inviteCode);
    assert.ok(!html.includes(`href="${partner.registrationUrl.replaceAll("&", "&amp;")}"`));
  }
}

test("Brazil selected pending route preserves OKX context and its protected record without external signup", async () => {
  await assertPendingBrazilRoutes("?locale=pt-BR&market=BR&product=spot&platform=okx", ["okx"]);
});

test("Brazil default pending shortlist preserves both platform contexts and protected records onsite", async () => {
  await assertPendingBrazilRoutes("?locale=pt-BR&market=BR&product=spot", ["binance", "okx"]);
});

test("Brazil spot conversion only direct-registers Binance and OKX; other platform params fall back to global research", async () => {
  const html = await renderBrazilPage("/br", "?locale=pt-BR&market=BR&product=spot&platform=bybit");
  const panelStart = html.indexOf('id="br-decision-controls"');
  const panelEnd = html.indexOf('class="br-answer', panelStart);
  const panel = html.slice(panelStart, panelEnd);
  const controlsOnly = panel.slice(0, panel.indexOf('data-testid="brazil-early-next-step"'));
  assert.match(panel, /Shortlist sugerido: Binance ou OKX/);
  assert.match(controlsOnly, /href="\/exchanges\?locale=pt-BR&amp;market=BR&amp;product=spot/);
  assert.doesNotMatch(controlsOnly, /BYBIT|48553|bybit\.com\/register|affiliate_id|data-cta-kind="registration"/i);
});

test("Brazil Telegram comparison handoff stays on the Brazil Binance vs OKX shortlist", async () => {
  const html = await renderBrazilPage("/br", "?locale=pt-BR&market=BR&product=spot");
  assert.match(html, /start=compare_binance-vs-okx_m_BR_l_ptBR_t_spot_c_/);
  assert.doesNotMatch(html, /start=compare_bybit-vs-bitget_m_BR/);
});


test('Brazil Telegram handoff questions use Portuguese without changing the route', async () => {
  const html = await renderBrazilPage();
  assert.match(html, /Verificar condições da conta para Pix\/BRL/);
  assert.match(html, /Voltar a esta decisão para o Brasil/);
  assert.doesNotMatch(html, /Pix\/BRL account checks|Return to this Brazil decision path|Telegram contextual research handoff/);
  assert.match(html, /brazil-owner-telegram-handoff/);
});
