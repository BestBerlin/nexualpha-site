import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {slideToSvg} from './layout.mjs';
// Offline, seekable review surface using the academy/mascot's existing GSAP runtime.
export async function writePreview(slides,lang,out) {
  const gsap=await readFile(new URL('../brand/mascot/vendor/gsap.min.js',import.meta.url),'utf8');
  for(const format of ['portrait','square']) {
    const scenes=slides.map((slide,i)=>`<section class="frame" id="scene-${i}">${slideToSvg(slide,i,slides.length,lang,{format,caption:slide.captions[0]})}<!-- frame:${i} duration:${slide.duration*1000} transition:fade --></section>`).join('');
    const durations=JSON.stringify(slides.map(slide=>slide.duration));
    await writeFile(path.join(out,`${format}-preview.html`),`<!doctype html><html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"><meta charset="utf-8"><title>NexuAlpha Shorts review</title><style>body{margin:0;background:#0b0d10}.frame{position:absolute;inset:0;visibility:hidden}.frame svg{display:block;max-height:100vh;width:auto;margin:auto}</style>${scenes}<script>${gsap}</script><script>
const timeline=gsap.timeline({paused:true});let at=0;
${durations}.forEach((duration,i)=>{const scene='#scene-'+i;timeline.set(scene,{visibility:'visible'},at);timeline.fromTo(scene,{opacity:0},{opacity:1,duration:.25,immediateRender:false},at);timeline.set(scene,{visibility:'hidden'},at+duration);at+=duration;});
window.__timelines={shorts:timeline};window.shortsSeek=time=>timeline.seek(Math.max(0,Math.min(at-1/30,time)));
const query=new URLSearchParams(location.search);if(query.has('at')) shortsSeek(Number(query.get('at')));else timeline.play();
</script><!-- HYPERFRAMES_META: ${JSON.stringify(slides.map(slide=>({duration:slide.duration,transition:'fade',sceneSummary:slide.title})))} --></html>`);
  }
}
