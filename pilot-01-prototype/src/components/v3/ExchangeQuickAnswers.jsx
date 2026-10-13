import { quickAnswersForExchange } from "../../data/exchange-quick-answers.js";
import { LocalLink } from "./v3-pages-shared.jsx";
import "./exchange-quick-answers.css";

export function ExchangeQuickAnswers({ slug, locale = "en", market }) {
  const copy = quickAnswersForExchange(slug, locale, market);
  if (!copy?.items.length) return null;
  return (
    <section className="v2-section exchange-quick-answers" id="quick-answers" lang={locale} dir={["ar", "ur"].includes(locale) ? "rtl" : undefined} aria-labelledby="quick-answers-title">
      <h2 id="quick-answers-title">{copy.title}</h2>
      <dl>
        {copy.items.map(({ question, answer, href }) => (
          <div key={question}>
            <dt><LocalLink locale={locale} href={href}>{question} <span aria-hidden="true">↗</span></LocalLink></dt>
            <dd>{answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
