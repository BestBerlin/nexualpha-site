import { useEffect, useState } from "react";
import { scheduleActivityClock } from "./activity-clock";

export function useActivityNow(deadlines = [], currentDate) {
  const injected = currentDate instanceof Date ? currentDate.getTime() : currentDate;
  const [now, setNow] = useState(() => injected ?? Date.now());
  const boundaryKey = deadlines.filter(Boolean).join("|");
  useEffect(() => {
    if (injected !== undefined) return;
    return scheduleActivityClock(setNow, boundaryKey.split("|"));
  }, [boundaryKey, injected]);
  return injected ?? now;
}
