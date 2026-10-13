import React, { useEffect, useState } from "react";
import { formatReaderTime, formatSgt } from "../../data/local-time.js";

export function ReaderTime({ iso, locale = "en", style = "clock", relative = false }) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!relative) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [relative]);
  const { title, relative: rel } = formatReaderTime(iso, locale, now);
  return <time dateTime={iso} title={title}><bdi>{formatSgt(iso, locale, style)}</bdi>{relative && rel ? <span> · {rel}</span> : null}</time>;
}
