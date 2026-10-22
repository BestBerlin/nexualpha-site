import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";

const requireCompiler = createRequire(new URL("../package.json", import.meta.url));
const { transformSync } = requireCompiler("esbuild");
const heroSourceUrl=new URL('../src/components/v3/LeanHero.jsx',import.meta.url);
const realJsModules=Object.fromEntries(await Promise.all([...readFileSync(heroSourceUrl,'utf8').matchAll(/from ["']([^"']+\.js)["']/g)].filter(([,name])=>!['v3-product.js','home-copy.js'].some(file=>name.endsWith(file))).map(async ([,name])=>[name,await import(new URL(name,heroSourceUrl))])));


function events() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatch(type) {
      for (const fn of [...(listeners.get(type) || [])]) fn({ type });
    },
    count() {
      return [...listeners.values()].reduce((total, list) => total + list.size, 0);
    },
  };
}

function clock() {
  let now = 0;
  let id = 0;
  const tasks = new Map();
  const add = (fn, delay, interval) => {
    tasks.set(++id, { fn, due: now + delay, interval });
    return id;
  };
  return {
    setInterval: (fn, delay) => add(fn, delay, delay),
    setTimeout: (fn, delay) => add(fn, delay, 0),
    clearInterval: (value) => tasks.delete(value),
    clearTimeout: (value) => tasks.delete(value),
    count: () => tasks.size,
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const next = [...tasks].sort((a, b) => a[1].due - b[1].due)[0];
        if (!next || next[1].due > end) break;
        const [key, task] = next;
        now = task.due;
        if (task.interval) task.due += task.interval;
        else tasks.delete(key);
        task.fn();
      }
      now = end;
    },
  };
}

function harness({ reduced = false, hidden = false, width = 1024 } = {}) {
  const media = { ...events(), matches: reduced };
  const narrow = { ...events(), matches: width <= 640 };
  const document = { ...events(), hidden };
  const window = { ...events(), location: { search: "" }, matchMedia: query => { if (query === "(prefers-reduced-motion: reduce)") return media; if (query === "(max-width: 640px)") return narrow; throw Error(query); } };
  const timers = clock();
  const slots = [];
  const pending = [];
  let cursor = 0;
  const React = {
    Fragment: "fragment",
    createElement(type, props, ...children) {
      return { type, props: props || {}, children: children.flat(Infinity) };
    },
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, (value) => {
        slots[index].value = typeof value === "function" ? value(slots[index].value) : value;
      }];
    },
    useCallback(fn, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) slots[index] = { deps, value: fn };
      return slots[index].value;
    },
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useEffect(fn, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        pending.push(() => {
          previous?.cleanup?.();
          slots[index] = { deps, fn, cleanup: fn() };
        });
      }
    },
  };
  const stubs = {
    BrandMark: () => React.createElement("span", { className: "brand-stub" }),
    TraderWizardModal: () => null,
    getTelegramDeepLink: () => "https://t.me/NexuAlphaAssistantBot",
    venueDatabase: {
      binance: { name: "Binance", category: "CEX", officialDomain: "www.binance.com" },
      okx: { name: "OKX", category: "CEX", officialDomain: "www.okx.com" },
      bybit: { name: "Bybit", category: "CEX", officialDomain: "www.bybit.com" },
      bitget: { name: "Bitget", category: "CEX", officialDomain: "www.bitget.com" },
    },
    publicCtaForVenue: (slug) => ({
      hasPartnerRoute: true,
      name: slug,
      officialDomain: `${slug}.example`,
      registrationUrl: `https://${slug}.example/signup`,
      claim: { status: "pending" },
      benefitVerified: false,
      hasReferral: false,
      inviteCode: "",
      benefit: "User benefits require official verification",
    }),
    contextualHref: (href) => href,
    localizedHref: (href) => href,
    v3Copy: () => ({ pendingReview: "Pending review", verifyBefore: "Verify first" }),
    homeHeroH1: () => "Independent platform comparison",
    RegistrationCard: (props) => React.createElement("a", { href: `/${props.venueSlug}`, "data-cta-placement": "home-decision-panel" }, "Register"),
  };
  const source = readFileSync(new URL("../src/components/v3/LeanHero.jsx", import.meta.url), "utf8");
  const compiled = transformSync(source, { loader: "jsx", format: "cjs", jsx: "transform" }).code;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require(name) {
      if (name === "react") return React;
      if (name.endsWith("BrandMark.jsx")) return { BrandMark: stubs.BrandMark };
      if (name.endsWith("TraderWizardModal.jsx")) return { TraderWizardModal: stubs.TraderWizardModal };
      if (name.endsWith("telegram-config.js")) return { getTelegramDeepLink: stubs.getTelegramDeepLink };
      if (name.endsWith("venue-database.js")) return { venueDatabase: stubs.venueDatabase };
      if (name.endsWith("source-bound-cta.js")) return { publicCtaForVenue: stubs.publicCtaForVenue };
      if (name.endsWith("contextual-href.js")) return { contextualHref: stubs.contextualHref };
      if (name.endsWith("locale-routing.js")) return { localizedHref: stubs.localizedHref };
      if (name.endsWith("v3-product.js")) return { v3Copy: stubs.v3Copy };
      if (name.endsWith("home-copy.js")) return { homeHeroH1: stubs.homeHeroH1 };
      if (name.endsWith("RegistrationCard.jsx")) return { RegistrationCard: stubs.RegistrationCard };
      if (name.endsWith(".css")) return {};
      if (realJsModules[name]) return realJsModules[name];
      if (name.endsWith(".jsx")) return new Proxy({}, {get: () => () => null});
      throw new Error(`Unexpected import ${name}`);
    },
    window,
    document,
    URLSearchParams,
    ...timers,
  });
  return {
    module: module.exports,
    media,
    narrow,
    resize(width) { narrow.matches = width <= 640; narrow.dispatch("change"); },
    replay() { for (const slot of slots) if (slot?.fn) { slot.cleanup?.(); slot.cleanup = slot.fn(); } },
    document,
    timers,
    draw() {
      cursor = 0;
      return module.exports.LeanHero({ locale: "en" });
    },
    flush() {
      while (pending.length) pending.shift()();
    },
    unmount() {
      for (const slot of slots) slot?.cleanup?.();
    },
  };
}

function hero(options) {
  const h = harness(options);
  h.draw();
  h.flush();
  if (options?.open) {
    findByClass(h.draw(), "hx__more-toggle").props.onClick();
    h.draw(); h.flush();
  }
  return h;
}

function findByClass(node, className) {
  if (!node || typeof node !== "object") return undefined;
  if (typeof node.props?.className === "string" && node.props.className.includes(className)) return node;
  for (const child of node.children || []) {
    const found = findByClass(child, className);
    if (found) return found;
  }
}

function textContent(node) {
  if (typeof node === "string") return node;
  if (!node || typeof node !== "object") return "";
  return (node.children || []).map(textContent).join("");
}

function proofState(h) {
  const tree = h.draw();
  const inner = findByClass(tree, "hx__proof-inner");
  const action = findByClass(tree, "hx__proof-action");
  return {
    className: inner?.props.className,
    action: textContent(action),
  };
}

test("LeanHero reduced motion keeps social proof static and creates no timer", () => {
  const h = hero({ reduced: true, open: true });
  const initial = proofState(h);
  h.timers.advance(30000);
  assert.deepEqual(proofState(h), initial);
  assert.equal(h.timers.count(), 0);
  h.unmount();
  assert.equal(h.media.count() + h.narrow.count() + h.document.count(), 0);
});

test("LeanHero visibility pause clears interval and pending timeout, then resumes without catch-up", () => {
  const h = hero({ open: true });
  assert.equal(h.timers.count(), 1);
  h.timers.advance(4200);
  assert.equal(h.timers.count(), 2);
  h.document.hidden = true;
  h.document.dispatch("visibilitychange");
  assert.equal(h.timers.count(), 0);
  const paused = proofState(h);
  h.timers.advance(30000);
  assert.deepEqual(proofState(h), paused);
  h.document.hidden = false;
  h.document.dispatch("visibilitychange");
  assert.equal(h.timers.count(), 1);
  h.unmount();
});

test("LeanHero reduced motion change cancels queued callbacks and cleanup removes listeners", () => {
  const h = hero({ open: true });
  h.timers.advance(4200);
  assert.equal(h.timers.count(), 2);
  h.media.matches = true;
  h.media.dispatch("change");
  assert.equal(h.timers.count(), 0);
  const frozen = proofState(h);
  h.timers.advance(30000);
  assert.deepEqual(proofState(h), frozen);
  h.media.matches = false;
  h.media.dispatch("change");
  assert.equal(h.timers.count(), 1);
  h.unmount();
  assert.equal(h.timers.count(), 0);
  assert.equal(h.media.count() + h.narrow.count() + h.document.count(), 0);
});

// The closed default must do no work; the original active-mode lifecycle tests above remain intact.
test("closed Hero disclosure starts no interval; closing an open example cancels pending rotation", () => {
  const h = hero();
  assert.equal(h.timers.count(), 0);
  const initial = proofState(h);
  h.timers.advance(10000);
  assert.deepEqual(proofState(h), initial);
  findByClass(h.draw(), "hx__more-toggle").props.onClick();
  h.draw(); h.flush();
  assert.equal(h.timers.count(), 1);
  h.timers.advance(4200); assert.equal(h.timers.count(), 2);
  findByClass(h.draw(), "hx__more-toggle").props.onClick();
  h.draw(); h.flush(); assert.equal(h.timers.count(), 0);
  const stopped = proofState(h); h.timers.advance(10000); assert.deepEqual(proofState(h), stopped);
  h.unmount(); assert.equal(h.media.count() + h.narrow.count() + h.document.count(), 0);
});

test("Hero wizard close callback stays identical across live proof re-renders", () => {
  const h = hero({ open: true });
  const callback = (node) => {
    if (!node || typeof node !== "object") return undefined;
    if (typeof node.props?.onClose === "function" && "isOpen" in node.props) return node.props.onClose;
    for (const child of node.children || []) { const found = callback(child); if (found) return found; }
  };
  const first = callback(h.draw()); assert.equal(typeof first, "function");
  h.timers.advance(4200); assert.equal(callback(h.draw()), first);
  h.timers.advance(400); assert.equal(callback(h.draw()), first);
  h.unmount();
});

// Actual LeanHero function/effect lifecycle; retained hook harness, not browser layout.
test('R138 CSS-hidden Hero example has no timer at320/390/640 even when details is open',()=>{
 for(const width of [320,390,640]){const h=hero({width,open:true});assert.equal(h.timers.count(),0,`hidden${width}`);const state=proofState(h);h.timers.advance(30000);assert.deepEqual(proofState(h),state);h.unmount();assert.equal(h.media.count()+h.narrow.count()+h.document.count(),0);}
});
test('R138 exact641 boundary rotates; resize during fade clears interval and timeout and resumes once',()=>{
 const h=hero({width:641,open:true});assert.equal(h.timers.count(),1);h.timers.advance(4200);assert.equal(h.timers.count(),2);h.resize(640);assert.equal(h.timers.count(),0);assert.match(proofState(h).className,/visible/);const stopped=proofState(h);h.timers.advance(30000);assert.deepEqual(proofState(h),stopped);h.resize(641);assert.equal(h.timers.count(),1);h.timers.advance(4199);assert.deepEqual(proofState(h),stopped);h.timers.advance(401);assert.notEqual(proofState(h),stopped);h.unmount();assert.equal(h.timers.count(),0);
});
test('R138 layout, reduced motion, background and disclosure gates remain independent',()=>{
 const h=hero({width:390,open:true});h.document.hidden=true;h.document.dispatch('visibilitychange');h.resize(900);assert.equal(h.timers.count(),0);h.media.matches=true;h.media.dispatch('change');h.document.hidden=false;h.document.dispatch('visibilitychange');assert.equal(h.timers.count(),0);h.media.matches=false;h.media.dispatch('change');assert.equal(h.timers.count(),1);h.resize(640);assert.equal(h.timers.count(),0);h.resize(900);assert.equal(h.timers.count(),1);findByClass(h.draw(),'hx__more-toggle').props.onClick();h.draw();h.flush();assert.equal(h.timers.count(),0);h.resize(390);h.resize(900);assert.equal(h.timers.count(),0);h.unmount();assert.equal(h.media.count()+h.narrow.count()+h.document.count(),0);
});
test('R138 strict replay and repeated media events keep one cycle and remove every listener',()=>{
 const h=hero({open:true});h.replay();h.replay();h.resize(900);h.resize(900);assert.equal(h.timers.count(),1);assert.equal(h.media.count(),1);assert.equal(h.narrow.count(),1);assert.equal(h.document.count(),1);h.timers.advance(4200);h.unmount();assert.equal(h.timers.count(),0);assert.equal(h.media.count()+h.narrow.count()+h.document.count(),0);
});
