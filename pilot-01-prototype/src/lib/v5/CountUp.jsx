import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./useInView.js";

const easeOut = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Animated number. Server and first paint render the FINAL formatted value (no hydration flash).
 * The count only runs for numbers that start below the fold; it writes textContent directly (no React state).
 * Reduced motion: stays on the final value. Renders a span with class "num" (tabular figures).
 * <CountUp value={1234.5} decimals={1} prefix="$" suffix="M" locale="en" />
 */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", locale, duration = 900, className = "num", ...rest }) {
  const ref = useRef(null);
  const fmt = (n) =>
    prefix + new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n) + suffix;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return undefined;
    let raf = 0;
    el.textContent = fmt(0);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        el.textContent = fmt(value * easeOut(p));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = fmt(value);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, prefix, suffix, locale, duration]);
  return (
    <span ref={ref} className={className} data-value={value} {...rest}>
      {fmt(value)}
    </span>
  );
}
