# Source and editorial review — Hyperliquid vs dYdX article

Date: 2026-09-22  
Reviewer lane: Codex content recovery lane  
Review status in this lane: `source_and_claim` and `editorial_quality` completed. `seo_aeo_geo` and `compliance_and_commercial` remain pending independent review.

## Official-source facts checked

- Hyperliquid funding docs say funding is paid hourly, is peer-to-peer, uses a premium component against the spot oracle price, and has a predetermined interest-rate component described as 0.01% every 8 hours / 0.00125% every hour. Source: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding.md
- Hyperliquid funding docs say the premium is sampled every 5 seconds and averaged over the hour, and that funding on Hyperliquid is capped at 4% per hour. Source: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding.md
- Hyperliquid liquidation docs say liquidation occurs when account equity falls below maintenance margin; positions are first attempted through market orders on the book, and if equity falls below two-thirds of maintenance margin without successful book liquidation, a liquidator vault backstop can occur. Source: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations.md
- Hyperliquid liquidation docs say partial liquidations apply to positions larger than 100k USDC, with 20% of the position sent as a market liquidation order and a 30-second cooldown after partial liquidation. Source: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations.md
- dYdX trading-fee docs say dYdX uses a maker-taker fee model by default, taker fees are based on trailing 30-day USD volume across perpetual order books, and settings can be adjusted by the applicable Governance Community. Source: https://help.dydx.trade/en/articles/166995-trading-fees-on-dydx
- dYdX funding docs say funding rates are used to align perpetual prices with Oracle Price, use a premium formula with impact bid/ask and index price, calculate the one-hour premium from samples over the last hour, and are subject to governance-adjustable parameters. Source: https://help.dydx.trade/en/articles/166992-default-funding-rates-on-dydx
- dYdX liquidation docs say accounts below maintenance margin may have positions automatically closed by the liquidation engine using protocol-generated liquidation matches and fillable price; profits or losses from liquidations are taken by the insurance fund. Source: https://help.dydx.trade/en/articles/166991-liquidations-on-dydx-chain
- dYdX liquidation docs say up to the entire remaining account value may be taken as a liquidation penalty, while the default v4 software attempts to leave funds after a maximum liquidation penalty of 1.5% where possible; parameters may be governance-adjusted. Source: https://help.dydx.trade/en/articles/166991-liquidations-on-dydx-chain

## Editorial changes made in recovered source

- Preserved the original slug, author, publishedAt and updatedAt in `article.json.recovery` and top-level metadata.
- Added an English answer-extraction table, `Best-fit shortcut, not a universal winner`.
- Added the equivalent Chinese table, `适合谁：不是统一赢家结论`.
- The added copy improves query coverage for fees, funding risk, liquidation design and route-decision intent.
- The added copy keeps all conclusions conditional and source-bound.

## Boundaries retained

- No universal winner claim.
- No live-liquidity, execution-quality, security-superiority, personal eligibility, regional availability or liquidation-outcome claim.
- No user-specific fee promise.
- No new commercial or referral links added.
- No firsthand testing claim added.
