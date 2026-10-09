import { createElement, useEffect, useRef } from "react";
import { prefersReducedMotion } from "./useInView.js";
import { whenReached } from "../revealGuard.js";

/**
 * Blur/translate/opacity reveal on scroll. Server HTML has NO hidden state: the element is fully visible
 * until the client mounts. On mount, only elements that are below the fold get data-state="hidden"
 * (so nothing already on screen flashes), then data-state="shown" when they enter the viewport.
 * No React state, so no re-render. Stagger siblings with index={i}. Reduced motion: never hidden.
 */
export function Reveal({ as = "div", index = 0, className = "", style, children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return undefined;
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight * 0.92) return undefined;
    el.dataset.state = "hidden";
    let stop = () => {};
    const show = () => { el.dataset.state = "shown"; io.disconnect(); stop(); };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        show();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    stop = whenReached(el, show); // fail-safe for blocks jumped past (anchor / End / fast flick / focus / print)
    return () => {
      io.disconnect();
      stop();
      delete el.dataset.state;
    };
  }, []);
  return createElement(
    as,
    { ref, className: `reveal ${className}`.trim(), style: { "--i": index, ...style }, ...rest },
    children,
  );
}
