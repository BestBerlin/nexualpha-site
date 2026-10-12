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
const FORBIDDEN_FINE_PRINT = [
  'Bu yatırım tavsiyesi değildir.',
  'Chu kỳ funding có thể khác nhau theo từng sàn.',
  'Chỉ gồm các sàn được theo dõi; đây là mức tối thiểu.',
  'Covered venues only; this is a lower bound.',
  'Diamati di dalam venue yang tercakup.',
  'Esto no es asesoramiento financiero.',
  'Fonlama aralıkları borsaya göre değişebilir.',
  'Funding intervals can vary by venue.',
  'Hanya venue tercakup; ini adalah batas bawah.',
  'Ini bukan nasihat investasi.',
  'Interval funding dapat berbeda di setiap venue.',
  'Isto não é aconselhamento financeiro.',
  'Kapsanan borsalarda gözlemlendi.',
  'Los intervalos de financiación pueden variar por venue.',
  'Observado dentro de los venues cubiertos.',
  'Observado dentro dos venues cobertos.',
  'Observed inside covered venues.',
  'Os intervalos de funding podem variar por venue.',
  'Solo venues cubiertos; es un límite inferior.',
  'Somente venues cobertos; este é um piso.',
  'This is not investment advice.',
  'Yalnızca kapsanan borsalar; bu bir alt sınırdır.',
  'Đây không phải là lời khuyên đầu tư.',
  'Được quan sát trong các sàn được theo dõi.',
  'Интервалы фандинга могут отличаться по площадкам.',
  'Наблюдается на покрытых площадках.',
  'Только покрытые площадки; это нижняя оценка.',
  'Это не инвестиционная рекомендация.',
  'تم رصده داخل المنصات المغطاة.',
  'قد تختلف فترات التمويل حسب المنصة.',
  'هذه ليست نصيحة استثمارية.',
  'يشمل ذلك المنصات المغطاة فقط؛ وهو حد أدنى.',
  '仅覆盖已接入交易所，这是下限。',
  '在覆盖交易所内观测到。',
  '资金费率结算周期可能因交易所而异。',
  '这不构成投资建议。',
];
const mascotBox = svg => {
  const tag = svg.match(/<image[^>]*data-mascot="Nexubo"[^>]*>/)?.[0];
  assert.ok(tag, 'Nexubo image is present');
  const attr = name => Number(tag.match(new RegExp(`${name}="([^"]+)"`))?.[1]);
  const source = Buffer.from(tag.match(/href="data:image\/svg\+xml;base64,([^"]+)"/)[1], 'base64').toString('utf8');
  const viewBox = source.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const box = new Resvg(source,{font:FONT_OPTIONS}).getBBox();
  const x=attr('x'), y=attr('y'), width=attr('width'), height=attr('height');
  return {
    tag, x, y, width, height,
    visible: {
      x: x + box.x / viewBox[2] * width,
      y: y + box.y / viewBox[3] * height,
      width: box.width / viewBox[2] * width,
      height: box.height / viewBox[3] * height,
    },
  };
};
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
      for (const finePrint of FORBIDDEN_FINE_PRINT) assert.doesNotMatch(svg, new RegExp(finePrint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'));
      if(lang==='ar') assert.match(svg,/direction="rtl"/);
    }
  }
});
test('Nexubo renders as a large lower-half host with slide-specific pose and expression',()=>{
  const expected=[
    ['hero','rest','surprised'],
    ['split','point','thinking'],
    ['receipt','rest','surprised'],
    ['funding','rest','thinking'],
    ['end','wave','happy'],
  ];
  for(const format of ['portrait','square']) {
    const {width,height}=FORMATS[format];
    for(const [index,slide] of buildPackage(data,'en').slides.entries()) {
      const svg=slideToSvg(slide,index,5,'en',{format,progress:1,caption:slide.captions[0]});
      const box=mascotBox(svg);
      const [kind,pose,expression]=expected[index];
      assert.equal(slide.kind,kind);
      assert.match(box.tag,new RegExp(`data-pose="${pose}"`));
      assert.match(box.tag,new RegExp(`data-expression="${expression}"`));
      if(format==='portrait') {
        const expectedSize = pose === 'point' ? 620 : 680;
        const expectedX = pose === 'point' ? 230 : 200;
        assert.equal(box.width,expectedSize);
        assert.equal(box.height,expectedSize);
        assert.ok(box.visible.width/width>=.38 && box.visible.width/width<=.45);
        assert.ok(box.visible.y>=height*.5 && box.visible.y+box.visible.height<=height);
        assert.ok(Math.abs(box.x-expectedX)<=1);
        assert.ok(Math.abs(box.y-1100)<=1);
      } else {
        assert.equal(box.width,475);
        assert.equal(box.height,475);
        assert.ok(box.visible.width/width>=.29 && box.visible.width/width<=.34);
        assert.ok(box.visible.y>=height*.5 && box.visible.y+box.visible.height<=height);
        assert.ok(Math.abs(box.x-541)<=1);
        assert.ok(Math.abs(box.y-620)<=1);
      }
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
  const sentence='Leveraged traders saw $16.48M in forced closures over the last 24 hours.';
  const svg=slideToSvg(slide,0,5,'en',{caption:sentence});
  const lines=[...svg.matchAll(/<text[^>]* y="(?:1060|1108|1156)"[^>]*>(.*?)<\/text>/g)].map(m=>m[1]);
  assert.equal(lines.join(' '),sentence);
  assert.match(slideToSvg(slide,0,5,'en',{progress:0}),/>\$0<\/text>/);
  assert.match(svg,/>\$16\.48M<\/text>/);
});
test('square captions stay left of the host and portrait captions use the lower-safe text band',()=>{
  const [hero]=buildPackage(data,'en').slides;
  const square=slideToSvg(hero,0,5,'en',{format:'square',caption:'Most forced closures hit short sellers.'});
  const squareLines=[...square.matchAll(/<text[^>]* y="(?:775|823|871)"[^>]*>/g)];
  assert.ok(squareLines.length);
  assert.ok(squareLines.every(line=>Number(line[0].match(/ x="([^"]+)"/)[1])<566));
  const portrait=slideToSvg(hero,0,5,'en',{format:'portrait',caption:'Most forced closures hit short sellers.'});
  const portraitLines=[...portrait.matchAll(/<text[^>]* y="(?:1060|1108|1156)"[^>]*>/g)];
  assert.ok(portraitLines.length);
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
  const slide=buildPackage(data,'ar').slides[1];
  const svg=slideToSvg(slide,1,5,'ar',{format:'square',caption:slide.captions[0]});
  assert.match(svg,/\u206687%\u2069/u);
  assert.match(svg,/\u206613%\u2069/u);
  assert.match(svg,/>\$2\.15M \/ \$14\.33M<\/text>/);
  assert.match(slideToSvg(buildPackage(data,'ar').slides[0],0,5,'ar',{format:'square'}),/>\$16\.48M<\/text>/);
});
