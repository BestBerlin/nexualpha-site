import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let bootstrapModuleId = 0;

async function bootstrapScriptForTest(moduleSource) {
  const workerSource = await readFile(new URL("../worker/index.js", import.meta.url), "utf8");
  const match = workerSource.match(/`<script data-nexualpha-deferred-hydration>[\s\S]*?<\/script>`/);
  assert.ok(match, "deferred hydration bootstrap should exist in worker source");
  const uniqueModuleSource = `${moduleSource}
//# sourceURL=nexualpha-deferred-bootstrap-${++bootstrapModuleId}.mjs`;
  const src = `data:text/javascript,${encodeURIComponent(uniqueModuleSource)}`;
  const safeJson = (value) => JSON.stringify(value);
  const html = Function("safeJson", "src", `return ${match[0]};`)(safeJson, src);
  const scriptMatch = html.match(/^<script data-nexualpha-deferred-hydration>([\s\S]*)<\/script>$/);
  assert.ok(scriptMatch, "deferred hydration bootstrap should render a script tag");
  return scriptMatch[1];
}

class FakeEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = Boolean(options.bubbles);
    this.defaultPrevented = false;
    this.immediatePropagationStopped = false;
    this.target = null;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }

  stopImmediatePropagation() {
    this.immediatePropagationStopped = true;
  }
}

class FakeElement {
  constructor(tagName, text = "") {
    this.nodeType = 1;
    this.tagName = tagName.toUpperCase();
    this.textContent = text;
    this.innerText = text;
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.isConnected = true;
    this.clickCount = 0;
    this.id = "";
    this.parentElement = null;
    this.ownerDocument = null;
  }

  get previousSibling() {
    if (!this.ownerDocument) return null;
    const index = this.ownerDocument.elements.indexOf(this);
    return index > 0 ? this.ownerDocument.elements[index - 1] : null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === "id") this.id = String(value);
    if (name === "name") this.name = String(value);
    if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = String(value);
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type, handler) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(handler);
    this.listeners.set(type, listeners);
  }

  dispatchEvent(event) {
    event.target ??= this;
    for (const handler of this.listeners.get(event.type) ?? []) {
      handler(event);
      if (event.immediatePropagationStopped) break;
    }
    return !event.defaultPrevented;
  }

  querySelector(selector) {
    return this.ownerDocument?.elements.find((element) => element.isConnected && element.parentElement === this && matchesSelector(element, selector)) ?? null;
  }

  click() {
    this.clickCount += 1;
    this.dispatchEvent(new FakeEvent("click", { bubbles: true }));
  }

  closest(selector) {
    if (selector === "button" && this.tagName === "BUTTON") return this;
    if (selector === "summary" && this.tagName === "SUMMARY") return this;
    if (selector === "details" && this.tagName === "DETAILS") return this;
    if (selector === "summary" && this.parentElement?.tagName === "SUMMARY") return this.parentElement;
    if (selector === "details" && this.parentElement?.tagName === "DETAILS") return this.parentElement;
    return null;
  }
}

class FakeSelectElement extends FakeElement {
  constructor(text = "") {
    super("select", text);
    this.value = "";
  }
}

class FakeInputElement extends FakeElement {
  constructor(type = "text") {
    super("input", "");
    this._value = "";
    this.type = type;
    if (type) this.setAttribute("type", type);
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = String(value);
  }
}

class FakeDocument {
  constructor() {
    this.nodeType = 9;
    this.documentElement = { dataset: {} };
    this.body = { nodeType: 1, parentElement: null };
    this.listeners = new Map();
    this.elements = [];
  }

  add(element) {
    element.ownerDocument = this;
    element.parentElement = this.body;
    this.elements.push(element);
    return element;
  }

  replace(oldElement, newElement) {
    oldElement.isConnected = false;
    newElement.ownerDocument = this;
    newElement.parentElement = this.body;
    const index = this.elements.indexOf(oldElement);
    assert.notEqual(index, -1, "old element must exist before replacement");
    this.elements[index] = newElement;
    return newElement;
  }

  addEventListener(type, handler) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(handler);
    this.listeners.set(type, listeners);
  }

  dispatchDocumentEvent(event) {
    for (const handler of this.listeners.get(event.type) ?? []) {
      handler(event);
      if (event.immediatePropagationStopped) break;
    }
    return !event.defaultPrevented;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector) {
    return this.elements.filter((element) => element.isConnected && matchesSelector(element, selector));
  }

  getElementById(id) {
    return this.elements.find((element) => element.isConnected && element.id === id) ?? null;
  }
}

function parseAttributeSelector(selector) {
  const tagMatch = selector.match(/^(button|select|input|a|label|details|summary)?((?:\[[^\]]+\])+)$/);
  if (!tagMatch) return null;
  const [, tag = "", attrs] = tagMatch;
  return {
    tag: tag ? tag.toUpperCase() : "",
    attrs: [...attrs.matchAll(/\[([^=\]]+)="([^"]+)"\]/g)].map((match) => [match[1], match[2]]),
  };
}

function matchesSelector(element, selector) {
  if (/^(button|select|input|a|label|details|summary)$/.test(selector)) return element.tagName === selector.toUpperCase();
  const parsed = parseAttributeSelector(selector);
  if (!parsed) return false;
  if (parsed.tag && element.tagName !== parsed.tag) return false;
  return parsed.attrs.every(([name, value]) => element.getAttribute(name) === value);
}

function installFakeEnvironment(document) {
  const windowListeners = new Map();
  const previous = {
    document: globalThis.document,
    window: globalThis.window,
    Event: globalThis.Event,
    CustomEvent: globalThis.CustomEvent,
    HTMLSelectElement: globalThis.HTMLSelectElement,
    HTMLInputElement: globalThis.HTMLInputElement,
    CSS: globalThis.CSS,
    addEventListener: globalThis.addEventListener,
    removeEventListener: globalThis.removeEventListener,
    dispatchEvent: globalThis.dispatchEvent,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    requestIdleCallback: globalThis.requestIdleCallback,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
  const timers = new Map();
  let nextTimer = 1;

  globalThis.document = document;
  globalThis.window = globalThis;
  globalThis.Event = FakeEvent;
  globalThis.CustomEvent = class extends FakeEvent {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail;
    }
  };
  globalThis.HTMLSelectElement = FakeSelectElement;
  globalThis.HTMLInputElement = FakeInputElement;
  globalThis.CSS = { escape: (value) => String(value).replace(/"/g, "\\\"") };
  globalThis.requestAnimationFrame = (callback) => queueMicrotask(callback);
  globalThis.requestIdleCallback = (callback) => {
    queueMicrotask(() => callback({ didTimeout: false, timeRemaining: () => 50 }));
    return 1;
  };
  globalThis.setTimeout = (callback) => {
    const id = nextTimer++;
    timers.set(id, callback);
    return id;
  };
  globalThis.clearTimeout = (id) => {
    timers.delete(id);
  };
  globalThis.addEventListener = (type, handler, options = {}) => {
    const listeners = windowListeners.get(type) ?? [];
    listeners.push({ handler, once: Boolean(options?.once) });
    windowListeners.set(type, listeners);
  };
  globalThis.removeEventListener = (type, handler) => {
    windowListeners.set(type, (windowListeners.get(type) ?? []).filter((entry) => entry.handler !== handler));
  };
  globalThis.dispatchEvent = (event) => {
    const listeners = [...(windowListeners.get(event.type) ?? [])];
    for (const entry of listeners) {
      entry.handler(event);
      if (entry.once) globalThis.removeEventListener(event.type, entry.handler);
    }
    return !event.defaultPrevented;
  };

  const restore = () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
    delete globalThis.__replaceTargets;
    delete globalThis.__imported;
    delete globalThis.__buttonClicks;
    delete globalThis.__selectChanges;
  };
  restore.listenerCount = (type) => (windowListeners.get(type) ?? []).length;
  restore.timerCount = () => timers.size;
  restore.runTimers = () => {
    const callbacks = [...timers.values()];
    timers.clear();
    callbacks.forEach((callback) => callback());
  };
  return restore;
}

async function flushAsyncWork() {
  for (let index = 0; index < 4; index += 1) {
    await Promise.resolve();
    await new Promise((resolve) => setImmediate(resolve));
  }
}

function markScopeReady(document, scope) {
  const marker = document.querySelector(`[data-nexualpha-scope-start="${scope}"]`);
  assert.ok(marker, `${scope} start marker should exist`);
  marker.setAttribute("data-nexualpha-interaction-ready", "true");
  globalThis.dispatchEvent(new CustomEvent("nexualpha:interaction-ready", { detail: { scope } }));
}

test("deferred hydration starts the app on idle after browser load without waiting for a user gesture", async () => {
  const document = new FakeDocument();
  const restore = installFakeEnvironment(document);
  try {
    const script = await bootstrapScriptForTest("globalThis.__imported = true;");
    Function(script)();
    await flushAsyncWork();
    assert.equal(globalThis.__imported, undefined, "the bridge should wait until the page load boundary");

    globalThis.dispatchEvent(new FakeEvent("load"));
    await flushAsyncWork();

    assert.equal(globalThis.__imported, true, "load plus idle should import the app for passive CTA telemetry");
    assert.equal(restore.listenerCount("load"), 0, "the load bootstrap listener should be one-shot");
  } finally {
    restore();
  }
});

test("deferred hydration replays scoped form intent only after the target subtree is ready", async () => {
  const document = new FakeDocument();
  const shellButton = document.add(new FakeElement("button", "市場を検索"));
  shellButton.addEventListener("click", () => { throw new Error("shell button is not part of this target intent"); });

  const otherStart = document.add(new FakeElement("template"));
  otherStart.setAttribute("data-nexualpha-scope-start", "home-hero");
  const otherButton = document.add(new FakeElement("button", "Hero CTA"));
  otherButton.setAttribute("aria-controls", "hero");
  const otherEnd = document.add(new FakeElement("template"));
  otherEnd.setAttribute("data-nexualpha-scope-end", "home-hero");

  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldButton = document.add(new FakeElement("button", "عرض كل المنصات (24)"));
  oldButton.setAttribute("aria-controls", "venues");
  const oldSelect = document.add(new FakeSelectElement());
  oldSelect.setAttribute("name", "market");
  oldSelect.value = "a";
  const anchor = document.add(new FakeElement("a", "Signup"));
  anchor.setAttribute("href", "https://partner.bitget.com/bg/C6PRAF");
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    globalThis.__replaceTargets = () => {
      globalThis.__imported = true;
      const replacementButton = new FakeElement("button", oldButton.textContent);
      replacementButton.setAttribute("aria-controls", "venues");
      replacementButton.addEventListener("click", () => { globalThis.__buttonClicks = (globalThis.__buttonClicks ?? 0) + 1; });
      document.replace(oldButton, replacementButton);

      const replacementSelect = new FakeSelectElement();
      replacementSelect.setAttribute("name", "market");
      replacementSelect.value = "a";
      replacementSelect.addEventListener("change", () => { globalThis.__selectChanges = (globalThis.__selectChanges ?? 0) + 1; });
      document.replace(oldSelect, replacementSelect);
    };

    const script = await bootstrapScriptForTest("globalThis.__replaceTargets();");
    Function(script)();

    const clickEvent = new FakeEvent("click", { bubbles: true });
    clickEvent.target = oldButton;
    document.dispatchDocumentEvent(clickEvent);

    oldSelect.value = "b";
    const changeEvent = new FakeEvent("change", { bubbles: true });
    changeEvent.target = oldSelect;
    document.dispatchDocumentEvent(changeEvent);

    const anchorEvent = new FakeEvent("click", { bubbles: true });
    anchorEvent.target = anchor;
    document.dispatchDocumentEvent(anchorEvent);

    await flushAsyncWork();
    assert.equal(globalThis.__imported, true, "first interaction should load the application module");
    assert.equal(globalThis.__buttonClicks ?? 0, 0, "click should not replay immediately after import");
    assert.equal(globalThis.__selectChanges ?? 0, 0, "change should not replay immediately after import");
    assert.equal(anchorEvent.defaultPrevented, false, "plain anchor clicks should remain native and unblocked");

    document.documentElement.dataset.nexualphaHydrated = "true";
    globalThis.dispatchEvent(new FakeEvent("nexualpha:hydrated"));
    markScopeReady(document, "home-hero");
    await flushAsyncWork();
    assert.equal(globalThis.__buttonClicks ?? 0, 0, "shell/root ready must not replay a scoped target click");
    assert.equal(globalThis.__selectChanges ?? 0, 0, "other boundary ready must not replay a scoped target change");

    markScopeReady(document, "page-content");
    await flushAsyncWork();

    const replacementSelect = document.querySelector('select[name="market"]');
    assert.equal(globalThis.__buttonClicks, 1, "saved button click should replay exactly once after target ready");
    assert.equal(globalThis.__selectChanges, 1, "saved select change should replay exactly once after target ready");
    assert.equal(replacementSelect.value, "b", "replacement select should receive the saved value");
    assert.equal(otherButton.clickCount, 0, "same-label checks should not redirect replay into another scope");
    assert.equal(shellButton.clickCount, 0, "shell button should remain unrelated to scoped replay");
  } finally {
    restore();
  }
});

test("deferred hydration preserves native details final open state when target becomes ready before the timer", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldDetails = document.add(new FakeElement("details"));
  oldDetails.setAttribute("data-testid", "compare-direct-answer");
  oldDetails.open = false;
  const oldSummary = document.add(new FakeElement("summary", "Official answer"));
  oldSummary.parentElement = oldDetails;
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    globalThis.__replaceTargets = () => {
      globalThis.__imported = true;
      const replacementDetails = new FakeElement("details");
      replacementDetails.setAttribute("data-testid", "compare-direct-answer");
      replacementDetails.open = false;
      const replacementSummary = new FakeElement("summary", oldSummary.textContent);
      replacementSummary.parentElement = replacementDetails;
      document.replace(oldDetails, replacementDetails);
      document.replace(oldSummary, replacementSummary);
      replacementSummary.parentElement = replacementDetails;
    };

    const script = await bootstrapScriptForTest("globalThis.__replaceTargets();");
    Function(script)();

    globalThis.dispatchEvent(new FakeEvent("pointerdown"));
    const clickEvent = new FakeEvent("click", { bubbles: true });
    clickEvent.target = oldSummary;
    document.dispatchDocumentEvent(clickEvent);
    await Promise.resolve();
    oldDetails.open = true;
    assert.equal(oldDetails.open, true, "native summary click should keep immediate open feedback");
    await flushAsyncWork();
    assert.equal(document.querySelector('details[data-testid="compare-direct-answer"]').open, false, "hydration replacement starts from the closed React default");

    markScopeReady(document, "page-content");
    restore.runTimers();
    await flushAsyncWork();

    const replacementDetails = document.querySelector('details[data-testid="compare-direct-answer"]');
    assert.equal(replacementDetails.open, true, "click-time pending details state should survive when ready happens before the timer");
  } finally {
    restore();
  }
});

test("deferred hydration preserves the latest native details state before target ready", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldDetails = document.add(new FakeElement("details"));
  oldDetails.open = false;
  const oldSummary = document.add(new FakeElement("summary", "Official answer"));
  oldSummary.parentElement = oldDetails;
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    let resolveImport;
    globalThis.__summaryImportPromise = new Promise((resolve) => { resolveImport = resolve; });
    globalThis.__replaceTargets = () => {
      globalThis.__imported = true;
      const replacementDetails = new FakeElement("details");
      replacementDetails.open = true;
      const replacementSummary = new FakeElement("summary", oldSummary.textContent);
      replacementSummary.parentElement = replacementDetails;
      document.replace(oldDetails, replacementDetails);
      document.replace(oldSummary, replacementSummary);
      replacementSummary.parentElement = replacementDetails;
    };

    const script = await bootstrapScriptForTest("await globalThis.__summaryImportPromise; globalThis.__replaceTargets();");
    Function(script)();
    globalThis.dispatchEvent(new FakeEvent("pointerdown"));

    const openEvent = new FakeEvent("click", { bubbles: true });
    openEvent.target = oldSummary;
    document.dispatchDocumentEvent(openEvent);
    await Promise.resolve();
    oldDetails.open = true;
    restore.runTimers();
    const closeEvent = new FakeEvent("click", { bubbles: true });
    closeEvent.target = oldSummary;
    document.dispatchDocumentEvent(closeEvent);
    await Promise.resolve();
    oldDetails.open = false;
    restore.runTimers();
    await flushAsyncWork();

    resolveImport();
    await flushAsyncWork();
    assert.equal(document.querySelector("details").open, true, "replacement starts from the opposite default to prove restoration");
    markScopeReady(document, "page-content");
    await flushAsyncWork();
    assert.equal(document.querySelector("details").open, false, "latest pre-ready details state should win");
  } finally {
    delete globalThis.__summaryImportPromise;
    restore();
  }
});

test("deferred hydration lets a newer ready details action cancel an older pending details restore", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldDetails = document.add(new FakeElement("details"));
  oldDetails.setAttribute("data-testid", "compare-direct-answer");
  oldDetails.open = false;
  const oldSummary = document.add(new FakeElement("summary", "Official answer"));
  oldSummary.parentElement = oldDetails;
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    const animationFrames = [];
    globalThis.requestAnimationFrame = (callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    };
    let resolveImport;
    globalThis.__summaryImportPromise = new Promise((resolve) => { resolveImport = resolve; });
    globalThis.__replaceTargets = () => {
      globalThis.__imported = true;
      const replacementDetails = new FakeElement("details");
      replacementDetails.setAttribute("data-testid", "compare-direct-answer");
      replacementDetails.open = false;
      const replacementSummary = new FakeElement("summary", oldSummary.textContent);
      replacementSummary.parentElement = replacementDetails;
      document.replace(oldDetails, replacementDetails);
      document.replace(oldSummary, replacementSummary);
      replacementSummary.parentElement = replacementDetails;
    };

    const script = await bootstrapScriptForTest("await globalThis.__summaryImportPromise; globalThis.__replaceTargets();");
    Function(script)();
    globalThis.dispatchEvent(new FakeEvent("pointerdown"));
    const openEvent = new FakeEvent("click", { bubbles: true });
    openEvent.target = oldSummary;
    document.dispatchDocumentEvent(openEvent);
    await Promise.resolve();
    oldDetails.open = true;
    restore.runTimers();
    await flushAsyncWork();
    resolveImport();
    await flushAsyncWork();

    markScopeReady(document, "page-content");
    await flushAsyncWork();
    assert.equal(animationFrames.length, 1, "older details restore should be waiting for an animation frame");

    const replacementDetails = document.querySelector('details[data-testid="compare-direct-answer"]');
    const replacementSummary = document.querySelector("summary");
    replacementDetails.open = false;
    const readyClick = new FakeEvent("click", { bubbles: true });
    readyClick.target = replacementSummary;
    document.dispatchDocumentEvent(readyClick);
    await flushAsyncWork();
    animationFrames.shift()();
    await flushAsyncWork();

    assert.equal(replacementDetails.open, false, "newer ready details action should not be overwritten by the old pending open");
  } finally {
    delete globalThis.__summaryImportPromise;
    restore();
  }
});


test("deferred hydration cleans up and does not replay when the target scope never becomes ready", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldButton = document.add(new FakeElement("button", "Show all venues"));
  oldButton.setAttribute("aria-controls", "venues");
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    globalThis.__replaceTargets = () => {
      globalThis.__imported = true;
      const replacementButton = new FakeElement("button", oldButton.textContent);
      replacementButton.setAttribute("aria-controls", "venues");
      replacementButton.addEventListener("click", () => { globalThis.__buttonClicks = (globalThis.__buttonClicks ?? 0) + 1; });
      document.replace(oldButton, replacementButton);
    };

    const script = await bootstrapScriptForTest("globalThis.__replaceTargets();");
    Function(script)();
    const clickEvent = new FakeEvent("click", { bubbles: true });
    clickEvent.target = oldButton;
    document.dispatchDocumentEvent(clickEvent);
    await flushAsyncWork();

    assert.equal(restore.listenerCount("nexualpha:interaction-ready"), 1, "waiting for target ready should install one listener");
    assert.equal(restore.timerCount(), 1, "waiting for target ready should install one timeout");
    restore.runTimers();
    await flushAsyncWork();

    assert.equal(globalThis.__buttonClicks ?? 0, 0, "timeout is a failure path and must not replay the click");
    assert.equal(restore.listenerCount("nexualpha:interaction-ready"), 0, "timeout should remove the ready listener");
    assert.equal(restore.timerCount(), 0, "timeout should clear its timer bookkeeping");

    markScopeReady(document, "page-content");
    await flushAsyncWork();
    assert.equal(globalThis.__buttonClicks ?? 0, 0, "late target ready must not replay a timed-out intent");
  } finally {
    restore();
  }
});

test("deferred hydration swallows failed preload imports and never replays failed intents", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldButton = document.add(new FakeElement("button", "Show all venues"));
  oldButton.setAttribute("aria-controls", "venues");
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const unhandled = [];
  const onUnhandled = (reason) => unhandled.push(reason);
  process.on("unhandledRejection", onUnhandled);
  const restore = installFakeEnvironment(document);
  try {
    const script = await bootstrapScriptForTest("throw new Error('route chunk failed');");
    Function(script)();

    globalThis.dispatchEvent(new FakeEvent("pointerdown"));
    const clickEvent = new FakeEvent("click", { bubbles: true });
    clickEvent.target = oldButton;
    document.dispatchDocumentEvent(clickEvent);
    markScopeReady(document, "page-content");
    await flushAsyncWork();

    assert.deepEqual(unhandled, [], "failed preload/import should not create unhandled rejections");
    assert.equal(oldButton.clickCount, 0, "failed import should not replay against the stale button");
    assert.equal(restore.listenerCount("nexualpha:interaction-ready"), 0, "failed import should not leave a ready listener");
    assert.equal(restore.timerCount(), 0, "failed import should not leave a timer");
  } finally {
    process.off("unhandledRejection", onUnhandled);
    restore();
  }
});


test("deferred hydration repositions text-only buttons after real worker template serialization", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldButton = document.add(new FakeElement("button", "Open\n   research tools"));
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    globalThis.__replaceTargets = () => {
      globalThis.__imported = true;
      const replacementButton = new FakeElement("button", "Open research tools");
      replacementButton.addEventListener("click", () => { globalThis.__buttonClicks = (globalThis.__buttonClicks ?? 0) + 1; });
      document.replace(oldButton, replacementButton);
    };

    const script = await bootstrapScriptForTest("globalThis.__replaceTargets();");
    assert.match(script, /\.replace\(\/\\s\+\/g," "\)/, "rendered worker script should contain a real whitespace-normalizing regex");
    Function(script)();

    const clickEvent = new FakeEvent("click", { bubbles: true });
    clickEvent.target = oldButton;
    document.dispatchDocumentEvent(clickEvent);
    await flushAsyncWork();
    markScopeReady(document, "page-content");
    await flushAsyncWork();

    assert.equal(globalThis.__buttonClicks, 1, "compact text fallback should find the replacement button once");
  } finally {
    restore();
  }
});


test("deferred hydration preserves the last safe input value for the target scope", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldInput = document.add(new FakeInputElement("number"));
  oldInput.setAttribute("name", "volume");
  oldInput.value = "100000";
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    globalThis.__replaceTargets = () => {
      globalThis.__imported = true;
      const replacementInput = new FakeInputElement("number");
      replacementInput.setAttribute("name", "volume");
      replacementInput.value = "100000";
      replacementInput.addEventListener("input", () => { globalThis.__inputValues = [...(globalThis.__inputValues ?? []), replacementInput.value]; });
      document.replace(oldInput, replacementInput);
    };

    const script = await bootstrapScriptForTest("globalThis.__replaceTargets();");
    Function(script)();

    oldInput.value = "100";
    const firstInput = new FakeEvent("input", { bubbles: true });
    firstInput.target = oldInput;
    document.dispatchDocumentEvent(firstInput);
    oldInput.value = "12500.25";
    const lastInput = new FakeEvent("input", { bubbles: true });
    lastInput.target = oldInput;
    document.dispatchDocumentEvent(lastInput);

    await flushAsyncWork();
    assert.equal(globalThis.__inputValues, undefined, "ready wait should not fire a React-style input listener early");
    markScopeReady(document, "page-content");
    await flushAsyncWork();

    const replacementInput = document.querySelector('input[name="volume"]');
    assert.equal(replacementInput.value, "12500.25", "target ready should restore the last typed value");
    assert.deepEqual(globalThis.__inputValues, ["12500.25"], "React-style input listener should receive exactly one restored value");
  } finally {
    delete globalThis.__inputValues;
    restore();
  }
});

test("deferred hydration relocates React useId inputs by label and restores after same-frame controlled reset", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldLabel = document.add(new FakeElement("label", "Monthly volume (USDT)"));
  oldLabel.setAttribute("for", "_R_19i_-volume");
  const oldInput = document.add(new FakeInputElement("number"));
  oldInput.setAttribute("id", "_R_19i_-volume");
  oldInput.value = "100000";
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    globalThis.__replaceTargets = () => {
      globalThis.__imported = true;
      const replacementLabel = new FakeElement("label", "Monthly volume (USDT)");
      replacementLabel.setAttribute("for", "_r_0_-volume");
      const replacementInput = new FakeInputElement("number");
      replacementInput.setAttribute("id", "_r_0_-volume");
      replacementInput.value = "100000";
      replacementInput.addEventListener("input", () => {
        globalThis.__inputValues = [...(globalThis.__inputValues ?? []), replacementInput.value];
      });
      document.replace(oldLabel, replacementLabel);
      document.replace(oldInput, replacementInput);
    };

    const script = await bootstrapScriptForTest("globalThis.__replaceTargets();");
    Function(script)();

    oldInput.value = "12500.25";
    const inputEvent = new FakeEvent("input", { bubbles: true });
    inputEvent.target = oldInput;
    document.dispatchDocumentEvent(inputEvent);
    await flushAsyncWork();
    assert.equal(globalThis.__inputValues, undefined, "input should not replay before target scope is ready");

    markScopeReady(document, "page-content");
    const replacementInput = document.querySelector('input[id="_r_0_-volume"]');
    globalThis.requestAnimationFrame(() => {
      replacementInput.value = "100000";
      globalThis.__controlledResetValue = replacementInput.value;
    });
    await flushAsyncWork();

    assert.equal(globalThis.__controlledResetValue, "100000", "test simulates React controlled value reset after ready");
    assert.equal(replacementInput.value, "12500.25", "dynamic useId input should recover the user's first typed value");
    assert.deepEqual(globalThis.__inputValues, ["12500.25"], "React-style input listener should receive the restored value once");
  } finally {
    delete globalThis.__inputValues;
    delete globalThis.__controlledResetValue;
    restore();
  }
});

test("deferred hydration wakes React-style value tracking when hydration kept the typed DOM value", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldLabel = document.add(new FakeElement("label", "Monthly volume (USDT)"));
  oldLabel.setAttribute("for", "_R_19i_-volume");
  const oldInput = document.add(new FakeInputElement("number"));
  oldInput.setAttribute("id", "_R_19i_-volume");
  oldInput.value = "100000";
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    globalThis.__replaceTargets = () => {
      const replacementLabel = new FakeElement("label", "Monthly volume (USDT)");
      replacementLabel.setAttribute("for", "_r_0_-volume");
      const replacementInput = new FakeInputElement("number");
      replacementInput.setAttribute("id", "_r_0_-volume");
      replacementInput.defaultValue = "100000";
      replacementInput._value = "12500.25";
      replacementInput.__trackedValue = "12500.25";
      Object.defineProperty(replacementInput, "value", {
        configurable: true,
        get() { return this._value; },
        set(value) {
          this.__trackedValue = String(value);
          this._value = String(value);
        },
      });
      replacementInput.addEventListener("input", () => {
        if (replacementInput.__trackedValue !== replacementInput.value) {
          globalThis.__inputValues = [...(globalThis.__inputValues ?? []), replacementInput.value];
          replacementInput.__trackedValue = replacementInput.value;
        }
      });
      document.replace(oldLabel, replacementLabel);
      document.replace(oldInput, replacementInput);
    };

    const script = await bootstrapScriptForTest("globalThis.__replaceTargets();");
    Function(script)();

    oldInput.value = "12500.25";
    const inputEvent = new FakeEvent("input", { bubbles: true });
    inputEvent.target = oldInput;
    document.dispatchDocumentEvent(inputEvent);
    await flushAsyncWork();

    markScopeReady(document, "page-content");
    await flushAsyncWork();

    const replacementInput = document.querySelector('input[id="_r_0_-volume"]');
    assert.equal(replacementInput.value, "12500.25", "hydrated input should keep the typed value");
    assert.deepEqual(globalThis.__inputValues, ["12500.25"], "React-style tracker should observe the replayed input as a real change");
  } finally {
    delete globalThis.__inputValues;
    restore();
  }
});

test("deferred hydration wakes React-style value tracking for cleared numeric inputs", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldInput = document.add(new FakeInputElement("number"));
  oldInput.setAttribute("name", "volume");
  oldInput.value = "100000";
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    globalThis.__replaceTargets = () => {
      const replacementInput = new FakeInputElement("number");
      replacementInput.setAttribute("name", "volume");
      replacementInput.defaultValue = "100000";
      replacementInput._value = "";
      replacementInput.__trackedValue = "";
      Object.defineProperty(replacementInput, "value", {
        configurable: true,
        get() { return this._value; },
        set(value) {
          this.__trackedValue = String(value);
          this._value = String(value);
        },
      });
      replacementInput.addEventListener("input", () => {
        if (replacementInput.__trackedValue !== replacementInput.value) {
          globalThis.__clearedInputValues = [...(globalThis.__clearedInputValues ?? []), replacementInput.value];
          replacementInput.__trackedValue = replacementInput.value;
        }
      });
      document.replace(oldInput, replacementInput);
    };

    const script = await bootstrapScriptForTest("globalThis.__replaceTargets();");
    Function(script)();

    oldInput.value = "";
    const inputEvent = new FakeEvent("input", { bubbles: true });
    inputEvent.target = oldInput;
    document.dispatchDocumentEvent(inputEvent);
    await flushAsyncWork();

    markScopeReady(document, "page-content");
    await flushAsyncWork();

    const replacementInput = document.querySelector('input[name="volume"]');
    assert.equal(replacementInput.value, "", "cleared input should remain empty after hydration replay");
    assert.deepEqual(globalThis.__clearedInputValues, [""], "React-style tracker should observe the cleared input as a real change");
  } finally {
    delete globalThis.__clearedInputValues;
    restore();
  }
});

test("deferred hydration lets a newer ready input beat an older pending restore", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldLabel = document.add(new FakeElement("label", "Monthly volume (USDT)"));
  oldLabel.setAttribute("for", "_R_19i_-volume");
  const oldInput = document.add(new FakeInputElement("number"));
  oldInput.setAttribute("id", "_R_19i_-volume");
  oldInput.value = "100000";
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    const animationFrames = [];
    globalThis.requestAnimationFrame = (callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    };
    globalThis.__replaceTargets = () => {
      globalThis.__imported = true;
      const replacementLabel = new FakeElement("label", "Monthly volume (USDT)");
      replacementLabel.setAttribute("for", "_r_0_-volume");
      const replacementInput = new FakeInputElement("number");
      replacementInput.setAttribute("id", "_r_0_-volume");
      replacementInput.value = "100000";
      replacementInput.addEventListener("input", () => {
        globalThis.__inputValues = [...(globalThis.__inputValues ?? []), replacementInput.value];
      });
      document.replace(oldLabel, replacementLabel);
      document.replace(oldInput, replacementInput);
    };

    const script = await bootstrapScriptForTest("globalThis.__replaceTargets();");
    Function(script)();

    oldInput.value = "12500.25";
    const oldInputEvent = new FakeEvent("input", { bubbles: true });
    oldInputEvent.target = oldInput;
    document.dispatchDocumentEvent(oldInputEvent);
    await flushAsyncWork();

    markScopeReady(document, "page-content");
    await flushAsyncWork();
    assert.equal(animationFrames.length, 1, "pending restore should wait for the first animation frame");
    animationFrames.shift()();
    assert.equal(animationFrames.length, 1, "pending restore should wait for the second animation frame");

    const replacementInput = document.querySelector('input[id="_r_0_-volume"]');
    replacementInput.value = "777";
    const newerInputEvent = new FakeEvent("input", { bubbles: true });
    newerInputEvent.target = replacementInput;
    document.dispatchDocumentEvent(newerInputEvent);
    if (!newerInputEvent.immediatePropagationStopped) replacementInput.dispatchEvent(newerInputEvent);

    animationFrames.shift()();
    await flushAsyncWork();

    assert.equal(replacementInput.value, "777", "newer ready input should not be overwritten by the older pending restore");
    assert.deepEqual(globalThis.__inputValues, ["777"], "older pending restore should not dispatch a stale input event");
  } finally {
    delete globalThis.__inputValues;
    restore();
  }
});

test("deferred hydration does not read or replay password inputs", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldInput = document.add(new FakeInputElement("password"));
  oldInput.setAttribute("name", "secret");
  oldInput.value = "initial";
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    const script = await bootstrapScriptForTest("globalThis.__imported = true;");
    Function(script)();
    oldInput.value = "do-not-store";
    const inputEvent = new FakeEvent("input", { bubbles: true });
    inputEvent.target = oldInput;
    document.dispatchDocumentEvent(inputEvent);
    markScopeReady(document, "page-content");
    await flushAsyncWork();

    assert.equal(globalThis.__imported, undefined, "password input should not trigger deferred import");
    assert.equal(inputEvent.immediatePropagationStopped, false, "password input should not be intercepted");
  } finally {
    restore();
  }
});

test("deferred hydration times out a never-settling import without replaying", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldButton = document.add(new FakeElement("button", "Show all venues"));
  oldButton.setAttribute("aria-controls", "venues");
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    const script = await bootstrapScriptForTest("await new Promise(() => {});");
    Function(script)();
    const clickEvent = new FakeEvent("click", { bubbles: true });
    clickEvent.target = oldButton;
    document.dispatchDocumentEvent(clickEvent);
    await flushAsyncWork();

    assert.equal(restore.timerCount(), 1, "the whole import-plus-ready path should be bounded by one timeout");
    restore.runTimers();
    markScopeReady(document, "page-content");
    await flushAsyncWork();

    assert.equal(oldButton.clickCount, 0, "a timed-out import must not replay the stale click");
    assert.equal(restore.listenerCount("nexualpha:interaction-ready"), 0, "timeout before import resolution should not leave a ready listener");
    assert.equal(restore.timerCount(), 0, "timeout should clear timer bookkeeping");
  } finally {
    restore();
  }
});


test("deferred hydration does not attach a ready listener when import resolves after timeout", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldButton = document.add(new FakeElement("button", "Show all venues"));
  oldButton.setAttribute("aria-controls", "venues");
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    const script = await bootstrapScriptForTest("await globalThis.__lateImportPromise;");
    let resolveImport;
    globalThis.__lateImportPromise = new Promise((resolve) => { resolveImport = resolve; });
    Function(script)();
    const clickEvent = new FakeEvent("click", { bubbles: true });
    clickEvent.target = oldButton;
    document.dispatchDocumentEvent(clickEvent);
    await flushAsyncWork();

    restore.runTimers();
    await flushAsyncWork();
    resolveImport();
    await flushAsyncWork();

    assert.equal(restore.listenerCount("nexualpha:interaction-ready"), 0, "late import resolution after timeout must not install a ready listener");
    assert.equal(oldButton.clickCount, 0, "late import resolution after timeout must not replay the stale click");
  } finally {
    delete globalThis.__lateImportPromise;
    restore();
  }
});

test("deferred hydration keeps unnamed connected input intents separate with weak fallback keys", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const firstInput = document.add(new FakeInputElement("number"));
  firstInput.value = "1";
  firstInput.addEventListener("input", () => { globalThis.__firstInputValue = firstInput.value; });
  const secondInput = document.add(new FakeInputElement("number"));
  secondInput.value = "2";
  secondInput.addEventListener("input", () => { globalThis.__secondInputValue = secondInput.value; });
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    const script = await bootstrapScriptForTest("globalThis.__imported = true;");
    Function(script)();
    firstInput.value = "111";
    const firstEvent = new FakeEvent("input", { bubbles: true });
    firstEvent.target = firstInput;
    document.dispatchDocumentEvent(firstEvent);
    secondInput.value = "222";
    const secondEvent = new FakeEvent("input", { bubbles: true });
    secondEvent.target = secondInput;
    document.dispatchDocumentEvent(secondEvent);

    await flushAsyncWork();
    markScopeReady(document, "page-content");
    await flushAsyncWork();

    assert.equal(firstInput.value, "111", "first unnamed input should keep its own value");
    assert.equal(secondInput.value, "222", "second unnamed input should keep its own value");
    assert.equal(globalThis.__firstInputValue, "111");
    assert.equal(globalThis.__secondInputValue, "222");
  } finally {
    delete globalThis.__firstInputValue;
    delete globalThis.__secondInputValue;
    restore();
  }
});

test("deferred hydration can relocate safe inputs by aria-label", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const oldInput = document.add(new FakeInputElement("search"));
  oldInput.setAttribute("aria-label", "Search platforms");
  oldInput.value = "";
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    globalThis.__replaceTargets = () => {
      globalThis.__imported = true;
      const replacementInput = new FakeInputElement("search");
      replacementInput.setAttribute("aria-label", "Search platforms");
      replacementInput.addEventListener("input", () => { globalThis.__ariaInputValue = replacementInput.value; });
      document.replace(oldInput, replacementInput);
    };

    const script = await bootstrapScriptForTest("globalThis.__replaceTargets();");
    Function(script)();
    oldInput.value = "bitget";
    const inputEvent = new FakeEvent("input", { bubbles: true });
    inputEvent.target = oldInput;
    document.dispatchDocumentEvent(inputEvent);
    await flushAsyncWork();
    markScopeReady(document, "page-content");
    await flushAsyncWork();

    assert.equal(document.querySelector('input[aria-label="Search platforms"]').value, "bitget");
    assert.equal(globalThis.__ariaInputValue, "bitget");
  } finally {
    delete globalThis.__ariaInputValue;
    restore();
  }
});


test("deferred hydration ignores unsupported email input fields", async () => {
  const document = new FakeDocument();
  const targetStart = document.add(new FakeElement("template"));
  targetStart.setAttribute("data-nexualpha-scope-start", "page-content");
  const emailInput = document.add(new FakeInputElement("email"));
  emailInput.setAttribute("name", "email");
  emailInput.value = "before@example.com";
  const targetEnd = document.add(new FakeElement("template"));
  targetEnd.setAttribute("data-nexualpha-scope-end", "page-content");

  const restore = installFakeEnvironment(document);
  try {
    const script = await bootstrapScriptForTest("globalThis.__imported = true;");
    Function(script)();
    emailInput.value = "after@example.com";
    const inputEvent = new FakeEvent("input", { bubbles: true });
    inputEvent.target = emailInput;
    document.dispatchDocumentEvent(inputEvent);
    markScopeReady(document, "page-content");
    await flushAsyncWork();

    assert.equal(globalThis.__imported, undefined, "unsupported email input should not trigger deferred import");
    assert.equal(inputEvent.immediatePropagationStopped, false, "unsupported email input should not be intercepted");
  } finally {
    restore();
  }
});

// R118: passive background loading must not race visible SSR first paint.
function installPaintObserver({ painted = false, throws = false } = {}) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'performance');
  const previousObserver = globalThis.PerformanceObserver;
  let observer, disconnected = 0;
  Object.defineProperty(globalThis, 'performance', { configurable: true, value: { getEntriesByType: () => painted ? [{name:'first-contentful-paint'}] : [] } });
  globalThis.PerformanceObserver = class {
    static supportedEntryTypes = ['paint'];
    constructor(callback) { observer = callback; }
    observe() { if (throws) throw new Error('paint observer unavailable'); }
    disconnect() { disconnected++; }
  };
  return { paint() { painted = true; observer?.({getEntries:()=>[{name:'first-contentful-paint'}]}); }, get disconnected() { return disconnected; }, restore() { if(descriptor) Object.defineProperty(globalThis,'performance',descriptor); else delete globalThis.performance; if(previousObserver === undefined) delete globalThis.PerformanceObserver; else globalThis.PerformanceObserver = previousObserver; } };
}

test('R118 passive import waits for first contentful paint, then loads once on idle', async()=>{
 const document=new FakeDocument(), restore=installFakeEnvironment(document), paint=installPaintObserver();
 try {
  Function(await bootstrapScriptForTest('globalThis.__imported = true;'))();
  globalThis.dispatchEvent(new FakeEvent('load')); await flushAsyncWork();
  assert.equal(globalThis.__imported, undefined, 'load/idle before first paint cannot fetch the application');
  paint.paint(); await flushAsyncWork();
  assert.equal(globalThis.__imported,true); assert.equal(paint.disconnected,1); assert.equal(restore.timerCount(),0);
 } finally { paint.restore();restore(); }
});
test('R118 already-painted SSR starts passive hydration without requiring another paint', async()=>{
 const document=new FakeDocument(), restore=installFakeEnvironment(document), paint=installPaintObserver({painted:true});
 try { Function(await bootstrapScriptForTest('globalThis.__imported = true;'))(); globalThis.dispatchEvent(new FakeEvent('load'));await flushAsyncWork();assert.equal(globalThis.__imported,true);assert.equal(restore.timerCount(),0); }
 finally {paint.restore();restore();}
});
test('R118 user gesture still starts loading immediately while paint is pending', async()=>{
 const document=new FakeDocument(), restore=installFakeEnvironment(document), paint=installPaintObserver();
 try { Function(await bootstrapScriptForTest('globalThis.__imported = true;'))();globalThis.dispatchEvent(new FakeEvent('load'));globalThis.dispatchEvent(new FakeEvent('pointerdown'));await flushAsyncWork();assert.equal(globalThis.__imported,true);paint.paint();await flushAsyncWork();assert.equal(restore.timerCount(),0); }
 finally {paint.restore();restore();}
});
test('R118 missing paint event has a bounded passive hydration fallback', async()=>{
 const document=new FakeDocument(), restore=installFakeEnvironment(document), paint=installPaintObserver();
 try { Function(await bootstrapScriptForTest('globalThis.__imported = true;'))();globalThis.dispatchEvent(new FakeEvent('load'));await flushAsyncWork();assert.equal(globalThis.__imported,undefined);assert.equal(restore.timerCount(),1);restore.runTimers();await flushAsyncWork();assert.equal(globalThis.__imported,true);assert.equal(paint.disconnected,1);assert.equal(restore.timerCount(),0); }
 finally {paint.restore();restore();}
});
test('R118 paint observer failure keeps passive hydration usable without leaking timers', async()=>{
 const document=new FakeDocument(), restore=installFakeEnvironment(document), paint=installPaintObserver({throws:true});
 try { Function(await bootstrapScriptForTest('globalThis.__imported = true;'))();globalThis.dispatchEvent(new FakeEvent('load'));await flushAsyncWork();assert.equal(globalThis.__imported,true);assert.equal(restore.timerCount(),0); }
 finally {paint.restore();restore();}
});

test('R118 unsupported paint observation remains bounded when animation frames are suspended', async()=>{
 const document=new FakeDocument(), restore=installFakeEnvironment(document), paint=installPaintObserver();
 try { globalThis.PerformanceObserver.supportedEntryTypes=[];globalThis.requestAnimationFrame=()=>1;Function(await bootstrapScriptForTest('globalThis.__imported = true;'))();globalThis.dispatchEvent(new FakeEvent('load'));await flushAsyncWork();assert.equal(globalThis.__imported,undefined);assert.equal(restore.timerCount(),1);restore.runTimers();await flushAsyncWork();assert.equal(globalThis.__imported,true);assert.equal(restore.timerCount(),0); }
 finally {paint.restore();restore();}
});
test('R118 failing paint observation remains bounded when animation frames are suspended', async()=>{
 const document=new FakeDocument(), restore=installFakeEnvironment(document), paint=installPaintObserver({throws:true});
 try { globalThis.requestAnimationFrame=()=>1;Function(await bootstrapScriptForTest('globalThis.__imported = true;'))();globalThis.dispatchEvent(new FakeEvent('load'));await flushAsyncWork();assert.equal(globalThis.__imported,undefined);assert.equal(restore.timerCount(),1);restore.runTimers();await flushAsyncWork();assert.equal(globalThis.__imported,true);assert.equal(paint.disconnected,1);assert.equal(restore.timerCount(),0); }
 finally {paint.restore();restore();}
});

for (const desiredOpen of [true, false]) {
  test(`retained native details ${desiredOpen ? "open" : "closed"} state synchronizes hydrated toggle listener exactly once`, async () => {
    const document = new FakeDocument();
    const details = document.add(new FakeElement("details"));
    details.open = !desiredOpen;
    const summary = document.add(new FakeElement("summary", "Full analysis"));
    summary.parentElement = details;
    const restore = installFakeEnvironment(document);
    let notified = 0; let renderedState = !desiredOpen;
    try {
      globalThis.__retainDetails = () => {
        details.addEventListener("toggle", () => { notified++; renderedState = details.open; });
        document.documentElement.dataset.nexualphaHydrated = "true";
      };
      Function(await bootstrapScriptForTest("globalThis.__retainDetails();"))();
      const click = new FakeEvent("click", { bubbles: true }); click.target = summary;
      document.dispatchDocumentEvent(click);
      details.open = desiredOpen; // native activation happens before React's listener exists
      await flushAsyncWork(); restore.runTimers(); await flushAsyncWork();
      assert.equal(details.open, desiredOpen);
      assert.equal(renderedState, desiredOpen, "controlled label must match the retained native state");
      assert.equal(notified, 1, "one synchronization, no second activation");
      assert.equal(summary.clickCount, 0, "restoration must not replay the summary click");
    } finally { delete globalThis.__retainDetails; restore(); }
  });
}

test("changed details restoration uses its native toggle without duplicate synchronization", async () => {
 const document = new FakeDocument(); const details = document.add(new FakeElement("details"));
 details.open=false; const summary=document.add(new FakeElement("summary","Full analysis")); summary.parentElement=details;
 const restore=installFakeEnvironment(document); let notified=0; let value=true;
 try {
  globalThis.__changeDetails=()=>{
   Object.defineProperty(details,"open",{get:()=>value,set:v=>{if(value!==v){value=v;details.dispatchEvent(new FakeEvent("toggle"));}},configurable:true});
   details.addEventListener("toggle",()=>notified++);document.documentElement.dataset.nexualphaHydrated="true";
  };
  Function(await bootstrapScriptForTest("globalThis.__changeDetails();"))();
  const click=new FakeEvent("click",{bubbles:true});click.target=summary;document.dispatchDocumentEvent(click);
  details.open=false;await flushAsyncWork();restore.runTimers();await flushAsyncWork();
  assert.equal(details.open,false);assert.equal(notified,1);assert.equal(summary.clickCount,0);
 }finally{delete globalThis.__changeDetails;restore();}
});
