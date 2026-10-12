import { readFileSync } from 'node:fs';
import { digest } from './common.mjs';

export function validAccount(value, platform) {
  if (typeof value !== 'string') return null;
  if (platform === 'x') return /^@?[A-Za-z0-9_]{1,15}$/.test(value) ? value.replace(/^@/, '') : null;
  if (platform === 'telegram') return value.match(/^https:\/\/t\.me\/([A-Za-z0-9_]+)\/?$/)?.[1] ?? null;
  if (platform === 'youtube') return /^(?:UC[A-Za-z0-9_-]{22}|@[A-Za-z0-9_.-]+)$/.test(value) ? value : value.match(/^https:\/\/(?:www\.)?youtube\.com\/(?:channel\/(UC[A-Za-z0-9_-]{22})|(@[A-Za-z0-9_.-]+))\/?$/)?.slice(1).find(Boolean) ?? null;
  return null;
}
export function normalizeSeeds(watchlist, wordlist) {
  if (!Array.isArray(watchlist) || !wordlist.event_words) throw new Error('Invalid watchlist or keyword seed');
  const rows = watchlist.map(e => {
    if (!e.name || !e.type) throw new Error('Watchlist entity needs name and type');
    const id = e.id ?? (e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `entity-${digest(e.name).slice(0,12)}`);
    const accounts = {};
    for (const [key,value] of Object.entries(e.accounts ?? {})) {
      const platform = key.startsWith('x') || key.endsWith('_x') ? 'x' : key;
      const account = validAccount(value, platform);
      if (account) accounts[key] = account;
    }
    // An employer is not an alias for a person: an SEC notice must not become
    // a statement by every SEC official on the watchlist.
    const corporateNames=['exchange','institution','listed_company'].includes(e.type) ? [e.org,e.org?.replace(/\s*\(.*\)\s*/g,' ').trim(),...(e.org?.match(/\(([^)]+)\)/g) ?? []).map(v=>v.slice(1,-1))].filter(Boolean) : [];
    const tickers=[e.ticker,...[...(e.org?.matchAll(/(?:Nasdaq|NYSE|NASDAQ|NYSE Arca):\s*([A-Z0-9.]+)/g) ?? [])].map(v=>v[1])].filter(Boolean);
    return { id, kind: e.type, display_name: { en: e.name }, aliases: [...new Set([e.name, ...corporateNames,...tickers, ...(e.aliases ?? []), ...Object.entries(accounts).filter(([k]) => k.startsWith('x') || k.endsWith('_x')).map(([,v]) => `@${v}`)])], accounts,
      official_urls: [...new Set([e.official_site, ...(e.verification ?? [])].filter(v => /^https?:\/\//.test(v)))],
      addresses: e.addresses ?? [], role_note: e.current_role ?? null, priority: e.priority ?? 2, status: 'active' };
  });
  const byId=new Map();
  for(const row of rows) {
    const prior=byId.get(row.id);
    if(!prior) {byId.set(row.id,row);continue;}
    if(prior.display_name.en!==row.display_name.en)throw new Error('Conflicting watchlist entity ID');
    // Lookonchain occurs as both an analytics source and a team in the supplied
    // file. One entity avoids duplicate account queries; retain both references.
    for(const [key,value] of Object.entries(row.accounts)) {
      if(prior.accounts[key] && prior.accounts[key]!==value)throw new Error('Conflicting verified account');
      prior.accounts[key]=value;
    }
    prior.aliases=[...new Set([...prior.aliases,...row.aliases])];
    prior.official_urls=[...new Set([...prior.official_urls,...row.official_urls])];
  }
  const entities=[...byId.values()];
  // The input provides phrases, not a phrase-to-taxonomy map. Preserve unknown
  // classifications instead of inferring legal/event claims from list position.
  const keywords = Object.entries(wordlist.event_words).flatMap(([lang, terms]) => {
    if (!Array.isArray(terms)) throw new Error('Keyword language must contain an array');
    return [...new Set(terms)].map(term => ({ term, lang: lang === 'zh' ? 'zh-Hans' : lang, event_type: null, weight: 1, status: 'active' }));
  });
  const sources=[{id:'defillama-hacks',platform:'onchain',name:'DefiLlama hacks',url:'https://api.llama.fi/hacks',access_method:'public_json',role:'data',tier:2,status:'partial',poll_seconds:600,enabled:true,verified_official:false}];
  const channels=new Set();
  for(const entity of entities) {
    const channel=entity.accounts.telegram;
    if(!channel || channels.has(channel.toLowerCase()))continue;
    channels.add(channel.toLowerCase());
    sources.push({id:`telegram:${channel.toLowerCase()}`,platform:'telegram',name:`${entity.display_name.en} public Telegram`,url:`http://127.0.0.1:1200/telegram/channel/${channel}`,channel,access_method:'rsshub',role:'lead',tier:3,status:'partial',poll_seconds:180,enabled:true,verified_official:true,verified_via:'Supplied verified watchlist; channel is a lead, not independent verification'});
  }
  return { entities, keywords, sources };
}
export function loadSeeds(watchlistPath = new URL('../db/watchlist/watchlist.json', import.meta.url), keywordsPath = new URL('../db/watchlist/keywords.json', import.meta.url)) {
  return normalizeSeeds(JSON.parse(readFileSync(watchlistPath, 'utf8')), JSON.parse(readFileSync(keywordsPath, 'utf8')));
}
