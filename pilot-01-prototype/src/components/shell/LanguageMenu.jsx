import React, { useCallback, useEffect, useId, useRef, useState } from "react";

function Globe() {
  return <svg className="nx-ico" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true" focusable="false">
    <circle cx="8" cy="8" r="6.25" /><path d="M1.75 8h12.5M8 1.75c1.7 1.75 2.55 3.85 2.55 6.25S9.7 12.5 8 14.25C6.3 12.5 5.45 10.4 5.45 8S6.3 3.5 8 1.75z" />
  </svg>;
}
function Chevron() {
  return <svg className="nx-ico nx-chev" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>;
}

/**
 * Listbox language switcher with crawlable anchors. Keyboard selection calls
 * onSelect(code); ordinary and modified anchor clicks retain native navigation.
 * Keyboard: ArrowDown/ArrowUp/Enter/Space open; arrows, Home, End, typeahead move;
 * Enter/Space select; Escape closes and restores focus; Tab closes.
 */
export function LanguageMenu({ locale, options, label, disabled = false, onSelect, inline = false }) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const typeRef = useRef({ text: "", timer: 0 });
  const currentIndex = Math.max(0, options.findIndex((o) => o.code === locale));
  const current = options[currentIndex] || options[0] || { code: locale || "en", label: String(locale || "en").toUpperCase() };
  const menuDisabled = disabled || options.length <= 1;

  const close = useCallback((restore = true) => {
    setOpen(false);
    if (restore) buttonRef.current?.focus({ preventScroll: true });
  }, []);
  const openMenu = useCallback((index = currentIndex) => {
    if (menuDisabled) return;
    setActive(index);
    setOpen(true);
  }, [currentIndex, menuDisabled]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus({ preventScroll: true });
    const onPointer = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  useEffect(() => () => window.clearTimeout(typeRef.current.timer), []);

  const choose = (index) => {
    const option = options[index];
    setOpen(false);
    if (!option || option.code === locale) { buttonRef.current?.focus({ preventScroll: true }); return; }
    onSelect(option.code);
  };

  const onButtonKeyDown = (event) => {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); openMenu(event.key === "ArrowUp" ? options.length - 1 : currentIndex); }
  };
  const onListKeyDown = (event) => {
    const last = options.length - 1;
    const move = (next) => { event.preventDefault(); setActive(Math.min(last, Math.max(0, next))); };
    switch (event.key) {
      case "ArrowDown": return move(active + 1);
      case "ArrowUp": return move(active - 1);
      case "Home": return move(0);
      case "End": return move(last);
      case "Enter": case " ": event.preventDefault(); return choose(active);
      case "Escape": event.preventDefault(); event.stopPropagation(); return close();
      case "Tab": return setOpen(false);
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          const t = typeRef.current;
          window.clearTimeout(t.timer);
          t.text += event.key.toLowerCase();
          t.timer = window.setTimeout(() => { t.text = ""; }, 600);
          const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(t.text));
          if (hit >= 0) setActive(hit);
        }
    }
  };

  return <div className={`nx-lang${inline ? " nx-lang--inline" : ""}`} ref={rootRef} data-open={open ? "true" : undefined}>
    <button ref={buttonRef} type="button" className="nx-lang__btn" disabled={menuDisabled}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
      aria-label={`${label}: ${current?.label}`}
      onClick={() => (open ? close(false) : openMenu())} onKeyDown={onButtonKeyDown}>
      <Globe />
      <span className="nx-lang__name" lang={current?.code}>{current?.label}</span>
      <span className="nx-lang__code" aria-hidden="true">{String(current?.code || "").toUpperCase()}</span>
      <Chevron />
    </button>
    <ul id={listId} ref={listRef} role="listbox" tabIndex={-1} className="nx-lang__list" aria-label={label} hidden={!open}
      aria-activedescendant={open ? `${uid}-o${active}` : undefined} onKeyDown={onListKeyDown}>
      {options.map((option, index) => <li key={option.code} id={`${uid}-o${index}`} role="option" lang={option.code} data-index={index}
        aria-selected={option.code === locale} data-active={open && index === active ? "true" : undefined}
        onPointerMove={() => open && index !== active && setActive(index)}>
        <a className="nx-lang__opt" href={option.href} hrefLang={option.code} lang={option.code} tabIndex={-1}
          aria-current={option.code === locale ? "true" : undefined} onClick={() => setOpen(false)}>
        <span className="nx-lang__opt-name">{option.label}</span>
        <span className="nx-lang__opt-code" aria-hidden="true">{option.code}</span>
        </a>
      </li>)}
    </ul>
  </div>;
}
