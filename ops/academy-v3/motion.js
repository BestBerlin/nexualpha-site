/* HyperFrames owns playback. All motion belongs to a single paused GSAP timeline. */
const timeline = gsap.timeline({paused:true});
const colors = {blue:'#4f7cff',green:'#3ddc97',amber:'#f8bb6a',red:'#ff5c5c'};
SCENES.forEach((s,i)=>{
  const p = `#${s.id}`, at = s.start;
  timeline.set(p,{visibility:'visible'},at);
  timeline.set(p,{visibility:'hidden'},at+s.duration);
  // Persistent corner logo remains legible on both paper and branded ink scenes.
  timeline.set('.brand, .demo-label',{color:s.kind==='open'||s.kind==='close'?'#ffffff':'#0b0d10'},at);
  timeline.from(p + ' .teaching',{y:24,opacity:0,duration:.35,ease:'power2.out',immediateRender:false},at+.05);
  timeline.from(p + ' .cast',{scale:.94,y:20,duration:.4,ease:'back.out(1.3)',immediateRender:false},at+.08);
  document.querySelectorAll(p + ' .row, ' + p + ' .field').forEach((row,j)=>{
    timeline.from(row,{x:18,opacity:0,duration:.3,immediateRender:false},at+.4+j*.25);
    timeline.to(row,{borderColor:colors.blue,duration:.3,repeat:1,yoyo:true},at+Math.min(s.duration-1,2+j*2.5));
  });
  // Hosts gesture at the teaching layer, then react; beats continue in long shots.
  const arm = document.querySelector(p + ' .character .rig-arm-right');
  for(let beat=at+.8;beat<at+s.duration-.8;beat+=3){
    if(arm) timeline.to(arm,{rotation:-14,transformOrigin:'20% 80%',duration:.3,repeat:1,yoyo:true,ease:'power2.inOut'},beat);
    timeline.to(p+' .cast',{y:-10,scaleY:1.02,duration:.25,repeat:1,yoyo:true},beat+.4);
  }
  document.querySelectorAll(p+' .widget-checklist .row').forEach((row,j)=>{
    const chip=row.querySelector('.chip');
    if(chip) timeline.from(chip,{scale:0,opacity:0,duration:.3,immediateRender:false},at+1+j*2.5);
  });
  document.querySelectorAll(p+' .sample-id').forEach((card,j)=>{
    timeline.set(card.querySelector('.correction'),{visibility:'hidden'},at);
    timeline.from(card.querySelector('.rejection'),{scale:1.4,opacity:0,duration:.3,immediateRender:false},at+.6+j*2.5);
    timeline.set(card.querySelector('.rejection'),{visibility:'hidden'},at+3+j*2.5);
    timeline.set(card.querySelector('.correction'),{visibility:'visible'},at+3+j*2.5);
    timeline.from(card.querySelector('.correction'),{scale:1.4,duration:.3,immediateRender:false},at+3+j*2.5);
  });
  const connector=document.querySelector(p+' .match-connector');
  if(connector) timeline.from(connector,{scaleX:0,opacity:0,duration:.4,immediateRender:false},at+2);
  const pipe=document.querySelector(p+' .pipe i');
  const toggle=document.querySelector(p+' .auto-toggle[data-auto-add="true"]');
  if(pipe && toggle){
    const risk=document.querySelector(p+' [data-risk-initial]');
    if(risk){timeline.set(risk,{textContent:risk.dataset.riskInitial},at);timeline.set(risk,{textContent:risk.dataset.riskInitial+' + …'},at+2);}
    timeline.from(toggle,{backgroundColor:'#516074',duration:.3,immediateRender:false},at+1);
    for(let beat=at+1.3;beat<at+s.duration-1;beat+=2.5)
      timeline.fromTo(pipe,{x:0,opacity:0},{x:80,opacity:1,duration:1.2,immediateRender:false},beat);
  }else if(pipe) timeline.set(pipe,{visibility:'hidden'},at);
  const lamp = document.querySelector(p + ' .nexubo .rig-antenna-light');
  const lampPaint = lamp ? [...lamp.children].filter(el=>el.getAttribute('fill')!=='#ffffff') : [];
  if(lampPaint.length) timeline.set(lampPaint,{fill:colors[s.antenna]},at);
  // Repeated blink and small antenna pulse add deterministic life at 2.5s beats.
  for(let beat=at+1.6;beat<at+s.duration-.5;beat+=2.5){
    const eyes = document.querySelectorAll(p + ' .rig-eyes');
    if(eyes.length) timeline.to(eyes,{scaleY:.1,duration:.09,repeat:1,yoyo:true},beat);
    if(lamp) timeline.to(lamp,{opacity:.5,duration:.2,repeat:1,yoyo:true},beat+.2);
  }
  for(const line of s.lines){
    const character = document.querySelector(p + ' [data-speaker="' + line.speaker + '"]');
    if(!character) continue;
    const span=line.end-line.start, cycles=Math.max(1,Math.floor(span/.4));
    timeline.to(character,{y:-5,duration:span/(cycles*2),repeat:cycles*2-1,yoyo:true,ease:'sine.inOut'},at+line.start);
    const mouth = character.querySelector('.rig-mouth');
    if(mouth) timeline.to(mouth,{scaleY:1.55,duration:span/(cycles*2),repeat:cycles*2-1,yoyo:true,ease:'sine.inOut'},at+line.start);
  }
  if(s.pose==='wave'){
    const arm=document.querySelector(p + ' .nexubo .rig-arm-right');
    if(arm) timeline.to(arm,{rotation:16,transformOrigin:'20% 80%',duration:.3,repeat:7,yoyo:true},at+.5);
  }
  if(s.ding){
    if(lampPaint.length) timeline.set(lampPaint,{fill:colors.red},at+.6);
    timeline.set(p + ' .ding-chip',{visibility:'visible'},at+.6);
    timeline.to(p + ' .nexubo',{x:7,duration:.06,repeat:5,yoyo:true},at+.6);
    timeline.set(p + ' .ding-chip',{visibility:'hidden'},at+Math.min(3,s.duration-.1));
  }
  const groups=document.querySelectorAll(p + ' .caption-group');
  s.captions.forEach((words,j)=>{
    const group=groups[j];
    timeline.set(group,{visibility:'visible'},at+words[0].start);
    words.forEach((w,k)=>{
      timeline.set(group.children[k],{backgroundColor:colors.blue},at+w.start);
      timeline.set(group.children[k],{backgroundColor:'transparent'},at+w.end);
    });
    timeline.set(group,{visibility:'hidden'},at+words.at(-1).end);
  });
});
timeline.from('.progress',{scaleX:0,duration:TOTAL,ease:'none',immediateRender:false},0);
window.__timelines={academy:timeline};
window.academySeek = time => timeline.seek(Math.max(0,Math.min(TOTAL-1/30,time)));
const review = new URLSearchParams(location.search).get('at');
if(review!==null&&Number.isFinite(Number(review))) window.academySeek(Number(review));
// SFX integration points, intentionally silent until original licensed audio exists.
window.academySfx = SCENES.flatMap(s=>s.kind==='open'?[{name:'open-sting',time:s.start}]:s.ding?[{name:'ding',time:s.start+.6}]:[]);
