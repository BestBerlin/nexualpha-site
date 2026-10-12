import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {nexubo} from '../academy-v3/characters.mjs';
import {usd, fundingPercent, captionLines} from './builders.mjs';
const require = createRequire(new URL('../../pilot-01-prototype/package.json', import.meta.url));
const {Resvg} = require('@resvg/resvg-js');
export const SAFE = {left:64, right:920, top:48, bottom:1780};
export const TOKENS = {background:'#0b0d10', blue:'#4f7cff', green:'#3ddc97', red:'#ff5c5c', white:'#f7f9ff', muted:'#a8b1c2'};
const mark = readFileSync(new URL('../../pilot-01-prototype/public/brand/nexualpha/nexualpha-round.svg', import.meta.url)).toString('base64');
export const FONT = 'PingFang SC, SF Pro Display, Inter, Arial, sans-serif';
// Reuse the academy rig so expression and pose share the canonical assets.
const mascotRigs = new Map();
for (const [pose,expression] of [['rest','surprised'],['point','thinking'],['rest','thinking'],['wave','happy']]) {
  for (const antenna of ['green','red']) mascotRigs.set(`${pose}/${expression}/${antenna}`, await nexubo({id:`shorts-${pose}-${expression}-${antenna}`,pose,expression,antenna:antenna==='red'?'#ff5c5c':'#3ddc97'}));
}
const fontRoot='/System/Library/AssetsV2/com_apple_MobileAsset_Font8';
const localFonts=[fileURLToPath(new URL('./fonts/InterVariable.ttf',import.meta.url)),'/System/Library/Fonts/Supplemental/Arial.ttf'];
if(existsSync(fontRoot)) for(const entry of readdirSync(fontRoot)) {
  const file=`${fontRoot}/${entry}/AssetData/PingFang.ttc`;
  if(existsSync(file)) localFonts.push(file);
}
export const FONT_OPTIONS = {loadSystemFonts:localFonts.length<3,fontFiles:localFonts.filter(existsSync),defaultFontFamily:'PingFang SC'};
const measurements = new Map();
const xml = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function measured(value, size, weight, font) {
  const key = `${value}|${size}|${weight}|${font}`;
  if (!measurements.has(key)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="600"><text y="400" font-family="${font}" font-size="${size}" font-weight="${weight}">${xml(value)}</text></svg>`;
    measurements.set(key, new Resvg(svg,{font:FONT_OPTIONS}).getBBox() || {x:0,width:1});
  }
  return measurements.get(key);
}
export {captionLines} from './builders.mjs';
export const FORMATS = {portrait:{width:1080,height:1920,safe:SAFE}, square:{width:1080,height:1080,safe:{left:64,right:1016,top:48,bottom:1016}}};

// Fit by measured glyph widths at their final font size; never deform numbers.
export function fitText(value, maximum, width, weight=650, font=FONT) {
  let size=maximum;
  for(let i=0;i<4;i++) {
    const box=measured(value,size,weight,font);
    if(box.width<=width-4) return {size,box};
    size *= (width-4)/box.width;
  }
  return {size,box:measured(value,size,weight,font)};
}
function wrapSentence(value,width,size,font) {
  const units=/\s/.test(value.trim())?value.trim().split(/\s+/):[...value];
  const spacer=/\s/.test(value.trim())?' ':'';
  const lines=[]; let line='';
  for(const unit of units) {
    const next=line+(line?spacer:'')+unit;
    if(line && measured(next,size,650,font).width>width) {lines.push(line);line=unit;}
    else line=next;
  }
  if(line) lines.push(line);
  return lines;
}
export function slideToSvg(slide, index, total, lang, {progress=1, caption='', format='portrait'}={}) {
  if(!FORMATS[format]) throw new Error(`Unknown format: ${format}`);
  const {width,height,safe}=FORMATS[format], square=format==='square', C=TOKENS;
  const center=(safe.left+safe.right)/2, span=safe.right-safe.left;
  const rtl=lang==='ar', font=/^zh|^ar/.test(lang)?FONT:'Inter Variable, Inter, Arial, sans-serif';
  const copy=slide.copy;
  const text=(value,y,size=48,color=C.white,{x=center,anchor='middle',weight=650,width=span,numeric=false}={})=>{
    const display=rtl&&!numeric?String(value).replace(/[+-]?\$?\d[\d.,]*(?:[MBK]|%|h)?/g,token=>`\u2066${token}\u2069`):String(value);
    const fitted=fitText(display,size,width,weight,font), box=fitted.box;
    const origin=anchor==='middle'?x-box.x-box.width/2:anchor==='end'?x-box.x-box.width:x-box.x;
    return `<text data-content="true" x="${origin}" y="${y}" font-family="${font}" font-size="${fitted.size.toFixed(3)}" font-weight="${weight}" fill="${color}" direction="${rtl&&!numeric?'rtl':'ltr'}" unicode-bidi="plaintext">${xml(display)}</text>`;
  };
  const rect=(x,y,w,h,color,extra='')=>`<rect data-content="true" x="${x}" y="${y}" width="${Math.max(0,w).toFixed(3)}" height="${h}" fill="${color}" ${extra}/>`;
  const p=Math.min(1,Math.max(0,progress)), hero=slide.hero;
  const number=hero?hero.format==='usd'?usd(hero.value*p):hero.format==='funding'?fundingPercent(hero.value*p):`${Math.round(hero.value*p*100)}%`:slide.title;
  const color=hero?.format==='funding'?(hero.value<0?C.red:C.green):slide.kind==='split'?(slide.bar.longShare<.5?C.red:C.green):C.white;
  const y= square ? {label:215,hero:375,detail:445,rows:490,mascot:620,caption:775} : {label:300,hero:560,detail:690,rows:730,mascot:1100,caption:1060};
  let content='';
  content+=text('NexuAlpha',143,48,C.white,{x:160,anchor:'start',width:400,weight:800,numeric:true});
  if(slide.kind!=='end') content+=text(slide.label||slide.title,y.label,52,C.muted);
  if(slide.kind==='end') {
    content+=text(slide.domain,y.hero,110,C.white,{weight:800,numeric:true});
    content+=text(slide.cta,y.detail,48,C.blue);

  } else {
    content+=text(number,y.hero,square?160:280,color,{weight:800,numeric:true});
    if(slide.kind==='split') {
      content+=rect(safe.left,y.detail,span,50,'#1c2532');
      content+=rect(safe.left,y.detail,span*slide.bar.longShare*p,50,C.green);
      content+=rect(safe.left+span*slide.bar.longShare*p,y.detail,span*slide.bar.shortShare*p,50,C.red);
      content+=text(`${copy.longs} ${Math.round(slide.bar.longShare*100)}%`,y.detail+110,44,C.green,{x:safe.left,anchor:'start',width:span/2-16});
      content+=text(`${copy.shorts} ${Math.round(slide.bar.shortShare*100)}%`,y.detail+110,44,C.red,{x:safe.right,anchor:'end',width:span/2-16});
      content+=text(`${usd(slide.longUsd)} / ${usd(slide.shortUsd)}`,y.detail+175,40,C.muted,{numeric:true});
    } else if(slide.kind==='receipt') {
      content+=text(`${slide.receipt.venue} · ${slide.receipt.symbol}`,y.detail,52);
      content+=text(slide.receipt.side==='short'?copy.short:copy.long,y.detail+65,44,slide.receipt.side==='short'?C.red:C.green);
      content+=text(slide.receipt.time,y.detail+125,34,C.muted,{numeric:true});
    } else if(slide.kind==='funding') {
      const max=Math.max(...slide.rates.map(r=>Math.abs(r.rate)),1e-12);
      slide.rates.forEach((r,i)=>{
        const baseline=y.rows+i*(square?67:112), c=r.rate<0?C.red:C.green;
        content+=text(`${r.venue} · ${r.symbol}`,baseline,34,C.white,{x:safe.left,anchor:'start',width:span*.48,numeric:true});
        content+=text(`${fundingPercent(r.rate*p)}${r.intervalH?` / ${r.intervalH}h`:''}`,baseline,34,c,{x:safe.right,anchor:'end',width:span*.48,weight:800,numeric:true});
        content+=rect(safe.left,baseline+16,span,12,'#1c2532');
        content+=rect(safe.left,baseline+16,span*Math.abs(r.rate)/max*p,12,c);
      });

    }
  }
  const antenna=slide.reaction?.antenna==='red'?C.red:C.green;
  const pose=slide.mascot?.pose||'rest', expression=slide.mascot?.expression||'surprised';
  const mascot=mascotRigs.get(`${pose}/${expression}/${slide.reaction?.antenna==='red'?'red':'green'}`);
  if(!mascot) throw new Error(`Unsupported shorts mascot: ${pose}/${expression}`);
  const mascot64=Buffer.from(mascot).toString('base64');
  // The asset's built-in whitespace leaves a visible host ~40%/30% wide.
  // Scale-in and a gentle entrance bob are encoded during the first .8s.
  const hostSize=(square?475:pose==='point'?620:680)*(.96+.04*p);
  const hostX=square?safe.right-hostSize:(width-hostSize)/2;
  content+=`<image data-mascot="Nexubo" data-pose="${pose}" data-expression="${expression}" data-antenna="${antenna}" x="${hostX}" y="${y.mascot+(1-p)*14-Math.sin(p*Math.PI)*8}" width="${hostSize}" height="${hostSize}" href="data:image/svg+xml;base64,${mascot64}"/>`;
  // One explanatory line is shared by the frame, spoken track and captions.
  // The end card already displays its single CTA above the waving host.
  if(slide.kind!=='end') {
    const explanation=caption||slide.support[0], captionWidth=square?530:span;
    const lines=wrapSentence(explanation,captionWidth,40,font);
    lines.forEach((line,i)=>content+=text(line,y.caption+i*48,40,C.white,
      square?{x:safe.left,anchor:'start',width:captionWidth}:{}));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="${C.background}"/>
<rect x="${safe.left}" y="48" width="${span}" height="5" fill="#202838"/>
<rect x="${safe.left}" y="48" width="${span*(index+p)/total}" height="5" fill="${C.blue}"/>
<image x="64" y="90" width="76" height="76" href="data:image/svg+xml;base64,${mark}"/>
${content}</svg>`;
}
