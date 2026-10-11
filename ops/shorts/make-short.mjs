#!/usr/bin/env node
import {mkdir, mkdtemp, rename, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {MARKET_URL, FUNDING_URL, validateData, buildPackage} from './builders.mjs';
import {renderShort, renderContactSheet} from './render.mjs';

export function parseArgs(args) {
  const options = {voice: false, out: path.join(path.dirname(fileURLToPath(import.meta.url)), 'samples')};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--voice') options.voice = true;
    else if (arg === '--lang' || arg === '--out') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      options[arg.slice(2)] = value;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['zh-Hans', 'en'].includes(options.lang)) throw new Error('Usage: make-short.mjs --lang zh-Hans|en [--voice] [--out DIR]');
  return options;
}
async function getJson(url) {
  const response = await fetch(url, {signal: AbortSignal.timeout(20000), headers: {accept: 'application/json'}});
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}
export async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  const market = await getJson(MARKET_URL);
  const funding = market.funding ? null : await getJson(FUNDING_URL);
  const data = validateData(market, funding);
  if (funding) data.fundingSourceUrl = FUNDING_URL;
  const {slides, meta} = buildPackage(data, options.lang);
  const root = path.resolve(options.out);
  await mkdir(root, {recursive:true});
  const destination = path.join(root, `${meta.date}-${options.lang}`);
  const stage = await mkdtemp(path.join(root, '.render-'));
  try {
    const result = await renderShort(slides, stage, options);
    const render = {...result};
    if (slides.length === 5 && result.duration >= 32) {
      await renderContactSheet(result.videoPath, path.join(stage, 'contact-sheet.png'));
      render.contactSheet = 'contact-sheet.png';
    }
    for (const key of ['videoPath', 'audioPath']) if (render[key]) render[key] = path.relative(stage, render[key]);
    if (render.framePaths) render.framePaths = render.framePaths.map(file => path.relative(stage, file));
    const metadata = {...meta, render, slides};
    await writeFile(path.join(stage, 'meta.json'), `${JSON.stringify(metadata,null,2)}\n`);
    await writeFile(path.join(stage, 'upload.txt'), `${meta.title}\n\n${meta.description}\n\n${meta.hashtags.join(' ')}\n`);
    await writeFile(path.join(stage, 'source.json'), `${JSON.stringify({market, ...(funding ? {funding} : {})},null,2)}\n`);
    // Directory rename refuses an existing nonempty sample; never destroy an earlier render.
    await rename(stage, destination);
    console.log(destination);
    return destination;
  } catch (error) {
    await rm(stage, {recursive:true,force:true});
    throw error;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {console.error(`shorts: ${error.message}`); process.exitCode = 1;});
}
