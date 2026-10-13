import React, { useState } from "react";
import { appDownloadContent, appDownloadSignupAllowed } from "../../data/app-downloads.js";
import { EXCHANGE_APKS, codeCopyLabels, exchangeApkCopy, exchangeApkHref } from "../../data/exchange-apk.js";
import { localizedHref } from "../../data/locale-routing.js";
import "./app-download.css";

function CodeCopy({ code, locale }) {
  const [copied, setCopied] = useState(false);
  const labels = codeCopyLabels(locale);
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the code stays visible */ }
  };
  return <button type="button" className="nx-app-download__copy" onClick={doCopy} aria-live="polite" data-copy-code>{copied ? `${labels.copied} ✓` : labels.copy}</button>;
}

export function AppDownloadPage({ slug, locale = "en", market, contextSearch = "" }) {
  const content = appDownloadContent(slug, locale);
  if (!content) return null;
  const { app, partner, cta, copy, text, apk } = content;
  const signupAllowed = appDownloadSignupAllowed(slug, { locale, market });
  // Official channel APK through /go/<venue>-apk (OKX: binding built in; Binance: enter the code): only where sign-up CTAs show.
  const officialApk = EXCHANGE_APKS[slug] && signupAllowed ? exchangeApkCopy(slug, locale, cta.inviteCode) : null;
  return <main className="nx-app-download v2-page" dir={locale === "ar" || locale === "ur" ? "rtl" : "ltr"}>
    <a href={localizedHref(`/exchanges/${slug}${contextSearch}`, { locale })}>{text("profile")}</a>
    <header><h1>{text("title")}</h1><p>{text("answer")}</p></header>
    {signupAllowed && <section aria-labelledby="app-register" data-app-registration>
      <h2 id="app-register">{copy.register}</h2><p>{text("registerBody")}</p>
      <p>{copy.code}: <strong dir="ltr" translate="no">{cta.inviteCode}</strong> <CodeCopy code={cta.inviteCode} locale={locale} /></p>
      <a className="nx-app-download__button nx-app-download__button--primary" href={`/go/${slug}?src=app-${encodeURIComponent(locale)}`} data-cta-platform={slug} data-cta-kind="register" data-cta-placement="app-download">{text("signup")}</a>
    </section>}
    <section aria-labelledby="app-stores"><h2 id="app-stores">{copy.stores}</h2>
      <div className="nx-app-download__actions">
        <a className="nx-app-download__button" href={app.appStore} rel="noopener noreferrer" target="_blank" lang="en">App Store</a>
        <a className="nx-app-download__button" href={app.googlePlay} rel="noopener noreferrer" target="_blank" lang="en">Google Play</a>
        {officialApk && <a className="nx-app-download__button nx-app-download__button--apk" href={exchangeApkHref(slug, `app-apk-${locale.toLowerCase()}`)} rel="nofollow" data-official-apk={slug} data-cta-platform={slug} data-cta-kind="download" data-cta-placement="app-download-apk">{officialApk.label}<small>{officialApk.size}</small></a>}
        {apk && <a className="nx-app-download__button" href={apk.url} data-app-apk lang="en">Android APK</a>}
      </div>
      {officialApk?.enterCode && <p className="nx-app-download__apk-code" data-apk-code>{officialApk.enterCode} <CodeCopy code={cta.inviteCode} locale={locale} /></p>}
      {apk && <dl className="nx-app-download__hashes"><dt>{copy.version}</dt><dd>{apk.version}</dd><dt>{copy.checksum}</dt><dd><code>{apk.sha256}</code></dd><dt>{copy.signer}</dt><dd><code>{apk.signerSha256}</code></dd></dl>}
    </section>
    <section aria-labelledby="app-genuine"><h2 id="app-genuine">{copy.genuine}</h2>
      <ol><li>{text("domain")}</li><li>{text("developer")}</li><li>{copy.signature}</li></ol>
      <pre dir="ltr"><code>apksigner verify --print-certs app.apk</code></pre>
    </section>
    <section aria-labelledby="app-install"><h2 id="app-install">{copy.install}</h2><ol>{copy.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>
    <section aria-labelledby="app-faq"><h2 id="app-faq">{copy.faq}</h2>{copy.faqs.map(({ q: question, a: answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    <section aria-labelledby="app-sources"><h2 id="app-sources">{copy.sources}</h2><ul>{app.sources.map((url) => <li key={url}><a href={url} rel="noopener noreferrer" target="_blank" dir="ltr">{url}</a></li>)}</ul><p>{copy.checked}: <time dateTime={app.lastChecked}>{app.lastChecked}</time></p></section>
  </main>;
}
