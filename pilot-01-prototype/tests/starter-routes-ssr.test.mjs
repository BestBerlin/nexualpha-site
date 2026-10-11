import assert from "node:assert/strict";
import test from "node:test";
import { createSsrHarness, SHELL_HTML } from "./helpers/ssr-hydration-harness.mjs";
import worker, { routeMetadata } from "../worker/index.js";
import { publicStarterLevels } from "../src/data/starter/index.js";

const firstSlug = "what-am-i-buying";
const partnerSlug = "first-spot-trade";
const sensitiveSlug = "p2p-and-bank-freeze";

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

const starterEnv = () => ({
  ASSETS: {
    fetch: async (request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/index.html") {
        return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      return new Response("missing", { status: 404 });
    },
  },
  NEWS_SSR_RENDER: (href, options) => harness.render(href, options),
});

const starterEnvWithPrerenderSnapshot = (snapshotHtml, { starterReviewed = false, renderer = true } = {}) => {
  const assets = {
    fetch: async (request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/index.html") {
        return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      if (pathname === "/prerender-manifest.json") {
        return new Response(JSON.stringify({
          routes: {
            [`/starter/${partnerSlug}|en`]: { html: snapshotHtml },
            ["/starter|zh-Hans"]: { html: snapshotHtml },
          },
        }), { headers: { "content-type": "application/json; charset=utf-8" } });
      }
      return new Response("missing", { status: 404 });
    },
  };
  return {
    ASSETS: assets,
    STARTER_LEVEL7_REVIEWED: starterReviewed ? "true" : "false",
    ...(renderer ? { NEWS_SSR_RENDER: (href, options) => harness.render(href, options) } : {}),
  };
};

test("starter hub SSR renders 12 map positions while hiding level seven content until review", async () => {
  const html = await harness.render("https://nexualpha.com/zh-hans/starter");

  assert.match(html, /新手村/);
  assert.match(html, /12 关，从注册到安全提币，每关 90 秒/);
  assert.match(html, /中立 · 来源可查 · 合作关系已披露/);
  assert.match(html, /继续第 1 关/);
  assert.match(html, /data-starter-reviewed="false"/);
  assert.equal((html.match(/class="starter-node/g) || []).length, 12);
  assert.match(html, /第 7 关待审核/);
  assert.doesNotMatch(html, new RegExp(sensitiveSlug));
});

test("starter level SSR renders checklist, quiz, sources and no CTA on sensitive or no-CTA lessons", async () => {
  const html = await harness.render(`https://nexualpha.com/starter/${firstSlug}`);

  assert.match(html, /Starter Path/);
  assert.match(html, /Video coming soon|视频即将上线/);
  assert.match(html, /<ol class="starter-points"/);
  assert.match(html, /class="starter-checklist"/);
  assert.equal((html.match(/class="starter-quiz"/g) || []).length, 3);
  assert.match(html, /class="starter-sources"/);
  assert.doesNotMatch(html, /class="starter-cta"/);

  const sensitive = await harness.render(`https://nexualpha.com/starter/${sensitiveSlug}`);
  assert.match(sensitive, /pending review|待审核/);
  assert.doesNotMatch(sensitive, /class="starter-cta"/);
});

test("starter partner CTA SSR keeps source attribution and disclosure", async () => {
  const html = await harness.render(`https://nexualpha.com/starter/${partnerSlug}`);

  assert.match(html, /data-cta-placement="starter-first-spot-trade"/);
  assert.match(html, /data-cta-platform="bitget"/);
  assert.match(html, /data-cta-kind="registration"/);
  assert.match(html, /src=starter-first-spot-trade|starter-first-spot-trade/);
  assert.match(html, /Partner links|合作推广|commission|佣金/);
});

test("starter blocked partner CTA keeps users onsite with market context", async () => {
  const html = await harness.render(`https://nexualpha.com/starter/${partnerSlug}?market=US`);

  assert.match(html, /data-cta-placement="starter-first-spot-trade"/);
  assert.match(html, /data-cta-platform="bitget"/);
  assert.match(html, /data-cta-kind="research"/);
  assert.match(html, /href="\/exchanges\/bitget\?market=US|href="\/exchanges\/bitget\?[^"]*market=US/);
  assert.doesNotMatch(html, /href="https:\/\/partner\.bitget\.cafe/);
});

test("starter worker HTML injects body, schema, stylesheet scope and review flag", async () => {
  for (const path of ["/zh-hans/starter", `/starter/${firstSlug}`]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), starterEnv());
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.match(html, /class="starter-page/);
    assert.match(html, /route-starter/);
    assert.match(html, /data-starter-reviewed="false"/);
    assert.match(html, /type="application\/ld\+json"/);
    assert.match(html, /BreadcrumbList/);
    assert.match(html, /route-starter|starter\.css|starter-/);
  }
});


test("starter market requests bypass stale prerender affiliate snapshots", async () => {
  let renderCalls = 0;
  const stalePartnerHtml = '<main class="starter-page route-starter"><h1>Old starter</h1><a href="https://partner.bitget.cafe/bg/C6PRAF?src=starter-first-spot-trade" data-cta-kind="registration">Open account</a></main>';
  const env = {
    ASSETS: {
      fetch: async (request) => {
        const pathname = new URL(request.url).pathname;
        if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
        if (pathname === "/prerender-manifest.json") {
          return Response.json({
            version: "nexualpha-prerender-v1",
            routes: {
              [`/starter/${partnerSlug}|en`]: { pathname: `/starter/${partnerSlug}`, locale: "en", asset: "/prerender/en/starter-first-spot-trade.json" },
            },
          });
        }
        if (pathname === "/prerender/en/starter-first-spot-trade.json") return Response.json({ html: stalePartnerHtml });
        return new Response("missing", { status: 404 });
      },
    },
    NEWS_SSR_RENDER: async (href, options) => {
      renderCalls += 1;
      return harness.render(href, options);
    },
  };

  const response = await worker.fetch(new Request(`https://nexualpha.com/starter/${partnerSlug}?market=US`, { headers: { accept: "text/html" } }), env);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(renderCalls, 1, "starter market routes render at request time instead of using manifest assets");
  assert.equal(response.headers.get("x-nexualpha-starter-render"), "runtime");
  assert.match(html, /data-cta-kind="research"/);
  assert.match(html, /href="\/exchanges\/bitget\?market=US|href="\/exchanges\/bitget\?[^\"]*market=US/);
  assert.doesNotMatch(html, /https:\/\/partner\.bitget\.cafe/);
  assert.doesNotMatch(html, /Old starter/);
});

test("starter market requests without renderer fail closed instead of serving prerender CTA", async () => {
  const stalePartnerHtml = '<main class="starter-page route-starter"><h1>Old starter</h1><a href="https://partner.bitget.cafe/bg/C6PRAF?src=starter-first-spot-trade" data-cta-kind="registration">Open account</a></main>';
  const env = {
    ASSETS: {
      fetch: async (request) => {
        const pathname = new URL(request.url).pathname;
        if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
        if (pathname === "/prerender-manifest.json") {
          return Response.json({
            version: "nexualpha-prerender-v1",
            routes: {
              [`/starter/${partnerSlug}|en`]: { pathname: `/starter/${partnerSlug}`, locale: "en", asset: "/prerender/en/starter-first-spot-trade.json" },
            },
          });
        }
        if (pathname === "/prerender/en/starter-first-spot-trade.json") return Response.json({ html: stalePartnerHtml });
        return new Response("missing", { status: 404 });
      },
    },
  };

  const response = await worker.fetch(new Request(`https://nexualpha.com/starter/${partnerSlug}?market=US`, { headers: { accept: "text/html" } }), env);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.doesNotMatch(html, /https:\/\/partner\.bitget\.cafe/);
  assert.doesNotMatch(html, /data-cta-kind="registration"/);
  assert.doesNotMatch(html, /Old starter/);
});

test("starter worker metadata hides pending level seven from index and emits FAQ schema for public levels", async () => {
  const response = await worker.fetch(new Request(`https://nexualpha.com/starter/${sensitiveSlug}`, { headers: { accept: "text/html" } }), starterEnv());
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /name="robots" content="noindex,follow"/);
  assert.match(html, /pending review/);
  assert.doesNotMatch(html, /class="starter-cta"/);

  const publicResponse = await worker.fetch(new Request(`https://nexualpha.com/starter/${firstSlug}`, { headers: { accept: "text/html" } }), starterEnv());
  const publicHtml = await publicResponse.text();
  assert.match(publicHtml, /FAQPage/);
  assert.doesNotMatch(publicHtml, /VideoObject/);
});


test("starter worker ignores stale commercial prerender snapshots and keeps reviewed flag runtime-scoped", async () => {
  const staleCommercialSnapshot = `<main class="starter-page route-starter"><a class="starter-cta" href="https://partner.bitget.cafe/code/stale">stale partner code</a></main>`;
  const env = starterEnvWithPrerenderSnapshot(staleCommercialSnapshot, { starterReviewed: true });

  const blockedResponse = await worker.fetch(new Request(`https://nexualpha.com/starter/${partnerSlug}?market=US`, { headers: { accept: "text/html" } }), env);
  const blockedHtml = await blockedResponse.text();
  assert.equal(blockedResponse.status, 200);
  assert.match(blockedHtml, /class="starter-page/);
  assert.match(blockedHtml, /data-cta-kind="research"/);
  assert.match(blockedHtml, /market=US/);
  assert.doesNotMatch(blockedHtml, /partner\.bitget\.cafe\/code\/stale/);
  assert.doesNotMatch(blockedHtml, /href="https:\/\/partner\.bitget\.cafe/);

  const noRendererEnv = starterEnvWithPrerenderSnapshot(staleCommercialSnapshot, { renderer: false });
  const noRendererResponse = await worker.fetch(new Request(`https://nexualpha.com/starter/${partnerSlug}?market=US`, { headers: { accept: "text/html" } }), noRendererEnv);
  const noRendererHtml = await noRendererResponse.text();
  assert.equal(noRendererResponse.status, 200);
  assert.doesNotMatch(noRendererHtml, /partner\.bitget\.cafe\/code\/stale/);
  assert.doesNotMatch(noRendererHtml, /href="https:\/\/partner\.bitget\.cafe/);

  const hubResponse = await worker.fetch(new Request("https://nexualpha.com/zh-hans/starter", { headers: { accept: "text/html" } }), env);
  const hubHtml = await hubResponse.text();
  assert.equal(hubResponse.status, 200);
  assert.match(hubHtml, /data-starter-reviewed="true"/);
  assert.match(hubHtml, new RegExp(sensitiveSlug));
  assert.doesNotMatch(hubHtml, /partner\.bitget\.cafe\/code\/stale/);
});

test("starter metadata covers hub, public levels, and level seven noindex behavior", async () => {
  const hub = await routeMetadata(new URL("https://nexualpha.com/starter"), {});
  assert.equal(hub.robots, "index,follow");
  assert.equal(hub.canonical, "https://nexualpha.com/starter");
  assert.deepEqual(hub.alternates.map((item) => item.hreflang).sort(), ["en", "x-default", "zh-Hans"]);

  const zhHub = await routeMetadata(new URL("https://nexualpha.com/zh-hans/starter"), {});
  assert.equal(zhHub.locale, "zh-Hans");
  assert.equal(zhHub.canonical, "https://nexualpha.com/zh-hans/starter");

  const publicMeta = await routeMetadata(new URL(`https://nexualpha.com/starter/${firstSlug}`), {});
  assert.equal(publicMeta.robots, "index,follow");
  assert.equal(publicMeta.status, 200);
  assert.ok(JSON.stringify(publicMeta.schema).includes("FAQPage"));

  const sensitiveMeta = await routeMetadata(new URL(`https://nexualpha.com/starter/${sensitiveSlug}`), {});
  assert.equal(sensitiveMeta.robots, "noindex,follow");
  assert.equal(sensitiveMeta.status, 200);

  const unknownMeta = await routeMetadata(new URL("https://nexualpha.com/starter/not-a-real-level"), {});
  assert.equal(unknownMeta.status, 404);
  assert.equal(unknownMeta.robots, "noindex,nofollow");

  assert.ok(!JSON.stringify(publicMeta.schema).includes("VideoObject"));
});

test("starter public route inventory contains only reviewed public levels by default", () => {
  const slugs = publicStarterLevels(false).map((level) => level.meta.slug);
  assert.equal(slugs.length, 11);
  assert.ok(slugs.includes(firstSlug));
  assert.ok(!slugs.includes(sensitiveSlug));
});
