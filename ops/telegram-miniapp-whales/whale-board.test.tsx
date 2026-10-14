import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { flattenWhaleRows, formatWhaleUsd, safeExplorerUrl, whaleSentence, whaleTone, WhaleBoard } from "./whale-board";

describe("WhaleBoard component", () => {
  it("renders the static shell without coin movers copy", () => {
    const html = renderToString(React.createElement(WhaleBoard));
    expect(html).toContain("巨鲸动向");
    expect(html).toContain("查看全部 →");
    expect(html).not.toContain("今日异动");
    expect(html).not.toContain("涨幅");
    expect(html).not.toContain("跌幅");
  });

  it("supports the English Mini App locale shell", () => {
    const html = renderToString(React.createElement(WhaleBoard, { locale: "en" }));
    expect(html).toContain("Whale watch");
    expect(html).toContain("View all →");
  });

  it("orders accumulation signals before positions and transfers", () => {
    const rows = flattenWhaleRows({
      generatedAt: "2026-10-14T08:00:00Z",
      transfers: [{ id: "t", type: "transfer", asset: "BTC", usd: 50_000_000 }],
      positions: [{ id: "p", type: "position", coin: "ETH", sizeUsd: 30_000_000 }],
      signals: [{ id: "s", type: "accumulation", coin: "SOL", totalUsd: 28_000_000 }],
    });
    expect(rows.map((row) => row.id)).toEqual(["s", "p", "t"]);
  });

  it("orders the collector rows contract by signal, position, transfer", () => {
    const rows = flattenWhaleRows({
      generatedAt: "",
      updatedAt: "2026-10-14T08:00:00Z",
      status: "ok",
      schemaVersion: 2,
      rows: [
        { id: "t", category: "transfer", asset: "USDT", amountUsd: 45_000_000 },
        { id: "p", category: "position", eventType: "increase", coin: "BTC", notionalUsd: 22_000_000 },
        { id: "s", category: "signal", signalType: "accumulation", coin: "HYPE", totalUsd: 33_000_000, periodHours: 72 },
      ],
    });
    expect(rows.map((row) => row.id)).toEqual(["s", "p", "t"]);
  });

  it("formats amount and tone for accumulation and distribution", () => {
    expect(formatWhaleUsd(28_400_000)).toBe("$28.4M");
    expect(whaleTone({ id: "s", type: "accumulation", coin: "SOL", side: "同步做多" })).toBe("up");
    expect(whaleTone({ id: "d", type: "distribution", coin: "BTC", side: "减仓" })).toBe("down");
  });

  it("creates a plain sentence when the collector does not send one", () => {
    expect(whaleSentence({ id: "p", category: "position", coin: "HYPE", notionalUsd: 12_400_000, platform: "Hyperliquid" }))
      .toBe("巨鲸开仓 HYPE $12.4M on Hyperliquid");
    expect(whaleSentence({ id: "p", category: "position", eventType: "increase_short", coin: "BTC", notionalUsd: 24_000_000, platform: "Hyperliquid" }, "en"))
      .toBe("Whale increased short BTC $24.0M on Hyperliquid");
    expect(whaleSentence({ id: "p", category: "position", eventType: "close", coin: "ETH", notionalUsd: 21_000_000, closedPnlUsd: -1_500_000, platform: "Hyperliquid" }))
      .toBe("巨鲸平仓 ETH $21.0M on Hyperliquid · 已实现PnL -$1.5M");
  });

  it("generates localized field-based copy instead of blindly rendering explanations", () => {
    const event = {
      id: "s",
      category: "signal",
      signalType: "accumulation",
      coin: "HYPE",
      totalUsd: 33_000_000,
      walletsCount: 3,
      periodHours: 72,
      avgEntry: "$41.2",
      explanation: "English source sentence should not replace the localized row",
    };
    expect(whaleSentence(event)).toBe("3 个巨鲸在 72h 内建仓 HYPE $33.0M on whale feed · 均价 $41.2");
    expect(whaleSentence(event, "en")).toBe("3 whales accumulating HYPE $33.0M on whale feed over 72h · avg $41.2");
  });

  it("allows only known explorer hosts for row clicks", () => {
    expect(safeExplorerUrl("https://mempool.space/tx/abc")).toBe("https://mempool.space/tx/abc");
    expect(safeExplorerUrl("https://evil.example/tx/abc")).toBeNull();
    expect(safeExplorerUrl("http://etherscan.io/tx/abc")).toBeNull();
  });
});
