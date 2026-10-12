import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(root,'../../../pilot-01-prototype/package.json'));
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(readFileSync(path.join(root,'manifest.json')));
const required = ['body','eyes','mouth','arms','legs','antenna','antenna-light','coin','shadow'];
assert.equal(manifest.assets.length,16);
assert.equal(manifest.stickers.length,8);
const groups = Object.groupBy(manifest.assets, e=>e.category);
assert.equal(groups['Model sheet'].length,4);
assert.equal(groups.Expressions.length,6);
assert.equal(groups.Poses.length,6);
for(const e of manifest.assets) {
  const doc = new JSDOM(readFileSync(path.join(root,`svg/${e.file}.svg`),'utf8'),{contentType:'image/svg+xml'}).window.document;
  for(const id of required) assert.ok(doc.querySelector(`g#${id}`),`${e.file}: missing rig layer ${id}`);
  const ids = [...doc.querySelectorAll('[id]')].map(n=>n.id);
  assert.equal(ids.length,new Set(ids).size,`${e.file}: duplicate IDs`);
  assert.equal(doc.documentElement.getAttribute('viewBox'),'0 0 512 512');
  assert.equal(doc.querySelectorAll('#antenna-light').length,1);
  assert.equal(doc.querySelectorAll('image,script,foreignObject').length,0);
  const moodColor={happy:'mint',celebrating:'mint',thinking:'amber',confused:'amber',warning:'red'}[e.mood]||'blue';
  assert.ok(doc.querySelector('#antenna-light').innerHTML.includes(manifest.palette[moodColor]));
  if(e.view==='back') assert.equal(doc.querySelector('#coin').children.length,0);
}
for(const file of ['board.html','idle.html']) {
  const doc=new JSDOM(readFileSync(path.join(root,file),'utf8')).window.document;
  for(const node of doc.querySelectorAll('[src],[href]')) {
    const source=node.getAttribute('src')||node.getAttribute('href');
    assert.ok(!/^https?:/.test(source),`${file}: network dependency ${source}`);
    readFileSync(path.join(root,source));
  }
  assert.ok(doc.querySelector('meta[name="viewport"]'));
}
const dom=new JSDOM(readFileSync(path.join(root,'idle.html'),'utf8'),{runScripts:'outside-only',pretendToBeVisual:true});
const { window:w }=dom;
let change;
const preference={matches:false,addEventListener:(_,cb)=>{change=cb;}};
w.matchMedia=()=>preference;
// JSDOM has no SVG geometry engine: stubs support timeline/control tests only.
w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:512,height:512});
w.SVGElement.prototype.getCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});
w.eval(readFileSync(path.join(root,'vendor/gsap.min.js'),'utf8'));
w.eval(readFileSync(path.join(root,'idle.js'),'utf8'));
const timeline=w.mascotIdle;
assert.equal(timeline.duration(),2);
assert.equal(timeline.repeat(),-1);
assert.equal(timeline.paused(),false);
timeline.pause().seek(.5);
assert.ok(w.gsap.getProperty(w.document.querySelector('#character'),'y')<0);
timeline.seek(1.36);
assert.ok(w.gsap.getProperty(w.document.querySelector('#eyes'),'scaleY')<.1);
timeline.seek(2);
assert.equal(w.gsap.getProperty(w.document.querySelector('#character'),'y'),0);
assert.equal(w.gsap.getProperty(w.document.querySelector('#eyes'),'scaleY'),1);
assert.equal(w.gsap.getProperty(w.document.querySelector('#antenna-light'),'opacity'),1);
const button=w.document.querySelector('#toggle');
button.click();assert.equal(timeline.paused(),true);assert.equal(button.getAttribute('aria-pressed'),'true');
button.click();assert.equal(timeline.paused(),false);
preference.matches=true;change();assert.equal(timeline.paused(),true);assert.equal(timeline.time(),0);assert.equal(button.disabled,true);
preference.matches=false;change();assert.equal(timeline.paused(),false);assert.equal(button.disabled,false);
timeline.kill();w.gsap.ticker.sleep();dom.window.close();
console.log('PASS: 16 SVGs / rig layers / unique IDs / mood signals / local HTML references / GSAP 2-second timeline, bounce, blink, pulse, controls and dynamic reduced motion (JSDOM; no browser layout claim).');
