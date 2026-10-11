import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const locales = ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','ja','ko','ar','tr','ru','id','vi','it', "ur", "uk"];

test('cost decision localizes the whole rendered tool and keeps decimal input and original invitations', async () => {
  const temp = await mkdtemp(path.join(root,'tests/.tmp-cost-locales-'));
  try {
    await writeFile(path.join(temp,'entry.jsx'), `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { CostDecision } from '../../src/components/v3/CostDecision.jsx';
      console.log(JSON.stringify(Object.fromEntries(${JSON.stringify(locales)}.map(locale=>[locale,renderToStaticMarkup(<CostDecision locale={locale} product="spot"/>)]))));
    `);
    execFileSync(path.join(root,'node_modules/.bin/esbuild'),[path.join(temp,'entry.jsx'),'--bundle','--platform=node','--format=cjs','--loader:.css=empty',`--outfile=${path.join(temp,'bundle.cjs')}`,'--log-level=warning'],{cwd:root,stdio:'pipe'});
    const html=JSON.parse(execFileSync(process.execPath,[path.join(temp,'bundle.cjs')],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024}));
    for(const locale of locales) {
      if(locale!=='en') assert.doesNotMatch(html[locale], /CALCULATE YOUR TRADING COST|What does the same trading volume cost|Monthly volume|Order type|Pending source review|Offer &amp; eligibility|Register at|USDT\/mo<\/small>/ ,locale);
      assert.match(html[locale], /step="0\.01"/,locale);
      for(const href of ['https://www.bsmkweb.cc/join?ref=11350287&amp;utm_medium=web_share_copy','https://partner.bitget.cafe/bg/C6PRAF']) assert.ok(html[locale].includes(href),`${locale}: original invitation`);
      assert.ok(html[locale].indexOf('cost-decision__next-actions') < html[locale].indexOf('cost-decision__inputs'), `${locale}: next actions before inputs`);
      assert.ok(html[locale].includes('cost-decision__verdict'), `${locale}: compact reviewed-cost verdict`);
    }
    assert.match(html['zh-Hant'],/交易類別/);
    assert.match(html.ar, /حجم التداول/);
    assert.match(html.fr, /Volume mensuel/);
  } finally {
    await rm(temp,{recursive:true,force:true});
  }
});
