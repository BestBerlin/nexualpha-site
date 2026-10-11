import { useEffect, useState } from "react";
import { starterLevels, publicStarterLevels, starterContent, starterHref } from "../../data/starter/index.js";
import { readStarterProgress, writeStarterProgress, completeLevel, quizPassed, checklistDone } from "../../data/starter/progress.js";
import { publicCtaForVenue, regionalVenueCta } from "../../data/source-bound-cta.js";
import { isPartnerPromotableIn } from "../../data/partner-geo-policy.js";
import { ctaClickSource } from "../../data/cta-click-beacon.js";
import { localizedHref } from "../../data/locale-routing.js";
import { CommissionDisclosureLine } from "../v3/CommissionDisclosureLine.jsx";
import "./starter.css";

function VideoSlot({ level, zh }) {
  const [playing, setPlaying] = useState(false);
  const id = level.meta.video_youtube_id;
  const valid = typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id);
  return <div className="starter-video">
    {valid && playing ? <iframe title={level.meta[zh ? "title_zh" : "title_en"]} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      : valid ? <button type="button" onClick={() => setPlaying(true)} aria-label={zh ? "播放视频" : "Play video"}><img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" /><span>▶ {zh ? "播放视频" : "Play video"}</span></button>
      : <div className="starter-poster"><span aria-hidden="true">▶</span><p>{zh ? "视频即将上线" : "Video coming soon"}</p><small>{zh ? "先读要点，完成这一关" : "Read the key points and complete this level"}</small></div>}
  </div>;
}

export function StarterCta({ level, locale, market }) {
  const zh = locale === "zh-Hans";
  const cta = level.meta.cta;
  if (cta.kind === "none" || level.meta.sensitive) return null;
  const placement = `starter-${level.meta.slug}`;
  if (cta.partner && ["signup", "trade", "deposit"].includes(cta.kind)) {
    const publicCta = publicCtaForVenue(cta.partner, locale, market);
    const regional = regionalVenueCta(cta.partner, locale, market, "spot");
    const allowed = isPartnerPromotableIn(cta.partner, { locale, market }) && publicCta.hasPartnerRoute && !publicCta.actionGate && regional.direct;
    const url = allowed ? new URL(publicCta.registrationUrl) : null;
    if (url) url.searchParams.set("src", ctaClickSource(placement));
    return <aside className="starter-cta"><CommissionDisclosureLine locale={zh ? "zh-Hans" : "en"} placement={placement} />
      <a className="starter-button" href={url?.href || regional.ctaHref} target={allowed ? "_blank" : undefined} rel={allowed ? "sponsored noopener noreferrer" : undefined} data-cta-kind={allowed ? "registration" : "research"} data-cta-platform={cta.partner} data-cta-placement={placement}>
        {allowed ? (zh ? `前往 ${cta.partner.toUpperCase()} 官方注册入口` : `Visit ${cta.partner.toUpperCase()} sign-up`) : (zh ? "先核对所在地可用性" : "Check regional availability")}
      </a>
    </aside>;
  }
  const telegram = cta.kind === "telegram";
  return <aside className="starter-cta"><p>{zh ? "部分链接为合作推广链接，佣金由交易所支付。" : "Some links are partner links; the exchange pays the commission."}</p>
    <a className="starter-button" href={telegram ? "https://t.me/NexuAlphaAssistantBot?start=starter" : localizedHref(`/compare${market ? `?market=${encodeURIComponent(market)}` : ""}`, { locale })} data-cta-kind={telegram ? "telegram" : "research"} data-cta-placement={placement}>{telegram ? (zh ? "领取提币前检查清单" : "Get the withdrawal checklist") : (zh ? "核对平台与来源" : "Compare platforms and sources")}</a>
  </aside>;
}

export function StarterPage({ slug, locale = "en", market, reviewed = false }) {
  const zh = locale === "zh-Hans";
  const href = (target = "") => `${starterHref(target, locale)}${market ? `?market=${encodeURIComponent(market)}` : ""}`;
  const [progress, setProgress] = useState({ completed: [], checklists: {}, answers: {} });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setProgress(readStarterProgress(window.localStorage)); } catch { /* Storage may be unavailable. */ }
    setReady(true);
  }, []);
  const save = next => {
    setProgress(next);
    try { writeStarterProgress(window.localStorage, next); } catch { /* Keep this visit usable without storage. */ }
  };
  const levels = publicStarterLevels(reviewed);
  const done = levels.filter(level => progress.completed.includes(level.meta.slug)).length;
  const next = levels.find(level => !progress.completed.includes(level.meta.slug));
  const level = starterLevels.find(item => item.meta.slug === slug);
  const text = level ? starterContent(level, locale) : null;
  const countLabel = zh ? `${done} / ${levels.length} 关已完成` : `${done} / ${levels.length} levels completed`;
  const completion = <>{ready && done === levels.length && <aside className="starter-cta"><h2>{zh ? "已完成新手路线" : "Starter path complete"}</h2><a className="starter-button" href="https://t.me/NexuAlphaAssistantBot?start=starter" data-cta-kind="telegram" data-cta-placement="starter-complete">{zh ? "领取新手清单" : "Get the starter checklist"}</a></aside>}</>;
  const progressBar = <div className="starter-progress"><span>{countLabel}</span><progress value={done} max={levels.length} aria-label={countLabel} /></div>;
  if (slug && !level) return <main className="starter-page route-starter" lang={zh ? "zh-Hans" : "en"} dir="ltr"><h1>{zh ? "未找到这一关" : "Level not found"}</h1><a href={href()}>{zh ? "返回新手村" : "Return to Starter Path"}</a></main>;
  if (!level) return <main className="starter-page route-starter" lang={zh ? "zh-Hans" : "en"} dir="ltr" data-starter-reviewed={String(reviewed)}>
    <header className="starter-hero"><p className="starter-eyebrow">NEXUALPHA / {zh ? "从这里开始" : "START HERE"}</p><h1>{zh ? "新手村" : "Starter Path"}</h1><p className="starter-lead">{zh ? "12 关，从注册到安全提币，每关 90 秒" : "12 levels, from sign-up to safe withdrawals. 90 seconds each."}</p><p className="starter-trust">{zh ? "中立 · 来源可查 · 合作关系已披露" : "Neutral · Traceable sources · Partnerships disclosed"}</p>{progressBar}
      {next && <a className="starter-button" href={href(next.meta.slug)} data-cta-kind="education" data-cta-placement="starter-continue">{zh ? `继续第 ${next.meta.level} 关` : `Continue level ${next.meta.level}`} →</a>}
    </header>
    <ol className="starter-map" aria-label={zh ? "关卡地图" : "Level map"}>{starterLevels.map(item => {
      const hidden = item.meta.level === 7 && !reviewed;
      const completed = progress.completed.includes(item.meta.slug);
      return <li key={item.meta.slug} className={`${completed ? "is-complete" : ""} ${hidden ? "is-locked" : ""}`}>
        {hidden ? <div className="starter-node"><span className="starter-number" aria-hidden="true">07</span><div><small>{zh ? "审核中" : "Under review"}</small><h2>{zh ? "第 7 关待审核" : "Level 7 pending review"}</h2></div></div>
          : <a className="starter-node" href={href(item.meta.slug)}><span className="starter-number" aria-hidden="true">{completed ? "✓" : String(item.meta.level).padStart(2, "0")}</span><div><small>{completed ? (zh ? "已完成" : "Complete") : (zh ? `第 ${item.meta.level} 关 · 90 秒` : `Level ${item.meta.level} · 90 sec`)}</small><h2>{item.meta[zh ? "title_zh" : "title_en"]}</h2></div><span aria-hidden="true">↗</span></a>}
      </li>;
    })}</ol>{completion}
  </main>;
  const ticks = progress.checklists[slug] || [];
  const answers = progress.answers[slug] || [];
  const following = levels.find(item => item.meta.level > level.meta.level);
  const update = (kind, index, value) => {
    const values = [...(progress[kind][slug] || [])]; values[index] = value;
    let nextProgress = { ...progress, [kind]: { ...progress[kind], [slug]: values } };
    if (kind === "checklists" ? checklistDone(text.checklist, values) : quizPassed(text.quiz, values)) nextProgress = completeLevel(nextProgress, slug);
    save(nextProgress);
  };
  return <main className="starter-page starter-level route-starter" lang={zh ? "zh-Hans" : "en"} dir="ltr" data-starter-reviewed={String(reviewed)}>
    <nav aria-label={zh ? "面包屑" : "Breadcrumb"}><a href={href()}>{zh ? "新手村" : "Starter Path"}</a> / {zh ? `第 ${level.meta.level} 关` : `Level ${level.meta.level}`}</nav>
    <header className="starter-hero"><p className="starter-eyebrow">{zh ? `第 ${level.meta.level} 关 / 12` : `LEVEL ${level.meta.level} / 12`}</p><h1>{text.title}</h1><p className="starter-summary">{text.summary}</p>{level.meta.level === 7 && !reviewed && <p className="starter-review">{zh ? "本关待审核，暂不列入公开路线。" : "This level is pending review and excluded from the public path."}</p>}{progressBar}</header>
    <VideoSlot key={slug} level={level} zh={zh} />
    <section><h2>{zh ? "这一关的要点" : "Key points"}</h2><ol className="starter-points">{text.points.map((point, i) => <li key={i}>{point}</li>)}</ol></section>
    <section><h2>{zh ? "行动清单" : "Your checklist"}</h2><p>{zh ? "全部勾选或答对测验，即可完成这一关。进度保存在此浏览器。" : "Check every item or pass the quiz to complete this level. Progress is saved in this browser."}</p><div className="starter-checklist">{text.checklist.map((item, i) => <label key={i}><input type="checkbox" checked={ticks[i] === true} onChange={event => update("checklists", i, event.target.checked)} />{item}</label>)}</div></section>
    <section><h2>{zh ? "三题小测验" : "Three-question quiz"}</h2>{text.quiz.map((question, i) => <fieldset className="starter-quiz" key={i}><legend>{i + 1}. {question.q}</legend>{question.options.map((option, j) => <label key={j}><input type="radio" name={`starter-quiz-${i}`} checked={answers[i] === j} onChange={() => update("answers", i, j)} />{option}</label>)}{Number.isInteger(answers[i]) && <p role="status" className={answers[i] === question.options.indexOf(question.answer) ? "starter-correct" : "starter-incorrect"}>{answers[i] === question.options.indexOf(question.answer) ? (zh ? "答对了。" : "Correct. ") : (zh ? "再试一次。" : "Try again. ")}{question.why}</p>}</fieldset>)}{progress.completed.includes(slug) && <p className="starter-correct" role="status">✓ {zh ? "这一关已完成" : "Level complete"}</p>}</section>
    <section><h2>{zh ? "常见问题" : "FAQ"}</h2>{text.faq.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</section>
    <section><h2>{zh ? "来源" : "Sources"}</h2><ul className="starter-sources">{level.meta.sources.map(url => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>)}</ul></section>
    <StarterCta level={level} locale={locale} market={market} />
    <p className="starter-trust">{zh ? "中立 · 来源可查 · 合作关系已披露。部分链接为合作推广，佣金由交易所支付。" : "Neutral · Traceable sources · Partnerships disclosed. Some links earn commission paid by exchanges."}</p>
    {following ? <a className="starter-button" href={href(following.meta.slug)} data-cta-kind="education" data-cta-placement={`starter-next-${slug}`}>{zh ? "下一关" : "Next level"}: {following.meta[zh ? "title_zh" : "title_en"]} →</a> : <a href={href()}>{zh ? "返回关卡地图" : "Back to the level map"}</a>}{completion}
  </main>;
}
