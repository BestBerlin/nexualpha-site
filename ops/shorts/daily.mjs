#!/usr/bin/env node
import {access,mkdir,mkdtemp,readFile,writeFile,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {MARKET_URL,FUNDING_URL,validateData,buildPackage} from './builders.mjs';
import {STRINGS} from './strings.mjs';
import {renderShort,renderContactSheet} from './render.mjs';
import {writePreview} from './preview.mjs';

export function parseDailyArgs(args) {
  const options={locales:Object.keys(STRINGS).filter(lang=>lang!=='ar'),voice:false,out:'ops/shorts/samples/v3'};
  for(let i=0;i<args.length;i++) {
    const arg=args[i];
    if(arg==='--voice') options.voice=true;
    else if(['--locales','--out','--fixture'].includes(arg)) {
      const value=args[++i];
      if(!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      if(arg==='--locales') options.locales=value.split(',');
      else options[arg.slice(2)]=value;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if(!options.locales.length || options.locales.some(lang=>!STRINGS[lang]) || new Set(options.locales).size!==options.locales.length) throw new Error('Unsupported or duplicate locales');
  if(options.voice&&!options.locales.includes('en')) throw new Error('--voice requires en in --locales');
  return options;
}
async function getJson(url) {
  const response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{accept:'application/json'}});
  if(!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}
export async function main(args=process.argv.slice(2)) {
  const options=parseDailyArgs(args);
  // Fetch once, validate once: every format/locale shares exactly the same snapshot.
  const market=options.fixture?JSON.parse(await readFile(options.fixture,'utf8')):await getJson(MARKET_URL);
  const funding=market.funding?null:await getJson(FUNDING_URL);
  const data=validateData(market,funding,options.fixture?Date.parse(market.generatedAt):Date.now());
  if(funding) data.fundingSourceUrl=FUNDING_URL;
  const root=path.resolve(options.out);
  await mkdir(root,{recursive:true});
  const destination=path.join(root,`${data.generatedAt.slice(0,10)}${options.fixture?'-fixture':''}`);
  try {
    await access(destination);
    throw new Error(`Daily package already exists: ${destination}; use another --out directory`);
  } catch(error) {
    if(error.code!=='ENOENT') throw error;
  }
  const stage=await mkdtemp(path.join(root,'.daily-'));
  try {
    for(const lang of options.locales) {
      const {slides,meta}=buildPackage(data,lang);
      const dir=path.join(stage,lang);
      await mkdir(dir,{recursive:true});
      const renders={};
      for(const format of ['portrait','square']) {
        const result=await renderShort(slides,path.join(dir,format),{lang,format,voice:options.voice&&lang==='en'});
        if(result.duration<25 || result.duration>35) throw new Error(`Daily short outside 25–35s: ${result.duration}`);
        const contactSheetPath=path.join(dir,format,'contact-sheet.png');
        await renderContactSheet(result.videoPath,contactSheetPath);
        renders[format]={...result,contactSheetPath:path.relative(dir,contactSheetPath)};
        for(const key of ['videoPath','audioPath','posterPath','srtPath']) if(renders[format][key]) renders[format][key]=path.relative(dir,renders[format][key]);
        renders[format].framePaths=result.framePaths.map(file=>path.relative(dir,file));
      }
      await writePreview(slides,lang,dir);
      await writeFile(path.join(dir,'meta.json'),JSON.stringify({...meta,dataMode:options.fixture?'fixture':'live',renders,slides},null,2)+'\n');
    }
    await writeFile(path.join(stage,'source.json'),JSON.stringify({market,...funding?{funding}:{},dataMode:options.fixture?'fixture':'live'},null,2)+'\n');
    await rename(stage,destination);
    console.log(destination);
    return destination;
  } catch(error) {
    await rm(stage,{recursive:true,force:true});
    throw error;
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error=>{console.error(`daily shorts: ${error.message}`);process.exitCode=1;});
