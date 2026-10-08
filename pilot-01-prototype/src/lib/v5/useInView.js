import { useEffect, useRef, useState } from "react";

/** True when the user asked for no motion. Always false on the server. */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

/**
 * SSR-safe viewport observer. Returns [ref, inView]. Server and first client render both give `false`,
 * so there is no hydration mismatch. With once=true (default) it disconnects after the first hit.
 */
export function useInView({ once = true, rootMargin = "0px 0px -10% 0px", threshold = 0 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, rootMargin, threshold]);
  return [ref, inView];
}
