import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync}from'node:fs';import{createRequire}from'node:module';
const postcss=createRequire(import.meta.url)('postcss');const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');const old=p=>readFileSync(new URL('../../../r158-home-hierarchy/candidate/'+p,import.meta.url),'utf8');
function media(q,w,h){return [...q.matchAll(/\(([^:]+):\s*([^()]+)\)/g)].every(([,f,v])=>{if(f==='orientation')return v==='landscape'?w>h:h>=w;if(f==='max-height')return h<=parseInt(v);if(f==='max-width')return w<=parseInt(v);throw Error(f);});}
function displays(css,w,h){let value;postcss.parse(css).walkRules(r=>{if(r.selector!=='.lean-hero__telemetry')return;for(let p=r.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media'&&!media(p.params,w,h))return;r.walkDecls('display',d=>value=d.value);});return value;}
test('R161 actual reachable media policy840×390 retains primary route, including500px boundary',()=>{
 const p='src/styles/breakpoints.css';for(const [w,h]of[[840,390],[667,375],[840,500],[1200,500]]){assert.equal(displays(old(p),w,h),'none','baseline hides target in matching media');assert.equal(displays(read(p),w,h),'flex','core route stays naturally flex');}
 for(const[w,h]of[[840,501],[390,840],[1440,1000]]){assert.equal(displays(read(p),w,h),undefined);assert.equal(displays(old(p),w,h),undefined);}
});
test('R161 actual entry and render path include registration, not a decorative-only module',()=>{
 assert.match(read('src/main.jsx'),/import "\.\/styles\/breakpoints\.css";/);
 const hero=read('src/components/v3/LeanHero.jsx');assert.match(hero,/<div className="lean-hero__telemetry">\s*<HomeDecisionPanel locale=\{locale\} ui=\{ui\} \/>/);assert.match(hero,/<RegistrationCard[\s\S]*?compact/);
 assert.match(read('src/components/v3/lean-hero.css'),/\.lean-hero__telemetry\s*\{[^}]*display: flex;/);
});
test('R161 one declaration/comment only, landscape padding, all home text and invitation sources unchanged',()=>{
 const before='    display: none; /* 横屏手机不渲染右侧 telemetry 面板 */',after='    display: flex; /* The primary account route remains available in landscape. */';assert.equal(read('src/styles/breakpoints.css'),old('src/styles/breakpoints.css').replace(before,after));
 for(const p of ['src/main.jsx','src/components/v3/LeanHero.jsx','src/components/v3/RegistrationCard.jsx','src/components/v3/growth-conversion.css','src/components/v3/registration-card.css','src/data/partner-registry.js'])assert.equal(read(p),p==='src/components/v3/growth-conversion.css'?readFileSync(new URL('../../../r162-home-native-marker/candidate/'+p,import.meta.url),'utf8'):old(p));
});
