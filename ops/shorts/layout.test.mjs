import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {buildPackage,validateData} from './builders.mjs';
import {slideToSvg,captionLines,SAFE,FONT_OPTIONS} from './layout.mjs';
const {Resvg}=createRequire(new URL('../../pilot-01-prototype/package.json',import.meta.url))('@resvg/resvg-js');
const fixture=JSON.parse(readFileSync(new URL('./fixtures/market.json',import.meta.url)));
const data=validateData(fixture,null,Date.parse(fixture.generatedAt));
const bbox = element => new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">${element}</svg>`,{font:FONT_OPTIONS}).getBBox();
test('all bilingual slide text and data geometry stay outside Shorts controls',()=>{
  for(const lang of ['zh-Hans','en']) {
    const {slides}=buildPackage(data,lang);
    for (const [index,slide] of slides.entries()) {
      for (const progress of [0,.25,1]) {
        const svg=slideToSvg(slide,index,5,lang,{progress,caption:captionLines(slide.narration,lang)[0]});
        for(const element of svg.match(/<text[^>]*>[\s\S]*?<\/text>|<rect data-content[^>]*\/>/g)||[]) {
          const box=bbox(element);
          assert.ok(box || element.startsWith('<rect'),'text must produce visible glyphs');
          if(!box) continue;
          assert.ok(box.x>=SAFE.left-1,`${lang} slide ${index} left ${box.x}: ${element}`);
          assert.ok(box.x+box.width<=SAFE.right+1,`${lang} slide ${index} right ${box.x+box.width}: ${element}`);
          assert.ok(box.y>=SAFE.top,`${lang} slide ${index} top ${box.y}`);
          assert.ok(box.y+box.height<=SAFE.bottom,`${lang} slide ${index} bottom ${box.y+box.height}`);
        }
        assert.doesNotMatch(svg,/NexuAlpha Shorts|ZH-HANS|<circle/);
        assert.match(svg,/data:image\/svg\+xml;base64/);
      }
    }
  }
});
test('domain is one measured text element and disclaimers are at least 34px',()=>{
  for(const lang of ['zh-Hans','en']) {
    const svg=slideToSvg(buildPackage(data,lang).slides[4],4,5,lang);
    const domains=svg.match(/<text[^>]*>nexualpha\.com<\/text>/g)||[];
    assert.equal(domains.length,1);
    const box=bbox(domains[0]);
    assert.ok(box.width<=SAFE.right-SAFE.left);
    assert.equal((svg.match(/nexualpha\.com/g)||[]).length,1);
    for(const element of svg.match(/<text[^>]*>[\s\S]*?<\/text>/g)) assert.ok(Number(element.match(/font-size="(\d+)"/)[1])>=34);
  }
});
test('numbers count up and proportional bars grow during the intro',()=>{
  const slides=buildPackage(data,'en').slides;
  assert.match(slideToSvg(slides[0],0,5,'en',{progress:0}),/>\$0<\/text>/);
  assert.match(slideToSvg(slides[0],0,5,'en',{progress:1}),/>\$16\.48M<\/text>/);
  const first=slideToSvg(slides[3],3,5,'en',{progress:.5});
  const final=slideToSvg(slides[3],3,5,'en',{progress:1});
  assert.match(first,/width="428" height="52" fill="#ff5c5c"/);
  assert.match(final,/width="856" height="52" fill="#ff5c5c"/);
  assert.match(slideToSvg(slides[1],1,5,'en'),/height="70"/);
});
test('Chinese captions contain at most 16 code points and retain narration',()=>{
  for(const slide of buildPackage(data,'zh-Hans').slides) {
    const lines=captionLines(slide.narration,'zh-Hans');
    assert.ok(lines.every(line=>[...line].length<=16));
    assert.equal(lines.join(''),slide.narration.replace(/\s+/g,''));
    assert.doesNotMatch(slide.narration,/USDT 计价的/);
  }
});

test('caption punctuation does not break decimal amounts or funding rates',()=>{
  assert.deepEqual(captionLines('至少1648.80万美元，空头87.0%。','zh-Hans'),['至少1648.80万美元，','空头87.0%。']);
});

test('slide 1 hero glyph height matches the requested 260–320px hook',()=>{
  for(const lang of ['zh-Hans','en']) {
    const svg=slideToSvg(buildPackage(data,lang).slides[0],0,5,lang);
    const element=svg.match(/<text[^>]*font-size="330"[^>]*>[\s\S]*?<\/text>/)[0];
    const box=bbox(element);
    assert.ok(box.height>=260 && box.height<=320,`${lang} hero height ${box.height}`);
  }
});
