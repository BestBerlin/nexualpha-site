import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(peer)=>readFileSync(new URL(`../../../${peer}/candidate/src/components/v3/RegistrationCard.jsx`,import.meta.url),'utf8');
const hunks=JSON.parse(readFileSync(new URL('./fixtures/r176-registration-hunks.json',import.meta.url),'utf8'));
function apply(text){for(const h of hunks){assert.equal(text.split(h.old).length-1,1,'sole approved R175 source hunk');text=text.replace(h.old,h.new);}return text;}
export function expectedRegistrationSource(){assert.equal(apply(read('r169-home-platform-chooser')),read('r175-ja-home-compact-labels'),'hunks reproduce exact corrected frozen R175 peer');return apply(read('r172-registration-nextstep-locales'));}
export function withoutR175Registration(text){for(const h of [...hunks].reverse()){assert.equal(text.split(h.new).length-1,1);text=text.replace(h.new,h.old);}return text;}
