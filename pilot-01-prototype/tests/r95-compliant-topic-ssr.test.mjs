import { outboundLink, sourceDomain } from '../src/data/exchange-outbound.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { TOPIC_GUIDES } from '../src/data/topic-guides-data.js';
import { topicFaqSchemaEntries } from '../src/data/topic-source-registry.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = await mkdtemp(path.join(root, 'tests/.tmp-r95-schema-'));
let rendered;
try {
  const entry = path.join(dir, 'entry.mjs');
  const bundle = path.join(dir, 'bundle.cjs');
  await writeFile(entry, `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server';
    import {TopicGuidePage} from '../../src/components/v3/TopicGuidePage.jsx';
    const result={}; for(const locale of ['en','zh-Hans','zh-Hant'])
      result[locale]=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug:'compliant-exchanges',locale}));
    console.log(JSON.stringify(result));`);
  await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, loader: { '.css': 'empty' }, logLevel: 'silent' });
  rendered = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
} finally { await rm(dir, { recursive: true, force: true }); }

function schemas(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(match => { const value = JSON.parse(match[1]); return value['@graph'] || [value]; });
}

for (const locale of ['en', 'zh-Hans', 'zh-Hant']) {
  test(`compliant topic/${locale}: visible funding answers match both metadata paths`, async () => {
    const body = rendered[locale];
    assert.doesNotMatch(body, /zero (?:bank card|P2P) freeze|foolproof|completely eliminating|0 冻卡风险|零 P2P 冻卡风险|100% 银行同名|冻结后优先赔付/i);
    const expected = topicFaqSchemaEntries('compliant-exchanges', locale);
    assert.equal(expected.length, 3);
    for (const question of expected) {
      assert.ok(question.name && question.acceptedAnswer.text);
      assert.ok(question.acceptedAnswer.citation.length);
      // JSX entity escaping does not alter the published text contract.
      const visible = body.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"');
      assert.ok(visible.includes(question.name));
      assert.ok(visible.includes(question.acceptedAnswer.text));
      for (const url of question.acceptedAnswer.citation) {
        const link = outboundLink(url, { locale });
        if (link) assert.ok(visible.includes(link.href), `${locale}: attributed official source ${url}`);
        else assert.ok(body.includes(`data-source-plain="${sourceDomain(url)}"`), `${locale}: explicit official source domain remains visible`);
      }
    }
    for (const faq of TOPIC_GUIDES['compliant-exchanges'].faqs) {
      for (const source of faq.sources) {
        assert.match(source.reviewedAt, /^2026-10-02$/);
        assert.ok(body.includes(`dateTime="${source.reviewedAt}"`));
        assert.ok(body.includes(`dateTime="${source.updatedAt}"`));
      }
    }
    const pathname = `${locale === 'en' ? '' : locale === 'zh-Hans' ? '/zh-hans' : '/zh-hant'}/topics/compliant-exchanges`;
    const shell = `<!doctype html><html><head><title>base</title></head><body>${body}</body></html>`;
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: 'text/html' } }), {
      ASSETS: { fetch: async request => new URL(request.url).pathname.endsWith('.json') ? new Response('missing',{status:404}) : new Response(shell,{headers:{'content-type':'text/html'}}) },
    });
    assert.equal(response.status,200);
    const faq = schemas(await response.text()).filter(node => node['@type'] === 'FAQPage');
    assert.equal(faq.length,1);
    assert.deepEqual(faq[0].mainEntity,expected);
    const client = computeRouteSeo({ pathname, locale });
    assert.deepEqual(client.schemas.find(node => node['@type'] === 'FAQPage').mainEntity,expected);
  });
}
