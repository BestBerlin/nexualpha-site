import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {buildPackage,validateData} from './builders.mjs';
import {slideToSvg,captionLines,FORMATS,FONT_OPTIONS,fitText} from './layout.mjs';
import {STRINGS} from './strings.mjs';
const {Resvg}=createRequire(new URL('../../pilot-01-prototype/package.json',import.meta.url))('@resvg/resvg-js');
const fixture=JSON.parse(readFileSync(new URL('./fixtures/market.json',import.meta.url)));
const data=validateData(fixture,null,Date.parse(fixture.generatedAt));
test('every locale, format and animation state keeps text/bars inside safe bounds',()=>{
  for(const lang of Object.keys(STRINGS)) for(const format of Object.keys(FORMATS)) {
    const {safe,width,height}=FORMATS[format];
    for(const [index,slide] of buildPackage(data,lang).slides.entries()) for(const progress of [0,.25,1]) {
      const svg=slideToSvg(slide,index,5,lang,{format,progress,caption:captionLines(slide.narration,lang)[0]});
      for(const element of svg.match(/<text[^>]*>[\s\S]*?<\/text>|<rect data-content[^>]*\/>/g)||[]) {
        const box=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${element}</svg>`,{font:FONT_OPTIONS}).getBBox();
        assert.ok(box || element.startsWith('<rect'),'text must produce visible glyphs');
        if(!box) continue;
        assert.ok(box.x>=safe.left-1 && box.x+box.width<=safe.right+1,`${lang}/${format}/${index} horizontal: ${element}`);
        assert.ok(box.y>=safe.top && box.y+box.height<=safe.bottom,`${lang}/${format}/${index} vertical: ${element}`);
      }
      assert.doesNotMatch(svg,/scale\(/);
      assert.match(svg,/data-mascot="Nexubo"/);
      assert.match(svg,/>NexuAlpha<\/text>/);
      assert.match(svg,new RegExp(`width="${width}" height="${height}"`));
      if(lang==='ar') assert.match(svg,/direction="rtl"/);
    }
  }
});
test('wide funding numbers reduce font size without horizontal deformation',()=>{
  const fitted=fitText('-12345.67890%',300,856);
  assert.ok(fitted.size<300);
  assert.ok(fitted.box.width<=852.1);
  const slide=buildPackage(data,'en').slides[3];
  const svg=slideToSvg(slide,3,5,'en');
  assert.match(svg,/>-0.27661%<\/text>/);
  assert.doesNotMatch(svg,/scale\(/);
});
test('sentence wrapping preserves the complete caption and numeric animation',()=>{
  const slide=buildPackage(data,'en').slides[0];
  const sentence='Covered venues recorded at least $16.48M in liquidations over the past 24 hours.';
  const svg=slideToSvg(slide,0,5,'en',{caption:sentence});
  const lines=[...svg.matchAll(/<text[^>]* y="(?:1400|1445|1490)"[^>]*>(.*?)<\/text>/g)].map(m=>m[1]);
  assert.equal(lines.join(' '),sentence);
  assert.match(slideToSvg(slide,0,5,'en',{progress:0}),/>\$0<\/text>/);
  assert.match(svg,/>\$16\.48M<\/text>/);
});
test('Nexubo antenna reflects data and domain stays a single text element',()=>{
  const slide=buildPackage(data,'en').slides[4];
  const calm=slideToSvg({...slide,reaction:{antenna:'green'}},4,5,'en');
  const alert=slideToSvg({...slide,reaction:{antenna:'red'}},4,5,'en');
  assert.equal((calm.match(/>nexualpha\.com<\/text>/g)||[]).length,1);
  assert.match(calm,/data-antenna="#3ddc97"/);
  assert.match(alert,/data-antenna="#ff5c5c"/);
  assert.notEqual(calm,alert);
});
test('RTL text isolates currency and percentage tokens without reversing the digits',()=>{
  const slide=buildPackage(data,'ar').slides[0];
  const svg=slideToSvg(slide,0,5,'ar',{format:'square',caption:slide.captions[0]});
  assert.match(svg,/\u206687\.0%\u2069/u);
  assert.match(svg,/\u2066\$16\.48M\u2069/u);
  assert.match(svg,/>\$16\.48M<\/text>/);
});
