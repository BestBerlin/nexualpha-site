// Tweens a displayed number toward `target` (expo-out). SSR and reduced motion render the target immediately.
import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useTween(target, duration = 520) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const raf = useRef(0);
  useEffect(() => {
    const end = Number.isFinite(target) ? target : 0;
    if (reduced() || typeof requestAnimationFrame === "undefined") { from.current = end; setValue(end); return undefined; }
    const start = from.current;
    if (start === end) return undefined;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      const v = start + (end - start) * e;
      from.current = v;
      setValue(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}
