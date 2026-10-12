import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { validateEpisode, schedule, localized, locales, captionGroups } from './contract.mjs';
import { nexubo, sam } from './characters.mjs';
import { esc, widget, setBackdrop } from './widgets.mjs';
const root = dirname(fileURLToPath(import.meta.url));
const input = resolve(process.argv[2] ?? join(root, 'sample-e05.json'));
const locale = process.argv[3] ?? 'en';
const episode = validateEpisode(JSON.parse(await readFile(input, 'utf8')), locale);
const ui = locales[locale], timing = schedule(episode);
const css = await readFile(join(root, 'style.css'), 'utf8');
const runtime = await readFile(join(root, 'motion.js'), 'utf8');
const brandSource = join(root, '../../pilot-01-prototype/public/brand/nexualpha/nexualpha-round.svg');
// Missing brand asset intentionally fails the entire build.
await readFile(brandSource);
const destination = `https://nexualpha.com/starter/${episode.slug}?src=academy-video`;
const serialized = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
function localizeProps(value,locale){
  if(Array.isArray(value)) return value.map(v=>localizeProps(v,locale));
  if(value && typeof value==='object'){
    if(Object.hasOwn(value,'en') || Object.hasOwn(value,'zh-Hans')) {
      if(typeof value[locale]!=='string') throw new Error(`Missing localized widget prop: ${locale}`);
      return value[locale];
    }
    return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,localizeProps(v,locale)]));
  }
  return value;
}
const lockup = (start,duration) => `<div class="lockup"><img id="brand-card-${start}" src="assets/logo.svg" data-start="${start}" data-duration="${duration}" alt=""><b>NexuAlpha</b></div>`;
const captionMarkup = groups => groups.map((words, i) => `<div class="caption-group" data-group="${i}">${words.map(w => `<span>${esc(w.text)}</span>`).join('')}</div>`).join('');
let estimates = false;
for (const [format, width, height] of [['landscape',1920,1080],['portrait',1080,1920]]) {
  const dir = join(root,'build',`${locale}-${format}`);
  await mkdir(join(dir,'assets'), {recursive:true});
  await copyFile(brandSource, join(dir,'assets/logo.svg'));
  await copyFile(join(root,'node_modules/gsap/dist/gsap.min.js'),join(dir,'assets/gsap.min.js'));
  if (episode.conversion_card) await writeFile(join(dir,'assets/qr.svg'), await QRCode.toString(destination,{type:'svg',errorCorrectionLevel:'M',margin:4}));
  const scenes = [], sections = [];
  for (const [i,s] of timing.scenes.entries()) {
    const id = `scene-${i}`;
    const pose = s.kind === 'close' ? 'wave' : s.kind === 'hook' ? episode.end_hook.pose ?? 'point' : s.shot?.nexubo?.pose ?? 'point';
    const cast = `<div class="cast"><div class="character nexubo" data-speaker="nexubo">${await nexubo({id:`nexubo-${i}`,pose,expression:s.shot?.nexubo?.expression ?? 'happy',antenna:s.shot?.antenna ?? 'blue'})}</div>${s.kind === 'shot' ? `<div class="character sam" data-speaker="sam">${await sam({id:`sam-${i}`,pose:s.shot.sam?.pose ?? 'rest',expression:s.shot.sam?.expression ?? 'neutral'})}</div>` : ''}</div>`;
    let content, captions = [], heading, backdrop = '', klass = s.kind;
    if (s.kind === 'shot') {
      heading = localized(s.shot[`onscreen_text_${locale}`] ?? s.shot.onscreen_text, locale);
      content = `<p class="eyebrow">${esc(ui.ep)} ${episode.episode} · ${String(i+1).padStart(2,'0')}</p><h1>${esc(heading)}</h1><div class="widgets">${(s.shot.widgets ?? []).map(w=>widget(localizeProps(w,locale),locale)).join('')}</div>`;
      backdrop = setBackdrop(s.shot.set,locale);
      for (const line of s.shot.lines ?? []) {
        const c = captionGroups(line,locale,format === 'portrait' ? (locale === 'en' ? 38 : 18) : (locale === 'en' ? 68 : 30));
        estimates ||= c.estimated;
        captions.push(...c.groups);
      }
    } else if (s.kind === 'open') {
      klass += ' brand-card'; heading = localized(episode.title,locale);
      content = `${lockup(s.start,s.duration)}<p class="eyebrow">${esc(ui.series)}</p><h1>${esc(ui.ep)} ${episode.episode}<br>${esc(heading)}</h1>`;
    } else if (s.kind === 'close') {
      klass += ' brand-card'; heading = ui.slogan;
      content = `${lockup(s.start,s.duration)}<p class="eyebrow">${esc(ui.series)}</p><h1>${esc(heading)}</h1><p class="site-url">nexualpha.com</p>`;
    } else if (s.kind === 'hook') {
      heading = localized(episode.end_hook.text,locale);
      content = `<p class="eyebrow">${esc(ui.next)}</p><h1>${esc(heading)}</h1>`;
    } else {
      const c = episode.conversion_card;
      heading = ui.practice;
      content = `<h1>${esc(heading)}</h1><div class="widget conversion-card"><img src="assets/qr.svg" alt="${esc(destination)}"><div>${c.partner_name ? `<h2>${esc(localized(c.partner_name,locale))}</h2>` : ''}${c.code ? `<p class="conversion-code">${esc(localized(c.code,locale))}</p>` : ''}${c.rebate_line ? `<p>${esc(localized(c.rebate_line,locale))}</p>` : ''}<p class="site-url">nexualpha.com/starter/${esc(episode.slug)}</p></div><div class="disclosure">${esc(localized(c.disclosure,locale))}</div></div>`;
    }
    sections.push(`<section id="${id}" class="scene ${klass}" aria-label="${esc(heading)}">${backdrop}<div class="stage">${cast}<div class="teaching">${content}</div></div><div class="caption-band" dir="${episode.direction ?? 'ltr'}">${captionMarkup(captions)}</div><div class="ding-chip">! ${esc(ui.warning)}</div></section>`);
    scenes.push({id,kind:s.kind,start:s.start,duration:s.duration,antenna:s.shot?.antenna ?? 'blue',ding:s.shot?.ding ?? false,lines:s.shot?.lines ?? [],captions,pose,visual_en:s.shot?.visual_en});
  }
  const html = `<!doctype html><html lang="${locale}" dir="${episode.direction ?? 'ltr'}"><head><meta charset="utf-8"><title>NexuAlpha E${episode.episode} ${format}</title><style>${css}</style></head><body><main id="academy" class="${format}" data-composition-id="academy" data-start="0" data-duration="${timing.duration}" data-width="${width}" data-height="${height}" data-fps="30" style="width:${width}px;height:${height}px"><div class="brand"><img id="brand-corner" data-start="0" data-duration="${timing.duration}" src="assets/logo.svg" alt="NexuAlpha logo"><span>NexuAlpha</span></div><div class="demo-label">${esc(ui.demo)}</div>${sections.join('')}<div class="progress"></div></main><script src="assets/gsap.min.js"></script><script>const SCENES=${serialized(scenes)};const TOTAL=${timing.duration};${runtime}</script></body></html>`;
  await writeFile(join(dir,'index.html'),html);
  const stamp = seconds => new Date(Math.round(seconds*1000)).toISOString().slice(11,23);
  const vtt = scenes.flatMap(s=>s.captions.map(words=>`${stamp(s.start+words[0].start)} --> ${stamp(s.start+words.at(-1).end)}\n${words.map(w=>esc(w.text)).join('')}\n`));
  await writeFile(join(dir,'captions.vtt'),'WEBVTT\n\n'+vtt.join('\n'));
  await writeFile(join(dir,'sfx-cues.json'),JSON.stringify(scenes.flatMap(s=>s.kind==='open'?[{name:'open-sting',time:s.start,status:'SILENT_PLACEHOLDER'}]:s.ding?[{name:'ding',time:s.start+.6,status:'SILENT_PLACEHOLDER'}]:[]),null,2)+'\n');
  await writeFile(join(root,'evidence',`timeline-${locale}-${format}.json`),JSON.stringify({locale,format,duration:timing.duration,captionTiming:estimates?'includes estimated words':'supplied words',destination:episode.conversion_card ? destination : null,scenes:scenes.map(({id,kind,start,duration})=>({id,kind,start,duration,hero:start+Math.min(duration*.6,3)}))},null,2)+'\n');
  console.log(`Built build/${locale}-${format}: ${width}x${height}, ${timing.duration}s / ${timing.duration*30} frames; silent, ${estimates?'estimated':'supplied'} word timing.`);
}
