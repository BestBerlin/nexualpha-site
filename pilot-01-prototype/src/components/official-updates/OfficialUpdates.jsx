import { useEffect, useMemo, useRef, useState } from "react";
import { visibleOfficialUpdates } from "./official-updates-model";
import "./official-updates.css";
import "./official-update-detail.css";

export function OfficialUpdates({ copy, updates = [] }) {
  const [openId, setOpenId] = useState(null);
  const detail = useRef(null);
  const visible = useMemo(() => visibleOfficialUpdates(updates), [updates]);
  const active = visible.find((update) => update.id === openId);
  useEffect(() => {
    if (!active) return undefined;
    const close = (event) => { if (event.key === "Escape") setOpenId(null); };
    window.addEventListener("keydown", close);
    detail.current?.focus({ preventScroll: window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    return () => window.removeEventListener("keydown", close);
  }, [active]);
  return <section id="official-updates" className="v2-section official-updates"><div className="section-lead"><p>{copy.opportunity.official}</p><h2>{copy.listings.title}</h2><span>{copy.common.verifiedSource}</span></div>{visible.length === 0 ? <div className="official-updates__empty" role="status"><b>{copy.listings.verificationPending}</b><p>{copy.listings.sourceReceived}</p><small>{copy.common.sourceRequired} · {copy.opportunity.reviewListingConditions}</small></div> : <div className="official-updates__grid">{visible.map((update) => <article key={update.id} className="official-update"><div><span>{update.kind}</span><b>{update.platform.name}</b></div><h3>{update.title}</h3><dl><div><dt>{copy.opportunity.source}</dt><dd>{update.officialSource.type}</dd></div><div><dt>{copy.common.verifiedSource}</dt><dd><time dateTime={update.verifiedAt}>{update.verifiedAt}</time></dd></div><div><dt>{copy.decisionWorkbench.discovered}</dt><dd><time dateTime={update.discoveredAt}>{update.discoveredAt}</time></dd></div><div><dt>{copy.listings.expired}</dt><dd>{update.expiresAt ?? copy.common.sourceRequired}</dd></div></dl><button type="button" aria-expanded={openId === update.id} aria-controls={`official-update-${update.id}`} onClick={() => setOpenId(update.id)}>{copy.listings.details}</button></article>)}</div>}{active && <aside id={`official-update-${active.id}`} ref={detail} tabIndex="-1" className="official-update-detail" role="dialog" aria-modal="false" aria-label={active.title}><div><span>{active.platform.name} · {active.kind}</span><button type="button" onClick={() => setOpenId(null)}>{copy.actions.close}</button></div><h3>{active.title}</h3><dl><div><dt>{copy.opportunity.source}</dt><dd>{active.officialSource.type}</dd></div><div><dt>{copy.decisionWorkbench.discovered}</dt><dd><time dateTime={active.discoveredAt}>{active.discoveredAt}</time></dd></div><div><dt>{copy.common.verifiedSource}</dt><dd><time dateTime={active.verifiedAt}>{active.verifiedAt}</time></dd></div><div><dt>{copy.listings.expired}</dt><dd>{active.expiresAt ?? copy.common.sourceRequired}</dd></div></dl><a href={active.officialSource.url} rel="noreferrer noopener" target="_blank">{copy.decisionWorkbench.openOfficial}</a></aside>}</section>;
}
