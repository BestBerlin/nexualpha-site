import { useEffect } from "react";

/**
 * Pointer-follow for .spotlight cards. Writes --mx/--my (px, relative to the card) straight to
 * element.style, outside React state. Attach once to a container; every .spotlight inside is tracked.
 * useSpotlight(containerRef). Coarse pointers and reduced motion are skipped.
 */
export function useSpotlight(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return undefined;
    const onMove = (e) => {
      const card = e.target.closest?.(".spotlight");
      if (!card || !root.contains(card)) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    return () => root.removeEventListener("pointermove", onMove);
  }, [ref]);
}
