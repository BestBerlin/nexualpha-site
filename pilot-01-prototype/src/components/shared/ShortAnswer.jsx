// "The short answer" lead (answer-first pass 2026-10-18). Styles live in the global layer
// (src/styles/v8/site-signature.css, .nx-short-answer) so no route chunk owns this component's CSS.
export function ShortAnswer({ answer, className = "", placement }) {
  if (!answer?.text) return null;
  return (
    <p className={`nx-short-answer${className ? ` ${className}` : ""}`} data-short-answer="" data-short-answer-placement={placement} lang={answer.locale} dir={answer.locale === "ar" ? "rtl" : undefined}>
      <strong>{answer.label}</strong> {answer.text}
    </p>
  );
}
