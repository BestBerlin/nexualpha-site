import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateEpisode,schedule,captionGroups} from './contract.mjs';
const sample=()=>JSON.parse(readFileSync(new URL('./sample-e05.json',import.meta.url)));
test('E05 has exact 9s problem/brand open, 4s hook/close and 120s total',()=>{
  const e=validateEpisode(sample()); const t=schedule(e);
  assert.equal(t.duration,120);assert.deepEqual(t.scenes.slice(0,3).map(s=>[s.kind,s.start,s.duration]),[['shot',0,6],['open',6,3],['shot',9,23]]);
  assert.deepEqual(t.scenes.slice(-2).map(s=>[s.kind,s.duration]),[['hook',4],['close',4]]);
  validateEpisode(e,'zh-Hans');
});
test('rejects malformed timing, duplicate ids, unsupported locales and missing localized copy',()=>{
  for(const change of [e=>e.shots[0].duration=5,e=>e.shots[1].id='problem',e=>e.shots[1].lines[0].end=24,e=>e.shots[1].antenna='yellow',e=>e.close_duration=3,e=>delete e.title.en,e=>e.shots[0].duration=NaN,e=>e.end_hook.duration=3.01]){
    const e=sample();change(e);assert.throws(()=>validateEpisode(e));
  }
  assert.throws(()=>validateEpisode(sample(),'ar'));
});
test('conversion is absent by default; disclosure required and commercial values never invented',()=>{
  assert.equal(sample().conversion_card,null);
  const e=sample();e.conversion_card={duration:5};assert.throws(()=>validateEpisode(e));
  e.conversion_card.disclosure='Practice only. No partner promotion.';validateEpisode(e);assert.equal(schedule(e).duration,125);
  e.conversion_card.code='SUPPLIED';assert.throws(()=>validateEpisode(e));
  e.conversion_card.partner_name='Supplied partner';validateEpisode(e);
});
test('captions preserve text, honor gaps and explicitly identify estimated words',()=>{
  const line=sample().shots[1].lines[0], c=captionGroups(line,'en',38);
  assert.equal(c.estimated,true);assert.equal(c.groups.flat().map(w=>w.text).join(''),line.text.en);
  assert.ok(c.groups.every(g=>g.reduce((n,w)=>n+w.text.length,0)<=38));
  assert.equal(c.groups[0][0].start,line.start);assert.equal(c.groups.at(-1).at(-1).end,line.end);
  const e=sample();e.shots[0].lines[0]={speaker:'sam',text:'One two',start:1,end:3,words:[{text:'One ',start:1,end:1.8},{text:'two',start:2.2,end:3}]};
  validateEpisode(e);const real=captionGroups(e.shots[0].lines[0],'en',20);assert.equal(real.estimated,false);
  e.shots[0].lines[0].words[1].start=1.5;assert.throws(()=>validateEpisode(e));
});
test('provided words must preserve full line',()=>{
  const e=sample();e.shots[0].lines[0].words=[{text:'Missing text',start:1,end:2}];assert.throws(()=>validateEpisode(e),/preserve/);
});
