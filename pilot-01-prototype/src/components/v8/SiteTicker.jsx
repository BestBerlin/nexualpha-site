// Site-wide strip of the newest official exchange notices (direction A: intel desk). Same feed and fail-closed rules as
// the home desk: nothing renders until the official feed loads; a failed or empty feed renders nothing.
import { useEffect, useState } from "react";
import { readIntelFeed } from "../../data/announcement-intel.js";
import { localizedHref } from "../../data/locale-routing.js";
import { h7Copy } from "../v7/home7-copy.js";
import "../../styles/v8/site-ticker.css";

const FEED_URL = "/content/official-announcements.json";
const VENUES = ["okx", "binance", "bitget", "bybit"];
const NAMES = { okx: "OKX", binance: "Binance", bitget: "Bitget", bybit: "Bybit" };
const SHOW = ["listing", "event", "delisting", "news", "product", "security"];

export function SiteTicker({ locale = "en" }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(FEED_URL, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive) setItems(j ? readIntelFeed(j, { venues: VENUES }).filter((i) => SHOW.includes(i.category)).slice(0, 6) : []); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, []);
  if (!items || !items.length) return null;
  const t = h7Copy(locale);
  const now = Date.now();
  const row = (hidden) => items.map((i) => (
    <a key={`${hidden ? "d" : "o"}-${i.id}`} className="nx-tick__i" href={i.url} target="_blank" rel="noopener noreferrer nofollow" tabIndex={hidden ? -1 : undefined} aria-hidden={hidden || undefined}>
      <b>{NAMES[i.venue]}</b> {t.inCat[i.category]} · {i.title} · {t.inAgo(now - Date.parse(i.publishedAt))}
    </a>
  ));
  return (
    <div className="nx-tick" role="region" aria-label={t.tick}>
      <a className="nx-tick__live" href={localizedHref("/#h7-intel", { locale })}>{t.tick}</a>
      <div className="nx-tick__vp"><div className="nx-tick__run">{row(false)}{row(true)}</div></div>
    </div>
  );
}
