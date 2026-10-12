# Why Is RSR Up 46% Today? Upbit Listed Reserve Rights, and Shorts Now Pay Almost 2% Every Eight Hours (12 October 2026)

## The short answer

Reserve Rights (RSR) jumped about 46% in 24 hours on 12 October 2026 because Upbit, South Korea's largest exchange, announced at 04:54 UTC that it would add RSR to its Korean won and USDT markets, with trading opening at 05:05 UTC. Binance spot rose from about $0.00166 to a high of $0.002999 within two hours and was near $0.00236 at 08:48 UTC. The futures side is the unusual part: Binance's RSR perpetual settled funding at -1.96% at 08:00 UTC, close to its -2% floor, OKX settled at its -1% floor, and open interest on Binance grew about 4.4 times in coins in eight hours.

## What Upbit announced and when

Upbit posted the notice "리저브라이트(RSR) KRW, USDT 마켓 디지털 자산 추가" (Reserve Rights added to the KRW and USDT markets) at 13:54 Korean time, which is 04:54 UTC. The notice set the start of trading for 14:05 Korean time, eleven minutes later, and listed Ethereum as the only supported network, with the token contract 0x3206…5d70.

The notice also set the usual Upbit listing guardrails. For about five minutes after the open, buy orders were blocked and sell orders more than 10% below the previous close were rejected. For about two hours only limit orders were accepted. Upbit gave a reference previous close of 0.00000002 BTC, equal to 2.262 won or 0.001671 USDT. Deposits must come from exchanges on Upbit's travel-rule list or from personal wallets that passed its ownership check, and the single-withdrawal limit is set at the equivalent of 100 million won twenty business days after listing.

Upbit describes Reserve as a protocol for issuing on-chain index products it calls Decentralized Token Folios (DTFs), each backed one-to-one by a basket of digital assets, and RSR as the token used for staking and governance. RSR stakers act as a first-loss layer that protects a DTF against default of its collateral.

## The price, hour by hour

Binance's hourly candles show how fast the move was. RSR spot traded between $0.00165 and $0.00167 through the early hours of Monday. In the 04:00 UTC candle, which contains the Upbit notice, spot jumped from $0.001658 to a high of $0.002812 and closed at $0.002696, about 63% above the open of that hour. The 05:00 UTC candle, when Upbit trading began, printed the day's Binance spot high of $0.002999. After that the price drifted lower each hour, and the last trade at 08:48 UTC was $0.00236.

Binance's 24-hour ticker put the spot move at +47.1% and the perpetual at +46.1%. NexuAlpha's own market feed, read at 08:43 UTC, listed RSRUSDT among the top movers at +46.1% on $163.9 million of perpetual volume. OKX spot reached $0.00315 at the peak.

On Upbit itself the opening burst went higher. The KRW-RSR market's first price was 3.95 won, it touched 4.98 won and then fell to 2.92 won, all within the first hour. At 17:48 Korean time it traded at 3.23 won. Using Upbit's own KRW-USDT price of 1,347 won, our arithmetic puts that at about $0.00240, roughly 1.6% above Binance spot at the same minute. The 4.98-won peak was about $0.0037, some 23% above Binance's high, which is the usual pattern for a Korean listing: the local book overshoots and then converges with the global price. Upbit's KRW market turned over 40.6 billion won, about $30.1 million by our conversion, in its first four hours.

## Why funding went to the floor

Funding on a perpetual contract is the payment between longs and shorts that keeps the contract close to the spot index. When the perpetual trades below spot, funding turns negative and shorts pay longs. That is what happened here, and by a wide margin.

During the spike, the perpetual lagged spot badly. In the 04:00 UTC hour the Binance perpetual closed at $0.002356 while Binance spot closed at $0.002696, a gap of about 13% by our arithmetic. At 08:48 UTC the mark price of $0.002336 was still about 1% under the index price of $0.00236. A persistent discount like that means more traders wanted to be short the contract than long it, which is typical when holders hedge a listing pump or when traders bet that the pop will fade.

The result on the funding board:

| Venue | Rate | When | Cap or note |
|---|---|---|---|
| Binance RSRUSDT | -1.9616% | settled 08:00 UTC | floor -2%, 8-hour interval |
| Binance RSRUSDT | -1.8649% | predicted for 16:00 UTC | read at 08:48 UTC |
| OKX RSR-USDT-SWAP | -1.00% | settled 08:00 UTC | floor -1% |
| OKX RSR-USDT-SWAP | -1.00% | current period, next settlement 12:00 UTC | interval shortened from 8 hours |
| Hyperliquid RSR | -0.1254% per hour | live at 08:50 UTC | max leverage 3x |

Before the listing, Binance funding had been the ordinary +0.01% for the previous eleven settlements. OKX had hovered around zero. A single settlement of -1.96% means a short holding $10,000 of RSR on Binance paid about $196 to longs at 08:00 UTC; at the predicted rate the next payment is about $186. Hyperliquid's hourly rate, if it held for eight hours, would add up to roughly -1.0% by our arithmetic.

::embed funding

The funding board above updates live; the rates in the table are the ones we read on 12 October between 08:43 and 08:50 UTC.

## Open interest and who is positioned

Binance's open-interest history shows how much new leverage arrived. At 00:00 UTC there were 1.037 billion RSR in open contracts, worth about $1.72 million. By 08:00 UTC that was 4.60 billion RSR, worth $10.78 million, and at 08:48 UTC it was 4.76 billion RSR, about $11.1 million at the mark price. In coins, open interest rose about 4.4 times in eight hours. Applying the 08:00 UTC rate to the 08:00 UTC open interest, shorts on Binance paid longs roughly $211,000 in that one settlement, by our arithmetic.

Binance's long/short account ratio tells the same story from a different angle. At 03:00 UTC, before the notice, 62.7% of accounts with an RSR position were long. By 05:00 UTC that had dropped to 51.7%, and at 08:00 UTC it was 54.5%. The ratio counts accounts, not money, so it does not tell us how large the short positions are, but it confirms that many traders shorted into the spike.

## What to watch next

- **The funding settlements at 12:00 UTC (OKX) and 16:00 UTC (Binance).** If the perpetual discount narrows, funding moves back toward zero. If it stays near the floor, shorts keep bleeding, which can force some to close and push the price up again.
- **The Upbit premium.** At 1.6% it has nearly closed. A renewed gap would point to Korean demand leading again.
- **Open interest versus price.** Falling open interest with a falling price would mean the new shorts are taking profit; rising open interest on a falling price would mean more shorts are being added.
- **Withdrawal flows on Upbit.** The 100-million-won withdrawal limit applies only after twenty business days, so early arbitrage flows depend on the deposit side.

## How to act on this

Listing pumps in Korea tend to be fast in both directions: on Upbit RSR went from 3.95 won to 4.98 and down to 2.92 within an hour. If you trade the move on futures, keep leverage low enough that a 20% swing does not liquidate you, check the funding rate on your venue before you open a short, since -2% every eight hours wipes out a short's gain on a slow drift, and remember that a negative rate pays longs only while the discount lasts. Fast trades also add up in fees: OKX charges regular accounts 0.02% maker and 0.05% taker on USDT perpetuals, and registering with code nexu888 returns 40% of trading fees, settled hourly. If you prefer on-chain perpetuals, Hyperliquid lists RSR with 3x maximum leverage and you can sign up with code NEXU888. See the [OKX profile](/exchanges/okx), the [Hyperliquid profile](/exchanges/hyperliquid), our [funding-rate board](/funding-rates) and the [liquidations tracker](/liquidations).

## Quick answers

**Why is RSR up today?** Upbit announced at 04:54 UTC on 12 October 2026 that it would list RSR against the Korean won and USDT, with trading from 05:05 UTC. The price rose about 46% in 24 hours on Binance.

**Is RSR funding negative?** Yes, sharply. Binance settled at -1.96% at 08:00 UTC against a -2% floor, and OKX settled at its -1% floor.

**Which network does Upbit support for RSR?** Only Ethereum, per Upbit's notice.

**What is RSR used for?** Staking and governance in the Reserve protocol, where stakers provide first-loss cover for DTF index products.

**Did anything else cause the rally?** We found no official Reserve announcement for 12 October. Some aggregator posts linked the move to ETF interest; we could not verify that and the timing matches the Upbit notice.

For context on how funding works, see our [funding rate explainer](/news/what-is-funding-rate-crypto-perpetuals-how-it-is-calculated), and for a similar move earlier today, our piece on [Wormhole's 66% rally](/news/wormhole-w-token-up-66-percent-why-funding-split-leverage).

## Limits of this article

Prices, open interest, positioning and funding were read between 08:43 and 08:50 UTC on 12 October 2026 and will have changed. Dollar open interest, the perpetual-spot gap, the won-to-dollar conversion and the funding amounts are our arithmetic from exchange data. The long/short ratio counts accounts, not position size. We did not verify liquidations on RSR specifically or the identity of large traders. Partner links may earn NexuAlpha a commission paid by the exchange, at no extra cost to you.
