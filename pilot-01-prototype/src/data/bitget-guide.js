import { GUIDE_COPY_ZH_EN } from './bitget-guide-copy-zh-en.js';
import { GUIDE_COPY_ID } from './bitget-guide-copy-id.js';
import { GUIDE_COPY_ES_PT } from './bitget-guide-copy-es-pt.js';
import { partnerRegistry } from './partner-registry.js';
export const BITGET_GUIDE_COPY = Object.freeze({ ...GUIDE_COPY_ZH_EN, ...GUIDE_COPY_ID, ...GUIDE_COPY_ES_PT });
export function bitgetGuideCopy(locale) {
  const copy = BITGET_GUIDE_COPY[locale];
  if (!copy) return null;
  // The partner registry owns the code, including visible prose and structured data.
  const code = partnerRegistry.bitget.inviteCode;
  return JSON.parse(JSON.stringify(copy).replaceAll('nexu888', code));
}
