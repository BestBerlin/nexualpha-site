/** Preserve the renderer's original blocks; choose a complete section boundary only. */
export function splitArticleReadingSections(content = "") {
  const blocks = String(content).split("\n\n").map((block) => block.trim()).filter(Boolean);
  const headings = [];
  let fence = null;
  for (const [index, block] of blocks.entries()) {
    for (const [lineIndex, line] of block.split("\n").entries()) {
      const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = { char: marker[1][0], length: marker[1].length };
        else if (marker[1][0] === fence.char && marker[1].length >= fence.length) fence = null;
        continue;
      }
      if (!fence && lineIndex === 0) {
        const heading = line.match(/^\s{0,3}(#{1,6})\s+\S/);
        if (heading) headings.push({ index, level: heading[1].length });
      }
    }
  }
  // A document H1 can be part of the intro; H2 marks its complete reading sections.
  const sectionLevel = headings.some((h) => h.level === 2) ? 2 : Math.min(...headings.map((h) => h.level));
  const sections = headings.filter((h) => h.level === sectionLevel);
  let boundary = blocks.length;
  // Without section structure, show a whole opening paragraph rather than the entire article.
  if (!sections.length || (sectionLevel === 1 && sections.length === 1)) {
    boundary = Math.min(1, blocks.length);
    if (blocks[0] && /^\s{0,3}#\s+[^\n]+$/.test(blocks[0]) && blocks.length > 1) boundary = 2;
    let openingFence = null;
    for (let index = 0; index < boundary; index++) {
      for (const line of blocks[index].split("\n")) {
        const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
        if (!marker) continue;
        if (!openingFence) openingFence = { char: marker[1][0], length: marker[1].length };
        else if (marker[1][0] === openingFence.char && marker[1].length >= openingFence.length) openingFence = null;
      }
      if (index === boundary - 1 && openingFence && boundary < blocks.length) boundary++;
    }
    return { leadBlocks: blocks.slice(0, boundary), deepBlocks: blocks.slice(boundary) };
  }
  if (sections.length) {
    if (sections[0].index > 0 && blocks.slice(0, sections[0].index).some((block) => !/^\s{0,3}#{1,6}\s+[^\n]+$/.test(block))) boundary = sections[0].index;
    else boundary = sections[1]?.index ?? blocks.length;
  }
  return { leadBlocks: blocks.slice(0, boundary), deepBlocks: blocks.slice(boundary) };
}
