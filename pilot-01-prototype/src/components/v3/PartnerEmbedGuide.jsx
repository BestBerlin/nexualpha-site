import React, { useEffect, useState } from "react";
import { TELEGRAM_CONFIG, getTelegramDeepLink } from "../../data/telegram-config.js";
import { buildBrazilEmbedUrl, buildBrazilEmbedCode } from "../../data/embed-builder.js";
import { localizedHref } from "../../data/locale-routing.js";
import { isNeutralCtaLocale } from "../../data/locale-policy.js";
import { partnerEmbedCopy } from "../../data/partner-embed-copy.js";
import { partnerProgramCopy } from "../../data/partner-program-copy.js";
import "./partner-embed-guide.css";

function currentPathname() {
  return typeof window !== "undefined" ? window.location.pathname : "";
}

function PartnerProgramPage({ locale = "en" }) {
  const copy = partnerProgramCopy(locale);
  const neutral = isNeutralCtaLocale(locale);
  const telegramHref = getTelegramDeepLink({
    action: "partner_desk",
    locale,
    product: "partner_program",
    campaign: "public_partner_program",
  });
  const mailHref = "mailto:partners@nexualpha.com?subject=NexuAlpha%20partner%20program";

  return (
    <main className="v6 v2-page v3-page partner-guide-page partner-program-page" id="top">
      <div className="v2-shell">
        <nav className="guide-breadcrumbs" aria-label="Breadcrumb">
          <a href={localizedHref("/", { locale })}>{copy.home}</a>
          <span className="guide-breadcrumbs__sep">/</span>
          <span>{copy.breadcrumb}</span>
        </nav>

        <section className="partner-program-hero">
          <p className="partner-program-hero__kicker">{copy.kicker}</p>
          <h1>{neutral ? copy.neutralTitle : copy.title}</h1>
          <p>{neutral ? copy.neutralLead : copy.lead}</p>
          {neutral ? (
            <a className="partner-program-link" href={localizedHref("/exchanges", { locale })}>
              {copy.neutralBack}
            </a>
          ) : (
            <div className="partner-program-actions" aria-label="Partner application options">
              <a
                className="partner-program-btn partner-program-btn--primary"
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                data-cta-kind="partner-application"
                data-cta-placement="partner-program-hero"
                aria-label={`${copy.primaryCta} @${TELEGRAM_CONFIG.botUsername}`}
              >
                {copy.primaryCta}
              </a>
              <a
                className="partner-program-btn partner-program-btn--secondary"
                href={mailHref}
                data-cta-kind="partner-application"
                data-cta-placement="partner-program-hero-email"
              >
                {copy.secondaryCta}
              </a>
            </div>
          )}
        </section>

        {!neutral && (
          <>
            <section className="partner-program-section" aria-labelledby="partner-benefits">
              <div className="partner-program-section__header">
                <h2 id="partner-benefits">{copy.benefitsTitle}</h2>
              </div>
              <div className="partner-program-grid">
                {copy.benefits.map(([title, body]) => (
                  <article className="partner-program-card" key={title}>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="partner-program-section" aria-labelledby="partner-steps">
              <div className="partner-program-section__header">
                <h2 id="partner-steps">{copy.stepsTitle}</h2>
              </div>
              <ol className="partner-program-steps">
                {copy.steps.map(([title, body], index) => (
                  <li className="partner-program-step" key={title}>
                    <span className="partner-program-step__index">{index + 1}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="partner-program-section partner-program-section--faq" aria-labelledby="partner-faq">
              <div className="partner-program-section__header">
                <h2 id="partner-faq">{copy.faqTitle}</h2>
              </div>
              <div className="partner-program-faq">
                {copy.faqs.map(([question, answer]) => (
                  <details key={question}>
                    <summary>{question}</summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function PartnerEmbedGuideContent({ locale = "en" }) {
  const copy = partnerEmbedCopy(locale);
  const localizedH1 = {
    fr: "Ajoutez les outils de frais NexuAlpha à votre site ou portail de recherche",
    de: "NexuAlpha-Gebührentools in Ihre Website oder Ihr Research-Portal integrieren",
    ar: "أضف أدوات رسوم NexuAlpha إلى موقعك أو بوابة الأبحاث",
    ru: "Добавьте инструменты комиссий NexuAlpha на сайт или исследовательский портал",
    id: "Tambahkan alat biaya NexuAlpha ke situs atau portal riset Anda",
    vi: "Thêm công cụ phí NexuAlpha vào website hoặc cổng nghiên cứu của bạn",
    it: "Aggiungi gli strumenti sulle commissioni NexuAlpha al tuo sito o portale di ricerca",
  }[String(locale || "").split("-")[0]];
  const heroH1 = localizedH1 || `${copy.heroTitle}${copy.heroAccent}`;
  const [selectedType, setSelectedType] = useState("calculator");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [publisher, setPublisher] = useState('partner');
  const [showValueDetails, setShowValueDetails] = useState(true);
  const brazilUrl = buildBrazilEmbedUrl(publisher);

  useEffect(() => {
    const syncViewport = () => setShowValueDetails(window.innerWidth > 640);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const embedCodes = {
    brazil: buildBrazilEmbedCode(publisher),
    calculator: `<iframe\n  src="https://nexualpha.com/embed/calculator?locale=${encodeURIComponent(locale)}"\n  width="100%"\n  height="640"\n  style="max-width: 420px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); background: #07080b;"\n  title="NexuAlpha Crypto Fee Calculator"\n></iframe>`,
    analyzer: `<iframe\n  src="https://nexualpha.com/embed/calculator?locale=${encodeURIComponent(locale)}"\n  width="100%"\n  height="820"\n  style="border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); background: #07080b;"\n  title="NexuAlpha Trading Fee Analyzer"\n></iframe>`,
  };

  const handleCopy = async () => {
    setCopyError(false);
    if (!embedCodes[selectedType]) { setCopyError(true); return; }
    try {
      await navigator.clipboard.writeText(embedCodes[selectedType]);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setCopiedCode(false);
      setCopyError(true);
    }
  };

  const partnerParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const partnerDeepLink = getTelegramDeepLink({
    action: "partner_desk",
    market: partnerParams?.get("market") || undefined,
    locale,
    product: partnerParams?.get("product") || "spot",
  });

  return (
    <main className="v6 v2-page v3-page partner-guide-page" id="top">
      <div className="v2-shell">
        {/* Breadcrumb */}
        <nav className="guide-breadcrumbs" aria-label="Breadcrumb">
          <a href={localizedHref("/", { locale })}>{copy.home}</a>
          <span className="guide-breadcrumbs__sep">/</span>
          <span>{copy.breadcrumb}</span>
        </nav>

        {/* Hero Header */}
        <section className="guide-hero">
          <h1 className="guide-hero__title">
            {localizedH1 ? heroH1 : copy.heroTitle}
            {!localizedH1 && <span className="guide-hero__accent">{copy.heroAccent}</span>}
          </h1>
          <p className="guide-hero__desc">
            {copy.heroDesc}
          </p>
        </section>

        {/* Interactive Embed Builder */}
        <section className={`guide-builder-section guide-builder-section--${selectedType}`}>
          <div className="guide-builder__header">
            <h2>{copy.select}</h2>
            <div className="guide-type-toggle">
              <button type="button" className={`guide-type-btn ${selectedType === 'brazil' ? 'is-active' : ''}`}
                onClick={() => { setSelectedType('brazil'); setCopiedCode(false); }} data-testid="brazil-embed-select">
                {copy.brazil}
              </button>
              <button
                type="button"
                className={`guide-type-btn ${selectedType === "calculator" ? "is-active" : ""}`}
                onClick={() => setSelectedType("calculator")}
              >
                 {copy.narrow}
              </button>
              <button
                type="button"
                className={`guide-type-btn ${selectedType === "analyzer" ? "is-active" : ""}`}
                onClick={() => setSelectedType("analyzer")}
              >
                 {copy.wide}
              </button>
            </div>
          </div>

          {selectedType === 'brazil' && <label className="guide-publisher-field">
            {copy.publisher}
            <input value={publisher} onChange={(event) => { setPublisher(event.target.value); setCopiedCode(false); }}
              name="publisher" maxLength={60} autoComplete="off" spellCheck={false} aria-invalid={!brazilUrl}
              placeholder="exemplo-blog" data-testid="brazil-publisher" />
            <small>{copy.publisherHelp}</small>
            {!brazilUrl && <span role="status">{copy.publisherError}</span>}
          </label>}

          <div className="guide-builder__body">
          {/* Live Preview Frame */}
          <div className="guide-preview-wrapper">
            <div className="guide-preview-bar">
              <div className="preview-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="preview-title">
                {copy.preview}
              </span>
            </div>
            <div className="guide-preview-canvas">
              {selectedType === 'brazil' ? (
                brazilUrl && <iframe src={new URL(brazilUrl).pathname + new URL(brazilUrl).search}
                  title="NexuAlpha Brasil Calculator Preview" className="preview-iframe preview-iframe--brazil" />
              ) : selectedType === "calculator" ? (
                <iframe
                  key={`calculator-${locale}`}
                  src={`/embed/calculator?locale=${encodeURIComponent(locale)}`}
                  title="NexuAlpha Calculator Preview"
                  className="preview-iframe preview-iframe--calculator"
                  loading="eager"
                ></iframe>
              ) : (
                <iframe
                  key={`analyzer-${locale}`}
                  src={`/embed/calculator?locale=${encodeURIComponent(locale)}`}
                  title="NexuAlpha Analyzer Preview"
                  className="preview-iframe preview-iframe--analyzer"
                  loading="eager"
                ></iframe>
              )}
            </div>
          </div>

          <div className="guide-builder__side">
          {/* Code Snippet Box */}
          <div className="guide-code-box">
            <div className="guide-code-box__header">
              <span className="code-lang">HTML iframe embed code</span>
              <button
                type="button"
                className="guide-copy-btn"
                onClick={handleCopy}
              >
                {copiedCode ? `✓ ${copy.copied}` : ` ${copy.copy}`}
              </button>
            </div>
            <pre className="guide-code-pre" tabIndex={0}>
              <code>{embedCodes[selectedType]}</code>
            </pre>
            {copyError && <p role="status">{copy.copyError}</p>}
          </div>
            {/* Value Proposition Grid */}
            <details
              className="guide-values-disclosure"
              open={showValueDetails}
              onToggle={(event) => setShowValueDetails(event.currentTarget.open)}
            >
              <summary>
                <span>{copy.why}</span>
                <span aria-hidden="true">{showValueDetails ? "−" : "+"}</span>
              </summary>
              <div className="guide-values-grid">
              <div className="guide-value-card nxa-beam-card">
                <div className="guide-value-card__icon"></div>
                <h2>{copy.cards[0][0]}</h2>
                <p>{copy.cards[0][1]}</p>
              </div>
              <div className="guide-value-card nxa-beam-card">
                <div className="guide-value-card__icon"></div>
                <h2>{copy.cards[1][0]}</h2>
                <p>{copy.cards[1][1]}</p>
              </div>
              <div className="guide-value-card nxa-beam-card">
                <div className="guide-value-card__icon"></div>
                <h2>{copy.cards[2][0]}</h2>
                <p>{copy.cards[2][1]}</p>
              </div>
              </div>
            </details>

            {/* Telegram Fast Partnership CTA */}
            <section className="guide-telegram-cta">
              <div className="guide-tg-card nxa-beam-card">
                <div className="guide-tg-card__content">
                  <h3>{copy.telegramTitle}</h3>
                  <p>{copy.telegramBody}</p>
                </div>
                <a
                  href={partnerDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="guide-tg-btn"
                >
                  <span>{copy.telegramButton}</span>
                  <span className="guide-tg-arrow">→</span>
                </a>
              </div>
            </section>
          </div>
          </div>
        </section>

      </div>
    </main>
  );
}

export function PartnerEmbedGuide({ locale = "en", pathname }) {
  const path = pathname || currentPathname();
  if (path.endsWith("/partners/embed-guide") || isNeutralCtaLocale(locale)) return <PartnerEmbedGuideContent locale={locale} />;
  return <PartnerProgramPage locale={locale} />;
}

export default PartnerEmbedGuide;
