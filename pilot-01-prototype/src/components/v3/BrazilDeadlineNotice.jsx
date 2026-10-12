// Short Brazil BCB deadline notice on /pt-br/exchanges and on /pt-br/exchanges/<slug> for the exchanges in the status
// table (owner plan 2026-10-12). Renders nothing in other locales or for venues the table does not cover.
// No partner link here: the notice only points to the topic page, which carries the sign-up routes.
import { brazilDeadlineNotice } from "../../data/brazil-vasp-status.js";

export function BrazilDeadlineNotice({ locale = "en", slug = null, placement = "directory" }) {
  const notice = brazilDeadlineNotice(locale, slug);
  if (!notice) return null;
  return (
    <aside className="brazil-deadline-notice" role="note" aria-label={notice.title} data-brazil-deadline-notice={placement} data-brazil-status={notice.status || undefined}>
      <p className="brazil-deadline-notice__title"><b>{notice.title}</b></p>
      <p className="brazil-deadline-notice__body">{notice.body}{notice.venue ? <> {notice.venue}</> : null}</p>
      <a className="brazil-deadline-notice__link" href={notice.href} data-cta-kind="research" data-cta-placement={`brazil-deadline-notice-${placement}`}>{notice.link} →</a>
    </aside>
  );
}

export default BrazilDeadlineNotice;
