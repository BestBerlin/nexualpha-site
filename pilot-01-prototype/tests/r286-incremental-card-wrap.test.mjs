import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const candidateRoot = join(here, '..');
const baseRoot = join(candidateRoot, '..', '..', 'r284-resume-type', 'candidate');
const cssPath = join(candidateRoot, 'src/components/v3/venue-yellow-pages.css');
const baseCssPath = join(baseRoot, 'src/components/v3/venue-yellow-pages.css');
const jsxPath = join(candidateRoot, 'src/components/v3/VenueYellowPages.jsx');
const baseJsxPath = join(baseRoot, 'src/components/v3/VenueYellowPages.jsx');
const registryPath = join(candidateRoot, 'src/data/partner-registry.js');
const baseRegistryPath = join(baseRoot, 'src/data/partner-registry.js');
const css = readFileSync(cssPath, 'utf8');
const baseCss = readFileSync(baseCssPath, 'utf8');
const jsx = readFileSync(jsxPath, 'utf8');
const baseJsx = readFileSync(baseJsxPath, 'utf8');
const registry = readFileSync(registryPath);
const baseRegistry = readFileSync(baseRegistryPath);

const compactBlock = css.slice(css.indexOf('R120 home compact yellow-page cards'), css.indexOf('/* Mobile choices remain visible'));
const protectedRegistrySha = '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a';

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

function replaceOnce(text, searchValue, replacement, label) {
  const next = text.replace(searchValue, replacement);
  assert.notEqual(next, text, `${label} must match exactly once`);
  assert.equal(text.indexOf(searchValue), text.lastIndexOf(searchValue), `${label} must not match more than once`);
  return next;
}

function removeOnce(text, searchValue, label) {
  return replaceOnce(text, searchValue, '', label);
}

function sliceBetween(text, start, end, label) {
  const startIndex = text.indexOf(start);
  assert.notEqual(startIndex, -1, `${label} start marker must exist`);
  const endIndex = text.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `${label} end marker must exist`);
  return text.slice(startIndex, endIndex);
}

const reviewedJsxRegionShas = {
  localeBlock: 'a8a9bf251d28085b7364f1ccea264aa4a6b3fe938d86a1a92c7916db9a64cf96',
  stateBlock: '2fa2a73b465f9f899128433d9ab1a608fe4bcd86930123d0b1c3c7eaf5974b48',
  lifecycleBlock: '076dab708823673caed3b86f509c6b08992b0b3cd8ff051b20f229a35f0f7398',
  handlerBlock: 'b6e9e5174f4815054ead3d372d6776aa8660c77000d35bb60a325032fdd66f3c',
  compactCall: '5a30928e9ce6cbfc4913c47dcc4684e91a288a9c279828ff75b2d394bf3711db',
  directoryCall: 'd654c943a01d0a6c3d061b97971d017c909b94e6eb1ef27a682ecac8aa395ee1',
};

function assertReviewedCopyFeedbackRegions(currentJsx) {
  const regions = {
    localeBlock: sliceBetween(currentJsx, '\nconst copyFeedbackLocales = {', '\nfunction getFilters(locale) {', 'copy feedback locale block'),
    stateBlock: sliceBetween(currentJsx, '  const [copiedToast, setCopiedToast] = useState(null);', '  const context = directoryContext', 'copy feedback state block'),
    lifecycleBlock: sliceBetween(currentJsx, '\n  const clearCopyFeedbackTimer = () => {', '\n  const applyRestoredUrlState =', 'copy feedback lifecycle block'),
    handlerBlock: sliceBetween(currentJsx, '\n  const handleCopyCode = async (code, feedbackId, e) => {', '\n  const categories = [', 'copy feedback handler block'),
    compactCall: sliceBetween(currentJsx, 'onClick={(e) => handleCopyCode(inviteCode, `${venue.slug}-compact`, e)}', '<span className="yellow-card__perk-text">', 'compact copy call block'),
    directoryCall: sliceBetween(currentJsx, 'onClick={(e) => handleCopyCode(inviteCode, `${venue.slug}-directory`, e)}', '<span className="yellow-card__perk-text">', 'directory copy call block'),
  };
  for (const [name, region] of Object.entries(regions)) {
    assert.equal(sha256(region), reviewedJsxRegionShas[name], `${name} must match the reviewed authorized JSX exactly`);
  }
}

const copyFeedbackCssBlock = `
.yellow-card__copy-feedback {
  display: flex;
  flex: 1 0 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  color: #cbd5e1;
  font-size: 0.72rem;
  line-height: 1.35;
}

.yellow-card__copy-feedback--failed {
  color: #fca5a5;
}

.yellow-card__copy-manual {
  min-width: min(9rem, 100%);
  max-width: 100%;
  min-height: 44px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  border-radius: 0.55rem;
  background: rgba(15, 23, 42, 0.75);
  color: #f8fafc;
  font: 700 0.78rem var(--font-mono, ui-monospace, monospace);
  padding: 0.45rem 0.55rem;
}
`;

function revertCssToR284(currentCss) {
  let reverted = currentCss;
  reverted = replaceOnce(
    reverted,
    '.yellow-card--directory > div:not(.yellow-card__directory-details) > .yellow-card__perk-row {',
    '.yellow-card--directory > div > .yellow-card__perk-row {',
    'directory details visibility selector',
  );
  reverted = replaceOnce(
    reverted,
    `overflow-wrap: break-word;
  word-break: normal;
}

.yellow-pages__grid--compact .yellow-card__domain-row {
  height: auto;
  min-height: 22px;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.yellow-pages__grid--compact .yellow-card__domain {
  height: auto;
  line-height: 1.35;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  overflow-wrap: break-word;
}

@media (max-width: 360px)`,
    `overflow-wrap: anywhere;
}

@media (max-width: 360px)`,
    'compact CTA/domain wrap hunk',
  );
  reverted = removeOnce(reverted, copyFeedbackCssBlock, 'copy feedback CSS block');
  return reverted;
}

function revertJsxToR284(currentJsx) {
  let reverted = replaceOnce(currentJsx, 'setSearchQuery(""); requestAnimationFrame(() => searchInputRef.current?.focus?.({ preventScroll: true })); }}>', 'setSearchQuery(""); }}>', 'authorized empty reset focus literal');
  reverted = reverted.replace(/\nconst copyFeedbackLocales = \{[\s\S]*?\nfunction getCopyFeedbackCopy\(locale\) \{\n  return copyFeedbackLocales\[locale\] \|\| copyFeedbackLocales\[String\(locale \|\| ""\)\.split\("-"\)\[0\]\] \|\| copyFeedbackLocales\.en;\n\}\n/, '');
  assert.notEqual(reverted, currentJsx, 'copyFeedbackLocales/getCopyFeedbackCopy block must be removable');

  reverted = replaceOnce(reverted, '  const [copyFeedback, setCopyFeedback] = useState({ status: "idle", code: "", feedbackId: "" });\n', '', 'copyFeedback state');
  reverted = replaceOnce(reverted, '  const copyAttemptRef = useRef(0);\n  const copyTimerRef = useRef(null);\n  const copyMountedRef = useRef(true);\n', '', 'copy feedback refs');
  reverted = replaceOnce(reverted, '  const copyUi = getCopyFeedbackCopy(locale);\n', '', 'copyUi assignment');
  reverted = reverted.replace(/\n  const clearCopyFeedbackTimer = \(\) => \{[\s\S]*?\n  };\n\n\n  const applyRestoredUrlState = /, '\n  const applyRestoredUrlState = ');

  const baseHandler = `  const handleCopyCode = (code, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!code) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedToast(code);
      setTimeout(() => setCopiedToast(null), 2000);
    }
  };
`;
  reverted = reverted.replace(/\n  const handleCopyCode = async \(code, feedbackId, e\) => \{[\s\S]*?\n  };\n\n  const categories = \[/, `\n${baseHandler}\n  const categories = [`);
  reverted = replaceOnce(reverted, 'onClick={(e) => handleCopyCode(inviteCode, `${venue.slug}-compact`, e)}', 'onClick={(e) => handleCopyCode(inviteCode, e)}', 'compact copy handler call');
  reverted = replaceOnce(reverted, '                      {renderCopyFeedback(`${venue.slug}-compact`)}\n', '', 'compact feedback render');
  reverted = replaceOnce(reverted, 'onClick={(e) => handleCopyCode(inviteCode, `${venue.slug}-directory`, e)}', 'onClick={(e) => handleCopyCode(inviteCode, e)}', 'directory copy handler call');
  reverted = replaceOnce(reverted, '                        {renderCopyFeedback(`${venue.slug}-directory`)}\n', '', 'directory feedback render');
  assert.ok(!reverted.includes('clearCopyFeedbackTimer'), 'copy feedback timer helpers and calls must be removed by inverse transform');
  assert.ok(!reverted.includes('renderCopyFeedback'), 'renderCopyFeedback block and render calls must be removed by inverse transform');
  return reverted;
}

test('R286 compact CTA text wraps by words while preserving the two-column action grid', () => {
  assert.match(compactBlock, /\.yellow-pages__grid--compact \.yellow-card__actions \{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[\s\S]*align-items:\s*stretch;/);
  for (const selector of ['yellow-card__btn-detail', 'yellow-card__btn-register', 'yellow-card__btn-compare']) {
    const rule = new RegExp(`\\.yellow-pages__grid--compact \\.${selector}[\\s\\S]*width:\\s*100%;[\\s\\S]*min-width:\\s*0;[\\s\\S]*max-width:\\s*100%;[\\s\\S]*white-space:\\s*normal;[\\s\\S]*overflow-wrap:\\s*break-word;[\\s\\S]*word-break:\\s*normal;`);
    assert.match(compactBlock, rule, `${selector} should wrap at word boundaries inside its compact column`);
  }
  assert.doesNotMatch(compactBlock, /\.yellow-pages__grid--compact \.yellow-card__btn-detail,[\s\S]*overflow-wrap:\s*anywhere;/, 'compact CTA buttons must not use anywhere wrapping');
});

test('R286 compact domain row can wrap without clipped ellipsis', () => {
  assert.match(compactBlock, /\.yellow-pages__grid--compact \.yellow-card__domain-row \{[\s\S]*height:\s*auto;[\s\S]*min-height:\s*22px;[\s\S]*flex-wrap:\s*wrap;/);
  assert.match(compactBlock, /\.yellow-pages__grid--compact \.yellow-card__domain \{[\s\S]*height:\s*auto;[\s\S]*white-space:\s*normal;[\s\S]*overflow:\s*visible;[\s\S]*text-overflow:\s*clip;[\s\S]*overflow-wrap:\s*break-word;/);
});

test('R286 directory copy row stays visible while duplicate top copy row remains hidden', () => {
  assert.match(css, /\.yellow-card--directory > div:not\(\.yellow-card__directory-details\) > \.yellow-card__perk-row \{\n  display: none;\n\}/);
  assert.doesNotMatch(css, /\.yellow-card--directory > div > \.yellow-card__perk-row \{\n  display: none;\n\}/);
  assert.match(jsx, /className="yellow-card__directory-details"[\s\S]*?<div className="yellow-card__perk-row yellow-card__perk-row--directory">/);
});

test('R286 copy feedback CSS is inline, recoverable, and not a persistent fixed toast', () => {
  assert.ok(css.includes(copyFeedbackCssBlock), 'copy feedback CSS block must be exact');
  assert.match(css, /\.yellow-card__copy-feedback \{[\s\S]*display:\s*flex;[\s\S]*flex:\s*1 0 100%;[\s\S]*flex-wrap:\s*wrap;/);
  assert.match(css, /\.yellow-card__copy-manual \{[\s\S]*max-width:\s*100%;[\s\S]*min-height:\s*44px;/);
  assert.doesNotMatch(css, /\.yellow-card__copy-feedback[\s\S]*position:\s*fixed;/, 'copy failure feedback must not become a fixed overlay');
});

test('R286 CSS patch reverses exactly to the R284 CSS baseline', () => {
  assert.equal(sha256(revertCssToR284(css)), sha256(baseCss), 'removing only authorized R286 CSS hunks must restore R284 CSS byte hash');
});

test('R286 copy feedback JSX is bounded and reversible to R284', () => {
  assert.equal((jsx.match(/onClick=\{\(e\) => handleCopyCode\(inviteCode, `\$\{venue\.slug\}-(?:compact|directory)`, e\)\}/g) || []).length, 2, 'only the two invite-code copy entry points should use feedback IDs');
  assert.equal((jsx.match(/<strong translate="no" lang="en">\{inviteCode\}<\/strong>/g) || []).length, 2, 'both copy rows must keep the exact visible invite code value');
  assert.match(jsx, /await writeText\.call\(navigator\.clipboard, code\);[\s\S]*setCopiedToast\(code\);/, 'success toast must happen only after writeText resolves');
  assert.match(jsx, /status: "failed", code, feedbackId/, 'failed copy state must retain the original code and feedback id');
  assert.match(jsx, /className="yellow-card__copy-manual"[\s\S]*readOnly[\s\S]*dir="ltr"[\s\S]*translate="no"[\s\S]*value=\{copyFeedback\.code\}/, 'manual recovery input must expose the original code');
  for (const locale of ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'tr', 'es', 'pt-BR', 'fr', 'de', 'ru', 'ar', 'id', 'vi', 'it']) {
    assert.match(jsx, new RegExp(`(?:"${locale}"|${locale}): \\{ copying:`), `${locale} copy feedback locale must exist`);
  }
  assertReviewedCopyFeedbackRegions(jsx);
  assert.equal(sha256(revertJsxToR284(jsx)), sha256(baseJsx), 'removing only authorized copy feedback JSX hunks must restore R284 VenueYellowPages byte hash');
});

test('R286 JSX inverse guard rejects rogue code inside the reviewed copy-feedback region', () => {
  const rogueJsx = jsx.replace(
    'await writeText.call(navigator.clipboard, code);',
    'const rogueRegistrationUrl = partner?.registrationUrl || code;\n      await writeText.call(navigator.clipboard, code);',
  );
  assert.notEqual(rogueJsx, jsx, 'negative mutation fixture must alter the handler block');
  assert.throws(
    () => assertReviewedCopyFeedbackRegions(rogueJsx),
    /handlerBlock must match the reviewed authorized JSX exactly/,
    'reviewed-region hash must catch unauthorized additions that a broad inverse regex could otherwise swallow',
  );
});

test('R286 keeps protected commercial registry byte-identical to R284', () => {
  assert.equal(sha256(registry), sha256(baseRegistry), 'partner registry must be byte-identical to R284');
  assert.equal(sha256(registry), protectedRegistrySha, 'registry SHA must stay the protected full value');
});
