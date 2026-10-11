# Exchange keyword article edits (2026-10-11)

These are retitle suggestions for the two English sign-up guides. They come from the exchange keyword plan
(`exchange-keyword-map-2026-10-11.md`, section 2, item 10). The site code was not changed for these articles. The lead
applies the edits through the content publisher, because articles are republished from the feed.

**Problem.** On English OKX and Bitget, two pages compete for the head term "<exchange> referral code":

- the exchange profile (`/exchanges/okx`, `/exchanges/bitget`);
- the sign-up guide (`/news/how-to-sign-up-…`).

**Decision (owner plan).** The **profile owns the head term**. Its title stays "OKX Referral Code nexu888: Up to 40% Fee
Rebate (2026)", generated from the partner feed by `referral-seo.js`. Each **guide is retitled to own the long tail**:
"where to enter the code", "web / app", "after sign-up" and "forgot the code". It links to the profile for the code and
rebate.

**Rules.**

- Change only the title, description and the first lines of the intro. Do not edit the body.
- Make no new claims. Every phrase below already appears in the article body: there are H2s for where to enter the code
  (web and app), for "already signed up without a code" and for "does the code have to be entered at sign-up".
- Keep titles at or under 60 display columns (`titleDisplayWidth`) and descriptions at or under 160 characters. The
  publisher's `seo.title` / `seo.description` and the visible `title` / `summary` should match.
- Take the invite code from the partner feed. Do not type a new code.

Live state was read from production on 2026-10-11. Both pages are `index,follow` and canonical to themselves.

## 1. `/news/how-to-sign-up-okx-referral-code-nexu888-fee-rebate`

| Field | Now | Suggested |
|---|---|---|
| `<title>` | OKX Referral Code nexu888 (2026): Where to Enter It, 40% Rebate | **Where to Enter the OKX Referral Code (Web and App, 2026)** (56 cols) |
| H1 / `title` | OKX Referral Code nexu888: Where to Enter It at Sign-Up, What If You Forget, and the 40% Fee Rebate (2026) | **Where to Enter the OKX Referral Code: Web, App, and If You Already Signed Up (2026)** |
| Description | Enter OKX referral code nexu888 in the optional referral field before you finish signing up, or open the invite link that fills it in. | **Enter OKX referral code nexu888 in the optional referral field on the web or app sign-up form. It cannot be added after the account exists; see what to do.** (155 chars) |

**Intro link.** Add this as the last sentence of the first paragraph under `## The short answer`:

> The code, the current rebate share and the official sign-up link are on the [OKX profile](/exchanges/okx).

**Why.** The guide stops repeating "Referral Code nexu888 … 40% Rebate", which is the profile's head-term title. It keeps
the long-tail wording people search for, from the map rows "okx referral code where to find / after registration" and
"nerede yazılır". The body already answers these under "Where to enter the code: website / mobile app" and "What if you
already signed up without a code?".

## 2. `/news/how-to-sign-up-bitget-referral-code-fee-rebate`

| Field | Now | Suggested |
|---|---|---|
| `<title>` | How to Sign Up on Bitget (2026): Referral Code nexu888 and 60% Fee Rebate | **Where to Enter the Bitget Referral Code (Web and App, 2026)** (59 cols) |
| H1 / `title` | How to Sign Up on Bitget in 2026: Referral Code nexu888, Setup Steps and Up to 60% Fee Rebate | **How to Sign Up on Bitget: Where the Referral Code Goes, Setup Steps and Security (2026)** |
| Description | Step-by-step Bitget sign-up: where to enter referral code nexu888, password rules, 2FA and anti-phishing setup, VIP 0 fees and how up to 60% of fees comes back… | **Where the Bitget referral code goes on web and app sign-up, whether it can be added later, and the setup steps. Code nexu888; partner link disclosed.** (149 chars) |

**Intro link.** Add this as the last sentence of the first paragraph under `## The short answer`:

> The code, the current rebate share and the official sign-up link are on the [Bitget profile](/exchanges/bitget).

**Why.** The current description is cut off at "…", and the title competes with the profile's "Bitget Referral Code
nexu888: Up to 60% Fee Rebate". The suggested title and description use the article's own H2s: "Step-by-step
registration (website)" and "Does the code have to be entered at sign-up?".

## After publishing

- Do not add a canonical from the guide to the profile. Each page should own a different query.
- After the next deploy, run `node scripts/search-engines.mjs submit`.
- Compare GSC queries per page with `node scripts/search-engines.mjs perf 28`. Success means:
  - "okx referral code" and "bitget referral code" move to the profile URLs;
  - "where to enter … referral code" and "… after registration" stay on the guides.
