// Episode times are seconds, local to each shot. No wall clock or randomness.
export const locales = {
  en: { series: "Sam's First Crypto Lesson", slogan: 'Understand first, then act.', demo: 'Teaching illustration · fictional data', warning: 'STOP · check first', next: 'NEXT LESSON', practice: 'Practice on NexuAlpha', ep: 'EP' },
  'zh-Hans': { series: '《小白的加密第一课》', slogan: '先看懂，再动手。', demo: '教学示意 · 虚构数据', warning: '暂停 · 先核对', next: '下一课', practice: '在 NexuAlpha 练习', ep: '第' }
};
export const antennas = { blue: '#4f7cff', green: '#3ddc97', amber: '#f8bb6a', red: '#ff5c5c' };
export const localized = (value, locale) => typeof value === 'string' ? value : value?.[locale];
const fail = (text) => { throw new Error(text); };
const finite = (n) => typeof n === 'number' && Number.isFinite(n);
export function validateEpisode(e, locale = 'en') {
  if (!locales[locale]) fail(`Unsupported locale: ${locale}; supply reviewed UI strings first`);
  if (e.direction !== undefined && !['ltr','rtl'].includes(e.direction)) fail('direction must be ltr or rtl');
  if (e.version !== 1 || !Number.isInteger(e.episode) || e.episode < 1 || e.episode > 24) fail('version=1 and episode 1..24 required');
  if (!localized(e.title, locale)?.trim()) fail(`Missing ${locale} title`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.slug)) fail('Invalid starter slug');
  if (!Array.isArray(e.shots) || !e.shots.length || e.shots[0].duration !== 6) fail('First problem shot must last 6 seconds');
  if(e.production_id !== undefined && !/^E(?:0[1-9]|1[0-9]|2[0-4])$/.test(e.production_id)) fail('Invalid production_id');
  const ids = new Set();
  for (const s of e.shots) {
    if (!/^[a-z][a-z0-9-]*$/.test(s.id) || ids.has(s.id)) fail('Unique CSS-safe shot id required');
    ids.add(s.id);
    if (!finite(s.duration) || s.duration < 1 || Math.abs(s.duration * 30 - Math.round(s.duration * 30)) > 1e-6) fail(`Invalid frame-aligned duration: ${s.id}`);
    if (!['study-desk', 'trading-desk', 'transfer-station'].includes(s.set)) fail(`Unknown set: ${s.set}`);
    if (!Object.hasOwn(antennas, s.antenna)) fail(`Unknown antenna: ${s.antenna}`);
    if (typeof s.visual_en !== 'string' || !s.visual_en.trim()) fail('visual_en storyboard description required');
    if (!localized(s[`onscreen_text_${locale}`] ?? s.onscreen_text, locale)?.trim()) fail(`Missing on-screen text: ${s.id}/${locale}`);
    if(s.framing !== undefined && !['wide','close-up','detail'].includes(s.framing)) fail('Invalid framing');
    if(s.focus !== undefined && !['sam','nexubo'].includes(s.focus)) fail('Invalid focus');
    let previous = 0;
    for (const l of s.lines ?? []) {
      if (!['nexubo', 'sam', 'narrator'].includes(l.speaker)) fail('Unknown line speaker');
      if (!finite(l.start) || !finite(l.end) || l.start < previous || l.end <= l.start || l.end > s.duration) fail(`Invalid/overlapping line timing: ${s.id}`);
      previous = l.end;
      const text = localized(l.text, locale);
      if (!text?.trim()) fail(`Missing line text: ${s.id}/${locale}`);
      let wordEnd = l.start;
      for (const w of l.words?.[locale] ?? (Array.isArray(l.words) ? l.words : [])) {
        if (!w.text?.trim() || !finite(w.start) || !finite(w.end) || w.start < wordEnd || w.end <= w.start || w.start < l.start || w.end > l.end) fail(`Invalid word timing: ${s.id}`);
        wordEnd = w.end;
      }
      const words = l.words?.[locale] ?? (Array.isArray(l.words) ? l.words : []);
      if (words.length && words.map(w => w.text).join('').replace(/\s/g, '') !== text.replace(/\s/g, '')) fail(`Words must preserve complete line: ${s.id}`);
    }
  }
  const hook = e.end_hook;
  if (!hook || !localized(hook.text, locale)?.trim() || !finite(hook.duration) || hook.duration < 3 || hook.duration > 5) fail('end_hook requires text and 3..5 second duration');
  const close = e.close_duration ?? 4;
  if (!finite(close) || close < 4 || close > 6) fail('Close duration must be 4..6 seconds');
  for (const d of [hook.duration, close, e.conversion_card?.duration ?? 5]) if (Math.abs(d * 30 - Math.round(d * 30)) > 1e-6) fail('Card durations must align to 30fps');
  if (e.conversion_card) {
    const c = e.conversion_card;
    if (!finite(c.duration) || c.duration < 4 || c.duration > 10 || !localized(c.disclosure, locale)?.trim()) fail('Conversion requires 4..10s duration and same-card disclosure');
    for (const key of ['partner_name', 'code', 'rebate_line']) if (c[key] !== undefined && !localized(c[key], locale)?.trim()) fail(`Missing localized conversion ${key}`);
    if ((c.code || c.rebate_line) && !c.partner_name) fail('Commercial fields require supplied partner name');
  }
  for(const [label, lines, duration] of [
    ['open',e.open_lines,3],['hook',hook.lines,hook.duration],
    ['close',e.close_lines,close],['conversion',e.conversion_card?.lines,e.conversion_card?.duration]
  ]) {
    let previous=0;
    for(const l of lines ?? []) {
      if(!['sam','nexubo','narrator'].includes(l.speaker) || !localized(l.text,locale)?.trim() || !finite(l.start) || !finite(l.end) || l.start<previous || l.end<=l.start || l.end>duration) fail(`Invalid ${label} line timing/copy`);
      previous=l.end;
    }
  }
  return e;
}
export function captionGroups(line, locale, limit) {
  let words = line.words?.[locale] ?? (Array.isArray(line.words) ? line.words : undefined);
  const estimated = !words?.length;
  if (estimated) {
    const segments = [...new Intl.Segmenter(locale, { granularity: 'word' }).segment(localized(line.text, locale))].map(x => x.segment);
    const weight = segments.reduce((n, x) => n + [...x].length, 0);
    let t = line.start;
    words = segments.map((text, i) => {
      const start = t;
      t = i === segments.length - 1 ? line.end : t + (line.end - line.start) * [...text].length / weight;
      return { text, start, end: t };
    });
  }
  const groups = [];
  let group = [], length = 0;
  for (const word of words) {
    if ([...word.text].length > limit) fail('Caption token exceeds line budget; split its timing token');
    if (group.length && length + [...word.text].length > limit) { groups.push(group); group = []; length = 0; }
    group.push(word); length += [...word.text].length;
  }
  if (group.length) groups.push(group);
  return { groups, estimated };
}
export function schedule(e) {
  let cursor = 0;
  const scenes = [];
  const add = (kind, duration, data) => { scenes.push({ kind, start: cursor, duration, ...data }); cursor += duration; };
  e.shots.forEach((shot, i) => {
    add('shot', shot.duration, { shot });
    if (i === 0) add('open', 3, { lines: e.open_lines ?? [], visual_en: e.open_visual_en, antenna: 'blue' });
  });
  if (e.conversion_card) add('conversion', e.conversion_card.duration, { lines: e.conversion_card.lines ?? [], visual_en: e.conversion_card.visual_en, antenna: 'green' });
  add('hook', e.end_hook.duration, { lines: e.end_hook.lines ?? [], visual_en: e.end_hook.visual_en, antenna: 'amber' });
  add('close', e.close_duration ?? 4, { lines: e.close_lines ?? [], visual_en: e.close_visual_en, antenna: 'green' });
  return { scenes, duration: cursor };
}
