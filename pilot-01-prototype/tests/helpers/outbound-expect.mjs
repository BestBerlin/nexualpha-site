// Owner 2026-10-13 ("every exchange click carries our code"): a rendered exchange source is either the /go/<venue>-page
// route with the code or a plain label + domain. Tests that used to look for the raw official href use this instead.
import { outboundLink, sourceDomain } from '../../src/data/exchange-outbound.js';

const escapeAttr = (value) => value.replaceAll('&', '&amp;');

/** True when the HTML renders `url` the way SourceLink does for this locale/market. */
export function rendersSource(html, url, { locale = 'en', market, src } = {}) {
  const link = outboundLink(url, { locale, market, src });
  if (!link) return !html.includes(`href="${url}"`) && html.includes(`data-source-plain="${sourceDomain(url)}"`);
  return html.includes(`href="${escapeAttr(link.href)}"`);
}

/** The href SourceLink renders for `url`, or null when it renders plain text. */
export const renderedSourceHref = (url, options = {}) => {
  const link = outboundLink(url, options);
  return link ? escapeAttr(link.href) : null;
};
