import { JSDOM } from 'jsdom';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const results=[];
for(const locale of ['ur','uk'])for(const path of ['','/exchanges','/exchanges/okx','/news','/about']){
 const url=`http://127.0.0.1:4189/${locale==='uk'?'uk-ua':locale}${path}`;
 const response=await fetch(url);assert.equal(response.status,200,url);
 const html=await response.text();const d=new JSDOM(html).window.document;
 const row={url,status:response.status,lang:d.documentElement.lang,dir:d.documentElement.dir,h1:d.querySelector('h1')?.textContent,robots:d.querySelector('meta[name="robots"]')?.content,canonical:d.querySelector('link[rel="canonical"]')?.href,alternates:d.querySelectorAll('link[hreflang]').length};
 assert.equal(row.lang,locale,url);assert.equal(row.dir,locale==='ur'?'rtl':'ltr',url);assert.ok(row.h1,url);assert.match(row.h1,locale==='ur'?/[\u0600-\u06ff]/:/[А-Яа-яІіЇїЄєҐґ]/u,url);assert.equal(row.robots,'noindex,follow',url);assert.equal(row.alternates,0,url);results.push(row);
}
writeFileSync('.locale-qa/ssr-results.json',JSON.stringify(results,null,2));console.log('PASS: 10/10 SSR routes: HTTP200, native H1, lang/dir, noindex and no hreflang promotion.');
