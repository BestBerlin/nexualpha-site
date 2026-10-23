import React from "react";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { referralHelp } from "../../data/cta-ui-copy.js";
import { v3ShellCopy } from "../../data/v3-shell-copy.js";
import { CodeChip } from "../v6/CodeChip.jsx";
import "./signup-evidence.css";

export function CommissionDisclosureLine({ locale = "en" }) {
  return <span className="commission-disclosure-line" data-commission-disclosure>{v3ShellCopy(locale).relationship}</span>;
}

// Resolve the displayed value through the same policy gate as the signup action.
export function SignupEvidence({ slug, locale = "en", market, placement = "signup" }) {
  const cta = publicCtaForVenue(slug, locale, market);
  if (!cta.hasReferral || !cta.inviteCode) return null;
  return <span className="signup-evidence" data-signup-evidence={slug}>
    <CodeChip code={cta.inviteCode} slug={slug} locale={locale} placement={placement} />
    {(slug === "binance" || slug === "okx") && <span className="signup-code-help">{referralHelp(locale, cta.inviteCode)}</span>}
    <CommissionDisclosureLine locale={locale} />
  </span>;
}
