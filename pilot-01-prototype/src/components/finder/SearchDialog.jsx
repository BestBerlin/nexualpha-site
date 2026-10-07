import { useEffect, useRef } from "react";

export function SearchDialog({ label, onClose, children, returnFocusRef }) {
  const dialog = useRef(null);
  useEffect(() => {
    const explicitReturn = returnFocusRef?.current;
    const previous = explicitReturn?.isConnected ? explicitReturn : document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector("input, button, a[href]")?.focus();
    const trap = (event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const elements = [...dialog.current.querySelectorAll('input, button:not([disabled]), a[href], select, [tabindex="0"]')].filter((node) => node.getClientRects().length);
      const first = elements[0]; const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", trap);
      const target = returnFocusRef?.current?.isConnected ? returnFocusRef.current : previous;
      if (target?.isConnected && target !== document.body) target.focus({ preventScroll: true });
      if (returnFocusRef) returnFocusRef.current = null;
    };
  }, [onClose, returnFocusRef]);
  return <div className="search-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialog} className="search-dialog" role="dialog" aria-modal="true" aria-label={label}>{children}</div>
  </div>;
}
