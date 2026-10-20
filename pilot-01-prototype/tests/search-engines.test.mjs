import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { submissionWarning, submitYandexIndexNow } from "../scripts/search-engines.mjs";

test("Yandex network failures and Bing host throttling are warnings only", () => {
  for (const error of [new TypeError("fetch failed"), new DOMException("timeout", "TimeoutError"), Object.assign(new Error("network"), { cause: { code: "ETIMEDOUT" } })]) {
    assert.equal(submissionWarning("yandex", null, error), "unreachable");
  }
  assert.equal(submissionWarning("bing", { status: 400, text: "ThrottleHost" }), "throttled, retry next slot");
  assert.equal(submissionWarning("bing", { status: 400, text: "Invalid key" }), null);
  assert.equal(submissionWarning("yandex", null, new Error("missing credentials")), null);
});

test("Yandex IndexNow reuses the existing key and submits the supplied sitemap or changed URLs", async () => {
  const urls = ["https://nexualpha.com/about", "https://nexualpha.com/sitemap.xml"];
  let called = false;
  const result = await submitYandexIndexNow(urls, async (endpoint, init) => {
    called = true;
    assert.equal(endpoint, "https://yandex.com/indexnow");
    const payload = JSON.parse(init.body);
    assert.equal(payload.host, "nexualpha.com");
    assert.deepEqual(payload.urlList, urls);
    assert.match(payload.key, /^[A-Za-z0-9-]{8,128}$/);
    assert.ok(payload.keyLocation.startsWith("https://nexualpha.com/"));
    return new Response(null, { status: 202 });
  });
  assert.ok(called);
  assert.equal(result.ok, true);
});

test("Yandex API shares one 15 second deadline across both calls", async () => {
  const source = await readFile(new URL("../scripts/search-engines.mjs", import.meta.url), "utf8");
  assert.match(source, /AbortSignal.timeout\(15_000\)/);
  assert.match(source, /headers, signal/);
});

test("submit CLI exits zero on unreachable Yandex API, still calls IndexNow, and warns on Bing throttle", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { pathToFileURL, fileURLToPath } = await import("node:url");
  const { spawnSync } = await import("node:child_process");
  const dir = await mkdtemp(join(tmpdir(), "brand-submit-"));
  try {
    await writeFile(join(dir, "yandex-webmaster.env"), "YANDEX_OAUTH_TOKEN=test-only\n");
    await writeFile(join(dir, "bing-webmaster-api.env"), "BING_WEBMASTER_API_KEY=test-only\n");
    const mock = join(dir, "fetch.mjs");
    await writeFile(mock, `globalThis.fetch = async (url, init) => {
      url = String(url);
      if (url.includes("api.webmaster.yandex.net")) {
        if (!init.signal) throw new Error("missing timeout");
        throw new TypeError("fetch failed");
      }
      if (url === "https://yandex.com/indexnow") { console.log("MOCK_INDEXNOW_SUBMITTED"); return new Response(null, {status:202}); }
      if (url.includes("ssl.bing.com")) return new Response("ThrottleHost", {status:400});
      if (url.endsWith("sitemap.xml")) return new Response("<urlset><url></url></urlset>");
      throw new Error("Unexpected request");
    };`);
    const child = spawnSync(process.execPath, ["--import", pathToFileURL(mock).href, fileURLToPath(new URL("../scripts/search-engines.mjs", import.meta.url)), "submit"], {
      env: { ...process.env, NEXU_KEYS_DIR: dir }, encoding: "utf8", timeout: 10_000,
    });
    assert.equal(child.status, 0, child.stderr);
    assert.match(child.stdout, /WARN\s+unreachable/);
    assert.match(child.stdout, /throttled, retry next slot/);
    assert.match(child.stdout, /MOCK_INDEXNOW_SUBMITTED/);
    assert.match(child.stdout, /accepted by endpoint/);
  } finally { await rm(dir, {recursive:true, force:true}); }
});
