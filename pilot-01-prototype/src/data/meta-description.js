// Search snippet budget (owner 2026-10-12, crawl budget/CTR work): keep route descriptions in the 120-160 character
// band when the source text allows it. Copy sources stay within budget; this clamp is the guarantee applied by
// the Worker (served HTML, og:description, twitter:description and the /api/route-seo payload) and by computeRouteSeo.
//
// Audit NX-09 (2026-10-11): the previous clamp cut at the last space inside the budget, so an article summary ended
// "…U.S. restriction, the Oct". A long text is now shortened, in order of preference, to:
//   1. the last complete sentence inside the budget (. ! ? 。！？; abbreviations such as "U.S." or "Oct." do not count);
//   2. the last clause break (; , ， 、 ； ：) that keeps at least 70% of the budget, followed by "…";
//   3. the last word gap (any character for CJK text), followed by "…".
// A cut never ends on a dangling article, preposition, conjunction, month name or number ("the", "of", "Oct", "9").
const CJK_TEXT = /[　-ヿ㐀-鿿가-힯＀-￯]/;
const ELLIPSIS = "…";
const META_DESCRIPTION_MAX = 160;
export const META_DESCRIPTION_MIN = 120;
const CLAUSE_BREAKS = new Set([";", ",", "，", "、", "；", "：", "—", "–"]);
const CLAUSE_MIN_SHARE = 0.7;
const TRAILING_PUNCTUATION = /[\s,;:，、；：\-–—(（[「『“"'‘«/&+]+$/u;

// Words that cannot end a description (lower-case). Latin-script UI locales; CJK cuts are guarded by punctuation.
const DANGLING_WORDS = new Set([
  // en
  "a", "an", "the", "of", "to", "in", "on", "at", "for", "from", "by", "with", "and", "or", "but", "nor", "as", "than",
  "that", "which", "who", "whose", "into", "onto", "via", "per", "vs", "versus", "about", "over", "under", "between",
  "including", "plus", "if", "when", "while", "before", "after", "since", "until", "its", "their", "your", "our", "is",
  "are", "was", "were", "be", "can", "will", "not", "no", "this", "these", "those", "such", "each", "every",
  // months (en)
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec", "january", "february",
  "march", "april", "june", "july", "august", "september", "october", "november", "december",
  // es / pt
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "y", "o", "e", "en", "con", "por", "para", "al",
  "que", "su", "sus", "sin", "o", "os", "as", "um", "uma", "do", "da", "dos", "das", "ou", "em", "no", "na", "nos", "nas",
  "com", "pelo", "pela", "ao", "à",
  // fr
  "le", "les", "une", "des", "du", "et", "au", "aux", "avec", "pour", "par", "sur", "dans", "ses", "son", "sa", "leur",
  "l’", "d’", "l'", "d'", "qu'", "qu’",
  // de
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "und", "oder", "mit", "von", "zu",
  "zum", "zur", "im", "am", "für", "auf", "bei", "aus", "nach", "vor", "über", "als", "wie",
  // it
  "il", "lo", "gli", "di", "della", "dello", "dei", "delle", "con", "per", "da", "dal", "dalla", "che", "tra", "fra",
  // id / tr / ru
  "dan", "atau", "di", "ke", "dari", "yang", "untuk", "dengan", "pada", "ve", "ile", "için", "bir", "veya",
  "и", "в", "во", "на", "с", "со", "по", "для", "от", "к", "о", "об", "из", "или", "а", "но",
]);
// Tokens before a "." that do not end a sentence ("U.S.", "e.g.", "Oct. 9", "No. 3").
const ABBREVIATIONS = new Set(["e.g", "i.e", "vs", "etc", "approx", "inc", "ltd", "co", "corp", "no", "mr", "mrs", "ms", "dr", "st",
  "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec", "u.s", "u.k", "u.s.a", "e.u"]);

/** Public metadata descriptions are budgeted to the same 160-character ceiling across locales. */
export function metaDescriptionLimit(locale, text) {
  void locale;
  void text;
  return META_DESCRIPTION_MAX;
}

function isSentenceEnd(value, index) {
  const ch = value[index];
  if ("。！？".includes(ch)) return true;
  if (!".!?".includes(ch)) return false;
  let next = index + 1;
  while (next < value.length && /["'”’)\]）」』]/u.test(value[next])) next += 1;
  if (next < value.length && !/\s/.test(value[next])) return false; // "0.08%", "x.com"
  if (ch !== ".") return true;
  const word = /([\p{L}\p{N}.]+)$/u.exec(value.slice(0, index))?.[1] || "";
  if (!word) return true;
  if (/^\p{Lu}$/u.test(word) || /^(\p{L}\.)+\p{L}$/u.test(word)) return false; // initials, "U.S"
  return !ABBREVIATIONS.has(word.toLowerCase());
}

/** Removes trailing punctuation and dangling words/numbers from a cut fragment. */
export function trimDanglingTail(fragment) {
  let text = String(fragment).replace(TRAILING_PUNCTUATION, "");
  for (let guard = 0; guard < 8; guard += 1) {
    const match = /(?:^|[\s(（“"'«])([^\s(（“"'«]+)$/u.exec(text);
    if (!match) break;
    const word = match[1].replace(/[.,;:!?)）”"'»]+$/u, "");
    const lower = word.toLowerCase();
    const dangling = DANGLING_WORDS.has(lower) || /^[$€£¥]?[\d.,:/%-]+$/u.test(word);
    if (!dangling || match.index === 0) break;
    text = text.slice(0, match.index + (match[0].length - match[1].length)).replace(TRAILING_PUNCTUATION, "");
  }
  return text;
}

/** Shortens `text` to the locale budget as a complete sentence, or a clean clause/word cut ending in "…". */
export function clampMetaDescription(text, locale) {
  const value = String(text ?? "").replace(/\s+/g, " ").trim();
  const limit = metaDescriptionLimit(locale, value);
  const cjk = CJK_TEXT.test(value);
  if (value.length <= limit) {
    if (value.endsWith(ELLIPSIS)) return value;
    for (let i = value.length - 1; i > 0; i -= 1) {
      if (!isSentenceEnd(value, i)) continue;
      let end = i + 1;
      while (end < value.length && /["'”’)\]）」』]/u.test(value[end])) end += 1;
      if (end >= value.length) return value;
      const sentence = value.slice(0, end).trim();
      if (sentence.length >= 20 || cjk) return sentence;
      break;
    }
    return value;
  }

  // 1. Last complete sentence inside the budget.
  for (let i = limit - 1; i > 0; i -= 1) {
    if (isSentenceEnd(value, i)) {
      let end = i + 1;
      while (end < value.length && end < limit && /["'”’)\]）」』]/u.test(value[end])) end += 1;
      const sentence = value.slice(0, end).trim();
      if (sentence.length >= 20 || cjk) return sentence;
      break;
    }
  }

  const budget = limit - ELLIPSIS.length;
  const withEllipsis = (fragment) => {
    const trimmed = trimDanglingTail(fragment);
    return trimmed ? `${trimmed}${ELLIPSIS}` : "";
  };
  // 2. Last clause break that keeps at least 70% of the budget.
  for (let i = budget; i >= Math.ceil(limit * CLAUSE_MIN_SHARE); i -= 1) {
    if (CLAUSE_BREAKS.has(value[i])) {
      const cut = withEllipsis(value.slice(0, i));
      if (cut.length >= limit * CLAUSE_MIN_SHARE) return cut;
      break;
    }
  }
  // 3. Last word gap (CJK text may break between any two characters).
  let cut = budget;
  if (!cjk) {
    const gap = value.lastIndexOf(" ", budget);
    if (gap > 0) cut = gap;
  }
  return withEllipsis(value.slice(0, cut)) || value.slice(0, budget) + ELLIPSIS;
}

/** True when a cut description ends on a word that leaves it hanging (used by tests and the article sweep). */
export function endsWithDanglingWord(description) {
  const value = String(description || "").trim();
  if (/[.!?。！？]["'”’)\]）」』]*$/u.test(value)) return false; // complete sentence
  const body = value.replace(/…$/u, "").trim();
  return TRAILING_PUNCTUATION.test(body) || trimDanglingTail(body) !== body;
}

// Title budget (owner decision 2026-10-12): generated search titles stay within 60 characters, or 32 actual
// characters for zh/ja/ko locales. Long titles first drop the trailing " — NexuAlpha" brand suffix, then shorten at a
// readable word or punctuation boundary when the source title still exceeds the locale cap.
const BRAND_SUFFIX = " — NexuAlpha";
export function titleDisplayWidth(text) {
  let width = 0;
  for (const ch of String(text || "")) width += /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/u.test(ch) ? 2 : 1;
  return width;
}
export function titleBudgetForLocale(locale) {
  return /^(zh|ja|ko)(?:[-_]|$)/i.test(String(locale || "")) ? 32 : 60;
}
function truncateTitleToBudget(title, budget) {
  const value = String(title || "").trim();
  if (value.length <= budget) return value;
  const max = Math.max(1, budget - ELLIPSIS.length);
  const raw = value.slice(0, max + 1);
  const wordBoundary = Math.max(
    raw.lastIndexOf(" "),
    raw.lastIndexOf(":"),
    raw.lastIndexOf(";"),
    raw.lastIndexOf(","),
    raw.lastIndexOf("，"),
    raw.lastIndexOf("、"),
    raw.lastIndexOf("；"),
    raw.lastIndexOf("："),
  );
  const cut = wordBoundary >= Math.ceil(max * 0.7) ? wordBoundary : max;
  return `${value.slice(0, cut).replace(/[\s:;,.，、；：\-–—]+$/u, "")}${ELLIPSIS}`;
}
export function budgetTitle(title, budget = 60) {
  // These Chinese API articles share a 33-character English product prefix. Cutting it to the CJK
  // budget erased the actual subject (JWT reconnect, subscription failover, or user-feed limits).
  // Keep the product and protocol, then spend the snippet budget on the article's Chinese subject.
  const raw = String(title || "");
  const value = budget === 32 && raw.length > budget && /[\u3400-\u9fff]/u.test(raw)
    ? raw.replace(/^Coinbase Advanced Trade WebSocket\s*/, "Coinbase 进阶交易 WS ")
    : raw;
  const unbranded = value.endsWith(BRAND_SUFFIX) && titleDisplayWidth(value) > budget
    ? value.slice(0, -BRAND_SUFFIX.length)
    : value;
  return truncateTitleToBudget(unbranded, budget);
}

function plainMetaText(value) {
  return String(value || "")
    .replace(/\[([^\[\]\n]+)\]\([^()\s]*\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/^#{1,6}\s+.*$/gm, " ")
    .replace(/^\s*(?:[-*+] |\d+[.)]\s+)/gm, "")
    .replace(/^\s*\|.*\|\s*$/gm, " ")
    .replace(/[ \t]*\n[ \t]*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^["“”'‘’]+|["“”'‘’]+$/g, "")
    .trim();
}

function sentenceParts(text) {
  const clean = plainMetaText(text);
  const parts = [];
  let start = 0;
  for (let index = 0; index < clean.length; index += 1) {
    if (!isSentenceEnd(clean, index)) continue;
    const part = clean.slice(start, index + 1).trim();
    if (part) parts.push(part);
    start = index + 1;
  }
  const tail = clean.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

function descriptionFragment(text) {
  let fragment = text.slice(0, META_DESCRIPTION_MAX - ELLIPSIS.length);
  if (!CJK_TEXT.test(fragment)) {
    const boundary = fragment.lastIndexOf(" ");
    if (boundary >= META_DESCRIPTION_MIN) fragment = fragment.slice(0, boundary);
  }
  return trimDanglingTail(fragment);
}

function isBoilerplateMetaSentence(sentence) {
  const value = plainMetaText(sentence);
  return !value
    || /^本文只处理可由公开官方或机构来源支撑的决策问题/u.test(value)
    || /^本文最有价值的地方是克制/u.test(value)
    || /^本文不会把未知部分包装成/u.test(value)
    || /^用户应获得一个更清楚的核验路径/u.test(value)
    || /^来源地图的作用是把事实边界说清楚/u.test(value)
    || /^This article only handles/i.test(value)
    || /^This is not investment advice/i.test(value)
    || /^The source map clarifies/i.test(value);
}

export function isProblemMetaDescription(text) {
  const value = plainMetaText(text);
  return !value
    || value.length < 110
    || value.length > META_DESCRIPTION_MAX
    || /^["“”'‘’]/u.test(String(text || "").trim())
    || isBoilerplateMetaSentence(value)
    || value.includes("本文最有价值的地方是克制。");
}

function sectionAfter(markdown, headingPattern) {
  const value = String(markdown || "");
  const match = headingPattern.exec(value);
  if (!match) return "";
  const rest = value.slice(match.index + match[0].length);
  return rest.split(/\n#{1,6}\s+/)[0] || rest;
}

function articleMetaCandidates(article, locale, seed) {
  const content = article?.content?.[locale] || "";
  const summary = article?.summary?.[locale] || "";
  return [
    seed,
    sectionAfter(content, /^##\s+(?:Practical Takeaway|实用结论|實用結論)\s*$/imu),
    summary,
    content,
    article?.title?.[locale],
  ].filter(Boolean);
}

export function articleMetaDescription(article, locale, seed = "") {
  const cleanedSeed = plainMetaText(seed);
  if (!isProblemMetaDescription(seed) && cleanedSeed.length >= 110 && cleanedSeed.length <= META_DESCRIPTION_MAX) {
    return clampMetaDescription(cleanedSeed, locale);
  }
  const sentences = [];
  const seen = new Set();
  for (const candidate of articleMetaCandidates(article, locale, seed)) {
    for (const sentence of sentenceParts(candidate)) {
      const clean = plainMetaText(sentence);
      const key = clean.toLowerCase();
      if (!clean || seen.has(key) || isBoilerplateMetaSentence(clean)) continue;
      seen.add(key);
      sentences.push(clean);
    }
  }
  if (!sentences.length) return clampMetaDescription(seed || "Source-backed NexuAlpha research for account, fee and source checks.", locale);
  let description = "";
  for (const sentence of sentences) {
    const next = description ? `${description} ${sentence}` : sentence;
    if (next.length > META_DESCRIPTION_MAX) {
      if (description.length < META_DESCRIPTION_MIN) {
        const fragment = descriptionFragment(next);
        if (fragment.length > description.length) description = `${fragment}${ELLIPSIS}`;
      }
      break;
    }
    description = next;
    if (description.length >= META_DESCRIPTION_MIN) break;
  }
  if (description.length < META_DESCRIPTION_MIN) {
    const title = plainMetaText(article?.title?.[locale] || article?.title?.en || "");
    if (title) {
      const titleSentence = /[.!?。！？]$/u.test(title) ? title : `${title}.`;
      const next = `${description} ${titleSentence}`.trim();
      if (next.length <= META_DESCRIPTION_MAX) description = next;
      else {
        const fragment = descriptionFragment(next);
        if (fragment.length > description.length) description = `${fragment}${ELLIPSIS}`;
      }
    }
  }
  let finalDescription = clampMetaDescription(description, locale);
  if (finalDescription.length < META_DESCRIPTION_MIN) {
    const title = plainMetaText(article?.title?.[locale] || article?.title?.en || "");
    if (title) {
      const titleSentence = /[.!?。！？]$/u.test(title) ? title : `${title}.`;
      const next = `${finalDescription} ${titleSentence}`.trim();
      if (next.length <= META_DESCRIPTION_MAX) finalDescription = next;
      else {
        const fragment = descriptionFragment(next);
        if (fragment.length > finalDescription.length) finalDescription = `${fragment}${ELLIPSIS}`;
      }
    }
  }
  if (finalDescription.length < META_DESCRIPTION_MIN) {
    const title = plainMetaText(article?.title?.[locale] || article?.title?.en || "").replace(/[.!?。！？]+$/u, "");
    if (title) {
      const suffix = CJK_TEXT.test(title) || CJK_TEXT.test(finalDescription) ? `${title} 来源核验。` : `${title} source check.`;
      const next = `${finalDescription} ${suffix}`.trim();
      if (next.length <= META_DESCRIPTION_MAX) finalDescription = next;
      else {
        const fragment = descriptionFragment(next);
        if (fragment.length > finalDescription.length) finalDescription = `${fragment}${ELLIPSIS}`;
      }
    }
  }
  return finalDescription;
}

// Route meta descriptions are written per page family (coins, convert, academy, flash, activities, …). A short one is
// served as written: the old generic padding ("Use this NexuAlpha page to understand the route…" and its translations)
// was removed after the 2026-10-13 native-speaker QA — it read as machine boilerplate and wasted the snippet.
export function routeMetaDescription(title, description, locale) {
  const raw = plainMetaText(description);
  if (raw.length <= META_DESCRIPTION_MAX && !endsWithDanglingWord(raw)) return raw;
  return clampMetaDescription(raw, locale);
}
