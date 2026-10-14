import { createRequire } from 'node:module';
import { CUSTOM_INVITE_CODES } from '../src/data/partner-registry.js';

// Reuse the parser shipped with our existing direct jsdom dependency.
const require = createRequire(import.meta.url);
const { parseFragment } = createRequire(require.resolve('jsdom/package.json'))('parse5');

export const CODE_LABELS = ['邀请码', '推荐码', '邀請碼', '推薦碼', 'referral code', 'invite code', 'kode referral', 'referans kodu', 'código de convite', 'código de referido', 'código de invitación', 'código de indicação', 'código', 'code de parrainage', 'Empfehlungscode', 'codice referral', '招待コード', '紹介コード', '초대 코드', '추천 코드', 'реферальный код', 'mã giới thiệu'];
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const labels = CODE_LABELS.map(escape).join('|');
const aliases = {
  binance: ['Binance', '币安', '幣安'], okx: ['OKX', '欧易', '歐易'], bybit: ['Bybit'], bitget: ['Bitget'],
  'gate-io': ['Gate.io', 'Gate'], kucoin: ['KuCoin'], mexc: ['MEXC'], backpack: ['Backpack'],
  hyperliquid: ['Hyperliquid'], kraken: ['Kraken'], deribit: ['Deribit'], gmx: ['GMX'], drift: ['Drift'], htx: ['HTX'], coinw: ['CoinW'],
};
const placeholders = ['NEXU_KUCOIN', 'NEXU_DERIBIT', 'NEXU_GMX', 'NEXU_DRIFT'];
const blockTags = new Set(['p', 'div', 'section', 'article', 'li', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'header', 'footer', 'main', 'table', 'a', 'button', 'summary', 'dt', 'dd', 'figcaption']);
const normalize = (s) => s.normalize('NFKC').replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim();
const names = Object.values(aliases).flat().map(escape).join('|');
const values = Object.values(CUSTOM_INVITE_CODES);
const interesting = new RegExp(`${labels}|\\bcode\\b|${values.map(escape).join('|')}|(?:${names})\\s*[:：=]`, 'iu');
const yearPattern = new RegExp(`(?:${labels})[\\s:：=\\-–—(]*([12]\\d{3})(?!\\d)`, 'giu');
const labelPattern = new RegExp(`(?:${labels}|\\bcode\\b)([\\s:：=\\-–—]*)(?:(?:${names})[\\s:：]+)?([A-Za-z0-9_]+)`, 'giu');
const referralLabel = new RegExp(`^(?:${labels})`, 'iu');
const namePatterns = Object.entries(aliases).flatMap(([slug, list]) => list.map(name => ({ slug, pattern: new RegExp(`[\\p{L}\\p{N}_]?(${escape(name)})(?![\\p{L}\\p{N}_])`, 'giu') })));

function venueMentions(text) {
  return namePatterns.flatMap(({slug, pattern}) => [...text.matchAll(pattern)].filter(m => m[0] === m[1]).map(m => ({ slug, index: m.index }))).sort((a, b) => a.index - b.index);
}

// Text only: href parameters and analytics IDs are not displayed invite codes.
export function scanInviteText(input, { source = '', venue = null } = {}) {
  const text = normalize(input);
  if (!interesting.test(text)) return [];
  const issues = [];
  const add = (kind, detail) => issues.push({ source, kind, detail, text: text.slice(0, 300) });
  for (const code of placeholders) if (text.includes(code)) add('placeholder', code);
  for (const match of text.matchAll(yearPattern)) add('year-as-code', match[0]);
  const mentions = venueMentions(text);
  for (const match of text.matchAll(labelPattern)) {
    const code = match[2];
    if (Object.values(aliases).flat().some(name => name.toLowerCase() === code.toLowerCase())) continue;
    if (!referralLabel.test(match[0]) && !/[:：=]/.test(match[1]) && !values.includes(code) && !(code.length >= 5 && /[0-9_]/.test(code))) continue;
    if (!referralLabel.test(match[0]) && /(?:anti[- ]phishing|QR|source|verification)\s*$/i.test(text.slice(Math.max(0, match.index - 30), match.index))) continue;
    // Prose such as "referral code guide" has no asserted code value.
    if (!/[0-9_]/.test(code) && !Object.values(CUSTOM_INVITE_CODES).includes(code) && !/[:：=]/.test(match[1]) && !/^[A-Z]{3,}$/.test(code)) continue;
    const preceding = mentions.filter(m => m.index < match.index && match.index - m.index <= 80).at(-1);
    const following = mentions.find(m => m.index >= match.index && m.index < match.index + match[0].length);
    const owner = preceding?.slug || following?.slug || venue;
    if (Object.hasOwn(CUSTOM_INVITE_CODES, owner) && CUSTOM_INVITE_CODES[owner] !== code) add('wrong-code', `${owner}: ${code}; expected ${CUSTOM_INVITE_CODES[owner]}`);
  }
  // A compact exchange/value assertion also needs checking without a label.
  for (const mention of mentions) {
    const name = aliases[mention.slug].find(n => text.slice(mention.index).toLowerCase().startsWith(n.toLowerCase()));
    const tail = text.slice(mention.index + name.length);
    const match = tail.match(/^(?:\s*[:：=]\s*|\s+)[`"']?([A-Za-z0-9_]+)/);
    if (match && /^[12]\d{3}$/.test(match[1]) && !/^\s*[:：=]/.test(tail)) continue;
    const asserted = match && (Object.values(CUSTOM_INVITE_CODES).includes(match[1]) || (/^\s*[:：=]/.test(tail) && match[1].length >= 5 && /[0-9_]|^[A-Z]+$/.test(match[1]) && /^[\s.;!]*$/.test(tail.slice(match[0].length))));
    if (asserted && match[1] !== CUSTOM_INVITE_CODES[mention.slug]) add('wrong-code', `${mention.slug}: ${match[1]}; expected ${CUSTOM_INVITE_CODES[mention.slug]}`);
  }
  return issues;
}

export function scanInviteHtml(html, options = {}) {
  const issues = [];
  const textContent = n => n.nodeName === '#text' ? n.value : ['script', 'style'].includes(n.tagName) ? '' : (n.childNodes || []).map(textContent).join(' ');
  function contextOwner(node) {
    let context = node;
    while (context) {
      const copy = normalize(textContent(context));
      if (copy.length > 3000) break;
      const owners = [...new Set(venueMentions(copy).map(m => m.slug))];
      if (owners.length === 1) return owners[0];
      if (owners.length > 1) return null;
      context = context.parentNode;
    }
    return options.venue;
  }
  // Placeholders are forbidden anywhere in emitted output, even attributes/scripts.
  for (const code of placeholders) if (html.includes(code)) issues.push({ source: options.source || '', kind: 'placeholder', detail: code });
  function visit(node) {
    if (node.tagName === 'script') {
      if ((node.attrs || []).some(a => a.name === 'type' && a.value === 'application/ld+json')) {
        const json = (node.childNodes || []).map(child => child.value || '').join('');
        issues.push(...scanInviteJson(JSON.parse(json), options));
      }
      return '';
    }
    if (node.tagName === 'style') return '';
    if (node.nodeName === '#text') return node.value;
    const text = (node.childNodes || []).map(visit).join(' ');
    if (node.tagName === 'code' || (node.attrs || []).some(a => /^(?:data-copy-code|data-invite-code)$/.test(a.name))) {
      const code = normalize(text);
      if (/^[A-Za-z0-9_]+$/.test(code)) {
        let context = node.parentNode;
        let owner = options.venue;
        let asserted = values.includes(code) || (node.attrs || []).some(a => /invite|referral|copy-code/.test(`${a.name} ${a.value}`));
        while (context) {
          const copy = normalize(textContent(context));
          const mentions = venueMentions(copy);
          if (mentions.length) {
            owner = mentions[0].slug;
            asserted ||= new RegExp(`^(?:${names})\\s*[:：]?\\s*${escape(code)}[.!]?$`, 'iu').test(copy);
            break;
          }
          context = context.parentNode;
        }
        if (asserted && Object.hasOwn(CUSTOM_INVITE_CODES, owner) && CUSTOM_INVITE_CODES[owner] !== code) issues.push({ source: options.source || '', kind: 'wrong-code', detail: `${owner}: ${code}; expected ${CUSTOM_INVITE_CODES[owner]}` });
      }
    }
    if (blockTags.has(node.tagName) || node.tagName === 'title') {
      if (text.length <= 1000 && interesting.test(normalize(text))) issues.push(...scanInviteText(text, { ...options, venue: contextOwner(node) }));
      return `${text}\n`; // Preserve label/value pairs split across nested elements.
    }
    if (node.tagName === 'meta') {
      const attrs = Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
      if (attrs.content && /description|title/.test(attrs.name || attrs.property || '')) issues.push(...scanInviteText(attrs.content, options));
    }
    return text;
  }
  const visible = visit(parseFragment(html));
  issues.push(...scanInviteText(visible, options).filter(issue => visible.length <= 1000 || issue.kind !== 'wrong-code'));
  return [...new Map(issues.map(issue => [`${issue.source}|${issue.kind}|${issue.detail}`, issue])).values()];
}

export function scanInviteJson(value, options = {}) {
  if (typeof value === 'string') return scanInviteText(value, options).filter(issue => options.copy !== false || issue.kind === 'placeholder');
  if (!value || typeof value !== 'object') return [];
  const owner = typeof value.slug === 'string' && Object.hasOwn(CUSTOM_INVITE_CODES, value.slug) ? value.slug : venueMentions(String(value.name || '')).at(0)?.slug || options.venue;
  const issues = [];
  if (owner && typeof value.inviteCode === 'string' && value.inviteCode !== CUSTOM_INVITE_CODES[owner]) issues.push({ source: options.source || '', kind: 'wrong-code', detail: `${owner}: ${value.inviteCode}; expected ${CUSTOM_INVITE_CODES[owner]}` });
  for (const [key, item] of Object.entries(value)) issues.push(...scanInviteJson(item, { ...options, venue: owner, copy: !/(?:id|url|href|slug|path|key|hash|fingerprint)$/i.test(key) }));
  return issues;
}
