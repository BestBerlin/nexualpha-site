// Deterministic JSON-RPC fixture, not a live chain or bandwidth measurement.
export const USDT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
export const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
export const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const hex = n => `0x${n.toString(16)}`;
const topic = address => `0x${"0".repeat(24)}${address.slice(2)}`;
export const UNKNOWN = `0x${"1".repeat(40)}`;

export function rpcFixture(exchangeAddress) {
  let head = 1000;
  let failLogs = false;
  const calls = [];
  const log = (index, address, block = 995, from = UNKNOWN, to = UNKNOWN) => ({
    address, transactionHash: `token-${index}`, logIndex: hex(index), blockNumber: hex(block),
    topics: [TRANSFER, topic(from), topic(to)], data: hex(2_000_000n * 10n ** 6n),
  });
  const logs = [
    ...Array.from({ length: 24 }, (_, i) => log(i, i % 2 ? USDT : USDC)),
    log(24, USDC, 800, UNKNOWN, exchangeAddress),
    { ...log(25, USDT), removed: true },
    log(26, USDC, 1003),
  ];
  const fetchImpl = async (_url, init) => {
    const request = JSON.parse(init.body);
    const { method, params } = request;
    let result;
    if (method === "eth_blockNumber") result = hex(head);
    else if (method === "eth_getBlockByNumber") {
      const n = Number.parseInt(params[0], 16);
      result = { number: params[0], timestamp: hex(1791853200 + n * 12), transactions: params[1] && n === 995 ? [
        { hash: "native-success", from: UNKNOWN, to: exchangeAddress, value: hex(300n * 10n ** 18n) },
        { hash: "native-reverted", from: UNKNOWN, to: exchangeAddress, value: hex(400n * 10n ** 18n) },
      ] : [] };
    } else if (method === "eth_getTransactionReceipt") result = { status: params[0] === "native-reverted" ? "0x0" : "0x1" };
    else if (method === "eth_getLogs") {
      const filter = params[0];
      const addresses = [].concat(filter.address);
      result = logs.filter(entry => {
        const block = Number.parseInt(entry.blockNumber, 16);
        return addresses.includes(entry.address) && block >= Number.parseInt(filter.fromBlock, 16) && block <= Number.parseInt(filter.toBlock, 16)
          && filter.topics.every((value, i) => value == null || [].concat(value).includes(entry.topics[i]));
      });
      // A repeated event must not create a second row.
      if (result.length) result = [...result, result[0]];
    } else throw new Error(`unexpected RPC method ${method}`);
    const response = method === "eth_getLogs" && failLogs ? { error: { message: "fixture rate limit" } } : { jsonrpc: "2.0", id: 1, result };
    calls.push({ request, requestBytes: Buffer.byteLength(init.body), responseBytes: Buffer.byteLength(JSON.stringify(response)) });
    return { ok: true, json: async () => response };
  };
  return { fetchImpl, calls, setHead: n => { head = n; }, failLogs: () => { failLogs = true; } };
}

export const payloadTotals = calls => ({
  calls: calls.length,
  requestBytes: calls.reduce((sum, call) => sum + call.requestBytes, 0),
  responseBytes: calls.reduce((sum, call) => sum + call.responseBytes, 0),
});
