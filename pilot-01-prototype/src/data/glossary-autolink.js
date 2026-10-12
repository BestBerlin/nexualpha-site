// Glossary auto-linking (2026-10-13): finds the first plain-text mention of glossary terms in a text and returns segments
// (strings and { slug, text } links). Used at build time for cross-links inside term pages, and at render time for news
// articles and academy transcripts (cap 5 links per page). Data per locale: glossary-links-<locale>.js, [[slug, [forms]]].
// Matching: acronyms (KYC, DeFi, PoS…) are case-sensitive; other Latin forms ignore case and need letter boundaries; CJK
// forms match inside running text (no word spaces in zh/ja).

const CJK = /[぀-ヿ㐀-鿿가-힯豈-﫿]/;
const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isAcronym = (form) => /^[A-Za-z0-9-]{2,6}$/.test(form) && (form.match(/[A-Z]/g) || []).length >= 2;

const compiled = new WeakMap();
function compile(entries) {
  if (compiled.has(entries)) return compiled.get(entries);
  const bySurface = new Map();
  const groups = { acronym: [], latin: [], cjk: [] };
  for (const [slug, forms] of entries) {
    for (const form of forms) {
      if (!form) continue;
      const key = isAcronym(form) ? form : form.toLowerCase();
      if (!bySurface.has(key)) bySurface.set(key, slug);
      (isAcronym(form) ? groups.acronym : CJK.test(form) ? groups.cjk : groups.latin).push(form);
    }
  }
  const alt = (list) => [...new Set(list)].sort((a, b) => b.length - a.length).map(escapeRe).join("|");
  const B = "(?<![\\p{L}\\p{N}])", E = "(?![\\p{L}\\p{N}])";
  const result = {
    bySurface,
    patterns: [
      groups.acronym.length ? new RegExp(`${B}(?:${alt(groups.acronym)})${E}`, "gu") : null,
      groups.latin.length ? new RegExp(`${B}(?:${alt(groups.latin)})${E}`, "giu") : null,
      groups.cjk.length ? new RegExp(`(?:${alt(groups.cjk)})`, "gu") : null,
    ].filter(Boolean),
  };
  compiled.set(entries, result);
  return result;
}

/**
 * createGlossaryLinker(entries, { max, exclude }) → { linkText(text) → segments, linked() → slugs }.
 * Each slug is linked once (its first mention); at most `max` links in total across every call on this linker.
 */
export function createGlossaryLinker(entries, { max = 5, exclude = [] } = {}) {
  const { bySurface, patterns } = compile(entries || []);
  const done = new Set(exclude);
  const linked = [];
  const slugOf = (text) => bySurface.get(text) || bySurface.get(text.toLowerCase()) || null;
  function linkText(text) {
    const value = String(text ?? "");
    if (!value || linked.length >= max || !patterns.length) return [value];
    const out = [];
    let cursor = 0;
    while (cursor < value.length && linked.length < max) {
      let best = null;
      for (const pattern of patterns) {
        pattern.lastIndex = cursor;
        let match;
        while ((match = pattern.exec(value))) {
          const slug = slugOf(match[0]);
          if (slug && !done.has(slug)) { if (!best || match.index < best.index || (match.index === best.index && match[0].length > best.text.length)) best = { index: match.index, text: match[0], slug }; break; }
          if (match[0].length === 0) pattern.lastIndex += 1;
        }
      }
      if (!best) break;
      if (best.index > cursor) out.push(value.slice(cursor, best.index));
      out.push({ slug: best.slug, text: best.text });
      done.add(best.slug);
      linked.push(best.slug);
      cursor = best.index + best.text.length;
    }
    if (cursor < value.length) out.push(value.slice(cursor));
    return out;
  }
  return { linkText, linked: () => [...linked] };
}
