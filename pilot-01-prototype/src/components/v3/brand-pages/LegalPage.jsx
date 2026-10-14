import React from "react";
import { localizedHref } from "../../../data/locale-routing.js";
import { LEGAL_COPY, LEGAL_EFFECTIVE_DATE, LEGAL_PAGE_PATHS, legalLocale } from "../../../data/legal-pages.js";
import "./brand-pages.css";

const youtubeLinks = [
  ["YouTube Terms of Service", "https://www.youtube.com/t/terms"],
  ["Google Privacy Policy", "http://www.google.com/policies/privacy"],
  ["Google security settings", "https://security.google.com/settings/security/permissions"],
];
const contacts = [
  ["Email", "mailto:contact@nexualpha.com", "contact@nexualpha.com"],
  ["Telegram", "https://t.me/NexuAlphaClub", "@NexuAlphaClub"],
  ["X", "https://x.com/NexuAlpha", "@NexuAlpha"],
  ["YouTube", "https://www.youtube.com/@NexuAlphaCN", "@NexuAlphaCN"],
];

export function LegalPage({ locale = "en", pathname = "/privacy" }) {
  const code = legalLocale(locale);
  const copy = LEGAL_COPY[pathname][code];
  const href = (path) => localizedHref(path, { locale: code });
  return (
    <main className="v6 v2-page v3-page nxb nxb--policy" id="top" lang={code} dir="ltr" data-testid="legal-page">
      <header className="nxb-hero v2-shell">
        <nav className="nxb-crumbs" aria-label={code === "zh-Hans" ? "面包屑导航" : "Breadcrumb"}>
          <a href={href("/")}>NexuAlpha</a><span aria-hidden="true">›</span><span aria-current="page">{copy.title}</span>
        </nav>
        <h1>{copy.title}</h1><p className="nxb-lead">{copy.lead}</p>
        <p className="nxb-reviewed"><strong>{code === "zh-Hans" ? "生效日期：" : "Effective date: "}</strong><time dateTime={LEGAL_EFFECTIVE_DATE}>{LEGAL_EFFECTIVE_DATE}</time></p>
      </header>
      {copy.sections.map((section, i) => (
        <section className="nxb-section v2-shell" key={section.title} aria-labelledby={`legal-section-${i}`}>
          <h2 id={`legal-section-${i}`}>{section.title}</h2><p>{section.body}</p>
          {section.title.startsWith("YouTube") && <ul className="nxb-bullets">
            {youtubeLinks.map(([label, url], index) => <li key={url}><a href={url}>{code === "zh-Hans" ? ["YouTube 服务条款", "Google 隐私政策", "Google 安全设置"][index] : label}</a></li>)}
          </ul>}
        </section>
      ))}
      <section className="nxb-section v2-shell" aria-label={code === "zh-Hans" ? "联系方式" : "Contact details"}>
        {pathname === "/contact" ? <ul className="nxb-contacts">{contacts.map(([label, url, handle]) => <li key={url}><span className="nxb-contacts__label">{code === "zh-Hans" && label === "Email" ? "邮箱" : label}</span><a href={url} dir="ltr">{handle}</a></li>)}</ul> : <p><a href="mailto:contact@nexualpha.com">contact@nexualpha.com</a></p>}
        <nav className="nxb-links" aria-label={code === "zh-Hans" ? "政策页面" : "Policy pages"}>
          <ul className="nxb-bullets">{LEGAL_PAGE_PATHS.map((path) => <li key={path}><a href={href(path)} aria-current={path === pathname ? "page" : undefined}>{LEGAL_COPY[path][code].title}</a></li>)}</ul>
        </nav>
      </section>
    </main>
  );
}
export default LegalPage;
