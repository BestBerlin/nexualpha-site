export default {
  query: name => `${name} referral code`,
  labels: { code: 'Code', benefit: 'User benefit', entry: 'Where to enter', later: 'Can it be added later?', payout: 'Payout', verified: 'Verified', check: 'Check', source: 'Source', log: 'Verification log', calculator: 'Rebate calculator' },
  verifiedTitle: (name, code, benefit, date) => `${name} referral code: ${code} — ${benefit} (verified ${date})`,
  share: percent => `Up to ${percent}% of fees back`,
  noBenefit: 'No verified user benefit', pending: 'Not verified', cadence: { hourly: 'hourly', daily: 'daily' },
  entryText: 'Enter and check the referral field before completing registration.',
  laterUnknown: 'The reviewed official help does not document adding a code after registration. This is unconfirmed, not proof that it is impossible.',
  laterBybit: 'Only an eligible main account with no existing affiliate or referrer can add an affiliate code within 14 days. Ordinary referral codes, market-maker and institutional accounts are excluded; regional restrictions apply. The code cannot be changed or cancelled afterwards. This does not confirm that the code on this page qualifies.',
  laterBinance: 'Binance allows conditional affiliate rebinding, not arbitrary code replacement. Applicants need completed KYC and account review, a main account, no referrer, less than $5,000 volume in the previous 90 days, and region/risk eligibility. An affiliate application requires $150,000 eligible volume within 30 days; zero-fee pairs and subaccounts are excluded. Self-rebind for accounts without trading history is separate. This page does not confirm this code qualifies; do not trade just to rebind.',
  faqEntry: name => `Where do I enter a ${name} referral code?`, faqLater: name => `Can a ${name} code be added after sign-up?`, faqPayout: name => `When does ${name} pay the rebate?`,
  payoutText: (name, cadence) => `Partner terms report ${name} pays ${cadence}. Product, region, account tier and promotion eligibility still need account-level confirmation.`,
  noPayout: 'No verified user rebate payout schedule',
};

// Venue-specific entry steps from the reviewed official help records.
// These supplement the shared interface copy without changing locale policy.
export const entryByVenue = {
  "bitget": "In the website form, enter the optional referral code after email or phone, before clicking Next.",
  "okx": "Check the prefilled code before completing sign-up. OKX says a previous referral link can remain associated with the device for 30 days.",
  "binance": "In the Binance app, check the referral code at the account-created step, before proceeding to KYC. A linked code cannot be modified.",
  "bybit": "Enter the referral or affiliate code before clicking Sign Up Now.",
  "coinw": "Enter the referral code during registration to establish the invitation relationship.",
  "kraken": "Enter the code while creating an account in the Kraken app. App-specific conditions do not verify this partner code’s benefit."
};
