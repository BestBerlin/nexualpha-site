import React, { useEffect, useState } from 'react';
import { localizedBriefText } from '../../data/campaign-briefs.js';
import { formatSgt } from '../../data/local-time.js';
import './campaign-brief-facts.css';
export function CampaignBriefFacts({ brief, locale = 'en' }) {
  // The first client render matches SSR. The live countdown starts only after hydration.
  const [now, setNow] = useState(null);
  const deadline = Date.parse(brief?.deadline);
  useEffect(() => {
    if (!Number.isFinite(deadline)) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [deadline]);
  if (!brief) return null;
  const who = localizedBriefText(brief.who_can_join, locale);
  const reward = localizedBriefText(brief.reward_text, locale);
  const minutes = Math.max(0, Math.ceil((deadline - now) / 60000));
  return <div className="campaign-brief-facts">
    {brief.key_facts?.length > 0 && <dl>{brief.key_facts.map((fact, index) => <div key={index}><dt>{localizedBriefText(fact.label, locale)}</dt><dd dir="auto">{fact.value}</dd></div>)}</dl>}
    {who && <p dir="auto">{who}</p>}{reward && <p dir="auto">{reward}</p>}
    {Number.isFinite(deadline) && <time dateTime={brief.deadline}><bdi>{formatSgt(new Date(deadline).toISOString(), locale, 'end')}{now !== null ? ` · ${new Intl.NumberFormat(locale).format(Math.floor(minutes / 60))}:${String(minutes % 60).padStart(2, '0')}` : ''}</bdi></time>}
  </div>;
}
