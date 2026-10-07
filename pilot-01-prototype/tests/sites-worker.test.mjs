import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";

const EXPECTED_HTML_PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("serves static brand and hashed build assets with production cache headers", async () => {
  for (const [pathname, cacheControl] of [
    ["/brand/nexualpha/nexualpha-square.png", "public, max-age=604800, stale-while-revalidate=86400"],
    ["/brand/nexualpha/nexualpha-social-v1.jpg", "public, max-age=31536000, immutable"],
    ["/assets/index-Cr57f5lT.js", "public, max-age=31536000, immutable"],
  ]) {
    const response = await worker.fetch(new Request(`https://example.test${pathname}`), {
      ASSETS: {
        fetch: async () => new Response("asset", {
          status: 200,
          headers: {
            "content-type": pathname.endsWith(".js") ? "application/javascript" : "image/png",
            "cache-control": "no-cache",
          },
        }),
      },
    });

    assert.equal(response.status, 200, pathname);
    assert.equal(response.headers.get("cache-control"), cacheControl, pathname);
  }
});

test("serves llms text assets with a UTF-8 plain text content type", async () => {
  for (const pathname of ["/llms-small.txt", "/llms.txt", "/llms-full.txt"]) {
    const response = await worker.fetch(new Request(`https://example.test${pathname}`), {
      ASSETS: {
        fetch: async () => new Response("llms", {
          status: 200,
          headers: { "content-type": "application/octet-stream" },
        }),
      },
    });

    assert.equal(response.status, 200, pathname);
    assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8", pathname);
    assert.equal(await response.text(), "llms", pathname);
  }
});

test("does not assign text/plain to missing txt assets", async () => {
  const response = await worker.fetch(new Request("https://example.test/llms-small.txt"), {
    ASSETS: {
      fetch: async () => new Response("missing", {
        status: 404,
        headers: { "content-type": "application/octet-stream" },
      }),
    },
  });

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-type"), "application/octet-stream");
});

test("renders the app shell with a real 404 status for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'self'/);
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.equal(response.headers.get("referrer-policy"), null);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("HTML asset responses preserve existing CSP while adding frame protection", async () => {
  const response = await worker.fetch(new Request("https://example.test/", { headers: { accept: "text/html" } }), {
    ASSETS: {
      fetch: async () => new Response("<!doctype html><main>app</main>", {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy": "default-src 'self'",
        },
      }),
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-security-policy"), "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'self'");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.equal(response.headers.get("referrer-policy"), null);
  assert.equal(response.headers.get("x-content-type-options"), null);
  assert.equal(response.headers.get("permissions-policy"), EXPECTED_HTML_PERMISSIONS_POLICY);
  assert.equal(response.headers.get("cache-control"), "public, max-age=300, stale-while-revalidate=600");
});

test("HTML asset responses remove edge-owned security headers and keep app-owned headers", async () => {
  const response = await worker.fetch(new Request("https://example.test/exchanges/binance", { headers: { accept: "text/html" } }), {
    ASSETS: {
      fetch: async () => new Response("<!doctype html><main>app</main>", {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy": "default-src 'self'",
          "referrer-policy": "origin",
          "x-content-type-options": "nosniff, nosniff",
          "permissions-policy": "geolocation=(self), camera=(*)",
          "strict-transport-security": "max-age=31536000; includeSubDomains",
        },
      }),
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-security-policy"), "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'self'");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.equal(response.headers.get("referrer-policy"), null);
  assert.equal(response.headers.get("x-content-type-options"), null);
  assert.equal(response.headers.get("permissions-policy"), EXPECTED_HTML_PERMISSIONS_POLICY);
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains");
});

test("referral and campaign HTML routes are private and not shared cached", async () => {
  for (const path of [
    "/exchanges/bitget?ref=nexu888",
    "/exchanges/binance?utm_source=telegram",
    "/compare/binance-vs-okx?campaign=signup",
    "/exchanges/okx?account_stage=kyc",
    "/exchanges/bitget?market=HK&product=spot&account_stage=new_account&funding=HKD%20bank%20transfer",
  ]) {
    const response = await worker.fetch(new Request(`https://example.test${path}`, { headers: { accept: "text/html" } }), {
      ASSETS: {
        fetch: async () => new Response("<!doctype html><main>context</main>", {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=600" },
        }),
      },
    });

    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0", path);
  }
});

test("stateful market and calculator HTML routes are private and not shared cached", async () => {
  for (const path of [
    "/br?market=BR&product=spot&amount=1000",
    "/embed/calculator?market=global&product=futures&amount=2500",
    "/compare/binance-vs-okx?platform=binance&spot_fee_bps=10",
  ]) {
    const response = await worker.fetch(new Request(`https://example.test${path}`, { headers: { accept: "text/html" } }), {
      ASSETS: {
        fetch: async (request) => {
          const requestPath = new URL(request.url).pathname;
          if (requestPath === "/content/brazil-metadata.json") {
            return Response.json({ version: 1, pages: {
              "/br": {
                status: 200,
                title: "Brasil market route",
                description: "Brazil route metadata.",
                canonical: "https://nexualpha.com/br",
                locale: "pt-BR",
                robots: "index,follow",
                schemas: null,
              },
            } });
          }
          return new Response("<!doctype html><main>stateful context</main>", {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=600" },
          });
        },
      },
    });

    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0", path);
  }
});

test("news summary feed never falls back to the full article feed when parsing fails", async () => {
  const response = await worker.fetch(new Request("https://example.test/content/news-feed.json"), {
    ASSETS: {
      fetch: async () => new Response("{ invalid json with full article body", {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" },
      }),
    },
  });
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(body.articles, []);
  assert.equal(body.reasonCode, "NEWS_SUMMARY_FEED_UNAVAILABLE");
});

test("home route structured data uses NexuAlpha Telegram identities", async () => {
  const response = await worker.fetch(new Request("https://example.test/", { headers: { accept: "text/html" } }), {
    ASSETS: {
      fetch: async () => new Response("<!doctype html><html><head><title></title></head><body><div id=\"root\"></div></body></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    },
  });
  const html = await response.text();
  const schema = JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1]);
  const organization = schema["@graph"].find((entry) => entry["@type"] === "Organization");

  assert.deepEqual(organization.sameAs, [
    "https://t.me/NexuAlphaClub",
    "https://t.me/NexuAlphaAssistantBot",
    "https://t.me/NexuAlphaWorld",
    "https://twitter.com/NexuAlpha",
  ]);
});

test("Singapore regional worker metadata keeps answer-first checks and onsite CTA order", async () => {
  const response = await worker.fetch(new Request("https://example.test/sg", { headers: { accept: "text/html" } }), {
    ASSETS: {
      fetch: async () => new Response("<!doctype html><html><head><title></title></head><body><div id=\"root\"></div></body></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    },
  });
  const html = await response.text();
  const schema = JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1]);
  const graph = schema["@graph"];
  const webPage = graph.find((entry) => entry["@type"] === "WebPage");
  const faq = graph.find((entry) => entry["@type"] === "FAQPage");

  assert.equal(response.status, 200);
  assert.match(html, /<title translate="no" lang="en">Singapore crypto account checks: MAS DPT, SGD, PayNow and FAST — NexuAlpha<\/title>/);
  assert.deepEqual(webPage.relatedLink, [
    "https://nexualpha.com/exchanges?market=SG&product=spot",
    "https://nexualpha.com/rates?market=SG&product=spot",
    "https://nexualpha.com/compare/binance-vs-okx?market=SG&product=spot",
  ]);
  assert.match(JSON.stringify(faq), /SGD, PayNow and FAST only as account-screen verification inputs/);
  assert.match(JSON.stringify(faq), /SGD, PayNow and FAST are account-screen checks, not public promises/);
  assert.doesNotMatch(JSON.stringify(graph), /Singapore signup bonus|guaranteed SGD route|private commission|invite code|referral link/i);
});

test("HTML asset responses keep an existing frame-ancestors directive", async () => {
  const response = await worker.fetch(new Request("https://example.test/", { headers: { accept: "text/html" } }), {
    ASSETS: {
      fetch: async () => new Response("<!doctype html><main>app</main>", {
        status: 200,
        headers: {
          "content-type": "text/html",
          "content-security-policy": "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'",
        },
      }),
    },
  });

  assert.equal(response.headers.get("content-security-policy"), "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
});

test("only the valid calculator widget permits HTTP and HTTPS framing, including fallback and HEAD responses", async () => {
  for (const scenario of [
    { path: "/embed/calculator", method: "GET", fallback: false, csp: null, expectedCsp: "base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors http: https:", expectedCache: "public, max-age=60" },
    { path: "/embed/calculator?locale=zh-Hans&utm_source=partner", method: "GET", fallback: true, csp: "default-src 'self'; frame-ancestors 'self'; img-src https: data:", expectedCsp: "default-src 'self'; img-src https: data:; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors http: https:", expectedCache: "private, no-store, max-age=0" },
    { path: "/embed/calculator?locale=en", method: "HEAD", fallback: true, csp: "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'", expectedCsp: "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors http: https:", expectedCache: "public, max-age=60" },
  ]) {
    const response = await worker.fetch(new Request(`https://example.test${scenario.path}`, {
      method: scenario.method,
      headers: { accept: "text/html" },
    }), {
      ASSETS: {
        fetch: async (request) => {
          const found = !scenario.fallback || new URL(request.url).pathname === "/index.html";
          const headers = {
            "content-type": "text/html; charset=utf-8",
            "x-frame-options": "SAMEORIGIN",
            "cache-control": "public, max-age=60",
          };
          if (scenario.csp) headers["content-security-policy"] = scenario.csp;
          return new Response(scenario.method === "HEAD" ? null : "<!doctype html><main>calculator</main>", {
            status: found ? 200 : 404,
            headers,
          });
        },
      },
    });

    assert.equal(response.status, 200, scenario.path);
    assert.equal(response.headers.get("content-security-policy"), scenario.expectedCsp, scenario.path);
    assert.equal(response.headers.get("x-frame-options"), null, scenario.path);
    assert.equal(response.headers.get("referrer-policy"), null, scenario.path);
    assert.equal(response.headers.get("cache-control"), scenario.expectedCache, scenario.path);
    if (scenario.method === "HEAD") assert.equal(await response.text(), "");
  }
});

test("ordinary pages, KOL overrides and invalid widget paths retain same-origin frame protection", async () => {
  for (const [path, status] of [
    ["/", 200], ["/partners", 200], ["/partners/embed-guide", 200], ["/exchanges/binance", 200],
    ["/embed/calculator?ref=partner", 200], ["/embed/calculator/", 404],
    ["/embed/calculator?page=newsDetail&slug=invalid_slug", 200],
    ["/pt-br/embed/calculator?locale=pt-BR", 404], ["/ja/embed/calculator?locale=ja", 404],
    ["/embed/calculator/missing", 404], ["/embed/other", 404], ["/embed%2Fcalculator", 404],
    ["/missing?widget=/embed/calculator", 404],
  ]) {
    const response = await worker.fetch(new Request(`https://example.test${path}`, { headers: { accept: "text/html" } }), {
      ASSETS: { fetch: async () => new Response("<!doctype html><main>page</main>", {
        headers: { "content-type": "text/html", "content-security-policy": "default-src 'self'" },
      }) },
    });
    assert.equal(response.status, status, path);
    assert.equal(response.headers.get("content-security-policy"), "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'self'", path);
    assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN", path);
  }
});

test("a failed widget HTML asset and non-HTML responses do not receive public framing permission", async () => {
  for (const contentType of ["text/html", "application/json"]) {
    const response = await worker.fetch(new Request("https://example.test/embed/calculator"), {
      ASSETS: { fetch: async () => new Response("unavailable", {
        status: 503,
        headers: { "content-type": contentType, "content-security-policy": "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'", "x-frame-options": "SAMEORIGIN" },
      }) },
    });
    assert.equal(response.headers.get("content-security-policy"), "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'", contentType);
    assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN", contentType);
  }
});

test("falls back to index.html for direct app-route requests without an Accept header", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/exchanges/okx"), {
    ASSETS: {
      fetch: async (request) => {
        const url = new URL(request.url);
        calls.push(url.pathname + url.search);
        return new Response(url.pathname === "/index.html" ? "app" : "missing", {
          status: url.pathname === "/index.html" ? 200 : 404,
        });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.deepEqual(calls, ["/exchanges/okx", "/index.html"]);
});

test("redirects redundant English locale URLs to their parameter-free canonical", async () => {
  const response = await worker.fetch(new Request("https://example.test/exchanges/okx?locale=en&utm_source=telegram&x=drop"), {
    ASSETS: { fetch: async () => new Response("should not fetch", { status: 500 }) },
  });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://nexualpha.com/exchanges/okx?utm_source=telegram");
});

test("redirects common sitemap index aliases to the canonical sitemap", async () => {
  for (const path of ["/sitemap_index.xml", "/sitemap-index.xml"]) {
    const response = await worker.fetch(new Request(`https://example.test${path}`), {
      ASSETS: { fetch: async () => new Response("should not fetch", { status: 500 }) },
    });
    assert.equal(response.status, 301, path);
    assert.equal(response.headers.get("location"), "https://nexualpha.com/sitemap.xml", path);
  }
});

test("falls back to index.html for migrated Japanese path routes", async () => {
  const response = await worker.fetch(new Request("https://example.test/ja/exchanges/okx", {
    headers: { accept: "text/html" },
  }), {
    ASSETS: {
      fetch: async (request) => {
        const url = new URL(request.url);
        return new Response(url.pathname === "/index.html" ? "<!doctype html><html><head><title></title></head><body><div id=\"root\"></div></body></html>" : "missing", {
          status: url.pathname === "/index.html" ? 200 : 404,
          headers: { "content-type": "text/html" },
        });
      },
    },
  });

  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<html lang="ja"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha.com\/ja\/exchanges\/okx"/);
});

test("does not turn missing static files into the app shell without an Accept header", async () => {
  let calls = 0;
  const response = await worker.fetch(new Request("https://example.test/assets/missing.js"), {
    ASSETS: {
      fetch: async () => {
        calls += 1;
        return new Response("missing", { status: 404 });
      },
    },
  });

  assert.equal(response.status, 404);
  assert.equal(calls, 1);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
  ]) {
    let calls = 0;
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("v1 API routes fail closed when Shared Core is not configured", async () => {
  const endpoints = [
    ["/api/v1/homepage-composition", 200, { status: "unavailable", data: [] }],
    ["/api/v1/venues", 200, { status: "unavailable", data: [] }],
    ["/api/v1/venues/binance", 200, { status: "unavailable", data: null }],
    ["/api/v1/official-updates", 200, { status: "unavailable", data: [] }],
    ["/api/v1/listings", 200, { availability: "unavailable", status: "unavailable", data: [] }],
    ["/api/v1/market/asset-pulse", 200, { status: "unavailable" }],
    ["/api/v1/market/exchange-snapshots", 200, { status: "unavailable" }],
    ["/api/v1/market-intelligence", 200, { status: "unavailable", data: [] }],
    ["/api/v1/health/ready", 503, { status: "unavailable" }],
  ];

  for (const [path, status, expected] of endpoints) {
    let assetCalls = 0;
    const response = await worker.fetch(new Request(`https://example.test${path}`), {
      ASSETS: {
        fetch: async () => {
          assetCalls += 1;
          throw new Error("assets must not handle API requests");
        },
      },
    });
    const body = await response.json();

    assert.equal(response.status, status, path);
    assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    assert.equal(typeof body.updatedAt, "string", path);
    assert.equal(body.reasonCode === "CORE_API_ORIGIN_NOT_CONFIGURED" || body.reasonCode === "NO_COMPARABLE_AUTHORIZED_SOURCE", true, path);
    for (const [key, value] of Object.entries(expected)) assert.deepEqual(body[key], value, path);
    assert.equal(assetCalls, 0, path);
  }
});

test("CTA analytics endpoint fails closed when the production collector is not configured", async () => {
  const response = await worker.fetch(new Request("https://example.test/api/analytics/cta", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event: "cta_click" }),
  }), {
    ASSETS: { fetch: async () => { throw new Error("assets must not handle analytics requests"); } },
  });
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(body.status, "unavailable");
  assert.equal(body.reasonCode, "CTA_COLLECTOR_NOT_CONFIGURED");
  assert.equal(typeof body.updatedAt, "string");
});

test("CTA analytics endpoint only accepts POST", async () => {
  const response = await worker.fetch(new Request("https://example.test/api/analytics/cta"), {
    ASSETS: { fetch: async () => { throw new Error("assets must not handle analytics requests"); } },
  });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
});

test("CTA analytics endpoint proxies to the configured collector", async () => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (request) => {
    forwarded = request;
    return new Response(JSON.stringify({ accepted: true }), {
      status: 202,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const response = await worker.fetch(new Request("https://example.test/api/analytics/cta?source=hero", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "cta_click" }),
    }), {
      CTA_ANALYTICS_ORIGIN: "https://collector.example.test",
      ASSETS: { fetch: async () => { throw new Error("assets must not handle analytics requests"); } },
    });

    assert.equal(response.status, 202);
    assert.equal(new URL(forwarded.url).href, "https://collector.example.test/api/analytics/cta?source=hero");
    assert.equal(await forwarded.text(), JSON.stringify({ event: "cta_click" }));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("v1 API routes return structured unavailable JSON when Shared Core fetch fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("connect ECONNREFUSED");
  };

  try {
    const response = await worker.fetch(new Request("https://example.test/api/v1/venues"), {
      CORE_API_ORIGIN: "http://127.0.0.1:3000",
      ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "unavailable");
    assert.equal(body.reasonCode, "CORE_API_UPSTREAM_UNAVAILABLE");
    assert.deepEqual(body.data, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public handoff API routes return 503 when Shared Core is not configured", async () => {
  for (const request of [
    new Request("https://example.test/api/v1/venues/binance/outbound-offer?country=TW"),
    new Request("https://example.test/api/v1/outbound-handoffs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        offerId: "123e4567-e89b-42d3-a456-426614174111",
        offerVersion: 1,
        country: "TW",
        disclosureVersion: "disc-2026-09-05",
        accepted: true,
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
      }),
    }),
  ]) {
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          throw new Error("assets must not handle handoff API requests");
        },
      },
    });
    const body = await response.json();

    assert.equal(response.status, 503, request.url);
    assert.equal(body.status, "unavailable", request.url);
    assert.equal(body.reasonCode, "CORE_API_ORIGIN_NOT_CONFIGURED", request.url);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("public handoff API proxy preserves Origin, JSON content type, and the exact request body", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const requestBody = JSON.stringify({
    offerId: "123e4567-e89b-42d3-a456-426614174111",
    offerVersion: 1,
    country: "TW",
    disclosureVersion: "disc-2026-09-05",
    accepted: true,
    idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
  });
  globalThis.fetch = async (request) => {
    calls.push({
      url: new URL(request.url).toString(),
      method: request.method,
      origin: request.headers.get("origin"),
      contentType: request.headers.get("content-type"),
      body: await request.text(),
    });
    return new Response(JSON.stringify({
      data: {
        id: "handoff-1",
        handoffRequested: true,
        disposition: "ELIGIBLE_NO_NAVIGATION",
        navigationRecorded: false,
        conversionRecorded: false,
        destination: "https://www.binance.com/register",
        officialHost: "www.binance.com",
        replayed: false,
      },
    }), { status: 201, headers: { "content-type": "application/json; charset=utf-8" } });
  };

  try {
    const response = await worker.fetch(new Request("https://example.test/api/v1/outbound-handoffs", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://example.test",
      },
      body: requestBody,
    }), {
      CORE_API_ORIGIN: "http://127.0.0.1:3000/api/v1",
      ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.data.disposition, "ELIGIBLE_NO_NAVIGATION");
    assert.deepEqual(calls, [{
      url: "http://127.0.0.1:3000/api/v1/outbound-handoffs",
      method: "POST",
      origin: "https://example.test",
      contentType: "application/json",
      body: requestBody,
    }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public handoff API proxy passes upstream no-offer and not-configured responses without fake success", async () => {
  const originalFetch = globalThis.fetch;
  const statuses = [404, 503];
  let call = 0;
  globalThis.fetch = async () => {
    const status = statuses[call];
    call += 1;
    return new Response(JSON.stringify({ error: { code: status === 404 ? "OFFER_NOT_FOUND" : "OUTBOUND_HANDOFF_NOT_CONFIGURED" } }), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  };

  try {
    for (const status of statuses) {
      const response = await worker.fetch(new Request("https://example.test/api/v1/venues/binance/outbound-offer?country=TW"), {
        CORE_API_ORIGIN: "http://127.0.0.1:3000",
        ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
      });

      assert.equal(response.status, status);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("worker refuses internal operator API paths before upstream proxying", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls += 1;
    return new Response("should not proxy", { status: 200 });
  };

  try {
    for (const path of ["/api/v1/internal/operator/partner-offers", "/api/v1/partner-offers/operator"]) {
      const response = await worker.fetch(new Request(`https://example.test${path}`), {
        CORE_API_ORIGIN: "http://127.0.0.1:3000",
        ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
      });
      const body = await response.json();

      assert.equal(response.status, 404, path);
      assert.equal(body.error.code, "ROUTE_NOT_FOUND", path);
    }
    assert.equal(upstreamCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("v1 API routes proxy configured Shared Core success without rewriting the payload", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (request) => {
    calls.push(new URL(request.url).toString());
    return new Response(JSON.stringify({ data: [{ slug: "binance" }] }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  };

  try {
    const response = await worker.fetch(new Request("https://example.test/api/v1/venues?locale=en"), {
      CORE_API_ORIGIN: "http://127.0.0.1:3000",
      ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { data: [{ slug: "binance" }] });
    assert.deepEqual(calls, ["http://127.0.0.1:3000/api/v1/venues?locale=en"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("v1 API proxy accepts a base URL that already includes the API prefix", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (request) => {
    calls.push(new URL(request.url).toString());
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  };

  try {
    await worker.fetch(new Request("https://example.test/api/v1/venues"), {
      CORE_API_BASE_URL: "http://127.0.0.1:3000/api/v1",
      ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
    });

    assert.deepEqual(calls, ["http://127.0.0.1:3000/api/v1/venues"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});
