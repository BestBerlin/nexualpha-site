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
