import React from "react";
import "./top-decision-box.css";

function normalizeActions(actions, limit) {
  return (Array.isArray(actions) ? actions : [])
    .filter((action) => action?.href && action?.label)
    .slice(0, limit);
}

export function TopDecisionBox({
  className = "",
  eyebrow,
  title,
  answer,
  actions,
  sourceAction,
  leadingResearchHref,
  ctaPlacement,
  growthDecision,
  growthMarket,
  growthProduct,
  withContext = (href) => href,
  aeoDirectAnswer = false,
}) {
  const internalActions = normalizeActions(actions, 2);
  const sourceActions = normalizeActions(sourceAction ? [sourceAction] : [], 1);
  const visibleActions = [...internalActions, ...sourceActions].slice(0, 3);

  if (!title || !answer) return null;

  const leadingAction = visibleActions[0]?.kind === "research"
    && visibleActions[0].href === leadingResearchHref
    && /^\/(?:exchanges\/[a-z0-9-]+|compare\/[a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/.test(leadingResearchHref || "")
    ? visibleActions[0] : null;
  const trailingActions = leadingAction ? visibleActions.slice(1) : visibleActions;
  const renderAction = (action) => {
    const external = /^https?:\/\//i.test(action.href);
    const href = external || action.href.startsWith("#") ? action.href : withContext(action.href);
    return (
      <a
        key={`${action.kind || "research"}-${action.href}`}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        data-cta-kind={action.kind || "research"}
        data-cta-placement={ctaPlacement}
        data-growth-decision={growthDecision}
        data-growth-placement={ctaPlacement}
        data-growth-market={growthMarket}
        data-growth-product={growthProduct}
      >
        <span>{action.label}</span><span aria-hidden="true">{external ? "↗" : "→"}</span>
      </a>
    );
  };

  return (
    <aside className={`top-decision-box ${className}`.trim()} aria-label={title} data-top-decision-box data-aeo-direct-answer={aeoDirectAnswer || undefined}>
      <div className="top-decision-box__copy">
        {eyebrow && <span className="top-decision-box__eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {leadingAction && (
          <div className="top-decision-box__actions top-decision-box__leading-action">
            {renderAction(leadingAction)}
          </div>
        )}
        <p>{answer}</p>
      </div>
      {visibleActions.length > 0 && (
        <div className="top-decision-box__actions" data-action-count={trailingActions.length}>
          {trailingActions.map(renderAction)}
        </div>
      )}
    </aside>
  );
}

export default TopDecisionBox;
