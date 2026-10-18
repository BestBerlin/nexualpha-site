// Article editions share the existing channel-feed scheduler and state directory.
import { T, ARTICLE_LOCALE, LOCALE_PATH } from '../alert-sender/alert-sender.mjs';
import { deliverOnce } from './delivery-receipts.mjs';
export const ARTICLE_INTERVAL_MS = 90 * 60 * 1000;
export const ARTICLE_LANGS = ['zh', 'en', 'ru', 'tr', 'vi'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function articleEdition(article, lang) {
  if (!ARTICLE_LANGS.includes(lang) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article?.slug || '')) return null;
  const locale = ARTICLE_LOCALE[lang];
  if (Array.isArray(article.availableLocales) && !article.availableLocales.includes(locale)) return null;
  const title = article.title?.[locale], summary = article.summary?.[locale];
  if (typeof title !== 'string' || !title.trim() || typeof summary !== 'string' || !summary.trim()) return null;
  if (!Number.isFinite(Date.parse(article.publishedAt))) return null;
  // Never borrow English copy for a non-English channel. Keep exactly one source sentence.
  const sentence = summary.trim().match(/^.*?[.!?。！？](?=\s|$|[^\x00-\x7f])/u)?.[0] || summary.trim();
  return { key: `${article.slug}:${locale}`, title: title.trim().slice(0, 400), summary: sentence.slice(0, 1600),
    publishedAt: Date.parse(article.publishedAt), url: `https://nexualpha.com${LOCALE_PATH[lang]}/news/${article.slug}?src=tg-article-${lang}` };
}

export function articleMessage(edition, lang) {
  return { text: `<b>${esc(edition.title)}</b>\n\n${esc(edition.summary)}\n\n<a href="${esc(edition.url)}">${T(lang).readMore}</a>` };
}

// Persist each successful chat delivery before advancing. A new chat establishes its own baseline.
export async function runArticleFeed({ feed, channels, state, now = Date.now(), send, save, dryRun = false }) {
  if (!Array.isArray(feed?.articles)) throw new Error('invalid article feed: articles array required');
  if (feed.stale === true) throw new Error('article feed stale; waiting for recovery');
  const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
  if (!object(state) || (state.channels !== undefined && !object(state.channels))) throw new Error('corrupt article state');
  for (const channel of Object.values(state.channels || {})) {
    if (!object(channel) || typeof channel.initialized !== 'boolean' || !object(channel.seen) ||
        !(channel.lastPostedAt === null || Number.isFinite(channel.lastPostedAt))) throw new Error('corrupt article channel state');
  }
  const next = structuredClone(state);
  next.channels ||= {};
  const errors = [];
  for (const { lang, chat } of channels) {
    if (!ARTICLE_LANGS.includes(lang) || !chat) continue;
    const editions = feed.articles.map((a) => articleEdition(a, lang)).filter(Boolean).sort((a, b) => b.publishedAt - a.publishedAt || a.key.localeCompare(b.key));
    const key = `${lang}:${chat}`;
    const channel = next.channels[key] ||= { initialized: false, seen: {}, lastPostedAt: null };
    if (!channel.initialized) {
      for (const e of editions) channel.seen[e.key] = 'baseline';
      channel.initialized = true;
      if (!dryRun) await save(next);
      continue;
    }
    if (channel.lastPostedAt !== null && now - channel.lastPostedAt < ARTICLE_INTERVAL_MS) continue;
    const edition = editions.find((e) => !Object.hasOwn(channel.seen, e.key) && e.publishedAt <= now);
    if (!edition) continue;
    try {
      if (dryRun) await send(chat, articleMessage(edition, lang));
      else await deliverOnce({ state: next, key: `article:${edition.key}:${key}`, now,
        deliver: async () => { const result = await send(chat, articleMessage(edition, lang)); return result && typeof result === 'object' ? result : { ok: true }; },
        save: () => save(next) });
      if (!dryRun) {
        channel.seen[edition.key] = new Date(now).toISOString();
        channel.lastPostedAt = now;
        await save(next);
      }
    } catch (e) { errors.push(`${chat}: ${e.message}`); }
  }
  if (errors.length) throw new Error(`article delivery failed: ${errors.join('; ')}`);
  return next;
}
