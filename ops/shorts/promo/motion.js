/* HyperFrames owns playback: all motion lives on one paused, seekable GSAP timeline. */
// Shrink-to-fit long locales before capture: each .fit keeps <= data-max lines and never overflows.
function fitAll(){
  document.querySelectorAll('.fit').forEach(el=>{
    el.style.fontSize='';
    const max=Number(el.dataset.max||2);
    let size=parseFloat(getComputedStyle(el).fontSize);
    for(let i=0;i<40;i++){
      const lh=parseFloat(getComputedStyle(el).lineHeight)||size*1.12;
      const lines=Math.round(el.scrollHeight/lh);
      if(lines<=max && el.scrollWidth<=el.clientWidth+1) break;
      size*=.95; el.style.fontSize=size.toFixed(1)+'px';
    }
  });
}
fitAll();
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fitAll);

const timeline=gsap.timeline({paused:true});
SCENES.forEach((s,i)=>{
  const p='#scene-'+i, at=s.start, end=s.start+s.duration, last=i===SCENES.length-1;
  timeline.set(p,{visibility:'visible'},at);
  if(!last) timeline.set(p,{visibility:'hidden'},end);
  const items=document.querySelectorAll(p+' .copy > *');
  timeline.from(items,{y:46,opacity:0,duration:.42,stagger:.12,ease:'power3.out',immediateRender:false},at+.04);
  timeline.from(p+' .host',{scale:.82,y:60,opacity:0,duration:.5,ease:'back.out(1.6)',immediateRender:false},at+.08);
  if(!last) timeline.to(p+' .copy',{opacity:0,y:-24,duration:.2,ease:'power1.in'},end-.2);
  // Scene-specific beats.
  if(s.id==='hook'){
    timeline.from(p+' .hook-q',{scale:0,rotation:-25,duration:.5,ease:'back.out(2.4)',immediateRender:false},at+.45);
    timeline.to(p+' .host',{x:9,duration:.05,repeat:7,yoyo:true},at+.6);
  }
  if(s.id==='product'){
    timeline.from(p+' .count',{scale:.6,duration:.55,ease:'back.out(1.8)',immediateRender:false},at+.2);
    timeline.from(p+' .chip',{scale:0,opacity:0,duration:.35,stagger:.18,ease:'back.out(2)',immediateRender:false},at+1.4);
  }
  if(s.id==='facts'){
    const beats=[.3,1.6,3.4];
    document.querySelectorAll(p+' .fact').forEach((f,j)=>{
      timeline.from(f,{x:-60,opacity:0,duration:.4,ease:'power3.out',immediateRender:false},at+beats[j]);
      timeline.from(f.querySelector('.tick'),{scale:0,duration:.35,ease:'back.out(2.2)',immediateRender:false},at+beats[j]+.2);
    });
  }
  if(s.id==='shares'){
    timeline.from(p+' .share-row .bar',{scaleX:0,duration:1,ease:'power2.out',immediateRender:false},at+.6);
  }
  if(s.id==='cta'){
    timeline.from(p+' .code',{scale:.5,duration:.5,ease:'back.out(2)',immediateRender:false},at+.3);
    timeline.to(p+' .code',{scale:1.06,duration:.35,repeat:3,yoyo:true,ease:'sine.inOut'},at+2.2);
    timeline.from(p+' .qr-card',{scale:.6,opacity:0,duration:.45,ease:'back.out(1.8)',immediateRender:false},at+.6);
  }
  // Host life: idle bob, blinks, antenna pulse, wave, talking mouth while narration plays.
  for(let beat=at+.9;beat<end-.6;beat+=1.6) timeline.to(p+' .host',{y:-12,duration:.4,repeat:1,yoyo:true,ease:'sine.inOut'},beat);
  const eyes=document.querySelectorAll(p+' .rig-eyes');
  for(let beat=at+1.3;beat<end-.4;beat+=2.4) if(eyes.length) timeline.to(eyes,{scaleY:.1,transformOrigin:'50% 50%',duration:.08,repeat:1,yoyo:true},beat);
  const lamp=document.querySelector(p+' .rig-antenna-light');
  if(lamp) for(let beat=at+.5;beat<end-.4;beat+=1.2) timeline.to(lamp,{opacity:.45,duration:.18,repeat:1,yoyo:true},beat);
  if(s.pose==='wave'){
    const hand=document.querySelector(p+' .rig-arm-left');
    if(hand) timeline.to(hand,{rotation:-16,transformOrigin:'85% 90%',duration:.3,repeat:Math.floor((s.duration-1)/.3/2)*2-1,yoyo:true,ease:'sine.inOut'},at+.5);
  }else{
    const arm=document.querySelector(p+' .rig-arm-right');
    if(arm) timeline.to(arm,{rotation:-12,transformOrigin:'20% 80%',duration:.3,repeat:1,yoyo:true,ease:'power2.inOut'},at+.9);
  }
  const mouth=document.querySelector(p+' .rig-mouth');
  if(mouth&&s.speech&&s.speechDuration){
    const cycles=Math.max(1,Math.floor(s.speechDuration/.36));
    timeline.to(mouth,{scaleY:1.5,transformOrigin:'50% 30%',duration:s.speechDuration/(cycles*2),repeat:cycles*2-1,yoyo:true,ease:'sine.inOut'},at+LEAD_IN);
  }
});
timeline.fromTo('.progress',{scaleX:0},{scaleX:1,duration:TOTAL,ease:'none',immediateRender:false},0);
window.__timelines={promo:timeline};
window.promoSeek=t=>timeline.seek(Math.max(0,Math.min(TOTAL-1/30,t)));
const review=new URLSearchParams(location.search).get('at');
if(review!==null&&Number.isFinite(Number(review))) window.promoSeek(Number(review));
