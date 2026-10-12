// Editable specimen page; a UI/rig review aid, not a rendered episode.
import {writeFile,readFile,mkdir,copyFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {widget,setBackdrop} from './widgets.mjs';
import {nexubo,sam} from './characters.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const specs=[
 {type:'price-board',rows:[{symbol:'BTC / USDT',price:'50,000',change:'Teaching assumption'}]},
 {type:'order-ticket',orderType:'market',side:'Buy · simulation',quantity:'0.002 BTC'},
 {type:'order-ticket',orderType:'limit',side:'Buy · simulation',price:'50,000 USDT',quantity:'0.002 BTC'},
 {type:'balance-ledger',rows:[{asset:'USDT',available:'899.90',locked:'0'},{asset:'BTC',available:'0.002',locked:'0'}]},
 {type:'address-form',network:'Teaching network A',address:'FICTIONAL-ADDRESS-NOT-FOR-TRANSFERS',memo:'FICTIONAL-MEMO'},
 {type:'risk-meter',level:65},
 {type:'candlestick-chart',ohlc:[{open:100,high:106,low:98,close:104},{open:104,high:105,low:96,close:99}]},
 {type:'margin',mode:'isolated',balance:'100 USDT',positions:[{label:'Position A',amount:'100 USDT'}],autoAdd:false,poolScope:'This position only · simplified model'},
 {type:'margin',mode:'cross',balance:'1,000 USDT',positions:[{label:'Position A',amount:'100 USDT'},{label:'Position B',amount:'200 USDT'}],autoAdd:false,poolScope:'Eligible collateral only · simplified model'},
 {type:'identity',steps:[{label:'Verified official channel',status:'Check'}],fictionalNote:'No personal documents'},
 {type:'checklist',items:[{label:'Address AND network AND memo',done:true}]},
 {type:'warning',message:'Stop if any required field is unknown.'}
];
await mkdir(join(root,'build/gallery/assets'),{recursive:true});
await copyFile(join(root,'node_modules/gsap/dist/gsap.min.js'),join(root,'build/gallery/assets/gsap.min.js'));
const cards=specs.map(s=>`<article><h2>${s.type}</h2>${widget(s)}</article>`);
for(const pose of ['wave','point','hold-phone','shield','thumbs-up','facepalm']) cards.push(`<article><h2>Nexubo · ${pose}</h2><div class="specimen character">${await nexubo({id:`gallery-${pose}`,pose})}</div></article>`);
for(const expression of ['neutral','happy','confused','worried','surprised']) cards.push(`<article><h2>Sam · ${expression}</h2><div class="specimen character">${await sam({id:`gallery-sam-${expression}`,expression,pose:'point'})}</div></article>`);
for(const pose of ['rest','point','wave','hold-phone']) cards.push(`<article><h2>Sam · ${pose}</h2><div class="specimen character">${await sam({id:`gallery-sam-pose-${pose}`,pose})}</div></article>`);
for(const name of ['study-desk','trading-desk','transfer-station']) cards.push(`<article><h2>${name}</h2><div class="set-sample">${setBackdrop(name)}</div></article>`);
const css=await readFile(join(root,'style.css'),'utf8');
await writeFile(join(root,'build/gallery/index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Academy v3 components</title><style>${css}body{background:var(--paper);padding:48px}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px}article{border:1px solid var(--border);border-radius:24px;padding:24px;background:white}h1{font-size:40px}h2{font-size:28px}.specimen{width:300px}.set-sample{position:relative;height:300px}@media(max-width:900px){main{grid-template-columns:1fr}}</style><h1>Academy v3 · editable specimens</h1><p>All displayed values are fictional teaching props. No controls collect data or place orders.</p><main>${cards.join('')}</main></html>`);
console.log('Built build/gallery/index.html: 30 component/set/character specimens.');
