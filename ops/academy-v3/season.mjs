// Season 1 production list ("Sam's First Crypto Lesson"). Scripts default to every episode;
// pass explicit ids (e.g. `node from-v3.mjs E01 E02`) to work in batches.
export const ALL_EPISODES = Array.from({ length: 24 }, (_, i) => `E${String(i + 1).padStart(2, '0')}`);
export const SAMPLE_EPISODES = ['E05', 'E09', 'E21'];
export function parseEpisodeList(value) {
  const ids = String(value ?? '').split(/[\s,]+/).filter(Boolean);
  for (const id of ids) if (!ALL_EPISODES.includes(id)) throw new Error(`Unknown episode id: ${id}`);
  return ids;
}
