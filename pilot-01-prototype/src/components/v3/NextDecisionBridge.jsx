import React from "react";
import { buildNextDecisionBridge } from "../../data/next-decision-bridge.js";
import "./next-decision-bridge.css";

export function NextDecisionBridge({
  className = "",
  locale = "en",
  market,
  product,
  accountStage,
  funding,
  title,
  body,
  profileSlug,
  profileHref,
  profileLabel,
  compareHref,
  compareSlugs,
  telegramHref,
  placement,
  decision,
}) {
  const bridge = buildNextDecisionBridge({
    locale,
    market,
    product,
    accountStage,
    funding,
    title,
    body,
    profileSlug,
    profileHref,
    profileLabel,
    compareHref,
    compareSlugs,
    telegramHref,
  });

  if (!bridge.actions.length) return null;

  return (
    <aside className={`next-decision-bridge ${className}`.trim()} data-next-decision-bridge aria-label={bridge.title}>
      <div className="next-decision-bridge__copy">
        <span>{bridge.eyebrow}</span>
        <h2>{bridge.title}</h2>
        <p>{bridge.body}</p>
      </div>
      <nav className="next-decision-bridge__actions" aria-label={bridge.title} data-action-count={bridge.actions.length}>
        {bridge.actions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            data-next-decision-action={action.id}
            data-cta-kind={action.kind}
            data-cta-placement={placement}
            data-growth-decision={decision || action.id}
            data-growth-placement={placement}
            data-growth-market={market}
            data-growth-product={product}
            data-growth-account-stage={accountStage}
            data-growth-funding={funding}
          >
            <span>{action.label}</span>
            <span aria-hidden="true">→</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}

export default NextDecisionBridge;
