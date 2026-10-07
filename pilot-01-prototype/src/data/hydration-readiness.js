export const ROOT_HYDRATED_ATTR = "nexualphaHydrated";
export const INTERACTION_READY_ATTR = "nexualphaInteractionReady";
export const INTERACTION_SCOPE_START_ATTR = "nexualphaScopeStart";
export const INTERACTION_SCOPE_END_ATTR = "nexualphaScopeEnd";
export const ROOT_HYDRATED_EVENT = "nexualpha:hydrated";
export const INTERACTION_READY_EVENT = "nexualpha:interaction-ready";

function escapeScopeSelector(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

function dispatchReadiness(eventName, scope) {
  if (typeof window === "undefined") return;
  const event = typeof CustomEvent === "function"
    ? new CustomEvent(eventName, { detail: scope ? { scope } : undefined })
    : new Event(eventName);
  window.dispatchEvent(event);
}

export function signalRootHydrated() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset[ROOT_HYDRATED_ATTR] = "true";
  dispatchReadiness(ROOT_HYDRATED_EVENT);
}

export function signalInteractionReady(scope) {
  if (typeof document === "undefined" || !scope) return;
  document.querySelectorAll(`[data-nexualpha-scope-start="${escapeScopeSelector(scope)}"]`).forEach((marker) => {
    marker.dataset[INTERACTION_READY_ATTR] = "true";
  });
  dispatchReadiness(INTERACTION_READY_EVENT, scope);
}
