// Bounded public RPC reads; never mistakes a sampled recipient cohort for total token holders.
export const WHALE_WATCHLIST = [{
  coin: 'AERO',
  chain: 'base',
  address: '0x940181a94a35a4569e4529a3cdfb74e38fd98631'
}, {
  coin: 'WELL',
  chain: 'base',
  address: '0xa88594d404727625a9437c3f886c7643872296ae'
}, {
  coin: 'VIRTUAL',
  chain: 'base',
  address: '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b'
}];
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ZERO = '0x' + '0'.repeat(40);
const addressOf = t => typeof t === 'string' && /^0x[0-9a-f]{64}$/i.test(t) ? '0x' + t.slice(-40).toLowerCase() : null;
const tokenUnits = (raw, decimals) => {
  const digits = BigInt(raw).toString().padStart(decimals + 1, '0');
  return Number(decimals ? `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}` : digits);
};
const hex = v => '0x' + v.toString(16);
async function json(fetchImpl, url, body) {
  const res = await fetchImpl(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json'
    },
    ...(body ? {
      body: JSON.stringify(body)
    } : {}),
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
export async function collectWatchlist({
  fetchImpl = fetch,
  now = Date.now,
  watchlist = WHALE_WATCHLIST,
  rpcUrl = process.env.WHALE_BASE_RPC_URL || 'https://base-rpc.publicnode.com',
  minUsd = 100000
} = {}) {
  const observations = [],
    transfers = [],
    sourceStatus = [];
  let id = 0;
  const rpc = async (method, params) => {
    const p = await json(fetchImpl, rpcUrl, {
      jsonrpc: '2.0',
      id: ++id,
      method,
      params
    });
    if (p.error) throw new Error(p.error.message || 'RPC error');
    return p.result;
  };
  let latest;
  try {
    latest = BigInt(await rpc('eth_blockNumber', [])) - 2n;
    if (latest < 100n) throw new Error('invalid block');
  } catch (error) {
    return {
      observations,
      transfers,
      sourceStatus: [{
        source: 'base-public-rpc',
        status: 'unavailable',
        error: String(error.message),
        observedAt: new Date(now()).toISOString()
      }]
    };
  }
  const from = latest - 99n;
  for (const token of watchlist.slice(0, 5)) {
    try {
      let windowFrom = from;
      let raw = await rpc('eth_getLogs', [{
        address: token.address,
        fromBlock: hex(windowFrom),
        toBlock: hex(latest),
        topics: [TRANSFER]
      }]);
      if (Array.isArray(raw) && raw.length > 1000) {
        windowFrom = latest - 24n;
        raw = await rpc('eth_getLogs', [{
          address: token.address,
          fromBlock: hex(windowFrom),
          toBlock: hex(latest),
          topics: [TRANSFER]
        }]);
      }
      if (!Array.isArray(raw)) throw new Error('invalid log response');
      // Fail closed on oversized windows, malformed/reverted logs, and contract mismatches.
      if (raw.length > 1000) throw new Error('log window exceeds 1000 rows');
      const logs = raw.filter(x => x.removed !== true && x.address?.toLowerCase() === token.address && x.topics?.length === 3 && x.topics[0]?.toLowerCase() === TRANSFER && addressOf(x.topics[1]) && addressOf(x.topics[2]) && /^0x[0-9a-f]{64}$/i.test(x.transactionHash || '') && /^0x[0-9a-f]{64}$/i.test(x.data || '') && /^0x[0-9a-f]+$/i.test(x.logIndex || '') && /^0x[0-9a-f]+$/i.test(x.blockNumber || '') && BigInt(x.blockNumber) >= windowFrom && BigInt(x.blockNumber) <= latest);
      let market = null;
      try {
        const pairs = await json(fetchImpl, `https://api.dexscreener.com/token-pairs/v1/base/${token.address}`);
        market = (Array.isArray(pairs) ? pairs : []).filter(p => p.chainId === 'base' && p.baseToken?.address?.toLowerCase() === token.address && Number(p.priceUsd) > 0).sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0))[0] || null;
      } catch {/* Price unknown: preserve raw-unit facts only. */}
      let decimals = null;
      try {
        decimals = Number(BigInt(await rpc('eth_call', [{
          to: token.address,
          data: '0x313ce567'
        }, hex(latest)])));
        if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) decimals = null;
      } catch {}
      const candidates = [...new Set(logs.map(x => addressOf(x.topics[2])).filter(x => x && x !== ZERO))].slice(0, 3);
      const recipientBalances = [];
      for (const recipient of candidates) {
        const data = '0x70a08231' + recipient.slice(2).padStart(64, '0');
        try {
          const before = BigInt(await rpc('eth_call', [{
            to: token.address,
            data
          }, hex(windowFrom - 1n)]));
          const after = BigInt(await rpc('eth_call', [{
            to: token.address,
            data
          }, hex(latest)]));
          let priorAccountState = null;
          if (before === 0n && after > 0n) {
            try {
              const nonce = await rpc('eth_getTransactionCount', [recipient, hex(windowFrom - 1n)]);
              const nativeBalance = await rpc('eth_getBalance', [recipient, hex(windowFrom - 1n)]);
              const code = await rpc('eth_getCode', [recipient, hex(windowFrom - 1n)]);
              priorAccountState = {
                nonce,
                nativeBalance,
                code,
                zeroNativeState: BigInt(nonce) === 0n && BigInt(nativeBalance) === 0n && code === '0x',
                freshWalletVerified: false
              };
            } catch {/* Historical account state unknown. */}
          }
          recipientBalances.push({
            address: recipient,
            balanceBeforeRaw: before.toString(),
            balanceAfterRaw: after.toString(),
            newTokenHolderInWindow: before === 0n && after > 0n,
            priorAccountState
          });
        } catch {/* Unsupported historical state is unknown. */}
      }
      const dexBuys = [];
      if (market?.pairAddress && market.dexId === 'uniswap' && market.labels?.includes('v2')) {
        try {
          const pool = market.pairAddress.toLowerCase();
          const token0 = addressOf(await rpc('eth_call', [{
            to: pool,
            data: '0x0dfe1681'
          }, hex(latest)]));
          const transactions = [...new Set(logs.filter(x => addressOf(x.topics[1]) === pool).map(x => x.transactionHash))].slice(0, 2);
          for (const transactionHash of transactions) {
            const receipt = await rpc('eth_getTransactionReceipt', [transactionHash]);
            if (receipt?.transactionHash !== transactionHash) continue;
            for (const buy of confirmedV2TokenBuys(receipt, {
              poolAddress: pool,
              tokenAddress: token.address,
              token0
            })) dexBuys.push({
              ...buy,
              transactionHash,
              explorerUrl: `https://basescan.org/tx/${transactionHash}`
            });
          }
        } catch {/* Unsupported pool/receipt decoding gives no buy observation. */}
      }
      const observedAt = new Date(now()).toISOString();
      observations.push({
        ...token,
        source: 'base-public-rpc',
        observedAt,
        fromBlock: hex(windowFrom),
        toBlock: hex(latest),
        sampledTransfers: logs.length,
        dexBuys,
        recipientBalances,
        newHoldersInSample: candidates.length && !recipientBalances.length ? null : recipientBalances.filter(x => x.newTokenHolderInWindow).length,
        holderScope: 'At most 3 observed recipients in 100 blocks; not total holders, wallet age, or whale accumulation.',
        dexContext: market ? {
          pairAddress: market.pairAddress,
          liquidityUsd: Number(market.liquidity?.usd) || null,
          priceUsd: Number(market.priceUsd),
          buysH1: market.txns?.h1?.buys ?? null,
          sellsH1: market.txns?.h1?.sells ?? null
        } : null,
        explorerUrl: `https://basescan.org/token/${token.address}`
      });
      for (const row of logs) {
        const amount = decimals == null ? null : tokenUnits(row.data, decimals);
        const amountUsd = amount != null && market ? amount * Number(market.priceUsd) : null;
        if (!Number.isFinite(amountUsd) || amountUsd < minUsd) continue;
        const fromAddress = addressOf(row.topics[1]),
          toAddress = addressOf(row.topics[2]);
        if (!fromAddress || !toAddress || fromAddress === ZERO || toAddress === ZERO || fromAddress === toAddress) continue;
        transfers.push({
          id: `base:${row.transactionHash}:${row.logIndex}`,
          category: 'transfer',
          type: 'transfer',
          coin: token.coin,
          asset: token.coin,
          chain: 'base',
          source: 'base-public-rpc',
          txid: row.transactionHash,
          logIndex: row.logIndex,
          blockNumber: row.blockNumber,
          tokenAddress: token.address,
          from: {
            address: fromAddress,
            label: 'unknown',
            owner: 'unknown',
            type: 'unknown'
          },
          to: {
            address: toAddress,
            label: 'unknown',
            owner: 'unknown',
            type: 'unknown'
          },
          amount,
          amountUsd,
          priceUsd: Number(market.priceUsd),
          valuation: 'Current DEX reference price; not transaction-time execution value.',
          liquidityUsd: Number(market.liquidity?.usd) || null,
          direction: 'unknown',
          observedAt,
          explorerUrl: `https://basescan.org/tx/${row.transactionHash}`,
          whyItMatters: `Large ${token.coin} transfer; exchange, wallet age and trade intent are unverified.`
        });
      }
      sourceStatus.push({
        source: 'base-public-rpc',
        coin: token.coin,
        status: 'ok',
        observedAt
      });
    } catch (error) {
      sourceStatus.push({
        source: 'base-public-rpc',
        coin: token.coin,
        status: 'unavailable',
        error: String(error.message),
        observedAt: new Date(now()).toISOString()
      });
    }
  }
  const unique = [...new Map(transfers.map(r => [r.id, r])).values()];
  return {
    observations,
    transfers: unique,
    sourceStatus
  };
}
const V2_SWAP = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822';
// Exact V2 output corroborated by ERC20 Transfer in a successful receipt. Router recipient != whale identity.
export function confirmedV2TokenBuys(receipt, {
  poolAddress,
  tokenAddress,
  token0
}) {
  if (receipt?.status !== '0x1' || !Array.isArray(receipt.logs)) return [];
  const pool = poolAddress?.toLowerCase(),
    token = tokenAddress?.toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(pool || '') || !/^0x[0-9a-f]{40}$/.test(token || '') || !/^0x[0-9a-f]{40}$/i.test(token0 || '')) return [];
  const outputs = [];
  for (const swap of receipt.logs) {
    if (swap.removed || swap.address?.toLowerCase() !== pool || swap.topics?.[0]?.toLowerCase() !== V2_SWAP || swap.topics.length !== 3 || !/^0x[0-9a-f]{256}$/i.test(swap.data || '')) continue;
    const recipient = addressOf(swap.topics[2]);
    if (!recipient || recipient === pool) continue;
    const offset = token0.toLowerCase() === token ? 2 : 3;
    const raw = BigInt('0x' + swap.data.slice(2 + offset * 64, 2 + (offset + 1) * 64));
    if (raw <= 0n) continue;
    const transfer = receipt.logs.find(log => !log.removed && log.address?.toLowerCase() === token && log.topics?.[0]?.toLowerCase() === TRANSFER && addressOf(log.topics[1]) === pool && addressOf(log.topics[2]) === recipient && /^0x[0-9a-f]{64}$/i.test(log.data || '') && BigInt(log.data) === raw);
    if (transfer) outputs.push({
      recipient,
      amountRaw: raw.toString(),
      swapLogIndex: swap.logIndex,
      attribution: 'Confirmed V2 token output to swap recipient; router/contract identity and accumulation intent unverified.'
    });
  }
  return outputs;
}
