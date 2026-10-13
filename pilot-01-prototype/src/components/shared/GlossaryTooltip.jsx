import React, { useId } from 'react';
import { GLOSSARY_TOOLTIPS } from '../../data/glossary-tooltip-copy.js';
import { localizedHref } from '../../data/locale-routing.js';
import './glossary-tooltip.css';
export function GlossaryTooltip({ term, locale = 'en', children }) {
  const id = useId();
  const entry = (GLOSSARY_TOOLTIPS[locale] || GLOSSARY_TOOLTIPS.en)[term];
  if (!entry) return children;
  return <span className="nx-glossary-tip"><a href={localizedHref(`/glossary/${term}`, { locale })} aria-describedby={id}>{children || entry.name}</a><span id={id} className="nx-glossary-tip__text" role="tooltip" lang={entry.locale}>{entry.short}</span></span>;
}
