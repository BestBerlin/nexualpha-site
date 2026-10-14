import test from "node:test";
import assert from "node:assert/strict";
import { sameSiteRequestTarget, trailingSlashRedirectTarget } from "../server/asset-path.mjs";

// Security audit 2026-10-15: "/.//evil.com/" answered "301 Location: //evil.com" (open redirect).
test("trailing-slash redirect never produces a protocol-relative or external Location", () => {
  for (const raw of ["/.//evil.com/", "/%2e//evil.com/", "/./\\evil.com/", "//evil.com/", "///evil.com//"]) {
    const u = new URL(sameSiteRequestTarget(raw), "https://nexualpha.com");
    assert.equal(u.host, "nexualpha.com", raw);
    const target = trailingSlashRedirectTarget(u.pathname, u.search);
    assert.ok(target.startsWith("/") && !target.startsWith("//") && !target.includes("\\"), `${raw} -> ${target}`);
    assert.equal(new URL(target, "https://nexualpha.com").host, "nexualpha.com", `${raw} -> ${target}`);
  }
});

test("normal trailing-slash redirects keep path and query", () => {
  assert.equal(trailingSlashRedirectTarget("/exchanges/okx/", "?src=tg"), "/exchanges/okx?src=tg");
  assert.equal(trailingSlashRedirectTarget("/zh-hans/news//", ""), "/zh-hans/news");
});

test("request target is always parsed as a same-site path", () => {
  assert.equal(sameSiteRequestTarget("//evil.com/x?y=1"), "/evil.com/x?y=1");
  assert.equal(sameSiteRequestTarget("/news?q=1"), "/news?q=1");
  assert.equal(sameSiteRequestTarget(undefined), "/");
  assert.equal(new URL(sameSiteRequestTarget("//evil.com/x"), "https://nexualpha.com").host, "nexualpha.com");
});
