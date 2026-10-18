const positive = v => v != null && Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null;
export function enrichWhaleSignals(signals = []) {
  const unique = new Map();
  for (const row of signals) {
    if (!row || !row.coin) continue;
    const canonicalAddress = value => value.startsWith('0x') ? value.toLowerCase() : value;
    const address = row.address ? canonicalAddress(String(row.address)) : (row.addresses || []).map(canonicalAddress).sort().join(',');
    // A transaction is one economic event even if several adapters observed it.
    const key = row.txid || row.transactionHash ? `${row.chain}:${row.txid || row.transactionHash}:${row.logIndex ?? row.tokenAddress ?? row.coin}` : `${row.platform || row.chain || row.source}:${row.coin}:${row.signalType || row.type}:${address}:${row.period || row.periodHours || ''}`;
    const fills = positive(row.fillsCount ?? row.fillCount ?? row.fills);
    const days = positive(row.days ?? row.periodDays) ?? (positive(row.periodHours) ? Number(row.periodHours) / 24 : null);
    const whales = row.addresses?.length ? new Set(row.addresses.map(x => x.startsWith('0x') ? x.toLowerCase() : x)).size : address ? 1 : positive(row.walletsCount);
    const liquidity = positive(row.liquidityUsd),
      size = positive(row.totalUsd ?? row.sizeUsd ?? row.amountUsd);
    const sizeVsLiquidity = liquidity && size ? size / liquidity : null;
    const observations = positive(row.observationCount ?? row.transferCount);
    const confidenceScore = Math.min(90, Math.round(25 + (fills ? Math.min(25, fills * 2) : 0) + (days ? Math.min(15, days * 3) : 0) + (whales ? Math.min(15, whales * 3) : 0) + (sizeVsLiquidity ? Math.min(10, sizeVsLiquidity * 100) : 0) + (observations ? Math.min(5, observations) : 0)));
    const result = {
      ...row,
      confidenceScore,
      confidenceFactors: {
        fills,
        days,
        sizeVsLiquidity,
        whales
      },
      whyItMatters: row.whyItMatters || `${row.coin}: ${fills ? `${fills} observed fills` : observations ? `${observations} observations` : 'observed activity'}${days ? ` across ${Number(days.toFixed(2))} days` : ''}${whales ? ` from ${whales} tracked wallet(s)` : ''}; activity does not establish intent.`,
      explorerUrl: row.explorerUrl || (/^0x[0-9a-f]{40}$/i.test(row.address || '') && row.platform === 'hyperliquid' ? `https://app.hyperliquid.xyz/explorer/address/${row.address}` : null)
    };
    if (!unique.has(key) || unique.get(key).confidenceScore < confidenceScore) unique.set(key, result);
  }
  return [...unique.values()];
}
