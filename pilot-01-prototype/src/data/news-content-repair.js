// Deterministic repairs for news-feed text (links-l10n lane 2026-10-11; scorecard C4). Shared by the feed importer
// (new content), scripts/repair-news-feed-content.mjs (existing feed files) and the renderers' normalizers (a guard, so
// a feed that has not been repaired yet still never shows the defects). Nothing here invents text: a truncated summary
// is completed only from the same locale's article body, otherwise cut back to its last complete sentence.

const TERMINAL = /[.!?。！？…)"”’»」』%]$/;
const SENTENCE_END = /[。！？]|[.!?](?=\s|$|["”’」』)])/g;
const LOCAL_PATH_TARGET = /^(?:\/Users\/|\/Volumes\/|\/home\/|\/private\/|\/tmp\/|\/var\/folders\/|file:|[A-Za-z]:\\|~\/)/;

const cleanString = (value) => (typeof value === "string" ? value : "");

/** Plain-text fields (title, summary, description) are shown literally: unwrap [label](url), drop ** and ` markers. */
export function stripPlainMarkdown(text) {
  return cleanString(text)
    .replace(/\[([^\[\]\n]+)\]\([^()\s]*\)/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1");
}

/** Markdown links whose target is a local filesystem path become their label (the path never reaches a page). */
export function unwrapLocalPathLinks(markdown) {
  return cleanString(markdown).replace(/\[((?:[^\[\]\n]|\[[^\[\]\n]*\])+)\]\(\s*([^()\s]+)\s*\)/g, (whole, label, target) => (LOCAL_PATH_TARGET.test(target) ? label : whole));
}

function plainBody(markdown) {
  return stripPlainMarkdown(unwrapLocalPathLinks(markdown)).replace(/^#{1,6}\s+/gm, "").replace(/\s+/g, " ");
}

/**
 * A summary that stops mid-sentence (no terminal punctuation; older imports cut at 260 characters) is completed from
 * the body when the body contains its last words: the rest of that sentence is appended (at most `maxExtension`
 * characters). Otherwise it is cut back to its last complete sentence when that keeps at least half of it, or closed
 * with an ellipsis. Complete summaries are returned unchanged.
 */
export function repairTruncatedSummary(summary, body = "", { maxExtension = 220 } = {}) {
  const text = stripPlainMarkdown(summary).trim();
  if (!text || TERMINAL.test(text)) return text;
  const plain = plainBody(body);
  const flat = text.replace(/\s+/g, " ");
  for (const size of [40, 25, 14]) {
    const tail = flat.slice(-size);
    if (tail.length < size) continue;
    const index = plain.indexOf(tail);
    if (index < 0 || plain.indexOf(tail, index + 1) >= 0) continue;
    const rest = plain.slice(index + tail.length);
    SENTENCE_END.lastIndex = 0;
    const end = SENTENCE_END.exec(rest);
    if (end && end.index + 1 <= maxExtension) return `${flat}${rest.slice(0, end.index + 1)}`.trim();
  }
  SENTENCE_END.lastIndex = 0;
  let last = -1;
  for (const match of flat.matchAll(SENTENCE_END)) last = match.index;
  if (last >= 0 && last + 1 >= flat.length / 2) return flat.slice(0, last + 1).trim();
  return `${flat.replace(/[\s,;:，；：、]+$/, "")}…`;
}

const localizedEntries = (value) => (value && typeof value === "object" ? Object.entries(value).filter(([, text]) => typeof text === "string") : []);

/**
 * Repairs one raw feed article. Returns { article, changes } where `changes` lists [field, locale, before, after];
 * `article` is a new object only when something changed.
 */
export function repairNewsArticle(article) {
  if (!article || typeof article !== "object") return { article, changes: [] };
  const changes = [];
  const next = { ...article };
  const content = {};
  for (const [locale, markdown] of localizedEntries(article.content)) {
    const repaired = unwrapLocalPathLinks(markdown);
    if (repaired !== markdown) changes.push(["content", locale, "local-path link", "label only"]);
    content[locale] = repaired;
  }
  if (Object.keys(content).length) next.content = { ...article.content, ...content };
  for (const field of ["title", "summary"]) {
    const values = {};
    for (const [locale, text] of localizedEntries(article[field])) {
      const repaired = field === "summary" ? repairTruncatedSummary(text, next.content?.[locale]) : stripPlainMarkdown(text).trim();
      if (repaired !== text.trim()) changes.push([field, locale, text, repaired]);
      values[locale] = repaired;
    }
    if (Object.keys(values).length) next[field] = { ...article[field], ...values };
  }
  if (article.seo && typeof article.seo === "object" && typeof article.seo.description === "string") {
    const repaired = repairTruncatedSummary(article.seo.description, next.content?.en);
    if (repaired !== article.seo.description.trim()) {
      changes.push(["seo.description", "en", article.seo.description, repaired]);
      next.seo = { ...article.seo, description: repaired };
    }
  }
  return { article: changes.length ? next : article, changes };
}
