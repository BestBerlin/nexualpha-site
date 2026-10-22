import { socialLabels, socialLinksFor } from "../../../data/brand-social.js";
import { XGlyph, YouTubeGlyph } from "../../shared/SocialIcons.jsx";

// Compact "Follow us: X · YouTube" line right under the article's Telegram join card (owner 2026-10-23: the social
// matrix was invisible outside Telegram). Official accounts only; Chinese articles link @NexuAlphaCN on YouTube.
export function NewsFollowLine({ locale = "en" }) {
  const links = socialLinksFor(locale);
  const { follow } = socialLabels(locale);
  return (
    <div className="news-follow" dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"} lang={locale} data-news-follow="">
      <span className="news-follow__label">{follow}</span>
      <a className="news-follow__item news-follow__item--x" href={links.x} target="_blank" rel="noopener" data-cta-kind="social" data-cta-placement="news-follow-x"><XGlyph size={14} /><span>X</span><span className="news-follow__handle" translate="no" dir="ltr">{links.handles.x}</span></a>
      <a className="news-follow__item news-follow__item--yt" href={links.youtube} target="_blank" rel="noopener" data-cta-kind="social" data-cta-placement="news-follow-youtube"><YouTubeGlyph size={16} /><span>YouTube</span><span className="news-follow__handle" translate="no" dir="ltr">{links.handles.youtube}</span></a>
    </div>
  );
}
