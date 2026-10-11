/**
 * Drop heading-only blocks that have no content before the next heading of the same or a higher level, or before the
 * end of the article (SEO audit 2026-10-11 #6: an empty heading reads as an unfinished page to readers and extractors).
 * A heading followed by its own sub-headings is kept. Fenced code is left untouched.
 */
export function dropEmptyArticleHeadings(content = "") {
  if (typeof content !== "string" || !content) return content;
  const blocks = content.split("\n\n");
  const headingLevel = (block) => {
    const trimmed = String(block).trim();
    if (!trimmed || trimmed.includes("\n")) return 0;
    const match = trimmed.match(/^\s{0,3}(#{1,6})\s+\S/);
    return match ? match[1].length : 0;
  };
  let inFence = false;
  const keep = blocks.map(() => true);
  for (let index = 0; index < blocks.length; index++) {
    const fences = (blocks[index].match(/^\s{0,3}(?:`{3,}|~{3,})/gm) || []).length;
    const level = inFence ? 0 : headingLevel(blocks[index]);
    if (fences % 2 === 1) inFence = !inFence;
    if (!level) continue;
    let next = index + 1;
    while (next < blocks.length && !blocks[next].trim()) next++;
    const nextLevel = next < blocks.length ? headingLevel(blocks[next]) : 0;
    if (next >= blocks.length || (nextLevel && nextLevel <= level)) keep[index] = false;
  }
  return blocks.filter((_, index) => keep[index]).join("\n\n");
}
