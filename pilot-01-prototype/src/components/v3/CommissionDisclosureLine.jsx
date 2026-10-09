import { registrationDisclosureCopy } from "./RegistrationCard.jsx";
import { footerDisclosureLabel } from "./CleanFooter.jsx";
import { localizedHref } from "../../data/locale-routing.js";
import "./commission-disclosure-line.css";

/**
 * One-line commission disclosure placed next to lists of sponsored CTAs.
 * Wording is reused verbatim from the registration-card disclosure and the footer
 * "Affiliate Disclosure" link; no new legal copy is introduced here.
 */
export function CommissionDisclosureLine({ locale = "en", className = "", placement }) {
  const { title, short } = registrationDisclosureCopy(locale);
  const titleText = String(title || "").trim();
  // The runtime fallback can repeat the same sentence as title and body; show it once.
  const showTitle = titleText && !String(short || "").startsWith(titleText);
  return (
    <p className={`commission-disclosure-line${className ? ` ${className}` : ""}`} data-disclosure-placement={placement}>
      {showTitle ? <b>{title}</b> : null}
      <span>{short}</span>{" "}
      <a href={localizedHref("/methodology#disclosure", { locale })}>{footerDisclosureLabel(locale)}</a>
    </p>
  );
}

export default CommissionDisclosureLine;
