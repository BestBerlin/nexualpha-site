// Scroll-gated hydration for below-the-fold sections (perf lane, 2026-10-11).
//
// The server renders the children normally, inside a Suspense boundary, so crawlers and no-JS readers get the complete
// HTML. In the browser the same boundary suspends (a gate promise is thrown) until the section's server-rendered
// element approaches the viewport or receives a pointer, key or focus. React leaves the server HTML in place while the
// boundary is dehydrated, so nothing disappears or shifts; only the component JavaScript (and any React.lazy chunk
// behind it) is fetched later. Without a matching server element (client-only render) the gate opens at once.
//
// A dehydrated boundary that receives an update is client-rendered by React (its server HTML is dropped, React error
// 421), so until the boundary has hydrated the gate hands React the very same element on every parent render. Once the
// hydrated content signals readiness, live children (current props) take over.
import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";

export function createVisibilityGate() {
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  const gate = { open: false, promise, release: () => { if (!gate.open) { gate.open = true; release(); } } };
  return gate;
}

function Gate({ gate, children }) {
  if (!gate.open) throw gate.promise;
  return children;
}

function Ready({ onReady }) {
  useEffect(() => { onReady(); }, [onReady]);
  return null;
}

export const DEFER_OPEN_EVENTS = Object.freeze(["pointerdown", "keydown", "focusin", "toggle"]);

function ClientGate({ target, rootMargin, prefetch, interactionOnly, children }) {
  const [gate] = useState(createVisibilityGate);
  const [live, setLive] = useState(false);
  const frozen = useRef(null);
  const onReady = useCallback(() => setLive(true), []);
  useEffect(() => {
    if (gate.open) return undefined;
    const open = () => { gate.release(); prefetch?.(); };
    const element = target ? document.querySelector(target) : null;
    if (!element || (!interactionOnly && typeof IntersectionObserver === "undefined")) { open(); return undefined; }
    // Content behind a collapsed <details> (interactionOnly): nothing is visible until the reader opens it, so only the
    // interaction events below load the chunk. A disclosure the browser already expanded (fragment navigation into it,
    // find-in-page) hydrates at once.
    if (interactionOnly && element.open) { open(); return undefined; }
    const observer = interactionOnly ? null : new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) open(); }, { rootMargin });
    observer?.observe(element);
    // A reader who reaches the section before the observer fires (anchor jump, keyboard, tap) opens the gate too.
    for (const type of DEFER_OPEN_EVENTS) element.addEventListener(type, open, { capture: true, passive: true, once: true });
    return () => {
      observer?.disconnect();
      for (const type of DEFER_OPEN_EVENTS) element.removeEventListener(type, open, { capture: true });
    };
  }, [gate, target, rootMargin, prefetch, interactionOnly]);
  if (live) return <Suspense fallback={null}>{children}</Suspense>;
  // Same element reference on every render until hydrated: React bails out, so no update reaches the dehydrated boundary.
  if (!frozen.current) frozen.current = <Suspense fallback={null}><Gate gate={gate}>{children}<Ready onReady={onReady} /></Gate></Suspense>;
  return frozen.current;
}

/**
 * @param {object} props
 * @param {string} props.target CSS selector of the server-rendered element that marks the section (must exist in SSR HTML).
 * @param {string} [props.rootMargin] IntersectionObserver margin; the default loads half a viewport ahead.
 * @param {() => void} [props.prefetch] Starts the chunk download the moment the gate opens (pass the React.lazy loader).
 * @param {boolean} [props.interactionOnly] No visibility observer: open only on pointer/key/focus/toggle inside the target
 *   (or when the target is a <details> that is already open). For content hidden behind a collapsed disclosure.
 */
export function DeferUntilVisible({ target, rootMargin = "50% 0px", prefetch, interactionOnly = false, children }) {
  if (typeof window === "undefined") return <Suspense fallback={null}>{children}</Suspense>;
  return <ClientGate target={target} rootMargin={rootMargin} prefetch={prefetch} interactionOnly={interactionOnly}>{children}</ClientGate>;
}
