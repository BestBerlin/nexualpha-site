import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import productionFeed from "../public/content/news-feed.json" with { type: "json" };
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { articleMetaDescription, isProblemMetaDescription, titleBudgetForLocale } from "../src/data/meta-description.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { newsArticleAvailableLocales, normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { routeMetadata } from "../worker/index.js";

const articles = normalizeNewsFeed(productionFeed).filter((article) => article.seo?.noindex === false);
const feedEnv = {
  ASSETS: {
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === "/content/news-feed.json") return Response.json(productionFeed);
      return new Response("missing", { status: 404 });
    },
  },
};

const localizedNewsPath = (article, locale) => (
  locale === "en"
    ? `/news/${article.slug}`
    : `/${locale.toLowerCase()}/news/${article.slug}`
);

function assertMetadataBudget({ label, title, description, locale, requiresExpansion = true }) {
  const min = requiresExpansion ? 120 : 110;
  assert.ok(description.length >= min, `${label}: description ${description.length} < ${min}: ${description}`);
  assert.ok(description.length <= 160, `${label}: description ${description.length} > 160: ${description}`);
  assert.ok(title.length <= titleBudgetForLocale(locale), `${label}: title ${title.length} > ${titleBudgetForLocale(locale)}: ${title}`);
  assert.doesNotMatch(description, /本文最有价值的地方是克制。/, `${label}: zh-Hans boilerplate leaked`);
  assert.doesNotMatch(description, /^["“”'‘’]/u, `${label}: leading quote leaked`);
}

test("generated article metadata budgets every published article locale in computeRouteSeo", () => {
  assert.ok(articles.length >= 300, `expected production article coverage, got ${articles.length}`);
  for (const article of articles) {
    for (const locale of newsArticleAvailableLocales(article)) {
      const pathname = `/news/${article.slug}`;
      const seo = computeRouteSeo({ url: localizedNewsPath(article, locale), pathname, locale, article });
      const seed = locale === "en" && article.seo?.description ? article.seo.description : article.summary?.[locale];
      assertMetadataBudget({
        label: `${article.slug} ${locale}`,
        title: seo.title,
        description: seo.description,
        locale: seo.locale,
        requiresExpansion: isProblemMetaDescription(seed),
      });
    }
  }
});

test("Worker metadata applies generated article budgets from the production feed", async () => {
  assert.ok(articles.length >= 300, `expected production article coverage, got ${articles.length}`);
  for (const article of articles) {
    for (const locale of newsArticleAvailableLocales(article)) {
      const path = localizedNewsPath(article, locale);
      const metadata = await routeMetadata(new URL(`https://nexualpha.com${path}`), feedEnv);
      assert.equal(metadata.status, 200, `${path}: status`);
      const seed = locale === "en" && article.seo?.description ? article.seo.description : article.summary?.[locale];
      assertMetadataBudget({
        label: `worker ${article.slug} ${locale}`,
        title: metadata.title,
        description: metadata.description,
        locale: metadata.locale,
        requiresExpansion: isProblemMetaDescription(seed),
      });
    }
  }
});

test("zh-Hans boilerplate summaries are rebuilt as seven distinct article-owned snippets", () => {
  const generated = Array.from({ length: 7 }, (_, index) => {
    const subject = `API 控制场景 ${index + 1}`;
    const article = {
      title: {
        en: `${subject} source review`,
        "zh-Hans": `${subject} 来源核验`,
      },
      summary: {
        en: `Source review for ${subject}, account boundaries, permissions and next verification steps before any user action.`,
        "zh-Hans": `本文最有价值的地方是克制。${subject} 应把公开来源、账户边界、权限范围和后续核验步骤拆开说明，不能把未知项写成承诺。这份研究还区分已经确认的公开事实、基于来源的判断和仍然缺失的证据，逐项列出需要用户在实际账户中复核的条件，帮助读者明确下一步检查顺序，避免把平台名称或单个费用数字当作完整结论。`,
      },
      content: {
        en: `## Practical Takeaway\n\n${subject} needs source review, account-boundary checks, permission review and next verification steps before a user acts.`,
        "zh-Hans": `## 实用结论\n\n${subject} 应把公开来源、账户边界、权限范围和后续核验步骤拆开说明，不能把未知项写成承诺。这份研究还区分已经确认的公开事实、基于来源的判断和仍然缺失的证据，逐项列出需要用户在实际账户中复核的条件，帮助读者明确下一步检查顺序，避免把平台名称或单个费用数字当作完整结论。`,
      },
    };
    return articleMetaDescription(article, "zh-Hans", article.summary["zh-Hans"]);
  });

  assert.equal(new Set(generated).size, 7, generated.join("\n"));
  for (const description of generated) {
    assert.ok(description.length >= 120 && description.length <= 160, `${description.length}: ${description}`);
    assert.doesNotMatch(description, /本文最有价值的地方是克制。/);
  }
});

test("built prerender manifest routes keep Worker metadata budgets", async (t) => {
  const root = path.resolve(import.meta.dirname, "..");
  let manifest;
  let newsFeedText;
  try {
    manifest = JSON.parse(await readFile(path.join(root, "dist", "client", "prerender-manifest.json"), "utf8"));
    newsFeedText = await readFile(path.join(root, "dist", "client", "content", "news-feed.json"), "utf8");
  } catch (error) {
    t.skip(`dist build manifest unavailable: ${error.message}`);
    return;
  }
  const distEnv = {
    ASSETS: {
      fetch: async (request) => {
        const url = new URL(request.url);
        if (url.pathname === "/content/news-feed.json") return new Response(newsFeedText, { headers: { "content-type": "application/json" } });
        return new Response("missing", { status: 404 });
      },
    },
  };
  const deficits = [];
  for (const route of Object.values(manifest.routes)) {
    const pathname = localizedPath(route.pathname, route.locale);
    const metadata = await routeMetadata(new URL(`https://nexualpha.com${pathname}`), distEnv);
    if (metadata.status !== 200) continue;
    const min = metadata.description.length < 110 ? "under110" : null;
    const over = metadata.description.length > 160 ? "over160" : null;
    const longTitle = metadata.title.length > titleBudgetForLocale(metadata.locale) ? "title" : null;
    if (min || over || longTitle) {
      deficits.push({ pathname, locale: route.locale, kind: min || over || longTitle, title: metadata.title, description: metadata.description });
    }
  }
  assert.deepEqual(deficits, []);
});


test("article snippet extraction preserves decimal fees, domains and unique sentences", () => {
  const article = { summary: { en: "Review the published 0.04% fee at example.com." }, content: { en: "## Source checks\n\nReview account eligibility, product restrictions and source dates before using the route. A separate check covers funding and withdrawal conditions." } };
  const snippet = articleMetaDescription(article, "en", article.summary.en);
  assert.match(snippet, /0\.04%/);
  assert.match(snippet, /example\.com/);
  assert.doesNotMatch(snippet, /Source checks/);
  assert.equal(snippet.split("Review the published").length - 1, 1);
  assert.ok(snippet.length >= 120 && snippet.length <= 160);
});
