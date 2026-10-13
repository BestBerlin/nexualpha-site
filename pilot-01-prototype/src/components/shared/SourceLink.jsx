import React from 'react';
import { outboundLink, sourceDomain } from '../../data/exchange-outbound.js';

// Every exchange link in body content carries our invite code (owner 2026-10-13). An exchange page whose venue honours
// its referral parameter sitewide goes through /go/<venue>-page (the server adds the code); any other exchange page is
// shown as plain text (title + domain), as are all exchange sources in neutral locales and Bitget sources in Türkiye.
// Non-exchange links are unchanged. `allowDirect` is for the legal and methodology pages only.
// Applied in the render tree so server markup and hydration agree.
export function SourceLink({ locale, market, href, children, allowDirect = false, src, ...props }) {
  const link = outboundLink(href, { locale, market, allowDirect, src });
  if (link) {
    if (link.sponsored) {
      const rel = [...new Set(String(props.rel || 'noopener').split(/\s+/).filter(Boolean).concat(['nofollow', 'sponsored']))].join(' ');
      return <a {...props} href={link.href} rel={rel}>{children}</a>;
    }
    return <a href={href} {...props}>{children}</a>;
  }
  const { target, rel, download, onClick, style, ...labelProps } = props;
  const domain = sourceDomain(href);
  const label = plainLabel(children);
  const text = typeof label === 'string' ? label : '';
  return <span {...labelProps} style={{ ...style, cursor: 'text' }} data-source-plain={domain || undefined}>{label}{domain && !text.includes(domain) ? <span className="source-plain__domain"> · {domain}</span> : null}</span>;
}

// A plain label drops the "opens elsewhere" arrow (↗) so it does not read as a link.
const ARROW = /\s*↗\s*$/;
function plainLabel(children) {
  if (typeof children === 'string') return children.replace(ARROW, '');
  if (!Array.isArray(children)) return children;
  const items = React.Children.toArray(children).filter((child) => !(React.isValidElement(child) && typeof child.props.children === 'string' && /^\s*↗\s*$/.test(child.props.children)));
  return items.map((child, index) => (index === items.length - 1 && typeof child === 'string' ? child.replace(ARROW, '') : child));
}

/** Same policy for code that builds hrefs outside JSX: the attributed href, or null for plain text. */
export function sourceHref(href, options) {
  return outboundLink(href, options)?.href ?? null;
}
