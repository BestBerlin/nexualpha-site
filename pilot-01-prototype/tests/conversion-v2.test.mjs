import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { conversionCta, stickyVisible, articleVenueKeys } from '../src/components/v3/conversion/conversion-model.js';
import { publicCtaForVenue, venueGoHref } from '../src/data/source-bound-cta.js';
import { v3ShellCopy } from '../src/data/v3-shell-copy.js';
const require = createRequire(import.meta.url), React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createRoot } = require('react-dom/client');
function bundle(file) {
  const code = buildSync({entryPoints:[fileURLToPath(new URL(file,import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs',external:['react','react-dom','react/jsx-runtime'],loader:{'.css':'empty'}}).outputFiles[0].text;
  const module={exports:{}}; new Function('require','module','exports',code)(require,module,module.exports); return module.exports;
}
const { ArticleDecisionCard, articleDecision } = bundle('../src/components/v3/news/ArticleDecisionCard.jsx');
const { VenueStickyBar } = bundle('../src/components/v3/conversion/VenueStickyBar.jsx');
const locales=['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','ja','ko','ar','tr','ru','id','vi','it','ur','uk'];
const neutral=['zh-Hant','ar','ru','vi','ur','uk'];
const article={relatedVenues:['bitget','bitget']};
const render=(Component,props)=>new JSDOM(renderToStaticMarkup(React.createElement(Component,props))).window.document;

test('partner, non-partner, restricted market and neutral locale gates',()=>{
  assert.equal(conversionCta('bitget','en').registrationUrl,publicCtaForVenue('bitget','en').registrationUrl);
  for(const [slug,locale,market] of [['coinbase','en'],['bitget','tr'],['bitget','en','TR'],['okx','en','US'],['okx','en','VN'],['okx','ar'],['okx','ru-RU']]){
    assert.equal(conversionCta(slug,locale,market),null,`${slug}/${locale}/${market}`);
    assert.equal(render(VenueStickyBar,{slug,locale,market}).querySelector('[data-conversion-sticky]'),null);
  }
  const state={eligible:true,mobile:true,dismissed:false,heroPassed:true,ctaVisible:false};
  assert.equal(stickyVisible(state),true);
  for(const change of [{eligible:false},{mobile:false},{dismissed:true},{heroPassed:false},{ctaVisible:true},{footerVisible:true}])assert.equal(stickyVisible({...state,...change}),false);
});

test('one decision per article; deduplicated subjects/entities; checked fees required',()=>{
  assert.deepEqual(articleVenueKeys({subject:'Bitget',entityKeys:['venue:bitget'],relatedVenues:['bitget']}),['bitget']);
  for(const value of [article,{subject:'bitget'},{entityKeys:['exchange:bitget']}]){
    assert.equal(articleDecision(value,'en').kind,'signup');
    assert.equal(render(ArticleDecisionCard,{article:value}).querySelectorAll('[data-article-decision]').length,1);
  }
  for(const value of [{},{relatedVenues:['coinbase']},{relatedVenues:['kucoin']},{relatedVenues:['okx','mexc']}])assert.equal(articleDecision(value,'en'),null);
  for(const [locale,market] of [['tr'],['en','TR'],['en','US']])assert.equal(articleDecision(article,locale,market),null);
});

test('two partners produce one canonical paired-logo compare link without a signup/code',()=>{
  const doc=render(ArticleDecisionCard,{article:{relatedVenues:['okx','binance','okx']},locale:'zh-Hans'});
  assert.equal(doc.querySelectorAll('[data-article-decision]').length,1);
  assert.equal(doc.querySelector('[data-article-decision]').dataset.articleDecision,'compare');
  assert.equal(doc.querySelector('a').getAttribute('href'),'/zh-hans/compare/binance-vs-okx');
  assert.equal(doc.querySelectorAll('[data-cta-kind="registration"],code').length,0);
  assert.equal(doc.querySelector('.cv-decision__logos').children.length,2);
});

test('17 locales reuse localized disclosure/copy and exact source-bound CTA hrefs/codes',()=>{
  for(const locale of locales){
    const doc=render(ArticleDecisionCard,{article,locale}),bar=render(VenueStickyBar,{slug:'bitget',locale});
    if(!conversionCta('bitget',locale)){
      assert.equal(doc.querySelector('[data-article-decision]'),null,locale);
      assert.equal(bar.querySelector('[data-conversion-sticky]'),null,locale);continue;
    }
    const cta=publicCtaForVenue('bitget',locale);
    assert.equal(doc.querySelector('[data-cta-kind="registration"]').getAttribute('href'),cta.registrationUrl,locale);
    assert.equal(doc.querySelector('code').textContent,cta.inviteCode,locale);
    assert.equal(doc.querySelector('.cv-disclosure').textContent,v3ShellCopy(locale).relationship,locale);
    assert.ok(doc.querySelector('[aria-live="polite"]'),locale);
    assert.equal(doc.querySelectorAll('.cv-decision__fees time').length,2,locale);
    assert.equal(bar.querySelector('[data-cta-kind="registration"]').getAttribute('href'),venueGoHref('bitget','venue-mobile-sticky',locale),locale);
    assert.equal(bar.querySelector('.cv-disclosure').textContent,v3ShellCopy(locale).relationship,locale);
    assert.equal(bar.querySelector('aside').getAttribute('aria-hidden'),'true',locale);
  }
});

test('observer lifecycle, CTA visibility, resize, copy, session dismissal and blocked storage',async()=>{
  const dom=new JSDOM('<main class="v3-profile-page"><div data-cta-surface="venue-profile-main-registration"><a data-cta-kind="registration" id="hero">Hero</a></div><a data-cta-kind="registration" id="other">Other</a><div id="mount"></div></main><footer></footer>',{url:'https://nexualpha.test/exchanges/bitget'});
  const saved=new Map(),observed=[];
  const media={matches:true,addEventListener(_,fn){this.listener=fn;},removeEventListener(){}};
  let observer,disconnected=0,root;
  const stubs={window:dom.window,document:dom.window.document,navigator:{clipboard:{writeText:async()=>{}}},sessionStorage:dom.window.sessionStorage,IS_REACT_ACT_ENVIRONMENT:true,
    IntersectionObserver:class{constructor(cb){observer=cb;}observe(target){observed.push(target);}disconnect(){disconnected++;}}};
  dom.window.matchMedia=()=>media;
  for(const [key,value]of Object.entries(stubs)){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
  const props={slug:'bitget',locale:'en'},act=React.act;
  try{
    root=createRoot(dom.window.document.getElementById('mount'));
    await act(async()=>root.render(React.createElement(VenueStickyBar,props)));
    const bar=()=>dom.window.document.querySelector('[data-conversion-sticky]'),active=()=>bar().dataset.active;
    assert.equal(observed.some(target=>target.closest('[data-conversion-sticky]')),false,'never observe self');
    assert.equal(active(),'false');
    const hero=dom.window.document.getElementById('hero'),other=dom.window.document.getElementById('other');
    const emit=async(target,isIntersecting,bottom)=>act(async()=>observer([{target,isIntersecting,boundingClientRect:{bottom}}]));
    await emit(hero,false,1000);assert.equal(active(),'false');
    await emit(hero,true,100);assert.equal(active(),'false');
    await emit(hero,false,-1);assert.equal(active(),'true');
    await emit(other,true,200);assert.equal(active(),'false');
    await emit(other,false,-1);assert.equal(active(),'true');
    media.matches=false;await act(async()=>media.listener());assert.equal(active(),'false');
    media.matches=true;await act(async()=>media.listener());assert.equal(active(),'true');
    await act(async()=>bar().querySelector('.cv-code').click());assert.equal(bar().querySelector('[aria-live]').textContent,'Copied');
    await act(async()=>bar().querySelector('.cv-sticky__close').click());assert.equal(active(),'false');
    assert.equal(dom.window.sessionStorage.getItem('nx.conversion.dismissed.bitget'),'1');
    await act(async()=>root.unmount());root=createRoot(dom.window.document.getElementById('mount'));
    await act(async()=>root.render(React.createElement(VenueStickyBar,props)));assert.equal(active(),'false');
    await act(async()=>root.unmount());
    Object.defineProperty(globalThis,'sessionStorage',{get(){throw new Error('blocked');},configurable:true});
    root=createRoot(dom.window.document.getElementById('mount'));
    await act(async()=>root.render(React.createElement(VenueStickyBar,props)));
    await emit(hero,false,-1);assert.equal(active(),'true');
    await act(async()=>bar().querySelector('.cv-sticky__close').click());assert.equal(active(),'false');assert.ok(disconnected>=1);
  }finally{if(root)await act(async()=>root.unmount());for(const[key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}dom.window.close();}
});

test('route CSS uses fixed overlay/reduced motion; no scroll listeners',()=>{
  const bar=readFileSync(new URL('../src/components/v3/conversion/VenueStickyBar.jsx',import.meta.url),'utf8');
  assert.match(bar,/new IntersectionObserver/);assert.doesNotMatch(bar,/addEventListener\(['"]scroll/);
  const css=readFileSync(new URL('../src/components/v3/conversion/venue-sticky-bar.css',import.meta.url),'utf8');
  const articleCss=readFileSync(new URL('../src/components/v3/news/article-decision-card.css',import.meta.url),'utf8');
  assert.match(articleCss,/\.news-detail-page \.cv-decision/);
  assert.doesNotMatch(articleCss,/\.news-detail /);
  assert.match(css,/position: fixed/);assert.match(css,/max-width: 767px/);assert.match(css,/prefers-reduced-motion: reduce/);
});

test('saved route SSR places exactly one article card immediately after the lead answer',()=>{
  for(const [file,locale]of [['zh-hans-article.html','zh-Hans'],['en-article.html','en']]){
    const html=readFileSync(new URL(`../docs/evidence/conversion-v2/${file}`,import.meta.url),'utf8');
    const doc=new JSDOM(html).window.document;
    const lead=doc.querySelector('.news-detail__prose--lead');
    assert.equal(lead.nextElementSibling.dataset.articleDecision,'signup',file);
    assert.equal(doc.querySelectorAll('[data-article-decision]').length,1,file);
    const cta=publicCtaForVenue('okx',locale);
    assert.equal(doc.querySelector('[data-cta-placement="article-decision-signup"]').getAttribute('href'),cta.registrationUrl,file);
    assert.equal(doc.querySelector('.cv-code code').textContent,cta.inviteCode,file);
    assert.ok(doc.querySelector('.cv-decision .cv-disclosure'),file);
  }
});

 test('checked fee decimals use the existing fee formatter without floating point tails',()=>{
  const doc=render(ArticleDecisionCard,{article:{relatedVenues:['hyperliquid']},locale:'en'});
  assert.ok(doc.querySelector('[data-article-decision]'));
  assert.match(doc.querySelector('.cv-decision__fees').textContent,/0\.07%/);
  assert.doesNotMatch(doc.querySelector('.cv-decision__fees').textContent,/0\.069999/);
});
