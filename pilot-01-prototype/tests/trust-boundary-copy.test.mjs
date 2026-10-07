import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const securityBlock = (source) => {
  const start = source.indexOf("function VenueAntiPhishingSecurity");
  const end = source.indexOf("function VenueTelegramMonitorSection", start);
  assert.ok(start > -1, "VenueAntiPhishingSecurity block should exist");
  assert.ok(end > start, "VenueTelegramMonitorSection should follow the security block");
  return source.slice(start, end);
};

test("anti-phishing verifier describes recorded-source matching, not authorization", async () => {
  const source = await read("src/components/v3/AntiPhishingVerifier.jsx");

  assert.doesNotMatch(source, /官方授权|官方授權|Official Authorized|officially authorized|authorized source/i);
  assert.match(source, /匹配已记录来源线索|Matches Recorded Source Clue/);
  assert.match(source, /不构成实时授权或安全保证|not a live authorization or safety guarantee/i);
});

test("factbook and CTA trust surfaces avoid unproven absolute claims", async () => {
  const paths = [
    "src/components/v3/FactbookPage.jsx",
    "src/components/v3/MethodologyPage.jsx",
    "src/components/v3/RegistrationCard.jsx",
    "src/components/v3/AntiPhishingVerifier.jsx",
    "src/components/v3/LiveIntelligenceNews.jsx",
    "src/data/factbook-registry.js",
  ];
  const joined = (await Promise.all(paths.map(read))).join("\n");

  assert.doesNotMatch(joined, /Verified Official Domains|Anti-Phishing Whitelist|Whitelisting|whitelist/i);
  assert.doesNotMatch(joined, /白名单|白名單|认证白名单|認證白名單/);
  assert.doesNotMatch(joined, /secure login mirrors|authenticated directory|verified partner links|No verified partner/i);
  assert.doesNotMatch(joined, /100% confidence|置信度\s*100%|实时核验|實時核驗|秒级防伪|秒級防偽|毫秒级|毫秒級/i);
  assert.doesNotMatch(joined, /Verified Referral|Lifetime Net Fee Rebate|Lock Net Rates|鎖定淨費率|锁定净费率/i);
  assert.doesNotMatch(joined, /20%\s*(?:手续费)?自动|20%\s*(?:手續費)?自動|automatic cashback|automated perpetual fee cashback/i);
  assert.match(joined, /recorded source clue|已记录来源线索|已記錄來源線索/i);
  assert.match(joined, /not live authorization or a safety guarantee|不构成实时授权或安全保证|不構成即時授權或安全保證/i);
});

test("venue security copy avoids unproven authorization and safety guarantees", async () => {
  const source = await read("src/components/v3/V3Pages.jsx");
  const block = securityBlock(source);

  assert.doesNotMatch(block, /NexuAlpha 权威验证通过|官方唯一权威主域名|官方认证登录镜像|SSL 256-bit Valid/i);
  assert.doesNotMatch(block, /Verified by NexuAlpha|authorized mirrors|official secure endpoint|secure endpoint|safe endpoint/i);
  assert.doesNotMatch(block, /直连官方 API|认证白名单|彻底杜绝中间人劫持/);
  assert.match(block, /recordedAlternateDomains/);
  assert.match(block, /No alternate domains are recorded/);
});

test("venue security block never fabricates accounts subdomains as mirrors", async () => {
  const source = await read("src/components/v3/V3Pages.jsx");
  const block = securityBlock(source);

  assert.doesNotMatch(block, /accounts\.\$\{officialDomain|`accounts\.|accounts\.\$\{/);
  assert.doesNotMatch(block, /officialDomain\.replace\(\/\^www/);
});
