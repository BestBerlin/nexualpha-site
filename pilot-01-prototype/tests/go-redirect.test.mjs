import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createGoRedirect } from "../server/go-redirect.mjs";

async function setup() {
  const dir = await mkdtemp(path.join(tmpdir(), "go-"));
  await mkdir(path.join(dir, "client", "intel"), { recursive: true });
  await writeFile(path.join(dir, "client", "intel", "partners.json"), JSON.stringify({ partners: [{ slug: "okx", registrationUrl: "https://www.okx.com/join/nexu888" }, { slug: "bad", registrationUrl: "javascript:alert(1)" }] }));
  const eventFile = path.join(dir, "clicks", "go.jsonl");
  return { handle: createGoRedirect({ clientRoot: path.join(dir, "client"), eventFile, now: () => new Date("2026-10-10T12:00:00Z") }), eventFile };
}
const wait = () => new Promise((r) => setTimeout(r, 50));

test("go redirect sends the exact partner registration URL and records one anonymous click", async () => {
  const { handle, eventFile } = await setup();
  const res = await handle(new Request("https://nexualpha.com/go/okx?src=tg-channel-zh", { headers: { "user-agent": "Mozilla/5.0", referer: "https://nexualpha.com/zh-hans/exchanges/okx?utm_source=tg" } }));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://www.okx.com/join/nexu888");
  assert.match(res.headers.get("x-robots-tag"), /noindex/);
  await wait();
  const rows = (await readFile(eventFile, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(rows, [{ t: "2026-10-10T12:00:00.000Z", partner: "okx", src: "tg-channel-zh", ref: "nexualpha.com", path: "/zh-hans/exchanges/okx", locale: "zh-Hans" }]);
  assert.doesNotMatch(JSON.stringify(rows[0]), /utm_source|Mozilla|203\.0\.113/, "click rows keep only sanitized metadata");
});

test("go redirect rejects unknown or unsafe partners, sanitizes src and does not count crawlers", async () => {
  const { handle, eventFile } = await setup();
  assert.equal((await handle(new Request("https://nexualpha.com/go/nope"))).status, 404);
  assert.equal((await handle(new Request("https://nexualpha.com/go/bad"))).status, 404);
  await handle(new Request("https://nexualpha.com/go/okx?src=<script>", { headers: { "user-agent": "Mozilla/5.0" } }));
  await handle(new Request("https://nexualpha.com/go/okx?src=x", { headers: { "user-agent": "Googlebot/2.1" } }));
  await wait();
  const rows = (await readFile(eventFile, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].src, "unknown");
});

test("official-only tracked routes resolve the unchanged registry URL without reviving missing referral routes", async () => {
  const { partnerRegistry } = await import("../src/data/partner-registry.js");
  const { handle } = await setup();
  for (const [slug, partner] of Object.entries(partnerRegistry)) {
    if (partner.hasReferral !== false) continue;
    const response = await handle(new Request(`https://nexualpha.com/go/${slug}?src=registration-card-official-route`));
    assert.equal(response.status, 302, slug);
    assert.equal(response.headers.get("location"), partner.registrationUrl, slug);
  }
  assert.equal((await handle(new Request("https://nexualpha.com/go/deribit"))).status, 404, "missing referral routes stay fail-closed");
});


test("/go/gate resolves the canonical Gate.io partner target", async () => {
  const { handle, eventFile } = await setup();
  const { partnerRegistry } = await import("../src/data/partner-registry.js");
  await writeFile(path.join(path.dirname(eventFile), "..", "client", "intel", "partners.json"), JSON.stringify({ partners: [{ slug: "gate-io", registrationUrl: partnerRegistry["gate-io"].registrationUrl }] }));
  const response = await handle(new Request("https://nexualpha.com/go/gate?src=news", { headers: { "user-agent": "Mozilla/5.0" } }));
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), partnerRegistry["gate-io"].registrationUrl);
  await wait();
  const rows = (await readFile(eventFile, "utf8")).trim().split("\n").map(row => JSON.parse(row));
  assert.equal(rows[0].partner, "gate-io");
});
