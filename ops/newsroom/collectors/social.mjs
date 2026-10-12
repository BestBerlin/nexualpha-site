import { CollectorError } from './common.mjs';
import { validAccount } from './seeds.mjs';

export const supports = source => ['x-api-v2', 'youtube-data-api'].includes(source.id);
function accounts(entities, platform) {
  return [...new Set(entities.filter(e => e.status === 'active').flatMap(e => Object.entries(e.accounts ?? {}).filter(([key]) => platform === 'x' ? key.startsWith('x') || key.endsWith('_x') : key === platform).map(([,v]) => validAccount(v, platform)).filter(Boolean)))];
}
export function xQueries(entities, keywords) {
  const handles = accounts(entities,'x');
  const terms = keywords.filter(k => k.status === 'active').map(k => `"${k.term.replace(/["\\]/g,'')}"`);
  // Bounded groups; rotate the offset by the UTC hour rather than permanently
  // starving accounts/phrases beyond the first API query length limit.
  const queries = [];
  for (let h=0;h<handles.length;h+=4) for (let k=0;k<terms.length;k+=4) {
    const query = `(${handles.slice(h,h+4).map(a=>`from:${a}`).join(' OR ')}) (${terms.slice(k,k+4).join(' OR ')}) -is:retweet`;
    if (query.length <= 512) queries.push(query);
  }
  return queries;
}
export async function poll(source, since, ctx) {
  if (source.id === 'x-api-v2') {
    const cap = ctx.config.x_daily_read_budget ?? 0;
    if (!Number.isSafeInteger(cap) || cap <= 0) throw new CollectorError('X disabled: daily read budget is zero or invalid', 'partial');
    if (!ctx.env.X_BEARER_TOKEN) throw new CollectorError('X read-only bearer token missing', 'missing-authorization');
    const all = xQueries(ctx.entities, ctx.keywords);
    if (!all.length) throw new CollectorError('No verified X accounts and event keywords', 'partial');
    if(all.length>8)ctx.partial='X account/event search coverage is bounded to eight rotating queries';
    const offset = Math.floor(ctx.now.getTime()/3600000)*8 % all.length;
    const items = [];
    for (let i=0;i<Math.min(8,all.length);i++) {
      // Reserve the worst-case number of paid reads before dispatch; failed or
      // uncertain requests consume the reservation and are never retried.
      if (!await ctx.reserve('x',10,cap)) { if (!items.length) throw new CollectorError('X daily read budget exhausted', 'partial'); ctx.partial = 'X daily budget reached'; break; }
      const url = new URL('https://api.x.com/2/tweets/search/recent');
      url.search = new URLSearchParams({ query: all[(offset+i)%all.length], max_results:'10', 'tweet.fields':'created_at,lang,public_metrics,author_id,referenced_tweets', expansions:'author_id', 'user.fields':'username', ...(since ? { start_time: new Date(since).toISOString() } : {}) });
      const data = await ctx.request(url.href,{ retry:false,headers:{ Authorization:`Bearer ${ctx.env.X_BEARER_TOKEN}` } });
      if (data.errors?.length || (!Array.isArray(data.data) && data.meta?.result_count !== 0)) throw new CollectorError('X response incomplete');
      const users = new Map((data.includes?.users ?? []).map(u=>[u.id,u.username]));
      for (const post of data.data ?? []) {
        const author = users.get(post.author_id);
        items.push({ external_id:post.id, url:`https://x.com/${author ?? 'i'}/status/${post.id}`, author_account:author ?? post.author_id, title:post.text, published_at:post.created_at, lang:post.lang,
          metrics:{ ...post.public_metrics, referenced_tweets:post.referenced_tweets ?? [] } });
      }
    }
    return items;
  }
  if (!ctx.env.YOUTUBE_API_KEY && !ctx.env.YOUTUBE_ACCESS_TOKEN) throw new CollectorError('YouTube read credential missing','missing-authorization');
  const auth=ctx.env.YOUTUBE_ACCESS_TOKEN ? {headers:{Authorization:`Bearer ${ctx.env.YOUTUBE_ACCESS_TOKEN}`}} : {};
  const key=ctx.env.YOUTUBE_API_KEY ? {key:ctx.env.YOUTUBE_API_KEY} : {};
  const allChannels = accounts(ctx.entities,'youtube');
  const offset=allChannels.length ? Math.floor(ctx.now.getTime()/3600000)*19 % allChannels.length : 0;
  const channels=[...allChannels.slice(offset),...allChannels.slice(0,offset)];
  if (!channels.length) throw new CollectorError('No verified YouTube channel IDs or handles','partial');
  const items = [];
  const cap = Math.min(2000,ctx.config.youtube_daily_unit_budget ?? 2000);
  for (const channel of channels) {
    let channelId = channel;
    if (channel.startsWith('@')) {
      if (!await ctx.reserve('youtube',1,cap)) { ctx.partial='YouTube daily quota reached'; break; }
      const lookup = new URL('https://www.googleapis.com/youtube/v3/channels');
      lookup.search = new URLSearchParams({ part:'id', forHandle:channel, ...key });
      const data = await ctx.request(lookup.href,{retry:false,...auth});
      if (!Array.isArray(data.items) || !data.items[0]?.id) {ctx.partial='YouTube handle could not be resolved';continue;}
      channelId=data.items[0].id;
    }
    if (!await ctx.reserve('youtube',100,cap)) {ctx.partial='YouTube daily quota reached';break;}
    const url=new URL('https://www.googleapis.com/youtube/v3/search');
    url.search = new URLSearchParams({part:'snippet',channelId,type:'video',order:'date',maxResults:'10',...key,...(since ? {publishedAfter:new Date(since).toISOString()} : {})});
    const data=await ctx.request(url.href,{retry:false,...auth});
    if (!Array.isArray(data.items)) throw new CollectorError('Invalid YouTube search response');
    items.push(...data.items.map(v=>({external_id:v.id.videoId,url:`https://www.youtube.com/watch?v=${v.id.videoId}`,title:v.snippet.title,author_account:v.snippet.channelId,published_at:v.snippet.publishedAt,metrics:{ metadata_only:true,captions_available:false } })));
  }
  return items;
}
