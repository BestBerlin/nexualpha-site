import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../pilot-01-prototype/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const gsap=readFileSync(new URL('./node_modules/gsap/dist/gsap.min.js',import.meta.url),'utf8');
for(const [ep,locale,total] of [['E05','en',135],['E09','en',155],['E21','en',124.9],['E05','zh-Hans',135]]){
 test(`${ep}/${locale}: build isolated outputs and preserve all scene narration`,()=>{
  const r=spawnSync(process.execPath,['build.mjs',`episodes/${ep}.json`,locale],{cwd:new URL('.',import.meta.url),encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  for(const format of ['landscape','portrait']){
   const html=readFileSync(new URL(`build/${ep}-${locale}-${format}/index.html`,import.meta.url),'utf8');
   const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost/'});
   const w=dom.window;w.eval(gsap);w.eval(w.document.querySelectorAll('script')[1].textContent);
   assert.equal(w.__timelines.academy.duration(),total);
   const schedule=JSON.parse(readFileSync(new URL(`evidence/timeline-${ep}-${locale}-${format}.json`,import.meta.url)));
   for(const scene of schedule.scenes){
    w.academySeek(scene.hero);
    const visible=[...w.document.querySelectorAll('.scene')].filter(n=>w.getComputedStyle(n).visibility==='visible');
    assert.deepEqual(visible.map(n=>n.id),[scene.id]);
   }
   assert.match(html,/One verified gateway|全球交易所/);
   assert.match(html,/framing-close-up/);assert.match(html,/framing-detail/);
   if(ep==='E21'){
    w.academySeek(60.8);const risk=w.document.querySelector('[data-risk-initial]');assert.equal(risk.textContent,'100');
    w.academySeek(63);assert.equal(risk.textContent,'100 + …');
    w.academySeek(60.8);assert.equal(risk.textContent,'100','reverse seek restores risk state');
   }
   if(ep==='E05'){
    w.academySeek(61);const specimen=w.document.querySelector('.sample-id');
    assert.equal(w.getComputedStyle(specimen.querySelector('.correction')).visibility,'hidden');
    w.academySeek(64);assert.equal(w.getComputedStyle(specimen.querySelector('.rejection')).visibility,'hidden');
    assert.equal(w.getComputedStyle(specimen.querySelector('.correction')).visibility,'visible');
   }
   const card=w.document.querySelector('.conversion-card');
   assert.equal(Boolean(card),ep==='E05');
   if(card){assert.match(card.textContent,/nexu888/);assert.match(card.textContent,/commission|佣金/);assert.match(card.textContent,/country|地区/);}
   const vtt=readFileSync(new URL(`build/${ep}-${locale}-${format}/captions.vtt`,import.meta.url),'utf8');
   assert.match(vtt,/Understand first|先看懂/);
   assert.match(vtt.replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/g,'').replace(/\s+/g,' '),ep==='E21'?/cross margin/:ep==='E09'?/where to look/:locale==='en'?/which one to press/:/到底该按哪个/);
   dom.window.close();
  }
 });
}
