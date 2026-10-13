// Inline Markdown for article prose (audit NX-10, 2026-10-11). One tokenizer feeds both the React article renderer
// (NewsDetailPage, SSR + client) and the Worker's fallback article HTML, so a link can never render as an <a> in one
// path and as raw "[label](/path)" text in the other. Supported inline syntax: [label](href), **strong**, *em* / _em_,
// and `code`; links may sit inside bold/italic, list items, table cells or parentheses. Before this module only
// absolute http(s) links were recognised, so every internal "[label](/news/...)" link stayed raw text.
import { localizedHref, parsePublicRoute } from "./locale-routing.js";
import { outboundLink } from "./exchange-outbound.js";

/** Site paths an article may link to. A link to any other relative path renders as its plain label. */
export const ARTICLE_INTERNAL_LINK_PREFIXES = Object.freeze([
  "/news/", "/exchanges/", "/compare/", "/topics/", "/factbook/",
]);
export const ARTICLE_INTERNAL_LINK_PATHS = Object.freeze([
  "/news", "/exchanges", "/compare", "/topics", "/factbook", "/rates", "/activities", "/liquidations", "/funding-rates",
]);

function internalPathAllowed(pathname) {
  return ARTICLE_INTERNAL_LINK_PATHS.includes(pathname)
    || ARTICLE_INTERNAL_LINK_PREFIXES.some((prefix) => pathname.startsWith(prefix) && pathname.length > prefix.length);
}

/**
 * Resolves a Markdown link target. Absolute http(s) URLs stay external; allowed site paths are localized for the
 * reading locale. Returns null for anything else (javascript:, mailto:, protocol-relative, unknown site paths).
 */
export function resolveArticleLinkHref(href, locale = "en") {
  const raw = String(href || "").trim();
  if (/^https?:\/\/[^\s/]+/i.test(raw)) {
    // Exchange pages carry our code via /go/<venue>-page or render as their plain label (exchange-outbound.js).
    const link = outboundLink(raw, { locale, src: "article" });
    return link ? { href: link.href, external: true, ...(link.sponsored ? { sponsored: true } : {}) } : null;
  }
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  let parsed;
  try { parsed = new URL(raw, "https://nexualpha.com"); } catch { return null; }
  // A locale-prefixed target ("/zh-hans/news/...") is re-localized for the reader's locale like any other path.
  const pathname = parsePublicRoute(parsed.pathname.replace(/\/+$/, "") || "/", parsed.searchParams).contentPathname;
  if (!internalPathAllowed(pathname)) return null;
  parsed.searchParams.delete("locale");
  return { href: localizedHref(`${pathname}${parsed.search}${parsed.hash}`, { locale }), external: false };
}

// Link target: no spaces; one level of balanced parentheses is allowed inside the URL (e.g. Wikipedia titles).
const LINK = String.raw`\[((?:[^\[\]\n]|\[[^\[\]\n]*\])+)\]\(\s*((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"\n]*")?\s*\)`;
const CODE = String.raw`\x60([^\x60\n]+)\x60`;
const STRONG = String.raw`\*\*(?=\S)((?:[^*\n]|\*(?!\*))+?)\*\*|__(?=\S)([^_\n]+?)__(?![A-Za-z0-9])`;
const EM = String.raw`(?<![*A-Za-z0-9])\*(?=[^\s*])([^*\n]+?)\*(?![*A-Za-z0-9])|(?<![_A-Za-z0-9])_(?=[^\s_])([^_\n]+?)_(?![_A-Za-z0-9])`;
const INLINE = new RegExp(`${CODE}|${LINK}|${STRONG}|${EM}`, "g");

/**
 * Tokenizes inline Markdown into a tree:
 *   { type: "text", text } | { type: "code", text } | { type: "strong" | "em", children }
 *   | { type: "link", href, external, children }
 * A link whose target is not allowed becomes its label tokens (no raw brackets survive).
 */
export function tokenizeInlineMarkdown(text, { locale = "en", allowLinks = true } = {}) {
  const value = String(text ?? "");
  const tokens = [];
  const pushText = (chunk) => {
    if (!chunk) return;
    const last = tokens[tokens.length - 1];
    if (last?.type === "text") last.text += chunk;
    else tokens.push({ type: "text", text: chunk });
  };
  let cursor = 0;
  for (const match of value.matchAll(new RegExp(INLINE.source, "g"))) {
    const [whole, code, label, href, strongA, strongB, emA, emB] = match;
    if (label !== undefined && !allowLinks) continue; // nested link inside a link label: keep scanning as text
    pushText(value.slice(cursor, match.index));
    if (code !== undefined) tokens.push({ type: "code", text: code });
    else if (label !== undefined) {
      const children = tokenizeInlineMarkdown(label, { locale, allowLinks: false });
      const target = resolveArticleLinkHref(href, locale);
      if (target) tokens.push({ type: "link", href: target.href, external: target.external, ...(target.sponsored ? { sponsored: true } : {}), children });
      else for (const child of children) child.type === "text" ? pushText(child.text) : tokens.push(child);
    } else if (strongA !== undefined || strongB !== undefined) {
      tokens.push({ type: "strong", children: tokenizeInlineMarkdown(strongA ?? strongB, { locale, allowLinks }) });
    } else if (emA !== undefined || emB !== undefined) {
      tokens.push({ type: "em", children: tokenizeInlineMarkdown(emA ?? emB, { locale, allowLinks }) });
    } else {
      pushText(whole);
    }
    cursor = match.index + whole.length;
  }
  pushText(value.slice(cursor));
  return tokens;
}

/** Plain text of a token tree (labels without markup). */
export function inlineTokensText(tokens) {
  return tokens.map((token) => (token.text ?? inlineTokensText(token.children || []))).join("");
}

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** HTML for the Worker fallback renderer; same tokens and link rules as the React article renderer. */
export function inlineMarkdownHtml(text, { locale = "en" } = {}) {
  const render = (tokens) => tokens.map((token) => {
    if (token.type === "text") return escapeHtml(token.text);
    if (token.type === "code") return `<code>${escapeHtml(token.text)}</code>`;
    if (token.type === "strong") return `<strong>${render(token.children)}</strong>`;
    if (token.type === "em") return `<em>${render(token.children)}</em>`;
    const attrs = token.external ? (token.sponsored ? ' target="_blank" rel="nofollow sponsored noopener"' : ' target="_blank" rel="noopener noreferrer"') : "";
    return `<a href="${escapeHtml(token.href)}"${attrs}>${render(token.children)}</a>`;
  }).join("");
  return render(tokenizeInlineMarkdown(text, { locale }));
}

/** Counts "[label](target)" sequences left as visible text (used by the article sweep and tests). */
export function countRawMarkdownLinks(text) {
  return (String(text || "").match(/\[[^\[\]\n]+\]\([^()\s]+\)/g) || []).length;
}
