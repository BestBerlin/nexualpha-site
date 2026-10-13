import React from 'react';

// Türkiye pages retain source labels for research without opening Bitget sites.
// Apply this in the render tree so server markup and hydration agree.
export function SourceLink({ locale, href, children, ...props }) {
  let host = '';
  try { host = new URL(href).hostname; } catch { /* Relative links are unaffected. */ }
  const blocked = locale === 'tr' && /(?:^|\.)(?:bitget\.com|bitget\.cafe)$/.test(host);
  if (!blocked) return <a href={href} {...props}>{children}</a>;
  const { target, rel, download, onClick, ...labelProps } = props;
  return <span {...labelProps}>{children}</span>;
}
