// Search snippet budget (owner 2026-10-10, GSC CTR work): Google shows about 160 Latin characters, about 80 for
// zh/ja/ko, before truncating with an ellipsis. Copy sources stay within budget; this clamp is the guarantee applied by
// the Worker (served HTML) and by computeRouteSeo (client navigation), so both emit the same description.
const CJK_META_LOCALE = /^(zh|ja|ko)(?:[-_]|$)/i;
const META_SENTENCE_END = "。！？";
const META_CLAUSE_BREAK = /[\s,;:，、；：]/;
const META_TRAILING_FRAGMENT = /[\s,;:，、；：\-–—(（「“"'«]+$/u;

const CJK_TEXT = /[\u3000-\u30ff\u3400-\u9fff\uac00-\ud7af\uff00-\uffef]/;
/** 80 for zh/ja/ko text; English fallback copy served under a CJK locale keeps the 160 budget. */
export function metaDescriptionLimit(locale, text) {
  if (!CJK_META_LOCALE.test(String(locale || ""))) return 160;
  return text == null || CJK_TEXT.test(String(text)) ? 80 : 160;
}

/** Cuts `text` to the locale budget at a sentence end, clause break or word gap, never leaving a dangling fragment. */
export function clampMetaDescription(text, locale) {
  const value = String(text ?? "").replace(/\s+/g, " ").trim();
  const limit = metaDescriptionLimit(locale, value);
  if (value.length <= limit) return value;
  let cut = -1;
  for (let i = limit - 1; i > 0; i -= 1) {
    const ch = value[i];
    const next = value[i + 1];
    if (META_SENTENCE_END.includes(ch) || (".!?".includes(ch) && (next === undefined || /\s/.test(next)))) { cut = i + 1; break; }
    if (META_CLAUSE_BREAK.test(ch)) { cut = i; break; }
  }
  if (cut < 0) cut = limit;
  return value.slice(0, cut).replace(META_TRAILING_FRAGMENT, "");
}
