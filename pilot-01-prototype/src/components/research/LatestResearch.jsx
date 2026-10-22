import React from 'react';
import { HubNewsLinks } from '../shared/HubNewsLinks.jsx';
import { researchItems } from './research-selection.js';
export function LatestResearch({ locale = 'en', articles = [], venueIds = [], terms = [], name, title, before, excludeSlug, limit = 5, className }) {
  const items = researchItems(articles, { locale, venueIds, terms, before, excludeSlug, limit });
  return <HubNewsLinks locale={locale} name={name || title || venueIds.join(' / ')} items={items} className={className} />;
}
