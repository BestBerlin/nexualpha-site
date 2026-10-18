import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
const code = buildSync({ stdin: { contents: `
  import React from 'react';
  import {renderToStaticMarkup} from 'react-dom/server';
  import {LiveCampaigns,campaignPresentation} from './src/components/v3/activity/LiveCampaigns.jsx';
  export {campaignPresentation};
  export const render = (locale, initialFeed) => renderToStaticMarkup(React.createElement(LiveCampaigns,{locale,initialFeed}));
`, resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader:'jsx' }, bundle:true, write:false, external:['react','react-dom/server','react/jsx-runtime'], platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'} }).outputFiles[0].text;
const module = {exports:{}};
vm.runInNewContext(code,{module,exports:module.exports,require:createRequire(import.meta.url),console,URL,URLSearchParams,Date,Intl,setTimeout,clearTimeout});
const {render,campaignPresentation} = module.exports;
const item = {id:'okx:test',venue:'okx',category:'event',title:'Official trading contest',summary:'English campaign summary',url:'https://www.okx.com/help/test',publishedAt:new Date(Date.now()-3600000).toISOString()};
test('an English-only brief does not masquerade as a localized campaign',()=>{
  const feed={campaignBriefs:[{id:item.id,headline:{en:'English brief'},summary:{en:'English summary'}}]};
  const result=campaignPresentation(item,feed,'ar');
  assert.equal(result.compactNotice,true);
  assert.equal(result.sourceLanguage,'en');
  assert.equal(result.summary,'');
  assert.equal(item.summary,'English campaign summary');
});
test('requested brief and source headline locales preserve raw feed data and featured campaigns',()=>{
  const feed={campaignBriefs:[{id:item.id,headline:{'zh-Hans':'官方交易赛'},summary:{'zh-Hans':'本地摘要'}}]};
  const result=campaignPresentation(item,feed,'zh-Hans');
  assert.equal(result.title,'官方交易赛');
  assert.equal(result.summary,'本地摘要');
  assert.equal(result.compactNotice,false);
  assert.equal(campaignPresentation({...item,title:{ar:'مسابقة رسمية',en:item.title}}, {},'ar').compactNotice,false);
  assert.equal(campaignPresentation({...item,featured:true}, {},'ar').compactNotice,undefined);
});
test('untranslated notices show five compact links plus localized expansion',()=>{
  const feed={items:Array.from({length:7},(_,i)=>({...item,id:`okx:${i}`,title:`Official contest ${i}`}))};
  for(const locale of ['zh-Hans','ar']) {
    const html=render(locale,feed);
    const group=html.slice(html.indexOf('data-campaign-group="okx"'));
    assert.equal((group.match(/data-compact-notice="true"/g)||[]).length,5);
    assert.doesNotMatch(group,/English campaign summary|live-campaigns__card|activities-live-campaign/);
    assert.match(group,/aria-expanded="false"/);
    assert.match(group,/lang="en"/);
  }
});
