import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('.',import.meta.url));
const run=JSON.parse(readFileSync(`${dir}run.json`));
const complete=existsSync(`${dir}complete.json`)?JSON.parse(readFileSync(`${dir}complete.json`)):null;
const files=readdirSync(dir).filter(x=>/^cycle-\d+\.json$/.test(x)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
const snapshots=files.map(file=>({file,data:JSON.parse(readFileSync(`${dir}${file}`))}));
const intents=new Map(),facts=new Map();
for(const {file,data} of snapshots){for(const r of data.signals || []) intents.set(r.id,{...r,evidenceFile:file});for(const r of data.transfers || []) facts.set(r.id,{...r,evidenceFile:file});}
const summary={...run,complete,completed:Boolean(complete),cycles:snapshots.map(({file,data})=>({file,generatedAt:data.generatedAt,status:data.status,signals:data.signals?.length||0,transfers:data.transfers?.length||0,positions:data.positions?.length||0,watchlistSourceStatus:data.watchlistSourceStatus || [],watchlistObservations:(data.watchlistObservations || []).map(({coin,sampledTransfers,newHoldersInSample,fromBlock,toBlock,holderScope})=>({coin,sampledTransfers,newHoldersInSample,fromBlock,toBlock,holderScope}))})),uniqueIntentSignals:intents.size,uniqueTransferFacts:facts.size,acceptance:'Five intent signals are not claimed unless actually observed. Transfer facts are explicitly separate.',realIntentSignals:[...intents.values()].slice(0,5),realTransferFacts:[...facts.values()].slice(0,Math.max(0,5-intents.size))};
writeFileSync(`${dir}summary.json`,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({completed:summary.completed,cycles:summary.cycles.length,uniqueIntentSignals:intents.size,uniqueTransferFacts:facts.size}));
