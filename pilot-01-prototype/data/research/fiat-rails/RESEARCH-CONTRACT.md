# Official-source fiat rails research contract

Research only; no site code. Research date: 2026-10-15 (session date). Browser results may carry different crawl dates; record source publication dates separately, never invent dates.

Each agent owns only `research/fiat-rails/exchanges/<exchange>.json`. Do not revert others' edits; do not commit. Use web tools to search and open official exchange, issuer, or regulator sources. No affiliate sources. Do not infer national eligibility from a currency or a globally advertised provider. An inaccessible source does not prove a fact. Prefer 4–8 substantial official pages, and finish with explicit gaps rather than guesses.

JSON structure:
```
{
 "exchange":"Bitget",
 "researched_at":"2026-10-15",
 "sources":[{"id":"bitget-1","url":"https://...","title":"...","accessed_at":"2026-10-15","published_at":null,"notes":null}],
 "global_card_purchase":{"supported":null,"networks":null,"apple_pay":null,"google_pay":null,"fee_percent":null,"limits":null,"countries":null,"source_ids":[],"notes":null},
 "countries":[{"country":"China mainland","methods":[{"method":"bank_transfer","direction":"deposit","available":true,"currency":"EUR","rail":"SEPA","fee":null,"limits":null,"speed":null,"providers":null,"payment_methods_count":null,"source_ids":["bitget-1"],"notes":"Country eligibility must be explicitly evidenced."}],"eligibility_notes":null,"source_ids":[]}],
 "cards":[{"name":"...","status":null,"network":null,"issuer":null,"countries":null,"cashback_percent":null,"fees":null,"application":null,"source_ids":[],"notes":null}],
 "highlights":[],
 "gaps":[]
}
```
Include all 20 country entries exactly: China mainland, Hong Kong, Taiwan, Singapore, Malaysia, Indonesia, Philippines, Vietnam, Thailand, India, Türkiye, Brazil, Argentina, Mexico, Nigeria, EU/SEPA, UK, Japan, Korea, Russia.
For every country include entries for bank_transfer deposit, bank_transfer withdrawal, card_purchase buy, p2p buy_sell, third_party_onramp buy, each using nullable unknown fields. You may add separate named bank/e-wallet rails with direction deposit/withdrawal/buy/buy_sell. Unsupported explicitly evidenced = false; unknown = null. Unknown rows source_ids may be empty. Every non-null factual field must be supported by source_ids and source text (identity fields method/direction and unknown notes excepted). Avoid blanket regional assertions. EU/SEPA is a market grouping, not a country: record actual residence restrictions. Record country P2P methods/count only if documented, otherwise null. Third-party provider presence does not establish country availability.

Cards: distinguish exchange-issued spending cards from Visa/Mastercard purchases, and retired/announced/invitation-only products from live availability. No evasion instructions for China mainland or restricted countries. Explain China mainland uncertainty plainly; do not assume P2P is available.

Use numeric fee_percent only for a single evidenced rate; tier/range/promotion fees as structured objects or text with conditions. Application field is a neutral official eligibility/application description, no circumvention.
