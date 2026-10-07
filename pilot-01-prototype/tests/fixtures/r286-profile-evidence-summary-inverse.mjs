import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const hash = value => createHash('sha256').update(value).digest('hex');
export const duplicateLine = '        {isZhLocale && <span>{detailLabels.deeper}</span>}\n';
const marker = '        <b aria-hidden="true">＋</b>\n      </summary>\n      <div className="v3-profile-evidence-drawer__body">';
export const evidenceColumns = '\n/* R286: one evidence summary label keeps the toggle in its own column. */\n.v3-profile-page .v3-profile-evidence-drawer > summary {\n  grid-template-columns: 1fr auto;\n}\n';
export const snapshotNativeMarker = '\n/* R286: the native snapshot marker already signals disclosure state. */\n.v3-compare-snapshot-disclosure > summary > b {\n  display: none;\n}\n';
export function restoreEvidenceJs(source) {
  assert.equal(source.includes(duplicateLine), false);
  assert.equal(source.split(marker).length, 2);
  const restored = source.replace(marker, duplicateLine + marker);
  assert.equal(hash(restored), '2bb5f13bd8ffb4e2b69cb6d44c48454aeed7d35fcb438229d570021c706b7046');
  return restored;
}
export function restoreEvidenceCss(source) {
  for (const hunk of [evidenceColumns, snapshotNativeMarker]) {
    assert.equal(source.split(hunk).length, 2);
    source = source.replace(hunk, '');
  }
  assert.equal(hash(source), '3257a9bc6aaa18328b78020e21a42e7abd70c40c115d8cdcb86782e80fa09e23');
  return source;
}
