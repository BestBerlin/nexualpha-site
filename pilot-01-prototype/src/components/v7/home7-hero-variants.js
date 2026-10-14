// Home hero variant context (scorecard X5). The headline copy test ran 2026-10-11 → 2026-10-14 and is retired: the hero
// headline is now the live volume sentence (home7-hero-volume.js) for every visitor. The context stays so the worker,
// entries and attribution keep one variant plumbing for a future hero test; with the registry flag off it is always "a".
import { createContext, createElement, useContext } from "react";

// The variant the home hero renders with. Provided by the SSR entry (worker-assigned variant) and the browser entry
// (prerender state, so hydration renders exactly the server markup). Default "a" = the live copy.
export const HomeHeroVariantContext = createContext("a");

export function withHomeHeroVariant(element, variant) {
  return createElement(HomeHeroVariantContext.Provider, { value: variant === "b" ? "b" : "a" }, element);
}

export function useHomeHeroVariant() {
  return useContext(HomeHeroVariantContext);
}
