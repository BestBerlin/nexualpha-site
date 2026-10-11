// De-duplicates display strings by their normalized text (whitespace, case and trailing punctuation ignored), keeping the
// first occurrence and its original spelling. Used where two copy sources are merged into one list (audit NX-07: the
// French and Arabic eligibility lists repeated the same checks).
export const textEntryKey = (value) => String(value).replace(/\s+/g, " ").trim().replace(/[.。．!！]+$/u, "").toLocaleLowerCase();

export function uniqueTextEntries(values) {
  const seen = new Set();
  const out = [];
  for (const value of Array.isArray(values) ? values : []) {
    if (typeof value !== "string" || !value.trim()) continue;
    const key = textEntryKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}
