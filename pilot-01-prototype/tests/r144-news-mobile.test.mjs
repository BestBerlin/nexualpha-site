import { existsSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
const path = 'src/components/v3/news/news-list-page.css';
const read = p => readFileSync(new URL('../'+p, import.meta.url),'utf8');
const baseline = p => readFileSync(new URL('../../../r143-interaction-integration/candidate/'+p, import.meta.url),'utf8');
const css = read(path);
const mobile = postcss.parse(css).nodes.find(n=>n.type==='atrule'&&n.params==='(max-width: 640px)'&&n.nodes.some(r=>r.selector==='.news-tabs'));
const declarations = selector => Object.fromEntries(mobile.nodes.find(n=>n.selector===selector).nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
test('four category buttons use a two-column mobile grid without clipped text or concealed scrolling',()=>{
 const tabs=declarations('.news-tabs'), button=declarations('.news-tab');
 assert.equal(tabs.display,'grid'); assert.equal(tabs['grid-template-columns'],'repeat(2, minmax(0, 1fr))');
 assert.equal(tabs.width,'100%'); assert.equal(button['min-width'],'0');
 assert.equal(button['white-space'],'normal'); assert.equal(button.hyphens,'auto'); assert.equal(button['overflow-wrap'],'anywhere'); assert.equal(button['min-block-size'],'44px');
 assert.ok(!mobile.nodes.some(n=>n.selector==='.news-tabs::-webkit-scrollbar'));
 for(const d of [...Object.entries(tabs),...Object.entries(button)]) assert.ok(!['overflow','overflow-x','text-overflow','line-clamp'].includes(d[0]));
});
test('only bounded mobile category CSS and the R164 four-card news grid hunk change; all article behavior remains exact', { skip: !existsSync(new URL('../../../r143-interaction-integration/candidate/src/components/v3/news/NewsListPage.jsx', import.meta.url)) && 'Original historical source snapshot is absent from a fresh checkout' },()=>{
 const strip = s => s
   .replace(/@media \(min-width: 641px\) \{\n  \.news-grid\[data-visible-count=\"4\"\] \{\n    grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);\n  \}\n\}\n\n/g,'')
   .replace(/  \.news-tabs \{[\s\S]*?  \.news-article-card__footer \{/,'  .news-article-card__footer {');
 const cardStart=css.indexOf('\n.news-article-card {');const cardEnd=css.indexOf('\n}',cardStart);assert.ok(cardStart>=0&&cardEnd>cardStart);const card=css.slice(cardStart,cardEnd);assert.equal((card.match(/min-height: 0;/g)||[]).length,1,'sole R185 natural-height declaration');const beforeHeight=css.slice(0,cardStart)+card.replace('min-height: 0;','min-height: 20rem;')+css.slice(cardEnd);
 assert.equal(strip(beforeHeight),strip(baseline(path)));
 assert.match(css,/\.news-tabs \{\s*display: inline-flex;/);
 assert.match(css,/@media \(min-width: 641px\) \{\n  \.news-grid\[data-visible-count=\"4\"\] \{\n    grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
});
test('component behavior, all article links/data and commercial registry are byte-preserved', { skip: !existsSync(new URL('../../../r143-interaction-integration/candidate/src/components/v3/news/NewsListPage.jsx', import.meta.url)) && 'Original historical source snapshot is absent from a fresh checkout' },()=>{
 for(const p of ['src/components/v3/news/NewsListPage.jsx','src/data/partner-registry.js']) assert.equal(read(p),baseline(p));
 const source=read('src/components/v3/news/NewsListPage.jsx');
 assert.match(source,/NEWS_INITIAL_VISIBLE_COUNT = 4/);
 for(const category of ['all','research','rates','compliance']){
 assert.ok(source.includes(`onClick={() => setActiveCategory("${category}")}`));
 assert.ok(source.includes(`aria-pressed={activeCategory === "${category}"}`));
 }
});
