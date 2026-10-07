import {withoutR180Copy} from './r180-source-scope.mjs';
import {withoutR175Registration} from './r176-peer-source.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const root=path.resolve(decodeURIComponent(new URL('..',import.meta.url).pathname));
const source=readFileSync(path.join(root,'src/components/v3/RegistrationCard.jsx'),'utf8');
const start=source.indexOf('const registrationNextStepCopy = Object.freeze(');
const end=source.indexOf('\nfunction getRegistrationNextStep',start);
const {map,copyDict:actualCopy}=vm.runInNewContext(source.slice(source.indexOf('const copyDict ='),source.indexOf('function getCopy('))+source.slice(start,end)+'\n({map:registrationNextStepCopy,copyDict})');
const locales=['es','fr','de','ar','ru','id','vi','it'];
test('missing locales own all three next-step routes with real dynamic code',()=>{for(const locale of locales){assert.ok(map[locale],locale);assert.ok(map[locale].label);for(const code of ['nexu888','11350287','luckybitcoin']){assert.equal(map[locale].withCode(code),actualCopy[locale].preflightWithCode.replace('{code}',code));assert.ok(map[locale].withCode(code).includes(code));assert.ok(!map[locale].withCode(code).includes('{code}'));}assert.equal(map[locale].noCode,actualCopy[locale].preflightNoCode);assert.equal(map[locale].research,actualCopy[locale].preflightBlocked);assert.notEqual(map[locale].noCode,map.en.noCode);assert.notEqual(map[locale].research,map.en.research);assert.ok(map[locale].noCode);assert.ok(map[locale].research);assert.notEqual(map[locale].label,map.en.label);}});
test('actual card SSR next-step never falls back to English in repaired locales',()=>{
 const temp=mkdtempSync(path.join(root,'tests/.tmp-r172-'));
 try { const entry=path.join(temp,'entry.jsx'),bundle=path.join(temp,'bundle.cjs');
 writeFileSync(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {RegistrationCard} from '../../src/components/v3/RegistrationCard.jsx';import {RegistrationCard as Before} from ${JSON.stringify(path.resolve(root,'../../r167-editorial-decision-integration/candidate/src/components/v3/RegistrationCard.jsx'))};Date.now=()=>1791190800000;console.log(JSON.stringify(${JSON.stringify(locales)}.flatMap(locale=>[{venueSlug:'bitget'},{venueSlug:'coinbase'},{venueSlug:'binance',market:'US',product:'perpetuals'}].map(props=>({locale,props,before:renderToStaticMarkup(React.createElement(Before,{locale,compact:true,...props})),html:renderToStaticMarkup(React.createElement(RegistrationCard,{locale,compact:true,...props}))})))));`);
 execFileSync(path.join(root,'node_modules/.bin/esbuild'),[entry,'--bundle','--platform=node','--format=cjs',`--outfile=${bundle}`,'--loader:.css=empty','--log-level=warning']);
 const pages=JSON.parse(execFileSync('node',[bundle],{encoding:'utf8'}));assert.equal(pages.length,24);
 for(const {locale,props,html,before} of pages){const content=html.match(/data-r37-cro="registration-card-next-step"[^>]*>([\s\S]*?)<\/div>/)?.[1];assert.ok(content,locale);const oldContent=before.match(/data-r37-cro="registration-card-next-step"[^>]*>([\s\S]*?)<\/div>/)?.[1];assert.ok(oldContent,locale);assert.equal(html.replace(content,oldContent),before,locale+'/'+props.venueSlug+' whole HTML except authorized nextstep copy');assert.ok(content.includes(map[locale].label),locale);const expected=props.venueSlug==='bitget'?map[locale].withCode('nexu888'):props.venueSlug==='coinbase'?map[locale].noCode:map[locale].research;const escaped=expected.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;').replaceAll("'",'&#x27;');assert.ok(content.includes(escaped),locale+'/'+props.venueSlug+' actual branch');assert.doesNotMatch(content,/Next step|Open the partner signup route|Open the official route|Review the official conditions/);}
 }finally{rmSync(temp,{recursive:true,force:true});}
});
test('registry remains unchanged',()=>{assert.equal(createHash('sha256').update(readFileSync(path.join(root,'src/data/partner-registry.js'))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});

test('inverse source removal preserves original seven locales and all render/gate/link logic exactly',()=>{const before=readFileSync(new URL('../../../r167-editorial-decision-integration/candidate/src/components/v3/RegistrationCard.jsx',import.meta.url),'utf8');const normalized=withoutR175Registration(withoutR180Copy(source));const mapStart=normalized.indexOf('const registrationNextStepCopy = Object.freeze(');const insertionStart=normalized.indexOf('  es: {',mapStart);const insertionEnd=normalized.indexOf('\n});',insertionStart);assert.ok(insertionStart>mapStart);assert.equal(normalized.slice(0,insertionStart-1)+normalized.slice(insertionEnd),before);});
