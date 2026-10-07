import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const sha = value => createHash('sha256').update(value).digest('hex');
const peers = {
 'src/components/v3/growth-conversion.css': ['r193-desktop-hero-composition','9b46060d9b29d435267c03e2e32fec680e7657cf0b2883bf9e9f7237917d5939'],
 'src/components/v3/news/NewsDetailPage.jsx': ['r194-news-reader-priority','d2d14891ab81e500b9f9386b963ca61babc1054b8795b4f24580647642742bdd'],
 'src/components/v3/news/news-detail-page.css': ['r194-news-reader-priority','9a5703d160f298e2c7cd9625bb21e20c7bd7a043c3b6d063ad51b080173064d6'],
 'src/components/v3/topic-guide.css': ['r196-derivatives-picker-mobile','d99cbd7958c8a83b0ca1401c48d821dd7f1409e27557eab17b06349c75bc548d'],
};
export function acceptedIntegrationPeer(relative) {
 const record=peers[relative];
 if(!record)return undefined;
 const bytes=readFileSync(new URL('../../../'+record[0]+'/candidate/'+relative,import.meta.url));
 assert.equal(sha(bytes),record[1],relative+' immutable independently accepted peer');
 return bytes;
}
export function withoutAcceptedR196Tail(css) {
 assert.equal(sha(css),peers['src/components/v3/topic-guide.css'][1],'only exact frozen R196 whole CSS accepted');
 const tail='\n/* R196: narrow derivatives choices use two readable columns. */\n@media (max-width: 640px) {\n  .topic-derivatives-route-picker {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n}\n';
 assert.ok(css.endsWith(tail),'entire approved R196 tail exact');
 const restored=css.slice(0,-tail.length);
 assert.equal(sha(restored),'d98acbe1a915bd6e5522acfd099ac531f83d289dedfb3dac0c447638633dd558','R183 complete prior CSS exact');
 return restored;
}
