"""Deterministic original vector artwork. Run from any working directory."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
COLORS = dict(blue='#4f7cff', shade='#3658c5', highlight='#86a5ff', mint='#3ddc97', coral='#ff7a59', amber='#f8bb6a', red='#ed5969', ink='#0b0d10', gold='#ffd875', cream='#fff6db', white='#ffffff')
C = COLORS

def path(d, fill='none', stroke=None, width=6):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke or C["ink"]}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>'

def ellipse(x,y,rx,ry,fill,stroke='none',width=6):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>'

def group(id,content,attrs=''):
    return f'<g id="{id}" {attrs}>{content}</g>'

def artwork(name, mood='neutral', pose='rest', view='front'):
    light = C[{'happy':'mint','celebrating':'mint','thinking':'amber','confused':'amber','warning':'red'}.get(mood,'blue')]
    body = path('M256 116 C327 108 369 172 375 255 C387 344 347 404 259 408 C165 414 125 361 135 267 C142 188 174 121 256 116 Z', C['blue'])
    body += path('M145 302 C170 375 315 409 366 318 C361 388 314 410 259 408 C190 413 147 381 145 302 Z',C['shade'],'none',0)
    body += path('M182 167 Q209 137 242 139',stroke=C['highlight'],width=12)
    # A little shoulder notch is the monster's sole organic asymmetry, not ears/horns.
    legs = group('leg-left',path('M192 394 Q180 423 197 436 Q219 444 232 426 L230 405',C['shade'])) + group('leg-right',path('M281 405 L282 427 Q302 447 321 433 Q333 418 316 395',C['shade']))
    left='M144 270 Q115 264 102 289 Q86 314 104 326 Q118 333 130 309 L143 299'
    right='M370 269 Q397 264 411 289 Q426 314 409 326 Q393 333 383 309 L371 299'
    if pose=='wave' or mood=='celebrating':
        left='M143 269 Q103 259 87 218 L75 206 Q66 198 67 188 Q68 182 77 185 L79 168 Q80 156 89 161 L96 179 Q112 165 120 181 Q130 193 114 204 Q124 231 152 238'
    if mood=='celebrating':
        right='M369 269 Q409 259 425 218 L437 206 Q446 198 445 188 Q444 182 435 185 L433 168 Q432 156 423 161 L416 179 Q400 165 392 181 Q382 193 398 204 Q388 231 360 238'
    if pose=='point':
        right='M371 270 Q408 254 429 259 L459 255 Q475 254 475 265 Q475 274 448 276 Q465 280 457 292 Q454 302 429 299 Q405 300 374 298'
    if pose=='thumbs-up':
        right='M370 278 L398 264 Q400 250 408 236 Q417 224 424 233 L420 261 Q449 257 452 270 L449 298 Q446 310 427 311 L403 302 L373 308'
    if pose=='thinking' or mood=='thinking':
        right='M370 281 Q342 295 316 272 L298 262 Q280 255 286 243 Q291 233 302 239 L318 248 Q343 269 359 252'
    if pose=='facepalm':
        right='M369 276 Q350 237 291 222 L275 223 Q260 230 248 218 L228 203 Q220 191 233 187 L260 201 L252 173 Q251 162 262 165 L278 199 L290 185 Q300 179 306 191 L305 215 Q352 221 378 248'
    arms = group('arm-left',path(left,C['blue'])) + group('arm-right',path(right,C['blue']))
    eyes=''
    for id,x,y,rx,ry in [('eye-left',211,220,32,43),('eye-right',296,213,37,46)]:
        eye=ellipse(x,y,rx,ry,C['white'],C['ink'],5)
        if mood=='happy' or mood=='celebrating':
            eye+=path(f'M{x-14} {y+5} Q{x} {y-13} {x+15} {y+3}',width=7)
        else:
            dx = 9 if mood=='thinking' else (-8 if mood=='confused' else 2)
            eye+=ellipse(x+dx,y+3,13,20,C['ink'])+ellipse(x+dx-4,y-4,4,6,C['white'])
        eyes+=group(id,eye)
    if mood=='warning':
        eyes+=path('M181 169 L226 178 M277 171 L319 159',width=7)
    if mood in ['thinking','confused']:
        eyes+=path('M185 165 Q204 157 222 162 M278 158 L312 150',width=6)
    mouths={
        'neutral':path('M237 277 Q253 289 272 274',width=6),
        'happy':path('M231 271 Q254 305 282 268 Q258 276 231 271 Z',C['ink'])+path('M244 288 Q256 281 269 286',stroke=C['coral'],width=7),
        'celebrating':path('M230 271 Q255 313 282 268 Z',C['ink'])+path('M244 292 Q257 285 267 290',stroke=C['coral'],width=8),
        'thinking':path('M243 279 L269 279',width=6),
        'confused':path('M237 280 Q249 267 257 280 Q265 290 276 277',width=6),
        'surprised':ellipse(257,281,13,18,C['ink']),
        'warning':path('M235 283 Q254 264 277 280',width=6),
    }
    cheeks=ellipse(175,270,13,7,C['coral'])+ellipse(334,264,13,7,C['coral'])
    coin=ellipse(257,344,42,39,C['amber'],C['ink'],6)+ellipse(257,344,33,31,C['gold'],'#b57830',3)
    coin+=path('M258 323 L269 343 L258 363 L246 345 Z',C['cream'],'#b57830',3)+path('M232 326 Q240 315 251 315',stroke=C['cream'],width=4)
    coin+=path('M211 327 L199 323 M299 328 L310 321',stroke=C['gold'],width=4)
    antenna=path('M255 118 Q253 96 271 90 Q290 86 285 67',stroke=C['ink'],width=14)+path('M255 118 Q253 96 271 90 Q290 86 285 67',stroke=C['highlight'],width=7)
    lamp=ellipse(284,53,24,24,light,'none')+ellipse(284,53,17,17,light,C['ink'],5)+ellipse(280,48,5,5,C['white'])
    props=''
    if pose=='phone':
        props='<rect x="332" y="247" width="70" height="111" rx="14" fill="#0b0d10" stroke="#ffffff" stroke-width="4"/>'
        props+='<rect x="342" y="259" width="50" height="77" rx="6" fill="#e8eeff"/>'+path('M352 301 L361 310 L382 283',stroke=C['mint'],width=7)
        props+=ellipse(367,347,4,4,C['white'])+path('M373 315 Q400 301 405 313 Q409 329 379 337',C['blue'])
    if pose=='shield':
        props=path('M344 246 L413 265 L409 324 Q396 354 374 365 Q346 351 335 322 L330 266 Z',C['mint'])+path('M350 301 L368 317 L394 286',width=8)
        props+=path('M327 318 Q339 298 352 309 Q364 325 341 337',C['blue'])
    if view=='three-quarter':
        body=group('turned-volume',body,'transform="translate(22 0) scale(.92 1)"')
        eyes=group('eye-left',ellipse(258,220,31,43,C['white'],C['ink'],5)+ellipse(265,223,13,20,C['ink'])+ellipse(261,216,4,6,C['white']))+group('eye-right',ellipse(326,213,22,43,C['white'],C['ink'],5)+ellipse(332,216,10,19,C['ink'])+ellipse(329,209,3,5,C['white']))
        mouths['neutral']=group('turned-mouth',mouths['neutral'],'transform="translate(35 0)"')
        cheeks=''
        coin=group('turned-coin',coin,'transform="translate(96 0) scale(.72 1)"')
    if view=='side':
        body=path('M257 116 C311 114 345 174 357 235 Q367 263 350 281 C354 346 320 406 256 408 C179 407 161 341 173 258 C178 186 206 119 257 116 Z',C['blue'])+path('M195 173 Q209 145 235 140',stroke=C['highlight'],width=12)
        eyes=group('eye-right',ellipse(323,217,21,43,C['white'],C['ink'],5)+ellipse(334,220,9,20,C['ink'])+ellipse(331,210,3,5,C['white']))
        cheeks=''
        mouths['neutral']=path('M336 277 Q347 286 351 273',width=5)
        coin=ellipse(338,344,11,37,C['gold'],C['ink'],5)+path('M342 322 L342 360',stroke='#b57830',width=3)
        arms=group('arm-left','')+group('arm-right',path('M248 283 Q265 282 275 308 Q280 328 261 333 Q245 334 239 312',C['blue']))
        legs=group('leg-left',path('M218 395 L213 421 Q215 439 239 436 L261 428 L254 408',C['shade']))+group('leg-right',path('M277 399 L275 421 Q287 440 307 432 L322 420 L310 399',C['shade']))
    if view=='back':
        eyes=''; cheeks=''; mouths['neutral']=''; coin=''
        body+=path('M256 176 Q230 252 256 287 Q276 312 257 367',stroke=C['highlight'],width=5)
        body+=ellipse(253,241,7,7,C['mint'])+ellipse(263,305,5,5,C['highlight'])
    extras=''
    if mood=='celebrating':
        for x,y,col in [(92,96,'mint'),(401,93,'amber'),(121,148,'coral'),(375,145,'mint'),(192,66,'amber'),(340,54,'coral')]:
            extras+=path(f'M{x} {y} l8 -12',stroke=C[col],width=8)
    if mood=='confused':
        extras+=path('M403 166 Q400 146 418 146 Q440 150 424 166 L417 175',stroke=C['amber'],width=7)+ellipse(415,190,4,4,C['amber'])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
<title id="title">NexuAlpha academy monster — {name}</title><desc id="desc">Round blue original monster, one {light} antenna light, gold belly coin; {view} view, {mood} expression, {pose} pose.</desc>
{group('shadow',ellipse(257,452,112,13,C['ink']), 'opacity=".14"')}
{group('character',group('legs',legs)+group('body',body)+group('antenna',antenna)+group('antenna-light',lamp)+group('eyes',eyes)+group('cheeks',cheeks)+group('mouth',mouths[mood])+group('coin',coin)+group('arms',arms)+group('props',props)+group('effects',extras))}
</svg>'''

MODELS=['front','three-quarter','side','back']
EXPRESSIONS=['happy','thinking','surprised','warning','celebrating','confused']
POSES={'wave-hello':('happy','wave'),'point-right':('neutral','point'),'hold-phone':('neutral','phone'),'hold-shield':('neutral','shield'),'thumbs-up':('happy','thumbs-up'),'facepalm':('confused','facepalm')}
entries=[]
for v in MODELS:
    entries.append(dict(file=f'model-{v}',category='Model sheet',label=v.replace('-',' ').title(),mood='neutral',pose='rest',view=v))
for m in EXPRESSIONS:
    entries.append(dict(file=f'expression-{m}',category='Expressions',label=m.title(),mood=m,pose='rest',view='front'))
for p,(m,pose) in POSES.items():
    entries.append(dict(file=f'pose-{p}',category='Poses',label=p.replace('-',' ').title(),mood=m,pose=pose,view='front'))
for e in entries:
    (ROOT/'svg'/f'{e["file"]}.svg').write_text(artwork(e['label'],e['mood'],e['pose'],e['view']))
# Editable model sheet, with namespaced IDs for safe inline animation.
import re
panels=[]
for i,v in enumerate(MODELS):
    svg=(ROOT/'svg'/f'model-{v}.svg').read_text()
    inside=svg[svg.index('\n')+1:svg.rindex('</svg>')]
    inside=re.sub(r'id="([^"]+)"',lambda m:f'id="{v}-{m[1]}"',inside)
    panels.append(f'<g transform="translate({i*400} 20) scale(.78)">{inside}</g><text x="{i*400+200}" y="440" text-anchor="middle" fill="#0b0d10" font-family="sans-serif" font-size="22">{v.replace("-"," ").title()}</text>')
(ROOT/'svg/model-sheet.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 480" role="img" aria-label="Four-view academy monster model sheet">'+''.join(panels)+'</svg>')
(ROOT/'manifest.json').write_text(json.dumps(dict(palette=COLORS,assets=entries,stickers=['expression-happy','expression-thinking','expression-surprised','expression-warning','expression-celebrating','expression-confused','pose-wave-hello','pose-thumbs-up']),indent=2)+'\n')

def cards(category):
    return ''.join(f'<figure><img src="svg/{e["file"]}.svg" alt="{e["label"]} monster" width="512" height="512"><figcaption>{e["label"]}</figcaption></figure>' for e in entries if e['category']==category)
(ROOT/'board.html').write_text('''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NexuAlpha — Academy companion / Direction A</title><link rel="stylesheet" href="style.css"></head><body>
<main id="board"><header><span class="wordmark">NEXUALPHA <span>/ ACADEMY</span></span><span>DIRECTION A · CHARACTER STUDY 01</span></header>
<section class="hero"><div><p class="eyebrow">A little signal. A lot of character.</p><h1>Meet your<br>curious companion.</h1><p>A round little monster who learns with you.<br>One mood light. One golden heart. Always a little curious.</p><a href="idle.html">Watch the 2-second idle loop ↗</a></div><div class="hero-art"><img src="svg/pose-wave-hello.svg" width="512" height="512" alt="Friendly blue monster waving hello"><span class="annotation">ONE ANTENNA / FOUR SIGNALS</span></div></section>
<section class="signals"><span><i class="green"></i>Happy / OK</span><span><i class="amber"></i>Thinking / Careful</span><span><i class="red"></i>Warning / Risk</span><span><i class="blue"></i>Neutral / Explaining</span></section>
<section><div class="section-head"><h2>01 / Built to turn.</h2><p>Soft pebble silhouette · asymmetric eyes · tiny mitten limbs</p></div><div class="grid models">'''+cards('Model sheet')+'''</div></section>
<section class="light"><div class="section-head"><h2>02 / A face for every moment.</h2><p>Light-background proof · six distinct expressions</p></div><div class="grid six">'''+cards('Expressions')+'''</div></section>
<section><div class="section-head"><h2>03 / Ready to help.</h2><p>Six teaching gestures · editable props</p></div><div class="grid six">'''+cards('Poses')+'''</div></section>
<section class="names"><div><h2>Three names to explore.</h2><p>Short, vowel-led proposals. Naming and native-language review remain open.</p></div><div><strong>Nexubo</strong><span>nek-SOO-bo · Nexu + a soft rounded ending</span></div><div><strong>Bopinu</strong><span>bo-PEE-noo · a buoyant little bounce</span></div><div><strong>Pibolu</strong><span>pee-BO-loo · playful, gentle rhythm</span></div></section>
<footer><span>Original vector construction · 512-unit rig · mood is also expressed by face and gesture</span><span>DESIGN FOR LEARNING / NOT PRICE PROMISES</span></footer></main></body></html>''')
svg=(ROOT/'svg/model-front.svg').read_text()
(ROOT/'idle.html').write_text('''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NexuAlpha — Idle rig</title><link rel="stylesheet" href="style.css"></head><body class="demo"><main><p class="eyebrow">NEXUALPHA / MOTION STUDY</p><h1>A small breath of life.</h1><div id="rig">'''+svg+'''</div><button id="toggle" type="button" aria-pressed="false">Pause animation</button><p id="status" aria-live="polite">2.00 s · bounce / blink / signal pulse</p><a href="board.html">Back to character board</a></main><script src="vendor/gsap.min.js"></script><script src="idle.js"></script></body></html>''')
print('Built 16 standalone SVGs, 1 layered model sheet, manifest, board and idle demo.')
