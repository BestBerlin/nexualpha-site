import { newsListHeroCopy, NEWS_LIST_COPY_LOCALES } from '../src/data/news-list-copy.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildSync} from 'esbuild';
const root=fileURLToPath(new URL('../',import.meta.url)), require=createRequire(import.meta.url), React=require('react'), {renderToStaticMarkup}=require('react-dom/server');
const sourcePath=path.join(root,'src/components/v3/news/NewsListPage.jsx'),source=fs.readFileSync(sourcePath,'utf8'),baseline=fs.readFileSync(path.join(root,'baseline/NewsListPage.before-reading-copy.jsx'),'utf8'),fixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/r286-news-reading-copy.json'))),rawFeed=fs.readFileSync(path.join(root,'public/content/news-feed.json')),feed=JSON.parse(rawFeed).articles;
const sha=v=>createHash('sha256').update(v).digest('hex');
class FixedDate extends Date {constructor(...a){super(...(a.length?a:[1791190800000]));}static now(){return 1791190800000;}}
function load(s){const code=buildSync({stdin:{contents:s+'\nexport {copy};',resolveDir:path.dirname(sourcePath),loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}}).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const current=load(source),esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
function render(m,locale,initialArticles){return renderToStaticMarkup(React.createElement(m.NewsListPage,{locale,market:'BR',product:'spot',initialArticles}));}
test('news hero uses one shared locale source across the rendered listing', () => {
  assert.equal(NEWS_LIST_COPY_LOCALES.length, 17);
  assert.match(source, /const hero = newsListHeroCopy\(locale\)/);
  for (const locale of NEWS_LIST_COPY_LOCALES) {
    for (const field of ['title', 'subtitle']) assert.ok(newsListHeroCopy(locale)[field].trim(), `${locale}/${field}`);
  }
});
for (const locale of NEWS_LIST_COPY_LOCALES) test(locale + ' real component SSR ready/empty/loading keeps its shared title and subtitle', () => {
  const hero = newsListHeroCopy(locale);
  for (const initialArticles of [feed, [], undefined]) {
    const html = render(current, locale, initialArticles);
    for (const [field, tag] of [['title', 'h1'], ['subtitle', 'p']]) {
      const cls = field === 'title' ? 'news-hero__title' : 'news-hero__subtitle';
      const expected = `<${tag} class="${cls}">${esc(hero[field])}</${tag}>`;
      assert.equal(html.split(expected).length - 1, 1, `${locale}/${field} remains complete in every feed state`);
    }
    assert.doesNotMatch(html, /(?:undefined|\[object Object\])/);
  }
});
