import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  publicStarterLevels,
  starterContent,
  starterHref,
  starterLevels,
} from "../src/data/starter/index.js";
import { starterSeo } from "../src/data/starter/seo.js";
import {
  STARTER_PROGRESS_KEY,
  checklistDone,
  completeLevel,
  quizPassed,
  readStarterProgress,
  writeStarterProgress,
} from "../src/data/starter/progress.js";

const sensitiveSlug = "p2p-and-bank-freeze";
const firstLevel = () => starterLevels[0];
const sensitiveLevel = () => starterLevels.find((level) => level.meta.slug === sensitiveSlug);

test("starter levels expose the public review gate and bilingual content", () => {
  assert.equal(starterLevels.length, 12);
  assert.equal(new Set(starterLevels.map((level) => level.meta.slug)).size, 12);
  assert.equal(publicStarterLevels(false).length, 11);
  assert.equal(publicStarterLevels(true).length, 12);
  assert.ok(!publicStarterLevels(false).some((level) => level.meta.slug === sensitiveSlug));
  assert.ok(publicStarterLevels(true).some((level) => level.meta.slug === sensitiveSlug));

  const zh = starterContent(firstLevel(), "zh-Hans");
  const en = starterContent(firstLevel(), "en");
  assert.ok(zh.title.includes("买") || zh.summary.includes("买"));
  assert.ok(en.title.length > 5);
  assert.equal(zh.points.length, firstLevel().scenes.length);
  assert.equal(en.points.length, firstLevel().scenes.length);
  assert.equal(zh.quiz.length, 3);
  assert.equal(en.quiz.length, 3);
  assert.ok(zh.checklist.length > 0);
  assert.ok(en.faq.length > 0);

  assert.equal(starterHref("", "zh-Hans"), "/zh-hans/starter");
  assert.equal(starterHref(firstLevel().meta.slug, "zh-Hans"), `/zh-hans/starter/${firstLevel().meta.slug}`);
  assert.equal(starterHref(firstLevel().meta.slug, "en"), `/starter/${firstLevel().meta.slug}`);
});

test("starter progress storage tolerates missing and malformed browser storage", () => {
  const dom = new JSDOM("", { url: "https://nexualpha.com/starter" });
  const storage = dom.window.localStorage;

  assert.deepEqual(readStarterProgress(storage), { completed: [], checklists: {}, answers: {} });
  assert.equal(writeStarterProgress(storage, {
    completed: [firstLevel().meta.slug],
    checklists: { [firstLevel().meta.slug]: [true, false] },
    answers: { [firstLevel().meta.slug]: [1, 2, 0] },
  }), true);

  assert.deepEqual(readStarterProgress(storage), {
    completed: [firstLevel().meta.slug],
    checklists: { [firstLevel().meta.slug]: [true, false] },
    answers: { [firstLevel().meta.slug]: [1, 2, 0] },
  });

  storage.setItem(STARTER_PROGRESS_KEY, JSON.stringify({
    completed: [firstLevel().meta.slug, firstLevel().meta.slug, "../bad", 42],
    checklists: { [firstLevel().meta.slug]: [true], "../bad": [true] },
    answers: { [firstLevel().meta.slug]: [0], bad: "not-array" },
  }));

  assert.deepEqual(readStarterProgress(storage), {
    completed: [firstLevel().meta.slug],
    checklists: { [firstLevel().meta.slug]: [true] },
    answers: { [firstLevel().meta.slug]: [0] },
  });

  storage.setItem(STARTER_PROGRESS_KEY, "{not json");
  assert.deepEqual(readStarterProgress(storage), { completed: [], checklists: {}, answers: {} });
});

test("starter completion helpers require either a passed quiz or a finished checklist", () => {
  const level = firstLevel();
  const correctAnswers = level.page.quiz.map((question) => question.options.indexOf(question.answer));
  assert.equal(quizPassed(level.page.quiz, correctAnswers), true);
  assert.equal(quizPassed(level.page.quiz, correctAnswers.with(0, -1)), false);
  assert.equal(quizPassed(level.page.quiz.slice(0, 2), correctAnswers), false);

  assert.equal(checklistDone(level.page.checklist_zh, level.page.checklist_zh.map(() => true)), true);
  assert.equal(checklistDone(level.page.checklist_zh, level.page.checklist_zh.map((_, index) => index !== 0)), false);
  assert.equal(checklistDone([], []), false);

  const completed = completeLevel({ completed: [level.meta.slug], checklists: {}, answers: {} }, level.meta.slug);
  assert.deepEqual(completed.completed, [level.meta.slug]);
});

test("starter SEO keeps reviewed public pages indexable and the legal-review level noindex", () => {
  const hub = starterSeo("/starter", "en", false);
  assert.equal(hub.robots, "index,follow");
  assert.ok(hub.title.length <= 60);
  assert.match(hub.description, /Starter Path|90 seconds|12/);
  assert.deepEqual(hub.alternates.map((item) => item.hreflang).sort(), ["en", "x-default", "zh-Hans"]);
  assert.ok(JSON.stringify(hub.schema).includes("CollectionPage"));
  assert.ok(!JSON.stringify(hub.schema).includes(sensitiveSlug));

  const publicLevel = starterSeo(`/starter/${firstLevel().meta.slug}`, "en", false);
  assert.equal(publicLevel.robots, "index,follow");
  assert.ok(publicLevel.title.length <= 60);
  assert.ok(JSON.stringify(publicLevel.schema).includes("BreadcrumbList"));
  assert.ok(JSON.stringify(publicLevel.schema).includes("FAQPage"));

  const gatedLevel = starterSeo(`/starter/${sensitiveSlug}`, "en", false);
  assert.equal(gatedLevel.robots, "noindex,follow");
  assert.equal(gatedLevel.status, 200);
  assert.ok(gatedLevel.canonical.endsWith(`/starter/${sensitiveSlug}`));

  const reviewedLevel = starterSeo(`/starter/${sensitiveLevel().meta.slug}`, "zh-Hans", true);
  assert.equal(reviewedLevel.robots, "index,follow");
  assert.ok(reviewedLevel.canonical.includes("/zh-hans/starter/"));
});
