// Marks a horizontally scrolling row with data-start / data-end while there is more to scroll in that direction,
// so CSS can fade the clipped edge (scroll hint). Pure enhancement: without JS the CSS default fades the trailing edge.
import { useEffect } from "react";

export function useScrollEdges(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const x = Math.abs(el.scrollLeft);
      el.dataset.start = max > 4 && x > 4 ? "1" : "";
      el.dataset.end = max > 4 && x < max - 4 ? "1" : "";
      el.dataset.ready = "1";
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); ro?.disconnect(); window.removeEventListener("resize", update); };
  }, [ref]);
}
