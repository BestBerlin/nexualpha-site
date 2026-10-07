import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const registrationSummaryHunk = '\n/* R286: profile registration summaries keep full hints below the title on mobile. */\n@media (max-width: 780px) {\n  .v3-profile-page .v3-registration-notes > summary {\n    grid-template-columns: minmax(0, 1fr) auto;\n    gap: 4px 10px;\n  }\n  .v3-profile-page .v3-registration-notes > summary > strong {\n    grid-column: 1;\n    grid-row: 1;\n    min-width: 0;\n    overflow-wrap: anywhere;\n  }\n  .v3-profile-page .v3-registration-notes > summary > span {\n    grid-column: 1 / -1;\n    grid-row: 2;\n    min-width: 0;\n    overflow-wrap: anywhere;\n  }\n  .v3-profile-page .v3-registration-notes > summary > b {\n    grid-column: 2;\n    grid-row: 1;\n  }\n}\n';
export function restoreRegistrationSummary(source) {
  assert.equal(source.split(registrationSummaryHunk).length, 2);
  const restored = source.replace(registrationSummaryHunk, '');
  assert.equal(createHash('sha256').update(restored).digest('hex'), 'bd7fbfc7aaa376c9438f13083846bb3800970108110709c71762b4bc21dc3cb6');
  return restored;
}
