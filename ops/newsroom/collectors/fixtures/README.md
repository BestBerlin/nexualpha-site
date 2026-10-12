# Collector fixtures

Tests make no live requests. Fixtures in `recorded/` are small extracts from the
owner-supplied reachability captures in
`/Volumes/致态2TB/nx-agents/newsroom/evidence/probes/`, recorded on 2026-10-12.
The filenames correspond to `out_okx`, `out_bybit`, `out_bitget`,
`out_kraken_status`, `out_courtlistener`, `out_efts_fts`, `out_sec_press`,
`out_cointelegraph`, `out_gtrends`, and `x_search.json`. JSON arrays are truncated
to two records; unnecessary CourtListener fields and RSS full-content bodies
are removed. XML excerpts retain titles, IDs, links, source times and bounded
descriptions. No request headers or credentials are copied.

Other fixtures are deterministic response-shaped samples for anomalies,
malformed responses, missing authorization, quota exhaustion and parser edge
cases. Market feed samples also preserve the existing repository feed contract.
Fixtures prove parsing and failure behavior, not current service availability.
