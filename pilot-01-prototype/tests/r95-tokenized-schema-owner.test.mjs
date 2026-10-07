import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { TOKENIZED_ASSET_PAGES, tokenizedAssetLocalized } from '../src/data/tokenized-assets-cluster.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = await mkdtemp(path.join(root, 'tests/.tmp-r95-schema-'));
let rendered;
try {
  const entry = path.join(dir, 'entry.mjs');
  const bundle = path.join(dir, 'bundle.cjs');
  await writeFile(entry, `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server';
    import {TokenizedAssetsPage} from '../../src/components/v3/TokenizedAssetsPage.jsx';
    const result={}; for(const slug of ${JSON.stringify(Object.keys(TOKENIZED_ASSET_PAGES))}) for(const locale of ['en','zh-Hans'])
      result[slug+'|'+locale]=renderToStaticMarkup(React.createElement(TokenizedAssetsPage,{slug,locale}));
    console.log(JSON.stringify(result));`);
  await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, loader: { '.css': 'empty' }, logLevel: 'silent' });
  rendered = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
} finally { await rm(dir, { recursive: true, force: true }); }

function schemas(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(match => { const value = JSON.parse(match[1]); return value['@graph'] || [value]; });
}

for (const page of Object.values(TOKENIZED_ASSET_PAGES)) for (const locale of ['en', 'zh-Hans']) {
  test(`${page.slug}/${locale}: one schema owner agrees with the visible FAQ`, async () => {
    const body = rendered[`${page.slug}|${locale}`];
    const shell = `<!doctype html><html><head><title>base</title></head><body>${body}</body></html>`;
    const pathname = `${locale === 'en' ? '' : '/zh-hans'}${page.path}`;
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: 'text/html' } }), {
      ASSETS: { fetch: async request => new URL(request.url).pathname.endsWith('.json')
        ? new Response('missing', { status: 404 })
        : new Response(shell, { headers: { 'content-type': 'text/html' } }) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    const nodes = schemas(html);
    for (const type of ['FAQPage', 'CollectionPage', 'BreadcrumbList']) {
      assert.equal(nodes.filter(node => node['@type'] === type).length, 1, `${type} has exactly one emitter`);
    }
    const collection = nodes.find(node => node['@type'] === 'CollectionPage');
    assert.equal(collection.mainEntity['@type'], 'ItemList');
    assert.deepEqual(collection.mainEntity.itemListElement.map(row => [row.name,row.description]), page.decisionRows.map(row => [tokenizedAssetLocalized(row.label,locale),tokenizedAssetLocalized(row.verify,locale)]));
    const actual = nodes.find(node => node['@type'] === 'FAQPage').mainEntity.map(question => [question.name, question.acceptedAnswer.text]);
    assert.deepEqual(actual, page.faqs.map(faq => [tokenizedAssetLocalized(faq.q, locale), tokenizedAssetLocalized(faq.a, locale)]));
    assert.doesNotMatch(body, /data-nexualpha-tokenized-schema|page body emits FAQPage|结构化数据已随页面正文输出/);
  });
}
