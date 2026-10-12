import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCampaignBriefs } from '../src/data/campaign-briefs.js';
import { CUSTOM_INVITE_CODES, PARTNER_REGISTRATION_URLS } from '../src/data/partner-registry.js';
import { updateItems } from '../src/data/activity-update.js';
const root = fileURLToPath(new URL('../', import.meta.url));
try {
  const [payload, feed] = await Promise.all([
    readFile(resolve(process.argv[2] || resolve(root, 'public/content/campaign-briefs.json')), 'utf8').then(JSON.parse),
    readFile(resolve(root, 'public/intel/official-announcements.json'), 'utf8').then(JSON.parse),
  ]);
  const codes = Object.values(CUSTOM_INVITE_CODES);
  for (const urls of Object.values(PARTNER_REGISTRATION_URLS)) for (const source of urls) {
    const url = new URL(source);
    for (const value of url.searchParams.values()) if (value.length >= 3) codes.push(value);
    if (/partner\./.test(url.host)) codes.push(url.pathname.split('/').filter(Boolean).at(-1));
  }
  const errors = validateCampaignBriefs(payload, { ids: updateItems(feed).map(item => item.id), partnerCodes: codes });
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`Campaign briefs valid: ${payload.items.length} items`);
} catch (error) { console.error(`Campaign briefs validation failed: ${error.message}`); process.exitCode = 1; }
