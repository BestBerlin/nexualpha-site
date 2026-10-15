import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const started = Date.now();
const dir = decodeURIComponent(new URL('.', import.meta.url).pathname);
writeFileSync(`${dir}run.json`, JSON.stringify({startedAt:new Date(started).toISOString(),durationMs:600000,mode:'read-only public endpoints; local evidence only'}));
for (let cycle=0; cycle<=10; cycle++) {
 const wait=started+cycle*60000-Date.now(); if(wait>0) await new Promise(r=>setTimeout(r,wait));
 await new Promise(resolve=> {const child=spawn(process.execPath,['ops/market-collector/whale-collector.mjs','--once'],{env:{...process.env,WHALES_OUT_FILE:`${dir}cycle-${cycle}.json`,WHALE_HISTORY_FILE:`${dir}history.json`,WHALE_WATCH_HISTORY_FILE:`${dir}watch-history.json`},stdio:['ignore','pipe','pipe'],timeout:150000}); let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);child.on('close',code=>{writeFileSync(`${dir}cycle-${cycle}.log`, output+`\nexit=${code}\n`);resolve();});});
}
writeFileSync(`${dir}complete.json`,JSON.stringify({startedAt:new Date(started).toISOString(),endedAt:new Date().toISOString(),durationMs:Date.now()-started}));
