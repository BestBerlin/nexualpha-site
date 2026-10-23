import React, { useEffect, useState } from "react";
import { formatReaderTime, formatSgt } from "../../data/local-time.js";
import { scheduleVisible } from "./visibility-scheduler.js";

export function ReaderTime({ iso, locale = "en", style = "clock", relative = false }) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!relative) return;
    setNow(Date.now());
    return scheduleVisible(setNow, 30000);
  }, [relative]);
  const { title, relative: rel } = formatReaderTime(iso, locale, now);
  return <time dateTime={iso} title={title}><bdi>{formatSgt(iso, locale, style)}</bdi>{relative && rel ? <span> · {rel}</span> : null}</time>;
}
