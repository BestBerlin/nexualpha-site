import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { CUSTOM_INVITE_CODES } from '../src/data/partner-registry.js';
import { scanInviteText } from './invite-code-consistency.mjs';

export const TELEGRAM_SURFACES = ['apps/bot-community/src', 'apps/bot-guard/src', 'apps/worker/src', 'packages/content/src', 'packages/queue/src', 'content', 'apps/miniapp/app'];
export function scanTelegramSource(text, source = '') {
  // Parse source literals, including nested partner objects, without evaluating code.
  const literals = [];
  const objects = [];
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) literals.push(node.text);
    if (ts.isObjectLiteralExpression(node)) {
      const fields = Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).filter(p => ts.isStringLiteral(p.initializer)).map(p => [p.name.getText().replace(/^["']|["']$/g, ''), p.initializer.text]));
      if (fields.slug && fields.inviteCode) objects.push(fields);
    }
    ts.forEachChild(node, visit);
  }
  visit(ts.createSourceFile(source || 'copy.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX));
  const copy = /\.(?:tsx?|jsx?|mjs)$/.test(source) ? literals : [text];
  const issues = copy.flatMap(literal => scanInviteText(literal, { source }));
  for (const { slug, inviteCode } of objects) if (CUSTOM_INVITE_CODES[slug] !== inviteCode) issues.push({ source, kind: 'wrong-code', detail: `${slug}: ${inviteCode}; expected ${CUSTOM_INVITE_CODES[slug] || 'no registry code'}` });
  for (const object of text.matchAll(/\{[^{}]*\}/g)) {
    const slug = object[0].match(/\bslug\s*:\s*["']([^"']+)["']/)?.[1];
    const code = object[0].match(/\binviteCode\s*:\s*["']([^"']+)["']/)?.[1];
    if (slug && code && CUSTOM_INVITE_CODES[slug] !== code) issues.push({ source, kind: 'wrong-code', detail: `${slug}: ${code}; expected ${CUSTOM_INVITE_CODES[slug] || 'no registry code'}` });
  }
  return issues;
}
export function scanTelegramRepository(root) {
  const issues = [];
  const missing = TELEGRAM_SURFACES.filter(surface => !existsSync(path.join(root, surface)));
  let files = 0;
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) { if (!['node_modules', '.git', '.next', 'dist'].includes(entry.name)) visit(file); }
      else if (/\.(?:tsx?|jsx?|mjs|json|md|txt|html)$/.test(entry.name) && !/\.(?:test|spec)\./.test(entry.name)) {
        files++;
        issues.push(...scanTelegramSource(readFileSync(file, 'utf8'), path.relative(root, file)));
      }
    }
  }
  for (const surface of TELEGRAM_SURFACES) if (!missing.includes(surface)) visit(path.join(root, surface));
  return { root, files, missing, issues, limitation: 'Static templates and fallback literals only; externally supplied drafts and live partner feeds are not verified.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2];
  if (!root) throw new Error('Usage: node scripts/scan-telegram-invite-codes.mjs /path/to/Telegram');
  const report = scanTelegramRepository(path.resolve(root));
  console.log(JSON.stringify(report, null, 2));
  if (report.missing.length || report.issues.length) process.exitCode = 1;
}
