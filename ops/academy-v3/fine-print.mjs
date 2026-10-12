// Owner rule (2026-10-12): no fine print on any frame — no disclaimers, data caveats, commission or
// availability notes, "terms apply". Spoken script lines (captions) are dialogue and are not filtered.
// Applies to every locale: add the localized phrasing here when a new locale ships.
export const FINE_PRINT = [
  /not (?:investment|financial) advice/i,
  /fictional|teaching (?:assumption|model|illustration|risk line|example)|for illustration|\(example\)|example only/i,
  /not (?:a )?live price|real platform rate|not any exchange'?s real rules|not exchange rules/i,
  /terms (?:and conditions )?apply|commission|availability depends|depends on your country|partner link|analogy only/i,
  /非投资建议|不构成投资建议|虚构|教学示意|教学模型|教学假设|非实时价格|非交易所规则|佣金|合作推广|是否可用取决于|条款适用|仅帮助理解/,
];

export const isFinePrint = (text) => FINE_PRINT.some((pattern) => pattern.test(String(text ?? '')));

export function assertNoFinePrint(text, where = 'frame') {
  const hit = FINE_PRINT.find((pattern) => pattern.test(String(text ?? '')));
  if (hit) throw new Error(`Fine print is not allowed on frames (${where}): "${String(text).match(hit)[0]}"`);
}
