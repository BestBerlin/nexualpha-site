import { committedFileHash } from './r100-test-contracts.mjs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = readFileSync(new URL('../src/components/v3/RegistrationCard.jsx', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));

const expectedTitles = new Map([
  ['zh-Hans', '路径、邀请码与资格详情'],
  ['zh-Hant', '路徑、邀請碼與資格詳情'],
  ['en', 'Route, code and eligibility details'],
  ['ja', 'ルート・コード・利用条件の詳細'],
  ['ko', '경로, 코드 및 자격 세부 정보'],
  ['es', 'Detalles de ruta, código y elegibilidad'],
  ['pt-BR', 'Detalhes de rota, código e elegibilidade'],
  ['fr', 'Détails de route, code et éligibilité'],
  ['de', 'Route, Code und Eignung im Detail'],
  ['ar', 'تفاصيل المسار والرمز والأهلية'],
  ['ru', 'Детали маршрута, кода и доступности'],
  ['id', 'Detail rute, kode, dan kelayakan'],
  ['vi', 'Chi tiết đường dẫn, mã và điều kiện'],
  ['it', 'Dettagli su percorso, codice e idoneità'],
  ['tr', 'Rota, kod ve uygunluk ayrıntıları'],
]);

async function renderRegistrationCases(cases) {
  const tempDir = await mkdtemp(path.join(projectRoot, 'tests/.tmp-r122-registration-hierarchy-'));
  try {
    const entryPath = path.join(tempDir, 'entry.mjs');
    const bundlePath = path.join(tempDir, 'bundle.cjs');
    await writeFile(entryPath, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { RegistrationCard } from '../../src/components/v3/RegistrationCard.jsx';
      const cases = ${JSON.stringify(cases)};
      console.log(JSON.stringify(cases.map((item) => ({
        key: item.key,
        html: renderToStaticMarkup(React.createElement(RegistrationCard, {
          venueSlug: item.venueSlug || 'binance',
          fallbackDomain: item.fallbackDomain || 'www.binance.com',
          locale: item.locale || 'en',
          market: item.market,
          product: item.product || 'spot',
          accountStage: item.accountStage,
          funding: item.funding,
          compact: item.compact ?? true,
        })),
      }))));
    `);
    const esbuildBin = path.join(projectRoot, 'node_modules/.bin/esbuild');
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, '--bundle', '--platform=node', '--format=cjs', `--outfile=${bundlePath}`, '--loader:.css=empty', '--log-level=warning'], { cwd: projectRoot, stdio: 'pipe' });
    return JSON.parse(execFileSync('node', [bundlePath], { cwd: projectRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test('R122 registration route details has independent copy for all supported locales', () => {
  assert.ok((source.match(/routeDetailsTitle:/g) || []).length >= expectedTitles.size + 1, 'each supported locale and runtime fallback has independent copy');
  for (const [locale, title] of expectedTitles) {
    assert.match(source, new RegExp(`routeDetailsTitle:\\s*${JSON.stringify(title).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `${locale} route details title exists`);
  }
  assert.match(source, /<strong>\{copy\.routeDetailsTitle\}<\/strong>/, 'details summary uses routeDetailsTitle for the route/status disclosure');
  assert.match(source, /className="registration-card__preflight"[\s\S]*<strong>\{copy\.preflightTitle\}<\/strong>/, 'main preflight still uses preflightTitle');
});

test('R122 compact SSR separates preflight from native route details without removing content', async () => {
  const pages = await renderRegistrationCases([
    { key: 'en-binance', locale: 'en', venueSlug: 'binance', compact: true },
    { key: 'ja-binance', locale: 'ja', venueSlug: 'binance', compact: true },
    { key: 'zh-bitget', locale: 'zh-Hans', venueSlug: 'bitget', compact: true },
  ]);

  for (const { key, html } of pages) {
    assert.ok(html.indexOf('data-cta-placement="registration-card-primary"') < html.indexOf('class="registration-card__mobile-route-details"'), `${key} primary action precedes secondary details`);
    assert.match(html, /class="registration-card__mobile-route-details"/, `${key} keeps native details`);
    assert.match(html, /<summary class="registration-card__mobile-route-summary">/, `${key} keeps keyboard-native summary`);

    assert.match(html, /class="registration-card__state-list"/, `${key} keeps route, benefit and region state list`);

    assert.doesNotMatch(html, /<summary class="registration-card__mobile-route-summary"><span><strong>Before you continue<\/strong>/, `${key} no longer repeats English preflight title in compact summary`);
  }

  const enHtml = pages.find((page) => page.key === 'en-binance').html;
  assert.doesNotMatch(enHtml, /data-registration-preflight=/, 'direct registration does not repeat a blocked-route preflight');
  assert.match(enHtml, />Route, code and eligibility details<\//, 'English summary has the new route details label');
  assert.match(enHtml, /11350287/, 'Binance invite code remains visible');
  assert.ok(enHtml.includes('/go/binance?src=registration-card-primary&locale=en'.replaceAll('&','&amp;')), 'current canonical Binance route');

  const jaHtml = pages.find((page) => page.key === 'ja-binance').html;
  assert.ok(jaHtml.includes('/go/binance?src=registration-card-primary&locale=ja'.replaceAll('&','&amp;')), 'Japanese direct route stays available');
  assert.match(jaHtml, />ルート・コード・利用条件の詳細<\//, 'Japanese summary uses independent route details label');

  const bitgetHtml = pages.find((page) => page.key === 'zh-bitget').html;
  assert.match(bitgetHtml, /nexu888/, 'Bitget invite code remains visible');
  assert.ok(bitgetHtml.includes('/go/bitget?src=registration-card-primary&locale=zh-Hans'.replaceAll('&','&amp;')), 'current canonical Bitget route');
});

test('R122 registration hierarchy keeps partner registry protected', () => {
  const sha = createHash('sha256').update(registry).digest('hex');
  assert.equal(sha, committedFileHash('src/data/partner-registry.js'));
});
