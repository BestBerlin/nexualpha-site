import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {usd, fundingPercent, captionLines} from './builders.mjs';
const require = createRequire(new URL('../../pilot-01-prototype/package.json', import.meta.url));
const {Resvg} = require('@resvg/resvg-js');
export const SAFE = {left:64, right:920, top:48, bottom:1500};
export const TOKENS = {background:'#0b0d10', blue:'#4f7cff', green:'#3ddc97', red:'#ff5c5c', white:'#f7f9ff', muted:'#a8b1c2'};
const mark = readFileSync(new URL('../../pilot-01-prototype/public/brand/nexualpha/nexualpha-round.svg', import.meta.url)).toString('base64');
export const FONT = 'PingFang SC, SF Pro Display, Inter, Arial, sans-serif';
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
export function slideToSvg(slide, index, total, lang, {progress=1, caption=''}={}) {
  const zh = /^zh/i.test(lang), C = TOKENS, center = (SAFE.left+SAFE.right)/2;
  const font=zh?FONT:'Inter Variable, Inter, Arial, sans-serif';
  const text = (value, y, size=48, color=C.white, {x=center, anchor='middle', weight=650, width=SAFE.right-SAFE.left}={}) => {
    const box=measured(value,size,weight,font);
    const scale = Math.min(1, (width-4) / box.width);
    const origin=anchor==='middle'?-(box.x+box.width/2):anchor==='end'?-(box.x+box.width):-box.x;
    return `<text data-content="true" x="${origin}" y="${y}" transform="translate(${x} 0) scale(${scale} 1)" text-anchor="start" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}">${xml(value)}</text>`;
  };
  const rect = (x,y,w,h,color,extra='') => `<rect data-content="true" x="${x}" y="${y}" width="${Number(Math.max(0,w).toFixed(3))}" height="${h}" fill="${color}" ${extra}/>`;
  const p = Math.min(1,Math.max(0,progress));
  const hero = slide.hero;
  const number = hero ? hero.format==='usd' ? usd(hero.value*p) : hero.format==='funding' ? fundingPercent(hero.value*p) : `${Math.round(hero.value*p*100)}%` : slide.title;
  const color = hero?.format === 'funding' ? (hero.value < 0 ? C.red:C.green) : slide.kind==='split' ? (slide.bar.longShare < .5 ? C.red:C.green) : C.white;
  let content = '';
  if (slide.kind === 'end') {
    content += text(zh?'完整数据':'Full market data',360,56,C.muted);
    content += text('nexualpha.com',640,116,C.white,{weight:800});
    content += rect(368,735,248,6,C.blue);
    content += text('Telegram',900,44,C.muted);
    content += text('@NexuAlphaClub',980,62);
    content += text(zh?'每天更新 · 订阅不错过':'Daily · Subscribe',1150,58,C.blue);
    content += text(zh?'数据为覆盖交易所的下限':'Covered venues only · lower bound',1300,36,C.muted);
    content += text(zh?'不构成投资建议':'Not investment advice',1360,36,C.muted);
  } else if (slide.kind === 'receipt') {
    content += text(slide.label || slide.title,300,54,C.muted);
    content += rect(64,380,856,850,'#131820','rx="24" stroke="#283241"');
    content += text(slide.receipt.venue,480,66,C.white,{x:104,anchor:'start',weight:800,width:440});
    content += text(slide.receipt.symbol,568,54,C.muted,{x:104,anchor:'start',width:720});
    const side = slide.receipt.side === 'short';
    content += rect(710,421,160,76,side?C.red:C.green,'rx="12"');
    content += text(zh?(side?'空头':'多头'):(side?'SHORT':'LONG'),474,38,C.background,{x:790,width:144,weight:800});
    content += text(number,900,360,C.white,{width:776,weight:800});
    content += rect(104,995,776,2,'#283241');
    content += text(slide.receipt.time,1100,42,C.muted,{width:776});
    content += text(zh?'覆盖内观测 · 非全市场':'Observed in covered venues',1180,36,C.muted);
  } else if (slide.kind === 'funding') {
    content += text(slide.label || slide.title,270,52,C.muted);
    content += text(number,570,300,color,{weight:800});
    const max = Math.max(...slide.rates.map(r=>Math.abs(r.rate)),1e-12);
    slide.rates.forEach((rate,i) => {
      const y = 735+i*158, c = rate.rate<0?C.red:C.green;
      content += text(`${rate.venue} · ${rate.symbol}`,y,44,C.white,{x:64,anchor:'start',width:380});
      content += text(`${fundingPercent(rate.rate*p)}${rate.intervalH?` / ${rate.intervalH}h`:''}`,y,44,c,{x:920,anchor:'end',width:440,weight:800});
      content += rect(64,y+30,856,52,'#1c2532','rx="6"');
      content += rect(64,y+30,856*Math.abs(rate.rate)/max*p,52,c,'rx="6"');
    });
    content += text(zh?'负费率 = 空头付钱给多头':'Negative = shorts pay longs',1220,44);
    content += text(zh?'当前快照 · 每结算周期':'Current snapshot · per interval',1300,36,C.muted);
    content += text(zh?'周期可能不同 · 非24小时极值':'Intervals vary · not 24h extremes',1360,36,C.muted);
  } else {
    content += text(slide.label || slide.title,360,56,C.muted);
    content += text(number,735,330,color,{weight:800});
    if (slide.bar) {
      const long = slide.bar.longShare;
      content += rect(64,895,856,70,'#1c2532','rx="8"');
      content += rect(64,895,856*long*p,70,C.green);
      content += rect(64+856*long*p,895,856*(1-long)*p,70,C.red);
      content += text(`${zh?'多头':'Longs'} ${Math.round(long*p*100)}%`,1060,64,C.green,{x:64,anchor:'start',width:416,weight:800});
      content += text(`${zh?'空头':'Shorts'} ${Math.round((1-long)*p*100)}%`,1060,64,C.red,{x:920,anchor:'end',width:416,weight:800});
      content += text(`${usd(slide.longUsd || 0)} / ${usd(slide.shortUsd || 0)}`,1180,56,C.muted);
    } else {
      content += text(slide.support?.[0] || slide.lines?.[1] || '',960,100,C.red,{weight:800});
      content += text(zh?'覆盖交易所 · 数据下限':'Covered venues · lower bound',1160,44,C.muted);
    }
  }
  if (caption) content += text(caption,1475,40,C.white);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<defs><pattern id="grid" width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V90 M0 0H90" fill="none" stroke="#63789c" stroke-opacity=".065" stroke-width="1"/></pattern></defs>
<rect width="1080" height="1920" fill="${C.background}"/><rect width="1080" height="1920" fill="url(#grid)"/>
<rect x="64" y="48" width="856" height="5" fill="#202838"/>
<rect x="64" y="48" width="${856*(index+p)/total}" height="5" fill="${C.blue}"/>
<image x="64" y="90" width="76" height="76" href="data:image/svg+xml;base64,${mark}"/>
${content}</svg>`;
}
