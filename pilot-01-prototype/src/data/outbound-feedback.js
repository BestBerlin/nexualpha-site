// Outbound-click feedback for official signup links. A click on a registration link opens the venue in a new tab;
// this leaves one quiet toast behind ("<Venue> official signup opened in a new tab" + the code to check), so a
// visitor who comes back knows what happened and still has the code at hand. It never prevents or delays navigation,
// never touches the href, and the code shown is the one the link itself carries (data-cta-code), never a raw record.
import { partnerRegistry } from "./partner-registry.js";
import { referralPlatform } from "./cta-analytics.js";
import { copyText, ctaUiCopy, fillCta, trackCodeCopy } from "./cta-ui-copy.js";

let el = null;
let hideTimer = 0;

function lang() {
  const p = location.pathname;
  if (p === "/br" || p.startsWith("/br/")) return "pt-BR";
  return document.documentElement.lang || "en";
}

function hide() {
  clearTimeout(hideTimer);
  if (el) el.removeAttribute("data-open");
}

function armHide() {
  clearTimeout(hideTimer);
  // Count down only while the page is visible: the visitor is on the venue tab, the toast waits for their return.
  if (document.visibilityState === "visible") hideTimer = setTimeout(hide, 9000);
}

function show({ name, code, slug }) {
  const t = ctaUiCopy(lang());
  if (!el) {
    el = document.createElement("div");
    el.className = "cro-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
    document.addEventListener("visibilitychange", () => { if (el?.hasAttribute("data-open")) armHide(); });
  }
  el.replaceChildren();
  const msg = document.createElement("p");
  msg.className = "cro-toast__msg";
  const strong = document.createElement("strong");
  strong.textContent = fillCta(t.opening, { n: name });
  msg.append(strong);
  if (code) {
    const sub = document.createElement("span");
    sub.textContent = fillCta(t.check, { c: code });
    msg.append(sub);
  }
  el.append(msg);
  if (code) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cro-toast__copy";
    b.textContent = t.copy;
    b.setAttribute("data-cta-kind", "code-copy");
    b.setAttribute("data-cta-placement", "outbound-toast");
    b.addEventListener("click", async () => {
      const ok = await copyText(code);
      b.textContent = ok ? t.copied : t.copyFail;
      if (ok) trackCodeCopy(slug, "outbound-toast");
      armHide();
    });
    el.append(b);
  }
  const x = document.createElement("button");
  x.type = "button";
  x.className = "cro-toast__x";
  x.setAttribute("aria-label", t.close);
  x.textContent = "×";
  x.addEventListener("click", hide);
  el.append(x);
  el.setAttribute("data-open", "");
  armHide();
}

export function installOutboundFeedback() {
  if (typeof window === "undefined" || window.__nexuOutboundFeedback) return;
  window.__nexuOutboundFeedback = true;
  const onClick = (event) => {
    if (event.defaultPrevented || (event.type === "auxclick" && event.button !== 1)) return;
    const a = event.target?.closest?.("a[href][target='_blank']");
    if (!a || a.dataset.ctaKind !== "registration") return;
    const slug = a.dataset.ctaPlatform || referralPlatform(a.href);
    if (!slug) return;
    const name = partnerRegistry[slug]?.name || slug;
    // Let the browser open the tab first; the toast is decoration after the fact.
    setTimeout(() => show({ name, code: a.dataset.ctaCode || "", slug }), 0);
  };
  document.addEventListener("click", onClick);
  document.addEventListener("auxclick", onClick);
}
