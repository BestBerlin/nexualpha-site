// Fail-safe for scroll reveals. An IntersectionObserver alone misses blocks that are jumped over (anchor links, Home/End,
// fast flicks, find-in-page, keyboard focus): they never intersect, so they stay in their hidden "armed" state. whenReached()
// fires `cb` once the element's top is above `ratio` x viewport height, which includes elements already scrolled PAST.
// Checked on scroll, resize, hashchange, focus moves, tab return, pageshow and beforeprint, plus `maxWait` ms as a last resort.
export function whenReached(el, cb, { ratio = 1, maxWait = 0 } = {}) {
  if (!el || typeof window === "undefined") return () => {};
  let done = false;
  let raf = 0;
  let timer = 0;
  const opts = { passive: true, capture: true };
  const winEvents = ["scroll", "resize", "hashchange", "pageshow", "focusin"];
  const off = () => {
    winEvents.forEach((type) => window.removeEventListener(type, schedule, opts));
    window.removeEventListener("beforeprint", fire);
    document.removeEventListener("visibilitychange", schedule);
    if (raf) cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
  };
  function fire() {
    if (done) return;
    done = true;
    off();
    cb();
  }
  function test() {
    raf = 0;
    if (done) return;
    if (el.getBoundingClientRect().top < window.innerHeight * ratio) fire();
  }
  function schedule() {
    if (!raf && !done) raf = requestAnimationFrame(test);
  }
  winEvents.forEach((type) => window.addEventListener(type, schedule, opts));
  window.addEventListener("beforeprint", fire);
  document.addEventListener("visibilitychange", schedule);
  if (maxWait > 0) timer = setTimeout(fire, maxWait);
  schedule();
  return off;
}

export function prefersReducedMotionNow() {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
