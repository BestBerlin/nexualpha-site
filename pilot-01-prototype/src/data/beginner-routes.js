// Entry-safe: content stays in the beginner route chunk.
export const BEGINNER_SLUGS = Object.freeze({
  en: ['start', 'questions', 'check'], 'zh-Hans': ['xinshou', 'wenti', 'jiancha'],
  es: ['empezar', 'preguntas', 'comprobar'], 'pt-BR': ['comecar', 'perguntas', 'verificar'],
  id: ['mulai', 'pertanyaan', 'periksa'], tr: ['basla', 'sorular', 'kontrol'],
  ko: ['sijak', 'jilmun', 'hwagin'], ja: ['hajimeru', 'shitsumon', 'kakunin'],
  fr: ['debuter', 'questions', 'verifier'], de: ['starten', 'fragen', 'pruefen'],
  it: ['iniziare', 'domande', 'verifica'], ru: ['nachat', 'voprosy', 'proverka'],
  ar: ['ibda', 'asila', 'tahaqquq'], 'zh-Hant': ['xinshou', 'wenti', 'jiancha'],
  ur: ['shuru', 'sawal', 'jaanch'], uk: ['pochaty', 'pytannia', 'perevirka'],
  vi: ['bat-dau', 'cau-hoi', 'kiem-tra'],
});
export const BEGINNER_LOCALES = Object.freeze(Object.keys(BEGINNER_SLUGS));
export const BEGINNER_ROOTS = Object.freeze([...new Set(Object.values(BEGINNER_SLUGS).flat())].map(s => `/${s}`));
const KINDS = ['start', 'questions', 'check'];
export function beginnerPath(kind = 'start', locale = 'en', step) {
  const slug = (BEGINNER_SLUGS[locale] || BEGINNER_SLUGS.en)[KINDS.indexOf(kind)];
  return `/${slug}${kind === 'start' && step ? `/${step}` : ''}`;
}
export function parseBeginnerPath(pathname, locale) {
  const path = String(pathname || '').replace(/\/+$/, '');
  const [, slug, step, extra] = path.split('/');
  const locales = locale ? [locale] : BEGINNER_LOCALES;
  for (const code of locales) {
    const index = BEGINNER_SLUGS[code]?.indexOf(slug) ?? -1;
    if (index < 0) continue;
    if (extra !== undefined || (step !== undefined && (index !== 0 || !/^[1-7]$/.test(step)))) return { kind: 'missing' };
    return { kind: KINDS[index], step: step ? Number(step) : null };
  }
  return BEGINNER_ROOTS.some(root => path === root || path.startsWith(`${root}/`)) ? { kind: 'missing' } : null;
}
