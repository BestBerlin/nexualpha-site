import { useEffect, useState } from 'react';
import { attachCampaignBriefs, CAMPAIGN_BRIEFS_URL } from '../../data/campaign-briefs.js';
export function useCampaignBriefs(feed) {
  const [briefs, setBriefs] = useState(null);
  useEffect(() => {
    if (Array.isArray(feed?.campaignBriefs)) return;
    if (typeof fetch !== 'function') return;
    const controller = new AbortController();
    fetch(CAMPAIGN_BRIEFS_URL, { signal: controller.signal, cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(data => { if (data) setBriefs(data); }).catch(() => {});
    return () => controller.abort();
  }, [feed?.campaignBriefs]);
  return Array.isArray(feed?.campaignBriefs) ? feed : attachCampaignBriefs(feed, briefs);
}
