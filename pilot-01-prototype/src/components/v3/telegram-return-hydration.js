import { useEffect, useState } from "react";

export function useHydratedTelegramReturnNow() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);
  return now;
}

export function telegramReturnClockOption(now) {
  return now === null ? {} : { now };
}

export function hydratedTelegramReturnHref(returnHref, now) {
  return now === null ? undefined : returnHref;
}

export function hydratedTelegramReturnAttrs(attrs = {}, now) {
  if (now !== null) return attrs;
  const { "data-telegram-return-href": _returnHref, ...stableAttrs } = attrs;
  return stableAttrs;
}
