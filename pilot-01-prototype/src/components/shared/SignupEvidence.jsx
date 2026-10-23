import React from "react";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { CodeChip } from "../v6/CodeChip.jsx";
import "./signup-evidence.css";

export function CommissionDisclosureLine() {
  // Owner 2026-10-23: no disclosure sentences in page bodies; the footer "合作披露" page carries it.
  return null;
}

// Resolve the displayed value through the same policy gate as the signup action.
// Owner 2026-10-23: a code chip only. No disclosure sentences or referral help in page bodies (footer "合作披露" page carries it).
export function SignupEvidence({ slug, locale = "en", market, placement = "signup" }) {
  const cta = publicCtaForVenue(slug, locale, market);
  if (!cta.hasReferral || !cta.inviteCode) return null;
  return <span className="signup-evidence" data-signup-evidence={slug}>
    <CodeChip code={cta.inviteCode} slug={slug} locale={locale} placement={placement} />
  </span>;
}
