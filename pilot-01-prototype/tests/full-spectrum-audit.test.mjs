import assert from "node:assert/strict";
import test from "node:test";
import { resolveAuditTarget } from "../scripts/full-spectrum-audit.mjs";

test("full-spectrum audit uses an explicit AUDIT_URL without starting local preview", async () => {
  const calls = [];
  const target = await resolveAuditTarget(
    { AUDIT_URL: "http://example.test/base/" },
    {
      canReachBaseUrl: async () => {
        calls.push("canReach");
        return false;
      },
      startLocalPreview: async () => {
        calls.push("startPreview");
        return { baseUrl: "http://127.0.0.1:4173", stop() {} };
      },
    },
  );

  assert.equal(target.baseUrl, "http://example.test/base");
  assert.equal(target.preview, null);
  assert.deepEqual(calls, []);
});

test("full-spectrum audit reuses an already running default preview", async () => {
  const calls = [];
  const target = await resolveAuditTarget(
    {},
    {
      canReachBaseUrl: async (baseUrl) => {
        calls.push(["canReach", baseUrl]);
        return true;
      },
      startLocalPreview: async () => {
        calls.push(["startPreview"]);
        return { baseUrl: "http://127.0.0.1:4173", stop() {} };
      },
    },
  );

  assert.equal(target.baseUrl, "http://127.0.0.1:4173");
  assert.equal(target.preview, null);
  assert.deepEqual(calls, [["canReach", "http://127.0.0.1:4173"]]);
});

test("full-spectrum audit starts local preview for the current build when no base URL is reachable", async () => {
  let stopped = false;
  const calls = [];
  const target = await resolveAuditTarget(
    { AUDIT_PREVIEW_HOST: "127.0.0.1", AUDIT_PREVIEW_PORT: "4865" },
    {
      canReachBaseUrl: async (baseUrl) => {
        calls.push(["canReach", baseUrl]);
        return false;
      },
      startLocalPreview: async ({ host, port }) => {
        calls.push(["startPreview", host, port]);
        return { baseUrl: `http://${host}:${port}`, stop() { stopped = true; } };
      },
    },
  );

  assert.equal(target.baseUrl, "http://127.0.0.1:4865");
  assert.deepEqual(calls, [
    ["canReach", "http://127.0.0.1:4865"],
    ["startPreview", "127.0.0.1", "4865"],
  ]);

  target.preview.stop();
  assert.equal(stopped, true);
});
