// NexuAlpha Academy (owner 2026-10-12): Season 1 "Sam's First Crypto Lesson", 24 animated lessons.
// /academy is the course hub; /academy/<slug> is a lesson page (video, takeaways, quick check, transcript, next step).
// SSR renders every word (title, takeaways, exercise, full transcript); the browser adds playback, progress and the quiz.
// Progress lives in localStorage and is read after mount only, so the first client render matches the server HTML.
// Owner rule: no fine print, no "not investment advice" and no commission notes on these pages (footer/legal only).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACADEMY_EPISODES, ACADEMY_PROGRESS_KEY, ACADEMY_TOTAL_MINUTES, academyCaptionPath, academyContentLocale,
  academyEpisodePath, academyGoHref, academyMedia, academySignupVenues, academyTelegram, academyVenueName, clockDuration,
} from "../../data/academy.js";
import { ACADEMY_COPY } from "../../data/academy-copy.js";
import { localizedHref } from "../../data/locale-routing.js";
import { NewsVenueOffer } from "../v3/news/NewsVenueOffer.jsx";
import { createGlossaryLinker } from "../../data/glossary-autolink.js";
import { GLOSSARY_INDEX_LOCALES, glossaryNavLabel, glossaryTermPath } from "../../data/glossary-routes.js";
import "./academy.css";

const RTL = new Set(["ar", "ur"]);
const dirOf = (locale) => (RTL.has(locale) ? "rtl" : "ltr");
const fill = (template, vars) => String(template || "").replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? "");
const pad = (n) => String(n).padStart(2, "0");
// "24 lessons" -> <b>24</b> lessons, in whatever order the locale puts the figure.
const figures = (text) => String(text).split(/(\d+)/).map((part, index) => (index % 2 ? <b key={index}>{part}</b> : part));
export function academyUiCopy(locale) {
  return ACADEMY_COPY[locale] || (String(locale || "").startsWith("zh") ? ACADEMY_COPY["zh-Hans"] : ACADEMY_COPY.en);
}
const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  if (!market) return href;
  return `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}`;
};

// ---------------------------------------------------------------- progress (this device only)
function readWatched() {
  try {
    const value = JSON.parse(window.localStorage.getItem(ACADEMY_PROGRESS_KEY) || "[]");
    return new Set((Array.isArray(value) ? value : []).filter((ep) => Number.isInteger(ep) && ep >= 1 && ep <= ACADEMY_EPISODES.length));
  } catch { return new Set(); }
}
function writeWatched(set) {
  try { window.localStorage.setItem(ACADEMY_PROGRESS_KEY, JSON.stringify([...set].sort((a, b) => a - b))); } catch { /* storage blocked: progress stays in memory */ }
}
export function useAcademyProgress() {
  const [watched, setWatched] = useState(() => new Set());
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setWatched(readWatched());
    setReady(true);
    const onStorage = (event) => { if (event.key === ACADEMY_PROGRESS_KEY) setWatched(readWatched()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const setEpisode = useCallback((ep, value = true) => {
    setWatched((current) => {
      if (current.has(ep) === value) return current;
      const next = new Set(current);
      if (value) next.add(ep); else next.delete(ep);
      writeWatched(next);
      return next;
    });
  }, []);
  return { watched, ready, setEpisode };
}

function ProgressMeter({ watched, t, compact = false }) {
  const done = watched.size;
  const total = ACADEMY_EPISODES.length;
  return <div className={`nxa-meter${compact ? " nxa-meter--compact" : ""}`}>
    <div className="nxa-meter__row">
      <span className="nxa-meter__label">{fill(t.progress, { n: done, total })}</span>
      <span className="nxa-meter__pct" aria-hidden="true">{Math.round((done / total) * 100)}%</span>
    </div>
    <div className="nxa-meter__track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={fill(t.progress, { n: done, total })}>
      <span className="nxa-meter__fill" style={{ inlineSize: `${(done / total) * 100}%` }} />
    </div>
  </div>;
}

function Check() {
  return <svg className="nxa-ico" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m3.5 8.5 3 3 6-7" /></svg>;
}
function Play() {
  return <svg className="nxa-ico" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M4.5 2.8v10.4c0 .5.6.9 1 .6l8.1-5.2a.7.7 0 0 0 0-1.2L5.5 2.2c-.4-.3-1 0-1 .6Z" /></svg>;
}
function Arrow() {
  return <svg className="nxa-ico nxa-ico--dir" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>;
}

function Poster({ episode, eager = false }) {
  const media = academyMedia(episode);
  // The numeral sits under the poster, so a missing poster still shows a designed tile (alt="" hides a broken image).
  return <span className="nxa-poster" data-ep={pad(episode.ep)}>
    <span className="nxa-poster__num" aria-hidden="true">{pad(episode.ep)}</span>
    <img src={media.posterLandscape} alt="" width="640" height="360" loading={eager ? "eager" : "lazy"} decoding="async" />
  </span>;
}

// ---------------------------------------------------------------- hub
export function AcademyHubPage({ locale = "en", content, market }) {
  const t = academyUiCopy(locale);
  const lessons = content.lessons;
  const { watched, ready } = useAcademyProgress();
  const firstOpen = ACADEMY_EPISODES.find((episode) => !watched.has(episode.ep));
  const resume = ready && watched.size > 0 ? (firstOpen || ACADEMY_EPISODES[0]) : null;
  const startEpisode = resume || ACADEMY_EPISODES[0];
  const startLabel = resume ? (firstOpen ? fill(t.continue, { n: resume.ep }) : t.rewatch) : t.start;
  const parts = [1, 2, 3].map((part) => ACADEMY_EPISODES.filter((episode) => episode.part === part));
  const contentLang = academyContentLocale(locale);

  return <main className="nxa nxa--hub" id="top" dir={dirOf(locale)}>
    <section className="nxa-hero">
      <div className="nxa-hero__inner v2-shell">
        <div className="nxa-hero__text">
          <p className="nxa-overline"><span>{t.brand}</span><span aria-hidden="true">·</span><span>{t.season}</span></p>
          <h1 className="nxa-hero__title">{t.series}</h1>
          <p className="nxa-tagline">{t.tagline}</p>
          <p className="nxa-lead">{t.hubLead}</p>
          <div className="nxa-actions">
            <a className="nxa-btn nxa-btn--primary" href={hrefFor(academyEpisodePath(startEpisode), locale, market)} data-academy-start={startEpisode.ep}><Play />{startLabel}</a>
            <a className="nxa-btn nxa-btn--ghost" href="#lessons">{t.browse}</a>
            {GLOSSARY_INDEX_LOCALES.includes(locale) ? <a className="nxa-btn nxa-btn--ghost" href={hrefFor("/glossary", locale, market)} data-academy-glossary>{glossaryNavLabel(locale)}</a> : null}
          </div>
          <ul className="nxa-stats">
            <li>{figures(t.statLessons)}</li>
            <li>{figures(fill(t.statMinutes, { m: ACADEMY_TOTAL_MINUTES }))}</li>
            <li><Check />{t.statFree}</li>
          </ul>
        </div>
        <figure className="nxa-hero__art" aria-hidden="true">
          <span className="nxa-halo" />
          <img src="/brand/academy/nexubo-wave-hello.svg" alt="" width="360" height="360" fetchPriority="high" />
        </figure>
      </div>
    </section>

    <section className="nxa-progress v2-shell" aria-label={fill(t.progress, { n: watched.size, total: ACADEMY_EPISODES.length })}>
      <ProgressMeter watched={watched} t={t} />
      <p className="nxa-progress__hint">{t.progressHint}</p>
    </section>

    <section className="nxa-season v2-shell" id="lessons" aria-labelledby="nxa-lessons-title">
      <h2 className="nxa-visually-hidden" id="nxa-lessons-title">{t.series}</h2>
      {parts.map((episodes, index) => <div className="nxa-part" key={index}>
        <div className="nxa-part__head">
          <p className="nxa-part__label">{fill(t.partLabel, { n: index + 1 })}<span className="nxa-part__range" aria-hidden="true">E{pad(episodes[0].ep)}–E{pad(episodes[episodes.length - 1].ep)}</span></p>
          <h3 className="nxa-part__title">{t.parts[index]}</h3>
        </div>
        <ol className="nxa-grid">
          {episodes.map((episode) => {
            const lesson = lessons[episode.ep - 1];
            const done = watched.has(episode.ep);
            return <li key={episode.ep} className="nxa-card" data-watched={done ? "true" : undefined}>
              <a className="nxa-card__link" href={hrefFor(academyEpisodePath(episode), locale, market)} lang={contentLang !== locale ? contentLang : undefined}>
                <span className="nxa-card__media">
                  <Poster episode={episode} eager={episode.ep <= 3} />
                  <span className="nxa-card__ep">E{pad(episode.ep)}</span>
                  <span className="nxa-card__time"><bdi dir="ltr">{clockDuration(episode.duration)}</bdi></span>
                  {done ? <span className="nxa-card__done"><Check />{t.watched}</span> : null}
                </span>
                <span className="nxa-card__title">{lesson.title}</span>
              </a>
            </li>;
          })}
        </ol>
      </div>)}
    </section>
  </main>;
}

// ---------------------------------------------------------------- lesson
function NextStep({ episode, locale, market, t }) {
  const venues = academySignupVenues(episode, { locale, market });
  if (venues.length) {
    return <section className="nxa-next nxa-next--signup" aria-labelledby="nxa-next-title" data-academy-next="signup">
      <div className="nxa-next__head">
        <img src="/brand/academy/nexubo-thumbs-up.svg" alt="" width="64" height="64" loading="lazy" />
        <div><h2 id="nxa-next-title">{t.nextStep}</h2><p>{t.signupLead}</p></div>
      </div>
      <div className={`nxa-next__offers${venues.length > 1 ? " nxa-next__offers--many" : ""}`}>
        {venues.map((slug) => <NewsVenueOffer key={slug} venues={[slug]} locale={locale} market={market} variant="inline"
          placementPrefix="academy" articleSlug={episode.id.toLowerCase()}
          linkFor={(venue) => academyGoHref(venue, episode)} nameFor={(venue, cta) => academyVenueName(venue, cta?.name)} />)}
      </div>
    </section>;
  }
  const telegram = academyTelegram(locale);
  const kind = episode.next === "telegram" || episode.ep >= 18 || episode.ep === 11 || episode.ep === 10 ? "telegram" : "compare";
  return <section className="nxa-next nxa-next--soft" aria-labelledby="nxa-next-title" data-academy-next={kind}>
    <div className="nxa-next__head">
      <img src="/brand/academy/nexubo-point-right.svg" alt="" width="64" height="64" loading="lazy" />
      <div><h2 id="nxa-next-title">{t.nextStep}</h2><p>{kind === "telegram" ? t.telegramLead : t.compareLead}</p></div>
    </div>
    <div className="nxa-next__actions">
      {kind === "telegram"
        ? <a className="nxa-btn nxa-btn--primary" href={telegram.href} target="_blank" rel="noopener noreferrer" data-cta-kind="telegram" data-cta-placement={`academy-${episode.id.toLowerCase()}-telegram`}>{fill(t.telegramCta, { handle: telegram.handle })}</a>
        : <a className="nxa-btn nxa-btn--primary" href={hrefFor("/compare", locale, market)}>{t.compareCta}<Arrow /></a>}
    </div>
  </section>;
}

function QuickCheck({ quiz, t }) {
  const [choice, setChoice] = useState(null);
  const correct = choice === quiz.answer;
  return <div className="nxa-quiz">
    <p className="nxa-quiz__q" id="nxa-quiz-q">{quiz.q}</p>
    <div className="nxa-quiz__options" role="group" aria-labelledby="nxa-quiz-q">
      {quiz.options.map((option, index) => {
        const state = choice === null ? undefined : index === quiz.answer && correct ? "right" : index === choice ? "wrong" : undefined;
        return <button type="button" key={option} className="nxa-quiz__option" data-state={state} aria-pressed={choice === index}
          onClick={() => setChoice(index)} disabled={correct && index !== quiz.answer}>
          <span className="nxa-quiz__key" aria-hidden="true">{String.fromCharCode(65 + index)}</span>{option}
        </button>;
      })}
    </div>
    <p className="nxa-quiz__feedback" aria-live="polite" data-state={choice === null ? undefined : correct ? "right" : "wrong"}>
      {choice === null ? null : correct ? <><b>{t.correct}</b> {quiz.why}</> : t.wrong}
    </p>
  </div>;
}

// Glossary (2026-10-13): the first mentions of up to 5 glossary terms in the transcript link to their definitions.
// glossaryLinks is the locale's glossary-links module (null outside the glossary's written locales); the linker state
// lives for one render, so server and client output match.
function Transcript({ rows, t, onSeek, locale, market, glossaryLinks }) {
  const linker = glossaryLinks ? createGlossaryLinker(glossaryLinks, { max: 5 }) : null;
  const linked = (text) => (linker ? linker.linkText(text).map((part, index) => (typeof part === "string" ? part
    : <a key={`g${index}`} className="nxa-glossary-link" href={hrefFor(glossaryTermPath(part.slug), locale, market)} data-glossary-link={part.slug}>{part.text}</a>)) : text);
  return <ol className="nxa-transcript">
    {rows.map((row, index) => {
      const time = clockDuration(row.t);
      return <li key={index} className="nxa-transcript__row" data-who={row.who}>
        <button type="button" className="nxa-transcript__time" onClick={() => onSeek(row.t)} aria-label={fill(t.playFrom, { time })}><bdi dir="ltr">{time}</bdi></button>
        <div className="nxa-transcript__line"><span className="nxa-transcript__who">{t[row.who] || row.who}</span><p>{linked(row.text)}</p></div>
      </li>;
    })}
  </ol>;
}

function Player({ episode, locale, t, onProgress, videoRef }) {
  const media = academyMedia(episode);
  const contentLocale = academyContentLocale(locale);
  // English videos carry burned-in English captions; other content locales get their own subtitle track, on by default.
  const localized = contentLocale !== "en";
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof window.matchMedia !== "function") return undefined;
    const narrow = window.matchMedia("(max-width: 599px) and (orientation: portrait)");
    const apply = () => { if (video.paused && video.currentTime === 0) video.poster = narrow.matches ? media.posterPortrait : media.posterLandscape; };
    apply();
    narrow.addEventListener?.("change", apply);
    return () => narrow.removeEventListener?.("change", apply);
  }, [episode.ep]);
  return <div className="nxa-player">
    <video ref={videoRef} id="nxa-video" className="nxa-player__video" controls preload="metadata" playsInline poster={media.posterLandscape}
      onTimeUpdate={(event) => { const v = event.currentTarget; if (v.duration && v.currentTime / v.duration >= 0.9) onProgress(); }}
      onEnded={onProgress}>
      <source src={media.portrait} type="video/mp4" media="(max-width: 599px) and (orientation: portrait)" />
      <source src={media.landscape} type="video/mp4" />
      {localized ? <track kind="subtitles" src={academyCaptionPath(episode, contentLocale)} srcLang={contentLocale} label={t.subtitles} default /> : null}
      <p>{t.videoFallback}</p>
    </video>
  </div>;
}

function LessonList({ current, lessons, watched, locale, market, t }) {
  const listRef = useRef(null);
  // Bring the current lesson into view inside the scrolling list (not the page).
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector("[aria-current]");
    if (list && item && list.scrollHeight > list.clientHeight) list.scrollTop = Math.max(0, item.offsetTop - list.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2);
  }, [current.ep]);
  return <nav className="nxa-list" aria-label={t.allLessons}>
    <ProgressMeter watched={watched} t={t} compact />
    <ol ref={listRef}>
      {ACADEMY_EPISODES.map((episode) => {
        const isCurrent = episode.ep === current.ep;
        return <li key={episode.ep} data-watched={watched.has(episode.ep) ? "true" : undefined}>
          <a href={hrefFor(academyEpisodePath(episode), locale, market)} aria-current={isCurrent ? "page" : undefined}>
            <span className="nxa-list__num" aria-hidden="true">{watched.has(episode.ep) ? <Check /> : pad(episode.ep)}</span>
            <span className="nxa-list__title">{lessons[episode.ep - 1].title}</span>
            <span className="nxa-list__time"><bdi dir="ltr">{clockDuration(episode.duration)}</bdi></span>
          </a>
        </li>;
      })}
    </ol>
  </nav>;
}

export function AcademyEpisodePage({ locale = "en", content, slug, market, glossaryLinks = null }) {
  const t = academyUiCopy(locale);
  const episode = ACADEMY_EPISODES.find((item) => item.slug === slug) || ACADEMY_EPISODES[0];
  const lessons = content.lessons;
  const lesson = lessons[episode.ep - 1];
  const prev = ACADEMY_EPISODES[episode.ep - 2] || null;
  const next = ACADEMY_EPISODES[episode.ep] || null;
  const { watched, setEpisode } = useAcademyProgress();
  const videoRef = useRef(null);
  const done = watched.has(episode.ep);
  const contentLang = academyContentLocale(locale);
  const langProps = contentLang !== locale ? { lang: contentLang } : {};
  const markWatched = useCallback(() => setEpisode(episode.ep, true), [episode.ep, setEpisode]);
  const seek = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    try { video.currentTime = seconds; } catch { /* metadata not loaded yet */ }
    video.play?.().catch(() => {});
    video.scrollIntoView?.({ block: "center", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);
  const hubHref = hrefFor("/academy", locale, market);

  return <main className="nxa nxa--episode" id="top" dir={dirOf(locale)}>
    <div className="v2-shell">
      <nav className="nxa-crumbs" aria-label="Breadcrumb">
        <a href={localizedHref("/", { locale })}>{t.home}</a><span aria-hidden="true">/</span>
        <a href={hubHref}>{t.brand}</a><span aria-hidden="true">/</span>
        <span aria-current="page">E{pad(episode.ep)}</span>
      </nav>
      <div className="nxa-ep">
        <div className="nxa-ep__main">
          <header className="nxa-ep__head">
            <p className="nxa-overline"><span>{t.season}</span><span aria-hidden="true">·</span><span>{fill(t.episodeLabel, { n: episode.ep })}</span><span aria-hidden="true">·</span><bdi dir="ltr">{clockDuration(episode.duration)}</bdi></p>
            <h1 className="nxa-ep__title" {...langProps}>{lesson.title}</h1>
          </header>
          <Player episode={episode} locale={locale} t={t} onProgress={markWatched} videoRef={videoRef} />
          <div className="nxa-ep__bar">
            <p className="nxa-goal" {...langProps}><b>{t.goal}</b> {lesson.goal}</p>
            <button type="button" className="nxa-watch" aria-pressed={done} onClick={() => setEpisode(episode.ep, !done)} data-watched={done ? "true" : undefined}>
              <Check />{done ? t.watched : t.markWatched}
            </button>
          </div>
          <NextStep episode={episode} locale={locale} market={market} t={t} />

          <section className="nxa-sec" aria-labelledby="nxa-takeaways">
            <h2 id="nxa-takeaways">{t.takeaways}</h2>
            <ol className="nxa-takeaways" {...langProps}>
              {lesson.takeaways.map((item, index) => <li key={index}><span className="nxa-takeaways__n" aria-hidden="true">{pad(index + 1)}</span><p>{item}</p></li>)}
            </ol>
          </section>

          <section className="nxa-sec" aria-labelledby="nxa-check" {...langProps}>
            <h2 id="nxa-check">{t.check}</h2>
            <QuickCheck quiz={lesson.quiz} t={t} />
            <div className="nxa-exercise">
              <p className="nxa-exercise__label">{t.exercise}</p>
              <p className="nxa-exercise__task">{lesson.task}</p>
              <details className="nxa-exercise__answer">
                <summary>{t.showAnswer}</summary>
                <p>{lesson.answer}</p>
              </details>
            </div>
          </section>

          <section className="nxa-sec" aria-labelledby="nxa-transcript">
            <h2 id="nxa-transcript">{t.transcript}</h2>
            <div {...langProps}><Transcript rows={lesson.transcript} t={t} onSeek={seek} locale={locale} market={market} glossaryLinks={contentLang === locale ? glossaryLinks : null} /></div>
          </section>

          <nav className="nxa-pager" aria-label={t.allLessons}>
            {prev ? <a className="nxa-pager__link nxa-pager__link--prev" href={hrefFor(academyEpisodePath(prev), locale, market)}>
              <span className="nxa-pager__dir">{t.prev}</span><span className="nxa-pager__title" {...langProps}>E{pad(prev.ep)} · {lessons[prev.ep - 1].title}</span>
            </a> : <a className="nxa-pager__link nxa-pager__link--prev" href={hubHref}><span className="nxa-pager__dir">{t.allLessons}</span><span className="nxa-pager__title">{t.series}</span></a>}
            {next ? <a className="nxa-pager__link nxa-pager__link--next" href={hrefFor(academyEpisodePath(next), locale, market)}>
              <span className="nxa-pager__dir">{t.next}</span><span className="nxa-pager__title" {...langProps}>E{pad(next.ep)} · {lessons[next.ep - 1].title}</span>
            </a> : <a className="nxa-pager__link nxa-pager__link--next" href={hubHref}><span className="nxa-pager__dir">{t.allLessons}</span><span className="nxa-pager__title">{t.finaleLead}</span></a>}
          </nav>
        </div>
        <aside className="nxa-ep__side">
          {next ? <a className="nxa-upnext" href={hrefFor(academyEpisodePath(next), locale, market)}>
            <Poster episode={next} />
            <span className="nxa-upnext__text"><span className="nxa-upnext__label">{t.next}</span><span className="nxa-upnext__title" {...langProps}>{lessons[next.ep - 1].title}</span></span>
          </a> : null}
          <LessonList current={episode} lessons={lessons} watched={watched} locale={locale} market={market} t={t} />
        </aside>
      </div>
    </div>
  </main>;
}

export default AcademyHubPage;
