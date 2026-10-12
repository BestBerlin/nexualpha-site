/** Raster exports from vector sources; never presented as browser screenshots. */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(root, '../../../pilot-01-prototype/package.json'));
const { Resvg } = require('@resvg/resvg-js');
const manifest = JSON.parse(readFileSync(path.join(root,'manifest.json')));
function render(svg,file,width) {
  writeFileSync(path.join(root,file),new Resvg(svg,{fitTo:{mode:'width',value:width},font:{loadSystemFonts:true,defaultFontFamily:'Arial'}}).render().asPng());
}
for (const asset of manifest.assets) {
  render(readFileSync(path.join(root,`svg/${asset.file}.svg`),'utf8'),`exports/${asset.file}-1600.png`,1600);
}
render(readFileSync(path.join(root,'svg/model-sheet.svg'),'utf8'),'exports/model-sheet-1600.png',1600);
for (const [i,name] of manifest.stickers.entries()) {
  const svg = readFileSync(path.join(root,`svg/${name}.svg`),'utf8');
  // A white contour gives transparent stickers contrast on arbitrary chat backgrounds.
  const inside = svg.slice(svg.indexOf('\n')+1,svg.lastIndexOf('</svg>'));
  const outlined = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><filter id="sticker-outline" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="5" result="dilated"/><feFlood flood-color="white"/><feComposite in2="dilated" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#sticker-outline)">${inside}</g></svg>`;
  writeFileSync(path.join(root,`stickers/${String(i+1).padStart(2,'0')}-${name}.svg`),outlined);
  render(outlined,`stickers/${String(i+1).padStart(2,'0')}-${name}.png`,512);
}
const escape = s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
function text(x,y,s,size=20,color='#fff',weight=400) {
  return `<text x="${x}" y="${y}" font-family="Arial" font-size="${size}" font-weight="${weight}" fill="${color}">${escape(s)}</text>`;
}
function art(name,x,y,w,id) {
  const svg=readFileSync(path.join(root,`svg/${name}.svg`),'utf8');
  const inside=svg.slice(svg.indexOf('\n')+1,svg.lastIndexOf('</svg>')).replace(/id="([^"]+)"/g,(_,name)=>`id="${id}-${name}"`);
  return `<g transform="translate(${x} ${y}) scale(${w/512})">${inside}</g>`;
}
for (const theme of ['dark','light']) {
  const bg=theme==='dark'?'#0b0d10':'#f4f6fc',fg=theme==='dark'?'#f4f6fc':'#0b0d10',muted=theme==='dark'?'#aeb9d1':'#47536e',card=theme==='dark'?'#151c2a':'#e8edf9';
  let board=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2000"><rect width="1600" height="2000" fill="${bg}"/>`;
  board+=text(64,72,'NEXUALPHA / ACADEMY',22,fg,700)+text(1150,72,'DIRECTION A · STUDY 01',14,muted);
  board+=text(64,169,'A LITTLE SIGNAL. A LOT OF CHARACTER.',17,theme==='dark'?'#3ddc97':'#276446');
  board+=text(64,250,'Meet your',76,fg,700)+text(64,338,'curious companion.',76,fg,700);
  board+=text(64,397,'A round little monster who learns with you.',23,muted)+text(64,434,'One mood light. One golden heart. Always curious.',23,muted);
  board+=art('pose-wave-hello',990,75,475,'hero');
  for(const [i,[label,col]] of [['Happy / OK','#3ddc97'],['Thinking / Careful','#f8bb6a'],['Warning / Risk','#ed5969'],['Neutral / Explaining','#4f7cff']].entries()) {
    board+=`<circle cx="${78+i*370}" cy="565" r="8" fill="${col}"/>`+text(98+i*370,571,label,18,fg);
  }
  const rows=[['Model sheet','01 / Built to turn.',630,4,325],['Expressions','02 / A face for every moment.',1065,6,218],['Poses','03 / Ready to help.',1430,6,218]];
  for(const [category,title,y,count,w] of rows) {
    board+=text(64,y,title,30,fg,700);
    for(const [i,e] of manifest.assets.filter(e=>e.category===category).entries()) {
      const x=64+i*((1472+16)/count);
      board+=`<rect x="${x}" y="${y+28}" width="${(1472+16)/count-16}" height="${w+52}" rx="24" fill="${card}"/>`;
      board+=art(e.file,x+8,y+30,w,`${theme}-${e.file}`)+text(x+18,y+w+60,e.label,17,fg,600);
    }
  }
  board+=text(64,1800,'THREE NAMES TO EXPLORE',15,muted)+text(64,1854,'Nexubo',34,fg,700)+text(460,1854,'Bopinu',34,fg,700)+text(856,1854,'Pibolu',34,fg,700);
  board+=text(64,1890,'nek-SOO-bo',18,muted)+text(460,1890,'bo-PEE-noo',18,muted)+text(856,1890,'pee-BO-loo',18,muted);
  board+=text(64,1960,'Original vector construction · Names are proposals, not cleared trademarks · Design for learning',16,muted)+'</svg>';
  writeFileSync(path.join(root,`svg/board-${theme}.svg`),board);
  render(board,`exports/board-${theme}-1600.png`,1600);
}
let preview='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 840"><rect width="1600" height="840" fill="#e8edf9"/>';
for(const [i,name] of manifest.stickers.entries()) preview+=art(name,(i%4)*400,Math.floor(i/4)*400,400,`sticker-${i}`);
preview+=text(30,825,'8 transparent 512 × 512 PNG previews · Telegram upload / packaging remains separate',18,'#47536e')+'</svg>';
render(preview,'exports/sticker-set-1600.png',1600);
console.log('Exported 16 character PNGs + model sheet + 2 vector-composed boards + sticker preview at 1600 px; 8 transparent 512 px stickers.');
