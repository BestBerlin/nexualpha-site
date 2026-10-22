import { existsSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {ANALYTICS_EVENT_TYPES} from '../src/data/analytics-event-contract.js';
const script = fileURLToPath(new URL('../docs/evidence/four-week-growth-20260927/r103-operating-intake.py',import.meta.url));
test('operator intake names align with the collector event contract',{skip: !existsSync(script) && 'Archived production operating intake script is absent from this checkout'},()=>{
 const result=JSON.parse(execFileSync('python3',['-c',`import runpy,json; m=runpy.run_path(${JSON.stringify(script)});print(json.dumps(m['CTA_TYPES']))`],{encoding:'utf8'}));
 assert.deepEqual([...result].sort(),[...ANALYTICS_EVENT_TYPES].sort());
});
test('real intake parser classifies production intent and visibility without mixing smoke or unknown events',{skip: !existsSync(script) && 'Archived production operating intake script is absent from this checkout'},()=>{
 const code=`import runpy,tempfile,pathlib,json,datetime
m=runpy.run_path(${JSON.stringify(script)})
with tempfile.TemporaryDirectory() as d:
 rows=[{'receivedAt':'2026-10-02T01:15:00Z','environment':env,'type':typ} for env,typ in [('production','decision_select'),('production','cta_visible'),('production','referral_click'),('production','future_unknown'),('smoke','decision_select')]]
 pathlib.Path(d,'production.jsonl').write_text('\\n'.join(json.dumps(r) for r in rows)+'\\n')
 w=m['build_windows'](m['parse_iso_utc']('2026-10-02T02:00:00Z'))
 info=m['collect_cta'](d,w)
 print(json.dumps({'counts':dict(w[1]['ctaEvents']),'rows':info['parsedRows'],'invalid':info['invalidRows']}))`;
 const result=JSON.parse(execFileSync('python3',['-c',code],{encoding:'utf8'}));
 assert.deepEqual(result,{counts:{decision_select:1,cta_visible:1,referral_click:1,other:1},rows:5,invalid:0});
});
