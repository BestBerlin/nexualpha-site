/* GSAP timeline is deliberately exactly 2 seconds, with a seam-safe reset. */
const rig = document.querySelector('#rig');
const button = document.querySelector('#toggle');
const status = document.querySelector('#status');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = false;
gsap.set(rig.querySelector('#character'), { svgOrigin: '256 408' });
gsap.set(rig.querySelector('#eyes'), { svgOrigin: '256 220' });
gsap.set(rig.querySelector('#antenna-light'), { svgOrigin: '284 53' });
const idle = gsap.timeline({ repeat: -1, paused: true });
idle.to(rig.querySelector('#character'), { y: -9, scaleY: 1.025, duration: 1, ease: 'sine.inOut' }, 0)
    .to(rig.querySelector('#character'), { y: 0, scaleY: 1, duration: 1, ease: 'sine.inOut' }, 1)
    .to(rig.querySelector('#eyes'), { scaleY: .08, duration: .08 }, 1.28)
    .to(rig.querySelector('#eyes'), { scaleY: 1, duration: .12 }, 1.36)
    .to(rig.querySelector('#antenna-light'), { scale: 1.15, opacity: .72, duration: 1, ease: 'sine.inOut' }, 0)
    .to(rig.querySelector('#antenna-light'), { scale: 1, opacity: 1, duration: 1, ease: 'sine.inOut' }, 1);
function syncPlayback() {
  const paused = userPaused || preference.matches;
  if (paused) idle.pause(); else idle.play();
  if (preference.matches) idle.seek(0);
  button.disabled = preference.matches;
  button.setAttribute('aria-pressed', String(paused));
  button.textContent = paused ? 'Resume animation' : 'Pause animation';
  status.textContent = preference.matches ? 'Motion paused: reduced-motion preference' : '2.00 s · bounce / blink / signal pulse';
}
button.addEventListener('click', () => { userPaused = !userPaused; syncPlayback(); });
preference.addEventListener('change', syncPlayback);
syncPlayback();
// Read-only inspection hook for deterministic rig verification / future capture.
window.mascotIdle = idle;
