import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { starterLevels, starterContent } from "../src/data/starter/index.js";
import { STARTER_PROGRESS_KEY } from "../src/data/starter/progress.js";

test("checklist and quiz interactions persist completion across remounts and locales", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://nexualpha.com/starter" });
  const globals = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", logLevel: "silent" });
  let root;
  try {
    const { StarterPage } = await server.ssrLoadModule("/src/components/starter/StarterPage.jsx");
    const mount = async props => {
      if (root) await React.act(async () => root.unmount());
      root = createRoot(document.getElementById("root"));
      await React.act(async () => root.render(React.createElement(StarterPage, props)));
    };
    const click = async node => React.act(async () => node.click());
    const first = starterLevels[0];
    await mount({ slug: first.meta.slug });
    for (const checkbox of document.querySelectorAll('.starter-checklist input')) await click(checkbox);
    assert.match(document.querySelector('.starter-progress').textContent, /1 \/ 11/);
    assert.match(document.body.textContent, /Level complete/);
    assert.deepEqual(JSON.parse(dom.window.localStorage.getItem(STARTER_PROGRESS_KEY)).completed, [first.meta.slug]);
    await mount({ locale: "zh-Hans" });
    assert.match(document.querySelector('.starter-progress').textContent, /1 \/ 11/);
    assert.equal(document.querySelector('[data-cta-placement="starter-continue"]').getAttribute('href'), `/zh-hans/starter/${starterLevels[1].meta.slug}`);
    await mount({ slug: first.meta.slug, locale: "zh-Hans" });
    assert.ok([...document.querySelectorAll('.starter-checklist input')].every(input => input.checked));
    const second = starterLevels[1];
    await mount({ slug: second.meta.slug });
    const questions = starterContent(second, "en").quiz;
    const fields = [...document.querySelectorAll('.starter-quiz')];
    const correct = questions[0].options.indexOf(questions[0].answer);
    await click(fields[0].querySelectorAll('input')[(correct + 1) % questions[0].options.length]);
    assert.match(fields[0].textContent, /Try again/);
    assert.ok(fields[0].textContent.includes(questions[0].why));
    for (const [index, question] of questions.entries()) await click(fields[index].querySelectorAll('input')[question.options.indexOf(question.answer)]);
    assert.match(document.querySelector('.starter-progress').textContent, /2 \/ 11/);
    await mount({});
    assert.match(document.querySelector('.starter-progress').textContent, /2 \/ 11/);
    assert.equal(document.querySelector('[data-cta-placement="starter-continue"]').getAttribute('href'), `/starter/${starterLevels[2].meta.slug}`);
  } finally {
    if (root) await React.act(async () => root.unmount());
    await server.close();
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
