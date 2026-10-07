import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));const file=path.join(root,'tests/fixtures/r237-approved-inverses.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const bytes=fs.readFileSync(file);assert.equal(sha(bytes),'c3ae40b5cbacdcc7a1d4b740080d05a1208903b6f70209a77b324a1e28d29045','immutable precise approved inverse ledger');const ledger=JSON.parse(bytes);
export const approvedRuntime=Object.freeze({
  "src/App.jsx": "1ffe5cf3ee2df5515302e29b96acf8c1735e02b30aa836661d396927c67d1bb5",
  "src/components/finder/SearchDialog.jsx": "2ce42b1c09f8d4c800a899abc659b7164f9eff3a9220f4a333742d8204134f63",
  "src/components/v3/MobileBottomNav.jsx": "a9ebb2dc81ade54396fe22764e215eeb6f17698199bc1605c5cda3fb084146ad",
  "src/components/v3/TelegramBotHub.jsx": "0921d6e099723554f3b4bfb69c3e985968e9fe835ee695b44d476ff32767995b",
  "src/components/v3/TradingBleedAnalyzer.jsx": "23e9b93e9bc8501ed10026f0351f7826ed17b5fc8bbfb081d75786cf54c7325c",
  "src/components/v3/V3Pages.jsx": "60f70061723c7e56f9f3f78bf9f0e16a146dd4555d5b009f5af806e6753d9689",
  "src/components/v3/VenueReadinessChecklist.css": "a6afce105abf3ccc09d13dc1e4764fed49172c6835039f74bf0469ad5ab795da",
  "src/components/v3/VenueReadinessChecklist.jsx": "4cc00e1e820109cf63ab07272c737ae9cd1006acec35f75244b08cf9970c2c2d",
  "src/components/v3/VenueYellowPages.jsx": "558424d0717d566e0194547b78100046bd4f56140e8784556afcd1baa9df9b78",
  "src/components/v3/activity/OfficialResearch.css": "51bf209493e8e899d8036674b5c07fb6c3b4757b23df462b7ba91af71bd6924b",
  "src/components/v3/activity/OfficialResearch.jsx": "fb98c3675ebbbab5fa112d3bc536214ee0c36e58918310a9ea84570f12c7544f",
  "src/components/v3/crossroads-compare.css": "b12c0c52309377217793902b2d3922b5a79f9d01c697987567a4967725af7f25",
  "src/components/v3/international/BrazilDecisionPage.jsx": "8e5aae8c9c409ada7f379557bb1c934d47c4c2692122d7ee56cbb89f6e5c879c",
  "src/components/v3/international/brazil-decision-page.css": "1f338ee7a3931c64a847705d27133780d16bdb7cc9248bdb000d6ee07b6a4865",
  "src/components/v3/live-conversion-proof.css": "28280a574a7e35f0f85fa48a67adf923a55a3bd85ad07ec4d3d7a1637cacbcc9",
  "src/components/v3/mobile-bottom-nav.css": "835adfb8b55bb96ba6cb673fef4799d60c187ae971f564b5955d5b42d86fc126",
  "src/components/v3/news/NewsDetailPage.jsx": "8bfcb6a5d1a2fc1db235a7911aeea432a50a181a69212c7b47ef7e8710e3a77d",
  "src/components/v3/news/NewsListPage.jsx": "54e031d8a1f6044a65ac58e5ecf1de0a807bf34aa6958cf1c3247eaa736fdba4",
  "src/components/v3/news/news-detail-page.css": "59d44e807206bd147acb284fc3053b1d3fe2df8686a853328422da1ecb2bcfee",
  "src/components/v3/telegram-bot-hub.css": "f6a8644554086e83f81e2acc92d2e4bd66f18584f56af6e65aa08823e86159fa",
  "src/components/v3/trading-bleed-analyzer.css": "007d791208724d7e68bbb6850ccf92b690f9787d4cf6d878e00e1ece69c52812",
  "src/components/v3/v3.css": "7e94971225704731131626fc4433420839c9e62cdead449658acb4fa9c63d132",
  "src/components/v3/venue-yellow-pages.css": "fa85dce4766dab906d5b73fa300cb834282f3c98d33c5beff3b21af00d758f83",
  "src/data/news-feed-client.js": "0ec3ecca48980e1fab7955be1b8d8f181b8c1110c79b7ae398803f2781e8e969",
  "src/data/official-campaign-localizations.js": "0380debbc22060ce9af8f1011c62986b48d063e44c0b620fb94adc25f06d9a98",
  "src/data/official-campaign-model.js": "42a107abe778c9bc2df7aab40f1b5736c25e6f85145d502e5b0c8e87f17ba0de",
  "src/data/seo-injection.js": "3718c3f2e289d4b0f9854f96ebcd6e2be0c68a58ca2c0b5dc5dd8eb2239bc3b7",
  "src/styles/reader-foundation.css": "89394f33143168fcc1a41ab80c9d861d2e138d6c9374d8995c43b004e3a0c3a9",
  "src/styles/reader-material.css": "94060c1f4e6aee0728655316c32d361c5959ca4e4e92da68f0b5dfa6db4be374"
});
export function projectApproved(file,text,peer){const record=ledger[peer]?.[file];if(!record)return text;assert.equal(sha(text),record.currentSha,file+' literal accepted combined whole source');assert.equal(text,record.current,file+' exact inverse input');if(record.baseline===null)return null;assert.equal(sha(record.baseline),record.baselineSha,file+' immutable peer baseline');return record.baseline;}
export function assertProjectedTree(currentRoot,baselineRoot,peer,kept){function keys(dir){let k=[];for(const area of ['src','config','public']){function walk(d){for(const e of fs.readdirSync(path.join(dir,d),{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(e.isFile())k.push(f);else assert.fail('unsupported '+f);}}walk(area);}return k.sort();}const current=keys(currentRoot),old=keys(baselineRoot);assert.deepEqual(current,[...old,...(!old.includes('src/data/official-campaign-localizations.js')?['src/data/official-campaign-localizations.js']:[])].sort(),'bidirectional full protected keyset including only literal approved localization source');const changes=[];for(const f of current){const bytes=fs.readFileSync(path.join(currentRoot,f));if(skipApprovedAdded(f,bytes)&&!fs.existsSync(path.join(baselineRoot,f)))continue;if(approvedRuntime[f])assert.equal(sha(bytes),approvedRuntime[f],f+' combined exact authority');else assert.ok(bytes.equals(fs.readFileSync(path.join(baselineRoot,f))),f+' original protected bytes unchanged');const value=kept.includes(f)?bytes.toString():projectApproved(f,bytes.toString(),peer);if(value!==fs.readFileSync(path.join(baselineRoot,f),'utf8'))changes.push(f);}assert.deepEqual(changes,[...kept].sort(),'only original slice differs after exact approved inverses');}
export function projectNewsBotPlugin(peer){return {name:'r237-exact-news-bot-baseline-projection',setup(build){build.onLoad({filter:/NewsDetailPage\.jsx$/},args=>{const contents=fs.readFileSync(args.path,'utf8');return {contents:projectApproved('src/components/v3/news/NewsDetailPage.jsx',contents,peer),loader:'jsx'};});}};}

export function skipApprovedAdded(file,bytes){if(file!=='src/data/official-campaign-localizations.js')return false;assert.equal(sha(bytes),approvedRuntime[file],'literal accepted added localization source');return true;}

export function projectOwnedRuntimePlugin(peer){return {name:'r243-exact-owned-runtime-projection',setup(build){build.onLoad({filter:/(?:NewsDetailPage\.jsx|official-campaign-model\.js|OfficialResearch\.jsx)$/},args=>{const file=path.relative(root,args.path).replaceAll('\\','/');const contents=fs.readFileSync(args.path,'utf8');return {contents:projectApproved(file,contents,peer),loader:file.endsWith('.jsx')?'jsx':'js'};});}};}
