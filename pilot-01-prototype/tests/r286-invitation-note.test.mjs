import { restoreEvidenceJs, restoreEvidenceCss } from './fixtures/r286-profile-evidence-summary-inverse.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
const root=fileURLToPath(new URL('../',import.meta.url));
const component=path.join(root,'src/components/v3/V3Pages.jsx');
const baseline=path.join(root,'../baseline/V3Pages.before-invitation-note.jsx');
const sha=s=>createHash('sha256').update(s).digest('hex');
const before=readFileSync(baseline,'utf8'),after=restoreEvidenceJs(readFileSync(component,'utf8'));
const notes=JSON.parse(readFileSync(path.join(root,'tests/fixtures/r286-invitation-note-copy.json'),'utf8'));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;').replaceAll("'",'&#x27;');
const line='                  <small>{invitationSummary.note}</small>\n';
const marker='                  <strong>{venueCta.direct ? (isZhLocale ? zhText(locale, "使用上方官方入口继续", "使用上方官方入口繼續") : runtimeUi.stickyDirectRoute) : (isZhLocale ? zhText(locale, "先核对地区资格", "先核對地區資格") : runtimeUi.globalVerification)}</strong>\n';
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
const profileReviewLinkNew='<LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`} className="button-quiet v3-profile-registration-review-link">{text.registrationPrepCta}</LocalLink>';
const profileReviewLinkOld='<LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`} className="button-primary">{text.registrationPrepCta}</LocalLink>';
const profileReviewClassNew='class="button-quiet v3-profile-registration-review-link"';
const profileReviewClassOld='class="button-primary"';
const profileReviewOldAnchor=/<a class="button-primary" href="([^"]*\/exchanges\/[^"]*#registration-path)"([^>]*)>([\s\S]*?)<\/a>/g;
const profileReviewNewAnchor=/<a class="button-quiet v3-profile-registration-review-link" href="([^"]*\/exchanges\/[^"]*#registration-path)"([^>]*)>([\s\S]*?)<\/a>/g;
function restoreProfileReviewLink(source){assert.equal(source.split(profileReviewLinkNew).length,2,'authorized profile review source class hunk should occur once');return source.replace(profileReviewLinkNew,profileReviewLinkOld);}
function replaceExactlyOneAnchor(html,pattern,replacer,label){const matches=[...html.matchAll(pattern)];assert.equal(matches.length,1,`${label} should match exactly one profile registration-path anchor`);return html.replace(pattern,replacer);}
function applyProfileReviewHtml(html){return replaceExactlyOneAnchor(html,profileReviewOldAnchor,'<a '+profileReviewClassNew+' href="$1"$2>$3</a>','authorized profile review baseline anchor');}
function restoreProfileReviewHtml(html){return replaceExactlyOneAnchor(html,profileReviewNewAnchor,'<a '+profileReviewClassOld+' href="$1"$2>$3</a>','authorized profile review rendered anchor');}
test('one body note deletion is exactly reversible and keeps source commercial ownership',()=>{
 assert.equal(sha(before),'f063243966287ccaff5080c2bfaef3acf3c91ae9c69d3fac77cbd4951a0d90ab');
 assert.equal(after.includes(line),false);assert.equal(after.split(marker).length,2);
 let restored=after.replace(marker,marker+line);for(const locale of locales){const n='note: '+JSON.stringify(notes.new[locale]);assert.equal(restored.split(n).length,2);restored=restored.replace(n,'note: '+JSON.stringify(notes.old[locale]));}assert.equal(restoreProfileReviewLink(restored),before);
 assert.equal((after.match(/<span>\{invitationSummary.note\}<\/span>/g)||[]).length,1);
 const hrefs=s=>[...s.matchAll(/href=\{?[^\n>]+/g)].map(m=>m[0]);assert.deepEqual(hrefs(restoreProfileReviewLink(after)),hrefs(before));
 assert.equal(sha(readFileSync(path.join(root,'src/data/partner-registry.js'))),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
test('profile CTA class hunk is the only extra source authorization in invitation-note scope',()=>{
 assert.equal(after.split(profileReviewLinkNew).length,2);
 assert.equal(restoreProfileReviewLink(after).split(profileReviewLinkOld).length,2);
 assert.equal(restoreProfileReviewLink(after).includes('v3-profile-registration-review-link'),false);
});
test('profile CTA SSR helper targets only the registration-path anchor and rejects duplicates',()=>{
 const sample='<a class="button-primary" href="/en/exchanges/bitget">Unrelated primary</a><a class="button-primary" href="/en/exchanges/bitget?market=BR&amp;product=spot#registration-path">Review signup conditions</a>';
 const changed=applyProfileReviewHtml(sample);
 assert.ok(changed.includes('<a class="button-primary" href="/en/exchanges/bitget">Unrelated primary</a>'));
 assert.ok(changed.includes('<a class="button-quiet v3-profile-registration-review-link" href="/en/exchanges/bitget?market=BR&amp;product=spot#registration-path">Review signup conditions</a>'));
 assert.equal(restoreProfileReviewHtml(changed),sample);
 assert.throws(()=>applyProfileReviewHtml(sample+'<a class="button-primary" href="/en/exchanges/binance#registration-path">Second target</a>'),/exactly one profile registration-path anchor/);
 assert.throws(()=>restoreProfileReviewHtml(changed+changed),/exactly one profile registration-path anchor/);
});
function restoreEvidenceSummaryHtml(html, locale) {
 const labels = { 'zh-Hans': ['展开深度核验资料', '打开深度核验资料'], 'zh-Hant': ['展開深度核驗資料', '打開深度核驗資料'] };
 if (!labels[locale]) return html;
 const [title, hint] = labels[locale];
 const needle = `<details class="v3-profile-evidence-drawer"><summary><strong>${title}</strong><b aria-hidden="true">＋</b>`;
 assert.equal(html.split(needle).length, 2, 'exact Chinese evidence summary must occur once');
 return html.replace(needle, needle.replace('<b aria-hidden="true">', `<span>${hint}</span><b aria-hidden="true">`));
}
test('Chinese evidence HTML inverse is scoped and rejects duplicated or damaged targets', () => {
 const sample='<details class="v3-profile-evidence-drawer"><summary><strong>展开深度核验资料</strong><b aria-hidden="true">＋</b></summary>';
 assert.ok(restoreEvidenceSummaryHtml(sample, 'zh-Hans').includes('<span>打开深度核验资料</span>'));
 assert.equal(restoreEvidenceSummaryHtml(sample, 'en'), sample);
 assert.throws(() => restoreEvidenceSummaryHtml(sample+sample, 'zh-Hans'));
 assert.throws(() => restoreEvidenceSummaryHtml(sample.replace('展开深度核验资料', '改变正文'), 'zh-Hans'));
});
test('75 actual React SSR profiles preserve full HTML except approved note and duplicate removal',async()=>{
 const dir=await mkdtemp(path.join(root,'tests/.tmp-r286-note-'));
 try{
  const entry=path.join(dir,'entry.mjs'),bundle=path.join(dir,'bundle.cjs');
  await writeFile(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {VenueDetailPage} from ${JSON.stringify(component)};import {VenueDetailPage as Before} from 'r286-note-before';import {venueDatabase} from ${JSON.stringify(path.join(root,'src/data/venue-database.js'))};const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...a){super(...(a.length?a:['2026-10-06T00:00:00Z']));}static now(){return 1791244800000;}};const venues=Object.values(venueDatabase);const copy={common:{dimension:'Dimension'},assetCapabilities:{none:'Pending source review'}};console.log(JSON.stringify(['bitget','binance','backpack','uniswap'].flatMap(slug=>${JSON.stringify(locales)}.map(locale=>({slug,locale,market:'unknown'}))).concat(${JSON.stringify(locales)}.map(locale=>({slug:'binance',locale,market:'US'}))).map(({slug,locale,market})=>{const props={venue:venueDatabase[slug],venues,locale,updates:[],copy,market,product:'spot'};return {slug,locale,market,before:renderToStaticMarkup(React.createElement(Before,props)),after:renderToStaticMarkup(React.createElement(VenueDetailPage,props))};})));`);
  await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:bundle,loader:{'.css':'empty'},logLevel:'error',plugins:[{name:'exact-before-source-current-dependencies',setup(b){b.onResolve({filter:/^r286-note-before$/},()=>({path:'r286-note-before',namespace:'note-before'}));b.onLoad({filter:/.*/,namespace:'note-before'},()=>({contents:before,loader:'jsx',resolveDir:path.dirname(component)}));}}]});
  const rows=JSON.parse(execFileSync(process.execPath,[bundle],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024}));assert.equal(rows.length,75);
  for(const r of rows){const normalizedAfter=restoreEvidenceSummaryHtml(r.after,r.locale);const m=r.before.match(/<div class="v3-rebate-route-summary">[\s\S]*?<small>([\s\S]*?)<\/small><\/div>/);assert.ok(m,`${r.slug}/${r.locale} real baseline note`);const duplicate=`<small>${m[1]}</small>`;assert.equal(m[0].split(duplicate).length,2);const oldSpan=`<span>${escape(notes.old[r.locale])}</span>`,newSpan=`<span>${escape(notes.new[r.locale])}</span>`;assert.equal(r.before.split(oldSpan).length,2);const expected=r.before.replace(m[0],m[0].replace(duplicate,'')).replace(oldSpan,newSpan);const expectedWithProfileCta=applyProfileReviewHtml(expected);assert.equal(expectedWithProfileCta,normalizedAfter,`${r.slug}/${r.locale} full HTML exact bounded change plus authorized profile CTA class`);assert.equal(restoreProfileReviewHtml(normalizedAfter),expected,`${r.slug}/${r.locale} profile CTA class is the only additional HTML hunk`);assert.ok(r.after.includes(newSpan),`${r.slug}/${r.locale} full summary note remains`);}
 }finally{await rm(dir,{recursive:true,force:true});}
});
