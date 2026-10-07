import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { contentTypeForAssetPath, resolveAssetPath, rewriteLocalRedirectLocation } from "../server/asset-path.mjs";

test("local Sites preview asset resolver rejects malformed and escaping paths", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexualpha-preview-assets-"));
  try {
    const clientRoot = path.join(dir, "client");
    await mkdir(path.join(clientRoot, "assets"), { recursive: true });
    await writeFile(path.join(clientRoot, "index.html"), "<!doctype html>");
    await writeFile(path.join(clientRoot, "assets", "app.js"), "console.log('ok')");
    await writeFile(path.join(dir, "secret.txt"), "outside");

    assert.equal(resolveAssetPath(clientRoot, "/"), path.join(clientRoot, "index.html"));
    assert.equal(resolveAssetPath(clientRoot, "/assets/app.js"), path.join(clientRoot, "assets", "app.js"));
    assert.equal(resolveAssetPath(clientRoot, "/%E0%A4%A"), null);
    assert.equal(resolveAssetPath(clientRoot, "/%2e%2e/secret.txt"), null);
    assert.equal(resolveAssetPath(clientRoot, "/assets"), null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("local Sites preview keeps production-origin redirects inside the candidate origin", () => {
  assert.equal(
    rewriteLocalRedirectLocation("https://nexualpha.com/ja/news?locale=ja", "http://127.0.0.1:4305"),
    "http://127.0.0.1:4305/ja/news?locale=ja",
  );
  assert.equal(
    rewriteLocalRedirectLocation("https://example.com/outside", "http://127.0.0.1:4305"),
    "https://example.com/outside",
  );
  assert.equal(rewriteLocalRedirectLocation("http://[", "http://127.0.0.1:4305"), "http://[");
});

test("local Sites preview serves llms text assets as UTF-8 plain text", () => {
  for (const file of ["llms-small.txt", "llms.txt", "llms-full.txt"]) {
    assert.equal(contentTypeForAssetPath(file), "text/plain; charset=utf-8", file);
  }
  assert.equal(contentTypeForAssetPath("unknown.bin"), "application/octet-stream");
});
