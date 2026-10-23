import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { copyText, referralHelp } from '../src/data/cta-ui-copy.js';
import { publicCtaForVenue } from '../src/data/source-bound-cta.js';
const require = createRequire(import.meta.url);
const dir = await mkdtemp(path.join(tmpdir(), 'signup-evidence-'));
const outfile = path.join(dir, 'components.cjs');
await build({stdin:{contents:`export { SignupEvidence } from './src/components/shared/SignupEvidence.jsx'; export { MobileDock } from './src/components/v7/HomeV7.jsx';`,resolveDir:process.cwd(),loader:'jsx'},outfile,bundle:true,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'},define:{'import.meta.env.SSR':'false'},logLevel:'silent'});
// Resolve external dependencies from this checkout, even though the bundle is temporary.
const Module = require('node:module');
const mod = new Module(outfile); mod.paths = Module._nodeModulePaths(process.cwd());
mod._compile(await (await import('node:fs/promises')).readFile(outfile,'utf8'),outfile);
const { SignupEvidence, MobileDock } = mod.exports;
const React = require('react'); const {renderToStaticMarkup} = require('react-dom/server');
test.after(async()=>rm(dir,{recursive:true,force:true}));
test('SSR chip, localized manual help and commission accompany registry-backed signup',()=>{
 for (const locale of ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','it','ja','ko','tr','ru','ar','id','vi']) {
  assert.ok(referralHelp(locale,'TEST').includes('TEST'));
  if(locale!=='en') assert.notEqual(referralHelp(locale,'TEST'),referralHelp('en','TEST'));
 }
 for(const slug of ['binance','okx']) {
  const html=renderToStaticMarkup(React.createElement(SignupEvidence,{slug,locale:'en'}));
  assert.ok(html.includes(publicCtaForVenue(slug).inviteCode));
  assert.match(html,/data-invite-code/); assert.match(html,/data-commission-disclosure/); assert.match(html,/aria-live="polite"/); assert.match(html,/referral field/);
 }
 assert.equal(renderToStaticMarkup(React.createElement(SignupEvidence,{slug:'binance',locale:'ar'})),'');
});
test('dock SSR keeps tracked href and exposes selected code and disclosure',()=>{
 const cta=publicCtaForVenue('binance');const sel={slug:'binance',name:'Binance',code:cta.inviteCode,open:true,share:.25};
 const html=renderToStaticMarkup(React.createElement(MobileDock,{heroRef:{current:null},sel,rebated:[sel],setPick(){},t:{lgPick:'Pick',dockGo:'Sign up'},locale:'en'}));
 assert.match(html,/\/go\/binance\?src=home-v7-dock&amp;locale=en/);assert.match(html,/data-invite-code/);assert.match(html,/data-commission-disclosure/);assert.match(html,/inert=""/);
});
test('clipboard rejection falls back to legacy copy and cleans up',async()=>{
 const dom=new JSDOM('<body><button>Focus</button></body>');globalThis.document=dom.window.document;
 Object.defineProperty(globalThis,'navigator',{value:{userAgent:'test',clipboard:{writeText:async()=>{throw Error('blocked')}}},configurable:true});
 document.execCommand=(command)=>{assert.equal(command,'copy');assert.equal(document.querySelector('textarea').value,'registry-code');return true;};
 assert.equal(await copyText('registry-code'),true);assert.equal(document.querySelector('textarea'),null);
 document.execCommand=()=>false;assert.equal(await copyText('registry-code'),false);
 document.querySelector('button').focus();document.execCommand=()=>{throw Error('denied')};assert.equal(await copyText('registry-code'),false);assert.equal(document.querySelector('textarea'),null);assert.equal(document.activeElement.tagName,'BUTTON');dom.window.close();delete globalThis.document;delete globalThis.navigator;
});
test('chip click announces success and has a visible code',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 let copied;Object.defineProperty(globalThis,'navigator',{value:{userAgent:'test',clipboard:{writeText:async value=>{copied=value}}},configurable:true});
 const {createRoot}=require('react-dom/client');const root=createRoot(document.getElementById('root'));
 await React.act(async()=>root.render(React.createElement(SignupEvidence,{slug:'okx'})));
 await React.act(async()=>document.querySelector('button').click());assert.equal(copied,publicCtaForVenue('okx').inviteCode);assert.match(document.querySelector('[role=status]').textContent,/copied/i);
 await React.act(async()=>root.unmount());dom.window.close();delete globalThis.document;delete globalThis.window;delete globalThis.navigator;delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
