import { fileURLToPath } from 'node:url';
import { readFile, writeFile, rename } from 'node:fs/promises';
export const overridesFile = new URL('../../src/data/seo-autopilot-overrides.json', import.meta.url);
export async function readOverrides(file = overridesFile) { return JSON.parse(await readFile(file, 'utf8')); }
export async function writeJson(file, value) {
  const temp = `${file instanceof URL ? fileURLToPath(file) : file}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temp, file);
}
export function guardProposal(p, overrides = {}, existingTitles = []) {
  const errors = [];
  if (!Number.isFinite(p.position) || p.position <= 8) errors.push('protected-position');
  if (!p.eligible) errors.push('ineligible-route');
  if (!['title', 'description'].includes(p.action)) errors.push('unsupported-action');
  const value = p.action === 'description' ? p.proposedDescription : p.proposedTitle;
  const [min, max] = p.action === 'description' ? [70, 160] : [25, 70];
  if (typeof value !== 'string' || value.length < min || value.length > max) errors.push('length');
  if (!p.brand || !value?.toLowerCase().includes(p.brand.toLowerCase())) errors.push('missing-brand');
  if (value?.includes('$')) errors.push('unverified-amount');
  const values = [...existingTitles, ...Object.entries(overrides).filter(([key]) => key !== p.pathname).map(([, o]) => o[p.action]?.[p.locale || 'en'])];
  if (values.some((v) => v && v.toLowerCase() === value?.toLowerCase())) errors.push('duplicate');
  if (overrides[p.pathname]?.revert) errors.push('pending-revert');
  return errors;
}
export function applyProposals(proposals, overrides, date) {
  const result = structuredClone(overrides), applied = [], rejected = [];
  for (const p of proposals) {
    const errors = guardProposal(p, result, proposals.filter((x) => x.pathname !== p.pathname).map((x) => p.action === 'description' ? x.currentDescription : x.currentTitle));
    if (errors.length) { rejected.push({ pathname: p.pathname, errors }); continue; }
    // Preserve the original experiment baseline; do not restart the clock every day.
    if (result[p.pathname]) { rejected.push({ pathname: p.pathname, errors: ['active-experiment'] }); continue; }
    result[p.pathname] = { [p.action]: { [p.locale || 'en']: p.action === 'title' ? p.proposedTitle : p.proposedDescription }, since: date, query: p.query, baselinePos: p.position, baselineImpressions: p.impressions };
    applied.push(p.pathname);
  }
  return { overrides: result, applied, rejected };
}
