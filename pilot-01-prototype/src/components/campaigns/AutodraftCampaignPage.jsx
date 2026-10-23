import { SignupEvidence } from "../shared/SignupEvidence.jsx";
import React from 'react';
import { approvedCampaign, campaignSignup } from '../../data/campaign-autodraft.js';

export function AutodraftCampaignPage({ id, locale = 'en', market }) {
  const campaign = approvedCampaign(`/activities/${id}`);
  if (!campaign) return null;
  const copy = campaign.copy[locale] || campaign.copy.en;
  const signup = campaignSignup(campaign, { locale, market });
  const zh = locale === 'zh-Hans';
  return <main className="nxad campaign-page" style={{ maxWidth: 960, margin: 'auto', padding: '48px 24px' }}>
    <p>{campaign.venue}</p><h1>{copy.title}</h1><p>{copy.rewardHeadline}</p>
    <dl><dt>{zh ? '活动时间（SGT）' : 'Campaign dates (SGT)'}</dt><dd>{campaign.startAt} – {campaign.endAt}</dd></dl>
    <h2>{zh ? '参与资格' : 'Who can participate'}</h2><p>{copy.eligibility}</p>
    <h2>{zh ? '参与步骤' : 'Steps'}</h2><ol>{copy.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
    {signup && <p><a href={signup.href} data-signup-cta="campaign">{zh ? '前往活动' : 'Continue to campaign'}</a><SignupEvidence slug={campaign.venue} locale={locale} market={market} /></p>}
    <h2>{zh ? '官方来源' : 'Official source'}</h2><p>{campaign.sourceUrl}</p>
  </main>;
}
