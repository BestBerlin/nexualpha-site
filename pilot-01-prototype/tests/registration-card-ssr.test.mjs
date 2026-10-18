import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function renderRegistrationCard(props) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-registration-card-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegistrationCard } from "../../src/components/v3/RegistrationCard.jsx";

      const html = renderToStaticMarkup(React.createElement(RegistrationCard, ${JSON.stringify(props)}));
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

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8" });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("Arabic research-only card suppresses partner code and outbound signup while eligibility stays blocked", async () => {
  const html = await renderRegistrationCard({ venueSlug: "bitget", fallbackDomain: "www.bitget.com", locale: "ar", market: "BR", product: "spot" });

  assert.doesNotMatch(html, /nexu888|href="\/go\//);
  assert.doesNotMatch(html, /https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF/);
  assert.match(html, /data-registration-decision-state="blocked"/);
  assert.match(html, /مسار الشراكة/);
  assert.match(html, /تحتاج مراجعة/);
  // Audit NX-02 (2026-10-11): a partner venue states its share from the single benefit record, with the account-level
  // eligibility confirmed by the exchange (previously a generic "confirm on the official page" row).
  assert.match(html, /نسبة استرداد الشريك/);
  assert.match(html, /تؤكد المنصة أهلية حسابك بعد التسجيل/);
  assert.match(html, /الأهلية.*الحساب الرسمي|الرسمي/);
  assert.doesNotMatch(html, /قيد الاعداد|Before you continue|This opens|Pending configuration/);
});

test("Turkish official fallback renders source route without sponsored registration copy", async () => {
  const html = await renderRegistrationCard({ venueSlug: "coinbase", fallbackDomain: "www.coinbase.com", locale: "tr", market: "TR", product: "spot" });

  assert.match(html, /Resmi rota/);
  assert.match(html, /Bu bölge için doğrudan kayıt önerilmez/);
  assert.match(html, /data-registration-decision-reason="region-blocked"/);
  assert.doesNotMatch(html, /https:\/\/www\.coinbase\.com\/signup/);
  assert.doesNotMatch(html, /Kayıt aktarımı bekliyor|Pending configuration|This opens/);
  assert.doesNotMatch(html, /rel="sponsored noopener noreferrer"/);
});

test("Japanese research-first state keeps unavailable route distinct from configured partner routes", async () => {
  const html = await renderRegistrationCard({ venueSlug: "unknown-venue", fallbackDomain: "", locale: "ja", market: "BR", product: "spot" });

  assert.match(html, /パートナー導線/);
  assert.match(html, /要確認/);
  assert.match(html, /続行前の確認/);
  assert.match(html, /地域条件と公式条件を先に確認/);
  assert.match(html, /比較を続ける/);
  assert.match(html, /data-registration-decision-state="blocked"/);
  assert.doesNotMatch(html, /target="_blank"/);
  assert.doesNotMatch(html, /https:\/\/t\.me\/NexuAlphaAssistantBot/);
  assert.doesNotMatch(html, /設定済み|未設定/);
  assert.doesNotMatch(html, /Before you continue|This opens|Official route pending/);
});

test("protected partner code remains visible while an unverified regional route stays onsite", async () => {
  const html = await renderRegistrationCard({
    venueSlug: "binance",
    fallbackDomain: "www.binance.com",
    locale: "en",
    market: "HK",
    product: "spot",
    accountStage: "new_account",
    funding: "HKD bank transfer",
  });

  assert.match(html, /11350287/);
  assert.match(html, /data-registration-decision-state="blocked"/);
  assert.doesNotMatch(html, /href="https:\/\/www\.bsmkweb\.cc\/join\?ref=11350287/);
  assert.match(html, /account_stage=new_account/);
  assert.match(html, /funding=HKD(?:%20|\+)bank(?:%20|\+)transfer/);
});

test("configured partner route with unverified regional eligibility does not claim the route is missing", async () => {
  const html = await renderRegistrationCard({
    venueSlug: "binance",
    fallbackDomain: "www.binance.com",
    locale: "es",
    market: "MX",
    product: "spot",
    accountStage: "another_platform",
    funding: "SPEI",
  });

  assert.match(html, /11350287/);
  assert.match(html, /Ruta de socio/);
  assert.match(html, /<p><span>Ruta de socio<\/span><b>Ruta de socio activa<\/b><\/p>/);
  assert.match(html, /Confirma en el flujo oficial|No se recomienda el registro directo para esta región/);
  assert.doesNotMatch(html, /Esta plataforma aún no tiene una ruta de socio registrada/);
  assert.doesNotMatch(html, /href="https:\/\/www\.bsmkweb\.cc\/join\?ref=11350287/);
});

test("Bitget registration card keeps attributed signup without reassurance copy before handoff", async () => {
  const html = await renderRegistrationCard({
    venueSlug: "bitget",
    fallbackDomain: "www.bitget.com",
    locale: "en",
    market: "unknown",
    product: "spot",
  });

  assert.doesNotMatch(html, /data-r37-cro="registration-card-next-step"|confirm referral code nexu888/i);
  assert.match(html, /Partner route active/);
  assert.match(html, /Check eligibility in the official account flow/);
  assert.doesNotMatch(html, /Configured|Available to confirm in official flow|Pending configuration/);
  assert.match(html, /href="\/go\/bitget\?src=registration-card-primary&amp;locale=en&amp;product=spot"/);
  assert.doesNotMatch(html, /href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"/);
  assert.match(html, /data-cta-placement="registration-card-primary"/);
  assert.match(html, /class="registration-card__primary-btn"/);
  assert.doesNotMatch(html, /data-registration-confirmation|data-registration-preflight="partner-route"|Full Official Link|partner\.bitget\.cafe/);
  assert.doesNotMatch(html, /Verify that your browser address bar exactly matches/);
  assert.doesNotMatch(html, /aria-disabled="true"[\s\S]*data-cta-placement="registration-card-primary"/);
  assert.doesNotMatch(html, /15-second registration review|registration-card__primary-btn--waiting/i);
});

test("reviewed decision passport remains visible before an onsite regional verification step", async () => {
  const html = await renderRegistrationCard({
    venueSlug: "bitget",
    fallbackDomain: "www.bitget.com",
    locale: "zh-Hant",
    market: "HK",
    product: "spot",
    accountStage: "new_account",
    funding: "HKD bank transfer",
  });

  assert.match(html, /data-decision-passport="HK"/);
  assert.match(html, /本次決策條件/);
  assert.match(html, /第一次開戶/);
  assert.match(html, /HKD bank transfer/);
  assert.match(html, /account_stage=new_account/);
  assert.match(html, /funding=HKD(?:%20|\+)bank(?:%20|\+)transfer/);
  assert.match(html, /data-registration-decision-state="blocked"/);
  assert.doesNotMatch(html, /href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"/);
});

test("decision passport drops a cross-market funding route before the CTA", async () => {
  const html = await renderRegistrationCard({
    venueSlug: "bitget",
    fallbackDomain: "www.bitget.com",
    locale: "ja",
    market: "JP",
    product: "spot",
    accountStage: "new_account",
    funding: "Pix",
  });

  assert.match(html, /data-decision-passport="JP"/);
  assert.doesNotMatch(html, />Pix</);
  assert.doesNotMatch(html, /data-growth-funding=/);
});

function routeDisclosure(html) {
  return html.match(/<details class="registration-card__mobile-route-details"[^>]*>[\s\S]*?<\/details>/)?.[0] || "";
}

test("compact partner card keeps its sole attributed CTA and referral copy outside collapsed conditions", async () => {
  const html = await renderRegistrationCard({ venueSlug: "bitget", fallbackDomain: "www.bitget.com", locale: "en", market: "unknown", product: "spot", compact: true });
  const details = routeDisclosure(html);
  assert.ok(details);
  assert.doesNotMatch(details.split(">", 1)[0], /open=/);
  assert.doesNotMatch(details, /registration-card__primary-btn|registration-card__copy-btn|registration-card__code-value|data-registration-preflight=/);
  assert.doesNotMatch(details, /registration-card__next-step|data-r37-cro|Full Official Link/);
  assert.match(html, /class="registration-card__code-value"[^>]*>nexu888</);
  assert.match(html, /registration-card__copy-btn/);
  assert.equal((html.match(/data-cta-placement="registration-card-primary"/g) || []).length, 1);
  assert.match(html, /href="\/go\/bitget\?src=registration-card-primary&amp;locale=en&amp;product=spot"/);
  assert.doesNotMatch(html, /href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"/);
  assert.match(html, /rel="sponsored noopener noreferrer"/);
  assert.match(html, /data-growth-placement="registration-card-primary"/);
  assert.doesNotMatch(html, /data-growth-market=/);
  assert.match(html, /data-growth-product="spot"/);
});

test("full partner card preserves attributed handoff without preflight clutter", async () => {
  const html = await renderRegistrationCard({ venueSlug: "bitget", fallbackDomain: "www.bitget.com", locale: "en", market: "unknown", product: "spot" });
  const details = routeDisclosure(html);
  assert.match(details, /^<details[^>]*open=""/);
  assert.doesNotMatch(details, /data-registration-preflight="partner-route"|registration-card__next-step|Full Official Link/);
  assert.match(details, /data-cta-placement="registration-card-primary"/);
  assert.equal((html.match(/data-cta-placement="registration-card-primary"/g) || []).length, 1);
  const compactHtml = await renderRegistrationCard({ venueSlug: "bitget", fallbackDomain: "www.bitget.com", locale: "en", market: "unknown", product: "spot", compact: true });
  const primaryAnchor = (markup) => markup.match(/<a[^>]*data-cta-placement="registration-card-primary"[^>]*>[\s\S]*?<\/a>/)?.[0];
  const compactAnchor = primaryAnchor(compactHtml);
  const fullAnchor = primaryAnchor(html);
  assert.equal(compactAnchor.match(/^<a[^>]*>/)[0], fullAnchor.match(/^<a[^>]*>/)[0], "compact placement preserves the same tracked protected href and all attribution attributes");
  assert.match(compactAnchor, />Official sign-up ↗<\/a>$/, "authorized compact English action stays concise");
  assert.match(fullAnchor, />Go to Official Registration ↗<\/a>$/, "full English action retains its original wording");
});

test("compact official-only and unavailable cards retain their guarded primary state outside conditions", async () => {
  const official = await renderRegistrationCard({ venueSlug: "coinbase", fallbackDomain: "www.coinbase.com", locale: "tr", market: "TR", product: "spot", compact: true });
  assert.match(official, /registration-card__primary-btn--disabled" aria-disabled="true"/);
  assert.match(official, /data-registration-decision-reason="region-blocked"/);
  assert.doesNotMatch(routeDisclosure(official), /registration-card__primary-btn/);
  assert.doesNotMatch(official, /rel="sponsored noopener noreferrer"/);
  const blocked = await renderRegistrationCard({ venueSlug: "unknown-venue", fallbackDomain: "", locale: "ja", market: "BR", product: "spot", compact: true });
  assert.match(blocked, /registration-card__primary-btn--disabled" aria-disabled="true"/);
  assert.doesNotMatch(routeDisclosure(blocked), /registration-card__primary-btn/);
  assert.doesNotMatch(blocked, /target="_blank"/);
});

 test("Arabic neutral venue omits the disabled signup action", async () => {
  const html = await renderRegistrationCard({ venueSlug: "okx", fallbackDomain: "www.okx.com", locale: "ar", compact: true });
  assert.doesNotMatch(html, /primary-btn--disabled|data-cta-kind="registration"|backup-registration/);
 });
 test("Backup route is an accessible icon alongside the primary signup", async () => {
  const html = await renderRegistrationCard({ venueSlug: "okx", fallbackDomain: "www.okx.com", locale: "zh-Hans", compact: true });
  assert.match(html, /registration-card__signup-actions/);
  assert.match(html, /aria-label="官网打不开？用备用注册链接"/);
  assert.match(html, /data-cta-kind="backup-registration"[^>]*><svg aria-hidden="true"/);
  assert.doesNotMatch(html, />官网打不开？用备用注册链接/);
 });
