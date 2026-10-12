import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const require=createRequire(new URL('../../pilot-01-prototype/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const gsap=readFileSync(new URL('./node_modules/gsap/dist/gsap.min.js',import.meta.url),'utf8');
for(const locale of ['en','zh-Hans']) test(`${locale}: build both compositions; execute and seek actual GSAP runtime`,()=>{
  const r=spawnSync(process.execPath,['build.mjs','sample-e05.json',locale],{cwd:root,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  for(const format of ['landscape','portrait']){
    const html=readFileSync(new URL(`./build/${locale}-${format}/index.html`,import.meta.url),'utf8');
    assert.ok(!html.includes('[object Promise]'));
    const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost/index.html?at=12'});
    const w=dom.window;w.eval(gsap);
    const script=w.document.querySelectorAll('script')[1].textContent;
    w.eval(script);
    assert.equal(w.__timelines.academy.duration(),120);
    const ids=[...w.document.querySelectorAll('[id]')].map(n=>n.id);
    assert.equal(new Set(ids).size,ids.length,'SVG and media IDs must be unique');
    for(const [at,id] of [[0,'scene-0'],[6,'scene-1'],[9,'scene-2'],[32,'scene-3'],[60,'scene-4'],[84,'scene-5'],[103,'scene-6'],[112,'scene-7'],[116,'scene-8'],[12,'scene-2']]){
      w.academySeek(at);
      const visible=[...w.document.querySelectorAll('.scene')].filter(s=>w.getComputedStyle(s).visibility==='visible');
      assert.deepEqual(visible.map(n=>n.id),[id],`only current scene at ${at}, including reverse seek`);
    }
    w.academySeek(1);
    assert.equal(w.getComputedStyle(w.document.querySelector('#scene-0 .ding-chip')).visibility,'visible');
    assert.equal(w.document.querySelector('#scene-0 .rig-antenna-light ellipse').style.fill,'#ff5c5c');
    const captions=[...w.document.querySelectorAll('#scene-0 .caption-group')].filter(s=>w.getComputedStyle(s).visibility==='visible');
    assert.equal(captions.length,1);
    assert.ok([...captions[0].children].some(s=>s.style.backgroundColor==='rgb(79, 124, 255)'));
    w.academySeek(5.9);
    assert.equal([...w.document.querySelectorAll('.caption-group')].filter(s=>w.getComputedStyle(s).visibility==='visible').length,0,'caption gap clears all words');
    dom.window.close();
  }
});
test('fine-print guard fails the build when a caveat reaches a frame',async()=>{
  const {mkdirSync,writeFileSync,rmSync}=await import('node:fs');
  mkdirSync(root+'.runtime',{recursive:true});
  const e=JSON.parse(readFileSync(root+'sample-e05.json'));
  e.shots[1].widgets=[{type:'warning',message:'Teaching assumption · not a live price or real platform rate'}];
  const path=root+'.runtime/fine-print-test.json';writeFileSync(path,JSON.stringify(e));
  try{
    const r=spawnSync(process.execPath,['build.mjs',path,'en'],{cwd:root,encoding:'utf8'});
    assert.notEqual(r.status,0);assert.match(r.stderr,/Fine print is not allowed/);
  }finally{rmSync(path);spawnSync(process.execPath,['build.mjs','sample-e05.json','en'],{cwd:root,encoding:'utf8'});}
});
test('conversion QR encodes only starter URL, supplied fields are escaped and sample restores',async()=>{
  const {mkdirSync,writeFileSync,rmSync}=await import('node:fs');
  const {default:QRCode}=await import('qrcode');
  mkdirSync(root+'.runtime',{recursive:true});
  const e=JSON.parse(readFileSync(root+'sample-e05.json'));
  e.conversion_card={duration:5,partner_name:'TEST <partner>',code:'TEST-CODE',rebate_line:'TEST supplied line',disclosure:'TEST disclosure <visible>'};
  const path=root+'.runtime/conversion-test.json';writeFileSync(path,JSON.stringify(e));
  try{
    const r=spawnSync(process.execPath,['build.mjs',path,'en'],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
    for(const format of ['landscape','portrait']){
      const html=readFileSync(root+`build/en-${format}/index.html`,'utf8');
      assert.match(html,/TEST &lt;partner&gt;/);assert.doesNotMatch(html,/TEST disclosure/,'disclosure is metadata only (owner rule: no fine print)');assert.doesNotMatch(html,/TEST supplied line/);
      const qr=readFileSync(root+`build/en-${format}/assets/qr.svg`,'utf8');
      assert.equal(qr,await QRCode.toString('https://nexualpha.com/starter/kyc-official-channel?src=academy-video',{type:'svg',errorCorrectionLevel:'M',margin:4}));
      const dom=new JSDOM(html);assert.equal(dom.window.document.querySelectorAll('.conversion-card .disclosure').length,0);dom.window.close();
    }
  }finally{
    rmSync(path);const restored=spawnSync(process.execPath,['build.mjs','sample-e05.json','en'],{cwd:root,encoding:'utf8'});assert.equal(restored.status,0,restored.stderr);
  }
});
