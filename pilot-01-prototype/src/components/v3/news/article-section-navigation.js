// Match the existing block renderer exactly; do not add Markdown parsing.
export function articleSectionTargets(blocks, hasSources, leadCount = 0, sourcesLabel = 'Sources') {
  const targets = blocks.flatMap((block, index) => block.startsWith('## ')
    ? [{ id: `article-section-${index}`, label: block.replace(/^## /, ''), deep: index >= leadCount }]
    : []);
  if (hasSources) targets.push({ id: 'article-sources', label: sourcesLabel, deep: false });
  return targets;
}
export function activateArticleSection(id, disclosure, setOpen, documentRef, windowRef) {
  const target = documentRef.getElementById(id);
  if (!target) return false;
  if (disclosure?.contains(target)) { disclosure.open = true; setOpen(true); }
  windowRef.requestAnimationFrame(() => { target.scrollIntoView({ block: 'start', behavior: 'instant' }); target.focus({ preventScroll: true }); });
  return true;
}
