"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { haptic, openExternal, tg } from "./tg-bridge";
import { formatSgt, siteUrl } from "./market-policy";

export type WhaleKind = "accumulation" | "distribution" | "position" | "liquidation" | "transfer";

export type WhaleEvent = {
  id: string;
  type?: WhaleKind | string;
  category?: string;
  signalType?: string;
  eventType?: string;
  coin?: string;
  asset?: string;
  platform?: string;
  side?: string;
  totalUsd?: number;
  notionalUsd?: number;
  sizeUsd?: number;
  amountUsd?: number;
  usd?: number;
  pnlUsd?: number;
  closedPnlUsd?: number;
  walletsCount?: number;
  period?: string;
  periodHours?: number;
  avgEntry?: number | string;
  entryPx?: number | string;
  sentence?: string;
  explanation?: string;
  plain?: string;
  summary?: string;
  time?: string;
  chain?: string;
  venue?: string;
  explorerUrl?: string;
  fromLabel?: string;
  toLabel?: string;
};

export type WhalesData = {
  generatedAt?: string;
  updatedAt?: string;
  status?: string;
  schemaVersion?: number;
  stale?: boolean;
  rows?: WhaleEvent[];
  signals?: WhaleEvent[];
  positions?: WhaleEvent[];
  transfers?: WhaleEvent[];
};

const PRIMARY_FEED = "/api/site/whales";
const FALLBACK_FEED = "https://nexualpha.com/api/whales.json";
const POLL_INTERVAL_MS = 45000;
const STALE_THRESHOLD_MS = 5 * 60 * 1000;
const SAFE_EXPLORER_HOSTS = new Set([
  "app.hyperliquid.xyz",
  "hyperliquid.xyz",
  "hypurrscan.io",
  "mempool.space",
  "etherscan.io",
  "www.etherscan.io",
  "tronscan.org",
  "www.tronscan.org",
  "solscan.io",
  "www.solscan.io",
]);

type WhaleLocale = "zh-Hans" | "en";

const COPY: Record<WhaleLocale, {
  title: string;
  all: string;
  loading: string;
  unavailable: string;
  updated: string;
  refreshed: string;
  whale: string;
  whales: (count: number) => string;
  actions: Record<string, string>;
  period: (value: string) => string;
  entry: string;
  pnl: string;
  fromTo: (from: string, to: string) => string;
}> = {
  "zh-Hans": {
    title: "巨鲸动向",
    all: "查看全部 →",
    loading: "加载中",
    unavailable: "暂不可用",
    updated: "已更新",
    refreshed: "巨鲸动向已更新",
    whale: "巨鲸",
    whales: (count) => `${count} 个巨鲸`,
    actions: {
      accumulation: "建仓",
      distribution: "出货",
      open: "开仓",
      increase: "加仓",
      decrease: "减仓",
      close: "平仓",
      increase_short: "加空",
      liquidation: "爆仓",
      transfer: "转账",
      long: "做多",
      short: "做空",
    },
    period: (value) => `在 ${value} 内`,
    entry: "均价",
    pnl: "已实现PnL",
    fromTo: (from, to) => `${from} → ${to}`,
  },
  en: {
    title: "Whale watch",
    all: "View all →",
    loading: "Loading",
    unavailable: "Unavailable",
    updated: "Updated",
    refreshed: "Whale watch updated",
    whale: "Whale",
    whales: (count) => `${count} whales`,
    actions: {
      accumulation: "accumulating",
      distribution: "distributing",
      open: "opened",
      increase: "increased",
      decrease: "reduced",
      close: "closed",
      increase_short: "increased short",
      liquidation: "liquidated",
      transfer: "moved",
      long: "long",
      short: "short",
    },
    period: (value) => `over ${value}`,
    entry: "avg",
    pnl: "realized PnL",
    fromTo: (from, to) => `${from} → ${to}`,
  },
};

function normalizeLocale(locale?: string): WhaleLocale {
  return locale === "en" ? "en" : "zh-Hans";
}

export function whaleUsd(event: WhaleEvent): number {
  const value = event.totalUsd ?? event.notionalUsd ?? event.sizeUsd ?? event.amountUsd ?? event.usd;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatWhaleUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(value >= 10e9 ? 0 : 1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(value >= 100e6 ? 0 : 1)}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatWhaleSignedUsd(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "$0";
  return `${n > 0 ? "+" : "-"}${formatWhaleUsd(Math.abs(n))}`;
}

function compact(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}

function whaleKindText(event: WhaleEvent): string {
  return `${event.signalType || ""} ${event.category || ""} ${event.eventType || ""} ${event.type || ""} ${event.side || ""}`.toLowerCase();
}

function whaleAction(event: WhaleEvent): string {
  const eventType = String(event.eventType || event.type || event.signalType || "").toLowerCase();
  const text = whaleKindText(event);
  if (/increase_short|add_short/.test(eventType) || (/increase|add/.test(eventType) && /short/.test(text))) return "increase_short";
  if (/close|closed/.test(eventType)) return "close";
  if (/decrease|reduce/.test(eventType)) return "decrease";
  if (/increase|add/.test(eventType)) return "increase";
  if (/open|new/.test(eventType)) return "open";
  if (/liquidat/.test(text)) return "liquidation";
  if (/distribution|出货/.test(text)) return "distribution";
  if (/accumulation|建仓/.test(text)) return "accumulation";
  if (/transfer|withdraw|deposit/.test(text)) return "transfer";
  return "open";
}

export function whaleTone(event: WhaleEvent): "up" | "down" | "neutral" {
  const action = whaleAction(event);
  const text = whaleKindText(event);
  if (action === "close") return "neutral";
  if (/increase_short|short|distribution|decrease|reduce|outflow|sell|减仓|出货|做空|转入交易所/.test(`${action} ${text}`)) return "down";
  if (/accumulation|increase|open|long|withdraw|buy|建仓|加仓|做多|转出交易所/.test(`${action} ${text}`)) return "up";
  return "neutral";
}

export function whaleSentence(event: WhaleEvent, locale: string = "zh-Hans"): string {
  const copy = COPY[normalizeLocale(locale)];
  const coin = event.coin || event.asset || "UNKNOWN";
  const amount = formatWhaleUsd(whaleUsd(event));
  const place = event.platform || event.venue || event.chain || "whale feed";
  const action = whaleAction(event);
  const label = copy.actions[action] || copy.actions.open;
  const period = event.period || (Number.isFinite(Number(event.periodHours)) ? `${Number(event.periodHours)}h` : "");
  const wallets = Number(event.walletsCount);
  const actor = Number.isFinite(wallets) && wallets > 1 ? copy.whales(wallets) : copy.whale;
  const entry = event.avgEntry ?? event.entryPx;
  const entryText = entry ? `${copy.entry} ${entry}` : "";
  const pnlSource = event.closedPnlUsd ?? (action === "close" ? event.pnlUsd : undefined);
  const pnlText = pnlSource != null ? `${copy.pnl} ${formatWhaleSignedUsd(pnlSource)}` : "";
  const from = event.fromLabel || "";
  const to = event.toLabel || "";

  if (action === "transfer") {
    const route = from || to ? copy.fromTo(from || "unknown", to || "unknown") : place;
    return compact([`${actor} ${label} ${coin} ${amount}`, route]).replace(/\s+/g, " ").trim();
  }

  const base = normalizeLocale(locale) === "en"
    ? `${actor} ${label} ${coin} ${amount} on ${place}`
    : `${actor}${period ? copy.period(period) : ""}${label} ${coin} ${amount} on ${place}`;
  const withEnglishPeriod = normalizeLocale(locale) === "en" && period ? `${base} ${copy.period(period)}` : base;
  const generated = compact([withEnglishPeriod, entryText, pnlText]).replace(/\s+/g, " ").trim();
  return generated || event.plain || event.summary || event.sentence || event.explanation || copy.title;
}

function whaleRank(event: WhaleEvent): number {
  const text = `${event.signalType || ""} ${event.category || ""} ${event.eventType || ""} ${event.type || ""}`.toLowerCase();
  if (/accumulat|build|add|建仓|加仓|signal/.test(text)) return 0;
  if (/position|liquidat|increase|decrease|close/.test(text)) return 1;
  if (/transfer|exchange|withdraw|deposit/.test(text)) return 2;
  return 3;
}

export function flattenWhaleRows(data: WhalesData | null): WhaleEvent[] {
  if (!data) return [];
  if (Array.isArray(data.rows)) return data.rows.filter((event) => event && event.id).sort((a, b) => whaleRank(a) - whaleRank(b));
  return [...(data.signals || []), ...(data.positions || []), ...(data.transfers || [])].filter((event) => event && event.id);
}

export function safeExplorerUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return SAFE_EXPLORER_HOSTS.has(url.hostname.toLowerCase()) ? url.href : null;
  } catch {
    return null;
  }
}

export function WhaleBoard({ locale = "zh-Hans" }: { locale?: string }) {
  const resolvedLocale = normalizeLocale(locale);
  const copy = COPY[resolvedLocale];
  const [data, setData] = useState<WhalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [srAnnouncement, setSrAnnouncement] = useState("");
  const [justRefreshed, setJustRefreshed] = useState(false);
  const headingId = useId();
  const timeLabelRef = useRef<HTMLSpanElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);
  const lastSuccessTimeRef = useRef(0);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const fetchWhales = useCallback(async (manual = false) => {
    if (manual) {
      setLoading(true);
      setError(false);
    }
    let nextData: WhalesData | null = null;
    for (const url of [PRIMARY_FEED, FALLBACK_FEED]) {
      try {
        const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          nextData = (await res.json()) as WhalesData;
          break;
        }
      } catch {
        // Try the next feed.
      }
    }
    if (!nextData) {
      setError(true);
      setLoading(false);
      return;
    }
    setData(nextData);
    setLoading(false);
    setError(false);
    setSrAnnouncement(copy.refreshed);
    lastSuccessTimeRef.current = Date.now();
    setJustRefreshed(true);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setJustRefreshed(false), 1800);
  }, [copy.refreshed]);

  useEffect(() => {
    const updateLabel = () => {
      if (!timeLabelRef.current) return;
      if (!data) {
        timeLabelRef.current.textContent = loading ? copy.loading : copy.unavailable;
        return;
      }
      const generatedTime = data.generatedAt || data.updatedAt ? Date.parse(data.generatedAt || data.updatedAt || "") : lastSuccessTimeRef.current;
      const refTime = Number.isFinite(generatedTime) && generatedTime > 0 ? generatedTime : lastSuccessTimeRef.current;
      const stale = data.stale || Date.now() - refTime > STALE_THRESHOLD_MS;
      dotRef.current?.classList.toggle("is-stale", stale);
      const sgt = formatSgt(new Date(refTime).toISOString(), resolvedLocale, { time: true });
      timeLabelRef.current.textContent = sgt ? `${copy.updated} ${sgt}` : copy.updated;
    };
    updateLabel();
    const id = setInterval(updateLabel, 1000);
    return () => clearInterval(id);
  }, [copy, data, loading, resolvedLocale]);

  useEffect(() => {
    const scheduleNextPoll = () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (!isActiveRef.current) return;
      pollTimerRef.current = setTimeout(async () => {
        if (isActiveRef.current) {
          await fetchWhales();
          scheduleNextPoll();
        }
      }, POLL_INTERVAL_MS);
    };
    const handleInactive = () => {
      isActiveRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
    const handleActive = () => {
      isActiveRef.current = true;
      if (Date.now() - lastSuccessTimeRef.current > POLL_INTERVAL_MS) fetchWhales();
      scheduleNextPoll();
    };
    const handleVisibility = () => (document.hidden ? handleInactive() : handleActive());
    document.addEventListener("visibilitychange", handleVisibility);
    const telegram = tg();
    try {
      telegram?.onEvent?.("deactivated", handleInactive);
      telegram?.onEvent?.("activated", handleActive);
    } catch {
      // The desktop browser test shim may not implement Telegram events.
    }
    fetchWhales().then(scheduleNextPoll);
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      try {
        telegram?.offEvent?.("deactivated", handleInactive);
        telegram?.offEvent?.("activated", handleActive);
      } catch {
        // The desktop browser test shim may not implement Telegram events.
      }
    };
  }, [fetchWhales]);

  const rows = useMemo(() => flattenWhaleRows(data).slice(0, 6), [data]);
  const openWhales = useCallback(() => {
    haptic("light");
    openExternal(siteUrl(resolvedLocale, "/whales"));
  }, [resolvedLocale]);
  const openRow = useCallback((event: WhaleEvent) => {
    haptic("light");
    openExternal(safeExplorerUrl(event.explorerUrl) || siteUrl(resolvedLocale, "/whales"));
  }, [resolvedLocale]);

  return (
    <section className="na-whale-board" aria-labelledby={headingId}>
      <span className="na-sr-only" role="status" aria-live="polite">{srAnnouncement}</span>
      <div className="na-whale-header">
        <h2 id={headingId} className="na-whale-header__title">{copy.title}</h2>
        <button type="button" className="na-whale-header__link" onClick={openWhales}>{copy.all}</button>
      </div>
      {rows.length > 0 ? (
        <div className="na-whale-list">
          {rows.map((event) => (
            <button key={event.id} type="button" className={`na-whale-row na-whale-row--${whaleTone(event)}`} onClick={() => openRow(event)}>
            <span className="na-whale-row__mark">{event.category === "transfer" || event.type === "transfer" ? (event.chain || "TX").slice(0, 3).toUpperCase() : "HL"}</span>
              <span className="na-whale-row__body">{whaleSentence(event, resolvedLocale)}</span>
              <strong className="na-whale-row__amount">{formatWhaleUsd(whaleUsd(event))}</strong>
            </button>
          ))}
        </div>
      ) : error && !loading ? (
        <button type="button" className="na-whale-error" onClick={() => fetchWhales(true)}>{copy.unavailable}</button>
      ) : null}
      <div className="na-whale-footer">
        <span ref={dotRef} className={`na-whale-footer__dot${justRefreshed ? " na-whale-footer__dot--pulse" : ""}`} aria-hidden="true" />
        <span ref={timeLabelRef} className="na-whale-footer__time">{loading && !data ? copy.loading : copy.updated}</span>
      </div>
    </section>
  );
}
