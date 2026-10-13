# Community partner program

The public `/partners` page recruits community partners. `/partners/embed-guide`
retains the existing embedding guide. Neutral locales keep the information-only
guide and never receive recruitment links.

Add reviewed partners to `src/data/partners-program.js`: a unique lowercase `id`,
public `name`, eligible `locales`, and optional `codes` keyed by venue slug. A code
string replaces the main code in the verified registration link. An object may
provide `{ code, url }`; use only an approved HTTPS sub-affiliate registration
link on the venue's registered hosts, carrying a code in its registered signup
path or referral parameter. A bare venue/help URL fails closed to the main link. Missing or invalid entries use the main
verified link. Do not add partners before their locale/venue eligibility and
exchange sub-affiliate configuration are reviewed.

Share `/p/<id>?locale=en&src=community` to open the localized exchange directory.
Attribution uses `p` in the current view's links, with no cookies or storage.
Known partner requests in neutral or unassigned locales are rejected. Existing
venue territorial gates apply before a partner redirect. Clicks add `partnerId`
to the existing anonymous JSONL log; they do not prove signups, trades or revenue.

Set `CLICK_EVENT_FILE` to a private path outside the public build and set
`PARTNER_STATS_TOKENS` to a server-only JSON object mapping partner IDs to random
tokens of at least 24 characters. Never put tokens in the public registry,
client code, commits, analytics, or a public page link. The owner privately shares
`/partners/stats/<id>?t=<token>` with that partner. The same authorization protects
`/api/partner-stats/<id>?t=<token>`. Rotate by replacing the environment token.
Both responses are no-store/noindex and suppress referrers; counts are daily UTC
clicks. Missing logging returns 503; an unwritten log returns an empty dataset.
The stats page reads the log afresh on reload. Restrict access to server access
logs, which may otherwise record query tokens.

The registry ships empty. The owner must set the revenue split individually and
activate partners and server tokens before live onboarding. No deployment is
part of this change.
