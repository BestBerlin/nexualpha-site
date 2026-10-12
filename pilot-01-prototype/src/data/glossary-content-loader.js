// Glossary content loaders (2026-10-13): the browser asks the route module cache for "./data/glossary-…" paths; App.jsx
// resolves them through this chunk, so the 160+ per-locale loaders live here instead of in the browser entry.
const MODULES = import.meta.glob(["./glossary-index-*.js", "./glossary-shard-*.js", "./glossary-links-*.js"]);

export function loadGlossaryModule(path) {
  const load = MODULES[String(path).replace(/^\.\/data\//, "./")];
  if (!load) return Promise.reject(new Error(`Unknown glossary module ${path}`));
  return load();
}
