import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = await readFile(new URL('../scripts/verify-international-cta.mjs', import.meta.url), 'utf8');

test('international CTA browser harness bounds visual and interaction waits', () => {
  assert.match(source, /class AuditTimeoutError extends Error/);
  assert.match(source, /const withTimeout = async/);
  assert.match(source, /withTimeout\(runVisualJob\(page, job, eventErrors, axe\), label, VISUAL_JOB_TIMEOUT_MS\)/);
  assert.match(source, /recyclePage = isAuditTimeout\(error\)/);
  assert.match(source, /timedOut: results\.filter/);
});

test('international CTA browser harness bounds iframe, navigation and browser cleanup operations', () => {
  assert.match(source, /page\.goto\(url, \{ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT_MS \}\)/);
  assert.match(source, /page\.waitForNavigation\(\{ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT_MS \}\)/);
  assert.match(source, /page\.goBack\(\{ waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT_MS \}\)/);
  assert.match(source, /page\.waitForSelector\('\.preview-iframe--brazil', \{ timeout: OPERATION_TIMEOUT_MS \}\)/);
  assert.match(source, /embedFrame\.waitForSelector\('\[data-testid="brazil-cost-embed"\]', \{ timeout: OPERATION_TIMEOUT_MS \}\)/);
  assert.match(source, /withTimeout\(browser\.close\(\), 'browser close', 10_000\)/);
});

test('international CTA browser harness does not keep known unbounded waits', () => {
  assert.doesNotMatch(source, /freshPage\.goto\(shared,\s*\{\s*waitUntil:\s*'networkidle2'\s*\}\)/);
  assert.doesNotMatch(source, /blocked\.goto\(base\s*\+\s*'\/br',\s*\{\s*waitUntil:\s*'networkidle2'\s*\}\)/);
  assert.doesNotMatch(source, /embedFrame\.waitForSelector\('\[data-testid="brazil-cost-embed"\]'\)/);
  assert.doesNotMatch(source, /page\.goBack\(\{waitUntil:'networkidle2'\}\)/);
});
