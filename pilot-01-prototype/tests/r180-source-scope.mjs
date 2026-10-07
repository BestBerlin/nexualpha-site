import {withoutR181} from './r182-peer-scope.mjs';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const hunks=JSON.parse(readFileSync(new URL('./fixtures/r180-copy-hunks.json',import.meta.url),'utf8'));
export function withoutR180Copy(source){return withoutR180Only(withoutR181(source,'src/components/v3/RegistrationCard.jsx'));}
export function withoutR180Only(source){for(const {before,after} of hunks){assert.equal(source.split(after).length-1,1,'R180 exact authorized hunk occurs once');source=source.replace(after,before);}return source;}
