import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const hunks=JSON.parse(readFileSync(new URL('./fixtures/r182-r181-hunks.json',import.meta.url),'utf8'));
export function withoutR181(source,file){if(!hunks[file])return source;for(const h of [...hunks[file]].reverse()){assert.equal(source.split(h.after).length-1,1,'sole frozen R181 authorized hunk');source=source.replace(h.after,h.before);}return source;}
