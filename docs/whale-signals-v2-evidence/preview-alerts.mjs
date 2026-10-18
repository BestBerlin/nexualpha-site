import { readFileSync, writeFileSync } from 'node:fs';
import { dryRunWhaleChannelAlerts } from '../../ops/channel-feed/whale-alert-template.mjs';

if (!process.argv[2]) throw new Error('Usage: node preview-alerts.mjs <collector-snapshot.json>');
const snapshot = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const result = {
  inputSource: process.argv[2],
  observedAt: snapshot.generatedAt || snapshot.updatedAt || null,
  ...dryRunWhaleChannelAlerts(snapshot.rows || []),
};
writeFileSync(new URL('./telegram-dry-run.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ dryRun: result.dryRun, sent: result.sent, inputCount: result.inputCount, alerts: result.alerts.length }));
