import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const locale=process.argv[2]??'en';
if(!['en','zh-Hans'].includes(locale)) throw new Error('Unsupported locale');
for(const [format,w,h] of [['landscape',1920,1080],['portrait',1080,1920]]){
  const t=JSON.parse(await readFile(join(root,`evidence/timeline-${locale}-${format}.json`),'utf8'));
  const scale=format==='portrait'?.15:.22;
  const items=t.scenes.map(s=>`<figure><div class="frame"><iframe title="${s.id}" src="../build/${locale}-${format}/index.html?at=${s.hero}" width="${w}" height="${h}" style="transform:scale(${scale});transform-origin:top left;border:0"></iframe></div><figcaption>${s.kind} · ${s.hero.toFixed(2)} s</figcaption></figure>`).join('');
  await writeFile(join(root,`evidence/contact-${locale}-${format}.html`),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Academy E05 contact sheet</title><style>body{background:#0b0d10;color:white;font-family:Arial;padding:24px}main{display:grid;grid-template-columns:repeat(3,${w*scale}px);gap:20px}figure{margin:0}.frame{width:${w*scale}px;height:${h*scale}px;overflow:hidden}figcaption{padding:12px 0}</style><h1>Academy E05 · ${locale} · ${format}</h1><p>Silent HTML timeline samples; estimated word timing. These are not MP4 frame evidence.</p><main>${items}</main></html>`);
  if(process.argv.includes('--video')){
    const frames=join(root,`evidence/${locale}-${format}-frames`);await mkdir(frames,{recursive:true});
    const run=args=>{const r=spawnSync('ffmpeg',args,{encoding:'utf8',env:{...process.env}});if(r.status!==0) throw new Error(r.stderr||r.error?.message);};
    for(const [i,s] of t.scenes.entries()) run(['-v','error','-ss',String(s.hero),'-i',join(root,`renders/${locale}-${format}.mp4`),'-frames:v','1','-y',join(frames,`${String(i).padStart(2,'0')}.png`)]);
    run(['-v','error','-framerate','1','-i',join(frames,'%02d.png'),'-vf',`scale=${format==='portrait'?216:384}:-1,tile=3x3:padding=12:margin=12:color=0x0b0d10`,'-frames:v','1','-y',join(root,`evidence/contact-video-${locale}-${format}.png`)]);
  }
}
console.log(`Wrote ${locale} contact sheets (${process.argv.includes('--video')?'MP4 frames + HTML':'HTML timeline previews only'}).`);
