# -*- coding: utf-8 -*-
"""Local, narration-led NexuAlpha episode renderer. No uploads or paid APIs."""
from __future__ import annotations
import argparse
import functools
import json
import math
import os
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
FPS = 30
BG = '#0b0d10'
BLUE = '#4f7cff'
WHITE = '#edf2ff'
MUTED = '#9ca8be'
TYPES = {'flow','phone-mock','checklist','compare-table','warning-card','number-counter','timeline','split-choice','quote','definition'}
FFMPEG = os.environ.get('ACADEMY_FFMPEG', '/opt/homebrew/bin/ffmpeg')
FFPROBE = str(Path(FFMPEG).with_name('ffprobe'))
ENV = {**os.environ, 'DYLD_LIBRARY_PATH': '/opt/homebrew/Cellar/x265/4.2/lib'}


def run(args):
    return subprocess.run([str(a) for a in args], check=True, capture_output=True, env=ENV).stdout.decode()


def validate(script):
    if not isinstance(script, dict) or not isinstance(script.get('meta'), dict):
        raise ValueError('meta object required')
    meta = script['meta']
    if isinstance(meta.get('level'), bool) or not isinstance(meta.get('level'), int) or meta['level'] < 1:
        raise ValueError('positive integer level required')
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', str(meta.get('slug',''))):
        raise ValueError('safe slug required')
    for key in ('title_zh','title_en','next_title_zh','next_title_en'):
        if not isinstance(meta.get(key), str) or not meta[key].strip():
            raise ValueError(f'{key} required')
    cta = meta.get('cta', {})
    if not isinstance(cta,dict): raise ValueError('CTA object required')
    if cta.get('kind') not in ('none','neutral','partner') or (cta['kind']=='partner' and not isinstance(cta.get('partner'),str)):
        raise ValueError('CTA kind neutral or partner required')
    if not isinstance(script.get('scenes'), list) or not script['scenes']:
        raise ValueError('nonempty scenes required')
    for scene in script['scenes']:
        if not isinstance(scene,dict): raise ValueError('scene object required')
        for key in ('voice_zh','voice_en','title','sub'):
            if not isinstance(scene.get(key), str) or not scene[key].strip():
                raise ValueError(f'scene {key} required')
        value = scene.get('min_s')
        if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or value <= 0:
            raise ValueError('finite positive min_s required')
        if not isinstance(scene.get('visual'),dict): raise ValueError('visual object required')
        if scene.get('visual',{}).get('type') not in TYPES or not isinstance(scene['visual'].get('params'),dict):
            raise ValueError('supported visual type and params required')
    return script


@functools.lru_cache(maxsize=64)
def font(size, locale='zh-Hans'):
    if size < 34:
        raise ValueError('minimum on-screen type is 34px')
    if locale == 'en':
        path = Path('/System/Library/Fonts/Avenir Next.ttc')
    else:
        paths = list(Path('/System/Library/AssetsV2').glob('com_apple_MobileAsset_Font*/**/PingFang.ttc'))
        path = paths[0] if paths else Path('/System/Library/Fonts/PingFang.ttc')
    return ImageFont.truetype(str(path),size,index=7 if locale=='en' else 3)


def lines_for(text, width, size, locale):
    f = font(size,locale)
    lines=[]
    for paragraph in str(text).split('\n'):
        line=''
        # Word boundaries for English, characters for CJK.
        tokens=re.findall(r'\S+\s*',paragraph) if locale=='en' else list(paragraph)
        for token in tokens:
            candidate=line+token
            if f.getlength(candidate.rstrip()) > width:
                if not line or f.getlength(token.rstrip()) > width:
                    raise ValueError(f'Text token does not fit: {token}')
                lines.append(line.rstrip()); line=token
            else:
                line=candidate
        lines.append(line.rstrip())
    return lines


def text(im, value, box, size=44, color=WHITE, locale='zh-Hans'):
    x,y,x2,y2=box
    for s in range(size,33,-2):
        lines=lines_for(value,x2-x,s,locale)
        step=math.ceil(s*1.45)
        if len(lines)*step <= y2-y:
            d=ImageDraw.Draw(im)
            for n,line in enumerate(lines):
                d.text((x,y+n*step),line,font=font(s,locale),fill=color)
            return
    raise ValueError(f'Text does not fit at 34px: {value}')


@functools.lru_cache(maxsize=8)
def logo(size):
    # Rasterize the authoritative SVG's linear paths, without another dependency.
    svg=ET.parse(REPO/'pilot-01-prototype/public/brand/nexualpha/nexualpha-round.svg').getroot()
    im=Image.new('RGBA',(size,size)); d=ImageDraw.Draw(im); scale=size/256
    for element in svg:
        tag=element.tag.split('}')[-1]
        if tag=='circle':
            cx,cy,r=[float(element.attrib[k])*scale for k in ('cx','cy','r')]
            d.ellipse((cx-r,cy-r,cx+r,cy+r), fill=element.attrib['fill'])
        elif tag=='path':
            tokens=re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?',element.attrib['d'])
            points=[]; x=y=0; command=None; i=0
            while i<len(tokens):
                if tokens[i].isalpha():
                    command=tokens[i]; i+=1
                    if command.lower()=='z':
                        if points: d.polygon([(a*scale,b*scale) for a,b in points],fill=element.attrib['fill'])
                        points=[]; continue
                relative=command.islower()
                if command.lower() in ('m','l'):
                    a,b=float(tokens[i]),float(tokens[i+1]); i+=2
                    x,y=(x+a,y+b) if relative else (a,b)
                    if command.lower()=='m': command='l' if relative else 'L'
                elif command.lower()=='h':
                    a=float(tokens[i]); i+=1; x=x+a if relative else a
                elif command.lower()=='v':
                    a=float(tokens[i]); i+=1; y=y+a if relative else a
                else: raise ValueError('Unsupported logo path command')
                points.append((x,y))
    return im


def resolve_cta(meta,locale,market=''):
    if meta['cta']['kind']!='partner' or locale in ('ru','ar','zh-Hant','ur','uk'):
        return None
    return json.loads(run(['node',ROOT/'cta.mjs',meta['cta']['partner'],locale,market]))


def sentences(value):
    return [s.strip() for s in re.findall(r'.+?(?:[。！？.!?](?=\s|$)|[。！？]|$)',value) if s.strip()]


def chinese_number(raw):
    digits='零一二三四五六七八九'
    if len(raw)>4 or (len(raw)>1 and raw.startswith('0')):
        return ' '.join(digits[int(c)] for c in raw)
    value=int(raw)
    if value==0: return digits[0]
    result=''; zero=False
    for divisor,unit in [(1000,'千'),(100,'百'),(10,'十'),(1,'')]:
        count,value=divmod(value,divisor)
        if count:
            if zero: result+='零'
            result+=('' if count==1 and divisor==10 and not result else digits[count])+unit
            zero=False
        elif result and value: zero=True
    return result


def spoken(value,locale):
    value=re.sub(r'\bUSDT\b','U S D T',value,flags=re.I)
    if locale != 'en':
        value=value.replace('Memo','备注').replace('Tag','标签')
        value=re.sub(r'(\d+(?:\.\d+)?)%',lambda m: '百分之'+m[1],value)
        value=re.sub(r'\d+(?:\.\d+)?',lambda m: chinese_number(m[0].split('.')[0])+('点'+''.join('零一二三四五六七八九'[int(c)] for c in m[0].split('.')[1]) if '.' in m[0] else ''),value)
    return value


def audio_duration(path):
    value=run([FFPROBE,'-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',path]).strip()
    if value == 'N/A' or not math.isfinite(float(value)) or float(value) <= 0:
        raise RuntimeError(f'Empty narration: {path}. macOS say produced no usable audio; run on a speech-enabled host.')
    return float(value)


def plan(script, out):
    """Synthesize each sentence; measure the waveform rather than estimating duration."""
    work=out/'work'; work.mkdir(parents=True,exist_ok=True)
    timelines={}
    for locale,key,voice,rate in [('zh-Hans','voice_zh','Tingting',205),('en','voice_en','Samantha',165)]:
        cues=[]; scenes=[]; clock=3.0; audio=[]
        for i,scene in enumerate(script['scenes']):
            lengths=[]; pieces=[]
            for j,sentence in enumerate(sentences(scene[key])):
                aiff=work/f'{locale}-{i}-{j}.aiff'; wav=aiff.with_suffix('.wav')
                run(['say','-v',voice,'-r',rate,'-o',aiff,spoken(sentence,locale)])
                run([FFMPEG,'-y','-v','error','-i',aiff,'-ar','48000','-ac','1',wav])
                seconds=audio_duration(wav)
                lengths.append(seconds); pieces.append(wav)
                cues.append({'start':clock+sum(lengths[:-1]),'end':clock+sum(lengths),'text':sentence,'scene':i})
            duration=math.ceil(max(scene['min_s'],sum(lengths)+0.6)*FPS)/FPS
            scenes.append({'start':clock,'duration':duration}); clock+=duration
            audio.append((pieces,duration-sum(lengths)))
        timelines[locale]={'scenes':scenes,'cues':cues,'duration':clock+7,'end_start':clock}
        # Concatenate PCM audio with exact leading and inter-scene padding.
        import wave
        with wave.open(str(out/f'{locale}.wav'),'wb') as target:
            target.setnchannels(1); target.setsampwidth(2); target.setframerate(48000)
            target.writeframes(b'\0'*int(3*48000)*2)
            for pieces,pad in audio:
                for path in pieces:
                    with wave.open(str(path),'rb') as source:
                        target.writeframes(source.readframes(source.getnframes()))
                target.writeframes(b'\0'*round(pad*48000)*2)
            target.writeframes(b'\0'*int(7*48000)*2)
        write_srt(out/f'{locale}.srt',cues)
    (out/'timing.json').write_text(json.dumps(timelines,ensure_ascii=False,indent=2)+'\n')
    return timelines


def stamp(seconds):
    ms=round(seconds*1000); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); s,ms=divmod(ms,1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'


def write_srt(path,cues):
    path.write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(cues))+'\n',encoding='utf-8')


def ease(x):
    x=max(0,min(1,x)); return x*x*(3-2*x)


@functools.lru_cache(maxsize=8)
def qr_image(slug):
    import qrcode
    return qrcode.make(f'https://nexualpha.com/zh-hans/starter/{slug}?src=academy-video').convert('RGB').resize((300,300),Image.Resampling.NEAREST)


def frame(script,timing,t,size,locale,cta,burn=False):
    from visuals import draw_visual
    w,h=size; vertical=h>w; im=Image.new('RGB',size,BG); d=ImageDraw.Draw(im)
    margin=64
    # Quiet animated orbit is a continuous visual signature, not a slide background.
    for r in (340,480,620):
        d.arc((w-r-140,-r+120,w+r-140,r+120),int(t*8),int(t*8)+215,fill='#172239',width=2)
    meta=script['meta']; en=locale=='en'; title=meta['title_en' if en else 'title_zh']
    if t<3:
        p=ease(t/0.9); s=int(180+40*p); mark=logo(s)
        im.paste(mark,(margin,240 if vertical else 200),mark)
        y=550 if vertical else 460
        text(im,f'Starter Path · Level {meta["level"]}' if en else f'新手村 · 第 {meta["level"]} 关',(margin,y,w-margin,y+130),48,BLUE,locale)
        text(im,title,(margin,y+150,w-margin,h-200),64 if vertical else 76,WHITE,locale)
        d.line((margin,y+125,margin+(w-2*margin)*p,y+125),fill=BLUE,width=4)
        local=t; duration=3
    elif t>=timing['end_start']:
        local=t-timing['end_start']; duration=7
        heading=('SEASON COMPLETE' if en else '第一季完成') if meta.get('next_slug') == '' else ('NEXT LEVEL' if en else '下一关')
        text(im,heading,(margin,185,w-margin,260),42,BLUE,locale)
        next_title=meta['next_title_en' if en else 'next_title_zh']
        text(im,next_title,(margin,280,w-margin,450),62,WHITE,locale)
        if cta:
            claim=f'在 {cta["name"]} 官方入口完成这一步\n邀请码 {cta["inviteCode"]}'
            if cta['share'] is not None: claim+=f'\n手续费最高返还 {cta["share"]*100:g}%'
            if en:
                claim=f'Complete this step via {cta["name"]}\nInvite code {cta["inviteCode"]}'
                if cta['share'] is not None: claim+=f'\nFee rebate up to {cta["share"]*100:g}%'
            disclosure='Promotion link; commission paid by the exchange' if en else '合作推广链接，佣金由交易所支付'
        else:
            claim=f'nexualpha.com/zh-hans/starter/\n{meta["slug"]}'
            disclosure='Independent educational example' if en else '中立教学示例 · 以平台当前说明为准'
        qr_x=margin if vertical else w-420; qr_y=950 if vertical else 500
        block_right=w-margin if vertical else w-490
        text(im,claim,(margin,500,block_right,780 if vertical else 700),44,WHITE,locale)
        text(im,disclosure,(margin,800 if vertical else 740,block_right,895 if vertical else 805),34,MUTED,locale)
        if cta and meta['level']==8 and cta.get('slug')=='bitget':
            domain_line='partner.bitget.cafe is an official Bitget partner domain' if en else 'partner.bitget.cafe 为 Bitget 官方合作域名'
            text(im,domain_line,(margin,895 if vertical else 810,block_right,945 if vertical else 865),34,MUTED,locale)
        text(im,'Not investment advice' if en else '不构成投资建议',(margin,1690 if vertical else 900,w-margin,1775 if vertical else 955),34,MUTED,locale)
        try:
            qr=qr_image(meta['slug'])
            im.paste(qr,(qr_x,qr_y))
        except ImportError:
            text(im,'nexualpha.com',(qr_x,qr_y,qr_x+350,qr_y+200),34,BLUE,'en')
    else:
        i=next(i for i,s in enumerate(timing['scenes']) if s['start']<=t<s['start']+s['duration'])
        timing_scene=timing['scenes'][i]; scene=script['scenes'][i]
        local=t-timing_scene['start']; duration=timing_scene['duration']
        y=170
        text(im,scene.get('title_en',scene['title']) if en else scene['title'],(margin,y,w-margin,y+(200 if vertical else 145)),64,WHITE,locale)
        text(im,scene.get('sub_en',scene['sub']) if en else scene['sub'],(margin,y+(220 if vertical else 160),w-margin,y+(400 if vertical else 290)),38,MUTED,locale)
        box=(margin,620 if vertical else 470,w-margin,1430 if vertical else 810)
        draw_visual(im,box,scene['visual']['type'],scene['visual']['params'],local,duration,locale)
        text(im,f'{i+1:02} / {len(script["scenes"]):02} · '+('STARTER PATH' if en else '新手村'),(margin,h-330 if vertical else h-260,w-margin,h-250 if vertical else h-205),34,BLUE,locale)
        if burn:
            active=next((c for c in timing['cues'] if c['start']<=t<c['end']),None)
            if active:
                text(im,active['text'],(margin,h-250 if vertical else h-205,w-margin,h-105),36,WHITE,locale)
    # Smooth 0.3s fade through brand background at each chapter boundary.
    alpha=min(ease(local/.3),ease((duration-local)/.3))
    im=Image.blend(Image.new('RGB',size,BG),im,alpha)
    d=ImageDraw.Draw(im)
    im.paste(logo(64),(margin,40),logo(64))
    text(im,'NexuAlpha',(145,45,w-64,120),34,locale='en')
    text(im,'nexualpha.com',(w-345,h-80,w-40,h-20),34,MUTED,'en')
    d.line((margin,h-100,w-margin,h-100),fill='#25304a',width=4)
    d.line((margin,h-100,margin+(w-2*margin)*min(1,t/timing['duration']),h-100),fill=BLUE,width=6)
    if timing.get('diagnostic'):
        text(im,'SILENT VISUAL REVIEW',(w-515,45,w-40,115),34,'#f8bb6a','en')
    return im


def render(script,timing,out,locale,cta,diagnostic_frame_rate=FPS):
    # Diagnostic reviews may sample motion sparsely; final narrated exports remain 30fps.
    input_fps=diagnostic_frame_rate if timing.get('diagnostic') else FPS
    for vertical in (False,True):
        size=(1080,1920) if vertical else (1920,1080); label='vertical' if vertical else 'master'
        # Encode clean and captioned versions from the same frames and narration timeline.
        writers=[]
        for burn in (False,True):
            name=f'{label}-{locale}'+('-captions' if burn else '')+'.mp4'
            temporary=out/f'.{name}.partial.mp4'
            args=[FFMPEG,'-nostdin','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{size[0]}x{size[1]}','-r',input_fps,'-i','pipe:0','-i',out/f'{locale}.wav','-r',FPS,'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-t',timing['duration'],temporary]
            writers.append((burn,subprocess.Popen([str(a) for a in args],stdin=subprocess.PIPE,stderr=subprocess.PIPE,env=ENV),out/name,temporary))
        try:
            for n in range(math.ceil(timing['duration']*input_fps)):
                if n % (input_fps*10) == 0: print(f'{label}: {n/input_fps:.0f}/{timing["duration"]:.1f}s',flush=True)
                t=n/input_fps
                clean=frame(script,timing,t,size,locale,cta,False)
                for burn,process,_,_ in writers:
                    im=clean
                    active=next((c for c in timing['cues'] if c['start']<=t<c['end']),None)
                    if burn and active:
                        im=clean.copy()
                        w,h=size
                        text(im,active['text'],(64,h-250 if vertical else h-205,w-64,h-105),36,WHITE,locale)
                    process.stdin.write(im.tobytes())
            # Signal EOF to every encoder before waiting for any one of them.
            for _,process,_,_ in writers:
                process.stdin.close()
                process.stdin=None
            for _,process,target,temporary in writers:
                _,error=process.communicate(timeout=60)
                if process.returncode: raise RuntimeError(error.decode())
            for _,_,target,temporary in writers: temporary.replace(target)
        finally:
            for _,process,_,temporary in writers:
                if process.poll() is None: process.kill(); process.wait()
                temporary.unlink(missing_ok=True)



def preflight(script,timing,locale,cta):
    """Exercise complete labels and every caption before expensive encoding."""
    times=[1.5,timing['end_start']+2]
    for scene in timing['scenes']:
        times.extend(scene['start']+scene['duration']*p for p in (.02,.5,.98))
    times.extend((cue['start']+cue['end'])/2 for cue in timing['cues'])
    for size in ((1920,1080),(1080,1920)):
        for t in times: frame(script,timing,t,size,locale,cta,True)


def previews(script,timing,out,locale,cta):
    shots=[1.5]+[s['start']+s['duration']*.85 for s in timing['scenes']]+[timing['end_start']+2]
    for size,label in [((1920,1080),'landscape'),((1080,1920),'vertical')]:
        thumbs=[]
        for t in shots:
            im=frame(script,timing,t,size,locale,cta,True)
            im.thumbnail((640,360) if label=='landscape' else (270,480)); thumbs.append(im)
        tw,th=thumbs[0].size; sheet=Image.new('RGB',(tw*3,th*math.ceil(len(thumbs)/3)),BG)
        for i,im in enumerate(thumbs): sheet.paste(im,((i%3)*tw,(i//3)*th))
        sheet.save(out/f'contact-sheet-{label}.jpg',quality=92)
    frame(script,timing,1.5,(1920,1080),locale,cta).resize((1280,720),Image.Resampling.LANCZOS).save(out/'poster.jpg',quality=95)



def diagnostic_plan(script,out):
    """Review-only fallback; deliberately never writes the production timing cache."""
    import wave
    timelines={}
    for locale,key in [('zh-Hans','voice_zh'),('en','voice_en')]:
        cues=[]; scenes=[]; clock=3.0
        for i,scene in enumerate(script['scenes']):
            start=clock
            for sentence in sentences(scene[key]):
                seconds=max(1.0,len(sentence)/4.5 if locale!='en' else len(sentence.split())/2.7)
                cues.append({'start':clock,'end':clock+seconds,'text':sentence,'scene':i})
                clock+=seconds
            duration=math.ceil(max(scene['min_s'],clock-start+0.6)*FPS)/FPS
            scenes.append({'start':start,'duration':duration}); clock=start+duration
        timelines[locale]={'scenes':scenes,'cues':cues,'duration':clock+7,'end_start':clock,'diagnostic':True}
        with wave.open(str(out/f'{locale}.wav'),'wb') as target:
            target.setnchannels(1); target.setsampwidth(2); target.setframerate(48000)
            target.writeframes(b'\0'*round((clock+7)*48000)*2)
        write_srt(out/f'{locale}-estimated.srt',cues)
    (out/'diagnostic-timing.json').write_text(json.dumps(timelines,ensure_ascii=False,indent=2)+'\n')
    return timelines


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('script',type=Path)
    parser.add_argument('--out',type=Path,default=ROOT/'samples')
    parser.add_argument('--locale',choices=['zh-Hans','en'],default='zh-Hans')
    parser.add_argument('--market',default='')
    parser.add_argument('--diagnostic-frame-rate',type=int,choices=[1,2,5,10,30],default=FPS,help='Sparse motion sampling for silent diagnostics only; output remains 30fps')
    parser.add_argument('--preview-only',action='store_true')
    parser.add_argument('--diagnostic-silent',action='store_true',help='Explicitly incomplete visual review only; estimated timing, silent AAC')
    args=parser.parse_args()
    script=validate(json.loads(args.script.read_text()))
    out=args.out.resolve()
    # This lane only writes inside its assigned checkout.
    if REPO not in out.parents: raise ValueError('Output must remain inside this checkout')
    out.mkdir(parents=True,exist_ok=True)
    cache=out/'timing.json'
    if not args.diagnostic_silent and (out/'diagnostic-timing.json').exists():
        raise ValueError('Use a separate output directory for narrated renders; this directory contains a silent diagnostic')
    # Cache fingerprint prevents silently reusing narration from an edited script.
    import hashlib
    fingerprint=hashlib.sha256(json.dumps(script,sort_keys=True).encode()).hexdigest()
    fingerprint_path=out/'script.sha256'
    reusable=cache.exists() and fingerprint_path.exists() and fingerprint_path.read_text()==fingerprint and all((out/f'{loc}.wav').exists() and (out/f'{loc}.srt').exists() for loc in ('zh-Hans','en'))
    timings=diagnostic_plan(script,out) if args.diagnostic_silent else (json.loads(cache.read_text()) if reusable else plan(script,out))
    fingerprint_path.write_text(fingerprint)
    cta=resolve_cta(script['meta'],args.locale,args.market)
    preflight(script,timings[args.locale],args.locale,cta)
    (out/'layout-preflight.json').write_text(json.dumps({'status':'PASS','locale':args.locale,'scenes':len(script['scenes']),'sizes':[[1920,1080],[1080,1920]],'minimum_font_px':34,'coverage':'intro, end card, each scene at 2/50/98 percent, every sentence caption'},indent=2)+'\n')
    previews(script,timings[args.locale],out,args.locale,cta)
    if not args.preview_only:
        (out/'render-manifest.json').write_text(json.dumps({'status':'RENDERING','script_sha256':fingerprint})+'\n')
        render(script,timings[args.locale],out,args.locale,cta,args.diagnostic_frame_rate)
    (out/'render-manifest.json').write_text(json.dumps({'locale':args.locale,'market':args.market,'script_sha256':fingerprint,'cta':cta,'duration':timings[args.locale]['duration'],'fps':FPS,'status':'INCOMPLETE_SILENT_DIAGNOSTIC' if args.diagnostic_silent else 'NARRATED','motion_sample_fps':args.diagnostic_frame_rate if args.diagnostic_silent else FPS,'timing_basis':'estimated' if args.diagnostic_silent else 'measured_sentence_audio'},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'output':str(out),'duration':timings[args.locale]['duration'],'fps':FPS}))

if __name__=='__main__': main()
