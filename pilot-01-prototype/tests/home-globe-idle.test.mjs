import assert from 'node:assert/strict';
import test from 'node:test';
const { mountGlobe } = await import(process.env.GLOBE_TEST_MODULE || '../src/components/v7/home7-globe.js');

// Drive actual mount/draw/lifecycle code with a deterministic browser clock. No
// wall-clock sleeps or browser CPU measurements: callbacks and canvas paints are
// the work this module is allowed to schedule while the page is idle.
function browser(t, { still = false } = {}) {
  const saved = new Map();
  let now = 0, serial = 0, paints = 0, reads = 0, frameCalls = 0, globe;
  const frames = new Map(), observers = [], resizeObservers = [];
  const target = () => {
    const handlers = new Map();
    return {
      addEventListener(type, fn) { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); },
      removeEventListener(type, fn) { handlers.get(type)?.delete(fn); },
      emit(type, event = {}) { for (const fn of handlers.get(type) || []) fn(event); },
      get listenerCount() { return [...handlers.values()].reduce((n, fns) => n + fns.size, 0); },
    };
  };
  const context = new Proxy({}, {
    get(obj, key) {
      if (key === 'clearRect') return () => { paints += 1; };
      if (key === 'createRadialGradient') return () => ({ addColorStop() {} });
      return obj[key] || (() => {});
    },
    set(obj, key, value) { obj[key] = value; return true; },
  });
  const canvases = [];
  const doc = Object.assign(target(), {
    hidden: false,
    createElement() {
      const canvas = { getContext: () => context, style: {}, setAttribute() {}, remove() { this.removed = true; } };
      canvases.push(canvas);
      return canvas;
    },
  });
  const media = Object.assign(target(), { matches: still });
  const stage = Object.assign(target(), {
    dataset: {}, querySelector: () => null, querySelectorAll: () => [],
    setAttribute(name) { this.dataset[name.replace('data-', '')] = ''; },
    removeAttribute(name) { delete this.dataset[name.replace('data-', '')]; },
  });
  const host = {
    append() {},
    getBoundingClientRect() { reads += 1; return { width: 400, height: 400, left: 0, top: 0 }; },
  };
  class Observer {
    constructor(fn) { this.fn = fn; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  class Resize extends Observer {
    constructor(fn) { super(fn); resizeObservers.push(this); }
  }
  const replacements = {
    document: doc, window: { devicePixelRatio: 1, matchMedia: () => media },
    performance: { now: () => now },
    requestAnimationFrame(fn) { const id = ++serial; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    IntersectionObserver: Observer, ResizeObserver: Resize,
  };
  for (const [name, value] of Object.entries(replacements)) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  t.after(() => {
    globe?.destroy();
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
    }
  });
  globe = mountGlobe(host, stage, still);
  return {
    globe, doc, stage, media, canvases, observers, resizeObservers,
    get paints() { return paints; }, get reads() { return reads; }, get pending() { return frames.size; }, get frameCalls() { return frameCalls; },
    advance(ms) {
      const end = now + ms;
      while (now < end) {
        now = Math.min(end, now + 16);
        const batch = [...frames];
        frames.clear();
        for (const [, fn] of batch) { frameCalls += 1; fn(now); }
      }
    },
    intersect(visible) { observers[0].fn([{ isIntersecting: visible }]); },
  };
}

test('globe stops after 8 s idle with zero callbacks or layout reads in the following 5 s', (t) => {
  const b = browser(t);
  b.advance(8100);
  const { paints, reads, frameCalls } = b;
  b.advance(5000);
  t.diagnostic(`Following 5 s idle: ${b.frameCalls - frameCalls} rAF callbacks, ${b.paints - paints} canvas clears, ${b.reads - reads} layout reads`);
  assert.equal(b.frameCalls, frameCalls);
  assert.equal(b.stage.dataset.paused, 'true');
  assert.equal(b.pending, 0);
  assert.equal(b.paints, paints);
  assert.equal(b.reads, reads);
  b.stage.emit('pointermove');
  assert.equal(b.pending, 1, 'moving over the globe starts one loop');
  b.stage.emit('pointermove');
  assert.equal(b.pending, 1, 'repeat interactions do not multiply loops');
  b.advance(100);
  assert.ok(b.paints > paints);
  assert.equal(b.reads, reads, 'animation and pointer movement never measure layout');
  b.advance(8100);
  b.globe.select('okx');
  assert.equal(b.pending, 1, 'calculator selection also restarts the globe');
});

test('hidden and offscreen globes cancel animation and do not revive after inactivity', (t) => {
  const b = browser(t);
  b.advance(100);
  b.intersect(false);
  assert.equal(b.pending, 0);
  b.intersect(true);
  assert.equal(b.pending, 1, 'still-active intro resumes when visible');
  b.doc.hidden = true;
  b.doc.emit('visibilitychange');
  assert.equal(b.pending, 0);
  const { paints } = b;
  b.advance(9000);
  b.resizeObservers[0].fn();
  assert.equal(b.paints, paints, 'hidden resize does not paint');
  b.doc.hidden = false;
  b.doc.emit('visibilitychange');
  assert.equal(b.pending, 0, 'expired intro stays still on tab return');
  assert.ok(b.paints > paints, 'tab return restores the resized static bitmap');
  b.stage.emit('focusin');
  assert.equal(b.pending, 1, 'keyboard interaction restarts animation');
});

test('reduced motion paints still frames and reacts to preference changes', (t) => {
  const b = browser(t, { still: true });
  b.advance(100);
  assert.equal(b.pending, 0);
  const { paints } = b;
  b.stage.emit('pointermove');
  b.globe.select('okx');
  assert.equal(b.pending, 0);
  assert.ok(b.paints > paints, 'a selected partner still gets a static update');
  b.media.matches = false;
  b.media.emit('change', { matches: false });
  b.stage.emit('pointerdown');
  assert.equal(b.pending, 1);
  b.media.matches = true;
  b.media.emit('change', { matches: true });
  assert.equal(b.pending, 0, 'enabling reduced motion cancels the live loop immediately');
});

test('destroy cancels every callback and disconnects observers/listeners', (t) => {
  const b = browser(t);
  assert.ok(b.pending > 0);
  b.globe.destroy();
  assert.equal(b.pending, 0, 'includes first-frame opacity callback');
  assert.equal(b.stage.listenerCount + b.doc.listenerCount + b.media.listenerCount, 0);
  assert.ok(b.observers.every((observer) => observer.disconnected));
  assert.ok(b.canvases[0].removed);
  const { paints, reads } = b;
  b.stage.emit('pointermove');
  b.globe.select('okx');
  b.observers[0].fn([{ isIntersecting: true }]);
  b.resizeObservers[0].fn();
  b.advance(5000);
  assert.equal(b.pending, 0);
  assert.equal(b.paints, paints);
  assert.equal(b.reads, reads);
});
