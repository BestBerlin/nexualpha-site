// Search snippet budget (owner 2026-10-10, GSC CTR work): Google shows about 160 Latin characters, about 80 for
// zh/ja/ko, before truncating with an ellipsis. Copy sources stay within budget; this clamp is the guarantee applied by
// the Worker (served HTML, og:description, twitter:description and the /api/route-seo payload) and by computeRouteSeo.
//
// Audit NX-09 (2026-10-11): the previous clamp cut at the last space inside the budget, so an article summary ended
// "…U.S. restriction, the Oct". A long text is now shortened, in order of preference, to:
//   1. the last complete sentence inside the budget (. ! ? 。！？; abbreviations such as "U.S." or "Oct." do not count);
//   2. the last clause break (; , ， 、 ； ：) that keeps at least 70% of the budget, followed by "…";
//   3. the last word gap (any character for CJK text), followed by "…".
// A cut never ends on a dangling article, preposition, conjunction, month name or number ("the", "of", "Oct", "9").
const CJK_META_LOCALE = /^(zh|ja|ko)(?:[-_]|$)/i;
const CJK_TEXT = /[　-ヿ㐀-鿿가-힯＀-￯]/;
const ELLIPSIS = "…";
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

/** 80 for zh/ja/ko text; English fallback copy served under a CJK locale keeps the 160 budget. */
export function metaDescriptionLimit(locale, text) {
  if (!CJK_META_LOCALE.test(String(locale || ""))) return 160;
  return text == null || CJK_TEXT.test(String(text)) ? 80 : 160;
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
  if (value.length <= limit) return value;
  const cjk = CJK_TEXT.test(value) && CJK_META_LOCALE.test(String(locale || ""));

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

// Title budget (owner decision 2026-10-11): search results show roughly 60 characters of a title (about 30 for
// CJK, which renders double-width), and the site name already appears separately from the WebSite/Organization
// schema. Long titles therefore drop the trailing " — NexuAlpha" brand suffix instead of letting it be cut to "…";
// short titles keep it. The title text itself is never shortened here.
const BRAND_SUFFIX = " — NexuAlpha";
export function titleDisplayWidth(text) {
  let width = 0;
  for (const ch of String(text || "")) width += /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/u.test(ch) ? 2 : 1;
  return width;
}
export function budgetTitle(title, budget = 60) {
  const value = String(title || "");
  if (!value.endsWith(BRAND_SUFFIX)) return value;
  return titleDisplayWidth(value) > budget ? value.slice(0, -BRAND_SUFFIX.length) : value;
}
