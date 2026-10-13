// Public configuration only. Tokens belong in server-side PARTNER_STATS_TOKENS JSON.
// codes values may be a sub-code string or { code, url } with an approved HTTPS venue link.
export const partnersProgram = Object.freeze([
  // { id: 'example', name: 'Example community', locales: ['en'], codes: { okx: 'APPROVED_SUB_CODE' } },
]);
export function safePartnerId(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,47}$/.test(value) ? value : '';
}
export function findProgramPartner(id, registry = partnersProgram) {
  return safePartnerId(id) ? registry.find((partner) => partner.id === id) || null : null;
}
