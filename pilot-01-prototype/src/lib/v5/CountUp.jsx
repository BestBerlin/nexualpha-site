import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./useInView.js";

/**
 * Animated number. Server and first paint render the FINAL formatted value (no hydration flash).
 * Below-the-fold numbers fade/translate in; the digits are never tweened (no wrong intermediate figures).
 * Reduced motion: stays on the final value. Renders a span with class "num" (tabular figures).
 * <CountUp value={1234.5} decimals={1} prefix="$" suffix="M" locale="en" />
 */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", locale, duration = 900, className = "num", ...rest }) {
  const ref = useRef(null);
  const fmt = (n) =>
    prefix + new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n) + suffix;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined" || !el.animate) return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return undefined;
    // Trust rule: the verified figure is ALWAYS the final value. Only opacity/translate animate.
    let anim = null;
    el.style.opacity = "0";
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      anim = el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: Math.min(duration, 480), easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" });
      anim.onfinish = () => { el.style.opacity = ""; anim.cancel(); };
    });
    io.observe(el);
    return () => { io.disconnect(); if (anim) anim.cancel(); el.style.opacity = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, prefix, suffix, locale, duration]);
  return (
    <span ref={ref} className={className} data-value={value} {...rest}>
      {fmt(value)}
    </span>
  );
}
