// Home-only compare pair, shared by the Compare Lab and the Directory without lifting it into the page shell.
// A pick in one act used to re-render the whole home page (App state); now only the two subscribers update, and the
// one that did not start the change follows in a transition (never in the click frame).
import { startTransition, useEffect, useState } from "react";

const KEY = "nexualpha-comparison";

export function createSelectionStore(initial) {
  let value = Array.isArray(initial) ? initial.filter((s) => typeof s === "string").slice(0, 2) : [];
  const subs = new Set();
  return {
    get: () => value,
    set(next) {
      if (!Array.isArray(next)) return;
      const n = next.filter((s) => typeof s === "string").slice(0, 2);
      if (n.join(",") === value.join(",")) return;
      value = n;
      try { window.sessionStorage.setItem(KEY, JSON.stringify(n)); } catch { /* selection stays in memory */ }
      subs.forEach((fn) => fn());
    },
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
  };
}

// Reads the store; external changes arrive as a transition. Without a store the component keeps its old prop contract.
export function useSharedSelection(store, fallback) {
  const [value, setValue] = useState(() => (store ? store.get() : fallback));
  useEffect(() => {
    if (!store) return undefined;
    const sync = () => startTransition(() => setValue(store.get()));
    sync();
    return store.subscribe(sync);
  }, [store]);
  return store ? value : fallback;
}
