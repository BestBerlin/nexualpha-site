import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readSourceRegistry } from '../db/generate-seed-sql.mjs';
import { CollectorError, makeRequest, normalizeItem } from './common.mjs';
import { loadSeeds } from './seeds.mjs';
import * as social from './social.mjs';
import * as feeds from './feeds.mjs';
import * as exchange from './exchange.mjs';
import * as legal from './legal.mjs';
import * as market from './market.mjs';

export const families = [exchange,legal,feeds,market,social];
// Archive-style feeds (EDGAR submissions, full RSS archives) would otherwise
// backfill years of history on a source's first run and swamp the 48 h dedupe
// window. Items with a known publication time older than this are not stored.
export const MAX_ITEM_AGE_DAYS = 7;
export function dryStore(directory) {
  mkdirSync(directory,{recursive:true});
  return {
    persist(source,items,health) {
      // Hex-encoded IDs cannot traverse or collide through sanitized filenames.
      const name=Buffer.from(source.id).toString('hex');
      writeFileSync(resolve(directory,`${name}.ndjson`),items.map(i=>JSON.stringify(i)).join('\n')+(items.length?'\n':''));
      writeFileSync(resolve(directory,`${name}.status.json`),JSON.stringify({source_id:source.id,...health},null,2)+'\n');
    },
    // Dry runs never dispatch paid requests. Inject a memory store in fixtures
    // to exercise social response parsing and caps without any API access.
    reserve: async () => false,
  };
}
export async function collect({ sources, fallbackSources=sources, entities=[], keywords=[], config={}, store, modules=families, fetchImpl, env=process.env, now=new Date(), timeoutMs=60000, retries=2, sleep } = {}) {
  const reports=[];
  const visited=new Set();
  async function one(source, fallback=false) {
    if (visited.has(source.id) || source.enabled === false) return;
    visited.add(source.id);
    const collector=modules.find(m=>m.supports(source));
    if(!collector) {reports.push({source_id:source.id,skipped:'no-automated-collector'});return;}
    const failures=source.consecutive_failures ?? 0;
    const backoff=failures >= 3 ? Math.min(3600,(source.poll_seconds ?? 600)*2**Math.min(6,failures-3)) : 0;
    if (backoff && source.last_error_at && now-new Date(source.last_error_at) < backoff*1000) {
      reports.push({source_id:source.id,skipped:'circuit-backoff'});
      if (source.fallback_source_id) {const target=fallbackSources.find(s=>s.id===source.fallback_source_id);if(target)await one(target,true);}
      return;
    }
    const controller=new AbortController();
    let timer;
    let items=[],health;
    try {
      if (!collector) throw new CollectorError('No automated collector for this source',source.status === 'missing-authorization'?'missing-authorization':'partial');
      const ctx={entities,keywords,config,env,now,signal:controller.signal,reserve:(platform,amount,cap)=>store.reserve(platform,amount,cap,now.toISOString().slice(0,10))};
      ctx.request=makeRequest({fetchImpl,signal:controller.signal,timeoutMs:Math.min(timeoutMs,10000),retries,sleep});
      // The health timestamp is not a publication cursor. A bounded overlap
      // catches late feeds and rotated queries; raw_items uniqueness absorbs
      // repeats. Paid X searches retain their narrow cursor to avoid rereads.
      const since=source.last_success_at && source.platform!=='x' ? new Date(Date.parse(source.last_success_at)-24*3600000).toISOString() : source.last_success_at;
      const raw=await Promise.race([collector.poll(source,since,ctx),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new CollectorError('Source timeout'));},timeoutMs);})]);
      if (!Array.isArray(raw)) throw new CollectorError('Collector did not return an array');
      const unique=new Map();
      const floor=now.getTime()-MAX_ITEM_AGE_DAYS*86400000;
      for (const row of raw) {
        const item=normalizeItem(row,source,{entities,keywords,now});
        if (item.published_at && Date.parse(item.published_at) < floor) continue;
        // Keep unknown publication times, never fabricate a source timestamp.
        unique.set(item.external_id,item);
      }
      items=[...unique.values()];
      health={status:ctx.partial?'partial':'connected',last_success_at:now.toISOString(),last_error:ctx.partial ?? null,consecutive_failures:0,at:now.toISOString()};
    } catch(error) {
      health={status:error instanceof CollectorError ? error.status : 'temporarily-failing',last_error:error instanceof CollectorError ? error.message : 'Collector failed (details suppressed)',consecutive_failures:failures+1,at:now.toISOString()};
    } finally {clearTimeout(timer);controller.abort();}
    try { await store.persist(source,items,health); }
    catch { reports.push({source_id:source.id,status:'temporarily-failing',count:0,last_error:'Persistence failed'}); return; }
    reports.push({source_id:source.id,status:health.status,count:items.length,...(health.last_error?{last_error:health.last_error}:{}),...(fallback?{fallback:true}:{})});
    if (health.consecutive_failures>=3 && source.fallback_source_id) {
      const target=fallbackSources.find(s=>s.id===source.fallback_source_id);if(target)await one(target,true);
    }
  }
  for(const source of sources) await one(source);
  return reports;
}
export function parseCollectArgs(args) {
  const opts={};
  for(let i=0;i<args.length;i++) {
    const key=args[i];
    if (!['--all','--source','--dry-run','--timeout-ms'].includes(key) || key in opts) throw new Error('Invalid or duplicate collect option');
    if(key==='--all') opts[key]=true;
    else {if(!args[i+1] || args[i+1].startsWith('--'))throw new Error(`Missing ${key} value`);opts[key]=args[++i];}
  }
  if(Boolean(opts['--all'])===Boolean(opts['--source']))throw new Error('collect requires --all or --source ID');
  if(opts['--timeout-ms'] && (!/^\d+$/.test(opts['--timeout-ms']) || +opts['--timeout-ms']<1 || +opts['--timeout-ms']>3600000))throw new Error('Invalid timeout');
  return opts;
}
export async function runCollect(args, db, overrides={}) {
  const opts=parseCollectArgs(args);
  const dry=opts['--dry-run'];
  const seeds=dry?loadSeeds():null;
  const registry=dry?[...readSourceRegistry(),...seeds.sources]:db.sources();
  const sources=opts['--all']?registry:registry.filter(s=>s.id===opts['--source']);
  if(!sources.length)throw new Error('Unknown source ID');
  return collect({sources,fallbackSources:registry,entities:dry?seeds.entities:db.entities(),keywords:dry?seeds.keywords:db.keywords(),config:dry?{}:db.config(),store:dry?dryStore(dry):db,timeoutMs:+opts['--timeout-ms']||60000,...overrides});
}
